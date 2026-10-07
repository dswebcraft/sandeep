import { 
  Product, 
  Purchase, 
  Sale, 
  SaleItem, 
  DashboardSummary, 
  StoreProfile 
} from '../types/erp';
import { 
  DEFAULT_STORE_PROFILE, 
  INITIAL_PRODUCTS, 
  INITIAL_PURCHASES, 
  INITIAL_SALES 
} from './mockData';

const STORAGE_KEYS = {
  GAS_URL: 'sandeep_erp_gas_url',
  PRODUCTS: 'sandeep_erp_products',
  PURCHASES: 'sandeep_erp_purchases',
  SALES: 'sandeep_erp_sales',
  STORE_PROFILE: 'sandeep_erp_store_profile',
  BACKUP_LOGS: 'sandeep_erp_backup_logs',
};

class ERPService {
  private gasUrl: string = '';

  constructor() {
    this.gasUrl = localStorage.getItem(STORAGE_KEYS.GAS_URL) || '';
    this.initializeLocalStorage();
  }

  public getGasUrl(): string {
    return this.gasUrl;
  }

  public setGasUrl(url: string): void {
    this.gasUrl = url.trim();
    localStorage.setItem(STORAGE_KEYS.GAS_URL, this.gasUrl);
  }

  public isLiveMode(): boolean {
    return !!this.gasUrl && this.gasUrl.startsWith('https://script.google.com');
  }

