export interface Product {
  productId: string;
  itemName: string;
  category: string;
  unit: string;
  latestPurchaseRate: number;
  defaultSaleRate: number;
  totalPurchased: number;
  totalSold: number;
  currentStock: number;
  stockStatus: 'OK' | 'LOW STOCK' | 'OUT OF STOCK';
  minAlertQty: number;
  updatedAt?: string;
}

export interface Purchase {
  purchaseId: string;
  date: string;
  billNo: string;
  supplierName: string;
  itemName: string;
  category?: string;
  unit?: string;
  qty: number;
  purchaseRate: number;
  amount: number; // Qty * PurchaseRate
  notes?: string;
  createdAt?: string;
}

export interface SaleItem {
  itemName: string;
  qty: number;
  rate: number;
  amount: number;
  costRate?: number;
  cogs?: number;
}

export interface Sale {
  saleId: string;
  date: string;
  billNo: string;
  clientName: string;
  address: string;
  mobNo: string;
  itemName?: string;
  qty?: number;
  saleRate?: number;
  items: SaleItem[];
  subtotal: number;
  packagingCharges: number;
  dispatchCharges: number;
  totalSale: number; // Subtotal + Packaging + Dispatch
  cogs: number;
  grossProfit: number; // TotalSale - COGS
  payment1: number;
  date1?: string;
  payment2: number;
  date2?: string;
  payment3: number;
  date3?: string;
  totalReceived: number;
  pendingAmount: number;
  status: 'Paid' | 'Pending';
  createdAt?: string;
}

export interface PaymentLog {
  paymentId: string;
  saleId: string;
  billNo: string;
  clientName: string;
  mobNo: string;
  installmentNo: number;
  amount: number;
  date: string;
  mode: string;
  reference?: string;
  createdAt: string;
}

export interface StoreProfile {
  name: string;
  mobile: string;
  address: string;
  tagline: string;
  backupFolder: string;
}

export interface DashboardSummary {
  kpis: {
    totalPurchases: number;
    totalSales: number;
    netProfit: number;
    totalPending: number;
    currentStockCount: number;
    productsCount: number;
    invoicesCount: number;
  };
  monthlyChartData: Array<{
    month: string;
    sales: number;
    purchases: number;
    profit: number;
  }>;
  lowStockList: Product[];
  topDebtors: Array<{
    clientName: string;
    mobNo: string;
    address: string;
    pendingAmount: number;
    billsCount: number;
    latestBillDate: string;
  }>;
  storeProfile: StoreProfile;
}

export interface AuthUser {
  loginId: string;
  name: string;
  role: 'admin' | 'manager';
  lastLogin: string;
}

export interface AuthCredentials {
  loginId: string;
  passwordHash: string; // Plain/SHA-friendly string stored in storage
  name: string;
  updatedAt: string;
}
