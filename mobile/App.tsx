import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect } from "react";
import RootNavigator from "./src/navigation/RootNavigator";
import { registerBackgroundRefreshTask } from "./src/services/backgroundRefreshService";
import { useStockDataStore } from "./src/state/stockDataStore";
import { startAutomaticDailyRefresh } from "./src/api/comprehensive-stock-data";
import { startDividendUpdateScheduler } from "./src/api/scheduled-dividend-updater";

/*
IMPORTANT NOTICE: DO NOT REMOVE
There are already environment keys in the project.
Before telling the user to add them, check if you already have access to the required keys through bash.
Directly access them with process.env.${key}

Correct usage:
process.env.EXPO_PUBLIC_VIBECODE_{key}
//directly access the key

Incorrect usage:
import { OPENAI_API_KEY } from '@env';
//don't use @env, its depreicated

Incorrect usage:
import Constants from 'expo-constants';
const openai_api_key = Constants.expoConfig.extra.apikey;
//don't use expo-constants, its depreicated

*/

export default function App() {
  const enableWebSocket = useStockDataStore((s) => s.enableWebSocket);
  const websocketEnabled = useStockDataStore((s) => s.websocketEnabled);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load dividend data from Supabase on app startup
        const refreshStocks = useStockDataStore.getState().refreshStocks;
        console.log("[App] Loading dividend data from Supabase...");
        await refreshStocks();
      } catch (error) {
        console.error("[App] Failed to load dividend data:", error);
      }
    };

    // Initialize app data
    initializeApp();

    // Register background refresh task on app startup
    registerBackgroundRefreshTask()
      .then(() => {
        console.log("[App] Background refresh task registered");
      })
      .catch((error) => {
        console.error("[App] Failed to register background refresh:", error);
      });

    // Start the 3 AM scheduled dividend update scheduler
    startDividendUpdateScheduler();
    console.log("[App] 3 AM dividend update scheduler started");

    // Start automatic daily data refresh (checks every 6 hours, refreshes once per day)
    startAutomaticDailyRefresh(
      () => {
        console.log("[App] Automatic daily refresh started");
      },
      (stockCount) => {
        console.log(`[App] Automatic daily refresh complete - updated ${stockCount} stocks`);
      },
      (error) => {
        console.error("[App] Automatic daily refresh error:", error);
      }
    );

    // Enable WebSocket for real-time updates if enabled
    if (websocketEnabled) {
      enableWebSocket();
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <RootNavigator />
          <StatusBar style="light" />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
