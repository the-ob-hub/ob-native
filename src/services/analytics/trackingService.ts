/**
 * Analytics & Event Tracking Service
 * Tracks user interactions and events throughout the app
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type EventName = 
  | 'balance_swipe' // Rotador de balances
  | 'balance_action_click' // Click en acciones del balance
  | 'screen_view' // Cambio de pantalla
  | 'onboarding_step' // Paso del onboarding
  | 'button_click' // Click en botones
  | 'card_expand' // Expansión de card
  | 'card_collapse'; // Colapso de card

export interface TrackingEvent {
  eventName: EventName;
  properties?: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

class TrackingService {
  private sessionId: string;
  private eventsQueue: TrackingEvent[] = [];
  private readonly STORAGE_KEY = 'tracking_events';
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly FLUSH_INTERVAL = 30000; // 30 segundos
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startFlushTimer();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track an event
   */
  async track(eventName: EventName, properties?: Record<string, any>): Promise<void> {
    try {
      const userId = await AsyncStorage.getItem('currentUserId');
      
      const event: TrackingEvent = {
        eventName,
        properties: {
          ...properties,
          appVersion: '1.67.0', // Actualizar con cada build
        },
        timestamp: Date.now(),
        userId: userId || undefined,
        sessionId: this.sessionId,
      };

      this.eventsQueue.push(event);

      // Log para debugging (solo en desarrollo)
      if (__DEV__) {
        console.log('📊 Track:', eventName, properties);
      }

      // Si la cola está llena, hacer flush inmediato
      if (this.eventsQueue.length >= this.MAX_QUEUE_SIZE) {
        await this.flush();
      }
    } catch (error) {
      console.error('❌ Error tracking event:', error);
    }
  }

  /**
   * Track balance swipe (rotador)
   */
  async trackBalanceSwipe(
    fromCurrency: string,
    toCurrency: string,
    fromIndex: number,
    toIndex: number,
    swipeDirection: 'left' | 'right'
  ): Promise<void> {
    await this.track('balance_swipe', {
      fromCurrency,
      toCurrency,
      fromIndex,
      toIndex,
      swipeDirection,
      totalBalances: toIndex + 1, // Asumiendo que siempre hay al menos 1 balance
    });
  }

  /**
   * Track balance action click
   */
  async trackBalanceAction(
    actionId: string,
    currency: string,
    balanceAmount: number
  ): Promise<void> {
    await this.track('balance_action_click', {
      actionId,
      currency,
      balanceAmount,
    });
  }

  /**
   * Track screen view
   */
  async trackScreenView(screenName: string): Promise<void> {
    await this.track('screen_view', {
      screenName,
    });
  }

  /**
   * Flush events to storage/backend
   */
  private async flush(): Promise<void> {
    if (this.eventsQueue.length === 0) return;

    try {
      // Guardar eventos en AsyncStorage para envío posterior
      const existingEvents = await AsyncStorage.getItem(this.STORAGE_KEY);
      const allEvents = existingEvents 
        ? [...JSON.parse(existingEvents), ...this.eventsQueue]
        : this.eventsQueue;

      // Mantener solo los últimos 500 eventos
      const eventsToStore = allEvents.slice(-500);
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(eventsToStore));

      // TODO: Enviar eventos al backend
      // await this.sendToBackend(this.eventsQueue);

      // Limpiar cola
      this.eventsQueue = [];
    } catch (error) {
      console.error('❌ Error flushing events:', error);
    }
  }

  /**
   * Start automatic flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL);
  }

  /**
   * Stop flush timer
   */
  stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Get pending events (for debugging)
   */
  async getPendingEvents(): Promise<TrackingEvent[]> {
    try {
      const events = await AsyncStorage.getItem(this.STORAGE_KEY);
      return events ? JSON.parse(events) : [];
    } catch (error) {
      console.error('❌ Error getting pending events:', error);
      return [];
    }
  }

  /**
   * Clear all tracked events
   */
  async clearEvents(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      this.eventsQueue = [];
    } catch (error) {
      console.error('❌ Error clearing events:', error);
    }
  }
}

// Singleton instance
export const trackingService = new TrackingService();

