/**
 * Stock Data Store
 *
 * NEW ARCHITECTURE:
 * - Master dataset: Static data (company info, dividends) saved to file, refreshed daily
 * - Live prices: Fetched from Polygon API for real-time/15-min delayed data
 * - All data keyed by symbol - joins NEVER done by array index
 *
 * Flow:
 * 1. App startup: Load master dataset from file (instant)
 * 2. If master dataset >24h old: Rebuild in background
 * 3. For price data: Fetch from Polygon API directly
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DividendStock } from "../api/comprehensive-stock-data";
import { loadStocksFromTickers, loadStocksInTwoPhases } from "../api/comprehensive-stock-data";
import { loadFutureStocksFromCSV } from "../api/csv-dividend-loader";
import { TICKERS } from "../data/nanotickers";
import { getWebSocketService } from "../services/polygonWebSocketService";
import {
  type MasterDatasetMap,
  type StaticStockData,
  loadMasterDataset,
  loadMasterDatasetMetadata,
  mergeStaticAndLiveData,
  batchMergeStaticAndLiveData,
} from "../api/master-dataset-service";
import {
  ensureMasterDataset,
  buildMasterDatasetFromCSV,
  enrichMasterDataset,
} from "../api/daily-data-fetcher";
import { fetchLiveQuotesBatch, type LivePriceData } from "../api/realtime-price-service";

interface StockDataState {
  stocks: DividendStock[];
  masterDataset: MasterDatasetMap | null; // In-memory cache of master dataset
  lastRefreshTime: number | null;
  lastDividendRefreshTime: number | null;
  lastPriceRefreshTime: number | null; // Track when prices were last fetched
  lastWebSocketUpdate: number | null;
  isRefreshing: boolean;
  isLoadingPrices: boolean; // Separate loading state for price updates
  refreshProgress: { current: number; total: number; symbol: string; phase?: string };
  autoRefreshEnabled: boolean;
  refreshIntervalHours: number;
  customTickers: string[];
  websocketConnected: boolean;
  websocketEnabled: boolean;
  useCSVData: boolean;
  useMasterDataset: boolean; // Toggle new architecture

  // Actions
  setStocks: (stocks: DividendStock[]) => void;
  updateStockPrice: (symbol: string, priceUpdate: Partial<DividendStock>) => void;
  updateStockPriceBySymbol: (symbol: string, liveData: LivePriceData) => void;
  refreshStocks: (chunked?: boolean) => Promise<void>;
  refreshFromTickers: (tickers: string[], chunked?: boolean) => Promise<void>;
  refreshFromCSV: (enrichWithPrices?: boolean) => Promise<void>;
  loadFromMasterDataset: () => Promise<void>;
  refreshPrices: () => Promise<void>;
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (hours: number) => void;
  setUseCSVData: (enabled: boolean) => void;
  setUseMasterDataset: (enabled: boolean) => void;
  shouldAutoRefresh: () => boolean;
  shouldRefreshDividendData: () => boolean;
  shouldRefreshPrices: () => boolean;
  enableWebSocket: () => void;
  disableWebSocket: () => void;
  subscribeToWebSocket: (symbols: string[]) => void;
}

export const useStockDataStore = create<StockDataState>()(
  persist(
    (set, get) => ({
      stocks: [],
      masterDataset: null,
      lastRefreshTime: null,
      lastDividendRefreshTime: null,
      lastPriceRefreshTime: null,
      lastWebSocketUpdate: null,
      isRefreshing: false,
      isLoadingPrices: false,
      refreshProgress: { current: 0, total: 0, symbol: "" },
      autoRefreshEnabled: true,
      refreshIntervalHours: 24,
      customTickers: [],
      websocketConnected: false,
      websocketEnabled: false,
      useCSVData: true,
      useMasterDataset: true, // Enable new architecture by default

      setStocks: (stocks) => set({ stocks }),

      /**
       * Update stock price by symbol (legacy method)
       */
      updateStockPrice: (symbol, priceUpdate) => {
        const state = get();
        const updatedStocks = state.stocks.map((stock) => {
          if (stock.symbol === symbol) {
            return {
              ...stock,
              ...priceUpdate,
              priceData: priceUpdate.priceData
                ? { ...stock.priceData, ...priceUpdate.priceData }
                : stock.priceData,
              volume: priceUpdate.volume
                ? { ...stock.volume, ...priceUpdate.volume }
                : stock.volume,
            };
          }
          return stock;
        });
        set({ stocks: updatedStocks, lastWebSocketUpdate: Date.now() });
      },

      /**
       * Update stock price using live data and master dataset
       * KEY: Always joins on symbol, never by index
       */
      updateStockPriceBySymbol: (symbol, liveData) => {
        const state = get();
        const upperSymbol = symbol.toUpperCase();

        // Find stock by symbol (O(n) but only for single update)
        const stockIndex = state.stocks.findIndex(s => s.symbol === upperSymbol);
        if (stockIndex === -1) return;

        const stock = state.stocks[stockIndex];

        // Calculate derived values
        const change = liveData.price - liveData.previousClose;
        const changePercent = liveData.previousClose > 0
          ? (change / liveData.previousClose) * 100
          : 0;

        // Recalculate dividend yield with new price
        const dividendYield = liveData.price > 0
          ? (stock.annualDividend / liveData.price) * 100
          : stock.dividendYield;

        const updatedStock: DividendStock = {
          ...stock,
          price: liveData.price,
          dividendYield,
          change,
          changePercent,
          priceData: {
            ...stock.priceData,
            current: liveData.price,
            open: liveData.open,
            dayHigh: liveData.high,
            dayLow: liveData.low,
            change,
            changePercent,
          },
          volume: {
            ...stock.volume,
            current: liveData.volume / 1000000,
          },
        };

        // Update stocks array immutably
        const updatedStocks = [...state.stocks];
        updatedStocks[stockIndex] = updatedStock;

        set({ stocks: updatedStocks, lastPriceRefreshTime: Date.now() });
      },

      /**
       * Load stocks from master dataset (new architecture)
       * Step 1: Load static data from file
       * Step 2: Optionally fetch live prices
       */
      loadFromMasterDataset: async () => {
        const state = get();
        if (state.isRefreshing) {
          console.log("[Store] Refresh already in progress");
          return;
        }

        set({
          isRefreshing: true,
          refreshProgress: { current: 0, total: 1, symbol: "", phase: "Loading master dataset..." },
        });

        try {
          // Ensure master dataset exists and is up to date
          const masterData = await ensureMasterDataset(
            (current, total, symbol, phase) => {
              set({ refreshProgress: { current, total, symbol, phase } });
            }
          );

          if (!masterData || masterData.size === 0) {
            console.warn("[Store] No master dataset available, falling back to CSV");
            await get().refreshFromCSV(false);
            return;
          }

          // Store master dataset in memory
          set({ masterDataset: masterData });

          // Convert static data to DividendStock with placeholder prices
          const symbols = Array.from(masterData.keys());
          const stocks: DividendStock[] = [];

          for (const symbol of symbols) {
            const staticData = masterData.get(symbol)!;
            // Create stock with placeholder price data
            const stock = mergeStaticAndLiveData(staticData, {
              price: 0,
              open: 0,
              high: 0,
              low: 0,
              volume: 0,
              previousClose: 0,
            });
            stocks.push(stock);
          }

          set({
            stocks,
            lastRefreshTime: Date.now(),
            lastDividendRefreshTime: Date.now(),
            isRefreshing: false,
            refreshProgress: { current: 0, total: 0, symbol: "", phase: "" },
          });

          console.log(`[Store] Loaded ${stocks.length} stocks from master dataset`);

          // Fetch live prices in background
          get().refreshPrices();

        } catch (error) {
          console.error("[Store] Failed to load from master dataset:", error);
          set({ isRefreshing: false });
        }
      },

      /**
       * Refresh only price data (fast, for intra-day updates)
       * Uses symbol-based lookup to merge with existing data
       */
      refreshPrices: async () => {
        const state = get();
        if (state.isLoadingPrices) {
          console.log("[Store] Price refresh already in progress");
          return;
        }

        if (state.stocks.length === 0) {
          console.log("[Store] No stocks to refresh prices for");
          return;
        }

        set({ isLoadingPrices: true });

        try {
          const symbols = state.stocks.map(s => s.symbol);
          console.log(`[Store] Fetching live prices for ${symbols.length} stocks...`);

          const liveQuotes = await fetchLiveQuotesBatch(
            symbols,
            (current, total, symbol) => {
              set({ refreshProgress: { current, total, symbol, phase: "Fetching prices..." } });
            }
          );

          // Update stocks with live prices using symbol-based lookup
          const { masterDataset, stocks } = get();

          if (masterDataset) {
            // Use master dataset for proper merging
            const liveDataArray = Array.from(liveQuotes.values()).map(quote => ({
              symbol: quote.symbol,
              price: quote.price,
              open: quote.open,
              high: quote.high,
              low: quote.low,
              volume: quote.volume,
              previousClose: quote.previousClose,
            }));

            const updatedStocks = batchMergeStaticAndLiveData(masterDataset, liveDataArray);

            // Also include stocks that didn't get price updates (keep existing data)
            const updatedSymbols = new Set(updatedStocks.map(s => s.symbol));
            const unchangedStocks = stocks.filter(s => !updatedSymbols.has(s.symbol));

            set({
              stocks: [...updatedStocks, ...unchangedStocks],
              lastPriceRefreshTime: Date.now(),
              isLoadingPrices: false,
              refreshProgress: { current: 0, total: 0, symbol: "", phase: "" },
            });
          } else {
            // Fallback: Update stocks directly
            const updatedStocks = stocks.map(stock => {
              const liveData = liveQuotes.get(stock.symbol);
              if (!liveData) return stock;

              const change = liveData.price - liveData.previousClose;
              const changePercent = liveData.previousClose > 0
                ? (change / liveData.previousClose) * 100
                : 0;
              const dividendYield = liveData.price > 0
                ? (stock.annualDividend / liveData.price) * 100
                : stock.dividendYield;

              return {
                ...stock,
                price: liveData.price,
                dividendYield,
                change,
                changePercent,
                priceData: {
                  ...stock.priceData,
                  current: liveData.price,
                  open: liveData.open,
                  dayHigh: liveData.high,
                  dayLow: liveData.low,
                  change,
                  changePercent,
                },
                volume: {
                  ...stock.volume,
                  current: liveData.volume / 1000000,
                },
              };
            });

            set({
              stocks: updatedStocks,
              lastPriceRefreshTime: Date.now(),
              isLoadingPrices: false,
              refreshProgress: { current: 0, total: 0, symbol: "", phase: "" },
            });
          }

          console.log(`[Store] Updated prices for ${liveQuotes.size} stocks`);

        } catch (error) {
          console.error("[Store] Failed to refresh prices:", error);
          set({ isLoadingPrices: false });
        }
      },

      /**
       * Check if prices should be refreshed (every 15 minutes during market hours)
       */
      shouldRefreshPrices: () => {
        const state = get();
        if (!state.lastPriceRefreshTime) return true;

        const minutesSinceRefresh = (Date.now() - state.lastPriceRefreshTime) / (1000 * 60);
        return minutesSinceRefresh >= 15;
      },

      // ============ Legacy methods (kept for backwards compatibility) ============

      refreshStocks: async (_chunked = true) => {
        const state = get();

        // If using new master dataset architecture, delegate to that
        if (state.useMasterDataset) {
          await get().loadFromMasterDataset();
          return;
        }

        // Legacy two-phase loading
        if (state.isRefreshing) {
          console.log("Refresh already in progress");
          return;
        }

        set({ isRefreshing: true, refreshProgress: { current: 0, total: 0, symbol: "", phase: "Phase 1" } });

        try {
          const defaultTickers = TICKERS.split("\n")
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith("#"));

          const tickersToUse =
            state.customTickers.length > 0 ? state.customTickers : defaultTickers;

          console.log(`Using TWO-PHASE loading for ${tickersToUse.length} tickers...`);

          const enhancedStocks = await loadStocksInTwoPhases(
            tickersToUse,
            (current: number, total: number, symbol: string) => {
              set({ refreshProgress: { current, total, symbol, phase: "Phase 1: Dividend Data" } });
            },
            (current: number, total: number, symbol: string) => {
              set({ refreshProgress: { current, total, symbol, phase: "Phase 2: Price Data" } });
            }
          );

          set({
            stocks: enhancedStocks,
            lastRefreshTime: Date.now(),
            lastDividendRefreshTime: Date.now(),
            isRefreshing: false,
          });

          console.log(`Refresh complete: ${enhancedStocks.length} stocks with future ex-dates`);

          const { websocketEnabled } = get();
          if (websocketEnabled && enhancedStocks.length > 0) {
            const symbols = enhancedStocks.map((s) => s.symbol);
            get().subscribeToWebSocket(symbols);
          }
        } catch (error) {
          console.error("Failed to refresh stocks:", error);
          set({ isRefreshing: false });
        }
      },

      refreshFromTickers: async (tickers, _chunked = true) => {
        const state = get();
        if (state.isRefreshing) {
          console.log("Refresh already in progress");
          return;
        }

        set({ isRefreshing: true, refreshProgress: { current: 0, total: 0, symbol: "" } });

        try {
          console.log(`Refreshing ${tickers.length} tickers from Polygon.io in background...`);

          const enhancedStocks = await loadStocksFromTickers(
            tickers,
            (current: number, total: number, symbol: string) => {
              set({ refreshProgress: { current, total, symbol } });
            },
            true
          );

          set({
            stocks: enhancedStocks,
            customTickers: tickers,
            lastRefreshTime: Date.now(),
            lastDividendRefreshTime: Date.now(),
            isRefreshing: false,
          });

          console.log(`Refresh from tickers complete: ${enhancedStocks.length} stocks with future ex-dates`);

          const { websocketEnabled } = get();
          if (websocketEnabled && enhancedStocks.length > 0) {
            const symbols = enhancedStocks.map((s) => s.symbol);
            get().subscribeToWebSocket(symbols);
          }
        } catch (error) {
          console.error("Failed to refresh from tickers:", error);
          set({ isRefreshing: false });
        }
      },

      refreshFromCSV: async (enrichWithPrices = false) => {
        const state = get();
        if (state.isRefreshing) {
          console.log("Refresh already in progress");
          return;
        }

        set({ isRefreshing: true, refreshProgress: { current: 0, total: 0, symbol: "" } });

        try {
          const mode = enrichWithPrices ? "with live price enrichment" : "(instant, CSV only)";
          console.log(`Loading stocks from CSV ${mode}...`);

          const stocks = await loadFutureStocksFromCSV(
            enrichWithPrices,
            (current: number, total: number, symbol: string) => {
              set({ refreshProgress: { current, total, symbol } });
            }
          );

          set({
            stocks,
            lastRefreshTime: Date.now(),
            lastDividendRefreshTime: Date.now(),
            isRefreshing: false,
          });

          console.log(`CSV refresh complete: ${stocks.length} stocks with future ex-dates`);

          const { websocketEnabled } = get();
          if (websocketEnabled && stocks.length > 0) {
            const symbols = stocks.map((s) => s.symbol);
            get().subscribeToWebSocket(symbols);
          }
        } catch (error) {
          console.error("Failed to refresh from CSV:", error);
          set({ isRefreshing: false });
        }
      },

      setAutoRefresh: (enabled) => set({ autoRefreshEnabled: enabled }),

      setRefreshInterval: (hours) => set({ refreshIntervalHours: hours }),

      setUseCSVData: (enabled) => set({ useCSVData: enabled }),

      setUseMasterDataset: (enabled) => set({ useMasterDataset: enabled }),

      shouldAutoRefresh: () => {
        const state = get();
        if (!state.autoRefreshEnabled) {
          return false;
        }

        if (!state.lastRefreshTime) {
          return true;
        }

        if (state.stocks.length > 0) {
          const hoursSinceRefresh = (Date.now() - state.lastRefreshTime) / (1000 * 60 * 60);
          return hoursSinceRefresh >= state.refreshIntervalHours;
        }

        return true;
      },

      shouldRefreshDividendData: () => {
        const state = get();
        if (!state.lastDividendRefreshTime) {
          return true;
        }

        const hoursSinceRefresh = (Date.now() - state.lastDividendRefreshTime) / (1000 * 60 * 60);
        return hoursSinceRefresh >= 24;
      },

      enableWebSocket: () => {
        set({ websocketEnabled: true });
        const state = get();

        if (state.stocks.length > 0) {
          const ws = getWebSocketService();
          ws.connect();

          const symbols = state.stocks.map((s) => s.symbol);
          ws.subscribe(symbols);

          ws.onMessage((message: any) => {
            if (message.ev === "AM" || message.ev === "A") {
              const { updateStockPrice } = get();
              updateStockPrice(message.sym, {
                price: message.c,
                change: message.c - message.o,
                changePercent: ((message.c - message.o) / message.o) * 100,
                priceData: {
                  current: message.c,
                  open: message.o,
                  previousClose: message.c - (message.c - message.o),
                  dayHigh: message.h,
                  dayLow: message.l,
                  change: message.c - message.o,
                  changePercent: ((message.c - message.o) / message.o) * 100,
                  week52High: 0,
                  week52Low: 0,
                },
                volume: {
                  current: message.v / 1000000,
                  average: 0,
                },
              });
            }
          });

          ws.onConnect(() => {
            set({ websocketConnected: true });
            console.log("[Store] WebSocket connected");
          });

          ws.onDisconnect(() => {
            set({ websocketConnected: false });
            console.log("[Store] WebSocket disconnected");
          });
        }
      },

      disableWebSocket: () => {
        set({ websocketEnabled: false, websocketConnected: false });
        const ws = getWebSocketService();
        ws.disconnect();
      },

      subscribeToWebSocket: (symbols) => {
        const state = get();
        if (!state.websocketEnabled) {
          return;
        }

        const ws = getWebSocketService();

        if (!ws.isConnected()) {
          ws.connect();

          ws.onConnect(() => {
            set({ websocketConnected: true });
            console.log("[Store] WebSocket connected, subscribing to symbols...");
            ws.subscribe(symbols);
          });

          ws.onMessage((message: any) => {
            if (message.ev === "AM" || message.ev === "A") {
              const { updateStockPrice, stocks } = get();
              const stock = stocks.find((s) => s.symbol === message.sym);

              if (stock) {
                updateStockPrice(message.sym, {
                  price: message.c,
                  change: message.c - message.o,
                  changePercent: ((message.c - message.o) / message.o) * 100,
                  priceData: {
                    ...stock.priceData,
                    current: message.c,
                    dayHigh: Math.max(stock.priceData.dayHigh, message.h),
                    dayLow: Math.min(stock.priceData.dayLow, message.l),
                    change: message.c - message.o,
                    changePercent: ((message.c - message.o) / message.o) * 100,
                  },
                  volume: {
                    ...stock.volume,
                    current: message.v / 1000000,
                  },
                });
              }
            }
          });

          ws.onDisconnect(() => {
            set({ websocketConnected: false });
          });
        } else {
          ws.subscribe(symbols);
        }
      },
    }),
    {
      name: "stock-data-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        stocks: state.stocks,
        lastRefreshTime: state.lastRefreshTime,
        lastDividendRefreshTime: state.lastDividendRefreshTime,
        lastPriceRefreshTime: state.lastPriceRefreshTime,
        lastWebSocketUpdate: state.lastWebSocketUpdate,
        autoRefreshEnabled: state.autoRefreshEnabled,
        refreshIntervalHours: state.refreshIntervalHours,
        customTickers: state.customTickers,
        websocketEnabled: state.websocketEnabled,
        useCSVData: state.useCSVData,
        useMasterDataset: state.useMasterDataset,
        // Note: masterDataset is NOT persisted - loaded from file on startup
      }),
    }
  )
);
