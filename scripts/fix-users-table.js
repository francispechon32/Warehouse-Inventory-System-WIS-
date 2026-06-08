// Fix users table structure - ensure proper column names
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

async function fixUsersTable() {
  try {
    console.log('🔗 Connecting to database...');
    const connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ Connected to database');
    console.log('🔧 Checking users table structure...');
    
    // Check if table exists and get current structure
    try {
      const [columns] = await connection.execute(`
        SHOW COLUMNS FROM users
      `);
      console.log('📋 Current table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default ? `DEFAULT '${col.Default}'` : ''}`);
      });
      
      // Check if last_active column exists
      const hasLastActive = columns.some(col => col.Field === 'last_active');
      if (!hasLastActive) {
        console.log('⚠️  Missing last_active column, adding it...');
        await connection.execute(`
          ALTER TABLE users 
          ADD COLUMN last_active VARCHAR(100) DEFAULT 'Active now' AFTER role
        `);
        console.log('✅ Added last_active column');
      }
      
      // Update role enum to match our needs
      console.log('🔧 Updating role enum...');
      await connection.execute(`
        ALTER TABLE users 
        MODIFY COLUMN role ENUM('Admin', 'Employee') DEFAULT 'Employee'
      `);
      console.log('✅ Updated role enum');
      
    } catch (error) {
      console.log('⚠️  Table does not exist, will create it');
      
      // Disable foreign key checks temporarily
      await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
      
      // Drop table if exists
      await connection.execute('DROP TABLE IF EXISTS users');
      
      // Recreate users table with correct structure
      await connection.execute(`
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role ENUM('Admin', 'Employee') DEFAULT 'Employee',
          last_active VARCHAR(100) DEFAULT 'Active now',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      // Re-enable foreign key checks
      await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
      
      console.log('✅ Users table recreated successfully');
    }
    
    // Check if admin user exists
    const [adminCheck] = await connection.execute(
      'SELECT COUNT(*) as count FROM users WHERE email = ?', 
      ['admin']
    );
    
    if (adminCheck[0].count === 0) {
      // Insert default admin user
      await connection.execute(`
        INSERT INTO users (name, email, password, role, last_active) 
        VALUES ('Administrator', 'admin', 'admin', 'Admin', 'Active now')
      `);
      console.log('✅ Default admin user created (admin/admin)');
    } else {
      console.log('✅ Admin user already exists');
    }
    
    // Also fix pending signups table
    await connection.execute('DROP TABLE IF EXISTS pending_signups');
    await connection.execute(`
      CREATE TABLE pending_signups (
        id VARCHAR(20) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        otp VARCHAR(6) NOT NULL,
        expires_at BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Pending signups table recreated');
    
    await connection.end();
    console.log('✅ Database fix completed successfully!');
    console.log('🚀 You can now use the signup system properly.');
    
  } catch (error) {
    console.error('❌ Database fix failed:', error.message);
    console.error('Full error:', error);
    console.error('Make sure:');
    console.error('1. XAMPP MySQL is running');
    console.error('2. Database "tdt_wis" exists');
    console.error('3. .env file has correct database configuration');
    process.exit(1);
  }
}

// Run the script
fixUsersTable().catch(console.error);