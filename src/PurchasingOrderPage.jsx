import { useState, useMemo, useRef, useEffect } from "react";
import XLSX from "xlsx-js-style";
import PageToolbar from "./PageToolbar";
import {
  cellStr,
  cellNum,
  formatExcelDate,
  findHeaderRowIndex,
  pickCol,
  rowHasData,
  readWorkbookSheet,
} from "./excelImportUtils";

function Highlight({ text, query }) {
  if (!query || !text) return <>{String(text)}</>;
  const idx = String(text).toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{String(text)}</>;
  const s = String(text);
  return (
    <>
      {s.slice(0, idx)}
      <mark style={{ background: "#fef08a", color: "#111827", padding: 0, borderRadius: 2 }}>{s.slice(idx, idx + query.length)}</mark>
      {s.slice(idx + query.length)}
    </>
  );
}

const PAGE_SIZE = 8;

const STATUS_OPTS = ["All Status", "Active", "Completed", "Pending", "Cancelled"];
const SUPPLIER_OPTS = ["All Suppliers", "Steel Asia Corp", "Dragon Steel", "Pag-asa Steel", "Steelworld"];

function fmtPHP(n) {
  return "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export const INITIAL_PURCHASE_ORDERS = [
  {
    id: 1,
    transNo: "001",
    poDate: "2026-05-02",
    eta: "2026-05-15",
    purchaser: "Maria Santos",
    tdtPo: "PO-2026-0142",
    vendor: "Steel Asia Corp",
    productDesc: "Deformed Round Bar, 10mm x 6M g40",
    destination: "Manila Warehouse",
    tradingOrStocks: "Stocks",
    warehouseType: "Stocks",
    metricTons: 2.4,
    qtyPerPo: 400,
    weight: "—",
    status: "Active",
    txnNo: "TXN-2026-001",
    lineItems: [
      { code: "DRB050", desc: "Deformed Round Bar, 10mm x 6M", qty: 100, unit: 485, val: 48500 },
      { code: "DRB050", desc: "Deformed Round Bar, 10mm x 6M", qty: 100, unit: 485, val: 48500 },
      { code: "DRB050", desc: "Deformed Round Bar, 10mm x 6M", qty: 100, unit: 485, val: 48500 },
      { code: "DRB050", desc: "Deformed Round Bar, 10mm x 6M", qty: 100, unit: 485, val: 48500 },
    ],
  },
  {
    id: 2,
    transNo: "002",
    poDate: "2026-05-03",
    eta: "2026-05-18",
    purchaser: "Juan Reyes",
    tdtPo: "PO-2026-0143",
    vendor: "Dragon Steel",
    productDesc: "Wide Flange, 10 x 8 x 33# x 6M",
    destination: "Cebu Warehouse",
    tradingOrStocks: "Trading",
    warehouseType: "Backload",
    metricTons: 5.1,
    qtyPerPo: 12,
    weight: "12.2 MT",
    status: "Completed",
    txnNo: "TXN-2026-002",
    lineItems: [
      { code: "WF10833", desc: "Wide Flange, 10 x 8 x 33# x 6M", qty: 12, unit: 12300, val: 147600 },
    ],
  },
  {
    id: 3,
    transNo: "003",
    poDate: "2026-05-04",
    eta: "2026-05-20",
    purchaser: "Ana Cruz",
    tdtPo: "PO-2026-0144",
    vendor: "Pag-asa Steel",
    productDesc: "Sheet Pile T2, 400mm x 100mm",
    destination: "Manila Warehouse",
    tradingOrStocks: "Stocks",
    warehouseType: "Stocks",
    metricTons: 8.6,
    qtyPerPo: 15,
    weight: "—",
    status: "Pending",
    txnNo: "TXN-2026-003",
    lineItems: [
      { code: "SHPT2", desc: "Sheet Pile T2, 400mm x 100mm x 10.5mm", qty: 15, unit: 22529.66, val: 337944.9 },
    ],
  },
  {
    id: 4,
    transNo: "004",
    poDate: "2026-05-05",
    eta: "2026-05-22",
    purchaser: "Leo Santos",
    tdtPo: "PO-2026-0145",
    vendor: "Steelworld",
    productDesc: "MS Plate, 6mm x 4' x 8'",
    destination: "Davao Warehouse",
    tradingOrStocks: "Stocks",
    warehouseType: "Stocks",
    metricTons: 1.2,
    qtyPerPo: 50,
    weight: "—",
    status: "Active",
    txnNo: "TXN-2026-004",
    lineItems: [
      { code: "MSP010", desc: "MS Plate, 6mm x 4' x 8'", qty: 50, unit: 554.79, val: 27739.5 },
    ],
  },
  {
    id: 5,
    transNo: "005",
    poDate: "2026-05-06",
    eta: "2026-05-25",
    purchaser: "Maria Santos",
    tdtPo: "PO-2026-0146",
    vendor: "Steel Asia Corp",
    productDesc: "Deformed Round Bar, 16mm x 6M g40",
    destination: "Manila Warehouse",
    tradingOrStocks: "Trading",
    warehouseType: "Backload",
    metricTons: 3.8,
    qtyPerPo: 200,
    weight: "3.8 MT",
    status: "Completed",
    txnNo: "TXN-2026-005",
    lineItems: [
      { code: "DRB052", desc: "Deformed Round Bar, 16mm x 6M g40", qty: 200, unit: 346.73, val: 69346 },
    ],
  },
  {
    id: 6,
    transNo: "006",
    poDate: "2026-05-07",
    eta: "2026-05-28",
    purchaser: "Juan Reyes",
    tdtPo: "PO-2026-0147",
    vendor: "Dragon Steel",
    productDesc: "GI Rectangular Tube, 2 x 4 x 2mm x 6M",
    destination: "Cebu Warehouse",
    tradingOrStocks: "Stocks",
    warehouseType: "Stocks",
    metricTons: 0.9,
    qtyPerPo: 80,
    weight: "—",
    status: "Pending",
    txnNo: "TXN-2026-006",
    lineItems: [
      { code: "RECT24", desc: "GI Rectangular Tube, 2 x 4 x 2mm x 6M", qty: 80, unit: 1380, val: 110400 },
    ],
  },
  {
    id: 7,
    transNo: "007",
    poDate: "2026-05-08",
    eta: "2026-06-01",
    purchaser: "Ana Cruz",
    tdtPo: "PO-2026-0148",
    vendor: "Pag-asa Steel",
    productDesc: "Angle Bar, 5mm x 50mm x 50mm x 6M",
    destination: "Manila Warehouse",
    tradingOrStocks: "Stocks",
    warehouseType: "Stocks",
    metricTons: 0.5,
    qtyPerPo: 120,
    weight: "—",
    status: "Active",
    txnNo: "TXN-2026-007",
    lineItems: [
      { code: "ABB18", desc: "Angle Bar, 5mm x 50mm x 50mm x 6M White", qty: 120, unit: 98.5, val: 11820 },
    ],
  },
  {
    id: 8,
    transNo: "008",
    poDate: "2026-05-09",
    eta: "2026-06-03",
    purchaser: "Leo Santos",
    tdtPo: "PO-2026-0149",
    vendor: "Steelworld",
    productDesc: "GI pipe 1\" x 6M s40",
    destination: "Manila Warehouse",
    tradingOrStocks: "Trading",
    warehouseType: "Backload",
    metricTons: 1.1,
    qtyPerPo: 60,
    weight: "1.1 MT",
    status: "Cancelled",
    txnNo: "TXN-2026-008",
    lineItems: [
      { code: "GP3302", desc: 'GI pipe 1" x 6M s40', qty: 60, unit: 1380, val: 82800 },
    ],
  },
  {
    id: 9,
    transNo: "009",
    poDate: "2026-05-10",
    eta: "2026-06-05",
    purchaser: "Maria Santos",
    tdtPo: "PO-2026-0150",
    vendor: "Steel Asia Corp",
    productDesc: "Deformed Round Bar, 20mm x 6M g60",
    destination: "Cebu Warehouse",
    tradingOrStocks: "Stocks",
    warehouseType: "Stocks",
    metricTons: 2.2,
    qtyPerPo: 90,
    weight: "—",
    status: "Completed",
    txnNo: "TXN-2026-009",
    lineItems: [
      { code: "DRB020", desc: "Deformed Round Bar, 20mm x 6M g60", qty: 90, unit: 539.31, val: 48537.9 },
    ],
  },
  {
    id: 10,
    transNo: "010",
    poDate: "2026-05-11",
    eta: "2026-06-08",
    purchaser: "Juan Reyes",
    tdtPo: "PO-2026-0151",
    vendor: "Dragon Steel",
    productDesc: "Sheet Pile Z type 12 meters",
    destination: "Manila Warehouse",
    tradingOrStocks: "Stocks",
    warehouseType: "Stocks",
    metricTons: 10.5,
    qtyPerPo: 8,
    weight: "10.5 MT",
    status: "Pending",
    txnNo: "TXN-2026-010",
    lineItems: [
      { code: "SHPT7", desc: "Sheet Pile Z type 12 meters", qty: 8, unit: 41838.53, val: 334708.24 },
    ],
  },
];

