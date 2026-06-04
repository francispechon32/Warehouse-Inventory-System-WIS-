import { useState, useRef, useMemo, useEffect } from "react";
import XLSX from "xlsx-js-style";
import PageToolbar from "./PageToolbar";
import useSort from "./useSort";
import {
  cellStr,
  cellNum,
  formatExcelDate,
  findHeaderRowIndex,
  pickCol,
  rowHasData,
  parseRowId,
  readWorkbookSheet,
} from "./excelImportUtils";
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
import { formatCompactPHP } from "./inventoryUtils";
import MetricCard from "./MetricCard";
import { IconBox, IconTruck, IconBarChart, IconBag } from "./metricIcons";

/* ─── SEED DATA from Excel BACKLOAD INVENTORY sheet ── */
const SEED_BACKLOAD = [
  { id: 1, date: "2025-03-15", drNo: "", sku: "", item: "Sheet Pile Z type 4 meters", qty: 40, unitCost: 0, customerName: "RCM", totalQtyOut: 0, remarks: "TRANSFER FROM POLYLAND WAREHOUSE" },
  { id: 2, date: "2025-07-26", drNo: "DR23361", sku: "", item: "Deformed Round Bar, 20mm x 10.5M g40 (25.89kgs)", qty: 44, unitCost: 903.15, customerName: "BRENCON DEVELOPERS PHILS. INC", totalQtyOut: 0, remarks: "FOR ADD TO STOCK" },
  { id: 3, date: "2025-09-16", drNo: "CEBDR4680", sku: "", item: "Deformed Round Bar, 32mm x 6M g60 (37.88kgs)", qty: 50, unitCost: 1479, customerName: "TALDE CONSTRUCTION INC.", totalQtyOut: 0, remarks: "" },
  { id: 4, date: "2025-09-30", drNo: "DR25026", sku: "", item: "Deformed Round Bar, 20mm x 6M g60 (14.80kgs)", qty: 123, unitCost: 539.31, customerName: "EC STRUCTURAL COMPOSITE INC.", totalQtyOut: 0, remarks: "DELIVERED/may hindi naisama pero sinign as complete yung DR" },
  { id: 5, date: "2025-10-11", drNo: "49754", sku: "49754", item: "GI Rectangular Tube, 2 x 4 x 2mm x 6M", qty: 3, unitCost: 1380, customerName: "for marilao WH use", totalQtyOut: 0, remarks: "" },
  { id: 6, date: "2025-10-11", drNo: "49754", sku: "49754", item: "GI Square Tube, 2 x 2 x 2mm x 6M", qty: 3, unitCost: 880, customerName: "for marilao WH use", totalQtyOut: 0, remarks: "" },
  { id: 7, date: "2025-11-28", drNo: "DR25225", sku: "51181", item: "Wide Flange, 10 x 8 x 33# x 6M", qty: 4, unitCost: 12300, customerName: "AGUILA SIMBULAN PLUS PARTNERS", totalQtyOut: 0, remarks: "" },
  { id: 8, date: "2025-12-05", drNo: "DR25310", sku: "", item: "Deformed Round Bar, 25mm x 6M g40", qty: 30, unitCost: 820, customerName: "PRIME BUILDERS CORP.", totalQtyOut: 10, remarks: "" },
  { id: 9, date: "2026-01-14", drNo: "DR25400", sku: "", item: "Sheet Pile T3, 400mm x 125mm x 13mm x 60kg/m x 12M", qty: 20, unitCost: 28271, customerName: "SUNWAY CONSTRUCTION INC.", totalQtyOut: 0, remarks: "Awaiting pickup" },
  { id: 10, date: "2026-02-10", drNo: "DR25600", sku: "SHPT2", item: "Sheet Pile T2, 400mm x 100mm x 10.5mm x 12M", qty: 15, unitCost: 22529, customerName: "AREMAR CONSTRUCTION CORP.", totalQtyOut: 5, remarks: "Partial delivery" },
  { id: 11, date: "2026-03-01", drNo: "DR25800", sku: "DRB052", item: "Deformed Round Bar, 16mm x 6M g40", qty: 200, unitCost: 346.73, customerName: "EGB/SANRAY CONSTRUCTION", totalQtyOut: 200, remarks: "Fully released" },
  { id: 12, date: "2026-03-15", drNo: "DR26001", sku: "MSP010", item: "MS Plate, 6mm x 4' x 8'", qty: 50, unitCost: 554.79, customerName: "ADVANCE INNOVATION CONSTRUCTION", totalQtyOut: 0, remarks: "" },
];

const PAGE_SIZE = 8;

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

