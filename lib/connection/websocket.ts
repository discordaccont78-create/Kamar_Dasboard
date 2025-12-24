export class WebSocketManager {
  private socket: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private onMessageCallback?: (data: ArrayBuffer | string) => void;
  private onStatusChange?: (connected: boolean) => void;

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    try {
        // Security Check: Upgrade to WSS if running on HTTPS to prevent Mixed Content blocking.
        // This catches cases where the URL construction logic might have missed the environment.
        if (typeof window !== 'undefined' && 
           (window.location.protocol === 'https:' || window.location.protocol.indexOf('https') === 0) && 
           this.url.startsWith('ws://')) {
            console.warn("[WebSocketManager] Auto-upgrading insecure connection to WSS due to HTTPS context.");
            this.url = this.url.replace('ws://', 'wss://');
        }

        this.socket = new WebSocket(this.url);
        this.socket.binaryType = 'arraybuffer';
        
        this.socket.onopen = () => {
          this.reconnectAttempts = 0;
          this.onStatusChange?.(true);
        };
        
        this.socket.onmessage = (event) => {
          this.onMessageCallback?.(event.data);
        };
        
        this.socket.onclose = () => {
          this.onStatusChange?.(false);
          this.scheduleReconnect();
        };
        
        this.socket.onerror = (e) => {
           console.error("WebSocket Error:", e);
           // Do not throw here to prevent app crash, let onclose handle reconnect
        };
    } catch (e) {
        console.error("Failed to create WebSocket:", e);
        this.scheduleReconnect();
    }
  }

  send(data: ArrayBuffer | string) {
    // Defensive check: ensure socket exists AND is open
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
          this.socket.send(data);
          return true;
      } catch (e) {
          console.error("Socket send failed:", e);
          return false;
      }
    }
    return false;
  }

  onMessage(callback: (data: ArrayBuffer | string) => void) {
    this.onMessageCallback = callback;
  }

  onStatus(callback: (connected: boolean) => void) {
    this.onStatusChange = callback;
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.reconnectAttempts++;
    setTimeout(() => {
        // Double check we haven't been disconnected/destroyed in the meantime
        if (this.socket && this.socket.readyState !== WebSocket.OPEN) {
            this.connect();
        } else if (!this.socket) {
            this.connect();
        }
    }, 5000);
  }

  disconnect() {
    if (this.socket) {
        this.socket.onclose = null; // Prevent reconnect loop
        this.socket.close();
        this.socket = null;
    }
  }
}