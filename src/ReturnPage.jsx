import { useState, useMemo, useEffect, useRef } from "react";
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

const PAGE_SIZE = 5;

const STATUS_OPTS = ["All Status", "Approved", "Pending", "Received"];
const DISP_OPTS = ["All Dispositions", "Restock", "Scrap", "Credit memo"];
const REASON_OPTS = ["All Reasons", "Damaged During Delivery", "Wrong item", "Customer cancel", "Quality hold"];
const WAREHOUSE_OPTS = ["All Warehouses", "Manila Warehouse", "Cebu Warehouse", "Davao Warehouse"];

function fmtPHP(n) {
  return "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const SEED_RETURNS = [
  { id: 1, transNo: "011", returnDate: "2026-05-06", drNo: "DR26030", sku: "HB100XAWD14DSAD", item: "H-BEAM", qtyReturned: 110, unitCost: 520, totalCost: 57200, customer: "Michael Santiago", reason: "Damaged During Delivery", totalQtyOut: 20, qtyBalance: 90, amountBalance: 46800, disposition: "Restock", status: "Received", returnNo: "RTN25031", warehouse: "Manila Warehouse", lineItems: [
    { code: "HB100XAWD14DSAD", desc: "H-BEAM", qty: 40, unit: 520, val: 20800 },
    { code: "HB100XAWD14DSAD", desc: "H-BEAM", qty: 35, unit: 520, val: 18200 },
    { code: "HB100XAWD14DSAD", desc: "H-BEAM", qty: 35, unit: 520, val: 18200 },
  ]},
  { id: 2, transNo: "012", returnDate: "2026-05-07", drNo: "DR25888", sku: "DRB052", item: "Deformed Round Bar, 16mm x 6M g40", qtyReturned: 24, unitCost: 346.73, totalCost: 8321.52, customer: "RCM Builders", reason: "Wrong item", totalQtyOut: 0, qtyBalance: 24, amountBalance: 8321.52, disposition: "Credit memo", status: "Approved", returnNo: "RTN25032", warehouse: "Manila Warehouse", lineItems: [
    { code: "DRB052", desc: "Deformed Round Bar, 16mm x 6M g40", qty: 24, unit: 346.73, val: 8321.52 },
  ]},
  { id: 3, transNo: "013", returnDate: "2026-05-08", drNo: "DR25900", sku: "SHPT2", item: "Sheet Pile T2, 400mm x 100mm", qtyReturned: 3, unitCost: 22529.66, totalCost: 67588.98, customer: "Prime Builders Corp.", reason: "Quality hold", totalQtyOut: 1, qtyBalance: 2, amountBalance: 45059.32, disposition: "Scrap", status: "Pending", returnNo: "RTN25033", warehouse: "Cebu Warehouse", lineItems: [
    { code: "SHPT2", desc: "Sheet Pile T2, 400mm x 100mm", qty: 3, unit: 22529.66, val: 67588.98 },
  ]},
  { id: 4, transNo: "014", returnDate: "2026-05-09", drNo: "DR25912", sku: "MSP010", item: "MS Plate, 6mm x 4' x 8'", qtyReturned: 8, unitCost: 554.79, totalCost: 4438.32, customer: "EGB Construction", reason: "Damaged During Delivery", totalQtyOut: 0, qtyBalance: 8, amountBalance: 4438.32, disposition: "Restock", status: "Received", returnNo: "RTN25034", warehouse: "Manila Warehouse", lineItems: [
    { code: "MSP010", desc: "MS Plate, 6mm x 4' x 8'", qty: 8, unit: 554.79, val: 4438.32 },
  ]},
  { id: 5, transNo: "015", returnDate: "2026-05-10", drNo: "DR25920", sku: "WF10833", item: "Wide Flange, 10 x 8 x 33# x 6M", qtyReturned: 2, unitCost: 12300, totalCost: 24600, customer: "Sunway Construction Inc.", reason: "Customer cancel", totalQtyOut: 0, qtyBalance: 2, amountBalance: 24600, disposition: "Credit memo", status: "Approved", returnNo: "RTN26031", warehouse: "Manila Warehouse", lineItems: [
    { code: "WF10833", desc: "Wide Flange, 10 x 8 x 33# x 6M", qty: 2, unit: 12300, val: 24600 },
  ]},
  { id: 6, transNo: "016", returnDate: "2026-05-11", drNo: "DR25931", sku: "DRB007", item: "Deformed Round Bar, 10mm x 6M g33", qtyReturned: 50, unitCost: 138.6, totalCost: 6930, customer: "Talde Construction Inc.", reason: "Damaged During Delivery", totalQtyOut: 10, qtyBalance: 40, amountBalance: 5544, disposition: "Restock", status: "Pending", returnNo: "RTN26032", warehouse: "Cebu Warehouse", lineItems: [
    { code: "DRB007", desc: "Deformed Round Bar, 10mm x 6M g33", qty: 50, unit: 138.6, val: 6930 },
  ]},
  { id: 7, transNo: "017", returnDate: "2026-05-12", drNo: "DR25940", sku: "GP3302", item: 'GI pipe 1"', qtyReturned: 12, unitCost: 1380, totalCost: 16560, customer: "Brencon Developers Phils.", reason: "Wrong item", totalQtyOut: 0, qtyBalance: 12, amountBalance: 16560, disposition: "Scrap", status: "Received", returnNo: "RTN26033", warehouse: "Manila Warehouse", lineItems: [
    { code: "GP3302", desc: 'GI pipe 1"', qty: 12, unit: 1380, val: 16560 },
  ]},
  { id: 8, transNo: "018", returnDate: "2026-05-13", drNo: "DR25955", sku: "DRB020", item: "Deformed Round Bar, 20mm x 6M g60", qtyReturned: 15, unitCost: 539.31, totalCost: 8089.65, customer: "EC Structural Composite Inc.", reason: "Quality hold", totalQtyOut: 5, qtyBalance: 10, amountBalance: 5393.1, disposition: "Restock", status: "Approved", returnNo: "RTN26034", warehouse: "Manila Warehouse", lineItems: [
    { code: "DRB020", desc: "Deformed Round Bar, 20mm x 6M g60", qty: 15, unit: 539.31, val: 8089.65 },
  ]},
  { id: 9, transNo: "019", returnDate: "2026-05-14", drNo: "DR25960", sku: "RECT24", item: "GI Rectangular Tube, 2 x 4 x 2mm x 6M", qtyReturned: 6, unitCost: 1380, totalCost: 8280, customer: "Aremar Construction Corp.", reason: "Damaged During Delivery", totalQtyOut: 0, qtyBalance: 6, amountBalance: 8280, disposition: "Credit memo", status: "Pending", returnNo: "RTN26035", warehouse: "Davao Warehouse", lineItems: [
    { code: "RECT24", desc: "GI Rectangular Tube, 2 x 4 x 2mm x 6M", qty: 6, unit: 1380, val: 8280 },
  ]},
  { id: 10, transNo: "020", returnDate: "2026-05-15", drNo: "DR25970", sku: "51181", item: "Wide Flange, 10 x 8 x 33# x 6M", qtyReturned: 4, unitCost: 12300, totalCost: 49200, customer: "Aguila Simbulan Partners", reason: "Customer cancel", totalQtyOut: 0, qtyBalance: 4, amountBalance: 49200, disposition: "Restock", status: "Received", returnNo: "RTN26036", warehouse: "Manila Warehouse", lineItems: [
    { code: "51181", desc: "Wide Flange, 10 x 8 x 33# x 6M", qty: 4, unit: 12300, val: 49200 },
  ]},
  { id: 11, transNo: "021", returnDate: "2026-05-16", drNo: "DR25980", sku: "DRB032", item: "Deformed Round Bar, 32mm x 6M g60", qtyReturned: 22, unitCost: 1479, totalCost: 32538, customer: "SUNWAY CONSTRUCTION INC.", reason: "Wrong item", totalQtyOut: 2, qtyBalance: 20, amountBalance: 29580, disposition: "Scrap", status: "Approved", returnNo: "RTN26037", warehouse: "Manila Warehouse", lineItems: [
    { code: "DRB032", desc: "Deformed Round Bar, 32mm x 6M g60", qty: 22, unit: 1479, val: 32538 },
  ]},
  { id: 12, transNo: "022", returnDate: "2026-05-17", drNo: "DR25990", sku: "SQ22", item: "GI Square Tube, 2 x 2 x 2mm x 6M", qtyReturned: 10, unitCost: 880, totalCost: 8800, customer: "PRIME BUILDERS CORP.", reason: "Damaged During Delivery", totalQtyOut: 0, qtyBalance: 10, amountBalance: 8800, disposition: "Restock", status: "Pending", returnNo: "RTN26038", warehouse: "Cebu Warehouse", lineItems: [
    { code: "SQ22", desc: "GI Square Tube, 2 x 2 x 2mm x 6M", qty: 10, unit: 880, val: 8800 },
  ]},
  { id: 13, transNo: "023", returnDate: "2026-05-18", drNo: "DR26001", sku: "SHPT3", item: "Sheet Pile T3, 400mm x 125mm", qtyReturned: 1, unitCost: 28271.06, totalCost: 28271.06, customer: "EC STRUCTURAL COMPOSITE INC.", reason: "Quality hold", totalQtyOut: 0, qtyBalance: 1, amountBalance: 28271.06, disposition: "Scrap", status: "Received", returnNo: "RTN26039", warehouse: "Manila Warehouse", lineItems: [
    { code: "SHPT3", desc: "Sheet Pile T3, 400mm x 125mm", qty: 1, unit: 28271.06, val: 28271.06 },
  ]},
  { id: 14, transNo: "024", returnDate: "2026-05-19", drNo: "DR26010", sku: "DRB052", item: "Deformed Round Bar, 16mm x 6M g40", qtyReturned: 100, unitCost: 346.73, totalCost: 34673, customer: "BRENCON DEVELOPERS PHILS.", reason: "Customer cancel", totalQtyOut: 40, qtyBalance: 60, amountBalance: 20803.8, disposition: "Credit memo", status: "Approved", returnNo: "RTN26040", warehouse: "Manila Warehouse", lineItems: [
    { code: "DRB052", desc: "Deformed Round Bar, 16mm x 6M g40", qty: 100, unit: 346.73, val: 34673 },
  ]},
  { id: 15, transNo: "025", returnDate: "2026-05-20", drNo: "DR26015", sku: "MSP018", item: "MS Plate, 12mm x 4' x 8'", qtyReturned: 4, unitCost: 1200, totalCost: 4800, customer: "RCM BUILDERS", reason: "Damaged During Delivery", totalQtyOut: 0, qtyBalance: 4, amountBalance: 4800, disposition: "Restock", status: "Pending", returnNo: "RTN26041", warehouse: "Manila Warehouse", lineItems: [
    { code: "MSP018", desc: "MS Plate, 12mm x 4' x 8'", qty: 4, unit: 1200, val: 4800 },
  ]},
  { id: 16, transNo: "026", returnDate: "2026-05-21", drNo: "DR26022", sku: "JINXI", item: "Sheet Pile Z - Pile 770mm", qtyReturned: 2, unitCost: 41838.53, totalCost: 83677.06, customer: "TALDE CONSTRUCTION INC.", reason: "Wrong item", totalQtyOut: 0, qtyBalance: 2, amountBalance: 83677.06, disposition: "Credit memo", status: "Received", returnNo: "RTN26042", warehouse: "Manila Warehouse", lineItems: [
    { code: "JINXI", desc: "Sheet Pile Z - Pile 770mm", qty: 2, unit: 41838.53, val: 83677.06 },
  ]},
  { id: 17, transNo: "027", returnDate: "2026-05-22", drNo: "DR26028", sku: "DRB050", item: "Deformed Round Bar, 10mm x 6M g40", qtyReturned: 30, unitCost: 136.6, totalCost: 4098, customer: "AREMAR CONSTRUCTION CORP.", reason: "Quality hold", totalQtyOut: 0, qtyBalance: 30, amountBalance: 4098, disposition: "Restock", status: "Approved", returnNo: "RTN26043", warehouse: "Davao Warehouse", lineItems: [
    { code: "DRB050", desc: "Deformed Round Bar, 10mm x 6M g40", qty: 30, unit: 136.6, val: 4098 },
  ]},
  { id: 18, transNo: "028", returnDate: "2026-05-23", drNo: "DR26035", sku: "WF016", item: "Wide Flange, 8 x 4 x 10# x 6M", qtyReturned: 6, unitCost: 9800, totalCost: 58800, customer: "SUNWAY CONSTRUCTION INC.", reason: "Damaged During Delivery", totalQtyOut: 1, qtyBalance: 5, amountBalance: 49000, disposition: "Scrap", status: "Pending", returnNo: "RTN26044", warehouse: "Manila Warehouse", lineItems: [
    { code: "WF016", desc: "Wide Flange, 8 x 4 x 10# x 6M", qty: 6, unit: 9800, val: 58800 },
  ]},
];

