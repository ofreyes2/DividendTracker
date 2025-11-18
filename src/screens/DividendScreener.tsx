/**
 * Dividend Screener Screen
 * Main screen displaying stock dividend data in a professional table
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeOutDown,
  Layout,
} from "react-native-reanimated";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import usePortfolioStore from "../state/portfolioStore";
import { fetchMultipleStocks } from "../api/stock-data";
import { cn } from "../utils/cn";

interface DividendScreenerProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "DividendScreener">;
}

export default function DividendScreener({ navigation }: DividendScreenerProps) {
  const insets = useSafeAreaInsets();
  const stocks = usePortfolioStore((s) => s.stocks);
  const removeStock = usePortfolioStore((s) => s.removeStock);
  const refreshStock = usePortfolioStore((s) => s.refreshStock);

  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    if (stocks.length === 0) return;

    setRefreshing(true);
    try {
      const symbols = stocks.map((s) => s.symbol);
      const updatedStocks = await fetchMultipleStocks(symbols);
      updatedStocks.forEach((stock) => {
        refreshStock(stock);
      });
    } catch (error) {
      console.error("Failed to refresh stocks:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <View className="flex-1 bg-[#0f172a]">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 16 }}
        className="px-6 pb-6 bg-[#1a2332] border-b border-slate-700"
      >
        <Text className="text-white text-3xl font-bold mb-2">
          Dividend Screener
        </Text>
        <Text className="text-slate-400 text-base">
          Track dividend stocks and calculate returns
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {stocks.length === 0 ? (
          // Empty state
          <View className="flex-1 items-center justify-center px-6 py-20">
            <View className="w-20 h-20 rounded-full bg-slate-800 items-center justify-center mb-6">
              <Ionicons name="bar-chart-outline" size={40} color="#64748b" />
            </View>
            <Text className="text-white text-xl font-semibold mb-2 text-center">
              No Stocks Added Yet
            </Text>
            <Text className="text-slate-400 text-base text-center mb-8 max-w-sm">
              Start building your dividend portfolio by adding stocks to track
            </Text>
            <Pressable
              onPress={() => navigation.navigate("AddStockModal")}
              className="bg-blue-600 px-8 py-4 rounded-xl active:bg-blue-700"
            >
              <Text className="text-white text-base font-semibold">
                Add Your First Stock
              </Text>
            </Pressable>
          </View>
        ) : (
          // Stock list
          <View className="px-4 pt-4">
            {stocks.map((stock, index) => (
              <Animated.View
                key={stock.symbol}
                entering={FadeInDown.delay(index * 50)}
                exiting={FadeOutDown}
                layout={Layout.springify()}
              >
                <View className="bg-[#1e293b] rounded-2xl p-5 mb-4 border border-slate-700">
                  {/* Header: Symbol and Price */}
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center flex-1">
                      <View className="w-12 h-12 rounded-full bg-blue-600/20 items-center justify-center mr-3">
                        <Text className="text-blue-400 text-lg font-bold">
                          {stock.symbol.charAt(0)}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-white text-xl font-bold">
                          {stock.symbol}
                        </Text>
                        <View className="flex-row items-center mt-1">
                          <Text
                            className={cn(
                              "text-sm font-medium",
                              stock.change >= 0
                                ? "text-emerald-400"
                                : "text-red-400"
                            )}
                          >
                            {stock.change >= 0 ? "+" : ""}
                            {stock.change.toFixed(2)} (
                            {formatPercent(stock.changePercent)})
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-white text-2xl font-bold">
                        {formatCurrency(stock.price)}
                      </Text>
                      <Pressable
                        onPress={() => removeStock(stock.symbol)}
                        className="mt-2 active:opacity-70"
                      >
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </Pressable>
                    </View>
                  </View>

                  {/* Dividend Info Grid */}
                  <View className="bg-slate-800/50 rounded-xl p-4 mb-3">
                    <View className="flex-row justify-between mb-3">
                      <View className="flex-1">
                        <Text className="text-slate-400 text-xs mb-1">
                          Annual Dividend
                        </Text>
                        <Text className="text-white text-lg font-bold">
                          {formatCurrency(stock.annualDividend)}
                        </Text>
                      </View>
                      <View className="flex-1 items-end">
                        <Text className="text-slate-400 text-xs mb-1">
                          Dividend Yield
                        </Text>
                        <Text className="text-emerald-400 text-lg font-bold">
                          {formatPercent(stock.dividendYield)}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row justify-between">
                      <View className="flex-1">
                        <Text className="text-slate-400 text-xs mb-1">
                          Quarterly Payout
                        </Text>
                        <Text className="text-white text-base font-semibold">
                          {formatCurrency(stock.dividendAmount)}
                        </Text>
                      </View>
                      <View className="flex-1 items-end">
                        <Text className="text-slate-400 text-xs mb-1">
                          Frequency
                        </Text>
                        <Text className="text-white text-base font-semibold capitalize">
                          {stock.frequency}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Important Dates */}
                  <View className="border-t border-slate-700 pt-3">
                    <Text className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wide">
                      Important Dates
                    </Text>
                    <View className="flex-row justify-between">
                      <View className="flex-1">
                        <Text className="text-slate-500 text-xs mb-1">
                          Ex-Dividend
                        </Text>
                        <Text className="text-slate-300 text-sm font-medium">
                          {formatDate(stock.exDividendDate)}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-500 text-xs mb-1">
                          Record Date
                        </Text>
                        <Text className="text-slate-300 text-sm font-medium">
                          {formatDate(stock.recordDate)}
                        </Text>
                      </View>
                      <View className="flex-1 items-end">
                        <Text className="text-slate-500 text-xs mb-1">
                          Payment Date
                        </Text>
                        <Text className="text-slate-300 text-sm font-medium">
                          {formatDate(stock.paymentDate)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </Animated.View>
            ))}

            {/* Add More Button */}
            <Pressable
              onPress={() => navigation.navigate("AddStockModal")}
              className="bg-slate-800 rounded-2xl p-6 mb-4 border-2 border-dashed border-slate-600 active:bg-slate-700"
            >
              <View className="items-center">
                <View className="w-12 h-12 rounded-full bg-blue-600/20 items-center justify-center mb-3">
                  <Ionicons name="add" size={28} color="#3b82f6" />
                </View>
                <Text className="text-slate-300 text-base font-semibold">
                  Add Another Stock
                </Text>
              </View>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      {stocks.length > 0 && (
        <View
          style={{ paddingBottom: insets.bottom + 16 }}
          className="absolute bottom-0 left-0 right-0 bg-[#1a2332] border-t border-slate-700 px-4 pt-4"
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-slate-400 text-sm">
              {stocks.length} {stocks.length === 1 ? "stock" : "stocks"} selected
            </Text>
            <Text className="text-emerald-400 text-sm font-semibold">
              Ready to calculate
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate("InvestmentCalculator")}
            className="bg-blue-600 rounded-xl py-4 items-center active:bg-blue-700"
          >
            <View className="flex-row items-center">
              <Ionicons name="calculator-outline" size={20} color="white" />
              <Text className="text-white text-base font-bold ml-2">
                Calculate Investment Returns
              </Text>
            </View>
          </Pressable>
        </View>
      )}
    </View>
  );
}
