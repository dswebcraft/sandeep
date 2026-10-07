import React from 'react';
import { 
  ShoppingBag, 
  Receipt, 
  TrendingUp, 
  AlertTriangle, 
  Package, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  UserCheck, 
  CreditCard,
  PlusCircle,
  FileText
} from 'lucide-react';
import { DashboardSummary, Product, Sale } from '../types/erp';
import { formatCurrency, formatDate } from '../utils/formatters';

interface DashboardViewProps {
  summary: DashboardSummary | null;
  loading: boolean;
  onNavigateTab: (tab: string) => void;
  onOpenPaymentModal: (sale: Sale) => void;
  allSales: Sale[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  loading,
  onNavigateTab,
  onOpenPaymentModal,
  allSales,
}) => {
  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Calculating real-time ledger metrics...</p>
        </div>
      </div>
    );
  }

  const { kpis, monthlyChartData, lowStockList, topDebtors } = summary;

  // Compute maximum values for SVG bar scaling
  const maxMonthValue = Math.max(
    ...monthlyChartData.map(m => Math.max(m.sales, m.purchases, 1000))
  );

  const maxProfitValue = Math.max(
    ...monthlyChartData.map(m => Math.max(m.profit, 1000))
  );

  const profitMarginPercent = kpis.totalSales > 0 
    ? ((kpis.netProfit / kpis.totalSales) * 100).toFixed(1) 
    : '0';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Ledger Status: Active
              </span>
              <span className="text-xs text-slate-400">
                Source of Truth: patangbusiness_GoogleReady
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Executive Wholesale Dashboard
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Live automated calculations for stock, Cost of Goods Sold (COGS), gross profits, and multi-installment customer receivables.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigateTab('sales')}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Invoice</span>
            </button>
            <button
              onClick={() => onNavigateTab('purchases')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition-all border border-slate-700 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>Record Purchase</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5 KPI Cards (Source of Truth Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Purchases */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Purchases
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white font-mono">
              {formatCurrency(kpis.totalPurchases)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Qty * Purchase Rate sum
            </div>
          </div>
        </div>

        {/* Card 2: Total Sales */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Sales
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white font-mono">
              {formatCurrency(kpis.totalSales)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Includes packaging & dispatch
            </div>
          </div>
        </div>

        {/* Card 3: Net Profit */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Gross Profit
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-emerald-400 font-mono">
              {formatCurrency(kpis.netProfit)}
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-1 font-semibold">
              {profitMarginPercent}% Margin (Sales - COGS)
            </div>
          </div>
        </div>

        {/* Card 4: Total Pending Balance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Pending
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-rose-400 font-mono">
              {formatCurrency(kpis.totalPending)}
            </div>
            <div className="text-[11px] text-rose-400/80 mt-1">
              Receivable from {topDebtors.length} debtors
            </div>
          </div>
        </div>

        {/* Card 5: Current Stock */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Units Stock
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white font-mono">
              {kpis.currentStockCount.toLocaleString()} <span className="text-xs font-normal text-slate-400">units</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Purchased - Sold units
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid: Sales vs Purchases & Profit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Sales vs Purchases */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Monthly Sales vs Purchases</h3>
              <p className="text-xs text-slate-400">Volume turnover (Jan - Dec 2026)</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <span className="w-2.5 h-2.5 rounded bg-amber-400"></span>
                Sales
              </span>
              <span className="flex items-center gap-1.5 text-blue-400 font-medium">
                <span className="w-2.5 h-2.5 rounded bg-blue-500"></span>
                Purchases
              </span>
            </div>
          </div>

          <div className="h-64 flex items-end gap-2 pt-6 pb-2 border-b border-slate-800">
            {monthlyChartData.map((item, idx) => {
              const salesHeight = maxMonthValue > 0 ? (item.sales / maxMonthValue) * 100 : 0;
              const purchasesHeight = maxMonthValue > 0 ? (item.purchases / maxMonthValue) * 100 : 0;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 bg-slate-950 border border-slate-700 text-slate-100 text-[10px] rounded p-1.5 pointer-events-none whitespace-nowrap z-20 shadow-xl">
                    <p className="font-bold text-amber-400">{item.month}</p>
                    <p>Sales: {formatCurrency(item.sales)}</p>
                    <p>Purchases: {formatCurrency(item.purchases)}</p>
                  </div>

                  {/* Dual Bar */}
                  <div className="w-full flex items-end justify-center gap-1 h-full">
                    <div
                      style={{ height: `${Math.max(salesHeight, 4)}%` }}
                      className="w-1/2 bg-amber-400 hover:bg-amber-300 rounded-t transition-all"
                    ></div>
                    <div
                      style={{ height: `${Math.max(purchasesHeight, 4)}%` }}
                      className="w-1/2 bg-blue-500 hover:bg-blue-400 rounded-t transition-all"
                    ></div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 mt-2">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Monthly Profit Trend */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Monthly Gross Profit (Jan - Dec)</h3>
              <p className="text-xs text-slate-400">Total Sale minus Item COGS</p>
            </div>
            <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              YTD Net: {formatCurrency(kpis.netProfit)}
            </div>
          </div>

          <div className="h-64 flex items-end gap-2 pt-6 pb-2 border-b border-slate-800">
            {monthlyChartData.map((item, idx) => {
              const profitHeight = maxProfitValue > 0 ? (item.profit / maxProfitValue) * 100 : 0;
              const margin = item.sales > 0 ? ((item.profit / item.sales) * 100).toFixed(0) : '0';

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 bg-slate-950 border border-slate-700 text-slate-100 text-[10px] rounded p-1.5 pointer-events-none whitespace-nowrap z-20 shadow-xl">
                    <p className="font-bold text-emerald-400">{item.month}</p>
                    <p>Profit: {formatCurrency(item.profit)}</p>
                    <p>Margin: {margin}%</p>
                  </div>

                  <div
                    style={{ height: `${Math.max(profitHeight, 4)}%` }}
                    className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 rounded-t transition-all"
                  ></div>
                  <span className="text-[10px] font-semibold text-slate-400 mt-2">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two Column Section: Top Debtors vs Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Debtors Table (Pending Customer Receivables) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Top Outstanding Debtors</span>
                <span className="text-xs bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-mono">
                  {topDebtors.length} Pending
                </span>
              </h3>
              <p className="text-xs text-slate-400">Clients with unpaid bill balances</p>
            </div>
            <button
              onClick={() => onNavigateTab('search')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              <span>View All Ledgers</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">Customer / City</th>
                  <th className="py-2.5 px-3">Mobile No</th>
                  <th className="py-2.5 px-3 text-right">Bills</th>
                  <th className="py-2.5 px-3 text-right">Pending Amount</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {topDebtors.length > 0 ? (
                  topDebtors.map((d, index) => {
                    const matchedSale = allSales.find(
                      s => s.clientName === d.clientName && s.pendingAmount > 0
                    );

                    return (
                      <tr key={index} className="hover:bg-slate-800/40">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-white">{d.clientName}</div>
                          <div className="text-[11px] text-slate-400">{d.address}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300">
                          {d.mobNo || '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          {d.billsCount}
                        </td>
                        <td className="py-3 px-3 text-right font-bold font-mono text-rose-400">
                          {formatCurrency(d.pendingAmount)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {matchedSale && (
                            <button
                              onClick={() => onOpenPaymentModal(matchedSale)}
                              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-semibold transition-all inline-flex items-center gap-1"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>Collect</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No pending debtor balances! All accounts are fully settled.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts (Inventory & Auto Stock Formula) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Stock Attention Alerts</span>
                <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                  {lowStockList.length} Items
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Formula: Current Stock = Total Purchased - Total Sold
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('products')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              <span>Catalog</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {lowStockList.length > 0 ? (
              lowStockList.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-white text-xs">{item.itemName}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Purchased: {item.totalPurchased} • Sold: {item.totalSold}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        item.stockStatus === 'OUT OF STOCK'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {item.stockStatus}
                    </span>
                    <div className="text-xs font-mono font-bold text-white mt-1">
                      {item.currentStock} {item.unit}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                All inventory levels are healthy (Stock &gt; 10 units).
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
