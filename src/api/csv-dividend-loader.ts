/**
 * CSV Dividend Loader
 * Loads dividend data from local CSV file, fetches all other data from Polygon.io API
 */

import type { DividendStock } from "./comprehensive-stock-data";
import {
  fetchQuote,
  fetchTickerDetails,
  fetchRSI,
  fetchSMA,
  fetchMACD
} from "./polygon-api";
import {
  parseTickerCSV,
  convertFrequency,
  cleanCurrencyValue,
  cleanPercentageValue,
  convertDateFormat,
  type TickerDividendData,
} from "../utils/csvParser";
import { TICKERS_CSV } from "../data/tickers-data";

const POLYGON_API_KEY = process.env.EXPO_PUBLIC_POLYGON_API_KEY;
const BASE_URL = "https://api.polygon.io";

// Map to store parsed CSV data (cache)
let csvDataCache: Map<string, TickerDividendData> | null = null;

/**
 * Load and parse the CSV file
 */
export async function loadCSVData(): Promise<Map<string, TickerDividendData>> {
  if (csvDataCache) {
    return csvDataCache;
  }

  try {
    // Use the imported CSV data
    const csvContent = TICKERS_CSV;

    const parsed = parseTickerCSV(csvContent);

    // Create a map for fast lookup
    const dataMap = new Map<string, TickerDividendData>();
    for (const row of parsed) {
      dataMap.set(row.ticker, row);
    }

    csvDataCache = dataMap;
    console.log(`Loaded ${dataMap.size} tickers from CSV`);

    return dataMap;
  } catch (error) {
    console.error("Failed to load CSV data:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return new Map();
  }
}

/**
 * Get all tickers from the CSV file
 */
export async function getTickersFromCSV(): Promise<string[]> {
  const csvData = await loadCSVData();
  return Array.from(csvData.keys());
}

/**
 * Create a DividendStock object from CSV dividend data and Polygon API data for everything else
 */
async function createStockFromCSV(
  csvData: TickerDividendData
): Promise<DividendStock | null> {
  try {
    // Get dividend data from CSV
    const dividendAmount = cleanCurrencyValue(csvData.dividendAmount);
    const annualDividend = cleanCurrencyValue(csvData.annualDividend);
    const dividendYield = cleanPercentageValue(csvData.dividendYield);
    const payoutRatio = cleanPercentageValue(csvData.payoutRatio);
    const frequency = convertFrequency(csvData.dividendFrequency);

    // Fetch ALL other data from Polygon.io API
    console.log(`Fetching market data for ${csvData.ticker}...`);

    // Fetch basic quote and company details
    const [quote, details] = await Promise.all([
      fetchQuote(csvData.ticker),
      fetchTickerDetails(csvData.ticker),
    ]);

    if (!quote || !details) {
      console.warn(`Missing essential API data for ${csvData.ticker}, skipping`);
      return null;
    }

    // Add small delay before technical indicators
    await new Promise(resolve => setTimeout(resolve, 200));

    // Fetch technical indicators from Polygon API
    const [rsi, sma50, sma200, macd] = await Promise.all([
      fetchRSI(csvData.ticker),
      fetchSMA(csvData.ticker, 50),
      fetchSMA(csvData.ticker, 200),
      fetchMACD(csvData.ticker),
    ]);

    // Add small delay before historical data
    await new Promise(resolve => setTimeout(resolve, 200));

    // Fetch 52-week high/low from historical data
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearAgoStr = oneYearAgo.toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];

    let week52High = quote.h * 1.1; // Default fallback
    let week52Low = quote.l * 0.9; // Default fallback

    try {
      const histUrl = `${BASE_URL}/v2/aggs/ticker/${csvData.ticker}/range/1/day/${oneYearAgoStr}/${today}?adjusted=true&sort=asc&limit=365&apiKey=${POLYGON_API_KEY}`;
      const histResponse = await fetch(histUrl, { signal: AbortSignal.timeout(10000) });
      const histData = await histResponse.json();

      if (histData.status === "OK" && histData.results && histData.results.length > 0) {
        const highs = histData.results.map((r: any) => r.h);
        const lows = histData.results.map((r: any) => r.l);
        week52High = Math.max(...highs);
        week52Low = Math.min(...lows);
      }
    } catch (error) {
      console.warn(`Could not fetch 52-week range for ${csvData.ticker}, using estimate`);
    }

    // Price data from Polygon quote API
    const price = quote.c;
    const dayHigh = quote.h;
    const dayLow = quote.l;
    const volume = quote.v;

    // Company details from Polygon API
    const companyName = details.name;
    const sector = details.sic_description || "Unknown";
    const industry = details.sic_description || "Unknown";
    const marketCap = details.market_cap ? details.market_cap / 1_000_000_000 : 0;

    return {
      symbol: csvData.ticker,
      companyName,
      sector,
      industry,
      indices: [], // Could be enhanced
      marketCap,
      price,
      priceData: {
        current: price,
        open: quote.o,
        previousClose: quote.c - (quote.c - quote.o),
        dayHigh,
        dayLow,
        week52High,
        week52Low,
        change: quote.c - quote.o,
        changePercent: ((quote.c - quote.o) / quote.o) * 100,
      },
      volume: {
        current: volume / 1_000_000,
        average: volume / 1_000_000,
      },
      // Dividend data from CSV
      dividendAmount,
      dividendYield,
      exDividendDate: convertDateFormat(csvData.exDividendDate),
      recordDate: convertDateFormat(csvData.recordDate),
      paymentDate: convertDateFormat(csvData.payDate),
      frequency,
      annualDividend,
      payoutRatio,
      dividendGrowth5Year: 5,
      // Technical indicators from Polygon API
      technicals: {
        macd: macd || { value: 0, signal: 0, histogram: 0 },
        rsi: rsi || 50,
        pegRatio: 1,
        movingAverage50: sma50 || price,
        movingAverage200: sma200 || price * 0.95,
      },
      change: quote.c - quote.o,
      changePercent: ((quote.c - quote.o) / quote.o) * 100,
    };
  } catch (error) {
    console.error(`Error creating stock from CSV for ${csvData.ticker}:`, error);
    return null;
  }
}

