/**
 * Comprehensive Stock Data API
 * Complete database of dividend-paying stocks with filtering capabilities
 */

export interface DividendStock {
  symbol: string;
  companyName: string;
  price: number;
  change: number;
  changePercent: number;
  dividendAmount: number;
  dividendYield: number;
  exDividendDate: string; // ISO date string
  recordDate: string;
  paymentDate: string;
  frequency: "monthly" | "quarterly" | "semi-annual" | "annual";
  annualDividend: number;
  sector: string;
  marketCap: number; // in billions
}

// Comprehensive database of dividend stocks
export const ALL_DIVIDEND_STOCKS: DividendStock[] = [
  // Technology
  {
    symbol: "AAPL",
    companyName: "Apple Inc.",
    price: 178.45,
    change: 2.15,
    changePercent: 1.22,
    dividendAmount: 0.24,
    dividendYield: 0.54,
    exDividendDate: "2025-11-18",
    recordDate: "2025-11-19",
    paymentDate: "2025-11-26",
    frequency: "quarterly",
    annualDividend: 0.96,
    sector: "Technology",
    marketCap: 2800,
  },
  {
    symbol: "MSFT",
    companyName: "Microsoft Corporation",
    price: 425.30,
    change: -1.50,
    changePercent: -0.35,
    dividendAmount: 0.75,
    dividendYield: 0.71,
    exDividendDate: "2025-11-19",
    recordDate: "2025-11-20",
    paymentDate: "2025-12-12",
    frequency: "quarterly",
    annualDividend: 3.00,
    sector: "Technology",
    marketCap: 3200,
  },
  {
    symbol: "AVGO",
    companyName: "Broadcom Inc.",
    price: 168.50,
    change: 3.25,
    changePercent: 1.97,
    dividendAmount: 5.25,
    dividendYield: 12.47,
    exDividendDate: "2025-11-18",
    recordDate: "2025-11-19",
    paymentDate: "2025-12-31",
    frequency: "quarterly",
    annualDividend: 21.00,
    sector: "Technology",
    marketCap: 789,
  },
  {
    symbol: "IBM",
    companyName: "International Business Machines",
    price: 215.80,
    change: 1.20,
    changePercent: 0.56,
    dividendAmount: 1.67,
    dividendYield: 3.09,
    exDividendDate: "2025-11-20",
    recordDate: "2025-11-21",
    paymentDate: "2025-12-10",
    frequency: "quarterly",
    annualDividend: 6.68,
    sector: "Technology",
    marketCap: 198,
  },
  {
    symbol: "QCOM",
    companyName: "Qualcomm Incorporated",
    price: 155.40,
    change: 2.80,
    changePercent: 1.83,
    dividendAmount: 0.85,
    dividendYield: 2.19,
    exDividendDate: "2025-11-19",
    recordDate: "2025-11-20",
    paymentDate: "2025-12-19",
    frequency: "quarterly",
    annualDividend: 3.40,
    sector: "Technology",
    marketCap: 173,
  },

  // Consumer Staples
  {
    symbol: "KO",
    companyName: "The Coca-Cola Company",
    price: 62.80,
    change: 0.45,
    changePercent: 0.72,
    dividendAmount: 0.485,
    dividendYield: 3.09,
    exDividendDate: "2025-11-18",
    recordDate: "2025-11-19",
    paymentDate: "2025-12-16",
    frequency: "quarterly",
    annualDividend: 1.94,
    sector: "Consumer Staples",
    marketCap: 271,
  },
  {
    symbol: "PEP",
    companyName: "PepsiCo, Inc.",
    price: 157.25,
    change: 0.85,
    changePercent: 0.54,
    dividendAmount: 1.355,
    dividendYield: 3.45,
    exDividendDate: "2025-11-20",
    recordDate: "2025-11-21",
    paymentDate: "2025-12-31",
    frequency: "quarterly",
    annualDividend: 5.42,
    sector: "Consumer Staples",
    marketCap: 217,
  },
  {
    symbol: "PM",
    companyName: "Philip Morris International",
    price: 125.60,
    change: -0.80,
    changePercent: -0.63,
    dividendAmount: 1.35,
    dividendYield: 4.30,
    exDividendDate: "2025-11-19",
    recordDate: "2025-11-20",
    paymentDate: "2025-12-11",
    frequency: "quarterly",
    annualDividend: 5.40,
    sector: "Consumer Staples",
    marketCap: 195,
  },
  {
    symbol: "MO",
    companyName: "Altria Group, Inc.",
    price: 53.20,
    change: 0.30,
    changePercent: 0.57,
    dividendAmount: 0.98,
    dividendYield: 7.37,
    exDividendDate: "2025-11-18",
    recordDate: "2025-11-19",
    paymentDate: "2026-01-10",
    frequency: "quarterly",
    annualDividend: 3.92,
    sector: "Consumer Staples",
    marketCap: 96,
  },
  {
    symbol: "PG",
    companyName: "The Procter & Gamble Company",
    price: 165.40,
    change: 1.20,
    changePercent: 0.73,
    dividendAmount: 0.9407,
    dividendYield: 2.27,
    exDividendDate: "2025-11-21",
    recordDate: "2025-11-22",
    paymentDate: "2025-12-15",
    frequency: "quarterly",
    annualDividend: 3.76,
    sector: "Consumer Staples",
    marketCap: 393,
  },

  // Healthcare
  {
    symbol: "JNJ",
    companyName: "Johnson & Johnson",
    price: 158.90,
    change: -0.30,
    changePercent: -0.19,
    dividendAmount: 1.19,
    dividendYield: 2.99,
    exDividendDate: "2025-11-20",
    recordDate: "2025-11-21",
    paymentDate: "2025-12-10",
    frequency: "quarterly",
    annualDividend: 4.76,
    sector: "Healthcare",
    marketCap: 383,
  },
  {
    symbol: "ABBV",
    companyName: "AbbVie Inc.",
    price: 195.60,
    change: -0.80,
    changePercent: -0.41,
    dividendAmount: 1.55,
    dividendYield: 3.17,
    exDividendDate: "2025-11-18",
    recordDate: "2025-11-19",
    paymentDate: "2026-02-17",
    frequency: "quarterly",
    annualDividend: 6.20,
    sector: "Healthcare",
    marketCap: 345,
  },
  {
    symbol: "PFE",
    companyName: "Pfizer Inc.",
    price: 25.80,
    change: 0.15,
    changePercent: 0.58,
    dividendAmount: 0.42,
    dividendYield: 6.51,
    exDividendDate: "2025-11-19",
    recordDate: "2025-11-20",
    paymentDate: "2025-12-06",
    frequency: "quarterly",
    annualDividend: 1.68,
    sector: "Healthcare",
    marketCap: 145,
  },
  {
    symbol: "AMGN",
    companyName: "Amgen Inc.",
    price: 288.40,
    change: 2.10,
    changePercent: 0.73,
    dividendAmount: 2.25,
    dividendYield: 3.12,
    exDividendDate: "2025-11-21",
    recordDate: "2025-11-22",
    paymentDate: "2025-12-09",
    frequency: "quarterly",
    annualDividend: 9.00,
    sector: "Healthcare",
    marketCap: 155,
  },

  // Telecommunications
  {
    symbol: "T",
    companyName: "AT&T Inc.",
    price: 22.15,
    change: -0.05,
    changePercent: -0.23,
    dividendAmount: 0.2775,
    dividendYield: 5.01,
    exDividendDate: "2025-11-18",
    recordDate: "2025-11-19",
    paymentDate: "2026-02-03",
    frequency: "quarterly",
    annualDividend: 1.11,
    sector: "Telecommunications",
    marketCap: 158,
  },
  {
    symbol: "VZ",
    companyName: "Verizon Communications Inc.",
    price: 40.85,
    change: 0.15,
    changePercent: 0.37,
    dividendAmount: 0.6775,
    dividendYield: 6.63,
    exDividendDate: "2025-11-19",
    recordDate: "2025-11-20",
    paymentDate: "2026-02-02",
    frequency: "quarterly",
    annualDividend: 2.71,
    sector: "Telecommunications",
    marketCap: 171,
  },

  // Real Estate
  {
    symbol: "O",
    companyName: "Realty Income Corporation",
    price: 58.45,
    change: 0.25,
    changePercent: 0.43,
    dividendAmount: 0.2575,
    dividendYield: 5.29,
    exDividendDate: "2025-11-18",
    recordDate: "2025-11-19",
    paymentDate: "2025-12-13",
    frequency: "monthly",
    annualDividend: 3.09,
    sector: "Real Estate",
    marketCap: 48,
  },
  {
    symbol: "SPG",
    companyName: "Simon Property Group, Inc.",
    price: 172.30,
    change: 1.50,
    changePercent: 0.88,
    dividendAmount: 1.95,
    dividendYield: 4.53,
    exDividendDate: "2025-11-20",
    recordDate: "2025-11-21",
    paymentDate: "2025-12-30",
    frequency: "quarterly",
    annualDividend: 7.80,
    sector: "Real Estate",
    marketCap: 56,
  },
  {
    symbol: "PSA",
    companyName: "Public Storage",
    price: 315.60,
    change: 2.30,
    changePercent: 0.73,
    dividendAmount: 3.00,
    dividendYield: 3.80,
    exDividendDate: "2025-11-19",
    recordDate: "2025-11-20",
    paymentDate: "2025-12-31",
    frequency: "quarterly",
    annualDividend: 12.00,
    sector: "Real Estate",
    marketCap: 55,
  },

  // Energy
  {
    symbol: "XOM",
    companyName: "Exxon Mobil Corporation",
    price: 114.80,
    change: 1.20,
    changePercent: 1.06,
    dividendAmount: 0.95,
    dividendYield: 3.31,
    exDividendDate: "2025-11-18",
    recordDate: "2025-11-19",
    paymentDate: "2025-12-10",
    frequency: "quarterly",
    annualDividend: 3.80,
    sector: "Energy",
    marketCap: 473,
  },
  {
    symbol: "CVX",
    companyName: "Chevron Corporation",
    price: 158.90,
    change: 0.90,
    changePercent: 0.57,
    dividendAmount: 1.63,
    dividendYield: 4.10,
    exDividendDate: "2025-11-19",
    recordDate: "2025-11-20",
    paymentDate: "2025-12-10",
    frequency: "quarterly",
    annualDividend: 6.52,
    sector: "Energy",
    marketCap: 292,
  },
  {
    symbol: "ENB",
    companyName: "Enbridge Inc.",
    price: 41.20,
    change: 0.35,
    changePercent: 0.86,
    dividendAmount: 0.915,
    dividendYield: 8.90,
    exDividendDate: "2025-11-20",
    recordDate: "2025-11-21",
    paymentDate: "2025-12-01",
    frequency: "quarterly",
    annualDividend: 3.66,
    sector: "Energy",
    marketCap: 85,
  },

  // Financials
  {
    symbol: "JPM",
    companyName: "JPMorgan Chase & Co.",
    price: 245.60,
    change: 1.80,
    changePercent: 0.74,
    dividendAmount: 1.15,
    dividendYield: 1.87,
    exDividendDate: "2025-11-18",
    recordDate: "2025-11-19",
    paymentDate: "2026-01-31",
    frequency: "quarterly",
    annualDividend: 4.60,
    sector: "Financials",
    marketCap: 710,
  },
  {
    symbol: "BAC",
    companyName: "Bank of America Corporation",
    price: 45.30,
    change: 0.60,
    changePercent: 1.34,
    dividendAmount: 0.26,
    dividendYield: 2.30,
    exDividendDate: "2025-11-19",
    recordDate: "2025-11-20",
    paymentDate: "2025-12-27",
    frequency: "quarterly",
    annualDividend: 1.04,
    sector: "Financials",
    marketCap: 357,
  },
  {
    symbol: "USB",
    companyName: "U.S. Bancorp",
    price: 52.80,
    change: 0.45,
    changePercent: 0.86,
    dividendAmount: 0.50,
    dividendYield: 3.79,
    exDividendDate: "2025-11-20",
    recordDate: "2025-11-21",
    paymentDate: "2026-01-15",
    frequency: "quarterly",
    annualDividend: 2.00,
    sector: "Financials",
    marketCap: 77,
  },

  // Utilities
  {
    symbol: "NEE",
    companyName: "NextEra Energy, Inc.",
    price: 78.50,
    change: 0.80,
    changePercent: 1.03,
    dividendAmount: 0.4675,
    dividendYield: 2.38,
    exDividendDate: "2025-11-18",
    recordDate: "2025-11-19",
    paymentDate: "2025-12-16",
    frequency: "quarterly",
    annualDividend: 1.87,
    sector: "Utilities",
    marketCap: 159,
  },
  {
    symbol: "DUK",
    companyName: "Duke Energy Corporation",
    price: 112.40,
    change: 0.30,
    changePercent: 0.27,
    dividendAmount: 1.025,
    dividendYield: 3.65,
    exDividendDate: "2025-11-19",
    recordDate: "2025-11-20",
    paymentDate: "2025-12-17",
    frequency: "quarterly",
    annualDividend: 4.10,
    sector: "Utilities",
    marketCap: 86,
  },
  {
    symbol: "SO",
    companyName: "The Southern Company",
    price: 89.60,
    change: 0.50,
    changePercent: 0.56,
    dividendAmount: 0.72,
    dividendYield: 3.21,
    exDividendDate: "2025-11-21",
    recordDate: "2025-11-22",
    paymentDate: "2025-12-06",
    frequency: "quarterly",
    annualDividend: 2.88,
    sector: "Utilities",
    marketCap: 97,
  },

  // Industrials
  {
    symbol: "MMM",
    companyName: "3M Company",
    price: 132.40,
    change: 1.10,
    changePercent: 0.84,
    dividendAmount: 1.51,
    dividendYield: 4.56,
    exDividendDate: "2025-11-18",
    recordDate: "2025-11-19",
    paymentDate: "2025-12-12",
    frequency: "quarterly",
    annualDividend: 6.04,
    sector: "Industrials",
    marketCap: 73,
  },
  {
    symbol: "CAT",
    companyName: "Caterpillar Inc.",
    price: 385.70,
    change: 3.20,
    changePercent: 0.84,
    dividendAmount: 1.30,
    dividendYield: 1.35,
    exDividendDate: "2025-11-19",
    recordDate: "2025-11-20",
    paymentDate: "2026-02-20",
    frequency: "quarterly",
    annualDividend: 5.20,
    sector: "Industrials",
    marketCap: 195,
  },
];

