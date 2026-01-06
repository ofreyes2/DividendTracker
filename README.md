# DAILY DIVIDEND CAPTURE - AI-Powered Trading Strategy App

A professional daily dividend capture trading app with AI-powered stock screening and analysis. Find stocks with ex-dividend dates, calculate optimal positions to hit daily dividend targets, track trading opportunities, and execute a systematic buy-hold-sell rotation strategy.

**🚀 NEW: Advanced Real-Time Data System with Background Refresh & WebSocket Updates** - Complete data management system with automatic scheduled refreshes, two-phase loading for 11,628 tickers, and real-time WebSocket price updates.

## Overview

This app helps active traders execute a **daily dividend capture strategy**—buying stocks the day before their ex-dividend date, collecting the dividend payment, then selling and rotating capital to the next opportunity. Features comprehensive stock database with 11,628 dividend-eligible tickers, date-based filtering, AI-powered position sizing to hit daily targets (e.g., $1,000/day), volume analysis for safe exits, and real-time trading calculations with Polygon.io integration for live market data.

## Key Features

### 0. **Advanced Real-Time Market Data System (NEW 🆕)**

#### **Intelligent Data Management**
- **Dual Data Sources** - Flexible data loading options:
  - **CSV Data (NEW! 📄)**: Pre-loaded dividend data for ~926 tickers from local CSV file
    - Instant loading without API calls
    - Complete dividend information (amount, frequency, dates, yield, payout ratio)
    - Can optionally enrich with live prices from Polygon.io
    - Perfect for users without API keys or for offline use
  - **Polygon.io API**: Live data from Polygon.io (recommended for real-time data)
    - Actual ex-dividend dates from market data
    - Live stock prices and volumes (15-minute delayed)
    - Real technical indicators (RSI, MACD, Moving Averages)
    - Current market capitalization
    - Company details and sector information
    - **11,628 ticker symbols available** (all US stocks in the database)
    - **Recommended: Use 500-1000 tickers** due to API rate limits

#### **Automated Background Refresh (NEW! 🔄)**
- **Automatic Daily Data Refresh** - All data metrics update once per day in the background
  - **Runs automatically without user action** - System checks every 6 hours and refreshes if 24+ hours have passed
  - Refreshes ALL data metrics:
    - Stock prices (current, open, close, high, low, 52-week range)
    - Volume data (current, average)
    - Technical indicators (MACD, RSI, Moving Averages, PEG ratio)
    - Dividend information (amount, yield, ex-dates, payment dates)
    - Company fundamentals (market cap, sector, industry)
  - **Starts automatically on app launch** - No configuration needed
  - **Continues in background** - Updates happen even when app is closed (via expo-background-fetch)
  - **Scheduled for optimal timing** - Background service runs 5-7 PM EST after market close when technical indicators are finalized
  - **Smart caching** - Updated data persists between sessions
  - **Status tracking** - Can check last refresh time and next scheduled refresh
- **Smart Refresh Strategy** - Optimized two-tier update system:
  - **In-App Refresh**: Runs when app is active, checks every 6 hours (refreshes if 24+ hours passed)
  - **Background Refresh**: Scheduled daily 5-7 PM EST via expo-background-fetch
  - Both systems coordinate to ensure one refresh per day maximum
- **Crash-Resistant Loading** - Intelligent two-phase processing:
  - **Phase 1 (FAST)**: Fetches only dividend data for selected tickers
    - 1 API call per ticker, 10 requests/second
    - Filters to stocks with upcoming ex-dividend dates
    - **Recommended 500-1000 tickers** (not all 11,628 due to API limits)
  - **Phase 2 (TARGETED)**: Fetches full price/company data for filtered stocks only
    - 3 API calls per stock with 2-second delays between stocks
  - 10-second timeout on all API requests to prevent hanging
  - Automatic error recovery - skips failed tickers and continues
  - Shows current phase and progress in UI
  - App remains fully responsive throughout the entire load process

#### **Real-Time WebSocket Updates (NEW! ⚡)**
- **Live Price Streaming** - Prices update automatically during market hours:
  - Connected to Polygon.io WebSocket (15-minute delayed feed)
  - Second-by-second and minute aggregate updates (OHLC bars)
  - Automatic reconnection with exponential backoff
  - Updates price, change, volume in real-time
  - Green "Live" indicator when WebSocket is connected
  - **Note**: Requires valid Polygon.io API key with WebSocket access
- **Optimized Performance**:
  - Only subscribes to stocks currently displayed
  - Minimal battery and data usage
  - Updates UI efficiently without re-renders
  - Disabled by default until API key is validated

