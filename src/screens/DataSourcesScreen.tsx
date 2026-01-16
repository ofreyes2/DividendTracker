/**
 * Data Sources Screen
 *
 * Documents all API sources used in the app and shows:
 * - API status (available/unavailable)
 * - Last data refresh time
 * - Data source documentation
 * - Live data feed with progressive loading
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import {
  getDataSourceStatus,
  fetchLiveDividendDataBatch,
  convertToDividendStock,
  type LiveDividendData,
  type DataSourceStatus,
} from "../api/live-dividend-service";
import { fetchMarketNews, type YahooNews } from "../api/yahoo-finance";
import { useStockDataStore } from "../state/stockDataStore";
import { TICKERS } from "../data/nanotickers";
import { cn } from "../utils/cn";

interface DataSourcesScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "DataSources">;
}

// API documentation
const API_DOCUMENTATION = [
  {
    name: "Polygon.io",
    type: "Paid API (with free tier)",
    description: "Professional-grade stock market data provider. Primary source for dividend information, technical indicators (MACD, RSI, SMA), and real-time quotes.",
    endpoints: [
      "GET /v3/reference/dividends - Dividend calendar data",
      "GET /v2/aggs/ticker/{symbol}/prev - Previous day OHLCV",
      "GET /v3/reference/tickers/{symbol} - Company details",
      "GET /v1/indicators/rsi - RSI technical indicator",
      "GET /v1/indicators/macd - MACD technical indicator",
      "GET /v1/indicators/sma - Simple Moving Average",
      "GET /v2/aggs/ticker/{symbol}/range - Historical data",
    ],
    rateLimit: "5 requests/second (free tier)",
    docs: "https://polygon.io/docs",
    status: "checking",
  },
  {
    name: "Yahoo Finance",
    type: "Free API (unofficial)",
    description: "Free stock market data including quotes, news, analyst recommendations. Used as backup and for news/analysis features.",
    endpoints: [
      "GET /v7/finance/quote - Real-time quotes for multiple symbols",
      "GET /v1/finance/search - Stock search and news",
      "GET /v10/finance/quoteSummary - Detailed stock info",
    ],
    rateLimit: "No official limit (be respectful)",
    docs: "Unofficial - reverse engineered",
    status: "checking",
  },
  {
    name: "Local CSV Data",
    type: "Offline Data",
    description: "Pre-loaded dividend data for ~926 tickers. Provides instant loading without API calls. Includes dividend amounts, dates, yields, and payout ratios.",
    endpoints: ["Local file: src/data/tickers.csv"],
    rateLimit: "Unlimited (local)",
    docs: "Internal dataset",
    status: "available",
  },
];

export default function DataSourcesScreen({ navigation }: DataSourcesScreenProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"apis" | "live" | "news">("apis");
  const [apiStatus, setApiStatus] = useState<DataSourceStatus[]>([]);
  const [liveStocks, setLiveStocks] = useState<LiveDividendData[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [loadProgress, setLoadProgress] = useState({ current: 0, total: 0 });
  const [news, setNews] = useState<YahooNews[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { stocks, setStocks, lastRefreshTime } = useStockDataStore();

  // Check API status on mount
  useEffect(() => {
    checkApiStatus();
  }, []);

  // Load news when tab changes
  useEffect(() => {
    if (activeTab === "news" && news.length === 0) {
      loadNews();
    }
  }, [activeTab]);

  const checkApiStatus = () => {
    const status = getDataSourceStatus();
    setApiStatus(status);
  };

  const loadNews = async () => {
    setIsLoadingNews(true);
    try {
      const newsData = await fetchMarketNews(20);
      setNews(newsData);
    } catch (error) {
      console.error("Failed to load news:", error);
    } finally {
      setIsLoadingNews(false);
    }
  };

  const startLiveDataFetch = useCallback(async () => {
    if (isLoadingLive) return;

    setIsLoadingLive(true);
    setLiveStocks([]);

    // Get tickers to fetch
    const tickers = TICKERS.split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .slice(0, 500); // Limit for demo

    setLoadProgress({ current: 0, total: tickers.length });

    try {
      // Fetch with progress updates
      const results = await fetchLiveDividendDataBatch(
        tickers,
        (loaded, current, total) => {
          setLoadProgress({ current, total });
          setLiveStocks([...loaded]);

          // Update main store with converted data
          if (loaded.length > 0) {
            const converted = loaded.map(convertToDividendStock);
            setStocks(converted);
          }
        },
        (stock) => {
          // Called when each individual stock is loaded
          console.log(`[LiveFetch] Loaded: ${stock.symbol} - Ex-Date: ${stock.exDividendDate}`);
        }
      );

      console.log(`[LiveFetch] Complete: ${results.length} stocks with future dividends`);

      // Final update
      const converted = results.map(convertToDividendStock);
      setStocks(converted);
    } catch (error) {
      console.error("Live data fetch failed:", error);
    } finally {
      setIsLoadingLive(false);
    }
  }, [isLoadingLive, setStocks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    checkApiStatus();
    if (activeTab === "news") {
      await loadNews();
    }
    setRefreshing(false);
  }, [activeTab]);

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatNewsDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "text-emerald-400";
      case "unavailable":
        return "text-red-400";
      case "rate_limited":
        return "text-amber-400";
      default:
        return "text-slate-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return "checkmark-circle";
      case "unavailable":
        return "close-circle";
      case "rate_limited":
        return "warning";
      default:
        return "help-circle";
    }
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
            <Ionicons name="arrow-back" size={22} color="white" />
          </Pressable>
          <Text className="text-white text-xl font-bold">Data Sources</Text>
          <Pressable
            onPress={checkApiStatus}
            className="w-10 h-10 rounded-full bg-slate-700 items-center justify-center"
          >
            <Ionicons name="refresh" size={22} color="white" />
          </Pressable>
        </View>

        {/* Tabs */}
        <View className="flex-row bg-slate-800 rounded-xl p-1">
          <Pressable
            onPress={() => setActiveTab("apis")}
            className={cn(
              "flex-1 py-2 rounded-lg",
              activeTab === "apis" ? "bg-blue-600" : ""
            )}
          >
            <Text
              className={cn(
                "text-center font-semibold text-sm",
                activeTab === "apis" ? "text-white" : "text-slate-400"
              )}
            >
              APIs
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("live")}
            className={cn(
              "flex-1 py-2 rounded-lg",
              activeTab === "live" ? "bg-blue-600" : ""
            )}
          >
            <Text
              className={cn(
                "text-center font-semibold text-sm",
                activeTab === "live" ? "text-white" : "text-slate-400"
              )}
            >
              Live Data
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("news")}
            className={cn(
              "flex-1 py-2 rounded-lg",
              activeTab === "news" ? "bg-blue-600" : ""
            )}
          >
            <Text
              className={cn(
                "text-center font-semibold text-sm",
                activeTab === "news" ? "text-white" : "text-slate-400"
              )}
            >
              News
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#60a5fa" />
        }
      >
        {/* API Documentation Tab */}
        {activeTab === "apis" && (
          <View className="pb-8">
            {/* Last Refresh Info */}
            <View className="bg-slate-800/50 rounded-xl p-4 mb-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-slate-400 text-sm">Last Data Refresh</Text>
                <Text className="text-white font-semibold">
                  {formatDate(lastRefreshTime || 0)}
                </Text>
              </View>
              <View className="flex-row items-center justify-between mt-2">
                <Text className="text-slate-400 text-sm">Stocks Loaded</Text>
                <Text className="text-emerald-400 font-semibold">{stocks.length}</Text>
              </View>
            </View>

            {/* API Cards */}
            {API_DOCUMENTATION.map((api, index) => (
              <View key={index} className="bg-[#1e293b] rounded-xl p-4 mb-4 border border-slate-700">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center flex-1">
                    <Ionicons
                      name={
                        api.name === "Polygon.io"
                          ? "analytics"
                          : api.name === "Yahoo Finance"
                          ? "globe"
                          : "document"
                      }
                      size={24}
                      color="#60a5fa"
                    />
                    <View className="ml-3 flex-1">
                      <Text className="text-white font-bold text-lg">{api.name}</Text>
                      <Text className="text-slate-400 text-xs">{api.type}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons
                      name={getStatusIcon(apiStatus.find((s) => s.name === api.name)?.status || api.status) as any}
                      size={18}
                      color={
                        (apiStatus.find((s) => s.name === api.name)?.status || api.status) === "available"
                          ? "#10b981"
                          : (apiStatus.find((s) => s.name === api.name)?.status || api.status) === "rate_limited"
                          ? "#f59e0b"
                          : "#ef4444"
                      }
                    />
                    <Text
                      className={cn(
                        "ml-1 text-xs font-semibold capitalize",
                        getStatusColor(apiStatus.find((s) => s.name === api.name)?.status || api.status)
                      )}
                    >
                      {apiStatus.find((s) => s.name === api.name)?.status || api.status}
                    </Text>
                  </View>
                </View>

                {/* Description */}
                <Text className="text-slate-300 text-sm mb-3">{api.description}</Text>

                {/* Endpoints */}
                <View className="bg-slate-800/50 rounded-lg p-3 mb-3">
                  <Text className="text-slate-400 text-xs font-semibold mb-2">ENDPOINTS</Text>
                  {api.endpoints.map((endpoint, i) => (
                    <Text key={i} className="text-slate-300 text-[10px] font-mono mb-1">
                      {endpoint}
                    </Text>
                  ))}
                </View>

                {/* Rate Limit & Docs */}
                <View className="flex-row justify-between">
                  <View>
                    <Text className="text-slate-400 text-xs">Rate Limit</Text>
                    <Text className="text-white text-xs font-semibold">{api.rateLimit}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-slate-400 text-xs">Documentation</Text>
                    <Text className="text-blue-400 text-xs font-semibold">{api.docs}</Text>
                  </View>
                </View>
              </View>
            ))}

            {/* Data Update Info */}
            <View className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-4">
              <View className="flex-row items-start">
                <Ionicons name="information-circle" size={20} color="#f59e0b" />
                <View className="ml-2 flex-1">
                  <Text className="text-amber-400 font-semibold text-sm">Data Update Schedule</Text>
                  <Text className="text-slate-300 text-xs mt-1">
                    • Dividend data refreshes daily at 5-7 PM EST{"\n"}
                    • Price data updates every 15 minutes{"\n"}
                    • Technical indicators recalculated after market close{"\n"}
                    • All market data is delayed 15 minutes
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Live Data Tab */}
        {activeTab === "live" && (
          <View className="pb-8">
            {/* Fetch Button */}
            <Pressable
              onPress={startLiveDataFetch}
              disabled={isLoadingLive}
              className={cn(
                "rounded-xl py-4 flex-row items-center justify-center mb-4",
                isLoadingLive ? "bg-slate-700" : "bg-emerald-600"
              )}
            >
              {isLoadingLive ? (
                <>
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white font-bold ml-2">
                    Loading... {loadProgress.current}/{loadProgress.total}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="download" size={20} color="white" />
                  <Text className="text-white font-bold ml-2">
                    Fetch Live Dividend Data
                  </Text>
                </>
              )}
            </Pressable>

            {/* Progress Bar */}
            {isLoadingLive && loadProgress.total > 0 && (
              <View className="bg-slate-800 rounded-xl p-4 mb-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-slate-400 text-sm">Progress</Text>
                  <Text className="text-white font-semibold">
                    {liveStocks.length} stocks found
                  </Text>
                </View>
                <View className="bg-slate-700 h-2 rounded-full overflow-hidden">
                  <View
                    className="bg-emerald-500 h-full"
                    style={{
                      width: `${(loadProgress.current / loadProgress.total) * 100}%`,
                    }}
                  />
                </View>
              </View>
            )}

            {/* Live Stocks List */}
            {liveStocks.length > 0 && (
              <View>
                <Text className="text-white font-bold text-lg mb-3">
                  Upcoming Dividends ({liveStocks.length})
                </Text>
                {liveStocks.slice(0, 50).map((stock, index) => (
                  <View
                    key={`${stock.symbol}-${index}`}
                    className="bg-[#1e293b] rounded-xl p-3 mb-2 border border-slate-700"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center">
                        <Text className="text-white font-bold text-base">{stock.symbol}</Text>
                        <View
                          className={cn(
                            "ml-2 px-2 py-0.5 rounded",
                            stock.dataSource === "polygon"
                              ? "bg-blue-900/50"
                              : stock.dataSource === "yahoo"
                              ? "bg-purple-900/50"
                              : "bg-slate-700"
                          )}
                        >
                          <Text className="text-xs text-slate-300">{stock.dataSource}</Text>
                        </View>
                      </View>
                      <Text className="text-white font-bold">${stock.price.toFixed(2)}</Text>
                    </View>
                    <Text className="text-slate-400 text-xs mb-2" numberOfLines={1}>
                      {stock.companyName}
                    </Text>
                    <View className="flex-row justify-between">
                      <View>
                        <Text className="text-slate-400 text-[10px]">Ex-Date</Text>
                        <Text className="text-white text-xs font-semibold">
                          {stock.exDividendDate}
                        </Text>
                      </View>
                      <View className="items-center">
                        <Text className="text-slate-400 text-[10px]">Yield</Text>
                        <Text className="text-emerald-400 text-xs font-bold">
                          {stock.dividendYield.toFixed(2)}%
                        </Text>
                      </View>
                      <View className="items-center">
                        <Text className="text-slate-400 text-[10px]">52W H/L</Text>
                        <Text className="text-white text-xs font-semibold">
                          ${stock.week52High.toFixed(0)} / ${stock.week52Low.toFixed(0)}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-slate-400 text-[10px]">Volume</Text>
                        <Text className="text-white text-xs font-semibold">
                          {(stock.volume / 1000000).toFixed(1)}M
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
                {liveStocks.length > 50 && (
                  <Text className="text-slate-400 text-center py-4">
                    + {liveStocks.length - 50} more stocks
                  </Text>
                )}
              </View>
            )}

            {!isLoadingLive && liveStocks.length === 0 && (
              <View className="items-center py-12">
                <Ionicons name="cloud-download-outline" size={64} color="#64748b" />
                <Text className="text-white text-lg font-semibold mt-4">No Live Data</Text>
                <Text className="text-slate-400 text-sm mt-2 text-center">
                  Tap the button above to fetch live dividend data{"\n"}
                  from all available API sources
                </Text>
              </View>
            )}
          </View>
        )}

        {/* News Tab */}
        {activeTab === "news" && (
          <View className="pb-8">
            {isLoadingNews ? (
              <View className="items-center py-12">
                <ActivityIndicator size="large" color="#60a5fa" />
                <Text className="text-slate-400 mt-4">Loading news...</Text>
              </View>
            ) : news.length > 0 ? (
              <View>
                <Text className="text-white font-bold text-lg mb-3">
                  Dividend Stock News
                </Text>
                {news.map((item, index) => (
                  <View
                    key={item.uuid || index}
                    className="bg-[#1e293b] rounded-xl p-4 mb-3 border border-slate-700"
                  >
                    <Text className="text-white font-semibold text-sm mb-2">
                      {item.title}
                    </Text>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-slate-400 text-xs">{item.publisher}</Text>
                      <Text className="text-slate-500 text-xs">
                        {formatNewsDate(item.providerPublishTime)}
                      </Text>
                    </View>
                    {item.relatedTickers && item.relatedTickers.length > 0 && (
                      <View className="flex-row flex-wrap mt-2">
                        {item.relatedTickers.slice(0, 5).map((ticker, i) => (
                          <View key={i} className="bg-slate-700 px-2 py-1 rounded mr-1 mb-1">
                            <Text className="text-blue-400 text-xs font-semibold">{ticker}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View className="items-center py-12">
                <Ionicons name="newspaper-outline" size={64} color="#64748b" />
                <Text className="text-white text-lg font-semibold mt-4">No News Available</Text>
                <Text className="text-slate-400 text-sm mt-2">Pull down to refresh</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
