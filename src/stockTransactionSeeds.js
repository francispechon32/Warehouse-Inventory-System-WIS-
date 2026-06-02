/** Detailed stock sheet rows — each SKU has multiple IN/OUT lines for its sheet view.
 *  Dates are computed relative to today so the 7-day chart and "Transactions Today"
 *  metric always reflect real data regardless of when the app is opened.
 */

const VENDORS = [
  { no: "V-8821", name: "Steel Asia Corp" },
  { no: "V-9012", name: "Dragon Steel" },
  { no: "V-9100", name: "Pag-asa Steel" },
];
const CUSTOMERS = [
  "Michael Santiago",
  "RCM Builders",
  "Prime Builders Corp.",
  "GW Construction",
  "Metro Builders Inc.",
];

function vendor(i) {
  return VENDORS[i % VENDORS.length];
}

/** Return an ISO date string offset by `daysAgo` from today (negative = future). */
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** today's date string */
const TODAY = daysAgo(0);

function buildDrb007StockIn() {
  // Spread 12 entries across the last 12 days (most recent = today)
  const qtySteps = [500, 260, 180, 320, 150, 220, 95, 410, 175, 240, 130, 300];
  let running = 0;
  return qtySteps.map((qty, i) => {
    const v = vendor(i);
    const costUnit = 193.68 + (i % 3) * 0.5;
    running += qty;
    const totalPurchase = Math.round(qty * costUnit);
    const dayOffset = 11 - i; // i=0 → 11 days ago … i=11 → today
    return {
      id: i + 1,
      sku: "DRB007",
      transNo: `IN-${String(i + 1).padStart(3, "0")}`,
      date: daysAgo(dayOffset),
      tdtPo: `PO-2026-${String(142 + i).padStart(4, "0")}`,
      tdtPoDate: daysAgo(dayOffset + 1),
      vendorNo: v.no,
      vendorName: v.name,
      customerDr: i % 4 === 0 ? CUSTOMERS[i % CUSTOMERS.length] : "—",
      tdtWo: `WO-${4401 + i}`,
      acceptDate: daysAgo(Math.max(0, dayOffset - 2)),
      qty,
      costKilo: 52.4 + (i % 5) * 0.2,
      costUnit,
      totalPurchase,
      runningQty: running,
      avgUnitCost: costUnit,
      totalValue: Math.round(running * costUnit),
      remark: i % 3 === 0 ? "Partial" : "",
    };
  });
}

function buildDrb007StockOut() {
  const qtySteps = [120, 85, 140, 60, 200, 95, 175, 110, 150, 80, 130, 70];
  let running = 1200;
  return qtySteps.map((qtyOut, i) => {
    const unitCost = 195 + (i % 4) * 2;
    running = Math.max(0, running - qtyOut);
    const dayOffset = 11 - i;
    return {
      id: i + 1,
      sku: "DRB007",
      transNo: `OUT-${String(i + 1).padStart(3, "0")}`,
      dispatchDate: daysAgo(dayOffset),
      tdtWo: `WO-${5501 + i}`,
      customer: CUSTOMERS[i % CUSTOMERS.length],
      tdtDr: `DR1589${415 + i}`,
      branch: i % 2 === 0 ? "Manila" : "Cebu",
      bdrSummary: `BDR-${2201 + i}`,
      tdtSi: `SI-${88421 + i}`,
      qtyOut,
      unitCost,
      totalPrice: qtyOut * unitCost,
      s1: `${Math.ceil(qtyOut / 3)} / ${daysAgo(dayOffset + 1)}`,
      s2: i % 2 === 0 ? `${Math.floor(qtyOut / 3)} / ${daysAgo(dayOffset)}` : "—",
      s3: "—",
      runningQty: running,
      runningValue: running * unitCost,
      remarks: i % 5 === 0 ? "Delivered" : "",
    };
  });
}

