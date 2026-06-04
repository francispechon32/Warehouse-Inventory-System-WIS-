// ─── PRODUCTS ────────────────────────────────────────────────────────────────
export const MOCK_PRODUCTS = [
  { id: 1,  sku: "DRB007", description: "Deformed Round Bar, 10mm x 6M g33",                                  category: "Deformed Round Bar", unit: "pcs", stock: 42,   avgCost: 138.60,   totalValue: 5821.20,       status: "Low Stock" },
  { id: 2,  sku: "DRB008", description: "Deformed Round Bar, 12mm x 6M g33",                                  category: "Deformed Round Bar", unit: "pcs", stock: 35,   avgCost: 142.50,   totalValue: 4987.50,       status: "Low Stock" },
  { id: 3,  sku: "DRB009", description: "Deformed Round Bar, 16mm x 6M g33",                                  category: "Deformed Round Bar", unit: "pcs", stock: 18,   avgCost: 198.20,   totalValue: 3567.60,       status: "Low Stock" },
  { id: 4,  sku: "DRB050", description: "Deformed Round Bar, 10mm x 6M g40",                                  category: "Deformed Round Bar", unit: "pcs", stock: 1557, avgCost: 136.60,   totalValue: 212886.42,     status: "Active"    },
  { id: 5,  sku: "DRB051", description: "Deformed Round Bar, 12mm x 6M g40",                                  category: "Deformed Round Bar", unit: "pcs", stock: 1,    avgCost: 186.38,   totalValue: 186.38,        status: "Low Stock" },
  { id: 6,  sku: "DRB052", description: "Deformed Round Bar, 16mm x 6M g40",                                  category: "Deformed Round Bar", unit: "pcs", stock: 1225, avgCost: 346.73,   totalValue: 424744.25,     status: "Active"    },
  { id: 7,  sku: "SHPT2",  description: "Sheet Pile, T2, 400mm x 100mm x 10.5mm x 48kg/m x 12M",             category: "Sheet Pile",          unit: "pcs", stock: 560,  avgCost: 22529.66, totalValue: 12616609.60,   status: "Active"    },
  { id: 8,  sku: "MSP010", description: "MS Plate, 6mm x 4' x 8'",                                           category: "MS Plate",            unit: "pcs", stock: 322,  avgCost: 554.79,   totalValue: 178642.38,     status: "Active"    },
  { id: 9,  sku: "MSP018", description: "MS Plate, 12mm x 4' x 8'",                                          category: "MS Plate",            unit: "pcs", stock: 12,   avgCost: 1200.00,  totalValue: 14400.00,      status: "Low Stock" },
  { id: 10, sku: "SKU10",  description: "MS Plate, 10mm x 4' x 8'",                                          category: "MS Plate",            unit: "pcs", stock: 9,    avgCost: 580.00,   totalValue: 5220.00,       status: "Low Stock" },
  { id: 11, sku: "SHPT2A", description: "Sheet Pile, T2, 400mm x 100mm x 10.5mm x 48kg/m x 6M",             category: "Sheet Pile",          unit: "pcs", stock: 6,    avgCost: 18500.00, totalValue: 111000.00,     status: "Low Stock" },
  { id: 12, sku: "SHPT7",  description: "Sheet Pile Z type 12 meters",                                        category: "Sheet Pile",          unit: "pcs", stock: 4,    avgCost: 15200.00, totalValue: 60800.00,      status: "Low Stock" },
  { id: 13, sku: "JINXI",  description: "Sheet Pile, Z-Pile 770mm W x 354mm H x 8.5mm x 73.2kg/M x 12M",    category: "Sheet Pile",          unit: "pcs", stock: 15,   avgCost: 41838.53, totalValue: 627577.95,     status: "Low Stock" },
  { id: 14, sku: "WF016",  description: "Wide Flange, 8 x 4 x 10# x 6M",                                    category: "Wide Flange",         unit: "pcs", stock: 22,   avgCost: 8900.00,  totalValue: 195800.00,     status: "Low Stock" },
  { id: 15, sku: "WF009",  description: "Wide Flange, 6 x 4 x 9# x 6M",                                     category: "Wide Flange",         unit: "pcs", stock: 14,   avgCost: 7200.00,  totalValue: 100800.00,     status: "Low Stock" },
  { id: 16, sku: "SHPT3",  description: "Sheet Pile, T3, 400mm x 125mm x 13mm x 60kg/m x 12M",              category: "Sheet Pile",          unit: "pcs", stock: 481,  avgCost: 28271.06, totalValue: 13598379.86,   status: "Active"    },
];

