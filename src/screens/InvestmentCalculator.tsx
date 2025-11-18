/**
 * Investment Calculator Modal
 * Calculate investment returns with custom allocations
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import Slider from "@react-native-community/slider";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import usePortfolioStore from "../state/portfolioStore";
import { calculateInvestment, type AllocationResult } from "../api/stock-data";

interface InvestmentCalculatorProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "InvestmentCalculator">;
}

export default function InvestmentCalculator({
  navigation,
}: InvestmentCalculatorProps) {
  const insets = useSafeAreaInsets();
  const stocks = usePortfolioStore((s) => s.stocks);
  const allocations = usePortfolioStore((s) => s.allocations);
  const totalInvestment = usePortfolioStore((s) => s.totalInvestment);
  const setTotalInvestment = usePortfolioStore((s) => s.setTotalInvestment);
  const updateAllocation = usePortfolioStore((s) => s.updateAllocation);

  const [localInvestment, setLocalInvestment] = useState(
    totalInvestment.toString()
  );
  const [localAllocations, setLocalAllocations] = useState(allocations);
  const [results, setResults] = useState<AllocationResult[]>([]);

  // Calculate results whenever inputs change
  useEffect(() => {
    const investment = parseFloat(localInvestment) || 0;
    if (investment > 0 && stocks.length > 0) {
      const calculatedResults = calculateInvestment(
        investment,
        stocks,
        localAllocations
      );
      setResults(calculatedResults);
    } else {
      setResults([]);
    }
  }, [localInvestment, localAllocations, stocks]);

  const handleAllocationChange = (symbol: string, value: number) => {
    setLocalAllocations((prev) => ({
      ...prev,
      [symbol]: value,
    }));
  };

  const handleEqualSplit = () => {
    const equalAllocation = 100 / stocks.length;
    const newAllocations: Record<string, number> = {};
    stocks.forEach((stock) => {
      newAllocations[stock.symbol] = equalAllocation;
    });
    setLocalAllocations(newAllocations);
  };

  const handleSave = () => {
    const investment = parseFloat(localInvestment) || 0;
    setTotalInvestment(investment);
    Object.entries(localAllocations).forEach(([symbol, percentage]) => {
      updateAllocation(symbol, percentage);
    });
    navigation.goBack();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const totalAllocation = Object.values(localAllocations).reduce(
    (sum, val) => sum + val,
    0
  );

  const isValidAllocation = Math.abs(totalAllocation - 100) < 0.01;

  const totalAnnualDividend = results.reduce(
    (sum, r) => sum + r.annualDividend,
    0
  );
  const totalMonthlyDividend = totalAnnualDividend / 12;
  const totalShares = results.reduce((sum, r) => sum + r.shares, 0);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#0f172a]"
    >
      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 16 }}
        className="px-6 pb-4 bg-[#1a2332] border-b border-slate-700"
      >
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-2xl font-bold">
            Investment Calculator
          </Text>
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-slate-700 items-center justify-center active:bg-slate-600"
          >
            <Ionicons name="close" size={24} color="white" />
          </Pressable>
        </View>

        {/* Investment Amount Input */}
        <View className="bg-slate-800 rounded-xl p-4">
          <Text className="text-slate-400 text-sm mb-2">Total Investment</Text>
          <View className="flex-row items-center">
            <Text className="text-white text-2xl font-bold mr-2">$</Text>
            <TextInput
              value={localInvestment}
              onChangeText={setLocalInvestment}
              keyboardType="numeric"
              placeholder="10000"
              placeholderTextColor="#64748b"
              className="flex-1 text-white text-2xl font-bold"
            />
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Allocation Controls */}
        <View className="p-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-lg font-semibold">
              Portfolio Allocation
            </Text>
            <Pressable
              onPress={handleEqualSplit}
              className="bg-slate-700 px-4 py-2 rounded-lg active:bg-slate-600"
            >
              <Text className="text-white text-sm font-medium">
                Equal Split
              </Text>
            </Pressable>
          </View>

          {/* Allocation Warning */}
          {!isValidAllocation && (
            <View className="bg-amber-900/30 border border-amber-700 rounded-xl p-4 mb-4">
              <View className="flex-row items-center">
                <Ionicons name="warning" size={20} color="#fbbf24" />
                <Text className="text-amber-400 text-sm ml-2 flex-1">
                  Total allocation must equal 100% (currently{" "}
                  {totalAllocation.toFixed(1)}%)
                </Text>
              </View>
            </View>
          )}

          {stocks.map((stock, index) => (
            <Animated.View
              key={stock.symbol}
              entering={FadeInDown.delay(index * 50)}
              className="bg-[#1e293b] rounded-2xl p-5 mb-4 border border-slate-700"
            >
              {/* Stock Header */}
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 rounded-full bg-blue-600/20 items-center justify-center mr-3">
                    <Text className="text-blue-400 text-base font-bold">
                      {stock.symbol.charAt(0)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-lg font-bold">
                      {stock.symbol}
                    </Text>
                    <Text className="text-slate-400 text-sm">
                      {formatCurrency(stock.price)} per share
                    </Text>
                  </View>
                </View>
                <Text className="text-emerald-400 text-2xl font-bold">
                  {(localAllocations[stock.symbol] || 0).toFixed(0)}%
                </Text>
              </View>

              {/* Slider */}
              <Slider
                value={localAllocations[stock.symbol] || 0}
                onValueChange={(value) =>
                  handleAllocationChange(stock.symbol, value)
                }
                minimumValue={0}
                maximumValue={100}
                step={1}
                minimumTrackTintColor="#3b82f6"
                maximumTrackTintColor="#334155"
                thumbTintColor="#3b82f6"
              />

              {/* Results for this stock */}
              {results.length > 0 && (
                <View className="bg-slate-800/50 rounded-xl p-4 mt-4">
                  <View className="flex-row justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-slate-400 text-xs mb-1">
                        Investment
                      </Text>
                      <Text className="text-white text-base font-semibold">
                        {formatCurrency(
                          results.find((r) => r.symbol === stock.symbol)
                            ?.investmentAmount || 0
                        )}
                      </Text>
                    </View>
                    <View className="flex-1 items-center">
                      <Text className="text-slate-400 text-xs mb-1">
                        Shares
                      </Text>
                      <Text className="text-white text-base font-semibold">
                        {results.find((r) => r.symbol === stock.symbol)
                          ?.shares || 0}
                      </Text>
                    </View>
                    <View className="flex-1 items-end">
                      <Text className="text-slate-400 text-xs mb-1">
                        Annual Div
                      </Text>
                      <Text className="text-emerald-400 text-base font-semibold">
                        {formatCurrency(
                          results.find((r) => r.symbol === stock.symbol)
                            ?.annualDividend || 0
                        )}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      {/* Fixed Bottom Summary */}
      <View
        style={{ paddingBottom: insets.bottom + 16 }}
        className="absolute bottom-0 left-0 right-0 bg-[#1a2332] border-t border-slate-700 px-4 pt-4"
      >
        {/* Summary Stats */}
        <View className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 rounded-xl p-4 mb-4 border border-emerald-700/50">
          <Text className="text-slate-400 text-xs font-semibold mb-3 uppercase tracking-wide">
            Total Returns
          </Text>
          <View className="flex-row justify-between mb-2">
            <View className="flex-1">
              <Text className="text-slate-400 text-xs mb-1">Total Shares</Text>
              <Text className="text-white text-xl font-bold">
                {totalShares}
              </Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-slate-400 text-xs mb-1">
                Annual Dividend
              </Text>
              <Text className="text-emerald-400 text-xl font-bold">
                {formatCurrency(totalAnnualDividend)}
              </Text>
            </View>
            <View className="flex-1 items-end">
              <Text className="text-slate-400 text-xs mb-1">
                Monthly Income
              </Text>
              <Text className="text-emerald-400 text-xl font-bold">
                {formatCurrency(totalMonthlyDividend)}
              </Text>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <Pressable
          onPress={handleSave}
          disabled={!isValidAllocation}
          className={`rounded-xl py-4 items-center ${
            isValidAllocation
              ? "bg-blue-600 active:bg-blue-700"
              : "bg-slate-700 opacity-50"
          }`}
        >
          <Text className="text-white text-base font-bold">
            Save & Close
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
