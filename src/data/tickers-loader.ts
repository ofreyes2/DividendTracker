/**
 * Ticker CSV Data Loader
 * This file helps load the CSV data at runtime
 */

import * as FileSystem from "expo-file-system";

/**
 * Load the CSV file content as a string
 * Since React Native doesn't support require() for text files,
 * we need to use FileSystem to read it
 */
export async function loadTickerCSVContent(): Promise<string> {
  try {
    // The CSV file is in the same directory
    // We'll try multiple paths to find it
    const possiblePaths = [
      `${FileSystem.bundleDirectory}src/data/tickers.csv`,
      `${FileSystem.documentDirectory}tickers.csv`,
      `${FileSystem.cacheDirectory}tickers.csv`,
    ];

    for (const path of possiblePaths) {
      try {
        const content = await FileSystem.readAsStringAsync(path);
        if (content) {
          console.log(`Successfully loaded CSV from: ${path}`);
          return content;
        }
      } catch (error) {
        // Try next path
        continue;
      }
    }

    throw new Error("Could not find tickers.csv in any expected location");
  } catch (error) {
    console.error("Failed to load CSV:", error);
    throw error;
  }
}
