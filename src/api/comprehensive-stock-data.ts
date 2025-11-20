/**
 * Enhanced Comprehensive Stock Data API
 * Complete database with technical indicators, volume data, and detailed price information
 */

export interface TechnicalIndicators {
  macd: {
    value: number;
    signal: number;
    histogram: number;
  };
  rsi: number; // 0-100
  pegRatio: number;
  movingAverage50: number;
  movingAverage200: number;
}

export interface PriceData {
  current: number;
  dayHigh: number;
  dayLow: number;
  week52High: number;
  week52Low: number;
  change: number;
  changePercent: number;
}

export interface VolumeData {
  current: number; // in millions
  average: number; // 30-day average in millions
}

export interface DividendStock {
  symbol: string;
  companyName: string;
  sector: string;
  industry: string;
  indices: string[]; // e.g., ["S&P 500", "Dow Jones"]
  marketCap: number; // in billions

  // Price information
  price: number;
  priceData: PriceData;

  // Volume
  volume: VolumeData;

  // Dividend information
  dividendAmount: number; // Per payment
  dividendYield: number;
  exDividendDate: string; // ISO date string
  recordDate: string;
  paymentDate: string;
  frequency: "monthly" | "quarterly" | "semi-annual" | "annual";
  annualDividend: number;
  payoutRatio: number; // Percentage of earnings paid as dividends
  dividendGrowth5Year: number; // Average annual growth over 5 years

  // Technical indicators
  technicals: TechnicalIndicators;

  // Legacy fields for backwards compatibility
  change: number;
  changePercent: number;
}

/**
 * Helper function to generate realistic technical data
 */
function generateTechnicals(price: number, trend: "bullish" | "bearish" | "neutral"): TechnicalIndicators {
  const rsi = trend === "bullish" ? 55 + Math.random() * 25 : trend === "bearish" ? 20 + Math.random() * 25 : 40 + Math.random() * 20;
  const macdValue = trend === "bullish" ? Math.random() * 2 : trend === "bearish" ? -Math.random() * 2 : -0.5 + Math.random();

  return {
    macd: {
      value: macdValue,
      signal: macdValue - (Math.random() * 0.5 - 0.25),
      histogram: Math.random() * 0.5 - 0.25,
    },
    rsi: Math.round(rsi),
    pegRatio: 0.8 + Math.random() * 2.5,
    movingAverage50: price * (0.95 + Math.random() * 0.1),
    movingAverage200: price * (0.90 + Math.random() * 0.15),
  };
}

/**
 * Helper to create complete stock data
 */
function createStock(
  symbol: string,
  companyName: string,
  sector: string,
  industry: string,
  indices: string[],
  price: number,
  change: number,
  changePercent: number,
  dividendAmount: number,
  dividendYield: number,
  exDividendDate: string,
  recordDate: string,
  paymentDate: string,
  frequency: "monthly" | "quarterly" | "semi-annual" | "annual",
  annualDividend: number,
  marketCap: number,
  volume: number,
  trend: "bullish" | "bearish" | "neutral" = "neutral"
): DividendStock {
  return {
    symbol,
    companyName,
    sector,
    industry,
    indices,
    marketCap,
    price,
    priceData: {
      current: price,
      dayHigh: price + Math.abs(change) * 1.2,
      dayLow: price - Math.abs(change) * 0.8,
      week52High: price * (1.15 + Math.random() * 0.25),
      week52Low: price * (0.70 + Math.random() * 0.15),
      change,
      changePercent,
    },
    volume: {
      current: volume,
      average: volume * (0.85 + Math.random() * 0.3),
    },
    dividendAmount,
    dividendYield,
    exDividendDate,
    recordDate,
    paymentDate,
    frequency,
    annualDividend,
    payoutRatio: Math.round(30 + Math.random() * 40),
    dividendGrowth5Year: Math.round((3 + Math.random() * 12) * 10) / 10,
    technicals: generateTechnicals(price, trend),
    change,
    changePercent,
  };
}