// ─── PURCHASING ORDERS ────────────────────────────────────────────────────────
export const MOCK_PURCHASING_ORDERS = [
  { id: 1,  poNumber: "PO-2024-001", date: "2024-01-15", supplier: "National Steel Corp",    items: [{ sku: "DRB050", description: "Deformed Round Bar 10mm g40", qty: 500, unitCost: 136.60, total: 68300.00  }], grandTotal: 68300.00,  status: "Received",  remarks: "" },
  { id: 2,  poNumber: "PO-2024-002", date: "2024-02-03", supplier: "Pacific Steel Traders",  items: [{ sku: "MSP010", description: "MS Plate 6mm",               qty: 100, unitCost: 554.79, total: 55479.00  }], grandTotal: 55479.00,  status: "Received",  remarks: "" },
  { id: 3,  poNumber: "PO-2024-003", date: "2024-02-20", supplier: "Steel Masters Inc",      items: [{ sku: "SHPT2",  description: "Sheet Pile T2 12M",           qty: 50,  unitCost: 22529.66,total: 1126483.00}], grandTotal: 1126483.00,status: "Pending",   remarks: "Awaiting delivery" },
  { id: 4,  poNumber: "PO-2024-004", date: "2024-03-05", supplier: "National Steel Corp",    items: [{ sku: "DRB052", description: "Deformed Round Bar 16mm g40", qty: 300, unitCost: 346.73, total: 104019.00 }], grandTotal: 104019.00, status: "Received",  remarks: "" },
  { id: 5,  poNumber: "PO-2024-005", date: "2024-03-18", supplier: "Metro Steel Supply",     items: [{ sku: "WF016",  description: "Wide Flange 8x4 10#",         qty: 30,  unitCost: 8900.00, total: 267000.00 }], grandTotal: 267000.00, status: "Partial",   remarks: "15 pcs delivered" },
  { id: 6,  poNumber: "PO-2024-006", date: "2024-04-02", supplier: "Pacific Steel Traders",  items: [{ sku: "MSP018", description: "MS Plate 12mm",               qty: 50,  unitCost: 1200.00, total: 60000.00  }], grandTotal: 60000.00,  status: "Cancelled", remarks: "Supplier out of stock" },
  { id: 7,  poNumber: "PO-2024-007", date: "2024-04-22", supplier: "Steel Masters Inc",      items: [{ sku: "SHPT3",  description: "Sheet Pile T3 12M",           qty: 100, unitCost: 28271.06,total: 2827106.00}], grandTotal: 2827106.00,status: "Received",  remarks: "" },
  { id: 8,  poNumber: "PO-2024-008", date: "2024-05-10", supplier: "National Steel Corp",    items: [{ sku: "DRB007", description: "Deformed Round Bar 10mm g33", qty: 200, unitCost: 138.60,  total: 27720.00  }], grandTotal: 27720.00,  status: "Pending",   remarks: "" },
  { id: 9,  poNumber: "PO-2024-009", date: "2024-05-28", supplier: "Metro Steel Supply",     items: [{ sku: "WF009",  description: "Wide Flange 6x4 9#",          qty: 20,  unitCost: 7200.00, total: 144000.00 }], grandTotal: 144000.00, status: "Received",  remarks: "" },
  { id: 10, poNumber: "PO-2024-010", date: "2024-06-04", supplier: "Pacific Steel Traders",  items: [{ sku: "JINXI",  description: "Sheet Pile Z-Pile 12M",        qty: 10,  unitCost: 41838.53,total: 418385.30}], grandTotal: 418385.30, status: "Pending",   remarks: "Awaiting approval" },
];

// ─── ENDING INVENTORY ─────────────────────────────────────────────────────────
export const MOCK_ENDING_INVENTORY = [
  { id: 1, date: "2024-01-31", period: "January 2024",   location: "Marilao Warehouse", totalSkus: 16, totalStock: 4323,  totalValue: 28240202.69, preparedBy: "Juan Dela Cruz",  status: "Finalized" },
  { id: 2, date: "2024-02-29", period: "February 2024",  location: "Marilao Warehouse", totalSkus: 16, totalStock: 4180,  totalValue: 27854320.50, preparedBy: "Juan Dela Cruz",  status: "Finalized" },
  { id: 3, date: "2024-03-31", period: "March 2024",     location: "Marilao Warehouse", totalSkus: 16, totalStock: 4502,  totalValue: 29100450.00, preparedBy: "Maria Santos",    status: "Finalized" },
  { id: 4, date: "2024-04-30", period: "April 2024",     location: "Marilao Warehouse", totalSkus: 16, totalStock: 4388,  totalValue: 28650780.25, preparedBy: "Maria Santos",    status: "Finalized" },
  { id: 5, date: "2024-05-31", period: "May 2024",       location: "Marilao Warehouse", totalSkus: 16, totalStock: 4523,  totalValue: 28775403.13, preparedBy: "Pedro Reyes",     status: "Draft"     },
];

