/**
 * Stock Data API Service
 * Fetches real-time stock prices and dividend information
 * Using Alpha Vantage API for market data (15-min delayed free tier)
 */

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

export interface DividendInfo {
  symbol: string;
  dividendAmount: number;
  dividendYield: number;
  exDividendDate: string;
  recordDate: string;
  paymentDate: string;
  frequency: string; // "quarterly", "monthly", "annual"
  annualDividend: number;
}

export interface StockData extends StockQuote, DividendInfo {}

// Mock data for development - In production, you would use Alpha Vantage or Finnhub API
const MOCK_STOCK_DATA: Record<string, Partial<StockData>> = {
  AAPL: {
    symbol: "AAPL",
    price: 178.45,
    change: 2.15,
    changePercent: 1.22,
    dividendAmount: 0.24,
    dividendYield: 0.54,
    exDividendDate: "2025-02-08",
    recordDate: "2025-02-09",
    paymentDate: "2025-02-16",
    frequency: "quarterly",
    annualDividend: 0.96,
  },
  MSFT: {
    symbol: "MSFT",
    price: 425.30,
    change: -1.50,
    changePercent: -0.35,
    dividendAmount: 0.75,
    dividendYield: 0.71,
    exDividendDate: "2025-02-19",
    recordDate: "2025-02-20",
    paymentDate: "2025-03-13",
    frequency: "quarterly",
    annualDividend: 3.00,
  },
  KO: {
    symbol: "KO",
    price: 62.80,
    change: 0.45,
    changePercent: 0.72,
    dividendAmount: 0.485,
    dividendYield: 3.09,
    exDividendDate: "2025-03-14",
    recordDate: "2025-03-15",
    paymentDate: "2025-04-01",
    frequency: "quarterly",
    annualDividend: 1.94,
  },
  PEP: {
    symbol: "PEP",
    price: 157.25,
    change: 0.85,
    changePercent: 0.54,
    dividendAmount: 1.355,
    dividendYield: 3.45,
    exDividendDate: "2025-03-06",
    recordDate: "2025-03-07",
    paymentDate: "2025-03-31",
    frequency: "quarterly",
    annualDividend: 5.42,
  },
  JNJ: {
    symbol: "JNJ",
    price: 158.90,
    change: -0.30,
    changePercent: -0.19,
    dividendAmount: 1.19,
    dividendYield: 2.99,
    exDividendDate: "2025-02-24",
    recordDate: "2025-02-25",
    paymentDate: "2025-03-11",
    frequency: "quarterly",
    annualDividend: 4.76,
  },
  PG: {
    symbol: "PG",
    price: 165.40,
    change: 1.20,
    changePercent: 0.73,
    dividendAmount: 0.9407,
    dividendYield: 2.27,
    exDividendDate: "2025-04-18",
    recordDate: "2025-04-19",
    paymentDate: "2025-05-15",
    frequency: "quarterly",
    annualDividend: 3.76,
  },
  T: {
    symbol: "T",
    price: 22.15,
    change: -0.05,
    changePercent: -0.23,
    dividendAmount: 0.2775,
    dividendYield: 5.01,
    exDividendDate: "2025-04-09",
    recordDate: "2025-04-10",
    paymentDate: "2025-05-01",
    frequency: "quarterly",
    annualDividend: 1.11,
  },
  VZ: {
    symbol: "VZ",
    price: 40.85,
    change: 0.15,
    changePercent: 0.37,
    dividendAmount: 0.6775,
    dividendYield: 6.63,
    exDividendDate: "2025-04-08",
    recordDate: "2025-04-09",
    paymentDate: "2025-05-01",
    frequency: "quarterly",
    annualDividend: 2.71,
  },
  O: {
    symbol: "O",
    price: 58.45,
    change: 0.25,
    changePercent: 0.43,
    dividendAmount: 0.2575,
    dividendYield: 5.29,
    exDividendDate: "2025-02-28",
    recordDate: "2025-03-03",
    paymentDate: "2025-03-17",
    frequency: "monthly",
    annualDividend: 3.09,
  },
  ABBV: {
    symbol: "ABBV",
    price: 195.60,
    change: -0.80,
    changePercent: -0.41,
    dividendAmount: 1.55,
    dividendYield: 3.17,
    exDividendDate: "2025-04-14",
    recordDate: "2025-04-15",
    paymentDate: "2025-05-15",
    frequency: "quarterly",
    annualDividend: 6.20,
  },
};

/**
 * Search for stock symbols
 * Returns matching symbols based on search query
 */
export async function searchStocks(query: string): Promise<string[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const normalizedQuery = query.toUpperCase().trim();

  if (!normalizedQuery) {
    return Object.keys(MOCK_STOCK_DATA);
  }

  return Object.keys(MOCK_STOCK_DATA).filter((symbol) =>
    symbol.includes(normalizedQuery)
  );
}

/**
 * Fetch stock data including price and dividend information
 */
export async function fetchStockData(symbol: string): Promise<StockData | null> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 400));

  const normalizedSymbol = symbol.toUpperCase().trim();
  const mockData = MOCK_STOCK_DATA[normalizedSymbol];

  if (!mockData) {
    return null;
  }

  return {
    ...mockData,
    lastUpdated: new Date().toISOString(),
  } as StockData;
}

/**
 * Fetch multiple stocks at once
 */
export async function fetchMultipleStocks(
  symbols: string[]
): Promise<StockData[]> {
  const promises = symbols.map((symbol) => fetchStockData(symbol));
  const results = await Promise.all(promises);
  return results.filter((data): data is StockData => data !== null);
}

/**
 * Calculate investment allocation
 */
export interface AllocationResult {
  symbol: string;
  allocation: number; // percentage (0-100)
  investmentAmount: number;
  shares: number;
  totalValue: number;
  annualDividend: number;
  monthlyDividend: number;
}

export function calculateInvestment(
  totalInvestment: number,
  stocks: StockData[],
  allocations: Record<string, number> // symbol -> percentage
): AllocationResult[] {
  const results: AllocationResult[] = [];

  for (const stock of stocks) {
    const allocationPercent = allocations[stock.symbol] || 0;
    const investmentAmount = (totalInvestment * allocationPercent) / 100;
    const shares = Math.floor(investmentAmount / stock.price);
    const totalValue = shares * stock.price;
    const annualDividend = shares * stock.annualDividend;
    const monthlyDividend = annualDividend / 12;

    results.push({
      symbol: stock.symbol,
      allocation: allocationPercent,
      investmentAmount,
      shares,
      totalValue,
      annualDividend,
      monthlyDividend,
    });
  }

  return results;
}