// Comprehensive database of dividend stocks
export const ALL_DIVIDEND_STOCKS: DividendStock[] = [
  // Technology
  createStock("AAPL", "Apple Inc.", "Technology", "Consumer Electronics", ["S&P 500", "Dow Jones", "NASDAQ 100"], 178.45, 2.15, 1.22, 0.24, 0.54, "2025-11-18", "2025-11-19", "2025-11-26", "quarterly", 0.96, 2800, 58.5, "bullish"),
  createStock("MSFT", "Microsoft Corporation", "Technology", "Software - Infrastructure", ["S&P 500", "Dow Jones", "NASDAQ 100"], 425.30, -1.50, -0.35, 0.75, 0.71, "2025-11-19", "2025-11-20", "2025-12-12", "quarterly", 3.00, 3200, 22.3, "neutral"),
  createStock("AVGO", "Broadcom Inc.", "Technology", "Semiconductors", ["S&P 500", "NASDAQ 100"], 168.50, 3.25, 1.97, 5.25, 12.47, "2025-11-18", "2025-11-19", "2025-12-31", "quarterly", 21.00, 789, 2.8, "bullish"),
  createStock("IBM", "International Business Machines", "Technology", "Information Technology Services", ["S&P 500", "Dow Jones"], 215.80, 1.20, 0.56, 1.67, 3.09, "2025-11-20", "2025-11-21", "2025-12-10", "quarterly", 6.68, 198, 4.2, "neutral"),
  createStock("QCOM", "Qualcomm Incorporated", "Technology", "Semiconductors", ["S&P 500", "NASDAQ 100"], 155.40, 2.80, 1.83, 0.85, 2.19, "2025-11-19", "2025-11-20", "2025-12-19", "quarterly", 3.40, 173, 8.7, "bullish"),
  createStock("TXN", "Texas Instruments Inc.", "Technology", "Semiconductors", ["S&P 500", "NASDAQ 100"], 188.25, 1.45, 0.78, 1.30, 2.76, "2025-11-20", "2025-11-21", "2025-12-09", "quarterly", 5.20, 167, 4.5, "neutral"),
  createStock("CSCO", "Cisco Systems, Inc.", "Technology", "Communication Equipment", ["S&P 500", "Dow Jones", "NASDAQ 100"], 58.70, 0.65, 1.12, 0.40, 2.73, "2025-11-18", "2025-11-19", "2025-12-25", "quarterly", 1.60, 233, 18.4, "bullish"),

  // Consumer Staples
  createStock("KO", "The Coca-Cola Company", "Consumer Staples", "Beverages - Non-Alcoholic", ["S&P 500", "Dow Jones"], 62.80, 0.45, 0.72, 0.485, 3.09, "2025-11-18", "2025-11-19", "2025-12-16", "quarterly", 1.94, 271, 14.2, "neutral"),
  createStock("PEP", "PepsiCo, Inc.", "Consumer Staples", "Beverages - Non-Alcoholic", ["S&P 500", "Dow Jones"], 157.25, 0.85, 0.54, 1.355, 3.45, "2025-11-20", "2025-11-21", "2025-12-31", "quarterly", 5.42, 217, 4.8, "neutral"),
  createStock("PM", "Philip Morris International", "Consumer Staples", "Tobacco", ["S&P 500"], 125.60, -0.80, -0.63, 1.35, 4.30, "2025-11-19", "2025-11-20", "2025-12-11", "quarterly", 5.40, 195, 4.1, "bearish"),
  createStock("MO", "Altria Group, Inc.", "Consumer Staples", "Tobacco", ["S&P 500"], 53.20, 0.30, 0.57, 0.98, 7.37, "2025-11-18", "2025-11-19", "2026-01-10", "quarterly", 3.92, 96, 7.8, "neutral"),
  createStock("PG", "The Procter & Gamble Company", "Consumer Staples", "Household & Personal Products", ["S&P 500", "Dow Jones"], 165.40, 1.20, 0.73, 0.9407, 2.27, "2025-11-21", "2025-11-22", "2025-12-15", "quarterly", 3.76, 393, 7.2, "bullish"),
  createStock("CL", "Colgate-Palmolive Company", "Consumer Staples", "Household & Personal Products", ["S&P 500"], 95.30, 0.55, 0.58, 0.50, 2.10, "2025-11-19", "2025-11-20", "2025-12-16", "quarterly", 2.00, 79, 3.8, "neutral"),
  createStock("KMB", "Kimberly-Clark Corporation", "Consumer Staples", "Household & Personal Products", ["S&P 500"], 134.70, 0.95, 0.71, 1.22, 3.63, "2025-11-18", "2025-11-19", "2026-01-03", "quarterly", 4.88, 45, 1.9, "neutral"),

  // Healthcare
  createStock("JNJ", "Johnson & Johnson", "Healthcare", "Drug Manufacturers - General", ["S&P 500", "Dow Jones"], 158.90, -0.30, -0.19, 1.19, 2.99, "2025-11-20", "2025-11-21", "2025-12-10", "quarterly", 4.76, 383, 6.5, "neutral"),
  createStock("ABBV", "AbbVie Inc.", "Healthcare", "Drug Manufacturers - General", ["S&P 500"], 195.60, -0.80, -0.41, 1.55, 3.17, "2025-11-18", "2025-11-19", "2026-02-17", "quarterly", 6.20, 345, 5.9, "bearish"),
  createStock("PFE", "Pfizer Inc.", "Healthcare", "Drug Manufacturers - General", ["S&P 500", "Dow Jones"], 25.80, 0.15, 0.58, 0.42, 6.51, "2025-11-19", "2025-11-20", "2025-12-06", "quarterly", 1.68, 145, 45.2, "neutral"),
  createStock("AMGN", "Amgen Inc.", "Healthcare", "Biotechnology", ["S&P 500", "NASDAQ 100"], 288.40, 2.10, 0.73, 2.25, 3.12, "2025-11-21", "2025-11-22", "2025-12-09", "quarterly", 9.00, 155, 2.1, "bullish"),
  createStock("MDT", "Medtronic plc", "Healthcare", "Medical Devices", ["S&P 500"], 86.45, 0.85, 0.99, 0.70, 3.24, "2025-11-18", "2025-11-19", "2026-01-17", "quarterly", 2.80, 112, 4.3, "neutral"),
  createStock("BMY", "Bristol-Myers Squibb Company", "Healthcare", "Drug Manufacturers - General", ["S&P 500"], 52.35, 0.45, 0.87, 0.60, 4.59, "2025-11-19", "2025-11-20", "2026-02-03", "quarterly", 2.40, 104, 10.7, "neutral"),

  // Telecommunications
  createStock("T", "AT&T Inc.", "Telecommunications", "Telecom Services", ["S&P 500", "Dow Jones"], 22.15, -0.05, -0.23, 0.2775, 5.01, "2025-11-18", "2025-11-19", "2026-02-03", "quarterly", 1.11, 158, 36.8, "bearish"),
  createStock("VZ", "Verizon Communications Inc.", "Telecommunications", "Telecom Services", ["S&P 500", "Dow Jones"], 40.85, 0.15, 0.37, 0.6775, 6.63, "2025-11-19", "2025-11-20", "2026-02-02", "quarterly", 2.71, 171, 18.2, "neutral"),
  createStock("TMUS", "T-Mobile US, Inc.", "Telecommunications", "Telecom Services", ["S&P 500", "NASDAQ 100"], 225.80, 2.45, 1.10, 0.88, 1.56, "2025-11-20", "2025-11-21", "2025-12-12", "quarterly", 3.52, 265, 4.7, "bullish"),

  // Real Estate (REITs)
  createStock("O", "Realty Income Corporation", "Real Estate", "REIT - Retail", ["S&P 500"], 58.45, 0.25, 0.43, 0.2575, 5.29, "2025-11-18", "2025-11-19", "2025-12-13", "monthly", 3.09, 48, 3.8, "neutral"),
  createStock("SPG", "Simon Property Group, Inc.", "Real Estate", "REIT - Retail", ["S&P 500"], 172.30, 1.50, 0.88, 1.95, 4.53, "2025-11-20", "2025-11-21", "2025-12-30", "quarterly", 7.80, 56, 1.6, "bullish"),
  createStock("PSA", "Public Storage", "Real Estate", "REIT - Industrial", ["S&P 500"], 315.60, 2.30, 0.73, 3.00, 3.80, "2025-11-19", "2025-11-20", "2025-12-31", "quarterly", 12.00, 55, 0.7, "bullish"),
  createStock("PLD", "Prologis, Inc.", "Real Estate", "REIT - Industrial", ["S&P 500"], 112.40, 0.95, 0.85, 0.96, 3.42, "2025-11-18", "2025-11-19", "2025-12-31", "quarterly", 3.84, 104, 3.2, "neutral"),
  createStock("VICI", "VICI Properties Inc.", "Real Estate", "REIT - Diversified", ["S&P 500"], 31.25, 0.20, 0.65, 0.4325, 5.54, "2025-11-19", "2025-11-20", "2026-01-09", "quarterly", 1.73, 34, 5.9, "neutral"),

  // Energy
  createStock("XOM", "Exxon Mobil Corporation", "Energy", "Oil & Gas Integrated", ["S&P 500", "Dow Jones"], 114.80, 1.20, 1.06, 0.95, 3.31, "2025-11-18", "2025-11-19", "2025-12-10", "quarterly", 3.80, 473, 17.8, "bullish"),
  createStock("CVX", "Chevron Corporation", "Energy", "Oil & Gas Integrated", ["S&P 500", "Dow Jones"], 158.90, 0.90, 0.57, 1.63, 4.10, "2025-11-19", "2025-11-20", "2025-12-10", "quarterly", 6.52, 292, 9.2, "neutral"),
  createStock("ENB", "Enbridge Inc.", "Energy", "Oil & Gas Midstream", [], 41.20, 0.35, 0.86, 0.915, 8.90, "2025-11-20", "2025-11-21", "2025-12-01", "quarterly", 3.66, 85, 3.4, "bullish"),
  createStock("KMI", "Kinder Morgan, Inc.", "Energy", "Oil & Gas Midstream", ["S&P 500"], 27.85, 0.25, 0.91, 0.2875, 4.13, "2025-11-18", "2025-11-19", "2026-02-17", "quarterly", 1.15, 62, 14.5, "neutral"),
  createStock("OKE", "ONEOK, Inc.", "Energy", "Oil & Gas Midstream", ["S&P 500"], 98.70, 1.15, 1.18, 0.99, 4.01, "2025-11-19", "2025-11-20", "2026-02-14", "quarterly", 3.96, 55, 1.8, "bullish"),

  // Financials
  createStock("JPM", "JPMorgan Chase & Co.", "Financials", "Banks - Diversified", ["S&P 500", "Dow Jones"], 245.60, 1.80, 0.74, 1.15, 1.87, "2025-11-18", "2025-11-19", "2026-01-31", "quarterly", 4.60, 710, 10.5, "bullish"),
  createStock("BAC", "Bank of America Corporation", "Financials", "Banks - Diversified", ["S&P 500", "Dow Jones"], 45.30, 0.60, 1.34, 0.26, 2.30, "2025-11-19", "2025-11-20", "2025-12-27", "quarterly", 1.04, 357, 38.7, "bullish"),
  createStock("USB", "U.S. Bancorp", "Financials", "Banks - Regional", ["S&P 500"], 52.80, 0.45, 0.86, 0.50, 3.79, "2025-11-20", "2025-11-21", "2026-01-15", "quarterly", 2.00, 77, 5.2, "neutral"),
  createStock("WFC", "Wells Fargo & Company", "Financials", "Banks - Diversified", ["S&P 500", "Dow Jones"], 72.40, 0.85, 1.19, 0.40, 2.21, "2025-11-18", "2025-11-19", "2026-03-01", "quarterly", 1.60, 247, 18.3, "bullish"),
  createStock("BLK", "BlackRock, Inc.", "Financials", "Asset Management", ["S&P 500"], 1025.50, 8.30, 0.82, 5.10, 1.99, "2025-11-19", "2025-11-20", "2025-12-23", "quarterly", 20.40, 153, 0.4, "bullish"),

  // Utilities
  createStock("NEE", "NextEra Energy, Inc.", "Utilities", "Utilities - Renewable", ["S&P 500"], 78.50, 0.80, 1.03, 0.4675, 2.38, "2025-11-18", "2025-11-19", "2025-12-16", "quarterly", 1.87, 159, 7.1, "neutral"),
  createStock("DUK", "Duke Energy Corporation", "Utilities", "Utilities - Regulated Electric", ["S&P 500"], 112.40, 0.30, 0.27, 1.025, 3.65, "2025-11-19", "2025-11-20", "2025-12-17", "quarterly", 4.10, 86, 2.8, "neutral"),
  createStock("SO", "The Southern Company", "Utilities", "Utilities - Regulated Electric", ["S&P 500"], 89.60, 0.50, 0.56, 0.72, 3.21, "2025-11-21", "2025-11-22", "2025-12-06", "quarterly", 2.88, 97, 3.9, "neutral"),
  createStock("AEP", "American Electric Power Company", "Utilities", "Utilities - Regulated Electric", ["S&P 500"], 105.30, 0.65, 0.62, 0.88, 3.35, "2025-11-18", "2025-11-19", "2026-03-10", "quarterly", 3.53, 54, 2.3, "neutral"),
  createStock("D", "Dominion Energy, Inc.", "Utilities", "Utilities - Regulated Electric", ["S&P 500"], 58.95, 0.40, 0.68, 0.6825, 4.63, "2025-11-19", "2025-11-20", "2025-12-20", "quarterly", 2.73, 49, 3.7, "neutral"),

  // Industrials
  createStock("MMM", "3M Company", "Industrials", "Conglomerates", ["S&P 500", "Dow Jones"], 132.40, 1.10, 0.84, 1.51, 4.56, "2025-11-18", "2025-11-19", "2025-12-12", "quarterly", 6.04, 73, 2.6, "neutral"),
  createStock("CAT", "Caterpillar Inc.", "Industrials", "Farm & Heavy Construction Machinery", ["S&P 500", "Dow Jones"], 385.70, 3.20, 0.84, 1.30, 1.35, "2025-11-19", "2025-11-20", "2026-02-20", "quarterly", 5.20, 195, 2.4, "bullish"),
  createStock("UPS", "United Parcel Service, Inc.", "Industrials", "Integrated Freight & Logistics", ["S&P 500", "Dow Jones"], 132.50, 0.95, 0.72, 1.63, 4.92, "2025-11-20", "2025-11-21", "2025-12-05", "quarterly", 6.52, 111, 3.1, "neutral"),
  createStock("HON", "Honeywell International Inc.", "Industrials", "Conglomerates", ["S&P 500", "Dow Jones"], 218.40, 1.65, 0.76, 1.09, 2.00, "2025-11-18", "2025-11-19", "2025-12-06", "quarterly", 4.36, 142, 2.2, "bullish"),
  createStock("LMT", "Lockheed Martin Corporation", "Industrials", "Aerospace & Defense", ["S&P 500"], 568.90, 4.20, 0.74, 3.30, 2.32, "2025-11-19", "2025-11-20", "2026-03-28", "quarterly", 13.20, 137, 1.0, "neutral"),
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
  industries?: string[];
  indices?: string[];
  minVolume?: number;
  maxVolume?: number;
  minPrice?: number;
  maxPrice?: number;
  minMarketCap?: number;
  maxMarketCap?: number;
  rsiRange?: { min: number; max: number };
  pegRange?: { min: number; max: number };
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

  // Filter by industries
  if (filters.industries && filters.industries.length > 0) {
    filtered = filtered.filter((stock) =>
      filters.industries!.includes(stock.industry)
    );
  }

  // Filter by indices
  if (filters.indices && filters.indices.length > 0) {
    filtered = filtered.filter((stock) =>
      stock.indices.some((index) => filters.indices!.includes(index))
    );
  }

  // Filter by volume
  if (filters.minVolume !== undefined) {
    filtered = filtered.filter(
      (stock) => stock.volume.current >= filters.minVolume!
    );
  }
  if (filters.maxVolume !== undefined) {
    filtered = filtered.filter(
      (stock) => stock.volume.current <= filters.maxVolume!
    );
  }

  // Filter by price range
  if (filters.minPrice !== undefined) {
    filtered = filtered.filter(
      (stock) => stock.price >= filters.minPrice!
    );
  }
  if (filters.maxPrice !== undefined) {
    filtered = filtered.filter(
      (stock) => stock.price <= filters.maxPrice!
    );
  }

  // Filter by market cap
  if (filters.minMarketCap !== undefined) {
    filtered = filtered.filter(
      (stock) => stock.marketCap >= filters.minMarketCap!
    );
  }
  if (filters.maxMarketCap !== undefined) {
    filtered = filtered.filter(
      (stock) => stock.marketCap <= filters.maxMarketCap!
    );
  }

  // Filter by RSI
  if (filters.rsiRange) {
    filtered = filtered.filter(
      (stock) =>
        stock.technicals.rsi >= filters.rsiRange!.min &&
        stock.technicals.rsi <= filters.rsiRange!.max
    );
  }

  // Filter by PEG ratio
  if (filters.pegRange) {
    filtered = filtered.filter(
      (stock) =>
        stock.technicals.pegRatio >= filters.pegRange!.min &&
        stock.technicals.pegRatio <= filters.pegRange!.max
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
 * Get all unique industries
 */
export function getAllIndustries(): string[] {
  const industries = new Set(ALL_DIVIDEND_STOCKS.map((s) => s.industry));
  return Array.from(industries).sort();
}

/**
 * Get all unique indices
 */
export function getAllIndices(): string[] {
  const allIndices = ALL_DIVIDEND_STOCKS.flatMap((s) => s.indices);
  const unique = new Set(allIndices);
  return Array.from(unique).sort();
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
  dividendPerShare: number; // Per payment
  totalDividendPayout: number; // Per payment
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
    const totalDividendPayout = shares * stock.dividendAmount; // Per payment
    const annualDividend = shares * stock.annualDividend;
    const monthlyDividend = annualDividend / 12;

    return {
      symbol: stock.symbol,
      companyName: stock.companyName,
      price: stock.price,
      shares,
      investmentUsed,
      dividendPerShare: stock.dividendAmount,
      totalDividendPayout,
      annualDividend,
      monthlyDividend,
      yield: stock.dividendYield,
    };
  });
}

/**
 * Enhance stock data with real-time data from FinnHub
 */
import {
  getFinnHubQuote,
  getFinnHubProfile,
  type FinnHubQuote,
  type FinnHubProfile,
} from "./finnhub";

export async function enhanceStockWithFinnHub(
  stock: DividendStock
): Promise<DividendStock> {
  try {
    const [quote, profile] = await Promise.all([
      getFinnHubQuote(stock.symbol),
      getFinnHubProfile(stock.symbol),
    ]);

    if (!quote) return stock;

    // Update price data with real-time info
    const enhancedStock = { ...stock };

    enhancedStock.price = quote.c;
    enhancedStock.priceData = {
      ...stock.priceData,
      current: quote.c,
      dayHigh: quote.h,
      dayLow: quote.l,
      change: quote.d,
      changePercent: quote.dp,
    };
    enhancedStock.change = quote.d;
    enhancedStock.changePercent = quote.dp;

    // Add logo if available from profile
    if (profile && profile.logo) {
      (enhancedStock as any).logo = profile.logo;
    }

    return enhancedStock;
  } catch (error) {
    console.error(`Failed to enhance ${stock.symbol} with FinnHub data:`, error);
    return stock;
  }
}

/**
 * Enhance all stocks with real-time FinnHub data
 */
export async function enhanceAllStocksWithFinnHub(
  onProgress?: (current: number, total: number, symbol: string) => void
): Promise<DividendStock[]> {
  const enhancedStocks: DividendStock[] = [];

  for (let i = 0; i < ALL_DIVIDEND_STOCKS.length; i++) {
    const stock = ALL_DIVIDEND_STOCKS[i];
    const enhanced = await enhanceStockWithFinnHub(stock);
    enhancedStocks.push(enhanced);

    if (onProgress) {
      onProgress(i + 1, ALL_DIVIDEND_STOCKS.length, stock.symbol);
    }

    // Rate limiting
    if (i < ALL_DIVIDEND_STOCKS.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 150));
    }
  }

  return enhancedStocks;
}

