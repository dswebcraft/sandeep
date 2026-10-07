/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Product, 
  Purchase, 
  Sale, 
  DashboardSummary, 
  StoreProfile,
  AuthUser 
} from './types/erp';
import { erpService } from './services/api';
import { authService } from './services/auth';
import { Navigation } from './components/Navigation';
import { LoginView } from './components/LoginView';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { DashboardView } from './components/DashboardView';
import { ProductsView } from './components/ProductsView';
import { PurchasesView } from './components/PurchasesView';
import { SalesView } from './components/SalesView';
import { CustomerSearchView } from './components/CustomerSearchView';
import { ReportsView } from './components/ReportsView';
import { SettingsAndGASView } from './components/SettingsAndGASView';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { PaymentModal } from './components/PaymentModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(authService.getCurrentUser());
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [store, setStore] = useState<StoreProfile>(erpService.getStoreProfile());
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [printSale, setPrintSale] = useState<Sale | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState<boolean>(false);
  const [paymentSale, setPaymentSale] = useState<Sale | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);

  // Backup and Toasts
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadAllData();
    }
  }, [currentUser]);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    showToast(`Namaste ${user.name}! ERP me swagat hai.`, 'success');
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    showToast('Aap safely logout ho gaye hain.', 'info');
  };

  const handleChangePasswordSuccess = (msg: string) => {
    showToast(msg, 'success');
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [prodRes, purRes, saleRes, sumRes] = await Promise.all([
        erpService.getProducts(),
        erpService.getPurchases(),
        erpService.getSales(),
        erpService.getDashboardSummary(),
      ]);

      setProducts(prodRes);
      setPurchases(purRes);
      setSales(saleRes);
      setSummary(sumRes);
      setStore(erpService.getStoreProfile());
    } catch (err) {
      console.error('Error loading ERP data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackupTrigger = async () => {
    try {
      setIsBackingUp(true);
      const res = await erpService.createBackup();
      if (res.isSimulated) {
        showToast(`Drive Backup Created (Local Snapshot): ${res.backupName}`, 'info');
      } else {
        showToast(`Spreadsheet backup saved to Drive: ${res.backupName}`, 'success');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Backup error: ${msg}`, 'error');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleOpenPrint = (sale: Sale) => {
    setPrintSale(sale);
    setPrintModalOpen(true);
  };

  const handleOpenPayment = (sale: Sale) => {
    setPaymentSale(sale);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (updatedSale: Sale) => {
    showToast(`Payment of ₹${(updatedSale.totalReceived).toLocaleString('en-IN')} recorded on Bill #${updatedSale.billNo}!`, 'success');
    loadAllData();
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
            <div
              className={`px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center gap-2.5 backdrop-blur-md ${
                toastMessage.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                  : toastMessage.type === 'error'
                  ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                  : 'bg-amber-950/90 border-amber-500/40 text-amber-200'
              }`}
            >
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>{toastMessage.text}</span>
            </div>
          </div>
        )}
        <LoginView store={store} onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center gap-2.5 backdrop-blur-md ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : toastMessage.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : 'bg-amber-950/90 border-amber-500/40 text-amber-200'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Navigation Header */}
      <Navigation
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        store={store}
        isLiveMode={erpService.isLiveMode()}
        onBackupTrigger={handleBackupTrigger}
        isBackingUp={isBackingUp}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        currentUser={currentUser}
        onOpenChangePassword={() => setChangePasswordModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            summary={summary}
            loading={loading}
            onNavigateTab={setCurrentTab}
            onOpenPaymentModal={handleOpenPayment}
            allSales={sales}
          />
        )}

        {currentTab === 'products' && (
          <ProductsView
            products={products}
            loading={loading}
            onRefresh={loadAllData}
            onOpenRecordPurchase={() => setCurrentTab('purchases')}
          />
        )}

        {currentTab === 'purchases' && (
          <PurchasesView
            purchases={purchases}
            products={products}
            loading={loading}
            onRefresh={loadAllData}
          />
        )}

        {currentTab === 'sales' && (
          <SalesView
            sales={sales}
            products={products}
            loading={loading}
            onRefresh={loadAllData}
            onOpenPrintModal={handleOpenPrint}
            onOpenPaymentModal={handleOpenPayment}
          />
        )}

        {currentTab === 'search' && (
          <CustomerSearchView
            sales={sales}
            onOpenPrintModal={handleOpenPrint}
            onOpenPaymentModal={handleOpenPayment}
          />
        )}

        {currentTab === 'reports' && <ReportsView />}

        {currentTab === 'settings' && (
          <SettingsAndGASView
            store={store}
            isLiveMode={erpService.isLiveMode()}
            onRefreshAll={loadAllData}
            onBackupTrigger={handleBackupTrigger}
            isBackingUp={isBackingUp}
            onOpenChangePassword={() => setChangePasswordModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            © 2026 {store.name} — Barabanki, Uttar Pradesh. Powered by Google Sheets Database & Apps Script API.
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Mobile: <strong className="text-slate-400">{store.mobile}</strong></span>
            <span>•</span>
            <span>Ledger: <strong className="text-slate-400">patangbusiness_GoogleReady</strong></span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <InvoicePrintModal
        sale={printSale}
        store={store}
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
      />

      <PaymentModal
        sale={paymentSale}
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <ChangePasswordModal
        isOpen={changePasswordModalOpen}
        onClose={() => setChangePasswordModalOpen(false)}
        onSuccess={handleChangePasswordSuccess}
      />
    </div>
  );
}