export interface FilterOptions {
  exDividendDate?: string; // Specific date filter
  dateRange?: {
    start: string;
    end: string;
  };
  month?: number; // 1-12
  quarter?: number; // 1-4
  minYield?: number;
  maxYield?: number;
  sectors?: string[];
}

/**
 * Filter stocks by various criteria
 */
export function filterStocks(
  stocks: DividendStock[],
  filters: FilterOptions
): DividendStock[] {
  let filtered = [...stocks];

  // Filter by specific ex-dividend date
  if (filters.exDividendDate) {
    filtered = filtered.filter(
      (stock) => stock.exDividendDate === filters.exDividendDate
    );
  }

  // Filter by date range
  if (filters.dateRange) {
    filtered = filtered.filter((stock) => {
      const exDate = new Date(stock.exDividendDate);
      const start = new Date(filters.dateRange!.start);
      const end = new Date(filters.dateRange!.end);
      return exDate >= start && exDate <= end;
    });
  }

  // Filter by month
  if (filters.month !== undefined) {
    filtered = filtered.filter((stock) => {
      const exDate = new Date(stock.exDividendDate);
      return exDate.getMonth() + 1 === filters.month;
    });
  }

  // Filter by quarter
  if (filters.quarter !== undefined) {
    filtered = filtered.filter((stock) => {
      const exDate = new Date(stock.exDividendDate);
      const month = exDate.getMonth() + 1;
      const quarter = Math.ceil(month / 3);
      return quarter === filters.quarter;
    });
  }

  // Filter by yield range
  if (filters.minYield !== undefined) {
    filtered = filtered.filter(
      (stock) => stock.dividendYield >= filters.minYield!
    );
  }
  if (filters.maxYield !== undefined) {
    filtered = filtered.filter(
      (stock) => stock.dividendYield <= filters.maxYield!
    );
  }

  // Filter by sectors
  if (filters.sectors && filters.sectors.length > 0) {
    filtered = filtered.filter((stock) =>
      filters.sectors!.includes(stock.sector)
    );
  }

  return filtered;
}

