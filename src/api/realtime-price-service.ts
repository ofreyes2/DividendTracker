/**
 * Real-Time Price Service
 *
 * Fetches live/15-minute delayed price data from Polygon APIs
 * Used in conjunction with master dataset for complete stock info
 *
 * KEY: All data is keyed by symbol for proper merging
 */

const POLYGON_API_KEY = process.env.EXPO_PUBLIC_POLYGON_API_KEY;
const BASE_URL = "https://api.polygon.io";

export interface LivePriceData {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  previousClose: number;
  timestamp: number;
}

/**
 * Fetch live quote for a single symbol
 */
export async function fetchLiveQuote(symbol: string): Promise<LivePriceData | null> {
  try {
    const url = `${BASE_URL}/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        symbol: symbol.toUpperCase(),
        price: result.c,
        open: result.o,
        high: result.h,
        low: result.l,
        volume: result.v,
        previousClose: result.c, // Previous day data
        timestamp: Date.now(),
      };
    }
    return null;
  } catch (error) {
    console.warn(`[LivePrice] Failed to fetch quote for ${symbol}`);
    return null;
  }
}

/**
 * Batch fetch live quotes for multiple symbols
 * Returns a Map keyed by symbol for O(1) lookups
 */
export async function fetchLiveQuotesBatch(
  symbols: string[],
  onProgress?: (current: number, total: number, symbol: string) => void
): Promise<Map<string, LivePriceData>> {
  const results = new Map<string, LivePriceData>();

  // Polygon allows up to 5 requests per second on free tier
  const BATCH_SIZE = 5;
  const DELAY_BETWEEN_BATCHES = 1100; // Just over 1 second

  for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
    const batch = symbols.slice(i, i + BATCH_SIZE);

    // Fetch batch in parallel
    const promises = batch.map(symbol => fetchLiveQuote(symbol));
    const batchResults = await Promise.all(promises);

    // Store results keyed by symbol
    for (const result of batchResults) {
      if (result) {
        results.set(result.symbol, result);
      }
    }

    // Progress update
    if (onProgress) {
      onProgress(Math.min(i + BATCH_SIZE, symbols.length), symbols.length, batch[batch.length - 1]);
    }

    // Rate limiting between batches
    if (i + BATCH_SIZE < symbols.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }

  console.log(`[LivePrice] Fetched ${results.size}/${symbols.length} live quotes`);
  return results;
}

/**
 * Fetch intraday price data (minute bars)
 * Use for real-time updates during market hours
 */
export async function fetchIntradayPrices(symbol: string): Promise<LivePriceData | null> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const url = `${BASE_URL}/v2/aggs/ticker/${symbol}/range/1/minute/${today}/${today}?adjusted=true&sort=desc&limit=1&apiKey=${POLYGON_API_KEY}`;

    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        symbol: symbol.toUpperCase(),
        price: result.c,
        open: result.o,
        high: result.h,
        low: result.l,
        volume: result.v,
        previousClose: result.c,
        timestamp: result.t,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Create a price update subscription that periodically fetches prices
 * Returns cleanup function
 */
export function createPriceSubscription(
  symbols: string[],
  onUpdate: (prices: Map<string, LivePriceData>) => void,
  intervalMs: number = 60000 // Default 1 minute
): () => void {
  let isActive = true;

  const fetchPrices = async () => {
    if (!isActive) return;

    const prices = await fetchLiveQuotesBatch(symbols);
    if (isActive && prices.size > 0) {
      onUpdate(prices);
    }
  };

  // Initial fetch
  fetchPrices();

  // Set up interval
  const intervalId = setInterval(fetchPrices, intervalMs);

  // Return cleanup function
  return () => {
    isActive = false;
    clearInterval(intervalId);
  };
}
