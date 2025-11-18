/**
 * AI Analysis Screen
 * AI-powered stock analysis and investment recommendations
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import {
  analyzeStocksInBulk,
  calculateStockSuggestions,
  type StockAnalysis,
  type AnalysisScenario,
} from "../api/ai-analysis";
import Animated, { FadeInDown } from "react-native-reanimated";
import { cn } from "../utils/cn";

type Props = NativeStackScreenProps<RootStackParamList, "AIAnalysis">;

export default function AIAnalysisScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { stocks, investmentAmount, targetDividend, selectedDay } = route.params;

  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analyses, setAnalyses] = useState<StockAnalysis[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<
    "bestBuys" | "highYield" | "lowRisk"
  >("bestBuys");
  const [scenarios, setScenarios] = useState<{
    bestBuys?: AnalysisScenario;
    highYield?: AnalysisScenario;
    lowRisk?: AnalysisScenario;
  }>({});
  const [smartSuggestions, setSmartSuggestions] = useState<{
    suggestions: Array<{
      stock: any;
      shares: number;
      investmentAmount: number;
      singlePayoutDividend: number;
      annualDividend: number;
    }>;
    totalSinglePayout: number;
    totalAnnualDividend: number;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (targetDividend && targetDividend > 0) {
      calculateSmartSuggestions();
    } else {
      analyzeStocks();
    }
  }, []);

  const calculateSmartSuggestions = async () => {
    setIsAnalyzing(true);
    try {
      const result = await calculateStockSuggestions(
        stocks,
        investmentAmount,
        targetDividend!,
        selectedDay
      );
      setSmartSuggestions(result);
    } catch (error) {
      console.error("Failed to calculate suggestions:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeStocks = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeStocksInBulk(stocks, investmentAmount);
      setAnalyses(result.analyses);
      setScenarios({
        bestBuys: result.bestBuysScenario,
        highYield: result.highYieldScenario,
        lowRisk: result.lowRiskScenario,
      });
    } catch (error) {
      console.error("Failed to analyze stocks:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRecommendationColor = (
    recommendation: StockAnalysis["recommendation"]
  ) => {
    switch (recommendation) {
      case "strong_buy":
        return "text-emerald-500";
      case "buy":
        return "text-green-500";
      case "hold":
        return "text-yellow-500";
      case "avoid":
        return "text-red-500";
      default:
        return "text-slate-400";
    }
  };

  const getRecommendationLabel = (
    recommendation: StockAnalysis["recommendation"]
  ) => {
    switch (recommendation) {
      case "strong_buy":
        return "Strong Buy";
      case "buy":
        return "Buy";
      case "hold":
        return "Hold";
      case "avoid":
        return "Avoid";
      default:
        return "N/A";
    }
  };

  const getRiskColor = (risk: StockAnalysis["riskLevel"]) => {
    switch (risk) {
      case "low":
        return "text-emerald-400";
      case "medium":
        return "text-yellow-400";
      case "high":
        return "text-red-400";
      default:
        return "text-slate-400";
    }
  };

  const currentScenario = scenarios[selectedScenario];

  return (
    <View className="flex-1 bg-[#0f172a]">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 16 }}
        className="px-6 pb-4 bg-[#1a2332] border-b border-slate-700"
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">AI Analysis</Text>
            <Text className="text-slate-400 text-sm mt-1">
              Powered by GPT-4o
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-slate-700 items-center justify-center active:bg-slate-600"
          >
            <Ionicons name="close" size={24} color="white" />
          </Pressable>
        </View>
      </View>

      {isAnalyzing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-white text-lg font-semibold mt-4">
            {targetDividend ? "Calculating optimal portfolio..." : `Analyzing ${stocks.length} stocks...`}
          </Text>
          <Text className="text-slate-400 text-sm mt-2">
            This may take a moment
          </Text>
        </View>
      ) : smartSuggestions ? (
        // Smart Suggestions View (when target dividend is set)
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
          <View className="p-4">
            {/* Result Message */}
            <View className="bg-blue-900/30 border border-blue-600 rounded-2xl p-4 mb-4">
              <View className="flex-row items-start">
                <Ionicons name="information-circle" size={24} color="#3b82f6" />
                <View className="flex-1 ml-3">
                  <Text className="text-white text-base font-semibold mb-2">
                    Portfolio Suggestion
                  </Text>
                  <Text className="text-slate-300 text-sm">
                    {smartSuggestions.message}
                  </Text>
                </View>
              </View>
            </View>

            {/* Summary Card - Daily Trading Focus */}
            <View className="bg-[#1e293b] rounded-2xl p-4 mb-4 border border-slate-700">
              <Text className="text-white text-lg font-bold mb-3">
                Daily Capture Strategy
              </Text>
              <View className="flex-row justify-between mb-2">
                <Text className="text-slate-400 text-sm">Total Investment</Text>
                <Text className="text-white text-base font-semibold">
                  ${smartSuggestions.suggestions.reduce((sum, s) => sum + s.investmentAmount, 0).toFixed(2)}
                </Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-slate-400 text-sm">Next Dividend Payment</Text>
                <Text className="text-emerald-400 text-xl font-bold">
                  ${smartSuggestions.totalSinglePayout.toFixed(2)}
                </Text>
              </View>
              <View className="bg-blue-900/30 rounded-lg p-2">
                <Text className="text-blue-300 text-xs text-center">
                  💡 Buy day before ex-date, collect dividend, sell next day
                </Text>
              </View>
            </View>

            {/* Suggested Stocks */}
            <Text className="text-white text-lg font-bold mb-3">
              Suggested Stocks ({smartSuggestions.suggestions.length})
            </Text>

            {smartSuggestions.suggestions.map((suggestion, index) => (
              <Animated.View
                key={suggestion.stock.symbol}
                entering={FadeInDown.delay(index * 100)}
              >
                <Pressable
                  onPress={() =>
                    navigation.navigate("StockDetail", { stock: suggestion.stock })
                  }
                  className="bg-[#1e293b] rounded-2xl p-4 mb-3 border border-slate-700"
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-white text-lg font-bold">
                        {suggestion.stock.symbol}
                      </Text>
                      <Text className="text-slate-400 text-sm">
                        {suggestion.stock.companyName}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-white text-xl font-bold">
                        ${suggestion.stock.price.toFixed(2)}
                      </Text>
                      <Text className="text-emerald-400 text-sm font-semibold">
                        {suggestion.stock.dividendYield.toFixed(2)}% yield
                      </Text>
                    </View>
                  </View>

                  <View className="bg-slate-800/50 rounded-xl p-3">
                    <View className="flex-row justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-slate-400 text-xs">Shares to Buy</Text>
                        <Text className="text-white text-base font-bold">
                          {suggestion.shares}
                        </Text>
                      </View>
                      <View className="flex-1 items-center">
                        <Text className="text-slate-400 text-xs">Investment</Text>
                        <Text className="text-white text-base font-semibold">
                          ${suggestion.investmentAmount.toFixed(2)}
                        </Text>
                      </View>
                      <View className="flex-1 items-end">
                        <Text className="text-slate-400 text-xs">This Payment</Text>
                        <Text className="text-emerald-400 text-base font-bold">
                          ${suggestion.singlePayoutDividend.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                    <View className="pt-2 border-t border-slate-700">
                      <View className="flex-row justify-between">
                        <Text className="text-slate-400 text-xs">Volume (Trading Safety)</Text>
                        <Text className="text-blue-400 text-sm font-bold">
                          {suggestion.stock.volume.current.toFixed(1)}M shares
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Scenario Selector */}
          <View className="p-4">
            <Text className="text-white text-lg font-semibold mb-3">
              Investment Scenarios
            </Text>
            <View className="flex-row space-x-2">
              <Pressable
                onPress={() => setSelectedScenario("bestBuys")}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl border",
                  selectedScenario === "bestBuys"
                    ? "bg-blue-600 border-blue-600"
                    : "bg-slate-800 border-slate-700"
                )}
              >
                <Text
                  className={cn(
                    "text-center text-sm font-semibold",
                    selectedScenario === "bestBuys"
                      ? "text-white"
                      : "text-slate-400"
                  )}
                >
                  Best Buys
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSelectedScenario("highYield")}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl border",
                  selectedScenario === "highYield"
                    ? "bg-blue-600 border-blue-600"
                    : "bg-slate-800 border-slate-700"
                )}
              >
                <Text
                  className={cn(
                    "text-center text-sm font-semibold",
                    selectedScenario === "highYield"
                      ? "text-white"
                      : "text-slate-400"
                  )}
                >
                  High Yield
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSelectedScenario("lowRisk")}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl border",
                  selectedScenario === "lowRisk"
                    ? "bg-blue-600 border-blue-600"
                    : "bg-slate-800 border-slate-700"
                )}
              >
                <Text
                  className={cn(
                    "text-center text-sm font-semibold",
                    selectedScenario === "lowRisk"
                      ? "text-white"
                      : "text-slate-400"
                  )}
                >
                  Low Risk
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Scenario Details */}
          {currentScenario && (
            <View className="px-4 mb-6">
              <Animated.View
                entering={FadeInDown}
                className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-2xl p-5 border border-blue-700/50"
              >
                <View className="flex-row items-start mb-3">
                  <Ionicons name="sparkles" size={24} color="#3b82f6" />
                  <View className="flex-1 ml-3">
                    <Text className="text-white text-xl font-bold mb-2">
                      {currentScenario.title}
                    </Text>
                    <Text className="text-slate-300 text-sm mb-3">
                      {currentScenario.description}
                    </Text>
                  </View>
                </View>
                <View className="flex-row justify-between pt-3 border-t border-slate-700">
                  <View>
                    <Text className="text-slate-400 text-xs mb-1">
                      Expected Return
                    </Text>
                    <Text className="text-emerald-400 text-lg font-bold">
                      {currentScenario.totalExpectedReturn.toFixed(2)}%
                    </Text>
                  </View>
                  <View className="items-end flex-1 ml-4">
                    <Text className="text-slate-400 text-xs mb-1">
                      Risk Assessment
                    </Text>
                    <Text className="text-slate-300 text-sm">
                      {currentScenario.riskAssessment}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            </View>
          )}

          {/* Top Picks for Selected Scenario */}
          {currentScenario && currentScenario.topPicks.length > 0 && (
            <View className="px-4 mb-6">
              <Text className="text-white text-lg font-semibold mb-3">
                Recommended Stocks
              </Text>
              {currentScenario.topPicks.map((analysis, index) => (
                <Animated.View
                  key={analysis.symbol}
                  entering={FadeInDown.delay(index * 100)}
                  className="bg-[#1e293b] rounded-2xl p-5 mb-4 border border-slate-700"
                >
                  {/* Stock Header */}
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-white text-xl font-bold">
                        {analysis.symbol}
                      </Text>
                      <Text className="text-slate-400 text-sm">
                        {analysis.companyName}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-slate-400 text-xs mb-1">
                        Score
                      </Text>
                      <Text className="text-emerald-400 text-2xl font-bold">
                        {analysis.score}
                      </Text>
                    </View>
                  </View>

                  {/* Recommendation Badge */}
                  <View className="flex-row items-center space-x-3 mb-3">
                    <View className="bg-slate-800/50 px-3 py-1.5 rounded-lg">
                      <Text
                        className={cn(
                          "text-sm font-semibold",
                          getRecommendationColor(analysis.recommendation)
                        )}
                      >
                        {getRecommendationLabel(analysis.recommendation)}
                      </Text>
                    </View>
                    <View className="bg-slate-800/50 px-3 py-1.5 rounded-lg">
                      <Text
                        className={cn(
                          "text-sm font-semibold capitalize",
                          getRiskColor(analysis.riskLevel)
                        )}
                      >
                        {analysis.riskLevel} Risk
                      </Text>
                    </View>
                    <View className="bg-slate-800/50 px-3 py-1.5 rounded-lg">
                      <Text className="text-slate-300 text-sm font-medium capitalize">
                        {analysis.timeframe}
                      </Text>
                    </View>
                  </View>

                  {/* Reasoning */}
                  <Text className="text-slate-300 text-sm mb-3 leading-5">
                    {analysis.reasoning}
                  </Text>

                  {/* Pros and Cons */}
                  <View className="bg-slate-800/50 rounded-xl p-4">
                    <Text className="text-emerald-400 text-xs font-semibold mb-2 uppercase tracking-wide">
                      Pros
                    </Text>
                    {analysis.pros.map((pro, i) => (
                      <View key={i} className="flex-row items-start mb-1">
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color="#10b981"
                        />
                        <Text className="text-slate-300 text-sm ml-2 flex-1">
                          {pro}
                        </Text>
                      </View>
                    ))}

                    <Text className="text-red-400 text-xs font-semibold mt-3 mb-2 uppercase tracking-wide">
                      Cons
                    </Text>
                    {analysis.cons.map((con, i) => (
                      <View key={i} className="flex-row items-start mb-1">
                        <Ionicons name="close-circle" size={16} color="#ef4444" />
                        <Text className="text-slate-300 text-sm ml-2 flex-1">
                          {con}
                        </Text>
                      </View>
                    ))}
                  </View>
                </Animated.View>
              ))}
            </View>
          )}

          {/* All Analyses */}
          <View className="px-4">
            <Text className="text-white text-lg font-semibold mb-3">
              All Stock Analyses ({analyses.length})
            </Text>
            {analyses.map((analysis, index) => (
              <View
                key={analysis.symbol}
                className="bg-[#1e293b] rounded-xl p-4 mb-3 border border-slate-700"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-white text-base font-bold">
                      {analysis.symbol}
                    </Text>
                    <Text
                      className={cn(
                        "text-sm font-semibold mt-1",
                        getRecommendationColor(analysis.recommendation)
                      )}
                    >
                      {getRecommendationLabel(analysis.recommendation)}
                    </Text>
                  </View>
                  <Text className="text-emerald-400 text-xl font-bold">
                    {analysis.score}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
