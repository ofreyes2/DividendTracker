/**
 * Polygon.io API Service
 * Fetches real-time stock data, dividends, and technical indicators
 */

import type { DividendStock, TechnicalIndicators, PriceData, VolumeData } from "./comprehensive-stock-data";

const POLYGON_API_KEY = process.env.EXPO_PUBLIC_POLYGON_API_KEY;
const BASE_URL = "https://api.polygon.io";

interface PolygonDividend {
  cash_amount: number;
  declaration_date: string;
  ex_dividend_date: string;
  frequency: number;
  pay_date: string;
  record_date: string;
}

interface PolygonQuote {
  c: number; // close
  h: number; // high
  l: number; // low
  o: number; // open
  v: number; // volume
  vw: number; // volume weighted average price
}

interface PolygonTickerDetails {
  ticker: string;
  name: string;
  market: string;
  locale: string;
  primary_exchange: string;
  type: string;
  active: boolean;
  currency_name: string;
  cik: string;
  composite_figi: string;
  share_class_figi: string;
  market_cap: number;
  phone_number: string;
  address: {
    address1: string;
    city: string;
    state: string;
    postal_code: string;
  };
  description: string;
  sic_code: string;
  sic_description: string;
  ticker_root: string;
  homepage_url: string;
  total_employees: number;
  list_date: string;
  branding: {
    logo_url: string;
    icon_url: string;
  };
  share_class_shares_outstanding: number;
  weighted_shares_outstanding: number;
}

/**
 * Fetch dividends for a specific stock
 */
