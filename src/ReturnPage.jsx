import { useState, useMemo, useEffect, useRef, Fragment } from "react";
import XLSX from "xlsx-js-style";
import PageToolbar from "./PageToolbar";
import useSort from "./useSort";
import useApi from "./hooks/useApi";
import { ENDPOINTS } from "./api/apiConfig";
import {
  modalOverlayStyle,
  modalPanelStyle,
  modalHeaderStyle,
  modalFooterStyle,
  modalTitleStyle,
  modalSubtitleStyle,
  modalCloseBtnStyle,
  modalLabelStyle,
  modalBtnSecondary,
  modalBtnPrimary,
  modalInput,
  modalCellInput,
} from "./modalFormStyles";
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

const RTN_QTY_OUT_SEED = [
  { id: 1, returnId: 1, qty: 20, date: "2026-05-10" },
  { id: 2, returnId: 3, qty: 1,  date: "2026-05-12" },
  { id: 3, returnId: 6, qty: 10, date: "2026-05-15" },
  { id: 4, returnId: 8, qty: 5,  date: "2026-05-18" },
  { id: 5, returnId: 11, qty: 2, date: "2026-05-20" },
];

const REASON_OPTS = ["All Reasons", "Damaged During Delivery", "Wrong item", "Customer cancel", "Quality hold"];

