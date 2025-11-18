/**
 * Portfolio Store
 * Manages selected stocks and investment allocations
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { StockData } from "../api/stock-data";

export interface PortfolioStock extends StockData {
  addedAt: string;
}

interface PortfolioState {
  stocks: PortfolioStock[];
  allocations: Record<string, number>;
  totalInvestment: number;
}

interface PortfolioActions {
  addStock: (stock: StockData) => void;
  removeStock: (symbol: string) => void;
  updateAllocation: (symbol: string, percentage: number) => void;
  setTotalInvestment: (amount: number) => void;
  refreshStock: (stock: StockData) => void;
  clearPortfolio: () => void;
}

type PortfolioStore = PortfolioState & PortfolioActions;

const usePortfolioStore = create<PortfolioStore>()(
  persist(
    (set, get) => ({
      // Initial state
      stocks: [],
      allocations: {},
      totalInvestment: 10000,

      // Actions
      addStock: (stock: StockData) => {
        const { stocks, allocations } = get();

        // Check if stock already exists
        if (stocks.some((s) => s.symbol === stock.symbol)) {
          return;
        }

        const newStock: PortfolioStock = {
          ...stock,
          addedAt: new Date().toISOString(),
        };

        // Calculate equal allocation for all stocks
        const newStockCount = stocks.length + 1;
        const equalAllocation = 100 / newStockCount;

        const newAllocations: Record<string, number> = {};
        stocks.forEach((s) => {
          newAllocations[s.symbol] = equalAllocation;
        });
        newAllocations[stock.symbol] = equalAllocation;

        set({
          stocks: [...stocks, newStock],
          allocations: newAllocations,
        });
      },

      removeStock: (symbol: string) => {
        const { stocks, allocations } = get();
        const filteredStocks = stocks.filter((s) => s.symbol !== symbol);

        // Recalculate allocations for remaining stocks
        const newAllocations: Record<string, number> = {};
        if (filteredStocks.length > 0) {
          const equalAllocation = 100 / filteredStocks.length;
          filteredStocks.forEach((s) => {
            newAllocations[s.symbol] = equalAllocation;
          });
        }

        set({
          stocks: filteredStocks,
          allocations: newAllocations,
        });
      },

      updateAllocation: (symbol: string, percentage: number) => {
        const { allocations } = get();
        set({
          allocations: {
            ...allocations,
            [symbol]: percentage,
          },
        });
      },

      setTotalInvestment: (amount: number) => {
        set({ totalInvestment: amount });
      },

      refreshStock: (stock: StockData) => {
        const { stocks } = get();
        const updatedStocks = stocks.map((s) => {
          if (s.symbol === stock.symbol) {
            return {
              ...stock,
              addedAt: s.addedAt, // Preserve the original addedAt timestamp
            };
          }
          return s;
        });

        set({ stocks: updatedStocks });
      },

      clearPortfolio: () => {
        set({
          stocks: [],
          allocations: {},
          totalInvestment: 10000,
        });
      },
    }),
    {
      name: "portfolio-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default usePortfolioStore;
