# API Specification — TDT Warehouse Inventory System

## Base URL

```
http://localhost:8000/api        ← development
https://api.yourdomain.com/api   ← production
```

Set the base URL via the `VITE_API_BASE_URL` environment variable in `.env`.

---

## General Conventions

| Convention | Detail |
|---|---|
| Format | JSON (`Content-Type: application/json`) |
| Dates | ISO 8601 string (`"2024-06-04"`) |
| IDs | Integer (auto-incremented by backend) |
| Money | Float, Philippine Peso — no currency wrapper |
| Errors | `{ "error": "human-readable message" }` |
| Success list | Array of objects: `[{ id, ... }]` |
| Success single | Object: `{ id, ... }` |

### Standard HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` | OK (GET, PUT, DELETE) |
| `201` | Created (POST) |
| `400` | Bad request / validation error |
| `404` | Resource not found |
| `500` | Server error |

---

## 1. Products — `/api/products`

Manages the SKU master list (Product Page).

### Object Shape

```json
{
  "id": 1,
  "sku": "DRB050",
  "description": "Deformed Round Bar, 10mm x 6M g40",
  "category": "Deformed Round Bar",
  "unit": "pcs",
  "stock": 1557,
  "avgCost": 136.60,
  "totalValue": 212886.42,
  "status": "Active",
  "warningLevel": 50
}
```

**Field rules:**
- `sku` — unique, uppercase, required
- `stock` — integer ≥ 0
- `status` — derived: `"Active"` when `stock > warningLevel`, else `"Low Stock"`
- `totalValue` — derived: `stock × avgCost` (backend may compute or accept client value)
- `warningLevel` — default `50`

### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/products` | List all products |
| `GET` | `/api/products/:id` | Get single product |
| `POST` | `/api/products` | Create product |
| `PUT` | `/api/products/:id` | Update product |
| `DELETE` | `/api/products/:id` | Delete product |
| `PUT` | `/api/products/bulk` | Replace entire list (Excel import) |

**POST/PUT body** (omit `id`, `status`, `totalValue` — backend derives them):
```json
{
  "sku": "NEW001",
  "description": "New Product Description",
  "category": "MS Plate",
  "unit": "pcs",
  "stock": 100,
  "avgCost": 500.00,
  "warningLevel": 50
}
```

---

## 2. Purchasing Orders — `/api/purchasing-orders`

Tracks purchase orders sent to suppliers.

### Object Shape

```json
{
  "id": 1,
  "poNumber": "PO-2024-001",
  "date": "2024-01-15",
  "supplier": "National Steel Corp",
  "items": [
    {
      "sku": "DRB050",
      "description": "Deformed Round Bar 10mm g40",
      "qty": 500,
      "unitCost": 136.60,
      "total": 68300.00
    }
  ],
  "grandTotal": 68300.00,
  "status": "Received",
  "remarks": ""
}
```

**Status values:** `"Pending"` | `"Partial"` | `"Received"` | `"Cancelled"`

### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/purchasing-orders` | List all POs |
| `GET` | `/api/purchasing-orders/:id` | Get single PO |
| `POST` | `/api/purchasing-orders` | Create PO |
| `PUT` | `/api/purchasing-orders/:id` | Update PO |
| `DELETE` | `/api/purchasing-orders/:id` | Delete PO |

---

## 3. Ending Inventory — `/api/ending-inventory`

End-of-period inventory snapshots.

### Object Shape

```json
{
  "id": 1,
  "date": "2024-01-31",
  "period": "January 2024",
  "location": "Marilao Warehouse",
  "totalSkus": 16,
  "totalStock": 4323,
  "totalValue": 28240202.69,
  "preparedBy": "Juan Dela Cruz",
  "status": "Finalized"
}
```

**Status values:** `"Draft"` | `"Finalized"`

### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/ending-inventory` | List all snapshots |
| `GET` | `/api/ending-inventory/:id` | Get single snapshot |
| `POST` | `/api/ending-inventory` | Create snapshot |
| `PUT` | `/api/ending-inventory/:id` | Update snapshot |
| `DELETE` | `/api/ending-inventory/:id` | Delete snapshot |

---

## 4. Stock Sheets — `/api/stock-sheets`

Physical stock count records.

### Object Shape

```json
{
  "id": 1,
  "sheetId": "SS-2024-001",
  "date": "2024-01-10",
  "location": "Marilao Warehouse",
  "preparedBy": "Juan Dela Cruz",
  "totalItems": 12,
  "notes": "Regular weekly count",
  "status": "Approved"
}
```

**Status values:** `"Draft"` | `"Pending"` | `"Approved"`

### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/stock-sheets` | List all sheets |
| `GET` | `/api/stock-sheets/:id` | Get single sheet |
| `POST` | `/api/stock-sheets` | Create sheet |
| `PUT` | `/api/stock-sheets/:id` | Update sheet |
| `DELETE` | `/api/stock-sheets/:id` | Delete sheet |

---

## 5. Returns — `/api/returns`

Product return and stock adjustment records.

### Object Shape

```json
{
  "id": 1,
  "returnId": "RET-2024-001",
  "date": "2024-01-20",
  "sku": "DRB007",
  "description": "Deformed Round Bar 10mm g33",
  "quantity": 5,
  "reason": "Damaged in transit",
  "adjustedBy": "Juan Dela Cruz",
  "status": "Approved"
}
```

**Status values:** `"Pending"` | `"Approved"` | `"Rejected"`

### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/returns` | List all returns |
| `GET` | `/api/returns/:id` | Get single return |
| `POST` | `/api/returns` | Create return |
| `PUT` | `/api/returns/:id` | Update return |
| `DELETE` | `/api/returns/:id` | Delete return |

---

## 6. Backload Inventory — `/api/backload-inventory`

Records of inventory moved back from project sites to the warehouse.

### Object Shape

```json
{
  "id": 1,
  "backloadId": "BL-2024-001",
  "date": "2024-02-05",
  "fromLocation": "Project Site A - Bulacan",
  "toLocation": "Marilao Warehouse",
  "items": [
    { "sku": "DRB050", "qty": 120 },
    { "sku": "MSP010", "qty": 30  }
  ],
  "totalItems": 150,
  "receivedBy": "Juan Dela Cruz",
  "status": "Received"
}
```

**Status values:** `"Pending"` | `"In-Transit"` | `"Received"`

### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/backload-inventory` | List all backloads |
| `GET` | `/api/backload-inventory/:id` | Get single record |
| `POST` | `/api/backload-inventory` | Create record |
| `PUT` | `/api/backload-inventory/:id` | Update record |
| `DELETE` | `/api/backload-inventory/:id` | Delete record |

---

## 7. Advance Customer PO — `/api/advance-customer-po`

Customer purchase orders with advance/down-payment tracking.

### Object Shape

```json
{
  "id": 1,
  "acpoNumber": "ACPO-2024-001",
  "date": "2024-01-08",
  "customer": "Buildtech Contractors",
  "items": [
    {
      "sku": "DRB050",
      "description": "DRB 10mm g40",
      "qty": 200,
      "unitPrice": 155.00,
      "total": 31000.00
    }
  ],
  "grandTotal": 31000.00,
  "downPayment": 15500.00,
  "balanceDue": 15500.00,
  "status": "Fulfilled"
}
```

**Status values:** `"Pending"` | `"Partial"` | `"Fulfilled"` | `"Cancelled"`

### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/advance-customer-po` | List all customer POs |
| `GET` | `/api/advance-customer-po/:id` | Get single PO |
| `POST` | `/api/advance-customer-po` | Create PO |
| `PUT` | `/api/advance-customer-po/:id` | Update PO |
| `DELETE` | `/api/advance-customer-po/:id` | Delete PO |

---

## Frontend Integration Guide

### How to apply `useApi` to any page

```jsx
import useApi from "./hooks/useApi";
import { ENDPOINTS } from "./api/apiConfig";
import { MOCK_PURCHASING_ORDERS } from "./api/mockData";

export default function PurchasingOrderPage() {
  const api = useApi(ENDPOINTS.purchasingOrders, MOCK_PURCHASING_ORDERS);

  useEffect(() => { api.getAll(); }, []);

  // Create
  const handleAdd = async (item) => {
    await api.create(item);
  };

  // Update
  const handleEdit = async (id, changes) => {
    await api.update(id, changes);
  };

  // Delete
  const handleDelete = async (id) => {
    await api.remove(id);
  };

  return (
    <>
      {api.loading && <LoadingSpinner />}
      {api.error  && <ErrorToast msg={api.error} />}
      <Table data={api.data} ... />
    </>
  );
}
```

### Switching to real backend

1. Open `src/api/apiConfig.js`
2. Change `USE_MOCK_DATA` from `true` to `false`
3. Set `VITE_API_BASE_URL=http://your-backend-server/api` in `.env`
4. Done — all pages use real endpoints automatically

### Error Handling Pattern

The `useApi` hook exposes:
- `api.loading` — `true` while a request is in flight
- `api.error` — string message if the last call failed, else `null`

Show a loading spinner on `api.loading` and a toast on `api.error`.  
All mutation methods (`create`, `update`, `remove`, `bulkReplace`) throw on failure, so wrap in `try/catch` for per-action feedback.

---

## CORS Requirements (backend)

The backend must allow requests from the frontend origin:

```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type
```
