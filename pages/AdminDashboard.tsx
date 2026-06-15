import { OverviewTab } from '../components/admin/OverviewTab';
import { InventoryTab } from '../components/admin/InventoryTab';
import { OrdersTab } from '../components/admin/OrdersTab';
import { CreateProductTab } from '../components/admin/CreateProductTab';
import { ModerationTab } from '../components/admin/ModerationTab';
import { UsersTab } from '../components/admin/UsersTab';
import { safeStorage, safeSessionStorage } from '../lib/storage';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL, apiRequest, getErrorMessage } from '../services/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { sanitizeInput, sanitizeUrl } from '../lib/security';
import type { Order, Product, User } from '../types';

const TOKEN_STORAGE_KEY = 'petbhai_token';
const DEFAULT_ADMIN_EMAIL = 'petbhaibd@gmail.com';

type OrderStatus = NonNullable<Order['status']>;
import type { OrderStatus, ActiveTab, StockFilter, SortMode, ModerationQueueStatus, ModerationStatusFilter, ModerationAction, InventoryEditableField, DashboardStats, InventoryProductResponse, InventoryRow, OrderStatusHistoryEntry, AdminOrder, ModerationReportSummary, AdminUserSummary, OrdersPayload, ModerationPayload, UsersPayload, OrderStatusResponse, ModerationResponse, NewProductForm } from '../types/admin';

const categoryOptions: Product['category'][] = [
  'Cat Food',
  'Dog Food',
  'Cat Supplies',
  'Dog Supplies',
  'Grooming',
  'Accessories',
];

const orderStatusOptions: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

const mobileTabs: Array<{ key: ActiveTab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'orders', label: 'Orders' },
  { key: 'create', label: 'Add Product' },
  { key: 'moderation', label: 'Moderation' },
  { key: 'users', label: 'Users' },
];

