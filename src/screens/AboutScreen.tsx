/**
 * About Screen
 * Displays app information, version, and changelog
 */

import React, { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useStockDataStore } from "../state/stockDataStore";

// Version management - update this with every change
const APP_VERSION = "2.0.0";
const VERSION_DATE = "2025-11-19";

interface AboutScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "About">;
}

export default function AboutScreen({ navigation }: AboutScreenProps) {
  const insets = useSafeAreaInsets();
  const [showTimestamp, setShowTimestamp] = useState(false);
  const lastRefreshTime = useStockDataStore(s => s.lastRefreshTime);

  return (
    <View className="flex-1 bg-[#0f172a]">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 16 }}
        className="px-6 pb-4 bg-[#1a2332] border-b border-slate-700"
      >
        <View className="flex-row items-center">
          <Pressable onPress={() => navigation.goBack()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
          <View>
            <Text className="text-white text-xl font-bold">About</Text>
            <Text className="text-slate-400 text-sm">App Information</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        {/* App Info Card */}
        <View className="bg-[#1a2332] rounded-xl p-6 mb-4 border border-slate-700">
          <View className="items-center mb-6">
            <View className="w-20 h-20 bg-emerald-600 rounded-2xl items-center justify-center mb-4">
              <Ionicons name="trending-up" size={40} color="white" />
            </View>
            <Text className="text-white text-2xl font-bold mb-2">
              Daily Dividend Capture
            </Text>
            <Text className="text-slate-400 text-sm mb-1">
              Version {APP_VERSION}
            </Text>
            <Text className="text-slate-500 text-xs">
              Released: {VERSION_DATE}
            </Text>

            {/* Last Updated Timestamp Toggle */}
            <Pressable
              onPress={() => setShowTimestamp(!showTimestamp)}
              className="mt-3 bg-slate-700/50 px-3 py-2 rounded-lg active:bg-slate-700"
            >
              <Text className="text-slate-400 text-xs">
                {showTimestamp && lastRefreshTime
                  ? `Last data update: ${new Date(lastRefreshTime).toLocaleString()}`
                  : "Tap for last update time"}
              </Text>
            </Pressable>
          </View>

          <View className="border-t border-slate-700 pt-4">
            <Text className="text-white text-base font-semibold mb-3">
              About This App
            </Text>
            <Text className="text-slate-300 text-sm leading-6 mb-4">
              Daily Dividend Capture is a professional trading app designed for active traders
              executing dividend capture strategies. Buy stocks before their ex-dividend date,
              collect dividend payments, then sell and rotate capital to the next opportunity.
            </Text>
            <Text className="text-slate-300 text-sm leading-6">
              Features real-time market data from Polygon.io, AI-powered stock analysis,
              comprehensive dividend tracking, and intelligent position sizing to help you hit
              your daily income targets.
            </Text>
          </View>
        </View>

        {/* Features Card */}
        <View className="bg-[#1a2332] rounded-xl p-6 mb-4 border border-slate-700">
          <Text className="text-white text-lg font-bold mb-4">Key Features</Text>

          <FeatureItem
            icon="pulse"
            title="Real-Time WebSocket Data"
            description="Second-by-second price updates with 15-minute delayed market data"
          />
          <FeatureItem
            icon="calendar"
            title="Automated Background Refresh"
            description="Dividend data refreshes automatically once daily in the background"
          />
          <FeatureItem
            icon="analytics"
            title="11,000+ Tickers"
            description="Access comprehensive dividend stock universe with chunked loading"
          />
          <FeatureItem
            icon="bulb"
            title="AI-Powered Analysis"
            description="GPT-4o powered stock analysis and recommendations"
          />
          <FeatureItem
            icon="wallet"
            title="Portfolio Tracking"
            description="Track positions, upcoming dividends, and monthly income"
          />
          <FeatureItem
            icon="calculator"
            title="Position Sizing"
            description="Calculate exact shares needed to hit your daily dividend targets"
            isLast
          />
        </View>

        {/* Tech Stack Card */}
        <View className="bg-[#1a2332] rounded-xl p-6 mb-4 border border-slate-700">
          <Text className="text-white text-lg font-bold mb-4">Technology</Text>

          <TechItem label="Framework" value="React Native 0.76.7" />
          <TechItem label="Platform" value="Expo SDK 53" />
          <TechItem label="Data Provider" value="Polygon.io (Massive)" />
          <TechItem label="AI Engine" value="OpenAI GPT-4o" />
          <TechItem label="State Management" value="Zustand + AsyncStorage" />
          <TechItem label="Real-Time Data" value="WebSocket (Second Aggregates)" isLast />
        </View>

        {/* Changelog Card */}
        <View className="bg-[#1a2332] rounded-xl p-6 mb-4 border border-slate-700">
          <Text className="text-white text-lg font-bold mb-4">Recent Updates</Text>

          <ChangelogItem
            version="2.0.0"
            date="2025-11-19"
            changes={[
              "Added WebSocket second-level aggregates for real-time price updates",
              "Implemented automated background refresh for dividend data",
              "Added chunked loading to handle 11k+ tickers without crashes",
              "Removed manual refresh buttons - all updates are automatic",
              "Added subtle timestamp display for last WebSocket update",
              "Created About page with version tracking",
              "Added Feedback form for user submissions",
            ]}
          />

          <ChangelogItem
            version="1.5.0"
            date="2025-11-18"
            changes={[
              "Integrated Polygon.io API for real market data",
              "Added 11,000+ ticker support",
              "Implemented in-app ticker manager",
              "Added persistent storage for stock data",
            ]}
            isLast
          />
        </View>

        {/* Feedback Button */}
        <Pressable
          onPress={() => navigation.navigate("Feedback")}
          className="bg-blue-600 rounded-xl p-4 flex-row items-center justify-center mb-6 active:bg-blue-700"
        >
          <Ionicons name="chatbox-ellipses" size={20} color="white" />
          <Text className="text-white font-semibold ml-2">Send Feedback</Text>
        </Pressable>

        {/* Footer */}
        <View className="items-center mb-8">
          <Text className="text-slate-500 text-xs mb-1">Built with Vibecode</Text>
          <Text className="text-slate-600 text-xs">
            © 2025 Daily Dividend Capture. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Feature Item Component
function FeatureItem({
  icon,
  title,
  description,
  isLast = false,
}: {
  icon: string;
  title: string;
  description: string;
  isLast?: boolean;
}) {
  return (
    <View className={`flex-row ${!isLast ? "mb-4" : ""}`}>
      <View className="w-10 h-10 bg-emerald-600/20 rounded-lg items-center justify-center mr-3">
        <Ionicons name={icon as any} size={20} color="#10b981" />
      </View>
      <View className="flex-1">
        <Text className="text-white font-semibold mb-1">{title}</Text>
        <Text className="text-slate-400 text-sm leading-5">{description}</Text>
      </View>
    </View>
  );
}

// Tech Item Component
function TechItem({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      className={`flex-row justify-between py-3 ${!isLast ? "border-b border-slate-700" : ""}`}
    >
      <Text className="text-slate-400 text-sm">{label}</Text>
      <Text className="text-white text-sm font-medium">{value}</Text>
    </View>
  );
}

// Changelog Item Component
function ChangelogItem({
  version,
  date,
  changes,
  isLast = false,
}: {
  version: string;
  date: string;
  changes: string[];
  isLast?: boolean;
}) {
  return (
    <View className={`${!isLast ? "mb-6 pb-6 border-b border-slate-700" : ""}`}>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-white font-bold text-base">Version {version}</Text>
        <Text className="text-slate-400 text-xs">{date}</Text>
      </View>
      {changes.map((change, index) => (
        <View key={index} className="flex-row mb-2">
          <Text className="text-emerald-400 mr-2">•</Text>
          <Text className="text-slate-300 text-sm flex-1">{change}</Text>
        </View>
      ))}
    </View>
  );
}

export { APP_VERSION, VERSION_DATE };
