// Multi-sheet Excel import utility for TDT Warehouse Inventory System
// Handles all standard sheet types in one Excel file

import XLSX from "xlsx-js-style";
import { 
  cellStr, 
  cellNum, 
  formatExcelDate, 
  findHeaderRowIndex, 
  pickCol, 
  rowHasData, 
  isInvalidProductRow 
} from "./excelImportUtils";

// Sheet name mappings and their data types
const SHEET_MAPPINGS = {
  // Products
  'LIST OF SKU': 'products',
  'PRODUCT': 'products', 
  'PRODUCTS': 'products',
  'INVENTORY': 'products',
  
  // Purchase Orders
  'LIST OF PURCHASE ORDER': 'purchaseOrders',
  'PURCHASE ORDER': 'purchaseOrders',
  'PURCHASING ORDER': 'purchaseOrders',
  'PO': 'purchaseOrders',
  
  // Ending Inventory
  'ENDING INVENTORY': 'endingInventory',
  'ENDING': 'endingInventory',
  'PHYSICAL INVENTORY': 'endingInventory',
  
  // Advance Customer PO
  'ADVANCE CUSTOMER PO & EST END': 'advanceCustomerPo',
  'ADVANCE CUSTOMER PO': 'advanceCustomerPo',
  'CUSTOMER PO': 'advanceCustomerPo',
  'ADVANCE PO': 'advanceCustomerPo',
  
  // Backload Inventory
  'BACKLOAD INVENTORY': 'backload',
  'BACKLOAD': 'backload',
  
  // Return Inventory
  'RETURN INVENTORY': 'returns',
  'RETURN': 'returns',
  'RETURNS': 'returns'
};

// Detect sheet data type based on sheet name
function detectSheetType(sheetName) {
  const upperName = sheetName.toUpperCase().trim();
  
  // Exact match first
  if (SHEET_MAPPINGS[upperName]) {
    return SHEET_MAPPINGS[upperName];
  }
  
  // Partial match
  for (const [key, type] of Object.entries(SHEET_MAPPINGS)) {
    if (upperName.includes(key) || key.includes(upperName)) {
      return type;
    }
  }
  
  // Check if it's a Stock Sheet (individual SKU sheet)
  // Stock sheets are named with SKU codes like: DRB007, SKU17, SHPT2, etc.
  if (isStockSheet(sheetName)) {
    return 'stockSheets';
  }
  
  return 'unknown';
}

// Check if a sheet is a Stock Sheet (individual SKU transactions)
function isStockSheet(sheetName) {
  const name = sheetName.toUpperCase().trim();
  
  // Skip generic sheet names
  if (['SHEET1', 'SHEET2', 'SHEET3', 'SUMMARY', 'DATA', 'INFO'].includes(name)) {
    return false;
  }
  
  // Common SKU patterns used in TDT
  const stockSheetPatterns = [
    /^[A-Z]{2,4}\d{2,4}$/,     // DRB007, MSP010, etc.
    /^SKU\d+$/,                // SKU17, SKU20, etc.
    /^[A-Z]{3,5}\d*[A-Z]?$/,   // SHPT2, SHPT2A, JINXI, etc.
    /^WF\d+$/,                 // WF016, WF009, etc.
    /^[A-Z]{2}\d{3,4}$/        // DR007, MS010, etc.
  ];
  
  return stockSheetPatterns.some(pattern => pattern.test(name));
}

