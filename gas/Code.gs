/**
 * ============================================================================
 * SANDEEP WHOLESALE ERP - GOOGLE APPS SCRIPT BACKEND
 * ============================================================================
 * Store Profile:
 *   Name:    Sandeep Wholesale
 *   Mobile:  9027855051
 *   Address: Barabanki, Uttar Pradesh
 * 
 * Source of Truth Ledger: patangbusiness_GoogleReady
 * 
 * DEPLOYMENT INSTRUCTIONS (Quick 60 Seconds Guide):
 * 1. Open your Google Spreadsheet (or create a new blank Google Sheet).
 * 2. In Google Sheets, click "Extensions" > "Apps Script".
 * 3. Delete any default code in Code.gs and paste this ENTIRE file.
 * 4. Run the function "initializeDatabase" once from the toolbar to create all sheets.
 * 5. Click "Deploy" (top right) > "New deployment".
 * 6. Click the gear icon (Select type) > Choose "Web app".
 * 7. Set:
 *    - Description: Sandeep Wholesale ERP API
 *    - Execute as: "Me" (your email)
 *    - Who has access: "Anyone" (Crucial for web requests without Google login popup)
 * 8. Click "Deploy", authorize permissions when prompted.
 * 9. Copy the generated "Web App URL" (ends with /exec) and paste it into the ERP Web App Settings!
 * ============================================================================
 */

// Global Sheet Names
var SHEETS = {
  PRODUCTS: 'DB_Products',
  PURCHASES: 'DB_Purchases',
  SALES: 'DB_Sales',
  PAYMENTS: 'DB_Payments',
  SETTINGS: 'DB_Settings',
  AUDIT_LOG: 'DB_AuditLog'
};

var STORE_PROFILE = {
  name: 'Sandeep Wholesale',
  mobile: '9027855051',
  address: 'Barabanki, Uttar Pradesh',
  tagline: 'Leading Kite, Manjha & Wholesale Goods Merchant',
  backupFolder: 'DS WebCraft ERP/Sandeep Wholesale/Backups'
};

/**
 * Handle HTTP GET Requests (CORS Enabled)
 */
function doGet(e) {
  return handleRequest(e);
}

/**
 * Handle HTTP POST Requests (CORS Enabled)
 */
function doPost(e) {
  return handleRequest(e);
}

/**
 * Centralized Request Router
 */
function handleRequest(e) {
  var lock = LockService.getScriptLock();
  // Wait up to 30 seconds for concurrent writes
  try {
    lock.waitLock(30000);
  } catch (err) {
    return createJsonResponse({
      success: false,
      error: 'Server is busy processing another transaction. Please retry in a few seconds.'
    });
  }

  try {
    initializeDatabase(); // Ensure all sheets & headers exist

    var params = {};
    if (e && e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        params = e.parameter || {};
      }
    } else if (e && e.parameter) {
      params = e.parameter;
    }

    var action = params.action || (e && e.parameter ? e.parameter.action : '') || 'ping';
    var responseData = { success: true, action: action, timestamp: new Date().toISOString() };

    switch (action) {
      case 'ping':
        responseData.message = 'Sandeep Wholesale ERP API is online and operational.';
        responseData.store = STORE_PROFILE;
        break;

      case 'getDashboardSummary':
        responseData.data = getDashboardSummaryData();
        break;

      case 'getProducts':
        responseData.data = getProductsData();
        break;

      case 'saveProduct':
        responseData.data = saveProductData(params.product || params);
        break;

      case 'getPurchases':
        responseData.data = getPurchasesData();
        break;

      case 'savePurchase':
        responseData.data = savePurchaseData(params.purchase || params);
        break;

      case 'getSales':
        responseData.data = getSalesData();
        break;

      case 'saveSale':
        responseData.data = saveSaleData(params.sale || params);
        break;

      case 'recordPayment':
        responseData.data = recordPaymentData(params.payment || params);
        break;

      case 'searchCustomer':
        var query = params.query || params.mobile || params.billNo || '';
        responseData.data = searchCustomerData(query);
        break;

      case 'getReports':
        responseData.data = getReportsData(params.reportType || 'all');
        break;

      case 'createBackup':
        responseData.data = createSpreadsheetBackup();
        break;

      case 'initializeDatabase':
        initializeDatabase();
        responseData.message = 'Database sheets initialized successfully.';
        break;

      case 'seedInitialData':
        seedDemoLedgerData();
        responseData.message = 'Patang business sample ledger data seeded successfully.';
        break;

      default:
        responseData.success = false;
        responseData.error = 'Invalid action requested: ' + action;
        break;
    }

    return createJsonResponse(responseData);
  } catch (error) {
    logAudit('ERROR', error.toString());
    return createJsonResponse({
      success: false,
      error: error.message || error.toString()
    });
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {}
  }
}

