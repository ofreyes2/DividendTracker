/**
 * Scheduled Dividend Updater
 *
 * Automatically fetches fresh dividend data from Polygon.io at 3 AM daily.
 * Only fetches stocks with ex-dividend dates from today onwards.
 * Updates the local data store with current dividend information.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useStockDataStore } from "../state/stockDataStore";

const POLYGON_API_KEY = process.env.EXPO_PUBLIC_POLYGON_API_KEY;
const BASE_URL = "https://api.polygon.io";

// Storage keys
const LAST_SCHEDULED_UPDATE_KEY = "last_scheduled_dividend_update";
const SCHEDULED_UPDATE_HOUR = 3; // 3 AM local time

export interface UpcomingDividend {
  ticker: string;
  cash_amount: number;
  currency: string;
  declaration_date: string;
  ex_dividend_date: string;
  frequency: number;
  pay_date: string;
  record_date: string;
}

export interface DividendUpdateResult {
  success: boolean;
  dividendsFound: number;
  tickersUpdated: number;
  lastUpdateTime: number;
  error?: string;
}

/**
 * Fetch all upcoming dividends from Polygon.io
 * Gets dividends with ex-dividend dates from today onwards
 */
export async function fetchAllUpcomingDividends(
  onProgress?: (current: number, message: string) => void
): Promise<UpcomingDividend[]> {
  if (!POLYGON_API_KEY) {
    console.error("[ScheduledUpdate] No Polygon API key available");
    return [];
  }

  const allDividends: UpcomingDividend[] = [];

  // Get today's date in YYYY-MM-DD format
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Get date 90 days from now (to limit the query)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 90);
  const futureDateStr = futureDate.toISOString().split("T")[0];

  console.log(`[ScheduledUpdate] Fetching dividends from ${todayStr} to ${futureDateStr}`);

  if (onProgress) {
    onProgress(0, `Fetching dividends from ${todayStr}...`);
  }

  let cursor: string | null = null;
  let pageCount = 0;
  const maxPages = 50; // Safety limit

  try {
    do {
      // Build URL with pagination
      let url = `${BASE_URL}/v3/reference/dividends?ex_dividend_date.gte=${todayStr}&ex_dividend_date.lte=${futureDateStr}&limit=1000&apiKey=${POLYGON_API_KEY}`;

      if (cursor) {
        url += `&cursor=${cursor}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          console.warn("[ScheduledUpdate] Rate limited, waiting 60 seconds...");
          await new Promise(resolve => setTimeout(resolve, 60000));
          continue;
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === "OK" && data.results) {
        for (const div of data.results) {
          allDividends.push({
            ticker: div.ticker,
            cash_amount: div.cash_amount,
            currency: div.currency || "USD",
            declaration_date: div.declaration_date || "",
            ex_dividend_date: div.ex_dividend_date,
            frequency: div.frequency || 4,
            pay_date: div.pay_date || "",
            record_date: div.record_date || "",
          });
        }

        cursor = data.next_url ? new URL(data.next_url).searchParams.get("cursor") : null;
        pageCount++;

        if (onProgress) {
          onProgress(allDividends.length, `Found ${allDividends.length} upcoming dividends...`);
        }

        console.log(`[ScheduledUpdate] Page ${pageCount}: ${data.results.length} dividends (total: ${allDividends.length})`);

        // Small delay between pages to respect rate limits
        if (cursor) {
          await new Promise(resolve => setTimeout(resolve, 250));
        }
      } else {
        cursor = null;
      }
    } while (cursor && pageCount < maxPages);

    console.log(`[ScheduledUpdate] Fetched ${allDividends.length} total upcoming dividends`);
    return allDividends;

  } catch (error) {
    console.error("[ScheduledUpdate] Error fetching dividends:", error);
    return allDividends; // Return what we have
  }
}

/**
 * Fetch additional stock details for dividends (price, company info)
 */
export async function enrichDividendsWithStockData(
  dividends: UpcomingDividend[],
  onProgress?: (current: number, total: number, symbol: string) => void
): Promise<Map<string, any>> {
  const stockData = new Map<string, any>();

  // Get unique tickers
  const tickers = [...new Set(dividends.map(d => d.ticker))];

  console.log(`[ScheduledUpdate] Enriching ${tickers.length} unique tickers with stock data`);

  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i];

    if (onProgress) {
      onProgress(i + 1, tickers.length, ticker);
    }

    try {
      // Fetch quote data
      const quoteUrl = `${BASE_URL}/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`;
      const quoteController = new AbortController();
      const quoteTimeoutId = setTimeout(() => quoteController.abort(), 10000);
      const quoteResponse = await fetch(quoteUrl, { signal: quoteController.signal });
      clearTimeout(quoteTimeoutId);

      if (quoteResponse.ok) {
        const quoteData = await quoteResponse.json();
        if (quoteData.status === "OK" && quoteData.results?.[0]) {
          const quote = quoteData.results[0];
          stockData.set(ticker, {
            price: quote.c,
            open: quote.o,
            high: quote.h,
            low: quote.l,
            volume: quote.v,
            change: quote.c - quote.o,
            changePercent: ((quote.c - quote.o) / quote.o) * 100,
          });
        }
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.warn(`[ScheduledUpdate] Failed to fetch data for ${ticker}`);
    }
  }

  return stockData;
}

/**
 * Generate CSV content from dividend data
 */
export function generateCSVContent(
  dividends: UpcomingDividend[],
  stockData: Map<string, any>
): string {
  const header = "Ticker,Dividend Amount,Dividend Currency,Dividend Frequency,Dividend Type,Ex-Dividend Date,Pay Date,Record Date,Annual Dividend,Dividend Yield %,Payout Ratio %";

  const rows = dividends.map(div => {
    const stock = stockData.get(div.ticker);
    const price = stock?.price || 0;
    const annualDividend = div.cash_amount * div.frequency;
    const dividendYield = price > 0 ? ((annualDividend / price) * 100).toFixed(2) : "0.00";

    // Format date from YYYY-MM-DD to M/D/YYYY
    const formatDate = (dateStr: string) => {
      if (!dateStr) return "";
      const [year, month, day] = dateStr.split("-");
      return `${parseInt(month)}/${parseInt(day)}/${year}`;
    };

    return [
      div.ticker,
      `$${div.cash_amount.toFixed(2)} `,
      div.currency,
      div.frequency.toString(),
      "CD",
      formatDate(div.ex_dividend_date),
      formatDate(div.pay_date),
      formatDate(div.record_date),
      `$${annualDividend.toFixed(2)} `,
      `${dividendYield}%`,
      "0%", // Payout ratio not available from this API
    ].join(",");
  });

  return [header, ...rows].join("\n");
}

/**
 * Check if it's time for the scheduled update (3 AM)
 */
export async function shouldRunScheduledUpdate(): Promise<boolean> {
  const now = new Date();
  const currentHour = now.getHours();

  // Only run at 3 AM (between 3:00 and 3:59)
  if (currentHour !== SCHEDULED_UPDATE_HOUR) {
    return false;
  }

  // Check if we already ran today
  const lastUpdate = await AsyncStorage.getItem(LAST_SCHEDULED_UPDATE_KEY);

  if (lastUpdate) {
    const lastUpdateDate = new Date(parseInt(lastUpdate));
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // If last update was today, don't run again
    if (lastUpdateDate >= todayStart) {
      console.log("[ScheduledUpdate] Already ran today, skipping");
      return false;
    }
  }

  return true;
}

/**
 * Mark that we ran the scheduled update
 */
async function markScheduledUpdateComplete(): Promise<void> {
  await AsyncStorage.setItem(LAST_SCHEDULED_UPDATE_KEY, Date.now().toString());
}

/**
 * Get the last scheduled update time
 */
export async function getLastScheduledUpdateTime(): Promise<number | null> {
  const lastUpdate = await AsyncStorage.getItem(LAST_SCHEDULED_UPDATE_KEY);
  return lastUpdate ? parseInt(lastUpdate) : null;
}

/**
 * Get time until next scheduled update
 */
export function getTimeUntilNextUpdate(): { hours: number; minutes: number } {
  const now = new Date();
  const next3AM = new Date(now);

  // Set to 3 AM
  next3AM.setHours(SCHEDULED_UPDATE_HOUR, 0, 0, 0);

  // If it's already past 3 AM today, set to tomorrow
  if (now.getHours() >= SCHEDULED_UPDATE_HOUR) {
    next3AM.setDate(next3AM.getDate() + 1);
  }

  const diffMs = next3AM.getTime() - now.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes };
}

/**
 * Run the scheduled dividend update
 * Fetches fresh data from Polygon.io and updates the store
 */
export async function runScheduledDividendUpdate(
  onProgress?: (phase: string, current: number, total: number, message: string) => void
): Promise<DividendUpdateResult> {
  console.log("[ScheduledUpdate] Starting scheduled dividend update...");

  const startTime = Date.now();

  try {
    // Phase 1: Fetch all upcoming dividends
    if (onProgress) {
      onProgress("fetch", 0, 100, "Fetching upcoming dividends from Polygon.io...");
    }

    const dividends = await fetchAllUpcomingDividends((count, message) => {
      if (onProgress) {
        onProgress("fetch", count, 100, message);
      }
    });

    if (dividends.length === 0) {
      return {
        success: false,
        dividendsFound: 0,
        tickersUpdated: 0,
        lastUpdateTime: Date.now(),
        error: "No dividends found",
      };
    }

    console.log(`[ScheduledUpdate] Found ${dividends.length} upcoming dividends`);

    // Phase 2: Enrich with stock data
    if (onProgress) {
      onProgress("enrich", 0, dividends.length, "Fetching stock prices...");
    }

    const stockData = await enrichDividendsWithStockData(dividends, (current, total, symbol) => {
      if (onProgress) {
        onProgress("enrich", current, total, `Fetching ${symbol}...`);
      }
    });

    // Phase 3: Convert to DividendStock format and update store
    if (onProgress) {
      onProgress("update", 0, 1, "Updating local data store...");
    }

    const store = useStockDataStore.getState();
    const stocks = dividends.map(div => {
      const stock = stockData.get(div.ticker);
      const price = stock?.price || 100;
      const annualDividend = div.cash_amount * div.frequency;
      const dividendYield = price > 0 ? (annualDividend / price) * 100 : 0;

      return {
        symbol: div.ticker,
        companyName: div.ticker, // Will be enriched later if needed
        sector: "Unknown",
        industry: "Unknown",
        indices: [],
        marketCap: 0,
        price,
        priceData: {
          current: price,
          open: stock?.open || price,
          previousClose: price - (stock?.change || 0),
          dayHigh: stock?.high || price,
          dayLow: stock?.low || price,
          week52High: price * 1.2,
          week52Low: price * 0.8,
          change: stock?.change || 0,
          changePercent: stock?.changePercent || 0,
        },
        volume: {
          current: (stock?.volume || 0) / 1000000,
          average: (stock?.volume || 0) / 1000000,
        },
        dividendAmount: div.cash_amount,
        dividendYield,
        exDividendDate: div.ex_dividend_date,
        recordDate: div.record_date,
        paymentDate: div.pay_date,
        frequency: div.frequency === 12 ? "monthly" as const :
                   div.frequency === 4 ? "quarterly" as const :
                   div.frequency === 2 ? "semi-annual" as const : "annual" as const,
        annualDividend,
        payoutRatio: 0,
        dividendGrowth5Year: 0,
        technicals: {
          macd: { value: 0, signal: 0, histogram: 0 },
          rsi: 50,
          pegRatio: 1,
          movingAverage50: price,
          movingAverage200: price * 0.95,
        },
        change: stock?.change || 0,
        changePercent: stock?.changePercent || 0,
      };
    });

    // Update the store
    store.setStocks(stocks);

    // Mark update complete
    await markScheduledUpdateComplete();

    if (onProgress) {
      onProgress("complete", 1, 1, "Update complete!");
    }

    const result: DividendUpdateResult = {
      success: true,
      dividendsFound: dividends.length,
      tickersUpdated: stocks.length,
      lastUpdateTime: Date.now(),
    };

    console.log(`[ScheduledUpdate] Complete in ${(Date.now() - startTime) / 1000}s - ${stocks.length} stocks updated`);

    return result;

  } catch (error) {
    console.error("[ScheduledUpdate] Failed:", error);
    return {
      success: false,
      dividendsFound: 0,
      tickersUpdated: 0,
      lastUpdateTime: Date.now(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Force run the update (bypass time check)
 */
export async function forceRunDividendUpdate(
  onProgress?: (phase: string, current: number, total: number, message: string) => void
): Promise<DividendUpdateResult> {
  console.log("[ScheduledUpdate] Force running dividend update...");
  return runScheduledDividendUpdate(onProgress);
}

/**
 * Start the background scheduler
 * Checks every hour if it's time to run the update
 */
let schedulerInterval: ReturnType<typeof setInterval> | null = null;

export function startDividendUpdateScheduler(): void {
  if (schedulerInterval) {
    console.log("[ScheduledUpdate] Scheduler already running");
    return;
  }

  console.log("[ScheduledUpdate] Starting dividend update scheduler (runs at 3 AM daily)");

  // Check immediately on start
  checkAndRunUpdate();

  // Then check every hour
  schedulerInterval = setInterval(checkAndRunUpdate, 60 * 60 * 1000); // 1 hour
}

export function stopDividendUpdateScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[ScheduledUpdate] Scheduler stopped");
  }
}

async function checkAndRunUpdate(): Promise<void> {
  const shouldRun = await shouldRunScheduledUpdate();

  if (shouldRun) {
    console.log("[ScheduledUpdate] It's 3 AM - running scheduled update");
    await runScheduledDividendUpdate((phase, current, total, message) => {
      console.log(`[ScheduledUpdate] ${phase}: ${message} (${current}/${total})`);
    });
  } else {
    const { hours, minutes } = getTimeUntilNextUpdate();
    console.log(`[ScheduledUpdate] Next update in ${hours}h ${minutes}m`);
  }
}