#### **Flexible Ticker Management**
- **In-App Ticker Editor** - Customize your stock universe:
  - Tap the purple **list icon** in the top right corner
  - Edit tickers directly in the app - no file access needed
  - Add/remove any stock symbols you want
  - Supports comments (lines starting with #)
  - Live preview shows ticker count
  - One-tap "Load Stocks" button fetches all your custom tickers
  - **Saves your custom list for future refreshes**
- **Smart Filtering** - Only shows relevant opportunities:
  - Displays stocks with ex-dividend dates TODAY or FUTURE only
  - Yesterday's opportunities automatically disappear
  - Always see current and upcoming dividend capture trades
- **Persistent Storage** - Data cached locally between app sessions
- **Manual Refresh** - Tap refresh icon anytime to reload data

#### **Data Flow Architecture (NEW! Master Dataset System)**

**Key Architecture Change**: All data is now keyed by symbol/ticker. Joins are ALWAYS done on symbol, never by array index. This prevents the "all stocks having the same info" bug.

**Master Dataset System**:
- **Once per day**: Fetch all relatively static data from Polygon APIs:
  - Company info (name, sector, industry, market cap)
  - Dividend data (amount, dates, frequency, yield)
  - 52-week high/low
  - Average volume
- **Normalize and merge**: All data merged into single master dataset file (JSON)
- **Symbol-keyed storage**: Every row keyed by ticker symbol for O(1) lookups
- **File-based persistence**: Saved to device storage via expo-file-system

**On App Startup**:
1. Load master dataset from file (instant, cached)
2. If dataset >24 hours old, rebuild in background from CSV + Polygon APIs
3. Display stocks immediately with dividend data
4. Fetch live prices separately for intra-day updates

**For Real-Time/Delayed Data**:
- Price, volume, daily change fetched directly from Polygon APIs
- Updates every 15 minutes during market hours
- Merged with master dataset using symbol-based joins

**Data Files**:
- `master-data/master-dataset.json` - All static stock data keyed by symbol
- `master-data/metadata.json` - Last update timestamp, ticker count

**Updating Dividend Data**:
- Replace the CSV file (`src/data/tickers.csv`) with new data
- Run: `./update-csv.sh` (or use the node command below)
  ```bash
  node -e "const fs = require('fs'); const csv = fs.readFileSync('src/data/tickers.csv', 'utf-8'); const escaped = csv.replace(/\`/g, '\\\`').replace(/\\\$/g, '\\\$'); fs.writeFileSync('src/data/tickers-data.ts', 'export const TICKERS_CSV = \`' + escaped + '\`;');"
  ```
- Master dataset auto-rebuilds on next app launch

**Note**: Dividend information comes from CSV file. Live prices fetched from Polygon.io. All data properly merged by symbol.

### 1. **Daily Dividend Calendar with Smart Filtering**
- **Complete Stock Universe** - Browse all 45+ dividend-paying stocks
- **Search Bar** - Quickly find stocks by symbol (e.g., "AAPL") or company name (e.g., "Apple")
- **Quick Filters** - Find stocks with ex-dividend dates:
  - All stocks
  - Today (buy now for tomorrow's dividend)
  - Tomorrow (plan ahead)
  - This Week
  - Specific Day (calendar date picker)
- **Collapsible Trading Settings** - Set your parameters:
  - Investment amount ($100,000 default)
  - Daily dividend target ($1,000 default)
- **Smart Calculate Button** - AI suggests optimal stocks to meet your daily target:
  - Calculates exact shares needed for target dividend
  - Shows single payment amounts (not annual)
  - Prioritizes high-volume stocks for easy exits
  - Displays safety scores for daily trading

### 2. **Comprehensive Stock Information on Cards**
Each stock card displays everything you need for daily trading decisions:
- **Company Name & Symbol** - Full company identification
- **Current Price** - Real-time pricing with daily change
- **Dividend Information**:
  - Dividend Yield percentage
  - **Dividend Amount per Payment** (CRITICAL: This is what you'll receive in one cycle)
  - Annual Dividend total (for reference)
  - Ex-Dividend Date (buy before this date!)
- **Volume Data** (CRITICAL for daily trading):
  - Current Volume (higher = easier to exit position)
  - Average Volume (30-day)
- **Price Ranges**:
  - Day High/Low
  - 52-Week High/Low
- **Company Details**:
  - Sector and Industry
  - Stock Market Indices (S&P 500, Dow Jones, NASDAQ 100)
- **Technical Rating**:
  - RSI-based rating (helps identify overbought/oversold conditions)

### 3. **Detailed Stock Analysis Screen**
Tap any stock card to view in-depth analysis:
- **Price Information**:
  - Current price with daily change
  - Interactive price range visualizations
  - Day and 52-week ranges with position indicators
- **Key Metrics**:
  - Market capitalization
  - Dividend yield
  - Payout ratio
  - 5-year dividend growth rate
  - Volume statistics
- **Dividend Details**:
  - Payment frequency
  - Dividend per payment
  - Annual dividend
  - Important dates (Ex-dividend, Record, Payment)
- **Technical Analysis**:
  - Overall technical rating
  - RSI (Relative Strength Index)
  - MACD indicators with 30-day chart visualization
  - PEG Ratio
  - 50-day and 200-day moving averages
  - Key technical signals with interpretation
- **MACD Chart** - Interactive 30-day MACD line chart showing trend momentum
- **Company Information**:
  - Complete sector and industry classification
  - Stock market indices membership
- **AI-Powered Analysis** (auto-loaded on screen with enhanced layman explanations):
  - Investment score (0-100)
  - Buy/Hold/Avoid recommendation
  - Risk level assessment
  - Investment timeframe
  - **Detailed explanations** of all technical indicators in simple terms:
    - What dividend yield means and why it matters
    - How payout ratio indicates dividend sustainability
    - RSI explained (oversold vs overbought) with specific stock implications
    - MACD momentum indicators in plain language
    - PEG ratio valuation guidance (undervalued vs overvalued)
    - Moving averages and trend identification
    - How all indicators work together for a complete picture
  - Strengths and concerns in everyday language
  - Detailed reasoning accessible to novice investors
- **AI Chat** - Ask questions and get instant responses with keyboard-friendly interface
- **Buy Button** - Quick access to add position to portfolio

### 4. **Portfolio Tracking System**
- **My Portfolio Screen** - Centralized view of all investments
- **Active Positions** - Track all current stock holdings with:
  - Number of shares owned
  - Average purchase price
  - Current value
  - Current cycle dividend payout (based on declared dividend per share)
  - Edit and manage individual positions
- **Upcoming Dividends (30 days)** - See all dividend payments coming soon:
  - Payment date
  - Dividend amount
  - Shares paying dividends
- **Monthly Calendar View** - Dividend income organized by month:
  - Total dividends per month
  - Breakdown by stock symbol
  - Historical tracking
- **Portfolio Summary Cards**:
  - Total amount invested
  - Total dividend income received
- **Add Transaction** - Record new stock purchases:
  - Stock symbol and company name
  - Purchase date
  - Number of shares
  - Purchase price per share
  - Automatic dividend calculation
  - Auto-navigation to Portfolio after adding

### 5. **AI-Powered Stock Chat**
- **Interactive Q&A** - Ask detailed questions about any stock
- **Context-Aware** - AI has full knowledge of stock metrics (price, yield, RSI, MACD, PEG)
- **Conversational Interface** - Chat-style UI for natural conversation
- **Real-Time Responses** - Get instant answers powered by GPT-4o
- **Stock-Specific Insights** - Tailored analysis for each ticker

### 6. **Custom Allocation Calculator** ⭐ NEW
- **Multi-Stock Selection** - Select stocks you want to invest in
- **Interactive Percentage Sliders** - Adjust allocation for each stock in real-time
  - Drag slider to increase/decrease percentage (0-100%)
  - Other stocks auto-adjust to maintain 100% total
  - Visual feedback shows exact percentage allocation
- **Instant Recalculation** - See results update live as you adjust:
  - Exact shares you'll buy at current price
  - Investment amount per stock
  - **Next payment dividend** (single cycle, not annual)
  - Total dividend from all stocks
- **Daily Trading Focus**:
  - Shows "This Payment" amount (what you'll receive in next dividend)
  - Volume safety ratings for each stock
  - Perfect for planning daily capture strategy across multiple stocks
- **Smart Summary Card**:
  - Total investment used
  - Total shares across all stocks
  - **Next Payment total** - Combined dividend from all positions
  - Clear daily strategy reminder

### 7. **AI-Powered Daily Trading Calculator**
- **Single Stock or Multi-Stock Selection** - Select stocks from filtered results
- **Daily Dividend Target** - Set your daily income goal (e.g., $1,000/day)
- **Smart Position Sizing** - AI calculates shares needed based on:
  - Dividend amount **per single payment** (not annual)
  - Your available capital
  - Volume safety (can you exit this position easily?)
  - RSI indicators (neutral preferred for daily trading)
- **Detailed Breakdown** - Per-stock calculations:
  - Exact shares to purchase
  - Total investment required
  - **Dividend you'll receive in next payment**
  - Volume score (trading safety metric)
- **Daily Strategy Summary**:
  - Total investment needed
  - Next dividend payment amount
  - Clear instructions: "Buy day before ex-date, collect dividend, sell next day"

### 8. **Maximum Safe Dividend Calculator** ⭐
- **Show Maximum Safe Dividend** button - Calculate the highest realistic daily dividend
- **Safety-First Ranking** - Prioritizes stocks by:
  - Volume (20M+ shares = EXCELLENT for $100k positions)
  - RSI neutrality (avoids overbought/oversold extremes)
  - Dividend efficiency (maximum payout per dollar)
- **Two Strategies Displayed**:
  - **Best Single Stock** - Maximum dividend from one safest stock
  - **3-Stock Diversification** - Spread risk across top 3 safest options
- **Safety Tiers**:
  - 🟢 EXCELLENT (20M+ volume) - Safe for $100k+ positions
  - 🔵 GOOD (10-20M volume) - Suitable for $100k
  - 🟡 MODERATE (<10M volume) - May need split orders
- **Realistic Expectations** - Shows actual achievable dividends, not aspirational targets

### 9. **AI-Powered Safety Analysis (GPT-4o)**
- **Volume Analysis** - Ensures you can exit positions without slippage
- **RSI Screening** - Avoids overbought/oversold extremes
- **Safety Scoring** - Combines efficiency with liquidity
- **Best Recommendations** - AI identifies safest daily trading candidates

### 10. **Beautiful Professional UI**
- Dark theme optimized for financial data
- Tap stock cards to view detailed analysis
- Checkbox selection for bulk operations
- Real-time calculations
- Smooth animations
- Native iOS design patterns
- Color-coded indicators
- Visual progress bars for price ranges
- 15-minute data delay disclaimer on all screens

## Available Stocks

The app includes 45+ dividend stocks across multiple sectors with complete technical data:

### Technology
- **AAPL** - Apple Inc. (0.54% yield)
- **MSFT** - Microsoft Corporation (0.71% yield)
- **AVGO** - Broadcom Inc. (12.47% yield)
- **IBM** - International Business Machines (3.09% yield)
- **QCOM** - Qualcomm (2.19% yield)

### Consumer Staples
- **KO** - The Coca-Cola Company (3.09% yield)
- **PEP** - PepsiCo (3.45% yield)
- **PM** - Philip Morris International (4.30% yield)
- **MO** - Altria Group (7.37% yield)
- **PG** - Procter & Gamble (2.27% yield)

### Healthcare
- **JNJ** - Johnson & Johnson (2.99% yield)
- **ABBV** - AbbVie Inc. (3.17% yield)
- **PFE** - Pfizer (6.51% yield)
- **AMGN** - Amgen (3.12% yield)

### Telecommunications
- **T** - AT&T (5.01% yield)
- **VZ** - Verizon (6.63% yield)

### Real Estate (REITs)
- **O** - Realty Income (5.29% yield, monthly!)
- **SPG** - Simon Property Group (4.53% yield)
- **PSA** - Public Storage (3.80% yield)

### Energy
- **XOM** - Exxon Mobil (3.31% yield)
- **CVX** - Chevron (4.10% yield)
- **ENB** - Enbridge (8.90% yield)

### Financials
- **JPM** - JPMorgan Chase (1.87% yield)
- **BAC** - Bank of America (2.30% yield)
- **USB** - U.S. Bancorp (3.79% yield)

### Utilities
- **NEE** - NextEra Energy (2.38% yield)
- **DUK** - Duke Energy (3.65% yield)
- **SO** - Southern Company (3.21% yield)

### Industrials
- **MMM** - 3M Company (4.56% yield)
- **CAT** - Caterpillar (1.35% yield)

## User Workflow

### Daily Dividend Capture Strategy (Primary Use Case)

**Goal:** Generate $1,000/day by buying stocks before ex-dividend date, collecting dividend, selling next day, and rotating to the next opportunity.

1. **Open App** → See "DAILY DIVIDEND CAPTURE" with all stocks
2. **Set Your Parameters** → Expand "Investment Settings":
   - Investment Amount: $100,000 (your trading capital)
   - Daily Target: $1,000 (dividend goal per trade)
3. **Filter by Date** → Tap "Tomorrow" to see tomorrow's ex-dividend opportunities
   - **Why Tomorrow?** Buy today, qualify for dividend tomorrow, collect payment later, sell after ex-date
4. **Review Opportunities** → Check stock cards for:
   - Dividend amount per payment (need enough to hit $1,000 target)
   - Volume (20M+ shares = safer, easier to exit $100k position)
   - Technical rating (Neutral/Strong preferred over Overbought)
5. **Calculate Position** → Tap "Find Daily Opportunities"
   - AI calculates exact shares needed for your $1,000 target
   - Shows which stock(s) have sufficient volume for safe trading
   - Displays total investment required
6. **Execute Trade** → Review the suggestion:
   - **Example:** Buy 4,167 shares of VZ at $40.85 = $170,235 investment
   - **Next Payment:** $2,823 (exceeds your $1,000 target!)
   - **Volume:** 18.2M shares (can easily sell your position)
7. **Place Order** → Use your brokerage to buy shares **today** (day before ex-date)
8. **Wait for Ex-Date** → Tomorrow the stock goes ex-dividend (you qualify!)
9. **Sell Position** → Day after ex-date, sell your shares
10. **Rotate Capital** → Return to app, filter by next day's ex-dividend date, repeat!

### Important Trading Notes
- **Price Drop Risk:** Stocks typically drop by dividend amount on ex-date
- **Net Profit = Dividend - Price Drop - Transaction Costs**
- **Volume is Critical:** Need high volume to exit $100k positions quickly
- **Not Financial Advice:** This strategy has significant risks; consult a financial advisor

### Browsing and Filtering Stocks

1. **Search Stocks** → Type in search bar to find by symbol (e.g., "AAPL") or company name
2. **Apply Quick Filters** → "Today", "Tomorrow", "Week", or "Day" (calendar picker)
3. **Review Stock Cards** → Comprehensive info:
   - Price with daily change
   - **Dividend amount per payment** (single payout, not annual)
   - Volume data (critical for exits)
   - Ex-dividend date
   - Technical rating (RSI-based)

### Viewing Detailed Stock Analysis

10. **Tap Any Stock** → View detailed analysis screen with data disclaimer
11. **Auto-Loaded AI Analysis** → Deep AI insights appear automatically
12. **View MACD Chart** → Interactive 30-day chart showing momentum trends
13. **Stock Detail Screen** → Comprehensive analysis:
   - Price ranges with visual indicators
   - Complete dividend information with all important dates
   - Technical analysis with RSI, MACD chart, PEG ratio, moving averages
   - Company information and index membership
13. **Buy Stock** → Tap "Buy" button to add position to portfolio:
    - Enter number of shares
    - Set purchase price (defaults to current)
    - See total investment and next dividend payout
    - Confirm to add to portfolio
14. **Ask AI Questions** → Tap "Ask AI" button for interactive chat:
    - Type any question about the stock
    - Get instant AI responses
    - Multiple questions supported
15. **Navigate Back** → Return to calendar to explore more stocks

### Managing Your Portfolio

16. **Open Portfolio** → Tap briefcase icon in header
17. **View Summary** → See total invested and total dividends received
18. **Switch Tabs**:
    - **Positions** - All active holdings with details
    - **Upcoming** - Next 30 days of dividend payments
    - **Calendar** - Monthly dividend breakdown
19. **Track Positions** → Each position shows:
    - Shares owned
    - Average purchase price
    - Current value
    - Current cycle dividend payout
20. **View Upcoming Dividends** → See payment dates and amounts
21. **Monthly Calendar** → Review dividend income by month

### Calculating Portfolio Returns

22. **Select Multiple Stocks** → Tap checkboxes on stock cards (doesn't navigate to detail)
23. **Enter Investment** → Input your total investment amount at the top
24. **Tap "Calculate"** → Opens bulk calculator
25. **View Breakdown** → See per-stock allocation:
    - How many shares of each stock
    - Investment amount per stock
    - Dividend per payment (current cycle payout)
    - Annual and monthly dividend income per stock
26. **Review Summary** → Total monthly dividend income from all stocks

### Getting AI Investment Recommendations

27. **Select Stocks** → Choose multiple stocks via checkboxes
28. **Tap "AI Analyze"** → Launches bulk AI analysis
29. **Wait for Analysis** → AI analyzes all selected stocks (10-20 seconds)
30. **Review Scenarios**:
    - **Best Buys** - Highest-rated stocks overall
    - **High Yield** - Maximum dividend income
    - **Low Risk** - Safest dividend payers
31. **Read Details** → For each recommended stock:
    - Investment score
    - Buy/Hold/Avoid recommendation
    - Risk level
    - Pros and cons
    - Detailed reasoning
32. **Make Decision** → Use AI insights to refine your selection

## Tech Stack

- **React Native 0.76.7** - Cross-platform mobile framework
- **Expo SDK 53** - Development platform
- **TypeScript** - Type-safe development
- **React Navigation** - Native stack navigation
- **React Native Reanimated** - 60fps animations
- **NativeWind (Tailwind CSS)** - Styling
- **Victory Native** - Interactive MACD charts
- **Zustand + AsyncStorage** - Portfolio state management with persistence
- **React Native DateTimePicker** - Native calendar picker
- **OpenAI GPT-4o** - AI analysis, recommendations, and chat

## Architecture

### File Structure
```
src/
├── api/
│   ├── master-dataset-service.ts    # Master dataset file operations (NEW!)
│   │                                 # Symbol-keyed storage, merge utilities
│   ├── daily-data-fetcher.ts        # Daily batch fetch from Polygon APIs (NEW!)
│   │                                 # Builds master dataset from CSV + API
│   ├── realtime-price-service.ts    # Live/15-min delayed price fetcher (NEW!)
│   │                                 # Symbol-based batch price updates
│   ├── comprehensive-stock-data.ts  # Complete stock database with 45+ stocks
│   │                                 # Technical indicators, volume, price ranges
│   ├── polygon-api.ts               # Polygon.io API integration
│   ├── csv-dividend-loader.ts       # CSV data parser
│   ├── ai-analysis.ts               # AI-powered stock analysis
│   └── chat-service.ts              # OpenAI API integration (GPT-4o)
├── screens/
│   ├── StockListScreen.tsx          # Main calendar/filter screen
│   ├── StockDetailScreen.tsx        # Detailed stock analysis with MACD chart & AI chat
│   ├── PortfolioScreen.tsx          # Portfolio tracking and dividend calendar
│   ├── BulkCalculatorScreen.tsx     # Investment calculator
│   └── AIAnalysisScreen.tsx         # AI analysis & recommendations
├── state/
│   └── stockDataStore.ts            # Zustand store with master dataset support
│                                     # Symbol-keyed updates, price refresh
├── navigation/
│   └── RootNavigator.tsx            # Navigation structure
└── utils/
    └── cn.ts                        # TailwindCSS utility
```

### Data Model

**DividendStock**:
```typescript
{
  symbol: string;                    // "AAPL"
  companyName: string;               // "Apple Inc."
  sector: string;                    // "Technology"
  industry: string;                  // "Consumer Electronics"
  indices: string[];                 // ["S&P 500", "Dow Jones", "NASDAQ 100"]
  marketCap: number;                 // 2800 (billions)

  // Price information
  price: number;                     // 178.45
  priceData: {
    current: number;                 // 178.45
    dayHigh: number;                 // 180.60
    dayLow: number;                  // 176.73
    week52High: number;              // 250.78
    week52Low: number;               // 139.04
    change: number;                  // 2.15
    changePercent: number;           // 1.22
  };

  // Volume
  volume: {
    current: number;                 // 58.5 (millions)
    average: number;                 // 52.3 (millions)
  };

  // Dividend information
  dividendAmount: number;            // 0.24 (per payment)
  dividendYield: number;             // 0.54
  exDividendDate: string;            // "2025-11-18"
  recordDate: string;                // "2025-11-19"
  paymentDate: string;               // "2025-11-26"
  frequency: string;                 // "quarterly"
  annualDividend: number;            // 0.96
  payoutRatio: number;               // 45 (percentage)
  dividendGrowth5Year: number;       // 8.5 (percentage)

  // Technical indicators
  technicals: {
    macd: { value, signal, histogram };
    rsi: number;                     // 0-100
    pegRatio: number;
    movingAverage50: number;
    movingAverage200: number;
  };
}
```

### API Services

**Stock Data API** (`comprehensive-stock-data.ts`):
- `ALL_DIVIDEND_STOCKS` - Complete stock database with 45+ stocks
- `filterStocks(stocks, filters)` - Apply advanced filtering criteria
- `getStocksExDividendToday()` - Stocks going ex-dividend today
- `getStocksExDividendTomorrow()` - Tomorrow's opportunities
- `getStocksExDividendThisWeek()` - This week's opportunities
- `getAllSectors()` - Get unique sectors
- `getAllIndustries()` - Get unique industries
- `getAllIndices()` - Get unique market indices
- `calculateBulkInvestment()` - Calculate investment allocations

**AI Analysis API** (`ai-analysis.ts`):
- `analyzeStock(stock, investmentAmount)` - Analyze single stock with AI
- `analyzeStocksInBulk(stocks, investmentAmount)` - Analyze multiple stocks with scenarios
- `getQuickRecommendation()` - Fast AI recommendation

**Portfolio Store** (`portfolioStore.ts`):
- `addTransaction(transaction)` - Add new stock purchase
- `updateTransaction(id, updates)` - Update existing position
- `sellPosition(id, soldDate, soldPrice)` - Record stock sale
- `addToWatchlist(symbol, companyName)` - Add to watchlist
- `getTotalInvested()` - Calculate total portfolio value
- `getTotalDividendIncome()` - Sum all dividends received
- `getUpcomingDividends(days)` - Get future dividend payments
- `getMonthlyDividends()` - Monthly dividend breakdown
- `getWeeklyDividends()` - Weekly dividend breakdown

## Design Philosophy

### Color Scheme
- **Deep Navy** (#0f172a, #1a2332) - Professional backgrounds
- **Emerald Green** (#10b981) - Dividends and positive values
- **Blue Accent** (#3b82f6) - Interactive elements and AI
- **Slate Gray** (#64748b) - Secondary text
- **Red** (#ef4444) - Negative values

### Typography
- Bold large numbers for key metrics
- System font for native iOS feel
- Clear hierarchy between information levels

### UX Principles
- **Immediate Feedback** - Real-time calculations as you select
- **Smart Defaults** - Investment amount persists
- **Progressive Disclosure** - Basic info → Detailed analysis
- **No Dead Ends** - Always clear next actions

## Use Cases

### 1. Finding Today's Opportunities
*"What stocks are going ex-dividend today?"*
1. Tap "Today" filter
2. See all stocks with today's ex-dividend date
3. Select interesting ones
4. Calculate potential returns

### 2. Building a Dividend Portfolio
*"I have $10,000 to invest in dividend stocks"*
1. Browse all stocks or filter by yield
2. Select 5-10 stocks across sectors
3. Enter $10,000 investment
4. See exact share counts and monthly income
5. Get AI recommendations

### 3. High-Yield Strategy
*"I want maximum dividend income"*
1. Select high-yield stocks (VZ, ENB, MO, PFE, O)
2. Calculate returns
3. Run AI analysis
4. Choose "High Yield" scenario
5. Review AI-recommended high-yield picks

### 4. Conservative Income
*"I want safe, stable dividends"*
1. Select blue-chip stocks (JNJ, PG, KO, MSFT)
2. Run AI analysis
3. Choose "Low Risk" scenario
4. Follow AI recommendations for safest picks

---

## Recent Updates - Version 2.0.9 (2025-11-20)

### Data Source Fix & UI Refinements

#### ✅ **Fixed CSV Data Loading**
- **Respects enrichWithPrices Parameter**: CSV loader now properly respects the flag
- **Fast Initial Load**: On first launch, loads CSV data only (no API calls) for instant display
- **Background Enrichment**: Automatic daily refresh at 5-7 PM EST fetches full API data
- **Two-Mode Operation**:
  - `enrichWithPrices=false`: Instant CSV-only load (dividend data only)
  - `enrichWithPrices=true`: Full Polygon API fetch (prices, technical indicators, company info)

#### ✅ **Improved Bottom Section**
- **Left-Aligned**: Company info now left-aligned instead of centered
- **Different Delimiters**:
  - Pipe `|` between Sector and Industry
  - Bullet `•` between Industry and Index
- **Example**: `Technology | Software • NASDAQ`

#### 📊 **Card Structure (Updated)**
```
Header: Symbol, Company Name, Price, Change %
Price Data: Open, Prev Close, Day Range, 52W High/Low, Volume
Technical & Dividend: MACD, RSI, Yield, Ex-Date
Company Info (Bottom): Sector | Industry • Index
```

---

## Recent Updates - Version 2.0.8 (2025-11-20)

### Completely Silent Background Updates

#### ✅ **Removed All Loading UI**
- **No Loading Indicators**: Removed all progress bars and loading messages
- **Silent Background Operation**: Refresh happens completely in the background without any visual indication
- **Zero Interruption**: Users never see any loading state or progress updates
- **Clean Experience**: App appears static while data refreshes automatically

#### 🎯 **Final User Experience**
- Stock data updates automatically daily at 5-7 PM EST
- No banners, no buttons, no progress indicators
- Data appears fresh every morning
- Completely transparent to the user

---

## Recent Updates - Version 2.0.7 (2025-11-20)

### Clean Automatic Background Updates

#### ✅ **Removed Manual Refresh UI**
- **Fully Automatic**: Removed all manual refresh buttons and banners
- **Clean Interface**: No more prompts or reminders about refreshing data
- **Background Only**: All data updates happen automatically at 5-7 PM EST
- **Set and Forget**: Users never need to think about updating data

#### ✅ **Improved Card Layout**
- **Sector/Industry/Index Moved**: Relocated to bottom of card in thin bar
- **Better Visual Hierarchy**: Company info at bottom matches original design
- **Centered Text**: Sector/industry/index display centered in thin section
- **Cleaner Look**: More organized card structure

#### 📊 **Card Structure (Final)**
```
Header: Symbol, Company Name, Price, Change %
Price Data: Open, Prev Close, Day Range, 52W High/Low, Volume
Technical & Dividend: MACD, RSI, Yield, Ex-Date
Company Info (Bottom): Sector • Industry • Index
```

---

## Recent Updates - Version 2.0.6 (2025-11-20)

### Automatic Daily Technical Indicator Updates

#### ✅ **Automatic Background Refresh**
- **Daily Auto-Update**: Technical indicators now refresh automatically every day at 5-7 PM EST
- **Perfect Timing**: Scheduled after market close (4 PM EST) when daily technical indicators are finalized
- **Complete Data Refresh**: Updates prices, MACD, RSI, moving averages, 52-week ranges, and all market data
- **No Manual Work**: Runs in background even when app is closed
- **Smart Scheduling**: Only refreshes once per day (skips if already refreshed within 20 hours)

#### 🔧 **Technical Changes**
- Updated `backgroundRefreshService.ts` to call `refreshFromCSV(true)` with full API enrichment
- Changed refresh window from 2:30-3:30 AM CST to 5:00-7:00 PM EST
- Added 20-hour cooldown to prevent duplicate refreshes
- Background task fetches all technical indicators via Polygon.io API

#### 📊 **Data Update Schedule**
```
Daily Timeline (EST):
4:00 PM - Market closes
5:00 PM - Technical indicators finalized
5:00-7:00 PM - Automatic background refresh window
  └─ Fetches: Prices, MACD, RSI, MAs, 52W ranges, volumes
```

#### 💡 **User Experience**
- No action required - data stays current automatically
- ~10 minutes refresh time runs silently in background
- Completely hands-off operation

---

## Recent Updates - Version 2.0.5 (2025-11-20)

### UI/UX Improvements

#### ✅ **Enhanced Stock Cards**
- **Larger Cards**: Increased padding from p-3 to p-4, improved spacing for better readability
- **Bigger Fonts**: Increased font sizes across all card elements (from 8-9px to 9-10px)
- **Better Touch Targets**: Checkbox increased from 16x16 to 20x20 with expanded hitSlop for easier selection
- **Fixed Checkbox Selection**: Separated checkbox pressable from card pressable, added stopPropagation for reliable selection
- **Improved Layout**: Added more spacing between sections (mb-2 instead of mb-1)

#### ✅ **User Guidance for API Data**
- Added prominent blue info banner explaining technical indicators now come from Polygon.io API
- Clear "Refresh Stock Data" button to update stocks with live market data
- Message only shows when stocks are loaded but not refreshing
- Helps users understand why technical indicators may show "N/A" initially

#### 🔧 **Technical Improvements**
- Better optional chaining throughout card rendering to prevent crashes
- Improved null safety for all stock data fields
- Enhanced touch handling with proper event propagation

---

## Recent Updates - Version 2.0.4 (2025-11-20)

### Data Architecture Enhancement

#### ✅ **Complete API Integration for All Data Points**
- **Dividend data ONLY** now comes from CSV file (ex-dates, amounts, frequency, yield, payout ratio)
- **ALL other data** now fetched from Polygon.io API in real-time:
  - Current price, open, previous close from Quote API
  - Day high, day low, volume from Quote API
  - 52-week high/low from Historical Aggregates API (365 days of data)
  - Company name, sector, industry, market cap from Ticker Details API
  - MACD (12/26/9) from Technical Indicators API
  - RSI (14-day) from Technical Indicators API
  - 50-day and 200-day moving averages from SMA API
- **Result**: Real market data for everything except dividend information
- **Performance**: Approximately 600ms per stock due to multiple API calls (quote, details, 4 technical indicators, historical data)

#### 🔧 **Technical Changes**
- Completely rewrote `createStockFromCSV()` function in `csv-dividend-loader.ts`
- Now makes 7 API calls per stock:
  1. Quote API (price, OHLC, volume)
  2. Ticker Details API (company info, sector, market cap)
  3. RSI API (technical indicator)
  4. SMA 50-day API (moving average)
  5. SMA 200-day API (moving average)
  6. MACD API (technical indicator)
  7. Historical Aggregates API (52-week range)
- Added proper rate limiting with 200ms delays between batches
- Removed mock/estimated data entirely

#### 📊 **Data Flow Summary**
```
CSV File → Dividend Information Only
  ├─ Ex-dividend dates
  ├─ Dividend amounts
  ├─ Payment dates
  ├─ Frequency
  └─ Payout ratios

Polygon.io API → Everything Else
  ├─ Real-time prices
  ├─ Company information
  ├─ Technical indicators
  ├─ Historical data
  └─ Volume metrics
```

---

## Recent Updates - Version 2.0.3 (2025-11-20)

### Bug Fixes

#### ✅ **Fixed Runtime Crash on Stock Cards**
- Added optional chaining to all price data fields on stock cards
- Fixed "Cannot read property 'toFixed' of undefined" error for `open` and `previousClose` fields
- Added safe fallbacks ("N/A") when data is not yet loaded
- Applied to all fields: open, previousClose, dayLow, dayHigh, week52High, week52Low, volume
- Also added optional chaining to technical indicators (MACD, RSI) and dividendYield
- App no longer crashes when displaying stocks with incomplete data

---

## Recent Updates - Version 2.0.2 (2025-11-20)

### Major Data & UI Overhaul

#### ✅ **Complete Card Redesign**
- Completely restructured stock cards to show all essential data
- **Header**: Symbol, Company Name, Current Price, Change with %
- **Company Info**: Sector • Industry • Index (S&P 500, Dow Jones, etc.)
- **Price Data Section**:
  - Opening Price
  - Previous Close
  - Day Range (Low-High)
  - 52-Week High
  - 52-Week Low
  - Volume (in millions)
- **Technical & Dividend Section**:
  - MACD (color-coded: green/red)
  - RSI (color-coded: red>70, green>50, blue<50)
  - Dividend Yield
  - Ex-Dividend Date
- Ultra-compact design with 8px-9px font sizes for maximum information density

#### ✅ **Enhanced API Integration**
- Added `open` and `previousClose` fields to PriceData interface
- All price data now comes from Polygon.io APIs:
  - Opening price from daily aggregate
  - Previous close calculated from open
  - Real 52-week high/low from historical data
  - Real MACD, RSI, and Moving Averages
- Updated all data models across the codebase

#### ✅ **Fixed Date Filtering**
- Resolved timezone offset issues causing off-by-one-day errors
- Date comparisons now use local date components to avoid UTC conversion issues
- "Today", "Tomorrow", and "Week" filters now work correctly

#### ✅ **Data Quality Filter**
- Automatically filters out stocks with $0 price (invalid/missing data)
- Only shows stocks with valid pricing information
- Prevents display of incomplete API responses

#### 🔧 **Technical Improvements**
- Updated TypeScript interfaces across all files
- Fixed WebSocket price updates to include new fields
- Improved CSV loader to handle new price data format
- Enhanced stock data store with proper type safety

---

## Recent Updates - Version 2.0.1 (2025-11-20)

### UI/UX Improvements

#### ✅ **Compact Card Design**
- Made all stock cards more compact across all screens
- Reduced padding and spacing for better information density
- Smaller font sizes for labels and secondary information
- More data visible on screen without scrolling

#### ✅ **Removed Live Connection Banner**
- Removed the green "Live Data Connected" banner to declutter UI
- WebSocket status still tracked internally

#### ✅ **Thinner Data Disclaimer**
- Made the "Market data delayed 15 minutes" bar thinner and more subtle
- Changed from `p-2` to `px-3 py-1` for less visual weight
- Reduced text from `text-xs` to `text-[10px]`

#### ✅ **Enhanced Stock Cards**
- Added MACD and RSI directly to list view cards
- Shows real-time technical indicators without clicking into details
- Better use of space with 3-column layout for Volume/MACD/RSI
- Color-coded indicators (green/red for MACD, dynamic colors for RSI)

#### ✅ **Real Data Integration**
- Connected all data points to Polygon.io APIs:
  - Real 52-week high/low from historical data (365 days)
  - Real RSI (14-day) from Polygon indicators API
  - Real MACD values (12/26/9) from Polygon indicators API
  - Real 50-day and 200-day moving averages from Polygon SMA API
- Price change correctly reflects opening price (close - open)
- All technical indicators now show actual market data when available

#### 🔧 **Technical Changes**
- Updated `polygon-api.ts` to fetch technical indicators
- Added 52-week range calculation from historical aggregate data
- Improved error handling with fallback to estimates when API fails
- Added proper delays between API calls to respect rate limits

---

## Recent Updates - Version 2.0.0 (2025-11-19)

### Major Feature Release

#### ✅ **Background Refresh & Real-Time Data**
- Automated daily background refresh for dividend data
- WebSocket integration for second-by-second price updates (API key working!)
- Chunked loading prevents crashes with 11,000+ tickers
- Intelligent two-tier refresh: dividend data (daily) vs price data (real-time)

#### ✅ **User Experience Improvements**
- Removed manual refresh buttons - everything is automatic
- Shows stock count with "Load All 11k" button when needed
- Subtle timestamp display (9px) for last WebSocket update
- Green "Live" indicator when prices update in real-time

#### ✅ **New Features**
- **About Page**: Version tracking, changelog, feature list
- **Feedback System**: Direct submission (no email app needed) to ofreyes2@yahoo.com
- **Portfolio Help**: Comprehensive guide on how to track investments
- Help button added to Portfolio screen (? icon)

#### ✅ **Technical Improvements**
- WebSocket authentication working with your API key
- Exponential backoff for reconnection attempts
- Second-level aggregates for maximum price granularity
- Fixed auto-refresh loop that caused UI flickering
- Formspree integration for feedback submission

#### 🔧 **How to Load All 11k Tickers**
1. Open the app
2. Look for the green card showing "{X} stocks loaded"
3. Tap the blue "Load All 11k" button
4. Wait for chunked loading (50 tickers every 500ms)
5. App will filter to ~2,000 stocks with dividend data

---

## Future Enhancements

- [x] Custom date/day filters with calendar picker
- [x] Detailed stock analysis screen
- [x] Technical indicators (RSI, MACD, PEG)
- [x] MACD chart visualization
- [x] Volume and price range data
- [x] Individual stock AI analysis (auto-loaded)
- [x] AI chat for stock questions
- [x] Portfolio tracking system
- [x] Transaction management
- [x] Dividend calendar (monthly/weekly views)
- [x] Upcoming dividend tracker
- [x] Buy stock functionality
- [x] 15-minute data delay disclaimer
- [ ] Real-time stock data API integration
- [ ] Historical dividend data and charts
- [ ] Dividend reinvestment (DRIP) calculations
- [ ] Tax implications calculator
- [ ] Push notifications for dividend payments
- [ ] Export calculations to CSV/PDF
- [ ] Watchlist functionality with alerts
- [ ] Price alerts
- [x] Search stocks by symbol or company name
- [ ] Expanded to 2000+ dividend stocks
- [ ] Symbol search and sorting
- [ ] Logo display next to company name

## Notes

- Stock data includes realistic mock values with complete technical indicators
- Ex-dividend dates are set to current week for demo purposes
- Technical indicators (RSI, MACD, PEG) are generated algorithmically
- Volume data is simulated in millions of shares
- AI analysis uses OpenAI GPT-4o API for individual analysis, bulk analysis, and interactive chat
- All calculations are client-side for instant feedback
- Designed for iOS-first experience with native navigation
- Stock cards are tappable for detailed analysis with auto-loaded AI insights
- Checkbox selection for bulk operations
- Portfolio data persists using Zustand + AsyncStorage
- MACD charts powered by Victory Native
- All market data displayed with 15-minute delay disclaimer
- Calendar date picker for precise ex-dividend date filtering (fixed timezone issue for accurate date matching)
- Search functionality for quick stock lookup by symbol or company name
- **Dividend calculations** show per-payment amounts (current distribution cycle) plus annual totals
  - "Next Payout" displays the upcoming dividend payment amount
  - "Annual Total" shows the full year dividend amount
  - All calculators and stock details properly distinguish between payment cycle and annual dividends
- **Ticker Manager** allows users to manually edit and load custom tickers
  - Automatically loads 11,628 tickers from `/src/data/nanotickers.ts` by default
  - Default refresh uses all 11,628 tickers to find dividend opportunities
  - Users can edit the ticker list directly in the app via purple list icon
  - Custom ticker lists are saved and used for future refreshes
  - To update the default ticker list: edit `/assets/nanotickers.txt` via SSH, then regenerate the TypeScript module
- **Polygon.io API** - Single source of truth for all stock data
  - Fetches dividends, prices, volumes, technical indicators, and company details
  - Filters results to only show stocks with future ex-dividend dates
  - Rate-limited to 5 requests per second for optimal performance

---

**Built with Vibecode** - AI-powered app development platform
