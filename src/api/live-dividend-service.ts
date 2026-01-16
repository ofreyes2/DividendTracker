/**
 * Live Dividend Data Service
 *
 * Combines data from multiple sources:
 * - Polygon.io (primary - paid API)
 * - Yahoo Finance (free backup)
 * - CSV data (local fallback)
 *
 * Features:
 * - Background data refresh
 * - Progressive loading (show data as it becomes available)
 * - Real-time price updates
 */

import { fetchYahooQuotes, fetchYahooQuotesBatch, type YahooQuote } from "./yahoo-finance";
import { fetchQuote, fetchDividends, fetchTickerDetails, fetchRSI, fetchMACD, fetchSMA } from "./polygon-api";
import type { DividendStock } from "./comprehensive-stock-data";

const POLYGON_API_KEY = process.env.EXPO_PUBLIC_POLYGON_API_KEY;

export interface DataSourceStatus {
  name: string;
  status: "available" | "unavailable" | "rate_limited" | "checking";
  lastChecked: number;
  rateLimit?: {
    remaining: number;
    reset: number;
  };
}

export interface LiveDividendData {
  symbol: string;
  companyName: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  week52High: number;
  week52Low: number;
  averageVolume: number;
  marketCap: number;
  pe: number;
  dividendYield: number;
  dividendAmount: number;
  annualDividend: number;
  exDividendDate: string;
  paymentDate: string;
  frequency: "monthly" | "quarterly" | "semi-annual" | "annual";
  rsi?: number;
  macd?: { value: number; signal: number; histogram: number };
  sma50?: number;
  sma200?: number;
  sector: string;
  industry: string;
  dataSource: "polygon" | "yahoo" | "csv" | "mixed";
  lastUpdated: number;
}

// Track data source availability
const dataSourceStatus: Map<string, DataSourceStatus> = new Map([
  ["polygon", { name: "Polygon.io", status: "checking", lastChecked: 0 }],
  ["yahoo", { name: "Yahoo Finance", status: "checking", lastChecked: 0 }],
  ["csv", { name: "Local CSV", status: "available", lastChecked: Date.now() }],
]);

/**
 * Check if Polygon API is available
 */
