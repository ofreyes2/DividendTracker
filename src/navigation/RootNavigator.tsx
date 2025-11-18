/**
 * Root Navigator
 * Main navigation structure for the app
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DividendScreener from "../screens/DividendScreener";
import AddStockModal from "../screens/AddStockModal";
import InvestmentCalculator from "../screens/InvestmentCalculator";

export type RootStackParamList = {
  DividendScreener: undefined;
  AddStockModal: undefined;
  InvestmentCalculator: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "default",
      }}
    >
      <Stack.Screen name="DividendScreener" component={DividendScreener} />
      <Stack.Screen
        name="AddStockModal"
        component={AddStockModal}
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="InvestmentCalculator"
        component={InvestmentCalculator}
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack.Navigator>
  );
}
