/**
 * Master Dataset Service
 *
 * Architecture:
 * - Once per day: Call all Polygon APIs for relatively static data (company info, fundamentals, dividends)
 * - Normalize and merge into a single dataset, saved as a JSON file
 * - App loads this file on startup (cached)
 * - For real-time/15-min delayed data (prices, volume), call Polygon APIs directly
 *
 * KEY RULE: Every row is keyed by symbol/ticker, joins are ALWAYS done on symbol
 */

import * as FileSystem from "expo-file-system";
import type { DividendStock, TechnicalIndicators, PriceData, VolumeData } from "./comprehensive-stock-data";

// File paths for master dataset
const MASTER_DATASET_DIR = `${FileSystem.documentDirectory}master-data/`;
const MASTER_DATASET_FILE = `${MASTER_DATASET_DIR}master-dataset.json`;
const METADATA_FILE = `${MASTER_DATASET_DIR}metadata.json`;

// Types for the master dataset
export interface MasterDatasetMetadata {
  lastUpdated: number; // epoch timestamp
  tickerCount: number;
  version: string;
  dataSource: "polygon" | "csv" | "hybrid";
}

export interface StaticStockData {
  // Identifiers - KEYED BY SYMBOL
  symbol: string;
  companyName: string;
  sector: string;
  industry: string;
  indices: string[];
  marketCap: number; // in billions

  // Dividend information (relatively static, changes quarterly at most)
  dividendAmount: number;
  dividendYield: number; // Will be recalculated with live price
  exDividendDate: string;
  recordDate: string;
  paymentDate: string;
  frequency: "monthly" | "quarterly" | "semi-annual" | "annual";
  annualDividend: number;
  payoutRatio: number;
  dividendGrowth5Year: number;

  // 52-week range (updated daily)
  week52High: number;
  week52Low: number;

  // Average volume (updated daily)
  averageVolume: number; // in millions
}

// Map type for efficient symbol lookups
export type MasterDatasetMap = Map<string, StaticStockData>;

/**
 * Ensure the master data directory exists
 */
async function ensureDirectoryExists(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(MASTER_DATASET_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(MASTER_DATASET_DIR, { intermediates: true });
    console.log("[MasterDataset] Created master data directory");
  }
}

/**
 * Save master dataset to file
 */
export async function saveMasterDataset(
  data: StaticStockData[],
  metadata: Omit<MasterDatasetMetadata, "lastUpdated" | "tickerCount">
): Promise<void> {
  await ensureDirectoryExists();

  // Convert array to object keyed by symbol for efficient lookups
  const dataBySymbol: Record<string, StaticStockData> = {};
  for (const stock of data) {
    dataBySymbol[stock.symbol] = stock;
  }

  // Save dataset
  await FileSystem.writeAsStringAsync(
    MASTER_DATASET_FILE,
    JSON.stringify(dataBySymbol, null, 2)
  );

  // Save metadata
  const fullMetadata: MasterDatasetMetadata = {
    ...metadata,
    lastUpdated: Date.now(),
    tickerCount: data.length,
  };

  await FileSystem.writeAsStringAsync(
    METADATA_FILE,
    JSON.stringify(fullMetadata, null, 2)
  );

  console.log(`[MasterDataset] Saved ${data.length} stocks to master dataset`);
}

/**
 * Load master dataset from file
 * Returns a Map for O(1) symbol lookups
 */
export async function loadMasterDataset(): Promise<MasterDatasetMap | null> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(MASTER_DATASET_FILE);
    if (!fileInfo.exists) {
      console.log("[MasterDataset] No master dataset file found");
      return null;
    }

    const content = await FileSystem.readAsStringAsync(MASTER_DATASET_FILE);
    const dataBySymbol: Record<string, StaticStockData> = JSON.parse(content);

    // Convert to Map for efficient lookups
    const dataMap = new Map<string, StaticStockData>();
    for (const [symbol, data] of Object.entries(dataBySymbol)) {
      dataMap.set(symbol, data);
    }

    console.log(`[MasterDataset] Loaded ${dataMap.size} stocks from master dataset`);
    return dataMap;
  } catch (error) {
    console.error("[MasterDataset] Failed to load master dataset:", error);
    return null;
  }
}

/**
 * Load master dataset metadata
 */