/**
 * Load stocks from CSV - now always fetches all data from Polygon API except dividends
 * @param onProgress - Progress callback
 */
export async function loadStocksFromCSV(
  enrichWithPrices: boolean = true,
  onProgress?: (current: number, total: number, symbol: string) => void
): Promise<DividendStock[]> {
  const csvData = await loadCSVData();
  const tickers = Array.from(csvData.keys());
  const stocks: DividendStock[] = [];

  console.log(`Loading ${tickers.length} stocks from CSV (dividends from CSV, all other data from Polygon API)...`);

  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i];
    const tickerData = csvData.get(ticker);

    if (!tickerData) continue;

    if (onProgress && (i % 50 === 0 || i === tickers.length - 1)) {
      onProgress(i + 1, tickers.length, ticker);
    }

    // Always fetch from API (dividends from CSV, everything else from Polygon)
    try {
      const stock = await createStockFromCSV(tickerData);

      if (stock) {
        stocks.push(stock);
      } else {
        console.warn(`Skipped ${ticker} - missing API data`);
      }

      // Rate limiting - small delay between stocks
      if (i < tickers.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 600)); // 600ms delay for API rate limits
      }
    } catch (error) {
      console.warn(`Failed to load ${ticker}:`, error);
    }
  }

  console.log(`Successfully loaded ${stocks.length} stocks from CSV + Polygon API`);
  return stocks;
}

/**
 * Filter stocks to only those with future ex-dividend dates
 */
export function filterFutureStocks(stocks: DividendStock[]): DividendStock[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return stocks.filter((stock) => {
    const exDate = new Date(stock.exDividendDate);
    exDate.setHours(0, 0, 0, 0);
    return exDate >= today;
  });
}

/**
 * Load stocks from CSV and filter to future dates only
 */
export async function loadFutureStocksFromCSV(
  enrichWithPrices: boolean = true,
  onProgress?: (current: number, total: number, symbol: string) => void
): Promise<DividendStock[]> {
  const allStocks = await loadStocksFromCSV(enrichWithPrices, onProgress);
  const futureStocks = filterFutureStocks(allStocks);

  console.log(
    `Filtered from ${allStocks.length} to ${futureStocks.length} stocks with future ex-dividend dates`
  );

  return futureStocks;
}
