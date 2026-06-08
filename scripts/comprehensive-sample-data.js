// Comprehensive sample data for TDT Warehouse Inventory System
// This script populates all modules with realistic data for demonstration

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tdt_wis',
};

// Helper function to generate dates
const getDateString = (daysAgo = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
};

const getDateTimeString = (daysAgo = 0, hoursAgo = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(date.getHours() - hoursAgo);
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

// Sample data for all modules
const sampleData = {
  products: [
    {
      sku: 'DRB007',
      description: 'Deformed Round Bar, 10mm x 6M g33',
      category: 'Deformed Round Bar',
      unit: 'pcs',
      stock: 250,
      avg_cost: 138.60,
      total_value: 34650.00,
      warning_level: 50,
      target_max: 300,
      status: 'Active'
    },
    {
      sku: 'DRB008',
      description: 'Deformed Round Bar, 12mm x 6M g33',
      category: 'Deformed Round Bar',
      unit: 'pcs',
      stock: 180,
      avg_cost: 142.50,
      total_value: 25650.00,
      warning_level: 40,
      target_max: 250,
      status: 'Active'
    },
    {
      sku: 'MSP010',
      description: 'MS Plate, 6mm x 4\' x 8\'',
      category: 'MS Plate',
      unit: 'pcs',
      stock: 75,
      avg_cost: 554.79,
      total_value: 41609.25,
      warning_level: 20,
      target_max: 100,
      status: 'Active'
    },
    {
      sku: 'SHPT2',
      description: 'Sheet Pile, T2, 400mm x 100mm x 10.5mm',
      category: 'Sheet Pile',
      unit: 'pcs',
      stock: 12,
      avg_cost: 22529.66,
      total_value: 270355.92,
      warning_level: 5,
      target_max: 20,
      status: 'Active'
    },
    {
      sku: 'WF016',
      description: 'Wide Flange, 8 x 4 x 10# x 6M',
      category: 'Wide Flange',
      unit: 'pcs',
      stock: 35,
      avg_cost: 8900.00,
      total_value: 311500.00,
      warning_level: 10,
      target_max: 50,
      status: 'Active'
    },
    {
      sku: 'AB036',
      description: 'Angle Bar, 50mm x 50mm x 6M',
      category: 'Angle Bar',
      unit: 'pcs',
      stock: 120,
      avg_cost: 245.50,
      total_value: 29460.00,
      warning_level: 30,
      target_max: 150,
      status: 'Active'
    },
    {
      sku: 'FB075',
      description: 'Flat Bar, 25mm x 6mm x 6M',
      category: 'Flat Bar',
      unit: 'pcs',
      stock: 85,
      avg_cost: 156.75,
      total_value: 13323.75,
      warning_level: 25,
      target_max: 100,
      status: 'Active'
    },
    {
      sku: 'PRB3',
      description: 'Plain Round Bar, 25mm x 6M',
      category: 'Plain Round Bar',
      unit: 'pcs',
      stock: 45,
      avg_cost: 189.90,
      total_value: 8545.50,
      warning_level: 15,
      target_max: 60,
      status: 'Active'
    },
    {
      sku: 'GIP23',
      description: 'GI Pipe, 2" x 6M Schedule 40',
      category: 'GI Pipe',
      unit: 'pcs',
      stock: 95,
      avg_cost: 425.80,
      total_value: 40451.00,
      warning_level: 25,
      target_max: 120,
      status: 'Active'
    },
    {
      sku: 'SSE',
      description: 'Stainless Steel Electrode, 3.2mm',
      category: 'Electrode',
      unit: 'kg',
      stock: 150,
      avg_cost: 385.00,
      total_value: 57750.00,
      warning_level: 50,
      target_max: 200,
      status: 'Active'
    }
  ],

  stockIn: [
    // Recent stock-in transactions
    {
      sku: 'DRB007',
      trans_no: 'TI-2024-001',
      date: getDateString(1),
      tdt_po: 'PO-2024-001',
      tdt_po_date: getDateString(10),
      vendor_no: 'V001',
      vendor_name: 'Manila Steel Corporation',
      customer_dr: 'DR-2024-001',
      tdt_wo: 'WO-2024-001',
      accept_date: getDateString(1),
      qty: 100,
      cost_kilo: null,
      cost_unit: 138.60,
      total_purchase: 13860.00,
      running_qty: 250,
      avg_unit_cost: 138.60,
      total_value: 34650.00,
      remark: 'Delivery Receipt #DR-2024-001'
    },
    {
      sku: 'DRB008',
      trans_no: 'TI-2024-002',
      date: getDateString(2),
      tdt_po: 'PO-2024-002',
      tdt_po_date: getDateString(12),
      vendor_no: 'V002',
      vendor_name: 'Philippines Steel Trading',
      customer_dr: 'DR-2024-002',
      tdt_wo: 'WO-2024-002',
      accept_date: getDateString(2),
      qty: 80,
      cost_kilo: null,
      cost_unit: 142.50,
      total_purchase: 11400.00,
      running_qty: 180,
      avg_unit_cost: 142.50,
      total_value: 25650.00,
      remark: 'Delivery Receipt #DR-2024-002'
    },
    {
      sku: 'MSP010',
      trans_no: 'TI-2024-003',
      date: getDateString(3),
      tdt_po: 'PO-2024-003',
      tdt_po_date: getDateString(15),
      vendor_no: 'V003',
      vendor_name: 'Metro Steel Supply',
      customer_dr: 'DR-2024-003',
      tdt_wo: 'WO-2024-003',
      accept_date: getDateString(3),
      qty: 25,
      cost_kilo: null,
      cost_unit: 554.79,
      total_purchase: 13869.75,
      running_qty: 75,
      avg_unit_cost: 554.79,
      total_value: 41609.25,
      remark: 'Delivery Receipt #DR-2024-003'
    },
    {
      sku: 'WF016',
      trans_no: 'TI-2024-004',
      date: getDateString(5),
      tdt_po: 'PO-2024-004',
      tdt_po_date: getDateString(20),
      vendor_no: 'V004',
      vendor_name: 'Steel Asia Manufacturing',
      customer_dr: 'DR-2024-004',
      tdt_wo: 'WO-2024-004',
      accept_date: getDateString(5),
      qty: 15,
      cost_kilo: null,
      cost_unit: 8900.00,
      total_purchase: 133500.00,
      running_qty: 35,
      avg_unit_cost: 8900.00,
      total_value: 311500.00,
      remark: 'Delivery Receipt #DR-2024-004'
    },
    {
      sku: 'GIP23',
      trans_no: 'TI-2024-005',
      date: getDateString(7),
      tdt_po: 'PO-2024-005',
      tdt_po_date: getDateString(25),
      vendor_no: 'V005',
      vendor_name: 'Tubacero Steel Corporation',
      customer_dr: 'DR-2024-005',
      tdt_wo: 'WO-2024-005',
      accept_date: getDateString(7),
      qty: 50,
      cost_kilo: null,
      cost_unit: 425.80,
      total_purchase: 21290.00,
      running_qty: 95,
      avg_unit_cost: 425.80,
      total_value: 40451.00,
      remark: 'Delivery Receipt #DR-2024-005'
    }
  ],

  stockOut: [
    // Recent stock-out transactions  
    {
      sku: 'DRB007',
      trans_no: 'TO-2024-001',
      dispatch_date: getDateString(1),
      tdt_wo: 'WO-2024-101',
      customer: 'ABC Construction Corp',
      tdt_dr: 'DR-OUT-2024-001',
      branch: 'Quezon City',
      bdr_summary: 'BDR-2024-001',
      tdt_si: 'SI-2024-001',
      qty_out: 50,
      unit_cost: 138.60,
      total_price: 8750.00,
      s1: 'Project Alpha',
      s2: 'Phase 1',
      s3: 'Foundation',
      running_qty: 200,
      running_value: 27720.00,
      remarks: 'Delivered to construction site'
    },
    {
      sku: 'DRB008',
      trans_no: 'TO-2024-002',
      dispatch_date: getDateString(2),
      tdt_wo: 'WO-2024-102',
      customer: 'XYZ Development Inc',
      tdt_dr: 'DR-OUT-2024-002',
      branch: 'Makati',
      bdr_summary: 'BDR-2024-002',
      tdt_si: 'SI-2024-002',
      qty_out: 30,
      unit_cost: 142.50,
      total_price: 5400.00,
      s1: 'Office Tower',
      s2: 'Phase 2',
      s3: 'Structure',
      running_qty: 150,
      running_value: 21375.00,
      remarks: 'Rush delivery completed'
    },
    {
      sku: 'AB036',
      trans_no: 'TO-2024-003',
      dispatch_date: getDateString(3),
      tdt_wo: 'WO-2024-103',
      customer: 'DEF Infrastructure',
      tdt_dr: 'DR-OUT-2024-003',
      branch: 'Pasig',
      bdr_summary: 'BDR-2024-003',
      tdt_si: 'SI-2024-003',
      qty_out: 25,
      unit_cost: 245.50,
      total_price: 7750.00,
      s1: 'Bridge Project',
      s2: 'Phase 1',
      s3: 'Support',
      running_qty: 95,
      running_value: 23322.50,
      remarks: 'Bridge construction materials'
    },
    {
      sku: 'MSP010',
      trans_no: 'TO-2024-004',
      dispatch_date: getDateString(4),
      tdt_wo: 'WO-2024-104',
      customer: 'GHI Metal Works',
      tdt_dr: 'DR-OUT-2024-004',
      branch: 'Marikina',
      bdr_summary: 'BDR-2024-004',
      tdt_si: 'SI-2024-004',
      qty_out: 10,
      unit_cost: 554.79,
      total_price: 7000.00,
      s1: 'Custom Fabrication',
      s2: 'Batch A',
      s3: 'Plates',
      running_qty: 65,
      running_value: 36061.35,
      remarks: 'Custom cutting required'
    },
    {
      sku: 'GIP23',
      trans_no: 'TO-2024-005',
      dispatch_date: getDateString(6),
      tdt_wo: 'WO-2024-105',
      customer: 'JKL Plumbing Services',
      tdt_dr: 'DR-OUT-2024-005',
      branch: 'Taguig',
      bdr_summary: 'BDR-2024-005',
      tdt_si: 'SI-2024-005',
      qty_out: 20,
      unit_cost: 425.80,
      total_price: 10800.00,
      s1: 'Residential Complex',
      s2: 'Building 1',
      s3: 'Plumbing',
      running_qty: 75,
      running_value: 31935.00,
      remarks: 'Residential plumbing installation'
    }
  ],

  purchaseOrders: [
    {
      po_number: 'PO-2024-001',
      vendor_name: 'Manila Steel Corporation',
      vendor_no: 'V001',
      order_date: getDateString(10),
      expected_delivery: getDateString(5),
      status: 'Completed',
      total_amount: 13860.00,
      remarks: 'Standard delivery completed on time'
    },
    {
      po_number: 'PO-2024-002', 
      vendor_name: 'Philippines Steel Trading',
      vendor_no: 'V002',
      order_date: getDateString(12),
      expected_delivery: getDateString(3),
      status: 'Completed',
      total_amount: 11400.00,
      remarks: 'Quality materials received'
    },
    {
      po_number: 'PO-2024-003',
      vendor_name: 'Steel Asia Manufacturing', 
      vendor_no: 'V004',
      order_date: getDateString(8),
      expected_delivery: getDateString(2),
      status: 'Pending',
      total_amount: 450593.20,
      remarks: 'Large order - awaiting delivery confirmation'
    }
  ],

  endingInventory: [
    {
      sku: 'DRB007',
      inventory_date: getDateString(0),
      physical_count: 250,
      system_count: 250,
      unit_cost: 138.60,
      remarks: 'Physical count matches system'
    },
    {
      sku: 'DRB008',
      inventory_date: getDateString(0),
      physical_count: 180,
      system_count: 182,
      unit_cost: 142.50,
      remarks: 'Minor variance - 2 pcs difference'
    },
    {
      sku: 'MSP010',
      inventory_date: getDateString(0),
      physical_count: 75,
      system_count: 75,
      unit_cost: 554.79,
      remarks: 'Inventory accurate'
    }
  ],

  advanceCustomerPo: [
    {
      customer_po: 'CPO-2024-001',
      customer_name: 'ABC Construction Corp',
      po_date: getDateString(15),
      delivery_date: getDateString(5),
      status: 'Pending',
      total_amount: 26250.00,
      remarks: 'Residential tower project materials'
    },
    {
      customer_po: 'CPO-2024-002',
      customer_name: 'XYZ Development Inc',
      po_date: getDateString(12),
      delivery_date: getDateString(3),
      status: 'Partial',
      total_amount: 450000.00,
      remarks: 'Office complex foundation - partial delivery completed'
    }
  ],

  backload: [
    {
      sku: 'PRB3',
      backload_date: getDateString(7),
      qty_returned: 15,
      reason: 'Quality issues - surface rust detected',
      customer: 'Steel Asia Manufacturing',
      original_dr: 'DR-2024-003',
      condition_status: 'Damaged',
      unit_cost: 189.90,
      remarks: 'Awaiting supplier response for replacement'
    },
    {
      sku: 'AB036',
      backload_date: getDateString(5),
      qty_returned: 8,
      reason: 'Size variance beyond tolerance',
      customer: 'Metro Steel Supply',
      original_dr: 'DR-2024-004',
      condition_status: 'Defective',
      unit_cost: 245.50,
      remarks: 'Replacement received and processed'
    }
  ],

  returns: [
    {
      return_no: 'RET-2024-001',
      customer_name: 'DEF Infrastructure',
      return_date: getDateString(3),
      original_dr: 'DR-OUT-2024-003',
      reason: 'Excess materials from completed project',
      status: 'Approved',
      total_amount: 1225.00,
      remarks: 'Good condition - returned to inventory'
    },
    {
      return_no: 'RET-2024-002',
      customer_name: 'GHI Metal Works',
      return_date: getDateString(1),
      original_dr: 'DR-OUT-2024-004',
      reason: 'Wrong specification ordered by customer',
      status: 'Approved', 
      total_amount: 1277.40,
      remarks: 'New condition - customer exchanged for correct size'
    }
  ]
};

async function clearExistingData(connection) {
  console.log('🧹 Clearing existing transaction data...');
  
  const tables = [
    'stock_in',
    'stock_out', 
    'purchase_orders',
    'ending_inventory',
    'advance_customer_po',
    'backload',
    'returns'
  ];
  
  for (const table of tables) {
    try {
      await connection.execute(`DELETE FROM ${table}`);
      console.log(`✅ Cleared ${table}`);
    } catch (error) {
      console.log(`⚠️  Could not clear ${table}: ${error.message}`);
    }
  }
}

async function updateProducts(connection) {
  console.log('📦 Updating products with realistic data...');
  
  for (const product of sampleData.products) {
    try {
      // Check if product exists
      const [existing] = await connection.execute(
        'SELECT id FROM products WHERE sku = ?',
        [product.sku]
      );
      
      if (existing.length > 0) {
        // Update existing product
        await connection.execute(
          `UPDATE products SET 
           description = ?, category = ?, unit = ?, stock = ?, 
           avg_cost = ?, total_value = ?, warning_level = ?, target_max = ?, status = ?
           WHERE sku = ?`,
          [
            product.description, product.category, product.unit, product.stock,
            product.avg_cost, product.total_value, product.warning_level, 
            product.target_max, product.status, product.sku
          ]
        );
        console.log(`✅ Updated product: ${product.sku}`);
      } else {
        // Insert new product
        await connection.execute(
          `INSERT INTO products 
           (sku, description, category, unit, stock, avg_cost, total_value, warning_level, target_max, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            product.sku, product.description, product.category, product.unit, product.stock,
            product.avg_cost, product.total_value, product.warning_level, 
            product.target_max, product.status
          ]
        );
        console.log(`✅ Added new product: ${product.sku}`);
      }
    } catch (error) {
      console.error(`❌ Failed to update product ${product.sku}:`, error.message);
    }
  }
}

async function insertStockIn(connection) {
  console.log('📥 Adding stock-in transactions...');
  
  for (const transaction of sampleData.stockIn) {
    try {
      await connection.execute(
        `INSERT INTO stock_in 
         (sku, trans_no, date, tdt_po, tdt_po_date, vendor_no, vendor_name, customer_dr, 
          tdt_wo, accept_date, qty, cost_kilo, cost_unit, total_purchase, running_qty, 
          avg_unit_cost, total_value, remark)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transaction.sku, transaction.trans_no, transaction.date, transaction.tdt_po, 
          transaction.tdt_po_date, transaction.vendor_no, transaction.vendor_name, 
          transaction.customer_dr, transaction.tdt_wo, transaction.accept_date, 
          transaction.qty, transaction.cost_kilo, transaction.cost_unit, 
          transaction.total_purchase, transaction.running_qty, transaction.avg_unit_cost, 
          transaction.total_value, transaction.remark
        ]
      );
      console.log(`✅ Added stock-in: ${transaction.sku} (+${transaction.qty})`);
    } catch (error) {
      console.error(`❌ Failed to add stock-in ${transaction.sku}:`, error.message);
    }
  }
}

async function insertStockOut(connection) {
  console.log('📤 Adding stock-out transactions...');
  
  for (const transaction of sampleData.stockOut) {
    try {
      await connection.execute(
        `INSERT INTO stock_out 
         (sku, trans_no, dispatch_date, tdt_wo, customer, tdt_dr, branch, bdr_summary, 
          tdt_si, qty_out, unit_cost, total_price, s1, s2, s3, running_qty, running_value, remarks)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transaction.sku, transaction.trans_no, transaction.dispatch_date, transaction.tdt_wo,
          transaction.customer, transaction.tdt_dr, transaction.branch, transaction.bdr_summary,
          transaction.tdt_si, transaction.qty_out, transaction.unit_cost, transaction.total_price,
          transaction.s1, transaction.s2, transaction.s3, transaction.running_qty, 
          transaction.running_value, transaction.remarks
        ]
      );
      console.log(`✅ Added stock-out: ${transaction.sku} (-${transaction.qty_out})`);
    } catch (error) {
      console.error(`❌ Failed to add stock-out ${transaction.sku}:`, error.message);
    }
  }
}

async function insertPurchaseOrders(connection) {
  console.log('🛒 Adding purchase orders...');
  
  for (const po of sampleData.purchaseOrders) {
    try {
      await connection.execute(
        `INSERT INTO purchase_orders 
         (po_number, vendor_name, vendor_no, order_date, expected_delivery, status, total_amount, remarks)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          po.po_number, po.vendor_name, po.vendor_no, po.order_date, po.expected_delivery, 
          po.status, po.total_amount, po.remarks
        ]
      );
      console.log(`✅ Added PO: ${po.po_number} - ${po.status}`);
    } catch (error) {
      console.error(`❌ Failed to add PO ${po.po_number}:`, error.message);
    }
  }
}