// ─── STOCK SHEETS ─────────────────────────────────────────────────────────────
export const MOCK_STOCK_SHEETS = [
  { id: 1, sheetId: "SS-2024-001", date: "2024-01-10", location: "Marilao Warehouse", preparedBy: "Juan Dela Cruz",  totalItems: 12, notes: "Regular weekly count",         status: "Approved"  },
  { id: 2, sheetId: "SS-2024-002", date: "2024-01-24", location: "Marilao Warehouse", preparedBy: "Maria Santos",    totalItems: 16, notes: "Month-end full count",          status: "Approved"  },
  { id: 3, sheetId: "SS-2024-003", date: "2024-02-07", location: "Marilao Warehouse", preparedBy: "Pedro Reyes",     totalItems: 10, notes: "Post-delivery spot check",      status: "Approved"  },
  { id: 4, sheetId: "SS-2024-004", date: "2024-02-22", location: "Marilao Warehouse", preparedBy: "Juan Dela Cruz",  totalItems: 16, notes: "Month-end full count",          status: "Approved"  },
  { id: 5, sheetId: "SS-2024-005", date: "2024-03-08", location: "Marilao Warehouse", preparedBy: "Maria Santos",    totalItems: 8,  notes: "Sheet Pile section only",       status: "Approved"  },
  { id: 6, sheetId: "SS-2024-006", date: "2024-03-29", location: "Marilao Warehouse", preparedBy: "Pedro Reyes",     totalItems: 16, notes: "Quarter-end count",             status: "Approved"  },
  { id: 7, sheetId: "SS-2024-007", date: "2024-04-15", location: "Marilao Warehouse", preparedBy: "Juan Dela Cruz",  totalItems: 14, notes: "Post-backload verification",    status: "Pending"   },
  { id: 8, sheetId: "SS-2024-008", date: "2024-05-30", location: "Marilao Warehouse", preparedBy: "Maria Santos",    totalItems: 16, notes: "Month-end full count",          status: "Draft"     },
];

// ─── RETURNS ──────────────────────────────────────────────────────────────────
export const MOCK_RETURNS = [
  { id: 1, returnId: "RET-2024-001", date: "2024-01-20", sku: "DRB007", description: "Deformed Round Bar 10mm g33", quantity: 5,  reason: "Damaged in transit",          adjustedBy: "Juan Dela Cruz",  status: "Approved"  },
  { id: 2, returnId: "RET-2024-002", date: "2024-02-14", sku: "MSP010", description: "MS Plate 6mm",                quantity: 10, reason: "Wrong specification delivered", adjustedBy: "Maria Santos",    status: "Approved"  },
  { id: 3, returnId: "RET-2024-003", date: "2024-03-01", sku: "WF016",  description: "Wide Flange 8x4 10#",         quantity: 3,  reason: "Customer over-order",          adjustedBy: "Pedro Reyes",     status: "Approved"  },
  { id: 4, returnId: "RET-2024-004", date: "2024-03-22", sku: "SHPT2",  description: "Sheet Pile T2 12M",           quantity: 2,  reason: "Defective — corrosion",        adjustedBy: "Juan Dela Cruz",  status: "Pending"   },
  { id: 5, returnId: "RET-2024-005", date: "2024-04-10", sku: "DRB052", description: "Deformed Round Bar 16mm g40", quantity: 8,  reason: "Excess from project site",     adjustedBy: "Maria Santos",    status: "Approved"  },
  { id: 6, returnId: "RET-2024-006", date: "2024-05-05", sku: "MSP018", description: "MS Plate 12mm",               quantity: 4,  reason: "Incorrect cut size",           adjustedBy: "Pedro Reyes",     status: "Rejected"  },
];

