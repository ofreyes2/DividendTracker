# FinnHub API Integration Guide

## Setup Instructions

### 1. Add Your API Key

Edit the `/home/user/workspace/.env` file and replace the placeholder with your actual FinnHub API key:

```
EXPO_PUBLIC_FINNHUB_API_KEY=your_actual_finnhub_api_key_here
```

### 2. Available Features

The FinnHub integration provides:

#### Real-Time Stock Data
- Live stock prices
- Daily high/low
- Price changes and percent changes
- Company logos
- Company profiles

#### Stock News
- Company-specific news (last 7 days)
- Market news
- News with images, summaries, and links

#### Dividend Data
- Historical dividend payments
- Ex-dividend dates
- Payment dates
- Dividend amounts

## Usage Examples

### 1. Get Real-Time Quote

```typescript
import { getFinnHubQuote } from './src/api/finnhub';

const quote = await getFinnHubQuote('AAPL');
console.log(`Current price: $${quote.c}`);
console.log(`Change: ${quote.d} (${quote.dp}%)`);
```

### 2. Get Company Logo

```typescript
import { getFinnHubProfile } from './src/api/finnhub';

const profile = await getFinnHubProfile('AAPL');
console.log(`Logo URL: ${profile.logo}`);
```

### 3. Get Stock News

```typescript
import { getRecentStockNews } from './src/api/finnhub';

const news = await getRecentStockNews('AAPL', 3);
news.forEach(article => {
  console.log(article.headline);
  console.log(article.summary);
  console.log(article.url);
});
```

### 4. Enhance Existing Stock Data

```typescript
import { enhanceStockWithFinnHub } from './src/api/comprehensive-stock-data';

// Takes your existing stock object and adds real-time data
const enhancedStock = await enhanceStockWithFinnHub(myStock);
```

### 5. Enhance All Stocks (with Progress)

```typescript
import { enhanceAllStocksWithFinnHub } from './src/api/comprehensive-stock-data';

const enhancedStocks = await enhanceAllStocksWithFinnHub(
  (current, total, symbol) => {
    console.log(`Loading ${symbol}... (${current}/${total})`);
  }
);
```

## Implementation in Your App

### Option 1: Manual Refresh Button

Add a "Refresh Prices" button in StockListScreen:

```typescript
const [refreshing, setRefreshing] = useState(false);

const handleRefresh = async () => {
  setRefreshing(true);
  const enhanced = await enhanceAllStocksWithFinnHub();
  // Update your stock list
  setRefreshing(false);
};
```

### Option 2: Auto-Refresh on Screen Focus

```typescript
useFocusEffect(
  useCallback(() => {
    enhanceAllStocksWithFinnHub();
  }, [])
);
```

### Option 3: Background Refresh with Cache

Use AsyncStorage to cache enhanced data and refresh periodically.

## Rate Limits

FinnHub Free Tier:
- 60 API calls per minute
- The code includes automatic rate limiting (150ms delay between calls)

With 45 stocks:
- Full refresh takes ~7 seconds
- Each stock detail screen takes ~0.3 seconds

## News Integration

To display news on stock detail screen:

```typescript
const [news, setNews] = useState<FinnHubNews[]>([]);

useEffect(() => {
  getRecentStockNews(stock.symbol, 3).then(setNews);
}, [stock.symbol]);
```

## Logo Display

Logos are automatically added to stocks when enhanced. Access via:

```typescript
if (stock.logo) {
  <Image source={{ uri: stock.logo }} style={{ width: 40, height: 40 }} />
}
```

## Important Notes

1. **API Key Security**: Never commit your actual API key to version control
2. **Rate Limiting**: The code respects FinnHub's rate limits automatically
3. **Error Handling**: All functions gracefully fall back to existing data if API fails
4. **Caching**: Consider implementing caching to reduce API calls

## Next Steps

1. Add your FinnHub API key to `.env`
2. Test with a single stock: `await getFinnHubQuote('AAPL')`
3. Add refresh functionality to StockListScreen
4. Add news section to StockDetailScreen
5. Display company logos in stock cards

## FinnHub API Documentation

Full documentation: https://finnhub.io/docs/api

Key endpoints used:
- `/quote` - Real-time quote
- `/stock/profile2` - Company profile & logo
- `/company-news` - Company news
- `/stock/dividend` - Dividend data