async function insertEndingInventory(connection) {
  console.log('📊 Adding ending inventory records...');
  
  for (const record of sampleData.endingInventory) {
    try {
      await connection.execute(
        `INSERT INTO ending_inventory 
         (sku, inventory_date, physical_count, system_count, unit_cost, remarks)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          record.sku, record.inventory_date, record.physical_count, record.system_count,
          record.unit_cost, record.remarks
        ]
      );
      console.log(`✅ Added ending inventory: ${record.sku}`);
    } catch (error) {
      console.error(`❌ Failed to add ending inventory ${record.sku}:`, error.message);
    }
  }
}

async function insertAdvanceCustomerPo(connection) {
  console.log('🏗️ Adding advance customer PO reservations...');
  
  for (const reservation of sampleData.advanceCustomerPo) {
    try {
      await connection.execute(
        `INSERT INTO advance_customer_po 
         (customer_po, customer_name, po_date, delivery_date, status, total_amount, remarks)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          reservation.customer_po, reservation.customer_name, reservation.po_date,
          reservation.delivery_date, reservation.status, reservation.total_amount, reservation.remarks
        ]
      );
      console.log(`✅ Added reservation: ${reservation.customer_name} - ${reservation.customer_po}`);
    } catch (error) {
      console.error(`❌ Failed to add reservation ${reservation.customer_name}:`, error.message);
    }
  }
}