function fmtPHP(n) {
  return "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const SEED_RETURNS = [
  { id: 1, transNo: "011", returnDate: "2026-05-06", drNo: "DR26030", sku: "DRB052", item: "Deformed Round Bar, 16mm x 6M g4", qtyReturned: 110, unitCost: 520, totalCost: 57200, customer: "Michael Santiago", reason: "Damaged During Delivery", totalQtyOut: 20, qtyBalance: 90, amountBalance: 46800, disposition: "Restock", status: "Received", returnNo: "RTN25031", warehouse: "Meycauayan", lineItems: [
    { code: "DRB052", desc: "Deformed Round Bar, 16mm x 6M g4", qty: 40, unit: 520, val: 20800 },
    { code: "DRB052", desc: "Deformed Round Bar, 16mm x 6M g4", qty: 35, unit: 520, val: 18200 },
    { code: "DRB052", desc: "Deformed Round Bar, 16mm x 6M g4", qty: 35, unit: 520, val: 18200 },
  ]},
  { id: 2, transNo: "012", returnDate: "2026-05-07", drNo: "DR25888", sku: "DRB052", item: "Deformed Round Bar, 16mm x 6M g40", qtyReturned: 24, unitCost: 346.73, totalCost: 8321.52, customer: "RCM Builders", reason: "Wrong item", totalQtyOut: 0, qtyBalance: 24, amountBalance: 8321.52, disposition: "Credit memo", status: "Approved", returnNo: "RTN25032", warehouse: "Meycauayan", lineItems: [
    { code: "DRB052", desc: "Deformed Round Bar, 16mm x 6M g40", qty: 24, unit: 346.73, val: 8321.52 },
  ]},
  { id: 3, transNo: "013", returnDate: "2026-05-08", drNo: "DR25900", sku: "SHPT2", item: "Sheet Pile T2, 400mm x 100mm", qtyReturned: 3, unitCost: 22529.66, totalCost: 67588.98, customer: "Prime Builders Corp.", reason: "Quality hold", totalQtyOut: 1, qtyBalance: 2, amountBalance: 45059.32, disposition: "Scrap", status: "Pending", returnNo: "RTN25033", warehouse: "Pampanga", lineItems: [
    { code: "SHPT2", desc: "Sheet Pile T2, 400mm x 100mm", qty: 3, unit: 22529.66, val: 67588.98 },
  ]},
  { id: 4, transNo: "014", returnDate: "2026-05-09", drNo: "DR25912", sku: "MSP010", item: "MS Plate, 6mm x 4' x 8'", qtyReturned: 8, unitCost: 554.79, totalCost: 4438.32, customer: "EGB Construction", reason: "Damaged During Delivery", totalQtyOut: 0, qtyBalance: 8, amountBalance: 4438.32, disposition: "Restock", status: "Received", returnNo: "RTN25034", warehouse: "Meycauayan", lineItems: [
    { code: "MSP010", desc: "MS Plate, 6mm x 4' x 8'", qty: 8, unit: 554.79, val: 4438.32 },
  ]},
  { id: 5, transNo: "015", returnDate: "2026-05-10", drNo: "DR25920", sku: "WF10833", item: "Wide Flange, 10 x 8 x 33# x 6M", qtyReturned: 2, unitCost: 12300, totalCost: 24600, customer: "Sunway Construction Inc.", reason: "Customer cancel", totalQtyOut: 0, qtyBalance: 2, amountBalance: 24600, disposition: "Credit memo", status: "Approved", returnNo: "RTN26031", warehouse: "Meycauayan", lineItems: [
    { code: "WF10833", desc: "Wide Flange, 10 x 8 x 33# x 6M", qty: 2, unit: 12300, val: 24600 },
  ]},
  { id: 6, transNo: "016", returnDate: "2026-05-11", drNo: "DR25931", sku: "DRB007", item: "Deformed Round Bar, 10mm x 6M g33", qtyReturned: 50, unitCost: 138.6, totalCost: 6930, customer: "Talde Construction Inc.", reason: "Damaged During Delivery", totalQtyOut: 10, qtyBalance: 40, amountBalance: 5544, disposition: "Restock", status: "Pending", returnNo: "RTN26032", warehouse: "Pampanga", lineItems: [
    { code: "DRB007", desc: "Deformed Round Bar, 10mm x 6M g33", qty: 50, unit: 138.6, val: 6930 },
  ]},
  { id: 7, transNo: "017", returnDate: "2026-05-12", drNo: "DR25940", sku: "GP3302", item: 'GI pipe 1"', qtyReturned: 12, unitCost: 1380, totalCost: 16560, customer: "Brencon Developers Phils.", reason: "Wrong item", totalQtyOut: 0, qtyBalance: 12, amountBalance: 16560, disposition: "Scrap", status: "Received", returnNo: "RTN26033", warehouse: "Meycauayan", lineItems: [
    { code: "GP3302", desc: 'GI pipe 1"', qty: 12, unit: 1380, val: 16560 },
  ]},
  { id: 8, transNo: "018", returnDate: "2026-05-13", drNo: "DR25955", sku: "DRB020", item: "Deformed Round Bar, 20mm x 6M g60", qtyReturned: 15, unitCost: 539.31, totalCost: 8089.65, customer: "EC Structural Composite Inc.", reason: "Quality hold", totalQtyOut: 5, qtyBalance: 10, amountBalance: 5393.1, disposition: "Restock", status: "Approved", returnNo: "RTN26034", warehouse: "Meycauayan", lineItems: [
    { code: "DRB020", desc: "Deformed Round Bar, 20mm x 6M g60", qty: 15, unit: 539.31, val: 8089.65 },
  ]},
  { id: 9, transNo: "019", returnDate: "2026-05-14", drNo: "DR25960", sku: "RECT24", item: "GI Rectangular Tube, 2 x 4 x 2mm x 6M", qtyReturned: 6, unitCost: 1380, totalCost: 8280, customer: "Aremar Construction Corp.", reason: "Damaged During Delivery", totalQtyOut: 0, qtyBalance: 6, amountBalance: 8280, disposition: "Credit memo", status: "Pending", returnNo: "RTN26035", warehouse: "Marilao", lineItems: [
    { code: "RECT24", desc: "GI Rectangular Tube, 2 x 4 x 2mm x 6M", qty: 6, unit: 1380, val: 8280 },
  ]},
  { id: 10, transNo: "020", returnDate: "2026-05-15", drNo: "DR25970", sku: "51181", item: "Wide Flange, 10 x 8 x 33# x 6M", qtyReturned: 4, unitCost: 12300, totalCost: 49200, customer: "Aguila Simbulan Partners", reason: "Customer cancel", totalQtyOut: 0, qtyBalance: 4, amountBalance: 49200, disposition: "Restock", status: "Received", returnNo: "RTN26036", warehouse: "Meycauayan", lineItems: [
    { code: "51181", desc: "Wide Flange, 10 x 8 x 33# x 6M", qty: 4, unit: 12300, val: 49200 },
  ]},
  { id: 11, transNo: "021", returnDate: "2026-05-16", drNo: "DR25980", sku: "DRB032", item: "Deformed Round Bar, 32mm x 6M g60", qtyReturned: 22, unitCost: 1479, totalCost: 32538, customer: "SUNWAY CONSTRUCTION INC.", reason: "Wrong item", totalQtyOut: 2, qtyBalance: 20, amountBalance: 29580, disposition: "Scrap", status: "Approved", returnNo: "RTN26037", warehouse: "Meycauayan", lineItems: [
    { code: "DRB032", desc: "Deformed Round Bar, 32mm x 6M g60", qty: 22, unit: 1479, val: 32538 },
  ]},
  { id: 12, transNo: "022", returnDate: "2026-05-17", drNo: "DR25990", sku: "SQ22", item: "GI Square Tube, 2 x 2 x 2mm x 6M", qtyReturned: 10, unitCost: 880, totalCost: 8800, customer: "PRIME BUILDERS CORP.", reason: "Damaged During Delivery", totalQtyOut: 0, qtyBalance: 10, amountBalance: 8800, disposition: "Restock", status: "Pending", returnNo: "RTN26038", warehouse: "Pampanga", lineItems: [
    { code: "SQ22", desc: "GI Square Tube, 2 x 2 x 2mm x 6M", qty: 10, unit: 880, val: 8800 },
  ]},
  { id: 13, transNo: "023", returnDate: "2026-05-18", drNo: "DR26001", sku: "SHPT3", item: "Sheet Pile T3, 400mm x 125mm", qtyReturned: 1, unitCost: 28271.06, totalCost: 28271.06, customer: "EC STRUCTURAL COMPOSITE INC.", reason: "Quality hold", totalQtyOut: 0, qtyBalance: 1, amountBalance: 28271.06, disposition: "Scrap", status: "Received", returnNo: "RTN26039", warehouse: "Meycauayan", lineItems: [
    { code: "SHPT3", desc: "Sheet Pile T3, 400mm x 125mm", qty: 1, unit: 28271.06, val: 28271.06 },
  ]},
  { id: 14, transNo: "024", returnDate: "2026-05-19", drNo: "DR26010", sku: "DRB052", item: "Deformed Round Bar, 16mm x 6M g40", qtyReturned: 100, unitCost: 346.73, totalCost: 34673, customer: "BRENCON DEVELOPERS PHILS.", reason: "Customer cancel", totalQtyOut: 40, qtyBalance: 60, amountBalance: 20803.8, disposition: "Credit memo", status: "Approved", returnNo: "RTN26040", warehouse: "Meycauayan", lineItems: [
    { code: "DRB052", desc: "Deformed Round Bar, 16mm x 6M g40", qty: 100, unit: 346.73, val: 34673 },
  ]},
  { id: 15, transNo: "025", returnDate: "2026-05-20", drNo: "DR26015", sku: "MSP018", item: "MS Plate, 12mm x 4' x 8'", qtyReturned: 4, unitCost: 1200, totalCost: 4800, customer: "RCM BUILDERS", reason: "Damaged During Delivery", totalQtyOut: 0, qtyBalance: 4, amountBalance: 4800, disposition: "Restock", status: "Pending", returnNo: "RTN26041", warehouse: "Meycauayan", lineItems: [
    { code: "MSP018", desc: "MS Plate, 12mm x 4' x 8'", qty: 4, unit: 1200, val: 4800 },
  ]},
  { id: 16, transNo: "026", returnDate: "2026-05-21", drNo: "DR26022", sku: "JINXI", item: "Sheet Pile Z - Pile 770mm", qtyReturned: 2, unitCost: 41838.53, totalCost: 83677.06, customer: "TALDE CONSTRUCTION INC.", reason: "Wrong item", totalQtyOut: 0, qtyBalance: 2, amountBalance: 83677.06, disposition: "Credit memo", status: "Received", returnNo: "RTN26042", warehouse: "Meycauayan", lineItems: [
    { code: "JINXI", desc: "Sheet Pile Z - Pile 770mm", qty: 2, unit: 41838.53, val: 83677.06 },
  ]},
  { id: 17, transNo: "027", returnDate: "2026-05-22", drNo: "DR26028", sku: "DRB050", item: "Deformed Round Bar, 10mm x 6M g40", qtyReturned: 30, unitCost: 136.6, totalCost: 4098, customer: "AREMAR CONSTRUCTION CORP.", reason: "Quality hold", totalQtyOut: 0, qtyBalance: 30, amountBalance: 4098, disposition: "Restock", status: "Approved", returnNo: "RTN26043", warehouse: "Marilao", lineItems: [
    { code: "DRB050", desc: "Deformed Round Bar, 10mm x 6M g40", qty: 30, unit: 136.6, val: 4098 },
  ]},
  { id: 18, transNo: "028", returnDate: "2026-05-23", drNo: "DR26035", sku: "WF016", item: "Wide Flange, 8 x 4 x 10# x 6M", qtyReturned: 6, unitCost: 9800, totalCost: 58800, customer: "SUNWAY CONSTRUCTION INC.", reason: "Damaged During Delivery", totalQtyOut: 1, qtyBalance: 5, amountBalance: 49000, disposition: "Scrap", status: "Pending", returnNo: "RTN26044", warehouse: "Meycauayan", lineItems: [
    { code: "WF016", desc: "Wide Flange, 8 x 4 x 10# x 6M", qty: 6, unit: 9800, val: 58800 },
  ]},
];

