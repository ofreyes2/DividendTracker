/**
 * Polygon.io WebSocket Service
 * Provides real-time stock price updates with 15-minute delay
 * Connects to wss://delayed.polygon.io for delayed market data
 */

import type { DividendStock } from "../api/comprehensive-stock-data";

const POLYGON_API_KEY = process.env.EXPO_PUBLIC_POLYGON_API_KEY;
const WS_URL = "wss://delayed.polygon.io/stocks"; // 15-minute delayed data

type MessageHandler = (data: AggregateMessage | TradeMessage | QuoteMessage) => void;
type ErrorHandler = (error: Event) => void;
type ConnectionHandler = () => void;

interface AggregateMessage {
  ev: "A" | "AM"; // A = second aggregate, AM = minute aggregate
  sym: string; // Symbol
  v: number; // Volume
  av: number; // Accumulated volume
  op: number; // Open price
  vw: number; // Volume weighted average price
  o: number; // Open price
  c: number; // Close price
  h: number; // High price
  l: number; // Low price
  a: number; // Average/VWAP
  s: number; // Start timestamp (ms)
  e: number; // End timestamp (ms)
}

interface TradeMessage {
  ev: "T"; // Trade
  sym: string; // Symbol
  x: number; // Exchange ID
  i: string; // Trade ID
  z: number; // Tape
  p: number; // Price
  s: number; // Size
  c: number[]; // Conditions
  t: number; // Timestamp (ms)
}

interface QuoteMessage {
  ev: "Q"; // Quote
  sym: string; // Symbol
  bx: number; // Bid exchange
  ax: number; // Ask exchange
  bp: number; // Bid price
  ap: number; // Ask price
  bs: number; // Bid size
  as: number; // Ask size
  c: number; // Condition
  t: number; // Timestamp (ms)
}

export interface PriceUpdate {
  symbol: string;
  price: number;
  change?: number;
  changePercent?: number;
  high?: number;
  low?: number;
  volume?: number;
  timestamp: number;
}

