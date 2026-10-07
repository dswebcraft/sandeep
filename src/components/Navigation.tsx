import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Receipt, 
  Search, 
  BarChart3, 
  Settings2, 
  Cloud, 
  CloudOff, 
  Database,
  ArrowUpRight,
  Menu,
  X,
  KeyRound,
  LogOut,
  UserCheck
} from 'lucide-react';
import { StoreProfile, AuthUser } from '../types/erp';

interface NavigationProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  store: StoreProfile;
  isLiveMode: boolean;
  onBackupTrigger: () => void;
  isBackingUp: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  currentUser: AuthUser | null;
  onOpenChangePassword: () => void;
  onLogout: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  setCurrentTab,
  store,
  isLiveMode,
  onBackupTrigger,
  isBackingUp,
  mobileMenuOpen,
  setMobileMenuOpen,
  currentUser,
  onOpenChangePassword,
  onLogout,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Inventory & Stock', icon: Package },
    { id: 'purchases', label: 'Purchases', icon: ShoppingBag },
    { id: 'sales', label: 'Sales & Invoices', icon: Receipt },
    { id: 'search', label: 'Customer Search', icon: Search },
    { id: 'reports', label: 'Reports & Profit', icon: BarChart3 },
    { id: 'settings', label: 'Google Sheets / GAS', icon: Settings2 },
  ];

  return (
    <>
      {/* Top Banner & Header */}
      <header className="no-print bg-slate-950 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
        {/* Store Profile Top Strip */}
        <div className="bg-gradient-to-r from-amber-600/20 via-slate-900 to-amber-600/10 px-4 py-1.5 border-b border-slate-800/80 text-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-amber-400 tracking-wide uppercase">
                {store.name}
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-300">
                📞 <a href={`tel:${store.mobile}`} className="hover:text-amber-400 font-medium">{store.mobile}</a>
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">
                📍 {store.address}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {isLiveMode ? (
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <Cloud className="w-3 h-3" />
                  <span>Google Sheets Connected</span>
                </div>
              ) : (
                <div 
                  onClick={() => setCurrentTab('settings')}
                  className="flex items-center gap-1.5 text-amber-300 font-medium text-[11px] bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 cursor-pointer hover:bg-amber-500/20 transition-colors"
                >
                  <CloudOff className="w-3 h-3" />
                  <span>Demo / Local Mode (Click to Link Sheet)</span>
                </div>
              )}

              <button
                onClick={onBackupTrigger}
                disabled={isBackingUp}
                className="flex items-center gap-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-0.5 rounded-lg border border-slate-700 transition-colors active:scale-95 disabled:opacity-50"
                title="Create dated spreadsheet backup inside Google Drive folder DS WebCraft ERP/Sandeep Wholesale/Backups/"
              >
                <Database className="w-3 h-3 text-amber-400" />
                <span>{isBackingUp ? 'Backing up...' : 'Backup to Drive'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Navbar Bar */}
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div 
              onClick={() => setCurrentTab('dashboard')} 
              className="cursor-pointer flex items-center gap-2.5"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 text-lg">
                SW
              </div>
              <div>
                <div className="text-base font-bold text-white leading-tight tracking-tight flex items-center gap-1.5">
                  Sandeep Wholesale ERP
                  <span className="text-[10px] bg-slate-800 text-amber-400 border border-slate-700 px-1.5 py-0.2 rounded font-mono">
                    v2.5
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 leading-tight">
                  Patang & Manjha Wholesale Ledger Engine
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick Action & Auth Buttons */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => setCurrentTab('sales')}
                className="flex items-center gap-1.5 text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl transition-all"
              >
                <span>+ New Bill</span>
              </button>
              <button
                onClick={() => setCurrentTab('purchases')}
                className="flex items-center gap-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl transition-all"
              >
                <span>+ Purchase</span>
              </button>
            </div>

            {/* Auth User Menu & Logout */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
              <button
                onClick={onOpenChangePassword}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 px-2.5 py-1.5 rounded-xl transition-colors shadow-sm"
                title="Click to Change Password"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono text-slate-200 font-semibold">{currentUser?.loginId || 'admin'}</span>
              </button>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors border border-transparent hover:border-rose-500/20"
                title="Logout from ERP"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="pt-2 mt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenChangePassword();
                }}
                className="flex items-center justify-center gap-2 py-2 rounded-xl text-xs bg-slate-800 text-slate-200 border border-slate-700 font-medium"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Password</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="flex items-center justify-center gap-2 py-2 rounded-xl text-xs bg-rose-500/10 text-rose-300 border border-rose-500/30 font-medium"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
