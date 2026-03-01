/**
 * Portfolio Help Screen
 * Explains how to use the portfolio tracking features
 */

import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";

interface PortfolioHelpScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "PortfolioHelp">;
}

export default function PortfolioHelpScreen({ navigation }: PortfolioHelpScreenProps) {
  const insets = useSafeAreaInsets();

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
            <Text className="text-white text-xl font-bold">Portfolio Guide</Text>
            <Text className="text-slate-400 text-sm">Learn how to track your investments</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        {/* What is Portfolio Section */}
        <View className="bg-[#1a2332] rounded-xl p-6 mb-4 border border-slate-700">
          <View className="flex-row items-center mb-4">
            <View className="w-12 h-12 bg-blue-600/20 rounded-xl items-center justify-center mr-3">
              <Ionicons name="briefcase" size={24} color="#3b82f6" />
            </View>
            <Text className="text-white text-xl font-bold flex-1">What is Portfolio?</Text>
          </View>

          <Text className="text-slate-300 text-base leading-6 mb-4">
            The Portfolio feature helps you track all your dividend stock investments in one place.
            Record your purchases, monitor upcoming dividend payments, and see your total dividend
            income over time.
          </Text>

          <View className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
            <Text className="text-blue-400 text-sm leading-5">
              <Text className="font-semibold">Perfect for Dividend Capture Strategy:</Text> Track
              each stock you buy before ex-dividend date, see exactly when dividends are due, and
              monitor your daily/monthly dividend income.
            </Text>
          </View>
        </View>

        {/* How to Use Section */}
        <View className="bg-[#1a2332] rounded-xl p-6 mb-4 border border-slate-700">
          <Text className="text-white text-lg font-bold mb-4">How to Use Portfolio</Text>

          <StepItem
            number={1}
            title="Add a Stock Position"
            description="From any stock detail screen, tap the 'Buy' button. Enter the number of shares and purchase price."
          />

          <StepItem
            number={2}
            title="View Your Positions"
            description='In Portfolio, tap the "Positions" tab to see all your current holdings with real-time values.'
          />

          <StepItem
            number={3}
            title="Track Upcoming Dividends"
            description='Switch to "Upcoming" tab to see all dividend payments coming in the next 30 days.'
          />

          <StepItem
            number={4}
            title="Monthly Income Calendar"
            description='Use the "Calendar" tab to see your total dividend income organized by month.'
            isLast
          />
        </View>

        {/* Portfolio Tabs Explained */}
        <View className="bg-[#1a2332] rounded-xl p-6 mb-4 border border-slate-700">
          <Text className="text-white text-lg font-bold mb-4">Portfolio Tabs Explained</Text>

          <TabItem
            icon="file-tray-stacked"
            title="Positions"
            description="View all your active stock holdings. See shares owned, purchase price, current value, and expected dividend per share."
          />

          <TabItem
            icon="calendar"
            title="Upcoming"
            description="Shows all dividend payments due in the next 30 days. Never miss a payment date!"
          />

          <TabItem
            icon="calendar-outline"
            title="Calendar"
            description="Monthly breakdown of your dividend income. See which stocks pay dividends each month and your total monthly income."
            isLast
          />
        </View>

        {/* Key Metrics Section */}
        <View className="bg-[#1a2332] rounded-xl p-6 mb-4 border border-slate-700">
          <Text className="text-white text-lg font-bold mb-4">Key Metrics You Will See</Text>

          <MetricItem
            icon="cash"
            label="Total Invested"
            description="Sum of all your stock purchases at the prices you paid"
          />

          <MetricItem
            icon="trending-up"
            label="Total Dividends"
            description="Cumulative dividend income received from all your holdings"
          />

          <MetricItem
            icon="wallet"
            label="Current Value"
            description="Real-time value of each position based on latest stock price"
          />

          <MetricItem
            icon="pie-chart"
            label="Next Payment"
            description="Expected dividend amount for the next payment cycle"
            isLast
          />
        </View>

        {/* Tips Section */}
        <View className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-6 mb-4">
          <View className="flex-row items-center mb-3">
            <Ionicons name="bulb" size={20} color="#10b981" />
            <Text className="text-emerald-400 font-bold text-base ml-2">Pro Tips</Text>
          </View>

          <TipItem text="Record purchases immediately after buying to track everything accurately" />
          <TipItem text="Check 'Upcoming' tab daily during active trading to know when dividends arrive" />
          <TipItem text="Use 'Calendar' view to plan your monthly income and identify gaps" />
          <TipItem
            text="For dividend capture, sell positions after ex-date and record the sale to keep portfolio clean"
            isLast
          />
        </View>

        {/* Example Workflow */}
        <View className="bg-[#1a2332] rounded-xl p-6 mb-6 border border-slate-700">
          <Text className="text-white text-lg font-bold mb-4">Example: Daily Dividend Capture</Text>

          <WorkflowStep
            day="Monday"
            action="Find VZ stock going ex-dividend tomorrow"
            detail="Buy 1,000 shares at $40.50 = $40,500"
          />

          <WorkflowStep
            day="Monday Evening"
            action="Add to Portfolio"
            detail='Tap Buy button, enter 1,000 shares at $40.50. See "Next Payment: $675"'
          />

          <WorkflowStep
            day="Tuesday"
            action="Ex-Dividend Date"
            detail='Stock marked ex-dividend. Check "Upcoming" - dividend payment shows for Dec 15'
          />

          <WorkflowStep
            day="Wednesday"
            action="Sell Position"
            detail="Sell 1,000 shares. Record sale in portfolio. Move to next opportunity"
          />

          <WorkflowStep
            day="Dec 15"
            action="Dividend Arrives"
            detail='$675 dividend hits your brokerage account. Portfolio "Calendar" tracks it'
            isLast
          />
        </View>

        {/* Action Button */}
        <Pressable
          onPress={() => navigation.goBack()}
          className="bg-blue-600 rounded-xl p-4 flex-row items-center justify-center mb-6 active:bg-blue-700"
        >
          <Ionicons name="checkmark-circle" size={20} color="white" />
          <Text className="text-white font-semibold ml-2">Got It!</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// Step Item Component
function StepItem({
  number,
  title,
  description,
  isLast = false,
}: {
  number: number;
  title: string;
  description: string;
  isLast?: boolean;
}) {
  return (
    <View className={`flex-row ${!isLast ? "mb-4" : ""}`}>
      <View className="w-8 h-8 bg-blue-600 rounded-full items-center justify-center mr-3 mt-1">
        <Text className="text-white font-bold text-sm">{number}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-white font-semibold mb-1">{title}</Text>
        <Text className="text-slate-400 text-sm leading-5">{description}</Text>
      </View>
    </View>
  );
}

// Tab Item Component
function TabItem({
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
      <View className="w-10 h-10 bg-blue-600/20 rounded-lg items-center justify-center mr-3">
        <Ionicons name={icon as any} size={20} color="#3b82f6" />
      </View>
      <View className="flex-1">
        <Text className="text-white font-semibold mb-1">{title}</Text>
        <Text className="text-slate-400 text-sm leading-5">{description}</Text>
      </View>
    </View>
  );
}

// Metric Item Component
function MetricItem({
  icon,
  label,
  description,
  isLast = false,
}: {
  icon: string;
  label: string;
  description: string;
  isLast?: boolean;
}) {
  return (
    <View className={`flex-row items-start ${!isLast ? "mb-3" : ""}`}>
      <Ionicons name={icon as any} size={18} color="#10b981" />
      <View className="flex-1 ml-3">
        <Text className="text-white font-medium text-sm">{label}</Text>
        <Text className="text-slate-400 text-xs leading-4 mt-0.5">{description}</Text>
      </View>
    </View>
  );
}

// Tip Item Component
function TipItem({ text, isLast = false }: { text: string; isLast?: boolean }) {
  return (
    <View className={`flex-row ${!isLast ? "mb-2" : ""}`}>
      <Text className="text-emerald-400 mr-2">•</Text>
      <Text className="text-slate-300 text-sm flex-1 leading-5">{text}</Text>
    </View>
  );
}

// Workflow Step Component
function WorkflowStep({
  day,
  action,
  detail,
  isLast = false,
}: {
  day: string;
  action: string;
  detail: string;
  isLast?: boolean;
}) {
  return (
    <View className={`${!isLast ? "mb-4 pb-4 border-b border-slate-700" : ""}`}>
      <Text className="text-blue-400 font-bold text-sm mb-1">{day}</Text>
      <Text className="text-white font-semibold mb-1">{action}</Text>
      <Text className="text-slate-400 text-sm leading-5">{detail}</Text>
    </View>
  );
}
