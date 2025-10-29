import { Logger } from "./logger";

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
  private reconnectInterval: number = 5000; // 5 seconds
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private connectionStatusHandlers: ((status: boolean) => void)[] = []; // New: Connection status handlers

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.isConnected || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    Logger.log("Attempting to connect to WebSocket...");
    this.ws = window.electronAPI.createWebSocket();

    this.ws.onopen = () => {
      Logger.log("WebSocket connected.");
      this.isConnected = true;
      this.emitConnectionStatus(true); // Emit connection status
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        Logger.error("Failed to parse WebSocket message:", error);
      }
    };

    this.ws.onclose = (event) => {
      this.isConnected = false;
      this.emitConnectionStatus(false); // Emit connection status
      Logger.warn("WebSocket disconnected:", event.code, event.reason);
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      Logger.error("WebSocket error:", error);
      this.ws?.close(); // Close to trigger onclose and reconnect logic
    };
  }

  private emitConnectionStatus(status: boolean) {
    this.connectionStatusHandlers.forEach(handler => handler(status));
  }

  public onConnectionStatusChange(handler: (status: boolean) => void) {
    this.connectionStatusHandlers.push(handler);
    // Immediately inform the new handler of the current status
    handler(this.isConnected);
  }

  public offConnectionStatusChange(handler: (status: boolean) => void) {
    this.connectionStatusHandlers = this.connectionStatusHandlers.filter(h => h !== handler);
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      Logger.log(`Attempting to reconnect in ${this.reconnectInterval / 1000} seconds (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => this.connect(), this.reconnectInterval);
    } else {
      Logger.error("Max reconnect attempts reached. Giving up on WebSocket connection.");
    }
  }

  private handleMessage(message: WebSocketMessage) {
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => handler(message));
    } else {
      Logger.warn(`No handlers registered for WebSocket message type: ${message.type}`);
    }
  }

  public on(type: string, handler: WebSocketHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)?.push(handler);
  }

  public off(type: string, handler: WebSocketHandler) {
    const handlers = this.handlers.get(type);
    if (handlers) {
      this.handlers.set(type, handlers.filter((h) => h !== handler));
    }
  }

  public send(type: string, payload: any) {
    if (this.isConnected && this.ws) {
      const message: WebSocketMessage = { type, payload };
      this.ws.send(JSON.stringify(message));
    } else {
      Logger.warn("WebSocket not connected. Cannot send message.");
    }
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }
}

export const realtimeManager = new RealtimeManager();