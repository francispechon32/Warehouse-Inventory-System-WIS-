import { useState, useRef, useMemo, useEffect, Fragment } from "react";
import XLSX from "xlsx-js-style";
import PageToolbar from "./PageToolbar";
import useSort from "./useSort";
import useApi from "./hooks/useApi";
import { ENDPOINTS } from "./api/apiConfig";
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
function IconGear({ size = 14 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>; }
function IconSave({ size = 14 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>; }

const BL_COLDEFS = [
  { key: "id",           label: "TRANS NO.",      sticky: true, alwaysVisible: true },
  { key: "date",         label: "DATE",           hideable: true },
  { key: "drNo",         label: "DR #",           hideable: true },
  { key: "sku",          label: "SKU",            hideable: true },
  { key: "item",         label: "ITEM",           alwaysVisible: true },
  { key: "qty",          label: "QTY",            alwaysVisible: true },
  { key: "unitCost",     label: "UNIT COST",      hideable: true },
  { key: "totalCost",    label: "TOTAL COST",     hideable: true },
  { key: "customerName", label: "CUSTOMER NAME",  alwaysVisible: true },
  { key: "totalQtyOut",  label: "TOTAL QTY OUT",  hideable: true },
  { key: "qtyBalance",   label: "QTY BALANCE",    alwaysVisible: true },
  { key: "amtBalance",   label: "AMOUNT BALANCE", hideable: true },
  { key: "remarks",      label: "REMARKS",        hideable: true },
];

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

const BL_MAIN_COLS = 13;
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

function exportBackload(rows, qtyOutRecords = [], slotCount = 5) {
  const wb = XLSX.utils.book_new();
  const pairs = slotCount;
  const BL_TOTAL_COLS = BL_MAIN_COLS + pairs * 2;
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
    for (let i = 0; i < pairs; i++) outHdrs.push("QTY - OUT", "DATE");

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

    for (let p = 0; p < pairs; p++) {
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
    { s: { r: 0, c: 2 }, e: { r: 0, c: lastCol } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: lastCol } },
  ];

  const outCols = [];
  for (let i = 0; i < pairs; i++) outCols.push({ wch: 10 }, { wch: 11 });
  ws["!cols"] = [
    { wch: 10 },  // TRANS / "TDT"
    { wch: 25},  // INSERT DATE / "POWERSTEEL" (sz:18 bold needs ~22)
    { wch: 30 },  // INSERT DR # / "THE NO. 1 STEEL SUPPLIER"
    { wch: 12 },  // SKU
    { wch: 52 },  // ITEM
    { wch: 12 },  // INSERT QTY
    { wch: 18 },  // INSERT UNIT COST
    { wch: 18 },  // TOTAL COST
    { wch: 38 },  // CUSTOMER'S NAME
    { wch: 14 },  // TOTAL QTY OUT
    { wch: 13 },  // QTY BALANCE
    { wch: 18 },  // AMOUNT BALANCE
    { wch: 36 },  // REMARKS
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
    for (let i = 0; i < pairs; i++) qtyOutHdrs.push("QTY-OUT", "DATE");

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
      for (let p = 0; p < pairs; p++) {
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
    const lastCol2 = 1 + pairs * 2;
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
      { wch: 52 },
      ...Array.from({ length: pairs }, () => [{ wch: 11 }, { wch: 14 }]).flat(),
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
    const qtyOutRecords = [];

    // detect QTY-OUT/DATE pair count from headers
    let qoPairs = 0;
    if (headers) {
      for (let c = 13; c < headers.length; c += 2) {
        const h = cellStr(headers[c]).toUpperCase();
        if (h === "QTY - OUT" || h === "QTY-OUT" || h.startsWith("QTY")) qoPairs++;
        else break;
      }
    }

    for (let i = dataStart; i < raw.length; i++) {
      const r = raw[i];
      if (!rowHasData(r)) continue;

      const transOrId = cellStr(pickCol(r, headers, ["TRANS"], 0));
      const item = cellStr(pickCol(r, headers, ["ITEM"], 4));
      const customer = cellStr(pickCol(r, headers, ["CUSTOMER"], 8));
      if (!transOrId && !item && !customer) continue;

      const parsedId = parseRowId(transOrId, parsed.length + 1);
      parsed.push({
        id: parsedId,
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

      // read QTY-OUT/DATE pairs
      for (let p = 0; p < qoPairs; p++) {
        const qtyCol = 13 + p * 2;
        const dateCol = qtyCol + 1;
        const qty = cellNum(r[qtyCol]);
        const date = formatExcelDate(r[dateCol]);
        if (qty > 0 || date) {
          qtyOutRecords.push({
            id: Date.now() + qtyOutRecords.length,
            itemId: parsedId,
            qty: qty || 0,
            date: date || "",
          });
        }
      }
    }

    if (!parsed.length) throw new Error("No data rows found. Check that TRANS NO / ITEM columns are filled.");
    onDone({ items: parsed, qtyOutRecords });
  } catch (err) {
    onError(err.message || "Import failed.");
  }
}

/* ─── MAIN PAGE ── */
export default function BackloadInventoryPage() {
  const xlsxReady = useSheetJS();
  const api = useApi(ENDPOINTS.backloadInventory, SEED_BACKLOAD);
  useEffect(() => { api.getAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const data    = api.data;
  const setData = null;
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

  /* ── column visibility ── */
  const [hiddenCols, setHiddenCols] = useState(new Set());
  const [colVisOpen, setColVisOpen] = useState(false);
  const colVisRef = useRef(null);
  useEffect(() => {
    if (!colVisOpen) return;
    const handler = (e) => { if (colVisRef.current && !colVisRef.current.contains(e.target)) setColVisOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [colVisOpen]);
  const toggleCol = (key) => setHiddenCols(prev => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  const visibleBLCols = BL_COLDEFS.filter(c => c.alwaysVisible || !hiddenCols.has(c.key));

  /* ── edit drawer ── */
  const [editDrawerRow, setEditDrawerRow] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const openEditDrawer = (row) => { setEditDrawerRow(row); setEditDraft({ ...row }); };
  const closeEditDrawer = () => { setEditDrawerRow(null); setEditDraft(null); };
  const handleSaveDrawer = async () => {
    if (!editDraft) return;
    await handleSaveEdit(editDraft, true);
    closeEditDrawer();
    showToast("Entry updated successfully.");
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    importBackload(
      file,
      async (result) => {
        const parsed = result.items || result;
        const qo = result.qtyOutRecords || [];
        try {
          await api.bulkReplace(parsed);
          if (qo.length) setQtyOutRecords(qo);
          nextId.current = Math.max(...parsed.map((r) => r.id), 0) + 1;
          setCurrentPage(1);
          showToast(`Imported ${parsed.length} entries (${qo.length} qty-out records).`);
        } catch {
          showToast("Import succeeded but failed to save.", "error");
        } finally {
          setImporting(false);
          e.target.value = "";
        }
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

  const handleSaveEdit = async (updated, silent = false) => {
    try {
      await api.update(updated.id, updated);
      setEditingId(null);
      if (!silent) showToast("Entry updated successfully.");
    } catch {
      if (!silent) showToast("Failed to save changes.", "error");
    }
  };

  const handleAddEntry = async (entry) => {
    try {
      await api.create(entry);
      showToast("New backload entry added.");
    } catch {
      showToast("Failed to add entry.", "error");
    }
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
          onExport: () => exportBackload(data, qtyOutRecords, qtyOutSlotCount),
        }}
      />

      <div style={{ display: "flex", gap: 4, borderBottom: "2px solid #e5e7eb", background: "#fff", borderRadius: "12px 12px 0 0", padding: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", position: "relative", zIndex: 1 }}>
        {[["summary","Backload Inventory Summary"],["qtyout","Qty-Out History"]].map(([key,label]) => (
          <button key={key} onClick={() => { setBackloadTab(key); setCurrentPage(1); }} style={{ padding: "14px 20px", background: "none", border: "none", cursor: "pointer", borderBottom: backloadTab===key?"3px solid #e87c27":"3px solid transparent", color: backloadTab===key?"#e87c27":"#9ca3af", fontSize: 14, fontWeight: 700, marginBottom: -2, fontFamily: "inherit" }}>{label}</button>
        ))}
      </div>

      {/* Table */}
      {backloadTab === "summary" && (
      <div style={{ background: "#fff", borderRadius: "0 0 14px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", position: "relative" }}>
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
          <div ref={colVisRef} style={{ position: "relative", marginLeft: "auto" }}>
            <button onClick={() => setColVisOpen(o => !o)} style={{ padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, background: colVisOpen ? "#f3f4f6" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontFamily: "inherit", color: "#374151", fontWeight: 600 }}>
              <IconGear size={13} /> Columns
            </button>
            {colVisOpen && (
              <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 50, minWidth: 180, padding: "8px 0" }}>
                {BL_COLDEFS.filter(c => c.hideable).map(c => (
                  <label key={c.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", cursor: "pointer", fontSize: 12, color: "#374151", fontFamily: "inherit" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                    onMouseLeave={e => e.currentTarget.style.background = ""}
                  >
                    <input type="checkbox" checked={!hiddenCols.has(c.key)} onChange={() => toggleCol(c.key)} style={{ accentColor: "#e87c27" }} />
                    {c.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#1c2235" }}>
                {visibleBLCols.map(c => (
                  <th key={c.key} style={{
                    padding: "12px 10px", textAlign: "center", color: "#fff", fontWeight: 700, fontSize: 10, whiteSpace: "nowrap", letterSpacing: "0.04em",
                    ...(c.sticky ? { position: "sticky", left: 0, zIndex: 2, background: "#1c2235", boxShadow: "3px 0 5px rgba(0,0,0,0.15)" } : {}),
                  }}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr><td colSpan={visibleBLCols.length} style={{ textAlign: "center", padding: 48, color: "#9ca3af", fontSize: 14 }}>No backload entries found.</td></tr>
              )}
              {paged.map((row, idx) => {
                const rowBg = idx % 2 === 0 ? "#fff" : "#fafafa";
                const totalCost = row.qty * row.unitCost;
                const rowTotalQtyOut = qtyOutTotals[row.id] || 0;
                const qtyBalance = row.qty - rowTotalQtyOut;
                const amtBalance = row.unitCost * qtyBalance;
                return (
                  <tr key={row.id}
                    onClick={() => openEditDrawer(row)}
                    style={{ borderBottom: "1px solid #f5f5f6", background: rowBg, cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fef6f2"}
                    onMouseLeave={e => e.currentTarget.style.background = rowBg}
                  >
                    {visibleBLCols.map(c => {
                      if (c.key === "id") return (
                        <td key="id" style={{ padding: "14px 10px", color: "#9ca3af", fontSize: 11, textAlign: "center", position: "sticky", left: 0, zIndex: 1, background: rowBg, boxShadow: "3px 0 5px rgba(0,0,0,0.07)" }}>{row.id}</td>
                      );
                      if (c.key === "date") return (
                        <td key="date" style={{ padding: "14px 10px", color: "#6b7280", whiteSpace: "nowrap", textAlign: "center" }}>{formatBackloadExportDate(row.date)}</td>
                      );
                      if (c.key === "drNo") return (
                        <td key="drNo" style={{ padding: "14px 10px", color: "#e87c27", fontWeight: 700, textAlign: "center" }}><Highlight text={row.drNo || "—"} query={searchQuery} /></td>
                      );
                      if (c.key === "sku") return (
                        <td key="sku" style={{ padding: "14px 10px", color: "#374151", textAlign: "center" }}><Highlight text={row.sku || "—"} query={searchQuery} /></td>
                      );
                      if (c.key === "item") return (
                        <td key="item" title={row.item} style={{ padding: "14px 10px", color: "#374151", maxWidth: 200, minWidth: 150, textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          <Highlight text={row.item} query={searchQuery} />
                        </td>
                      );
                      if (c.key === "qty") return (
                        <td key="qty" style={{ padding: "14px 10px", textAlign: "center", fontWeight: 700 }}>{row.qty}</td>
                      );
                      if (c.key === "unitCost") return (
                        <td key="unitCost" style={{ padding: "14px 10px", textAlign: "center" }}>{fmtPHP(row.unitCost)}</td>
                      );
                      if (c.key === "totalCost") return (
                        <td key="totalCost" style={{ padding: "14px 10px", textAlign: "center", fontWeight: 600 }}>{fmtPHP(totalCost)}</td>
                      );
                      if (c.key === "customerName") return (
                        <td key="customerName" title={row.customerName} style={{ padding: "14px 10px", color: "#374151", maxWidth: 150, minWidth: 110, textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          <Highlight text={row.customerName} query={searchQuery} />
                        </td>
                      );
                      if (c.key === "totalQtyOut") return (
                        <td key="totalQtyOut" style={{ padding: "14px 10px", textAlign: "center", fontWeight: rowTotalQtyOut > 0 ? 700 : 400, color: rowTotalQtyOut > 0 ? "#dc2626" : "#9ca3af" }}>{rowTotalQtyOut > 0 ? rowTotalQtyOut : "0"}</td>
                      );
                      if (c.key === "qtyBalance") return (
                        <td key="qtyBalance" style={{ padding: "14px 10px", textAlign: "center" }}>
                          <span style={{ padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: qtyBalance > 0 ? "#fef3c7" : "#d1fae5", color: qtyBalance > 0 ? "#d97706" : "#065f46" }}>{qtyBalance}</span>
                        </td>
                      );
                      if (c.key === "amtBalance") return (
                        <td key="amtBalance" style={{ padding: "14px 10px", textAlign: "center", fontWeight: 600 }}>{fmtPHP(amtBalance)}</td>
                      );
                      if (c.key === "remarks") return (
                        <td key="remarks" title={row.remarks || ""} style={{ padding: "14px 10px", color: "#6b7280", maxWidth: 140, minWidth: 90, fontSize: 10, textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {row.remarks || "—"}
                        </td>
                      );
                      return null;
                    })}
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
            <button type="button" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}
              style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", color: "#374151", cursor: currentPage===1?"not-allowed":"pointer", opacity: currentPage===1?0.4:1 }}>
              <IconChevronLeft size={14} />
            </button>
            {Array.from({length: totalPages}, (_, i) => i+1).slice(0, 8).map(n => (
              <button key={n} type="button" onClick={() => setCurrentPage(n)}
                style={{ width: 30, height: 30, border: n===currentPage?"none":"1px solid #e5e7eb", borderRadius: 6, background: n===currentPage?"#e87c27":"#fff", color: n===currentPage?"#fff":"#374151", cursor: "pointer", fontWeight: n===currentPage?700:400, fontSize: 12 }}>
                {n}
              </button>
            ))}
            <button type="button" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}
              style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", color: "#374151", cursor: currentPage===totalPages?"not-allowed":"pointer", opacity: currentPage===totalPages?0.4:1 }}>
              <IconChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
      )}

      {/* QTY-OUT HISTORY */}
      {backloadTab === "qtyout" && (
      <div style={{ background: "#fff", borderRadius: "0 0 14px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px" }}>
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
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>QTY-OUT / DATE Pairs: {slots}</span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button onClick={() => setQtyOutSlotCount(s => Math.min(20, s + 1))} title="Add QTY-OUT/DATE column pair" style={{ padding: "4px 10px", border: "1px solid #16a34a", borderRadius: 5, background: "#f0fdf4", cursor: "pointer", fontSize: 13, color: "#16a34a", fontWeight: 700, fontFamily: "inherit", lineHeight: 1, display: "flex", alignItems: "center", gap: 4 }}>+ Add Pair</button>
                    <button onClick={() => setQtyOutSlotCount(s => Math.max(1, s - 1))} title="Remove last QTY-OUT/DATE column pair" disabled={qtyOutSlotCount <= 1} style={{ padding: "4px 10px", border: "1px solid #ef4444", borderRadius: 5, background: "#fef2f2", cursor: qtyOutSlotCount <= 1 ? "not-allowed" : "pointer", fontSize: 13, color: "#ef4444", fontWeight: 700, fontFamily: "inherit", lineHeight: 1, display: "flex", alignItems: "center", gap: 4, opacity: qtyOutSlotCount <= 1 ? 0.4 : 1 }}>− Remove Pair</button>
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
                        const isEditing = editingQtyOutItem === g.item.id;
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
                                      <input type="number" min={0} value={qtyOutDraft[`${g.item.id}-${slotIdx}-qty`] ?? entry?.qty ?? ""} onChange={e => setQtyOutDraft(d => ({ ...d, [`${g.item.id}-${slotIdx}-qty`]: parseFloat(e.target.value) || "" }))} placeholder="Qty" {...modalCellInput({ width: 65, textAlign: "right" })} />
                                    </td>
                                    <td style={{ padding: "4px 6px" }}>
                                      <input type="date" value={qtyOutDraft[`${g.item.id}-${slotIdx}-date`] ?? entry?.date ?? ""} onChange={e => setQtyOutDraft(d => ({ ...d, [`${g.item.id}-${slotIdx}-date`]: e.target.value }))} {...modalCellInput({ width: 120 })} />
                                    </td>
                                  </Fragment>
                                );
                              }
                              return (
                                <Fragment key={slotIdx}>
                                  <td style={{ padding: "10px 10px", color: entry ? "#e87c27" : "#e5e7eb", fontWeight: entry ? 700 : 400, fontSize: 11, textAlign: "center", borderRight: "1px solid #f3f4f6", whiteSpace: "nowrap", minWidth: 100 }}>{entry ? entry.qty.toLocaleString() : "—"}</td>
                                  <td style={{ padding: "10px 10px", color: entry ? "#111827" : "#e5e7eb", fontWeight: entry ? 700 : 400, fontSize: 12, textAlign: "center", minWidth: 60 }}>{entry ? formatBackloadExportDate(entry.date) : "—"}</td>
                                </Fragment>
                              );
                            })}
                            <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 800, color: "#e87c27", fontSize: 13, borderLeft: "1px solid #f3f4f6", background: isEditing ? "#fffbf7" : "#fff4ed" }}>{g.entries.reduce((s, e) => s + e.qty, 0).toLocaleString()}</td>
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
                                  }} title="Save" style={{ padding: "4px 7px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center" }}><IconSave size={11} /></button>
                                  <button onClick={() => { setEditingQtyOutItem(null); setQtyOutDraft({}); }} title="Cancel" style={{ padding: "4px 7px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center" }}><IconX size={11} /></button>
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

      {/* Edit Drawer */}
      {editDrawerRow && editDraft && (
        <>
          <button onClick={closeEditDrawer} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 1200, border: "none", cursor: "pointer" }} aria-label="Close drawer" />
          <aside style={{ position: "fixed", top: 0, right: 0, height: "100vh", width: "min(96vw, 420px)", background: "#fff", zIndex: 1201, display: "flex", flexDirection: "column", boxShadow: "-4px 0 32px rgba(0,0,0,0.18)" }}>
            <div style={{ background: "#1c2235", padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>Edit Entry #{editDrawerRow.id}</div>
                <div style={{ color: "#93a3c7", fontSize: 11, marginTop: 2, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{editDrawerRow.item}</div>
              </div>
              <button onClick={closeEditDrawer} style={{ background: "none", border: "none", color: "#93a3c7", cursor: "pointer", padding: 4 }}><IconX size={18} /></button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4 }}>DATE</label>
                    <input type="date" value={editDraft.date || ""} onChange={e => setEditDraft(d => ({ ...d, date: e.target.value }))} style={{ width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4 }}>DR #</label>
                    <input value={editDraft.drNo || ""} onChange={e => setEditDraft(d => ({ ...d, drNo: e.target.value }))} style={{ width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4 }}>SKU</label>
                  <input value={editDraft.sku || ""} onChange={e => setEditDraft(d => ({ ...d, sku: e.target.value }))} style={{ width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4 }}>ITEM DESCRIPTION</label>
                  <input value={editDraft.item || ""} onChange={e => setEditDraft(d => ({ ...d, item: e.target.value }))} style={{ width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4 }}>QTY</label>
                    <input type="number" min={0} value={editDraft.qty ?? ""} onChange={e => setEditDraft(d => ({ ...d, qty: parseFloat(e.target.value) || 0 }))} style={{ width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4 }}>UNIT COST (₱)</label>
                    <input type="number" min={0} step="0.01" value={editDraft.unitCost ?? ""} onChange={e => setEditDraft(d => ({ ...d, unitCost: parseFloat(e.target.value) || 0 }))} style={{ width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" }} />
                  </div>
                </div>
                <div style={{ background: "#f8f9fb", borderRadius: 8, padding: "10px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700 }}>TOTAL COST</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginTop: 2 }}>{fmtPHP((editDraft.qty || 0) * (editDraft.unitCost || 0))}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700 }}>QTY BALANCE</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#d97706", marginTop: 2 }}>{(editDraft.qty || 0) - (qtyOutTotals[editDraft.id] || 0)}</div>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4 }}>CUSTOMER NAME</label>
                  <input value={editDraft.customerName || ""} onChange={e => setEditDraft(d => ({ ...d, customerName: e.target.value }))} style={{ width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 4 }}>REMARKS</label>
                  <input value={editDraft.remarks || ""} onChange={e => setEditDraft(d => ({ ...d, remarks: e.target.value }))} style={{ width: "100%", padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>
              </div>
            </div>
            <div style={{ padding: "14px 20px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={closeEditDrawer} style={{ padding: "8px 18px", border: "1px solid #d1d5db", borderRadius: 7, background: "#fff", color: "#374151", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>Cancel</button>
              <button onClick={handleSaveDrawer} style={{ padding: "8px 18px", border: "none", borderRadius: 7, background: "#e87c27", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>Save Changes</button>
            </div>
          </aside>
        </>
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