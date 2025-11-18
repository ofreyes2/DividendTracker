/**
 * Stock List Screen
 * Shows all dividend stocks with filtering by date, month, quarter
 */

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import {
  ALL_DIVIDEND_STOCKS,
  filterStocks,
  type DividendStock,
  type FilterOptions,
} from "../api/comprehensive-stock-data";
import { cn } from "../utils/cn";

interface StockListScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "StockList">;
}

export default function StockListScreen({ navigation }: StockListScreenProps) {
  const insets = useSafeAreaInsets();
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [quickFilter, setQuickFilter] = useState<
    "all" | "today" | "tomorrow" | "week" | "day"
  >("all");
  const [investmentAmount, setInvestmentAmount] = useState("10000");
  const [selectedDay, setSelectedDay] = useState<string>("");

  // Apply filters
  const filteredStocks = useMemo(() => {
    let stocks = ALL_DIVIDEND_STOCKS;

    // Apply quick filters
    const today = new Date().toISOString().split("T")[0];
    if (quickFilter === "today") {
      stocks = stocks.filter((s) => s.exDividendDate === today);
    } else if (quickFilter === "tomorrow") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];
      stocks = stocks.filter((s) => s.exDividendDate === tomorrowStr);
    } else if (quickFilter === "week") {
      const endOfWeek = new Date();
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      stocks = stocks.filter((s) => {
        const exDate = new Date(s.exDividendDate);
        return exDate >= new Date(today) && exDate <= endOfWeek;
      });
    } else if (quickFilter === "day" && selectedDay) {
      stocks = stocks.filter((s) => s.exDividendDate === selectedDay);
    }

    // Apply custom filters
    return filterStocks(stocks, filters);
  }, [filters, quickFilter, selectedDay]);

  const toggleStockSelection = (symbol: string) => {
    setSelectedStocks((prev) =>
      prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol]
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const selectedStockObjects = filteredStocks.filter((s) =>
    selectedStocks.includes(s.symbol)
  );

  return (
    <View className="flex-1 bg-[#0f172a]">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 16 }}
        className="px-6 pb-4 bg-[#1a2332] border-b border-slate-700"
      >
        <Text className="text-white text-3xl font-bold mb-2">
          DIVIDEND STRATEGY CALENDAR
        </Text>
        <Text className="text-slate-400 text-base mb-4">
          {filteredStocks.length} stocks found
        </Text>

        {/* Quick Filters */}
        <View className="flex-row space-x-2 mb-4">
          <Pressable
            onPress={() => setQuickFilter("all")}
            className={cn(
              "flex-1 py-3 rounded-xl border",
              quickFilter === "all"
                ? "bg-blue-600 border-blue-600"
                : "bg-slate-800 border-slate-700"
            )}
          >
            <Text
              className={cn(
                "text-center font-semibold text-xs",
                quickFilter === "all" ? "text-white" : "text-slate-400"
              )}
            >
              All
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setQuickFilter("today")}
            className={cn(
              "flex-1 py-3 rounded-xl border",
              quickFilter === "today"
                ? "bg-blue-600 border-blue-600"
                : "bg-slate-800 border-slate-700"
            )}
          >
            <Text
              className={cn(
                "text-center font-semibold text-xs",
                quickFilter === "today" ? "text-white" : "text-slate-400"
              )}
            >
              Today
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setQuickFilter("tomorrow")}
            className={cn(
              "flex-1 py-3 rounded-xl border",
              quickFilter === "tomorrow"
                ? "bg-blue-600 border-blue-600"
                : "bg-slate-800 border-slate-700"
            )}
          >
            <Text
              className={cn(
                "text-center font-semibold text-xs",
                quickFilter === "tomorrow" ? "text-white" : "text-slate-400"
              )}
            >
              Tomorrow
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setQuickFilter("week")}
            className={cn(
              "flex-1 py-3 rounded-xl border",
              quickFilter === "week"
                ? "bg-blue-600 border-blue-600"
                : "bg-slate-800 border-slate-700"
            )}
          >
            <Text
              className={cn(
                "text-center font-semibold text-xs",
                quickFilter === "week" ? "text-white" : "text-slate-400"
              )}
            >
              Week
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setQuickFilter("day")}
            className={cn(
              "flex-1 py-3 rounded-xl border",
              quickFilter === "day"
                ? "bg-blue-600 border-blue-600"
                : "bg-slate-800 border-slate-700"
            )}
          >
            <Text
              className={cn(
                "text-center font-semibold text-xs",
                quickFilter === "day" ? "text-white" : "text-slate-400"
              )}
            >
              Day
            </Text>
          </Pressable>
        </View>

        {/* Day Picker - shown when "Day" filter is selected */}
        {quickFilter === "day" && (
          <View className="bg-slate-800 rounded-xl p-4 mb-3">
            <Text className="text-slate-400 text-xs mb-2">
              Select Ex-Dividend Date
            </Text>
            <TextInput
              value={selectedDay}
              onChangeText={setSelectedDay}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#64748b"
              className="text-white text-base font-semibold bg-slate-700 rounded-lg p-3"
            />
          </View>
        )}

        {/* Investment Amount Input */}
        <View className="bg-slate-800 rounded-xl p-4 mb-3">
          <Text className="text-slate-400 text-xs mb-2">
            Total Investment Amount
          </Text>
          <View className="flex-row items-center">
            <Text className="text-white text-xl font-bold mr-2">$</Text>
            <TextInput
              value={investmentAmount}
              onChangeText={setInvestmentAmount}
              keyboardType="numeric"
              placeholder="10000"
              placeholderTextColor="#64748b"
              className="flex-1 text-white text-xl font-bold"
            />
          </View>
        </View>

        {/* Filter Button */}
        <Pressable
          onPress={() => setShowFilterModal(true)}
          className="bg-slate-700 rounded-xl py-3 flex-row items-center justify-center active:bg-slate-600"
        >
          <Ionicons name="options-outline" size={20} color="white" />
          <Text className="text-white font-semibold ml-2">More Filters</Text>
        </Pressable>
      </View>

      {/* Stock List */}
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: selectedStocks.length > 0 ? 120 : 20 }}>
        <View className="p-4">
          {filteredStocks.length === 0 ? (
            <View className="items-center py-20">
              <Ionicons name="calendar-outline" size={64} color="#64748b" />
              <Text className="text-white text-xl font-semibold mt-4">
                No Stocks Found
              </Text>
              <Text className="text-slate-400 text-base mt-2 text-center">
                Try adjusting your filters
              </Text>
            </View>
          ) : (
            filteredStocks.map((stock, index) => (
              <Animated.View
                key={stock.symbol}
                entering={FadeInDown.delay(index * 30)}
              >
                <View className="relative">
                  {/* Background Pressable for navigation */}
                  <Pressable
                    onPress={() => navigation.navigate("StockDetail", { stock })}
                    className={cn(
                      "rounded-2xl p-4 mb-3 border",
                      selectedStocks.includes(stock.symbol)
                        ? "bg-blue-900/30 border-blue-600"
                        : "bg-[#1e293b] border-slate-700"
                    )}
                  >
                    {/* Header Row */}
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center flex-1">
                        {/* Checkbox - Separate Pressable to stop propagation */}
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            toggleStockSelection(stock.symbol);
                          }}
                          className="mr-3"
                        >
                          <View
                            className={cn(
                              "w-6 h-6 rounded-md border-2 items-center justify-center",
                              selectedStocks.includes(stock.symbol)
                                ? "bg-blue-600 border-blue-600"
                                : "border-slate-600"
                            )}
                          >
                            {selectedStocks.includes(stock.symbol) && (
                              <Ionicons name="checkmark" size={16} color="white" />
                            )}
                          </View>
                        </Pressable>

                        <View className="flex-1">
                          <Text className="text-white text-lg font-bold">
                            {stock.symbol}
                          </Text>
                          <Text
                            className="text-slate-400 text-sm"
                            numberOfLines={1}
                          >
                            {stock.companyName}
                          </Text>
                        </View>
                      </View>

                      <View className="items-end">
                        <Text className="text-white text-xl font-bold">
                          {formatCurrency(stock.price)}
                        </Text>
                        <Text
                          className={cn(
                            "text-sm font-medium",
                            stock.change >= 0
                              ? "text-emerald-400"
                              : "text-red-400"
                          )}
                        >
                          {stock.change >= 0 ? "+" : ""}
                          {stock.change.toFixed(2)}
                        </Text>
                      </View>
                    </View>

                  {/* Dividend Info */}
                  <View className="bg-slate-800/50 rounded-xl p-3 mb-2">
                    <View className="flex-row justify-between mb-2">
                      <View>
                        <Text className="text-slate-400 text-xs">Yield</Text>
                        <Text className="text-emerald-400 text-lg font-bold">
                          {stock.dividendYield.toFixed(2)}%
                        </Text>
                      </View>
                      <View className="items-center">
                        <Text className="text-slate-400 text-xs">
                          Distribution
                        </Text>
                        <Text className="text-white text-base font-semibold">
                          {formatCurrency(stock.dividendAmount)}
                        </Text>
                      </View>
                      <View className="items-center">
                        <Text className="text-slate-400 text-xs">Annual</Text>
                        <Text className="text-white text-base font-semibold">
                          {formatCurrency(stock.annualDividend)}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-slate-400 text-xs">Ex-Date</Text>
                        <Text className="text-white text-base font-semibold">
                          {formatDate(stock.exDividendDate)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Price & Volume Info */}
                  <View className="bg-slate-800/30 rounded-xl p-3 mb-2">
                    <View className="flex-row justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-slate-400 text-xs">
                          Day Range
                        </Text>
                        <Text className="text-white text-sm font-semibold">
                          {formatCurrency(stock.priceData.dayLow)} -{" "}
                          {formatCurrency(stock.priceData.dayHigh)}
                        </Text>
                      </View>
                      <View className="flex-1 items-end">
                        <Text className="text-slate-400 text-xs">
                          52-Week Range
                        </Text>
                        <Text className="text-white text-sm font-semibold">
                          {formatCurrency(stock.priceData.week52Low)} -{" "}
                          {formatCurrency(stock.priceData.week52High)}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row justify-between">
                      <View>
                        <Text className="text-slate-400 text-xs">Volume</Text>
                        <Text className="text-white text-sm font-semibold">
                          {stock.volume.current.toFixed(1)}M
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-slate-400 text-xs">
                          Avg Volume
                        </Text>
                        <Text className="text-white text-sm font-semibold">
                          {stock.volume.average.toFixed(1)}M
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Company Details */}
                  <View className="flex-row justify-between items-center pt-2 border-t border-slate-700">
                    <View className="flex-1">
                      <Text className="text-slate-500 text-xs">
                        {stock.sector} • {stock.industry}
                      </Text>
                      {stock.indices.length > 0 && (
                        <Text className="text-slate-500 text-xs mt-1">
                          {stock.indices.join(" • ")}
                        </Text>
                      )}
                    </View>
                    <View className="items-end">
                      <Text className="text-slate-400 text-xs">Rating</Text>
                      <View className="flex-row items-center mt-1">
                        <Ionicons
                          name="star"
                          size={14}
                          color={
                            stock.technicals.rsi >= 70
                              ? "#ef4444"
                              : stock.technicals.rsi >= 50
                              ? "#10b981"
                              : stock.technicals.rsi >= 30
                              ? "#3b82f6"
                              : "#ef4444"
                          }
                        />
                        <Text
                          className={cn(
                            "text-sm font-bold ml-1",
                            stock.technicals.rsi >= 70
                              ? "text-red-400"
                              : stock.technicals.rsi >= 50
                              ? "text-emerald-400"
                              : stock.technicals.rsi >= 30
                              ? "text-blue-400"
                              : "text-red-400"
                          )}
                        >
                          {stock.technicals.rsi >= 70
                            ? "Overbought"
                            : stock.technicals.rsi >= 50
                            ? "Strong"
                            : stock.technicals.rsi >= 30
                            ? "Neutral"
                            : "Oversold"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
                </View>
              </Animated.View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      {selectedStocks.length > 0 && (
        <View
          style={{ paddingBottom: insets.bottom + 16 }}
          className="absolute bottom-0 left-0 right-0 bg-[#1a2332] border-t border-slate-700 px-4 pt-4"
        >
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-slate-400 text-sm">
              {selectedStocks.length} stock{selectedStocks.length !== 1 ? "s" : ""} selected
            </Text>
            <Pressable onPress={() => setSelectedStocks([])}>
              <Text className="text-blue-400 text-sm font-semibold">
                Clear All
              </Text>
            </Pressable>
          </View>

          <View className="flex-row space-x-2">
            <Pressable
              onPress={() =>
                navigation.navigate("BulkCalculator", {
                  stocks: selectedStockObjects,
                  investmentAmount: parseFloat(investmentAmount) || 10000,
                })
              }
              className="flex-1 bg-emerald-600 rounded-xl py-4 items-center active:bg-emerald-700"
            >
              <View className="flex-row items-center">
                <Ionicons name="calculator" size={20} color="white" />
                <Text className="text-white text-base font-bold ml-2">
                  Calculate
                </Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() =>
                navigation.navigate("AIAnalysis", {
                  stocks: selectedStockObjects,
                  investmentAmount: parseFloat(investmentAmount) || 10000,
                })
              }
              className="flex-1 bg-blue-600 rounded-xl py-4 items-center active:bg-blue-700"
            >
              <View className="flex-row items-center">
                <Ionicons name="sparkles" size={20} color="white" />
                <Text className="text-white text-base font-bold ml-2">
                  AI Analyze
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      )}

      {/* Filter Modal - Placeholder for now */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-[#0f172a]">
          <View
            style={{ paddingTop: insets.top + 16 }}
            className="px-6 pb-4 bg-[#1a2332] border-b border-slate-700"
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-white text-2xl font-bold">Filters</Text>
              <Pressable
                onPress={() => setShowFilterModal(false)}
                className="w-10 h-10 rounded-full bg-slate-700 items-center justify-center"
              >
                <Ionicons name="close" size={24} color="white" />
              </Pressable>
            </View>
          </View>

          <ScrollView className="flex-1 p-6">
            <Text className="text-white text-lg font-semibold mb-4">
              Advanced filters coming soon...
            </Text>
            <Text className="text-slate-400">
              Filter by specific dates, months, quarters, yield ranges, and
              sectors.
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