/**
 * Creates JSON Output with proper CORS & Cache headers
 */
function createJsonResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * 1. DATABASE INITIALIZATION
 * Creates sheets and schemas if they do not exist
 */
function initializeDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. DB_Products
  var pSheet = getOrCreateSheet(ss, SHEETS.PRODUCTS);
  if (pSheet.getLastRow() === 0) {
    pSheet.appendRow([
      'ProductID', 'ItemName', 'Category', 'Unit', 'LatestPurchaseRate', 
      'DefaultSaleRate', 'TotalPurchased', 'TotalSold', 'CurrentStock', 
      'StockStatus', 'MinAlertQty', 'UpdatedAt'
    ]);
    formatHeaderRow(pSheet);
  }

  // 2. DB_Purchases
  var purSheet = getOrCreateSheet(ss, SHEETS.PURCHASES);
  if (purSheet.getLastRow() === 0) {
    purSheet.appendRow([
      'PurchaseID', 'Date', 'BillNo', 'SupplierName', 'ItemName', 
      'Qty', 'PurchaseRate', 'Amount', 'Notes', 'CreatedAt'
    ]);
    formatHeaderRow(purSheet);
  }

  // 3. DB_Sales
  var sSheet = getOrCreateSheet(ss, SHEETS.SALES);
  if (sSheet.getLastRow() === 0) {
    sSheet.appendRow([
      'SaleID', 'Date', 'BillNo', 'ClientName', 'Address', 'MobNo', 
      'ItemName', 'Qty', 'SaleRate', 'ItemsJson', 'Subtotal', 
      'PackagingCharges', 'DispatchCharges', 'TotalSale', 'COGS', 
      'GrossProfit', 'Payment1', 'Date1', 'Payment2', 'Date2', 
      'Payment3', 'Date3', 'TotalReceived', 'PendingAmount', 'Status', 'CreatedAt'
    ]);
    formatHeaderRow(sSheet);
  }

  // 4. DB_Payments
  var paySheet = getOrCreateSheet(ss, SHEETS.PAYMENTS);
  if (paySheet.getLastRow() === 0) {
    paySheet.appendRow([
      'PaymentID', 'SaleID', 'BillNo', 'ClientName', 'MobNo', 
      'InstallmentNo', 'Amount', 'Date', 'Mode', 'Reference', 'CreatedAt'
    ]);
    formatHeaderRow(paySheet);
  }

  // 5. DB_Settings
  var setSheet = getOrCreateSheet(ss, SHEETS.SETTINGS);
  if (setSheet.getLastRow() === 0) {
    setSheet.appendRow(['Key', 'Value', 'Description', 'UpdatedAt']);
    formatHeaderRow(setSheet);
    setSheet.appendRow(['STORE_NAME', STORE_PROFILE.name, 'Store Display Name', new Date().toISOString()]);
    setSheet.appendRow(['STORE_MOBILE', STORE_PROFILE.mobile, 'Contact Mobile', new Date().toISOString()]);
    setSheet.appendRow(['STORE_ADDRESS', STORE_PROFILE.address, 'Store City & State', new Date().toISOString()]);
    setSheet.appendRow(['BACKUP_PATH', STORE_PROFILE.backupFolder, 'Drive Backup Directory', new Date().toISOString()]);
  }

  // 6. DB_AuditLog
  var logSheet = getOrCreateSheet(ss, SHEETS.AUDIT_LOG);
  if (logSheet.getLastRow() === 0) {
    logSheet.appendRow(['LogID', 'Timestamp', 'Action', 'Details', 'User']);
    formatHeaderRow(logSheet);
  }
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function formatHeaderRow(sheet) {
  var range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  range.setBackground('#1E293B');
  range.setFontColor('#FFFFFF');
  range.setFontWeight('bold');
  range.setFontFamily('Arial');
  sheet.setFrozenRows(1);
}

/**
 * 2. PRODUCTS ENGINE
 */
