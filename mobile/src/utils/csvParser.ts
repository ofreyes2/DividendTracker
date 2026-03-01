/**
 * CSV Parser for ticker dividend data
 */

export interface TickerDividendData {
  ticker: string;
  dividendAmount: string;
  dividendCurrency: string;
  dividendFrequency: string;
  dividendType: string;
  exDividendDate: string;
  payDate: string;
  recordDate: string;
  annualDividend: string;
  dividendYield: string;
  payoutRatio: string;
}

/**
 * Parse CSV file and return array of ticker dividend data
 */
export function parseTickerCSV(csvContent: string): TickerDividendData[] {
  const lines = csvContent.trim().split("\n");

  if (lines.length === 0) {
    return [];
  }

  // Skip header row
  const dataLines = lines.slice(1);

  const parsed: TickerDividendData[] = [];

  for (const line of dataLines) {
    // Split by comma, handling quoted fields
    const values = line.split(",");

    if (values.length < 11) {
      continue; // Skip incomplete rows
    }

    parsed.push({
      ticker: values[0].trim(),
      dividendAmount: values[1].trim(),
      dividendCurrency: values[2].trim(),
      dividendFrequency: values[3].trim(),
      dividendType: values[4].trim(),
      exDividendDate: values[5].trim(),
      payDate: values[6].trim(),
      recordDate: values[7].trim(),
      annualDividend: values[8].trim(),
      dividendYield: values[9].trim(),
      payoutRatio: values[10].trim(),
    });
  }

  return parsed;
}

/**
 * Convert frequency number to frequency string
 */
export function convertFrequency(freq: string): "monthly" | "quarterly" | "semi-annual" | "annual" {
  const freqNum = parseInt(freq, 10);

  switch (freqNum) {
    case 12:
      return "monthly";
    case 4:
      return "quarterly";
    case 2:
      return "semi-annual";
    case 1:
      return "annual";
    default:
      return "quarterly"; // Default to quarterly
  }
}

/**
 * Clean currency values (remove $ and spaces)
 */
export function cleanCurrencyValue(value: string): number {
  const cleaned = value.replace(/[$\s,]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Clean percentage values (remove % and spaces)
 */
export function cleanPercentageValue(value: string): number {
  const cleaned = value.replace(/[%\s,]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Convert MM/DD/YYYY to YYYY-MM-DD format
 */
export function convertDateFormat(dateStr: string): string {
  try {
    // Check if already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // Parse MM/DD/YYYY format
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const month = parts[0].padStart(2, "0");
      const day = parts[1].padStart(2, "0");
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }

    // If format is not recognized, return as is
    return dateStr;
  } catch (error) {
    return dateStr;
  }
}
