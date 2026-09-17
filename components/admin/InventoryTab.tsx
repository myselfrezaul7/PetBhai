import React, { useState } from 'react';
import type {
  InventoryRow,
  StockFilter,
  SortMode,
  InventoryEditableField,
} from '../../types/admin';
import type { Product } from '../../types';
import { apiRequest, getErrorMessage } from '../../services/apiClient';
import { realtimeService } from '../../services/realtimeService';
import { sanitizeInput, sanitizeUrl } from '../../lib/security';

interface InventoryTabProps {
  filteredInventoryRows: InventoryRow[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  stockFilter: StockFilter;
  setStockFilter: (filter: StockFilter) => void;
  sortMode: SortMode;
  setSortMode: (mode: SortMode) => void;
  savingId: number | null;
  loadDashboardData: () => Promise<void>;
  getStatusMeta: (
    stockStatus: any,
    stockLevel: number,
    reorderPoint: number
  ) => { label: string; badgeClass: string };
  handleInventoryFieldChange: (id: number, field: InventoryEditableField, value: string) => void;
  handleSaveInventory: (row: InventoryRow) => Promise<void>;
  sanitizeInput: (input: string, limit?: number, options?: any) => string;
}

const CATEGORY_OPTIONS: Product['category'][] = [
  'Cat Food',
  'Dog Food',
  'Cat Supplies',
  'Dog Supplies',
  'Grooming',
  'Accessories',
];

interface EditProductFormState {
  name: string;
  category: Product['category'];
  price: string;
  weight: string;
  description: string;
  imageUrl: string;
  stockLevel: string;
  reorderPoint: string;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  filteredInventoryRows,
  loading,
  searchTerm,
  setSearchTerm,
  stockFilter,
  setStockFilter,
  sortMode,
  setSortMode,
  savingId,
  loadDashboardData,
  getStatusMeta,
  handleInventoryFieldChange,
  handleSaveInventory,
  sanitizeInput: sanitizeProp,
}) => {
  // Modal states
  const [editingRow, setEditingRow] = useState<InventoryRow | null>(null);
  const [editForm, setEditForm] = useState<EditProductFormState>({
    name: '',
    category: 'Dog Food',
    price: '0',
    weight: '',
    description: '',
    imageUrl: '',
    stockLevel: '0',
    reorderPoint: '20',
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete modal states
  const [deletingRow, setDeletingRow] = useState<InventoryRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Count critical / low stock items for reorder alert
  const criticalItems = filteredInventoryRows.filter(
    (row) => row.stockStatus !== 'in-stock' || row.stockLevel <= row.reorderPoint
  );

  const handleOpenEdit = (row: InventoryRow) => {
    setEditingRow(row);
    setEditError('');
    setEditForm({
      name: row.productName || '',
      category: row.category || 'Dog Food',
      price: String(row.price ?? 0),
      weight: row.weight || '',
      description: row.description || '',
      imageUrl: row.imageUrl || '',
      stockLevel: String(row.stockLevel ?? 0),
      reorderPoint: String(row.reorderPoint ?? 20),
    });
  };

  const handleSaveEditModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow) return;

    setIsSubmittingEdit(true);
    setEditError('');

    try {
      const sanitizedName = sanitizeInput(editForm.name, 250);
      const parsedPrice = Number(editForm.price);
      const sanitizedWeight = sanitizeInput(editForm.weight, 50);
      const sanitizedDesc = sanitizeInput(editForm.description, 3000);
      const sanitizedImg = sanitizeUrl(editForm.imageUrl) || '';
      const parsedStock = Math.max(0, parseInt(editForm.stockLevel, 10) || 0);
      const parsedReorder = Math.max(0, parseInt(editForm.reorderPoint, 10) || 0);

      if (!sanitizedName.trim()) {
        throw new Error('Product name is required.');
      }
      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        throw new Error('Price must be greater than 0.');
      }
      if (sanitizedImg && !/^https?:\/\//i.test(sanitizedImg)) {
        throw new Error('Image URL must start with http:// or https://');
      }

      const payload = {
        name: sanitizedName,
        category: editForm.category,
        price: parsedPrice,
        weight: sanitizedWeight,
        description: sanitizedDesc,
        imageUrl: sanitizedImg,
        stockQuantity: parsedStock,
        stockLevel: parsedStock,
        reorderPoint: parsedReorder,
      };

      const updated = await apiRequest<any>(`/products/${editingRow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Broadcast event across tabs & listeners
      realtimeService.broadcast('INVENTORY_CHANGED', {
        productId: editingRow.id,
        ...payload,
        updated,
      });

      // Refresh data
      await loadDashboardData();
      setEditingRow(null);
    } catch (err) {
      setEditError(getErrorMessage(err, 'Failed to update product details.'));
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingRow) return;

    setIsDeleting(true);
    setDeleteError('');

    try {
      await apiRequest(`/products/${deletingRow.id}`, {
        method: 'DELETE',
      });

      // Broadcast delete event
      realtimeService.broadcast('INVENTORY_CHANGED', {
        productId: deletingRow.id,
        action: 'deleted',
      });

      await loadDashboardData();
      setDeletingRow(null);
    } catch (err) {
      setDeleteError(getErrorMessage(err, 'Failed to delete product.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="mt-1 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
      {/* Header & Controls */}
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-900/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              Real-Time Inventory Tracking & Catalog Control
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Monitor SKU stock health, reorder thresholds, update pricing/weights, and manage
              catalog items.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadDashboardData()}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900 shadow-sm"
          >
            <span>🔄</span> Refresh Now
          </button>
        </div>

        {/* Reorder Alerts Banner */}
        {criticalItems.length > 0 && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>
                <strong>Reorder Alert:</strong> {criticalItems.length}{' '}
                {criticalItems.length === 1 ? 'product has' : 'products have'} reached or fallen
                below the reorder point.
              </span>
            </div>
            {stockFilter !== 'critical' && (
              <button
                type="button"
                onClick={() => setStockFilter('critical')}
                className="shrink-0 rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-amber-700 transition"
              >
                Filter Critical Only
              </button>
            )}
          </div>
        )}

        {/* Search, Filter, Sort Controls */}
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              🔍
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(sanitizeProp(event.target.value, 120, { allowNewlines: false }))
              }
              placeholder="Search SKU, name, category..."
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          <select
            value={stockFilter}
            onChange={(event) => setStockFilter(event.target.value as StockFilter)}
            aria-label="Filter inventory by stock status"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">All Stock States</option>
            <option value="critical">Critical / Reorder Needed</option>
            <option value="healthy">Healthy Only</option>
          </select>

          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
            aria-label="Sort inventory rows"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="risk-desc">Sort by Risk Score</option>
            <option value="stock-asc">Sort by Stock (Low to High)</option>
            <option value="name">Sort by Product Name</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-slate-800 text-slate-100 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-semibold">SKU ID</th>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Stock Level & Gauge</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Reorder Pt</th>
              <th className="px-4 py-3 font-semibold">Risk</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-800">
            {!loading &&
              filteredInventoryRows.map((row) => {
                const statusMeta = getStatusMeta(row.stockStatus, row.stockLevel, row.reorderPoint);

                // Calculate stock level visual bar % and color
                const reorder = Math.max(1, row.reorderPoint);
                const stock = Math.max(0, row.stockLevel);
                const ratio = stock / (reorder * 2); // 100% when stock >= 2x reorder point
                const barPercent = Math.min(100, Math.max(5, Math.round(ratio * 100)));

                let barColor = 'bg-emerald-500';
                if (stock <= 0) {
                  barColor = 'bg-rose-600';
                } else if (stock <= reorder) {
                  barColor = stock <= reorder * 0.4 ? 'bg-rose-500' : 'bg-amber-500';
                }

                return (
                  <tr
                    key={row.sku}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-orange-600 dark:text-orange-400">
                      {row.sku}
                    </td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2.5">
                        {row.imageUrl ? (
                          <img
                            src={row.imageUrl}
                            alt={row.productName}
                            className="h-9 w-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=100&auto=format&fit=crop';
                            }}
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-lg bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-sm shrink-0">
                            📦
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-xs leading-tight text-slate-800 dark:text-slate-100">
                            {row.productName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {row.price ? `৳${row.price}` : ''} {row.weight ? `• ${row.weight}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                      <span className="rounded-md bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 text-[11px]">
                        {row.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          aria-label={`Stock level for ${row.productName}`}
                          value={row.stockLevel}
                          onChange={(event) =>
                            handleInventoryFieldChange(row.id, 'stockLevel', event.target.value)
                          }
                          className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-900"
                        />
                        <div className="w-20">
                          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${barColor} transition-all duration-300`}
                              style={{ width: `${barPercent}%` }}
                            />
                          </div>
                          <span className="block text-[9px] text-slate-400 mt-0.5">
                            {stock <= reorder ? `⚠️ Low (${stock})` : `${stock} units`}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusMeta.badgeClass}`}
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
                        className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-900"
                      />
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700 dark:text-slate-200 font-mono">
                      {Math.round(row.riskScore || 0)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => void handleSaveInventory(row)}
                          disabled={savingId === row.id}
                          title="Save quick inline changes"
                          className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-200 dark:text-slate-900"
                        >
                          {savingId === row.id ? '...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(row)}
                          title="Edit full product details"
                          className="rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-300 transition"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingRow(row)}
                          title="Delete product"
                          className="rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-300 transition"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

            {!loading && filteredInventoryRows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-300"
                >
                  <div className="text-2xl mb-1">📦</div>
                  No inventory products match your filters.
                </td>
              </tr>
            )}

            {loading && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-300"
                >
                  <div className="animate-spin text-xl mb-1">⏳</div>
                  Loading live inventory...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PRODUCT EDIT MODAL */}
      {editingRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fadeIn"
          onClick={() => setEditingRow(null)}
        >
          <div
            className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-800/60">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>✏️ Edit Product Details</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  SKU: {editingRow.sku} • ID: {editingRow.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingRow(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditModal} className="p-6 space-y-4">
              {editError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {editError}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Category & Price */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm({ ...editForm, category: e.target.value as Product['category'] })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Price (৳ BDT) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Weight & Image URL */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Weight / Spec
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1.2 kg or 500 ml"
                    value={editForm.weight}
                    onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={editForm.imageUrl}
                    onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Stock Level & Reorder Point */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Stock Level (Units) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editForm.stockLevel}
                    onChange={(e) => setEditForm({ ...editForm, stockLevel: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reorder Threshold *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editForm.reorderPoint}
                    onChange={(e) => setEditForm({ ...editForm, reorderPoint: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Detailed specifications, dietary guide, or ingredients..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingRow(null)}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition disabled:opacity-60"
                >
                  {isSubmittingEdit ? 'Saving Changes...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRODUCT DELETE CONFIRMATION MODAL */}
      {deletingRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setDeletingRow(null)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <span className="text-2xl">🗑️</span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Product Permanently?
              </h4>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete{' '}
              <strong className="text-slate-900 dark:text-white">{deletingRow.productName}</strong>{' '}
              (SKU: {deletingRow.sku})? This action cannot be undone and will remove it from store
              shelves immediately.
            </p>

            {deleteError && (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {deleteError}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingRow(null)}
                className="rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
              >
                Keep Product
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition disabled:opacity-60"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
