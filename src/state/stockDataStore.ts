/**
 * Stock Data Store
 * Manages stock data with automatic background refresh from Polygon.io
 * Includes WebSocket integration for real-time price updates
 * Implements chunked loading to prevent crashes with large ticker lists
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DividendStock } from "../api/comprehensive-stock-data";
import { loadStocksFromTickers, loadStocksInTwoPhases } from "../api/comprehensive-stock-data";
import { loadFutureStocksFromCSV } from "../api/csv-dividend-loader";
import { TICKERS } from "../data/nanotickers";
import { getWebSocketService } from "../services/polygonWebSocketService";

interface StockDataState {
  stocks: DividendStock[];
  lastRefreshTime: number | null;
  lastDividendRefreshTime: number | null; // Track dividend data refresh separately
  lastWebSocketUpdate: number | null; // Track last WebSocket price update
  isRefreshing: boolean;
  refreshProgress: { current: number; total: number; symbol: string; phase?: string };
  autoRefreshEnabled: boolean;
  refreshIntervalHours: number;
  customTickers: string[]; // Store custom ticker list
  websocketConnected: boolean;
  websocketEnabled: boolean;
  useCSVData: boolean; // Toggle between CSV and API data

  // Actions
  setStocks: (stocks: DividendStock[]) => void;
  updateStockPrice: (symbol: string, priceUpdate: Partial<DividendStock>) => void;
  refreshStocks: (chunked?: boolean) => Promise<void>;
  refreshFromTickers: (tickers: string[], chunked?: boolean) => Promise<void>;
  refreshFromCSV: (enrichWithPrices?: boolean) => Promise<void>;
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (hours: number) => void;
  setUseCSVData: (enabled: boolean) => void;
  shouldAutoRefresh: () => boolean;
  shouldRefreshDividendData: () => boolean;
  enableWebSocket: () => void;
  disableWebSocket: () => void;
  subscribeToWebSocket: (symbols: string[]) => void;
}

// No chunking - just use background loading with minimal progress updates

export const useStockDataStore = create<StockDataState>()(
  persist(
    (set, get) => ({
      stocks: [],
      lastRefreshTime: null,
      lastDividendRefreshTime: null,
      lastWebSocketUpdate: null,
      isRefreshing: false,
      refreshProgress: { current: 0, total: 0, symbol: "" },
      autoRefreshEnabled: true,
      refreshIntervalHours: 24, // Refresh daily by default
      customTickers: [], // Initialize empty
      websocketConnected: false,
      websocketEnabled: false, // Disabled by default due to auth issues
      useCSVData: true, // Always use CSV as primary dividend data source

      setStocks: (stocks) => set({ stocks }),

      updateStockPrice: (symbol, priceUpdate) => {
        const state = get();
        const updatedStocks = state.stocks.map((stock) => {
          if (stock.symbol === symbol) {
            return {
              ...stock,
              ...priceUpdate,
              // Update price-dependent fields
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

      refreshStocks: async (chunked = true) => {
        const state = get();
        if (state.isRefreshing) {
          console.log("Refresh already in progress");
          return;
        }

        set({ isRefreshing: true, refreshProgress: { current: 0, total: 0, symbol: "", phase: "Phase 1" } });

        try {
          // Parse the default ticker list from nanotickers
          const defaultTickers = TICKERS.split("\n")
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith("#"));

          // Use custom tickers if available, otherwise use the 11k+ default tickers
          const tickersToUse =
            state.customTickers.length > 0 ? state.customTickers : defaultTickers;

          console.log(`Using TWO-PHASE loading for ${tickersToUse.length} tickers...`);

          // Use two-phase loading: Phase 1 (dividend data only), Phase 2 (full data for filtered stocks)
          const enhancedStocks = await loadStocksInTwoPhases(
            tickersToUse,
            // Phase 1 progress (dividend data only)
            (current: number, total: number, symbol: string) => {
              set({ refreshProgress: { current, total, symbol, phase: "Phase 1: Dividend Data" } });
            },
            // Phase 2 progress (full data for filtered stocks)
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

          // Subscribe to WebSocket if enabled
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

      refreshFromTickers: async (tickers, chunked = true) => {
        const state = get();
        if (state.isRefreshing) {
          console.log("Refresh already in progress");
          return;
        }

        set({ isRefreshing: true, refreshProgress: { current: 0, total: 0, symbol: "" } });

        try {
          console.log(`Refreshing ${tickers.length} tickers from Polygon.io in background...`);

          // Load all tickers without chunking (progress updates happen every 100 tickers internally)
          const enhancedStocks = await loadStocksFromTickers(
            tickers,
            (current: number, total: number, symbol: string) => {
              set({ refreshProgress: { current, total, symbol } });
            },
            true // Filter to future dates only
          );

          set({
            stocks: enhancedStocks,
            customTickers: tickers, // Save the custom tickers for future refreshes
            lastRefreshTime: Date.now(),
            lastDividendRefreshTime: Date.now(),
            isRefreshing: false,
          });

          console.log(`Refresh from tickers complete: ${enhancedStocks.length} stocks with future ex-dates`);

          // Subscribe to WebSocket if enabled
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

      refreshFromCSV: async (enrichWithPrices = true) => {
        const state = get();
        if (state.isRefreshing) {
          console.log("Refresh already in progress");
          return;
        }

        set({ isRefreshing: true, refreshProgress: { current: 0, total: 0, symbol: "" } });

        try {
          console.log(`Loading stocks from CSV with live price enrichment...`);

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

          // Subscribe to WebSocket if enabled
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

      shouldAutoRefresh: () => {
        const state = get();
        if (!state.autoRefreshEnabled) {
          return false; // Don't refresh if disabled
        }

        if (!state.lastRefreshTime) {
          return true; // Should refresh if never refreshed (initial load)
        }

        // If we have stocks loaded, don't auto-refresh on restart
        if (state.stocks.length > 0) {
          const hoursSinceRefresh = (Date.now() - state.lastRefreshTime) / (1000 * 60 * 60);
          // Only auto-refresh if more than 24 hours have passed
          return hoursSinceRefresh >= state.refreshIntervalHours;
        }

        // No stocks and never refreshed - should load
        return true;
      },

      shouldRefreshDividendData: () => {
        const state = get();
        if (!state.lastDividendRefreshTime) {
          return true; // Should refresh if never refreshed
        }

        // Check if it has been more than 24 hours (dividend data only changes daily)
        const hoursSinceRefresh = (Date.now() - state.lastDividendRefreshTime) / (1000 * 60 * 60);

        return hoursSinceRefresh >= 24;
      },

      enableWebSocket: () => {
        set({ websocketEnabled: true });
        const state = get();

        // Connect and subscribe if we have stocks
        if (state.stocks.length > 0) {
          const ws = getWebSocketService();
          ws.connect();

          // Subscribe to all current stocks
          const symbols = state.stocks.map((s) => s.symbol);
          ws.subscribe(symbols);

          // Set up message handler
          ws.onMessage((message: any) => {
            if (message.ev === "AM" || message.ev === "A") {
              // Aggregate message (price update)
              const { updateStockPrice } = get();
              updateStockPrice(message.sym, {
                price: message.c,
                change: message.c - message.o,
                changePercent: ((message.c - message.o) / message.o) * 100,
                priceData: {
                  current: message.c,
                  dayHigh: message.h,
                  dayLow: message.l,
                  change: message.c - message.o,
                  changePercent: ((message.c - message.o) / message.o) * 100,
                  week52High: 0, // Keep existing value
                  week52Low: 0, // Keep existing value
                },
                volume: {
                  current: message.v / 1000000, // Convert to millions
                  average: 0, // Keep existing value
                },
              });
            }
          });

          // Track connection state
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

        // Connect if not already connected
        if (!ws.isConnected()) {
          ws.connect();

          // Set up handlers if not already set
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
                    current: message.v / 1000000, // Convert to millions
                  },
                });
              }
            }
          });

          ws.onDisconnect(() => {
            set({ websocketConnected: false });
          });
        } else {
          // Already connected, just subscribe
          ws.subscribe(symbols);
        }
      },
    }),
    {
      name: "stock-data-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist the refreshing state and websocket connected state
      partialize: (state) => ({
        stocks: state.stocks,
        lastRefreshTime: state.lastRefreshTime,
        lastDividendRefreshTime: state.lastDividendRefreshTime,
        lastWebSocketUpdate: state.lastWebSocketUpdate,
        autoRefreshEnabled: state.autoRefreshEnabled,
        refreshIntervalHours: state.refreshIntervalHours,
        customTickers: state.customTickers,
        websocketEnabled: state.websocketEnabled,
        useCSVData: state.useCSVData,
      }),
    }
  )
);