function getProductsData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.PRODUCTS);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  var data = sheet.getDataRange().getValues();
  var products = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0] && !row[1]) continue;
    var stock = Number(row[8]) || 0;
    var status = 'OK';
    if (stock <= 0) {
      status = 'OUT OF STOCK';
    } else if (stock <= 10) {
      status = 'LOW STOCK';
    }

    products.push({
      productId: String(row[0] || ''),
      itemName: String(row[1] || ''),
      category: String(row[2] || 'Kites'),
      unit: String(row[3] || 'Pcs'),
      latestPurchaseRate: Number(row[4]) || 0,
      defaultSaleRate: Number(row[5]) || 0,
      totalPurchased: Number(row[6]) || 0,
      totalSold: Number(row[7]) || 0,
      currentStock: stock,
      stockStatus: status,
      minAlertQty: Number(row[10]) || 10,
      updatedAt: row[11] ? String(row[11]) : ''
    });
  }
  return products;
}

function saveProductData(p) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.PRODUCTS);
  var data = sheet.getDataRange().getValues();
  
  var itemName = (p.itemName || '').trim();
  if (!itemName) throw new Error('Item Name is required.');

  var rowIndex = -1;
  var productId = p.productId || '';

  for (var i = 1; i < data.length; i++) {
    if ((productId && String(data[i][0]) === String(productId)) || 
        String(data[i][1]).toLowerCase() === itemName.toLowerCase()) {
      rowIndex = i + 1;
      productId = data[i][0];
      break;
    }
  }

  var purchaseRate = Number(p.latestPurchaseRate) || 0;
  var saleRate = Number(p.defaultSaleRate) || 0;
  var minQty = Number(p.minAlertQty) || 10;
  var category = p.category || 'General';
  var unit = p.unit || 'Pcs';
  var now = new Date().toISOString();

  if (rowIndex > 0) {
    // Update existing
    var currPurchased = Number(data[rowIndex - 1][6]) || 0;
    var currSold = Number(data[rowIndex - 1][7]) || 0;
    var currentStock = currPurchased - currSold;
    var status = currentStock <= 0 ? 'OUT OF STOCK' : (currentStock <= minQty ? 'LOW STOCK' : 'OK');

    sheet.getRange(rowIndex, 2, 1, 11).setValues([[
      itemName, category, unit, purchaseRate, saleRate,
      currPurchased, currSold, currentStock, status, minQty, now
    ]]);
  } else {
    // Insert new
    productId = productId || 'PRD-' + Utilities.formatDate(new Date(), 'GMT+05:30', 'yyMMddHHmmss');
    var currentStock = 0;
    var status = 'OUT OF STOCK';
    sheet.appendRow([
      productId, itemName, category, unit, purchaseRate, saleRate,
      0, 0, currentStock, status, minQty, now
    ]);
  }

  logAudit('SAVE_PRODUCT', 'Saved product: ' + itemName);
  return { productId: productId, itemName: itemName };
}

/**
 * 3. PURCHASES ENGINE
 * Purchases: Date, Bill No, Supplier Name, Item Name, Qty, Purchase Rate, Amount (Qty * Rate)
 */
function getPurchasesData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.PURCHASES);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  var data = sheet.getDataRange().getValues();
  var purchases = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0] && !row[1]) continue;
    purchases.push({
      purchaseId: String(row[0] || ''),
      date: formatDate(row[1]),
      billNo: String(row[2] || ''),
      supplierName: String(row[3] || ''),
      itemName: String(row[4] || ''),
      qty: Number(row[5]) || 0,
      purchaseRate: Number(row[6]) || 0,
      amount: Number(row[7]) || 0,
      notes: String(row[8] || ''),
      createdAt: row[9] ? String(row[9]) : ''
    });
  }
  return purchases.reverse(); // Latest first
}

function savePurchaseData(pur) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.PURCHASES);

  var itemName = (pur.itemName || '').trim();
  var qty = Number(pur.qty) || 0;
  var rate = Number(pur.purchaseRate) || 0;
  var amount = qty * rate;
  var billNo = pur.billNo || ('PUR-' + Utilities.formatDate(new Date(), 'GMT+05:30', 'yyMMdd-HHmm'));
  var date = pur.date || Utilities.formatDate(new Date(), 'GMT+05:30', 'yyyy-MM-dd');
  var supplier = pur.supplierName || 'General Supplier';
  var purchaseId = pur.purchaseId || ('PID-' + Utilities.formatDate(new Date(), 'GMT+05:30', 'yyMMddHHmmss'));
  var notes = pur.notes || '';
  var now = new Date().toISOString();

  if (!itemName) throw new Error('Item Name is required.');
  if (qty <= 0) throw new Error('Quantity must be greater than zero.');

  // Append purchase
  sheet.appendRow([
    purchaseId, date, billNo, supplier, itemName, qty, rate, amount, notes, now
  ]);

  // Update DB_Products: update latest purchase rate & increment totalPurchased
  updateProductPurchaseInventory(itemName, qty, rate);

  logAudit('SAVE_PURCHASE', 'Recorded purchase: ' + itemName + ' Qty: ' + qty + ' Rate: ' + rate);
  return { purchaseId: purchaseId, billNo: billNo, amount: amount };
}

