import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL, apiRequest, getErrorMessage } from '../services/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { sanitizeInput, sanitizeUrl } from '../lib/security';
import type { Order, Product, User } from '../types';

const TOKEN_STORAGE_KEY = 'petbhai_token';
const DEFAULT_ADMIN_EMAIL = 'petbhaibd@gmail.com';

type OrderStatus = NonNullable<Order['status']>;
type ActiveTab = 'overview' | 'inventory' | 'orders' | 'create' | 'moderation' | 'users';
type StockFilter = 'all' | 'critical' | 'healthy';
type SortMode = 'risk-desc' | 'stock-asc' | 'name';
type ModerationQueueStatus = 'open' | 'reviewed' | 'dismissed';
type ModerationStatusFilter = ModerationQueueStatus | 'all';
type ModerationAction = 'hide' | 'restore' | 'none';
type InventoryEditableField = 'stockLevel' | 'reorderPoint';

interface DashboardStats {
  total: number;
  totalRevenue: number;
  todayOrders: number;
}

interface InventoryProductResponse extends Product {
  stockQuantity?: number;
  reorderPoint?: number;
  stockStatus?: Product['stockStatus'];
}

interface InventoryRow {
  id: number;
  sku: string;
  productName: string;
  category: Product['category'];
  stockLevel: number;
  reorderPoint: number;
  stockStatus?: Product['stockStatus'];
  riskScore?: number;
}

interface OrderStatusHistoryEntry {
  status?: OrderStatus;
  timestamp: string;
  note?: string;
}

interface AdminOrder extends Order {
  shippingAddress?: {
    name?: string;
  };
  trackingNumber?: string;
  statusHistory?: OrderStatusHistoryEntry[];
}

interface ModerationReportSummary {
  id: string;
  targetType: 'post' | 'comment' | 'reply';
  targetPostId: number;
  targetCommentId?: number;
  targetReplyId?: number;
  reporterId: number;
  reason: string;
  status: ModerationQueueStatus;
  createdAt: string;
  updatedAt: string;
}

interface AdminUserSummary {
  id: number;
  name: string;
  email: string;
  role?: User['role'];
  emailVerified?: boolean;
  isBanned: boolean;
  bannedAt?: string;
  banReason?: string;
  postCount: number;
  commentCount: number;
  replyCount: number;
}

interface OrdersPayload {
  orders: AdminOrder[];
}

interface ModerationPayload {
  items: ModerationReportSummary[];
}

interface UsersPayload {
  items: AdminUserSummary[];
}

interface OrderStatusResponse {
  order?: AdminOrder;
}

interface ModerationResponse {
  report?: ModerationReportSummary;
}