// ─── BACKLOAD INVENTORY ───────────────────────────────────────────────────────
export const MOCK_BACKLOAD_INVENTORY = [
  { id: 1, backloadId: "BL-2024-001", date: "2024-02-05", fromLocation: "Project Site A - Bulacan",   toLocation: "Marilao Warehouse", items: [{ sku: "DRB050", qty: 120 }, { sku: "MSP010", qty: 30 }],  totalItems: 150, receivedBy: "Juan Dela Cruz",  status: "Received"  },
  { id: 2, backloadId: "BL-2024-002", date: "2024-03-12", fromLocation: "Project Site B - Pampanga",  toLocation: "Marilao Warehouse", items: [{ sku: "WF016",  qty: 8  }, { sku: "SHPT2",  qty: 15 }],  totalItems: 23,  receivedBy: "Maria Santos",    status: "Received"  },
  { id: 3, backloadId: "BL-2024-003", date: "2024-04-08", fromLocation: "Project Site C - Manila",    toLocation: "Marilao Warehouse", items: [{ sku: "DRB052", qty: 60 }],                               totalItems: 60,  receivedBy: "Pedro Reyes",     status: "Received"  },
  { id: 4, backloadId: "BL-2024-004", date: "2024-05-15", fromLocation: "Project Site D - Laguna",    toLocation: "Marilao Warehouse", items: [{ sku: "MSP018", qty: 5  }, { sku: "WF009",  qty: 10 }],  totalItems: 15,  receivedBy: "Juan Dela Cruz",  status: "In-Transit"},
  { id: 5, backloadId: "BL-2024-005", date: "2024-06-01", fromLocation: "Project Site A - Bulacan",   toLocation: "Marilao Warehouse", items: [{ sku: "SHPT3",  qty: 20 }, { sku: "DRB007", qty: 50 }],  totalItems: 70,  receivedBy: "Maria Santos",    status: "Pending"   },
];

// ─── ADVANCE CUSTOMER PO ──────────────────────────────────────────────────────
export const MOCK_ADVANCE_CUSTOMER_PO = [
  { id: 1, acpoNumber: "ACPO-2024-001", date: "2024-01-08",  customer: "Buildtech Contractors",   items: [{ sku: "DRB050", description: "DRB 10mm g40", qty: 200, unitPrice: 155.00, total: 31000.00  }], grandTotal: 31000.00,   downPayment: 15500.00,  balanceDue: 15500.00,  status: "Fulfilled"  },
  { id: 2, acpoNumber: "ACPO-2024-002", date: "2024-01-25",  customer: "Metro Infrastructure Inc", items: [{ sku: "SHPT2",  description: "Sheet Pile T2", qty: 30,  unitPrice: 25000.00,total: 750000.00 }], grandTotal: 750000.00,  downPayment: 375000.00, balanceDue: 375000.00, status: "Partial"    },
  { id: 3, acpoNumber: "ACPO-2024-003", date: "2024-02-12",  customer: "Strongbuild Corp",         items: [{ sku: "MSP010", description: "MS Plate 6mm",  qty: 50,  unitPrice: 620.00, total: 31000.00  }], grandTotal: 31000.00,   downPayment: 31000.00,  balanceDue: 0,         status: "Fulfilled"  },
  { id: 4, acpoNumber: "ACPO-2024-004", date: "2024-03-03",  customer: "Pioneer Builders",         items: [{ sku: "WF016",  description: "Wide Flange 8x4",qty: 15,  unitPrice: 9800.00, total: 147000.00 }], grandTotal: 147000.00,  downPayment: 50000.00,  balanceDue: 97000.00,  status: "Pending"    },
  { id: 5, acpoNumber: "ACPO-2024-005", date: "2024-03-20",  customer: "Buildtech Contractors",   items: [{ sku: "DRB052", description: "DRB 16mm g40",  qty: 100, unitPrice: 380.00, total: 38000.00  }], grandTotal: 38000.00,   downPayment: 20000.00,  balanceDue: 18000.00,  status: "Partial"    },
  { id: 6, acpoNumber: "ACPO-2024-006", date: "2024-04-14",  customer: "National Dev Group",       items: [{ sku: "SHPT3",  description: "Sheet Pile T3", qty: 50,  unitPrice: 31000.00,total: 1550000.00}], grandTotal: 1550000.00, downPayment: 775000.00, balanceDue: 775000.00, status: "Pending"    },
  { id: 7, acpoNumber: "ACPO-2024-007", date: "2024-05-07",  customer: "Horizon Construction",     items: [{ sku: "WF009",  description: "Wide Flange 6x4",qty: 10,  unitPrice: 8000.00, total: 80000.00  }], grandTotal: 80000.00,   downPayment: 40000.00,  balanceDue: 40000.00,  status: "Fulfilled"  },
];