  private initializeLocalStorage(): void {
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PURCHASES)) {
      localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(INITIAL_PURCHASES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(INITIAL_SALES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.STORE_PROFILE)) {
      localStorage.setItem(STORAGE_KEYS.STORE_PROFILE, JSON.stringify(DEFAULT_STORE_PROFILE));
    }
  }

  public resetToDefaultDemo(): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(INITIAL_PURCHASES));
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(INITIAL_SALES));
    localStorage.setItem(STORAGE_KEYS.STORE_PROFILE, JSON.stringify(DEFAULT_STORE_PROFILE));
  }

  // --- GAS API Caller ---
  private async callGAS<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
    if (!this.isLiveMode()) {
      throw new Error('Google Apps Script URL is not configured.');
    }

    try {
      // GAS accepts POST with text/plain body to avoid CORS preflight OPTIONS rejection
      const response = await fetch(this.gasUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ action, ...payload }),
      });

      const resJson = await response.json();
      if (!resJson.success) {
        throw new Error(resJson.error || 'Server returned an error.');
      }
      return resJson.data as T;
    } catch (err: unknown) {
      console.warn(`[GAS Failover] Action ${action} failed:`, err);
      throw err;
    }
  }

  // --- Connection Ping ---
  public async testConnection(urlToTest?: string): Promise<{ success: boolean; message: string; timestamp?: string }> {
    const targetUrl = urlToTest || this.gasUrl;
    if (!targetUrl) {
      return { success: false, message: 'No Google Apps Script Web App URL provided.' };
    }

    try {
      const response = await fetch(targetUrl + '?action=ping', {
        method: 'GET',
      });
      const data = await response.json();
      if (data && data.success) {
        return { 
          success: true, 
          message: data.message || 'Connected to Google Sheets & Apps Script successfully!',
          timestamp: data.timestamp 
        };
      }
      return { success: false, message: data?.error || 'Invalid API response format.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { 
        success: false, 
        message: 'Could not connect. Ensure the Web App is deployed with "Who has access: Anyone". Error: ' + msg 
      };
    }
  }

  // --- Store Profile ---
  public getStoreProfile(): StoreProfile {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STORE_PROFILE);
      return raw ? JSON.parse(raw) : DEFAULT_STORE_PROFILE;
    } catch {
      return DEFAULT_STORE_PROFILE;
    }
  }

  public updateStoreProfile(profile: StoreProfile): void {
    localStorage.setItem(STORAGE_KEYS.STORE_PROFILE, JSON.stringify(profile));
  }

  // --- Products ---
  public async getProducts(): Promise<Product[]> {
    if (this.isLiveMode()) {
      try {
        const remote = await this.callGAS<Product[]>('getProducts');
        if (Array.isArray(remote)) return remote;
      } catch (e) {
        console.warn('Falling back to local products store due to:', e);
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return raw ? JSON.parse(raw) : INITIAL_PRODUCTS;
  }

  public async saveProduct(product: Partial<Product>): Promise<Product> {
    if (this.isLiveMode()) {
      try {
        await this.callGAS('saveProduct', { product });
      } catch (e) {
        console.warn('GAS saveProduct failed, updating local store:', e);
      }
    }

    const products = await this.getProducts();
    const existingIndex = products.findIndex(
      p => p.productId === product.productId || p.itemName.toLowerCase() === (product.itemName || '').toLowerCase()
    );

    const now = new Date().toISOString().split('T')[0];
    let saved: Product;

    if (existingIndex >= 0) {
      const current = products[existingIndex];
      const purchased = current.totalPurchased;
      const sold = current.totalSold;
      const stock = purchased - sold;
      const minAlert = product.minAlertQty ?? current.minAlertQty ?? 10;
      const status: Product['stockStatus'] = stock <= 0 ? 'OUT OF STOCK' : (stock <= minAlert ? 'LOW STOCK' : 'OK');

      saved = {
        ...current,
        ...product,
        currentStock: stock,
        stockStatus: status,
        updatedAt: now,
      };
      products[existingIndex] = saved;
    } else {
      const newId = product.productId || `PRD-${Date.now().toString().slice(-4)}`;
      const minAlert = product.minAlertQty ?? 10;
      saved = {
        productId: newId,
        itemName: product.itemName || 'New Item',
        category: product.category || 'General',
        unit: product.unit || 'Pcs',
        latestPurchaseRate: Number(product.latestPurchaseRate) || 0,
        defaultSaleRate: Number(product.defaultSaleRate) || 0,
        totalPurchased: 0,
        totalSold: 0,
        currentStock: 0,
        stockStatus: 'OUT OF STOCK',
        minAlertQty: minAlert,
        updatedAt: now,
      };
      products.push(saved);
    }

    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    return saved;
  }

  // --- Purchases ---
  public async getPurchases(): Promise<Purchase[]> {
    if (this.isLiveMode()) {
      try {
        const remote = await this.callGAS<Purchase[]>('getPurchases');
        if (Array.isArray(remote)) return remote;
      } catch (e) {
        console.warn('Falling back to local purchases store:', e);
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.PURCHASES);
    return raw ? JSON.parse(raw) : INITIAL_PURCHASES;
  }

  public async savePurchase(purchase: Omit<Purchase, 'purchaseId' | 'amount'> & { purchaseId?: string }): Promise<Purchase> {
    const qty = Number(purchase.qty) || 0;
    const rate = Number(purchase.purchaseRate) || 0;
    const amount = qty * rate; // Business Logic: Amount = Qty * Rate
    const newPurchase: Purchase = {
      ...purchase,
      purchaseId: purchase.purchaseId || `PID-${Date.now().toString().slice(-6)}`,
      amount,
      createdAt: new Date().toISOString()
    };

    if (this.isLiveMode()) {
      try {
        await this.callGAS('savePurchase', { purchase: newPurchase });
      } catch (e) {
        console.warn('GAS savePurchase failed, saving locally:', e);
      }
    }

    // Save purchase locally
    const purchases = await this.getPurchases();
    purchases.unshift(newPurchase);
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));

    // Auto-update Product stock and LatestPurchaseRate in master
    const products = await this.getProducts();
    const prodIndex = products.findIndex(p => p.itemName.toLowerCase() === purchase.itemName.toLowerCase());

    if (prodIndex >= 0) {
      const p = products[prodIndex];
      const newPurchased = p.totalPurchased + qty;
      const currentStock = newPurchased - p.totalSold;
      const status: Product['stockStatus'] = currentStock <= 0 ? 'OUT OF STOCK' : (currentStock <= p.minAlertQty ? 'LOW STOCK' : 'OK');

      products[prodIndex] = {
        ...p,
        latestPurchaseRate: rate, // Updates to latest purchase price
        totalPurchased: newPurchased,
        currentStock: currentStock,
        stockStatus: status,
        updatedAt: purchase.date
      };
    } else {
      // Auto-create product in catalog
      const status: Product['stockStatus'] = qty <= 10 ? 'LOW STOCK' : 'OK';
      products.push({
        productId: `PRD-${Date.now().toString().slice(-4)}`,
        itemName: purchase.itemName,
        category: (purchase.category || 'General').trim(),
        unit: (purchase.unit || 'Pcs').trim(),
        latestPurchaseRate: rate,
        defaultSaleRate: Math.round(rate * 1.3),
        totalPurchased: qty,
        totalSold: 0,
        currentStock: qty,
        stockStatus: status,
        minAlertQty: 10,
        updatedAt: purchase.date
      });
    }
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

    return newPurchase;
  }

  // --- Sales ---
  public async getSales(): Promise<Sale[]> {
    if (this.isLiveMode()) {
      try {
        const remote = await this.callGAS<Sale[]>('getSales');
        if (Array.isArray(remote)) return remote;
      } catch (e) {
        console.warn('Falling back to local sales store:', e);
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.SALES);
    return raw ? JSON.parse(raw) : INITIAL_SALES;
  }

  public async saveSale(saleData: {
    date: string;
    billNo?: string;
    clientName: string;
    address: string;
    mobNo: string;
    items: Array<{ itemName: string; qty: number; rate: number }>;
    packagingCharges: number;
    dispatchCharges: number;
    payment1: number;
    paymentMode?: string;
  }): Promise<Sale> {
    const products = await this.getProducts();
    const rateMap = new Map<string, number>();
    products.forEach(p => rateMap.set(p.itemName.toLowerCase(), p.latestPurchaseRate));

    let subtotal = 0;
    let totalCogs = 0;

    const computedItems: SaleItem[] = saleData.items.map(it => {
      const q = Number(it.qty) || 0;
      const r = Number(it.rate) || 0;
      const amt = q * r;
      subtotal += amt;

      // COGS Formula: Sold Qty * Item's latest Purchase Rate
      const costRate = rateMap.get(it.itemName.toLowerCase()) || 0;
      const cogs = q * costRate;
      totalCogs += cogs;

      return {
        itemName: it.itemName,
        qty: q,
        rate: r,
        amount: amt,
        costRate,
        cogs
      };
    });

    const packagingCharges = Number(saleData.packagingCharges) || 0;
    const dispatchCharges = Number(saleData.dispatchCharges) || 0;
    // Multi-Item Invoice Total = Subtotal + Packaging + Dispatch
    const totalSale = subtotal + packagingCharges + dispatchCharges;
    // Gross Profit = Total Sale - Cost Price (COGS)
    const grossProfit = totalSale - totalCogs;

    const p1 = Number(saleData.payment1) || 0;
    const totalReceived = p1;
    // Pending Amount = Total Sale - Total Received
    const pendingAmount = totalSale - totalReceived;
    // Status = If Pending <= 0 then "Paid" else "Pending"
    const status: Sale['status'] = pendingAmount <= 0 ? 'Paid' : 'Pending';

    const billNo = saleData.billNo || `SW-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
    const saleId = `SID-${Date.now().toString().slice(-8)}`;

    const newSale: Sale = {
      saleId,
      date: saleData.date,
      billNo,
      clientName: saleData.clientName,
      address: saleData.address,
      mobNo: saleData.mobNo,
      itemName: computedItems[0]?.itemName || '',
      qty: computedItems.reduce((acc, curr) => acc + curr.qty, 0),
      saleRate: computedItems[0]?.rate || 0,
      items: computedItems,
      subtotal,
      packagingCharges,
      dispatchCharges,
      totalSale,
      cogs: totalCogs,
      grossProfit,
      payment1: p1,
      date1: p1 > 0 ? saleData.date : '',
      payment2: 0,
      date2: '',
      payment3: 0,
      date3: '',
      totalReceived,
      pendingAmount,
      status,
      createdAt: new Date().toISOString()
    };

    if (this.isLiveMode()) {
      try {
        await this.callGAS('saveSale', { sale: newSale });
      } catch (e) {
        console.warn('GAS saveSale failed, saving locally:', e);
      }
    }

    // Save locally
    const sales = await this.getSales();
    sales.unshift(newSale);
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));

    // Deduct stock in DB_Products (Current Stock = Total Purchased - Total Sold)
    computedItems.forEach(item => {
      const idx = products.findIndex(p => p.itemName.toLowerCase() === item.itemName.toLowerCase());
      if (idx >= 0) {
        const prod = products[idx];
        const newSold = prod.totalSold + item.qty;
        const currentStock = prod.totalPurchased - newSold;
        const sStatus: Product['stockStatus'] = currentStock <= 0 ? 'OUT OF STOCK' : (currentStock <= prod.minAlertQty ? 'LOW STOCK' : 'OK');

        products[idx] = {
          ...prod,
          totalSold: newSold,
          currentStock,
          stockStatus: sStatus,
          updatedAt: saleData.date
        };
      }
    });
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

    return newSale;
  }

  // --- Record Installment Payment (Payment 1, 2, or 3) ---
  public async recordPayment(params: {
    billNo: string;
    amount: number;
    date: string;
    mode: string;
    reference?: string;
  }): Promise<Sale> {
    if (this.isLiveMode()) {
      try {
        await this.callGAS('recordPayment', { payment: params });
      } catch (e) {
        console.warn('GAS recordPayment failed, updating locally:', e);
      }
    }

    const sales = await this.getSales();
    const saleIndex = sales.findIndex(s => s.billNo.toLowerCase() === params.billNo.toLowerCase());
    if (saleIndex < 0) {
      throw new Error(`Invoice with Bill No ${params.billNo} not found.`);
    }

    const sale = sales[saleIndex];
    let p1 = sale.payment1 || 0;
    let d1 = sale.date1 || '';
    let p2 = sale.payment2 || 0;
    let d2 = sale.date2 || '';
    let p3 = sale.payment3 || 0;
    let d3 = sale.date3 || '';

    if (p1 === 0) {
      p1 = params.amount;
      d1 = params.date;
    } else if (p2 === 0) {
      p2 = params.amount;
      d2 = params.date;
    } else {
      p3 += params.amount;
      d3 = params.date;
    }

    const totalReceived = p1 + p2 + p3;
    const pendingAmount = sale.totalSale - totalReceived;
    const status: Sale['status'] = pendingAmount <= 0 ? 'Paid' : 'Pending';

    const updatedSale: Sale = {
      ...sale,
      payment1: p1,
      date1: d1,
      payment2: p2,
      date2: d2,
      payment3: p3,
      date3: d3,
      totalReceived,
      pendingAmount,
      status
    };

    sales[saleIndex] = updatedSale;
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    return updatedSale;
  }

  // --- Search Customer (Mobile No OR Bill No) ---
  public async searchCustomer(query: string): Promise<{
    query: string;
    results: Sale[];
    totalBilled: number;
    totalPaid: number;
    totalPending: number;
  }> {
    if (this.isLiveMode()) {
      try {
        const remote = await this.callGAS<{
          query: string;
          results: Sale[];
          totalBilled: number;
          totalPaid: number;
          totalPending: number;
        }>('searchCustomer', { query });
        if (remote && remote.results) return remote;
      } catch (e) {
        console.warn('Falling back to local customer search:', e);
      }
    }

    const q = query.toLowerCase().trim();
    const sales = await this.getSales();

    const results = sales.filter(s => {
      const matchMob = s.mobNo && s.mobNo.toLowerCase().includes(q);
      const matchBill = s.billNo && s.billNo.toLowerCase().includes(q);
      const matchClient = s.clientName && s.clientName.toLowerCase().includes(q);
      return matchMob || matchBill || matchClient;
    });

    const totalBilled = results.reduce((acc, curr) => acc + curr.totalSale, 0);
    const totalPaid = results.reduce((acc, curr) => acc + curr.totalReceived, 0);
    const totalPending = results.reduce((acc, curr) => acc + curr.pendingAmount, 0);

    return {
      query,
      results,
      totalBilled,
      totalPaid,
      totalPending
    };
  }

  // --- Dashboard Summary ---
  public async getDashboardSummary(): Promise<DashboardSummary> {
    if (this.isLiveMode()) {
      try {
        const remote = await this.callGAS<DashboardSummary>('getDashboardSummary');
        if (remote && remote.kpis) return remote;
      } catch (e) {
        console.warn('Falling back to local dashboard computation:', e);
      }
    }

    const products = await this.getProducts();
    const purchases = await this.getPurchases();
    const sales = await this.getSales();

    const totalPurchases = purchases.reduce((acc, p) => acc + p.amount, 0);
    const totalSales = sales.reduce((acc, s) => acc + s.totalSale, 0);
    const netProfit = sales.reduce((acc, s) => acc + s.grossProfit, 0);
    const totalPending = sales.reduce((acc, s) => acc + Math.max(0, s.pendingAmount), 0);
    const currentStockCount = products.reduce((acc, p) => acc + p.currentStock, 0);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = new Map<string, { month: string; sales: number; purchases: number; profit: number }>();
    months.forEach(m => monthlyMap.set(m, { month: m, sales: 0, purchases: 0, profit: 0 }));

    sales.forEach(s => {
      const monthIdx = new Date(s.date).getMonth();
      const mName = months[isNaN(monthIdx) ? 8 : monthIdx];
      const entry = monthlyMap.get(mName);
      if (entry) {
        entry.sales += s.totalSale;
        entry.profit += s.grossProfit;
      }
    });

    purchases.forEach(p => {
      const monthIdx = new Date(p.date).getMonth();
      const mName = months[isNaN(monthIdx) ? 8 : monthIdx];
      const entry = monthlyMap.get(mName);
      if (entry) {
        entry.purchases += p.amount;
      }
    });

    const lowStockList = products.filter(p => p.currentStock <= p.minAlertQty);

    // Top Debtors
    const debtorMap = new Map<string, {
      clientName: string;
      mobNo: string;
      address: string;
      pendingAmount: number;
      billsCount: number;
      latestBillDate: string;
    }>();

    sales.forEach(s => {
      if (s.pendingAmount > 0) {
        const key = `${s.clientName}_${s.mobNo}`;
        const existing = debtorMap.get(key);
        if (existing) {
          existing.pendingAmount += s.pendingAmount;
          existing.billsCount += 1;
        } else {
          debtorMap.set(key, {
            clientName: s.clientName,
            mobNo: s.mobNo,
            address: s.address,
            pendingAmount: s.pendingAmount,
            billsCount: 1,
            latestBillDate: s.date
          });
        }
      }
    });

    const topDebtors = Array.from(debtorMap.values())
      .sort((a, b) => b.pendingAmount - a.pendingAmount)
      .slice(0, 10);

    return {
      kpis: {
        totalPurchases,
        totalSales,
        netProfit,
        totalPending,
        currentStockCount,
        productsCount: products.length,
        invoicesCount: sales.length
      },
      monthlyChartData: months.map(m => monthlyMap.get(m)!),
      lowStockList: lowStockList.slice(0, 10),
      topDebtors,
      storeProfile: this.getStoreProfile()
    };
  }

  // --- Reports ---
  public async getReports(): Promise<{
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
  }> {
    if (this.isLiveMode()) {
      try {
        const remote = await this.callGAS<{
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
        }>('getReports');
        if (remote) return remote;
      } catch (e) {
        console.warn('Falling back to local reports:', e);
      }
    }

    const sales = await this.getSales();
    const itemMap = new Map<string, { itemName: string; totalQty: number; totalRevenue: number; totalProfit: number }>();

    sales.forEach(s => {
      s.items.forEach(it => {
        const existing = itemMap.get(it.itemName) || { itemName: it.itemName, totalQty: 0, totalRevenue: 0, totalProfit: 0 };
        existing.totalQty += it.qty;
        existing.totalRevenue += it.amount;
        existing.totalProfit += (it.amount - (it.cogs || 0));
        itemMap.set(it.itemName, existing);
      });
    });

    const topSellingItems = Array.from(itemMap.values()).sort((a, b) => b.totalQty - a.totalQty);

    const customerPendingReport = sales
      .filter(s => s.pendingAmount > 0)
      .map(s => ({
        billNo: s.billNo,
        date: s.date,
        clientName: s.clientName,
        mobNo: s.mobNo,
        address: s.address,
        totalSale: s.totalSale,
        totalReceived: s.totalReceived,
        pendingAmount: s.pendingAmount,
        status: s.status
      }));

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyProfitBreakdown = months.map(m => ({
      month: m,
      sales: 0,
      cogs: 0,
      profit: 0,
      marginPercent: 0
    }));

    sales.forEach(s => {
      const monthIdx = new Date(s.date).getMonth();
      const mName = months[isNaN(monthIdx) ? 8 : monthIdx];
      const target = monthlyProfitBreakdown.find(x => x.month === mName);
      if (target) {
        target.sales += s.totalSale;
        target.cogs += s.cogs;
        target.profit += s.grossProfit;
      }
    });

    monthlyProfitBreakdown.forEach(mp => {
      if (mp.sales > 0) {
        mp.marginPercent = Number(((mp.profit / mp.sales) * 100).toFixed(1));
      }
    });

    return {
      topSellingItems,
      customerPendingReport,
      monthlyProfitBreakdown
    };
  }

  // --- Automated Drive Backup ---
  public async createBackup(): Promise<{
    success: boolean;
    backupName: string;
    backupUrl?: string;
    folderName: string;
    timestamp: string;
    isSimulated?: boolean;
  }> {
    if (this.isLiveMode()) {
      try {
        const res = await this.callGAS<{
          success: boolean;
          backupName: string;
          backupUrl?: string;
          folderName: string;
          timestamp: string;
        }>('createBackup');
        return res;
      } catch (err: unknown) {
        console.warn('Live GAS backup call failed, falling back to local snapshot:', err);
      }
    }

    // Local / Demo fallback snapshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `Sandeep_Wholesale_Backup_${timestamp}`;
    const snapshot = {
      timestamp,
      store: this.getStoreProfile(),
      products: await this.getProducts(),
      purchases: await this.getPurchases(),
      sales: await this.getSales(),
    };

    const backups = JSON.parse(localStorage.getItem(STORAGE_KEYS.BACKUP_LOGS) || '[]');
    backups.unshift({ name: backupName, timestamp, size: JSON.stringify(snapshot).length });
    localStorage.setItem(STORAGE_KEYS.BACKUP_LOGS, JSON.stringify(backups.slice(0, 10)));

    return {
      success: true,
      backupName,
      backupUrl: '#local-storage-snapshot',
      folderName: 'DS WebCraft ERP/Sandeep Wholesale/Backups/ (Local Snapshot)',
      timestamp,
      isSimulated: true
    };
  }
}

export const erpService = new ERPService();