/**
 * Get all unique sectors
 */
export function getAllSectors(): string[] {
  const sectors = new Set(ALL_DIVIDEND_STOCKS.map((s) => s.sector));
  return Array.from(sectors).sort();
}

/**
 * Get stocks with ex-dividend date today
 */
export function getStocksExDividendToday(): DividendStock[] {
  const today = new Date().toISOString().split("T")[0];
  return filterStocks(ALL_DIVIDEND_STOCKS, { exDividendDate: today });
}

/**
 * Get stocks with ex-dividend date tomorrow
 */
export function getStocksExDividendTomorrow(): DividendStock[] {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  return filterStocks(ALL_DIVIDEND_STOCKS, { exDividendDate: tomorrowStr });
}

/**
 * Get stocks with ex-dividend date this week
 */
export function getStocksExDividendThisWeek(): DividendStock[] {
  const today = new Date();
  const endOfWeek = new Date();
  endOfWeek.setDate(today.getDate() + 7);

  return filterStocks(ALL_DIVIDEND_STOCKS, {
    dateRange: {
      start: today.toISOString().split("T")[0],
      end: endOfWeek.toISOString().split("T")[0],
    },
  });
}

/**
 * Calculate investment details for multiple stocks
 */
export interface BulkInvestmentResult {
  symbol: string;
  companyName: string;
  price: number;
  shares: number;
  investmentUsed: number;
  annualDividend: number;
  monthlyDividend: number;
  yield: number;
}

export function calculateBulkInvestment(
  investmentAmount: number,
  stocks: DividendStock[]
): BulkInvestmentResult[] {
  const perStockInvestment = investmentAmount / stocks.length;

  return stocks.map((stock) => {
    const shares = Math.floor(perStockInvestment / stock.price);
    const investmentUsed = shares * stock.price;
    const annualDividend = shares * stock.annualDividend;
    const monthlyDividend = annualDividend / 12;

    return {
      symbol: stock.symbol,
      companyName: stock.companyName,
      price: stock.price,
      shares,
      investmentUsed,
      annualDividend,
      monthlyDividend,
      yield: stock.dividendYield,
    };
  });
}
