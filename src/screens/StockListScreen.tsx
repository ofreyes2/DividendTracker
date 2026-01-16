/**
 * Stock List Screen
 * Shows all dividend stocks with filtering by date, month, quarter
 */

import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import DateTimePicker from "@react-native-community/datetimepicker";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import {
  ALL_DIVIDEND_STOCKS,
  filterStocks,
  getAllSectors,
  getAllIndustries,
  type DividendStock,
  type FilterOptions,
} from "../api/comprehensive-stock-data";
import { useStockDataStore } from "../state/stockDataStore";
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
  const [targetDividend, setTargetDividend] = useState("");
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Use stock data store
  const {
    stocks: storedStocks,
    isRefreshing,
    isHydrated,
    refreshProgress,
    lastRefreshTime,
    lastDividendRefreshTime,
    lastWebSocketUpdate,
    shouldAutoRefresh,
    refreshFromCSV,
    refreshStocks,
    websocketConnected,
  } = useStockDataStore();

  // Auto-load data on first launch - wait for hydration first
  useEffect(() => {
    // Don't do anything until store is hydrated from AsyncStorage
    if (!isHydrated) {
      console.log("Waiting for store hydration...");
      return;
    }

    if (storedStocks.length === 0 && !isRefreshing) {
      console.log("First launch - loading stocks from CSV with live price enrichment...");
      // Load CSV data WITH prices to get current data
      refreshFromCSV(true);
    } else if (storedStocks.length > 0) {
      console.log(`App started with ${storedStocks.length} stocks already loaded from storage`);

      // Check if data is stale (more than 24 hours old) and refresh
      if (lastRefreshTime) {
        const hoursSinceRefresh = (Date.now() - lastRefreshTime) / (1000 * 60 * 60);
        if (hoursSinceRefresh > 24) {
          console.log(`Data is ${hoursSinceRefresh.toFixed(1)} hours old - refreshing...`);
          refreshFromCSV(true);
        }
      }
    }
  }, [isHydrated]);

  // Use stored stocks or fallback to mock data
  const availableStocks = storedStocks.length > 0 ? storedStocks : ALL_DIVIDEND_STOCKS;

  // Apply filters
  const filteredStocks = useMemo(() => {
    let stocks = availableStocks;

    // Filter out stocks with $0 price (invalid data)
    stocks = stocks.filter((s) => s.price > 0);

    // CRITICAL: Filter out stocks with PAST ex-dividend dates
    // Today's date for comparison
    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDay = now.getDate();
    const todayDate = new Date(todayYear, todayMonth, todayDay);

    stocks = stocks.filter((s) => {
      if (!s.exDividendDate) return false;
      const [exYear, exMonth, exDay] = s.exDividendDate.split("-").map(Number);
      const exDate = new Date(exYear, exMonth - 1, exDay);
      return exDate >= todayDate; // Only include today or future
    });

    // Apply search filter first
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      stocks = stocks.filter(
        (s) =>
          s.symbol.toLowerCase().includes(query) ||
          s.companyName.toLowerCase().includes(query)
      );
    }

    // Apply quick filters
    // Use local date components to avoid timezone issues
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const today = `${year}-${month}-${day}`;

    if (quickFilter === "today") {
      stocks = stocks.filter((s) => s.exDividendDate === today);
    } else if (quickFilter === "tomorrow") {
      const tomorrowDate = new Date();
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrowYear = tomorrowDate.getFullYear();
      const tomorrowMonth = String(tomorrowDate.getMonth() + 1).padStart(2, "0");
      const tomorrowDay = String(tomorrowDate.getDate()).padStart(2, "0");
      const tomorrowStr = `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}`;
      stocks = stocks.filter((s) => s.exDividendDate === tomorrowStr);
    } else if (quickFilter === "week") {
      const endOfWeek = new Date();
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      stocks = stocks.filter((s) => {
        // Parse date strings carefully to avoid timezone issues
        const [exYear, exMonth, exDay] = s.exDividendDate.split('-').map(Number);
        const exDate = new Date(exYear, exMonth - 1, exDay);
        const todayDate = new Date(year, now.getMonth(), now.getDate());
        return exDate >= todayDate && exDate <= endOfWeek;
      });
    } else if (quickFilter === "day" && selectedDay) {
      stocks = stocks.filter((s) => s.exDividendDate === selectedDay);
    }

    // Apply custom filters
    return filterStocks(stocks, filters);
  }, [filters, quickFilter, selectedDay, searchQuery, availableStocks]);

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
      year: "numeric",
    });
  };

  // Render function for stock card (for FlatList virtualization)
  const renderStockCard = ({ item: stock, index }: { item: DividendStock; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index * 30, 300))}
    >
      <View className="relative">
        {/* Card Container with better spacing */}
        <View
          className={cn(
            "rounded-xl p-4 mb-3 border",
            selectedStocks.includes(stock.symbol)
              ? "bg-blue-900/30 border-blue-600"
              : "bg-[#1e293b] border-slate-700"
          )}
        >
          {/* Header Row */}
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center flex-1">
              {/* Checkbox with larger touch area */}
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  toggleStockSelection(stock.symbol);
                }}
                className="mr-3 p-1"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View
                  className={cn(
                    "w-5 h-5 rounded-md border-2 items-center justify-center",
                    selectedStocks.includes(stock.symbol)
                      ? "bg-blue-600 border-blue-600"
                      : "border-slate-500"
                  )}
                >
                  {selectedStocks.includes(stock.symbol) && (
                    <Ionicons name="checkmark" size={14} color="white" />
                  )}
                </View>
              </Pressable>

              <Pressable
                onPress={() => navigation.navigate("StockDetail", { stock })}
                className="flex-1"
              >
                <Text className="text-white text-base font-bold">
                  {stock.symbol}
                </Text>
                <Text className="text-slate-400 text-xs" numberOfLines={1}>
                  {stock.companyName}
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => navigation.navigate("StockDetail", { stock })}
              className="items-end"
            >
              <Text className="text-white text-base font-bold">
                ${stock.price?.toFixed(2) || "N/A"}
              </Text>
              <Text
                className={cn(
                  "text-xs font-medium",
                  (stock.change || 0) >= 0 ? "text-emerald-400" : "text-red-400"
                )}
              >
                {(stock.change || 0) >= 0 ? "+" : ""}
                {stock.change?.toFixed(2) || "0.00"} ({stock.changePercent?.toFixed(2) || "0.00"}%)
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => navigation.navigate("StockDetail", { stock })}
          >
            {/* Price Data - 3-column layout with better spacing */}
            <View className="bg-slate-800/50 rounded-lg p-2 mb-2">
              <View className="flex-row justify-between mb-1.5">
                <View className="flex-1">
                  <Text className="text-slate-400 text-[9px] mb-0.5">Open</Text>
                  <Text className="text-white text-[10px] font-semibold">
                    ${stock.priceData?.open?.toFixed(2) || "N/A"}
                  </Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-slate-400 text-[9px] mb-0.5">Prev Close</Text>
                  <Text className="text-white text-[10px] font-semibold">
                    ${stock.priceData?.previousClose?.toFixed(2) || "N/A"}
                  </Text>
                </View>
                <View className="flex-1 items-end">
                  <Text className="text-slate-400 text-[9px] mb-0.5">Day Range</Text>
                  <Text className="text-white text-[10px] font-semibold">
                    ${stock.priceData?.dayLow?.toFixed(2) || "N/A"}-${stock.priceData?.dayHigh?.toFixed(2) || "N/A"}
                  </Text>
                </View>
              </View>
              <View className="flex-row justify-between">
                <View className="flex-1">
                  <Text className="text-slate-400 text-[9px] mb-0.5">52W High</Text>
                  <Text className="text-white text-[10px] font-semibold">
                    ${stock.priceData?.week52High?.toFixed(2) || "N/A"}
                  </Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-slate-400 text-[9px] mb-0.5">52W Low</Text>
                  <Text className="text-white text-[10px] font-semibold">
                    ${stock.priceData?.week52Low?.toFixed(2) || "N/A"}
                  </Text>
                </View>
                <View className="flex-1 items-end">
                  <Text className="text-slate-400 text-[9px] mb-0.5">Volume</Text>
                  <Text className="text-white text-[10px] font-semibold">
                    {stock.volume?.current?.toFixed(1) || "N/A"}M
                  </Text>
                </View>
              </View>
            </View>

            {/* Technical & Dividend */}
            <View className="bg-slate-800/50 rounded-lg p-2 mb-2">
              <View className="flex-row justify-between">
                <View className="flex-1">
                  <Text className="text-slate-400 text-[9px] mb-0.5">MACD</Text>
                  <Text className={cn(
                    "text-[10px] font-semibold",
                    (stock.technicals?.macd?.value || 0) > 0 ? "text-emerald-400" : "text-red-400"
                  )}>
                    {stock.technicals?.macd?.value ? stock.technicals.macd.value.toFixed(2) : "N/A"}
                  </Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-slate-400 text-[9px] mb-0.5">RSI</Text>
                  <Text className={cn(
                    "text-[10px] font-semibold",
                    (stock.technicals?.rsi || 0) >= 70 ? "text-red-400" :
                    (stock.technicals?.rsi || 0) >= 50 ? "text-emerald-400" : "text-blue-400"
                  )}>
                    {stock.technicals?.rsi ? Math.round(stock.technicals.rsi) : "N/A"}
                  </Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-slate-400 text-[9px] mb-0.5">Yield</Text>
                  <Text className="text-emerald-400 text-[10px] font-bold">
                    {stock.dividendYield?.toFixed(2) || "N/A"}%
                  </Text>
                </View>
                <View className="flex-1 items-end">
                  <Text className="text-slate-400 text-[9px] mb-0.5">Ex-Date</Text>
                  <Text className="text-white text-[10px] font-semibold">
                    {formatDate(stock.exDividendDate)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Company Info at Bottom - Thin section, left-aligned */}
            <View className="bg-slate-800/30 rounded-lg px-2 py-1">
              <Text className="text-slate-400 text-[9px]">
                {stock.sector || "Unknown"} | {stock.industry || "Unknown"} • {stock.indices?.length > 0 ? stock.indices[0] : "N/A"}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );


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
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-1">
            <Text className="text-white text-lg font-bold" style={{ letterSpacing: -0.5 }}>
              DAILY DIVIDEND CAPTURE
            </Text>
            <Text className="text-slate-400 text-sm">
              {filteredStocks.length} opportunities • Buy-Hold-Sell strategy
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate("DataSources")}
            className="w-12 h-12 rounded-full bg-emerald-600 items-center justify-center ml-3"
          >
            <Ionicons name="server" size={22} color="white" />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate("About")}
            className="w-12 h-12 rounded-full bg-slate-700 items-center justify-center ml-3"
          >
            <Ionicons name="information-circle" size={22} color="white" />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate("Portfolio")}
            className="w-12 h-12 rounded-full bg-blue-600 items-center justify-center ml-3"
          >
            <Ionicons name="briefcase" size={22} color="white" />
          </Pressable>
        </View>

        {/* Search Bar */}
        <View className="mb-3 bg-slate-800 rounded-xl flex-row items-center px-3 py-2">
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by symbol or company name..."
            placeholderTextColor="#64748b"
            className="flex-1 text-white text-base ml-2 py-2"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#64748b" />
            </Pressable>
          )}
        </View>

        {/* Stale Data Warning - Show when we have stocks but none are current/future */}
        {isHydrated && storedStocks.length > 0 && filteredStocks.length === 0 && !isRefreshing && (
          <View className="bg-red-900/30 border border-red-600 rounded-xl p-4 mb-3">
            <View className="flex-row items-start mb-2">
              <Ionicons name="alert-circle" size={24} color="#ef4444" />
              <Text className="text-white font-semibold ml-2 flex-1">
                Stale Data Detected
              </Text>
            </View>
            <Text className="text-slate-300 text-sm mb-3">
              Your cached data contains old ex-dividend dates. Today is {new Date().toLocaleDateString()}. Tap below to refresh with current dividend data.
            </Text>
            <Pressable
              onPress={async () => {
                // Clear the cached stocks and refresh
                const store = require("../state/stockDataStore").useStockDataStore.getState();
                store.setStocks([]);
                // Small delay then refresh
                setTimeout(() => {
                  store.refreshFromCSV(true);
                }, 100);
              }}
              className="bg-red-600 rounded-xl px-4 py-3 flex-row items-center justify-center active:bg-red-700"
            >
              <Ionicons name="refresh" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">
                Clear Cache & Refresh Data
              </Text>
            </Pressable>
          </View>
        )}

        {/* Guide to Ticker Manager */}
        {/* Show guidance only if NO stocks are loaded AND store is hydrated */}
        {isHydrated && storedStocks.length === 0 && !isRefreshing && (
          <View className="bg-amber-900/30 border border-amber-600 rounded-xl p-4 mb-3">
            <View className="flex-row items-start mb-2">
              <Ionicons name="warning" size={24} color="#f59e0b" />
              <Text className="text-white font-semibold ml-2 flex-1">
                Load Top 1000 Dividend Stocks
              </Text>
            </View>
            <Text className="text-slate-300 text-sm mb-3">
              Instead of trying all 11,628 tickers, start with the top 1000 known dividend payers. This will load successfully and you&apos;ll have data in ~2 minutes.
            </Text>
            <Pressable
              onPress={() => {
                // Load the curated top 1000 list
                const { TOP_DIVIDEND_TICKERS } = require("../data/top-dividend-stocks");
                const tickers = TOP_DIVIDEND_TICKERS.split("\n")
                  .map((line: string) => line.trim())
                  .filter((line: string) => line && !line.startsWith("#"));

                console.log(`Loading top ${tickers.length} dividend stocks...`);

                // Use refreshFromTickers with the curated list
                const { refreshFromTickers } = require("../state/stockDataStore").useStockDataStore.getState();
                refreshFromTickers(tickers, true);
              }}
              className="bg-emerald-600 rounded-xl px-4 py-3 flex-row items-center justify-center mb-2 active:bg-emerald-700"
            >
              <Ionicons name="rocket" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">
                Load Top 1000 Now
              </Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate("TickerManager")}
              className="bg-blue-600 rounded-xl px-4 py-3 flex-row items-center justify-center active:bg-blue-700"
            >
              <Ionicons name="list" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">
                Or Customize in Ticker Manager
              </Text>
            </Pressable>
          </View>
        )}


        {/* Data disclaimer - thinner */}
        <View className="mb-3 bg-amber-900/20 border border-amber-700/30 rounded-lg px-3 py-1">
          <Text className="text-amber-400 text-[10px] text-center">
            ⚠️ Market data delayed 15 minutes
          </Text>
        </View>

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
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-slate-400 text-xs">
                Select Ex-Dividend Date
              </Text>
              {selectedDay && (
                <Pressable
                  onPress={() => {
                    setSelectedDay("");
                    setQuickFilter("all");
                  }}
                >
                  <Text className="text-blue-400 text-xs font-semibold">
                    Clear & Show All
                  </Text>
                </Pressable>
              )}
            </View>
            <Pressable
              onPress={() => {
                // Initialize picker with selected day or today
                if (selectedDay) {
                  setPickerDate(new Date(selectedDay + "T12:00:00"));
                } else {
                  setPickerDate(new Date());
                }
                setShowDatePicker(true);
              }}
              className="bg-slate-700 rounded-lg p-3 flex-row items-center justify-between"
            >
              <Text className="text-white text-base font-semibold">
                {selectedDay || "Choose a date"}
              </Text>
              <Ionicons name="calendar" size={20} color="#60a5fa" />
            </Pressable>
          </View>
        )}

        {/* Collapsible Filters Section */}
        <Pressable
          onPress={() => setFiltersExpanded(!filtersExpanded)}
          className="bg-slate-800 rounded-xl p-4 mb-3 flex-row items-center justify-between"
        >
          <View className="flex-row items-center">
            <Ionicons name="options-outline" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">
              Investment Settings
            </Text>
          </View>
          <Ionicons
            name={filtersExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#94a3b8"
          />
        </Pressable>

        {filtersExpanded && (
          <View className="mb-3">
            {/* Investment Amount and Target Dividend Side-by-Side */}
            <View className="flex-row space-x-2 mb-3">
              <View className="flex-1 bg-slate-800 rounded-xl p-4">
                <Text className="text-slate-400 text-xs mb-2">
                  Investment Amount
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-white text-lg font-bold mr-1">$</Text>
                  <TextInput
                    value={investmentAmount}
                    onChangeText={setInvestmentAmount}
                    keyboardType="numeric"
                    placeholder="10000"
                    placeholderTextColor="#64748b"
                    className="flex-1 text-white text-lg font-bold"
                  />
                </View>
              </View>

              <View className="flex-1 bg-slate-800 rounded-xl p-4">
                <Text className="text-slate-400 text-xs mb-2">
                  Daily Target
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-emerald-400 text-lg font-bold mr-1">$</Text>
                  <TextInput
                    value={targetDividend}
                    onChangeText={setTargetDividend}
                    keyboardType="numeric"
                    placeholder="1000"
                    placeholderTextColor="#64748b"
                    className="flex-1 text-white text-lg font-bold"
                  />
                </View>
              </View>
            </View>

            {/* More Filters Button */}
            <Pressable
              onPress={() => setShowFilterModal(true)}
              className="bg-slate-700 rounded-xl py-3 flex-row items-center justify-center active:bg-slate-600 mb-3"
            >
              <Ionicons name="funnel-outline" size={18} color="white" />
              <Text className="text-white font-semibold ml-2">More Filters</Text>
            </Pressable>

            {/* Calculate Button - Always visible when settings expanded */}
            {investmentAmount && parseFloat(investmentAmount) > 0 && targetDividend && parseFloat(targetDividend) > 0 && (
              <Pressable
                onPress={() => {
                  navigation.navigate("AIAnalysis", {
                    stocks: filteredStocks,
                    investmentAmount: parseFloat(investmentAmount),
                    targetDividend: parseFloat(targetDividend),
                    selectedDay: quickFilter === "day" ? selectedDay : undefined,
                  });
                }}
                className="bg-emerald-600 rounded-xl py-4 flex-row items-center justify-center active:bg-emerald-700 mb-2"
              >
                <Ionicons name="flash" size={20} color="white" />
                <Text className="text-white text-base font-bold ml-2">
                  Find Daily Opportunities
                </Text>
              </Pressable>
            )}

            {/* Show Maximum Button */}
            {investmentAmount && parseFloat(investmentAmount) > 0 && (
              <Pressable
                onPress={() => {
                  navigation.navigate("AIAnalysis", {
                    stocks: filteredStocks,
                    investmentAmount: parseFloat(investmentAmount),
                    targetDividend: 0, // 0 triggers max calculation
                    selectedDay: quickFilter === "day" ? selectedDay : undefined,
                    showMaximum: true,
                  });
                }}
                className="bg-blue-600 rounded-xl py-4 flex-row items-center justify-center active:bg-blue-700"
              >
                <Ionicons name="shield-checkmark" size={20} color="white" />
                <Text className="text-white text-base font-bold ml-2">
                  Show Maximum Safe Dividend
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Stock List with FlatList for virtualization */}
      <FlatList
        data={filteredStocks}
        renderItem={renderStockCard}
        keyExtractor={(item, index) => `${item.symbol}-${index}`}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: selectedStocks.length > 0 ? 120 : 20 }}
        ListEmptyComponent={
          !isHydrated || isRefreshing ? (
            <View className="items-center py-20">
              <ActivityIndicator size="large" color="#60a5fa" />
              <Text className="text-white text-xl font-semibold mt-4">
                {!isHydrated ? "Loading Saved Data..." : "Loading Dividend Data..."}
              </Text>
              <Text className="text-slate-400 text-base mt-2 text-center">
                {!isHydrated
                  ? "Retrieving your stocks from storage..."
                  : (refreshProgress.phase || `Fetching ${refreshProgress.symbol || "stocks"}...`)}
              </Text>
              {isHydrated && refreshProgress.total > 0 && (
                <Text className="text-blue-400 text-sm mt-2">
                  {refreshProgress.current} / {refreshProgress.total}
                </Text>
              )}
            </View>
          ) : (
            <View className="items-center py-20">
              <Ionicons name="calendar-outline" size={64} color="#64748b" />
              <Text className="text-white text-xl font-semibold mt-4">
                No Future Dividends Found
              </Text>
              <Text className="text-slate-400 text-base mt-2 text-center px-8">
                No stocks with ex-dividend dates of today or later.{"\n"}
                Tap below to refresh with live data.
              </Text>
              <Pressable
                onPress={() => refreshFromCSV(true)}
                className="mt-4 bg-blue-600 px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-semibold">Refresh Data</Text>
              </Pressable>
            </View>
          )
        }
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
      />

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
              onPress={() => {
                // If target dividend is set, use smart calculation
                if (targetDividend && parseFloat(targetDividend) > 0) {
                  navigation.navigate("AIAnalysis", {
                    stocks: selectedStockObjects.length > 0 ? selectedStockObjects : filteredStocks,
                    investmentAmount: parseFloat(investmentAmount) || 10000,
                    targetDividend: parseFloat(targetDividend),
                    selectedDay: quickFilter === "day" ? selectedDay : undefined,
                  });
                } else {
                  navigation.navigate("BulkCalculator", {
                    stocks: selectedStockObjects,
                    investmentAmount: parseFloat(investmentAmount) || 10000,
                  });
                }
              }}
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

      {/* Filter Modal - Advanced Filters */}
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
              <Text className="text-white text-2xl font-bold">Advanced Filters</Text>
              <Pressable
                onPress={() => setShowFilterModal(false)}
                className="w-10 h-10 rounded-full bg-slate-700 items-center justify-center"
              >
                <Ionicons name="close" size={24} color="white" />
              </Pressable>
            </View>
          </View>

          <ScrollView className="flex-1 p-6">
            {/* Month Filter */}
            <View className="mb-6">
              <Text className="text-white text-lg font-semibold mb-3">
                Filter by Month
              </Text>
              <View className="flex-row flex-wrap">
                {[
                  { num: 1, name: "Jan" },
                  { num: 2, name: "Feb" },
                  { num: 3, name: "Mar" },
                  { num: 4, name: "Apr" },
                  { num: 5, name: "May" },
                  { num: 6, name: "Jun" },
                  { num: 7, name: "Jul" },
                  { num: 8, name: "Aug" },
                  { num: 9, name: "Sep" },
                  { num: 10, name: "Oct" },
                  { num: 11, name: "Nov" },
                  { num: 12, name: "Dec" },
                ].map((month) => (
                  <Pressable
                    key={month.num}
                    onPress={() =>
                      setFilters((prev) =>
                        prev.month === month.num
                          ? { ...prev, month: undefined }
                          : { ...prev, month: month.num, quarter: undefined }
                      )
                    }
                    className={cn(
                      "px-4 py-2 rounded-lg mr-2 mb-2 border",
                      filters.month === month.num
                        ? "bg-blue-600 border-blue-600"
                        : "bg-slate-800 border-slate-700"
                    )}
                  >
                    <Text
                      className={cn(
                        "text-sm font-semibold",
                        filters.month === month.num
                          ? "text-white"
                          : "text-slate-400"
                      )}
                    >
                      {month.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Quarter Filter */}
            <View className="mb-6">
              <Text className="text-white text-lg font-semibold mb-3">
                Filter by Quarter
              </Text>
              <View className="flex-row">
                {[1, 2, 3, 4].map((quarter) => (
                  <Pressable
                    key={quarter}
                    onPress={() =>
                      setFilters((prev) =>
                        prev.quarter === quarter
                          ? { ...prev, quarter: undefined }
                          : { ...prev, quarter, month: undefined }
                      )
                    }
                    className={cn(
                      "flex-1 px-4 py-3 rounded-lg mr-2 border",
                      filters.quarter === quarter
                        ? "bg-blue-600 border-blue-600"
                        : "bg-slate-800 border-slate-700"
                    )}
                  >
                    <Text
                      className={cn(
                        "text-center text-sm font-semibold",
                        filters.quarter === quarter
                          ? "text-white"
                          : "text-slate-400"
                      )}
                    >
                      Q{quarter}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Yield Range Filter */}
            <View className="mb-6">
              <Text className="text-white text-lg font-semibold mb-3">
                Dividend Yield Range (%)
              </Text>
              <View className="flex-row space-x-3">
                <View className="flex-1">
                  <Text className="text-slate-400 text-xs mb-2">Min Yield</Text>
                  <View className="bg-slate-800 rounded-lg p-3 flex-row items-center">
                    <TextInput
                      value={filters.minYield?.toString() || ""}
                      onChangeText={(text) =>
                        setFilters((prev) => ({
                          ...prev,
                          minYield: text ? parseFloat(text) : undefined,
                        }))
                      }
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor="#64748b"
                      className="flex-1 text-white text-base"
                    />
                    <Text className="text-slate-400 text-base ml-1">%</Text>
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-slate-400 text-xs mb-2">Max Yield</Text>
                  <View className="bg-slate-800 rounded-lg p-3 flex-row items-center">
                    <TextInput
                      value={filters.maxYield?.toString() || ""}
                      onChangeText={(text) =>
                        setFilters((prev) => ({
                          ...prev,
                          maxYield: text ? parseFloat(text) : undefined,
                        }))
                      }
                      keyboardType="decimal-pad"
                      placeholder="15"
                      placeholderTextColor="#64748b"
                      className="flex-1 text-white text-base"
                    />
                    <Text className="text-slate-400 text-base ml-1">%</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Sector Filter */}
            <View className="mb-6">
              <Text className="text-white text-lg font-semibold mb-3">
                Filter by Sector
              </Text>
              <View className="flex-row flex-wrap">
                {getAllSectors().map((sector) => (
                  <Pressable
                    key={sector}
                    onPress={() =>
                      setFilters((prev) => {
                        const sectors = prev.sectors || [];
                        const newSectors = sectors.includes(sector)
                          ? sectors.filter((s) => s !== sector)
                          : [...sectors, sector];
                        return {
                          ...prev,
                          sectors: newSectors.length > 0 ? newSectors : undefined,
                        };
                      })
                    }
                    className={cn(
                      "px-3 py-2 rounded-lg mr-2 mb-2 border",
                      filters.sectors?.includes(sector)
                        ? "bg-blue-600 border-blue-600"
                        : "bg-slate-800 border-slate-700"
                    )}
                  >
                    <Text
                      className={cn(
                        "text-xs font-semibold",
                        filters.sectors?.includes(sector)
                          ? "text-white"
                          : "text-slate-400"
                      )}
                    >
                      {sector}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Clear Filters Button */}
            <Pressable
              onPress={() => {
                setFilters({});
                setShowFilterModal(false);
              }}
              className="bg-slate-700 rounded-xl py-4 items-center mb-4"
            >
              <Text className="text-white font-semibold text-base">
                Clear All Filters
              </Text>
            </Pressable>

            {/* Apply Filters Button */}
            <Pressable
              onPress={() => setShowFilterModal(false)}
              className="bg-blue-600 rounded-xl py-4 items-center mb-4"
            >
              <Text className="text-white font-bold text-base">
                Apply Filters
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <Pressable
            onPress={() => setShowDatePicker(false)}
            className="flex-1 bg-black/50 justify-center items-center"
          >
            <View className="bg-[#1e293b] rounded-2xl p-6 mx-4 w-11/12 max-w-md">
              <Text className="text-white text-xl font-bold mb-4">
                Select Ex-Dividend Date
              </Text>
              <DateTimePicker
                value={pickerDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, date) => {
                  if (date) {
                    setPickerDate(date);
                  }
                }}
                themeVariant="dark"
                textColor="#fff"
              />
              <View className="flex-row space-x-2 mt-4">
                <Pressable
                  onPress={() => setShowDatePicker(false)}
                  className="flex-1 bg-slate-700 rounded-xl py-3 items-center"
                >
                  <Text className="text-white font-semibold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    // Fix timezone issue by using local date components
                    const year = pickerDate.getFullYear();
                    const month = String(pickerDate.getMonth() + 1).padStart(2, '0');
                    const day = String(pickerDate.getDate()).padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;
                    setSelectedDay(dateStr);
                    setShowDatePicker(false);
                  }}
                  className="flex-1 bg-blue-600 rounded-xl py-3 items-center"
                >
                  <Text className="text-white font-semibold">Done</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}
