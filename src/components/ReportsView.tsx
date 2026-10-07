import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  Clock, 
  Package, 
  Calendar,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import { erpService } from '../services/api';
import { formatCurrency, formatDate, exportToCSV } from '../utils/formatters';

export const ReportsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'topSelling' | 'monthly' | 'yearly'>('pending');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<{
    topSellingItems: Array<{ itemName: string; totalQty: number; totalRevenue: number; totalProfit: number }>;
    customerPendingReport: Array<{
      billNo: string;
      date: string;
      clientName: string;
      mobNo: string;
      address: string;
      totalSale: number;
      totalReceived: number;
      pendingAmount: number;
      status: string;
    }>;
    monthlyProfitBreakdown: Array<{
      month: string;
      sales: number;
      cogs: number;
      profit: number;
      marginPercent: number;
    }>;
  } | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await erpService.getReports();
      setReportData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData) return;

    if (activeTab === 'pending') {
      const headers = ['Bill No', 'Date', 'Customer Name', 'Mobile No', 'Address', 'Total Bill (INR)', 'Received (INR)', 'Pending Balance (INR)', 'Status'];
      const rows = reportData.customerPendingReport.map(r => [
        r.billNo,
        r.date,
        r.clientName,
        r.mobNo,
        r.address,
        r.totalSale,
        r.totalReceived,
        r.pendingAmount,
        r.status
      ]);
      exportToCSV('Sandeep_Wholesale_Customer_Pending_Report', headers, rows);
    } else if (activeTab === 'topSelling') {
      const headers = ['Rank', 'Item Name', 'Total Qty Sold', 'Total Revenue (INR)', 'Total Profit (INR)'];
      const rows = reportData.topSellingItems.map((item, idx) => [
        idx + 1,
        item.itemName,
        item.totalQty,
        item.totalRevenue,
        item.totalProfit
      ]);
      exportToCSV('Sandeep_Wholesale_Top_Selling_Items', headers, rows);
    } else if (activeTab === 'monthly') {
      const headers = ['Month', 'Total Sales (INR)', 'COGS / Cost Price (INR)', 'Gross Profit (INR)', 'Margin %'];
      const rows = reportData.monthlyProfitBreakdown.map(m => [
        m.month,
        m.sales,
        m.cogs,
        m.profit,
        `${m.marginPercent}%`
      ]);
      exportToCSV('Sandeep_Wholesale_Monthly_Profit_Report_Jan_Dec', headers, rows);
    } else if (activeTab === 'yearly') {
      const totalSales = reportData.monthlyProfitBreakdown.reduce((acc, m) => acc + m.sales, 0);
      const totalCogs = reportData.monthlyProfitBreakdown.reduce((acc, m) => acc + m.cogs, 0);
      const totalProfit = reportData.monthlyProfitBreakdown.reduce((acc, m) => acc + m.profit, 0);
      const headers = ['Financial Year', 'Turnover / Sales (INR)', 'COGS (INR)', 'Gross Profit (INR)', 'Net Margin %'];
      const rows = [
        ['FY 2026-27', totalSales, totalCogs, totalProfit, `${((totalProfit / (totalSales || 1)) * 100).toFixed(1)}%`]
      ];
      exportToCSV('Sandeep_Wholesale_Annual_Profit_Summary', headers, rows);
    }
  };

  if (loading || !reportData) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalOutstanding = reportData.customerPendingReport.reduce((acc, c) => acc + c.pendingAmount, 0);
  const totalYtdProfit = reportData.monthlyProfitBreakdown.reduce((acc, m) => acc + m.profit, 0);

  return (
    <div className="space-y-6">
      {/* Header and Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Financial Intelligence & Ledger Reports</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time calculations for debtors ageing, product velocity, and profit margins.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-600/20 active:scale-95 shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export Current Report (CSV)</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'pending'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-300 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Customer Pending Report ({reportData.customerPendingReport.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('topSelling')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'topSelling'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-300 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Top Selling Items ({reportData.topSellingItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('monthly')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'monthly'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-300 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Monthly Profit (Jan - Dec)</span>
        </button>

        <button
          onClick={() => setActiveTab('yearly')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'yearly'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-300 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Year-Wise Summary</span>
        </button>
      </div>

      {/* Tab 1: Customer Pending Report */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400">Total Unpaid Customer Balance:</span>
              <div className="text-xl font-bold font-mono text-rose-400 mt-0.5">
                {formatCurrency(totalOutstanding)}
              </div>
            </div>
            <span className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded-full font-semibold">
              {reportData.customerPendingReport.length} Invoices Overdue
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
                    <th className="py-3 px-4">Bill No</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Mobile No</th>
                    <th className="py-3 px-4">Address / City</th>
                    <th className="py-3 px-4 text-right">Total Bill (₹)</th>
                    <th className="py-3 px-4 text-right">Received (₹)</th>
                    <th className="py-3 px-4 text-right">Pending Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {reportData.customerPendingReport.length > 0 ? (
                    reportData.customerPendingReport.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-white">{c.billNo}</td>
                        <td className="py-3 px-4 text-slate-400">{formatDate(c.date)}</td>
                        <td className="py-3 px-4 font-semibold text-white">{c.clientName}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">{c.mobNo || '-'}</td>
                        <td className="py-3 px-4 text-slate-400">{c.address}</td>
                        <td className="py-3 px-4 text-right font-mono">{formatCurrency(c.totalSale)}</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-400">{formatCurrency(c.totalReceived)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-400 text-sm">
                          {formatCurrency(c.pendingAmount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        No pending debts! All customer accounts are paid in full.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Top Selling Items */}
      {activeTab === 'topSelling' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">Rank</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4 text-right">Quantity Sold</th>
                  <th className="py-3 px-4 text-right">Revenue Generated (₹)</th>
                  <th className="py-3 px-4 text-right">Gross Profit Contribution (₹)</th>
                  <th className="py-3 px-4 text-right">Profit Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {reportData.topSellingItems.map((item, idx) => {
                  const marginPct = item.totalRevenue > 0
                    ? ((item.totalProfit / item.totalRevenue) * 100).toFixed(1)
                    : '0';

                  return (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 text-center font-bold font-mono text-amber-400">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {item.itemName}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-white">
                        {item.totalQty.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        {formatCurrency(item.totalRevenue)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        +{formatCurrency(item.totalProfit)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400/90 font-semibold">
                        {marginPct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Monthly Profit (Jan - Dec) */}
      {activeTab === 'monthly' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400">Year-To-Date Gross Profit:</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                {formatCurrency(totalYtdProfit)}
              </div>
            </div>
            <span className="text-xs text-slate-400">
              Formula: Gross Profit = Total Sale - COGS (Cost Price)
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
                    <th className="py-3 px-4">Month</th>
                    <th className="py-3 px-4 text-right">Sales Turnover (₹)</th>
                    <th className="py-3 px-4 text-right">Cost Price / COGS (₹)</th>
                    <th className="py-3 px-4 text-right">Gross Profit (₹)</th>
                    <th className="py-3 px-4 text-right">Gross Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {reportData.monthlyProfitBreakdown.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-white">{m.month}</td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-white">
                        {formatCurrency(m.sales)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">
                        {formatCurrency(m.cogs)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                        +{formatCurrency(m.profit)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-400/90">
                        {m.marginPercent}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Year-Wise Summary */}
      {activeTab === 'yearly' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white">Annual Financial Performance (FY 2026-27)</h3>
            <p className="text-xs text-slate-400">Consolidated ledger statistics for Sandeep Wholesale, Barabanki</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-semibold">Total Revenue</span>
              <div className="text-2xl font-bold font-mono text-white mt-1">
                {formatCurrency(reportData.monthlyProfitBreakdown.reduce((acc, m) => acc + m.sales, 0))}
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-semibold">Total Inventory Cost (COGS)</span>
              <div className="text-2xl font-bold font-mono text-slate-300 mt-1">
                {formatCurrency(reportData.monthlyProfitBreakdown.reduce((acc, m) => acc + m.cogs, 0))}
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-semibold">Net Gross Margin</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {formatCurrency(totalYtdProfit)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
