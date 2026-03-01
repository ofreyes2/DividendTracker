/**
 * Daily Data Fetcher
 *
 * Fetches all relatively static data from Polygon APIs once per day:
 * - Company info (ticker details)
 * - Dividend data
 * - 52-week high/low
 * - Average volume
 *
 * This data is normalized and merged into a master dataset keyed by symbol.
 */

import {
  type StaticStockData,
  type MasterDatasetMap,
  saveMasterDataset,
  loadMasterDataset,
  shouldRefreshMasterDataset,
} from "./master-dataset-service";
import { TICKERS_CSV } from "../data/tickers-data";

const POLYGON_API_KEY = process.env.EXPO_PUBLIC_POLYGON_API_KEY;
const BASE_URL = "https://api.polygon.io";

// Rate limiting configuration
const REQUESTS_PER_SECOND = 5; // Polygon free tier limit
const DELAY_BETWEEN_REQUESTS = 1000 / REQUESTS_PER_SECOND; // 200ms

interface PolygonTickerDetails {
  ticker: string;
  name: string;
  market_cap?: number;
  sic_description?: string;
  primary_exchange?: string;
}

interface PolygonDividend {
  cash_amount: number;
  ex_dividend_date: string;
  pay_date: string;
  record_date: string;
  frequency: number;
}

interface PolygonAggregates {
  h: number; // high
  l: number; // low
  v: number; // volume
  c: number; // close
}

/**
 * Parse CSV data into a map of ticker -> dividend data
 */
function parseCSVData(): Map<string, {
  dividendAmount: number;
  frequency: "monthly" | "quarterly" | "semi-annual" | "annual";
  exDividendDate: string;
  payDate: string;
  recordDate: string;
  annualDividend: number;
  dividendYield: number;
  payoutRatio: number;
}> {
  const lines = TICKERS_CSV.split("\n");
  const dataMap = new Map();

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(",");
    if (parts.length < 11) continue;

    const ticker = parts[0].trim();
    const dividendAmount = parseFloat(parts[1].replace(/[$\s]/g, "")) || 0;
    const frequencyNum = parseInt(parts[3]) || 4;
    const exDividendDate = parseCSVDate(parts[5]);
    const payDate = parseCSVDate(parts[6]);
    const recordDate = parseCSVDate(parts[7]);
    const annualDividend = parseFloat(parts[8].replace(/[$\s]/g, "")) || 0;
    const dividendYield = parseFloat(parts[9].replace(/%/g, "")) || 0;
    const payoutRatio = parseFloat(parts[10].replace(/%/g, "")) || 0;

    let frequency: "monthly" | "quarterly" | "semi-annual" | "annual";
    switch (frequencyNum) {
      case 12: frequency = "monthly"; break;
      case 4: frequency = "quarterly"; break;
      case 2: frequency = "semi-annual"; break;
      default: frequency = "annual"; break;
    }

    dataMap.set(ticker, {
      dividendAmount,
      frequency,
      exDividendDate,
      payDate,
      recordDate,
      annualDividend,
      dividendYield,
      payoutRatio,
    });
  }

  return dataMap;
}

/**
 * Parse date from CSV format (M/D/YYYY) to ISO format (YYYY-MM-DD)
 */
function parseCSVDate(dateStr: string): string {
  const cleaned = dateStr.trim();
  if (!cleaned) return "";

  const parts = cleaned.split("/");
  if (parts.length !== 3) return cleaned;

  const month = parts[0].padStart(2, "0");
  const day = parts[1].padStart(2, "0");
  const year = parts[2];

  return `${year}-${month}-${day}`;
}

/**
 * Fetch ticker details from Polygon
 */