/**
 * Enhance stock data with real-time data from Polygon.io
 */
import { fetchCompleteStockData, filterFutureExDividendStocks } from "./polygon-api";

export async function enhanceStockWithPolygon(
  stock: DividendStock
): Promise<DividendStock> {
  try {
    const polygonData = await fetchCompleteStockData(stock.symbol);

    if (!polygonData) {
      console.warn(`Using mock data for ${stock.symbol} - Polygon data unavailable`);
      return stock;
    }

    // Return the polygon data as it has all the real information
    return polygonData;
  } catch (error) {
    console.warn(`Failed to enhance ${stock.symbol} with Polygon data, using mock:`, error instanceof Error ? error.message : "Unknown error");
    return stock;
  }
}

/**
 * Enhance all stocks with real-time Polygon.io data and filter to future dates only
 */
export async function enhanceAllStocksWithPolygon(
  onProgress?: (current: number, total: number, symbol: string) => void,
  filterToFutureDatesOnly: boolean = true
): Promise<DividendStock[]> {
  const enhancedStocks: DividendStock[] = [];

  for (let i = 0; i < ALL_DIVIDEND_STOCKS.length; i++) {
    const stock = ALL_DIVIDEND_STOCKS[i];
    const enhanced = await enhanceStockWithPolygon(stock);
    enhancedStocks.push(enhanced);

    if (onProgress) {
      onProgress(i + 1, ALL_DIVIDEND_STOCKS.length, stock.symbol);
    }

    // Rate limiting - 5 requests per second = 200ms delay
    if (i < ALL_DIVIDEND_STOCKS.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // Filter to only include stocks with ex-dividend dates today or in the future
  if (filterToFutureDatesOnly) {
    const filteredStocks = filterFutureExDividendStocks(enhancedStocks);
    console.log(`Filtered from ${enhancedStocks.length} to ${filteredStocks.length} stocks (future ex-dates only)`);
    return filteredStocks;
  }

  return enhancedStocks;
}

/**
 * Load and enhance stocks from custom ticker list
 */
export async function loadStocksFromTickers(
  tickers: string[],
  onProgress?: (current: number, total: number, symbol: string) => void,
  filterToFutureDatesOnly: boolean = true
): Promise<DividendStock[]> {
  const enhancedStocks: DividendStock[] = [];

  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i].trim().toUpperCase();

    if (!ticker || ticker.startsWith("#")) {
      continue; // Skip empty lines and comments
    }

    // Only call progress callback every 100 tickers to reduce overhead
    if (onProgress && (i % 100 === 0 || i === tickers.length - 1)) {
      onProgress(i + 1, tickers.length, ticker);
    }

    // Try to find in existing mock data first
    const mockStock = ALL_DIVIDEND_STOCKS.find(s => s.symbol === ticker);
    const stock = mockStock || {
      symbol: ticker,
      companyName: ticker,
      sector: "Unknown",
      industry: "Unknown",
      indices: [],
      marketCap: 0,
      price: 0,
      priceData: {
        current: 0,
        dayHigh: 0,
        dayLow: 0,
        week52High: 0,
        week52Low: 0,
        change: 0,
        changePercent: 0,
      },
      volume: {
        current: 0,
        average: 0,
      },
      dividendAmount: 0,
      dividendYield: 0,
      exDividendDate: "2025-01-01",
      recordDate: "2025-01-01",
      paymentDate: "2025-01-01",
      frequency: "quarterly" as const,
      annualDividend: 0,
      payoutRatio: 0,
      dividendGrowth5Year: 0,
      technicals: {
        macd: { value: 0, signal: 0, histogram: 0 },
        rsi: 50,
        pegRatio: 1,
        movingAverage50: 0,
        movingAverage200: 0,
      },
      change: 0,
      changePercent: 0,
    } as DividendStock;

    const enhanced = await enhanceStockWithPolygon(stock);
    if (enhanced) {
      enhancedStocks.push(enhanced);
    }

    // Increased delay - 2000ms between tickers (0.5 tickers per second) to prevent crashes
    // Each ticker makes 3+ API calls, so this gives ~6 seconds per ticker total
    if (i < tickers.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Filter to only include stocks with ex-dividend dates today or in the future
  if (filterToFutureDatesOnly) {
    const filteredStocks = filterFutureExDividendStocks(enhancedStocks);
    console.log(`Filtered from ${enhancedStocks.length} to ${filteredStocks.length} stocks (future ex-dates only)`);
    return filteredStocks;
  }

  return enhancedStocks;
}