function updateProductPurchaseInventory(itemName, purchasedQty, latestRate) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.PRODUCTS);
  var data = sheet.getDataRange().getValues();
  var found = false;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]).toLowerCase() === itemName.toLowerCase()) {
      found = true;
      var currPurchased = (Number(data[i][6]) || 0) + purchasedQty;
      var currSold = Number(data[i][7]) || 0;
      var currentStock = currPurchased - currSold;
      var minAlert = Number(data[i][10]) || 10;
      var status = currentStock <= 0 ? 'OUT OF STOCK' : (currentStock <= minAlert ? 'LOW STOCK' : 'OK');

      sheet.getRange(i + 1, 5).setValue(latestRate); // Update LatestPurchaseRate
      sheet.getRange(i + 1, 7).setValue(currPurchased); // TotalPurchased
      sheet.getRange(i + 1, 9).setValue(currentStock); // CurrentStock
      sheet.getRange(i + 1, 10).setValue(status); // StockStatus
      sheet.getRange(i + 1, 12).setValue(new Date().toISOString());
      break;
    }
  }

  // If product not in catalog, auto-create it!
  if (!found) {
    var pId = 'PRD-' + Utilities.formatDate(new Date(), 'GMT+05:30', 'yyMMddHHmmss');
    var stock = purchasedQty;
    var status = stock <= 10 ? 'LOW STOCK' : 'OK';
    sheet.appendRow([
      pId, itemName, 'General', 'Pcs', latestRate, latestRate * 1.25,
      purchasedQty, 0, stock, status, 10, new Date().toISOString()
    ]);
  }
}

/**
 * 4. SALES ENGINE
 * Multi-item invoice, COGS, Gross Profit, Multi-installment Payments
 */
function getSalesData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.SALES);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  var data = sheet.getDataRange().getValues();
  var sales = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0] && !row[2]) continue;

    var items = [];
    try {
      if (row[9]) {
        items = JSON.parse(row[9]);
      }
    } catch (e) {
      items = [{
        itemName: String(row[6] || ''),
        qty: Number(row[7]) || 0,
        rate: Number(row[8]) || 0,
        amount: (Number(row[7]) || 0) * (Number(row[8]) || 0)
      }];
    }

    sales.push({
      saleId: String(row[0] || ''),
      date: formatDate(row[1]),
      billNo: String(row[2] || ''),
      clientName: String(row[3] || ''),
      address: String(row[4] || ''),
      mobNo: String(row[5] || ''),
      itemName: String(row[6] || ''),
      qty: Number(row[7]) || 0,
      saleRate: Number(row[8]) || 0,
      items: items,
      subtotal: Number(row[10]) || 0,
      packagingCharges: Number(row[11]) || 0,
      dispatchCharges: Number(row[12]) || 0,
      totalSale: Number(row[13]) || 0,
      cogs: Number(row[14]) || 0,
      grossProfit: Number(row[15]) || 0,
      payment1: Number(row[16]) || 0,
      date1: formatDate(row[17]),
      payment2: Number(row[18]) || 0,
      date2: formatDate(row[19]),
      payment3: Number(row[20]) || 0,
      date3: formatDate(row[21]),
      totalReceived: Number(row[22]) || 0,
      pendingAmount: Number(row[23]) || 0,
      status: String(row[24] || 'Pending'),
      createdAt: row[25] ? String(row[25]) : ''
    });
  }
  return sales.reverse();
}