/** Other SKUs — spread across the last 15 days */
const OTHER_STOCK_IN = [
  { id: 101, sku: "DRB052", transNo: "IN-101", date: daysAgo(13), tdtPo: "PO-2026-0150", tdtPoDate: daysAgo(14), vendorNo: "V-9012", vendorName: "Dragon Steel", customerDr: "RCM Builders", tdtWo: "WO-4410", acceptDate: daysAgo(11), qty: 200, costKilo: 51.8, costUnit: 346.73, totalPurchase: 69346, runningQty: 200, avgUnitCost: 346.73, totalValue: 69346, remark: "" },
  { id: 102, sku: "DRB052", transNo: "IN-102", date: daysAgo(9), tdtPo: "PO-2026-0154", tdtPoDate: daysAgo(10), vendorNo: "V-9012", vendorName: "Dragon Steel", customerDr: "—", tdtWo: "WO-4415", acceptDate: daysAgo(7), qty: 150, costKilo: 52.1, costUnit: 347.20, totalPurchase: 52080, runningQty: 350, avgUnitCost: 346.95, totalValue: 121426, remark: "Lot 2" },
  { id: 103, sku: "DRB052", transNo: "IN-103", date: daysAgo(5), tdtPo: "PO-2026-0160", tdtPoDate: daysAgo(6), vendorNo: "V-8821", vendorName: "Steel Asia Corp", customerDr: "—", tdtWo: "WO-4420", acceptDate: daysAgo(3), qty: 875, costKilo: 51.5, costUnit: 346.00, totalPurchase: 302750, runningQty: 1225, avgUnitCost: 346.50, totalValue: 424463, remark: "Bulk" },
  { id: 104, sku: "DRB052", transNo: "IN-104", date: daysAgo(3), tdtPo: "PO-2026-0164", tdtPoDate: daysAgo(4), vendorNo: "V-9100", vendorName: "Pag-asa Steel", customerDr: "Metro Builders Inc.", tdtWo: "WO-4428", acceptDate: daysAgo(1), qty: 90, costKilo: 52.0, costUnit: 347.50, totalPurchase: 31275, runningQty: 1315, avgUnitCost: 346.60, totalValue: 455738, remark: "" },
  { id: 105, sku: "DRB050", transNo: "IN-105", date: daysAgo(11), tdtPo: "PO-2026-0152", tdtPoDate: daysAgo(12), vendorNo: "V-9012", vendorName: "Dragon Steel", customerDr: "—", tdtWo: "WO-4412", acceptDate: daysAgo(9), qty: 320, costKilo: 50.2, costUnit: 136.60, totalPurchase: 43712, runningQty: 320, avgUnitCost: 136.60, totalValue: 43712, remark: "" },
  { id: 106, sku: "DRB050", transNo: "IN-106", date: daysAgo(7), tdtPo: "PO-2026-0158", tdtPoDate: daysAgo(8), vendorNo: "V-8821", vendorName: "Steel Asia Corp", customerDr: "—", tdtWo: "WO-4422", acceptDate: daysAgo(5), qty: 450, costKilo: 50.8, costUnit: 136.80, totalPurchase: 61560, runningQty: 770, avgUnitCost: 136.70, totalValue: 105272, remark: "" },
  { id: 107, sku: "DRB050", transNo: "IN-107", date: daysAgo(4), tdtPo: "PO-2026-0162", tdtPoDate: daysAgo(5), vendorNo: "V-8821", vendorName: "Steel Asia Corp", customerDr: "—", tdtWo: "WO-4430", acceptDate: daysAgo(2), qty: 787, costKilo: 51.0, costUnit: 137.20, totalPurchase: 107976, runningQty: 1557, avgUnitCost: 136.90, totalValue: 213248, remark: "Follow-up" },
  { id: 108, sku: "DRB050", transNo: "IN-108", date: TODAY, tdtPo: "PO-2026-0166", tdtPoDate: daysAgo(1), vendorNo: "V-9100", vendorName: "Pag-asa Steel", customerDr: "GW Construction", tdtWo: "WO-4435", acceptDate: TODAY, qty: 200, costKilo: 50.5, costUnit: 136.50, totalPurchase: 27300, runningQty: 1757, avgUnitCost: 136.85, totalValue: 240548, remark: "" },
  { id: 109, sku: "SHPT2", transNo: "IN-109", date: daysAgo(9), tdtPo: "PO-2026-0154", tdtPoDate: daysAgo(10), vendorNo: "V-9100", vendorName: "Pag-asa Steel", customerDr: "—", tdtWo: "WO-4418", acceptDate: daysAgo(7), qty: 80, costKilo: 48.5, costUnit: 22529.66, totalPurchase: 1802373, runningQty: 80, avgUnitCost: 22529.66, totalValue: 1802373, remark: "Lot 2" },
  { id: 110, sku: "SHPT2", transNo: "IN-110", date: daysAgo(6), tdtPo: "PO-2026-0158", tdtPoDate: daysAgo(7), vendorNo: "V-9012", vendorName: "Dragon Steel", customerDr: "—", tdtWo: "WO-4425", acceptDate: daysAgo(4), qty: 120, costKilo: 48.8, costUnit: 22550.00, totalPurchase: 2706000, runningQty: 200, avgUnitCost: 22540.00, totalValue: 4508000, remark: "" },
  { id: 111, sku: "SHPT2", transNo: "IN-111", date: daysAgo(2), tdtPo: "PO-2026-0164", tdtPoDate: daysAgo(3), vendorNo: "V-8821", vendorName: "Steel Asia Corp", customerDr: "RCM Builders", tdtWo: "WO-4432", acceptDate: daysAgo(1), qty: 360, costKilo: 49.0, costUnit: 22520.00, totalPurchase: 8107200, runningQty: 560, avgUnitCost: 22529.66, totalValue: 12616610, remark: "Main lot" },
  { id: 112, sku: "SHPT2", transNo: "IN-112", date: TODAY, tdtPo: "PO-2026-0168", tdtPoDate: daysAgo(1), vendorNo: "V-9100", vendorName: "Pag-asa Steel", customerDr: "—", tdtWo: "WO-4440", acceptDate: TODAY, qty: 40, costKilo: 48.2, costUnit: 22500.00, totalPurchase: 900000, runningQty: 600, avgUnitCost: 22525.00, totalValue: 13515000, remark: "" },
  { id: 113, sku: "MSP010", transNo: "IN-113", date: daysAgo(8), tdtPo: "PO-2026-0155", tdtPoDate: daysAgo(9), vendorNo: "V-9100", vendorName: "Pag-asa Steel", customerDr: "—", tdtWo: "WO-4420", acceptDate: daysAgo(6), qty: 150, costKilo: 42.1, costUnit: 554.79, totalPurchase: 83219, runningQty: 150, avgUnitCost: 554.79, totalValue: 83219, remark: "" },
  { id: 114, sku: "MSP010", transNo: "IN-114", date: daysAgo(5), tdtPo: "PO-2026-0160", tdtPoDate: daysAgo(6), vendorNo: "V-8821", vendorName: "Steel Asia Corp", customerDr: "—", tdtWo: "WO-4428", acceptDate: daysAgo(3), qty: 100, costKilo: 42.5, costUnit: 555.00, totalPurchase: 55500, runningQty: 250, avgUnitCost: 554.88, totalValue: 138719, remark: "" },
  { id: 115, sku: "MSP010", transNo: "IN-115", date: daysAgo(1), tdtPo: "PO-2026-0164", tdtPoDate: daysAgo(2), vendorNo: "V-9012", vendorName: "Dragon Steel", customerDr: "Prime Builders Corp.", tdtWo: "WO-4433", acceptDate: TODAY, qty: 72, costKilo: 42.0, costUnit: 554.50, totalPurchase: 39924, runningQty: 322, avgUnitCost: 554.79, totalValue: 178643, remark: "Balance" },
  { id: 116, sku: "MSP010", transNo: "IN-116", date: TODAY, tdtPo: "PO-2026-0168", tdtPoDate: daysAgo(1), vendorNo: "V-9100", vendorName: "Pag-asa Steel", customerDr: "—", tdtWo: "WO-4441", acceptDate: TODAY, qty: 50, costKilo: 41.8, costUnit: 554.00, totalPurchase: 27700, runningQty: 372, avgUnitCost: 554.70, totalValue: 206343, remark: "" },
  { id: 117, sku: "DRB051", transNo: "IN-117", date: daysAgo(7), tdtPo: "PO-2026-0156", tdtPoDate: daysAgo(8), vendorNo: "V-8821", vendorName: "Steel Asia Corp", customerDr: "—", tdtWo: "WO-4422", acceptDate: daysAgo(5), qty: 48, costKilo: 53.0, costUnit: 186.38, totalPurchase: 8946, runningQty: 48, avgUnitCost: 186.38, totalValue: 8946, remark: "Partial" },
  { id: 118, sku: "DRB051", transNo: "IN-118", date: daysAgo(4), tdtPo: "PO-2026-0162", tdtPoDate: daysAgo(5), vendorNo: "V-9012", vendorName: "Dragon Steel", customerDr: "—", tdtWo: "WO-4431", acceptDate: daysAgo(2), qty: 1, costKilo: 53.2, costUnit: 186.38, totalPurchase: 186, runningQty: 49, avgUnitCost: 186.38, totalValue: 9132, remark: "Single pc" },
  { id: 119, sku: "SHPT3", transNo: "IN-119", date: daysAgo(6), tdtPo: "PO-2026-0158", tdtPoDate: daysAgo(7), vendorNo: "V-9012", vendorName: "Dragon Steel", customerDr: "Metro Builders", tdtWo: "WO-4425", acceptDate: daysAgo(4), qty: 40, costKilo: 47.2, costUnit: 28271.06, totalPurchase: 1130842, runningQty: 40, avgUnitCost: 28271.06, totalValue: 1130842, remark: "" },
  { id: 120, sku: "SHPT3", transNo: "IN-120", date: daysAgo(3), tdtPo: "PO-2026-0164", tdtPoDate: daysAgo(4), vendorNo: "V-9100", vendorName: "Pag-asa Steel", customerDr: "—", tdtWo: "WO-4434", acceptDate: daysAgo(1), qty: 200, costKilo: 47.5, costUnit: 28280.00, totalPurchase: 5656000, runningQty: 240, avgUnitCost: 28275.00, totalValue: 6786000, remark: "" },
  { id: 121, sku: "SHPT3", transNo: "IN-121", date: TODAY, tdtPo: "PO-2026-0168", tdtPoDate: daysAgo(1), vendorNo: "V-8821", vendorName: "Steel Asia Corp", customerDr: "RCM Builders", tdtWo: "WO-4442", acceptDate: TODAY, qty: 241, costKilo: 47.0, costUnit: 28268.00, totalPurchase: 6812588, runningQty: 481, avgUnitCost: 28271.06, totalValue: 13598381, remark: "1 PC DAMAGED" },
  { id: 122, sku: "WF016", transNo: "IN-122", date: daysAgo(5), tdtPo: "PO-2026-0160", tdtPoDate: daysAgo(6), vendorNo: "V-9100", vendorName: "Pag-asa Steel", customerDr: "—", tdtWo: "WO-4428", acceptDate: daysAgo(3), qty: 100, costKilo: 44.0, costUnit: 8900.00, totalPurchase: 890000, runningQty: 100, avgUnitCost: 8900.00, totalValue: 890000, remark: "" },
  { id: 123, sku: "WF016", transNo: "IN-123", date: daysAgo(2), tdtPo: "PO-2026-0166", tdtPoDate: daysAgo(3), vendorNo: "V-8821", vendorName: "Steel Asia Corp", customerDr: "—", tdtWo: "WO-4436", acceptDate: daysAgo(1), qty: 50, costKilo: 44.2, costUnit: 8920.00, totalPurchase: 446000, runningQty: 150, avgUnitCost: 8906.00, totalValue: 1336000, remark: "" },
];