export async function loadMasterDatasetMetadata(): Promise<MasterDatasetMetadata | null> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(METADATA_FILE);
    if (!fileInfo.exists) {
      return null;
    }

    const content = await FileSystem.readAsStringAsync(METADATA_FILE);
    return JSON.parse(content);
  } catch (error) {
    console.error("[MasterDataset] Failed to load metadata:", error);
    return null;
  }
}

/**
 * Check if master dataset needs refresh (more than 24 hours old)
 */
export async function shouldRefreshMasterDataset(): Promise<boolean> {
  const metadata = await loadMasterDatasetMetadata();

  if (!metadata) {
    return true; // No dataset, needs refresh
  }

  const hoursSinceUpdate = (Date.now() - metadata.lastUpdated) / (1000 * 60 * 60);
  return hoursSinceUpdate >= 24;
}

/**
 * Get static stock data by symbol from master dataset
 * KEY FUNCTION: Always joins on symbol, never by index
 */
export function getStaticDataBySymbol(
  masterData: MasterDatasetMap,
  symbol: string
): StaticStockData | undefined {
  return masterData.get(symbol.toUpperCase());
}

/**
 * Merge static data with live price data to create complete DividendStock
 * IMPORTANT: Joins on symbol, never by index
 */
export function mergeStaticAndLiveData(
  staticData: StaticStockData,
  liveData: {
    price: number;
    open: number;
    high: number;
    low: number;
    volume: number;
    previousClose: number;
  }
): DividendStock {
  const change = liveData.price - liveData.previousClose;
  const changePercent = liveData.previousClose > 0
    ? (change / liveData.previousClose) * 100
    : 0;

  // Recalculate dividend yield with live price
  const dividendYield = liveData.price > 0
    ? (staticData.annualDividend / liveData.price) * 100
    : staticData.dividendYield;

  const priceData: PriceData = {
    current: liveData.price,
    open: liveData.open,
    previousClose: liveData.previousClose,
    dayHigh: liveData.high,
    dayLow: liveData.low,
    week52High: staticData.week52High,
    week52Low: staticData.week52Low,
    change,
    changePercent,
  };

  const volumeData: VolumeData = {
    current: liveData.volume / 1000000, // Convert to millions
    average: staticData.averageVolume,
  };

  // Default technical indicators (can be enhanced later)
  const technicals: TechnicalIndicators = {
    macd: { value: 0, signal: 0, histogram: 0 },
    rsi: 50,
    pegRatio: 1.5,
    movingAverage50: liveData.price,
    movingAverage200: liveData.price * 0.95,
  };

  return {
    symbol: staticData.symbol,
    companyName: staticData.companyName,
    sector: staticData.sector,
    industry: staticData.industry,
    indices: staticData.indices,
    marketCap: staticData.marketCap,
    price: liveData.price,
    priceData,
    volume: volumeData,
    dividendAmount: staticData.dividendAmount,
    dividendYield,
    exDividendDate: staticData.exDividendDate,
    recordDate: staticData.recordDate,
    paymentDate: staticData.paymentDate,
    frequency: staticData.frequency,
    annualDividend: staticData.annualDividend,
    payoutRatio: staticData.payoutRatio,
    dividendGrowth5Year: staticData.dividendGrowth5Year,
    technicals,
    change,
    changePercent,
  };
}

/**
 * Batch merge multiple stocks
 * Uses symbol-based lookup for correctness
 */
export function batchMergeStaticAndLiveData(
  masterData: MasterDatasetMap,
  liveDataArray: Array<{
    symbol: string;
    price: number;
    open: number;
    high: number;
    low: number;
    volume: number;
    previousClose: number;
  }>
): DividendStock[] {
  const results: DividendStock[] = [];

  for (const liveData of liveDataArray) {
    const staticData = masterData.get(liveData.symbol.toUpperCase());

    if (staticData) {
      results.push(mergeStaticAndLiveData(staticData, liveData));
    } else {
      console.warn(`[MasterDataset] No static data found for symbol: ${liveData.symbol}`);
    }
  }

  return results;
}

/**
 * Delete master dataset files (for testing/reset)
 */
export async function deleteMasterDataset(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(MASTER_DATASET_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(MASTER_DATASET_DIR, { idempotent: true });
      console.log("[MasterDataset] Deleted master dataset directory");
    }
  } catch (error) {
    console.error("[MasterDataset] Failed to delete master dataset:", error);
  }
}
