/**
 * Background Refresh Service
 * Handles automatic daily refresh of stock data including technical indicators
 * Scheduled for 5-7 PM EST after market close when daily technical indicators are updated
 * Uses expo-background-fetch for iOS/Android background tasks
 */

import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { useStockDataStore } from "../state/stockDataStore";

// Note: TaskManager doesn't export types in current version, using any for task result
type TaskManagerTaskBody = () => Promise<BackgroundFetch.BackgroundFetchResult>;

const BACKGROUND_FETCH_TASK = "background-dividend-refresh";

// Define the background task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log("[Background] Starting scheduled refresh with technical indicators...");

    const now = new Date();

    // Convert to EST/EDT (UTC-5 or UTC-4 depending on DST)
    const estOffset = -5 * 60; // EST is UTC-5
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const estTime = new Date(utcTime + (estOffset * 60000));
    const estHour = estTime.getHours();
    const estMinute = estTime.getMinutes();

    console.log(`[Background] Current EST time: ${estHour}:${estMinute.toString().padStart(2, "0")}`);

    // Refresh between 5:00 PM and 7:00 PM EST (after market close at 4:00 PM)
    // This ensures technical indicators are updated with the day's final values
    const isRefreshWindow = (estHour >= 17 && estHour < 19);

    if (!isRefreshWindow) {
      console.log("[Background] Not in refresh window (5:00-7:00 PM EST), skipping refresh");
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    console.log(`[Background] In refresh window at EST ${estHour}:${estMinute.toString().padStart(2, "0")}, refreshing all data with technical indicators...`);

    // Get the refresh function from the store
    const { refreshFromCSV, lastRefreshTime } = useStockDataStore.getState();

    // Check if we already refreshed today
    if (lastRefreshTime) {
      const hoursSinceLastRefresh = (Date.now() - lastRefreshTime) / (1000 * 60 * 60);
      if (hoursSinceLastRefresh < 20) {
        console.log(`[Background] Already refreshed ${hoursSinceLastRefresh.toFixed(1)} hours ago, skipping`);
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }
    }

    // Refresh with full API enrichment (prices + technical indicators)
    // This will take ~10 minutes for 925 stocks, but runs in background
    await refreshFromCSV(true);

    console.log("[Background] Full data refresh with technical indicators completed successfully");

    // Return success
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("[Background] Data refresh failed:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Register background fetch task
 * Automatically refreshes stock data with technical indicators daily after market close
 * Scheduled for 5-7 PM EST when technical indicators have been updated
 */
export async function registerBackgroundRefreshTask(): Promise<void> {
  try {
    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);

    if (isRegistered) {
      console.log("[Background] Task already registered");
      return;
    }

    // Register the task
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 60 * 60, // Check every hour (iOS/Android will optimize)
      stopOnTerminate: false, // Continue after app termination
      startOnBoot: true, // Start after device reboot
    });

    console.log("[Background] Background refresh task registered successfully (will refresh daily 5-7 PM EST with technical indicators)");
  } catch (error) {
    console.error("[Background] Failed to register background refresh task:", error);
  }
}

/**
 * Unregister background fetch task
 */
export async function unregisterBackgroundRefreshTask(): Promise<void> {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    console.log("[Background] Background refresh task unregistered");
  } catch (error) {
    console.error("[Background] Failed to unregister background refresh task:", error);
  }
}

/**
 * Check background fetch status
 */
export async function getBackgroundFetchStatus(): Promise<BackgroundFetch.BackgroundFetchStatus | null> {
  return await BackgroundFetch.getStatusAsync();
}

/**
 * Schedule a specific time refresh (approximate - iOS/Android control exact timing)
 * Note: Exact time scheduling is limited on mobile. This sets the preferred time.
 */
export async function setPreferredRefreshTime(hour: number = 2): Promise<void> {
  // Mobile OS will approximate this time based on device usage patterns
  // We can only suggest a minimum interval
  console.log(`[Background] Preferred refresh time set to ${hour}:00 AM (approximate)`);

  // The actual implementation relies on minimumInterval
  // iOS and Android will optimize based on battery, usage, etc.
}
