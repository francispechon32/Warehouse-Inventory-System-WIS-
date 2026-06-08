// Sample data insertion script for TDT Warehouse Inventory System
// Run this script to add some sample products to your clean database

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tdt_wis',
};

// Sample products data
const sampleProducts = [
  {
    sku: 'DRB007',
    description: 'Deformed Round Bar, 10mm x 6M g33',
    category: 'Deformed Round Bar',
    unit: 'pcs',
    stock: 0,
    avg_cost: 138.60,
    total_value: 0,
    status: 'Active'
  },
  {
    sku: 'DRB008',
    description: 'Deformed Round Bar, 12mm x 6M g33',
    category: 'Deformed Round Bar',
    unit: 'pcs',
    stock: 0,
    avg_cost: 142.50,
    total_value: 0,
    status: 'Active'
  },
  {
    sku: 'MSP010',
    description: 'MS Plate, 6mm x 4\' x 8\'',
    category: 'MS Plate',
    unit: 'pcs',
    stock: 0,
    avg_cost: 554.79,
    total_value: 0,
    status: 'Active'
  },
  {
    sku: 'SHPT2',
    description: 'Sheet Pile, T2, 400mm x 100mm x 10.5mm x 48kg/m x 12M (576 kilos)',
    category: 'Sheet Pile',
    unit: 'pcs',
    stock: 0,
    avg_cost: 22529.66,
    total_value: 0,
    status: 'Active'
  },
  {
    sku: 'WF016',
    description: 'Wide Flange, 8 x 4 x 10# x 6M',
    category: 'Wide Flange',
    unit: 'pcs',
    stock: 0,
    avg_cost: 8900.00,
    total_value: 0,
    status: 'Active'
  }
];

async function insertSampleData() {
  try {
    console.log('🔗 Connecting to database...');
    const connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ Connected to database');
    console.log('📦 Inserting sample products...');
    
    for (const product of sampleProducts) {
      try {
        await connection.execute(
          `INSERT INTO products (sku, description, category, unit, stock, avg_cost, total_value, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            product.sku,
            product.description,
            product.category,
            product.unit,
            product.stock,
            product.avg_cost,
            product.total_value,
            product.status
          ]
        );
        console.log(`✅ Added product: ${product.sku} - ${product.description}`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️  Product ${product.sku} already exists, skipping...`);
        } else {
          console.error(`❌ Failed to add product ${product.sku}:`, error.message);
        }
      }
    }
    
    await connection.end();
    console.log('✅ Sample data insertion completed!');
    console.log('🚀 You can now start using the system with sample products.');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Make sure:');
    console.error('1. XAMPP MySQL is running');
    console.error('2. Database "tdt_wis" exists');
    console.error('3. .env file has correct database configuration');
    process.exit(1);
  }
}

// Run the script
insertSampleData().catch(console.error);