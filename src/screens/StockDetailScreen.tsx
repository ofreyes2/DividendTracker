/**
 * Stock Detail Screen
 * Comprehensive analysis and detailed information for a single stock
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { CartesianChart, Line } from "victory-native";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { DividendStock } from "../api/comprehensive-stock-data";
import { cn } from "../utils/cn";
import { analyzeStock } from "../api/ai-analysis";
import { usePortfolioStore } from "../state/portfolioStore";
import { getOpenAIChatResponse } from "../api/chat-service";

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
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyShares, setBuyShares] = useState("");
  const [buyPrice, setBuyPrice] = useState(stock.price.toString());

  const { addTransaction } = usePortfolioStore();

  // Generate MACD chart data (simulated historical data)
  const macdData = React.useMemo(() => {
    const days = 30;
    const data = [];
    for (let i = 0; i < days; i++) {
      const x = i;
      const macdValue = stock.technicals.macd.value + (Math.random() - 0.5) * 2;
      const signalValue = stock.technicals.macd.signal + (Math.random() - 0.5) * 1.5;
      data.push({
        day: x,
        macd: macdValue,
        signal: signalValue,
        histogram: macdValue - signalValue,
      });
    }
    return data;
  }, [stock.symbol]);

  // Auto-run AI analysis on mount
  useEffect(() => {
    handleAIAnalysis();
  }, []);

  const handleBuyStock = () => {
    const shares = parseFloat(buyShares);
    const price = parseFloat(buyPrice);

    if (shares > 0 && price > 0) {
      addTransaction({
        symbol: stock.symbol,
        companyName: stock.companyName,
        purchaseDate: new Date().toISOString().split("T")[0],
        purchasePrice: price,
        shares: shares,
        exDividendDate: stock.exDividendDate,
        dividendPerShare: stock.dividendAmount,
        annualDividend: stock.annualDividend,
      });
      setShowBuyModal(false);
      setBuyShares("");
      // Show success message
      setTimeout(() => {
        navigation.navigate("Portfolio");
      }, 500);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoadingChat(true);

    try {
      const context = `You are a financial advisor analyzing ${stock.symbol} (${stock.companyName}).
      Current price: $${stock.price}, Dividend yield: ${stock.dividendYield}%,
      RSI: ${stock.technicals.rsi}, MACD: ${stock.technicals.macd.value.toFixed(2)},
      PEG Ratio: ${stock.technicals.pegRatio.toFixed(2)}.

      User question: ${userMessage}

      Provide a concise, helpful answer about this stock.`;

      const response = await getOpenAIChatResponse(context);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.content },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setLoadingChat(false);
    }
  };

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
          <View className="flex-row space-x-2">
            <Pressable
              onPress={() => setShowBuyModal(true)}
              className="bg-emerald-600 rounded-xl px-4 py-3 flex-row items-center"
            >
              <Ionicons name="add-circle" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Buy</Text>
            </Pressable>
            <Pressable
              onPress={() => setShowChatModal(true)}
              className="bg-blue-600 rounded-xl px-4 py-3 flex-row items-center"
            >
              <Ionicons name="chatbubbles" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Ask AI</Text>
            </Pressable>
          </View>
        </View>

        {/* Data disclaimer */}
        <View className="mt-3 bg-amber-900/20 border border-amber-700/30 rounded-lg p-2">
          <Text className="text-amber-400 text-xs text-center">
            ⚠️ Market data is delayed by 15 minutes
          </Text>
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

          {/* MACD Chart */}
          <View className="bg-[#1e293b] rounded-2xl p-4 mb-4 border border-slate-700">
            <Text className="text-white text-lg font-bold mb-3">
              MACD Chart (30 Days)
            </Text>
            <View className="h-48 bg-slate-900/50 rounded-xl p-2">
              <Text className="text-slate-400 text-xs mb-2">
                MACD: {stock.technicals.macd.value.toFixed(2)} | Signal: {stock.technicals.macd.signal.toFixed(2)} | Histogram: {stock.technicals.macd.histogram.toFixed(2)}
              </Text>
              <View className="flex-1">
                <CartesianChart
                  data={macdData}
                  xKey="day"
                  yKeys={["macd", "signal"]}
                  domainPadding={{ left: 10, right: 10, top: 10, bottom: 10 }}
                >
                  {({ points }) => (
                    <>
                      <Line
                        points={points.macd}
                        color="#3b82f6"
                        strokeWidth={2}
                        animate={{ type: "timing", duration: 300 }}
                      />
                      <Line
                        points={points.signal}
                        color="#f59e0b"
                        strokeWidth={2}
                        animate={{ type: "timing", duration: 300 }}
                      />
                    </>
                  )}
                </CartesianChart>
              </View>
              <View className="flex-row items-center justify-center mt-2 space-x-4">
                <View className="flex-row items-center">
                  <View className="w-3 h-0.5 bg-blue-500 mr-1" />
                  <Text className="text-slate-400 text-xs">MACD</Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-3 h-0.5 bg-amber-500 mr-1" />
                  <Text className="text-slate-400 text-xs">Signal</Text>
                </View>
              </View>
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

      {/* Buy Stock Modal */}
      <Modal
        visible={showBuyModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-[#0f172a]">
          <View
            style={{ paddingTop: insets.top + 16 }}
            className="px-6 pb-4 bg-[#1a2332] border-b border-slate-700"
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-white text-2xl font-bold">
                Buy {stock.symbol}
              </Text>
              <Pressable
                onPress={() => setShowBuyModal(false)}
                className="w-10 h-10 rounded-full bg-slate-700 items-center justify-center"
              >
                <Ionicons name="close" size={24} color="white" />
              </Pressable>
            </View>
          </View>

          <ScrollView className="flex-1 p-6">
            <View className="bg-[#1e293b] rounded-2xl p-4 mb-4 border border-slate-700">
              <Text className="text-white text-base font-semibold mb-2">
                {stock.companyName}
              </Text>
              <Text className="text-slate-400 text-sm">
                Current Price: {formatCurrency(stock.price)}
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-white text-base font-semibold mb-2">
                Number of Shares
              </Text>
              <TextInput
                value={buyShares}
                onChangeText={setBuyShares}
                keyboardType="numeric"
                placeholder="100"
                placeholderTextColor="#64748b"
                className="bg-slate-800 rounded-xl p-4 text-white text-lg"
              />
            </View>

            <View className="mb-4">
              <Text className="text-white text-base font-semibold mb-2">
                Purchase Price per Share
              </Text>
              <TextInput
                value={buyPrice}
                onChangeText={setBuyPrice}
                keyboardType="numeric"
                placeholder={stock.price.toString()}
                placeholderTextColor="#64748b"
                className="bg-slate-800 rounded-xl p-4 text-white text-lg"
              />
            </View>

            {buyShares && buyPrice && (
              <View className="bg-emerald-900/30 rounded-xl p-4 mb-4 border border-emerald-700/30">
                <Text className="text-emerald-400 text-sm mb-2">
                  Total Investment
                </Text>
                <Text className="text-white text-2xl font-bold">
                  {formatCurrency(parseFloat(buyShares) * parseFloat(buyPrice))}
                </Text>
                <Text className="text-emerald-400 text-sm mt-3">
                  Next Dividend Payout
                </Text>
                <Text className="text-white text-xl font-bold">
                  {formatCurrency(parseFloat(buyShares) * stock.dividendAmount)}
                </Text>
                <Text className="text-slate-400 text-xs mt-1">
                  ({stock.frequency} payments of ${stock.dividendAmount.toFixed(2)} per share)
                </Text>
                <Text className="text-emerald-400 text-sm mt-3">
                  Annual Dividend Total
                </Text>
                <Text className="text-white text-xl font-bold">
                  {formatCurrency(parseFloat(buyShares) * stock.annualDividend)}
                </Text>
              </View>
            )}

            <Pressable
              onPress={handleBuyStock}
              disabled={!buyShares || !buyPrice}
              className={cn(
                "rounded-xl py-4 items-center",
                buyShares && buyPrice
                  ? "bg-emerald-600"
                  : "bg-slate-700"
              )}
            >
              <Text className="text-white font-bold text-base">
                Add to Portfolio
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

      {/* AI Chat Modal */}
      <Modal
        visible={showChatModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === "ios" ? -50 : 0}
          style={{ flex: 1 }}
        >
          <View className="flex-1 bg-[#0f172a]">
            <View
              style={{ paddingTop: insets.top + 16 }}
              className="px-6 pb-4 bg-[#1a2332] border-b border-slate-700"
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-white text-2xl font-bold">
                  Ask AI about {stock.symbol}
                </Text>
                <Pressable
                  onPress={() => setShowChatModal(false)}
                  className="w-10 h-10 rounded-full bg-slate-700 items-center justify-center"
                >
                  <Ionicons name="close" size={24} color="white" />
                </Pressable>
              </View>
            </View>

            <Pressable
              style={{ flex: 1 }}
              onPress={() => Keyboard.dismiss()}
              accessible={false}
            >
              <ScrollView
                className="flex-1 p-4"
                contentContainerStyle={{ paddingBottom: 100 }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
              >
                {chatMessages.length === 0 ? (
                  <View className="items-center py-10">
                    <Ionicons name="chatbubbles-outline" size={64} color="#64748b" />
                    <Text className="text-white text-lg font-semibold mt-4">
                      Ask me anything
                    </Text>
                    <Text className="text-slate-400 text-sm mt-2 text-center">
                      Get detailed insights about {stock.symbol} from AI
                    </Text>
                  </View>
                ) : (
                  chatMessages.map((message, index) => (
                    <View
                      key={index}
                      className={cn(
                        "mb-3 rounded-2xl p-4",
                        message.role === "user"
                          ? "bg-blue-600 self-end max-w-[80%]"
                          : "bg-[#1e293b] self-start max-w-[90%]"
                      )}
                    >
                      <Text className="text-white text-sm">{message.content}</Text>
                    </View>
                  ))
                )}
                {loadingChat && (
                  <View className="bg-[#1e293b] rounded-2xl p-4 mb-3 self-start">
                    <ActivityIndicator color="#3b82f6" />
                  </View>
                )}
              </ScrollView>
            </Pressable>

            <View
              style={{ paddingBottom: insets.bottom + 8 }}
              className="px-4 py-3 bg-[#1a2332] border-t border-slate-700"
            >
              <View className="flex-row items-center space-x-2">
                <TextInput
                  value={chatInput}
                  onChangeText={setChatInput}
                  placeholder="Ask about dividends, analysis, etc..."
                  placeholderTextColor="#64748b"
                  className="flex-1 bg-slate-800 rounded-xl p-3 text-white"
                  multiline
                  maxLength={500}
                  onSubmitEditing={handleSendMessage}
                  blurOnSubmit={false}
                />
                <Pressable
                  onPress={handleSendMessage}
                  disabled={!chatInput.trim() || loadingChat}
                  className={cn(
                    "w-12 h-12 rounded-xl items-center justify-center",
                    chatInput.trim() && !loadingChat
                      ? "bg-blue-600"
                      : "bg-slate-700"
                  )}
                >
                  <Ionicons
                    name="send"
                    size={20}
                    color={chatInput.trim() && !loadingChat ? "white" : "#64748b"}
                  />
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
