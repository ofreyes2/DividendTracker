# Dividend Calendar - AI-Powered Stock Screener

A professional dividend stock screening and analysis app with AI-powered investment recommendations. Filter stocks by ex-dividend dates, calculate investment returns, and get personalized AI analysis for your investment strategy.

## Overview

This app helps dividend investors find opportunities by filtering stocks based on ex-dividend dates (today, tomorrow, this week, or custom dates). It features a comprehensive database of 30+ dividend-paying stocks, real-time filtering, bulk investment calculations, and AI-powered analysis to help you make informed investment decisions.

## Key Features

### 1. **Dividend Calendar with Smart Filtering**
- **Complete Stock Universe** - Browse all 30+ dividend-paying stocks
- **Quick Filters** - Find stocks with ex-dividend dates:
  - Today
  - Tomorrow
  - This Week
  - All stocks
- **Advanced Filters** (coming soon) - Filter by:
  - Specific dates or date ranges
  - Month or quarter
  - Dividend yield ranges
  - Sectors
  - Market cap

### 2. **Comprehensive Stock Information**
Each stock displays:
- **Company Name** - Full company name, not just ticker
- **Current Price** - Real-time pricing with daily change
- **Dividend Yield** - Percentage return from dividends
- **Annual Dividend** - Total yearly dividend payment
- **Ex-Dividend Date** - Key date for dividend eligibility
- **Payment Frequency** - Monthly, quarterly, semi-annual, or annual
- **Sector** - Industry classification
- **Market Cap** - Company size

### 3. **Bulk Investment Calculator**
- **Multi-Stock Selection** - Select any number of stocks from filtered results
- **Equal Distribution** - Automatically divides investment equally across selected stocks
- **Whole Share Calculations** - Shows exactly how many shares you can purchase
- **Detailed Breakdown** - Per-stock investment details:
  - Amount invested
  - Shares purchased
  - Annual dividend income
  - Monthly dividend income
- **Portfolio Summary**:
  - Total shares
  - Average yield
  - Total annual dividends
  - Expected monthly income

### 4. **AI-Powered Analysis (GPT-4o)**
- **Smart Recommendations** - AI analyzes all selected stocks
- **Three Investment Scenarios**:
  - **Best Buys** - Top-rated stocks by overall score
  - **High Yield** - Maximum dividend income strategies
  - **Low Risk** - Conservative, stable dividend picks
- **Detailed Stock Analysis**:
  - Investment score (0-100)
  - Buy/Hold/Avoid recommendation
  - Risk level assessment
  - Investment timeframe
  - Pros and cons
  - Detailed reasoning
- **Expected Returns** - AI-calculated expected return percentages

### 5. **Beautiful Professional UI**
- Dark theme optimized for financial data
- Stock selection with checkboxes
- Real-time calculations
- Smooth animations
- Native iOS design patterns
- Color-coded indicators

## Available Stocks

The app includes 30+ dividend stocks across multiple sectors:

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

### Finding Dividend Opportunities

1. **Open App** → See all dividend stocks
2. **Apply Quick Filter** → Tap "Today" to see stocks going ex-dividend today
3. **Review Options** → See stock names, prices, yields, and ex-dividend dates
4. **Select Stocks** → Tap checkboxes to select interesting opportunities
5. **Enter Investment** → Input your total investment amount at the top

### Calculating Returns

6. **Tap "Calculate"** → Opens bulk calculator
7. **View Breakdown** → See per-stock allocation:
   - How many shares of each stock
   - Investment amount per stock
   - Annual and monthly dividend income per stock
8. **Review Summary** → Total monthly dividend income from all stocks

### Getting AI Recommendations

9. **Tap "AI Analyze"** → Launches AI analysis
10. **Wait for Analysis** → AI analyzes all selected stocks (10-20 seconds)
11. **Review Scenarios**:
    - **Best Buys** - Highest-rated stocks overall
    - **High Yield** - Maximum dividend income
    - **Low Risk** - Safest dividend payers
12. **Read Details** → For each recommended stock:
    - Investment score
    - Buy/Hold/Avoid recommendation
    - Risk level
    - Pros and cons
    - Detailed reasoning
13. **Make Decision** → Use AI insights to refine your selection

## Tech Stack

- **React Native 0.76.7** - Cross-platform mobile framework
- **Expo SDK 53** - Development platform
- **TypeScript** - Type-safe development
- **React Navigation** - Native stack navigation
- **React Native Reanimated** - 60fps animations
- **NativeWind (Tailwind CSS)** - Styling
- **OpenAI GPT-4o** - AI analysis and recommendations

## Architecture

### File Structure
```
src/
├── api/
│   ├── comprehensive-stock-data.ts  # Complete stock database & filtering
│   ├── ai-analysis.ts               # AI-powered stock analysis
│   └── chat-service.ts              # OpenAI API integration
├── screens/
│   ├── StockListScreen.tsx          # Main calendar/filter screen
│   ├── BulkCalculatorScreen.tsx     # Investment calculator
│   └── AIAnalysisScreen.tsx         # AI analysis & recommendations
├── navigation/
│   └── RootNavigator.tsx            # Navigation structure
└── utils/
    └── cn.ts                        # TailwindCSS utility
```

### Data Model

**DividendStock**:
```typescript
{
  symbol: string;           // "AAPL"
  companyName: string;      // "Apple Inc."
  price: number;            // 178.45
  change: number;           // 2.15
  changePercent: number;    // 1.22
  dividendAmount: number;   // 0.24 (per payment)
  dividendYield: number;    // 0.54
  exDividendDate: string;   // "2025-11-18"
  recordDate: string;       // "2025-11-19"
  paymentDate: string;      // "2025-11-26"
  frequency: string;        // "quarterly"
  annualDividend: number;   // 0.96
  sector: string;           // "Technology"
  marketCap: number;        // 2800 (billions)
}
```

### API Services

**Stock Data API** (`comprehensive-stock-data.ts`):
- `ALL_DIVIDEND_STOCKS` - Complete stock database
- `filterStocks(stocks, filters)` - Apply filtering criteria
- `getStocksExDividendToday()` - Stocks going ex-dividend today
- `getStocksExDividendTomorrow()` - Tomorrow's opportunities
- `getStocksExDividendThisWeek()` - This week's opportunities
- `calculateBulkInvestment()` - Calculate investment allocations

**AI Analysis API** (`ai-analysis.ts`):
- `analyzeStock()` - Analyze single stock
- `analyzeStocksInBulk()` - Analyze multiple stocks with scenarios
- `getQuickRecommendation()` - Fast AI recommendation

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

- [ ] Real-time stock data API integration
- [ ] Custom date range filters
- [ ] Sector and yield range filters
- [ ] Historical dividend data and charts
- [ ] Dividend reinvestment (DRIP) calculations
- [ ] Tax implications calculator
- [ ] Push notifications for ex-dividend dates
- [ ] Export calculations to CSV/PDF
- [ ] Save and compare multiple portfolios
- [ ] Dividend payment calendar view
- [ ] Integration with brokerage APIs

## Notes

- Stock data is currently mock data with realistic values
- Ex-dividend dates are set to current week for demo purposes
- AI analysis uses OpenAI GPT-4o API
- All calculations are client-side for instant feedback
- Designed for iOS-first experience

---

**Built with Vibecode** - AI-powered app development platform
