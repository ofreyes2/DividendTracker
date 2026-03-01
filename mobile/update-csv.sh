#!/bin/bash

# Script to convert tickers.csv to tickers-data.ts
# Run this after updating the CSV file with new dividend data

echo "Converting tickers.csv to TypeScript..."

node -e "const fs = require('fs'); const csv = fs.readFileSync('src/data/tickers.csv', 'utf-8'); const escaped = csv.replace(/\`/g, '\\\`').replace(/\\\$/g, '\\\$'); fs.writeFileSync('src/data/tickers-data.ts', 'export const TICKERS_CSV = \`' + escaped + '\`;');"

if [ $? -eq 0 ]; then
    echo "✓ Successfully converted CSV to TypeScript!"
    echo "  The app will now use the updated dividend data."
else
    echo "✗ Failed to convert CSV file."
    exit 1
fi
