/**
 * Background Refresh Service
 * Handles automatic background refresh of dividend data at scheduled times
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
    console.log("[Background] Starting scheduled dividend data refresh...");

    const now = new Date();
    console.log(`[Background] Task executed at: ${now.toISOString()}`);

    // Get the refresh function from the store
    // Note: We need to call the store directly, not via hooks
    const { refreshStocks } = useStockDataStore.getState();

    // Perform the refresh
    await refreshStocks();

    console.log("[Background] Dividend data refresh completed successfully");

    // Return success
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("[Background] Dividend data refresh failed:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Register background fetch task
 * This sets up automatic refresh to run approximately once per day
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
      minimumInterval: 24 * 60 * 60, // 24 hours in seconds (daily refresh)
      stopOnTerminate: false, // Continue after app termination
      startOnBoot: true, // Start after device reboot
    });

    console.log("[Background] Background refresh task registered successfully");
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
