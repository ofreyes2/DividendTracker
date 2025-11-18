/**
 * Bulk Calculator Screen
 * Calculate investment allocation across all selected stocks
 */

import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { calculateBulkInvestment } from "../api/comprehensive-stock-data";
import Animated, { FadeInDown } from "react-native-reanimated";

type Props = NativeStackScreenProps<RootStackParamList, "BulkCalculator">;

export default function BulkCalculatorScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { stocks, investmentAmount } = route.params;

  const results = calculateBulkInvestment(investmentAmount, stocks);

  const totalShares = results.reduce((sum, r) => sum + r.shares, 0);
  const totalInvested = results.reduce((sum, r) => sum + r.investmentUsed, 0);
  const totalAnnualDividend = results.reduce(
    (sum, r) => sum + r.annualDividend,
    0
  );
  const totalMonthlyDividend = totalAnnualDividend / 12;
  const averageYield =
    results.reduce((sum, r) => sum + r.yield, 0) / results.length;

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
            Investment Calculator
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
            Total Investment Summary
          </Text>
          <View className="flex-row justify-between mb-3">
            <View>
              <Text className="text-slate-400 text-xs mb-1">Investment</Text>
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
          <View className="flex-row justify-between pt-3 border-t border-slate-700">
            <View className="flex-1">
              <Text className="text-slate-400 text-xs mb-1">Total Shares</Text>
              <Text className="text-emerald-400 text-lg font-bold">
                {totalShares}
              </Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-slate-400 text-xs mb-1">Avg Yield</Text>
              <Text className="text-emerald-400 text-lg font-bold">
                {averageYield.toFixed(2)}%
              </Text>
            </View>
            <View className="flex-1 items-end">
              <Text className="text-slate-400 text-xs mb-1">Annual Div</Text>
              <Text className="text-emerald-400 text-lg font-bold">
                {formatCurrency(totalAnnualDividend)}
              </Text>
            </View>
          </View>
          <View className="mt-3 pt-3 border-t border-slate-700">
            <Text className="text-slate-400 text-xs mb-1">
              Expected Monthly Income
            </Text>
            <Text className="text-emerald-400 text-3xl font-bold">
              {formatCurrency(totalMonthlyDividend)}
            </Text>
          </View>
        </View>
      </View>

      {/* Stock Details */}
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        <Text className="text-white text-lg font-semibold mb-4">
          Investment Breakdown ({results.length} stocks)
        </Text>

        {results.map((result, index) => (
          <Animated.View
            key={result.symbol}
            entering={FadeInDown.delay(index * 50)}
            className="bg-[#1e293b] rounded-2xl p-5 mb-4 border border-slate-700"
          >
            {/* Stock Header */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <Text className="text-white text-xl font-bold">
                  {result.symbol}
                </Text>
                <Text
                  className="text-slate-400 text-sm"
                  numberOfLines={1}
                >
                  {result.companyName}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-white text-lg font-bold">
                  {formatCurrency(result.price)}
                </Text>
                <Text className="text-emerald-400 text-sm font-semibold">
                  {result.yield.toFixed(2)}% yield
                </Text>
              </View>
            </View>

            {/* Investment Details */}
            <View className="bg-slate-800/50 rounded-xl p-4">
              <View className="flex-row justify-between mb-3">
                <View className="flex-1">
                  <Text className="text-slate-400 text-xs mb-1">
                    Investment
                  </Text>
                  <Text className="text-white text-base font-semibold">
                    {formatCurrency(result.investmentUsed)}
                  </Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-slate-400 text-xs mb-1">Shares</Text>
                  <Text className="text-white text-base font-semibold">
                    {result.shares}
                  </Text>
                </View>
                <View className="flex-1 items-end">
                  <Text className="text-slate-400 text-xs mb-1">
                    Annual Dividend
                  </Text>
                  <Text className="text-emerald-400 text-base font-semibold">
                    {formatCurrency(result.annualDividend)}
                  </Text>
                </View>
              </View>
              <View className="pt-3 border-t border-slate-700">
                <Text className="text-slate-400 text-xs mb-1">
                  Monthly Income
                </Text>
                <Text className="text-emerald-400 text-xl font-bold">
                  {formatCurrency(result.monthlyDividend)}
                </Text>
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
                Equal Distribution Strategy
              </Text>
              <Text className="text-slate-400 text-sm">
                Your investment has been equally distributed across all selected
                stocks. Fractional shares are not included - only whole shares
                are calculated.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
