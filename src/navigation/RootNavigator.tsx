/**
 * Root Navigator
 * Main navigation structure for the app
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import StockListScreen from "../screens/StockListScreen";
import BulkCalculatorScreen from "../screens/BulkCalculatorScreen";
import AIAnalysisScreen from "../screens/AIAnalysisScreen";
import type { DividendStock } from "../api/comprehensive-stock-data";

export type RootStackParamList = {
  StockList: undefined;
  BulkCalculator: {
    stocks: DividendStock[];
    investmentAmount: number;
  };
  AIAnalysis: {
    stocks: DividendStock[];
    investmentAmount: number;
  };
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
    </Stack.Navigator>
  );
}
