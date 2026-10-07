import React, { useState } from 'react';
import { X, CreditCard, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import { Sale } from '../types/erp';
import { erpService } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';

interface PaymentModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (updatedSale: Sale) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  sale,
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  if (!isOpen || !sale) return null;

  const [amount, setAmount] = useState<number>(sale.pendingAmount || 0);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [mode, setMode] = useState<string>('Cash');
  const [reference, setReference] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const nextInstallmentNum = !sale.payment1 ? 1 : !sale.payment2 ? 2 : 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError('Please enter a valid amount greater than ₹0.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const updated = await erpService.recordPayment({
        billNo: sale.billNo,
        amount: Number(amount),
        date,
        mode,
        reference,
      });
      onPaymentSuccess(updated);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Failed to record payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-white">Record Installment Payment</h3>
              <p className="text-xs text-slate-400">
                Bill #{sale.billNo} • Installment #{nextInstallmentNum}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Bill Summary Card */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Customer:</span>
              <span className="font-semibold text-white">{sale.clientName}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Total Bill Amount:</span>
              <span className="font-mono font-semibold text-white">{formatCurrency(sale.totalSale)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Already Received:</span>
              <span className="font-mono font-semibold text-emerald-400">{formatCurrency(sale.totalReceived)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-bold text-rose-400">
              <span>Outstanding Balance:</span>
              <span className="font-mono">{formatCurrency(sale.pendingAmount)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Payment Amount (₹) <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-mono">₹</span>
              <input
                type="number"
                min="1"
                max={sale.pendingAmount > 0 ? sale.pendingAmount : undefined}
                required
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-2 pl-8 pr-4 text-white text-sm focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setAmount(sale.pendingAmount)}
                className="text-[11px] text-amber-400 hover:text-amber-300 underline"
              >
                Pay Full Balance ({formatCurrency(sale.pendingAmount)})
              </button>
              {sale.pendingAmount > 1000 && (
                <button
                  type="button"
                  onClick={() => setAmount(Math.round(sale.pendingAmount / 2))}
                  className="text-[11px] text-slate-400 hover:text-slate-300 underline"
                >
                  Pay Half ({formatCurrency(Math.round(sale.pendingAmount / 2))})
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Payment Date <span className="text-amber-400">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Payment Mode <span className="text-amber-400">*</span>
              </label>
              <select
                value={mode}
                onChange={e => setMode(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Reference / Transaction ID / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. UPI Ref 3094857492 or Cash received at counter"
              value={reference}
              onChange={e => setReference(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-amber-500 placeholder:text-slate-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <span>Recording...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Payment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
