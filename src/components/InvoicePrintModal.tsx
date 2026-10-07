import React from 'react';
import { X, Printer, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { Sale, StoreProfile } from '../types/erp';
import { formatCurrency, formatDate } from '../utils/formatters';

interface InvoicePrintModalProps {
  sale: Sale | null;
  store: StoreProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  sale,
  store,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden print:border-none print:shadow-none print:bg-white print:w-full print:max-w-none">
        {/* Action Header - hidden when printing */}
        <div className="no-print bg-slate-950/80 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <Printer className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-white">Tax / Wholesale Invoice</h3>
              <p className="text-xs text-slate-400">Bill #{sale.billNo} • Ready for A4 Print & PDF</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet - Styled as clean A4 document */}
        <div className="p-6 sm:p-10 bg-white text-slate-900 print:p-6 print:m-0 font-sans min-h-[600px] text-sm">
          {/* Top Header */}
          <div className="border-b-2 border-slate-900 pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded text-xs font-bold tracking-wider uppercase bg-amber-100 text-amber-900 mb-2">
                  Wholesale Tax Invoice
                </span>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 uppercase">
                  {store.name}
                </h1>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  {store.tagline || 'Leading Kite, Manjha & Festival Supplies Merchant'}
                </p>
                <div className="mt-2 text-xs text-slate-700 space-y-0.5">
                  <p className="font-semibold">
                    📍 Address: <span className="font-normal">{store.address}</span>
                  </p>
                  <p className="font-semibold">
                    📞 Mobile: <span className="font-normal">{store.mobile}</span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block bg-slate-100 rounded-lg p-3 text-left min-w-[200px] border border-slate-200">
                  <div className="text-xs text-slate-500 uppercase font-semibold">Bill No.</div>
                  <div className="text-lg font-bold text-slate-900 font-mono">{sale.billNo}</div>
                  <div className="text-xs text-slate-500 uppercase font-semibold mt-2">Date</div>
                  <div className="text-sm font-semibold text-slate-900">{formatDate(sale.date)}</div>
                  <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Status:</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        sale.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {sale.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bill To Customer Section */}
          <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Billed To (Client / Consignee)
              </div>
              <div className="text-base font-bold text-slate-900">{sale.clientName}</div>
              <div className="text-xs text-slate-700 mt-1">
                <span className="font-semibold">Delivery Address:</span> {sale.address || 'Barabanki, UP'}
              </div>
              <div className="text-xs text-slate-700 mt-0.5">
                <span className="font-semibold">Contact Mobile:</span> {sale.mobNo || 'N/A'}
              </div>
            </div>
            <div className="text-right text-xs text-slate-600 flex flex-col justify-end">
              <div>
                <span className="font-semibold text-slate-700">Dispatch Mode:</span> Road Transport / Direct Handover
              </div>
              <div className="mt-1">
                <span className="font-semibold text-slate-700">Payment Terms:</span> Multi-Installment Ledger Credit
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-hidden border border-slate-300 rounded-lg mb-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-right w-24">Quantity</th>
                  <th className="py-2.5 px-3 text-right w-28">Sale Rate (₹)</th>
                  <th className="py-2.5 px-3 text-right w-32">Total Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {sale.items && sale.items.length > 0 ? (
                  sale.items.map((item, index) => (
                    <tr key={index} className={index % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                      <td className="py-2.5 px-3 text-center text-slate-500 font-medium">{index + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{item.itemName}</td>
                      <td className="py-2.5 px-3 text-right font-medium">{item.qty}</td>
                      <td className="py-2.5 px-3 text-right font-mono">₹{item.rate.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                        ₹{(item.qty * item.rate).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-2.5 px-3 text-center">1</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{sale.itemName}</td>
                    <td className="py-2.5 px-3 text-right">{sale.qty || 1}</td>
                    <td className="py-2.5 px-3 text-right font-mono">₹{(sale.saleRate || 0).toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono">
                      ₹{((sale.qty || 1) * (sale.saleRate || 0)).toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Charges and Balance Summary */}
          <div className="grid grid-cols-12 gap-6 mb-6">
            {/* Payment Installments Ledger */}
            <div className="col-span-7 bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Multi-Installment Payment Record
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-600 font-medium">
                    Payment 1 {sale.date1 ? `(${formatDate(sale.date1)})` : ''}:
                  </span>
                  <span className="font-mono font-semibold text-slate-900">
                    {sale.payment1 > 0 ? formatCurrency(sale.payment1) : '₹0'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-600 font-medium">
                    Payment 2 {sale.date2 ? `(${formatDate(sale.date2)})` : ''}:
                  </span>
                  <span className="font-mono font-semibold text-slate-900">
                    {sale.payment2 > 0 ? formatCurrency(sale.payment2) : '₹0'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-600 font-medium">
                    Payment 3 {sale.date3 ? `(${formatDate(sale.date3)})` : ''}:
                  </span>
                  <span className="font-mono font-semibold text-slate-900">
                    {sale.payment3 > 0 ? formatCurrency(sale.payment3) : '₹0'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 font-bold text-emerald-800">
                  <span>Total Amount Received:</span>
                  <span className="font-mono text-sm">{formatCurrency(sale.totalReceived)}</span>
                </div>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="col-span-5 bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-700">
                  <span>Items Subtotal:</span>
                  <span className="font-mono font-semibold">₹{sale.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Packaging Charges:</span>
                  <span className="font-mono font-semibold">₹{(sale.packagingCharges || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Dispatch / Freight Charges:</span>
                  <span className="font-mono font-semibold">₹{(sale.dispatchCharges || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t-2 border-slate-300 flex justify-between items-center text-sm font-extrabold text-slate-900">
                  <span>Total Bill Amount:</span>
                  <span className="font-mono text-base">{formatCurrency(sale.totalSale)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-emerald-700 font-semibold pt-1">
                  <span>Less: Total Received:</span>
                  <span className="font-mono">-{formatCurrency(sale.totalReceived)}</span>
                </div>
                <div
                  className={`pt-2 border-t border-slate-300 flex justify-between items-center font-bold text-sm ${
                    sale.pendingAmount > 0 ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  <span>Balance Pending:</span>
                  <span className="font-mono text-base">{formatCurrency(sale.pendingAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Signature Footer */}
          <div className="border-t border-slate-300 pt-6 mt-8 flex justify-between items-end text-xs text-slate-600">
            <div className="max-w-md space-y-1">
              <div className="font-bold uppercase tracking-wider text-slate-800 text-[11px]">Terms & Conditions:</div>
              <p>1. Goods once sold will not be returned or exchanged without the original bill.</p>
              <p>2. Any dispute shall be subject to Barabanki, Uttar Pradesh jurisdiction only.</p>
              <p>3. Please inspect packing and fragile items upon receipt.</p>
            </div>
            <div className="text-center min-w-[200px]">
              <div className="h-14 flex items-end justify-center">
                <span className="font-serif italic text-slate-400 text-sm">Sandeep Wholesale</span>
              </div>
              <div className="border-t border-slate-400 pt-1 font-bold text-slate-800 uppercase text-[11px]">
                Authorized Signatory
              </div>
              <div className="text-[10px] text-slate-500">For {store.name}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
