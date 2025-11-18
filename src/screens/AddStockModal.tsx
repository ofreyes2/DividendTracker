/**
 * Add Stock Modal
 * Search and add stocks to the portfolio
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import usePortfolioStore from "../state/portfolioStore";
import { searchStocks, fetchStockData, type StockData } from "../api/stock-data";

interface AddStockModalProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "AddStockModal">;
}

export default function AddStockModal({ navigation }: AddStockModalProps) {
  const insets = useSafeAreaInsets();
  const addStock = usePortfolioStore((s) => s.addStock);
  const existingStocks = usePortfolioStore((s) => s.stocks);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setError(null);

    if (query.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchStocks(query);
      // Filter out already added stocks
      const filteredResults = results.filter(
        (symbol) => !existingStocks.some((s) => s.symbol === symbol)
      );
      setSearchResults(filteredResults);
    } catch (err) {
      setError("Failed to search stocks. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectStock = async (symbol: string) => {
    Keyboard.dismiss();
    setIsLoading(true);
    setError(null);

    try {
      const stockData = await fetchStockData(symbol);
      if (stockData) {
        setSelectedStock(stockData);
      } else {
        setError(`Stock ${symbol} not found`);
      }
    } catch (err) {
      setError("Failed to load stock data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStock = () => {
    if (selectedStock) {
      addStock(selectedStock);
      navigation.goBack();
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

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

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
          <Text className="text-white text-2xl font-bold">Add Stock</Text>
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-slate-700 items-center justify-center active:bg-slate-600"
          >
            <Ionicons name="close" size={24} color="white" />
          </Pressable>
        </View>

        {/* Search Input */}
        <View className="bg-slate-800 rounded-xl flex-row items-center px-4 py-3">
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Search by ticker symbol (e.g., AAPL)"
            placeholderTextColor="#64748b"
            className="flex-1 ml-3 text-white text-base"
            autoCapitalize="characters"
            autoCorrect={false}
            autoFocus
          />
          {isSearching && <ActivityIndicator size="small" color="#3b82f6" />}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {error && (
          <View className="mx-4 mt-4 bg-red-900/30 border border-red-700 rounded-xl p-4">
            <Text className="text-red-400 text-sm">{error}</Text>
          </View>
        )}

        {selectedStock ? (
          // Stock Details View
          <Animated.View entering={FadeInDown} className="p-4">
            <View className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700">
              {/* Symbol and Price */}
              <View className="items-center mb-6">
                <View className="w-16 h-16 rounded-full bg-blue-600/20 items-center justify-center mb-3">
                  <Text className="text-blue-400 text-2xl font-bold">
                    {selectedStock.symbol.charAt(0)}
                  </Text>
                </View>
                <Text className="text-white text-3xl font-bold mb-2">
                  {selectedStock.symbol}
                </Text>
                <Text className="text-white text-4xl font-bold mb-2">
                  {formatCurrency(selectedStock.price)}
                </Text>
                <Text
                  className={`text-base font-medium ${
                    selectedStock.change >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {selectedStock.change >= 0 ? "+" : ""}
                  {selectedStock.change.toFixed(2)} (
                  {formatPercent(selectedStock.changePercent)})
                </Text>
              </View>

              {/* Dividend Info */}
              <View className="bg-slate-800/50 rounded-xl p-4 mb-4">
                <Text className="text-slate-400 text-xs font-semibold mb-3 uppercase tracking-wide">
                  Dividend Information
                </Text>
                <View className="flex-row justify-between mb-3">
                  <View className="flex-1">
                    <Text className="text-slate-400 text-xs mb-1">
                      Annual Dividend
                    </Text>
                    <Text className="text-white text-lg font-bold">
                      {formatCurrency(selectedStock.annualDividend)}
                    </Text>
                  </View>
                  <View className="flex-1 items-end">
                    <Text className="text-slate-400 text-xs mb-1">Yield</Text>
                    <Text className="text-emerald-400 text-lg font-bold">
                      {formatPercent(selectedStock.dividendYield)}
                    </Text>
                  </View>
                </View>
                <View className="flex-row justify-between">
                  <View className="flex-1">
                    <Text className="text-slate-400 text-xs mb-1">
                      Per Payment
                    </Text>
                    <Text className="text-white text-base font-semibold">
                      {formatCurrency(selectedStock.dividendAmount)}
                    </Text>
                  </View>
                  <View className="flex-1 items-end">
                    <Text className="text-slate-400 text-xs mb-1">
                      Frequency
                    </Text>
                    <Text className="text-white text-base font-semibold capitalize">
                      {selectedStock.frequency}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row space-x-3">
                <Pressable
                  onPress={() => setSelectedStock(null)}
                  className="flex-1 bg-slate-700 rounded-xl py-4 items-center active:bg-slate-600"
                >
                  <Text className="text-white text-base font-semibold">
                    Back to Search
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleAddStock}
                  className="flex-1 bg-blue-600 rounded-xl py-4 items-center active:bg-blue-700"
                >
                  <Text className="text-white text-base font-bold">
                    Add Stock
                  </Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        ) : (
          // Search Results
          <View className="p-4">
            {searchQuery.length > 0 && searchResults.length === 0 && !isSearching && (
              <View className="items-center py-12">
                <Ionicons name="search-outline" size={48} color="#64748b" />
                <Text className="text-slate-400 text-base mt-4 text-center">
                  No stocks found matching &ldquo;{searchQuery}&rdquo;
                </Text>
                <Text className="text-slate-500 text-sm mt-2 text-center">
                  Try searching for a different ticker symbol
                </Text>
              </View>
            )}

            {searchResults.length > 0 && (
              <View>
                <Text className="text-slate-400 text-sm mb-3">
                  {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}{" "}
                  found
                </Text>
                {searchResults.map((symbol, index) => (
                  <Animated.View
                    key={symbol}
                    entering={FadeInDown.delay(index * 50)}
                  >
                    <Pressable
                      onPress={() => handleSelectStock(symbol)}
                      disabled={isLoading}
                      className="bg-[#1e293b] rounded-xl p-4 mb-3 flex-row items-center justify-between border border-slate-700 active:bg-slate-700"
                    >
                      <View className="flex-row items-center flex-1">
                        <View className="w-12 h-12 rounded-full bg-blue-600/20 items-center justify-center mr-4">
                          <Text className="text-blue-400 text-lg font-bold">
                            {symbol.charAt(0)}
                          </Text>
                        </View>
                        <Text className="text-white text-lg font-semibold">
                          {symbol}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={24}
                        color="#64748b"
                      />
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            )}

            {searchQuery.length === 0 && (
              <View className="items-center py-12">
                <View className="w-20 h-20 rounded-full bg-slate-800 items-center justify-center mb-4">
                  <Ionicons name="trending-up" size={40} color="#64748b" />
                </View>
                <Text className="text-white text-lg font-semibold mb-2 text-center">
                  Search for Dividend Stocks
                </Text>
                <Text className="text-slate-400 text-base text-center max-w-sm">
                  Enter a ticker symbol to find stocks with dividend information
                </Text>
              </View>
            )}
          </View>
        )}

        {isLoading && (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-slate-400 text-base mt-4">
              Loading stock data...
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
