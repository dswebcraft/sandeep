import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Calendar, 
  Truck, 
  FileText, 
  RefreshCw,
  TrendingDown
} from 'lucide-react';
import { Purchase, Product } from '../types/erp';
import { erpService } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';

interface PurchasesViewProps {
  purchases: Purchase[];
  products: Product[];
  loading: boolean;
  onRefresh: () => void;
  prefillItemName?: string;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  purchases,
  products,
  loading,
  onRefresh,
  prefillItemName = '',
}) => {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(!!prefillItemName);

  // Form states
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [billNo, setBillNo] = useState(`PUR-${Date.now().toString().slice(-4)}`);
  const [supplierName, setSupplierName] = useState('');
  const [itemName, setItemName] = useState(prefillItemName || (products[0]?.itemName || ''));
  const [qty, setQty] = useState<number>(100);
  const [purchaseRate, setPurchaseRate] = useState<number>(0);
  const [customCategory, setCustomCategory] = useState('');
  const [customUnit, setCustomUnit] = useState('Pcs');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // When itemName changes, auto-fill default purchase rate
  const handleItemChange = (selectedName: string) => {
    setItemName(selectedName);
    const prod = products.find(p => p.itemName.toLowerCase() === selectedName.toLowerCase());
    if (prod && prod.latestPurchaseRate > 0) {
      setPurchaseRate(prod.latestPurchaseRate);
    }
  };

  const handleOpenModal = () => {
    setBillNo(`PUR-${Date.now().toString().slice(-4)}`);
    setDate(new Date().toISOString().split('T')[0]);
    setSupplierName('');
    const firstItem = products[0]?.itemName || '';
    setItemName(firstItem);
    const prod = products.find(p => p.itemName === firstItem);
    setPurchaseRate(prod?.latestPurchaseRate || 0);
    setQty(100);
    setNotes('');
    setModalOpen(true);
  };

  const computedAmount = (Number(qty) || 0) * (Number(purchaseRate) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || qty <= 0 || purchaseRate <= 0) {
      alert('Please fill all required fields with valid quantities and rates.');
      return;
    }

    try {
      setSaving(true);
      await erpService.savePurchase({
        date,
        billNo,
        supplierName: supplierName.trim() || 'General Supplier',
        itemName,
        category: customCategory.trim() || undefined,
        unit: customUnit.trim() || undefined,
        qty: Number(qty),
        purchaseRate: Number(purchaseRate),
        notes,
      });
      setModalOpen(false);
      onRefresh();
    } catch (err: unknown) {
      alert('Error recording purchase: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  const filtered = purchases.filter(p => {
    const q = search.toLowerCase();
    return (
      p.billNo.toLowerCase().includes(q) ||
      p.supplierName.toLowerCase().includes(q) ||
      p.itemName.toLowerCase().includes(q)
    );
  });

  const totalSpent = purchases.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Inward Purchases & Stock Procurement</span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono border border-slate-700">
              {purchases.length} Inward Bills
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Formula: Amount = Qty * Purchase Rate • Updates Latest Purchase Price in master
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
            title="Refresh Purchases"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Record Inward Purchase</span>
          </button>
        </div>
      </div>

      {/* Summary Stat & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Total Purchases Inward</div>
            <div className="text-xl font-bold text-white font-mono mt-1">
              {formatCurrency(totalSpent)}
            </div>
          </div>
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="md:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search purchases by Bill No, Supplier Name, or Item Name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Bill No</th>
                <th className="py-3 px-4">Supplier Name</th>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4 text-right">Inward Qty</th>
                <th className="py-3 px-4 text-right">Purchase Rate (₹)</th>
                <th className="py-3 px-4 text-right">Total Amount (₹)</th>
                <th className="py-3 px-4">Remarks / Logistics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filtered.length > 0 ? (
                filtered.map(p => (
                  <tr key={p.purchaseId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {formatDate(p.date)}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-white">
                      {p.billNo}
                    </td>
                    <td className="py-3 px-4 text-slate-200">
                      {p.supplierName}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {p.itemName}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-white">
                      {p.qty}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300">
                      {formatCurrency(p.purchaseRate)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-400 text-sm">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                      {p.notes || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No purchase records found matching your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Inward Purchase Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                  <ShoppingBag className="w-5 h-5" />
                </span>
                <h3 className="text-base font-semibold text-white">
                  Record Inward Stock Purchase
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Invoice Date <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Purchase Bill No <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={billNo}
                    onChange={e => setBillNo(e.target.value)}
                    placeholder="e.g. PUR-BR-5501"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Supplier Name / Factory <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bareilly Thread Mills, Rampur Craftsmen Hub..."
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Item / Product Name <span className="text-amber-400">*</span>
                </label>
                <div className="space-y-2">
                  <select
                    value={itemName}
                    onChange={e => handleItemChange(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    {products.map(p => (
                      <option key={p.productId} value={p.itemName}>
                        {p.itemName} (Stock: {p.currentStock} {p.unit} | Last Rate: ₹{p.latestPurchaseRate})
                      </option>
                    ))}
                    <option value="__NEW__">+ Custom / New Unlisted Item</option>
                  </select>

                  {itemName === '__NEW__' && (
                    <div className="space-y-2 pt-1">
                      <input
                        type="text"
                        placeholder="Type custom item name (e.g. Special Kite 500)..."
                        onChange={e => setItemName(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <input
                            type="text"
                            list="pur-cat-list"
                            placeholder="Category (Manual: e.g. Kites, Manjha...)"
                            value={customCategory}
                            onChange={e => setCustomCategory(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-1.5 px-3 text-white text-xs focus:outline-none focus:border-blue-500"
                          />
                          <datalist id="pur-cat-list">
                            {Array.from(new Set(products.map(p => p.category))).map(c => (
                              <option key={c} value={c} />
                            ))}
                          </datalist>
                        </div>
                        <div>
                          <input
                            type="text"
                            list="pur-unit-list"
                            placeholder="Unit (Manual: e.g. Spool, Pcs, Pack...)"
                            value={customUnit}
                            onChange={e => setCustomUnit(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-1.5 px-3 text-white text-xs focus:outline-none focus:border-blue-500"
                          />
                          <datalist id="pur-unit-list">
                            <option value="Spool" />
                            <option value="Pcs" />
                            <option value="Pack" />
                            <option value="Reel" />
                            <option value="Box" />
                            <option value="Kg" />
                            <option value="Meter" />
                          </datalist>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Purchased Qty <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={qty}
                    onChange={e => setQty(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Purchase Rate (₹ / unit) <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={purchaseRate}
                    onChange={e => setPurchaseRate(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Dynamic Auto-Calculation Card */}
              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Total Purchase Amount:</span>
                  <p className="text-[10px] text-slate-500">Qty ({qty}) × Rate (₹{purchaseRate})</p>
                </div>
                <div className="text-xl font-bold font-mono text-blue-400">
                  {formatCurrency(computedAmount)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Logistics / Transport Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bareilly to Barabanki via UP Roadways freight"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
                />
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
                  className="px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  {saving ? 'Recording...' : 'Confirm Inward Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
