/**
 * Portfolio Screen
 * Track investments, transactions, and dividend payouts
 */

import React, { useState } from "react";
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
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { usePortfolioStore } from "../state/portfolioStore";
import { cn } from "../utils/cn";

interface PortfolioScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "Portfolio">;
}

export default function PortfolioScreen({ navigation }: PortfolioScreenProps) {
  const insets = useSafeAreaInsets();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"positions" | "dividends" | "calendar">("positions");

  // Use selectors properly to avoid infinite loops
  const transactions = usePortfolioStore((state) => state.transactions);
  const dividendPayouts = usePortfolioStore((state) => state.dividendPayouts);

  // Calculate values from state
  const activePositions = transactions.filter((t) => !t.realized);
  const totalInvested = activePositions.reduce(
    (sum, t) => sum + t.purchasePrice * t.shares,
    0
  );
  const totalDividends = dividendPayouts.reduce((sum, d) => sum + d.amount, 0);

  // Get upcoming dividends
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + 30);
  const upcomingDividends = dividendPayouts
    .filter((d) => {
      const paymentDate = new Date(d.paymentDate);
      return paymentDate >= today && paymentDate <= futureDate;
    })
    .sort(
      (a, b) =>
        new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
    );

  // Get monthly dividends
  const monthlyMap = new Map<string, typeof dividendPayouts>();
  dividendPayouts.forEach((payout) => {
    const date = new Date(payout.paymentDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, []);
    }
    monthlyMap.get(monthKey)!.push(payout);
  });
  const monthlyDividends = Array.from(monthlyMap.entries())
    .map(([month, payouts]) => ({
      month,
      total: payouts.reduce((sum, p) => sum + p.amount, 0),
      payouts,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

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
        className="px-6 pb-4 bg-[#1a2332] border-b border-slate-700"
      >
        <View className="flex-row items-center justify-between mb-4">
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-slate-700 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
          <Text className="text-white text-2xl font-bold">My Portfolio</Text>
          <Pressable
            onPress={() => setShowAddModal(true)}
            className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center"
          >
            <Ionicons name="add" size={24} color="white" />
          </Pressable>
        </View>

        {/* Summary Cards */}
        <View className="flex-row space-x-2 mb-4">
          <View className="flex-1 bg-slate-800/50 rounded-xl p-3">
            <Text className="text-slate-400 text-xs mb-1">Total Invested</Text>
            <Text className="text-white text-lg font-bold">
              {formatCurrency(totalInvested)}
            </Text>
          </View>
          <View className="flex-1 bg-emerald-900/30 rounded-xl p-3 border border-emerald-600/30">
            <Text className="text-emerald-400 text-xs mb-1">
              Total Dividends
            </Text>
            <Text className="text-emerald-400 text-lg font-bold">
              {formatCurrency(totalDividends)}
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row space-x-2">
          <Pressable
            onPress={() => setSelectedTab("positions")}
            className={cn(
              "flex-1 py-3 rounded-xl",
              selectedTab === "positions"
                ? "bg-blue-600"
                : "bg-slate-700"
            )}
          >
            <Text
              className={cn(
                "text-center font-semibold text-sm",
                selectedTab === "positions" ? "text-white" : "text-slate-400"
              )}
            >
              Positions
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedTab("dividends")}
            className={cn(
              "flex-1 py-3 rounded-xl",
              selectedTab === "dividends"
                ? "bg-blue-600"
                : "bg-slate-700"
            )}
          >
            <Text
              className={cn(
                "text-center font-semibold text-sm",
                selectedTab === "dividends" ? "text-white" : "text-slate-400"
              )}
            >
              Upcoming
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedTab("calendar")}
            className={cn(
              "flex-1 py-3 rounded-xl",
              selectedTab === "calendar"
                ? "bg-blue-600"
                : "bg-slate-700"
            )}
          >
            <Text
              className={cn(
                "text-center font-semibold text-sm",
                selectedTab === "calendar" ? "text-white" : "text-slate-400"
              )}
            >
              Calendar
            </Text>
          </Pressable>
        </View>

        {/* Data disclaimer */}
        <View className="mt-3 bg-amber-900/20 border border-amber-700/30 rounded-lg p-2">
          <Text className="text-amber-400 text-xs text-center">
            ⚠️ Market data is delayed by 15 minutes
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Positions Tab */}
        {selectedTab === "positions" && (
          <View>
            {activePositions.length === 0 ? (
              <View className="items-center py-20">
                <Ionicons name="briefcase-outline" size={64} color="#64748b" />
                <Text className="text-white text-xl font-semibold mt-4">
                  No Positions Yet
                </Text>
                <Text className="text-slate-400 text-base mt-2 text-center">
                  Tap + to add your first investment
                </Text>
              </View>
            ) : (
              activePositions.map((position) => {
                const currentValue = position.shares * position.purchasePrice; // Simplified
                const currentCycleDividend =
                  position.shares * position.dividendPerShare;

                return (
                  <View
                    key={position.id}
                    className="bg-[#1e293b] rounded-2xl p-4 mb-3 border border-slate-700"
                  >
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1">
                        <Text className="text-white text-lg font-bold">
                          {position.symbol}
                        </Text>
                        <Text className="text-slate-400 text-sm">
                          {position.companyName}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() =>
                          navigation.navigate("TransactionDetail", {
                            transactionId: position.id,
                          })
                        }
                        className="px-3 py-1 bg-slate-700 rounded-lg"
                      >
                        <Text className="text-white text-xs font-semibold">
                          Edit
                        </Text>
                      </Pressable>
                    </View>

                    <View className="flex-row justify-between mb-2">
                      <View>
                        <Text className="text-slate-400 text-xs">Shares</Text>
                        <Text className="text-white text-base font-semibold">
                          {position.shares}
                        </Text>
                      </View>
                      <View className="items-center">
                        <Text className="text-slate-400 text-xs">
                          Avg Price
                        </Text>
                        <Text className="text-white text-base font-semibold">
                          {formatCurrency(position.purchasePrice)}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-slate-400 text-xs">Value</Text>
                        <Text className="text-white text-base font-semibold">
                          {formatCurrency(currentValue)}
                        </Text>
                      </View>
                    </View>

                    <View className="bg-emerald-900/20 rounded-lg p-2 border border-emerald-700/30">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-emerald-400 text-xs">
                          Current Cycle Dividend
                        </Text>
                        <Text className="text-emerald-400 text-base font-bold">
                          {formatCurrency(currentCycleDividend)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Upcoming Dividends Tab */}
        {selectedTab === "dividends" && (
          <View>
            {upcomingDividends.length === 0 ? (
              <View className="items-center py-20">
                <Ionicons name="calendar-outline" size={64} color="#64748b" />
                <Text className="text-white text-xl font-semibold mt-4">
                  No Upcoming Dividends
                </Text>
                <Text className="text-slate-400 text-base mt-2 text-center">
                  Add positions to track dividend payments
                </Text>
              </View>
            ) : (
              upcomingDividends.map((dividend) => (
                <View
                  key={dividend.id}
                  className="bg-[#1e293b] rounded-2xl p-4 mb-3 border border-emerald-700/30"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-white text-lg font-bold">
                      {dividend.symbol}
                    </Text>
                    <Text className="text-emerald-400 text-xl font-bold">
                      {formatCurrency(dividend.amount)}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-slate-400 text-sm">
                      {dividend.shares} shares × {formatCurrency(dividend.dividendPerShare)}
                    </Text>
                    <Text className="text-slate-400 text-sm">
                      {formatDate(dividend.paymentDate)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Calendar Tab */}
        {selectedTab === "calendar" && (
          <View>
            <Text className="text-white text-lg font-bold mb-3">
              Monthly Dividend Summary
            </Text>
            {monthlyDividends.length === 0 ? (
              <View className="items-center py-20">
                <Ionicons name="bar-chart-outline" size={64} color="#64748b" />
                <Text className="text-white text-xl font-semibold mt-4">
                  No Data Yet
                </Text>
                <Text className="text-slate-400 text-base mt-2 text-center">
                  Start tracking positions to see monthly summaries
                </Text>
              </View>
            ) : (
              monthlyDividends.map(({ month, total, payouts }) => (
                <View
                  key={month}
                  className="bg-[#1e293b] rounded-2xl p-4 mb-3 border border-slate-700"
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-white text-lg font-bold">
                      {new Date(month + "-01").toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </Text>
                    <Text className="text-emerald-400 text-xl font-bold">
                      {formatCurrency(total)}
                    </Text>
                  </View>
                  <View className="space-y-1">
                    {payouts.map((payout) => (
                      <View
                        key={payout.id}
                        className="flex-row items-center justify-between py-1"
                      >
                        <Text className="text-slate-400 text-sm">
                          {payout.symbol}
                        </Text>
                        <Text className="text-white text-sm font-semibold">
                          {formatCurrency(payout.amount)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Transaction Modal */}
      <Modal
        visible={showAddModal}
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
                Add Transaction
              </Text>
              <Pressable
                onPress={() => setShowAddModal(false)}
                className="w-10 h-10 rounded-full bg-slate-700 items-center justify-center"
              >
                <Ionicons name="close" size={24} color="white" />
              </Pressable>
            </View>
          </View>

          <ScrollView className="flex-1 p-6">
            <Text className="text-white text-lg mb-4">
              Navigate back to the stock detail page and use the Buy button to add a transaction
            </Text>
            <Pressable
              onPress={() => {
                setShowAddModal(false);
                navigation.navigate("StockList");
              }}
              className="bg-blue-600 rounded-xl py-4 items-center"
            >
              <Text className="text-white font-bold text-base">
                Go to Stock List
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
