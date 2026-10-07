import React, { useState } from 'react';
import { 
  Search, 
  User, 
  Phone, 
  Receipt, 
  CreditCard, 
  Printer, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Share2, 
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { Sale } from '../types/erp';
import { erpService } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';

interface CustomerSearchViewProps {
  sales: Sale[];
  onOpenPrintModal: (sale: Sale) => void;
  onOpenPaymentModal: (sale: Sale) => void;
}

export const CustomerSearchView: React.FC<CustomerSearchViewProps> = ({
  sales,
  onOpenPrintModal,
  onOpenPaymentModal,
}) => {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [searchResults, setSearchResults] = useState<Sale[]>([]);
  const [totalBilled, setTotalBilled] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) {
      setSearchResults([]);
      setSearched(false);
      return;
    }

    try {
      setSearching(true);
      const res = await erpService.searchCustomer(query);
      setSearchResults(res.results);
      setTotalBilled(res.totalBilled);
      setTotalPaid(res.totalPaid);
      setTotalPending(res.totalPending);
      setSearched(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const generateWhatsAppReminder = (sale: Sale) => {
    const cleanPhone = (sale.mobNo || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const text = encodeURIComponent(
      `Namaste ${sale.clientName} ji, This is a gentle payment reminder from Sandeep Wholesale, Barabanki regarding Bill #${sale.billNo} dated ${formatDate(sale.date)}. Total Bill: ₹${sale.totalSale.toLocaleString('en-IN')}, Received: ₹${sale.totalReceived.toLocaleString('en-IN')}, Outstanding Balance: ₹${sale.pendingAmount.toLocaleString('en-IN')}. Please arrange payment at your earliest convenience. Mobile: 9027855051. Thank you!`
    );
    window.open(`https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>Customer Ledger & Outstanding Balance Search</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Instantly look up complete buyer credit history, past invoice installments (Payment 1, 2, 3), and outstanding dues by Mobile Number or Bill Number.
        </p>

        {/* Search Input Box */}
        <form onSubmit={handleSearch} className="mt-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Enter Customer Mobile No (e.g. 9839012345) or Bill No (e.g. SW-2026-0040)..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50 shrink-0"
          >
            {searching ? 'Searching Ledger...' : 'Search Ledger'}
          </button>
        </form>

        {/* Quick Quicklink Suggestions */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span>Quick queries:</span>
          {sales.slice(0, 4).map(s => (
            <button
              key={s.saleId}
              type="button"
              onClick={() => {
                setQuery(s.mobNo || s.billNo);
                erpService.searchCustomer(s.mobNo || s.billNo).then(res => {
                  setSearchResults(res.results);
                  setTotalBilled(res.totalBilled);
                  setTotalPaid(res.totalPaid);
                  setTotalPending(res.totalPending);
                  setSearched(true);
                });
              }}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700"
            >
              {s.mobNo ? `${s.clientName} (${s.mobNo})` : s.billNo}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards if searched */}
      {searched && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Cumulative Billed
            </span>
            <div className="mt-2 text-2xl font-extrabold text-white font-mono">
              {formatCurrency(totalBilled)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Across {searchResults.length} bills
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Amount Received
            </span>
            <div className="mt-2 text-2xl font-extrabold text-emerald-400 font-mono">
              {formatCurrency(totalPaid)}
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-1">
              Paid across installments
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Net Outstanding Pending
            </span>
            <div className={`mt-2 text-2xl font-extrabold font-mono ${totalPending > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {formatCurrency(totalPending)}
            </div>
            <div className="text-[11px] text-rose-400/80 mt-1">
              {totalPending > 0 ? 'Action required: collect payment' : 'Account fully settled'}
            </div>
          </div>
        </div>
      )}

      {/* Search Results List */}
      {searched && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Matching Ledger Invoices ({searchResults.length})
          </h3>

          {searchResults.length > 0 ? (
            searchResults.map(sale => (
              <div
                key={sale.saleId}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 hover:border-slate-700 transition-all"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">{sale.clientName}</span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          sale.status === 'Paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {sale.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                      <span>Bill: <strong className="font-mono text-white">{sale.billNo}</strong></span>
                      <span>Date: {formatDate(sale.date)}</span>
                      <span>📞 {sale.mobNo || 'N/A'}</span>
                      <span>📍 {sale.address}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onOpenPrintModal(sale)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Bill</span>
                    </button>

                    {sale.pendingAmount > 0 && (
                      <>
                        <button
                          onClick={() => onOpenPaymentModal(sale)}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Collect Payment</span>
                        </button>

                        {sale.mobNo && (
                          <button
                            onClick={() => generateWhatsAppReminder(sale)}
                            className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            title="Send WhatsApp payment reminder"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp Reminder</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Ledger Installments Timeline */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Installment 1:</span>
                    <span className="font-mono font-bold text-white text-sm">
                      {sale.payment1 > 0 ? formatCurrency(sale.payment1) : '₹0'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {sale.date1 ? formatDate(sale.date1) : 'Not paid'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Installment 2:</span>
                    <span className="font-mono font-bold text-white text-sm">
                      {sale.payment2 > 0 ? formatCurrency(sale.payment2) : '₹0'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {sale.date2 ? formatDate(sale.date2) : 'Not paid'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Installment 3:</span>
                    <span className="font-mono font-bold text-white text-sm">
                      {sale.payment3 > 0 ? formatCurrency(sale.payment3) : '₹0'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {sale.date3 ? formatDate(sale.date3) : 'Not paid'}
                    </span>
                  </div>

                  <div className="border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-3">
                    <span className="text-slate-400 block text-[11px]">Outstanding Balance:</span>
                    <span className={`font-mono font-extrabold text-sm ${sale.pendingAmount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {formatCurrency(sale.pendingAmount)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Total Bill: {formatCurrency(sale.totalSale)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="font-semibold text-white">No ledger bills found for &quot;{query}&quot;</p>
              <p className="text-xs mt-1 text-slate-500">
                Check whether you typed the 10-digit mobile number or bill number correctly.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
