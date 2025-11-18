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
  const prompt = `Analyze this dividend stock for investment. IMPORTANT: Explain each data point in simple, layman terms that a novice investor can understand.

Company: ${stock.companyName} (${stock.symbol})
Sector: ${stock.sector}
Current Price: $${stock.price}
Dividend Yield: ${stock.dividendYield}%
Annual Dividend: $${stock.annualDividend}
Ex-Dividend Date: ${stock.exDividendDate}
Market Cap: $${stock.marketCap}B
Payment Frequency: ${stock.frequency}
Payout Ratio: ${stock.payoutRatio}%

Technical Indicators:
- RSI: ${stock.technicals.rsi}
- MACD: ${stock.technicals.macd.value.toFixed(2)}
- PEG Ratio: ${stock.technicals.pegRatio.toFixed(2)}
- 50-Day MA: $${stock.technicals.movingAverage50.toFixed(2)}
- 200-Day MA: $${stock.technicals.movingAverage200.toFixed(2)}

Investment Amount: $${investmentAmount}

Provide a detailed analysis in simple terms that explains:
1. Investment quality (score 0-100)
2. Recommendation (strong_buy, buy, hold, or avoid)
3. DETAILED reasoning that explains:
   - What dividend yield means and why this one is good/bad
   - What the payout ratio tells us about sustainability
   - What RSI means and what this stock's RSI tells us (under 30 = oversold/good buy, 30-70 = normal, over 70 = overbought/caution)
   - What MACD indicates about momentum (positive = bullish, negative = bearish)
   - What PEG ratio means (under 1 = undervalued, 1-2 = fairly valued, over 2 = overvalued)
   - How moving averages help identify trends
   - Whether technical indicators work together or contradict
4. Key pros (3-4 bullet points in plain language)
5. Key cons (2-3 bullet points in plain language)
6. Risk level (low, medium, high) with explanation
7. Best timeframe (short-term or long-term) with explanation

Format your response as JSON:
{
  "score": number,
  "recommendation": string,
  "reasoning": "detailed explanation in simple terms (200-300 words)",
  "pros": ["point 1", "point 2", "point 3", "point 4"],
  "cons": ["point 1", "point 2"],
  "riskLevel": string,
  "timeframe": string
}`;

  try {
    const response = await getOpenAITextResponse([
      {
        role: "system",
        content:
          "You are a financial analyst who specializes in explaining investment concepts to novice investors. Break down technical indicators in simple, easy-to-understand language. Explain how different data points work together to form a complete picture. Use analogies when helpful. IMPORTANT: Return ONLY valid JSON, no additional text or markdown formatting.",
      },
      { role: "user", content: prompt },
    ]);

    // Extract JSON from response - handle cases where AI adds markdown or extra text
    let jsonText = response.content.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith("```")) {
      const firstNewline = jsonText.indexOf("\n");
      const lastBackticks = jsonText.lastIndexOf("```");
      jsonText = jsonText.substring(firstNewline + 1, lastBackticks).trim();
    }

    // Find JSON object boundaries
    const jsonStart = jsonText.indexOf("{");
    const jsonEnd = jsonText.lastIndexOf("}") + 1;

    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      jsonText = jsonText.substring(jsonStart, jsonEnd);
    }

    const analysis = JSON.parse(jsonText);

    return {
      symbol: stock.symbol,
      companyName: stock.companyName,
      score: analysis.score || 50,
      recommendation: analysis.recommendation || "hold",
      reasoning: analysis.reasoning || "Analysis generated.",
      pros: analysis.pros || ["Dividend payments"],
      cons: analysis.cons || ["Standard market risks"],
      riskLevel: analysis.riskLevel || "medium",
      timeframe: analysis.timeframe || "long-term",
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

IMPORTANT: Respond ONLY with valid JSON, no other text. Format exactly as:
{
  "analyses": [
    {
      "symbol": "AAPL",
      "score": 85,
      "recommendation": "buy",
      "reasoning": "Strong tech leader with consistent dividends",
      "pros": ["Market leader", "Consistent dividends", "Strong balance sheet"],
      "cons": ["Lower yield than peers"],
      "riskLevel": "low",
      "timeframe": "long-term"
    }
  ],
  "scenarios": {
    "bestBuys": {
      "title": "Best Overall Buys",
      "description": "Top stocks balancing yield and stability",
      "topPicks": ["AAPL", "MSFT", "JNJ"],
      "expectedReturn": 4.5,
      "riskAssessment": "Moderate risk with strong fundamentals"
    },
    "highYield": {
      "title": "High Yield Strategy",
      "description": "Maximum dividend income focus",
      "topPicks": ["VZ", "T", "O"],
      "expectedReturn": 6.5,
      "riskAssessment": "Higher yields with increased risk"
    },
    "lowRisk": {
      "title": "Conservative Picks",
      "description": "Safest dividend payers",
      "topPicks": ["JNJ", "PG", "KO"],
      "expectedReturn": 3.0,
      "riskAssessment": "Low risk with stable returns"
    }
  }
}`;

  try {
    const response = await getOpenAITextResponse(
      [
        {
          role: "system",
          content:
            "You are an expert dividend investment analyst. Respond ONLY with valid JSON, no markdown formatting, no code blocks, no explanatory text. Only pure JSON.",
        },
        { role: "user", content: prompt },
      ],
      {
        maxTokens: 4096,
        responseFormat: "json"
      }
    );

    // Extract JSON from response - handle cases where AI adds markdown or extra text
    let jsonText = response.content.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith("```")) {
      const firstNewline = jsonText.indexOf("\n");
      const lastBackticks = jsonText.lastIndexOf("```");
      jsonText = jsonText.substring(firstNewline + 1, lastBackticks).trim();
    }

    // Find JSON object boundaries
    const jsonStart = jsonText.indexOf("{");
    const jsonEnd = jsonText.lastIndexOf("}") + 1;

    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      jsonText = jsonText.substring(jsonStart, jsonEnd);
    }

    let result;
    try {
      result = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("JSON Parse Error. Response snippet:", jsonText.substring(0, 1000));
      throw parseError;
    }

    // Map analyses to include company names
    const analyses: StockAnalysis[] = (result.analyses || []).map((a: any) => {
      const stock = stocksToAnalyze.find((s) => s.symbol === a.symbol);
      return {
        symbol: a.symbol,
        companyName: stock?.companyName || a.symbol,
        score: a.score || 50,
        recommendation: a.recommendation || "hold",
        reasoning: a.reasoning || "Analysis generated.",
        pros: a.pros || ["Dividend payments"],
        cons: a.cons || ["Market risks"],
        riskLevel: a.riskLevel || "medium",
        timeframe: a.timeframe || "long-term",
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

/**
 * Calculate stock suggestions based on investment amount, target dividend, and date
 */
export async function calculateStockSuggestions(
  stocks: DividendStock[],
  investmentAmount: number,
  targetDividendReturn: number,
  date?: string
): Promise<{
  suggestions: Array<{
    stock: DividendStock;
    shares: number;
    investmentAmount: number;
    singlePayoutDividend: number;
    annualDividend: number;
  }>;
  totalSinglePayout: number;
  totalAnnualDividend: number;
  message: string;
}> {
  // Filter stocks by date if provided (for daily dividend capture strategy)
  const filteredStocks = date
    ? stocks.filter((s) => s.exDividendDate === date)
    : stocks;

  if (filteredStocks.length === 0) {
    return {
      suggestions: [],
      totalSinglePayout: 0,
      totalAnnualDividend: 0,
      message: "No stocks found for the selected criteria.",
    };
  }

  // DAILY DIVIDEND CAPTURE STRATEGY
  // Calculate shares needed to get target dividend in ONE payment cycle
  const calculations = filteredStocks.map((stock) => {
    // Calculate shares needed for target dividend in ONE PAYMENT
    const sharesNeeded = Math.ceil(targetDividendReturn / stock.dividendAmount);
    const cost = sharesNeeded * stock.price;
    const singlePayoutDividend = sharesNeeded * stock.dividendAmount;
    const annualDividend = sharesNeeded * stock.annualDividend;

    // Calculate efficiency for daily trading
    const efficiency = singlePayoutDividend / cost; // Single payout per dollar invested

    // Risk factors for daily trading
    const volumeScore = stock.volume.current; // Higher volume = easier to exit
    const rsiScore = stock.technicals.rsi >= 30 && stock.technicals.rsi <= 70 ? 1 : 0.5; // Neutral RSI preferred
    const safetyScore = efficiency * volumeScore * rsiScore;

    return {
      stock,
      shares: sharesNeeded,
      investmentAmount: cost,
      singlePayoutDividend,
      annualDividend,
      efficiency,
      safetyScore,
      volumeScore,
    };
  });

  // Sort by safety score (best for daily trading)
  calculations.sort((a, b) => b.safetyScore - a.safetyScore);

  // Try to build a portfolio that meets the target with the investment amount
  const portfolio: typeof calculations = [];
  let remainingInvestment = investmentAmount;
  let totalSinglePayout = 0;
  let totalAnnual = 0;

  // Strategy 1: Try single stock if it can meet target within budget
  const perfectMatch = calculations.find(
    (c) => c.investmentAmount <= investmentAmount && c.singlePayoutDividend >= targetDividendReturn
  );

  if (perfectMatch) {
    return {
      suggestions: [{
        stock: perfectMatch.stock,
        shares: perfectMatch.shares,
        investmentAmount: perfectMatch.investmentAmount,
        singlePayoutDividend: perfectMatch.singlePayoutDividend,
        annualDividend: perfectMatch.annualDividend,
      }],
      totalSinglePayout: perfectMatch.singlePayoutDividend,
      totalAnnualDividend: perfectMatch.annualDividend,
      message: `Perfect! Buy ${perfectMatch.shares} shares of ${perfectMatch.stock.symbol} for $${perfectMatch.investmentAmount.toFixed(2)} to get $${perfectMatch.singlePayoutDividend.toFixed(2)} in the next dividend payment. Sell after ex-dividend date and repeat with another stock.`,
    };
  }

  // Strategy 2: Diversify across safest high-volume stocks for daily trading
  for (const calc of calculations) {
    if (remainingInvestment >= calc.stock.price) {
      // Calculate how many shares we can afford
      const affordableShares = Math.floor(remainingInvestment / calc.stock.price);
      const cost = affordableShares * calc.stock.price;
      const singlePayout = affordableShares * calc.stock.dividendAmount;
      const annual = affordableShares * calc.stock.annualDividend;

      if (affordableShares > 0) {
        portfolio.push({
          stock: calc.stock,
          shares: affordableShares,
          investmentAmount: cost,
          singlePayoutDividend: singlePayout,
          annualDividend: annual,
          efficiency: calc.efficiency,
          safetyScore: calc.safetyScore,
          volumeScore: calc.volumeScore,
        });

        remainingInvestment -= cost;
        totalSinglePayout += singlePayout;
        totalAnnual += annual;

        // Stop if we've met or exceeded the target for single payout
        if (totalSinglePayout >= targetDividendReturn) {
          break;
        }
      }
    }

    // Stop after 5 stocks for diversification
    if (portfolio.length >= 5) {
      break;
    }
  }

  const targetMet = totalSinglePayout >= targetDividendReturn;
  const message = targetMet
    ? `Great! This portfolio will generate $${totalSinglePayout.toFixed(2)} in the next dividend payment, meeting your target of $${targetDividendReturn.toFixed(2)}. Buy today, collect dividend on ex-date, then sell and rotate to tomorrow's opportunities.`
    : `This allocation will generate $${totalSinglePayout.toFixed(2)} in the next payment. To reach your daily target of $${targetDividendReturn.toFixed(2)}, you need $${(investmentAmount * (targetDividendReturn / totalSinglePayout)).toFixed(2)} invested, or find stocks with higher dividend amounts per share.`;

  return {
    suggestions: portfolio.map(p => ({
      stock: p.stock,
      shares: p.shares,
      investmentAmount: p.investmentAmount,
      singlePayoutDividend: p.singlePayoutDividend,
      annualDividend: p.annualDividend,
    })),
    totalSinglePayout,
    totalAnnualDividend: totalAnnual,
    message,
  };
}

