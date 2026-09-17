import React, { useState, useMemo } from 'react';
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
  handleOrderStatusSave: (
    orderId: string,
    overrideStatus?: OrderStatus,
    overrideNote?: string,
    overrideTracking?: string
  ) => Promise<void>;
  orderStatusOptions: OrderStatus[];
  getOrderStatusTone: (status: OrderStatus | undefined) => string;
  toNumeric: (value: unknown, fallback?: number) => number;
  sanitizeInput: (input: string, limit?: number, options?: any) => string;
  selectedOrderModal?: AdminOrder | null;
  setSelectedOrderModal?: (order: AdminOrder | null) => void;
}

type OrderSortOption = 'newest' | 'highest_total' | 'oldest' | 'lowest_total';
type FilterStatus =
  | 'all'
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

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
  selectedOrderModal: controlledSelectedOrder,
  setSelectedOrderModal: setControlledSelectedOrder,
}) => {
  // Local modal state fallback if not controlled
  const [internalSelectedOrder, setInternalSelectedOrder] = useState<AdminOrder | null>(null);
  const activeOrder =
    controlledSelectedOrder !== undefined ? controlledSelectedOrder : internalSelectedOrder;
  const setActiveOrder = (order: AdminOrder | null) => {
    if (setControlledSelectedOrder) {
      setControlledSelectedOrder(order);
    } else {
      setInternalSelectedOrder(order);
    }
  };

  // Search & Filter Bar state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [sortOption, setSortOption] = useState<OrderSortOption>('newest');
  const [phoneCopied, setPhoneCopied] = useState(false);

  // Status tabs config
  const statusTabs: Array<{ id: FilterStatus; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'processing', label: 'Processing' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  // Counts per status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: recentOrders.length };
    recentOrders.forEach((o) => {
      const st = (o.status || 'pending').toLowerCase();
      counts[st] = (counts[st] || 0) + 1;
    });
    return counts;
  }, [recentOrders]);

  // Filtered & Sorted orders
  const filteredOrders = useMemo(() => {
    let result = [...recentOrders];

    // Status filtering
    if (statusFilter !== 'all') {
      result = result.filter(
        (o) => (o.status || 'pending').toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Search filtering: Order ID, Customer Name, Phone, or Tracking Number
    const query = searchTerm.trim().toLowerCase();
    if (query) {
      result = result.filter((order) => {
        const idMatch = String(order.orderId || '')
          .toLowerCase()
          .includes(query);
        const nameMatch = String(
          order.shippingAddress?.name || order.shippingAddress?.fullName || order.customerName || ''
        )
          .toLowerCase()
          .includes(query);
        const phoneMatch = String(order.shippingAddress?.phone || order.customerPhone || '')
          .toLowerCase()
          .includes(query);
        const trackingMatch = String(order.trackingNumber || '')
          .toLowerCase()
          .includes(query);
        return idMatch || nameMatch || phoneMatch || trackingMatch;
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortOption === 'newest') {
        return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
      }
      if (sortOption === 'oldest') {
        return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
      }
      if (sortOption === 'highest_total') {
        return toNumeric(b.total) - toNumeric(a.total);
      }
      if (sortOption === 'lowest_total') {
        return toNumeric(a.total) - toNumeric(b.total);
      }
      return 0;
    });

    return result;
  }, [recentOrders, statusFilter, searchTerm, sortOption, toNumeric]);

  const handleCopyPhone = (phone: string) => {
    if (!phone) return;
    navigator.clipboard?.writeText(phone);
    setPhoneCopied(true);
    setTimeout(() => setPhoneCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <section className="mt-1 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
      {/* Header & Title */}
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-900/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              Orders Management & Fulfillment
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time order intake, tracking fulfillment, dispatch slips, and customer
              verification.
            </p>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Showing{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {filteredOrders.length}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {recentOrders.length}
            </span>{' '}
            orders
          </div>
        </div>

        {/* Status Tabs Bar */}
        <div className="mt-4 flex flex-wrap gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-3">
          {statusTabs.map((tab) => {
            const count = statusCounts[tab.id] || 0;
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort Options Bar */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by Order ID, Customer Name, Phone, or Tracking #..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(sanitizeInput(e.target.value, 120, { allowNewlines: false }))
              }
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="order-sort-select"
              className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap"
            >
              Sort by:
            </label>
            <select
              id="order-sort-select"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as OrderSortOption)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest_total">Highest Total (৳)</option>
              <option value="lowest_total">Lowest Total (৳)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-800 text-slate-100 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-semibold">Order ID</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Quick Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
            {!loading &&
              filteredOrders.map((order) => {
                const customerName =
                  order.shippingAddress?.name ||
                  order.shippingAddress?.fullName ||
                  order.customerName ||
                  'Guest Customer';
                const customerPhone = order.shippingAddress?.phone || order.customerPhone || 'N/A';

                return (
                  <tr
                    key={order.orderId}
                    className="hover:bg-orange-50/40 dark:hover:bg-slate-700/40 cursor-pointer transition"
                    onClick={() => setActiveOrder(order)}
                  >
                    <td className="px-4 py-3 font-semibold text-orange-600 dark:text-orange-400">
                      <div className="flex items-center gap-1.5">
                        <span>{order.orderId}</span>
                        {order.trackingNumber && (
                          <span
                            title={`Tracking: ${order.trackingNumber}`}
                            className="inline-block rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-600 dark:text-slate-300 font-mono"
                          >
                            📦 {order.trackingNumber}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200">
                      <div className="font-medium">{customerName}</div>
                      {order.shippingAddress?.city && (
                        <div className="text-[11px] text-slate-400">
                          {order.shippingAddress.city}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs font-mono">
                      {customerPhone}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                      ৳{toNumeric(order.total, 0).toLocaleString()}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">
                      {order.date ? new Date(order.date).toLocaleDateString() : 'N/A'}
                      <span className="block text-[10px] text-slate-400">
                        {order.date
                          ? new Date(order.date).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${getOrderStatusTone(
                          order.status
                        )}`}
                      >
                        {order.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveOrder(order)}
                          className="rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 transition"
                        >
                          👁️ View
                        </button>
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
                        <button
                          type="button"
                          onClick={() => void handleOrderStatusSave(order.orderId)}
                          disabled={savingOrderId === order.orderId}
                          className="rounded-lg bg-orange-500 hover:bg-orange-600 px-2.5 py-1 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingOrderId === order.orderId ? '...' : 'Save'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

            {!loading && filteredOrders.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-300"
                >
                  <div className="text-2xl mb-1">🔍</div>
                  No orders match the selected filters.
                </td>
              </tr>
            )}

            {loading && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-300"
                >
                  <div className="animate-spin text-xl mb-1">⏳</div>
                  Loading latest orders...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ORDER DETAILS MODAL / DRAWER */}
      {activeOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fadeIn"
          onClick={() => setActiveOrder(null)}
        >
          <div
            className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📋</span>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Order {activeOrder.orderId}</span>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${getOrderStatusTone(
                        activeOrder.status
                      )}`}
                    >
                      {activeOrder.status || 'pending'}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Placed on{' '}
                    {activeOrder.date ? new Date(activeOrder.date).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  title="Print Packing Slip / Invoice"
                >
                  🖨️ <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveOrder(null)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Customer & Shipping Details Card */}
              <div className="grid gap-4 sm:grid-cols-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-2">
                    Customer Information
                  </h5>
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                    {activeOrder.shippingAddress?.name ||
                      activeOrder.shippingAddress?.fullName ||
                      activeOrder.customerName ||
                      'Guest Customer'}
                  </p>
                  {activeOrder.shippingAddress?.email && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      ✉️ {activeOrder.shippingAddress.email}
                    </p>
                  )}

                  {/* Phone + Actions */}
                  {activeOrder.shippingAddress?.phone ? (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                        📞 {activeOrder.shippingAddress.phone}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyPhone(activeOrder.shippingAddress?.phone || '')}
                        className="rounded bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition"
                      >
                        {phoneCopied ? '✓ Copied' : 'Copy'}
                      </button>
                      <a
                        href={`tel:${activeOrder.shippingAddress.phone}`}
                        className="rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-0.5 text-[11px] font-medium hover:bg-blue-100 transition"
                      >
                        Call
                      </a>
                      <a
                        href={`https://wa.me/${activeOrder.shippingAddress.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 px-2 py-0.5 text-[11px] font-medium hover:bg-emerald-100 transition"
                      >
                        WhatsApp
                      </a>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 mt-1">No phone number provided</p>
                  )}
                </div>

                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-2">
                    Shipping Destination
                  </h5>
                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {activeOrder.shippingAddress?.address || 'No street address provided'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {[
                      activeOrder.shippingAddress?.city,
                      activeOrder.shippingAddress?.district,
                      activeOrder.shippingAddress?.postalCode,
                    ]
                      .filter(Boolean)
                      .join(', ') || 'Dhaka, Bangladesh'}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    Payment Method:{' '}
                    <span className="font-semibold text-slate-600 dark:text-slate-200">
                      {activeOrder.paymentMethod || 'Cash on Delivery'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Order Items Table */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-3">
                  Ordered Items ({activeOrder.items?.length || 0})
                </h5>
                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                      <tr>
                        <th className="px-3 py-2.5">Item</th>
                        <th className="px-3 py-2.5">Unit Price</th>
                        <th className="px-3 py-2.5 text-center">Qty</th>
                        <th className="px-3 py-2.5 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {activeOrder.items && activeOrder.items.length > 0 ? (
                        activeOrder.items.map((item, idx) => {
                          const lineTotal = toNumeric(item.price) * toNumeric(item.quantity, 1);
                          return (
                            <tr
                              key={`${item.id}-${idx}`}
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                            >
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-2.5">
                                  {item.imageUrl ? (
                                    <img
                                      src={item.imageUrl}
                                      alt={item.name}
                                      className="h-10 w-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                          'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=100&auto=format&fit=crop';
                                      }}
                                    />
                                  ) : (
                                    <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-base">
                                      🐾
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                                      {item.name}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                      {item.category || 'Pet Product'}{' '}
                                      {item.weight ? `• ${item.weight}` : ''}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300">
                                ৳{toNumeric(item.price).toLocaleString()}
                              </td>
                              <td className="px-3 py-2.5 text-center font-semibold text-slate-800 dark:text-slate-200">
                                {item.quantity}
                              </td>
                              <td className="px-3 py-2.5 text-right font-bold text-slate-900 dark:text-slate-100">
                                ৳{lineTotal.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                            No item details found for this order.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-semibold text-slate-800 dark:text-slate-200">
                      <tr>
                        <td
                          colSpan={3}
                          className="px-3 py-2 text-right text-slate-500 dark:text-slate-400"
                        >
                          Grand Total:
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-bold text-orange-600 dark:text-orange-400">
                          ৳{toNumeric(activeOrder.total).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Status Update & Tracking Controls */}
              <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4 dark:border-orange-900/40 dark:bg-orange-950/20">
                <h5 className="text-xs font-bold uppercase tracking-wider text-orange-800 dark:text-orange-300 mb-3">
                  Fulfillment Status & Logistics Dispatch
                </h5>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Order Status
                    </label>
                    <select
                      value={
                        selectedStatuses[activeOrder.orderId] || activeOrder.status || 'pending'
                      }
                      onChange={(e) =>
                        setSelectedStatuses((prev) => ({
                          ...prev,
                          [activeOrder.orderId]: e.target.value as OrderStatus,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                    >
                      {orderStatusOptions.map((st) => (
                        <option key={st} value={st}>
                          {st.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Tracking Number / Courier
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. STEADFAST-12345"
                      value={
                        trackingNumbers[activeOrder.orderId] ?? activeOrder.trackingNumber ?? ''
                      }
                      onChange={(e) =>
                        setTrackingNumbers((prev) => ({
                          ...prev,
                          [activeOrder.orderId]: sanitizeInput(e.target.value, 120, {
                            allowNewlines: false,
                          }),
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Internal Admin Note
                    </label>
                    <input
                      type="text"
                      placeholder="Notes for customer / warehouse"
                      value={orderNotes[activeOrder.orderId] || ''}
                      onChange={(e) =>
                        setOrderNotes((prev) => ({
                          ...prev,
                          [activeOrder.orderId]: sanitizeInput(e.target.value, 500),
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={async () => {
                      await handleOrderStatusSave(activeOrder.orderId);
                      // Update modal activeOrder status locally
                      setActiveOrder({
                        ...activeOrder,
                        status: selectedStatuses[activeOrder.orderId] || activeOrder.status,
                        trackingNumber:
                          trackingNumbers[activeOrder.orderId] ?? activeOrder.trackingNumber,
                      });
                    }}
                    disabled={savingOrderId === activeOrder.orderId}
                    className="rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2 text-xs font-semibold text-white shadow transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingOrderId === activeOrder.orderId
                      ? 'Updating Status...'
                      : '💾 Update Status & Tracking'}
                  </button>
                </div>
              </div>

              {/* Status History Timeline (if available) */}
              {activeOrder.statusHistory && activeOrder.statusHistory.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-2">
                    Status History Timeline
                  </h5>
                  <div className="space-y-2 border-l-2 border-slate-200 dark:border-slate-700 pl-4 ml-1">
                    {activeOrder.statusHistory.map((hist, index) => (
                      <div key={index} className="text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                          {hist.status}
                        </span>
                        <span className="text-slate-400 ml-2">
                          {new Date(hist.timestamp).toLocaleString()}
                        </span>
                        {hist.note && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            "{hist.note}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-3 bg-slate-50 dark:bg-slate-800/60 flex justify-between items-center">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-orange-500 transition"
              >
                🖨️ Format Printable Invoice / Packing Slip
              </button>
              <button
                type="button"
                onClick={() => setActiveOrder(null)}
                className="rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 transition"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY INVOICE / PACKING SLIP VIEW */}
      {activeOrder && (
        <div className="hidden print:block fixed inset-0 bg-white text-black p-8 z-[9999]">
          <div className="max-w-3xl mx-auto font-sans">
            <div className="flex justify-between items-start border-b-2 border-black pb-4">
              <div>
                <h1 className="text-2xl font-black tracking-tight">PETBHAI OPERATIONS</h1>
                <p className="text-xs text-gray-600">
                  Bangladesh's Trusted Pet Care & Nutrition Hub
                </p>
                <p className="text-xs text-gray-600">
                  Web: https://petbhai.com | Support: support@petbhai.com
                </p>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-bold">PACKING SLIP / INVOICE</h2>
                <p className="text-sm font-semibold">Order: #{activeOrder.orderId}</p>
                <p className="text-xs text-gray-600">
                  Date: {activeOrder.date ? new Date(activeOrder.date).toLocaleDateString() : 'N/A'}
                </p>
                {activeOrder.trackingNumber && (
                  <p className="text-xs font-mono font-bold mt-1">
                    TRACKING: {activeOrder.trackingNumber}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 py-4 border-b border-gray-300 text-xs">
              <div>
                <h3 className="font-bold uppercase tracking-wider text-gray-600 mb-1">SHIP TO:</h3>
                <p className="font-bold text-sm">
                  {activeOrder.shippingAddress?.name || activeOrder.customerName || 'Customer'}
                </p>
                <p>{activeOrder.shippingAddress?.address || 'Standard Address'}</p>
                <p>
                  {[activeOrder.shippingAddress?.city, activeOrder.shippingAddress?.district]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                <p className="font-mono mt-1 font-semibold">
                  Phone: {activeOrder.shippingAddress?.phone || 'N/A'}
                </p>
              </div>
              <div className="text-right">
                <h3 className="font-bold uppercase tracking-wider text-gray-600 mb-1">
                  ORDER METADATA:
                </h3>
                <p>
                  Status:{' '}
                  <span className="font-bold uppercase">{activeOrder.status || 'Pending'}</span>
                </p>
                <p>
                  Payment:{' '}
                  <span className="font-bold">
                    {activeOrder.paymentMethod || 'Cash on Delivery'}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="py-2">Item Description</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Unit Price</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {activeOrder.items?.map((item, i) => (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="py-2 font-medium">
                        {item.name} {item.weight ? `(${item.weight})` : ''}
                      </td>
                      <td className="py-2 text-center font-bold">{item.quantity}</td>
                      <td className="py-2 text-right">৳{toNumeric(item.price).toLocaleString()}</td>
                      <td className="py-2 text-right font-bold">
                        ৳{(toNumeric(item.price) * toNumeric(item.quantity, 1)).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-black font-bold text-sm">
                    <td colSpan={3} className="py-3 text-right">
                      Grand Total:
                    </td>
                    <td className="py-3 text-right">
                      ৳{toNumeric(activeOrder.total).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-8 border-t border-dashed border-gray-400 pt-4 text-center text-[11px] text-gray-500">
              <p>
                Thank you for choosing PetBhai! For customer queries or returns, contact
                support@petbhai.com.
              </p>
              <p className="mt-1">Generated by PetBhai Operations System.</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
