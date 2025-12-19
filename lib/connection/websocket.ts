
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
  }

  send(data: ArrayBuffer | string) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(data);
      return true;
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
    setTimeout(() => this.connect(), 5000);
  }

  disconnect() {
    this.socket?.close();
  }
}