function fmtPHP(n) {
  if (!n && n !== 0) return "—";
  return "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ─── QTY-OUT HISTORY SEED DATA ── */
const SEED_QTY_OUT = [
  { id: 1, itemId: 8,  qty: 10, date: "2025-12-10" },
  { id: 2, itemId: 10, qty: 5,  date: "2026-02-15" },
  { id: 3, itemId: 11, qty: 80, date: "2026-03-05" },
  { id: 4, itemId: 11, qty: 120, date: "2026-03-12" },
  { id: 5, itemId: 9,  qty: 3,  date: "2026-01-20" },
];

/* ─── ICONS ── */
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
function IconEdit({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
}
function IconCheck({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
}
function IconX({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}

/* ─── ADD ENTRY MODAL ── */
function AddEntryModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    drNo: "", sku: "", item: "", qty: "", unitCost: "", customerName: "", remarks: "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.item || !form.qty || !form.customerName) {
      alert("Item, Quantity, and Customer Name are required.");
      return;
    }
    onSave({
      ...form,
      qty: parseFloat(form.qty) || 0,
      unitCost: parseFloat(form.unitCost) || 0,
      totalQtyOut: 0,
    });
    onClose();
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={{ ...modalPanelStyle, width: "min(96vw, 560px)" }}>
        <div style={modalHeaderStyle}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={modalTitleStyle}>Start Backload Inventory</h2>
            <p style={{ ...modalSubtitleStyle, margin: "4px 0 0" }}>Add a new backload entry. Fields marked with * are required.</p>
          </div>
          <button type="button" onClick={onClose} style={modalCloseBtnStyle} aria-label="Close" onMouseEnter={(e) => { e.currentTarget.style.background = "#e5e7eb"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div><label style={modalLabelStyle}>Date</label><input type="date" value={form.date} onChange={e => set("date", e.target.value)} {...modalInput()} /></div>
            <div><label style={modalLabelStyle}>DR #</label><input value={form.drNo} onChange={e => set("drNo", e.target.value)} {...modalInput()} placeholder="e.g. DR26001" /></div>
            <div><label style={modalLabelStyle}>SKU</label><input value={form.sku} onChange={e => set("sku", e.target.value)} {...modalInput()} placeholder="e.g. DRB052" /></div>
            <div style={{ gridColumn: "1/-1" }}><label style={modalLabelStyle}>Item Description *</label><input value={form.item} onChange={e => set("item", e.target.value)} {...modalInput()} placeholder="e.g. Sheet Pile T2, 400mm x..." /></div>
            <div><label style={modalLabelStyle}>Quantity *</label><input type="number" value={form.qty} onChange={e => set("qty", e.target.value)} {...modalInput()} placeholder="0" /></div>
            <div><label style={modalLabelStyle}>Unit Cost (₱)</label><input type="number" value={form.unitCost} onChange={e => set("unitCost", e.target.value)} {...modalInput()} placeholder="0.00" /></div>
            <div style={{ gridColumn: "1/-1" }}><label style={modalLabelStyle}>Customer Name *</label><input value={form.customerName} onChange={e => set("customerName", e.target.value)} {...modalInput()} placeholder="e.g. AREMAR CONSTRUCTION CORP." /></div>
            <div style={{ gridColumn: "1/-1" }}><label style={modalLabelStyle}>Remarks</label><input value={form.remarks} onChange={e => set("remarks", e.target.value)} {...modalInput()} placeholder="Optional notes..." /></div>
          </div>
        </div>
        <div style={modalFooterStyle}>
          <button type="button" onClick={onClose} style={modalBtnSecondary}>Cancel</button>
          <button type="button" onClick={handleSave} style={modalBtnPrimary}>Save Entry</button>
        </div>
      </div>
    </div>
  );
}

/* ─── INLINE EDIT ROW ── */
function EditableRow({ row, onSave, onCancel, idx }) {
  const [draft, setDraft] = useState({ ...row });
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  return (
    <tr style={{ background: "#fffbf7", borderBottom: "1px solid #f3f4f6" }}>
      <td style={{ padding: "8px 12px", fontSize: 11, color: "#9ca3af" }}>{row.id}</td>
      <td style={{ padding: "8px 8px" }}><input type="date" value={draft.date} onChange={e => set("date", e.target.value)} {...modalCellInput({ width: 130 })} /></td>
      <td style={{ padding: "8px 8px" }}><input value={draft.drNo} onChange={e => set("drNo", e.target.value)} {...modalCellInput()} /></td>
      <td style={{ padding: "8px 8px" }}><input value={draft.sku} onChange={e => set("sku", e.target.value)} {...modalCellInput()} /></td>
      <td style={{ padding: "8px 8px" }}><input value={draft.item} onChange={e => set("item", e.target.value)} {...modalCellInput({ width: 200 })} /></td>
      <td style={{ padding: "8px 8px" }}><input type="number" min={0} value={draft.qty ?? ""} onChange={e => set("qty", parseFloat(e.target.value)||0)} {...modalCellInput({ width: 70, textAlign: "right" })} /></td>
      <td style={{ padding: "8px 8px" }}><input type="number" min={0} step="0.01" value={draft.unitCost ?? ""} onChange={e => set("unitCost", parseFloat(e.target.value)||0)} {...modalCellInput({ width: 100, textAlign: "right" })} /></td>
      <td style={{ padding: "8px 8px", textAlign: "right", fontSize: 12, color: "#374151", fontWeight: 600 }}>{fmtPHP(draft.qty * draft.unitCost)}</td>
      <td style={{ padding: "8px 8px" }}><input value={draft.customerName} onChange={e => set("customerName", e.target.value)} {...modalCellInput({ width: 160 })} /></td>
      <td style={{ padding: "8px 8px" }}><input type="number" min={0} value={draft.totalQtyOut ?? ""} onChange={e => set("totalQtyOut", parseFloat(e.target.value)||0)} {...modalCellInput({ width: 70, textAlign: "right" })} /></td>
      <td style={{ padding: "8px 8px", textAlign: "right", fontSize: 12, fontWeight: 700, color: draft.qty - draft.totalQtyOut > 0 ? "#111827" : "#9ca3af" }}>{draft.qty - draft.totalQtyOut}</td>
      <td style={{ padding: "8px 8px", textAlign: "right", fontSize: 12, color: "#374151" }}>{fmtPHP(draft.unitCost * (draft.qty - draft.totalQtyOut))}</td>
      <td style={{ padding: "8px 8px" }}><input value={draft.remarks} onChange={e => set("remarks", e.target.value)} {...modalCellInput()} /></td>
      <td style={{ padding: "8px 8px" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => onSave(draft)} style={{ padding: "5px 8px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700 }}><IconCheck size={12} /> Save</button>
          <button onClick={onCancel} style={{ padding: "5px 8px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 11 }}><IconX size={12} /></button>
        </div>
      </td>
    </tr>
  );
}

function useSheetJS() {
  return true; // XLSX is imported as a module, always available
}

const OUT_TRACK_PAIRS = 6;
const BL_MAIN_COLS = 13;
const BL_TOTAL_COLS = BL_MAIN_COLS + OUT_TRACK_PAIRS * 2;
const BL_HDR_ROW = 3;
const BL_DATA_START = 4;
/** Accounting-style: P symbol left, amount right in one cell */
const BL_PESO_FMT = '_-"P"* #,##0.00_-;_-"P"* "-"??_-;_-"P"* "-"??_-;_-@_-';

function formatBackloadExportDateTime(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatBackloadExportDate(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatBackloadShortDate(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${String(d.getDate()).padStart(2, "0")}-${months[d.getMonth()]}`;
}

function exportBackload(rows, qtyOutRecords = []) {
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
  const padRight = { horizontal: "right", vertical: "center", wrapText: false, indent: 1 };
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
      put(r, c, "P  -", "s", cell(sheetFill, padLeft, { font: f.body() }));
      return;
    }
    put(r, c, n, "n", cell(sheetFill, padMoney, { numFmt: BL_PESO_FMT }));
  };

  const now = formatBackloadExportDateTime();

  put(0, 0, "TDT", "s", { font: f.brand(), alignment: padLeft, fill: sheetFill });
  put(0, 1, "POWERSTEEL", "s", { font: f.brandDark(), alignment: { ...padLeft, indent: 0 }, fill: sheetFill });
  put(0, 2, "THE NO. 1 STEEL SUPPLIER", "s", { font: f.tagline(), alignment: padLeft, fill: sheetFill });
  put(1, 0, "BACKLOAD INVENTORY SUMMARY", "s", { font: f.title(), alignment: padLeft, fill: sheetFill });
  put(2, 0, `AS OF THIS DATE OF: ${now}`, "s", { font: f.meta(), alignment: padLeft, fill: sheetFill });

  const mainHdrs = [
    "TRANS", "INSERT DATE", "INSERT DR #", "SKU", "ITEM", "INSERT QTY",
    "INSERT UNIT COST", "TOTAL COST", "CUSTOMER'S NAME",
    "TOTAL QTY OUT", "QTY BALANCE", "AMOUNT BALANCE", "REMARKS",
  ];
  const outHdrs = [];
  for (let i = 0; i < OUT_TRACK_PAIRS; i++) outHdrs.push("QTY - OUT", "DATE");

  [...mainHdrs, ...outHdrs].forEach((h, ci) => {
    const isOutQty = ci >= BL_MAIN_COLS && (ci - BL_MAIN_COLS) % 2 === 0;
    const isOutDate = ci >= BL_MAIN_COLS && (ci - BL_MAIN_COLS) % 2 === 1;
    put(BL_HDR_ROW, ci, h, "s", {
      font: f.hdr(),
      fill: isOutQty ? greenFill : isOutDate ? peachFill : hdrFill,
      alignment: padCenter,
      border: cellBorder,
    });
  });

  rows.forEach((r, i) => {
    const ri = BL_DATA_START + i;
    const qtyBal = (r.qty || 0) - (r.totalQtyOut || 0);
    const totalCost = (r.qty || 0) * (r.unitCost || 0);
    const amtBal = (r.unitCost || 0) * qtyBal;

    put(ri, 0, r.id ?? i + 1, "n", cell(sheetFill, padCenter, { font: f.body(true), numFmt: qtyFmt }));
    put(ri, 1, formatBackloadExportDate(r.date), "s", cell(sheetFill, padCenter));
    put(ri, 2, r.drNo || "", "s", cell(sheetFill, padCenter));
    put(ri, 3, r.sku || "", "s", cell(sheetFill, padCenter));
    put(ri, 4, r.item || "", "s", cell(sheetFill, padLeft, { font: f.item() }));
    put(ri, 5, r.qty ?? 0, "n", cell(sheetFill, padCenter, { font: f.body(true), numFmt: qtyFmt }));
    putMoney(ri, 6, r.unitCost);
    putMoney(ri, 7, totalCost);
    put(ri, 8, r.customerName || "", "s", cell(sheetFill, padLeft));
    put(ri, 9, r.totalQtyOut ?? 0, "n", cell(sheetFill, padCenter, { numFmt: qtyFmt }));
    put(ri, 10, qtyBal, "n", cell(sheetFill, padCenter, { font: f.body(true), numFmt: qtyFmt }));
    putMoney(ri, 11, amtBal);
    put(ri, 12, r.remarks || "", "s", cell(sheetFill, padLeft));

    for (let p = 0; p < OUT_TRACK_PAIRS; p++) {
      const qtyCol = BL_MAIN_COLS + p * 2;
      const dateCol = qtyCol + 1;
      const showFirst = p === 0 && (r.totalQtyOut || 0) > 0;
      put(
        ri, qtyCol,
        showFirst ? r.totalQtyOut : "",
        showFirst ? "n" : "s",
        cell(greenFill, padCenter, showFirst ? { numFmt: qtyFmt } : {})
      );
      put(
        ri, dateCol,
        showFirst ? formatBackloadShortDate(r.date) : "",
        "s",
        cell(peachFill, padCenter)
      );
    }
  });

  const lastRow = Math.max(BL_DATA_START + rows.length - 1, BL_HDR_ROW);
  const lastCol = BL_TOTAL_COLS - 1;
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
  for (let i = 0; i < OUT_TRACK_PAIRS; i++) outCols.push({ wch: 10 }, { wch: 11 });
  ws["!cols"] = [
    { wch: 6 },
    { wch: 13 },
    { wch: 12 },
    { wch: 10 },
    { wch: 50 },
    { wch: 11 },
    { wch: 17 },
    { wch: 17 },
    { wch: 36 },
    { wch: 12 },
    { wch: 12 },
    { wch: 17 },
    { wch: 34 },
    ...outCols,
  ];

  const dataRowH = 34;
  ws["!rows"] = [
    { hpt: 26 },
    { hpt: 24 },
    { hpt: 20 },
    { hpt: 46 },
    ...rows.map(() => ({ hpt: dataRowH })),
  ];

  XLSX.utils.book_append_sheet(wb, ws, "BACKLOAD INVENTORY");

  /* ─── QTY-OUT HISTORY SHEET ── */
  if (qtyOutRecords.length > 0) {
    const ws2 = {};
    const put2 = (r, c, v, t, style) => { ws2[C(r, c)] = { v: v ?? "", t: t || (typeof v === "number" ? "n" : "s"), s: style }; };
    const qtyOutHdrs = ["ITEM"];
    for (let i = 0; i < OUT_TRACK_PAIRS; i++) qtyOutHdrs.push("QTY-OUT", "DATE");

    const sheetFill2 = { patternType: "solid", fgColor: { rgb: "FFF9E6" } };
    const greenFill2 = { patternType: "solid", fgColor: { rgb: "E2EFDA" } };
    const peachFill2 = { patternType: "solid", fgColor: { rgb: "FCE4D6" } };
    const hdrFill2 = { patternType: "solid", fgColor: { rgb: "D6DCE4" } };
    const cellBorder2 = {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    };
    const cell2 = (fill, alignment, extra = {}) => ({ font: f.body(), fill, alignment, border: cellBorder2, ...extra });

    put2(0, 0, "TDT", "s", { font: f.brand(), alignment: padLeft, fill: sheetFill2 });
    put2(0, 1, "POWERSTEEL", "s", { font: f.brandDark(), alignment: { ...padLeft, indent: 0 }, fill: sheetFill2 });
    put2(1, 0, "QTY-OUT HISTORY", "s", { font: f.title(), alignment: padLeft, fill: sheetFill2 });
    put2(2, 0, `AS OF THIS DATE OF: ${now}`, "s", { font: f.meta(), alignment: padLeft, fill: sheetFill2 });

    const qtyOutHdrStyle = (ci) => ({
      font: f.hdr(),
      fill: ci === 0 ? hdrFill2 : (ci - 1) % 2 === 1 ? greenFill2 : peachFill2,
      alignment: padCenter,
      border: cellBorder2,
    });
    qtyOutHdrs.forEach((h, ci) => put2(4, ci, h, "s", qtyOutHdrStyle(ci)));

    const itemIds = [...new Set(qtyOutRecords.map(r => r.itemId))];
    itemIds.forEach((itemId, idx) => {
      const ri = 5 + idx;
      const item = rows.find(r => r.id === itemId);
      put2(ri, 0, item?.item || `Item #${itemId}`, "s", cell2(sheetFill2, padLeft, { font: f.item() }));
      const itemRecords = qtyOutRecords.filter(r => r.itemId === itemId);
      for (let p = 0; p < OUT_TRACK_PAIRS; p++) {
        const rec = itemRecords[p];
        const qtyCol = 1 + p * 2;
        const dateCol = qtyCol + 1;
        if (rec) {
          put2(ri, qtyCol, rec.qty, "n", cell2(greenFill2, padCenter, { font: f.body(true), numFmt: qtyFmt }));
          put2(ri, dateCol, formatBackloadShortDate(rec.date), "s", cell2(peachFill2, padCenter));
        } else {
          put2(ri, qtyCol, "", "s", cell2(greenFill2, padCenter));
          put2(ri, dateCol, "", "s", cell2(peachFill2, padCenter));
        }
      }
    });

    const lastRow2 = 4 + itemIds.length;
    const lastCol2 = 1 + OUT_TRACK_PAIRS * 2;
    ws2["!ref"] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: lastRow2, c: lastCol2 });
    for (let r = 0; r <= lastRow2; r++) {
      for (let c = 0; c <= lastCol2; c++) {
        if (!ws2[C(r, c)]) put2(r, c, "", "s", { fill: sheetFill2, border: cellBorder2, alignment: padCenter });
      }
    }
    ws2["!merges"] = [
      { s: { r: 0, c: 1 }, e: { r: 0, c: lastCol2 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: lastCol2 } },
    ];
    ws2["!cols"] = [
      { wch: 50 },
      ...Array.from({ length: OUT_TRACK_PAIRS }, () => [{ wch: 10 }, { wch: 13 }]).flat(),
    ];
    ws2["!rows"] = [
      { hpt: 26 }, { hpt: 24 }, { hpt: 20 }, { hpt: 12 }, { hpt: 46 },
      ...itemIds.map(() => ({ hpt: 34 })),
    ];
    XLSX.utils.book_append_sheet(wb, ws2, "QTY-OUT HISTORY");
  }

  XLSX.writeFile(wb, "TDT_Backload_Inventory_Summary.xlsx");
}

async function importBackload(file, onDone, onError) {
  try {
    const { raw } = await readWorkbookSheet(file, ["BACKLOAD"]);
    const headerIdx = findHeaderRowIndex(raw, ["TRANS"], 20);
    const dataStart = headerIdx >= 0 ? headerIdx + 1 : 6;
    const headers = headerIdx >= 0 ? raw[headerIdx] : null;
    const parsed = [];

    for (let i = dataStart; i < raw.length; i++) {
      const r = raw[i];
      if (!rowHasData(r)) continue;

      // Column order matches exportBackload exactly:
      // 0=TRANS, 1=INSERT DATE, 2=INSERT DR #, 3=SKU, 4=ITEM,
      // 5=INSERT QTY, 6=INSERT UNIT COST, 7=TOTAL COST, 8=CUSTOMER'S NAME,
      // 9=TOTAL QTY OUT, 10=QTY BALANCE, 11=AMOUNT BALANCE, 12=REMARKS
      const transOrId = cellStr(pickCol(r, headers, ["TRANS"], 0));
      const item = cellStr(pickCol(r, headers, ["ITEM"], 4));
      const customer = cellStr(pickCol(r, headers, ["CUSTOMER"], 8));
      if (!transOrId && !item && !customer) continue;

      parsed.push({
        id: parseRowId(transOrId, parsed.length + 1),
        date: formatExcelDate(pickCol(r, headers, ["INSERT DATE", "DATE"], 1)),
        drNo: cellStr(pickCol(r, headers, ["INSERT DR", "DR"], 2)),
        sku: cellStr(pickCol(r, headers, ["SKU"], 3)),
        item,
        qty: cellNum(pickCol(r, headers, ["INSERT QTY", "QTY"], 5)),
        unitCost: cellNum(pickCol(r, headers, ["INSERT UNIT COST", "UNIT COST"], 6)),
        customerName: customer,
        totalQtyOut: cellNum(pickCol(r, headers, ["TOTAL QTY OUT"], 9)),
        remarks: cellStr(pickCol(r, headers, ["REMARKS"], 12)),
      });
    }

    if (!parsed.length) throw new Error("No data rows found. Check that TRANS NO / ITEM columns are filled.");
    onDone(parsed);
  } catch (err) {
    onError(err.message || "Import failed.");
  }
}

/* ─── MAIN PAGE ── */
export default function BackloadInventoryPage() {
  const xlsxReady = useSheetJS();
  const [data, setData] = useState(SEED_BACKLOAD);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [importing, setImporting] = useState(false);
  const { sortBy, setSortBy, applySort } = useSort("date", "item");
  const [sortOpen, setSortOpen] = useState(false);
  const [backloadTab, setBackloadTab] = useState("summary");
  const [qtyOutRecords, setQtyOutRecords] = useState(SEED_QTY_OUT);
  const [qtyOutSlotCount, setQtyOutSlotCount] = useState(5);
  const [editingQtyOutItem, setEditingQtyOutItem] = useState(null);
  const [qtyOutDraft, setQtyOutDraft] = useState({});
  const nextId = useRef(SEED_BACKLOAD.length + 1);
  const nextQtyOutId = useRef(SEED_QTY_OUT.length + 1);
  const importFileRef = useRef(null);

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    importBackload(
      file,
      (parsed) => {
        setImporting(false);
        setData(parsed);
        nextId.current = Math.max(...parsed.map((r) => r.id), 0) + 1;
        setCurrentPage(1);
        showToast(`Imported ${parsed.length} entries successfully.`);
        e.target.value = "";
      },
      (err) => {
        setImporting(false);
        showToast(`Import failed: ${err}`, "error");
        e.target.value = "";
      }
    );
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const filtered = useMemo(() => {
    let rows = data;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(
        (r) =>
          (r.item || "").toLowerCase().includes(q) ||
          (r.sku || "").toLowerCase().includes(q) ||
          (r.drNo || "").toLowerCase().includes(q) ||
          (r.customerName || "").toLowerCase().includes(q)
      );
    }
    if (dateRange.start) rows = rows.filter((r) => (r.date || "") >= dateRange.start);
    if (dateRange.end)   rows = rows.filter((r) => (r.date || "") <= dateRange.end);
    return rows;
  }, [data, searchQuery, dateRange]);

  const sorted = useMemo(() => applySort(filtered), [filtered, sortBy]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE);

  const handleSaveEdit = (updated) => {
    setData(d => d.map(r => r.id === updated.id ? updated : r));
    setEditingId(null);
    showToast("Entry updated successfully.");
  };

  const handleAddEntry = (entry) => {
    const newEntry = { ...entry, id: nextId.current++ };
    setData(d => [newEntry, ...d]);
    showToast("New backload entry added.");
  };

  // Summary stats
  const totalEntries = data.length;
  const totalValue = data.reduce((s, r) => s + (r.qty * r.unitCost), 0);
  const qtyOutTotals = useMemo(() => {
    const m = {};
    qtyOutRecords.forEach(r => { m[r.itemId] = (m[r.itemId] || 0) + r.qty; });
    return m;
  }, [qtyOutRecords]);
  const totalBalance = data.reduce((s, r) => s + ((r.qty - (qtyOutTotals[r.id] || 0)) * r.unitCost), 0);
  const totalQtyBalance = data.reduce((s, r) => s + (r.qty - (qtyOutTotals[r.id] || 0)), 0);

const COLS = [
  { label: "TRANS NO.",      align: "center" },
  { label: "DATE",           align: "center" },
  { label: "DR #",           align: "center" },
  { label: "SKU",            align: "center" },
  { label: "ITEM",           align: "center"   },
  { label: "QTY",            align: "center" },
  { label: "UNIT COST",      align: "center" },
  { label: "TOTAL COST",     align: "center" },
  { label: "CUSTOMER NAME",  align: "left"   },
  { label: "TOTAL QTY OUT",  align: "center" },
  { label: "QTY BALANCE",    align: "center" },
  { label: "AMOUNT BALANCE", align: "center" },
  { label: "REMARKS",        align: "left"   },
  { label: "",               align: "center" },
];
  return (
    <div style={{ background: "#f0f2f5", padding: "28px 32px 40px", display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
        <MetricCard
          icon={<IconBox size={34} />}
          iconBg="#F95B02" iconColor="#ffffff"
          label="Total Entries"
          value={String(totalEntries)}
          badge={{ text: "All backload records", color: "#16a34a", bg: "#dcfce7" }}
        />
        <MetricCard
          icon={<IconTruck size={28} />}
          iconBg="#F95B02" iconColor="#ffffff"
          label="Total Qty Balance"
          value={String(totalQtyBalance)}
          badge={{ text: "Remaining qty across all entries", color: "#d97706", bg: "#fef3c7" }}
        />
        <MetricCard
          icon={<IconBarChart size={30} />}
          iconBg="#F95B02" iconColor="#ffffff"
          label="Total Backload Value"
          value={formatCompactPHP(totalValue)}
          badge={{ text: fmtPHP(totalValue), color: "#e87c27", bg: "transparent" }}
        />
        <MetricCard
          icon={<IconBag size={30} />}
          iconBg="#F95B02" iconColor="#ffffff"
          label="Total Balance Amount"
          value={formatCompactPHP(totalBalance)}
          badge={{ text: fmtPHP(totalBalance), color: "#16a34a", bg: "#dcfce7" }}
        />
      </div>

      <PageToolbar
        searchValue={searchQuery}
        onSearchChange={(v) => { setSearchQuery(v); setCurrentPage(1); }}
        filters={[]}
        primaryAction={{ label: "Start Backload Inventory", onClick: () => setShowModal(true) }}
        dateRange={dateRange}
        onDateRangeChange={(r) => { setDateRange(r); setCurrentPage(1); }}
        importExport={{
          fileInputRef: importFileRef,
          onFileChange: handleImport,
          importing,
          importDisabled: !xlsxReady,
          onExport: () => exportBackload(data, qtyOutRecords),
        }}
      />

      <div style={{ display: "flex", gap: 4, borderBottom: "2px solid #e5e7eb", background: "#fff", borderRadius: "12px 12px 0 0", padding: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", position: "relative", zIndex: 1 }}>
        {[["summary","Backload Inventory Summary"],["qtyout","Qty-Out History"]].map(([key,label]) => (
          <button key={key} onClick={() => { setBackloadTab(key); setCurrentPage(1); }} style={{ padding: "14px 20px", background: "none", border: "none", cursor: "pointer", borderBottom: backloadTab===key?"3px solid #e87c27":"3px solid transparent", color: backloadTab===key?"#e87c27":"#9ca3af", fontSize: 14, fontWeight: 700, marginBottom: -2, fontFamily: "inherit" }}>{label}</button>
        ))}
      </div>

      {/* Table */}
      {backloadTab === "summary" && (
      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>
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
<table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>            <thead>
              <tr style={{ background: "#1c2235" }}>
             {COLS.map(col => (
  <th key={col.label} style={{ padding: "14px 12px", textAlign: col.align, color: "#fff", fontWeight: 700, fontSize: 11, whiteSpace: "nowrap" }}>{col.label}</th>
))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr><td colSpan={COLS.length} style={{ textAlign: "center", padding: 48, color: "#9ca3af", fontSize: 14 }}>No backload entries found.</td></tr>
              )}
              {paged.map((row, idx) => {
                if (editingId === row.id) {
                  return <EditableRow key={row.id} row={row} idx={idx} onSave={handleSaveEdit} onCancel={() => setEditingId(null)} />;
                }
                const totalCost = row.qty * row.unitCost;
                const rowTotalQtyOut = qtyOutTotals[row.id] || 0;
                const qtyBalance = row.qty - rowTotalQtyOut;
                const amtBalance = row.unitCost * qtyBalance;
                return (
                  <tr key={row.id}
                    style={{ borderBottom: "1px solid #f3f4f6", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fef6f2"}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#fafafa"}
                  >
                    <td style={{ padding: "12px 12px", color: "#9ca3af", fontSize: 11, textAlign: "center" }}>{row.id}</td>
                    <td style={{ padding: "12px 12px", color: "#6b7280", whiteSpace: "nowrap", textAlign: "center" }}>{formatBackloadExportDate(row.date)}</td>
                    <td style={{ padding: "12px 12px", color: "#e87c27", fontWeight: 700, textAlign: "center" }}><Highlight text={row.drNo || "—"} query={searchQuery} /></td>
                    <td style={{ padding: "12px 12px", color: "#374151", textAlign: "center" }}><Highlight text={row.sku || "—"} query={searchQuery} /></td>
<td title={row.item} style={{ padding: "12px 12px", color: "#374151", maxWidth: 220, minWidth: 180, textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: "default" }}>
  <Highlight text={row.item} query={searchQuery} />
</td>              <td style={{ padding: "12px 12px", textAlign: "center", fontWeight: 700 }}>{row.qty}</td>
                    <td style={{ padding: "12px 12px", textAlign: "center" }}>{fmtPHP(row.unitCost)}</td>
                    <td style={{ padding: "12px 12px", textAlign: "center", fontWeight: 600 }}>{fmtPHP(totalCost)}</td>
<td title={row.customerName} style={{ padding: "12px 12px", color: "#374151", maxWidth: 160, minWidth: 120, textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: "default" }}>
  <Highlight text={row.customerName} query={searchQuery} />
</td>                    <td style={{ padding: "12px 12px", textAlign: "center", fontWeight: rowTotalQtyOut > 0 ? 700 : 400, color: rowTotalQtyOut > 0 ? "#dc2626" : "#9ca3af" }}>{rowTotalQtyOut > 0 ? rowTotalQtyOut : "0"}</td>
                    <td style={{ padding: "12px 12px", textAlign: "center" }}>
                      <span style={{ padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: qtyBalance > 0 ? "#fef3c7" : "#d1fae5", color: qtyBalance > 0 ? "#d97706" : "#065f46" }}>{qtyBalance}</span>
                    </td>
                    <td style={{ padding: "12px 12px", textAlign: "center", fontWeight: 600 }}>{fmtPHP(amtBalance)}</td>
<td title={row.remarks || ""} style={{ padding: "12px 12px", color: "#6b7280", maxWidth: 160, minWidth: 100, fontSize: 11, textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: "default" }}>
  {row.remarks || "—"}
</td>              <td style={{ padding: "12px 8px", textAlign: "center" }}>
                      <button onClick={() => setEditingId(row.id)} style={{ padding: "5px 10px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600 }}>
                        <IconEdit size={12} /> Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderTop: "1px solid #f3f4f6", background: "#fafafa", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            Showing {sorted.length === 0 ? 0 : (currentPage-1)*PAGE_SIZE+1}–{Math.min(currentPage*PAGE_SIZE, sorted.length)} of {sorted.length} entries
          </span>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}
              style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", color: "#374151", cursor: currentPage===1?"not-allowed":"pointer", opacity: currentPage===1?0.4:1 }}>
              <IconChevronLeft size={14} />
            </button>
            {Array.from({length: totalPages}, (_, i) => i+1).slice(0, 10).map(n => (
              <button key={n} onClick={() => setCurrentPage(n)}
                style={{ width: 30, height: 30, border: n===currentPage?"none":"1px solid #e5e7eb", borderRadius: 6, background: n===currentPage?"#e87c27":"#fff", color: n===currentPage?"#fff":"#374151", cursor: "pointer", fontWeight: n===currentPage?700:400, fontSize: 12 }}>
                {n}
              </button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}
              style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", color: "#374151", cursor: currentPage===totalPages?"not-allowed":"pointer", opacity: currentPage===totalPages?0.4:1 }}>
              <IconChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
      )}

      {/* QTY-OUT HISTORY */}
      {backloadTab === "qtyout" && (
      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", background: "#1c2235", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: "0.02em" }}>QTY-OUT HISTORY</h3>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#93a3c7", fontWeight: 600 }}>Pairs: {qtyOutSlotCount}</span>
            <button onClick={() => setQtyOutSlotCount(s => Math.min(20, s + 1))} title="Add QTY-OUT/DATE column pair" style={{ padding: "5px 12px", border: "1px solid #16a34a", borderRadius: 5, background: "#f0fdf4", cursor: "pointer", fontSize: 12, color: "#16a34a", fontWeight: 700, fontFamily: "inherit", lineHeight: 1 }}>+ Add Pair</button>
            <button onClick={() => setQtyOutSlotCount(s => Math.max(1, s - 1))} title="Remove last column pair" disabled={qtyOutSlotCount <= 1} style={{ padding: "5px 12px", border: "1px solid #ef4444", borderRadius: 5, background: "#fef2f2", cursor: qtyOutSlotCount <= 1 ? "not-allowed" : "pointer", fontSize: 12, color: "#ef4444", fontWeight: 700, fontFamily: "inherit", lineHeight: 1, opacity: qtyOutSlotCount <= 1 ? 0.4 : 1 }}>− Remove Pair</button>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          {(() => {
            if (filtered.length === 0) {
              return <div style={{ textAlign: "center", padding: 48, color: "#9ca3af", fontSize: 14 }}>No inventory items match the current search.</div>;
            }
            const slots = qtyOutSlotCount;
            const itemEntries = filtered.map(item => ({
              item,
              entries: qtyOutRecords.filter(r => r.itemId === item.id),
            }));
            const overallTotalQtyOut = itemEntries.reduce((s, g) => s + g.entries.reduce((ss, e) => ss + e.qty, 0), 0);
            return (
              <div>
                <div style={{ padding: "8px 20px", borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>Edit a row below to record stock withdrawals (Qty Out / Date). New entries auto-deduct from available balance.</span>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#1c2235" }}>
                      <th rowSpan={2} style={{ padding: "12px 14px", color: "#fff", fontWeight: 700, fontSize: 10, whiteSpace: "nowrap", textAlign: "center", borderRight: "1px solid #2a3450", minWidth: 200 }}>ITEM</th>
                      <th colSpan={slots * 2} style={{ padding: "12px 14px", color: "#fff", fontWeight: 700, fontSize: 10, textAlign: "center", borderBottom: "1px solid #2a3450" }}>QTY-OUT / DATE RECORDS</th>
                      <th rowSpan={2} style={{ padding: "12px 14px", color: "#fff", fontWeight: 700, fontSize: 10, whiteSpace: "nowrap", textAlign: "center", borderLeft: "1px solid #2a3450", minWidth: 80 }}>TOTAL QTY OUT</th>
                      <th rowSpan={2} style={{ padding: "12px 14px", color: "#fff", fontWeight: 700, fontSize: 10, whiteSpace: "nowrap", textAlign: "center", borderLeft: "1px solid #2a3450", minWidth: 60 }}>ACTION</th>
                    </tr>
                    <tr style={{ background: "#1c2235" }}>
                      {Array.from({ length: slots }, (_, i) => (
                        <>
                          <th style={{ padding: "10px 10px", color: "#93a3c7", fontWeight: 600, fontSize: 9, whiteSpace: "nowrap", textAlign: "center", borderRight: "1px solid #2a3450" }}>QTY-OUT</th>
                          <th style={{ padding: "10px 10px", color: "#93a3c7", fontWeight: 600, fontSize: 9, whiteSpace: "nowrap", textAlign: "center" }}>DATE</th>
                        </>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {itemEntries.map((g, gi) => {
                      const isEditing = editingQtyOutItem === g.item.id;
                      return (
                        <tr key={g.item.id}
                          style={{ borderBottom: "1px solid #f3f4f6", background: isEditing ? "#fffbf7" : gi % 2 === 0 ? "#fff" : "#fafafa" }}
                        >
                          <td style={{ padding: "10px 14px", color: "#111827", fontWeight: 600, fontSize: 12, textAlign: "left", borderRight: "1px solid #f3f4f6", maxWidth: 300, minWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={g.item.item}>{g.item.item}</td>
                          {Array.from({ length: slots }, (_, slotIdx) => {
                            const entry = g.entries[slotIdx];
                            if (isEditing) {
                              return (
                                <>
                                  <td style={{ padding: "4px 6px", borderRight: "1px solid #f3f4f6" }}>
                                    <input type="number" min={0} value={qtyOutDraft[`${g.item.id}-${slotIdx}-qty`] ?? entry?.qty ?? ""} onChange={e => setQtyOutDraft(d => ({ ...d, [`${g.item.id}-${slotIdx}-qty`]: parseFloat(e.target.value) || "" }))} placeholder="Qty" {...modalCellInput({ width: 65, textAlign: "right" })} />
                                  </td>
                                  <td style={{ padding: "4px 6px" }}>
                                    <input type="date" value={qtyOutDraft[`${g.item.id}-${slotIdx}-date`] ?? entry?.date ?? ""} onChange={e => setQtyOutDraft(d => ({ ...d, [`${g.item.id}-${slotIdx}-date`]: e.target.value }))} {...modalCellInput({ width: 120 })} />
                                  </td>
                                </>
                              );
                            }
                            return (
                              <>
                                <td style={{ padding: "10px 10px", color: entry ? "#dc2626" : "#e5e7eb", fontWeight: entry ? 700 : 400, fontSize: 12, textAlign: "center", borderRight: "1px solid #f3f4f6", minWidth: 70 }}>{entry ? entry.qty : "—"}</td>
                                <td style={{ padding: "10px 10px", color: entry ? "#374151" : "#e5e7eb", fontWeight: entry ? 500 : 400, fontSize: 11, textAlign: "center", minWidth: 90 }}>{entry ? formatBackloadExportDate(entry.date) : "—"}</td>
                              </>
                            );
                          })}
                          <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 800, color: g.entries.reduce((s, e) => s + e.qty, 0) > 0 ? "#dc2626" : "#9ca3af", fontSize: 13, borderLeft: "1px solid #f3f4f6", background: isEditing ? "#fffbf7" : "#fef2f2" }}>{g.entries.reduce((s, e) => s + e.qty, 0)}</td>
                          <td style={{ padding: "8px 8px", textAlign: "center" }}>
                            {isEditing ? (
                              <div style={{ display: "flex", gap: 3, flexDirection: "column", alignItems: "center" }}>
                                <button onClick={() => {
                                  const draft = { ...qtyOutDraft };
                                  const newEntries = [];
                                  for (let i = 0; i < slots; i++) {
                                    const q = parseFloat(draft[`${g.item.id}-${i}-qty`]);
                                    const d = draft[`${g.item.id}-${i}-date`] || "";
                                    if (q > 0 || d) {
                                      const existing = g.entries[i];
                                      newEntries.push({
                                        id: existing ? existing.id : nextQtyOutId.current++,
                                        itemId: g.item.id,
                                        qty: q || 0,
                                        date: d || existing?.date || "",
                                      });
                                    }
                                  }
                                  setQtyOutRecords(prev => {
                                    const other = prev.filter(r => r.itemId !== g.item.id);
                                    return [...other, ...newEntries];
                                  });
                                  setEditingQtyOutItem(null);
                                  setQtyOutDraft({});
                                  showToast("Qty-Out History updated. Balances auto-adjusted.");
                                }} title="Save" style={{ padding: "4px 7px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", fontSize: 11, fontWeight: 600, fontFamily: "inherit", gap: 2 }}>✓ Save</button>
                                <button onClick={() => { setEditingQtyOutItem(null); setQtyOutDraft({}); }} title="Cancel" style={{ padding: "4px 7px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", fontSize: 11, fontWeight: 600, fontFamily: "inherit", gap: 2 }}>✕ Cancel</button>
                              </div>
                            ) : (
                              <button onClick={() => { setEditingQtyOutItem(g.item.id); setQtyOutDraft({}); }} title="Edit" style={{ padding: "4px 7px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 4, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 2, fontSize: 10, fontWeight: 600, fontFamily: "inherit" }}><IconEdit size={11} /> Edit</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    <tr style={{ background: "#1c2235" }}>
                      <td style={{ padding: "12px 14px", fontWeight: 800, color: "#fff", fontSize: 12, textAlign: "left", borderRight: "1px solid #2a3450" }}>GRAND TOTAL</td>
                      {Array.from({ length: slots * 2 }, (_, i) => (
                        <td key={i} style={{ padding: "10px", textAlign: "center", color: "#93a3c7", fontSize: 11, borderRight: i < slots * 2 - 1 ? "1px solid #2a3450" : "none" }}></td>
                      ))}
                      <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: 800, color: "#fca5a5", fontSize: 14, borderLeft: "1px solid #2a3450", background: "#2a3450" }}>{overallTotalQtyOut}</td>
                      <td style={{ padding: "12px 14px", borderLeft: "1px solid #2a3450" }}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      </div>
      )}

      {showModal && <AddEntryModal onClose={() => setShowModal(false)} onSave={handleAddEntry} />}
      {toast && (
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, background: toast.type === "error" ? "#dc2626" : "#16a34a", color: "#fff", borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}