async function checkPolygonAvailability(): Promise<boolean> {
  if (!POLYGON_API_KEY) {
    dataSourceStatus.set("polygon", {
      name: "Polygon.io",
      status: "unavailable",
      lastChecked: Date.now(),
    });
    return false;
  }

  try {
    const response = await fetch(
      `https://api.polygon.io/v3/reference/tickers/AAPL?apiKey=${POLYGON_API_KEY}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (response.ok) {
      dataSourceStatus.set("polygon", {
        name: "Polygon.io",
        status: "available",
        lastChecked: Date.now(),
      });
      return true;
    } else if (response.status === 429) {
      dataSourceStatus.set("polygon", {
        name: "Polygon.io",
        status: "rate_limited",
        lastChecked: Date.now(),
      });
      return false;
    }
  } catch {
    dataSourceStatus.set("polygon", {
      name: "Polygon.io",
      status: "unavailable",
      lastChecked: Date.now(),
    });
  }

  return false;
}

/**
 * Check if Yahoo Finance is available
 */
async function checkYahooAvailability(): Promise<boolean> {
  try {
    const quotes = await fetchYahooQuotes(["AAPL"]);

    if (quotes.size > 0) {
      dataSourceStatus.set("yahoo", {
        name: "Yahoo Finance",
        status: "available",
        lastChecked: Date.now(),
      });
      return true;
    }
  } catch {
    // Ignore errors
  }

  dataSourceStatus.set("yahoo", {
    name: "Yahoo Finance",
    status: "unavailable",
    lastChecked: Date.now(),
  });
  return false;
}

/**
 * Get current data source status
 */
export function getDataSourceStatus(): DataSourceStatus[] {
  return Array.from(dataSourceStatus.values());
}

/**
 * Fetch live data for a single symbol from all available sources
 */
export async function fetchLiveDividendData(
  symbol: string,
  usePolygon: boolean = true,
  useYahoo: boolean = true
): Promise<LiveDividendData | null> {
  let data: LiveDividendData | null = null;
  let dataSource: "polygon" | "yahoo" | "csv" | "mixed" = "csv";

  // Try Polygon first (most comprehensive)
  if (usePolygon && POLYGON_API_KEY) {
    try {
      const [quote, dividends, details, rsi, macd, sma50, sma200] = await Promise.all([
        fetchQuote(symbol),
        fetchDividends(symbol),
        fetchTickerDetails(symbol),
        fetchRSI(symbol),
        fetchMACD(symbol),
        fetchSMA(symbol, 50),
        fetchSMA(symbol, 200),
      ]);

      if (quote && dividends.length > 0) {
        const latestDiv = dividends[0];
        const paymentsPerYear = latestDiv.frequency || 4;
        const annualDividend = latestDiv.cash_amount * paymentsPerYear;

        data = {
          symbol,
          companyName: details?.name || symbol,
          price: quote.c,
          change: quote.c - quote.o,
          changePercent: ((quote.c - quote.o) / quote.o) * 100,
          open: quote.o,
          high: quote.h,
          low: quote.l,
          previousClose: quote.c - (quote.c - quote.o),
          volume: quote.v,
          week52High: 0, // Would need historical data
          week52Low: 0,
          averageVolume: quote.v,
          marketCap: details?.market_cap || 0,
          pe: 0,
          dividendYield: (annualDividend / quote.c) * 100,
          dividendAmount: latestDiv.cash_amount,
          annualDividend,
          exDividendDate: latestDiv.ex_dividend_date,
          paymentDate: latestDiv.pay_date,
          frequency: convertFrequency(latestDiv.frequency),
          rsi: rsi || undefined,
          macd: macd || undefined,
          sma50: sma50 || undefined,
          sma200: sma200 || undefined,
          sector: details?.sic_description || "Unknown",
          industry: details?.sic_description || "Unknown",
          dataSource: "polygon",
          lastUpdated: Date.now(),
        };

        dataSource = "polygon";
      }
    } catch (error) {
      console.warn(`[LiveData] Polygon fetch failed for ${symbol}:`, error);
    }
  }

  // Try Yahoo as fallback or supplement
  if (!data && useYahoo) {
    try {
      const quotes = await fetchYahooQuotes([symbol]);
      const quote = quotes.get(symbol);

      if (quote) {
        data = {
          symbol,
          companyName: quote.longName || quote.shortName || symbol,
          price: quote.regularMarketPrice,
          change: quote.regularMarketChange,
          changePercent: quote.regularMarketChangePercent,
          open: quote.regularMarketOpen,
          high: quote.regularMarketDayHigh,
          low: quote.regularMarketDayLow,
          previousClose: quote.regularMarketPreviousClose,
          volume: quote.regularMarketVolume,
          week52High: quote.fiftyTwoWeekHigh,
          week52Low: quote.fiftyTwoWeekLow,
          averageVolume: quote.averageDailyVolume3Month,
          marketCap: quote.marketCap,
          pe: quote.trailingPE,
          dividendYield: quote.dividendYield * 100 || 0,
          dividendAmount: quote.dividendRate / 4 || 0, // Assume quarterly
          annualDividend: quote.dividendRate || 0,
          exDividendDate: quote.exDividendDate
            ? new Date(quote.exDividendDate * 1000).toISOString().split("T")[0]
            : "",
          paymentDate: "",
          frequency: "quarterly",
          sma50: quote.fiftyDayAverage,
          sma200: quote.twoHundredDayAverage,
          sector: "Unknown",
          industry: "Unknown",
          dataSource: "yahoo",
          lastUpdated: Date.now(),
        };

        dataSource = "yahoo";
      }
    } catch (error) {
      console.warn(`[LiveData] Yahoo fetch failed for ${symbol}:`, error);
    }
  }

  // Merge data if we have both sources
  if (data && dataSource === "polygon" && useYahoo) {
    try {
      const yahooQuotes = await fetchYahooQuotes([symbol]);
      const yahooQuote = yahooQuotes.get(symbol);

      if (yahooQuote) {
        // Supplement with Yahoo data
        data.week52High = data.week52High || yahooQuote.fiftyTwoWeekHigh;
        data.week52Low = data.week52Low || yahooQuote.fiftyTwoWeekLow;
        data.pe = data.pe || yahooQuote.trailingPE;
        data.sma50 = data.sma50 || yahooQuote.fiftyDayAverage;
        data.sma200 = data.sma200 || yahooQuote.twoHundredDayAverage;
        data.dataSource = "mixed";
      }
    } catch {
      // Keep Polygon-only data
    }
  }

  return data;
}

/**
 * Fetch live data for multiple symbols with progress updates
 */
export async function fetchLiveDividendDataBatch(
  symbols: string[],
  onProgress?: (loaded: LiveDividendData[], current: number, total: number) => void,
  onStockLoaded?: (stock: LiveDividendData) => void
): Promise<LiveDividendData[]> {
  const results: LiveDividendData[] = [];

  // Check availability first
  const [polygonAvailable, yahooAvailable] = await Promise.all([
    checkPolygonAvailability(),
    checkYahooAvailability(),
  ]);

  console.log(`[LiveData] Sources - Polygon: ${polygonAvailable}, Yahoo: ${yahooAvailable}`);

  // If Yahoo is available, do a quick batch fetch first for all symbols
  let yahooData = new Map<string, YahooQuote>();
  if (yahooAvailable) {
    console.log(`[LiveData] Fetching Yahoo data for ${symbols.length} symbols...`);
    yahooData = await fetchYahooQuotesBatch(symbols, 50, (current, total) => {
      console.log(`[LiveData] Yahoo batch: ${current}/${total}`);
    });
    console.log(`[LiveData] Got Yahoo data for ${yahooData.size} symbols`);
  }

  // Process each symbol
  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];

    try {
      // Get Yahoo data if available
      const yahooQuote = yahooData.get(symbol);

      // If we have Yahoo data with dividend info, use it
      if (yahooQuote && yahooQuote.dividendYield > 0 && yahooQuote.exDividendDate) {
        const liveData: LiveDividendData = {
          symbol,
          companyName: yahooQuote.longName || yahooQuote.shortName || symbol,
          price: yahooQuote.regularMarketPrice,
          change: yahooQuote.regularMarketChange,
          changePercent: yahooQuote.regularMarketChangePercent,
          open: yahooQuote.regularMarketOpen,
          high: yahooQuote.regularMarketDayHigh,
          low: yahooQuote.regularMarketDayLow,
          previousClose: yahooQuote.regularMarketPreviousClose,
          volume: yahooQuote.regularMarketVolume,
          week52High: yahooQuote.fiftyTwoWeekHigh,
          week52Low: yahooQuote.fiftyTwoWeekLow,
          averageVolume: yahooQuote.averageDailyVolume3Month,
          marketCap: yahooQuote.marketCap,
          pe: yahooQuote.trailingPE,
          dividendYield: yahooQuote.dividendYield * 100,
          dividendAmount: yahooQuote.dividendRate / 4 || 0,
          annualDividend: yahooQuote.dividendRate || 0,
          exDividendDate: new Date(yahooQuote.exDividendDate * 1000).toISOString().split("T")[0],
          paymentDate: "",
          frequency: "quarterly",
          sma50: yahooQuote.fiftyDayAverage,
          sma200: yahooQuote.twoHundredDayAverage,
          sector: "Unknown",
          industry: "Unknown",
          dataSource: "yahoo",
          lastUpdated: Date.now(),
        };

        // Filter for future ex-dividend dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const exDate = new Date(liveData.exDividendDate);
        exDate.setHours(0, 0, 0, 0);

        if (exDate >= today) {
          results.push(liveData);

          // Notify that a stock was loaded
          if (onStockLoaded) {
            onStockLoaded(liveData);
          }

          // Progress update
          if (onProgress) {
            onProgress([...results], i + 1, symbols.length);
          }
        }
      }
      // If Polygon is available and we need more data, try it
      else if (polygonAvailable) {
        const liveData = await fetchLiveDividendData(symbol, true, false);

        if (liveData) {
          // Filter for future ex-dividend dates
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const exDate = new Date(liveData.exDividendDate);
          exDate.setHours(0, 0, 0, 0);

          if (exDate >= today) {
            results.push(liveData);

            if (onStockLoaded) {
              onStockLoaded(liveData);
            }

            if (onProgress) {
              onProgress([...results], i + 1, symbols.length);
            }
          }
        }

        // Rate limiting for Polygon
        await new Promise(resolve => setTimeout(resolve, 250));
      }
    } catch (error) {
      console.warn(`[LiveData] Failed to fetch ${symbol}:`, error);
    }
  }

  return results;
}

/**
 * Convert frequency number to string
 */
function convertFrequency(freq: number): "monthly" | "quarterly" | "semi-annual" | "annual" {
  switch (freq) {
    case 12: return "monthly";
    case 4: return "quarterly";
    case 2: return "semi-annual";
    default: return "annual";
  }
}

/**
 * Convert LiveDividendData to DividendStock format
 */
export function convertToDividendStock(data: LiveDividendData): DividendStock {
  return {
    symbol: data.symbol,
    companyName: data.companyName,
    sector: data.sector,
    industry: data.industry,
    indices: [],
    marketCap: data.marketCap / 1000000000, // Convert to billions
    price: data.price,
    priceData: {
      current: data.price,
      open: data.open,
      previousClose: data.previousClose,
      dayHigh: data.high,
      dayLow: data.low,
      week52High: data.week52High,
      week52Low: data.week52Low,
      change: data.change,
      changePercent: data.changePercent,
    },
    volume: {
      current: data.volume / 1000000, // Convert to millions
      average: data.averageVolume / 1000000,
    },
    dividendAmount: data.dividendAmount,
    dividendYield: data.dividendYield,
    exDividendDate: data.exDividendDate,
    recordDate: "",
    paymentDate: data.paymentDate,
    frequency: data.frequency,
    annualDividend: data.annualDividend,
    payoutRatio: 0,
    dividendGrowth5Year: 0,
    technicals: {
      macd: data.macd || { value: 0, signal: 0, histogram: 0 },
      rsi: data.rsi || 50,
      pegRatio: 0,
      movingAverage50: data.sma50 || data.price,
      movingAverage200: data.sma200 || data.price,
    },
    change: data.change,
    changePercent: data.changePercent,
  };
}
