/**
 * Stock Data Store
 * Manages stock data with automatic background refresh from Polygon.io
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DividendStock } from "../api/comprehensive-stock-data";
import { enhanceAllStocksWithPolygon, loadStocksFromTickers } from "../api/comprehensive-stock-data";
import { TICKERS } from "../data/nanotickers";

interface StockDataState {
  stocks: DividendStock[];
  lastRefreshTime: number | null;
  isRefreshing: boolean;
  refreshProgress: { current: number; total: number; symbol: string };
  autoRefreshEnabled: boolean;
  refreshIntervalHours: number;
  customTickers: string[]; // Store custom ticker list

  // Actions
  setStocks: (stocks: DividendStock[]) => void;
  refreshStocks: () => Promise<void>;
  refreshFromTickers: (tickers: string[]) => Promise<void>;
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (hours: number) => void;
  shouldAutoRefresh: () => boolean;
}

export const useStockDataStore = create<StockDataState>()(
  persist(
    (set, get) => ({
      stocks: [],
      lastRefreshTime: null,
      isRefreshing: false,
      refreshProgress: { current: 0, total: 0, symbol: "" },
      autoRefreshEnabled: true,
      refreshIntervalHours: 24, // Refresh daily by default
      customTickers: [], // Initialize empty

      setStocks: (stocks) => set({ stocks }),

      refreshStocks: async () => {
        const state = get();
        if (state.isRefreshing) {
          console.log("Refresh already in progress");
          return;
        }

        set({ isRefreshing: true });

        try {
          // Parse the default ticker list from nanotickers
          const defaultTickers = TICKERS
            .split("\n")
            .map(line => line.trim())
            .filter(line => line && !line.startsWith("#"));

          // Use custom tickers if available, otherwise use the 11k+ default tickers
          const tickersToUse = state.customTickers.length > 0
            ? state.customTickers
            : defaultTickers;

          console.log(`Refreshing ${tickersToUse.length} tickers from Polygon.io...`);

          const enhancedStocks = await loadStocksFromTickers(
            tickersToUse,
            (current, total, symbol) => {
              set({ refreshProgress: { current, total, symbol } });
            },
            true // Filter to future dates only
          );

          set({
            stocks: enhancedStocks,
            lastRefreshTime: Date.now(),
            isRefreshing: false,
          });

          console.log(`Refresh complete: ${enhancedStocks.length} stocks with future ex-dates`);
        } catch (error) {
          console.error("Failed to refresh stocks:", error);
          set({ isRefreshing: false });
        }
      },

      refreshFromTickers: async (tickers) => {
        const state = get();
        if (state.isRefreshing) {
          console.log("Refresh already in progress");
          return;
        }

        set({ isRefreshing: true });

        try {
          const enhancedStocks = await loadStocksFromTickers(
            tickers,
            (current, total, symbol) => {
              set({ refreshProgress: { current, total, symbol } });
            },
            true // Filter to future dates only
          );

          set({
            stocks: enhancedStocks,
            customTickers: tickers, // Save the custom tickers for future refreshes
            lastRefreshTime: Date.now(),
            isRefreshing: false,
          });

          console.log(`Refresh from tickers complete: ${enhancedStocks.length} stocks with future ex-dates`);
        } catch (error) {
          console.error("Failed to refresh from tickers:", error);
          set({ isRefreshing: false });
        }
      },

      setAutoRefresh: (enabled) => set({ autoRefreshEnabled: enabled }),

      setRefreshInterval: (hours) => set({ refreshIntervalHours: hours }),

      shouldAutoRefresh: () => {
        const state = get();
        if (!state.autoRefreshEnabled || !state.lastRefreshTime) {
          return true; // Should refresh if never refreshed
        }

        const hoursSinceRefresh =
          (Date.now() - state.lastRefreshTime) / (1000 * 60 * 60);

        return hoursSinceRefresh >= state.refreshIntervalHours;
      },
    }),
    {
      name: "stock-data-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist the refreshing state
      partialize: (state) => ({
        stocks: state.stocks,
        lastRefreshTime: state.lastRefreshTime,
        autoRefreshEnabled: state.autoRefreshEnabled,
        refreshIntervalHours: state.refreshIntervalHours,
        customTickers: state.customTickers,
      }),
    }
  )
);
