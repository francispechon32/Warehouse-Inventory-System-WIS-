import { useState, useRef, useMemo, useEffect } from "react";
import XLSX from "xlsx-js-style";
import PageToolbar from "./PageToolbar";
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

function exportBackload(rows) {
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
  const nextId = useRef(SEED_BACKLOAD.length + 1);
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE);

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
  const totalBalance = data.reduce((s, r) => s + ((r.qty - r.totalQtyOut) * r.unitCost), 0);
  const totalQtyBalance = data.reduce((s, r) => s + (r.qty - r.totalQtyOut), 0);

  const COLS = ["TRANS NO.", "DATE", "DR #", "SKU", "ITEM", "QTY", "UNIT COST", "TOTAL COST", "CUSTOMER NAME", "TOTAL QTY OUT", "QTY BALANCE", "AMOUNT BALANCE", "REMARKS", ""];

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
          onExport: () => exportBackload(data),
        }}
      />

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#1c2235" }}>
                {COLS.map(h => (
                  <th key={h} style={{ padding: "14px 12px", textAlign: "center", color: "#fff", fontWeight: 700, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
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
                const qtyBalance = row.qty - row.totalQtyOut;
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
                    <td style={{ padding: "12px 12px", color: "#374151", maxWidth: 220, textAlign: "left" }}><Highlight text={row.item} query={searchQuery} /></td>
                    <td style={{ padding: "12px 12px", textAlign: "center", fontWeight: 700 }}>{row.qty}</td>
                    <td style={{ padding: "12px 12px", textAlign: "center" }}>{fmtPHP(row.unitCost)}</td>
                    <td style={{ padding: "12px 12px", textAlign: "center", fontWeight: 600 }}>{fmtPHP(totalCost)}</td>
                    <td style={{ padding: "12px 12px", color: "#374151", maxWidth: 180, textAlign: "left" }}><Highlight text={row.customerName} query={searchQuery} /></td>
                    <td style={{ padding: "12px 12px", textAlign: "center" }}>{row.totalQtyOut}</td>
                    <td style={{ padding: "12px 12px", textAlign: "center" }}>
                      <span style={{ padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: qtyBalance > 0 ? "#fef3c7" : "#d1fae5", color: qtyBalance > 0 ? "#d97706" : "#065f46" }}>{qtyBalance}</span>
                    </td>
                    <td style={{ padding: "12px 12px", textAlign: "center", fontWeight: 600 }}>{fmtPHP(amtBalance)}</td>
                    <td style={{ padding: "12px 12px", color: "#6b7280", maxWidth: 180, fontSize: 11, textAlign: "left" }}>{row.remarks || "—"}</td>
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>
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
            Showing {filtered.length === 0 ? 0 : (currentPage-1)*PAGE_SIZE+1}–{Math.min(currentPage*PAGE_SIZE, filtered.length)} of {filtered.length} entries
          </span>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}
              style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: currentPage===1?"not-allowed":"pointer", opacity: currentPage===1?0.4:1 }}>
              <IconChevronLeft size={14} />
            </button>
            {Array.from({length: totalPages}, (_, i) => i+1).slice(0, 10).map(n => (
              <button key={n} onClick={() => setCurrentPage(n)}
                style={{ width: 30, height: 30, border: n===currentPage?"none":"1px solid #e5e7eb", borderRadius: 6, background: n===currentPage?"#e87c27":"#fff", color: n===currentPage?"#fff":"#374151", cursor: "pointer", fontWeight: n===currentPage?700:400, fontSize: 12 }}>
                {n}
              </button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}
              style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: currentPage===totalPages?"not-allowed":"pointer", opacity: currentPage===totalPages?0.4:1 }}>
              <IconChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {showModal && <AddEntryModal onClose={() => setShowModal(false)} onSave={handleAddEntry} />}
      {toast && (
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, background: toast.type === "error" ? "#dc2626" : "#16a34a", color: "#fff", borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}