function saveSaleData(sale) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.SALES);

  var clientName = (sale.clientName || '').trim();
  if (!clientName) throw new Error('Client Name is required.');

  var billNo = sale.billNo || ('SW-' + Utilities.formatDate(new Date(), 'GMT+05:30', 'yyMMdd-HHmm'));
  var saleId = sale.saleId || ('SID-' + Utilities.formatDate(new Date(), 'GMT+05:30', 'yyMMddHHmmss'));
  var date = sale.date || Utilities.formatDate(new Date(), 'GMT+05:30', 'yyyy-MM-dd');
  var address = sale.address || 'Barabanki';
  var mobNo = sale.mobNo || '';

  // Multi-item handling
  var items = sale.items || [];
  if (items.length === 0 && sale.itemName) {
    items = [{
      itemName: sale.itemName,
      qty: Number(sale.qty) || 1,
      rate: Number(sale.saleRate) || 0,
      amount: (Number(sale.qty) || 1) * (Number(sale.saleRate) || 0)
    }];
  }

  if (items.length === 0) throw new Error('At least one item is required in the sale invoice.');

  // Fetch product master for latest purchase rates (COGS calculation)
  var products = getProductsData();
  var productRateMap = {};
  for (var p = 0; p < products.length; p++) {
    productRateMap[products[p].itemName.toLowerCase()] = products[p].latestPurchaseRate || 0;
  }

  var subtotal = 0;
  var totalCogs = 0;
  var primaryItemName = items[0].itemName;
  var totalQty = 0;

  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var q = Number(it.qty) || 0;
    var r = Number(it.rate) || 0;
    it.amount = q * r;
    subtotal += it.amount;
    totalQty += q;

    // COGS = Sold Qty * Item's latest Purchase Rate
    var costRate = productRateMap[it.itemName.toLowerCase()] || 0;
    it.costRate = costRate;
    it.cogs = q * costRate;
    totalCogs += it.cogs;

    // Deduct stock in DB_Products
    updateProductSaleInventory(it.itemName, q);
  }

  var packagingCharges = Number(sale.packagingCharges) || 0;
  var dispatchCharges = Number(sale.dispatchCharges) || 0;
  var totalSale = subtotal + packagingCharges + dispatchCharges;
  var grossProfit = totalSale - totalCogs;

  // Payments handling
  var p1 = Number(sale.payment1) || 0;
  var d1 = p1 > 0 ? (sale.date1 || date) : '';
  var p2 = Number(sale.payment2) || 0;
  var d2 = p2 > 0 ? (sale.date2 || '') : '';
  var p3 = Number(sale.payment3) || 0;
  var d3 = p3 > 0 ? (sale.date3 || '') : '';

  var totalReceived = p1 + p2 + p3;
  var pendingAmount = totalSale - totalReceived;
  var status = pendingAmount <= 0 ? 'Paid' : 'Pending';

  var itemsJson = JSON.stringify(items);
  var now = new Date().toISOString();

  sheet.appendRow([
    saleId, date, billNo, clientName, address, mobNo,
    items.length === 1 ? primaryItemName : (primaryItemName + ' (+' + (items.length - 1) + ' items)'),
    totalQty,
    items.length === 1 ? items[0].rate : (subtotal / (totalQty || 1)),
    itemsJson, subtotal, packagingCharges, dispatchCharges, totalSale,
    totalCogs, grossProfit,
    p1, d1, p2, d2, p3, d3,
    totalReceived, pendingAmount, status, now
  ]);

  // Log initial payment in DB_Payments if payment1 > 0
  if (p1 > 0) {
    recordPaymentEntry(saleId, billNo, clientName, mobNo, 1, p1, d1, sale.paymentMode || 'Cash', 'Initial Payment');
  }

  logAudit('SAVE_SALE', 'Created bill: ' + billNo + ' Client: ' + clientName + ' Total: ' + totalSale);
  return {
    saleId: saleId,
    billNo: billNo,
    totalSale: totalSale,
    pendingAmount: pendingAmount,
    status: status
  };
}

function updateProductSaleInventory(itemName, soldQty) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.PRODUCTS);
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]).toLowerCase() === itemName.toLowerCase()) {
      var currPurchased = Number(data[i][6]) || 0;
      var currSold = (Number(data[i][7]) || 0) + soldQty;
      var currentStock = currPurchased - currSold;
      var minAlert = Number(data[i][10]) || 10;
      var status = currentStock <= 0 ? 'OUT OF STOCK' : (currentStock <= minAlert ? 'LOW STOCK' : 'OK');

      sheet.getRange(i + 1, 8).setValue(currSold);       // TotalSold
      sheet.getRange(i + 1, 9).setValue(currentStock);   // CurrentStock
      sheet.getRange(i + 1, 10).setValue(status);        // StockStatus
      sheet.getRange(i + 1, 12).setValue(new Date().toISOString());
      break;
    }
  }
}

/**
 * 5. PAYMENT COLLECTION (Installments 1, 2, or 3)
 */