// Parse Products sheet
function parseProductsSheet(ws) {
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false });
  const products = [];
  
  let headerRow = findHeaderRowIndex(raw, ['SKU', 'DESCRIPTION']) || 
                  findHeaderRowIndex(raw, ['CODE', 'PRODUCT']) ||
                  findHeaderRowIndex(raw, ['SKU']) || 0;
  
  if (headerRow < 0) headerRow = 0;
  
  const headers = raw[headerRow] || [];
  
  for (let i = headerRow + 1; i < raw.length; i++) {
    const row = raw[i];
    if (!row || !rowHasData(row, 2)) continue;
    
    const sku = cellStr(pickCol(row, headers, ['SKU CODE', 'SKU', 'CODE', 'ITEM CODE'], 0));
    const description = cellStr(pickCol(row, headers, ['DESCRIPTION', 'PRODUCT DESCRIPTION', 'ITEM DESCRIPTION'], 1));
    
    if (isInvalidProductRow(sku, description)) continue;
    if (!sku) continue;
    
    const category = cellStr(pickCol(row, headers, ['CATEGORY', 'TYPE', 'CLASS'], 2)) || 'General';
    const unit = cellStr(pickCol(row, headers, ['UNIT', 'UOM', 'UNIT OF MEASURE'], 3)) || 'pcs';
    const stock = cellNum(pickCol(row, headers, ['STOCK', 'QTY', 'QUANTITY', 'ON HAND'], 4));
    const avgCost = cellNum(pickCol(row, headers, ['AVG COST', 'AVERAGE COST', 'UNIT COST', 'COST'], 5));
    const totalValue = cellNum(pickCol(row, headers, ['TOTAL VALUE', 'VALUE', 'AMOUNT'], 6));
    const status = cellStr(pickCol(row, headers, ['STATUS', 'STATE'], 7)) || 'Active';
    
    products.push({
      id: products.length + 1,
      sku: sku.toUpperCase(),
      description,
      category,
      unit,
      stock,
      avgCost,
      totalValue: totalValue || (stock * avgCost),
      status
    });
  }
  
  return products;
}

// Parse Purchase Orders sheet
function parsePurchaseOrdersSheet(ws) {
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false });
  const orders = [];
  
  let headerRow = findHeaderRowIndex(raw, ['PO', 'VENDOR']) || 
                  findHeaderRowIndex(raw, ['ORDER', 'SUPPLIER']) || 0;
  
  const headers = raw[headerRow] || [];
  
  for (let i = headerRow + 1; i < raw.length; i++) {
    const row = raw[i];
    if (!row || !rowHasData(row, 3)) continue;
    
    const poNumber = cellStr(pickCol(row, headers, ['PO NUMBER', 'PO NO', 'PO #', 'ORDER NO'], 0));
    const vendorName = cellStr(pickCol(row, headers, ['VENDOR', 'SUPPLIER', 'VENDOR NAME'], 1));
    const orderDate = formatExcelDate(pickCol(row, headers, ['ORDER DATE', 'PO DATE', 'DATE'], 2));
    
    if (!poNumber || !vendorName) continue;
    
    const vendorNo = cellStr(pickCol(row, headers, ['VENDOR NO', 'VENDOR CODE', 'SUPPLIER CODE'], 3));
    const expectedDelivery = formatExcelDate(pickCol(row, headers, ['DELIVERY DATE', 'EXPECTED', 'DUE DATE'], 4));
    const status = cellStr(pickCol(row, headers, ['STATUS', 'STATE'], 5)) || 'Pending';
    const totalAmount = cellNum(pickCol(row, headers, ['TOTAL', 'AMOUNT', 'VALUE'], 6));
    const remarks = cellStr(pickCol(row, headers, ['REMARKS', 'NOTES', 'COMMENT'], 7));
    
    orders.push({
      id: orders.length + 1,
      poNumber,
      vendorName,
      vendorNo,
      orderDate,
      expectedDelivery,
      status,
      totalAmount,
      remarks
    });
  }
  
  return orders;
}

