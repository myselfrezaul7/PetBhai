import type { Order, Product, User } from '../types';

export type OrderStatus = NonNullable<Order['status']>;

export type ActiveTab =
  | 'overview'
  | 'inventory'
  | 'orders'
  | 'create'
  | 'moderation'
  | 'users'
  | 'adoption'
  | 'questions';
export type StockFilter = 'all' | 'critical' | 'healthy';
export type SortMode = 'risk-desc' | 'stock-asc' | 'name';
export type ModerationQueueStatus = 'open' | 'reviewed' | 'dismissed';
export type ModerationStatusFilter = ModerationQueueStatus | 'all';
export type ModerationAction = 'hide' | 'restore' | 'none';
export type InventoryEditableField = 'stockLevel' | 'reorderPoint';

export interface DashboardStats {
  total: number;
  totalRevenue: number;
  todayOrders: number;
}

export interface InventoryProductResponse extends Product {
  stockQuantity?: number;
  reorderPoint?: number;
  stockStatus?: Product['stockStatus'];
}

export interface InventoryRow {
  id: number;
  sku: string;
  productName: string;
  category: Product['category'];
  stockLevel: number;
  reorderPoint: number;
  stockStatus?: Product['stockStatus'];
  riskScore?: number;
  price?: number;
  imageUrl?: string;
  description?: string;
  weight?: string;
  brandId?: number;
}

export interface OrderStatusHistoryEntry {
  status: string;
  timestamp: string;
  note?: string;
}

export interface AdminOrderShippingAddress {
  name?: string;
  fullName?: string;
  phone?: string;
  address?: string;
  city?: string;
  district?: string;
  postalCode?: string;
  email?: string;
}

export interface AdminOrder extends Order {
  shippingAddress?: AdminOrderShippingAddress;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  trackingNumber?: string;
  statusHistory?: OrderStatusHistoryEntry[];
}

export interface ModerationReportSummary {
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

export interface AdminUserSummary {
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

export interface OrdersPayload {
  orders: AdminOrder[];
}

export interface ModerationPayload {
  items: ModerationReportSummary[];
}

export interface UsersPayload {
  items: AdminUserSummary[];
}

export interface OrderStatusResponse {
  order?: AdminOrder;
}

export interface ModerationResponse {
  report?: ModerationReportSummary;
}

export interface NewProductForm {
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