function recordPaymentData(pay) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.SALES);
  var data = sheet.getDataRange().getValues();

  var billNo = (pay.billNo || '').trim();
  var saleId = (pay.saleId || '').trim();
  var amount = Number(pay.amount) || 0;
  var date = pay.date || Utilities.formatDate(new Date(), 'GMT+05:30', 'yyyy-MM-dd');
  var mode = pay.mode || 'Cash';
  var reference = pay.reference || '';

  if (amount <= 0) throw new Error('Payment amount must be greater than zero.');

  var rowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if ((billNo && String(data[i][2]).toLowerCase() === billNo.toLowerCase()) || 
        (saleId && String(data[i][0]) === saleId)) {
      rowIndex = i + 1;
      saleId = data[i][0];
      billNo = data[i][2];
      break;
    }
  }

  if (rowIndex <= 0) throw new Error('Sale invoice not found for Bill No: ' + billNo);

  var row = data[rowIndex - 1];
  var clientName = row[3];
  var mobNo = row[5];
  var totalSale = Number(row[13]) || 0;

  var p1 = Number(row[16]) || 0;
  var d1 = row[17];
  var p2 = Number(row[18]) || 0;
  var d2 = row[19];
  var p3 = Number(row[20]) || 0;
  var d3 = row[21];

  var installmentNum = 1;

  if (p1 === 0) {
    p1 = amount;
    d1 = date;
    installmentNum = 1;
  } else if (p2 === 0) {
    p2 = amount;
    d2 = date;
    installmentNum = 2;
  } else if (p3 === 0) {
    p3 = amount;
    d3 = date;
    installmentNum = 3;
  } else {
    // If all 3 slots filled, augment installment 3
    p3 += amount;
    d3 = date;
    installmentNum = 3;
  }

  var totalReceived = p1 + p2 + p3;
  var pendingAmount = totalSale - totalReceived;
  var status = pendingAmount <= 0 ? 'Paid' : 'Pending';

  // Update sales sheet
  sheet.getRange(rowIndex, 17, 1, 9).setValues([[
    p1, d1, p2, d2, p3, d3, totalReceived, pendingAmount, status
  ]]);

  // Record in DB_Payments
  recordPaymentEntry(saleId, billNo, clientName, mobNo, installmentNum, amount, date, mode, reference);

  logAudit('PAYMENT_RECEIVED', 'Bill ' + billNo + ': received ₹' + amount + ' (Inst. ' + installmentNum + ')');

  return {
    saleId: saleId,
    billNo: billNo,
    clientName: clientName,
    installmentNo: installmentNum,
    amountReceived: amount,
    totalReceived: totalReceived,
    pendingAmount: pendingAmount,
    status: status
  };
}

function recordPaymentEntry(saleId, billNo, clientName, mobNo, instNo, amt, date, mode, ref) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.PAYMENTS);
  var payId = 'PMT-' + Utilities.formatDate(new Date(), 'GMT+05:30', 'yyMMddHHmmss');
  sheet.appendRow([
    payId, saleId, billNo, clientName, mobNo, instNo, amt, date, mode, ref, new Date().toISOString()
  ]);
}

/**
 * 6. CUSTOMER SEARCH & LEDGER (Mobile No OR Bill No)
 */
function searchCustomerData(query) {
  var q = (query || '').toLowerCase().trim();
  if (!q) return { results: [], totalBilled: 0, totalPaid: 0, totalPending: 0 };

  var sales = getSalesData();
  var filtered = [];
  var totalBilled = 0;
  var totalPaid = 0;
  var totalPending = 0;

  for (var i = 0; i < sales.length; i++) {
    var s = sales[i];
    var matchMob = s.mobNo && s.mobNo.toLowerCase().indexOf(q) !== -1;
    var matchBill = s.billNo && s.billNo.toLowerCase().indexOf(q) !== -1;
    var matchClient = s.clientName && s.clientName.toLowerCase().indexOf(q) !== -1;

    if (matchMob || matchBill || matchClient) {
      filtered.push(s);
      totalBilled += s.totalSale;
      totalPaid += s.totalReceived;
      totalPending += s.pendingAmount;
    }
  }

  return {
    query: query,
    results: filtered,
    totalBilled: totalBilled,
    totalPaid: totalPaid,
    totalPending: totalPending
  };
}

/**
 * 7. DASHBOARD KPI & AGGREGATIONS
 */
