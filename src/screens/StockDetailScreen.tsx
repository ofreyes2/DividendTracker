/**
 * Stock Detail Screen
 * Comprehensive analysis and detailed information for a single stock
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { DividendStock } from "../api/comprehensive-stock-data";
import { cn } from "../utils/cn";
import { analyzeStock } from "../api/ai-analysis";

interface StockDetailScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "StockDetail">;
  route: RouteProp<RootStackParamList, "StockDetail">;
}

export default function StockDetailScreen({
  navigation,
  route,
}: StockDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const { stock } = route.params;
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatBillions = (value: number) => {
    return `$${value.toFixed(1)}B`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleAIAnalysis = async () => {
    setLoadingAnalysis(true);
    try {
      const analysis = await analyzeStock(stock, 10000);
      setAiAnalysis(analysis);
    } catch (error) {
      console.error("Failed to analyze stock:", error);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const getTechnicalRating = () => {
    const { rsi, macd, pegRatio } = stock.technicals;
    let score = 0;
    let signals = [];

    // RSI Analysis
    if (rsi >= 70) {
      signals.push({ type: "warning", text: "RSI shows overbought conditions" });
    } else if (rsi <= 30) {
      signals.push({ type: "positive", text: "RSI shows oversold - potential buy" });
      score += 2;
    } else if (rsi >= 50 && rsi < 70) {
      signals.push({ type: "positive", text: "RSI shows bullish momentum" });
      score += 1;
    }

    // MACD Analysis
    if (macd.histogram > 0) {
      signals.push({ type: "positive", text: "MACD histogram is positive" });
      score += 1;
    } else {
      signals.push({ type: "warning", text: "MACD histogram is negative" });
    }

    // PEG Ratio Analysis
    if (pegRatio < 1) {
      signals.push({ type: "positive", text: "PEG ratio indicates undervaluation" });
      score += 2;
    } else if (pegRatio >= 1 && pegRatio < 2) {
      signals.push({ type: "neutral", text: "PEG ratio fairly valued" });
      score += 1;
    } else {
      signals.push({ type: "warning", text: "PEG ratio shows overvaluation" });
    }

    const rating = score >= 4 ? "Strong Buy" : score >= 3 ? "Buy" : score >= 2 ? "Hold" : "Caution";
    return { rating, signals, score };
  };

  const technicalRating = getTechnicalRating();

  return (
    <View className="flex-1 bg-[#0f172a]">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 16 }}
        className="px-6 pb-4 bg-[#1a2332] border-b border-slate-700"
      >
        <View className="flex-row items-center justify-between mb-4">
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-slate-700 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
          <Text className="text-white text-2xl font-bold">
            {stock.symbol}
          </Text>
          <View className="w-10" />
        </View>

        <Text className="text-white text-lg font-semibold mb-1">
          {stock.companyName}
        </Text>
        <Text className="text-slate-400 text-sm">
          {stock.sector} • {stock.industry}
        </Text>

        {/* Price Header */}
        <View className="flex-row items-end justify-between mt-4">
          <View>
            <Text className="text-white text-4xl font-bold">
              {formatCurrency(stock.price)}
            </Text>
            <Text
              className={cn(
                "text-lg font-semibold mt-1",
                stock.change >= 0 ? "text-emerald-400" : "text-red-400"
              )}
            >
              {stock.change >= 0 ? "+" : ""}
              {stock.change.toFixed(2)} ({stock.changePercent >= 0 ? "+" : ""}
              {stock.changePercent.toFixed(2)}%)
            </Text>
          </View>
          <Pressable
            onPress={handleAIAnalysis}
            disabled={loadingAnalysis}
            className="bg-blue-600 rounded-xl px-4 py-3 flex-row items-center"
          >
            {loadingAnalysis ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">
                  AI Analyze
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
        <View className="p-4">
          {/* Key Metrics */}
          <View className="bg-[#1e293b] rounded-2xl p-4 mb-4 border border-slate-700">
            <Text className="text-white text-lg font-bold mb-3">
              Key Metrics
            </Text>
            <View className="flex-row justify-between mb-3">
              <View className="flex-1">
                <Text className="text-slate-400 text-xs">Market Cap</Text>
                <Text className="text-white text-base font-semibold">
                  {formatBillions(stock.marketCap)}
                </Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-slate-400 text-xs">Dividend Yield</Text>
                <Text className="text-emerald-400 text-base font-bold">
                  {stock.dividendYield.toFixed(2)}%
                </Text>
              </View>
              <View className="flex-1 items-end">
                <Text className="text-slate-400 text-xs">Payout Ratio</Text>
                <Text className="text-white text-base font-semibold">
                  {stock.payoutRatio}%
                </Text>
              </View>
            </View>
            <View className="flex-row justify-between">
              <View className="flex-1">
                <Text className="text-slate-400 text-xs">Volume</Text>
                <Text className="text-white text-base font-semibold">
                  {stock.volume.current.toFixed(1)}M
                </Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-slate-400 text-xs">Avg Volume</Text>
                <Text className="text-white text-base font-semibold">
                  {stock.volume.average.toFixed(1)}M
                </Text>
              </View>
              <View className="flex-1 items-end">
                <Text className="text-slate-400 text-xs">5Y Div Growth</Text>
                <Text className="text-emerald-400 text-base font-semibold">
                  {stock.dividendGrowth5Year}%
                </Text>
              </View>
            </View>
          </View>

          {/* Price Range */}
          <View className="bg-[#1e293b] rounded-2xl p-4 mb-4 border border-slate-700">
            <Text className="text-white text-lg font-bold mb-3">
              Price Range
            </Text>
            <View className="mb-3">
              <View className="flex-row justify-between mb-1">
                <Text className="text-slate-400 text-sm">Day Range</Text>
                <Text className="text-white text-sm font-semibold">
                  {formatCurrency(stock.priceData.dayLow)} -{" "}
                  {formatCurrency(stock.priceData.dayHigh)}
                </Text>
              </View>
              <View className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <View
                  className="h-full bg-blue-500"
                  style={{
                    width: `${
                      ((stock.price - stock.priceData.dayLow) /
                        (stock.priceData.dayHigh - stock.priceData.dayLow)) *
                      100
                    }%`,
                  }}
                />
              </View>
            </View>
            <View>
              <View className="flex-row justify-between mb-1">
                <Text className="text-slate-400 text-sm">52-Week Range</Text>
                <Text className="text-white text-sm font-semibold">
                  {formatCurrency(stock.priceData.week52Low)} -{" "}
                  {formatCurrency(stock.priceData.week52High)}
                </Text>
              </View>
              <View className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <View
                  className="h-full bg-emerald-500"
                  style={{
                    width: `${
                      ((stock.price - stock.priceData.week52Low) /
                        (stock.priceData.week52High -
                          stock.priceData.week52Low)) *
                      100
                    }%`,
                  }}
                />
              </View>
            </View>
          </View>

          {/* Dividend Information */}
          <View className="bg-[#1e293b] rounded-2xl p-4 mb-4 border border-slate-700">
            <Text className="text-white text-lg font-bold mb-3">
              Dividend Information
            </Text>
            <View className="space-y-2">
              <View className="flex-row justify-between py-2 border-b border-slate-700">
                <Text className="text-slate-400 text-sm">
                  Dividend per Payment
                </Text>
                <Text className="text-white text-sm font-semibold">
                  {formatCurrency(stock.dividendAmount)}
                </Text>
              </View>
              <View className="flex-row justify-between py-2 border-b border-slate-700">
                <Text className="text-slate-400 text-sm">Annual Dividend</Text>
                <Text className="text-emerald-400 text-sm font-bold">
                  {formatCurrency(stock.annualDividend)}
                </Text>
              </View>
              <View className="flex-row justify-between py-2 border-b border-slate-700">
                <Text className="text-slate-400 text-sm">Frequency</Text>
                <Text className="text-white text-sm font-semibold capitalize">
                  {stock.frequency}
                </Text>
              </View>
              <View className="flex-row justify-between py-2 border-b border-slate-700">
                <Text className="text-slate-400 text-sm">Ex-Dividend Date</Text>
                <Text className="text-white text-sm font-semibold">
                  {formatDate(stock.exDividendDate)}
                </Text>
              </View>
              <View className="flex-row justify-between py-2 border-b border-slate-700">
                <Text className="text-slate-400 text-sm">Record Date</Text>
                <Text className="text-white text-sm font-semibold">
                  {formatDate(stock.recordDate)}
                </Text>
              </View>
              <View className="flex-row justify-between py-2">
                <Text className="text-slate-400 text-sm">Payment Date</Text>
                <Text className="text-white text-sm font-semibold">
                  {formatDate(stock.paymentDate)}
                </Text>
              </View>
            </View>
          </View>

          {/* Technical Analysis */}
          <View className="bg-[#1e293b] rounded-2xl p-4 mb-4 border border-slate-700">
            <Text className="text-white text-lg font-bold mb-3">
              Technical Analysis
            </Text>

            {/* Overall Rating */}
            <View className="bg-slate-800/50 rounded-xl p-3 mb-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-slate-400 text-sm">Overall Rating</Text>
                <View className="flex-row items-center">
                  <Ionicons name="star" size={18} color="#10b981" />
                  <Text
                    className={cn(
                      "text-base font-bold ml-1",
                      technicalRating.score >= 4
                        ? "text-emerald-400"
                        : technicalRating.score >= 2
                        ? "text-blue-400"
                        : "text-red-400"
                    )}
                  >
                    {technicalRating.rating}
                  </Text>
                </View>
              </View>
            </View>

            {/* Technical Indicators */}
            <View className="space-y-2">
              <View className="flex-row justify-between py-2 border-b border-slate-700">
                <Text className="text-slate-400 text-sm">RSI (14)</Text>
                <Text
                  className={cn(
                    "text-sm font-semibold",
                    stock.technicals.rsi >= 70
                      ? "text-red-400"
                      : stock.technicals.rsi >= 50
                      ? "text-emerald-400"
                      : stock.technicals.rsi >= 30
                      ? "text-blue-400"
                      : "text-red-400"
                  )}
                >
                  {stock.technicals.rsi}
                </Text>
              </View>
              <View className="flex-row justify-between py-2 border-b border-slate-700">
                <Text className="text-slate-400 text-sm">MACD</Text>
                <Text
                  className={cn(
                    "text-sm font-semibold",
                    stock.technicals.macd.value > 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  )}
                >
                  {stock.technicals.macd.value.toFixed(2)}
                </Text>
              </View>
              <View className="flex-row justify-between py-2 border-b border-slate-700">
                <Text className="text-slate-400 text-sm">PEG Ratio</Text>
                <Text
                  className={cn(
                    "text-sm font-semibold",
                    stock.technicals.pegRatio < 1
                      ? "text-emerald-400"
                      : stock.technicals.pegRatio < 2
                      ? "text-blue-400"
                      : "text-red-400"
                  )}
                >
                  {stock.technicals.pegRatio.toFixed(2)}
                </Text>
              </View>
              <View className="flex-row justify-between py-2 border-b border-slate-700">
                <Text className="text-slate-400 text-sm">50-Day MA</Text>
                <Text className="text-white text-sm font-semibold">
                  {formatCurrency(stock.technicals.movingAverage50)}
                </Text>
              </View>
              <View className="flex-row justify-between py-2">
                <Text className="text-slate-400 text-sm">200-Day MA</Text>
                <Text className="text-white text-sm font-semibold">
                  {formatCurrency(stock.technicals.movingAverage200)}
                </Text>
              </View>
            </View>

            {/* Technical Signals */}
            <View className="mt-3">
              <Text className="text-slate-400 text-xs mb-2">Key Signals</Text>
              {technicalRating.signals.map((signal, index) => (
                <View
                  key={index}
                  className="flex-row items-center mb-2"
                >
                  <Ionicons
                    name={
                      signal.type === "positive"
                        ? "arrow-up-circle"
                        : signal.type === "warning"
                        ? "warning"
                        : "information-circle"
                    }
                    size={16}
                    color={
                      signal.type === "positive"
                        ? "#10b981"
                        : signal.type === "warning"
                        ? "#ef4444"
                        : "#3b82f6"
                    }
                  />
                  <Text className="text-slate-300 text-xs ml-2 flex-1">
                    {signal.text}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Company Information */}
          <View className="bg-[#1e293b] rounded-2xl p-4 mb-4 border border-slate-700">
            <Text className="text-white text-lg font-bold mb-3">
              Company Information
            </Text>
            <View className="space-y-2">
              <View className="flex-row justify-between py-2 border-b border-slate-700">
                <Text className="text-slate-400 text-sm">Sector</Text>
                <Text className="text-white text-sm font-semibold">
                  {stock.sector}
                </Text>
              </View>
              <View className="flex-row justify-between py-2 border-b border-slate-700">
                <Text className="text-slate-400 text-sm">Industry</Text>
                <Text className="text-white text-sm font-semibold">
                  {stock.industry}
                </Text>
              </View>
              <View className="flex-row justify-between py-2">
                <Text className="text-slate-400 text-sm">Indices</Text>
                <Text className="text-white text-sm font-semibold text-right flex-1 ml-2">
                  {stock.indices.length > 0
                    ? stock.indices.join(", ")
                    : "Not in major indices"}
                </Text>
              </View>
            </View>
          </View>

          {/* AI Analysis Results */}
          {aiAnalysis && (
            <View className="bg-[#1e293b] rounded-2xl p-4 mb-4 border border-blue-600">
              <View className="flex-row items-center mb-3">
                <Ionicons name="sparkles" size={20} color="#3b82f6" />
                <Text className="text-white text-lg font-bold ml-2">
                  AI Analysis
                </Text>
              </View>

              <View className="bg-slate-800/50 rounded-xl p-3 mb-3">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-slate-400 text-sm">Score</Text>
                  <Text className="text-2xl font-bold text-blue-400">
                    {aiAnalysis.score}/100
                  </Text>
                </View>
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-slate-400 text-sm">Recommendation</Text>
                  <Text
                    className={cn(
                      "text-base font-bold",
                      aiAnalysis.recommendation === "Buy"
                        ? "text-emerald-400"
                        : aiAnalysis.recommendation === "Hold"
                        ? "text-blue-400"
                        : "text-red-400"
                    )}
                  >
                    {aiAnalysis.recommendation}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-slate-400 text-sm">Risk Level</Text>
                  <Text className="text-white text-sm font-semibold">
                    {aiAnalysis.riskLevel}
                  </Text>
                </View>
              </View>

              {aiAnalysis.pros && aiAnalysis.pros.length > 0 && (
                <View className="mb-3">
                  <Text className="text-emerald-400 text-sm font-semibold mb-2">
                    Strengths
                  </Text>
                  {aiAnalysis.pros.map((pro: string, index: number) => (
                    <View key={index} className="flex-row items-start mb-1">
                      <Text className="text-emerald-400 mr-2">•</Text>
                      <Text className="text-slate-300 text-sm flex-1">
                        {pro}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {aiAnalysis.cons && aiAnalysis.cons.length > 0 && (
                <View className="mb-3">
                  <Text className="text-red-400 text-sm font-semibold mb-2">
                    Concerns
                  </Text>
                  {aiAnalysis.cons.map((con: string, index: number) => (
                    <View key={index} className="flex-row items-start mb-1">
                      <Text className="text-red-400 mr-2">•</Text>
                      <Text className="text-slate-300 text-sm flex-1">
                        {con}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {aiAnalysis.reasoning && (
                <View>
                  <Text className="text-slate-400 text-sm font-semibold mb-2">
                    Analysis
                  </Text>
                  <Text className="text-slate-300 text-sm leading-5">
                    {aiAnalysis.reasoning}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
