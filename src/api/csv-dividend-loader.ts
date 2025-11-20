/**
 * CSV Dividend Loader
 * Loads dividend data from local CSV file instead of API calls
 */

import type { DividendStock } from "./comprehensive-stock-data";
import { fetchQuote, fetchTickerDetails } from "./polygon-api";
import {
  parseTickerCSV,
  convertFrequency,
  cleanCurrencyValue,
  cleanPercentageValue,
  convertDateFormat,
  type TickerDividendData,
} from "../utils/csvParser";
import { TICKERS_CSV } from "../data/tickers-data";

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
 * Create a DividendStock object from CSV data and optional price data
 */
function createStockFromCSV(
  csvData: TickerDividendData,
  quote?: any,
  details?: any
): DividendStock {
  const dividendAmount = cleanCurrencyValue(csvData.dividendAmount);
  const annualDividend = cleanCurrencyValue(csvData.annualDividend);
  const dividendYield = cleanPercentageValue(csvData.dividendYield);
  const payoutRatio = cleanPercentageValue(csvData.payoutRatio);
  const frequency = convertFrequency(csvData.dividendFrequency);

  // Price data from quote or defaults
  const price = quote?.c || 0;
  const dayHigh = quote?.h || price;
  const dayLow = quote?.l || price;
  const volume = quote?.v || 0;

  // Company details from API or defaults
  const companyName = details?.name || csvData.ticker;
  const sector = details?.sic_description || "Unknown";
  const marketCap = details?.market_cap ? details.market_cap / 1_000_000_000 : 0;

  return {
    symbol: csvData.ticker,
    companyName,
    sector,
    industry: sector,
    indices: [],
    marketCap,
    price,
    priceData: {
      current: price,
      open: quote?.o || price,
      previousClose: quote ? quote.c - (quote.c - quote.o) : price,
      dayHigh,
      dayLow,
      week52High: price * 1.2,
      week52Low: price * 0.8,
      change: quote ? quote.c - quote.o : 0,
      changePercent: quote ? ((quote.c - quote.o) / quote.o) * 100 : 0,
    },
    volume: {
      current: volume / 1_000_000,
      average: volume / 1_000_000,
    },
    dividendAmount,
    dividendYield,
    exDividendDate: convertDateFormat(csvData.exDividendDate),
    recordDate: convertDateFormat(csvData.recordDate),
    paymentDate: convertDateFormat(csvData.payDate),
    frequency,
    annualDividend,
    payoutRatio,
    dividendGrowth5Year: 5,
    technicals: {
      macd: { value: 0, signal: 0, histogram: 0 },
      rsi: 50,
      pegRatio: 1,
      movingAverage50: price,
      movingAverage200: price,
    },
    change: quote ? quote.c - quote.o : 0,
    changePercent: quote ? ((quote.c - quote.o) / quote.o) * 100 : 0,
  };
}

/**
 * Load stocks from CSV with optional price enrichment
 * @param enrichWithPrices - If true, fetch current prices from Polygon API
 * @param onProgress - Progress callback
 */
export async function loadStocksFromCSV(
  enrichWithPrices: boolean = true,
  onProgress?: (current: number, total: number, symbol: string) => void
): Promise<DividendStock[]> {
  const csvData = await loadCSVData();
  const tickers = Array.from(csvData.keys());
  const stocks: DividendStock[] = [];

  console.log(`Loading ${tickers.length} stocks from CSV...`);

  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i];
    const tickerData = csvData.get(ticker);

    if (!tickerData) continue;

    if (onProgress && (i % 50 === 0 || i === tickers.length - 1)) {
      onProgress(i + 1, tickers.length, ticker);
    }

    if (enrichWithPrices) {
      // Fetch price data from Polygon API
      try {
        const [quote, details] = await Promise.all([
          fetchQuote(ticker),
          fetchTickerDetails(ticker),
        ]);

        const stock = createStockFromCSV(tickerData, quote, details);
        stocks.push(stock);

        // Rate limiting - 5 requests per second
        if (i < tickers.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      } catch (error) {
        console.warn(`Failed to enrich ${ticker}, using CSV data only:`, error);
        const stock = createStockFromCSV(tickerData);
        stocks.push(stock);
      }
    } else {
      // Use CSV data only (no API calls)
      const stock = createStockFromCSV(tickerData);
      stocks.push(stock);
    }
  }

  console.log(`Loaded ${stocks.length} stocks from CSV`);
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