function getDashboardSummaryData() {
  var products = getProductsData();
  var purchases = getPurchasesData();
  var sales = getSalesData();

  var totalPurchasesAmt = 0;
  for (var i = 0; i < purchases.length; i++) {
    totalPurchasesAmt += purchases[i].amount;
  }

  var totalSalesAmt = 0;
  var totalGrossProfit = 0;
  var totalPendingAmt = 0;
  var monthlyMap = {};

  // Initialize Jan-Dec
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (var m = 0; m < months.length; m++) {
    monthlyMap[months[m]] = { month: months[m], sales: 0, purchases: 0, profit: 0 };
  }

  for (var s = 0; s < sales.length; s++) {
    var sale = sales[s];
    totalSalesAmt += sale.totalSale;
    totalGrossProfit += sale.grossProfit;
    totalPendingAmt += Math.max(0, sale.pendingAmount);

    var mName = getMonthAbbreviation(sale.date);
    if (monthlyMap[mName]) {
      monthlyMap[mName].sales += sale.totalSale;
      monthlyMap[mName].profit += sale.grossProfit;
    }
  }

  for (var p = 0; p < purchases.length; p++) {
    var pur = purchases[p];
    var mName2 = getMonthAbbreviation(pur.date);
    if (monthlyMap[mName2]) {
      monthlyMap[mName2].purchases += pur.amount;
    }
  }

  // Stock counts & alerts
  var totalStockQty = 0;
  var lowStockItems = [];
  for (var k = 0; k < products.length; k++) {
    var prd = products[k];
    totalStockQty += prd.currentStock;
    if (prd.currentStock <= prd.minAlertQty) {
      lowStockItems.push(prd);
    }
  }

  // Top pending customers (debtors)
  var debtorMap = {};
  for (var d = 0; d < sales.length; d++) {
    var sl = sales[d];
    if (sl.pendingAmount > 0) {
      var key = sl.clientName + '_' + sl.mobNo;
      if (!debtorMap[key]) {
        debtorMap[key] = {
          clientName: sl.clientName,
          mobNo: sl.mobNo,
          address: sl.address,
          pendingAmount: 0,
          billsCount: 0,
          latestBillDate: sl.date
        };
      }
      debtorMap[key].pendingAmount += sl.pendingAmount;
      debtorMap[key].billsCount += 1;
    }
  }

  var debtors = Object.values(debtorMap).sort(function(a, b) {
    return b.pendingAmount - a.pendingAmount;
  }).slice(0, 10);

  return {
    kpis: {
      totalPurchases: totalPurchasesAmt,
      totalSales: totalSalesAmt,
      netProfit: totalGrossProfit,
      totalPending: totalPendingAmt,
      currentStockCount: totalStockQty,
      productsCount: products.length,
      invoicesCount: sales.length
    },
    monthlyChartData: months.map(function(m) { return monthlyMap[m]; }),
    lowStockList: lowStockItems.slice(0, 10),
    topDebtors: debtors,
    storeProfile: STORE_PROFILE
  };
}

/**
 * 8. REPORTS ENGINE
 */
function getReportsData(type) {
  var sales = getSalesData();
  var purchases = getPurchasesData();
  var products = getProductsData();

  // 1. Top Selling Items
  var itemMap = {};
  for (var i = 0; i < sales.length; i++) {
    var s = sales[i];
    var its = s.items || [];
    for (var j = 0; j < its.length; j++) {
      var it = its[j];
      var name = it.itemName;
      if (!itemMap[name]) {
        itemMap[name] = { itemName: name, totalQty: 0, totalRevenue: 0, totalProfit: 0 };
      }
      itemMap[name].totalQty += (Number(it.qty) || 0);
      itemMap[name].totalRevenue += (Number(it.amount) || 0);
      itemMap[name].totalProfit += (Number(it.amount) || 0) - (Number(it.cogs) || 0);
    }
  }
  var topSellingItems = Object.values(itemMap).sort(function(a, b) {
    return b.totalQty - a.totalQty;
  });

  // 2. Customer Pending Report
  var customerPending = [];
  for (var c = 0; c < sales.length; c++) {
    if (sales[c].pendingAmount > 0) {
      customerPending.push({
        billNo: sales[c].billNo,
        date: sales[c].date,
        clientName: sales[c].clientName,
        mobNo: sales[c].mobNo,
        address: sales[c].address,
        totalSale: sales[c].totalSale,
        totalReceived: sales[c].totalReceived,
        pendingAmount: sales[c].pendingAmount,
        status: sales[c].status
      });
    }
  }

  // 3. Monthly Profit Jan-Dec
  var monthlyProfit = [];
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (var m = 0; m < months.length; m++) {
    monthlyProfit.push({ month: months[m], sales: 0, cogs: 0, profit: 0, marginPercent: 0 });
  }

  for (var sIdx = 0; sIdx < sales.length; sIdx++) {
    var saleItem = sales[sIdx];
    var mName = getMonthAbbreviation(saleItem.date);
    var target = monthlyProfit.find(function(x) { return x.month === mName; });
    if (target) {
      target.sales += saleItem.totalSale;
      target.cogs += saleItem.cogs;
      target.profit += saleItem.grossProfit;
    }
  }

  for (var mp = 0; mp < monthlyProfit.length; mp++) {
    if (monthlyProfit[mp].sales > 0) {
      monthlyProfit[mp].marginPercent = Number(((monthlyProfit[mp].profit / monthlyProfit[mp].sales) * 100).toFixed(1));
    }
  }

  return {
    topSellingItems: topSellingItems,
    customerPendingReport: customerPending,
    monthlyProfitBreakdown: monthlyProfit
  };
}

