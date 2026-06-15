import React from 'react';
import type { NewProductForm } from '../../types/admin';
import type { Product } from '../../types';

interface CreateProductTabProps {
  newProduct: NewProductForm;
  setNewProduct: React.Dispatch<React.SetStateAction<NewProductForm>>;
  categoryOptions: Product['category'][];
  addingProduct: boolean;
  handleCreateProduct: (e: React.FormEvent) => void;
  sanitizeInput: (input: string, limit?: number, options?: any) => string;
}

export const CreateProductTab: React.FC<CreateProductTabProps> = ({
  newProduct,
  setNewProduct,
  categoryOptions,
  addingProduct,
  handleCreateProduct,
  sanitizeInput,
}) => {
  return (
    <section className="mt-1 overflow-hidden rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
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
};