async function insertBackload(connection) {
  console.log('🔄 Adding backload inventory records...');
  
  for (const backload of sampleData.backload) {
    try {
      await connection.execute(
        `INSERT INTO backload 
         (sku, backload_date, qty_returned, reason, customer, original_dr, condition_status, unit_cost, remarks)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          backload.sku, backload.backload_date, backload.qty_returned, backload.reason,
          backload.customer, backload.original_dr, backload.condition_status, 
          backload.unit_cost, backload.remarks
        ]
      );
      console.log(`✅ Added backload: ${backload.sku} (${backload.qty_returned} pcs)`);
    } catch (error) {
      console.error(`❌ Failed to add backload ${backload.sku}:`, error.message);
    }
  }
}

async function insertReturns(connection) {
  console.log('↩️ Adding return records...');
  
  for (const returnRecord of sampleData.returns) {
    try {
      await connection.execute(
        `INSERT INTO returns 
         (return_no, customer_name, return_date, original_dr, reason, status, total_amount, remarks)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          returnRecord.return_no, returnRecord.customer_name, returnRecord.return_date,
          returnRecord.original_dr, returnRecord.reason, returnRecord.status,
          returnRecord.total_amount, returnRecord.remarks
        ]
      );
      console.log(`✅ Added return: ${returnRecord.return_no}`);
    } catch (error) {
      console.error(`❌ Failed to add return ${returnRecord.return_no}:`, error.message);
    }
  }
}