async function fetchTickerDetails(symbol: string): Promise<PolygonTickerDetails | null> {
  try {
    const url = `${BASE_URL}/v3/reference/tickers/${symbol}?apiKey=${POLYGON_API_KEY}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await response.json();

    if (data.status === "OK" && data.results) {
      return data.results;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch dividend data from Polygon
 */
async function fetchDividendData(symbol: string): Promise<PolygonDividend | null> {
  try {
    const url = `${BASE_URL}/v3/reference/dividends?ticker=${symbol}&limit=1&apiKey=${POLYGON_API_KEY}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      return data.results[0];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch 52-week high/low and average volume from historical data
 */
async function fetch52WeekData(symbol: string): Promise<{
  week52High: number;
  week52Low: number;
  averageVolume: number;
} | null> {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const fromDate = oneYearAgo.toISOString().split("T")[0];
    const toDate = new Date().toISOString().split("T")[0];

    const url = `${BASE_URL}/v2/aggs/ticker/${symbol}/range/1/day/${fromDate}/${toDate}?adjusted=true&sort=asc&limit=365&apiKey=${POLYGON_API_KEY}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const results: PolygonAggregates[] = data.results;

      const highs = results.map(r => r.h);
      const lows = results.map(r => r.l);
      const volumes = results.map(r => r.v);

      const week52High = Math.max(...highs);
      const week52Low = Math.min(...lows);
      const averageVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length / 1000000; // Convert to millions

      return { week52High, week52Low, averageVolume };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Convert Polygon frequency to our format
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
 * Fetch all static data for a single symbol
 * Combines data from multiple Polygon APIs
 */
async function fetchStaticDataForSymbol(
  symbol: string,
  csvData: Map<string, any>
): Promise<StaticStockData | null> {
  // Get CSV data first (it's our most reliable source for dividend info)
  const csvInfo = csvData.get(symbol);

  // Fetch additional data from Polygon in parallel
  const [tickerDetails, polygonDividend, weekData] = await Promise.all([
    fetchTickerDetails(symbol),
    fetchDividendData(symbol),
    fetch52WeekData(symbol),
  ]);

  // If we have neither CSV nor Polygon data, skip this symbol
  if (!csvInfo && !polygonDividend) {
    return null;
  }

  // Merge data with CSV taking priority for dividend info
  const staticData: StaticStockData = {
    symbol: symbol.toUpperCase(),
    companyName: tickerDetails?.name || symbol,
    sector: tickerDetails?.sic_description || "Unknown",
    industry: tickerDetails?.sic_description || "Unknown",
    indices: [], // Would need separate API call
    marketCap: (tickerDetails?.market_cap || 0) / 1000000000, // Convert to billions

    // Dividend data - prefer CSV, fallback to Polygon
    dividendAmount: csvInfo?.dividendAmount ?? polygonDividend?.cash_amount ?? 0,
    dividendYield: csvInfo?.dividendYield ?? 0,
    exDividendDate: csvInfo?.exDividendDate ?? polygonDividend?.ex_dividend_date ?? "",
    recordDate: csvInfo?.recordDate ?? polygonDividend?.record_date ?? "",
    paymentDate: csvInfo?.payDate ?? polygonDividend?.pay_date ?? "",
    frequency: csvInfo?.frequency ?? convertFrequency(polygonDividend?.frequency || 4),
    annualDividend: csvInfo?.annualDividend ?? (polygonDividend?.cash_amount || 0) * (polygonDividend?.frequency || 4),
    payoutRatio: csvInfo?.payoutRatio ?? 0,
    dividendGrowth5Year: 0, // Would need historical dividend data

    // 52-week data from Polygon
    week52High: weekData?.week52High ?? 0,
    week52Low: weekData?.week52Low ?? 0,
    averageVolume: weekData?.averageVolume ?? 0,
  };

  return staticData;
}

/**
 * Build master dataset from all sources
 * Fetches static data for all tickers and saves to file
 */
export async function buildMasterDataset(
  onProgress?: (current: number, total: number, symbol: string, phase: string) => void
): Promise<StaticStockData[]> {
  console.log("[DailyFetcher] Starting master dataset build...");

  // Parse CSV data first (instant)
  const csvData = parseCSVData();
  const allTickers = Array.from(csvData.keys());

  console.log(`[DailyFetcher] Found ${allTickers.length} tickers in CSV data`);

  // Filter to only future ex-dividend dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futureTickers = allTickers.filter(ticker => {
    const csvInfo = csvData.get(ticker);
    if (!csvInfo?.exDividendDate) return false;

    const exDate = new Date(csvInfo.exDividendDate);
    exDate.setHours(0, 0, 0, 0);
    return exDate >= today;
  });

  console.log(`[DailyFetcher] ${futureTickers.length} tickers have future ex-dividend dates`);

  const staticDataArray: StaticStockData[] = [];
  let successCount = 0;
  let failCount = 0;

  // Process tickers with rate limiting
  for (let i = 0; i < futureTickers.length; i++) {
    const symbol = futureTickers[i];

    if (onProgress) {
      onProgress(i + 1, futureTickers.length, symbol, "Fetching static data");
    }

    const staticData = await fetchStaticDataForSymbol(symbol, csvData);

    if (staticData) {
      staticDataArray.push(staticData);
      successCount++;
    } else {
      failCount++;
    }

    // Rate limiting
    if (i < futureTickers.length - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS * 3)); // 3 API calls per symbol
    }

    // Log progress every 100 tickers
    if ((i + 1) % 100 === 0) {
      console.log(`[DailyFetcher] Progress: ${i + 1}/${futureTickers.length} (${successCount} success, ${failCount} failed)`);
    }
  }

  console.log(`[DailyFetcher] Fetch complete: ${successCount} success, ${failCount} failed`);

  // Save to file
  await saveMasterDataset(staticDataArray, {
    version: "1.0.0",
    dataSource: "hybrid",
  });

  return staticDataArray;
}

/**
 * Quick build using only CSV data (no API calls)
 * Use this when you want instant load without waiting for API
 */
export async function buildMasterDatasetFromCSV(): Promise<StaticStockData[]> {
  console.log("[DailyFetcher] Building master dataset from CSV only...");

  const csvData = parseCSVData();
  const allTickers = Array.from(csvData.keys());

  // Filter to future ex-dividend dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const staticDataArray: StaticStockData[] = [];

  for (const ticker of allTickers) {
    const csvInfo = csvData.get(ticker);
    if (!csvInfo?.exDividendDate) continue;

    const exDate = new Date(csvInfo.exDividendDate);
    exDate.setHours(0, 0, 0, 0);

    if (exDate < today) continue;

    const staticData: StaticStockData = {
      symbol: ticker.toUpperCase(),
      companyName: ticker, // Will be updated with API data later
      sector: "Unknown",
      industry: "Unknown",
      indices: [],
      marketCap: 0,
      dividendAmount: csvInfo.dividendAmount,
      dividendYield: csvInfo.dividendYield,
      exDividendDate: csvInfo.exDividendDate,
      recordDate: csvInfo.recordDate,
      paymentDate: csvInfo.payDate,
      frequency: csvInfo.frequency,
      annualDividend: csvInfo.annualDividend,
      payoutRatio: csvInfo.payoutRatio,
      dividendGrowth5Year: 0,
      week52High: 0,
      week52Low: 0,
      averageVolume: 0,
    };

    staticDataArray.push(staticData);
  }

  console.log(`[DailyFetcher] Built ${staticDataArray.length} stocks from CSV`);

  // Save to file
  await saveMasterDataset(staticDataArray, {
    version: "1.0.0",
    dataSource: "csv",
  });

  return staticDataArray;
}

/**
 * Incrementally enrich master dataset with Polygon API data
 * Call this after initial CSV load to add company info, 52-week data, etc.
 */
export async function enrichMasterDataset(
  onProgress?: (current: number, total: number, symbol: string) => void
): Promise<void> {
  console.log("[DailyFetcher] Enriching master dataset with API data...");

  const masterData = await loadMasterDataset();
  if (!masterData) {
    console.error("[DailyFetcher] No master dataset to enrich");
    return;
  }

  const symbols = Array.from(masterData.keys());
  const enrichedData: StaticStockData[] = [];

  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    const existing = masterData.get(symbol)!;

    if (onProgress) {
      onProgress(i + 1, symbols.length, symbol);
    }

    // Fetch additional data from Polygon
    const [tickerDetails, weekData] = await Promise.all([
      existing.companyName === symbol ? fetchTickerDetails(symbol) : null,
      existing.week52High === 0 ? fetch52WeekData(symbol) : null,
    ]);

    const enriched: StaticStockData = {
      ...existing,
      companyName: tickerDetails?.name || existing.companyName,
      sector: tickerDetails?.sic_description || existing.sector,
      industry: tickerDetails?.sic_description || existing.industry,
      marketCap: tickerDetails?.market_cap
        ? tickerDetails.market_cap / 1000000000
        : existing.marketCap,
      week52High: weekData?.week52High ?? existing.week52High,
      week52Low: weekData?.week52Low ?? existing.week52Low,
      averageVolume: weekData?.averageVolume ?? existing.averageVolume,
    };

    enrichedData.push(enriched);

    // Rate limiting - only if we made API calls
    if (tickerDetails || weekData) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS * 2));
    }
  }

  // Save enriched data
  await saveMasterDataset(enrichedData, {
    version: "1.0.0",
    dataSource: "hybrid",
  });

  console.log(`[DailyFetcher] Enriched ${enrichedData.length} stocks`);
}

/**
 * Main entry point: Ensure master dataset exists and is up to date
 * Call this on app startup
 */
export async function ensureMasterDataset(
  onProgress?: (current: number, total: number, symbol: string, phase: string) => void
): Promise<MasterDatasetMap | null> {
  // Check if we need to refresh
  const needsRefresh = await shouldRefreshMasterDataset();

  if (!needsRefresh) {
    console.log("[DailyFetcher] Master dataset is up to date");
    return loadMasterDataset();
  }

  console.log("[DailyFetcher] Master dataset needs refresh");

  // Step 1: Quick build from CSV (instant)
  if (onProgress) {
    onProgress(0, 1, "", "Loading CSV data...");
  }
  await buildMasterDatasetFromCSV();

  // Step 2: Enrich with API data in background (can take time)
  // This runs async and doesn't block the app
  const enrichProgress = onProgress
    ? (current: number, total: number, symbol: string) => onProgress(current, total, symbol, "Enriching data...")
    : undefined;

  enrichMasterDataset(enrichProgress).catch(error => {
    console.error("[DailyFetcher] Background enrichment failed:", error);
  });

  // Return the CSV-based data immediately
  return loadMasterDataset();
}
