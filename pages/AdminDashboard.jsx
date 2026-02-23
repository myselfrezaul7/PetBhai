import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest, getErrorMessage } from '../services/apiClient';
import { useAuth } from '../contexts/AuthContext';

const TOKEN_STORAGE_KEY = 'petbhai_token';

const categoryOptions = [
  'Cat Food',
  'Dog Food',
  'Cat Supplies',
  'Dog Supplies',
  'Grooming',
  'Accessories',
];

const orderStatusOptions = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

const getStatusMeta = (stockStatus, stockQuantity, reorderPoint) => {
  if (stockStatus === 'out-of-stock' || stockQuantity <= 0) {
    return { label: 'Critical Low', badgeClass: 'bg-rose-100 text-rose-700' };
  }

  if (stockStatus === 'low-stock' || stockQuantity <= reorderPoint) {
    if (stockQuantity <= Math.max(2, Math.floor(reorderPoint * 0.4))) {
      return { label: 'Critical Low', badgeClass: 'bg-rose-100 text-rose-700' };
    }
    return { label: 'Reorder Now', badgeClass: 'bg-amber-100 text-amber-700' };
  }

  return { label: 'Healthy', badgeClass: 'bg-emerald-100 text-emerald-700' };
};

const getAuthHeaders = () => {
  const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token) {
    throw new Error('Please log in with your admin account to manage inventory.');
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

const getOrderStatusTone = (status) => {
  if (status === 'delivered') return 'bg-emerald-100 text-emerald-700';
  if (status === 'cancelled' || status === 'refunded') return 'bg-rose-100 text-rose-700';
  if (status === 'shipped') return 'bg-blue-100 text-blue-700';
  if (status === 'processing' || status === 'confirmed') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
};

const toNumeric = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [inventoryRows, setInventoryRows] = useState([]);
  const [orderStats, setOrderStats] = useState({ total: 0, totalRevenue: 0, todayOrders: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [savingOrderId, setSavingOrderId] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState({});
  const [addingProduct, setAddingProduct] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortMode, setSortMode] = useState('risk-desc');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastSyncAt, setLastSyncAt] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Dog Food',
    price: '',
    imageUrl: '',
    description: '',
    weight: '',
    brandId: '',
    stockQuantity: '',
    reorderPoint: '',
  });

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const headers = getAuthHeaders();
      const [inventory, stats, ordersPayload] = await Promise.all([
        apiRequest('/products/admin/inventory', { headers }),
        apiRequest('/orders/stats/summary', { headers }),
        apiRequest('/orders?limit=20&page=1', { headers }),
      ]);

      setInventoryRows(
        inventory.map((product) => ({
          id: product.id,
          sku: `PB-${String(product.id).padStart(4, '0')}`,
          productName: product.name,
          category: product.category,
          stockLevel: Number(product.stockQuantity ?? 0),
          reorderPoint: Number(product.reorderPoint ?? 20),
          stockStatus: product.stockStatus,
        }))
      );
      setOrderStats(stats || { total: 0, totalRevenue: 0, todayOrders: 0 });
      const orders = Array.isArray(ordersPayload?.orders) ? ordersPayload.orders : [];
      setRecentOrders(orders);
      setSelectedStatuses(
        orders.reduce((acc, order) => {
          acc[order.orderId] = order.status || 'pending';
          return acc;
        }, {})
      );
      setLastSyncAt(new Date().toISOString());
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Failed to load admin dashboard data.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    if (!autoRefresh) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void loadDashboardData();
    }, 60000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [autoRefresh, loadDashboardData]);

  const handleInventoryFieldChange = (id, field, value) => {
    setInventoryRows((prevRows) =>
      prevRows.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]: Number(value),
            }
          : row
      )
    );
  };

  const handleSaveInventory = async (row) => {
    setSavingId(row.id);
    setError('');

    try {
      const headers = {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      };

      const updated = await apiRequest(`/products/${row.id}/inventory`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          stockQuantity: Number(row.stockLevel),
          reorderPoint: Number(row.reorderPoint),
        }),
      });

      setInventoryRows((prevRows) =>
        prevRows.map((current) =>
          current.id === row.id
            ? {
                ...current,
                stockLevel: Number(updated.stockQuantity ?? current.stockLevel),
                reorderPoint: Number(updated.reorderPoint ?? current.reorderPoint),
                stockStatus: updated.stockStatus,
              }
            : current
        )
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Failed to save inventory updates.'));
    } finally {
      setSavingId(null);
    }
  };

  const handleOrderStatusSave = async (orderId) => {
    setSavingOrderId(orderId);
    setError('');

    try {
      const status = selectedStatuses[orderId];
      const headers = {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      };

      const response = await apiRequest(`/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status,
          note: `Updated from admin dashboard (${currentUser?.email || 'admin'})`,
        }),
      });

      setRecentOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.orderId === orderId
            ? {
                ...order,
                status: response?.order?.status || status,
              }
            : order
        )
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Failed to update order status.'));
    } finally {
      setSavingOrderId('');
    }
  };

  const handleCreateProduct = async (event) => {
    event.preventDefault();
    setAddingProduct(true);
    setError('');

    try {
      const payload = {
        name: newProduct.name.trim(),
        category: newProduct.category,
        price: Number(newProduct.price),
        imageUrl: newProduct.imageUrl.trim(),
        description: newProduct.description.trim(),
        weight: newProduct.weight.trim(),
        brandId: Number(newProduct.brandId),
        stockQuantity: Number(newProduct.stockQuantity),
        reorderPoint: Number(newProduct.reorderPoint),
      };

      if (!/^https?:\/\//i.test(payload.imageUrl)) {
        throw new Error('Image URL must start with http:// or https://');
      }
      if (!Number.isFinite(payload.price) || payload.price <= 0) {
        throw new Error('Price must be greater than 0.');
      }
      if (!Number.isFinite(payload.brandId) || payload.brandId <= 0) {
        throw new Error('Brand ID must be a valid positive number.');
      }
      if (!Number.isFinite(payload.stockQuantity) || payload.stockQuantity < 0) {
        throw new Error('Stock quantity must be 0 or greater.');
      }
      if (!Number.isFinite(payload.reorderPoint) || payload.reorderPoint < 0) {
        throw new Error('Reorder point must be 0 or greater.');
      }

      const headers = {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      };

      await apiRequest('/products/admin', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      setNewProduct({
        name: '',
        category: 'Dog Food',
        price: '',
        imageUrl: '',
        description: '',
        weight: '',
        brandId: '',
        stockQuantity: '',
        reorderPoint: '',
      });

      await loadDashboardData();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Failed to create product.'));
    } finally {
      setAddingProduct(false);
    }
  };

  const metrics = useMemo(() => {
    const totalProducts = inventoryRows.length;
    const inStockCount = inventoryRows.filter((row) => row.stockStatus === 'in-stock').length;
    const lowStockCount = inventoryRows.filter((row) => row.stockStatus !== 'in-stock').length;
    const inStockPercent =
      totalProducts > 0 ? ((inStockCount / totalProducts) * 100).toFixed(1) : '0.0';

    return [
      {
        label: 'Total Orders',
        value: String(orderStats.total ?? 0),
        tone: 'bg-blue-600 text-white',
      },
      {
        label: 'Revenue',
        value: `৳${toNumeric(orderStats.totalRevenue, 0).toLocaleString()}`,
        tone: 'bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900',
      },
      { label: 'In Stock', value: `${inStockPercent}%`, tone: 'bg-emerald-600 text-white' },
      {
        label: 'Critical Stock',
        value: `${lowStockCount} Items`,
        tone: 'bg-rose-600 text-white',
      },
      {
        label: 'Today Orders',
        value: String(orderStats.todayOrders ?? 0),
        tone: 'bg-amber-600 text-white',
      },
    ];
  }, [inventoryRows, orderStats.total, orderStats.todayOrders, orderStats.totalRevenue]);

  const inventoryInsights = useMemo(() => {
    return inventoryRows
      .map((row) => {
        const safetyGap = toNumeric(row.stockLevel) - toNumeric(row.reorderPoint);
        const normalizedGap = Math.max(-50, Math.min(50, safetyGap));
        const riskScore = 100 - (normalizedGap + 50);

        return {
          ...row,
          riskScore,
        };
      })
      .sort((a, b) => b.riskScore - a.riskScore);
  }, [inventoryRows]);

  const filteredInventoryRows = useMemo(() => {
    let rows = [...inventoryInsights];

    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (normalizedSearch) {
      rows = rows.filter(
        (row) =>
          row.productName.toLowerCase().includes(normalizedSearch) ||
          row.category.toLowerCase().includes(normalizedSearch) ||
          row.sku.toLowerCase().includes(normalizedSearch)
      );
    }

    if (stockFilter === 'critical') {
      rows = rows.filter((row) => row.stockStatus !== 'in-stock');
    } else if (stockFilter === 'healthy') {
      rows = rows.filter((row) => row.stockStatus === 'in-stock');
    }

    if (sortMode === 'name') {
      rows.sort((a, b) => a.productName.localeCompare(b.productName));
    } else if (sortMode === 'stock-asc') {
      rows.sort((a, b) => a.stockLevel - b.stockLevel);
    } else {
      rows.sort((a, b) => b.riskScore - a.riskScore);
    }

    return rows;
  }, [inventoryInsights, searchTerm, stockFilter, sortMode]);

  const topRiskItems = useMemo(() => filteredInventoryRows.slice(0, 5), [filteredInventoryRows]);

  const secureLogout = () => {
    logout();
    window.location.hash = '#/login';
  };

  const renderOverview = () => (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <div key={metric.label} className={`rounded-2xl p-5 shadow-sm ${metric.tone}`}>
            <p className="text-sm opacity-90">{metric.label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700 xl:col-span-2">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Inventory Risk Radar
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Highest risk products based on stock level versus reorder point.
          </p>
          <div className="mt-4 space-y-3">
            {topRiskItems.length === 0 && (
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                No inventory data available.
              </div>
            )}
            {topRiskItems.map((item) => {
              const statusMeta = getStatusMeta(
                item.stockStatus,
                item.stockLevel,
                item.reorderPoint
              );
              const progress = Math.max(5, Math.min(100, 100 - item.riskScore));
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      {item.productName}
                    </p>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.badgeClass}`}
                    >
                      {statusMeta.label}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-2 rounded-full bg-orange-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Stock: {item.stockLevel} • Reorder: {item.reorderPoint} • SKU: {item.sku}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Security Center
          </h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Admin Session
              </p>
              <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">
                {currentUser?.email || 'Unknown'}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Last Sync
              </p>
              <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">
                {lastSyncAt ? new Date(lastSyncAt).toLocaleString() : 'N/A'}
              </p>
            </div>
            <button
              type="button"
              onClick={secureLogout}
              className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900"
            >
              Secure Sign Out
            </button>
          </div>
        </section>
      </div>
    </>
  );

  const renderInventory = () => (
    <section className="mt-1 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Real-Time Inventory Tracking
          </h3>
          <button
            type="button"
            onClick={() => void loadDashboardData()}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900"
          >
            Refresh Now
          </button>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search SKU, name, category"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
          <select
            value={stockFilter}
            onChange={(event) => setStockFilter(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          >
            <option value="all">All Stock States</option>
            <option value="critical">Critical / Reorder</option>
            <option value="healthy">Healthy Only</option>
          </select>
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          >
            <option value="risk-desc">Sort by Risk</option>
            <option value="stock-asc">Sort by Stock (Low to High)</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-slate-800 text-slate-100">
            <tr>
              <th className="px-4 py-3 font-semibold">SKU ID</th>
              <th className="px-4 py-3 font-semibold">Product Name</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Stock Level</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Reorder Point</th>
              <th className="px-4 py-3 font-semibold">Risk</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
            {!loading &&
              filteredInventoryRows.map((row) => {
                const statusMeta = getStatusMeta(row.stockStatus, row.stockLevel, row.reorderPoint);
                return (
                  <tr key={row.sku} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                      {row.sku}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {row.productName}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.category}</td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-100">
                      <input
                        type="number"
                        min="0"
                        value={row.stockLevel}
                        onChange={(event) =>
                          handleInventoryFieldChange(row.id, 'stockLevel', event.target.value)
                        }
                        className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.badgeClass}`}
                      >
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-100">
                      <input
                        type="number"
                        min="0"
                        value={row.reorderPoint}
                        onChange={(event) =>
                          handleInventoryFieldChange(row.id, 'reorderPoint', event.target.value)
                        }
                        className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900"
                      />
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {Math.round(row.riskScore)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleSaveInventory(row)}
                        disabled={savingId === row.id}
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-200 dark:text-slate-900"
                      >
                        {savingId === row.id ? 'Saving...' : 'Save'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            {!loading && filteredInventoryRows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                >
                  No inventory products match your filters.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                >
                  Loading live inventory...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderOrders = () => (
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
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getOrderStatusTone(order.status)}`}
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
                            [order.orderId]: event.target.value,
                          }))
                        }
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
                  className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                >
                  No orders found.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
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

  const renderCreateProduct = () => (
    <section className="mt-1 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
        Add New Inventory Product
      </h3>
      <form className="mt-4 grid gap-3 md:grid-cols-4" onSubmit={handleCreateProduct}>
        <input
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          placeholder="Product Name"
          value={newProduct.name}
          onChange={(event) => setNewProduct((prev) => ({ ...prev, name: event.target.value }))}
          required
        />
        <select
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          value={newProduct.category}
          onChange={(event) =>
            setNewProduct((prev) => ({
              ...prev,
              category: event.target.value,
            }))
          }
          required
        >
          {categoryOptions.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          placeholder="Price"
          value={newProduct.price}
          onChange={(event) => setNewProduct((prev) => ({ ...prev, price: event.target.value }))}
          required
        />
        <input
          type="number"
          min="1"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          placeholder="Brand ID"
          value={newProduct.brandId}
          onChange={(event) => setNewProduct((prev) => ({ ...prev, brandId: event.target.value }))}
          required
        />
        <input
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 md:col-span-2"
          placeholder="Image URL"
          value={newProduct.imageUrl}
          onChange={(event) => setNewProduct((prev) => ({ ...prev, imageUrl: event.target.value }))}
          required
        />
        <input
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          placeholder="Weight (e.g. 10kg)"
          value={newProduct.weight}
          onChange={(event) => setNewProduct((prev) => ({ ...prev, weight: event.target.value }))}
          required
        />
        <input
          type="number"
          min="0"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          placeholder="Stock Qty"
          value={newProduct.stockQuantity}
          onChange={(event) =>
            setNewProduct((prev) => ({
              ...prev,
              stockQuantity: event.target.value,
            }))
          }
          required
        />
        <input
          type="number"
          min="0"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          placeholder="Reorder Point"
          value={newProduct.reorderPoint}
          onChange={(event) =>
            setNewProduct((prev) => ({
              ...prev,
              reorderPoint: event.target.value,
            }))
          }
          required
        />
        <input
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 md:col-span-3"
          placeholder="Short Description"
          value={newProduct.description}
          onChange={(event) =>
            setNewProduct((prev) => ({
              ...prev,
              description: event.target.value,
            }))
          }
          required
        />
        <button
          type="submit"
          disabled={addingProduct}
          className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {addingProduct ? 'Adding...' : 'Add Product'}
        </button>
      </form>
    </section>
  );

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-900 px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl gap-6">
        <aside className="hidden w-64 shrink-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:block">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">PetBhai Admin</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Operations Control Panel
          </p>
          <nav className="mt-6 space-y-2 text-sm">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`w-full rounded-xl px-3 py-2 text-left ${
                activeTab === 'overview'
                  ? 'bg-orange-100 font-semibold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              📊 Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`w-full rounded-xl px-3 py-2 text-left ${
                activeTab === 'inventory'
                  ? 'bg-orange-100 font-semibold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              📦 Inventory
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`w-full rounded-xl px-3 py-2 text-left ${
                activeTab === 'orders'
                  ? 'bg-orange-100 font-semibold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              🚚 Orders
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`w-full rounded-xl px-3 py-2 text-left ${
                activeTab === 'create'
                  ? 'bg-orange-100 font-semibold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              ➕ Add Product
            </button>
          </nav>

          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
            <p className="font-semibold text-slate-700 dark:text-slate-100">Automation</p>
            <label className="mt-2 flex cursor-pointer items-center justify-between gap-2">
              <span>Auto-refresh (60s)</span>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(event) => setAutoRefresh(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
              />
            </label>
          </div>
        </aside>

        <main className="flex-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Operations Intelligence
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Dynamic control for inventory, order flow, and admin security posture.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                {autoRefresh ? 'Live Snapshot' : 'Manual Snapshot'}
              </span>
              <button
                type="button"
                onClick={() => void loadDashboardData()}
                className="rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-orange-600"
              >
                Sync
              </button>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2 lg:hidden">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'inventory', label: 'Inventory' },
              { key: 'orders', label: 'Orders' },
              { key: 'create', label: 'Add Product' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  activeTab === tab.key
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'inventory' && renderInventory()}
          {activeTab === 'orders' && renderOrders()}
          {activeTab === 'create' && renderCreateProduct()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