export async function fetchDividends(symbol: string): Promise<PolygonDividend[]> {
  try {
    const url = `${BASE_URL}/v3/reference/dividends?ticker=${symbol}&limit=10&apiKey=${POLYGON_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results) {
      return data.results;
    }

    console.warn(`No dividend data found for ${symbol}`);
    return [];
  } catch (error) {
    console.error(`Error fetching dividends for ${symbol}:`, error);
    return [];
  }
}

/**
 * Fetch stock quote (price, volume, etc.)
 */
export async function fetchQuote(symbol: string): Promise<PolygonQuote | null> {
  try {
    // Get previous day's close
    const url = `${BASE_URL}/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      return data.results[0];
    }

    console.warn(`No quote data found for ${symbol}`);
    return null;
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch ticker details (company name, sector, market cap, etc.)
 */
export async function fetchTickerDetails(symbol: string): Promise<PolygonTickerDetails | null> {
  try {
    const url = `${BASE_URL}/v3/reference/tickers/${symbol}?apiKey=${POLYGON_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results) {
      return data.results;
    }

    console.warn(`No ticker details found for ${symbol}`);
    return null;
  } catch (error) {
    console.error(`Error fetching ticker details for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch technical indicators (SMA)
 */
export async function fetchSMA(symbol: string, window: number = 50): Promise<number | null> {
  try {
    const url = `${BASE_URL}/v1/indicators/sma/${symbol}?timespan=day&adjusted=true&window=${window}&series_type=close&order=desc&limit=1&apiKey=${POLYGON_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.values && data.results.values.length > 0) {
      return data.results.values[0].value;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching SMA for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch RSI indicator
 */
export async function fetchRSI(symbol: string, window: number = 14): Promise<number | null> {
  try {
    const url = `${BASE_URL}/v1/indicators/rsi/${symbol}?timespan=day&adjusted=true&window=${window}&series_type=close&order=desc&limit=1&apiKey=${POLYGON_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.values && data.results.values.length > 0) {
      return data.results.values[0].value;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching RSI for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch MACD indicator
 */
export async function fetchMACD(symbol: string): Promise<{ value: number; signal: number; histogram: number } | null> {
  try {
    const url = `${BASE_URL}/v1/indicators/macd/${symbol}?timespan=day&adjusted=true&short_window=12&long_window=26&signal_window=9&series_type=close&order=desc&limit=1&apiKey=${POLYGON_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.values && data.results.values.length > 0) {
      const result = data.results.values[0];
      return {
        value: result.value || 0,
        signal: result.signal || 0,
        histogram: result.histogram || 0,
      };
    }

    return null;
  } catch (error) {
    console.error(`Error fetching MACD for ${symbol}:`, error);
    return null;
  }
}

/**
 * Convert Polygon dividend frequency to our format
 */
function convertFrequency(polygonFreq: number): "monthly" | "quarterly" | "semi-annual" | "annual" {
  switch (polygonFreq) {
    case 0:
      return "annual";
    case 1:
      return "annual";
    case 2:
      return "semi-annual";
    case 4:
      return "quarterly";
    case 12:
      return "monthly";
    default:
      return "quarterly";
  }
}

/**
 * Fetch complete stock data for a symbol
 */
export async function fetchCompleteStockData(symbol: string): Promise<DividendStock | null> {
  try {
    console.log(`Fetching complete data for ${symbol}...`);

    // Fetch all data in parallel
    const [dividends, quote, tickerDetails, rsi, sma50, sma200, macd] = await Promise.all([
      fetchDividends(symbol),
      fetchQuote(symbol),
      fetchTickerDetails(symbol),
      fetchRSI(symbol),
      fetchSMA(symbol, 50),
      fetchSMA(symbol, 200),
      fetchMACD(symbol),
    ]);

    if (!quote || !tickerDetails) {
      console.warn(`Missing essential data for ${symbol}, skipping`);
      return null;
    }

    // Get most recent dividend
    const latestDividend = dividends[0];
    if (!latestDividend) {
      console.warn(`No dividend data for ${symbol}, skipping`);
      return null;
    }

    // Calculate annual dividend
    const frequency = convertFrequency(latestDividend.frequency);
    const paymentsPerYear = latestDividend.frequency || 4;
    const annualDividend = latestDividend.cash_amount * paymentsPerYear;
    const dividendYield = (annualDividend / quote.c) * 100;

    // Calculate volume in millions
    const volumeInMillions = quote.v / 1000000;

    // Build technical indicators
    const technicals: TechnicalIndicators = {
      macd: macd || { value: 0, signal: 0, histogram: 0 },
      rsi: rsi || 50,
      pegRatio: 1.5, // Not available from free tier, using default
      movingAverage50: sma50 || quote.c,
      movingAverage200: sma200 || quote.c * 0.95,
    };

    // Determine sector from SIC description
    const sector = tickerDetails.sic_description || "Unknown";
    const industry = tickerDetails.sic_description || "Unknown";

    // Create the stock object
    const stock: DividendStock = {
      symbol: symbol,
      companyName: tickerDetails.name,
      sector: sector,
      industry: industry,
      indices: ["S&P 500"], // Could be enhanced with more data
      marketCap: tickerDetails.market_cap / 1000000000, // Convert to billions

      price: quote.c,
      priceData: {
        current: quote.c,
        dayHigh: quote.h,
        dayLow: quote.l,
        week52High: quote.h * 1.1, // Approximate
        week52Low: quote.l * 0.9, // Approximate
        change: quote.c - quote.o,
        changePercent: ((quote.c - quote.o) / quote.o) * 100,
      },

      volume: {
        current: volumeInMillions,
        average: volumeInMillions, // Approximate
      },

      dividendAmount: latestDividend.cash_amount,
      dividendYield: dividendYield,
      exDividendDate: latestDividend.ex_dividend_date,
      recordDate: latestDividend.record_date,
      paymentDate: latestDividend.pay_date,
      frequency: frequency,
      annualDividend: annualDividend,
      payoutRatio: 60, // Not available from free tier, using default
      dividendGrowth5Year: 3.0, // Not available from free tier, using default

      technicals: technicals,

      change: quote.c - quote.o,
      changePercent: ((quote.c - quote.o) / quote.o) * 100,
    };

    console.log(`Successfully fetched data for ${symbol}`);
    return stock;
  } catch (error) {
    console.warn(`Error fetching complete stock data for ${symbol}:`, error instanceof Error ? error.message : "Unknown error");
    return null;
  }
}

/**
 * Fetch multiple stocks in batch with optimized rate limiting
 */
export async function fetchMultipleStocks(
  symbols: string[],
  onProgress?: (current: number, total: number, symbol: string) => void
): Promise<DividendStock[]> {
  console.log(`Fetching data for ${symbols.length} stocks...`);

  const stocks: DividendStock[] = [];

  // Fetch stocks with rate limiting - 5 requests per second
  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];

    if (onProgress) {
      onProgress(i + 1, symbols.length, symbol);
    }

    const stock = await fetchCompleteStockData(symbol);
    if (stock) {
      stocks.push(stock);
    }

    // Rate limiting: 5 requests per second = 200ms delay
    if (i < symbols.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log(`Successfully fetched ${stocks.length} out of ${symbols.length} stocks`);
  return stocks;
}

/**
 * Filter stocks to only include those with ex-dividend dates today or in the future
 */
export function filterFutureExDividendStocks(stocks: DividendStock[]): DividendStock[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to start of day for comparison

  return stocks.filter(stock => {
    const exDate = new Date(stock.exDividendDate);
    exDate.setHours(0, 0, 0, 0);

    // Only include stocks with ex-dividend date today or later
    return exDate >= today;
  });
}
