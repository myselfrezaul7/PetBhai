import { getFirebaseAdmin } from '../routes/authHelpers';

/**
 * Synchronizes an order to Cloud Firestore 'orders' collection
 * and triggers an update event in 'system/admin_live_feed'.
 * Gracefully handles cases where Firebase Admin is unconfigured.
 */
export const syncOrderToFirestore = async (order: any): Promise<void> => {
  if (!order || !order.orderId) return;

  try {
    const adminApp = await getFirebaseAdmin();
    if (!adminApp) return;

    const adminModule = await import('firebase-admin');
    const admin = (adminModule as any).default || adminModule;
    const firestore = admin.firestore(adminApp);

    const docId = String(order.orderId);
    await firestore.collection('orders').doc(docId).set(order, { merge: true });

    await firestore.collection('system').doc('admin_live_feed').set(
      {
        lastEvent: 'order-updated',
        orderId: order.orderId,
        status: order.status,
        timestamp: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Firestore syncOrder failed (non-fatal):', error);
  }
};

/**
 * Synchronizes product stock updates to Cloud Firestore 'inventory' collection
 * and triggers an update event in 'system/admin_live_feed'.
 */
export const syncInventoryToFirestore = async (
  productId: number,
  stockQuantity: number = 0,
  stockStatus: string = 'in-stock'
): Promise<void> => {
  try {
    const adminApp = await getFirebaseAdmin();
    if (!adminApp) return;

    const adminModule = await import('firebase-admin');
    const admin = (adminModule as any).default || adminModule;
    const firestore = admin.firestore(adminApp);

    await firestore.collection('inventory').doc(String(productId)).set(
      {
        productId,
        stockQuantity,
        stockStatus,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    await firestore.collection('system').doc('admin_live_feed').set(
      {
        lastEvent: 'inventory-updated',
        productId,
        stockQuantity,
        stockStatus,
        timestamp: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Firestore syncInventory failed (non-fatal):', error);
  }
};

/**
 * Synchronizes a user notification to Cloud Firestore under users/{userId}/notifications/{notifId}.
 */
export const syncNotificationToFirestore = async (
  userId: number | string,
  notification: any
): Promise<void> => {
  if (!userId || !notification) return;

  try {
    const adminApp = await getFirebaseAdmin();
    if (!adminApp) return;

    const adminModule = await import('firebase-admin');
    const admin = (adminModule as any).default || adminModule;
    const firestore = admin.firestore(adminApp);

    const notifId = notification.id
      ? String(notification.id)
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    await firestore
      .collection('users')
      .doc(String(userId))
      .collection('notifications')
      .doc(notifId)
      .set(
        {
          ...notification,
          id: notifId,
          timestamp: new Date().toISOString(),
        },
        { merge: true }
      );
  } catch (error) {
    console.warn('Firestore syncNotification failed (non-fatal):', error);
  }
};

/**
 * Synchronizes arbitrary admin events to 'system/admin_live_feed' in Firestore.
 */
export const syncAdminFeedToFirestore = async (
  eventType: string,
  payload: Record<string, unknown> = {}
): Promise<void> => {
  try {
    const adminApp = await getFirebaseAdmin();
    if (!adminApp) return;

    const adminModule = await import('firebase-admin');
    const admin = (adminModule as any).default || adminModule;
    const firestore = admin.firestore(adminApp);

    await firestore
      .collection('system')
      .doc('admin_live_feed')
      .set(
        {
          lastEvent: eventType,
          ...payload,
          timestamp: new Date().toISOString(),
        },
        { merge: true }
      );
  } catch (error) {
    console.warn('Firestore syncAdminFeed failed (non-fatal):', error);
  }
};
