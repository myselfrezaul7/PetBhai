import { doc, collection, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { safeStorage } from '../lib/storage';
import { API_BASE_URL } from './apiClient';
import { useState, useEffect } from 'react';

export type RealtimeEventType =
  | 'ORDER_CREATED'
  | 'ORDER_UPDATED'
  | 'INVENTORY_CHANGED'
  | 'NOTIFICATION_RECEIVED'
  | string;

export type RealtimeCallback<T = any> = (payload: T) => void;

interface BroadcastMessage<T = any> {
  eventType: RealtimeEventType;
  payload: T;
  timestamp: number;
}

const BROADCAST_CHANNEL_NAME = 'petbhai_realtime';
const TOKEN_STORAGE_KEY = 'petbhai_token';

class RealtimeService {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<string, Set<RealtimeCallback>> = new Map();
  private connectionListeners: Set<(connected: boolean) => void> = new Set();
  private firestoreUnsubscribers: Unsubscribe[] = [];
  private eventSource: EventSource | null = null;
  private sseReconnectTimeout: number | null = null;
  private reconnectAttempts = 0;
  private isConnected = false;
  private isInitialized = false;
  private initialOrdersLoaded = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initBroadcastChannel();
      this.init();
    }
  }

  private initBroadcastChannel(): void {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
      return;
    }

    try {
      this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      this.channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
        const data = event.data;
        if (data && data.eventType) {
          this.notifyLocalListeners(data.eventType, data.payload);
        }
      };
    } catch (err) {
      console.warn('RealtimeService: Failed to initialize BroadcastChannel', err);
    }
  }

  public init(): void {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }
    this.isInitialized = true;

    // 1. Subscribe to Firestore if configured
    this.initFirestore();

    // 2. Fallback / supplementary SSE stream
    this.initSSE();
  }

  private setConnected(connected: boolean): void {
    if (this.isConnected !== connected) {
      this.isConnected = connected;
      this.connectionListeners.forEach((listener) => {
        try {
          listener(connected);
        } catch (err) {
          console.error('RealtimeService: error in connection listener', err);
        }
      });
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public onConnectionChange(listener: (connected: boolean) => void): () => void {
    this.connectionListeners.add(listener);
    listener(this.isConnected);
    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  private initFirestore(): void {
    if (!isFirebaseConfigured() || !db) {
      return;
    }

    try {
      // 1. Subscribe to system/admin_live_feed document
      const feedDocRef = doc(db, 'system', 'admin_live_feed');
      const unsubFeed = onSnapshot(
        feedDocRef,
        (snapshot) => {
          this.setConnected(true);
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data?.eventType) {
              this.broadcast(data.eventType, data.payload);
            }
          }
        },
        (error) => {
          // Non-fatal, admin_live_feed doc might not be created yet in Firestore
          console.warn(
            'RealtimeService: Firestore admin_live_feed listener warning:',
            error.message
          );
        }
      );
      this.firestoreUnsubscribers.push(unsubFeed);

      // 2. Subscribe to orders collection for real-time order creation and updates
      const ordersColRef = collection(db, 'orders');
      const unsubOrders = onSnapshot(
        ordersColRef,
        (snapshot) => {
          this.setConnected(true);
          if (!this.initialOrdersLoaded) {
            this.initialOrdersLoaded = true;
            return;
          }

          snapshot.docChanges().forEach((change) => {
            const orderData = { id: change.doc.id, ...change.doc.data() };
            if (change.type === 'added') {
              this.broadcast('ORDER_CREATED', orderData);
            } else if (change.type === 'modified') {
              this.broadcast('ORDER_UPDATED', orderData);
            }
          });
        },
        (error) => {
          console.warn('RealtimeService: Firestore orders listener warning:', error.message);
        }
      );
      this.firestoreUnsubscribers.push(unsubOrders);
    } catch (err) {
      console.warn('RealtimeService: Failed to attach Firestore listeners:', err);
    }
  }

  public initSSE(): void {
    if (typeof window === 'undefined') return;

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    const token = safeStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      // If no admin token, don't attempt SSE connection yet
      return;
    }

    try {
      const streamUrl = `${API_BASE_URL}/admin/stream?token=${encodeURIComponent(token)}`;
      const es = new EventSource(streamUrl, { withCredentials: true });
      this.eventSource = es;

      es.addEventListener('connected', () => {
        this.reconnectAttempts = 0;
        this.setConnected(true);
      });

      es.addEventListener('order-created', (e: MessageEvent) => {
        this.setConnected(true);
        const payload = this.parseJsonSafe(e.data);
        this.broadcast('ORDER_CREATED', payload);
      });

      es.addEventListener('order-updated', (e: MessageEvent) => {
        this.setConnected(true);
        const payload = this.parseJsonSafe(e.data);
        this.broadcast('ORDER_UPDATED', payload);
      });

      es.addEventListener('order-cancelled', (e: MessageEvent) => {
        this.setConnected(true);
        const payload = this.parseJsonSafe(e.data);
        this.broadcast('ORDER_UPDATED', payload);
      });

      es.addEventListener('inventory-updated', (e: MessageEvent) => {
        this.setConnected(true);
        const payload = this.parseJsonSafe(e.data);
        this.broadcast('INVENTORY_CHANGED', payload);
      });

      es.addEventListener('product-created', (e: MessageEvent) => {
        this.setConnected(true);
        const payload = this.parseJsonSafe(e.data);
        this.broadcast('INVENTORY_CHANGED', payload);
      });

      es.addEventListener('notification-received', (e: MessageEvent) => {
        this.setConnected(true);
        const payload = this.parseJsonSafe(e.data);
        this.broadcast('NOTIFICATION_RECEIVED', payload);
      });

      es.onmessage = (e: MessageEvent) => {
        const data = this.parseJsonSafe(e.data);
        if (data && data.eventType) {
          this.broadcast(data.eventType, data.payload || data);
        }
      };

      es.onerror = () => {
        // SSE error, schedule reconnection
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }

        // Only mark disconnected if Firestore isn't connected
        if (this.firestoreUnsubscribers.length === 0) {
          this.setConnected(false);
        }

        this.scheduleSseReconnect();
      };
    } catch (err) {
      console.warn('RealtimeService: SSE connection failed to initialize', err);
      this.scheduleSseReconnect();
    }
  }

  private scheduleSseReconnect(): void {
    if (this.sseReconnectTimeout) {
      window.clearTimeout(this.sseReconnectTimeout);
    }
    this.reconnectAttempts = Math.min(this.reconnectAttempts + 1, 5);
    const delay = Math.min(2000 * Math.pow(1.5, this.reconnectAttempts), 30000);

    this.sseReconnectTimeout = window.setTimeout(() => {
      const token = safeStorage.getItem(TOKEN_STORAGE_KEY);
      if (token) {
        this.initSSE();
      }
    }, delay);
  }

  private parseJsonSafe(raw: string): any {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  private notifyLocalListeners(eventType: string, payload: any): void {
    const specificListeners = this.listeners.get(eventType);
    if (specificListeners) {
      specificListeners.forEach((callback) => {
        try {
          callback(payload);
        } catch (err) {
          console.error(`RealtimeService: listener error on ${eventType}`, err);
        }
      });
    }

    const allListeners = this.listeners.get('*');
    if (allListeners) {
      allListeners.forEach((callback) => {
        try {
          callback({ eventType, payload });
        } catch (err) {
          console.error('RealtimeService: wildcard listener error', err);
        }
      });
    }
  }

  public subscribe<T = any>(
    eventType: RealtimeEventType,
    callback: RealtimeCallback<T>
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    const set = this.listeners.get(eventType)!;
    set.add(callback);

    return () => {
      set.delete(callback);
      if (set.size === 0) {
        this.listeners.delete(eventType);
      }
    };
  }

  public broadcast<T = any>(eventType: RealtimeEventType, payload?: T): void {
    // 1. Notify local subscribers in this tab
    this.notifyLocalListeners(eventType, payload);

    // 2. Broadcast across tabs via BroadcastChannel
    if (this.channel) {
      try {
        const message: BroadcastMessage<T> = {
          eventType,
          payload: payload as T,
          timestamp: Date.now(),
        };
        this.channel.postMessage(message);
      } catch (err) {
        console.warn('RealtimeService: postMessage failed on BroadcastChannel', err);
      }
    }
  }

  public destroy(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.sseReconnectTimeout) {
      window.clearTimeout(this.sseReconnectTimeout);
      this.sseReconnectTimeout = null;
    }

    this.firestoreUnsubscribers.forEach((unsub) => {
      try {
        unsub();
      } catch {}
    });
    this.firestoreUnsubscribers = [];

    this.listeners.clear();
    this.connectionListeners.clear();
    this.isConnected = false;
    this.isInitialized = false;
  }
}

export const realtimeService = new RealtimeService();

export function useRealtimeConnection(): { isConnected: boolean } {
  const [isConnected, setIsConnected] = useState<boolean>(() =>
    realtimeService.getConnectionStatus()
  );

  useEffect(() => {
    return realtimeService.onConnectionChange((connected) => {
      setIsConnected(connected);
    });
  }, []);

  return { isConnected };
}
