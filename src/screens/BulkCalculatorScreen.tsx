/**
 * Bulk Calculator Screen
 * Calculate investment allocation across selected stocks with custom percentages
 */

import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { DividendStock } from "../api/comprehensive-stock-data";
import Animated, { FadeInDown } from "react-native-reanimated";
import Slider from "@react-native-community/slider";

type Props = NativeStackScreenProps<RootStackParamList, "BulkCalculator">;

interface StockAllocation {
  stock: DividendStock;
  percentage: number;
  investmentAmount: number;
  shares: number;
  singlePayoutDividend: number;
  annualDividend: number;
}

export default function BulkCalculatorScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { stocks, investmentAmount } = route.params;

  // Initialize equal percentages
  const initialPercentage = Math.floor(100 / stocks.length);
  const [allocations, setAllocations] = useState<StockAllocation[]>(
    stocks.map((stock, index) => {
      // Give remaining percentage to first stock
      const percentage = index === 0
        ? 100 - (initialPercentage * (stocks.length - 1))
        : initialPercentage;

      const investment = (investmentAmount * percentage) / 100;
      const shares = Math.floor(investment / stock.price);
      const actualInvestment = shares * stock.price;

      return {
        stock,
        percentage,
        investmentAmount: actualInvestment,
        shares,
        singlePayoutDividend: shares * stock.dividendAmount,
        annualDividend: shares * stock.annualDividend,
      };
    })
  );

  const updateAllocation = (index: number, newPercentage: number) => {
    const updatedAllocations = [...allocations];
    const oldPercentage = updatedAllocations[index].percentage;
    const diff = newPercentage - oldPercentage;

    // Update target stock
    updatedAllocations[index].percentage = newPercentage;

    // Distribute difference across other stocks
    const otherIndices = allocations
      .map((_, i) => i)
      .filter(i => i !== index && updatedAllocations[i].percentage > 0);

    if (otherIndices.length > 0) {
      const perStockAdjustment = -diff / otherIndices.length;
      otherIndices.forEach(i => {
        updatedAllocations[i].percentage = Math.max(
          0,
          Math.min(100, updatedAllocations[i].percentage + perStockAdjustment)
        );
      });
    }

    // Normalize to ensure total is 100%
    const total = updatedAllocations.reduce((sum, a) => sum + a.percentage, 0);
    updatedAllocations.forEach(a => {
      a.percentage = (a.percentage / total) * 100;

      // Recalculate investment and shares
      const investment = (investmentAmount * a.percentage) / 100;
      a.shares = Math.floor(investment / a.stock.price);
      a.investmentAmount = a.shares * a.stock.price;
      a.singlePayoutDividend = a.shares * a.stock.dividendAmount;
      a.annualDividend = a.shares * a.stock.annualDividend;
    });

    setAllocations(updatedAllocations);
  };

  const totalInvested = allocations.reduce((sum, a) => sum + a.investmentAmount, 0);
  const totalShares = allocations.reduce((sum, a) => sum + a.shares, 0);
  const totalCycleDividend = allocations.reduce((sum, a) => sum + a.singlePayoutDividend, 0);
  const totalAnnualDividend = allocations.reduce((sum, a) => sum + a.annualDividend, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <View className="flex-1 bg-[#0f172a]">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 16 }}
        className="px-6 pb-4 bg-[#1a2332] border-b border-slate-700"
      >
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-2xl font-bold">
            Daily Dividend Calculator
          </Text>
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-slate-700 items-center justify-center active:bg-slate-600"
          >
            <Ionicons name="close" size={24} color="white" />
          </Pressable>
        </View>

        {/* Summary Card */}
        <View className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 rounded-2xl p-5 border border-emerald-700/50">
          <Text className="text-slate-400 text-xs font-semibold mb-3 uppercase tracking-wide">
            Daily Capture Strategy Summary
          </Text>
          <View className="flex-row justify-between mb-3">
            <View>
              <Text className="text-slate-400 text-xs mb-1">Total Investment</Text>
              <Text className="text-white text-2xl font-bold">
                {formatCurrency(investmentAmount)}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-slate-400 text-xs mb-1">
                Actually Used
              </Text>
              <Text className="text-white text-2xl font-bold">
                {formatCurrency(totalInvested)}
              </Text>
            </View>
          </View>
          <View className="flex-row justify-between pt-3 border-t border-slate-700 mb-3">
            <View className="flex-1">
              <Text className="text-slate-400 text-xs mb-1">Total Shares</Text>
              <Text className="text-emerald-400 text-lg font-bold">
                {totalShares}
              </Text>
            </View>
            <View className="flex-1 items-end">
              <Text className="text-slate-400 text-xs mb-1">Next Payment</Text>
              <Text className="text-emerald-400 text-2xl font-bold">
                {formatCurrency(totalCycleDividend)}
              </Text>
            </View>
          </View>
          <View className="bg-blue-900/30 rounded-lg p-2">
            <Text className="text-blue-300 text-xs text-center">
              💡 Buy day before ex-date, collect dividend, sell next day
            </Text>
          </View>
        </View>
      </View>

      {/* Stock Allocations */}
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        <Text className="text-white text-lg font-semibold mb-2">
          Customize Allocation ({allocations.length} stocks)
        </Text>
        <Text className="text-slate-400 text-sm mb-4">
          Adjust sliders to control investment percentage per stock
        </Text>

        {allocations.map((allocation, index) => (
          <Animated.View
            key={allocation.stock.symbol}
            entering={FadeInDown.delay(index * 50)}
            className="bg-[#1e293b] rounded-2xl p-5 mb-4 border border-slate-700"
          >
            {/* Stock Header */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-1">
                <Text className="text-white text-xl font-bold">
                  {allocation.stock.symbol}
                </Text>
                <Text className="text-slate-400 text-sm" numberOfLines={1}>
                  {allocation.stock.companyName}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-white text-lg font-bold">
                  {formatCurrency(allocation.stock.price)}
                </Text>
                <Text className="text-emerald-400 text-sm font-semibold">
                  {allocation.stock.dividendYield.toFixed(2)}% yield
                </Text>
              </View>
            </View>

            {/* Percentage Slider */}
            <View className="mb-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-slate-400 text-sm">Allocation</Text>
                <Text className="text-emerald-400 text-lg font-bold">
                  {allocation.percentage.toFixed(1)}%
                </Text>
              </View>
              <Slider
                style={{ width: "100%", height: 40 }}
                minimumValue={0}
                maximumValue={100}
                step={0.5}
                value={allocation.percentage}
                onValueChange={(value) => updateAllocation(index, value)}
                minimumTrackTintColor="#10b981"
                maximumTrackTintColor="#475569"
                thumbTintColor="#10b981"
              />
            </View>

            {/* Investment Details */}
            <View className="bg-slate-800/50 rounded-xl p-4">
              <View className="flex-row justify-between mb-3">
                <View className="flex-1">
                  <Text className="text-slate-400 text-xs mb-1">
                    Investment
                  </Text>
                  <Text className="text-white text-base font-semibold">
                    {formatCurrency(allocation.investmentAmount)}
                  </Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-slate-400 text-xs mb-1">Shares</Text>
                  <Text className="text-white text-base font-semibold">
                    {allocation.shares}
                  </Text>
                </View>
                <View className="flex-1 items-end">
                  <Text className="text-slate-400 text-xs mb-1">
                    This Payment
                  </Text>
                  <Text className="text-emerald-400 text-base font-bold">
                    {formatCurrency(allocation.singlePayoutDividend)}
                  </Text>
                </View>
              </View>
              <View className="pt-3 border-t border-slate-700">
                <View className="flex-row justify-between">
                  <Text className="text-slate-400 text-xs">Volume (Safety)</Text>
                  <Text className="text-blue-400 text-sm font-bold">
                    {allocation.stock.volume.current.toFixed(1)}M shares
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        ))}

        <View className="mt-6 bg-blue-900/20 rounded-xl p-5 border border-blue-700/50">
          <View className="flex-row items-start">
            <Ionicons
              name="information-circle-outline"
              size={24}
              color="#3b82f6"
            />
            <View className="flex-1 ml-3">
              <Text className="text-blue-400 text-sm font-semibold mb-2">
                Custom Allocation Strategy
              </Text>
              <Text className="text-slate-400 text-sm">
                Adjust the sliders above to control what percentage of your ${investmentAmount.toLocaleString()} goes to each stock. Total dividend shown is for the next payment cycle only - perfect for daily dividend capture trading.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