const BADGE = {
  Received: "#22c55e",
  Approved: "#22c55e",
  Pending: "#f59e0b",
};

function IconChevronLeft({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M15 19l-7-7 7-7" /></svg>;
}
function IconChevronRight({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>;
}
function IconX({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}

function lineQtySum(lines) {
  return lines.reduce((s, L) => s + L.qty, 0);
}
function lineValSum(lines) {
  return lines.reduce((s, L) => s + L.val, 0);
}


function useSheetJS() {
  return true;
}

const RT_OUT_TRACK_PAIRS = 6;
const RT_MAIN_COLS = 12;
const RT_TOTAL_COLS = RT_MAIN_COLS + RT_OUT_TRACK_PAIRS * 2;
const RT_HDR_ROW = 3;
const RT_DATA_START = 4;
const RT_MIN_DATA_ROWS = 20;
const RT_PESO_FMT = '_-"P"* #,##0.00_-;_-"P"* "-"??_-;_-"P"* "-"??_-;_-@_-';

function formatReturnExportDateTime(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatReturnExportDate(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatReturnShortDate(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${String(d.getDate()).padStart(2, "0")}-${months[d.getMonth()]}`;
}

function returnTransDisplay(row, index, base = 11) {
  if (row?.transNo) {
    const n = parseInt(String(row.transNo).replace(/\D/g, ""), 10);
    if (!Number.isNaN(n)) return n;
  }
  return row?.id ?? base + index;
}

function returnRemarks(row) {
  if (!row) return "";
  const parts = [row.reason, row.disposition, row.returnNo ? `RTN: ${row.returnNo}` : ""].filter(Boolean);
  return parts.join(" — ");
}

function downloadReturnWorkbook(wb, filename) {
  try {
    XLSX.writeFile(wb, filename);
  } catch {
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
}

function exportReturns(rows) {
  const wb = XLSX.utils.book_new();
  const C = (r, c) => XLSX.utils.encode_cell({ r, c });

  const sheetFill = { patternType: "solid", fgColor: { rgb: "FFF9E6" } };
  const greenFill = { patternType: "solid", fgColor: { rgb: "E2EFDA" } };
  const peachFill = { patternType: "solid", fgColor: { rgb: "FCE4D6" } };
  const hdrFill = { patternType: "solid", fgColor: { rgb: "D6DCE4" } };

  const cellBorder = {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
  };

  const f = {
    brand: () => ({ name: "Arial", sz: 18, bold: true, color: { rgb: "E87C27" } }),
    brandDark: () => ({ name: "Arial", sz: 18, bold: true, color: { rgb: "000000" } }),
    tagline: () => ({ name: "Arial", sz: 9, bold: true, color: { rgb: "000000" } }),
    title: () => ({ name: "Arial", sz: 13, bold: true, color: { rgb: "000000" } }),
    meta: () => ({ name: "Arial", sz: 10, color: { rgb: "000000" } }),
    hdr: () => ({ name: "Arial", sz: 9, bold: true, color: { rgb: "000000" } }),
    body: (bold = false) => ({ name: "Arial", sz: 10, bold, color: { rgb: "000000" } }),
    item: () => ({ name: "Arial", sz: 10, color: { rgb: "0563C1" }, underline: true }),
  };

  const padLeft = { horizontal: "left", vertical: "center", wrapText: true, indent: 1 };
  const padCenter = { horizontal: "center", vertical: "center", wrapText: true };
  const padMoney = { horizontal: "right", vertical: "center", wrapText: false };
  const qtyFmt = "#,##0";

  const ws = {};
  const put = (r, c, v, t, style) => {
    ws[C(r, c)] = { v: v ?? "", t: t || (typeof v === "number" ? "n" : "s"), s: style };
  };

  const cell = (fill, alignment, extra = {}) => ({
    font: f.body(),
    fill,
    alignment,
    border: cellBorder,
    ...extra,
  });

  const putMoney = (r, c, amount) => {
    const n = Number(amount);
    if (!n) {
      put(r, c, "P  -", "s", cell(sheetFill, padLeft));
      return;
    }
    put(r, c, n, "n", cell(sheetFill, padMoney, { numFmt: RT_PESO_FMT }));
  };

  const now = formatReturnExportDateTime();

  put(0, 0, "TDT", "s", { font: f.brand(), alignment: padLeft, fill: sheetFill });
  put(0, 1, "POWERSTEEL", "s", { font: f.brandDark(), alignment: { ...padLeft, indent: 0 }, fill: sheetFill });
  put(0, 2, "THE NO. 1 STEEL SUPPLIER", "s", { font: f.tagline(), alignment: padLeft, fill: sheetFill });
  put(1, 0, "RETURN INVENTORY SUMMARY", "s", { font: f.title(), alignment: padLeft, fill: sheetFill });
  put(2, 0, `AS OF THIS DATE OF: ${now}`, "s", { font: f.meta(), alignment: padLeft, fill: sheetFill });

  const mainHdrs = [
    "TRANS", "INSERT DATE", "INSERT DR #", "SKU", "ITEM", "INSERT QTY",
    "INSERT UNIT COST", "TOTAL COST", "CUSTOMER'S NAME",
    "TOTAL QTY OUT", "QTY BALANCE", "REMARKS",
  ];
  const outHdrs = [];
  for (let i = 0; i < RT_OUT_TRACK_PAIRS; i++) outHdrs.push("QTY - OUT", "DATE");

  [...mainHdrs, ...outHdrs].forEach((h, ci) => {
    const isOutQty = ci >= RT_MAIN_COLS && (ci - RT_MAIN_COLS) % 2 === 0;
    const isOutDate = ci >= RT_MAIN_COLS && (ci - RT_MAIN_COLS) % 2 === 1;
    put(RT_HDR_ROW, ci, h, "s", {
      font: f.hdr(),
      fill: isOutQty ? greenFill : isOutDate ? peachFill : hdrFill,
      alignment: padCenter,
      border: cellBorder,
    });
  });

  const slotCount = Math.max(rows.length, RT_MIN_DATA_ROWS);
  for (let i = 0; i < slotCount; i++) {
    const ri = RT_DATA_START + i;
    const row = rows[i];

    if (!row) {
      put(ri, 0, returnTransDisplay(null, i), "n", cell(sheetFill, padCenter, { font: f.body(true), numFmt: qtyFmt }));
      for (let c = 1; c < RT_MAIN_COLS; c++) {
        const isPeso = c === 6 || c === 7;
        const isQty = c === 5 || c === 9 || c === 10;
        put(ri, c, isPeso ? "P  -" : isQty ? 0 : "", isPeso ? "s" : "n", cell(sheetFill, isQty ? padCenter : isPeso ? padLeft : padLeft, isQty ? { numFmt: qtyFmt } : {}));
      }
      for (let p = 0; p < RT_OUT_TRACK_PAIRS; p++) {
        const qtyCol = RT_MAIN_COLS + p * 2;
        const dateCol = qtyCol + 1;
        put(ri, qtyCol, "", "s", cell(greenFill, padCenter));
        put(ri, dateCol, "", "s", cell(peachFill, padCenter));
      }
      continue;
    }

    const qtyBal = row.qtyBalance ?? (row.qtyReturned || 0) - (row.totalQtyOut || 0);
    const totalCost = row.totalCost ?? (row.qtyReturned || 0) * (row.unitCost || 0);

    put(ri, 0, returnTransDisplay(row, i), "n", cell(sheetFill, padCenter, { font: f.body(true), numFmt: qtyFmt }));
    put(ri, 1, formatReturnExportDate(row.returnDate), "s", cell(sheetFill, padCenter));
    put(ri, 2, row.drNo || "", "s", cell(sheetFill, padCenter));
    put(ri, 3, row.sku || "", "s", cell(sheetFill, padCenter));
    put(ri, 4, row.item || "", "s", cell(sheetFill, padLeft, { font: f.item() }));
    put(ri, 5, row.qtyReturned ?? 0, "n", cell(sheetFill, padCenter, { font: f.body(true), numFmt: qtyFmt }));
    putMoney(ri, 6, row.unitCost);
    putMoney(ri, 7, totalCost);
    put(ri, 8, row.customer || "", "s", cell(sheetFill, padLeft));
    put(ri, 9, row.totalQtyOut ?? 0, "n", cell(sheetFill, padCenter, { numFmt: qtyFmt }));
    put(ri, 10, qtyBal, "n", cell(sheetFill, padCenter, { font: f.body(true), numFmt: qtyFmt }));
    put(ri, 11, returnRemarks(row), "s", cell(sheetFill, padLeft));

    for (let p = 0; p < RT_OUT_TRACK_PAIRS; p++) {
      const qtyCol = RT_MAIN_COLS + p * 2;
      const dateCol = qtyCol + 1;
      const showFirst = p === 0 && (row.totalQtyOut || 0) > 0;
      put(
        ri, qtyCol,
        showFirst ? row.totalQtyOut : "",
        showFirst ? "n" : "s",
        cell(greenFill, padCenter, showFirst ? { numFmt: qtyFmt } : {})
      );
      put(
        ri, dateCol,
        showFirst ? formatReturnShortDate(row.returnDate) : "",
        "s",
        cell(peachFill, padCenter)
      );
    }
  }

  const lastRow = RT_DATA_START + slotCount - 1;
  const lastCol = RT_TOTAL_COLS - 1;
  ws["!ref"] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: lastRow, c: lastCol });

  for (let r = 0; r <= lastRow; r++) {
    for (let c = 0; c <= lastCol; c++) {
      if (!ws[C(r, c)]) {
        put(r, c, "", "s", { fill: sheetFill, border: cellBorder, alignment: padCenter });
      }
    }
  }

  ws["!merges"] = [
    { s: { r: 0, c: 2 }, e: { r: 0, c: 8 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } },
  ];

  const outCols = [];
  for (let i = 0; i < RT_OUT_TRACK_PAIRS; i++) outCols.push({ wch: 10 }, { wch: 11 });
  ws["!cols"] = [
    { wch: 6 }, { wch: 13 }, { wch: 12 }, { wch: 10 }, { wch: 48 }, { wch: 11 },
    { wch: 17 }, { wch: 17 }, { wch: 34 }, { wch: 12 }, { wch: 12 }, { wch: 32 },
    ...outCols,
  ];

  ws["!rows"] = [
    { hpt: 26 }, { hpt: 24 }, { hpt: 20 }, { hpt: 46 },
    ...Array(slotCount).fill({ hpt: 34 }),
  ];

  XLSX.utils.book_append_sheet(wb, ws, "RETURN INVENTORY");
  downloadReturnWorkbook(wb, "TDT_Return_Inventory_Summary.xlsx");
}

async function importReturns(file, onDone, onError) {
  try {
    const { raw } = await readWorkbookSheet(file, ["RETURN"]);
    const headerIdx = findHeaderRowIndex(raw, ["TRANS"], 20);
    const dataStart = headerIdx >= 0 ? headerIdx + 1 : 6;
    const headers = headerIdx >= 0 ? raw[headerIdx] : null;
    const parsed = [];

    for (let i = dataStart; i < raw.length; i++) {
      const r = raw[i];
      if (!rowHasData(r)) continue;

      let transNo = cellStr(pickCol(r, headers, ["TRANS #", "TRANS"], 0));
      let returnDate = formatExcelDate(pickCol(r, headers, ["RETURN DATE", "DATE"], 1));
      const col0 = cellStr(r[0]);
      const col1 = r[1];
      if (!transNo && col0 && formatExcelDate(col1).match(/^\d{4}-\d{2}-\d{2}/)) {
        transNo = col0;
        returnDate = formatExcelDate(col1);
      }

      const item = cellStr(pickCol(r, headers, ["ITEM"], 4));
      const customer = cellStr(pickCol(r, headers, ["CUSTOMER"], 8));
      const sku = cellStr(pickCol(r, headers, ["SKU"], 3));
      if (!transNo && !item && !customer && !sku) continue;

      const qtyReturned = cellNum(pickCol(r, headers, ["QTY RETURNED", "QTY"], 5));
      const unitCost = cellNum(pickCol(r, headers, ["UNIT COST"], 6));
      const totalCost = cellNum(pickCol(r, headers, ["TOTAL COST"], 7)) || qtyReturned * unitCost;

      parsed.push({
        id: parsed.length + 1,
        transNo: transNo || String(parsed.length + 1).padStart(3, "0"),
        returnDate,
        drNo: cellStr(pickCol(r, headers, ["DR"], 2)),
        sku,
        item,
        qtyReturned,
        unitCost,
        totalCost,
        customer,
        reason: cellStr(pickCol(r, headers, ["REASON"], 9)),
        totalQtyOut: cellNum(pickCol(r, headers, ["TOTAL QTY OUT", "QTY OUT"], 10)),
        qtyBalance: cellNum(pickCol(r, headers, ["QTY BALANCE"], 11)),
        amountBalance: cellNum(pickCol(r, headers, ["AMOUNT BALANCE"], 12)),
        disposition: cellStr(pickCol(r, headers, ["DISPOSITION"], 13)) || "Restock",
        status: cellStr(pickCol(r, headers, ["STATUS"], 14)) || "Pending",
        returnNo: cellStr(pickCol(r, headers, ["RETURN NO"], 15)),
        warehouse: cellStr(pickCol(r, headers, ["WAREHOUSE"], 16)),
        lineItems: [],
      });
    }

    if (!parsed.length) throw new Error("No data rows found. Fill TRANS #, ITEM, or CUSTOMER columns.");
    onDone(parsed);
  } catch (err) {
    onError(err.message || "Import failed.");
  }
}

export default function ReturnPage() {
  const xlsxReady = useSheetJS();
  const [returns, setReturns] = useState(SEED_RETURNS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [dispFilter, setDispFilter] = useState("All Dispositions");
  const [reasonFilter, setReasonFilter] = useState("All Reasons");
  const [warehouseFilter, setWarehouseFilter] = useState("All Warehouses");
  const [currentPage, setCurrentPage] = useState(1);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ returnDate: "", drNo: "", sku: "", item: "", qtyReturned: "", unitCost: "", customer: "", reason: "Damaged During Delivery", disposition: "Restock", warehouse: "Manila Warehouse" });
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const fileInputRef = useRef(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const handleImport = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setImporting(true);
    importReturns(file, (parsed) => {
      setImporting(false);
      setReturns(parsed);
      setCurrentPage(1);
      setSelectedId(null);
      setPanelOpen(false);
      showToast(`Imported ${parsed.length} return entries successfully.`);
      e.target.value = "";
    }, (err) => {
      setImporting(false);
      showToast(`Import failed: ${err}`, "error");
      e.target.value = "";
    });
  };

  const filtered = useMemo(() => {
    let rows = returns;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.sku.toLowerCase().includes(q) ||
          r.item.toLowerCase().includes(q) ||
          r.customer.toLowerCase().includes(q) ||
          r.drNo.toLowerCase().includes(q) ||
          r.returnNo.toLowerCase().includes(q) ||
          String(r.transNo).includes(q)
      );
    }
    if (statusFilter !== "All Status") rows = rows.filter((r) => r.status === statusFilter);
    if (dispFilter !== "All Dispositions") rows = rows.filter((r) => r.disposition === dispFilter);
    if (reasonFilter !== "All Reasons") rows = rows.filter((r) => r.reason === reasonFilter);
    if (warehouseFilter !== "All Warehouses") rows = rows.filter((r) => r.warehouse === warehouseFilter);
    if (dateRange.start) rows = rows.filter((r) => r.returnDate >= dateRange.start);
    if (dateRange.end)   rows = rows.filter((r) => r.returnDate <= dateRange.end);
    return rows;
  }, [returns, searchQuery, statusFilter, dispFilter, reasonFilter, warehouseFilter, dateRange]);

  useEffect(() => {
    if (selectedId != null && !filtered.some((r) => r.id === selectedId)) {
      setSelectedId(null);
      setPanelOpen(false);
    }
  }, [filtered, selectedId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selected = selectedId != null ? returns.find((r) => r.id === selectedId) : null;

  const COLS = ["TRANS #", "RETURN DATE", "DR#", "SKU", "ITEM", "QTY RETURNED", "UNIT COST", "TOTAL COST", "CUSTOMER NAME", "REASON", "DISPOSITION", "STATUS"];

  return (
    <div style={{ background: "#f0f2f5", padding: "28px 32px 40px", display: "flex", flexDirection: "column", gap: 18 }}>

      <PageToolbar
        searchValue={searchQuery}
        onSearchChange={(v) => { setSearchQuery(v); setCurrentPage(1); }}
        filters={[
          { key: "status", value: statusFilter, onChange: (v) => { setStatusFilter(v); setCurrentPage(1); }, options: STATUS_OPTS, minWidth: 140 },
          { key: "disp", value: dispFilter, onChange: (v) => { setDispFilter(v); setCurrentPage(1); }, options: DISP_OPTS, minWidth: 155 },
          { key: "reason", value: reasonFilter, onChange: (v) => { setReasonFilter(v); setCurrentPage(1); }, options: REASON_OPTS, minWidth: 155 },
        ]}
        primaryAction={{ label: "Create New Return", onClick: () => setShowCreate(true) }}
        showDateRange={true}
        dateRange={dateRange}
        onDateRangeChange={(r) => { setDateRange(r); setCurrentPage(1); }}
        importExport={{
          fileInputRef,
          onFileChange: handleImport,
          importing,
          importDisabled: !xlsxReady,
          onExport: () => {
            try {
              exportReturns(filtered);
              showToast(`Exported ${filtered.length} return entries.`);
            } catch (err) {
              console.error("Return export failed:", err);
              showToast(err?.message || "Export failed.", "error");
            }
          },
        }}
      />

      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#1c2235" }}>
                {COLS.map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "14px 10px",
                      textAlign: "center",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 10,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr><td colSpan={12} style={{ textAlign: "center", padding: "48px 20px", color: "#9ca3af" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                  No results found for <strong style={{ color: "#374151" }}>"{searchQuery || "your filters"}"</strong>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Try a different search term or clear your filters.</div>
                </td></tr>
              )}
              {paged.map((row, idx) => {
                const isSel = selectedId === row.id;
                return (
                  <tr
                    key={row.id}
                    style={{
                      borderBottom: "1px solid #f3f4f6",
                      background: isSel ? "#fff4ed" : idx % 2 === 0 ? "#fff" : "#fafafa",
                      cursor: "pointer",
                      boxShadow: isSel ? "inset 3px 0 0 #e87c27" : "none",
                    }}
                    onClick={() => { setSelectedId(row.id); setPanelOpen(true); }}
                    onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = "#fef6f2"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = isSel ? "#fff4ed" : idx % 2 === 0 ? "#fff" : "#fafafa"; }}
                  >
                    <td style={{ padding: "12px 10px", color: "#6b7280", fontWeight: 600, textAlign: "center" }}>{row.transNo}</td>
                    <td style={{ padding: "12px 10px", color: "#374151", whiteSpace: "nowrap", textAlign: "center" }}>{formatReturnExportDate(row.returnDate)}</td>
                    <td style={{ padding: "12px 10px", color: "#e87c27", fontWeight: 700, textAlign: "center" }}><Highlight text={row.drNo} query={searchQuery} /></td>
                    <td style={{ padding: "12px 10px", color: "#374151", fontWeight: 600, textAlign: "center" }}><Highlight text={row.sku} query={searchQuery} /></td>
                    <td style={{ padding: "12px 10px", color: "#111827", maxWidth: 200, textAlign: "center" }}><Highlight text={row.item} query={searchQuery} /></td>
                    <td style={{ padding: "12px 10px", textAlign: "center", fontWeight: 700 }}>{row.qtyReturned}</td>
                    <td style={{ padding: "12px 10px", textAlign: "center" }}>{fmtPHP(row.unitCost)}</td>
                    <td style={{ padding: "12px 10px", textAlign: "center", fontWeight: 600 }}>{fmtPHP(row.totalCost)}</td>
                    <td style={{ padding: "12px 10px", color: "#374151", maxWidth: 140, textAlign: "center" }}><Highlight text={row.customer} query={searchQuery} /></td>
                    <td style={{ padding: "12px 10px", color: "#6b7280", fontSize: 11, textAlign: "center" }}>{row.reason}</td>
                    <td style={{ padding: "12px 10px", color: "#6b7280", textAlign: "center" }}>{row.disposition}</td>
                    <td style={{ padding: "12px 10px", textAlign: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 12, background: row.status === "Pending" ? "#fef3c7" : "#dcfce7", color: row.status === "Pending" ? "#d97706" : "#15803d" }}>{row.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderTop: "1px solid #f3f4f6", background: "#fafafa", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} Purchase Orders — May 2026
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
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#fff" }}>Return Details</h2>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: BADGE[selected.status] || "#6b7280", color: "#fff" }}>{selected.status}</span>
                </div>
                <p style={{ margin: "10px 0 0", fontSize: 13, color: "#9ca3af", fontWeight: 600 }}>Return No. {selected.returnNo}</p>
              </div>
              <button type="button" onClick={() => setPanelOpen(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}><IconX size={18} /></button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px 24px" }}>
              {[
                ["Trans #", selected.transNo],
                ["Return Date", formatDate(selected.returnDate)],
                ["DR No.", selected.drNo],
                ["Warehouse", selected.warehouse],
                ["Return Reason", selected.reason],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#111827", textAlign: "right" }}>{val}</span>
                </div>
              ))}
              <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.06em", margin: "20px 0 10px" }}>RETURNED ITEMS</p>
              <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#f3f4f6" }}>
                      {["Item Code", "Item Description", "Qty Returned", "Unit Cost", "Return Value"].map((h) => (
                        <th key={h} style={{ padding: "10px 8px", textAlign: h.includes("Qty") || h.includes("Cost") || h.includes("Value") ? "right" : "center", fontWeight: 700, color: "#111827" }}>{h}</th>
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
                  <span style={{ fontSize: 14, color: "#6b7280" }}>Total Returned Qty</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>{lineQtySum(selected.lineItems)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, color: "#6b7280" }}>Total Returned Value</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#e87c27" }}>{fmtPHP(lineValSum(selected.lineItems))}</span>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, background: toast.type==="error"?"#dc2626":"#16a34a", color: "#fff", borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}>
          {toast.msg}
        </div>
      )}

      {showCreate && (
        <>
          <div onClick={() => setShowCreate(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 1100 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 1200, background: "#fff", borderRadius: 16, width: "min(560px,95vw)", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111827" }}>Create New Return</h2>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "#6b7280" }}>Fill in the return details below</p>
              </div>
              <button type="button" onClick={() => setShowCreate(false)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, width: 34, height: 34, cursor: "pointer", color: "#4b5563", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
            <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
              {[
                { label: "Return Date", key: "returnDate", type: "date" },
                { label: "DR No.", key: "drNo", type: "text", placeholder: "e.g. DR26050" },
                { label: "SKU Code", key: "sku", type: "text", placeholder: "e.g. DRB052" },
                { label: "Item Description", key: "item", type: "text", placeholder: "e.g. Deformed Round Bar..." },
                { label: "Qty Returned", key: "qtyReturned", type: "number", placeholder: "0" },
                { label: "Unit Cost (₱)", key: "unitCost", type: "number", placeholder: "0.00" },
                { label: "Customer Name", key: "customer", type: "text", placeholder: "e.g. RCM Builders" },
                { label: "Warehouse", key: "warehouse", type: "select", options: ["Manila Warehouse", "Cebu Warehouse", "Davao Warehouse"] },
                { label: "Return Reason", key: "reason", type: "select", options: ["Damaged During Delivery", "Wrong item", "Customer cancel", "Quality hold"] },
                { label: "Disposition", key: "disposition", type: "select", options: ["Restock", "Scrap", "Credit memo"] },
              ].map(({ label, key, type, placeholder, options }) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</label>
                  {type === "select" ? (
                    <select
                      value={createForm[key]}
                      onChange={e => setCreateForm(f => ({ ...f, [key]: e.target.value }))}
                      style={{ padding: "9px 12px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 8, fontFamily: "inherit", background: "#fff", outline: "none", color: "#111827", appearance: "auto", WebkitAppearance: "auto", cursor: "pointer", width: "100%" }}
                      onFocus={e => { e.target.style.borderColor = "#e87c27"; e.target.style.boxShadow = "0 0 0 3px rgba(232,124,39,0.18)"; }}
                      onBlur={e => { e.target.style.borderColor = "#d1d5db"; e.target.style.boxShadow = "none"; }}
                    >
                      {options.map(o => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={type}
                      value={createForm[key]}
                      onChange={e => setCreateForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      style={{ padding: "9px 12px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 8, fontFamily: "inherit", outline: "none" }}
                      onFocus={e => { e.target.style.borderColor = "#e87c27"; e.target.style.boxShadow = "0 0 0 3px rgba(232,124,39,0.18)"; }}
                      onBlur={e => { e.target.style.borderColor = "#d1d5db"; e.target.style.boxShadow = "none"; }}
                    />
                  )}
                </div>
              ))}
            </div>
            <div style={{ padding: "14px 24px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 10, justifyContent: "flex-end", background: "#fafafa" }}>
              <button type="button" onClick={() => setShowCreate(false)} style={{ padding: "10px 20px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151" }}>Cancel</button>
              <button type="button" onClick={() => {
                if (!createForm.returnDate || !createForm.drNo || !createForm.sku || !createForm.item) {
                  setToast({ msg: "Please fill in all required fields.", type: "error" });
                  setTimeout(() => setToast(null), 3000);
                  return;
                }
                const qty = Number(createForm.qtyReturned) || 0;
                const cost = Number(createForm.unitCost) || 0;
                const newReturn = {
                  id: returns.length + 1,
                  transNo: String(10 + returns.length + 11).padStart(3, "0"),
                  returnDate: createForm.returnDate,
                  drNo: createForm.drNo,
                  sku: createForm.sku,
                  item: createForm.item,
                  qtyReturned: qty,
                  unitCost: cost,
                  totalCost: qty * cost,
                  customer: createForm.customer,
                  reason: createForm.reason,
                  totalQtyOut: 0,
                  qtyBalance: qty,
                  amountBalance: qty * cost,
                  disposition: createForm.disposition,
                  status: "Pending",
                  returnNo: `RTN${new Date().getFullYear()}${String(returns.length + 50).padStart(3, "0")}`,
                  warehouse: createForm.warehouse,
                  lineItems: [{ code: createForm.sku, desc: createForm.item, qty, unit: cost, val: qty * cost }],
                };
                setReturns(prev => [newReturn, ...prev]);
                setShowCreate(false);
                setCreateForm({ returnDate: "", drNo: "", sku: "", item: "", qtyReturned: "", unitCost: "", customer: "", reason: "Damaged During Delivery", disposition: "Restock", warehouse: "Manila Warehouse" });
                setToast({ msg: "Return created successfully.", type: "success" });
                setTimeout(() => setToast(null), 3000);
              }} style={{ padding: "10px 20px", background: "#e87c27", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                Create Return
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}