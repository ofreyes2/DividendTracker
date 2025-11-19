/**
 * Root Navigator
 * Main navigation structure for the app
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import StockListScreen from "../screens/StockListScreen";
import StockDetailScreen from "../screens/StockDetailScreen";
import BulkCalculatorScreen from "../screens/BulkCalculatorScreen";
import AIAnalysisScreen from "../screens/AIAnalysisScreen";
import PortfolioScreen from "../screens/PortfolioScreen";
import TickerManagerScreen from "../screens/TickerManagerScreen";
import AboutScreen from "../screens/AboutScreen";
import FeedbackScreen from "../screens/FeedbackScreen";
import PortfolioHelpScreen from "../screens/PortfolioHelpScreen";
import type { DividendStock } from "../api/comprehensive-stock-data";

export type RootStackParamList = {
  StockList: undefined;
  StockDetail: {
    stock: DividendStock;
  };
  BulkCalculator: {
    stocks: DividendStock[];
    investmentAmount: number;
  };
  AIAnalysis: {
    stocks: DividendStock[];
    investmentAmount: number;
    targetDividend?: number;
    selectedDay?: string;
    showMaximum?: boolean;
  };
  Portfolio: undefined;
  TransactionDetail: {
    transactionId: string;
  };
  TickerManager: undefined;
  About: undefined;
  Feedback: undefined;
  PortfolioHelp: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "default",
      }}
      initialRouteName="StockList"
    >
      <Stack.Screen name="StockList" component={StockListScreen} />
      <Stack.Screen name="StockDetail" component={StockDetailScreen} />
      <Stack.Screen name="Portfolio" component={PortfolioScreen} />
      <Stack.Screen
        name="BulkCalculator"
        component={BulkCalculatorScreen}
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="AIAnalysis"
        component={AIAnalysisScreen}
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="TickerManager"
        component={TickerManagerScreen}
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="PortfolioHelp" component={PortfolioHelpScreen} />
    </Stack.Navigator>
  );
}
