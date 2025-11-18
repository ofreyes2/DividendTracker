/**
 * FinnHub API Integration
 * Real-time stock data and news from FinnHub.io (massive.com)
 */

const FINNHUB_API_KEY = process.env.EXPO_PUBLIC_FINNHUB_API_KEY || "";
const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

export interface FinnHubQuote {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
}

export interface FinnHubDividend {
  symbol: string;
  date: string; // YYYY-MM-DD
  amount: number;
  adjustedAmount: number;
  payDate: string;
  recordDate: string;
  declarationDate: string;
  currency: string;
}

export interface FinnHubNews {
  category: string;
  datetime: number; // Unix timestamp
  headline: string;
  id: number;
  image: string;
  related: string; // Stock symbol
  source: string;
  summary: string;
  url: string;
}

export interface FinnHubProfile {
  country: string;
  currency: string;
  exchange: string;
  ipo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
  logo: string;
  finnhubIndustry: string;
}

/**
 * Fetch real-time quote for a stock
 */
export async function getFinnHubQuote(symbol: string): Promise<FinnHubQuote | null> {
  try {
    const response = await fetch(
      `${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`FinnHub API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch quote for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch company profile including logo
 */
export async function getFinnHubProfile(symbol: string): Promise<FinnHubProfile | null> {
  try {
    const response = await fetch(
      `${FINNHUB_BASE_URL}/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`FinnHub API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch profile for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch dividend data for a stock
 */
export async function getFinnHubDividends(
  symbol: string,
  from: string,
  to: string
): Promise<FinnHubDividend[]> {
  try {
    const response = await fetch(
      `${FINNHUB_BASE_URL}/stock/dividend?symbol=${symbol}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`FinnHub API error: ${response.status}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error(`Failed to fetch dividends for ${symbol}:`, error);
    return [];
  }
}

/**
 * Fetch company news
 */
export async function getFinnHubCompanyNews(
  symbol: string,
  from: string,
  to: string
): Promise<FinnHubNews[]> {
  try {
    const response = await fetch(
      `${FINNHUB_BASE_URL}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`FinnHub API error: ${response.status}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error(`Failed to fetch news for ${symbol}:`, error);
    return [];
  }
}

/**
 * Fetch market news
 */
export async function getFinnHubMarketNews(category: string = "general"): Promise<FinnHubNews[]> {
  try {
    const response = await fetch(
      `${FINNHUB_BASE_URL}/news?category=${category}&token=${FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`FinnHub API error: ${response.status}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error("Failed to fetch market news:", error);
    return [];
  }
}

/**
 * Get list of dividend-paying stocks from S&P 500
 * Returns symbols that we can then query for detailed data
 */
export async function getDividendPayingStocks(): Promise<string[]> {
  // Common dividend aristocrats and high-yield stocks
  // In production, you'd fetch this dynamically from FinnHub's symbol lookup
  const dividendStocks = [
    // Current 45 stocks we have
    "AAPL", "MSFT", "AVGO", "IBM", "QCOM",
    "KO", "PEP", "PM", "MO", "PG",
    "JNJ", "ABBV", "PFE", "AMGN", "CVS",
    "T", "VZ",
    "O", "SPG", "PSA", "VTR", "WELL",
    "XOM", "CVX", "ENB",
    "JPM", "BAC", "USB", "WFC", "C",
    "NEE", "DUK", "SO", "AEP", "D",
    "MMM", "CAT", "UPS", "HON", "LMT",
    "HD", "LOW", "TGT", "COST", "WMT",
    // Additional high-quality dividend stocks
    "INTC", "CSCO", "TXN", "ORCL",
    "MCD", "YUM", "SBUX",
    "UNH", "TMO", "MDT", "BMY",
    "DIS", "CMCSA", "CHTR",
    "AMT", "PLD", "EQIX", "DLR",
    "SLB", "COP", "EOG", "KMI",
    "GS", "MS", "BLK", "SCHW",
    "ES", "EXC", "SRE", "PEG",
    "BA", "GE", "RTX", "UNP",
    "NKE", "SBUX", "MCD", "TJX",
    "ABT", "LLY", "MRK", "GILD",
  ];

  // Remove duplicates
  return Array.from(new Set(dividendStocks));
}

/**
 * Fetch recent news for a stock (last 7 days)
 */
export async function getRecentStockNews(symbol: string, limit: number = 3): Promise<FinnHubNews[]> {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const toDate = today.toISOString().split("T")[0];
  const fromDate = weekAgo.toISOString().split("T")[0];

  const news = await getFinnHubCompanyNews(symbol, fromDate, toDate);
  return news.slice(0, limit);
}

/**
 * Batch fetch quotes for multiple symbols
 * FinnHub has rate limits, so we'll fetch sequentially with delays
 */
export async function batchFetchQuotes(
  symbols: string[],
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, FinnHubQuote>> {
  const quotes = new Map<string, FinnHubQuote>();

  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    const quote = await getFinnHubQuote(symbol);

    if (quote) {
      quotes.set(symbol, quote);
    }

    if (onProgress) {
      onProgress(i + 1, symbols.length);
    }

    // Rate limiting: wait 100ms between requests (free tier = 60 calls/minute)
    if (i < symbols.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return quotes;
}

/**
 * Batch fetch profiles for multiple symbols (including logos)
 */
export async function batchFetchProfiles(
  symbols: string[],
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, FinnHubProfile>> {
  const profiles = new Map<string, FinnHubProfile>();

  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    const profile = await getFinnHubProfile(symbol);

    if (profile) {
      profiles.set(symbol, profile);
    }

    if (onProgress) {
      onProgress(i + 1, symbols.length);
    }

    // Rate limiting
    if (i < symbols.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return profiles;
}
