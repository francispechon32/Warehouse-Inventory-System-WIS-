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
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Initialize database tables
export async function initializeTables() {
  try {
    const connection = await pool.getConnection();
    
    // Users table - updated to support flexible roles
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'Employee',
        last_active VARCHAR(100) DEFAULT 'Active now',
        department VARCHAR(255),
        location VARCHAR(255),
        phone VARCHAR(50),
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Add new columns to existing users table if they don't exist
    const columnChecks = [
      { column: 'department', type: 'VARCHAR(255)' },
      { column: 'location', type: 'VARCHAR(255)' },
      { column: 'phone', type: 'VARCHAR(50)' },
      { column: 'status', type: 'VARCHAR(20) DEFAULT \'active\'' }
    ];

    for (const { column, type } of columnChecks) {
      try {
        // Check if column exists
        const [rows] = await connection.execute(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME = ?
        `, [column]);
        
        // Add column if it doesn't exist
        if (rows.length === 0) {
          await connection.execute(`ALTER TABLE users ADD COLUMN ${column} ${type}`);
          console.log(`✅ Added column '${column}' to users table`);
        }
      } catch (e) {
        console.log(`⚠️ Could not add column '${column}':`, e.message);
      }
    }

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role_name VARCHAR(50) UNIQUE NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        permissions JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Insert default roles if none exist
    const [roleRows] = await connection.execute('SELECT COUNT(*) as count FROM user_roles');
    if (roleRows[0].count === 0) {
      const defaultRoles = [
        { role_name: 'Admin', display_name: 'Administrator', permissions: '{"all": true}' },
        { role_name: 'Manager', display_name: 'Manager', permissions: '{"read": true, "write": true, "delete": false}' },
        { role_name: 'Employee', display_name: 'Employee', permissions: '{"read": true, "write": true, "delete": false}' },
        { role_name: 'Viewer', display_name: 'Viewer', permissions: '{"read": true, "write": false, "delete": false}' }
      ];
      
      for (const role of defaultRoles) {
        await connection.execute(
          'INSERT INTO user_roles (role_name, display_name, permissions) VALUES (?, ?, ?)',
          [role.role_name, role.display_name, role.permissions]
        );
      }
      console.log('✅ Default user roles created');
    }

    // Products table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sku VARCHAR(50) UNIQUE NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        unit VARCHAR(20) NOT NULL,
        stock INT DEFAULT 0,
        avg_cost DECIMAL(10,2) DEFAULT 0.00,
        total_value DECIMAL(15,2) DEFAULT 0.00,
        warning_level INT DEFAULT 50,
        target_max INT DEFAULT 200,
        status ENUM('Active', 'Low Stock', 'Inactive') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Add missing columns to existing products table if they don't exist
    const productColumnChecks = [
      { column: 'warning_level', type: 'INT DEFAULT 50' },
      { column: 'target_max', type: 'INT DEFAULT 200' }
    ];

    for (const { column, type } of productColumnChecks) {
      try {
        // Check if column exists
        const [rows] = await connection.execute(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'products' 
            AND COLUMN_NAME = ?
        `, [column]);
        
        // Add column if it doesn't exist
        if (rows.length === 0) {
          await connection.execute(`ALTER TABLE products ADD COLUMN ${column} ${type}`);
          console.log(`✅ Added column '${column}' to products table`);
        }
      } catch (e) {
        console.log(`⚠️ Could not add column '${column}':`, e.message);
      }
    }

    // Stock In transactions
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS stock_in (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sku VARCHAR(50) NOT NULL,
        trans_no VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        tdt_po VARCHAR(50),
        tdt_po_date DATE,
        vendor_no VARCHAR(50),
        vendor_name VARCHAR(255),
        customer_dr VARCHAR(255),
        tdt_wo VARCHAR(50),
        accept_date DATE,
        qty INT NOT NULL,
        cost_kilo DECIMAL(10,2),
        cost_unit DECIMAL(10,2) NOT NULL,
        total_purchase DECIMAL(15,2) NOT NULL,
        running_qty INT,
        avg_unit_cost DECIMAL(10,2),
        total_value DECIMAL(15,2),
        remark TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sku) REFERENCES products(sku) ON DELETE CASCADE
      )
    `);

    // Stock Out transactions
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS stock_out (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sku VARCHAR(50) NOT NULL,
        trans_no VARCHAR(50) NOT NULL,
        dispatch_date DATE NOT NULL,
        tdt_wo VARCHAR(50),
        customer VARCHAR(255) NOT NULL,
        tdt_dr VARCHAR(50),
        branch VARCHAR(100),
        bdr_summary VARCHAR(50),
        tdt_si VARCHAR(50),
        qty_out INT NOT NULL,
        unit_cost DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(15,2) NOT NULL,
        s1 VARCHAR(100),
        s2 VARCHAR(100),
        s3 VARCHAR(100),
        running_qty INT,
        running_value DECIMAL(15,2),
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sku) REFERENCES products(sku) ON DELETE CASCADE
      )
    `);

    // Purchase Orders
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
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

    // Purchase Order Items
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS purchase_order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        po_id INT NOT NULL,
        sku VARCHAR(50) NOT NULL,
        description TEXT,
        qty_ordered INT NOT NULL,
        qty_received INT DEFAULT 0,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(15,2) NOT NULL,
        FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
        FOREIGN KEY (sku) REFERENCES products(sku) ON DELETE CASCADE
      )
    `);

    // Ending Inventory
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ending_inventory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sku VARCHAR(50) NOT NULL,
        inventory_date DATE NOT NULL,
        physical_count INT NOT NULL,
        system_count INT NOT NULL,
        variance INT GENERATED ALWAYS AS (physical_count - system_count) STORED,
        unit_cost DECIMAL(10,2) NOT NULL,
        total_value DECIMAL(15,2) GENERATED ALWAYS AS (physical_count * unit_cost) STORED,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sku) REFERENCES products(sku) ON DELETE CASCADE
      )
    `);

    // Backload
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS backload (
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sku) REFERENCES products(sku) ON DELETE CASCADE
      )
    `);

    // Advance Customer PO
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS advance_customer_po (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_po VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        po_date DATE NOT NULL,
        delivery_date DATE,
        status ENUM('Pending Approval', 'Approved', 'Rejected', 'Partial', 'Completed', 'Cancelled') DEFAULT 'Pending Approval',
        total_amount DECIMAL(15,2) DEFAULT 0.00,
        remarks TEXT,
        created_by INT,
        approved_by INT,
        approval_date TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (approved_by) REFERENCES users(id)
      )
    `);

    // Add approval columns to existing advance_customer_po table if they don't exist
    const approvalColumnChecks = [
      { column: 'created_by', type: 'INT' },
      { column: 'approved_by', type: 'INT' },
      { column: 'approval_date', type: 'TIMESTAMP NULL' }
    ];

    for (const { column, type } of approvalColumnChecks) {
      try {
        // Check if column exists
        const [rows] = await connection.execute(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'advance_customer_po' 
            AND COLUMN_NAME = ?
        `, [column]);
        
        // Add column if it doesn't exist
        if (rows.length === 0) {
          await connection.execute(`ALTER TABLE advance_customer_po ADD COLUMN ${column} ${type}`);
          console.log(`✅ Added column '${column}' to advance_customer_po table`);
        }
      } catch (e) {
        console.log(`⚠️ Could not add column '${column}':`, e.message);
      }
    }

    // Update status enum to include approval statuses
    try {
      await connection.execute(`
        ALTER TABLE advance_customer_po 
        MODIFY COLUMN status ENUM('Pending Approval', 'Approved', 'Rejected', 'Partial', 'Completed', 'Cancelled') DEFAULT 'Pending Approval'
      `);
      console.log('✅ Updated advance_customer_po status enum with approval statuses');
    } catch (e) {
      console.log('⚠️ Could not update status enum:', e.message);
    }
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS advance_customer_po_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_po_id INT NOT NULL,
        sku VARCHAR(50) NOT NULL,
        description TEXT,
        qty_ordered INT NOT NULL,
        qty_delivered INT DEFAULT 0,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(15,2) NOT NULL,
        FOREIGN KEY (customer_po_id) REFERENCES advance_customer_po(id) ON DELETE CASCADE,
        FOREIGN KEY (sku) REFERENCES products(sku) ON DELETE CASCADE
      )
    `);

    // Returns
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS returns (
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

    // Return Items
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS return_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        return_id INT NOT NULL,
        sku VARCHAR(50) NOT NULL,
        description TEXT,
        qty_returned INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(15,2) NOT NULL,
        condition_status ENUM('Good', 'Damaged', 'Defective') DEFAULT 'Good',
        FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE,
        FOREIGN KEY (sku) REFERENCES products(sku) ON DELETE CASCADE
      )
    `);

    // Pending Signups (for OTP verification)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS pending_signups (
        id VARCHAR(20) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        expires_at BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Pending Password Resets (forgot password OTP)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS pending_password_resets (
        id VARCHAR(20) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        expires_at BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default admin user if no users exist
    const [userRows] = await connection.execute('SELECT COUNT(*) as count FROM users');
    if (userRows[0].count === 0) {
      await connection.execute(`
        INSERT INTO users (name, email, password, role) 
        VALUES ('Administrator', 'admin', 'admin', 'Admin')
      `);
      console.log('✅ Default admin user created (admin/admin)');
    }

    connection.release();
    console.log('✅ Database tables initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize database tables:', error.message);
    throw error;
  }
}

export default pool;