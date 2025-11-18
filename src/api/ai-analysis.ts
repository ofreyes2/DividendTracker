/**
 * AI Stock Analysis Service
 * Uses AI to analyze dividend stocks and provide investment recommendations
 */

import { getOpenAITextResponse } from "./chat-service";
import type { DividendStock } from "./comprehensive-stock-data";

export interface StockAnalysis {
  symbol: string;
  companyName: string;
  score: number; // 0-100
  recommendation: "strong_buy" | "buy" | "hold" | "avoid";
  reasoning: string;
  pros: string[];
  cons: string[];
  riskLevel: "low" | "medium" | "high";
  timeframe: string; // e.g., "short-term", "long-term"
}

export interface AnalysisScenario {
  title: string;
  description: string;
  topPicks: StockAnalysis[];
  totalExpectedReturn: number;
  riskAssessment: string;
}

/**
 * Analyze a single stock using AI
 */
export async function analyzeStock(
  stock: DividendStock,
  investmentAmount: number
): Promise<StockAnalysis> {
  const prompt = `Analyze this dividend stock for investment:

Company: ${stock.companyName} (${stock.symbol})
Sector: ${stock.sector}
Current Price: $${stock.price}
Dividend Yield: ${stock.dividendYield}%
Annual Dividend: $${stock.annualDividend}
Ex-Dividend Date: ${stock.exDividendDate}
Market Cap: $${stock.marketCap}B
Payment Frequency: ${stock.frequency}

Investment Amount: $${investmentAmount}

Provide a brief analysis (max 150 words) covering:
1. Investment quality (score 0-100)
2. Recommendation (strong_buy, buy, hold, or avoid)
3. Key pros (2-3 bullet points)
4. Key cons (1-2 bullet points)
5. Risk level (low, medium, high)
6. Best timeframe (short-term or long-term)

Format your response as JSON:
{
  "score": number,
  "recommendation": string,
  "reasoning": "brief explanation",
  "pros": ["point 1", "point 2"],
  "cons": ["point 1"],
  "riskLevel": string,
  "timeframe": string
}`;

  try {
    const response = await getOpenAITextResponse([
      {
        role: "system",
        content:
          "You are a financial analyst specializing in dividend investing. Provide concise, actionable investment analysis.",
      },
      { role: "user", content: prompt },
    ]);

    const analysis = JSON.parse(response.content);

    return {
      symbol: stock.symbol,
      companyName: stock.companyName,
      score: analysis.score,
      recommendation: analysis.recommendation,
      reasoning: analysis.reasoning,
      pros: analysis.pros,
      cons: analysis.cons,
      riskLevel: analysis.riskLevel,
      timeframe: analysis.timeframe,
    };
  } catch (error) {
    console.error(`Failed to analyze ${stock.symbol}:`, error);
    // Return default analysis if AI fails
    return {
      symbol: stock.symbol,
      companyName: stock.companyName,
      score: 50,
      recommendation: "hold",
      reasoning: "Analysis unavailable at this time.",
      pros: ["Consistent dividend payments"],
      cons: ["Unable to generate detailed analysis"],
      riskLevel: "medium",
      timeframe: "long-term",
    };
  }
}

/**
 * Analyze multiple stocks and create investment scenarios
 */