// Parse Ending Inventory sheet
function parseEndingInventorySheet(ws) {
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false });
  const inventory = [];
  
  let headerRow = findHeaderRowIndex(raw, ['SKU', 'PHYSICAL']) || 
                  findHeaderRowIndex(raw, ['CODE', 'COUNT']) || 0;
  
  const headers = raw[headerRow] || [];
  
  for (let i = headerRow + 1; i < raw.length; i++) {
    const row = raw[i];
    if (!row || !rowHasData(row, 3)) continue;
    
    const sku = cellStr(pickCol(row, headers, ['SKU', 'CODE', 'ITEM CODE'], 0));
    const physicalCount = cellNum(pickCol(row, headers, ['PHYSICAL COUNT', 'PHYSICAL', 'ACTUAL COUNT'], 1));
    const systemCount = cellNum(pickCol(row, headers, ['SYSTEM COUNT', 'SYSTEM', 'BOOK COUNT'], 2));
    
    if (!sku) continue;
    
    const inventoryDate = formatExcelDate(pickCol(row, headers, ['DATE', 'COUNT DATE', 'INVENTORY DATE'], 3)) || 
                         new Date().toISOString().slice(0, 10);
    const unitCost = cellNum(pickCol(row, headers, ['UNIT COST', 'COST', 'PRICE'], 4));
    const remarks = cellStr(pickCol(row, headers, ['REMARKS', 'NOTES', 'COMMENT'], 5));
    
    inventory.push({
      id: inventory.length + 1,
      sku: sku.toUpperCase(),
      inventoryDate,
      physicalCount,
      systemCount,
      unitCost,
      remarks
    });
  }
  
  return inventory;
}

// Parse Advance Customer PO sheet
function parseAdvanceCustomerPoSheet(ws) {
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false });
  const customerPos = [];
  
  let headerRow = findHeaderRowIndex(raw, ['CUSTOMER', 'PO']) || 0;
  const headers = raw[headerRow] || [];
  
  for (let i = headerRow + 1; i < raw.length; i++) {
    const row = raw[i];
    if (!row || !rowHasData(row, 3)) continue;
    
    const customerPo = cellStr(pickCol(row, headers, ['CUSTOMER PO', 'PO NUMBER', 'PO NO'], 0));
    const customerName = cellStr(pickCol(row, headers, ['CUSTOMER', 'CLIENT', 'CUSTOMER NAME'], 1));
    const poDate = formatExcelDate(pickCol(row, headers, ['PO DATE', 'ORDER DATE', 'DATE'], 2));
    
    if (!customerPo || !customerName) continue;
    
    const deliveryDate = formatExcelDate(pickCol(row, headers, ['DELIVERY DATE', 'EST END', 'DUE DATE'], 3));
    const status = cellStr(pickCol(row, headers, ['STATUS', 'STATE'], 4)) || 'Pending';
    const totalAmount = cellNum(pickCol(row, headers, ['TOTAL', 'AMOUNT', 'VALUE'], 5));
    const remarks = cellStr(pickCol(row, headers, ['REMARKS', 'NOTES'], 6));
    
    customerPos.push({
      id: customerPos.length + 1,
      customerPo,
      customerName,
      poDate,
      deliveryDate,
      status,
      totalAmount,
      remarks
    });
  }
  
  return customerPos;
}

// Parse Backload Inventory sheet
function parseBackloadSheet(ws) {
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false });
  const backload = [];
  
  let headerRow = findHeaderRowIndex(raw, ['SKU', 'RETURNED']) || 0;
  const headers = raw[headerRow] || [];
  
  for (let i = headerRow + 1; i < raw.length; i++) {
    const row = raw[i];
    if (!row || !rowHasData(row, 3)) continue;
    
    const sku = cellStr(pickCol(row, headers, ['SKU', 'CODE', 'ITEM CODE'], 0));
    const qtyReturned = cellNum(pickCol(row, headers, ['QTY RETURNED', 'RETURNED QTY', 'QUANTITY'], 1));
    const reason = cellStr(pickCol(row, headers, ['REASON', 'RETURN REASON'], 2));
    
    if (!sku || !reason) continue;
    
    const backloadDate = formatExcelDate(pickCol(row, headers, ['DATE', 'RETURN DATE'], 3)) || 
                        new Date().toISOString().slice(0, 10);
    const customer = cellStr(pickCol(row, headers, ['CUSTOMER', 'CLIENT'], 4));
    const originalDr = cellStr(pickCol(row, headers, ['ORIGINAL DR', 'DR NO', 'DR'], 5));
    const conditionStatus = cellStr(pickCol(row, headers, ['CONDITION', 'STATUS'], 6)) || 'Good';
    const unitCost = cellNum(pickCol(row, headers, ['UNIT COST', 'COST'], 7));
    const remarks = cellStr(pickCol(row, headers, ['REMARKS', 'NOTES'], 8));
    
    backload.push({
      id: backload.length + 1,
      sku: sku.toUpperCase(),
      backloadDate,
      qtyReturned,
      reason,
      customer,
      originalDr,
      conditionStatus,
      unitCost,
      remarks
    });
  }
  
  return backload;
}

