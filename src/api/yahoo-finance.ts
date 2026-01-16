/**
 * Yahoo Finance API Service (Free)
 *
 * Uses Yahoo Finance's free endpoints for:
 * - Stock quotes and prices
 * - Stock news and analysis
 * - Market data
 * - Historical data
 *
 * No API key required - completely free
 */

const YAHOO_BASE_URL = "https://query1.finance.yahoo.com";
const YAHOO_QUERY_URL = "https://query2.finance.yahoo.com";

export interface YahooQuote {
  symbol: string;
  shortName: string;
  longName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketOpen: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number;
  regularMarketPreviousClose: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  fiftyDayAverage: number;
  twoHundredDayAverage: number;
  marketCap: number;
  trailingPE: number;
  forwardPE: number;
  dividendYield: number;
  trailingAnnualDividendYield: number;
  dividendRate: number;
  exDividendDate: number;
  averageDailyVolume10Day: number;
  averageDailyVolume3Month: number;
}

export interface YahooNews {
  uuid: string;
  title: string;
  publisher: string;
  link: string;
  providerPublishTime: number;
  relatedTickers: string[];
  thumbnail?: {
    resolutions: Array<{
      url: string;
      width: number;
      height: number;
    }>;
  };
}

export interface YahooDividendInfo {
  symbol: string;
  exDividendDate: string;
  dividendRate: number;
  dividendYield: number;
  payoutRatio: number;
  fiveYearAvgDividendYield: number;
}

/**
 * Fetch quote data for multiple symbols
 */
