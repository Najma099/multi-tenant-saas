const tabId = typeof crypto !== "undefined" ? crypto.randomUUID() : Math.random().toString(36);

type MessageHandler = (msg: Record<string, unknown>) => void;

class WsClient {
  private ws: WebSocket | null = null;
  private handlers = new Set<MessageHandler>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;
  private reconnectDelay = 1000;
  private url = "";
  private joinPayload: Record<string, unknown> | null = null;
  private messageQueue: string[] = [];

  connect(url: string, joinPayload: Record<string, unknown>) {
    this.url = url;
    this.joinPayload = joinPayload;
    this.shouldReconnect = true;
    this._open();
  }

  private _open() {
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
    }

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.reconnectDelay = 1000;
      if (this.joinPayload) {
        this.send({ type: "join", tabId, ...this.joinPayload });
      }
      this._flushQueue();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.handlers.forEach((h) => h(msg));
      } catch { }
    };

    this.ws.onclose = (e) => {
      if (e.code === 4003) {
        this.shouldReconnect = false;
        return;
      }
      if (this.shouldReconnect) this._scheduleReconnect();
    };

    this.ws.onerror = () => { };
  }

  private _scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this._open();
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30_000);
    }, this.reconnectDelay);
  }

  private _flushQueue() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    if (this.messageQueue.length === 0) return;

    const toSend = [...this.messageQueue];
    this.messageQueue = [];

    toSend.forEach(msg => {
      this.ws?.send(msg);
    });
  }

  send(msg: Record<string, unknown>) {
    const payload = JSON.stringify(msg);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
    } else {
      this.messageQueue.push(payload);
    }
  }

  onMessage(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
    this.messageQueue = [];
  }

  getTabId() {
    return tabId;
  }
}

export const wsClient = new WsClient();