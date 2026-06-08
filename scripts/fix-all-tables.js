// Fix all database tables structure 
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

async function fixAllTables() {
  try {
    console.log('🔗 Connecting to database...');
    const connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ Connected to database');
    console.log('🔧 Checking and fixing all table structures...');
    
    // Disable foreign key checks temporarily
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // Drop and recreate all tables with proper structure
    console.log('📋 Creating purchase_orders table...');
    await connection.execute('DROP TABLE IF EXISTS purchase_order_items');
    await connection.execute('DROP TABLE IF EXISTS purchase_orders');
    await connection.execute(`
      CREATE TABLE purchase_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        po_number VARCHAR(50) UNIQUE NOT NULL,
        vendor_name VARCHAR(255) NOT NULL,
        vendor_no VARCHAR(50),
        order_date DATE NOT NULL,
        expected_delivery DATE,
        status ENUM('Pending', 'Partial', 'Completed', 'Cancelled') DEFAULT 'Pending',
        total_amount DECIMAL(15,2) DEFAULT 0.00,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    await connection.execute(`
      CREATE TABLE purchase_order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        po_id INT NOT NULL,
        sku VARCHAR(50) NOT NULL,
        description TEXT,
        qty_ordered INT NOT NULL,
        qty_received INT DEFAULT 0,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(15,2) NOT NULL,
        FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Purchase orders tables created');
    
    console.log('📋 Creating ending_inventory table...');
    await connection.execute('DROP TABLE IF EXISTS ending_inventory');
    await connection.execute(`
      CREATE TABLE ending_inventory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sku VARCHAR(50) NOT NULL,
        inventory_date DATE NOT NULL,
        physical_count INT NOT NULL,
        system_count INT NOT NULL,
        variance INT GENERATED ALWAYS AS (physical_count - system_count) STORED,
        unit_cost DECIMAL(10,2) NOT NULL,
        total_value DECIMAL(15,2) GENERATED ALWAYS AS (physical_count * unit_cost) STORED,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Ending inventory table created');
    
    console.log('📋 Creating backload table...');
    await connection.execute('DROP TABLE IF EXISTS backload');
    await connection.execute(`
      CREATE TABLE backload (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sku VARCHAR(50) NOT NULL,
        backload_date DATE NOT NULL,
        qty_returned INT NOT NULL,
        reason VARCHAR(255) NOT NULL,
        customer VARCHAR(255),
        original_dr VARCHAR(50),
        condition_status ENUM('Good', 'Damaged', 'Defective') DEFAULT 'Good',
        unit_cost DECIMAL(10,2) NOT NULL,
        total_value DECIMAL(15,2) GENERATED ALWAYS AS (qty_returned * unit_cost) STORED,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Backload table created');
    
    console.log('📋 Creating advance customer PO tables...');
    await connection.execute('DROP TABLE IF EXISTS advance_customer_po_items');
    await connection.execute('DROP TABLE IF EXISTS advance_customer_po');
    await connection.execute(`
      CREATE TABLE advance_customer_po (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_po VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        po_date DATE NOT NULL,
        delivery_date DATE,
        status ENUM('Pending', 'Partial', 'Completed', 'Cancelled') DEFAULT 'Pending',
        total_amount DECIMAL(15,2) DEFAULT 0.00,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    await connection.execute(`
      CREATE TABLE advance_customer_po_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_po_id INT NOT NULL,
        sku VARCHAR(50) NOT NULL,
        description TEXT,
        qty_ordered INT NOT NULL,
        qty_delivered INT DEFAULT 0,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(15,2) NOT NULL,
        FOREIGN KEY (customer_po_id) REFERENCES advance_customer_po(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Advance customer PO tables created');
    
    console.log('📋 Creating returns tables...');
    await connection.execute('DROP TABLE IF EXISTS return_items');
    await connection.execute('DROP TABLE IF EXISTS returns');
    await connection.execute(`
      CREATE TABLE returns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        return_no VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        return_date DATE NOT NULL,
        original_dr VARCHAR(50),
        reason TEXT NOT NULL,
        status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
        total_amount DECIMAL(15,2) DEFAULT 0.00,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    await connection.execute(`
      CREATE TABLE return_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        return_id INT NOT NULL,
        sku VARCHAR(50) NOT NULL,
        description TEXT,
        qty_returned INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(15,2) NOT NULL,
        condition_status ENUM('Good', 'Damaged', 'Defective') DEFAULT 'Good',
        FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Returns tables created');
    
    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    await connection.end();
    console.log('✅ All database tables fixed successfully!');
    console.log('🚀 Dashboard should work properly now.');
    
  } catch (error) {
    console.error('❌ Database fix failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the script
fixAllTables().catch(console.error);