export async function fetchYahooQuotes(symbols: string[]): Promise<Map<string, YahooQuote>> {
  const results = new Map<string, YahooQuote>();

  try {
    const symbolsStr = symbols.join(",");
    const url = `${YAHOO_QUERY_URL}/v7/finance/quote?symbols=${symbolsStr}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.warn("[YahooFinance] Quote fetch failed:", response.status);
      return results;
    }

    const data = await response.json();

    if (data.quoteResponse?.result) {
      for (const quote of data.quoteResponse.result) {
        results.set(quote.symbol, {
          symbol: quote.symbol,
          shortName: quote.shortName || quote.symbol,
          longName: quote.longName || quote.shortName || quote.symbol,
          regularMarketPrice: quote.regularMarketPrice || 0,
          regularMarketChange: quote.regularMarketChange || 0,
          regularMarketChangePercent: quote.regularMarketChangePercent || 0,
          regularMarketOpen: quote.regularMarketOpen || 0,
          regularMarketDayHigh: quote.regularMarketDayHigh || 0,
          regularMarketDayLow: quote.regularMarketDayLow || 0,
          regularMarketVolume: quote.regularMarketVolume || 0,
          regularMarketPreviousClose: quote.regularMarketPreviousClose || 0,
          fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
          fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
          fiftyDayAverage: quote.fiftyDayAverage || 0,
          twoHundredDayAverage: quote.twoHundredDayAverage || 0,
          marketCap: quote.marketCap || 0,
          trailingPE: quote.trailingPE || 0,
          forwardPE: quote.forwardPE || 0,
          dividendYield: quote.dividendYield || quote.trailingAnnualDividendYield || 0,
          trailingAnnualDividendYield: quote.trailingAnnualDividendYield || 0,
          dividendRate: quote.dividendRate || 0,
          exDividendDate: quote.exDividendDate || 0,
          averageDailyVolume10Day: quote.averageDailyVolume10Day || 0,
          averageDailyVolume3Month: quote.averageDailyVolume3Month || 0,
        });
      }
    }
  } catch (error) {
    console.warn("[YahooFinance] Error fetching quotes:", error);
  }

  return results;
}

/**
 * Fetch news for a specific stock
 */
export async function fetchYahooNews(symbol: string, count: number = 10): Promise<YahooNews[]> {
  try {
    const url = `${YAHOO_QUERY_URL}/v1/finance/search?q=${symbol}&newsCount=${count}&quotesCount=0&enableFuzzyQuery=false`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.warn("[YahooFinance] News fetch failed:", response.status);
      return [];
    }

    const data = await response.json();

    if (data.news) {
      return data.news.map((item: any) => ({
        uuid: item.uuid || "",
        title: item.title || "",
        publisher: item.publisher || "",
        link: item.link || "",
        providerPublishTime: item.providerPublishTime || 0,
        relatedTickers: item.relatedTickers || [],
        thumbnail: item.thumbnail,
      }));
    }

    return [];
  } catch (error) {
    console.warn("[YahooFinance] Error fetching news:", error);
    return [];
  }
}

/**
 * Fetch market news (general)
 */
export async function fetchMarketNews(count: number = 20): Promise<YahooNews[]> {
  try {
    const url = `${YAHOO_QUERY_URL}/v1/finance/search?q=dividend%20stocks&newsCount=${count}&quotesCount=0`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.news || [];
  } catch (error) {
    console.warn("[YahooFinance] Error fetching market news:", error);
    return [];
  }
}

/**
 * Fetch dividend calendar for today and future dates
 * Returns stocks with upcoming ex-dividend dates
 */
export async function fetchDividendCalendar(): Promise<YahooDividendInfo[]> {
  // Yahoo Finance doesn't have a direct dividend calendar API
  // We can use the screener endpoint or individual stock data
  const dividendStocks: YahooDividendInfo[] = [];

  try {
    // Use Yahoo Finance screener for dividend stocks
    const url = `${YAHOO_QUERY_URL}/v1/finance/screener/predefined/saved?scrIds=day_gainers&count=50`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return dividendStocks;
    }

    const data = await response.json();

    // Process results if available
    if (data.finance?.result?.[0]?.quotes) {
      for (const quote of data.finance.result[0].quotes) {
        if (quote.dividendYield && quote.dividendYield > 0) {
          dividendStocks.push({
            symbol: quote.symbol,
            exDividendDate: quote.exDividendDate
              ? new Date(quote.exDividendDate * 1000).toISOString().split("T")[0]
              : "",
            dividendRate: quote.dividendRate || 0,
            dividendYield: quote.dividendYield || 0,
            payoutRatio: quote.payoutRatio || 0,
            fiveYearAvgDividendYield: quote.fiveYearAvgDividendYield || 0,
          });
        }
      }
    }
  } catch (error) {
    console.warn("[YahooFinance] Error fetching dividend calendar:", error);
  }

  return dividendStocks;
}

/**
 * Get analyst recommendations for a stock
 */
export interface AnalystRecommendation {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

export async function fetchAnalystRecommendations(symbol: string): Promise<AnalystRecommendation[]> {
  try {
    const url = `${YAHOO_QUERY_URL}/v10/finance/quoteSummary/${symbol}?modules=recommendationTrend`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const trends = data.quoteSummary?.result?.[0]?.recommendationTrend?.trend;

    if (trends) {
      return trends.map((t: any) => ({
        period: t.period || "",
        strongBuy: t.strongBuy || 0,
        buy: t.buy || 0,
        hold: t.hold || 0,
        sell: t.sell || 0,
        strongSell: t.strongSell || 0,
      }));
    }

    return [];
  } catch (error) {
    console.warn("[YahooFinance] Error fetching analyst recommendations:", error);
    return [];
  }
}

/**
 * Get key statistics for a stock
 */
export interface KeyStatistics {
  enterpriseValue: number;
  forwardPE: number;
  profitMargins: number;
  floatShares: number;
  sharesOutstanding: number;
  sharesShort: number;
  shortRatio: number;
  beta: number;
  bookValue: number;
  priceToBook: number;
  earningsQuarterlyGrowth: number;
  trailingEps: number;
  forwardEps: number;
  pegRatio: number;
  lastDividendValue: number;
  lastDividendDate: string;
}

export async function fetchKeyStatistics(symbol: string): Promise<KeyStatistics | null> {
  try {
    const url = `${YAHOO_QUERY_URL}/v10/finance/quoteSummary/${symbol}?modules=defaultKeyStatistics,financialData`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const stats = data.quoteSummary?.result?.[0]?.defaultKeyStatistics;
    const financials = data.quoteSummary?.result?.[0]?.financialData;

    if (stats || financials) {
      return {
        enterpriseValue: stats?.enterpriseValue?.raw || 0,
        forwardPE: stats?.forwardPE?.raw || 0,
        profitMargins: financials?.profitMargins?.raw || 0,
        floatShares: stats?.floatShares?.raw || 0,
        sharesOutstanding: stats?.sharesOutstanding?.raw || 0,
        sharesShort: stats?.sharesShort?.raw || 0,
        shortRatio: stats?.shortRatio?.raw || 0,
        beta: stats?.beta?.raw || 0,
        bookValue: stats?.bookValue?.raw || 0,
        priceToBook: stats?.priceToBook?.raw || 0,
        earningsQuarterlyGrowth: financials?.earningsGrowth?.raw || 0,
        trailingEps: stats?.trailingEps?.raw || 0,
        forwardEps: stats?.forwardEps?.raw || 0,
        pegRatio: stats?.pegRatio?.raw || 0,
        lastDividendValue: stats?.lastDividendValue?.raw || 0,
        lastDividendDate: stats?.lastDividendDate?.fmt || "",
      };
    }

    return null;
  } catch (error) {
    console.warn("[YahooFinance] Error fetching key statistics:", error);
    return null;
  }
}

/**
 * Batch fetch quotes with progress callback
 */
export async function fetchYahooQuotesBatch(
  symbols: string[],
  batchSize: number = 50,
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, YahooQuote>> {
  const allQuotes = new Map<string, YahooQuote>();

  // Process in batches
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);

    if (onProgress) {
      onProgress(Math.min(i + batchSize, symbols.length), symbols.length);
    }

    const quotes = await fetchYahooQuotes(batch);
    quotes.forEach((quote, symbol) => allQuotes.set(symbol, quote));

    // Small delay between batches
    if (i + batchSize < symbols.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return allQuotes;
}