export async function analyzeStocksInBulk(
  stocks: DividendStock[],
  investmentAmount: number
): Promise<{
  analyses: StockAnalysis[];
  bestBuysScenario: AnalysisScenario;
  highYieldScenario: AnalysisScenario;
  lowRiskScenario: AnalysisScenario;
}> {
  // Limit to top 10 stocks for performance
  const stocksToAnalyze = stocks.slice(0, 10);

  // Create a comprehensive prompt for all stocks
  const stocksData = stocksToAnalyze
    .map(
      (stock) => `
${stock.symbol} - ${stock.companyName}
Sector: ${stock.sector}
Price: $${stock.price}
Yield: ${stock.dividendYield}%
Annual Dividend: $${stock.annualDividend}
Ex-Date: ${stock.exDividendDate}
Market Cap: $${stock.marketCap}B`
    )
    .join("\n");

  const prompt = `Analyze these ${stocksToAnalyze.length} dividend stocks for investment of $${investmentAmount}:

${stocksData}

For each stock, provide:
1. Score (0-100)
2. Recommendation (strong_buy, buy, hold, avoid)
3. Brief reasoning (20-30 words)
4. 2-3 pros
5. 1-2 cons
6. Risk level (low, medium, high)
7. Timeframe (short-term or long-term)

Then create 3 investment scenarios:
1. Best Buys: Top 3 stocks by overall score
2. High Yield: Top 3 by dividend yield with acceptable risk
3. Low Risk: Top 3 safest options

Format as JSON:
{
  "analyses": [
    {
      "symbol": "AAPL",
      "score": 85,
      "recommendation": "buy",
      "reasoning": "...",
      "pros": ["...", "..."],
      "cons": ["..."],
      "riskLevel": "low",
      "timeframe": "long-term"
    }
  ],
  "scenarios": {
    "bestBuys": {
      "title": "Best Overall Buys",
      "description": "...",
      "topPicks": ["AAPL", "MSFT", "JNJ"],
      "expectedReturn": 4.5,
      "riskAssessment": "..."
    },
    "highYield": { ... },
    "lowRisk": { ... }
  }
}`;

  try {
    const response = await getOpenAITextResponse(
      [
        {
          role: "system",
          content:
            "You are an expert dividend investment analyst. Provide detailed, data-driven analysis and actionable recommendations.",
        },
        { role: "user", content: prompt },
      ],
      { maxTokens: 4096 }
    );

    const result = JSON.parse(response.content);

    // Map analyses to include company names
    const analyses: StockAnalysis[] = result.analyses.map((a: any) => {
      const stock = stocksToAnalyze.find((s) => s.symbol === a.symbol);
      return {
        symbol: a.symbol,
        companyName: stock?.companyName || a.symbol,
        score: a.score,
        recommendation: a.recommendation,
        reasoning: a.reasoning,
        pros: a.pros,
        cons: a.cons,
        riskLevel: a.riskLevel,
        timeframe: a.timeframe,
      };
    });

    // Create scenario objects
    const createScenario = (scenarioData: any): AnalysisScenario => {
      const topPicks = scenarioData.topPicks.map((symbol: string) => {
        return analyses.find((a) => a.symbol === symbol)!;
      });

      return {
        title: scenarioData.title,
        description: scenarioData.description,
        topPicks: topPicks.filter(Boolean),
        totalExpectedReturn: scenarioData.expectedReturn,
        riskAssessment: scenarioData.riskAssessment,
      };
    };

    return {
      analyses,
      bestBuysScenario: createScenario(result.scenarios.bestBuys),
      highYieldScenario: createScenario(result.scenarios.highYield),
      lowRiskScenario: createScenario(result.scenarios.lowRisk),
    };
  } catch (error) {
    console.error("Failed to analyze stocks in bulk:", error);

    // Return simplified analyses sorted by yield
    const analyses: StockAnalysis[] = stocksToAnalyze.map((stock) => ({
      symbol: stock.symbol,
      companyName: stock.companyName,
      score: Math.min(100, stock.dividendYield * 15), // Simple scoring
      recommendation:
        stock.dividendYield > 5
          ? "buy"
          : stock.dividendYield > 3
            ? "hold"
            : "avoid",
      reasoning: `${stock.dividendYield}% dividend yield from established company.`,
      pros: [
        `${stock.dividendYield}% dividend yield`,
        `${stock.frequency} payments`,
      ],
      cons: ["Full analysis unavailable"],
      riskLevel: stock.dividendYield > 7 ? "high" : "medium",
      timeframe: "long-term",
    }));

    // Sort by score
    const sorted = [...analyses].sort((a, b) => b.score - a.score);

    return {
      analyses,
      bestBuysScenario: {
        title: "Top Rated Stocks",
        description: "Highest scoring stocks based on dividend yield",
        topPicks: sorted.slice(0, 3),
        totalExpectedReturn: sorted[0]?.score || 0,
        riskAssessment: "Moderate risk with established dividend payers",
      },
      highYieldScenario: {
        title: "High Yield Options",
        description: "Stocks with highest dividend yields",
        topPicks: analyses
          .sort(
            (a, b) =>
              (stocksToAnalyze.find((s) => s.symbol === b.symbol)
                ?.dividendYield || 0) -
              (stocksToAnalyze.find((s) => s.symbol === a.symbol)
                ?.dividendYield || 0)
          )
          .slice(0, 3),
        totalExpectedReturn: 6.5,
        riskAssessment: "Higher yields may indicate increased risk",
      },
      lowRiskScenario: {
        title: "Conservative Picks",
        description: "Large-cap established dividend payers",
        topPicks: analyses
          .filter((a) => a.riskLevel === "medium")
          .slice(0, 3),
        totalExpectedReturn: 3.5,
        riskAssessment: "Lower risk with stable, predictable returns",
      },
    };
  }
}

/**
 * Quick AI recommendation for a specific date's stocks
 */
export async function getQuickRecommendation(
  stocks: DividendStock[],
  investmentAmount: number,
  date: string
): Promise<string> {
  const stocksList = stocks
    .slice(0, 5)
    .map(
      (s) =>
        `${s.symbol} (${s.companyName}): ${s.dividendYield}% yield, $${s.price}`
    )
    .join("\n");

  const prompt = `Given $${investmentAmount} to invest, which of these stocks with ex-dividend date ${date} would you recommend and why? (Max 100 words)

${stocksList}

Provide a brief, actionable recommendation.`;

  try {
    const response = await getOpenAITextResponse([
      { role: "system", content: "You are a concise financial advisor." },
      { role: "user", content: prompt },
    ]);

    return response.content;
  } catch (error) {
    console.error("Failed to get quick recommendation:", error);
    return "Unable to generate recommendation at this time. Consider diversifying across multiple stocks with strong dividend histories.";
  }
}
