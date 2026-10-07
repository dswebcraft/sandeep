import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  TrendingUp, 
  Filter,
  RefreshCw
} from 'lucide-react';
import { Product } from '../types/erp';
import { erpService } from '../services/api';
import { formatCurrency } from '../utils/formatters';

interface ProductsViewProps {
  products: Product[];
  loading: boolean;
  onRefresh: () => void;
  onOpenRecordPurchase?: (itemName: string) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  loading,
  onRefresh,
  onOpenRecordPurchase,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Manjha');
  const [unit, setUnit] = useState('Spool');
  const [purchaseRate, setPurchaseRate] = useState<number>(0);
  const [saleRate, setSaleRate] = useState<number>(0);
  const [minAlertQty, setMinAlertQty] = useState<number>(10);
  const [saving, setSaving] = useState(false);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filtered = products.filter(p => {
    const matchesSearch = p.itemName.toLowerCase().includes(search.toLowerCase()) ||
                          p.productId.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setItemName('');
    setCategory('');
    setUnit('');
    setPurchaseRate(0);
    setSaleRate(0);
    setMinAlertQty(10);
    setModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setItemName(p.itemName);
    setCategory(p.category);
    setUnit(p.unit);
    setPurchaseRate(p.latestPurchaseRate);
    setSaleRate(p.defaultSaleRate);
    setMinAlertQty(p.minAlertQty || 10);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    try {
      setSaving(true);
      await erpService.saveProduct({
        productId: editingProduct ? editingProduct.productId : undefined,
        itemName: itemName.trim(),
        category: (category || 'General').trim(),
        unit: (unit || 'Pcs').trim(),
        latestPurchaseRate: Number(purchaseRate),
        defaultSaleRate: Number(saleRate),
        minAlertQty: Number(minAlertQty),
      });
      setModalOpen(false);
      onRefresh();
    } catch (err: unknown) {
      alert('Error saving product: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Product Master & Stock Registry</span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono border border-slate-700">
              {products.length} Products
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-calculated: Current Stock = Total Purchased - Total Sold
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by product name or item ID (e.g. Bareilly, Mono, PRD-001)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 w-full md:w-44"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
                <th className="py-3 px-4">Item Code</th>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Category / Unit</th>
                <th className="py-3 px-4 text-right">Latest Purchase Rate</th>
                <th className="py-3 px-4 text-right">Selling Rate</th>
                <th className="py-3 px-4 text-right">Gross Margin</th>
                <th className="py-3 px-4 text-right">Purchased</th>
                <th className="py-3 px-4 text-right">Sold</th>
                <th className="py-3 px-4 text-right">Current Stock</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filtered.length > 0 ? (
                filtered.map(p => {
                  const marginAmt = p.defaultSaleRate - p.latestPurchaseRate;
                  const marginPct = p.latestPurchaseRate > 0
                    ? ((marginAmt / p.latestPurchaseRate) * 100).toFixed(0)
                    : 0;

                  return (
                    <tr key={p.productId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {p.productId}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {p.itemName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60 text-[10px]">
                          {p.category}
                        </span>
                        <span className="text-[11px] text-slate-500 ml-1.5">({p.unit})</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        {formatCurrency(p.latestPurchaseRate)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-amber-400">
                        {formatCurrency(p.defaultSaleRate)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono text-emerald-400 font-semibold">
                          +{formatCurrency(marginAmt)}
                        </span>
                        <span className="text-[10px] text-emerald-400/80 ml-1">
                          ({marginPct}%)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">
                        {p.totalPurchased}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">
                        {p.totalSold}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-base text-white">
                        {p.currentStock}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            p.stockStatus === 'OK'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : p.stockStatus === 'LOW STOCK'
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {p.stockStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                            title="Edit Product"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {onOpenRecordPurchase && p.stockStatus !== 'OK' && (
                            <button
                              onClick={() => onOpenRecordPurchase(p.itemName)}
                              className="px-2 py-0.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 rounded text-[10px] font-medium"
                              title="Record Purchase for this item"
                            >
                              + Stock
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    No products matched your search or category filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Product / Item Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mono Kite Fighter 6000"
                  value={itemName}
                  onChange={e => setItemName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Category <span className="text-[10px] text-amber-400 font-normal">(Manual Entry)</span> <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    list="category-suggestions"
                    required
                    placeholder="Type category (e.g. Manjha, Kites, Saddi...)"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-amber-500 placeholder:text-slate-500"
                  />
                  <datalist id="category-suggestions">
                    {Array.from(new Set(products.map(p => p.category).filter(Boolean))).map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                    <option value="Manjha" />
                    <option value="Kites" />
                    <option value="Charkhi" />
                    <option value="Saddi" />
                    <option value="General" />
                    <option value="Raw Material" />
                    <option value="Packaging" />
                  </datalist>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Free manual text input
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Unit <span className="text-[10px] text-amber-400 font-normal">(Manual Entry)</span> <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    list="unit-suggestions"
                    required
                    placeholder="Type unit (e.g. Spool, Pcs, Pack, Reel, Kg...)"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-amber-500 placeholder:text-slate-500"
                  />
                  <datalist id="unit-suggestions">
                    {Array.from(new Set(products.map(p => p.unit).filter(Boolean))).map(u => (
                      <option key={u} value={u} />
                    ))}
                    <option value="Spool" />
                    <option value="Pack" />
                    <option value="Pcs" />
                    <option value="Reel" />
                    <option value="Box" />
                    <option value="Kg" />
                    <option value="Meter" />
                    <option value="Bundle" />
                    <option value="Dozen" />
                    <option value="Gaddi" />
                  </datalist>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Free manual text input
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Latest Purchase Rate (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={purchaseRate}
                    onChange={e => setPurchaseRate(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Default Sale Rate (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={saleRate}
                    onChange={e => setSaleRate(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Low Stock Alert Threshold (Units)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={minAlertQty}
                  onChange={e => setMinAlertQty(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Alerts if current stock drops to or below this quantity (Default: 10 units).
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
