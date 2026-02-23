import type { Response } from 'express';

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