async function insertComprehensiveSampleData() {
  let connection;
  
  try {
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Clear existing transaction data (keep products structure)
    await clearExistingData(connection);
    
    // Update products with realistic stock and pricing
    await updateProducts(connection);
    
    // Insert transaction data for all modules
    await insertStockIn(connection);
    await insertStockOut(connection);
    await insertPurchaseOrders(connection);
    await insertEndingInventory(connection);
    await insertAdvanceCustomerPo(connection);
    await insertBackload(connection);
    await insertReturns(connection);
    
    console.log('🎉 COMPREHENSIVE SAMPLE DATA INSERTION COMPLETED!');
    console.log('');
    console.log('📋 Summary of inserted data:');
    console.log(`   • ${sampleData.products.length} products updated with realistic stock & pricing`);
    console.log(`   • ${sampleData.stockIn.length} stock-in transactions`);
    console.log(`   • ${sampleData.stockOut.length} stock-out transactions`);
    console.log(`   • ${sampleData.purchaseOrders.length} purchase orders`);
    console.log(`   • ${sampleData.endingInventory.length} ending inventory records`);
    console.log(`   • ${sampleData.advanceCustomerPo.length} advance customer PO reservations`);
    console.log(`   • ${sampleData.backloadInventory.length} backload inventory records`);
    console.log(`   • ${sampleData.returns.length} return records`);
    console.log('');
    console.log('🚀 Your TDT Warehouse Inventory System now has comprehensive sample data!');
    console.log('📊 Dashboard metrics should now show realistic numbers');
    console.log('📈 Charts and reports will display meaningful data');
    console.log('🔍 All modules are populated and ready for demonstration');
    
  } catch (error) {
    console.error('❌ Database operation failed:', error.message);
    console.error('Make sure:');
    console.error('1. MySQL server is running');
    console.error('2. Database "tdt_wis" exists');
    console.error('3. .env file has correct configuration');
    console.error('4. All required tables are created');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the script
insertComprehensiveSampleData().catch(console.error);