const OTHER_STOCK_OUT = [
  { id: 201, sku: "DRB050", transNo: "OUT-201", dispatchDate: daysAgo(13), tdtWo: "WO-5501", customer: "Michael Santiago", tdtDr: "DR1589415", branch: "Manila", bdrSummary: "BDR-2201", tdtSi: "SI-88421", qtyOut: 120, unitCost: 210, totalPrice: 25200, s1: "40 / -13d", s2: "40 / -12d", s3: "40 / -12d", runningQty: 200, runningValue: 42000, remarks: "" },
  { id: 202, sku: "DRB050", transNo: "OUT-202", dispatchDate: daysAgo(8), tdtWo: "WO-5508", customer: "RCM Builders", tdtDr: "DR1589500", branch: "Manila", bdrSummary: "BDR-2208", tdtSi: "SI-88450", qtyOut: 200, unitCost: 208, totalPrice: 41600, s1: "200 / -8d", s2: "—", s3: "—", runningQty: 1570, runningValue: 326560, remarks: "" },
  { id: 203, sku: "DRB050", transNo: "OUT-203", dispatchDate: daysAgo(5), tdtWo: "WO-5515", customer: "GW Construction", tdtDr: "DR1589655", branch: "Cebu", bdrSummary: "BDR-2215", tdtSi: "SI-88502", qtyOut: 150, unitCost: 205, totalPrice: 30750, s1: "75 / -6d", s2: "75 / -5d", s3: "—", runningQty: 1420, runningValue: 291100, remarks: "" },
  { id: 204, sku: "DRB050", transNo: "OUT-204", dispatchDate: daysAgo(2), tdtWo: "WO-5535", customer: "Metro Builders Inc.", tdtDr: "DR1589810", branch: "Manila", bdrSummary: "BDR-2235", tdtSi: "SI-88530", qtyOut: 290, unitCost: 200, totalPrice: 58000, s1: "100 / -3d", s2: "100 / -2d", s3: "90 / -2d", runningQty: 1130, runningValue: 233100, remarks: "Bulk dispatch" },
  { id: 205, sku: "DRB050", transNo: "OUT-205", dispatchDate: TODAY, tdtWo: "WO-5545", customer: "Prime Builders Corp.", tdtDr: "DR1589900", branch: "Manila", bdrSummary: "BDR-2245", tdtSi: "SI-88550", qtyOut: 180, unitCost: 202, totalPrice: 36360, s1: "180 / today", s2: "—", s3: "—", runningQty: 950, runningValue: 196900, remarks: "" },
  { id: 206, sku: "DRB052", transNo: "OUT-206", dispatchDate: daysAgo(9), tdtWo: "WO-5510", customer: "Prime Builders Corp.", tdtDr: "DR1589600", branch: "Cebu", bdrSummary: "BDR-2210", tdtSi: "SI-88488", qtyOut: 60, unitCost: 348, totalPrice: 20880, s1: "60 / -9d", s2: "—", s3: "—", runningQty: 1165, runningValue: 404420, remarks: "" },
  { id: 207, sku: "DRB052", transNo: "OUT-207", dispatchDate: daysAgo(6), tdtWo: "WO-5518", customer: "Michael Santiago", tdtDr: "DR1589680", branch: "Manila", bdrSummary: "BDR-2218", tdtSi: "SI-88500", qtyOut: 100, unitCost: 350, totalPrice: 35000, s1: "50 / -7d", s2: "50 / -6d", s3: "—", runningQty: 1065, runningValue: 372750, remarks: "" },
  { id: 208, sku: "DRB052", transNo: "OUT-208", dispatchDate: daysAgo(3), tdtWo: "WO-5528", customer: "RCM Builders", tdtDr: "DR1589750", branch: "Quezon City", bdrSummary: "BDR-2228", tdtSi: "SI-88520", qtyOut: 75, unitCost: 345, totalPrice: 25875, s1: "75 / -3d", s2: "—", s3: "—", runningQty: 990, runningValue: 341550, remarks: "" },
  { id: 209, sku: "DRB052", transNo: "OUT-209", dispatchDate: TODAY, tdtWo: "WO-5540", customer: "GW Construction", tdtDr: "DR1589820", branch: "Manila", bdrSummary: "BDR-2240", tdtSi: "SI-88540", qtyOut: 45, unitCost: 347, totalPrice: 15615, s1: "45 / today", s2: "—", s3: "—", runningQty: 945, runningValue: 328935, remarks: "" },
  { id: 210, sku: "SHPT2", transNo: "OUT-210", dispatchDate: daysAgo(10), tdtWo: "WO-5505", customer: "RCM Builders", tdtDr: "DR1589520", branch: "Manila", bdrSummary: "BDR-2205", tdtSi: "SI-88445", qtyOut: 12, unitCost: 22800, totalPrice: 273600, s1: "12 / -10d", s2: "—", s3: "—", runningQty: 548, runningValue: 12496248, remarks: "Delivered" },
  { id: 211, sku: "SHPT2", transNo: "OUT-211", dispatchDate: daysAgo(7), tdtWo: "WO-5512", customer: "Metro Builders Inc.", tdtDr: "DR1589620", branch: "Manila", bdrSummary: "BDR-2212", tdtSi: "SI-88470", qtyOut: 8, unitCost: 22850, totalPrice: 182800, s1: "8 / -7d", s2: "—", s3: "—", runningQty: 540, runningValue: 12321000, remarks: "" },
  { id: 212, sku: "SHPT2", transNo: "OUT-212", dispatchDate: daysAgo(4), tdtWo: "WO-5522", customer: "Prime Builders Corp.", tdtDr: "DR1589740", branch: "Cebu", bdrSummary: "BDR-2222", tdtSi: "SI-88515", qtyOut: 15, unitCost: 22700, totalPrice: 340500, s1: "8 / -5d", s2: "7 / -4d", s3: "—", runningQty: 525, runningValue: 11917500, remarks: "" },
  { id: 213, sku: "SHPT2", transNo: "OUT-213", dispatchDate: daysAgo(1), tdtWo: "WO-5538", customer: "GW Construction", tdtDr: "DR1589830", branch: "Manila", bdrSummary: "BDR-2238", tdtSi: "SI-88535", qtyOut: 10, unitCost: 22900, totalPrice: 229000, s1: "10 / yesterday", s2: "—", s3: "—", runningQty: 515, runningValue: 11688500, remarks: "" },
  { id: 214, sku: "MSP010", transNo: "OUT-214", dispatchDate: daysAgo(9), tdtWo: "WO-5515", customer: "GW Construction", tdtDr: "DR1589655", branch: "Manila", bdrSummary: "BDR-2215", tdtSi: "SI-88502", qtyOut: 50, unitCost: 560, totalPrice: 28000, s1: "25 / -10d", s2: "25 / -9d", s3: "—", runningQty: 272, runningValue: 152320, remarks: "" },
  { id: 215, sku: "MSP010", transNo: "OUT-215", dispatchDate: daysAgo(5), tdtWo: "WO-5524", customer: "RCM Builders", tdtDr: "DR1589710", branch: "Manila", bdrSummary: "BDR-2224", tdtSi: "SI-88512", qtyOut: 35, unitCost: 558, totalPrice: 19530, s1: "35 / -5d", s2: "—", s3: "—", runningQty: 237, runningValue: 132846, remarks: "" },
  { id: 216, sku: "MSP010", transNo: "OUT-216", dispatchDate: daysAgo(1), tdtWo: "WO-5542", customer: "Michael Santiago", tdtDr: "DR1589845", branch: "Cebu", bdrSummary: "BDR-2242", tdtSi: "SI-88545", qtyOut: 40, unitCost: 562, totalPrice: 22480, s1: "20 / -2d", s2: "20 / yesterday", s3: "—", runningQty: 197, runningValue: 110414, remarks: "" },
  { id: 217, sku: "DRB051", transNo: "OUT-217", dispatchDate: daysAgo(6), tdtWo: "WO-5530", customer: "Michael Santiago", tdtDr: "DR1589788", branch: "Manila", bdrSummary: "BDR-2230", tdtSi: "SI-88525", qtyOut: 1, unitCost: 186, totalPrice: 186, s1: "1 / -6d", s2: "—", s3: "—", runningQty: 0, runningValue: 0, remarks: "Single pc release" },
  { id: 218, sku: "SHPT3", transNo: "OUT-218", dispatchDate: daysAgo(7), tdtWo: "WO-5525", customer: "RCM Builders", tdtDr: "DR1589722", branch: "Manila", bdrSummary: "BDR-2225", tdtSi: "SI-88518", qtyOut: 8, unitCost: 28500, totalPrice: 228000, s1: "4 / -8d", s2: "4 / -7d", s3: "—", runningQty: 473, runningValue: 13480500, remarks: "" },
  { id: 219, sku: "SHPT3", transNo: "OUT-219", dispatchDate: daysAgo(2), tdtWo: "WO-5544", customer: "Metro Builders Inc.", tdtDr: "DR1589890", branch: "Manila", bdrSummary: "BDR-2244", tdtSi: "SI-88548", qtyOut: 12, unitCost: 28400, totalPrice: 340800, s1: "12 / -2d", s2: "—", s3: "—", runningQty: 461, runningValue: 13092400, remarks: "" },
  { id: 220, sku: "WF016", transNo: "OUT-220", dispatchDate: TODAY, tdtWo: "WO-5540", customer: "Prime Builders Corp.", tdtDr: "DR1589840", branch: "Cebu", bdrSummary: "BDR-2240", tdtSi: "SI-88538", qtyOut: 22, unitCost: 9100, totalPrice: 200200, s1: "22 / today", s2: "—", s3: "—", runningQty: 78, runningValue: 689800, remarks: "" },
];