// Parse Return Inventory sheet
function parseReturnsSheet(ws) {
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false });
  const returns = [];
  
  let headerRow = findHeaderRowIndex(raw, ['RETURN', 'CUSTOMER']) || 0;
  const headers = raw[headerRow] || [];
  
  for (let i = headerRow + 1; i < raw.length; i++) {
    const row = raw[i];
    if (!row || !rowHasData(row, 3)) continue;
    
    const returnNo = cellStr(pickCol(row, headers, ['RETURN NO', 'RETURN #', 'RET NO'], 0));
    const customerName = cellStr(pickCol(row, headers, ['CUSTOMER', 'CLIENT', 'CUSTOMER NAME'], 1));
    const returnDate = formatExcelDate(pickCol(row, headers, ['RETURN DATE', 'DATE'], 2));
    
    if (!returnNo || !customerName) continue;
    
    const originalDr = cellStr(pickCol(row, headers, ['ORIGINAL DR', 'DR NO'], 3));
    const reason = cellStr(pickCol(row, headers, ['REASON', 'RETURN REASON'], 4));
    const status = cellStr(pickCol(row, headers, ['STATUS', 'STATE'], 5)) || 'Pending';
    const totalAmount = cellNum(pickCol(row, headers, ['TOTAL', 'AMOUNT'], 6));
    const remarks = cellStr(pickCol(row, headers, ['REMARKS', 'NOTES'], 7));
    
    returns.push({
      id: returns.length + 1,
      returnNo,
      customerName,
      returnDate,
      originalDr,
      reason: reason || 'No reason specified',
      status,
      totalAmount,
      remarks
    });
  }
  
  return returns;
}