const STATUS_BADGE = {
  Active: { bg: "#dcfce7", color: "#15803d", panel: "#22c55e" },
  Completed: { bg: "#dcfce7", color: "#15803d", panel: "#22c55e" },
  Pending: { bg: "#fef3c7", color: "#d97706", panel: "#f59e0b" },
  Cancelled: { bg: "#e5e7eb", color: "#4b5563", panel: "#6b7280" },
};

const TABLE_COLS = [
  "TRANS NO.",
  "PO DATE",
  "ETA",
  "NAME OF PURCHASER",
  "TDT PURCHASE ORDER #",
  "VENDOR / SUPPLIER'S NAME",
  "PRODUCT DESCRIPTION",
  "DESTINATION",
  "IF FOR TRADING OR STOCKS",
  "IF TO WAREHOUSE — STOCKS OR BACKLOAD",
  "METRIC TONS",
  "QTY AS PER PO",
  "WEIGHT (IF NEEDED)",
  "STATUS",
];

const RIGHT_ALIGN = new Set(["METRIC TONS", "QTY AS PER PO"]);

function IconSearch({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>;
}
function IconChevronDown({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 9l-7 7-7-7" /></svg>;
}
function IconChevronLeft({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M15 19l-7-7 7-7" /></svg>;
}
function IconChevronRight({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>;
}
function IconPlus({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}
function IconDownload({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;
}
function IconCalendar({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
}
function IconX({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}

const selectSt = {
  padding: "11px 32px 11px 14px",
  fontSize: 14,
  border: "1px solid #b8bec9",
  borderRadius: 8,
  background: "#ffffff",
  color: "#111827",
  cursor: "pointer",
  fontFamily: "inherit",
  width: "100%",
  appearance: "none",
  fontWeight: 500,
  outline: "none",
  boxShadow: "inset 0 1px 2px rgba(15,23,42,0.04)",
};

function lineQtySum(lines) {
  return lines.reduce((s, L) => s + L.qty, 0);
}
function lineValSum(lines) {
  return lines.reduce((s, L) => s + L.val, 0);
}


/* ─── SheetJS loader ── */
function useSheetJS() {
  const [ready, setReady] = useState(!!window.XLSX);
  useEffect(() => {
    if (window.XLSX) { setReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload = () => setReady(true);
    document.head.appendChild(s);
  }, []);
  return ready;
}

function IconUpload({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }

/* ─── EXPORT (Purchase Order Control layout) ── */
const PO_PURCH_COLS = 16;
const PO_WH_COLS = 9;
const PO_TOTAL_COLS = PO_PURCH_COLS + PO_WH_COLS;

const PO_PURCH_HEADERS = [
  "TRANS NO.",
  "INSERT DATE OF P.O.",
  "INSERT ETA",
  "INSERT NAME OF PURCHASER",
  "INSERT TDT PURCHASE ORDER #",
  "INSERT VENDOR OR SUPPLIER'S NAME",
  "INSERT PRODUCT DESCRIPTION",
  "INSERT WAREHOUSE OR CUSTOMER ORGANIZATION",
  "INSERT IF FOR TRADING OR STOCKS",
  "IF TO WAREHOUSE, INSERT STORE OF DESTINATION",
  "INSERT RETENTION",
  "INSERT QUANTITY AS PER PURCHASE ORDER",
  "INSERT WEIGHT (IF NEEDED)",
  "COST PER KILO",
  "INSERT COST PER UNIT (FOR PURCHASING)",
  "INSERT TOTAL COST OF PURCHASE",
];

const PO_WH_HEADERS = [
  "INSERT DATE OF ACTUAL RECEIPT",
  "INSERT SUPPLIER'S DELIVERY RECEIPT NO.",
  "INSERT ACTUAL QUANTITY RECEIVED",
  "QUANTITY VARIANCE (DIFF/SHORT)",
  "VARIANCE AMOUNT (DIFF/SHORT)",
  "INSERT NAME OF CHECKER",
  "INSERT NAME OF RECEIVER",
  "INSERT NAME OF STORER",
  "REMARKS / VARIANCE",
];

function exportToWis(rows) {
  const wb = XLSX.utils.book_new();
  const C = (r, c) => XLSX.utils.encode_cell({ r, c });

  const purchDark = { patternType: "solid", fgColor: { rgb: "2F5597" } };
  const purchMid = { patternType: "solid", fgColor: { rgb: "4472C4" } };
  const whDark = { patternType: "solid", fgColor: { rgb: "548235" } };
  const whMid = { patternType: "solid", fgColor: { rgb: "70AD47" } };
  const dataFill = { patternType: "solid", fgColor: { rgb: "DDEBF7" } };
  const grandFill = { patternType: "solid", fgColor: { rgb: "FFF2CC" } };

  const cellBorder = {
    top: { style: "thin", color: { rgb: "2F5597" } },
    bottom: { style: "thin", color: { rgb: "2F5597" } },
    left: { style: "thin", color: { rgb: "2F5597" } },
    right: { style: "thin", color: { rgb: "2F5597" } },
  };
  const hdrBorder = {
    top: { style: "thin", color: { rgb: "FFFFFF" } },
    bottom: { style: "thin", color: { rgb: "FFFFFF" } },
    left: { style: "thin", color: { rgb: "FFFFFF" } },
    right: { style: "thin", color: { rgb: "FFFFFF" } },
  };

  const f = {
    note: () => ({ name: "Arial", sz: 9, color: { rgb: "000000" } }),
    section: () => ({ name: "Arial", sz: 11, bold: true, color: { rgb: "FFFFFF" } }),
    colHdr: () => ({ name: "Arial", sz: 8, bold: true, color: { rgb: "FFFFFF" } }),
    grand: () => ({ name: "Arial", sz: 9, bold: true, color: { rgb: "000000" } }),
    body: (bold = false) => ({ name: "Arial", sz: 9, bold, color: { rgb: "000000" } }),
  };
  const a = {
    ctr: (wrap = true) => ({ horizontal: "center", vertical: "center", wrapText: wrap }),
    left: (wrap = true) => ({ horizontal: "left", vertical: "center", wrapText: wrap }),
    right: () => ({ horizontal: "right", vertical: "center" }),
  };

  const phpFmt = '"₱"#,##0.00';
  const qtyFmt = "#,##0";
  const varFmt = "#,##0.00";

  const ws = {};

  const put = (r, c, v, style) => {
    const empty = v === null || v === undefined || v === "";
    ws[C(r, c)] = {
      v: empty ? "" : v,
      t: typeof v === "number" && !Number.isNaN(v) ? "n" : "s",
      s: style,
    };
  };

  const hdrStyle = (fill, border = hdrBorder) => ({
    font: f.colHdr(),
    fill,
    alignment: a.ctr(),
    border,
  });
  const dataStyle = (align, numFmt = null, bold = false) => ({
    font: f.body(bold),
    fill: dataFill,
    alignment: align,
    border: cellBorder,
    ...(numFmt ? { numFmt } : {}),
  });

  // Row 0–1: layout instructions
  put(0, 0, "1. Purchase Order System Layout should be followed.", {
    font: f.note(),
    alignment: a.left(false),
  });
  put(1, 0, "2. IF FOR THE UNIT COST IS OPTIONAL, IT SHOULD BE ADDED IF THE STORE HAS IT ON THEIR SUMMARY. IT SHOULD BE THE SAME AS THE UNIT PRICE OF THE SPECIFIC PRODUCT.", {
    font: f.note(),
    alignment: a.left(true),
  });

  // Row 2: PURCHASING / WAREHOUSE section banners
  put(2, 0, "PURCHASING", {
    font: f.section(),
    fill: purchDark,
    alignment: a.ctr(false),
    border: hdrBorder,
  });
  put(2, PO_PURCH_COLS, "WAREHOUSE", {
    font: f.section(),
    fill: whDark,
    alignment: a.ctr(false),
    border: hdrBorder,
  });

  // Row 3: column sub-headers
  PO_PURCH_HEADERS.forEach((h, ci) => {
    put(3, ci, h, hdrStyle(purchMid));
  });
  PO_WH_HEADERS.forEach((h, ci) => {
    put(3, PO_PURCH_COLS + ci, h, hdrStyle(whMid));
  });

  // Totals for grand-total row
  let sumQty = 0;
  let sumTotalCost = 0;
  let sumWeight = 0;
  rows.forEach((r) => {
    sumQty += r.qtyPerPo || 0;
    sumWeight += r.metricTons || 0;
    sumTotalCost += lineValSum(r.lineItems || []);
  });

  // Row 4: GRAND TOTAL
  const grandStyle = {
    font: f.grand(),
    fill: grandFill,
    alignment: a.ctr(),
    border: cellBorder,
  };
  for (let c = 0; c < PO_TOTAL_COLS; c++) {
    put(4, c, "", grandStyle);
  }
  put(4, 9, "GRAND TOTAL>>>>>", { ...grandStyle, alignment: a.left(false) });
  put(4, 11, sumQty, { ...grandStyle, numFmt: qtyFmt });
  put(4, 12, sumWeight || 0, { ...grandStyle, numFmt: varFmt });
  put(4, 13, "₱ -", grandStyle);
  put(4, 14, "₱ -", grandStyle);
  put(4, 15, sumTotalCost || 0, { ...grandStyle, numFmt: phpFmt, alignment: a.right() });
  put(4, 18, 0, { ...grandStyle, numFmt: qtyFmt });
  put(4, 19, 0, { ...grandStyle, numFmt: varFmt });
  put(4, 20, 0, { ...grandStyle, numFmt: phpFmt, alignment: a.right() });

  // Row 5+: data
  rows.forEach((r, i) => {
    const ri = 5 + i;
    const lines = r.lineItems || [];
    const totalCost = lineValSum(lines);
    const totalQty = lineQtySum(lines);
    const unitCost = totalQty > 0 ? totalCost / totalQty : null;
    const weightStr = r.weight && r.weight !== "—" ? r.weight : (r.metricTons ? String(r.metricTons) : "");

    const purchVals = [
      r.transNo || i + 1,
      r.poDate || "",
      r.eta || "",
      r.purchaser || "",
      r.tdtPo || "",
      r.vendor || "",
      r.productDesc || "",
      r.destination || "",
      r.tradingOrStocks || "",
      r.warehouseType || "",
      "",
      r.qtyPerPo ?? 0,
      weightStr,
      "",
      unitCost,
      totalCost || 0,
    ];

    purchVals.forEach((v, ci) => {
      const isQty = ci === 11;
      const isKilo = ci === 13;
      const isUnit = ci === 14;
      const isTotal = ci === 15;
      if (isKilo || (isUnit && (v === null || v === "" || v === 0))) {
        put(ri, ci, "₱ -", dataStyle(a.ctr()));
        return;
      }
      if (isTotal && (!v || v === 0)) {
        put(ri, ci, "₱ -", dataStyle(a.right()));
        return;
      }
      put(ri, ci, v, dataStyle(
        isUnit || isTotal ? a.right() : ci <= 6 ? a.left() : a.ctr(),
        isQty ? qtyFmt : isUnit || isTotal ? phpFmt : null,
        ci === 0
      ));
    });

    const whDefaults = ["", "", 0, 0, 0, "", "", "", ""];
    whDefaults.forEach((v, ci) => {
      const col = PO_PURCH_COLS + ci;
      const isNum = ci === 2 || ci === 3;
      const isAmt = ci === 4;
      put(ri, col, v, dataStyle(
        isAmt ? a.right() : a.ctr(),
        isNum ? qtyFmt : isAmt ? varFmt : null
      ));
    });
  });

  const lastRow = Math.max(5 + rows.length - 1, 4);
  ws["!ref"] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: lastRow, c: PO_TOTAL_COLS - 1 });

  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: PO_TOTAL_COLS - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: PO_TOTAL_COLS - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: PO_PURCH_COLS - 1 } },
    { s: { r: 2, c: PO_PURCH_COLS }, e: { r: 2, c: PO_TOTAL_COLS - 1 } },
  ];

  ws["!cols"] = [
    { wch: 8 },
    { wch: 14 },
    { wch: 12 },
    { wch: 18 },
    { wch: 16 },
    { wch: 22 },
    { wch: 36 },
    { wch: 22 },
    { wch: 14 },
    { wch: 18 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
  ];

  ws["!rows"] = [
    { hpt: 16 },
    { hpt: 28 },
    { hpt: 22 },
    { hpt: 48 },
    { hpt: 20 },
    ...rows.map(() => ({ hpt: 22 })),
  ];

  XLSX.utils.book_append_sheet(wb, ws, "PURCHASING");
  XLSX.writeFile(wb, "TDT_WIS_Purchasing_Order_Export.xlsx");
}

/* ─── IMPORT parser ── */
async function importPurchaseOrders(file, onDone, onError) {
  try {
    const { raw } = await readWorkbookSheet(file, ["PURCHASING"]);
    const headerIdx = findHeaderRowIndex(raw, ["TRANS"], 20);
    const dataStart = headerIdx >= 0 ? headerIdx + 1 : 6;
    const headers = headerIdx >= 0 ? raw[headerIdx] : null;
    const parsed = [];

    for (let i = dataStart; i < raw.length; i++) {
      const r = raw[i];
      if (!rowHasData(r)) continue;

      let transNo = cellStr(pickCol(r, headers, ["TRANS #", "TRANS"], 1));
      let poDate = formatExcelDate(pickCol(r, headers, ["PO DATE", "DATE"], 2));
      const col0 = cellStr(r[0]);
      const col1 = r[1];
      if (!transNo && col0 && formatExcelDate(col1).match(/^\d{4}-\d{2}-\d{2}/)) {
        transNo = col0;
        poDate = formatExcelDate(col1);
      }
      const productDesc = cellStr(pickCol(r, headers, ["PRODUCT"], 7));
      const vendor = cellStr(pickCol(r, headers, ["VENDOR", "SUPPLIER"], 6));
      if (!transNo && !productDesc && !vendor) continue;

      parsed.push({
        id: parsed.length + 1,
        transNo: transNo || String(parsed.length + 1).padStart(3, "0"),
        poDate,
        eta: formatExcelDate(pickCol(r, headers, ["ETA"], 3)),
        purchaser: cellStr(pickCol(r, headers, ["PURCHASER", "NAME OF PURCHASER"], 4)),
        tdtPo: cellStr(pickCol(r, headers, ["TDT PO", "PURCHASE ORDER"], 5)),
        vendor,
        productDesc,
        destination: cellStr(pickCol(r, headers, ["DESTINATION"], 8)),
        tradingOrStocks: "Stocks",
        warehouseType: "Stocks",
        metricTons: cellNum(pickCol(r, headers, ["METRIC TONS", "METRIC"], 9)),
        qtyPerPo: cellNum(pickCol(r, headers, ["QTY"], 10)),
        weight: "—",
        status: cellStr(pickCol(r, headers, ["STATUS"], 11)) || "Pending",
        txnNo: "",
        lineItems: [],
      });
    }

    if (!parsed.length) throw new Error("No data rows found. Fill TRANS # or product/vendor columns.");
    onDone(parsed);
  } catch (err) {
    onError(err.message || "Import failed.");
  }
}

export default function PurchasingOrderPage({
  initialStatusFilter = "All Status",
  orders: propOrders,
  setOrders: propSetOrders,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [localOrders, setLocalOrders] = useState(INITIAL_PURCHASE_ORDERS);
  const orders = propOrders ?? localOrders;
  const setOrders = propSetOrders ?? setLocalOrders;
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState(null);

  const xlsxReady = useSheetJS();
  const importRef = useRef(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [supplierFilter, setSupplierFilter] = useState("All Suppliers");
  const [currentPage, setCurrentPage] = useState(1);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ poDate: "", eta: "", vendor: "", productDesc: "", sku: "", qty: "", unitCost: "", notes: "" });

  useEffect(() => {
    setStatusFilter(initialStatusFilter);
    setCurrentPage(1);
    setPanelOpen(false);
    setSelectedId(null);
  }, [initialStatusFilter]);

  const filtered = useMemo(() => {
    let rows = orders;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.tdtPo.toLowerCase().includes(q) ||
          r.vendor.toLowerCase().includes(q) ||
          r.txnNo.toLowerCase().includes(q) ||
          r.purchaser.toLowerCase().includes(q) ||
          r.productDesc.toLowerCase().includes(q) ||
          r.destination.toLowerCase().includes(q) ||
          String(r.transNo).includes(q)
      );
    }
    if (statusFilter !== "All Status") rows = rows.filter((r) => r.status === statusFilter);
    if (supplierFilter !== "All Suppliers") rows = rows.filter((r) => r.vendor === supplierFilter);
    return rows;
  }, [orders, searchQuery, statusFilter, supplierFilter]);

  useEffect(() => {
    if (selectedId != null && !filtered.some((r) => r.id === selectedId)) {
      setSelectedId(null);
      setPanelOpen(false);
    }
  }, [filtered, selectedId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selected = selectedId != null ? orders.find((r) => r.id === selectedId) : null;
  const panelBadge = selected ? (STATUS_BADGE[selected.status] || STATUS_BADGE.Pending) : STATUS_BADGE.Pending;

  const totalSeed = 218;

  return (
    <div style={{ background: "#f0f2f5", padding: "28px 32px 40px", display: "flex", flexDirection: "column", gap: 18 }}>

      <PageToolbar
        searchValue={searchQuery}
        searchPlaceholder="Search PO# or vendor..."
        onSearchChange={(v) => { setSearchQuery(v); setCurrentPage(1); }}
        filters={[
          { key: "status", value: statusFilter, onChange: (v) => { setStatusFilter(v); setCurrentPage(1); }, options: STATUS_OPTS, minWidth: 140 },
          { key: "supplier", value: supplierFilter, onChange: (v) => { setSupplierFilter(v); setCurrentPage(1); }, options: SUPPLIER_OPTS, minWidth: 160 },
        ]}
        primaryAction={{ label: "Create Purchase Order", onClick: () => setShowCreate(true) }}
        importExport={{
          fileInputRef: importRef,
          onFileChange: (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setImporting(true);
            importPurchaseOrders(
              file,
              (parsed) => {
                setImporting(false);
                setOrders(parsed);
                setCurrentPage(1);
                setSelectedId(null);
                setPanelOpen(false);
                showToast(`Imported ${parsed.length} purchase orders successfully.`);
                e.target.value = "";
              },
              (err) => {
                setImporting(false);
                showToast(`Import failed: ${err}`, "error");
                e.target.value = "";
              }
            );
          },
          importing,
          importDisabled: !xlsxReady,
          onExport: () => exportToWis(orders),
        }}
      />

      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#1c2235" }}>
                {TABLE_COLS.map((h) => (
                  <th key={h} style={{ padding: "14px 10px", textAlign: "center", color: "#fff", fontWeight: 700, fontSize: 10, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr><td colSpan={TABLE_COLS.length} style={{ textAlign: "center", padding: "48px 20px", color: "#9ca3af" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                  No results found for <strong style={{ color: "#374151" }}>"{searchQuery || "your filters"}"</strong>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Try a different search term or clear your filters.</div>
                </td></tr>
              )}
              {paged.map((row, idx) => {
                const isSel = selectedId === row.id;
                const st = STATUS_BADGE[row.status] || STATUS_BADGE.Pending;
                return (
                  <tr
                    key={row.id}
                    style={{ borderBottom: "1px solid #f3f4f6", background: isSel ? "#fff4ed" : idx % 2 === 0 ? "#fff" : "#fafafa", cursor: "pointer", boxShadow: isSel ? "inset 3px 0 0 #e87c27" : "none" }}
                    onClick={() => { setSelectedId(row.id); setPanelOpen(true); }}
                    onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = "#fef6f2"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = isSel ? "#fff4ed" : idx % 2 === 0 ? "#fff" : "#fafafa"; }}
                  >
                    <td style={{ padding: "12px 10px", color: "#6b7280", fontWeight: 600, textAlign: "center" }}>{row.transNo}</td>
                    <td style={{ padding: "12px 10px", color: "#374151", whiteSpace: "nowrap", textAlign: "center" }}>{row.poDate}</td>
                    <td style={{ padding: "12px 10px", color: "#374151", whiteSpace: "nowrap", textAlign: "center" }}>{row.eta}</td>
                    <td style={{ padding: "12px 10px", color: "#374151", textAlign: "center" }}><Highlight text={row.purchaser} query={searchQuery} /></td>
                    <td style={{ padding: "12px 10px", color: "#e87c27", fontWeight: 700, textAlign: "center" }}><Highlight text={row.tdtPo} query={searchQuery} /></td>
                    <td style={{ padding: "12px 10px", color: "#111827", fontWeight: 600, maxWidth: 160, textAlign: "center" }}><Highlight text={row.vendor} query={searchQuery} /></td>
                    <td style={{ padding: "12px 10px", color: "#374151", maxWidth: 220, textAlign: "center" }}><Highlight text={row.productDesc} query={searchQuery} /></td>
                    <td style={{ padding: "12px 10px", color: "#6b7280", textAlign: "center" }}><Highlight text={row.destination} query={searchQuery} /></td>
                    <td style={{ padding: "12px 10px", color: "#6b7280", textAlign: "center" }}>{row.tradingOrStocks}</td>
                    <td style={{ padding: "12px 10px", color: "#6b7280", textAlign: "center" }}>{row.warehouseType}</td>
                    <td style={{ padding: "12px 10px", textAlign: "center" }}>{row.metricTons}</td>
                    <td style={{ padding: "12px 10px", textAlign: "center", fontWeight: 700 }}>{row.qtyPerPo}</td>
                    <td style={{ padding: "12px 10px", color: "#6b7280", textAlign: "center" }}>{row.weight}</td>
                    <td style={{ padding: "12px 10px", textAlign: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 12, background: st.bg, color: st.color }}>{row.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderTop: "1px solid #f3f4f6", background: "#fafafa", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {totalSeed} Purchase order
          </span>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.4 : 1 }}><IconChevronLeft size={14} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 8).map((n) => (
              <button key={n} type="button" onClick={() => setCurrentPage(n)} style={{ width: 30, height: 30, border: n === currentPage ? "none" : "1px solid #e5e7eb", borderRadius: 6, background: n === currentPage ? "#e87c27" : "#fff", color: n === currentPage ? "#fff" : "#374151", cursor: "pointer", fontWeight: n === currentPage ? 700 : 400, fontSize: 12 }}>{n}</button>
            ))}
            <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.4 : 1 }}><IconChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      {panelOpen && selected && (
        <>
          <button type="button" aria-label="Close" onClick={() => setPanelOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.35)", zIndex: 1040, border: "none", cursor: "pointer" }} />
          <aside style={{ position: "fixed", top: 0, right: 0, width: "min(440px, 100vw)", height: "100vh", background: "#fff", zIndex: 1050, boxShadow: "-8px 0 40px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "20px 22px", background: "#1c2235", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexShrink: 0 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#fff" }}>Transaction Details</h2>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: panelBadge.panel, color: "#fff" }}>{selected.status}</span>
                </div>
                <p style={{ margin: "10px 0 0", fontSize: 13, color: "#9ca3af", fontWeight: 600 }}>Transaction No. {selected.txnNo}</p>
              </div>
              <button type="button" onClick={() => setPanelOpen(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}><IconX size={18} /></button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px 24px" }}>
              {[
                ["Reference No.", selected.txnNo],
                ["Date", formatDate(selected.poDate)],
                ["Supplier", selected.vendor],
                ["Status", selected.status],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#111827", textAlign: "right" }}>{val}</span>
                </div>
              ))}
              <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.06em", margin: "20px 0 10px" }}>ORDERED ITEMS</p>
              <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#f3f4f6" }}>
                      {["Item Code", "Item Description", "Qty", "Unit Cost", "Line Value"].map((h) => (
                        <th key={h} style={{ padding: "10px 8px", textAlign: h === "Item Code" || h === "Item Description" ? "center" : "right", fontWeight: 700, color: "#111827" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selected.lineItems.map((it, i) => (
                      <tr key={i} style={{ borderTop: "1px solid #e5e7eb", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "10px 8px", fontWeight: 600, color: "#111827" }}>{it.code}</td>
                        <td style={{ padding: "10px 8px", color: "#374151" }}>{it.desc}</td>
                        <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 700 }}>{it.qty}</td>
                        <td style={{ padding: "10px 8px", textAlign: "right" }}>{fmtPHP(it.unit)}</td>
                        <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 600, color: "#e87c27" }}>{fmtPHP(it.val)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #e5e7eb", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, color: "#6b7280" }}>Total Qty</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>{lineQtySum(selected.lineItems)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, color: "#6b7280" }}>Total Purchased Value</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#e87c27" }}>{fmtPHP(lineValSum(selected.lineItems))}</span>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, background: toast.type === "error" ? "#dc2626" : "#16a34a", color: "#fff", borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}>
          {toast.msg}
        </div>
      )}

      {showCreate && (
        <>
          <div onClick={() => setShowCreate(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 1100 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 1200, background: "#fff", borderRadius: 16, width: "min(560px,95vw)", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111827" }}>Create Purchase Order</h2>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "#6b7280" }}>Fill in the purchase order details below</p>
              </div>
              <button type="button" onClick={() => setShowCreate(false)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, width: 34, height: 34, cursor: "pointer", color: "#4b5563", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
            <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
              {[
                { label: "PO Date", key: "poDate", type: "date" },
                { label: "ETA Date", key: "eta", type: "date" },
                { label: "Vendor / Supplier", key: "vendor", type: "text", placeholder: "e.g. Steel Corp PH" },
                { label: "SKU Code", key: "sku", type: "text", placeholder: "e.g. DRB052" },
                { label: "Product Description", key: "productDesc", type: "text", placeholder: "e.g. Deformed Round Bar..." },
                { label: "Quantity", key: "qty", type: "number", placeholder: "0" },
                { label: "Unit Cost (₱)", key: "unitCost", type: "number", placeholder: "0.00" },
                { label: "Notes (optional)", key: "notes", type: "text", placeholder: "Any additional notes..." },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: key === "productDesc" || key === "notes" ? "1 / -1" : undefined }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</label>
                  <input
                    type={type}
                    value={createForm[key]}
                    onChange={e => setCreateForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{ padding: "9px 12px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 8, fontFamily: "inherit", outline: "none" }}
                    onFocus={e => { e.target.style.borderColor = "#e87c27"; e.target.style.boxShadow = "0 0 0 3px rgba(232,124,39,0.18)"; }}
                    onBlur={e => { e.target.style.borderColor = "#d1d5db"; e.target.style.boxShadow = "none"; }}
                  />
                </div>
              ))}
            </div>
            <div style={{ padding: "14px 24px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 10, justifyContent: "flex-end", background: "#fafafa" }}>
              <button type="button" onClick={() => setShowCreate(false)} style={{ padding: "10px 20px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151" }}>Cancel</button>
              <button type="button" onClick={() => {
                if (!createForm.poDate || !createForm.vendor || !createForm.productDesc) {
                  showToast("Please fill in all required fields.", "error");
                  return;
                }
                const qty = Number(createForm.qty) || 0;
                const cost = Number(createForm.unitCost) || 0;
                const newPO = {
                  id: orders.length + 1,
                  transNo: String(orders.length + 1).padStart(3, "0"),
                  poDate: createForm.poDate,
                  eta: createForm.eta || "",
                  vendor: createForm.vendor,
                  sku: createForm.sku,
                  productDesc: createForm.productDesc,
                  qty,
                  unitCost: cost,
                  totalAmount: qty * cost,
                  status: "Pending",
                  notes: createForm.notes,
                };
                setOrders(prev => [newPO, ...prev]);
                setShowCreate(false);
                setCreateForm({ poDate: "", eta: "", vendor: "", productDesc: "", sku: "", qty: "", unitCost: "", notes: "" });
                showToast("Purchase order created successfully.", "success");
              }} style={{ padding: "10px 20px", background: "#e87c27", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                Create PO
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}