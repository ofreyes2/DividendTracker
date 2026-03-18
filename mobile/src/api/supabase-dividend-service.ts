/**
 * Supabase Dividend Service
 * Fetches dividend ticker data from Supabase database
 * Data is pre-fetched daily at 3 AM UTC via Edge Function + pg_cron
 */

import type { DividendStock } from "./comprehensive-stock-data";

const SUPABASE_URL = "https://mtunnqfzryxmiygywqxd.supabase.co";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

interface SupabaseDividendTicker {
  id: number;
  symbol: string;
  company_name: string;
  ex_dividend_date: string;
  dividend_amount: number;
  dividend_yield: number;
  frequency: string;
  market_cap: number;
  sector: string;
  price: number;
  last_updated: string;
  created_at: string;
}

/**
 * Convert Supabase dividend ticker to DividendStock format
 */
function convertToDividendStock(ticker: SupabaseDividendTicker): DividendStock {
  // Calculate annual dividend based on frequency
  const frequencyMultiplier: Record<string, number> = {
    monthly: 12,
    quarterly: 4,
    "semi-annual": 2,
    annual: 1,
  };

  const multiplier = frequencyMultiplier[ticker.frequency] || 4;
  const annualDividend = ticker.dividend_amount * multiplier;

  return {
    symbol: ticker.symbol,
    companyName: ticker.company_name,
    sector: ticker.sector || "Unknown",
    industry: "Unknown", // Supabase doesn't provide this
    indices: [], // Not provided by Supabase
    marketCap: ticker.market_cap / 1000000000, // Convert to billions

    price: ticker.price,
    priceData: {
      current: ticker.price,
      open: ticker.price,
      previousClose: ticker.price,
      dayHigh: ticker.price * 1.02,
      dayLow: ticker.price * 0.98,
      week52High: ticker.price * 1.2,
      week52Low: ticker.price * 0.8,
      change: 0,
      changePercent: 0,
    },

    volume: {
      current: 0,
      average: 0,
    },

    dividendAmount: ticker.dividend_amount,
    dividendYield: ticker.dividend_yield,
    exDividendDate: ticker.ex_dividend_date,
    recordDate: ticker.ex_dividend_date,
    paymentDate: ticker.ex_dividend_date,
    frequency: (ticker.frequency || "quarterly") as any,
    annualDividend,
    payoutRatio: 0,
    dividendGrowth5Year: 0,

    technicals: {
      macd: { value: 0, signal: 0, histogram: 0 },
      rsi: 50,
      pegRatio: 0,
      movingAverage50: ticker.price,
      movingAverage200: ticker.price,
    },

    change: 0,
    changePercent: 0,
  };
}

/**
 * Fetch dividend tickers from Supabase
 * Only returns stocks with ex-dividend dates today or in the future
 */
export async function fetchSupabaseDividendTickers(): Promise<DividendStock[]> {
  try {
    if (!SUPABASE_ANON_KEY) {
      console.warn("[Supabase] Missing EXPO_PUBLIC_SUPABASE_ANON_KEY in .env");
      return [];
    }

    // Get today's date in ISO format
    const today = new Date().toISOString().split("T")[0];

    // Query: Get all dividend tickers with ex-dividend date >= today, sorted by date
    const query = `select=*&ex_dividend_date=gte.${today}&order=ex_dividend_date.asc&limit=1000`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/dividend_tickers?${query}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[Supabase] Fetch failed: ${response.status}`);
      return [];
    }

    const tickers: SupabaseDividendTicker[] = await response.json();

    if (!Array.isArray(tickers)) {
      console.warn("[Supabase] Invalid response format");
      return [];
    }

    // Convert to DividendStock format
    const stocks = tickers.map(convertToDividendStock);

    console.log(`[Supabase] Loaded ${stocks.length} dividend stocks`);
    return stocks;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn("[Supabase] Timeout fetching dividend tickers");
    } else {
      console.error("[Supabase] Error fetching dividend tickers:", error);
    }
    return [];
  }
}

/**
 * Get the last time dividend data was updated in Supabase
 */
export async function getLastDividendUpdate(): Promise<Date | null> {
  try {
    if (!SUPABASE_ANON_KEY) {
      return null;
    }

    // Query: Get the most recent last_updated timestamp
    const query = `select=last_updated&order=last_updated.desc&limit=1`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/dividend_tickers?${query}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const [result] = await response.json();
    if (result?.last_updated) {
      return new Date(result.last_updated);
    }

    return null;
  } catch (error) {
    console.warn("[Supabase] Error getting last update:", error);
    return null;
  }
}

/**
 * Manually trigger the dividend fetch edge function
 * Useful for manual refresh button
 */
export async function triggerDividendFetch(): Promise<{ success: boolean; message: string }> {
  try {
    if (!SUPABASE_ANON_KEY) {
      return {
        success: false,
        message: "Missing Supabase credentials",
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/fetch-yahoo-dividends`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({}),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        message: `Function returned ${response.status}`,
      };
    }

    const result = await response.json();
    return {
      success: result.success ?? false,
      message: result.message || "Unknown response",
    };
  } catch (error) {
    console.error("[Supabase] Error triggering dividend fetch:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