// Parse Stock Sheets (individual SKU transaction sheets)
function parseStockSheet(ws, sheetName) {
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false });
  const transactions = [];
  
  // The sheet name is the SKU
  const sku = sheetName.toUpperCase().trim();
  
  let headerRow = findHeaderRowIndex(raw, ['DATE', 'TRANS']) || 
                  findHeaderRowIndex(raw, ['DATE', 'QTY']) ||
                  findHeaderRowIndex(raw, ['TRANS NO', 'DATE']) || 0;
  
  if (headerRow < 0) headerRow = 0;
  
  const headers = raw[headerRow] || [];
  
  for (let i = headerRow + 1; i < raw.length; i++) {
    const row = raw[i];
    if (!row || !rowHasData(row, 3)) continue;
    
    const transNo = cellStr(pickCol(row, headers, ['TRANS NO', 'TRANSACTION', 'TRANS'], 0));
    const date = formatExcelDate(pickCol(row, headers, ['DATE', 'TRANS DATE'], 1));
    
    if (!transNo || !date) continue;
    
    // Determine if it's Stock In or Stock Out based on available columns
    const qtyIn = cellNum(pickCol(row, headers, ['QTY IN', 'IN', 'RECEIVE', 'RECEIVED'], 2));
    const qtyOut = cellNum(pickCol(row, headers, ['QTY OUT', 'OUT', 'RELEASE', 'RELEASED'], 3));
    const qty = qtyIn || qtyOut || cellNum(pickCol(row, headers, ['QTY', 'QUANTITY'], 2));
    
    if (!qty) continue;
    
    const unitCost = cellNum(pickCol(row, headers, ['UNIT COST', 'COST', 'PRICE'], 4));
    const totalValue = cellNum(pickCol(row, headers, ['TOTAL VALUE', 'TOTAL', 'AMOUNT'], 5));
    const runningQty = cellNum(pickCol(row, headers, ['RUNNING QTY', 'BALANCE'], 6));
    const remarks = cellStr(pickCol(row, headers, ['REMARKS', 'NOTES', 'COMMENT'], 7));
    
    // Additional fields for Stock In
    const vendor = cellStr(pickCol(row, headers, ['VENDOR', 'SUPPLIER'], 8));
    const po = cellStr(pickCol(row, headers, ['PO', 'PURCHASE ORDER'], 9));
    
    // Additional fields for Stock Out  
    const customer = cellStr(pickCol(row, headers, ['CUSTOMER', 'CLIENT'], 8));
    const dr = cellStr(pickCol(row, headers, ['DR', 'DELIVERY RECEIPT'], 9));
    
    const transaction = {
      id: transactions.length + 1,
      sku: sku,
      transNo,
      date,
      qty: Math.abs(qty),
      unitCost: unitCost || 0,
      totalValue: totalValue || (Math.abs(qty) * (unitCost || 0)),
      runningQty,
      remarks
    };
    
    // Determine transaction type and add specific fields
    if (qtyIn > 0 || vendor || po) {
      // Stock In transaction
      transaction.type = 'stockIn';
      transaction.vendorName = vendor;
      transaction.tdtPo = po;
      transaction.costUnit = unitCost || 0;
      transaction.totalPurchase = transaction.totalValue;
    } else if (qtyOut > 0 || customer || dr) {
      // Stock Out transaction
      transaction.type = 'stockOut';
      transaction.customer = customer;
      transaction.tdtDr = dr;
      transaction.dispatchDate = date;
      transaction.qtyOut = Math.abs(qty);
      transaction.totalPrice = transaction.totalValue;
    } else {
      // Generic transaction - try to determine based on qty sign or other hints
      transaction.type = qty > 0 ? 'stockIn' : 'stockOut';
      if (transaction.type === 'stockIn') {
        transaction.costUnit = unitCost || 0;
        transaction.totalPurchase = transaction.totalValue;
      } else {
        transaction.customer = 'Unknown';
        transaction.dispatchDate = date;
        transaction.qtyOut = Math.abs(qty);
        transaction.totalPrice = transaction.totalValue;
      }
    }
    
    transactions.push(transaction);
  }
  
  return transactions;
}