const getStatusMeta = (
  stockStatus: Product['stockStatus'] | undefined,
  stockQuantity: number,
  reorderPoint: number
) => {
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

const getAuthHeaders = (): Record<'Authorization', string> => {
  const token = safeStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token) {
    throw new Error('Please log in with your admin account to manage inventory.');
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

const getOrderStatusTone = (status: OrderStatus | undefined): string => {
  if (status === 'delivered') return 'bg-emerald-100 text-emerald-700';
  if (status === 'cancelled' || status === 'refunded') return 'bg-rose-100 text-rose-700';
  if (status === 'shipped') return 'bg-amber-100 text-amber-700';
  if (status === 'processing' || status === 'confirmed') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
};

const toNumeric = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoundedInteger = (value: unknown, min = 0, max = 100000): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.max(min, Math.min(max, Math.round(parsed)));
};

const isAdminUser = (user: User | null): boolean => {
  if (!user) return false;
  const normalizedEmail = typeof user.email === 'string' ? user.email.trim().toLowerCase() : '';
  return user.role === 'admin' || normalizedEmail === DEFAULT_ADMIN_EMAIL;
};

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [inventoryRows, setInventoryRows] = useState<InventoryRow[]>([]);
  const [orderStats, setOrderStats] = useState<DashboardStats>({
    total: 0,
    totalRevenue: 0,
    todayOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [moderationReports, setModerationReports] = useState<ModerationReportSummary[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savingOrderId, setSavingOrderId] = useState('');
  const [savingModerationId, setSavingModerationId] = useState('');
  const [savingUserActionId, setSavingUserActionId] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<Record<string, OrderStatus>>({});
  const [orderNotes, setOrderNotes] = useState<Record<string, string>>({});
  const [trackingNumbers, setTrackingNumbers] = useState<Record<string, string>>({});
  const [addingProduct, setAddingProduct] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('risk-desc');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastSyncAt, setLastSyncAt] = useState('');
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [moderationStatusFilter, setModerationStatusFilter] =
    useState<ModerationStatusFilter>('open');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [newProduct, setNewProduct] = useState<NewProductForm>({
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

  const loadDashboardData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');

    try {
      const headers = getAuthHeaders();
      const [inventory, stats, ordersPayload, moderationPayload, usersPayload] =
        await Promise.all([
          apiRequest<InventoryProductResponse[]>('/products/admin/inventory', { headers }),
          apiRequest<DashboardStats>('/orders/stats/summary', { headers }),
          apiRequest<OrdersPayload>('/orders?limit=20&page=1', { headers }),
          apiRequest<ModerationPayload>('/posts/moderation/reports', { headers }),
          apiRequest<UsersPayload>('/admin/users', { headers }),
        ]);

      setInventoryRows(
        inventory.map((product: InventoryProductResponse) => ({
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
      const reports = Array.isArray(moderationPayload?.items) ? moderationPayload.items : [];
      const users = Array.isArray(usersPayload?.items) ? usersPayload.items : [];
      setRecentOrders(orders);
      setModerationReports(reports);
      setAdminUsers(users);
      setSelectedStatuses(
        orders.reduce<Record<string, OrderStatus>>((acc, order) => {
          acc[order.orderId] = order.status || 'pending';
          return acc;
        }, {})
      );
      setOrderNotes(
        orders.reduce<Record<string, string>>((acc, order) => {
          const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
          const lastEntry = history.length > 0 ? history[history.length - 1] : null;
          acc[order.orderId] = lastEntry?.note ? sanitizeInput(String(lastEntry.note), 500) : '';
          return acc;
        }, {})
      );
      setTrackingNumbers(
        orders.reduce<Record<string, string>>((acc, order) => {
          acc[order.orderId] = order.trackingNumber
            ? sanitizeInput(String(order.trackingNumber), 120, { allowNewlines: false })
            : '';
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
    }, 45000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [autoRefresh, loadDashboardData]);

  useEffect(() => {
    const token = safeStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token || !isAdminUser(currentUser)) {
      setIsLiveConnected(false);
      return undefined;
    }

    const streamUrl = `${API_BASE_URL}/admin/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(streamUrl, { withCredentials: true });

    let refreshTimeout: number | null = null;
    const queueRefresh = () => {
      if (refreshTimeout) {
        window.clearTimeout(refreshTimeout);
      }
      refreshTimeout = window.setTimeout(() => {
        void loadDashboardData();
      }, 400);
    };

    const onConnected = () => {
      setIsLiveConnected(true);
    };

    const onRealtimeChange = () => {
      setIsLiveConnected(true);
      queueRefresh();
    };

    const onError = () => {
      setIsLiveConnected(false);
    };

    eventSource.addEventListener('connected', onConnected);
    eventSource.addEventListener('order-created', onRealtimeChange);
    eventSource.addEventListener('order-updated', onRealtimeChange);
    eventSource.addEventListener('order-cancelled', onRealtimeChange);
    eventSource.addEventListener('inventory-updated', onRealtimeChange);
    eventSource.addEventListener('product-created', onRealtimeChange);
    eventSource.onerror = onError;

    return () => {
      setIsLiveConnected(false);
      if (refreshTimeout) {
        window.clearTimeout(refreshTimeout);
      }
      eventSource.removeEventListener('connected', onConnected);
      eventSource.removeEventListener('order-created', onRealtimeChange);
      eventSource.removeEventListener('order-updated', onRealtimeChange);
      eventSource.removeEventListener('order-cancelled', onRealtimeChange);
      eventSource.removeEventListener('inventory-updated', onRealtimeChange);
      eventSource.removeEventListener('product-created', onRealtimeChange);
      eventSource.close();
    };
  }, [currentUser, loadDashboardData]);

  const handleInventoryFieldChange = (
    id: number,
    field: InventoryEditableField,
    value: string | number
  ) => {
    setInventoryRows((prevRows) =>
      prevRows.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]: toBoundedInteger(value, 0, 100000),
            }
          : row
      )
    );
  };

  const handleSaveInventory = async (row: InventoryRow): Promise<void> => {
    setSavingId(row.id);
    setError('');

    try {
      const headers = {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      };

      const updated = await apiRequest<InventoryProductResponse>(`/products/${row.id}/inventory`, {
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

  const handleOrderStatusSave = async (orderId: string): Promise<void> => {
    setSavingOrderId(orderId);
    setError('');

    try {
      const status = selectedStatuses[orderId];
      const safeNote = sanitizeInput(String(orderNotes[orderId] || ''), 500);
      const safeTracking = sanitizeInput(String(trackingNumbers[orderId] || ''), 120, {
        allowNewlines: false,
      });

      const headers = {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      };

      const response = await apiRequest<OrderStatusResponse>(
        `/orders/${encodeURIComponent(orderId)}/status`,
        {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status,
          note: safeNote || `Updated from admin dashboard (${currentUser?.email || 'admin'})`,
          trackingNumber: safeTracking || undefined,
        }),
        }
      );

      setRecentOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.orderId === orderId
            ? {
                ...order,
                status: response?.order?.status || status,
                trackingNumber: response?.order?.trackingNumber || safeTracking || undefined,
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

  const handleCreateProduct = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setAddingProduct(true);
    setError('');

    try {
      const payload = {
        name: sanitizeInput(newProduct.name, 250),
        category: newProduct.category,
        price: Number(newProduct.price),
        imageUrl: sanitizeUrl(newProduct.imageUrl) || '',
        description: sanitizeInput(newProduct.description, 3000),
        weight: sanitizeInput(newProduct.weight, 50),
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

  const handleModerationAction = async (
    reportId: string,
    status: ModerationQueueStatus,
    action: ModerationAction,
    note = ''
  ): Promise<void> => {
    const reviewerId = Number(currentUser?.id);
    if (!Number.isFinite(reviewerId) || reviewerId <= 0) {
      setError('Unable to identify current admin account. Please log in again.');
      return;
    }

    setSavingModerationId(reportId);
    setError('');

    try {
      const headers = {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      };

      const response = await apiRequest<ModerationResponse>(
        `/posts/moderation/reports/${encodeURIComponent(reportId)}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            reviewerId,
            status,
            action,
            note: sanitizeInput(String(note || ''), 500),
          }),
        }
      );

      const updatedReport = response?.report;
      if (updatedReport?.id) {
        setModerationReports((prevReports) =>
          prevReports.map((report) => (report.id === updatedReport.id ? updatedReport : report))
        );
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Failed to update moderation report.'));
    } finally {
      setSavingModerationId('');
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
        tone: 'bg-amber-600 text-white',
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

  const filteredModerationReports = useMemo(() => {
    if (moderationStatusFilter === 'all') {
      return moderationReports;
    }

    return moderationReports.filter((report) => report.status === moderationStatusFilter);
  }, [moderationReports, moderationStatusFilter]);

  const filteredAdminUsers = useMemo(() => {
    const normalized = userSearchTerm.trim().toLowerCase();
    if (!normalized) {
      return adminUsers;
    }

    return adminUsers.filter(
      (user) =>
        String(user.name || '')
          .toLowerCase()
          .includes(normalized) ||
        String(user.email || '')
          .toLowerCase()
          .includes(normalized)
    );
  }, [adminUsers, userSearchTerm]);

  const handleBanUser = async (userId: number): Promise<void> => {
    setSavingUserActionId(`ban-${userId}`);
    setError('');

    try {
      const headers = {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      };

      await apiRequest(`/admin/users/${userId}/ban`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason: 'Banned by admin moderation' }),
      });

      setAdminUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? {
                ...user,
                isBanned: true,
                bannedAt: new Date().toISOString(),
                banReason: 'Banned by admin moderation',
              }
            : user
        )
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Failed to ban user.'));
    } finally {
      setSavingUserActionId('');
    }
  };

  const handleUnbanUser = async (userId: number): Promise<void> => {
    setSavingUserActionId(`unban-${userId}`);
    setError('');

    try {
      const headers = {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      };

      await apiRequest(`/admin/users/${userId}/unban`, {
        method: 'POST',
        headers,
      });

      setAdminUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? {
                ...user,
                isBanned: false,
                bannedAt: undefined,
                banReason: undefined,
              }
            : user
        )
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Failed to unban user.'));
    } finally {
      setSavingUserActionId('');
    }
  };

  const secureLogout = () => {
    logout();
    window.location.hash = '#/login';
  };

  return (
    <div className="min-h-screen px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl gap-6">
        <aside className="hidden w-64 shrink-0 glass-card-ios-heavy p-5 border border-white/40 dark:border-white/10 lg:block">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">PetBhai Admin</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
            Operations Control Panel
          </p>
          <nav className="mt-6 space-y-2 text-sm">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`w-full rounded-xl px-3 py-2 text-left ${
                activeTab === 'overview'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/50'
              }`}
            >
              📊 Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`w-full rounded-xl px-3 py-2 text-left ${
                activeTab === 'inventory'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/50'
              }`}
            >
              📦 Inventory
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`w-full rounded-xl px-3 py-2 text-left ${
                activeTab === 'orders'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/50'
              }`}
            >
              🚚 Orders
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`w-full rounded-xl px-3 py-2 text-left ${
                activeTab === 'create'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/50'
              }`}
            >
              ➕ Add Product
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('moderation')}
              className={`w-full rounded-xl px-3 py-2 text-left ${
                activeTab === 'moderation'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/50'
              }`}
            >
              🛡️ Moderation
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`w-full rounded-xl px-3 py-2 text-left ${
                activeTab === 'users'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/50'
              }`}
            >
              👥 Users
            </button>
          </nav>

          <div className="mt-8 rounded-xl border border-white/35 dark:border-white/10 bg-white/50 dark:bg-slate-900/40 px-3 py-3 text-xs dark:text-slate-300">
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

        <main className="flex-1 glass-card-ios-heavy border border-white/40 dark:border-white/10 p-5 md:p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Operations Intelligence
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Dynamic control for inventory, order flow, and admin security posture.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                {isLiveConnected ? 'Realtime Connected' : autoRefresh ? 'Auto Refresh' : 'Manual'}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  isLiveConnected
                    ? 'bg-emerald-100/80 text-emerald-700'
                    : 'bg-amber-100/80 text-amber-700'
                }`}
              >
                {isLiveConnected ? 'SSE Live' : 'Reconnecting'}
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
            {mobileTabs.map((tab) => (
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

          {activeTab === 'overview' && (
            <OverviewTab
              metrics={metrics}
              topRiskItems={topRiskItems}
              currentUser={currentUser}
              lastSyncAt={lastSyncAt}
              secureLogout={secureLogout}
              getStatusMeta={getStatusMeta}
            />
          )}
          {activeTab === 'inventory' && (
            <InventoryTab
              filteredInventoryRows={filteredInventoryRows}
              loading={loading}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              stockFilter={stockFilter}
              setStockFilter={setStockFilter}
              sortMode={sortMode}
              setSortMode={setSortMode}
              savingId={savingId}
              loadDashboardData={loadDashboardData}
              getStatusMeta={getStatusMeta}
              handleInventoryFieldChange={handleInventoryFieldChange}
              handleSaveInventory={handleSaveInventory}
              sanitizeInput={sanitizeInput}
            />
          )}
          {activeTab === 'orders' && (
            <OrdersTab
              recentOrders={recentOrders}
              loading={loading}
              selectedStatuses={selectedStatuses}
              setSelectedStatuses={setSelectedStatuses}
              orderNotes={orderNotes}
              setOrderNotes={setOrderNotes}
              trackingNumbers={trackingNumbers}
              setTrackingNumbers={setTrackingNumbers}
              savingOrderId={savingOrderId}
              handleOrderStatusSave={handleOrderStatusSave}
              orderStatusOptions={orderStatusOptions}
              getOrderStatusTone={getOrderStatusTone}
              toNumeric={toNumeric}
              sanitizeInput={sanitizeInput}
            />
          )}
          {activeTab === 'create' && (
            <CreateProductTab
              newProduct={newProduct}
              setNewProduct={setNewProduct}
              categoryOptions={categoryOptions}
              addingProduct={addingProduct}
              handleCreateProduct={handleCreateProduct}
              sanitizeInput={sanitizeInput}
            />
          )}
          {activeTab === 'moderation' && (
            <ModerationTab
              filteredModerationReports={filteredModerationReports}
              loading={loading}
              moderationStatusFilter={moderationStatusFilter}
              setModerationStatusFilter={setModerationStatusFilter}
              savingModerationId={savingModerationId}
              loadDashboardData={loadDashboardData}
              handleModerationAction={handleModerationAction}
            />
          )}
          {activeTab === 'users' && (
            <UsersTab
              filteredAdminUsers={filteredAdminUsers}
              loading={loading}
              userSearchTerm={userSearchTerm}
              setUserSearchTerm={setUserSearchTerm}
              savingUserActionId={savingUserActionId}
              handleBanUser={handleBanUser}
              handleUnbanUser={handleUnbanUser}
              sanitizeInput={sanitizeInput}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