/**
 * 9. GOOGLE DRIVE AUTOMATED BACKUP
 * Creates a dated copy of the spreadsheet inside:
 * 'DS WebCraft ERP/Sandeep Wholesale/Backups/'
 */
function createSpreadsheetBackup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var rootFolder = DriveApp.getRootFolder();
  var backupFolderPath = STORE_PROFILE.backupFolder.split('/');
  
  var currentFolder = rootFolder;
  for (var i = 0; i < backupFolderPath.length; i++) {
    var folderName = backupFolderPath[i].trim();
    if (!folderName) continue;
    var subFolders = currentFolder.getFoldersByName(folderName);
    if (subFolders.hasNext()) {
      currentFolder = subFolders.next();
    } else {
      currentFolder = currentFolder.createFolder(folderName);
    }
  }

  // Format backup name
  var timestamp = Utilities.formatDate(new Date(), 'GMT+05:30', 'yyyy-MM-dd_HH-mm-ss');
  var backupFileName = 'Sandeep_Wholesale_Backup_' + timestamp;

  // Make copy
  var file = DriveApp.getFileById(ss.getId());
  var backupFile = file.makeCopy(backupFileName, currentFolder);

  logAudit('BACKUP_CREATED', 'Created Drive Backup: ' + backupFileName);

  return {
    success: true,
    backupName: backupFileName,
    backupUrl: backupFile.getUrl(),
    folderName: STORE_PROFILE.backupFolder,
    timestamp: timestamp
  };
}

/**
 * 10. AUDIT LOGGING HELPER
 */
function logAudit(action, details) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEETS.AUDIT_LOG);
    if (!sheet) return;
    var user = Session.getActiveUser().getEmail() || 'ERP_System';
    var logId = 'LOG-' + Utilities.formatDate(new Date(), 'GMT+05:30', 'yyMMddHHmmss');
    sheet.appendRow([logId, new Date().toISOString(), action, details, user]);
  } catch (e) {
    // Ignore logging errors to prevent breaking transaction
  }
}

/**
 * Helper to parse and format dates cleanly
 */
function formatDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, 'GMT+05:30', 'yyyy-MM-dd');
  }
  return String(val).split('T')[0];
}

function getMonthAbbreviation(dateStr) {
  if (!dateStr) return 'Jan';
  var d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Jan';
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[d.getMonth()] || 'Jan';
}

/**
 * Seed initial Patang Business ledger data if sheet is fresh
 */
function seedDemoLedgerData() {
  initializeDatabase();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var prodSheet = ss.getSheetByName(SHEETS.PRODUCTS);
  if (prodSheet.getLastRow() > 1) return; // Already seeded

  var sampleProducts = [
    ['PRD-001', 'Mono Kite Fighter 6000', 'Manjha', 'Spool', 420, 560, 250, 180, 70, 'OK', 15, new Date().toISOString()],
    ['PRD-002', 'Bareilly Special 12 Cord Manjha', 'Manjha', 'Spool', 310, 420, 300, 260, 40, 'OK', 20, new Date().toISOString()],
    ['PRD-003', 'Plastic Charkhi Heavy Duty 9-inch', 'Charkhi', 'Pcs', 85, 130, 400, 392, 8, 'LOW STOCK', 25, new Date().toISOString()],
    ['PRD-004', 'Designer Cheel Kite (Pack of 50)', 'Kites', 'Pack', 180, 260, 500, 500, 0, 'OUT OF STOCK', 30, new Date().toISOString()],
    ['PRD-005', 'Champion Cotton Thread Bareilly', 'Saddi', 'Reel', 45, 75, 600, 420, 180, 'OK', 50, new Date().toISOString()],
    ['PRD-006', 'Gold Foil Fancy Kite (Pack of 20)', 'Kites', 'Pack', 120, 180, 350, 320, 30, 'OK', 25, new Date().toISOString()],
    ['PRD-007', 'Wooden Traditional Charkhi 12-inch', 'Charkhi', 'Pcs', 160, 240, 120, 115, 5, 'LOW STOCK', 15, new Date().toISOString()]
  ];

  for (var i = 0; i < sampleProducts.length; i++) {
    prodSheet.appendRow(sampleProducts[i]);
  }
}