export class PolygonWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds
  private subscribedSymbols: Set<string> = new Set();
  private messageHandlers: Set<MessageHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private disconnectHandlers: Set<ConnectionHandler> = new Set();
  private isConnecting = false;
  private shouldReconnect = true;

  /**
   * Connect to Polygon WebSocket
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      console.log("[WebSocket] Already connected or connecting");
      return;
    }

    this.isConnecting = true;
    console.log("[WebSocket] Connecting to Polygon.io delayed feed...");

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log("[WebSocket] Connected successfully");
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        // Authenticate
        this.authenticate();

        // Notify connection handlers
        this.connectionHandlers.forEach((handler) => handler());
      };

      this.ws.onmessage = (event) => {
        try {
          const messages = JSON.parse(event.data);

          // Handle array of messages
          if (Array.isArray(messages)) {
            messages.forEach((message) => {
              this.handleMessage(message);
            });
          } else {
            this.handleMessage(messages);
          }
        } catch (error) {
          console.error("[WebSocket] Failed to parse message:", error);
        }
      };

      this.ws.onerror = (error) => {
        // Use warn instead of error - WebSocket errors are common and handled gracefully
        console.warn("[WebSocket] Connection issue (expected during normal operation)");
        this.isConnecting = false;
        this.errorHandlers.forEach((handler) => handler(error));
      };

      this.ws.onclose = () => {
        console.log("[WebSocket] Connection closed");
        this.isConnecting = false;
        this.disconnectHandlers.forEach((handler) => handler());

        // Don't reconnect if authentication failed
        if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(
            `[WebSocket] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
          );
          setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts); // Exponential backoff
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.log("[WebSocket] Max reconnection attempts reached, giving up");
        }
      };
    } catch (error) {
      console.error("[WebSocket] Failed to create WebSocket:", error);
      this.isConnecting = false;
    }
  }

  /**
   * Authenticate with Polygon API
   */
  private authenticate(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("[WebSocket] Cannot authenticate: not connected");
      return;
    }

    const authMessage = {
      action: "auth",
      params: POLYGON_API_KEY,
    };

    console.log("[WebSocket] Authenticating...");
    this.ws.send(JSON.stringify(authMessage));
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(message: any): void {
    // Handle status messages
    if (message.ev === "status") {
      console.log(`[WebSocket] Status: ${message.status} - ${message.message}`);

      // Stop reconnecting if authentication fails
      if (message.status === "auth_failed" || message.status === "auth_timeout") {
        console.warn("[WebSocket] Authentication failed - WebSocket disabled. Check Polygon.io API key has WebSocket access.");
        this.shouldReconnect = false;
        this.disconnect();
        return;
      }

      // Successfully authenticated
      if (message.status === "auth_success") {
        console.log("[WebSocket] Successfully authenticated");
        // Resubscribe to symbols if any were queued
        if (this.subscribedSymbols.size > 0) {
          const symbols = Array.from(this.subscribedSymbols);
          this.subscribedSymbols.clear(); // Clear to avoid duplicates
          this.subscribe(symbols);
        }
      }

      return;
    }

    // Handle aggregate messages (minute bars - most useful for price updates)
    if (message.ev === "AM" || message.ev === "A") {
      const agg = message as AggregateMessage;
      const priceUpdate: PriceUpdate = {
        symbol: agg.sym,
        price: agg.c, // Close price
        high: agg.h,
        low: agg.l,
        volume: agg.v,
        change: agg.c - agg.o,
        changePercent: ((agg.c - agg.o) / agg.o) * 100,
        timestamp: agg.e,
      };

      // Notify all handlers
      this.messageHandlers.forEach((handler) => handler(message));
    }

    // Handle trade messages
    if (message.ev === "T") {
      const trade = message as TradeMessage;
      const priceUpdate: PriceUpdate = {
        symbol: trade.sym,
        price: trade.p,
        timestamp: trade.t,
      };

      this.messageHandlers.forEach((handler) => handler(message));
    }

    // Handle quote messages
    if (message.ev === "Q") {
      const quote = message as QuoteMessage;
      const midPrice = (quote.bp + quote.ap) / 2;
      const priceUpdate: PriceUpdate = {
        symbol: quote.sym,
        price: midPrice,
        timestamp: quote.t,
      };

      this.messageHandlers.forEach((handler) => handler(message));
    }
  }

  /**
   * Subscribe to stock symbols (both second and minute aggregates)
   */
  subscribe(symbols: string[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("[WebSocket] Not connected, queuing symbols for subscription");
      // Queue for later subscription
      symbols.forEach((sym) => this.subscribedSymbols.add(sym));
      return;
    }

    // Subscribe to both second and minute aggregates for maximum real-time data
    const secondParams = symbols.map((sym) => `A.${sym}`).join(",");
    const minuteParams = symbols.map((sym) => `AM.${sym}`).join(",");

    const subscribeMessage = {
      action: "subscribe",
      params: `${secondParams},${minuteParams}`,
    };

    console.log(`[WebSocket] Subscribing to ${symbols.length} symbols (second + minute aggregates)...`);
    this.ws.send(JSON.stringify(subscribeMessage));

    // Track subscribed symbols
    symbols.forEach((sym) => this.subscribedSymbols.add(sym));
  }

  /**
   * Unsubscribe from stock symbols
   */
  unsubscribe(symbols: string[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("[WebSocket] Not connected");
      return;
    }

    const secondParams = symbols.map((sym) => `A.${sym}`).join(",");
    const minuteParams = symbols.map((sym) => `AM.${sym}`).join(",");

    const unsubscribeMessage = {
      action: "unsubscribe",
      params: `${secondParams},${minuteParams}`,
    };

    console.log(`[WebSocket] Unsubscribing from ${symbols.length} symbols...`);
    this.ws.send(JSON.stringify(unsubscribeMessage));

    // Remove from tracked symbols
    symbols.forEach((sym) => this.subscribedSymbols.delete(sym));
  }

  /**
   * Add message handler
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    // Return unsubscribe function
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Add error handler
   */
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  /**
   * Add connection handler
   */
  onConnect(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  /**
   * Add disconnection handler
   */
  onDisconnect(handler: ConnectionHandler): () => void {
    this.disconnectHandlers.add(handler);
    return () => this.disconnectHandlers.delete(handler);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    console.log("[WebSocket] Disconnecting...");
    this.shouldReconnect = false;

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.subscribedSymbols.clear();
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get subscribed symbols
   */
  getSubscribedSymbols(): string[] {
    return Array.from(this.subscribedSymbols);
  }
}

// Singleton instance
let wsInstance: PolygonWebSocketService | null = null;

/**
 * Get WebSocket service instance
 */
export function getWebSocketService(): PolygonWebSocketService {
  if (!wsInstance) {
    wsInstance = new PolygonWebSocketService();
  }
  return wsInstance;
}
