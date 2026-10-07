import React, { useState } from 'react';
import { 
  Settings2, 
  Cloud, 
  CloudOff, 
  Database, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Download, 
  HardDrive, 
  Layers, 
  Building,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { StoreProfile } from '../types/erp';
import { erpService } from '../services/api';
import { authService } from '../services/auth';

interface SettingsAndGASViewProps {
  store: StoreProfile;
  isLiveMode: boolean;
  onRefreshAll: () => void;
  onBackupTrigger: () => void;
  isBackingUp: boolean;
  onOpenChangePassword?: () => void;
}

export const SettingsAndGASView: React.FC<SettingsAndGASViewProps> = ({
  store,
  isLiveMode,
  onRefreshAll,
  onBackupTrigger,
  isBackingUp,
  onOpenChangePassword,
}) => {
  const [gasUrl, setGasUrl] = useState(erpService.getGasUrl());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'connection' | 'script' | 'store' | 'security'>('connection');

  // Store profile fields
  const [storeName, setStoreName] = useState(store.name);
  const [storeMobile, setStoreMobile] = useState(store.mobile);
  const [storeAddress, setStoreAddress] = useState(store.address);
  const [storeTagline, setStoreTagline] = useState(store.tagline);
  const [profileSaved, setProfileSaved] = useState(false);

  const handleSaveUrl = () => {
    erpService.setGasUrl(gasUrl);
    setTestResult({
      success: true,
      message: gasUrl.trim()
        ? 'Web App URL saved! Click "Test Live Connection" to verify Google Sheets link.'
        : 'Reverted to local demo storage mode.',
    });
    onRefreshAll();
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const res = await erpService.testConnection(gasUrl);
      setTestResult(res);
      if (res.success) {
        erpService.setGasUrl(gasUrl);
        onRefreshAll();
      }
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setTesting(false);
    }
  };

  const handleCopyScript = () => {
    // Fetch Code.gs from repository
    fetch('/gas/Code.gs')
      .then(res => res.text())
      .then(text => {
        navigator.clipboard.writeText(text);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 3000);
      })
      .catch(() => {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 3000);
      });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: StoreProfile = {
      ...store,
      name: storeName.trim(),
      mobile: storeMobile.trim(),
      address: storeAddress.trim(),
      tagline: storeTagline.trim(),
    };
    erpService.updateStoreProfile(updated);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
    onRefreshAll();
  };

  const handleResetDemoData = () => {
    if (window.confirm('Reset all demo data to original "patangbusiness_GoogleReady" ledger records?')) {
      erpService.resetToDefaultDemo();
      onRefreshAll();
      alert('Local ledger reset to default festival wholesale dataset.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>Google Apps Script & Cloud Workspace Settings</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Connect your Google Spreadsheet database and automate Google Drive ledger backups.
        </p>
      </div>

      {/* Subtabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('connection')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'connection'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-300 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>Google Sheets Connection</span>
        </button>

        <button
          onClick={() => setActiveSubTab('script')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'script'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-300 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Google Apps Script (Code.gs)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('store')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'store'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-300 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Store Profile & Reset</span>
        </button>

        <button
          onClick={() => setActiveSubTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'security'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-300 hover:text-white bg-slate-900 border border-slate-800'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Security & Password</span>
        </button>
      </div>

      {/* Subtab 1: Connection & Web App URL */}
      {activeSubTab === 'connection' && (
        <div className="space-y-6">
          {/* Connection Status Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Database Link Status</span>
                  {isLiveMode ? (
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Google Sheets Live
                    </span>
                  ) : (
                    <span className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5">
                      <HardDrive className="w-3 h-3" />
                      Local Storage / Demo Mode
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  When linked, all Purchases, Sales, Payments, and Inventory changes sync directly with your Google Sheet tables (DB_Products, DB_Purchases, DB_Sales, DB_Payments).
                </p>
              </div>

              <button
                onClick={onBackupTrigger}
                disabled={isBackingUp}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition-all border border-slate-700 shrink-0 shadow-md active:scale-95 disabled:opacity-50"
              >
                <Database className="w-4 h-4 text-amber-400" />
                <span>{isBackingUp ? 'Creating Drive Backup...' : 'Backup Now to Google Drive'}</span>
              </button>
            </div>

            {/* Input URL Field */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                Deployed Google Apps Script Web App URL:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                  value={gasUrl}
                  onChange={e => setGasUrl(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveUrl}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95 shrink-0"
                  >
                    Save URL
                  </button>
                  <button
                    onClick={handleTestConnection}
                    disabled={testing || !gasUrl}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs transition-all active:scale-95 disabled:opacity-40 shrink-0 flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                    <span>{testing ? 'Testing...' : 'Test Ping'}</span>
                  </button>
                </div>
              </div>
            </div>

            {testResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                  testResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* 60 Seconds Step-by-Step Setup Guide */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>🚀 60-Second Google Workspace Setup Guide</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  1
                </div>
                <div className="font-semibold text-white">Create Google Sheet</div>
                <p className="text-slate-400 leading-relaxed">
                  Open <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-amber-400 underline">sheets.new</a> in your browser. Name it &quot;Sandeep Wholesale ERP Ledger&quot;.
                </p>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  2
                </div>
                <div className="font-semibold text-white">Paste Code.gs</div>
                <p className="text-slate-400 leading-relaxed">
                  Click <strong>Extensions &gt; Apps Script</strong>. Delete default code, click &quot;Copy Complete Code.gs&quot; below, and paste it. Run <code>initializeDatabase</code> once.
                </p>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  3
                </div>
                <div className="font-semibold text-white">Deploy Web App</div>
                <p className="text-slate-400 leading-relaxed">
                  Click <strong>Deploy &gt; New deployment &gt; Web app</strong>. Choose Execute as: <strong>Me</strong> and Who has access: <strong>Anyone</strong>. Copy the URL here!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Complete Code.gs Script Viewer */}
      {activeSubTab === 'script' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Google Apps Script Backend Source Code (Code.gs)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Full production backend with CORS support, database initializers, and Google Drive auto-backup.
              </p>
            </div>

            <button
              onClick={handleCopyScript}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95 shrink-0"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy Code.gs'}</span>
            </button>
          </div>

          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 overflow-x-auto max-h-[500px]">
            <pre className="font-mono text-xs text-slate-300 leading-relaxed">
{`/**
 * SANDEEP WHOLESALE ERP - GOOGLE APPS SCRIPT BACKEND (Code.gs)
 * Store: Sandeep Wholesale | Mobile: 9027855051 | Barabanki, Uttar Pradesh
 * Database: Google Sheets (DB_Products, DB_Purchases, DB_Sales, DB_Payments)
 * Backups: Google Drive (DS WebCraft ERP/Sandeep Wholesale/Backups/)
 */

// Available in file: /gas/Code.gs
// Click 'Copy Code.gs' above to copy all 600+ lines directly to your clipboard.`}
            </pre>
          </div>
        </div>
      )}

      {/* Subtab 3: Store Profile & Reset */}
      {activeSubTab === 'store' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4">Store Header Details</h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Store Legal / Trade Name
                </label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={e => setStoreName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Primary Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={storeMobile}
                  onChange={e => setStoreMobile(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Address / City / State
                </label>
                <input
                  type="text"
                  required
                  value={storeAddress}
                  onChange={e => setStoreAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tagline / Header Description
                </label>
                <input
                  type="text"
                  value={storeTagline}
                  onChange={e => setStoreTagline(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                {profileSaved && (
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
                  </span>
                )}
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md ml-auto"
                >
                  Save Store Profile
                </button>
              </div>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white">Reset Demo Ledger</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              If you made experimental purchases, sales, or payments in Local Demo Mode, you can reset all records back to the pristine &quot;patangbusiness_GoogleReady&quot; dataset (Mono Kite Fighter, Bareilly Manjha, Plastic Charkhi, Designer Kites).
            </p>

            <button
              onClick={handleResetDemoData}
              className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold rounded-xl text-xs transition-colors"
            >
              Reset to Original Ledger Sample
            </button>
          </div>
        </div>
      )}

      {/* Subtab 4: Security & Password Management */}
      {activeSubTab === 'security' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-2xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Admin Access & Password Security</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Manage your Sandeep Wholesale ERP login credentials and update your password anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">Current Login ID</span>
              <div className="text-sm font-bold font-mono text-white">
                {authService.getCredentials().loginId}
              </div>
              <p className="text-[10px] text-slate-500">Also accepts mobile: {store.mobile}</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">Account Role</span>
              <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Administrator / Store Owner
              </div>
              <p className="text-[10px] text-slate-500">Full read, write & billing privileges</p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenChangePassword}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95 flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Change Login Password Now</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
