import React from 'react';
import type { AdminOrder, OrderStatus } from '../../types/admin';

interface OrdersTabProps {
  recentOrders: AdminOrder[];
  loading: boolean;
  selectedStatuses: Record<string, OrderStatus>;
  setSelectedStatuses: React.Dispatch<React.SetStateAction<Record<string, OrderStatus>>>;
  orderNotes: Record<string, string>;
  setOrderNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  trackingNumbers: Record<string, string>;
  setTrackingNumbers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  savingOrderId: string;
  handleOrderStatusSave: (orderId: string) => Promise<void>;
  orderStatusOptions: OrderStatus[];
  getOrderStatusTone: (status: OrderStatus | undefined) => string;
  toNumeric: (value: unknown, fallback?: number) => number;
  sanitizeInput: (input: string, limit?: number, options?: any) => string;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({
  recentOrders,
  loading,
  selectedStatuses,
  setSelectedStatuses,
  orderNotes,
  setOrderNotes,
  trackingNumbers,
  setTrackingNumbers,
  savingOrderId,
  handleOrderStatusSave,
  orderStatusOptions,
  getOrderStatusTone,
  toNumeric,
  sanitizeInput,
}) => {
  return (
    <section className="mt-1 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
          Recent Orders Command Center
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-slate-800 text-slate-100">
            <tr>
              <th className="px-4 py-3 font-semibold">Order ID</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Update</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
            {!loading &&
              recentOrders.map((order) => (
                <tr key={order.orderId} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                    {order.orderId}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                    {order?.shippingAddress?.name || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                    ৳{toNumeric(order.total, 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {order.date ? new Date(order.date).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getOrderStatusTone(
                        order.status
                      )}`}
                    >
                      {order.status || 'pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedStatuses[order.orderId] || order.status || 'pending'}
                        onChange={(event) =>
                          setSelectedStatuses((prev) => ({
                            ...prev,
                            [order.orderId]: event.target.value as OrderStatus,
                          }))
                        }
                        aria-label={`Update order status for ${order.orderId}`}
                        className="rounded-lg border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-900"
                      >
                        {orderStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Tracking"
                        aria-label={`Tracking number for ${order.orderId}`}
                        value={trackingNumbers[order.orderId] || ''}
                        onChange={(event) =>
                          setTrackingNumbers((prev) => ({
                            ...prev,
                            [order.orderId]: sanitizeInput(event.target.value, 120, {
                              allowNewlines: false,
                            }),
                          }))
                        }
                        className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-900"
                      />
                      <input
                        type="text"
                        placeholder="Note"
                        aria-label={`Admin note for ${order.orderId}`}
                        value={orderNotes[order.orderId] || ''}
                        onChange={(event) =>
                          setOrderNotes((prev) => ({
                            ...prev,
                            [order.orderId]: sanitizeInput(event.target.value, 500),
                          }))
                        }
                        className="w-40 rounded-lg border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => void handleOrderStatusSave(order.orderId)}
                        disabled={savingOrderId === order.orderId}
                        className="rounded-lg bg-orange-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingOrderId === order.orderId ? 'Updating...' : 'Apply'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && recentOrders.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-300"
                >
                  No orders found.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-300"
                >
                  Loading latest orders...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
