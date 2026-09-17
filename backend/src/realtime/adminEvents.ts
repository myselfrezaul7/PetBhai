import type { Response } from 'express';
import { syncAdminFeedToFirestore, syncOrderToFirestore } from '../services/firestoreSync';

type AdminEventType =
  | 'connected'
  | 'order-created'
  | 'order-updated'
  | 'order-cancelled'
  | 'inventory-updated'
  | 'product-created';

const adminClients = new Set<Response>();

const writeAdminEvent = (
  res: Response,
  eventType: AdminEventType,
  payload: Record<string, unknown>
) => {
  res.write(`event: ${eventType}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
};

export const emitAdminEvent = (
  eventType: AdminEventType,
  payload: Record<string, unknown> = {}
) => {
  const envelope = {
    ...payload,
    eventType,
    timestamp: new Date().toISOString(),
  };

  for (const client of adminClients) {
    try {
      writeAdminEvent(client, eventType, envelope);
      writeAdminEvent(client, 'connected', { heartbeat: true, timestamp: envelope.timestamp });
    } catch {
      adminClients.delete(client);
      client.end();
    }
  }

  // After notifying in-memory adminClients, asynchronously call syncOrderToFirestore or write to system/admin_live_feed doc in Firestore
  if (payload.order) {
    syncOrderToFirestore(payload.order).catch((err) => {
      console.warn('Firestore order sync from adminEvents failed (non-fatal):', err);
    });
  } else {
    syncAdminFeedToFirestore(eventType, payload).catch((err) => {
      console.warn('Firestore admin feed sync failed (non-fatal):', err);
    });
  }
};

export const subscribeAdminClient = (res: Response): (() => void) => {
  adminClients.add(res);

  writeAdminEvent(res, 'connected', {
    message: 'Admin live stream connected',
    timestamp: new Date().toISOString(),
  });

  const heartbeat = setInterval(() => {
    if (!res.writableEnded) {
      res.write(': ping\n\n');
    }
  }, 25000);

  return () => {
    clearInterval(heartbeat);
    adminClients.delete(res);
    if (!res.writableEnded) {
      res.end();
    }
  };
};
