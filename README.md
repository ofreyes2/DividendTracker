# DAILY DIVIDEND CAPTURE - AI-Powered Trading Strategy App

A professional daily dividend capture trading app with AI-powered stock screening and analysis. Find stocks with ex-dividend dates, calculate optimal positions to hit daily dividend targets, track trading opportunities, and execute a systematic buy-hold-sell rotation strategy.

**🚀 NEW: Real-Time Data Integration with Polygon.io** - Load actual ex-dividend dates, stock prices, volumes, and technical indicators from Polygon.io API for accurate trading decisions.

## Overview

This app helps active traders execute a **daily dividend capture strategy**—buying stocks the day before their ex-dividend date, collecting the dividend payment, then selling and rotating capital to the next opportunity. Features comprehensive stock database with 45+ dividend payers, date-based filtering, AI-powered position sizing to hit daily targets (e.g., $1,000/day), volume analysis for safe exits, and real-time trading calculations with optional Polygon.io integration for live market data.

## Key Features

### 0. **Real-Time Market Data with Auto-Refresh (NEW 🆕)**
- **Polygon.io Integration** - ALL data comes from Polygon.io API:
  - Actual ex-dividend dates from market data
  - Live stock prices and volumes
  - Real technical indicators (RSI, MACD, Moving Averages)
  - Current market capitalization
  - Company details and sector information
  - **11,000+ ticker symbols available** by default
- **Automatic Background Refresh** - Stocks refresh automatically:
  - Daily auto-refresh by default (configurable)
  - Automatically filters to show only future ex-dividend dates
  - Stocks with past ex-dates are automatically removed
  - **Default loads all 11,000+ tickers from nanotickers.txt**
- **In-App Ticker Manager (NEW!)** - Easy access to customize your stock list:
  - Tap the purple **list icon** in the top right corner
  - Edit tickers directly in the app - no file access needed!
  - Add/remove any stock symbols you want
  - Supports comments (lines starting with #)
  - Live preview shows ticker count
  - One-tap "Load Stocks" button fetches all your custom tickers
  - Example format built-in with reset option
  - **Saves your custom list for future refreshes**
- **Smart Filtering** - Only shows relevant opportunities:
  - Displays stocks with ex-dividend dates TODAY or FUTURE only
  - Yesterday's opportunities automatically disappear
  - Always see current and upcoming dividend capture trades
- **Progress Tracking** - See loading progress as data is fetched (5 stocks per second)
- **Persistent Storage** - Data cached locally between app sessions
- **One-Click Manual Refresh** - Tap refresh icon to update anytime with 11k+ tickers

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
│   ├── comprehensive-stock-data.ts  # Complete stock database with 45+ stocks
│   │                                 # Technical indicators, volume, price ranges
│   ├── ai-analysis.ts               # AI-powered stock analysis
│   └── chat-service.ts              # OpenAI API integration (GPT-4o)
├── screens/
│   ├── StockListScreen.tsx          # Main calendar/filter screen
│   ├── StockDetailScreen.tsx        # Detailed stock analysis with MACD chart & AI chat
│   ├── PortfolioScreen.tsx          # Portfolio tracking and dividend calendar
│   ├── BulkCalculatorScreen.tsx     # Investment calculator
│   └── AIAnalysisScreen.tsx         # AI analysis & recommendations
├── state/
│   └── portfolioStore.ts            # Zustand store for portfolio management
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
  - Automatically loads 11,000+ tickers from `/src/data/nanotickers.ts` by default
  - Default refresh uses all 11,000+ tickers to find dividend opportunities
  - Users can edit the ticker list directly in the app via purple list icon
  - Custom ticker lists are saved and used for future refreshes
  - To update the default ticker list: edit `/assets/nanotickers.txt` via SSH, then regenerate the TypeScript module
- **Polygon.io API** - Single source of truth for all stock data
  - Fetches dividends, prices, volumes, technical indicators, and company details
  - Filters results to only show stocks with future ex-dividend dates
  - Rate-limited to 5 requests per second for optimal performance

---

**Built with Vibecode** - AI-powered app development platform