// Main multi-sheet import function
export async function importMultiSheetExcel(file, onProgress, onComplete, onError) {
  try {
    const workbook = XLSX.read(await file.arrayBuffer(), { 
      type: 'array', 
      cellDates: true, 
      cellText: false, 
      dateNF: 'yyyy-mm-dd' 
    });
    
    const results = {
      products: [],
      purchaseOrders: [],
      endingInventory: [],
      advanceCustomerPo: [],
      backload: [],
      returns: [],
      stockSheets: [],
      stockIn: [],
      stockOut: [],
      skippedSheets: [],
      summary: {}
    };
    
    let processedSheets = 0;
    const totalSheets = workbook.SheetNames.length;
    
    console.log(`📊 Processing ${totalSheets} sheets from ${file.name}`);
    
    for (const sheetName of workbook.SheetNames) {
      const sheetType = detectSheetType(sheetName);
      const ws = workbook.Sheets[sheetName];
      
      onProgress?.({
        current: processedSheets + 1,
        total: totalSheets,
        sheetName,
        sheetType
      });
      
      console.log(`📋 Processing sheet: "${sheetName}" (detected as: ${sheetType})`);
      
      try {
        switch (sheetType) {
          case 'products':
            const products = parseProductsSheet(ws);
            results.products.push(...products);
            console.log(`✅ Imported ${products.length} products from "${sheetName}"`);
            break;
            
          case 'purchaseOrders':
            const orders = parsePurchaseOrdersSheet(ws);
            results.purchaseOrders.push(...orders);
            console.log(`✅ Imported ${orders.length} purchase orders from "${sheetName}"`);
            break;
            
          case 'endingInventory':
            const inventory = parseEndingInventorySheet(ws);
            results.endingInventory.push(...inventory);
            console.log(`✅ Imported ${inventory.length} ending inventory records from "${sheetName}"`);
            break;
            
          case 'advanceCustomerPo':
            const customerPos = parseAdvanceCustomerPoSheet(ws);
            results.advanceCustomerPo.push(...customerPos);
            console.log(`✅ Imported ${customerPos.length} advance customer POs from "${sheetName}"`);
            break;
            
          case 'backload':
            const backloadItems = parseBackloadSheet(ws);
            results.backload.push(...backloadItems);
            console.log(`✅ Imported ${backloadItems.length} backload items from "${sheetName}"`);
            break;
            
          case 'returns':
            const returnItems = parseReturnsSheet(ws);
            results.returns.push(...returnItems);
            console.log(`✅ Imported ${returnItems.length} return items from "${sheetName}"`);
            break;
            
          case 'stockSheets':
            const stockTransactions = parseStockSheet(ws, sheetName);
            results.stockSheets.push({
              sheetName: sheetName,
              sku: sheetName.toUpperCase().trim(),
              transactions: stockTransactions
            });
            
            // Separate Stock In and Stock Out transactions
            stockTransactions.forEach(transaction => {
              if (transaction.type === 'stockIn') {
                results.stockIn.push(transaction);
              } else if (transaction.type === 'stockOut') {
                results.stockOut.push(transaction);
              }
            });
            
            // Note: We don't create product records from stock sheets - only transactions
            console.log(`✅ Imported ${stockTransactions.length} stock transactions from "${sheetName}" (${stockTransactions.filter(t => t.type === 'stockIn').length} IN, ${stockTransactions.filter(t => t.type === 'stockOut').length} OUT)`);
            break;
            
          default:
            results.skippedSheets.push({ name: sheetName, reason: 'Unknown sheet type' });
            console.log(`⚠️  Skipped sheet: "${sheetName}" (unknown type)`);
            break;
        }
      } catch (sheetError) {
        console.error(`❌ Error processing sheet "${sheetName}":`, sheetError.message);
        results.skippedSheets.push({ name: sheetName, reason: sheetError.message });
      }
      
      processedSheets++;
    }
    
    // Generate summary
    results.summary = {
      totalSheets: totalSheets,
      processedSheets: processedSheets,
      skippedSheets: results.skippedSheets.length,
      totalProducts: results.products.length,
      totalPurchaseOrders: results.purchaseOrders.length,
      totalEndingInventory: results.endingInventory.length,
      totalAdvanceCustomerPo: results.advanceCustomerPo.length,
      totalBackload: results.backload.length,
      totalReturns: results.returns.length,
      totalStockSheets: results.stockSheets.length,
      totalStockIn: results.stockIn.length,
      totalStockOut: results.stockOut.length
    };
    
    // Auto-create products from stock transactions if no product sheets were imported
    if (results.products.length === 0 && (results.stockIn.length > 0 || results.stockOut.length > 0)) {
      console.log('📦 Auto-creating products from stock transactions...');
      
      const productSkus = new Set();
      
      // Collect unique SKUs from all stock transactions
      [...results.stockIn, ...results.stockOut].forEach(transaction => {
        if (transaction.sku && !productSkus.has(transaction.sku.toUpperCase())) {
          productSkus.add(transaction.sku.toUpperCase());
          
          results.products.push({
            id: results.products.length + 1,
            sku: transaction.sku.toUpperCase(),
            description: `Auto-generated from transactions - ${transaction.sku}`,
            category: 'General',
            unit: 'pcs',
            stock: 0,
            avgCost: 0,
            totalValue: 0,
            status: 'Active'
          });
        }
      });
      
      results.summary.totalProducts = results.products.length;
      console.log(`✅ Auto-created ${results.products.length} products from stock transactions`);
    }
    
    console.log('📊 Import Summary:', results.summary);
    onComplete?.(results);
    
  } catch (error) {
    console.error('❌ Multi-sheet import failed:', error);
    onError?.(error);
  }
}

export default {
  importMultiSheetExcel,
  detectSheetType,
  SHEET_MAPPINGS
};