import { Logger } from "./logger";
import { PerformanceLogger } from "./performance-logger";

interface WebSocketMessage<T = any> {
  type: string;
  payload: T;
}

interface WebSocketHandler {
  (message: WebSocketMessage): void;
}

class RealtimeManager {
  private ws: WebSocket | null = null;
  private handlers: Map<string, WebSocketHandler[]> = new Map();
  private isConnected: boolean = false;
  private reconnectInterval: number = 1000; // Initial reconnect interval: 1 second
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private connectionStatusHandlers: ((status: boolean) => void)[] = [];
  private currentReconnectDelay: number = this.reconnectInterval;
  private onErrorCallback: ((title: string, description?: string) => void) | null = null;

  constructor() {
    this.connect();
  }

  public setOnErrorCallback(callback: (title: string, description?: string) => void) {
    this.onErrorCallback = callback;
  }

  private connect() {
    if (this.isConnected || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    Logger.debug("Attempting to connect to WebSocket...");
    this.ws = window.electronAPI.createWebSocket();

    this.ws.onopen = () => {
      Logger.debug("WebSocket connected.");
      this.isConnected = true;
      this.emitConnectionStatus(true);
      this.reconnectAttempts = 0;
      this.currentReconnectDelay = this.reconnectInterval;
    };

    this.ws.onerror = (event) => {
      Logger.error("WebSocket error:", event);
      if (this.onErrorCallback) {
        this.onErrorCallback("WebSocket Error", "Could not connect to the backend. Please check the backend server.");
      }
      this.isConnected = false;
      this.emitConnectionStatus(false);
      this.ws?.close();
    };

    this.ws.onclose = (event) => {
      Logger.debug("WebSocket disconnected:", event);
      if (!event.wasClean && this.onErrorCallback) {
        this.onErrorCallback("WebSocket Disconnected", "Connection to the backend was lost. Attempting to reconnect...");
      }
      this.isConnected = false;
      this.emitConnectionStatus(false);
      this.scheduleReconnect();
    };

    this.ws.onmessage = (event) => {
      PerformanceLogger.start("websocket_message_handling");
      Logger.debug("WebSocket message received:", event.data);
      const message = JSON.parse(event.data);
      this.handleMessage(message);
      PerformanceLogger.end("websocket_message_handling");
    };
  }

  public send(event: string, payload: any) {
    if (this.ws && this.isConnected) {
      const message = { event, payload };
      Logger.debug("Sending WebSocket message:", message);
      this.ws.send(JSON.stringify(message));
    } else {
      Logger.warn("WebSocket not connected. Message not sent:", { event, payload });
    }
  }

  public on(event: string, handler: WebSocketHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)?.push(handler);
  }

  public off(event: string, handler: WebSocketHandler) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      this.handlers.set(event, handlers.filter((h) => h !== handler));
    }
  }

  public onConnectionStatusChange(handler: (status: boolean) => void) {
    this.connectionStatusHandlers.push(handler);
  }

  public offConnectionStatusChange(handler: (status: boolean) => void) {
    this.connectionStatusHandlers = this.connectionStatusHandlers.filter((h) => h !== handler);
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  private emitConnectionStatus(status: boolean) {
    this.connectionStatusHandlers.forEach((handler) => handler(status));
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.currentReconnectDelay = Math.min(this.currentReconnectDelay * 2, 30000); // Max 30 seconds
      Logger.debug(`Attempting to reconnect in ${this.currentReconnectDelay / 1000} seconds...`);
      setTimeout(() => this.connect(), this.currentReconnectDelay);
    }
  }
}

export const realtimeManager = new RealtimeManager();