# Dividend Screener App

A professional dividend stock tracking and investment calculator app built with React Native and Expo.

## Overview

This app helps investors track dividend-paying stocks and calculate potential investment returns. It features real-time stock data (15-minute delayed), comprehensive dividend information, and an interactive investment calculator with custom allocation controls.

## Features

### 1. **Stock Portfolio Management**
- Search and add dividend-paying stocks
- View current stock prices with daily changes
- Track multiple stocks in your portfolio
- Pull-to-refresh for updated market data
- Remove stocks from your portfolio

### 2. **Comprehensive Dividend Data**
Each stock displays:
- **Annual Dividend** - Total yearly dividend amount
- **Dividend Yield** - Percentage return from dividends
- **Quarterly Payout** - Amount per payment period
- **Payment Frequency** - Quarterly, monthly, or annual
- **Ex-Dividend Date** - Last date to buy and receive next dividend
- **Record Date** - Date to be on record for dividend
- **Payment Date** - When dividend is paid out

### 3. **Investment Calculator**
- Input total investment amount
- Customize allocation percentages for each stock
- Equal split functionality for quick allocation
- Real-time calculations showing:
  - Number of shares purchased per stock
  - Investment amount per stock
  - Annual dividend income per stock
  - Total monthly dividend income
  - Total annual dividend income

### 4. **Beautiful Professional UI**
- Dark theme optimized for financial data
- Card-based layout with smooth animations
- Color-coded positive/negative changes
- Professional typography and spacing
- Native iOS design patterns

## Tech Stack

- **React Native 0.76.7** - Cross-platform mobile framework
- **Expo SDK 53** - Development platform
- **TypeScript** - Type-safe development
- **Zustand** - State management with AsyncStorage persistence
- **React Navigation** - Native stack navigation
- **React Native Reanimated** - Smooth 60fps animations
- **NativeWind (Tailwind CSS)** - Styling

## Architecture

### File Structure
```
src/
├── api/
│   └── stock-data.ts          # Stock data API and calculations
├── screens/
│   ├── DividendScreener.tsx   # Main portfolio screen
│   ├── AddStockModal.tsx      # Stock search and add modal
│   └── InvestmentCalculator.tsx # Investment calculator modal
├── navigation/
│   └── RootNavigator.tsx      # Navigation structure
├── state/
│   └── portfolioStore.ts      # Zustand state management
└── utils/
    └── cn.ts                  # TailwindCSS className utility
```

### State Management

The app uses Zustand for state management with AsyncStorage persistence:

**Portfolio Store** (`portfolioStore.ts`):
- `stocks` - Array of stocks in portfolio
- `allocations` - Investment allocation percentages
- `totalInvestment` - Total investment amount
- Actions: `addStock`, `removeStock`, `updateAllocation`, `setTotalInvestment`, `refreshStock`, `clearPortfolio`

### API Service

**Stock Data API** (`stock-data.ts`):
- `searchStocks(query)` - Search for stocks by symbol
- `fetchStockData(symbol)` - Get stock price and dividend data
- `fetchMultipleStocks(symbols)` - Batch fetch multiple stocks
- `calculateInvestment()` - Calculate investment allocations and returns

Current implementation uses mock data for demonstration. In production, integrate with:
- Alpha Vantage API for stock prices
- Financial Modeling Prep API for dividend data
- Or similar financial data providers

## Available Stocks (Mock Data)

The app currently includes these dividend stocks:
- **AAPL** - Apple Inc. (0.54% yield)
- **MSFT** - Microsoft Corp. (0.71% yield)
- **KO** - Coca-Cola Co. (3.09% yield)
- **PEP** - PepsiCo Inc. (3.45% yield)
- **JNJ** - Johnson & Johnson (2.99% yield)
- **PG** - Proctor & Gamble (2.27% yield)
- **T** - AT&T Inc. (5.01% yield)
- **VZ** - Verizon (6.63% yield)
- **O** - Realty Income (5.29% yield)
- **ABBV** - AbbVie Inc. (3.17% yield)

## User Workflow

1. **Add Stocks**: Tap "Add Your First Stock" or the add button
2. **Search**: Type ticker symbol (e.g., "AAPL", "KO")
3. **Review**: See stock details and dividend information
4. **Add to Portfolio**: Confirm to add stock to your portfolio
5. **Calculate Returns**: Tap "Calculate Investment Returns"
6. **Set Investment**: Enter total investment amount
7. **Adjust Allocations**: Use sliders to customize allocation percentages
8. **View Results**: See shares, dividends, and monthly income
9. **Save**: Save allocations and return to portfolio

## Design Philosophy

### Color Scheme
- **Deep Navy** (#0f172a, #1a2332) - Professional backgrounds
- **Emerald Green** (#10b981) - Positive values and dividends
- **Blue Accent** (#3b82f6) - Interactive elements
- **Slate Gray** (#64748b) - Secondary text
- **Red** (#ef4444) - Negative values and delete actions

### Typography
- **Bold Large Numbers** - Stock prices and key metrics
- **System Font** - Native iOS feel
- **Clear Hierarchy** - Primary, secondary, and tertiary information

### Animations
- Fade in down on list items
- Spring animations for layout changes
- Smooth transitions between screens
- Native modal presentations

## Future Enhancements

- [ ] Connect to real-time stock data API
- [ ] Add stock charts and historical data
- [ ] Portfolio performance tracking
- [ ] Dividend payment calendar
- [ ] Tax reporting for dividends
- [ ] Export portfolio to CSV
- [ ] Push notifications for ex-dividend dates
- [ ] Multiple portfolios support
- [ ] Dark/light theme toggle

## Notes

- All financial data is currently mock data for demonstration
- Market data would be 15-minute delayed in production (free tier)
- Designed for iOS-first experience
- All calculations are client-side for instant feedback

---

**Built with Vibecode** - AI-powered app development platform