function IconChevronLeft({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M15 19l-7-7 7-7" /></svg>;
}
function IconChevronRight({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>;
}
function IconX({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}
function IconEdit({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function IconSave({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
}

const selectSt = {
  padding: "10px 30px 10px 12px",
  fontSize: 14,
  border: "2px solid #F95B02",
  borderRadius: 15,
  background: "#ffffff",
  color: "#F95B02",
  cursor: "pointer",
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  width: "100%",
  appearance: "none",
  WebkitAppearance: "none",
  fontWeight: 700,
  outline: "none",
  boxShadow: "0px 8px 16px 0px rgba(0,0,0,0.2)",
};

function lineQtySum(lines) {
  return lines.reduce((s, L) => s + L.qty, 0);
}
function lineValSum(lines) {
  return lines.reduce((s, L) => s + L.val, 0);
}


function useSheetJS() {
  return true;
}

const RT_MAIN_COLS = 12;
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

/** Same 12 columns as the on-screen table (COLS). */
const RETURN_TABLE_COLS = [
  "TRANS #", "INSERT DATE", "INSERT DR#", "SKU", "ITEM", "INSERT QTY",
  "INSERT UNIT COST", "TOTAL COST", "CUSTOMER NAME", "REASON", "TOTAL QTY OUT", "QTY BALANCE", "ACTION",
];

function returnTransSlot(index, base = 11) {
  return base + index;
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

function exportReturns(rows, qtyOutRecords, allReturns, slotPairs = 5) {
  const wb = XLSX.utils.book_new();
  const pairs = slotPairs;
  const RT_TOTAL_COLS = RT_MAIN_COLS + pairs * 2;
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

  const mainHdrs = RETURN_TABLE_COLS;
  const outHdrs = [];
  for (let i = 0; i < pairs; i++) outHdrs.push("QTY - OUT", "DATE");

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
      put(ri, 0, returnTransSlot(i), "n", cell(sheetFill, padCenter, { font: f.body(true), numFmt: qtyFmt }));
      for (let c = 1; c < RT_MAIN_COLS; c++) {
        const isPeso = c === 6 || c === 7;
        const isQty = c === 5 || c === 10 || c === 11;
        put(ri, c, isPeso ? "P  -" : isQty ? 0 : "", isPeso ? "s" : "n", cell(sheetFill, isQty ? padCenter : isPeso ? padLeft : padLeft, isQty ? { numFmt: qtyFmt } : {}));
      }
      for (let p = 0; p < pairs; p++) {
        const qtyCol = RT_MAIN_COLS + p * 2;
        const dateCol = qtyCol + 1;
        put(ri, qtyCol, "", "s", cell(greenFill, padCenter));
        put(ri, dateCol, "", "s", cell(peachFill, padCenter));
      }
      continue;
    }

    const totalCost = row.totalCost ?? (row.qtyReturned || 0) * (row.unitCost || 0);

    put(ri, 0, row.transNo ?? "", "s", cell(sheetFill, padCenter, { font: f.body(true) }));
    put(ri, 1, formatReturnExportDate(row.returnDate), "s", cell(sheetFill, padCenter));
    put(ri, 2, row.drNo || "", "s", cell(sheetFill, padCenter));
    put(ri, 3, row.sku || "", "s", cell(sheetFill, padCenter));
    put(ri, 4, row.item || "", "s", cell(sheetFill, padLeft, { font: f.item() }));
    put(ri, 5, row.qtyReturned ?? 0, "n", cell(sheetFill, padCenter, { font: f.body(true), numFmt: qtyFmt }));
    putMoney(ri, 6, row.unitCost);
    putMoney(ri, 7, totalCost);
    put(ri, 8, row.customer || "", "s", cell(sheetFill, padLeft));
    put(ri, 9, row.reason || "", "s", cell(sheetFill, padLeft));
    put(ri, 10, row.totalQtyOut ?? 0, "n", cell(sheetFill, padCenter, { font: f.body(true), numFmt: qtyFmt }));
    const qtyBal = (row.qtyReturned || 0) - (row.totalQtyOut || 0);
    put(ri, 11, qtyBal, "n", cell(sheetFill, padCenter, { font: f.body(true), numFmt: qtyFmt }));

    for (let p = 0; p < pairs; p++) {
      const qtyCol = RT_MAIN_COLS + p * 2;
      const dateCol = qtyCol + 1;
      put(ri, qtyCol, "", "s", cell(greenFill, padCenter));
      put(ri, dateCol, "", "s", cell(peachFill, padCenter));
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
    { s: { r: 0, c: 2 }, e: { r: 0, c: lastCol } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: lastCol } },
  ];

  const outCols = [];
  for (let i = 0; i < pairs; i++) outCols.push({ wch: 10 }, { wch: 11 });
  ws["!cols"] = [
    { wch: 10 }, { wch: 25 }, { wch: 14 }, { wch: 12 }, { wch: 50 }, { wch: 12 },
    { wch: 18 }, { wch: 18 }, { wch: 36 }, { wch: 22 }, { wch: 14 }, { wch: 14 },
    ...outCols,
  ];

  ws["!rows"] = [
    { hpt: 26 }, { hpt: 24 }, { hpt: 20 }, { hpt: 46 },
    ...Array(slotCount).fill({ hpt: 34 }),
  ];

  XLSX.utils.book_append_sheet(wb, ws, "RETURN INVENTORY");

  // Qty-Out History sheet
  const qo = {};
  const qoPut = (r, c, v, t, s) => { qo[XLSX.utils.encode_cell({ r, c })] = { v: v ?? "", t: t || (typeof v === "number" ? "n" : "s"), s }; };
  const qoHdrFill = { patternType: "solid", fgColor: { rgb: "1C2235" } };
  const qoEvenFill = { patternType: "solid", fgColor: { rgb: "FFFFFF" } };
  const qoOddFill = { patternType: "solid", fgColor: { rgb: "FAFAFA" } };
  const qoBorder = { top: { style: "thin", color: { rgb: "E5E7EB" } }, bottom: { style: "thin", color: { rgb: "E5E7EB" } }, left: { style: "thin", color: { rgb: "E5E7EB" } }, right: { style: "thin", color: { rgb: "E5E7EB" } } };

  qoPut(0, 0, "RETURN QTY-OUT HISTORY", "s", { font: { name: "Arial", sz: 14, bold: true, color: { rgb: "FFFFFF" } }, fill: qoHdrFill, alignment: { horizontal: "center", vertical: "center" }, border: qoBorder });
  const qoHdrRow = 1;
  qoPut(qoHdrRow, 0, "ITEM", "s", { font: { name: "Arial", sz: 9, bold: true, color: { rgb: "FFFFFF" } }, fill: qoHdrFill, alignment: { horizontal: "center", vertical: "center", wrapText: true }, border: qoBorder });
  for (let i = 0; i < pairs; i++) {
    const col = 1 + i * 2;
    const dateCol = col + 1;
    qoPut(qoHdrRow, col, `QTY-OUT ${i + 1}`, "s", { font: { name: "Arial", sz: 9, bold: true, color: { rgb: "FFFFFF" } }, fill: qoHdrFill, alignment: { horizontal: "center", vertical: "center" }, border: qoBorder });
    qoPut(qoHdrRow, dateCol, `DATE ${i + 1}`, "s", { font: { name: "Arial", sz: 9, bold: true, color: { rgb: "FFFFFF" } }, fill: qoHdrFill, alignment: { horizontal: "center", vertical: "center" }, border: qoBorder });
  }
  const qoTotCol = 1 + pairs * 2;
  qoPut(qoHdrRow, qoTotCol, "TOTAL", "s", { font: { name: "Arial", sz: 9, bold: true, color: { rgb: "FFFFFF" } }, fill: qoHdrFill, alignment: { horizontal: "center", vertical: "center" }, border: qoBorder });

  (allReturns || []).forEach((item, idx) => {
    const ri = qoHdrRow + 1 + idx;
    const entries = (qtyOutRecords || []).filter(r => r.returnId === item.id);
    const fill = idx % 2 === 0 ? qoEvenFill : qoOddFill;
    qoPut(ri, 0, item.item || "", "s", { font: { name: "Arial", sz: 10, color: { rgb: "111827" } }, fill, alignment: { horizontal: "left", vertical: "center" }, border: qoBorder });
    let totalQo = 0;
    for (let i = 0; i < pairs; i++) {
      const col = 1 + i * 2;
      const dateCol = col + 1;
      const entry = entries[i];
      const qty = entry ? entry.qty : "";
      const dt = entry ? entry.date : "";
      totalQo += entry ? entry.qty : 0;
      qoPut(ri, col, qty, entry ? "n" : "s", { font: { name: "Arial", sz: 10, bold: true, color: { rgb: entry ? "DC2626" : "E5E7EB" } }, fill, alignment: { horizontal: "center", vertical: "center" }, border: qoBorder, numFmt: qty && qty > 0 ? "#,##0" : undefined });
      qoPut(ri, dateCol, dt, entry ? "s" : "s", { font: { name: "Arial", sz: 10, color: { rgb: entry ? "374151" : "E5E7EB" } }, fill, alignment: { horizontal: "center", vertical: "center" }, border: qoBorder });
    }
    qoPut(ri, qoTotCol, totalQo, "n", { font: { name: "Arial", sz: 11, bold: true, color: { rgb: "DC2626" } }, fill: { patternType: "solid", fgColor: { rgb: "FEF2F2" } }, alignment: { horizontal: "center", vertical: "center" }, border: qoBorder, numFmt: "#,##0" });
  });

  const qoLastRow = qoHdrRow + (allReturns || []).length;
  const qoLastCol = qoTotCol;
  qo["!ref"] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: qoLastRow, c: qoLastCol });
  qo["!cols"] = [{ wch: 50 }, ...Array(pairs).fill(null).flatMap(() => [{ wch: 10 }, { wch: 12 }]), { wch: 10 }];
  qo["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: qoLastCol } }];
  XLSX.utils.book_append_sheet(wb, qo, "QTY-OUT HISTORY");

  downloadReturnWorkbook(wb, "TDT_Return_Inventory_Summary.xlsx");
}

async function importReturns(file, onDone, onError) {
  try {
    const { raw } = await readWorkbookSheet(file, ["RETURN"]);
    const headerIdx = findHeaderRowIndex(raw, ["TRANS"], 20);
    const dataStart = headerIdx >= 0 ? headerIdx + 1 : 6;
    const headers = headerIdx >= 0 ? raw[headerIdx] : null;
    const parsed = [];
    const qtyOutRecords = [];

    // detect QTY-OUT/DATE pair count from headers
    let qoPairs = 0;
    if (headers) {
      for (let c = 12; c < headers.length; c += 2) {
        const h = cellStr(headers[c]).toUpperCase();
        if (h === "QTY - OUT" || h === "QTY-OUT" || h.startsWith("QTY")) qoPairs++;
        else break;
      }
    }

    for (let i = dataStart; i < raw.length; i++) {
      const r = raw[i];
      if (!rowHasData(r)) continue;

      const rowLabel = cellStr(r[9] ?? r[0]).toUpperCase();
      if (rowLabel.includes("GRAND TOTAL")) continue;

      let transNo = cellStr(pickCol(r, headers, ["TRANS #", "TRANS"], 0));
      let returnDate = formatExcelDate(pickCol(r, headers, ["INSERT DATE", "INSERT DATE", "DATE"], 1));
      const col0 = cellStr(r[0]);
      const col1 = r[1];
      if (!transNo && col0 && formatExcelDate(col1).match(/^\d{4}-\d{2}-\d{2}/)) {
        transNo = col0;
        returnDate = formatExcelDate(col1);
      }

      const item = cellStr(pickCol(r, headers, ["ITEM"], 4));
      const customer = cellStr(pickCol(r, headers, ["CUSTOMER NAME", "CUSTOMER"], 8));
      const sku = cellStr(pickCol(r, headers, ["SKU"], 3));
      if (!transNo && !item && !customer && !sku) continue;

      const qtyReturned = cellNum(pickCol(r, headers, ["INSERT QTY", "INSERT QTY", "QTY"], 5));
      const unitCost = cellNum(pickCol(r, headers, ["INSERT UNIT COST", "INSERT INSERT UNIT COST"], 6));
      const totalCost = cellNum(pickCol(r, headers, ["TOTAL COST"], 7)) || qtyReturned * unitCost;
      const reason = cellStr(pickCol(r, headers, ["REASON"], 9));
      const totalQtyOut = cellNum(pickCol(r, headers, ["TOTAL QTY OUT"], 10)) || 0;
      const qtyBalance = cellNum(pickCol(r, headers, ["QTY BALANCE"], 11)) || qtyReturned - totalQtyOut;

      const returnId = parsed.length + 1;
      parsed.push({
        id: returnId,
        transNo: transNo || String(returnId).padStart(3, "0"),
        returnDate,
        drNo: cellStr(pickCol(r, headers, ["INSERT DR#", "DR", "INSERT DR"], 2)),
        sku,
        item,
        qtyReturned,
        unitCost,
        totalCost,
        customer,
        reason,
        totalQtyOut,
        qtyBalance,
        amountBalance: totalCost,
        returnNo: "",
        warehouse: "Meycauayan",
        lineItems: [],
      });

      // read QTY-OUT/DATE pairs
      for (let p = 0; p < qoPairs; p++) {
        const qtyCol = 12 + p * 2;
        const dateCol = qtyCol + 1;
        const qty = cellNum(r[qtyCol]);
        const date = formatExcelDate(r[dateCol]);
        if (qty > 0 || date) {
          qtyOutRecords.push({
            id: Date.now() + qtyOutRecords.length,
            returnId,
            qty: qty || 0,
            date: date || "",
          });
        }
      }
    }

    if (!parsed.length) throw new Error("No data rows found. Fill TRANS #, ITEM, or CUSTOMER columns.");
    onDone({ items: parsed, qtyOutRecords });
  } catch (err) {
    onError(err.message || "Import failed.");
  }
}

function ReturnInlineEditRow({ row, onSave, onCancel }) {
  const [draft, setDraft] = useState({ ...row });
  const set = (k, v) => setDraft(d => {
    const next = { ...d, [k]: v };
    next.totalCost = (parseFloat(next.qtyReturned)||0) * (parseFloat(next.unitCost)||0);
    return next;
  });
  return (
    <tr style={{ background: "#fffbf7", borderBottom: "1px solid #fed7aa" }}>
      <td style={{ padding: "12px 10px", color: "#6b7280", fontWeight: 600, textAlign: "center" }}>{draft.transNo}</td>
      <td style={{ padding: "6px 10px" }}>
        <input type="date" value={draft.returnDate || ""} onChange={e => set("returnDate", e.target.value)} {...modalCellInput({ width: 130 })} />
      </td>
      <td style={{ padding: "4px 10px" }}>
        <input value={draft.drNo || ""} onChange={e => set("drNo", e.target.value)} {...modalCellInput({ width: 110 })} />
      </td>
      <td style={{ padding: "4px 10px" }}>
        <input value={draft.sku || ""} onChange={e => set("sku", e.target.value)} {...modalCellInput({ width: 90 })} />
      </td>
      <td style={{ padding: "4px 10px" }}>
        <input value={draft.item || ""} onChange={e => set("item", e.target.value)} {...modalCellInput({ width: 160 })} />
      </td>
      <td style={{ padding: "4px 10px" }}>
        <input type="number" min={0} value={draft.qtyReturned ?? ""} onChange={e => set("qtyReturned", parseFloat(e.target.value) || 0)} {...modalCellInput({ width: 80, textAlign: "right" })} />
      </td>
      <td style={{ padding: "4px 10px" }}>
        <input type="number" min={0} step="0.01" value={draft.unitCost ?? ""} onChange={e => set("unitCost", parseFloat(e.target.value) || 0)} {...modalCellInput({ width: 90, textAlign: "right" })} />
      </td>
      <td style={{ padding: "12px 10px", textAlign: "center", fontWeight: 600 }}>{fmtPHP(draft.totalCost)}</td>
      <td style={{ padding: "4px 10px" }}>
        <input value={draft.customer || ""} onChange={e => set("customer", e.target.value)} {...modalCellInput({ width: 120 })} />
      </td>
      <td style={{ padding: "2px 10px" }}>
        <select value={draft.reason} onChange={e => set("reason", e.target.value)} style={{ ...selectSt, padding: "5px 22px 5px 8px", fontSize: 11, width: 130 }}>
          <option value="Damaged During Delivery">Damaged</option>
          <option value="Wrong Item">Wrong Item</option>
          <option value="Defective Product">Defective</option>
          <option value="Customer Return">Customer Return</option>
          <option value="Others">Others</option>
        </select>
      </td>
      <td style={{ padding: "4px 10px" }}>
        <input type="number" min={0} value={draft.totalQtyOut ?? ""} onChange={e => set("totalQtyOut", parseFloat(e.target.value) || 0)} {...modalCellInput({ width: 80, textAlign: "right" })} />
      </td>
      <td style={{ padding: "12px 10px", textAlign: "center", fontWeight: 700, color: (draft.qtyReturned - draft.totalQtyOut) > 0 ? "#111827" : "#9ca3af" }}>{draft.qtyReturned - draft.totalQtyOut}</td>
      <td style={{ padding: "6px 8px", textAlign: "center" }}>
        <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
          <button onClick={() => onSave(draft)} title="Save" style={{ padding: "5px 8px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer", display: "flex", alignItems: "center" }}><IconSave size={13} /></button>
          <button onClick={onCancel} title="Cancel" style={{ padding: "5px 8px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 5, cursor: "pointer", display: "flex", alignItems: "center" }}><IconX size={13} /></button>
        </div>
      </td>
    </tr>
  );
}

export default function ReturnPage() {
  const xlsxReady = useSheetJS();
  const api = useApi(ENDPOINTS.returns, SEED_RETURNS);
  useEffect(() => { api.getAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const returns    = api.data;
  const setReturns = null;
  const [searchQuery, setSearchQuery] = useState("");
  const [reasonFilter, setReasonFilter] = useState("All Reasons");
  const [warehouseFilter] = useState("All Warehouses");
  const [currentPage, setCurrentPage] = useState(1);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ returnDate: "", drNo: "", sku: "", item: "", qtyReturned: "", unitCost: "", customer: "", reason: "Damaged During Delivery", warehouse: "Meycauayan" });
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const fileInputRef = useRef(null);
  const { sortBy, setSortBy, applySort } = useSort("returnDate", "item");
  const [sortOpen, setSortOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [returnTab, setReturnTab] = useState("summary");
  const [rtnQtyOutRecords, setRtnQtyOutRecords] = useState(RTN_QTY_OUT_SEED);
  const [rtnQtyOutSlotCount, setRtnQtyOutSlotCount] = useState(5);
  const [editingRtnQtyOutItem, setEditingRtnQtyOutItem] = useState(null);
  const [rtnQtyOutDraft, setRtnQtyOutDraft] = useState({});
  const handleSaveEdit = async (updated) => {
    try {
      await api.update(updated.id, updated);
      setEditingId(null);
      showToast("Return row updated successfully.");
    } catch {
      showToast("Failed to save changes.", "error");
    }
  };

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const handleImport = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setImporting(true);
    importReturns(file, async (result) => {
      const parsed = result.items || result;
      const qo = result.qtyOutRecords || [];
      try {
        await api.bulkReplace(parsed);
        if (qo.length) setRtnQtyOutRecords(qo);
        setCurrentPage(1);
        setSelectedId(null);
        setPanelOpen(false);
        showToast(`Imported ${parsed.length} entries (${qo.length} qty-out records).`);
      } catch {
        showToast("Import succeeded but failed to save.", "error");
      } finally {
        setImporting(false);
        e.target.value = "";
      }
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
    if (reasonFilter !== "All Reasons") rows = rows.filter((r) => r.reason === reasonFilter);
    if (warehouseFilter !== "All Warehouses") rows = rows.filter((r) => r.warehouse === warehouseFilter);
    if (dateRange.start) rows = rows.filter((r) => r.returnDate >= dateRange.start);
    if (dateRange.end)   rows = rows.filter((r) => r.returnDate <= dateRange.end);
    return rows;
  }, [returns, searchQuery, reasonFilter, warehouseFilter, dateRange]);

  useEffect(() => {
    if (selectedId != null && !filtered.some((r) => r.id === selectedId)) {
      setSelectedId(null);
      setPanelOpen(false);
    }
  }, [filtered, selectedId]);

  const sorted = useMemo(() => applySort(filtered), [filtered, sortBy]);
  const rtnQtyOutTotals = useMemo(() => {
    const m = {};
    rtnQtyOutRecords.forEach(r => { m[r.returnId] = (m[r.returnId] || 0) + r.qty; });
    return m;
  }, [rtnQtyOutRecords]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selected = selectedId != null ? returns.find((r) => r.id === selectedId) : null;

  const COLS = RETURN_TABLE_COLS;

  return (
    <div style={{ background: "#f0f2f5", padding: "28px 32px 40px", display: "flex", flexDirection: "column", gap: 18 }}>

      <PageToolbar
        searchValue={searchQuery}
        onSearchChange={(v) => { setSearchQuery(v); setCurrentPage(1); }}
        filters={[
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
                exportReturns(filtered, rtnQtyOutRecords, RTN_QTY_OUT_SEED, rtnQtyOutSlotCount);
                showToast(`Exported ${filtered.length} return entries.`);
            } catch (err) {
              console.error("Return export failed:", err);
              showToast(err?.message || "Export failed.", "error");
            }
          },
        }}
      />

      <div style={{ display: "flex", gap: 4, borderBottom: "2px solid #e5e7eb", background: "#fff", borderRadius: "12px 12px 0 0", padding: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", position: "relative", zIndex: 1 }}>
        {[["summary","Returns Summary"],["qtyout","Qty-Out History"]].map(([key,label]) => (
          <button key={key} onClick={() => { setReturnTab(key); setCurrentPage(1); }} style={{ padding: "14px 20px", background: "none", border: "none", cursor: "pointer", borderBottom: returnTab===key?"3px solid #e87c27":"3px solid transparent", color: returnTab===key?"#e87c27":"#9ca3af", fontSize: 14, fontWeight: 700, marginBottom: -2, fontFamily: "inherit" }}>{label}</button>
        ))}
      </div>

      {returnTab === "summary" && (
      <div style={{ background: "#fff", borderRadius: "0 0 14px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", background: "#f8f9fb", borderBottom: "1px solid #e5e7eb" }}>
          <div style={{ position: "relative" }}>
            <button onClick={() => setSortOpen(o => !o)} style={{ padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontFamily: "inherit", color: "#374151", fontWeight: 600 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5h10"/><path d="M11 9h7"/><path d="M11 13h4"/>
              </svg>
            </button>
            {sortOpen && (
              <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 50, minWidth: 170, overflow: "hidden" }}>
                {[["newest","↓","Newest"],["oldest","↑","Oldest"],["az","","A–Z"],["za","","Z–A"]].map(([val,arrow,text]) => (
                  <div key={val} onClick={() => { setSortBy(val); setCurrentPage(1); setSortOpen(false); }}
                    style={{ padding: "10px 14px", cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: sortBy === val ? 700 : 400, color: sortBy === val ? "#e87c27" : "#374151", background: sortBy === val ? "#fff4ed" : "#fff", display: "flex", alignItems: "center", gap: 8, borderBottom: val !== "za" ? "1px solid #f3f4f6" : "none" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fef6f2"}
                    onMouseLeave={e => e.currentTarget.style.background = sortBy === val ? "#fff4ed" : "#fff"}
                  >
                    <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{arrow}</span>
                    <span>{text}</span>
                    {sortBy === val && <span style={{ marginLeft: "auto", color: "#e87c27", fontSize: 13 }}>✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Sort:</span>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>
            {sortBy === "newest" ? "↓ Newest" : sortBy === "oldest" ? "↑ Oldest" : sortBy === "az" ? "A–Z" : "Z–A"}
          </span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#1c2235" }}>
                {COLS.map((h) => (
  <th
    key={h}
    style={{
      padding: "14px 10px",
      textAlign:"center",
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
                <tr><td colSpan={13} style={{ textAlign: "center", padding: "48px 20px", color: "#9ca3af" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                  No results found for <strong style={{ color: "#374151" }}>"{searchQuery || "your filters"}"</strong>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Try a different search term or clear your filters.</div>
                </td></tr>
              )}
              {paged.map((row, idx) => {
                if (editingId === row.id) {
                  return <ReturnInlineEditRow key={row.id} row={row} onSave={handleSaveEdit} onCancel={() => setEditingId(null)} />;
                }
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
<td title={row.item} style={{ padding: "12px 10px", color: "#111827", maxWidth: 200, minWidth: 160, textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: "default" }}><Highlight text={row.item} query={searchQuery} /></td>
                    <td style={{ padding: "12px 10px", textAlign: "center", fontWeight: 700 }}>{row.qtyReturned}</td>
                    <td style={{ padding: "12px 10px", textAlign: "center" }}>{fmtPHP(row.unitCost)}</td>
                    <td style={{ padding: "12px 10px", textAlign: "center", fontWeight: 600 }}>{fmtPHP(row.totalCost)}</td>
                    <td style={{ padding: "12px 10px", color: "#374151", maxWidth: 140, textAlign: "center" }}><Highlight text={row.customer} query={searchQuery} /></td>
                    <td style={{ padding: "12px 10px", color: "#6b7280", fontSize: 11, textAlign: "center" }}>{row.reason}</td>
                    <td style={{ padding: "12px 10px", textAlign: "center", fontWeight: 700, color: (rtnQtyOutTotals[row.id]||0) > 0 ? "#dc2626" : "#9ca3af" }}>{rtnQtyOutTotals[row.id] || 0}</td>
                    <td style={{ padding: "12px 10px", textAlign: "center" }}>
                      <span style={{ padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: (row.qtyReturned - (rtnQtyOutTotals[row.id]||0)) > 0 ? "#fef3c7" : "#d1fae5", color: (row.qtyReturned - (rtnQtyOutTotals[row.id]||0)) > 0 ? "#d97706" : "#065f46" }}>{row.qtyReturned - (rtnQtyOutTotals[row.id]||0)}</span>
                    </td>
                    <td style={{ padding: "8px 8px", textAlign: "center" }}>
                      <button onClick={(e) => { e.stopPropagation(); setEditingId(row.id); }} title="Edit row" style={{ padding: "5px 8px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                        <IconEdit size={12} /> Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderTop: "1px solid #f3f4f6", background: "#fafafa", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            Showing {sorted.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sorted.length)} of {sorted.length} entries
          </span>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", color: "#374151", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.4 : 1 }}><IconChevronLeft size={14} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 8).map((n) => (
              <button key={n} type="button" onClick={() => setCurrentPage(n)} style={{ width: 30, height: 30, border: n === currentPage ? "none" : "1px solid #e5e7eb", borderRadius: 6, background: n === currentPage ? "#e87c27" : "#fff", color: n === currentPage ? "#fff" : "#374151", cursor: "pointer", fontWeight: n === currentPage ? 700 : 400, fontSize: 12 }}>{n}</button>
            ))}
            <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", color: "#374151", cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.4 : 1 }}><IconChevronRight size={14} /></button>
          </div>
        </div>
      </div>
      )}

      {returnTab === "qtyout" && (
      <div style={{ background: "#fff", borderRadius: "0 0 14px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px" }}>
          {(() => {
            if (filtered.length === 0) {
              return <div style={{ textAlign: "center", padding: 48, color: "#9ca3af", fontSize: 14 }}>No return items to track.</div>;
            }
            const slots = rtnQtyOutSlotCount;
            const itemEntries = filtered.map(item => ({
              item,
              entries: rtnQtyOutRecords.filter(r => r.returnId === item.id),
            }));
            const overallTotalQtyOut = itemEntries.reduce((s, g) => s + g.entries.reduce((ss, e) => ss + e.qty, 0), 0);
            return (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>QTY-OUT / DATE Pairs: {slots}</span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button onClick={() => setRtnQtyOutSlotCount(s => Math.min(20, s + 1))} title="Add QTY-OUT/DATE column pair" style={{ padding: "4px 10px", border: "1px solid #16a34a", borderRadius: 5, background: "#f0fdf4", cursor: "pointer", fontSize: 13, color: "#16a34a", fontWeight: 700, fontFamily: "inherit", lineHeight: 1, display: "flex", alignItems: "center", gap: 4 }}>+ Add Pair</button>
                    <button onClick={() => setRtnQtyOutSlotCount(s => Math.max(1, s - 1))} title="Remove last QTY-OUT/DATE column pair" disabled={rtnQtyOutSlotCount <= 1} style={{ padding: "4px 10px", border: "1px solid #ef4444", borderRadius: 5, background: "#fef2f2", cursor: rtnQtyOutSlotCount <= 1 ? "not-allowed" : "pointer", fontSize: 13, color: "#ef4444", fontWeight: 700, fontFamily: "inherit", lineHeight: 1, display: "flex", alignItems: "center", gap: 4, opacity: rtnQtyOutSlotCount <= 1 ? 0.4 : 1 }}>− Remove Pair</button>
                  </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "#1c2235" }}>
                        <th rowSpan={2} style={{ padding: "12px 14px", color: "#fff", fontWeight: 700, fontSize: 10, whiteSpace: "nowrap", textAlign: "center", borderRight: "1px solid #2a3450" }}>ITEM</th>
                        <th colSpan={slots * 2} style={{ padding: "12px 14px", color: "#fff", fontWeight: 700, fontSize: 10, textAlign: "center", borderBottom: "1px solid #2a3450" }}>QTY-OUT / DATE RECORDS</th>
                        <th rowSpan={2} style={{ padding: "12px 14px", color: "#fff", fontWeight: 700, fontSize: 10, whiteSpace: "nowrap", textAlign: "center", borderLeft: "1px solid #2a3450", minWidth: 90 }}>TOTAL QTY OUT</th>
                        <th rowSpan={2} style={{ padding: "12px 14px", color: "#fff", fontWeight: 700, fontSize: 10, whiteSpace: "nowrap", textAlign: "center", borderLeft: "1px solid #2a3450", minWidth: 60 }}>ACTION</th>
                      </tr>
                      <tr style={{ background: "#1c2235" }}>
                        {Array.from({ length: slots }, (_, i) => (
                          <Fragment key={i}>
                            <th style={{ padding: "10px 10px", color: "#93a3c7", fontWeight: 600, fontSize: 9, whiteSpace: "nowrap", textAlign: "center", borderRight: "1px solid #2a3450" }}>QTY-OUT</th>
                            <th style={{ padding: "10px 10px", color: "#93a3c7", fontWeight: 600, fontSize: 9, whiteSpace: "nowrap", textAlign: "center" }}>DATE</th>
                          </Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {itemEntries.map((g, gi) => {
                        const isEditing = editingRtnQtyOutItem === g.item.id;
                        return (
                          <tr key={g.item.id}
                            style={{ borderBottom: "1px solid #f3f4f6", background: isEditing ? "#fffbf7" : gi % 2 === 0 ? "#fff" : "#fafafa" }}
                          >
                            <td style={{ padding: "10px 14px", color: "#111827", fontWeight: 600, fontSize: 12, textAlign: "left", borderRight: "1px solid #f3f4f6", maxWidth: 240, minWidth: 180 }}>{g.item.item}</td>
                            {Array.from({ length: slots }, (_, slotIdx) => {
                              const entry = g.entries[slotIdx];
                              if (isEditing) {
                                return (
                                  <Fragment key={slotIdx}>
                                    <td style={{ padding: "4px 6px", borderRight: "1px solid #f3f4f6" }}>
                                      <input type="number" min={0} value={rtnQtyOutDraft[`${g.item.id}-${slotIdx}-qty`] ?? entry?.qty ?? ""} onChange={e => setRtnQtyOutDraft(d => ({ ...d, [`${g.item.id}-${slotIdx}-qty`]: parseFloat(e.target.value) || "" }))} placeholder="Qty" {...modalCellInput({ width: 65, textAlign: "right" })} />
                                    </td>
                                    <td style={{ padding: "4px 6px" }}>
                                      <input type="date" value={rtnQtyOutDraft[`${g.item.id}-${slotIdx}-date`] ?? entry?.date ?? ""} onChange={e => setRtnQtyOutDraft(d => ({ ...d, [`${g.item.id}-${slotIdx}-date`]: e.target.value }))} {...modalCellInput({ width: 120 })} />
                                    </td>
                                  </Fragment>
                                );
                              }
                              return (
                                <Fragment key={slotIdx}>
                                  <td style={{ padding: "10px 10px", color: entry ? "#e87c27" : "#e5e7eb", fontWeight: entry ? 700 : 400, fontSize: 11, textAlign: "center", borderRight: "1px solid #f3f4f6", whiteSpace: "nowrap", minWidth: 100 }}>{entry ? entry.qty.toLocaleString() : "—"}</td>
                                  <td style={{ padding: "10px 10px", color: entry ? "#111827" : "#e5e7eb", fontWeight: entry ? 700 : 400, fontSize: 12, textAlign: "center", minWidth: 60 }}>{entry ? formatReturnExportDate(entry.date) : "—"}</td>
                                </Fragment>
                              );
                            })}
                            <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 800, color: "#e87c27", fontSize: 13, borderLeft: "1px solid #f3f4f6", background: isEditing ? "#fffbf7" : "#fff4ed" }}>{g.entries.reduce((s, e) => s + e.qty, 0).toLocaleString()}</td>
                            <td style={{ padding: "8px 8px", textAlign: "center" }}>
                              {isEditing ? (
                                <div style={{ display: "flex", gap: 3, flexDirection: "column", alignItems: "center" }}>
                                  <button onClick={() => {
                                    const draft = { ...rtnQtyOutDraft };
                                    const newEntries = [];
                                    for (let i = 0; i < slots; i++) {
                                      const q = parseFloat(draft[`${g.item.id}-${i}-qty`]);
                                      const d = draft[`${g.item.id}-${i}-date`] || "";
                                      if (q > 0 || d) {
                                        const existing = g.entries[i];
                                        newEntries.push({
                                          id: existing ? existing.id : Date.now() + i,
                                          returnId: g.item.id,
                                          qty: q || 0,
                                          date: d || existing?.date || "",
                                        });
                                      }
                                    }
                                    setRtnQtyOutRecords(prev => {
                                      const other = prev.filter(r => r.returnId !== g.item.id);
                                      return [...other, ...newEntries];
                                    });
                                    setEditingRtnQtyOutItem(null);
                                    setRtnQtyOutDraft({});
                                    showToast("Qty-Out History updated.");
                                  }} title="Save" style={{ padding: "4px 7px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center" }}><IconSave size={11} /></button>
                                  <button onClick={() => { setEditingRtnQtyOutItem(null); setRtnQtyOutDraft({}); }} title="Cancel" style={{ padding: "4px 7px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center" }}><IconX size={11} /></button>
                                </div>
                              ) : (
                                <button onClick={() => { setEditingRtnQtyOutItem(g.item.id); setRtnQtyOutDraft({}); }} title="Edit" style={{ padding: "4px 7px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 4, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 2, fontSize: 10, fontWeight: 600, fontFamily: "inherit" }}><IconEdit size={11} /> Edit</button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      <tr style={{ background: "#1c2235" }}>
                        <td style={{ padding: "12px 14px", fontWeight: 800, color: "#fff", fontSize: 12, textAlign: "left", borderRight: "1px solid #2a3450" }}>GRAND TOTAL</td>
                        <td style={{ padding: "12px 14px", fontWeight: 700, color: "#93a3c7", fontSize: 11, textAlign: "center", borderRight: "1px solid #2a3450" }}>{itemEntries.length} item(s)</td>
                        {Array.from({ length: slots * 2 }, (_, ci) => (
                          <td key={ci} style={{ padding: "10px", textAlign: "center", color: "#93a3c7", fontSize: 11, borderRight: ci < slots * 2 - 1 ? "1px solid #2a3450" : "none" }}></td>
                        ))}
                        <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: 800, color: "#fca5a5", fontSize: 14, borderLeft: "1px solid #2a3450", background: "#2a3450" }}>{overallTotalQtyOut.toLocaleString()}</td>
                        <td style={{ padding: "12px 14px", borderLeft: "1px solid #2a3450" }}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
      )}

      {panelOpen && selected && (
        <>
          <button type="button" aria-label="Close" onClick={() => setPanelOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.35)", zIndex: 1040, border: "none", cursor: "pointer" }} />
          <aside style={{ position: "fixed", top: 0, right: 0, width: "min(440px, 100vw)", height: "100vh", background: "#fff", zIndex: 1050, boxShadow: "-8px 0 40px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "20px 22px", background: "#1c2235", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexShrink: 0 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#fff" }}>Return Details</h2>
                </div>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#9ca3af", fontWeight: 600, textAlign: "left" }}>Return No. {selected.returnNo}</p>
              </div>
              <button type="button" onClick={() => setPanelOpen(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}><IconX size={18} /></button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px 24px" }}>
              {[
                ["Trans #", selected.transNo],
                ["INSERT DATE", formatDate(selected.returnDate)],
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
                      {["Item Code", "Item Description", "INSERT QTY", "INSERT UNIT COST", "Return Value"].map((h) => (
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
        <div style={modalOverlayStyle} onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div style={{ ...modalPanelStyle, width: "min(580px, 96vw)" }}>
            <div style={modalHeaderStyle}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={modalTitleStyle}>Create New Return</h2>
                <p style={{ ...modalSubtitleStyle, margin: "4px 0 0" }}>Fill in the return details. Fields marked with * are required.</p>
              </div>
              <button type="button" onClick={() => setShowCreate(false)} style={modalCloseBtnStyle} aria-label="Close"
                onMouseEnter={e => e.currentTarget.style.background = "#e5e7eb"}
                onMouseLeave={e => e.currentTarget.style.background = "#f3f4f6"}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
              {[
                { label: "INSERT DATE *", key: "returnDate", type: "date" },
                { label: "DR No. *", key: "drNo", type: "text", placeholder: "e.g. DR26050" },
                { label: "SKU Code *", key: "sku", type: "text", placeholder: "e.g. DRB052" },
                { label: "Item Description *", key: "item", type: "text", placeholder: "e.g. Deformed Round Bar...", fullWidth: true },
                { label: "INSERT QTY", key: "qtyReturned", type: "number", placeholder: "0" },
                { label: "INSERT UNIT COST (₱)", key: "unitCost", type: "number", placeholder: "0.00" },
                { label: "Customer Name", key: "customer", type: "text", placeholder: "e.g. RCM Builders" },
                { label: "Warehouse", key: "warehouse", type: "select", options: ["Meycauayan", "Pampanga", "Marilao"] },
                { label: "Return Reason", key: "reason", type: "select", options: ["Damaged During Delivery", "Wrong item", "Customer cancel", "Quality hold"] },
              ].map(({ label, key, type, placeholder, options, fullWidth }) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: fullWidth ? "1 / -1" : undefined }}>
                  <label style={modalLabelStyle}>{label}</label>
                  {type === "select" ? (
                    <div style={{ position: "relative" }}>
                      <select value={createForm[key]} onChange={e => setCreateForm(f => ({ ...f, [key]: e.target.value }))}
                        style={{ width: "100%", padding: "9px 30px 9px 12px", fontSize: 13, fontWeight: 700, color: "#F95B02", border: "2px solid #F95B02", borderRadius: 15, fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", outline: "none", background: "#fff", cursor: "pointer", appearance: "none", boxSizing: "border-box", boxShadow: "0px 8px 16px 0px rgba(0,0,0,0.2)" }}>
                        {options.map(o => <option key={o}>{o}</option>)}
                      </select>
                      <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#F95B02", pointerEvents: "none", fontSize: 10 }}>▼</span>
                    </div>
                  ) : (
                    <input type={type} value={createForm[key]} onChange={e => setCreateForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} {...modalInput()} />
                  )}
                </div>
              ))}
            </div>
            <div style={modalFooterStyle}>
              <button type="button" onClick={() => setShowCreate(false)} style={modalBtnSecondary}>Cancel</button>
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
                  returnNo: `RTN${new Date().getFullYear()}${String(returns.length + 50).padStart(3, "0")}`,
                  warehouse: createForm.warehouse,
                  lineItems: [{ code: createForm.sku, desc: createForm.item, qty, unit: cost, val: qty * cost }],
                };
                api.create(newReturn).then(() => {
                  setShowCreate(false);
                  setCreateForm({ returnDate: "", drNo: "", sku: "", item: "", qtyReturned: "", unitCost: "", customer: "", reason: "Damaged During Delivery", warehouse: "Meycauayan" });
                  setToast({ msg: "Return created successfully.", type: "success" });
                  setTimeout(() => setToast(null), 3000);
                }).catch(() => {
                  setToast({ msg: "Failed to create return.", type: "error" });
                  setTimeout(() => setToast(null), 3000);
                });
              }} style={modalBtnPrimary}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Create Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}