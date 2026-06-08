# TDT Warehouse Inventory System (WIS)

A modern warehouse inventory management system built with React + Vite frontend and Node.js + MySQL backend.

## Prerequisites

Before running this application, make sure you have:

1. **Node.js** (v16 or higher)
2. **XAMPP** with MySQL running
3. **MySQL Database** set up

## Database Setup

1. Start XAMPP and ensure MySQL is running
2. Open phpMyAdmin: [http://localhost/phpmyadmin/index.php?route=/database/structure&db=tdt_wis](http://localhost/phpmyadmin/index.php?route=/database/structure&db=tdt_wis)
3. Create a new database named `tdt_wis`
4. The application will automatically create all necessary tables on first run

## Environment Configuration

Update the `.env` file with your database configuration:

```env
# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=tdt_wis

# SMTP Configuration for OTP Email Sending
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=collaboration.tdtpowersteel@gmail.com
SMTP_PASS=ahyg expz qkzn afjf

# Email sender details
EMAIL_FROM=collaboration.tdtpowersteel@gmail.com

# Server port (optional)
PORT=3001
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

### Development Mode (Both Frontend & Backend)
```bash
npm run dev:all
```

### Individual Services

#### Backend Only
```bash
npm run backend
```

#### Frontend Only
```bash
npm run dev
```

## Default Login Credentials

- **Username:** admin
- **Password:** admin
- **Role:** Administrator

## Features

- 🏭 **Products Management** - Add, edit, and manage product inventory
- 📥 **Stock In Tracking** - Record incoming stock transactions
- 📤 **Stock Out Tracking** - Record outgoing stock transactions  
- 📋 **Purchase Orders** - Manage vendor purchase orders
- 📊 **Ending Inventory** - Track physical vs system inventory
- 🔄 **Backload Management** - Handle returned inventory
- 📝 **Advance Customer PO** - Manage customer purchase orders
- ↩️ **Returns Processing** - Handle product returns
- 👥 **User Management** - Admin and employee user roles
- 📧 **OTP Email Verification** - Secure user registration

## Technology Stack

### Frontend
- React 19
- Vite
- Recharts (for analytics)
- XLSX (for Excel export/import)

### Backend
- Node.js
- Express.js
- MySQL2
- Nodemailer (for email)

## Database Schema

The application creates the following tables automatically:
- `users` - User accounts and authentication
- `products` - Product catalog and inventory
- `stock_in` - Incoming stock transactions
- `stock_out` - Outgoing stock transactions
- `purchase_orders` & `purchase_order_items` - Purchase order management
- `ending_inventory` - Physical inventory records
- `backload` - Returned inventory tracking
- `advance_customer_po` & `advance_customer_po_items` - Customer purchase orders
- `returns` & `return_items` - Product returns
- `pending_signups` - OTP verification for new user registration

## API Endpoints

The backend provides RESTful APIs for all entities:

- `GET|POST|PATCH|DELETE /api/users` - User management
- `GET|POST|PATCH|DELETE /api/products` - Product management  
- `GET|POST|PATCH|DELETE /api/stock-in` - Stock in transactions
- `GET|POST|PATCH|DELETE /api/stock-out` - Stock out transactions
- `GET|POST|PATCH|DELETE /api/purchase-orders` - Purchase orders
- `GET|POST|PATCH|DELETE /api/ending-inventory` - Ending inventory
- `GET|POST|PATCH|DELETE /api/backload` - Backload management
- `GET|POST|PATCH|DELETE /api/advance-customer-po` - Customer POs  
- `GET|POST|PATCH|DELETE /api/returns` - Returns management

### Authentication Endpoints
- `POST /api/auth/signup-request` - Request OTP for registration
- `POST /api/auth/signup-verify` - Verify OTP and create account
- `POST /api/auth/login` - User login

## Development Notes

- The system now uses MySQL instead of JSON file storage
- All hardcoded data has been removed
- Database tables are created automatically on first run  
- OTP email system is configured but disabled in development (shows in console)
- Default admin user (admin/admin) is created if no users exist

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start frontend dev server
npm run backend      # Start backend server
npm run dev:all      # Start both servers
npm run build        # Build for production
npm run lint         # Run ESLint
```

## 🐛 Troubleshooting

**Database Connection Issues:**
- Ensure XAMPP MySQL is running
- Verify database name `tdt_wis` exists
- Check .env database configuration
- Restart the backend server

**Login Issues:**
- Use credentials: `admin`/`admin`
- Clear browser cache if needed
- Check both servers are running

**Connection Issues:**
- Verify backend is on port 3001 (or your configured PORT)
- Check Vite proxy configuration
- Restart both servers

## License

© 2024 TDT PowerSteel. All rights reserved.
