import React, { useState } from 'react';
import { 
  Receipt, 
  Search, 
  Plus, 
  Printer, 
  CreditCard, 
  Trash2, 
  RefreshCw, 
  Filter, 
  CheckCircle2, 
  Clock, 
  User, 
  Phone, 
  MapPin,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Sale, Product } from '../types/erp';
import { erpService } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';

interface SalesViewProps {
  sales: Sale[];
  products: Product[];
  loading: boolean;
  onRefresh: () => void;
  onOpenPrintModal: (sale: Sale) => void;
  onOpenPaymentModal: (sale: Sale) => void;
}

interface NewItemRow {
  itemName: string;
  qty: number;
  rate: number;
}

export const SalesView: React.FC<SalesViewProps> = ({
  sales,
  products,
  loading,
  onRefresh,
  onOpenPrintModal,
  onOpenPaymentModal,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending'>('All');
  const [modalOpen, setModalOpen] = useState(false);

  // New Invoice Form States
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [billNo, setBillNo] = useState(`SW-2026-${String(Math.floor(Math.random() * 900) + 100)}`);
  const [clientName, setClientName] = useState('');
  const [mobNo, setMobNo] = useState('');
  const [address, setAddress] = useState('Barabanki');
  const [packagingCharges, setPackagingCharges] = useState<number>(300);
  const [dispatchCharges, setDispatchCharges] = useState<number>(400);
  const [payment1, setPayment1] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>('Cash');
  const [saving, setSaving] = useState(false);

  // Line items state
  const [items, setItems] = useState<NewItemRow[]>([
    {
      itemName: products[0]?.itemName || 'Mono Kite Fighter 6000',
      qty: 50,
      rate: products[0]?.defaultSaleRate || 560,
    },
  ]);

  const handleOpenNewInvoice = () => {
    setBillNo(`SW-2026-${String(Math.floor(Math.random() * 900) + 100)}`);
    setDate(new Date().toISOString().split('T')[0]);
    setClientName('');
    setMobNo('');
    setAddress('Barabanki, UP');
    setPackagingCharges(250);
    setDispatchCharges(350);
    const firstP = products[0];
    setItems([
      {
        itemName: firstP?.itemName || 'Mono Kite Fighter 6000',
        qty: 50,
        rate: firstP?.defaultSaleRate || 560,
      },
    ]);
    setPayment1(0);
    setPaymentMode('Cash');
    setModalOpen(true);
  };

  const handleAddItemRow = () => {
    const firstP = products[0];
    setItems([
      ...items,
      {
        itemName: firstP?.itemName || '',
        qty: 10,
        rate: firstP?.defaultSaleRate || 100,
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, selectedName: string) => {
    const matched = products.find(p => p.itemName.toLowerCase() === selectedName.toLowerCase());
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      itemName: selectedName,
      rate: matched ? matched.defaultSaleRate : newItems[index].rate,
    };
    setItems(newItems);
  };

  const handleQtyChange = (index: number, newQty: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], qty: Number(newQty) };
    setItems(newItems);
  };

  const handleRateChange = (index: number, newRate: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], rate: Number(newRate) };
    setItems(newItems);
  };

  // Real-time Calculations
  const subtotal = items.reduce((acc, it) => acc + (it.qty * it.rate), 0);
  const totalSale = subtotal + Number(packagingCharges || 0) + Number(dispatchCharges || 0);
  const pendingBalance = totalSale - Number(payment1 || 0);

  // COGS & Profit Estimation
  const rateMap = new Map<string, number>();
  products.forEach(p => rateMap.set(p.itemName.toLowerCase(), p.latestPurchaseRate));
  const estimatedCogs = items.reduce((acc, it) => {
    const cost = rateMap.get(it.itemName.toLowerCase()) || 0;
    return acc + (it.qty * cost);
  }, 0);
  const estimatedGrossProfit = totalSale - estimatedCogs;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      alert('Client Name is required.');
      return;
    }
    if (items.some(it => it.qty <= 0 || it.rate <= 0)) {
      alert('All items must have valid quantity and sale rate.');
      return;
    }

    try {
      setSaving(true);
      const savedSale = await erpService.saveSale({
        date,
        billNo,
        clientName: clientName.trim(),
        address: address.trim() || 'Barabanki',
        mobNo: mobNo.trim(),
        items,
        packagingCharges: Number(packagingCharges || 0),
        dispatchCharges: Number(dispatchCharges || 0),
        payment1: Number(payment1 || 0),
        paymentMode,
      });

      setModalOpen(false);
      onRefresh();
      // Auto launch printable invoice!
      onOpenPrintModal(savedSale);
    } catch (err: unknown) {
      alert('Error creating invoice: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  const filteredSales = sales.filter(s => {
    const q = search.toLowerCase();
    const matchesSearch =
      s.billNo.toLowerCase().includes(q) ||
      s.clientName.toLowerCase().includes(q) ||
      (s.mobNo && s.mobNo.toLowerCase().includes(q));
    const matchesStatus =
      statusFilter === 'All' ? true : s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Sales Invoicing & Ledger Records</span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono border border-slate-700">
              {sales.length} Invoices
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Formula: Total Sale = Subtotal + Packaging + Dispatch • COGS & Profit auto-computed
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
            title="Refresh Invoices"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenNewInvoice}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create New Invoice</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by Bill No (e.g. SW-2026-0040), Customer Name, or Mobile Number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setStatusFilter('All')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'All' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Bills
            </button>
            <button
              onClick={() => setStatusFilter('Pending')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'Pending' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pending ({sales.filter(s => s.status === 'Pending').length})
            </button>
            <button
              onClick={() => setStatusFilter('Paid')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'Paid' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Paid ({sales.filter(s => s.status === 'Paid').length})
            </button>
          </div>
        </div>
      </div>

      {/* Sales Invoices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
                <th className="py-3 px-4">Date / Bill No</th>
                <th className="py-3 px-4">Client / Destination</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4 text-right">Total Sale (₹)</th>
                <th className="py-3 px-4 text-right">Received (₹)</th>
                <th className="py-3 px-4 text-right">Pending (₹)</th>
                <th className="py-3 px-4 text-right">Gross Profit (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredSales.length > 0 ? (
                filteredSales.map(s => (
                  <tr key={s.saleId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-white text-xs">{s.billNo}</div>
                      <div className="text-[11px] text-slate-400">{formatDate(s.date)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{s.clientName}</div>
                      <div className="text-[11px] text-slate-400">
                        {s.mobNo ? `📞 ${s.mobNo} • ` : ''}{s.address}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {s.items && s.items.length > 0 ? (
                        <div>
                          <span className="font-medium text-slate-200">
                            {s.items[0].itemName} (x{s.items[0].qty})
                          </span>
                          {s.items.length > 1 && (
                            <span className="text-[10px] bg-slate-800 text-amber-400 px-1.5 py-0.5 rounded ml-1 font-mono">
                              +{s.items.length - 1} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span>{s.itemName} (x{s.qty})</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      {formatCurrency(s.totalSale)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-emerald-400">
                      {formatCurrency(s.totalReceived)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span className={s.pendingAmount > 0 ? 'text-rose-400' : 'text-slate-400'}>
                        {formatCurrency(s.pendingAmount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400/90 font-semibold">
                      +{formatCurrency(s.grossProfit)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          s.status === 'Paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onOpenPrintModal(s)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
                          title="Print / PDF Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {s.pendingAmount > 0 && (
                          <button
                            onClick={() => onOpenPaymentModal(s)}
                            className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1"
                            title="Collect Installment"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Pay</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No sales invoices found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create New Multi-Item Invoice Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-4">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                  <Receipt className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-white">Create New Wholesale Invoice</h3>
                  <p className="text-xs text-slate-400">Bill No: {billNo} • Sandeep Wholesale</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Customer Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Invoice Date <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Client / Party Name <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Verma Kite Centre"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Mobile Number <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9839012345"
                    value={mobNo}
                    onChange={e => setMobNo(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Delivery Address / Market City
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aminabad Market, Lucknow / Nawabganj, Barabanki"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Multi-Item Line Rows */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Invoice Line Items ({items.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Another Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {items.map((row, idx) => {
                    const matchedProduct = products.find(
                      p => p.itemName.toLowerCase() === row.itemName.toLowerCase()
                    );
                    const lineAmount = row.qty * row.rate;

                    return (
                      <div
                        key={idx}
                        className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 grid grid-cols-12 gap-2 items-center text-xs"
                      >
                        <div className="col-span-5">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Product</label>
                          <select
                            value={row.itemName}
                            onChange={e => handleItemChange(idx, e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1.5 px-2 text-white text-xs focus:outline-none focus:border-amber-500 truncate"
                          >
                            {products.map(p => (
                              <option key={p.productId} value={p.itemName}>
                                {p.itemName} (Stock: {p.currentStock})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-2">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Qty</label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={row.qty}
                            onChange={e => handleQtyChange(idx, Number(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1.5 px-2 text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Rate (₹)</label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={row.rate}
                            onChange={e => handleRateChange(idx, Number(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1.5 px-2 text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                          />
                        </div>

                        <div className="col-span-2 text-right">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Line Total</label>
                          <span className="font-mono font-bold text-amber-400 text-xs">
                            {formatCurrency(lineAmount)}
                          </span>
                        </div>

                        <div className="col-span-1 text-right">
                          <button
                            type="button"
                            disabled={items.length <= 1}
                            onClick={() => handleRemoveItemRow(idx)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 disabled:opacity-30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Extra Charges & Installment Payment 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Packaging Charges (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={packagingCharges}
                    onChange={e => setPackagingCharges(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Dispatch / Transport (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={dispatchCharges}
                    onChange={e => setDispatchCharges(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Initial Payment 1 (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={totalSale}
                    value={payment1}
                    onChange={e => setPayment1(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Dynamic Ledger Summary Card */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Items Subtotal:</span>
                  <div className="font-mono font-bold text-white text-sm mt-0.5">
                    {formatCurrency(subtotal)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Grand Total Sale:</span>
                  <div className="font-mono font-extrabold text-amber-400 text-base mt-0.5">
                    {formatCurrency(totalSale)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Balance Pending:</span>
                  <div className={`font-mono font-bold text-sm mt-0.5 ${pendingBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {formatCurrency(pendingBalance)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Est. Gross Profit:</span>
                  <div className="font-mono font-bold text-emerald-400 text-sm mt-0.5">
                    +{formatCurrency(estimatedGrossProfit)}
                  </div>
                </div>
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
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <span>Generating Bill...</span>
                  ) : (
                    <>
                      <Receipt className="w-4 h-4" />
                      <span>Save & Print Invoice</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
