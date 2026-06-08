/* eslint-disable no-undef */
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import pool, { testConnection, initializeTables } from "./database.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Initialize database on startup
async function initializeServer() {
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Cannot start server without database connection');
    process.exit(1);
  }
  await initializeTables();
}

app.get("/api/health", async (req, res) => {
  try {
    const connected = await testConnection();
    res.json({ 
      status: connected ? "ok" : "error",
      database: connected ? "connected" : "disconnected",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: "error", 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// --- Auth endpoints ---
const OTP_EXPIRATION_MS = 10 * 60 * 1000;

function createMailer() {
  // Enable Gmail email sending for production use
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

async function sendOtpEmail({ to, name, otp }) {
  console.log("🔹 Starting email send process...");
  console.log("🔹 Email config check:");
  console.log("  SMTP_USER:", process.env.SMTP_USER ? 'Set' : 'Not set');
  console.log("  SMTP_PASS:", process.env.SMTP_PASS ? 'Set' : 'Not set');
  console.log("  SMTP_HOST:", process.env.SMTP_HOST);
  
  const transporter = createMailer();
  
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("⚠ SMTP_USER or SMTP_PASS not set. Email delivery is disabled in development mode.");
    return { success: true, developmentMode: true, otp };
  }

  if (!transporter) {
    console.error("❌ Email transporter not configured properly");
    throw new Error("Email service not available");
  }

  const from = `"TDT PowerSteel System" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`;
  const subject = `Your verification code: ${otp}`;
  const text = `Hello ${name},

Your TDT PowerSteel Inventory System verification code is: ${otp}

This code will expire in 10 minutes for security purposes.

If you did not request this verification code, please ignore this email.

Best regards,
TDT PowerSteel Team`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>TDT PowerSteel - Verification Code</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1a2332; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; color: #e87c27;">TDT PowerSteel</h1>
          <p style="margin: 5px 0 0 0; color: #ccc;">Inventory Management System</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-left: 4px solid #e87c27;">
          <h2 style="color: #333; margin-top: 0;">Hello ${name},</h2>
          <p>Your verification code for TDT PowerSteel Inventory System is:</p>
          
          <div style="background: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #e87c27; font-size: 32px; margin: 0; letter-spacing: 4px;">${otp}</h1>
          </div>
          
          <p style="color: #666;">This code will expire in 10 minutes for security purposes.</p>
          <p style="color: #666;">If you did not request this verification, please ignore this email.</p>
        </div>
        
        <div style="padding: 20px; text-align: center; color: #888; font-size: 12px;">
          <p>© 2024 TDT PowerSteel. All rights reserved.</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  console.log("🔹 Attempting to send email to:", to);
  console.log("🔹 From:", from);
  console.log("🔹 OTP:", otp);

  try {
    const mailOptions = {
      from: from,
      to: to,
      subject: subject,
      text: text,
      html: html,
      headers: {
        'X-Mailer': 'TDT PowerSteel System',
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Reply-To': process.env.EMAIL_FROM || process.env.SMTP_USER
      }
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully!");
    console.log("📧 Message ID:", info.messageId);
    console.log("📧 Response:", info.response);
    
    return { 
      success: true,
      previewUrl: nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null,
      messageId: info.messageId
    };
  } catch (error) {
    console.error("❌ Email sending failed:");
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("Full error:", error);
    throw error;
  }
}

app.post('/api/auth/signup-request', async (req, res) => {
  const { name, email, password } = req.body || {};
  
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const connection = await pool.getConnection();
    
    // Check if email already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?', 
      [email]
    );
    
    if (existingUsers.length > 0) {
      connection.release();
      return res.status(409).json({ message: 'Email already in use' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + OTP_EXPIRATION_MS;
    const pendingId = Date.now().toString();

    // Clean up expired pending signups
    await connection.execute(
      'DELETE FROM pending_signups WHERE expires_at < ?', 
      [Date.now()]
    );

    // Remove any existing pending signup for this email
    await connection.execute(
      'DELETE FROM pending_signups WHERE email = ?', 
      [email]
    );

    // Insert new pending signup
    await connection.execute(
      'INSERT INTO pending_signups (id, name, email, password, otp, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      [pendingId, name, email, password, otp, expiresAt]
    );

    connection.release();

    try {
      const result = await sendOtpEmail({ to: email, name, otp });
      res.status(200).json(result);
    } catch (error) {
      console.error("Failed to send OTP email", error);
      res.status(500).json({ message: "Failed to send OTP email" });
    }

  } catch (error) {
    console.error('Signup request error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/auth/signup-verify', async (req, res) => {
  const { email, otp } = req.body || {};
  
  if (!email || !otp) {
    return res.status(400).json({ message: 'Missing email or OTP' });
  }

  try {
    const connection = await pool.getConnection();

    // Find pending signup
    const [pendingSignups] = await connection.execute(
      'SELECT * FROM pending_signups WHERE email = ?', 
      [email]
    );

    if (pendingSignups.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'No pending signup found for this email' });
    }

    const pending = pendingSignups[0];

    if (Date.now() > pending.expires_at) {
      await connection.execute('DELETE FROM pending_signups WHERE email = ?', [email]);
      connection.release();
      return res.status(410).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (pending.otp !== String(otp).trim()) {
      connection.release();
      return res.status(401).json({ message: 'Invalid OTP code' });
    }

    // Create new user
    const [result] = await connection.execute(
      'INSERT INTO users (name, email, password, role, last_active) VALUES (?, ?, ?, ?, ?)',
      [pending.name, pending.email, pending.password, 'Employee', 'Active now']
    );

    // Clean up pending signup
    await connection.execute('DELETE FROM pending_signups WHERE email = ?', [email]);

    // Get the created user
    const [newUsers] = await connection.execute(
      'SELECT id, name, email, role, last_active FROM users WHERE id = ?',
      [result.insertId]
    );

    connection.release();

    const newUser = newUsers[0];
    res.status(201).json(newUser);

  } catch (error) {
    console.error('Signup verify error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ message: 'Missing email' });
  }

  try {
    const connection = await pool.getConnection();
    const [users] = await connection.execute('SELECT id, name, email FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      connection.release();
      return res.status(200).json({
        message: 'If an account exists for this email, an OTP has been sent.',
        success: true,
      });
    }

    const user = users[0];
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + OTP_EXPIRATION_MS;
    const resetId = Date.now().toString();

    await connection.execute('DELETE FROM pending_password_resets WHERE expires_at < ?', [Date.now()]);
    await connection.execute('DELETE FROM pending_password_resets WHERE email = ?', [email]);
    await connection.execute(
      'INSERT INTO pending_password_resets (id, email, otp, expires_at) VALUES (?, ?, ?, ?)',
      [resetId, email, otp, expiresAt]
    );

    connection.release();

    const result = await sendOtpEmail({ to: email, name: user.name || 'User', otp });
    res.status(200).json(result);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/auth/forgot-password/verify', async (req, res) => {
  const { email, otp, password } = req.body || {};
  if (!email || !otp || !password) {
    return res.status(400).json({ message: 'Missing email, OTP, or new password' });
  }

  try {
    const connection = await pool.getConnection();
    const [entries] = await connection.execute('SELECT * FROM pending_password_resets WHERE email = ?', [email]);

    if (entries.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'No password reset request found for this email' });
    }

    const reset = entries[0];
    if (Date.now() > reset.expires_at) {
      await connection.execute('DELETE FROM pending_password_resets WHERE email = ?', [email]);
      connection.release();
      return res.status(410).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (reset.otp !== String(otp).trim()) {
      connection.release();
      return res.status(401).json({ message: 'Invalid OTP code' });
    }

    await connection.execute('UPDATE users SET password = ? WHERE email = ?', [password, email]);
    await connection.execute('DELETE FROM pending_password_resets WHERE email = ?', [email]);
    connection.release();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Forgot password verify error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Missing email or password' });
  }

  try {
    const connection = await pool.getConnection();

    const [users] = await connection.execute(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      [email, password]
    );

    connection.release();

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    // Simple token (not secure) — in production use JWT or similar
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
    
    const safeUser = { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role,
      department: user.department,
      location: user.location,
      phone: user.phone,
      token 
    };
    
    res.json(safeUser);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get current user profile by email
app.get('/api/auth/profile/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const connection = await pool.getConnection();
    
    const [users] = await connection.execute(
      'SELECT id, name, email, role, department, location, phone, last_active, created_at FROM users WHERE email = ?',
      [email]
    );
    
    connection.release();
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// --- CRUD Endpoints ---

// Users endpoints
app.get('/api/users', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT id, name, email, password, role, last_active, department, location, phone, status, created_at FROM users ORDER BY id');
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// User roles endpoints
app.get('/api/user-roles', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM user_roles ORDER BY role_name');
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Get user roles error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/user-roles', async (req, res) => {
  try {
    const { role_name, display_name, permissions } = req.body;
    const connection = await pool.getConnection();
    
    const [result] = await connection.execute(
      'INSERT INTO user_roles (role_name, display_name, permissions) VALUES (?, ?, ?)',
      [role_name, display_name, JSON.stringify(permissions)]
    );
    
    const [newRole] = await connection.execute(
      'SELECT * FROM user_roles WHERE id = ?',
      [result.insertId]
    );
    
    connection.release();
    res.status(201).json(newRole[0]);
  } catch (error) {
    console.error('Create user role error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ message: 'Role name already exists' });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

app.put('/api/user-roles/:id', async (req, res) => {
  try {
    const { role_name, display_name, permissions } = req.body;
    const connection = await pool.getConnection();
    
    await connection.execute(
      'UPDATE user_roles SET role_name = ?, display_name = ?, permissions = ? WHERE id = ?',
      [role_name, display_name, JSON.stringify(permissions), req.params.id]
    );
    
    const [updatedRole] = await connection.execute(
      'SELECT * FROM user_roles WHERE id = ?',
      [req.params.id]
    );
    
    connection.release();
    
    if (updatedRole.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }
    
    res.json(updatedRole[0]);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/user-roles/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Check if any users are using this role
    const [roleCheck] = await connection.execute('SELECT role_name FROM user_roles WHERE id = ?', [req.params.id]);
    if (roleCheck.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Role not found' });
    }
    
    const roleName = roleCheck[0].role_name;
    const [usersWithRole] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE role = ?', [roleName]);
    
    if (usersWithRole[0].count > 0) {
      connection.release();
      return res.status(400).json({ message: `Cannot delete role. ${usersWithRole[0].count} user(s) are assigned to this role.` });
    }
    
    await connection.execute('DELETE FROM user_roles WHERE id = ?', [req.params.id]);
    connection.release();
    res.status(204).send();
  } catch (error) {
    console.error('Delete user role error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/users', async (req, res) => {
  try {
    const users = Array.isArray(req.body) ? req.body : [];
    const connection = await pool.getConnection();
    
    await connection.execute('DELETE FROM users');
    
    for (const user of users) {
      await connection.execute(
        'INSERT INTO users (id, name, email, password, role, last_active) VALUES (?, ?, ?, ?, ?, ?)',
        [user.id, user.name, user.email, user.password, user.role, user.last_active || 'Active now']
      );
    }
    
    connection.release();
    res.status(204).send();
  } catch (error) {
    console.error('Put users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT id, name, email, password, role, last_active, department, location, phone, status, created_at FROM users WHERE id = ?', [req.params.id]);
    connection.release();
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, email, password, role, department, location, phone, status } = req.body;
    const connection = await pool.getConnection();
    
    const [result] = await connection.execute(
      'INSERT INTO users (name, email, password, role, last_active, department, location, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, password, role || 'Employee', 'Active now', department || null, location || null, phone || null, status || 'active']
    );
    
    const [newUser] = await connection.execute(
      'SELECT id, name, email, password, role, last_active, department, location, phone, status, created_at FROM users WHERE id = ?',
      [result.insertId]
    );
    
    connection.release();
    res.status(201).json(newUser[0]);
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ message: 'Email already exists' });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

app.patch('/api/users/:id', async (req, res) => {
  try {
    const updates = req.body;
    const connection = await pool.getConnection();
    
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(req.params.id);
    
    await connection.execute(`UPDATE users SET ${fields} WHERE id = ?`, values);
    
    const [updatedUser] = await connection.execute(
      'SELECT id, name, email, password, role, last_active, department, location, phone, status, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    
    connection.release();
    
    if (updatedUser.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(updatedUser[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    connection.release();
    res.status(204).send();
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Products endpoints
app.get('/api/products', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM products ORDER BY id');
    connection.release();
    
    // Convert snake_case to camelCase for frontend compatibility
    const convertedRows = rows.map(row => ({
      ...row,
      avgCost: row.avg_cost,
      totalValue: row.total_value,
      warningLevel: row.warning_level,
      targetMax: row.target_max,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json(convertedRows);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/products', async (req, res) => {
  try {
    const products = Array.isArray(req.body) ? req.body : [];
    const connection = await pool.getConnection();
    
    await connection.execute('DELETE FROM products');
    
    const processedSkus = new Set(); // Track processed SKUs to avoid duplicates
    
    for (const product of products) {
      try {
        const sku = product.sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // Skip if we've already processed this SKU
        if (processedSkus.has(sku.toUpperCase())) {
          console.log(`Skipping duplicate SKU: ${sku}`);
          continue;
        }
        
        processedSkus.add(sku.toUpperCase());
        
        await connection.execute(
          `INSERT INTO products (sku, description, category, unit, stock, avg_cost, total_value, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
           ON DUPLICATE KEY UPDATE 
           description = VALUES(description), 
           category = VALUES(category), 
           unit = VALUES(unit), 
           stock = VALUES(stock), 
           avg_cost = VALUES(avg_cost), 
           total_value = VALUES(total_value), 
           status = VALUES(status)`,
          [
            sku,
            product.description || 'No description',
            product.category || 'General',
            product.unit || 'pcs',
            product.stock || 0,
            product.avgCost || 0,
            product.totalValue || 0,
            product.status || 'Active'
          ]
        );
      } catch (insertError) {
        console.error('Error inserting product record:', insertError.message, product);
        // Continue with other records instead of failing completely
      }
    }
    
    connection.release();
    res.status(204).send();
  } catch (error) {
    console.error('Put products error:', error);
    res.status(500).json({ message: 'Internal server error: ' + error.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM products WHERE id = ?', [req.params.id]);
    connection.release();
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Convert snake_case to camelCase for frontend compatibility
    const row = rows[0];
    const convertedRow = {
      ...row,
      avgCost: row.avg_cost,
      totalValue: row.total_value,
      warningLevel: row.warning_level,
      targetMax: row.target_max,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
    
    res.json(convertedRow);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { sku, description, category, unit, stock, avgCost, totalValue, status } = req.body;
    const connection = await pool.getConnection();
    
    const [result] = await connection.execute(
      'INSERT INTO products (sku, description, category, unit, stock, avg_cost, total_value, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [sku, description, category, unit, stock || 0, avgCost || 0, totalValue || 0, status || 'Active']
    );
    
    const [newProduct] = await connection.execute('SELECT * FROM products WHERE id = ?', [result.insertId]);
    
    connection.release();
    
    // Convert snake_case to camelCase for frontend compatibility
    const row = newProduct[0];
    const convertedRow = {
      ...row,
      avgCost: row.avg_cost,
      totalValue: row.total_value,
      warningLevel: row.warning_level,
      targetMax: row.target_max,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
    
    res.status(201).json(convertedRow);
  } catch (error) {
    console.error('Create product error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ message: 'SKU already exists' });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

app.patch('/api/products/:id', async (req, res) => {
  try {
    const updates = req.body;
    const connection = await pool.getConnection();
    
    // Convert camelCase to snake_case for database columns
    const dbUpdates = {};
    Object.keys(updates).forEach(key => {
      switch(key) {
        case 'avgCost': dbUpdates['avg_cost'] = updates[key]; break;
        case 'totalValue': dbUpdates['total_value'] = updates[key]; break;
        default: dbUpdates[key] = updates[key]; break;
      }
    });
    
    const fields = Object.keys(dbUpdates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(dbUpdates);
    values.push(req.params.id);
    
    await connection.execute(`UPDATE products SET ${fields} WHERE id = ?`, values);
    
    const [updatedProduct] = await connection.execute('SELECT * FROM products WHERE id = ?', [req.params.id]);
    
    connection.release();
    
    if (updatedProduct.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Convert snake_case to camelCase for frontend compatibility
    const row = updatedProduct[0];
    const convertedRow = {
      ...row,
      avgCost: row.avg_cost,
      totalValue: row.total_value,
      warningLevel: row.warning_level,
      targetMax: row.target_max,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
    
    res.json(convertedRow);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
    connection.release();
    res.status(204).send();
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Stock In endpoints
app.get('/api/stock-in', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM stock_in ORDER BY date DESC, id DESC');
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Get stock-in error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/stock-in', async (req, res) => {
  try {
    const stockIn = Array.isArray(req.body) ? req.body : [];
    const connection = await pool.getConnection();
    
    await connection.execute('DELETE FROM stock_in');
    
    for (const item of stockIn) {
      try {
        await connection.execute(
          `INSERT INTO stock_in (sku, trans_no, date, tdt_po, tdt_po_date, vendor_no, vendor_name, 
           customer_dr, tdt_wo, accept_date, qty, cost_kilo, cost_unit, total_purchase, running_qty, 
           avg_unit_cost, total_value, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.sku || '',
            item.transNo || item.trans_no || `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            item.date || new Date().toISOString().slice(0, 10),
            item.tdtPo || item.tdt_po || null,
            item.tdtPoDate || item.tdt_po_date || null,
            item.vendorNo || item.vendor_no || null,
            item.vendorName || item.vendor_name || null,
            item.customerDr || item.customer_dr || null,
            item.tdtWo || item.tdt_wo || null,
            item.acceptDate || item.accept_date || null,
            item.qty || 0,
            item.costKilo || item.cost_kilo || null,
            item.costUnit || item.cost_unit || 0,
            item.totalPurchase || item.total_purchase || 0,
            item.runningQty || item.running_qty || null,
            item.avgUnitCost || item.avg_unit_cost || null,
            item.totalValue || item.total_value || 0,
            item.remark || item.remarks || null
          ]
        );
      } catch (insertError) {
        console.error('Error inserting stock-in record:', insertError.message, item);
        // Continue with other records instead of failing completely
      }
    }
    
    connection.release();
    res.status(204).send();
  } catch (error) {
    console.error('Put stock-in error:', error);
    res.status(500).json({ message: 'Internal server error: ' + error.message });
  }
});

app.get('/api/stock-in/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM stock_in WHERE id = ?', [req.params.id]);
    connection.release();
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Stock In record not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Get stock-in item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/stock-in', async (req, res) => {
  try {
    const item = req.body;
    const connection = await pool.getConnection();
    
    const [result] = await connection.execute(
      `INSERT INTO stock_in (sku, trans_no, date, tdt_po, tdt_po_date, vendor_no, vendor_name, 
       customer_dr, tdt_wo, accept_date, qty, cost_kilo, cost_unit, total_purchase, running_qty, 
       avg_unit_cost, total_value, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.sku, item.transNo || item.trans_no, item.date, item.tdtPo || item.tdt_po, 
       item.tdtPoDate || item.tdt_po_date, item.vendorNo || item.vendor_no, item.vendorName || item.vendor_name,
       item.customerDr || item.customer_dr, item.tdtWo || item.tdt_wo, item.acceptDate || item.accept_date,
       item.qty, item.costKilo || item.cost_kilo, item.costUnit || item.cost_unit, 
       item.totalPurchase || item.total_purchase, item.runningQty || item.running_qty,
       item.avgUnitCost || item.avg_unit_cost, item.totalValue || item.total_value, item.remark]
    );
    
    const [newItem] = await connection.execute('SELECT * FROM stock_in WHERE id = ?', [result.insertId]);
    
    connection.release();
    res.status(201).json(newItem[0]);
  } catch (error) {
    console.error('Create stock-in error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.patch('/api/stock-in/:id', async (req, res) => {
  try {
    const updates = req.body;
    const connection = await pool.getConnection();
    
    // Convert camelCase to snake_case for database columns
    const dbUpdates = {};
    Object.keys(updates).forEach(key => {
      switch(key) {
        case 'transNo': dbUpdates['trans_no'] = updates[key]; break;
        case 'tdtPo': dbUpdates['tdt_po'] = updates[key]; break;
        case 'tdtPoDate': dbUpdates['tdt_po_date'] = updates[key]; break;
        case 'vendorNo': dbUpdates['vendor_no'] = updates[key]; break;
        case 'vendorName': dbUpdates['vendor_name'] = updates[key]; break;
        case 'customerDr': dbUpdates['customer_dr'] = updates[key]; break;
        case 'tdtWo': dbUpdates['tdt_wo'] = updates[key]; break;
        case 'acceptDate': dbUpdates['accept_date'] = updates[key]; break;
        case 'costKilo': dbUpdates['cost_kilo'] = updates[key]; break;
        case 'costUnit': dbUpdates['cost_unit'] = updates[key]; break;
        case 'totalPurchase': dbUpdates['total_purchase'] = updates[key]; break;
        case 'runningQty': dbUpdates['running_qty'] = updates[key]; break;
        case 'avgUnitCost': dbUpdates['avg_unit_cost'] = updates[key]; break;
        case 'totalValue': dbUpdates['total_value'] = updates[key]; break;
        default: dbUpdates[key] = updates[key]; break;
      }
    });
    
    const fields = Object.keys(dbUpdates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(dbUpdates);
    values.push(req.params.id);
    
    await connection.execute(`UPDATE stock_in SET ${fields} WHERE id = ?`, values);
    
    const [updatedItem] = await connection.execute('SELECT * FROM stock_in WHERE id = ?', [req.params.id]);
    
    connection.release();
    
    if (updatedItem.length === 0) {
      return res.status(404).json({ message: 'Stock In record not found' });
    }
    
    res.json(updatedItem[0]);
  } catch (error) {
    console.error('Update stock-in error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/stock-in/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.execute('DELETE FROM stock_in WHERE id = ?', [req.params.id]);
    connection.release();
    res.status(204).send();
  } catch (error) {
    console.error('Delete stock-in error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Stock Out endpoints
app.get('/api/stock-out', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM stock_out ORDER BY dispatch_date DESC, id DESC');
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Get stock-out error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/stock-out', async (req, res) => {
  try {
    const stockOut = Array.isArray(req.body) ? req.body : [];
    const connection = await pool.getConnection();
    
    await connection.execute('DELETE FROM stock_out');
    
    for (const item of stockOut) {
      try {
        await connection.execute(
          `INSERT INTO stock_out (sku, trans_no, dispatch_date, tdt_wo, customer, tdt_dr, branch, 
           bdr_summary, tdt_si, qty_out, unit_cost, total_price, s1, s2, s3, running_qty, running_value, remarks) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.sku || '',
            item.transNo || item.trans_no || `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            item.dispatchDate || item.dispatch_date || new Date().toISOString().slice(0, 10),
            item.tdtWo || item.tdt_wo || null,
            item.customer || 'Unknown',
            item.tdtDr || item.tdt_dr || null,
            item.branch || null,
            item.bdrSummary || item.bdr_summary || null,
            item.tdtSi || item.tdt_si || null,
            item.qtyOut || item.qty_out || item.qty || 0,
            item.unitCost || item.unit_cost || 0,
            item.totalPrice || item.total_price || item.totalValue || 0,
            item.s1 || null,
            item.s2 || null,
            item.s3 || null,
            item.runningQty || item.running_qty || null,
            item.runningValue || item.running_value || null,
            item.remarks || null
          ]
        );
      } catch (insertError) {
        console.error('Error inserting stock-out record:', insertError.message, item);
        // Continue with other records instead of failing completely
      }
    }
    
    connection.release();
    res.status(204).send();
  } catch (error) {
    console.error('Put stock-out error:', error);
    res.status(500).json({ message: 'Internal server error: ' + error.message });
  }
});

app.get('/api/stock-out/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM stock_out WHERE id = ?', [req.params.id]);
    connection.release();
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Stock Out record not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Get stock-out item error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/stock-out', async (req, res) => {
  try {
    const item = req.body;
    const connection = await pool.getConnection();
    
    const [result] = await connection.execute(
      `INSERT INTO stock_out (sku, trans_no, dispatch_date, tdt_wo, customer, tdt_dr, branch, 
       bdr_summary, tdt_si, qty_out, unit_cost, total_price, s1, s2, s3, running_qty, running_value, remarks) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.sku, item.transNo || item.trans_no, item.dispatchDate || item.dispatch_date, 
       item.tdtWo || item.tdt_wo, item.customer, item.tdtDr || item.tdt_dr, item.branch,
       item.bdrSummary || item.bdr_summary, item.tdtSi || item.tdt_si, item.qtyOut || item.qty_out,
       item.unitCost || item.unit_cost, item.totalPrice || item.total_price, item.s1, item.s2, item.s3,
       item.runningQty || item.running_qty, item.runningValue || item.running_value, item.remarks]
    );
    
    const [newItem] = await connection.execute('SELECT * FROM stock_out WHERE id = ?', [result.insertId]);
    
    connection.release();
    res.status(201).json(newItem[0]);
  } catch (error) {
    console.error('Create stock-out error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.patch('/api/stock-out/:id', async (req, res) => {
  try {
    const updates = req.body;
    const connection = await pool.getConnection();
    
    // Convert camelCase to snake_case for database columns
    const dbUpdates = {};
    Object.keys(updates).forEach(key => {
      switch(key) {
        case 'transNo': dbUpdates['trans_no'] = updates[key]; break;
        case 'dispatchDate': dbUpdates['dispatch_date'] = updates[key]; break;
        case 'tdtWo': dbUpdates['tdt_wo'] = updates[key]; break;
        case 'tdtDr': dbUpdates['tdt_dr'] = updates[key]; break;
        case 'bdrSummary': dbUpdates['bdr_summary'] = updates[key]; break;
        case 'tdtSi': dbUpdates['tdt_si'] = updates[key]; break;
        case 'qtyOut': dbUpdates['qty_out'] = updates[key]; break;
        case 'unitCost': dbUpdates['unit_cost'] = updates[key]; break;
        case 'totalPrice': dbUpdates['total_price'] = updates[key]; break;
        case 'runningQty': dbUpdates['running_qty'] = updates[key]; break;
        case 'runningValue': dbUpdates['running_value'] = updates[key]; break;
        default: dbUpdates[key] = updates[key]; break;
      }
    });
    
    const fields = Object.keys(dbUpdates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(dbUpdates);
    values.push(req.params.id);
    
    await connection.execute(`UPDATE stock_out SET ${fields} WHERE id = ?`, values);
    
    const [updatedItem] = await connection.execute('SELECT * FROM stock_out WHERE id = ?', [req.params.id]);
    
    connection.release();
    
    if (updatedItem.length === 0) {
      return res.status(404).json({ message: 'Stock Out record not found' });
    }
    
    res.json(updatedItem[0]);
  } catch (error) {
    console.error('Update stock-out error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/stock-out/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.execute('DELETE FROM stock_out WHERE id = ?', [req.params.id]);
    connection.release();
    res.status(204).send();
  } catch (error) {
    console.error('Delete stock-out error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Purchase Orders endpoints (simplified for now)
app.get('/api/purchase-orders', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM purchase_orders ORDER BY order_date DESC');
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Get purchase-orders error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/purchase-orders', async (req, res) => {
  res.status(204).send();
});

app.get('/api/purchase-orders/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM purchase_orders WHERE id = ?', [req.params.id]);
    connection.release();
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Purchase Order not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Get purchase-order error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/purchase-orders', async (req, res) => {
  res.status(201).json({ id: 1, ...req.body });
});

app.patch('/api/purchase-orders/:id', async (req, res) => {
  res.json({ id: req.params.id, ...req.body });
});

app.delete('/api/purchase-orders/:id', async (req, res) => {
  res.status(204).send();
});

// Ending Inventory endpoints (simplified for now)
app.get('/api/ending-inventory', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM ending_inventory ORDER BY inventory_date DESC');
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Get ending-inventory error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/ending-inventory', async (req, res) => {
  res.status(204).send();
});

app.get('/api/ending-inventory/:id', async (req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.post('/api/ending-inventory', async (req, res) => {
  res.status(201).json({ id: 1, ...req.body });
});

app.patch('/api/ending-inventory/:id', async (req, res) => {
  res.json({ id: req.params.id, ...req.body });
});

app.delete('/api/ending-inventory/:id', async (req, res) => {
  res.status(204).send();
});

// Backload endpoints (simplified for now)
app.get('/api/backload', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM backload ORDER BY backload_date DESC');
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Get backload error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/backload', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Clear existing backload records
    await connection.execute('DELETE FROM backload');
    
    // Insert new records
    const records = req.body;
    if (Array.isArray(records) && records.length > 0) {
      for (const record of records) {
        try {
          await connection.execute(`
            INSERT INTO backload (sku, backload_date, qty_returned, reason, customer, original_dr, condition_status, unit_cost, remarks) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            record.sku || '',
            record.backloadDate || new Date().toISOString().slice(0, 10),
            record.qtyReturned || 0,
            record.reason || '',
            record.customer || null,
            record.originalDr || null,
            record.conditionStatus || 'Good',
            record.unitCost || 0,
            record.remarks || null
          ]);
        } catch (insertError) {
          console.error('Error inserting backload record:', insertError.message, record);
          // Continue with other records instead of failing completely
        }
      }
    }
    
    connection.release();
    res.status(204).send();
  } catch (error) {
    console.error('Save backload error:', error);
    res.status(500).json({ message: 'Internal server error: ' + error.message });
  }
});

app.get('/api/backload/:id', async (req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.post('/api/backload', async (req, res) => {
  res.status(201).json({ id: 1, ...req.body });
});

app.patch('/api/backload/:id', async (req, res) => {
  res.json({ id: req.params.id, ...req.body });
});

app.delete('/api/backload/:id', async (req, res) => {
  res.status(204).send();
});

// Advance Customer PO endpoints with approval workflow
app.get('/api/advance-customer-po', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [rows] = await connection.execute(`
      SELECT 
        acp.*,
        creator.name as created_by_name,
        approver.name as approved_by_name
      FROM advance_customer_po acp
      LEFT JOIN users creator ON acp.created_by = creator.id
      LEFT JOIN users approver ON acp.approved_by = approver.id
      ORDER BY acp.created_at DESC
    `);
    
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching advance customer PO:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/advance-customer-po', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Clear existing advance customer PO records
    await connection.execute('DELETE FROM advance_customer_po');
    
    // Insert new records
    const records = req.body;
    if (Array.isArray(records) && records.length > 0) {
      for (const record of records) {
        try {
          await connection.execute(`
            INSERT INTO advance_customer_po (customer_po, customer_name, po_date, delivery_date, status, total_amount, remarks) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            record.customerPo || `CPO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            record.customerName || '',
            record.poDate || new Date().toISOString().slice(0, 10),
            record.deliveryDate || null,
            record.status || 'Pending Approval',
            record.totalAmount || 0,
            record.remarks || null
          ]);
        } catch (insertError) {
          console.error('Error inserting advance customer PO record:', insertError.message, record);
          // Continue with other records instead of failing completely
        }
      }
    }
    
    connection.release();
    res.status(204).send();
  } catch (error) {
    console.error('Save advance customer PO error:', error);
    res.status(500).json({ message: 'Internal server error: ' + error.message });
  }
});

// Create new advance customer PO (requires approval for Employee role)
app.post('/api/advance-customer-po', async (req, res) => {
  try {
    const { 
      customer_po, customer_name, po_date, delivery_date, 
      total_amount, remarks, created_by 
    } = req.body;
    
    const connection = await pool.getConnection();
    
    // Get user role to determine initial status
    const [userRows] = await connection.execute(
      'SELECT role FROM users WHERE id = ?',
      [created_by]
    );
    
    const userRole = userRows[0]?.role || 'Employee';
    
    // Set status based on role
    const initialStatus = (userRole === 'Admin' || userRole === 'Manager') 
      ? 'Approved' 
      : 'Pending Approval';
    
    const approvedBy = (userRole === 'Admin' || userRole === 'Manager') 
      ? created_by 
      : null;
    
    const approvalDate = (userRole === 'Admin' || userRole === 'Manager') 
      ? new Date() 
      : null;
    
    const [result] = await connection.execute(
      `INSERT INTO advance_customer_po 
       (customer_po, customer_name, po_date, delivery_date, status, total_amount, 
        remarks, created_by, approved_by, approval_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer_po, customer_name, po_date, delivery_date || null, initialStatus, 
        total_amount || 0, remarks || null, created_by, approvedBy, approvalDate
      ]
    );
    
    connection.release();
    
    res.status(201).json({ 
      id: result.insertId, 
      message: userRole === 'Employee' 
        ? 'Reservation created and sent for approval' 
        : 'Reservation created and automatically approved',
      status: initialStatus
    });
  } catch (error) {
    console.error('Error creating advance customer PO:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get pending approvals count (must come before /:id route)
app.get('/api/advance-customer-po/pending-count', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [rows] = await connection.execute(
      "SELECT COUNT(*) as count FROM advance_customer_po WHERE status = 'Pending Approval'"
    );
    
    connection.release();
    res.json({ count: rows[0].count });
  } catch (error) {
    console.error('Error fetching pending approvals count:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/advance-customer-po/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    
    const [rows] = await connection.execute(`
      SELECT 
        acp.*,
        creator.name as created_by_name,
        approver.name as approved_by_name
      FROM advance_customer_po acp
      LEFT JOIN users creator ON acp.created_by = creator.id
      LEFT JOIN users approver ON acp.approved_by = approver.id
      WHERE acp.id = ?
    `, [id]);
    
    connection.release();
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching advance customer PO:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Approve/Reject advance customer PO
app.patch('/api/advance-customer-po/:id/approval', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, approved_by, remarks } = req.body; // action: 'approve' or 'reject'
    
    const connection = await pool.getConnection();
    
    // Check if user has approval rights (Admin or Manager)
    const [userRows] = await connection.execute(
      'SELECT role FROM users WHERE id = ?',
      [approved_by]
    );
    
    const userRole = userRows[0]?.role;
    if (!userRole || (userRole !== 'Admin' && userRole !== 'Manager')) {
      connection.release();
      return res.status(403).json({ message: 'Insufficient permissions to approve reservations' });
    }
    
    const newStatus = action === 'approve' ? 'Approved' : 'Rejected';
    
    await connection.execute(
      `UPDATE advance_customer_po 
       SET status = ?, approved_by = ?, approval_date = NOW(), remarks = ?
       WHERE id = ?`,
      [newStatus, approved_by, remarks, id]
    );
    
    connection.release();
    
    res.json({ message: `Reservation ${action}d successfully` });
  } catch (error) {
    console.error('Error updating approval status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.patch('/api/advance-customer-po/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const connection = await pool.getConnection();
    
    // Build dynamic update query
    const fields = Object.keys(updateData).filter(key => key !== 'id');
    const values = fields.map(key => updateData[key]);
    const setClause = fields.map(key => `${key} = ?`).join(', ');
    
    if (fields.length === 0) {
      connection.release();
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    await connection.execute(
      `UPDATE advance_customer_po SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
    
    connection.release();
    res.json({ id: parseInt(id), ...updateData });
  } catch (error) {
    console.error('Error updating advance customer PO:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/advance-customer-po/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    
    await connection.execute('DELETE FROM advance_customer_po WHERE id = ?', [id]);
    
    connection.release();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting advance customer PO:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Returns endpoints (simplified for now)
app.get('/api/returns', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM returns ORDER BY return_date DESC');
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Get returns error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/returns', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Clear existing returns records
    await connection.execute('DELETE FROM returns');
    
    // Insert new records
    const records = req.body;
    if (Array.isArray(records) && records.length > 0) {
      for (const record of records) {
        try {
          await connection.execute(`
            INSERT INTO returns (return_no, customer_name, return_date, original_dr, reason, status, total_amount, remarks) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            record.returnNo || `RET-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            record.customerName || '',
            record.returnDate || new Date().toISOString().slice(0, 10),
            record.originalDr || null,
            record.reason || 'No reason specified',
            record.status || 'Pending',
            record.totalAmount || 0,
            record.remarks || null
          ]);
        } catch (insertError) {
          console.error('Error inserting return record:', insertError.message, record);
          // Continue with other records instead of failing completely
        }
      }
    }
    
    connection.release();
    res.status(204).send();
  } catch (error) {
    console.error('Save returns error:', error);
    res.status(500).json({ message: 'Internal server error: ' + error.message });
  }
});

app.get('/api/returns/:id', async (req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.post('/api/returns', async (req, res) => {
  res.status(201).json({ id: 1, ...req.body });
});

app.patch('/api/returns/:id', async (req, res) => {
  res.json({ id: req.params.id, ...req.body });
});

app.delete('/api/returns/:id', async (req, res) => {
  res.status(204).send();
});

const DEFAULT_PORT = Number(process.env.PORT) || 4000;

function startServer(startPort, attempts = 10) {
  const server = app.listen(startPort, async () => {
    console.log(`🚀 TDT Warehouse Inventory System Backend`);
    console.log(`📡 Server running on http://localhost:${startPort}`);
    console.log(`🗄️  Database: ${process.env.DB_NAME} on ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    
    // Initialize database tables
    await initializeServer();
    
    // Persist the actual listening port so the dev server can proxy correctly
    import('fs/promises').then(fs => {
      const portFile = path.join(__dirname, 'port.txt');
      fs.writeFile(portFile, String(startPort), 'utf-8').catch((err) => {
        console.warn('Failed to write port file:', err);
      });
    });
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE' && attempts > 0) {
      const nextPort = startPort + 1;
      console.warn(`Port ${startPort} in use, trying ${nextPort}...`);
      setTimeout(() => startServer(nextPort, attempts - 1), 200);
      return;
    }
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

startServer(DEFAULT_PORT);