export const SEED_STOCK_IN = [...buildDrb007StockIn(), ...OTHER_STOCK_IN];
export const SEED_STOCK_OUT = [...buildDrb007StockOut(), ...OTHER_STOCK_OUT];

const SKU_DESCRIPTIONS = {
  DRB007: "Deformed Round Bar, 10mm x 6M g33",
  DRB050: "Deformed Round Bar, 10mm x 6M g40",
  DRB051: "Deformed Round Bar, 12mm x 6M g40",
  DRB052: "Deformed Round Bar, 16mm x 6M g40",
  SHPT2:  "Sheet Pile T2 x 12M",
  SHPT3:  "Sheet Pile T3 x 12M",
  MSP010: "MS Plate, 6mm x 4' x 8'",
  WF016:  "Wide Flange, 8 x 4 x 10# x 6M",
};

/** Flat list for dashboard charts, notifications, and recent activity. */
export function toDashboardStockIn(rows) {
  return rows.map((r) => ({
    id: r.id,
    sku: r.sku,
    description: SKU_DESCRIPTIONS[r.sku] || r.sku,
    date: r.date,
    qty: r.qty,
    vendor: r.vendorName,
  }));
}

export function toDashboardStockOut(rows) {
  return rows.map((r) => ({
    id: r.id,
    sku: r.sku,
    description: SKU_DESCRIPTIONS[r.sku] || r.sku,
    date: r.dispatchDate,
    qty: r.qtyOut,
    customer: r.customer,
    totalPrice: r.totalPrice,
  }));
}