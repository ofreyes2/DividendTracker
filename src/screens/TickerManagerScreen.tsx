/**
 * Ticker Manager Screen
 * View and edit the ticker list for custom stock loading
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useStockDataStore } from "../state/stockDataStore";
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";

type Props = NativeStackScreenProps<RootStackParamList, "TickerManager">;

// Default tickers (fallback)
const DEFAULT_TICKERS = `# Dividend Stock Tickers
# Add one ticker symbol per line
# Lines starting with # are comments

# Technology
AAPL
MSFT
IBM
CSCO
INTC
TXN
QCOM
AVGO

# Healthcare
JNJ
PFE
ABBV
MRK
BMY
AMGN
GILD
LLY

# Consumer Goods
PG
KO
PEP
PM
MO
CL

# Energy
XOM
CVX
COP
KMI
OKE

# Financials
JPM
BAC
USB
WFC
BLK

# Utilities
NEE
DUK
SO
AEP
D

# Industrials
MMM
CAT
UPS
HON
LMT

# Telecommunications
T
VZ

# Real Estate
O
STAG
`;

export default function TickerManagerScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [tickerText, setTickerText] = useState(DEFAULT_TICKERS);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(true);
  const { refreshFromTickers, isRefreshing, refreshProgress } = useStockDataStore();

  // Load tickers from file on mount
  useEffect(() => {
    const loadTickersFromFile = async () => {
      try {
        // Load the asset from the assets folder
        const asset = Asset.fromModule(require("../../assets/tickers.txt"));
        await asset.downloadAsync();

        if (asset.localUri) {
          const content = await FileSystem.readAsStringAsync(asset.localUri);
          if (content && content.trim().length > 0) {
            setTickerText(content);
          }
        }
      } catch (error) {
        console.error("Failed to load tickers from file:", error);
        // Keep default tickers if file loading fails
      } finally {
        setIsLoadingFile(false);
      }
    };

    loadTickersFromFile();
  }, []);

  const parseTickers = (text: string): string[] => {
    return text
      .split("\n")
      .map(line => line.trim())
      .filter(line => line && !line.startsWith("#"));
  };

  const handleLoadTickers = async () => {
    const tickers = parseTickers(tickerText);

    if (tickers.length === 0) {
      alert("Please add at least one ticker symbol");
      return;
    }

    setIsSaving(true);
    try {
      await refreshFromTickers(tickers);
      navigation.goBack();
    } catch (error) {
      console.error("Failed to load tickers:", error);
      alert("Failed to load tickers. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const tickerCount = parseTickers(tickerText).length;

  // Show loading indicator while file is being loaded
  if (isLoadingFile) {
    return (
      <View className="flex-1 bg-[#0f172a] items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-slate-400 mt-4">Loading tickers...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0f172a]">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 16 }}
        className="px-6 pb-4 bg-[#1a2332] border-b border-slate-700"
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">Ticker Manager</Text>
            <Text className="text-slate-400 text-sm mt-1">
              {tickerCount} tickers • Add or remove stocks
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-slate-700 items-center justify-center active:bg-slate-600"
          >
            <Ionicons name="close" size={24} color="white" />
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-4">
        {/* Instructions */}
        <View className="bg-blue-900/30 border border-blue-600 rounded-xl p-4 mb-4">
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={24} color="#3b82f6" />
            <View className="flex-1 ml-3">
              <Text className="text-white font-semibold mb-2">How to Use</Text>
              <Text className="text-slate-300 text-sm mb-1">
                • Add one ticker symbol per line
              </Text>
              <Text className="text-slate-300 text-sm mb-1">
                • Use # for comments (will be ignored)
              </Text>
              <Text className="text-slate-300 text-sm mb-1">
                • Tap &ldquo;Load Stocks&rdquo; to fetch real data
              </Text>
              <Text className="text-slate-300 text-sm">
                • Only stocks with future ex-dates will appear
              </Text>
            </View>
          </View>
        </View>

        {/* Ticker Editor */}
        <View className="bg-[#1e293b] rounded-xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white font-semibold">Edit Tickers</Text>
            <Pressable
              onPress={() => setTickerText(DEFAULT_TICKERS)}
              className="bg-slate-700 px-3 py-1 rounded-lg active:bg-slate-600"
            >
              <Text className="text-slate-300 text-xs">Reset to Default</Text>
            </Pressable>
          </View>

          <TextInput
            value={tickerText}
            onChangeText={setTickerText}
            multiline
            numberOfLines={20}
            className="bg-slate-900 text-white p-4 rounded-lg font-mono text-sm"
            style={{ minHeight: 400 }}
            placeholderTextColor="#64748b"
          />
        </View>

        {/* Example Section */}
        <View className="bg-slate-800 rounded-xl p-4 mb-4">
          <Text className="text-white font-semibold mb-2">Example Format:</Text>
          <View className="bg-slate-900 p-3 rounded-lg">
            <Text className="text-slate-400 text-xs font-mono">
              # My dividend stocks{"\n"}
              AAPL{"\n"}
              MSFT{"\n"}
              JNJ{"\n"}
              {"\n"}
              # High yielders{"\n"}
              T{"\n"}
              VZ
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Loading Progress */}
      {isRefreshing && (
        <View className="px-6 py-4 bg-blue-900/30 border-t border-blue-600">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white font-semibold">Loading Stocks...</Text>
            <Text className="text-blue-400 font-bold">
              {refreshProgress.current}/{refreshProgress.total}
            </Text>
          </View>
          <Text className="text-slate-300 text-sm mb-2">
            Fetching {refreshProgress.symbol}
          </Text>
          <View className="bg-slate-700 rounded-full h-2 overflow-hidden">
            <View
              className="bg-blue-500 h-2"
              style={{
                width: `${(refreshProgress.current / refreshProgress.total) * 100}%`
              }}
            />
          </View>
        </View>
      )}

      {/* Action Buttons */}
      {!isRefreshing && (
        <View style={{ paddingBottom: insets.bottom }} className="px-6 py-4 bg-[#1a2332] border-t border-slate-700">
          <Pressable
            onPress={handleLoadTickers}
            disabled={isSaving || tickerCount === 0}
            className={`rounded-xl px-6 py-4 flex-row items-center justify-center ${
              isSaving || tickerCount === 0 ? "bg-slate-700" : "bg-emerald-600 active:bg-emerald-700"
            }`}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="cloud-download" size={20} color="white" />
                <Text className="text-white font-bold text-base ml-2">
                  Load {tickerCount} Stocks from Polygon.io
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}