interface NewProductForm {
  name: string;
  category: Product['category'];
  price: string;
  imageUrl: string;
  description: string;
  weight: string;
  brandId: string;
  stockQuantity: string;
  reorderPoint: string;
}

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
  const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
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
    const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
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
            onChange={(event) =>
              setSearchTerm(sanitizeInput(event.target.value, 120, { allowNewlines: false }))
            }
            placeholder="Search SKU, name, category"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
          <select
            value={stockFilter}
            onChange={(event) => setStockFilter(event.target.value as StockFilter)}
            aria-label="Filter inventory by stock status"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          >
            <option value="all">All Stock States</option>
            <option value="critical">Critical / Reorder</option>
            <option value="healthy">Healthy Only</option>
          </select>
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
            aria-label="Sort inventory rows"
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
                        aria-label={`Stock level for ${row.productName}`}
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
                        aria-label={`Reorder point for ${row.productName}`}
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
          onChange={(event) =>
            setNewProduct((prev) => ({ ...prev, name: sanitizeInput(event.target.value, 250) }))
          }
          required
        />
        <select
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          value={newProduct.category}
          onChange={(event) =>
            setNewProduct((prev) => ({
              ...prev,
              category: event.target.value as Product['category'],
            }))
          }
          aria-label="New product category"
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
          onChange={(event) =>
            setNewProduct((prev) => ({
              ...prev,
              imageUrl: sanitizeInput(event.target.value, 3000, { allowNewlines: false }),
            }))
          }
          required
        />
        <input
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          placeholder="Weight (e.g. 10kg)"
          value={newProduct.weight}
          onChange={(event) =>
            setNewProduct((prev) => ({ ...prev, weight: sanitizeInput(event.target.value, 50) }))
          }
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
              description: sanitizeInput(event.target.value, 3000),
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

  const renderModeration = () => (
    <section className="mt-1 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Community Moderation Queue
          </h3>
          <div className="flex items-center gap-2">
            <select
              value={moderationStatusFilter}
              onChange={(event) =>
                setModerationStatusFilter(event.target.value as ModerationStatusFilter)
              }
              aria-label="Filter moderation reports"
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-900"
            >
              <option value="open">Open</option>
              <option value="reviewed">Reviewed</option>
              <option value="dismissed">Dismissed</option>
              <option value="all">All</option>
            </select>
            <button
              type="button"
              onClick={() => void loadDashboardData()}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-slate-800 text-slate-100">
            <tr>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Target</th>
              <th className="px-4 py-3 font-semibold">Reason</th>
              <th className="px-4 py-3 font-semibold">Reporter</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Created</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
            {!loading &&
              filteredModerationReports.map((report) => {
                const isSaving = savingModerationId === report.id;
                const targetLabel =
                  report.targetType === 'post'
                    ? `Post #${report.targetPostId}`
                    : report.targetType === 'comment'
                      ? `Comment #${report.targetCommentId} on Post #${report.targetPostId}`
                      : `Reply #${report.targetReplyId} on Comment #${report.targetCommentId}`;

                return (
                  <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200 capitalize">
                      {report.targetType}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{targetLabel}</td>
                    <td
                      className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-[260px] truncate"
                      title={report.reason}
                    >
                      {report.reason}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      #{report.reporterId}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                        {report.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            void handleModerationAction(
                              report.id,
                              'reviewed',
                              'hide',
                              'Hidden by admin'
                            )
                          }
                          disabled={isSaving}
                          className="rounded-lg bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60"
                        >
                          Hide
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void handleModerationAction(
                              report.id,
                              'reviewed',
                              'restore',
                              'Restored by admin'
                            )
                          }
                          disabled={isSaving}
                          className="rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
                        >
                          Restore
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void handleModerationAction(
                              report.id,
                              'dismissed',
                              'none',
                              'Dismissed by admin'
                            )
                          }
                          disabled={isSaving}
                          className="rounded-lg bg-slate-500 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-slate-600 disabled:opacity-60"
                        >
                          Dismiss
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

            {!loading && filteredModerationReports.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                >
                  No moderation reports found for the selected filter.
                </td>
              </tr>
            )}

            {loading && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                >
                  Loading moderation queue...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderUsers = () => (
    <section className="mt-1 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            User Management
          </h3>
          <input
            type="text"
            value={userSearchTerm}
            onChange={(event) =>
              setUserSearchTerm(sanitizeInput(event.target.value, 120, { allowNewlines: false }))
            }
            placeholder="Search by name or email"
            className="w-64 max-w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-900"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-slate-800 text-slate-100">
            <tr>
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Verified</th>
              <th className="px-4 py-3 font-semibold">Community Activity</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
            {!loading &&
              filteredAdminUsers.map((user) => {
                const banning = savingUserActionId === `ban-${user.id}`;
                const unbanning = savingUserActionId === `unban-${user.id}`;
                return (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{user.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200 capitalize">
                      {user.role || 'customer'}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {user.emailVerified ? 'Yes' : 'No'}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {user.postCount} posts • {user.commentCount} comments • {user.replyCount} replies
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          user.isBanned
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {user.isBanned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.role === 'admin' ? (
                        <span className="text-xs text-slate-500 dark:text-slate-400">Protected</span>
                      ) : user.isBanned ? (
                        <button
                          type="button"
                          onClick={() => void handleUnbanUser(user.id)}
                          disabled={unbanning}
                          className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
                        >
                          {unbanning ? 'Unbanning...' : 'Unban'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleBanUser(user.id)}
                          disabled={banning}
                          className="rounded-lg bg-rose-500 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
                        >
                          {banning ? 'Banning...' : 'Ban'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

            {!loading && filteredAdminUsers.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl gap-6">
        <aside className="hidden w-64 shrink-0 glass-card-ios-heavy p-5 border border-white/40 dark:border-white/10 lg:block">
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
              <p className="text-sm text-slate-500 dark:text-slate-400">
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

          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'inventory' && renderInventory()}
          {activeTab === 'orders' && renderOrders()}
          {activeTab === 'create' && renderCreateProduct()}
          {activeTab === 'moderation' && renderModeration()}
          {activeTab === 'users' && renderUsers()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
