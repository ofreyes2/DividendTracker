/**
 * Portfolio Store
 * Manages user's portfolio, transactions, and dividend tracking
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DividendStock } from "../api/comprehensive-stock-data";

export interface Transaction {
  id: string;
  symbol: string;
  companyName: string;
  purchaseDate: string;
  purchasePrice: number;
  shares: number;
  exDividendDate: string;
  dividendPerShare: number;
  annualDividend: number;
  // Optional: for tracking sales
  soldDate?: string;
  soldPrice?: number;
  realized?: boolean;
}

export interface DividendPayout {
  id: string;
  symbol: string;
  paymentDate: string;
  amount: number;
  shares: number;
  dividendPerShare: number;
}

export interface WatchlistItem {
  symbol: string;
  companyName: string;
  addedDate: string;
}

interface PortfolioState {
  transactions: Transaction[];
  watchlist: WatchlistItem[];
  dividendPayouts: DividendPayout[];
}

interface PortfolioActions {
  // Transaction actions
  addTransaction: (transaction: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  sellPosition: (
    id: string,
    soldDate: string,
    soldPrice: number
  ) => void;

  // Watchlist actions
  addToWatchlist: (symbol: string, companyName: string) => void;
  removeFromWatchlist: (symbol: string) => void;

  // Dividend tracking
  addDividendPayout: (payout: Omit<DividendPayout, "id">) => void;
  getDividendsForDateRange: (startDate: string, endDate: string) => DividendPayout[];
  getWeeklyDividends: () => { week: string; total: number; payouts: DividendPayout[] }[];
  getMonthlyDividends: () => { month: string; total: number; payouts: DividendPayout[] }[];

  // Portfolio analytics
  getTotalInvested: () => number;
  getTotalDividendIncome: () => number;
  getActivePositions: () => Transaction[];
  getClosedPositions: () => Transaction[];
  getUpcomingDividends: (days?: number) => DividendPayout[];
}

type PortfolioStore = PortfolioState & PortfolioActions;

export const usePortfolioStore = create<PortfolioStore>()(
  persist(
    (set, get) => ({
      // Initial state
      transactions: [],
      watchlist: [],
      dividendPayouts: [],

      // Transaction actions
      addTransaction: (transaction) => {
        const id = `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const newTransaction = { ...transaction, id };

        set((state) => ({
          transactions: [...state.transactions, newTransaction],
        }));

        // Auto-generate future dividend payouts for this position
        const { symbol, shares, exDividendDate, dividendPerShare, annualDividend } = transaction;
        // This is a simplified version - in production, calculate actual payment dates
        const exDate = new Date(exDividendDate);
        const paymentDate = new Date(exDate);
        paymentDate.setDate(paymentDate.getDate() + 14); // Typical 2-week delay

        get().addDividendPayout({
          symbol,
          paymentDate: paymentDate.toISOString().split("T")[0],
          amount: dividendPerShare * shares,
          shares,
          dividendPerShare,
        });
      },

      updateTransaction: (id, updates) => {
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },

      deleteTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        }));
      },

      sellPosition: (id, soldDate, soldPrice) => {
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, soldDate, soldPrice, realized: true } : t
          ),
        }));
      },

      // Watchlist actions
      addToWatchlist: (symbol, companyName) => {
        const addedDate = new Date().toISOString().split("T")[0];
        set((state) => {
          // Check if already in watchlist
          if (state.watchlist.some((w) => w.symbol === symbol)) {
            return state;
          }
          return {
            watchlist: [...state.watchlist, { symbol, companyName, addedDate }],
          };
        });
      },

      removeFromWatchlist: (symbol) => {
        set((state) => ({
          watchlist: state.watchlist.filter((w) => w.symbol !== symbol),
        }));
      },

      // Dividend tracking
      addDividendPayout: (payout) => {
        const id = `div_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        set((state) => ({
          dividendPayouts: [...state.dividendPayouts, { ...payout, id }],
        }));
      },

      getDividendsForDateRange: (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return get().dividendPayouts.filter((d) => {
          const paymentDate = new Date(d.paymentDate);
          return paymentDate >= start && paymentDate <= end;
        });
      },

      getWeeklyDividends: () => {
        const payouts = get().dividendPayouts;
        const weeklyMap = new Map<string, DividendPayout[]>();

        payouts.forEach((payout) => {
          const date = new Date(payout.paymentDate);
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
          const weekKey = weekStart.toISOString().split("T")[0];

          if (!weeklyMap.has(weekKey)) {
            weeklyMap.set(weekKey, []);
          }
          weeklyMap.get(weekKey)!.push(payout);
        });

        return Array.from(weeklyMap.entries())
          .map(([week, payouts]) => ({
            week,
            total: payouts.reduce((sum, p) => sum + p.amount, 0),
            payouts,
          }))
          .sort((a, b) => a.week.localeCompare(b.week));
      },

      getMonthlyDividends: () => {
        const payouts = get().dividendPayouts;
        const monthlyMap = new Map<string, DividendPayout[]>();

        payouts.forEach((payout) => {
          const date = new Date(payout.paymentDate);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

          if (!monthlyMap.has(monthKey)) {
            monthlyMap.set(monthKey, []);
          }
          monthlyMap.get(monthKey)!.push(payout);
        });

        return Array.from(monthlyMap.entries())
          .map(([month, payouts]) => ({
            month,
            total: payouts.reduce((sum, p) => sum + p.amount, 0),
            payouts,
          }))
          .sort((a, b) => a.month.localeCompare(b.month));
      },

      // Portfolio analytics
      getTotalInvested: () => {
        return get()
          .transactions.filter((t) => !t.realized)
          .reduce((sum, t) => sum + t.purchasePrice * t.shares, 0);
      },

      getTotalDividendIncome: () => {
        return get().dividendPayouts.reduce((sum, d) => sum + d.amount, 0);
      },

      getActivePositions: () => {
        return get().transactions.filter((t) => !t.realized);
      },

      getClosedPositions: () => {
        return get().transactions.filter((t) => t.realized);
      },

      getUpcomingDividends: (days = 30) => {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);

        return get()
          .dividendPayouts.filter((d) => {
            const paymentDate = new Date(d.paymentDate);
            return paymentDate >= today && paymentDate <= futureDate;
          })
          .sort(
            (a, b) =>
              new Date(a.paymentDate).getTime() -
              new Date(b.paymentDate).getTime()
          );
      },
    }),
    {
      name: "portfolio-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Selectors for better performance
export const useTransactions = () =>
  usePortfolioStore((state) => state.transactions);
export const useWatchlist = () => usePortfolioStore((state) => state.watchlist);
export const useActivePositions = () =>
  usePortfolioStore((state) => state.getActivePositions());
export const useUpcomingDividends = (days?: number) =>
  usePortfolioStore((state) => state.getUpcomingDividends(days));
