import { useState, useMemo, useEffect, useRef } from "react";
import XLSX from "xlsx-js-style";
import PageToolbar from "./PageToolbar";
import useSort from "./useSort";
import useApi from "./hooks/useApi";
import { ENDPOINTS } from "./api/apiConfig";
import { SEED_STOCK_IN, SEED_STOCK_OUT } from "./stockTransactionSeeds";
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


const SKU_CATALOG = {
  DRB007: { desc: "Deformed Round Bar, 10mm x 6M g33", weight: "3.696 kg/pc" },
  DRB008: { desc: "Deformed Round Bar, 12mm x 6M g33", weight: "5.328 kg/pc" },
  DRB050: { desc: "Deformed Round Bar, 10mm x 6M g40", weight: "3.696 kg/pc" },
  DRB051: { desc: "Deformed Round Bar, 12mm x 6M g40", weight: "5.328 kg/pc" },
  DRB052: { desc: "Deformed Round Bar, 16mm x 6M g40", weight: "14.80 kg/pc" },
  SHPT2: { desc: "Sheet Pile T2, 400mm x 100mm x 10.5mm", weight: "576 kg/pc" },
  SHPT3: { desc: "Sheet Pile T3, 400mm x 125mm x 13mm x 12M", weight: "720 kg/pc" },
  MSP010: { desc: "MS Plate, 6mm x 4' x 8'", weight: "—" },
  MSP018: { desc: "MS Plate, 12mm x 4' x 8'", weight: "—" },
  JINXI: { desc: "Sheet Pile, Z-Pile 770mm W x 354mm H x 12M", weight: "878.40 kg/pc" },
  WF016: { desc: "Wide Flange, 8 x 4 x 10# x 6M", weight: "—" },
  WF10833: { desc: "Wide Flange, 10 x 8 x 33# x 6M", weight: "—" },
};

const STOCK_IN_COLS = [
  "TRANS #", "DATE", "TDT PO #", "TDT PO DATE", "VENDOR #", "VENDOR NAME",
  "CUSTOMER'S NAME AS PER DR", "TDT WO #", "ACCEPTANCE DATE", "QTY", "COST/KILO",
  "COST/UNIT", "TOTAL PURCHASE", "RUNNING QTY", "AVG UNIT COST", "TOTAL VALUE", "REMARK", "ACTION",
];

const STOCK_OUT_COLS = [
  "TRANS #", "DISPATCH DATE", "TDT WO#", "CUSTOMER NAME", "TDT DR#", "BRANCH",
  "SUMMARY OF TDT BDR#", "TDT SI#", "QTY OUT", "UNIT COST", "TOTAL PRICE",
  "RUNNING QTY", "RUNNING VALUE", "REMARKS", "ACTION",
];

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
const RIGHT_IN = new Set(["QTY", "COST/KILO", "COST/UNIT", "TOTAL PURCHASE", "RUNNING QTY", "AVG UNIT COST", "TOTAL VALUE"]);
const RIGHT_OUT_BASE = new Set(["QTY OUT", "UNIT COST", "TOTAL PRICE", "RUNNING QTY", "RUNNING VALUE"]);


function fmtPHP(n) {
  if (n === "—" || n === "") return "—";
  return "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function buildStockCardRows(stockInRows, stockOutRows, skuKey) {
  const inMapped = stockInRows.map(r => ({
    _sortDate: r.date || "",
    _sortTrans: String(r.transNo || ""),
    _type: "IN",
    id: `in-${r.id}`,
    sku: r.sku || "",
    type: "IN",
    transNo: r.transNo,
    dateToday: r.date || "",
    tdtPo: r.tdtPo || "",
    tdtPoDate: r.tdtPoDate || "",
    vendorName: r.vendorName || "",
    customerDr: r.customerDr || "",
    tdtWo: r.tdtWo || "",
    acceptDate: r.acceptDate || "",
    recvQty: r.qty ?? null,
    costKilo: r.costKilo ?? null,
    costUnit: r.costUnit ?? null,
    totalPurchases: r.totalPurchase ?? null,
    dispatchDate: "",
    delivQty: null,
    unitCost: null,
    price: null,
    tdtDr: "",
    branch: "",
    bdrSummary: "",
    tdtSi: "",
    remarks: r.remark || "",
  }));
  const outMapped = stockOutRows.map(r => ({
    _sortDate: r.dispatchDate || "",
    _sortTrans: String(r.transNo || ""),
    _type: "OUT",
    id: `out-${r.id}`,
    sku: r.sku || "",
    type: "OUT",
    transNo: r.transNo,
    dateToday: r.dispatchDate || "",
    tdtPo: "",
    tdtPoDate: "",
    vendorName: "",
    customerDr: r.customer || "",
    tdtWo: r.tdtWo || "",
    acceptDate: "",
    recvQty: null,
    costKilo: null,
    costUnit: null,
    totalPurchases: null,
    dispatchDate: r.dispatchDate || "",
    delivQty: r.qtyOut ?? null,
    unitCost: r.unitCost ?? null,
    price: r.totalPrice ?? null,
    tdtDr: r.tdtDr || "",
    branch: r.branch || "",
    bdrSummary: r.bdrSummary || "",
    tdtSi: r.tdtSi || "",
    remarks: r.remarks || "",
  }));
  const merged = [...inMapped, ...outMapped].sort((a, b) => {
    const dateCmp = a._sortDate.localeCompare(b._sortDate);
    if (dateCmp !== 0) return dateCmp;
    if (a._type !== b._type) return a._type === "IN" ? -1 : 1;
    return a._sortTrans.localeCompare(b._sortTrans, undefined, { numeric: true });
  });
  let runningQty = 0;
  let runningValue = 0;
  // TODO: confirm formula against Excel
  return merged.map(row => {
    if (skuKey) {
      if (row.type === "IN") {
        const qty = row.recvQty ?? 0;
        const cost = row.costUnit ?? 0;
        runningQty += qty;
        runningValue += qty * cost;
      } else {
        const qty = row.delivQty ?? 0;
        const avgBefore = runningQty > 0 ? runningValue / runningQty : 0;
        runningQty = Math.max(0, runningQty - qty);
        runningValue = Math.max(0, runningValue - qty * avgBefore);
      }
    }
    const avgUnitCost = skuKey && runningQty > 0 ? runningValue / runningQty : 0;
    return { ...row, runningQty: skuKey ? runningQty : 0, avgUnitCost, runningValue: skuKey ? runningValue : 0 };
  });
}

function IconSearch({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>;
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

function Pagination({ currentPage, totalPages, onPage }) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      <button type="button" onClick={() => onPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", color: "#374151", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.4 : 1 }}><IconChevronLeft size={14} /></button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 6).map((n) => (
        <button key={n} type="button" onClick={() => onPage(n)} style={{ width: 30, height: 30, border: n === currentPage ? "none" : "1px solid #e5e7eb", borderRadius: 6, background: n === currentPage ? "#e87c27" : "#fff", color: n === currentPage ? "#fff" : "#374151", cursor: "pointer", fontWeight: n === currentPage ? 700 : 400, fontSize: 12 }}>{n}</button>
      ))}
      <button type="button" onClick={() => onPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", color: "#374151", cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.4 : 1 }}><IconChevronRight size={14} /></button>
    </div>
  );
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

function StockInInlineEditRow({ row, onSave, onCancel }) {
  const [draft, setDraft] = useState({ ...row });
  const set = (k, v) => setDraft(d => {
    const next = { ...d, [k]: v };
    const q = parseFloat(next.qty) || 0;
    const cu = parseFloat(next.costUnit) || 0;
    next.totalPurchase = q * cu;
    return next;
  });
  return (
    <tr style={{ background: "#fffbf7", borderBottom: "1px solid #fed7aa" }}>
      <td style={{ padding: "10px", color: "#6b7280", fontWeight: 600, textAlign: "center" }}>{draft.transNo}</td>
      <td style={{ padding: "6px 10px" }}><input type="date" value={draft.date||""} onChange={e=>set("date",e.target.value)} {...modalCellInput({width:120})} /></td>
      <td style={{ padding: "4px 10px" }}><input value={draft.tdtPo||""} onChange={e=>set("tdtPo",e.target.value)} {...modalCellInput({width:100})} /></td>
      <td style={{ padding: "6px 10px" }}><input type="date" value={draft.tdtPoDate||""} onChange={e=>set("tdtPoDate",e.target.value)} {...modalCellInput({width:120})} /></td>
      <td style={{ padding: "4px 10px" }}><input value={draft.vendorNo||""} onChange={e=>set("vendorNo",e.target.value)} {...modalCellInput({width:80})} /></td>
      <td style={{ padding: "4px 10px" }}><input value={draft.vendorName||""} onChange={e=>set("vendorName",e.target.value)} {...modalCellInput({width:110})} /></td>
      <td style={{ padding: "4px 10px" }}><input value={draft.customerDr||""} onChange={e=>set("customerDr",e.target.value)} {...modalCellInput({width:100})} /></td>
      <td style={{ padding: "4px 10px" }}><input value={draft.tdtWo||""} onChange={e=>set("tdtWo",e.target.value)} {...modalCellInput({width:100})} /></td>
      <td style={{ padding: "6px 10px" }}><input type="date" value={draft.acceptDate||""} onChange={e=>set("acceptDate",e.target.value)} {...modalCellInput({width:120})} /></td>
      <td style={{ padding: "4px 10px", textAlign: "right" }}><input type="number" min={0} value={draft.qty??""} onChange={e=>set("qty",parseFloat(e.target.value)||0)} {...modalCellInput({width:70,textAlign:"right"})} /></td>
      <td style={{ padding: "4px 10px", textAlign: "right" }}><input type="number" min={0} step="0.01" value={draft.costKilo??""} onChange={e=>set("costKilo",parseFloat(e.target.value)||0)} {...modalCellInput({width:80,textAlign:"right"})} /></td>
      <td style={{ padding: "4px 10px", textAlign: "right" }}><input type="number" min={0} step="0.01" value={draft.costUnit??""} onChange={e=>set("costUnit",parseFloat(e.target.value)||0)} {...modalCellInput({width:80,textAlign:"right"})} /></td>
      <td style={{ padding: "10px", textAlign: "right", fontWeight: 600 }}>{fmtPHP(draft.totalPurchase)}</td>
      <td style={{ padding: "10px", textAlign: "right", fontWeight: 700 }}>{draft.runningQty}</td>
      <td style={{ padding: "10px", textAlign: "right" }}>{fmtPHP(draft.avgUnitCost)}</td>
      <td style={{ padding: "10px", textAlign: "right", fontWeight: 600 }}>{fmtPHP(draft.totalValue)}</td>
      <td style={{ padding: "4px 10px" }}><input value={draft.remark||""} onChange={e=>set("remark",e.target.value)} {...modalCellInput({width:120})} /></td>
      <td style={{ padding: "6px 8px", textAlign: "center" }}>
        <div style={{ display:"flex", gap:4, justifyContent:"center" }}>
          <button onClick={()=>onSave(draft)} title="Save" style={{ padding:"5px 8px", background:"#16a34a", color:"#fff", border:"none", borderRadius:5, cursor:"pointer", display:"flex", alignItems:"center" }}><IconSave size={13} /></button>
          <button onClick={onCancel} title="Cancel" style={{ padding:"5px 8px", background:"#f3f4f6", color:"#374151", border:"none", borderRadius:5, cursor:"pointer", display:"flex", alignItems:"center" }}><IconX size={13} /></button>
        </div>
      </td>
    </tr>
  );
}

function StockOutInlineEditRow({ row, onSave, onCancel }) {
  const [draft, setDraft] = useState({ ...row });
  const set = (k, v) => setDraft(d => {
    const next = { ...d, [k]: v };
    const q = parseFloat(next.qtyOut) || 0;
    const uc = parseFloat(next.unitCost) || 0;
    next.totalPrice = q * uc;
    return next;
  });
  return (
    <tr style={{ background: "#fffbf7", borderBottom: "1px solid #fed7aa" }}>
      <td style={{ padding:"10px", color:"#6b7280", fontWeight:600, textAlign:"center", whiteSpace:"nowrap" }}>{draft.transNo}</td>
      <td style={{ padding:"6px 10px" }}><input type="date" value={draft.dispatchDate||""} onChange={e=>set("dispatchDate",e.target.value)} {...modalCellInput({width:120})} /></td>
      <td style={{ padding:"4px 10px" }}><input value={draft.tdtWo||""} onChange={e=>set("tdtWo",e.target.value)} {...modalCellInput({width:100})} /></td>
      <td style={{ padding:"4px 10px" }}><input value={draft.customer||""} onChange={e=>set("customer",e.target.value)} {...modalCellInput({width:120})} /></td>
      <td style={{ padding:"4px 10px" }}><input value={draft.tdtDr||""} onChange={e=>set("tdtDr",e.target.value)} {...modalCellInput({width:100})} /></td>
      <td style={{ padding:"4px 10px" }}><input value={draft.branch||""} onChange={e=>set("branch",e.target.value)} {...modalCellInput({width:90})} /></td>
      <td style={{ padding:"4px 10px" }}><input value={draft.bdrSummary||""} onChange={e=>set("bdrSummary",e.target.value)} {...modalCellInput({width:100})} /></td>
      <td style={{ padding:"4px 10px" }}><input value={draft.tdtSi||""} onChange={e=>set("tdtSi",e.target.value)} {...modalCellInput({width:100})} /></td>
      <td style={{ padding:"4px 10px", textAlign:"right" }}><input type="number" min={0} value={draft.qtyOut??""} onChange={e=>set("qtyOut",parseFloat(e.target.value)||0)} {...modalCellInput({width:70,textAlign:"right"})} /></td>
      <td style={{ padding:"4px 10px", textAlign:"right" }}><input type="number" min={0} step="0.01" value={draft.unitCost??""} onChange={e=>set("unitCost",parseFloat(e.target.value)||0)} {...modalCellInput({width:80,textAlign:"right"})} /></td>
      <td style={{ padding:"10px", textAlign:"right", fontWeight:600 }}>{fmtPHP(draft.totalPrice)}</td>
      <td style={{ padding:"10px", textAlign:"right", fontWeight:700 }}>{draft.runningQty}</td>
      <td style={{ padding:"10px", textAlign:"right" }}>{fmtPHP(draft.runningValue)}</td>
      <td style={{ padding:"4px 10px" }}><input value={draft.remarks||""} onChange={e=>set("remarks",e.target.value)} {...modalCellInput({width:120})} /></td>
      <td style={{ padding:"6px 8px", textAlign:"center" }}>
        <div style={{ display:"flex", gap:4, justifyContent:"center" }}>
          <button onClick={()=>onSave(draft)} title="Save" style={{ padding:"5px 8px", background:"#16a34a", color:"#fff", border:"none", borderRadius:5, cursor:"pointer", display:"flex", alignItems:"center" }}><IconSave size={13} /></button>
          <button onClick={onCancel} title="Cancel" style={{ padding:"5px 8px", background:"#f3f4f6", color:"#374151", border:"none", borderRadius:5, cursor:"pointer", display:"flex", alignItems:"center" }}><IconX size={13} /></button>
        </div>
      </td>
    </tr>
  );
}

function SectionTable({ title, cols, rows, renderRow, rightAlign, pagination, searchSku }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden", marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 12px", flexWrap: "wrap", gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 14px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>{title}</span>
      </div>
      <div style={{ overflowX: "auto", padding: "0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#1c2235" }}>
              {cols.map((h) => (
                <th key={h} style={{ padding: "12px 10px", textAlign: rightAlign.has(h) ? "right" : "center", color: "#fff", fontWeight: 700, fontSize: 10, whiteSpace: "nowrap", letterSpacing: "0.04em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={cols.length} style={{ textAlign: "center", padding: "48px 20px", color: "#9ca3af" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
                No records found{searchSku ? <> for SKU <strong style={{ color: "#374151" }}>"{searchSku}"</strong></> : ""}.
              </td></tr>
            ) : rows.map((row, idx) => renderRow(row, idx))}
          </tbody>
        </table>
      </div>
      {pagination && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "14px 20px", borderTop: "1px solid #f3f4f6", background: "#fafafa" }}>
          {pagination}
        </div>
      )}
    </div>
  );
}


function useSheetJS() {
  return true; // XLSX is imported as a module, always available
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

function IconUpload2({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
}

const SS_PESO_FMT = '"₱"#,##0.00';
const SS_QTY_FMT = "#,##0";
const SS_MIN_DATA_ROWS = 15;
const SS_TRANS_START = 33;

function formatSsDate(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function parseSkuWeight(weightStr) {
  if (!weightStr || weightStr === "—") return weightStr;
  const m = String(weightStr).match(/[\d.]+/);
  return m ? m[0] : weightStr;
}

function ssTransNo(row, index, base = SS_TRANS_START) {
  const m = String(row?.transNo ?? "").match(/\d+/);
  return m ? Number(m[0]) : base + index;
}

function buildSsSheetStyles() {
  const sheetFill = { patternType: "solid", fgColor: { rgb: "FFF9E6" } };
  const hdrFill = { patternType: "solid", fgColor: { rgb: "F4B084" } };
  const yellowFill = { patternType: "solid", fgColor: { rgb: "FFEB9C" } };
  const totalFill = { patternType: "solid", fgColor: { rgb: "C65911" } };
  const greyFill = { patternType: "solid", fgColor: { rgb: "D9D9D9" } };
  const solidBorder = {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
  };
  const dottedRed = {
    top: { style: "dotted", color: { rgb: "C00000" } },
    bottom: { style: "dotted", color: { rgb: "C00000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
  };
  const underline = { bottom: { style: "thin", color: { rgb: "843C0C" } } };
  const f = {
    title: () => ({ name: "Arial", sz: 14, bold: true, color: { rgb: "E87C27" } }),
    metaLabel: () => ({ name: "Arial", sz: 10, bold: true, color: { rgb: "000000" } }),
    metaVal: () => ({ name: "Arial", sz: 10, color: { rgb: "000000" } }),
    insert: () => ({ name: "Arial", sz: 8, bold: true, color: { rgb: "E87C27" } }),
    hdr: (white = false) => ({
      name: "Arial", sz: 8, bold: true,
      color: { rgb: white ? "FFFFFF" : "000000" },
    }),
    body: () => ({ name: "Arial", sz: 9, color: { rgb: "000000" } }),
    link: () => ({ name: "Arial", sz: 9, color: { rgb: "0563C1" }, underline: true }),
  };
  const center = { horizontal: "center", vertical: "center", wrapText: true };
  const left = { horizontal: "left", vertical: "center", wrapText: true, indent: 1 };
  const right = { horizontal: "right", vertical: "center" };
  return {
    sheetFill, hdrFill, yellowFill, totalFill, greyFill,
    solidBorder, dottedRed, underline, f, center, left, right,
  };
}

function writeSsMeta(ws, C, put, merges, styles, sku, skuInfo, location = "POLYLAND WAREHOUSE") {
  const { sheetFill, underline, f, left, center } = styles;
  put(0, 0, "TDT WAREHOUSE INVENTORY SHEET (TDT WIS)", "s", {
    font: f.title(), alignment: left, fill: sheetFill,
  });
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } });

  const meta = [
    ["LOCATION", location],
    ["PRODUCT DESCRIPTION", skuInfo.desc || "—"],
    ["SKU NUMBER", sku],
    ["WEIGHT", parseSkuWeight(skuInfo.weight)],
  ];
  meta.forEach(([label, value], i) => {
    const row = 1 + i;
    put(row, 0, label, "s", { font: f.metaLabel(), alignment: left, fill: sheetFill });
    put(row, 1, ":", "s", { font: f.metaLabel(), alignment: center, fill: sheetFill });
    put(row, 2, value, "s", {
      font: f.metaVal(), alignment: left, fill: sheetFill, border: underline,
    });
    merges.push({ s: { r: row, c: 2 }, e: { r: row, c: 6 } });
  });

  merges.push({ s: { r: 0, c: 12 }, e: { r: 0, c: 15 } });
  merges.push({ s: { r: 1, c: 12 }, e: { r: 1, c: 15 } });
}

function putPeso(put, r, c, val, styleBase) {
  const n = Number(val);
  if (!n) {
    put(r, c, "₱ -", "s", styleBase);
    return;
  }
  put(r, c, n, "n", { ...styleBase, numFmt: SS_PESO_FMT });
}

function buildStockInWorksheet(sku, skuInfo, rows) {
  const styles = buildSsSheetStyles();
  const ws = {};
  const merges = [];
  const C = (r, col) => XLSX.utils.encode_cell({ r, c: col });
  const put = (r, c, v, t, s) => { ws[C(r, c)] = { v: v ?? "", t: t || (typeof v === "number" ? "n" : "s"), s }; };

  writeSsMeta(ws, C, put, merges, styles, sku, skuInfo);

  const HDR_ROW = 5;
  const DATA_START = 6;
  const LAST_COL = STOCK_IN_COLS.length - 1;
  const { hdrFill, yellowFill, totalFill, solidBorder, dottedRed, f, center, left, right } = styles;

  // Fill gaps in meta rows 0–4 so sheetFill covers the full width
  for (let r = 0; r < HDR_ROW; r++) {
    for (let c = 0; c <= LAST_COL; c++) {
      if (!ws[C(r, c)]) put(r, c, "", "s", { fill: styles.sheetFill });
    }
  }

  const rightInSet = RIGHT_IN;
  STOCK_IN_COLS.forEach((h, ci) => {
    const isQty = rightInSet.has(h);
    put(HDR_ROW, ci, h, "s", {
      font: f.hdr(false),
      fill: ["QTY","COST/KILO","COST/UNIT"].includes(h) ? yellowFill : ["TOTAL PURCHASE","RUNNING QTY","AVG UNIT COST","TOTAL VALUE"].includes(h) ? totalFill : hdrFill,
      alignment: center,
      border: solidBorder,
    });
  });

  const slotCount = Math.max(rows.length, SS_MIN_DATA_ROWS);
  for (let i = 0; i < slotCount; i++) {
    const ri = DATA_START + i;
    const row = rows[i];
    const dataStyle = { font: f.body(), fill: styles.sheetFill, border: dottedRed };

    if (!row) {
      STOCK_IN_COLS.forEach((h, ci) => {
        const isPeso = ["COST/KILO","COST/UNIT","TOTAL PURCHASE","AVG UNIT COST","TOTAL VALUE"].includes(h);
        const isNum = ["QTY","RUNNING QTY"].includes(h);
        put(ri, ci, isPeso ? "₱ -" : isNum ? 0 : "", isPeso ? "s" : "n", {
          ...dataStyle, alignment: rightInSet.has(h) ? right : center,
          ...(isNum ? { numFmt: SS_QTY_FMT } : {}),
        });
      });
      continue;
    }

    const vals = [
      row.transNo || i + 1,
      formatSsDate(row.date),
      row.tdtPo || "",
      formatSsDate(row.tdtPoDate),
      row.vendorNo || "",
      row.vendorName || "",
      row.customerDr || "",
      row.tdtWo || "",
      formatSsDate(row.acceptDate),
      row.qty ?? 0,
      row.costKilo ?? "",
      row.costUnit ?? 0,
      row.totalPurchase ?? 0,
      row.runningQty ?? 0,
      row.avgUnitCost ?? 0,
      row.totalValue ?? 0,
      row.remark || "",
    ];
    STOCK_IN_COLS.forEach((h, ci) => {
      const v = vals[ci];
      const isPeso = ["COST/KILO","COST/UNIT","TOTAL PURCHASE","AVG UNIT COST","TOTAL VALUE"].includes(h);
      const isNum = ["QTY","RUNNING QTY"].includes(h);
      const align = rightInSet.has(h) ? right : h === "CUSTOMER'S NAME AS PER DR" || h === "VENDOR NAME" ? left : center;
      if (isPeso && !v) {
        put(ri, ci, "₱ -", "s", { ...dataStyle, alignment: right });
      } else if (isPeso) {
        put(ri, ci, Number(v), "n", { ...dataStyle, alignment: right, numFmt: SS_PESO_FMT });
      } else if (isNum) {
        put(ri, ci, Number(v) || 0, "n", { ...dataStyle, alignment: right, numFmt: SS_QTY_FMT });
      } else {
        put(ri, ci, String(v ?? ""), "s", { ...dataStyle, alignment: align });
      }
    });
  }

  const lastRow = DATA_START + slotCount - 1;
  ws["!ref"] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: lastRow, c: LAST_COL });
  ws["!merges"] = merges;
  ws["!cols"] = [
    { wch: 30 },  // TRANS # / meta label col ("PRODUCT DESCRIPTION" = 19 chars)
    { wch: 14 },  // DATE
    { wch: 16 },  // TDT PO #
    { wch: 14 },  // TDT PO DATE
    { wch: 14 },  // VENDOR #
    { wch: 24 },  // VENDOR NAME
    { wch: 30 },  // CUSTOMER'S NAME AS PER DR (25 chars)
    { wch: 14 },  // TDT WO #
    { wch: 16 },  // ACCEPTANCE DATE
    { wch: 10 },  // QTY
    { wch: 14 },  // COST/KILO
    { wch: 16 },  // COST/UNIT
    { wch: 18 },  // TOTAL PURCHASE
    { wch: 14 },  // RUNNING QTY
    { wch: 18 },  // AVG UNIT COST
    { wch: 18 },  // TOTAL VALUE
    { wch: 24 },  // REMARK
  ];
  ws["!rows"] = [
    { hpt: 22 }, { hpt: 18 }, { hpt: 18 }, { hpt: 18 }, { hpt: 18 },
    { hpt: 36 }, ...Array(slotCount).fill({ hpt: 22 }),
  ];
  return ws;
}

function buildStockOutWorksheet(sku, skuInfo, rows) {
  const styles = buildSsSheetStyles();
  const ws = {};
  const merges = [];
  const C = (r, col) => XLSX.utils.encode_cell({ r, c: col });
  const put = (r, c, v, t, s) => { ws[C(r, c)] = { v: v ?? "", t: t || (typeof v === "number" ? "n" : "s"), s }; };

  writeSsMeta(ws, C, put, merges, styles, sku, skuInfo);

  const exportCols = STOCK_OUT_COLS.filter(h => h !== "ACTION");
  const HDR_ROW = 5;
  const DATA_START = 6;
  const { hdrFill, totalFill, solidBorder, dottedRed, f, center, left, right } = styles;

  for (let r = 0; r < HDR_ROW; r++) {
    for (let c = 0; c < exportCols.length; c++) {
      if (!ws[C(r, c)]) put(r, c, "", "s", { fill: styles.sheetFill });
    }
  }

  exportCols.forEach((h, ci) => {
    put(HDR_ROW, ci, h, "s", {
      font: f.hdr(false),
      fill: ["QTY OUT","UNIT COST","TOTAL PRICE","RUNNING QTY","RUNNING VALUE"].includes(h) ? totalFill : hdrFill,
      alignment: center,
      border: solidBorder,
    });
  });

  const slotCount = Math.max(rows.length, SS_MIN_DATA_ROWS);

  for (let i = 0; i < slotCount; i++) {
    const ri = DATA_START + i;
    const row = rows[i];
    const dataStyle = { font: f.body(), fill: styles.sheetFill, border: dottedRed };

    if (!row) {
      exportCols.forEach((h, ci) => {
        const isPeso = ["UNIT COST","TOTAL PRICE","RUNNING VALUE"].includes(h);
        const isNum = ["QTY OUT","RUNNING QTY"].includes(h);
        put(ri, ci, isPeso ? "₱ -" : isNum ? 0 : "", isPeso ? "s" : "n", {
          ...dataStyle, alignment: RIGHT_OUT_BASE.has(h) ? right : center,
          ...(isNum ? { numFmt: SS_QTY_FMT } : {}),
        });
      });
      continue;
    }

    const vals = [
      row.transNo || i + 1, formatSsDate(row.dispatchDate), row.tdtWo || "",
      row.customer || "", row.tdtDr || "", row.branch || "",
      row.bdrSummary || "", row.tdtSi || "",
      row.qtyOut ?? 0, row.unitCost ?? 0, row.totalPrice ?? 0,
      row.runningQty ?? 0, row.runningValue ?? 0, row.remarks || "",
    ];

    exportCols.forEach((h, ci) => {
      const v = vals[ci];
      const isPeso = ["UNIT COST","TOTAL PRICE","RUNNING VALUE"].includes(h);
      const isNum = ["QTY OUT","RUNNING QTY"].includes(h);
      const align = RIGHT_OUT_BASE.has(h) ? right : h === "CUSTOMER NAME" ? left : center;
      if (isPeso && !v) {
        put(ri, ci, "₱ -", "s", { ...dataStyle, alignment: right });
      } else if (isPeso) {
        put(ri, ci, Number(v), "n", { ...dataStyle, alignment: right, numFmt: SS_PESO_FMT });
      } else if (isNum) {
        put(ri, ci, Number(v) || 0, "n", { ...dataStyle, alignment: right, numFmt: SS_QTY_FMT });
      } else {
        put(ri, ci, String(v ?? ""), "s", { ...dataStyle, alignment: align });
      }
    });
  }

  const lastRow = DATA_START + slotCount - 1;
  ws["!ref"] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: lastRow, c: exportCols.length - 1 });
  ws["!merges"] = merges;
  ws["!cols"] = [
    { wch: 22 }, { wch: 16 }, { wch: 14 }, { wch: 26 }, { wch: 16 },
    { wch: 14 }, { wch: 22 }, { wch: 14 }, { wch: 10 }, { wch: 14 },
    { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 24 },
  ];
  ws["!rows"] = [
    { hpt: 22 }, { hpt: 18 }, { hpt: 18 }, { hpt: 18 }, { hpt: 18 },
    { hpt: 36 }, ...Array(slotCount).fill({ hpt: 22 }),
  ];
  return ws;
}

function downloadWorkbook(wb, filename) {
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

function exportStockSheets(sku, skuInfo, stockInRows, stockOutRows) {
  const safeSku = String(sku || "SKU").trim() || "SKU";
  const wb = XLSX.utils.book_new();
  const inSheet = buildStockInWorksheet(safeSku, skuInfo, stockInRows);
  const outSheet = buildStockOutWorksheet(safeSku, skuInfo, stockOutRows);
  XLSX.utils.book_append_sheet(wb, inSheet, `${safeSku} STOCK IN`.slice(0, 31));
  XLSX.utils.book_append_sheet(wb, outSheet, `${safeSku} STOCK OUT`.slice(0, 31));
  downloadWorkbook(wb, `TDT_WIS_Stock_Sheet_${safeSku}.xlsx`);
}

function importStockSheets(file, onInDone, onOutDone, onError) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array", cellDates: true, cellText: false, dateNF: "yyyy-mm-dd" });
      const toNum = (v) => { if (!v && v !== 0) return 0; const n = parseFloat(String(v).replace(/[₱,]/g, "")); return isNaN(n) ? 0 : n; };
      const toStr = (v) => { if (v == null) return ""; if (v instanceof Date) return v.toISOString().slice(0, 10); return String(v).trim(); };
      const inSheetName = wb.SheetNames.find(n => n.toUpperCase().includes("IN")) || wb.SheetNames[0];
      const outSheetName = wb.SheetNames.find(n => n.toUpperCase().includes("OUT")) || wb.SheetNames[1] || wb.SheetNames[0];

      // New flat IN format: cols match STOCK_IN_COLS exactly (0-16)
      const inCols = [
        ["transNo",0,false],["date",1,false],["tdtPo",2,false],["tdtPoDate",3,false],
        ["vendorNo",4,false],["vendorName",5,false],["customerDr",6,false],
        ["tdtWo",7,false],["acceptDate",8,false],
        ["qty",9,true],["costKilo",10,true],["costUnit",11,true],["totalPurchase",12,true],
        ["runningQty",13,true],["avgUnitCost",14,true],["totalValue",15,true],["remark",16,false],
      ];
      // OUT format: base cols (0-10) + tail (11-13), no series
      const outCols = [
        ["transNo",0,false],["dispatchDate",1,false],["tdtWo",2,false],["customer",3,false],
        ["tdtDr",4,false],["branch",5,false],["bdrSummary",6,false],["tdtSi",7,false],
        ["qtyOut",8,true],["unitCost",9,true],["totalPrice",10,true],
        ["runningQty",11,true],["runningValue",12,true],["remarks",13,false],
      ];
      const parseSheet = (ws, fieldMap) => {
        if (!ws) return [];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false });
        let hdrIdx = -1;
        for (let i = 0; i < Math.min(raw.length, 15); i++) {
          if (raw[i] && raw[i].some(v => typeof v === "string" && v.toUpperCase().includes("TRANS"))) { hdrIdx = i; break; }
        }
        const dataStart = hdrIdx >= 0 ? hdrIdx + 1 : 6;
        const result = [];
        for (let i = dataStart; i < raw.length; i++) {
          const r = raw[i];
          if (!r || r.every(v => !v || String(v).trim() === "")) continue;
          const row = { id: result.length + 1 };
          fieldMap.forEach(([field, idx, numeric]) => {
            row[field] = numeric ? toNum(r[idx]) : toStr(r[idx]);
          });
          result.push(row);
        }
        return result;
      };

      const outRows = parseSheet(wb.Sheets[outSheetName], outCols);

      const inRows = parseSheet(wb.Sheets[inSheetName], inCols);
      if (!inRows.length && !outRows.length) throw new Error("No data rows found. Ensure you are importing a Stock Sheet exported from this system.");
      onInDone(inRows);
      onOutDone(outRows);
    } catch(err) { onError(err.message); }
  };
  reader.readAsArrayBuffer(file);
}

export default function StockSheetsPage({
  stockInData: propStockIn,
  setStockInData: setPropStockIn,
  stockOutData: propStockOut,
  setStockOutData: setPropStockOut,
  defaultSku,
  onConsumeDefaultSku,
}) {
  const xlsxReady = useSheetJS();
  const apiIn  = useApi(`${ENDPOINTS.stockSheets}/in`,  SEED_STOCK_IN);
  const apiOut = useApi(`${ENDPOINTS.stockSheets}/out`, SEED_STOCK_OUT);

  // Local state for immediate UI updates
  const [stockInData,  setStockInData]  = useState(() => propStockIn  ?? apiIn.data);
  const [stockOutData, setStockOutData] = useState(() => propStockOut ?? apiOut.data);

  useEffect(() => { if (propStockIn)  setStockInData(propStockIn);  else apiIn.getAll().then(d => setStockInData(d));  }, [propStockIn]);  // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (propStockOut) setStockOutData(propStockOut); else apiOut.getAll().then(d => setStockOutData(d)); }, [propStockOut]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (defaultSku) {
      setSearchSku(defaultSku);
      setActiveTab("all");
      onConsumeDefaultSku?.();
    }
  }, [defaultSku]); // eslint-disable-line react-hooks/exhaustive-deps

  const syncInUp  = (d) => { if (setPropStockIn)  setPropStockIn(_ => d); };
  const syncOutUp = (d) => { if (setPropStockOut) setPropStockOut(_ => d); };
  const [searchSku, setSearchSku] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [inPage, setInPage] = useState(1);
  const [outPage, setOutPage] = useState(1);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const EMPTY_FORM = { type: "in", sku: "", date: "", tdtPo: "", tdtPoDate: "", vendorNo: "", vendorName: "", customerDr: "", tdtWo: "", acceptDate: "", qty: "", costKilo: "", costUnit: "", dispatchDate: "", customer: "", tdtDr: "", branch: "", bdrSummary: "", tdtSi: "", qtyOut: "", remarks: "" };
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const importRef = useRef(null);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [sortBy, setSortBy] = useState("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [editingInId, setEditingInId] = useState(null);
  const [editingOutId, setEditingOutId] = useState(null);
  const [lastAddedInId, setLastAddedInId] = useState(null);
  const [lastAddedOutId, setLastAddedOutId] = useState(null);
  const [cardPage, setCardPage] = useState(1);
  useEffect(() => { setCardPage(1); }, [searchSku]);
  const handleSaveInEdit = async (updated) => {
    try {
      const next = stockInData.map(r => r.id === updated.id ? { ...updated } : r);
      setStockInData(next);
      syncInUp(next);
      if (!setPropStockIn) await apiIn.update(updated.id, updated);
      setEditingInId(null);
      showToast("Stock IN row updated.");
    } catch {
      showToast("Failed to save changes.", "error");
    }
  };
  const handleSaveOutEdit = async (updated) => {
    try {
      const next = stockOutData.map(r => r.id === updated.id ? { ...updated } : r);
      setStockOutData(next);
      syncOutUp(next);
      if (!setPropStockOut) await apiOut.update(updated.id, updated);
      setEditingOutId(null);
      showToast("Stock OUT row updated.");
    } catch {
      showToast("Failed to save changes.", "error");
    }
  };

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const recentSkus = useMemo(() => {
    const combined = [
      ...stockInData.map(r => ({ sku: r.sku, date: r.date || "" })),
      ...stockOutData.map(r => ({ sku: r.sku, date: r.dispatchDate || "" })),
    ];
    combined.sort((a, b) => b.date.localeCompare(a.date));
    const seen = new Set();
    const result = [];
    for (const { sku } of combined) {
      if (sku && !seen.has(sku)) { seen.add(sku); result.push(sku); }
      if (result.length >= 12) break;
    }
    return result;
  }, [stockInData, stockOutData]);

  const skuKey = searchSku.trim().toUpperCase();
  const skuInfo = SKU_CATALOG[skuKey] || { desc: "—", weight: "—" };

  const stockInRows = useMemo(() => {
    let rows = skuKey ? stockInData.filter((r) => r.sku === skuKey) : stockInData;
    if (dateRange.start) rows = rows.filter((r) => (r.date || "") >= dateRange.start);
    if (dateRange.end)   rows = rows.filter((r) => (r.date || "") <= dateRange.end);
    return rows;
  }, [skuKey, stockInData, dateRange]);

  const stockOutRows = useMemo(() => {
    let rows = skuKey ? stockOutData.filter((r) => r.sku === skuKey) : stockOutData;
    if (dateRange.start) rows = rows.filter((r) => (r.dispatchDate || "") >= dateRange.start);
    if (dateRange.end)   rows = rows.filter((r) => (r.dispatchDate || "") <= dateRange.end);
    return rows;
  }, [skuKey, stockOutData, dateRange]);

  const pinFirst = (arr, pinnedId) => {
    if (!pinnedId) return arr;
    const idx = arr.findIndex(r => r.id === pinnedId);
    if (idx <= 0) return arr;
    return [arr[idx], ...arr.slice(0, idx), ...arr.slice(idx + 1)];
  };

  const sortedIn = useMemo(() => {
    if (!stockInRows || stockInRows.length < 2) return stockInRows;
    const base = [...stockInRows].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          if (!a.date && !b.date) return (b.id ?? 0) - (a.id ?? 0);
          if (!a.date) return -1; if (!b.date) return 1;
          return (b.date || "").localeCompare(a.date || "") || (b.id ?? 0) - (a.id ?? 0);
        case "oldest":
          if (!a.date && !b.date) return (a.id ?? 0) - (b.id ?? 0);
          if (!a.date) return 1; if (!b.date) return -1;
          return (a.date || "").localeCompare(b.date || "") || (a.id ?? 0) - (b.id ?? 0);
        case "az": return String(a.vendorName || "").localeCompare(String(b.vendorName || ""), undefined, { sensitivity: "base" });
        case "za": return String(b.vendorName || "").localeCompare(String(a.vendorName || ""), undefined, { sensitivity: "base" });
        default: return 0;
      }
    });
    return pinFirst(base, lastAddedInId);
  }, [stockInRows, sortBy, lastAddedInId]);

  const sortedOut = useMemo(() => {
    if (!stockOutRows || stockOutRows.length < 2) return stockOutRows;
    const base = [...stockOutRows].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          if (!a.dispatchDate && !b.dispatchDate) return (b.id ?? 0) - (a.id ?? 0);
          if (!a.dispatchDate) return -1; if (!b.dispatchDate) return 1;
          return (b.dispatchDate || "").localeCompare(a.dispatchDate || "") || (b.id ?? 0) - (a.id ?? 0);
        case "oldest":
          if (!a.dispatchDate && !b.dispatchDate) return (a.id ?? 0) - (b.id ?? 0);
          if (!a.dispatchDate) return 1; if (!b.dispatchDate) return -1;
          return (a.dispatchDate || "").localeCompare(b.dispatchDate || "") || (a.id ?? 0) - (b.id ?? 0);
        case "az": return String(a.customer || "").localeCompare(String(b.customer || ""), undefined, { sensitivity: "base" });
        case "za": return String(b.customer || "").localeCompare(String(a.customer || ""), undefined, { sensitivity: "base" });
        default: return 0;
      }
    });
    return pinFirst(base, lastAddedOutId);
  }, [stockOutRows, sortBy, lastAddedOutId]);

  const inTotalPages = Math.max(1, Math.ceil(sortedIn.length / PAGE_SIZE));
  const outTotalPages = Math.max(1, Math.ceil(sortedOut.length / PAGE_SIZE));
  const pagedIn = sortedIn.slice((inPage - 1) * PAGE_SIZE, inPage * PAGE_SIZE);
  const pagedOut = sortedOut.slice((outPage - 1) * PAGE_SIZE, outPage * PAGE_SIZE);

  const stockCardRows = useMemo(() => {
    return buildStockCardRows(stockInRows, stockOutRows, skuKey);
  }, [skuKey, stockInRows, stockOutRows]);
  const cardTotalPages = Math.max(1, Math.ceil(stockCardRows.length / PAGE_SIZE));
  const pagedCard = stockCardRows.slice((cardPage - 1) * PAGE_SIZE, cardPage * PAGE_SIZE);

  const showStockCard = activeTab === "all";
  const showIn = activeTab === "in";
  const showOut = activeTab === "out";

  const tabs = [
    { id: "all", label: "All Transactions" },
    { id: "in", label: "Stock IN" },
    { id: "out", label: "Stock OUT" },
  ];

  return (
    <div style={{ background: "#f0f2f5", padding: "28px 32px 40px", display: "flex", flexDirection: "column", gap: 18 }}>

      <PageToolbar
        searchValue={searchSku}
        onSearchChange={(v) => { setSearchSku(v); setInPage(1); setOutPage(1); }}
        showDateRange={true}
        dateRange={dateRange}
        onDateRangeChange={(r) => { setDateRange(r); setInPage(1); setOutPage(1); }}
        primaryAction={{ label: "New Stock Sheet", onClick: () => { setCreateForm(f => ({ ...f, sku: searchSku })); setShowCreate(true); } }}
        importExport={{
          fileInputRef: importRef,
          onFileChange: (e) => {
            const file = e.target.files?.[0]; if (!file) return;
            setImporting(true);
            importStockSheets(
              file,
                (inRows) => {
                setStockInData(inRows); syncInUp(inRows);
                setInPage(1);
              },
              (outRows) => {
                setStockOutData(outRows); syncOutUp(outRows);
                setOutPage(1); setImporting(false); showToast(`Imported stock sheet from ${file.name}`);
              },
              (err) => { setImporting(false); showToast(`Import failed: ${err}`, "error"); }
            );
            e.target.value = "";
          },
          importing,
          importDisabled: !xlsxReady,
          importLabel: "Import WIS",
          onExport: () => {
            try {
              exportStockSheets(skuKey, skuInfo, stockInRows, stockOutRows);
              showToast(`Exported stock sheet for ${skuKey || "SKU"}.`);
            } catch (err) {
              console.error("Stock sheet export failed:", err);
              showToast(err?.message || "Export failed. Check the browser console.", "error");
            }
          },
        }}
      />

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
        background: "#fff",
        borderRadius: 14,
        padding: "12px 16px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
      }}>
        <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>Recent SKUs:</span>
        {recentSkus.map((sku) => {
          const active = skuKey === sku;
          return (
            <button
              key={sku}
              type="button"
              onClick={() => { setSearchSku(sku); setInPage(1); setOutPage(1); }}
              style={{
                padding: "5px 12px",
                borderRadius: 20,
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                background: active ? "#e87c27" : "#f3f4f6",
                color: active ? "#fff" : "#6b7280",
              }}
            >
              {sku}
            </button>
          );
        })}
      </div>

      <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
        <div style={{ display: "flex", flex: "1 1 0", gap: 28, flexWrap: "wrap", minWidth: 0 }}>
          <div style={{ flex: "0 0 auto", minWidth: 110 }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#9ca3af", letterSpacing: "0.14em", textTransform: "uppercase" }}>SKU NUMBER</p>
            <p style={{ margin: "8px 0 0", fontSize: 22, fontWeight: 900, color: "#e87c27" }}>{skuKey || "—"}</p>
          </div>
          <div style={{ flex: "1 1 220px", minWidth: 200, borderLeft: "1px solid #eef0f3", paddingLeft: 28 }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#9ca3af", letterSpacing: "0.14em", textTransform: "uppercase" }}>PRODUCT DESCRIPTION</p>
            <p style={{ margin: "8px 0 0", fontSize: 15, fontWeight: 600, color: "#111827", lineHeight: 1.45 }}>{skuInfo.desc}</p>
          </div>
          <div style={{ flex: "0 0 auto", minWidth: 100, borderLeft: "1px solid #eef0f3", paddingLeft: 28 }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#9ca3af", letterSpacing: "0.12em", textTransform: "uppercase" }}>WEIGHT</p>
            <p style={{ margin: "8px 0 0", fontSize: 16, fontWeight: 800, color: "#111827" }}>{skuInfo.weight}</p>
          </div>
        </div>
      </div>

    <div style={{ display: "flex", gap: 4, alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #e5e7eb", background: "#fff", borderRadius: "12px 12px 0 0", padding: "0 16px 0 0", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", position: "relative", zIndex: 1 }}>
  <div style={{ display: "flex" }}>
    {tabs.map((t) => (
      <button
        key={t.id}
        type="button"
        onClick={() => setActiveTab(t.id)}
        style={{
          padding: "14px 20px",
          background: "none",
          border: "none",
          cursor: "pointer",
          borderBottom: activeTab === t.id ? "3px solid #e87c27" : "3px solid transparent",
          color: activeTab === t.id ? "#e87c27" : "#9ca3af",
          fontSize: 14,
          fontWeight: 700,
          marginBottom: -2,
        }}
      >
        {t.label}
      </button>
    ))}
  </div>
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative" }}>
            <button onClick={() => setSortOpen(o => !o)} style={{ padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontFamily: "inherit", color: "#374151", fontWeight: 600 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 5h10"/><path d="M11 9h7"/><path d="M11 13h4"/>
              </svg>
            </button>
            {sortOpen && (
              <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 50, minWidth: 170, overflow: "hidden" }}>
                {[["newest","↓","Newest"],["oldest","↑","Oldest"],["az","","A–Z"],["za","","Z–A"]].map(([val,arrow,text]) => (
                  <div key={val} onClick={() => { setSortBy(val); setSortOpen(false); }}
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
      </div>

      {showStockCard && (
        <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 12px", flexWrap: "wrap", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 14px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
              {skuKey ? `Stock Card — ${skuKey}` : "All Transactions"}
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  <th colSpan={skuKey ? 8 : 9} style={{ background: "#1c2235", color: "#fff", fontWeight: 800, fontSize: 9, letterSpacing: "0.07em", textAlign: "center", padding: "9px 8px", textTransform: "uppercase", borderRight: "2px solid #2d3748" }}>META</th>
                  <th colSpan={4} style={{ background: "#92400e", color: "#fff", fontWeight: 800, fontSize: 9, letterSpacing: "0.07em", textAlign: "center", padding: "9px 8px", textTransform: "uppercase", borderRight: "2px solid #7c3300" }}>RECEIVED PURCHASES</th>
                  <th colSpan={8} style={{ background: "#92400e", color: "#fff", fontWeight: 800, fontSize: 9, letterSpacing: "0.07em", textAlign: "center", padding: "9px 8px", textTransform: "uppercase", borderRight: skuKey ? "2px solid #7c3300" : "none" }}>DELIVERED GOODS</th>
                  {skuKey && <th colSpan={3} style={{ background: "#166534", color: "#fff", fontWeight: 800, fontSize: 9, letterSpacing: "0.07em", textAlign: "center", padding: "9px 8px", textTransform: "uppercase", borderRight: "2px solid #14532d" }}>BALANCE</th>}
                  <th rowSpan={2} style={{ background: "#374151", color: "#fff", fontWeight: 800, fontSize: 9, letterSpacing: "0.07em", textAlign: "center", padding: "9px 8px", textTransform: "uppercase", verticalAlign: "middle" }}>REMARKS</th>
                </tr>
                <tr>
                  {!skuKey && <th style={{ background: "#1c2235", color: "#fff", fontWeight: 700, fontSize: 9, padding: "8px 8px", textAlign: "center", whiteSpace: "nowrap", letterSpacing: "0.04em", borderTop: "1px solid #2d3748" }}>SKU</th>}
                  <th style={{ background: "#1c2235", color: "#fff", fontWeight: 700, fontSize: 9, padding: "8px 8px", textAlign: "center", whiteSpace: "nowrap", letterSpacing: "0.04em", borderTop: "1px solid #2d3748" }}>TRANS NOS.</th>
                  <th style={{ background: "#1c2235", color: "#fff", fontWeight: 700, fontSize: 9, padding: "8px 8px", textAlign: "center", whiteSpace: "nowrap", letterSpacing: "0.04em", borderTop: "1px solid #2d3748" }}>DATE TODAY</th>
                  <th style={{ background: "#1c2235", color: "#fff", fontWeight: 700, fontSize: 9, padding: "8px 8px", textAlign: "center", whiteSpace: "nowrap", letterSpacing: "0.04em", borderTop: "1px solid #2d3748" }}>TDT PO#</th>
                  <th style={{ background: "#1c2235", color: "#fff", fontWeight: 700, fontSize: 9, padding: "8px 8px", textAlign: "center", whiteSpace: "nowrap", letterSpacing: "0.04em", borderTop: "1px solid #2d3748" }}>TDT PO DATE</th>
                  <th style={{ background: "#1c2235", color: "#fff", fontWeight: 700, fontSize: 9, padding: "8px 8px", textAlign: "center", whiteSpace: "nowrap", letterSpacing: "0.04em", borderTop: "1px solid #2d3748" }}>VENDOR'S NAME</th>
                  <th style={{ background: "#1c2235", color: "#fff", fontWeight: 700, fontSize: 9, padding: "8px 8px", textAlign: "center", whiteSpace: "nowrap", letterSpacing: "0.04em", borderTop: "1px solid #2d3748" }}>CUSTOMER'S NAME AS PER DR</th>
                  <th style={{ background: "#1c2235", color: "#fff", fontWeight: 700, fontSize: 9, padding: "8px 8px", textAlign: "center", whiteSpace: "nowrap", letterSpacing: "0.04em", borderTop: "1px solid #2d3748" }}>TDT WO#</th>
                  <th style={{ background: "#1c2235", color: "#fff", fontWeight: 700, fontSize: 9, padding: "8px 8px", textAlign: "center", whiteSpace: "nowrap", letterSpacing: "0.04em", borderTop: "1px solid #2d3748", borderRight: "2px solid #2d3748" }}>ACCEPTANCE DATE</th>
                  <th style={{ background: "#92400e", color: "#fff", fontWeight: 700, fontSize: 9, padding: "8px 8px", textAlign: "right", whiteSpace: "nowrap", letterSpacing: "0.04em", borderTop: "1px solid #7c3300" }}>QTY</th>
                  <th style={{ background: "#92400e", color: "#fff", fontWeight: 700, fontSize: 9, padding: "8px 8px", textAlign: "right", whiteSpace: "nowrap", letterSpacing: "0.04em", borderTop: "1px solid #7c3300" }}>COST/KILO</th>
                  <th style={{ background: "#92400e", color: "#fff", fontWeight: 700, fontSize: 9, padding: "8px 8px", textAlign: "right", whiteSpace: "nowrap", letterSpacing: "0.04em", borderTop: "1px solid #7c3300" }}>COST/UNIT</th>
                  <th style={{ background: "#92400e", color: "#fff", fontWeight: 700, fontSize: 9, padding: "8px 8px", textAlign: "right", whiteSpace: "nowrap", letterSpacing: "0.04em", borderTop: "1px solid #7c3300", borderRight: "2px solid #7c3300" }}>TOTAL PURCHASES</th>
                  <th style={{ background: "#92400e", color: "#fff", fontWeight: 700, fontSize: 9, padding: "8px 8px", textAlign: "center", whiteSpace: "nowrap", letterSpacing: "0.04em", borderTop: "1px solid #7c3300" }}>DISPATCH DATE</th>
                  <th style={{ background: "#92400e", color: "#fff", fontWeight: 700, fontSize: 9, padding: "8px 8px", textAlign: "right", whiteSpace: "nowrap", letterSpacing: "0.04em", borderTop: "1px solid #7c3300" }}>QTY</th>
                  <th style={{ background: "#92400e", color: "#fff", fontWeight: 700, fontSize: 9, padding: "8px 8px", textAlign: "right", whiteSpace: "nowrap", letterSpacing: "0.04em", borderTop: "1px solid #7c3300" }}>UNIT COST</th>
                  <th style={{ background: "#92400e", color: "#fff", fontWeight: 700, fontSize: 9, padding: "8px 8px", textAlign: "right", whiteSpace: "nowrap", letterSpacing: "0.04em", borderTop: "1px solid #7c3300" }}>PRICE</th>
                  <th style={{ background: "#92400e", color: "#fff", fontWeight: 700, fontSize: 9, padding: "8px 8px", textAlign: "center", whiteSpace: "nowrap", letterSpacing: "0.04em", borderTop: "1px solid #7c3300" }}>TDT DR#</th>
                  <th style={{ background: "#92400e", color: "#fff", fontWeight: 700, fontSize: 9, padding: "8px 8px", textAlign: "center", whiteSpace: "nowrap", letterSpacing: "0.04em", borderTop: "1px solid #7c3300" }}>BRANCH</th>
                  <th style={{ background: "#92400e", color: "#fff", fontWeight: 700, fontSize: 9, padding: "8px 8px", textAlign: "center", whiteSpace: "nowrap", letterSpacing: "0.04em", borderTop: "1px solid #7c3300" }}>SUMMARY OF TDT BDR'S#</th>
                  <th style={{ background: "#92400e", color: "#fff", fontWeight: 700, fontSize: 9, padding: "8px 8px", textAlign: "center", whiteSpace: "nowrap", letterSpacing: "0.04em", borderTop: "1px solid #7c3300", borderRight: skuKey ? "2px solid #7c3300" : "none" }}>TDT SI#</th>
                  {skuKey && <th style={{ background: "#166534", color: "#fff", fontWeight: 700, fontSize: 9, padding: "8px 8px", textAlign: "right", whiteSpace: "nowrap", letterSpacing: "0.04em", borderTop: "1px solid #14532d" }}>QUANTITY</th>}
                  {skuKey && <th style={{ background: "#166534", color: "#fff", fontWeight: 700, fontSize: 9, padding: "8px 8px", textAlign: "right", whiteSpace: "nowrap", letterSpacing: "0.04em", borderTop: "1px solid #14532d" }}>UNIT COST</th>}
                  {skuKey && <th style={{ background: "#166534", color: "#fff", fontWeight: 700, fontSize: 9, padding: "8px 8px", textAlign: "right", whiteSpace: "nowrap", letterSpacing: "0.04em", borderTop: "1px solid #14532d", borderRight: "2px solid #14532d" }}>PRICE</th>}
                </tr>
              </thead>
              <tbody>
                {pagedCard.length === 0 ? (
                  <tr><td colSpan={skuKey ? 24 : 22} style={{ textAlign: "center", padding: "48px 20px", color: "#9ca3af" }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
                    No records found{searchSku ? <> for SKU <strong style={{ color: "#374151" }}>"{searchSku}"</strong></> : ""}.
                  </td></tr>
                ) : pagedCard.map((row, idx) => {
                  const isIn = row.type === "IN";
                  return (
                    <tr key={row.id} style={{ borderBottom: "1px solid #f5f5f6", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                      {!skuKey && <td style={{ padding: "14px 10px", fontWeight: 700, textAlign: "center", color: "#e87c27", whiteSpace: "nowrap" }}>{row.sku || "—"}</td>}
                      <td style={{ padding: "14px 10px", color: "#6b7280", fontWeight: 600, textAlign: "center", whiteSpace: "nowrap" }}>{row.transNo || "—"}</td>
                      <td style={{ padding: "14px 10px", whiteSpace: "nowrap", textAlign: "center" }}>{row.dateToday || "—"}</td>
                      <td style={{ padding: "14px 10px", color: "#e87c27", fontWeight: 700, textAlign: "center", whiteSpace: "nowrap" }}>{row.tdtPo || "—"}</td>
                      <td style={{ padding: "14px 10px", textAlign: "center", whiteSpace: "nowrap" }}>{row.tdtPoDate || "—"}</td>
                      <td style={{ padding: "14px 10px", textAlign: "center", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.vendorName}>{row.vendorName || "—"}</td>
                      <td style={{ padding: "14px 10px", textAlign: "center", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.customerDr}>{row.customerDr || "—"}</td>
                      <td style={{ padding: "14px 10px", textAlign: "center", whiteSpace: "nowrap" }}>{row.tdtWo || "—"}</td>
                      <td style={{ padding: "14px 10px", textAlign: "center", whiteSpace: "nowrap" }}>{row.acceptDate || "—"}</td>
                      <td style={{ padding: "14px 10px", textAlign: "right", fontWeight: 700, color: isIn ? "#15803d" : "#d1d5db" }}>{isIn && row.recvQty != null ? row.recvQty : "—"}</td>
                      <td style={{ padding: "14px 10px", textAlign: "right", color: isIn ? "#374151" : "#d1d5db" }}>{isIn && row.costKilo != null ? parseFloat(Number(row.costKilo).toFixed(2)) : "—"}</td>
                      <td style={{ padding: "14px 10px", textAlign: "right", color: isIn ? "#374151" : "#d1d5db" }}>{isIn && row.costUnit != null ? fmtPHP(row.costUnit) : "—"}</td>
                      <td style={{ padding: "14px 10px", textAlign: "right", fontWeight: 600, color: isIn ? "#374151" : "#d1d5db" }}>{isIn && row.totalPurchases != null ? fmtPHP(row.totalPurchases) : "—"}</td>
                      <td style={{ padding: "14px 10px", textAlign: "center", whiteSpace: "nowrap", color: !isIn ? "#374151" : "#d1d5db" }}>{!isIn && row.dispatchDate ? row.dispatchDate : "—"}</td>
                      <td style={{ padding: "14px 10px", textAlign: "right", fontWeight: 700, color: !isIn ? "#dc2626" : "#d1d5db" }}>{!isIn && row.delivQty != null ? row.delivQty : "—"}</td>
                      <td style={{ padding: "14px 10px", textAlign: "right", color: !isIn ? "#374151" : "#d1d5db" }}>{!isIn && row.unitCost != null ? fmtPHP(row.unitCost) : "—"}</td>
                      <td style={{ padding: "14px 10px", textAlign: "right", fontWeight: 600, color: !isIn ? "#374151" : "#d1d5db" }}>{!isIn && row.price != null ? fmtPHP(row.price) : "—"}</td>
                      <td style={{ padding: "14px 10px", color: !isIn ? "#e87c27" : "#d1d5db", fontWeight: 700, textAlign: "center", whiteSpace: "nowrap" }}>{!isIn && row.tdtDr ? row.tdtDr : "—"}</td>
                      <td style={{ padding: "14px 10px", textAlign: "center", color: !isIn ? "#374151" : "#d1d5db" }}>{!isIn && row.branch ? row.branch : "—"}</td>
                      <td style={{ padding: "14px 10px", textAlign: "center", color: !isIn ? "#374151" : "#d1d5db" }}>{!isIn && row.bdrSummary ? row.bdrSummary : "—"}</td>
                      <td style={{ padding: "14px 10px", textAlign: "center", color: !isIn ? "#374151" : "#d1d5db" }}>{!isIn && row.tdtSi ? row.tdtSi : "—"}</td>
                      {skuKey && <td style={{ padding: "14px 10px", textAlign: "right", fontWeight: 700 }}>{row.runningQty}</td>}
                      {skuKey && <td style={{ padding: "14px 10px", textAlign: "right" }}>{fmtPHP(row.avgUnitCost)}</td>}
                      {skuKey && <td style={{ padding: "14px 10px", textAlign: "right", fontWeight: 600 }}>{fmtPHP(row.runningValue)}</td>}
                      <td style={{ padding: "14px 10px", color: "#6b7280", textAlign: "left" }}>{row.remarks || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "14px 20px", borderTop: "1px solid #f3f4f6", background: "#fafafa" }}>
            <Pagination currentPage={cardPage} totalPages={cardTotalPages} onPage={setCardPage} />
          </div>
        </div>
      )}

      {showIn && (
        <SectionTable
          title="Received Purchases — Stock IN"
          cols={STOCK_IN_COLS}
          rows={pagedIn}
          rightAlign={RIGHT_IN}
          searchSku={searchSku}
          pagination={<Pagination currentPage={inPage} totalPages={inTotalPages} onPage={setInPage} />}
          renderRow={(row, idx) => {
            if (editingInId === row.id) {
              return <StockInInlineEditRow key={row.id} row={row} onSave={handleSaveInEdit} onCancel={() => setEditingInId(null)} />;
            }
            return (
            <tr key={row.id} style={{ borderBottom: "1px solid #f5f5f6", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
              <td style={{ padding: "14px 10px", color: "#6b7280", fontWeight: 600, textAlign: "center" }}>{row.transNo}</td>
              <td style={{ padding: "14px 10px", whiteSpace: "nowrap", textAlign: "center" }}>{row.date}</td>
<td style={{ padding: "14px 10px", color: "#e87c27", fontWeight: 700, textAlign: "center", whiteSpace: "nowrap" }}>{row.tdtPo}</td>
<td style={{ padding: "14px 10px", textAlign: "center", whiteSpace: "nowrap" }}>{row.tdtPoDate}</td>
              <td style={{ padding: "14px 10px", textAlign: "center" }}>{row.vendorNo}</td>
              <td style={{ padding: "14px 10px", textAlign: "center" }}>{row.vendorName}</td>
              <td style={{ padding: "14px 10px", textAlign: "center" }}>{row.customerDr}</td>
<td style={{ padding: "14px 10px", textAlign: "center", whiteSpace: "nowrap" }}>{row.tdtWo}</td>
              <td style={{ padding: "14px 10px", textAlign: "center" }}>{row.acceptDate}</td>
              <td style={{ padding: "14px 10px", textAlign: "right", fontWeight: 700 }}>{row.qty}</td>
              <td style={{ padding: "14px 10px", textAlign: "center" }}>{row.costKilo != null && row.costKilo !== "" ? parseFloat(Number(row.costKilo).toFixed(2)) : "—"}</td>
              <td style={{ padding: "14px 10px", textAlign: "right" }}>{fmtPHP(row.costUnit)}</td>
              <td style={{ padding: "14px 10px", textAlign: "right", fontWeight: 600 }}>{fmtPHP(row.totalPurchase)}</td>
              <td style={{ padding: "14px 10px", textAlign: "right", fontWeight: 700 }}>{row.runningQty}</td>
              <td style={{ padding: "14px 10px", textAlign: "right" }}>{fmtPHP(row.avgUnitCost)}</td>
              <td style={{ padding: "14px 10px", textAlign: "right", fontWeight: 600 }}>{fmtPHP(row.totalValue)}</td>
              <td style={{ padding: "14px 10px", color: "#6b7280", textAlign: "center" }}>{row.remark || "—"}</td>
              <td style={{ padding: "8px 8px", textAlign: "center" }}>
                <button onClick={() => setEditingInId(row.id)} title="Edit" style={{ padding: "5px 8px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                  <IconEdit size={12} /> Edit
                </button>
              </td>
            </tr>
          );
          }}
        />
      )}

      {showOut && (
        <SectionTable
          title="Delivered Goods — Stock OUT"
          cols={STOCK_OUT_COLS}
          rows={pagedOut}
          rightAlign={RIGHT_OUT_BASE}
          searchSku={searchSku}
          pagination={<Pagination currentPage={outPage} totalPages={outTotalPages} onPage={setOutPage} />}
          renderRow={(row, idx) => {
            if (editingOutId === row.id) {
              return <StockOutInlineEditRow key={row.id} row={row} onSave={handleSaveOutEdit} onCancel={() => setEditingOutId(null)} />;
            }
            return (
              <tr key={row.id} style={{ borderBottom: "1px solid #f5f5f6", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={{ padding: "14px 10px", color: "#6b7280", fontWeight: 600, textAlign: "center", whiteSpace: "nowrap" }}>{row.transNo}</td>
                <td style={{ padding: "14px 10px", whiteSpace: "nowrap", textAlign: "center" }}>{row.dispatchDate}</td>
                <td style={{ padding: "14px 10px", textAlign: "center", whiteSpace: "nowrap" }}>{row.tdtWo}</td>
                <td style={{ padding: "14px 10px", fontWeight: 600, textAlign: "center", whiteSpace: "nowrap" }}>{row.customer}</td>
                <td style={{ padding: "14px 10px", color: "#e87c27", fontWeight: 700, textAlign: "center" }}>{row.tdtDr}</td>
                <td style={{ padding: "14px 10px", textAlign: "center" }}>{row.branch}</td>
                <td style={{ padding: "14px 10px", textAlign: "center" }}>{row.bdrSummary}</td>
                <td style={{ padding: "14px 10px", textAlign: "center" }}>{row.tdtSi}</td>
                <td style={{ padding: "14px 10px", textAlign: "right", fontWeight: 700 }}>{row.qtyOut}</td>
                <td style={{ padding: "14px 10px", textAlign: "right" }}>{fmtPHP(row.unitCost)}</td>
                <td style={{ padding: "14px 10px", textAlign: "right", fontWeight: 600 }}>{fmtPHP(row.totalPrice)}</td>
                <td style={{ padding: "14px 10px", textAlign: "right", fontWeight: 700 }}>{row.runningQty}</td>
                <td style={{ padding: "14px 10px", textAlign: "right" }}>{fmtPHP(row.runningValue)}</td>
                <td style={{ padding: "14px 10px", color: "#6b7280", textAlign: "center" }}>{row.remarks || "—"}</td>
                <td style={{ padding: "8px 8px", textAlign: "center" }}>
                  <button onClick={() => setEditingOutId(row.id)} title="Edit" style={{ padding: "5px 8px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                    <IconEdit size={12} /> Edit
                  </button>
                </td>
              </tr>
            );
          }}
        />
      )}



      {toast && (
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, background: toast.type === "error" ? "#dc2626" : "#16a34a", color: "#fff", borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}>
          {toast.msg}
        </div>
      )}

      {showCreate && (
        <div style={modalOverlayStyle} onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div style={{ ...modalPanelStyle, width: "min(580px, 96vw)" }}>
            <div style={modalHeaderStyle}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={modalTitleStyle}>New Stock Sheet Entry</h2>
                <p style={{ ...modalSubtitleStyle, margin: "4px 0 0" }}>Add a stock in or stock out transaction. Fields marked with * are required.</p>
              </div>
              <button type="button" onClick={() => setShowCreate(false)} style={modalCloseBtnStyle} aria-label="Close"
                onMouseEnter={e => e.currentTarget.style.background = "#e5e7eb"}
                onMouseLeave={e => e.currentTarget.style.background = "#f3f4f6"}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", gap: 8 }}>
                {["in", "out"].map(t => (
                  <button key={t} type="button" onClick={() => setCreateForm(f => ({ ...f, type: t }))}
                    style={{ flex: 1, padding: "10px 16px", border: `2px solid ${createForm.type === t ? (t === "in" ? "#16a34a" : "#dc2626") : "#e5e7eb"}`, borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all 0.15s",
                      background: createForm.type === t ? (t === "in" ? "#f0fdf4" : "#fef2f2") : "#f9fafb",
                      color: createForm.type === t ? (t === "in" ? "#16a34a" : "#dc2626") : "#6b7280" }}>
                    {t === "in" ? "▲ Stock In" : "▼ Stock Out"}
                  </button>
                ))}
              </div>
              {(() => {
                const set = (k, v) => setCreateForm(f => ({ ...f, [k]: v }));
                const inp = (key, label, type = "text", placeholder = "", full = false) => (
                  <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: full ? "1 / -1" : undefined }}>
                    <label style={modalLabelStyle}>{label}</label>
                    <input type={type} value={createForm[key] || ""} onChange={e => set(key, e.target.value)} placeholder={placeholder} {...modalInput()} />
                  </div>
                );
                const commonFields = [inp("sku", "SKU Code *", "text", "e.g. DRB052")];
                const inFields = [
                  inp("date", "Date *", "date"),
                  inp("tdtPo", "TDT PO #", "text", "e.g. PO-2026-001"),
                  inp("tdtPoDate", "TDT PO Date", "date"),
                  inp("vendorNo", "Vendor #", "text", "e.g. V-001"),
                  inp("vendorName", "Vendor Name", "text", "e.g. Steel Asia Corp"),
                  inp("customerDr", "Customer's Name as per DR", "text", "e.g. RCM Builders", true),
                  inp("tdtWo", "TDT WO #", "text", "e.g. WO-001"),
                  inp("acceptDate", "Acceptance Date", "date"),
                  inp("qty", "QTY *", "number", "0"),
                  inp("costKilo", "Cost/Kilo", "number", "0.00"),
                  inp("costUnit", "Cost/Unit (₱)", "number", "0.00"),
                ];
                const outFields = [
                  inp("dispatchDate", "Dispatch Date *", "date"),
                  inp("tdtWo", "TDT WO #", "text", "e.g. WO-001"),
                  inp("customer", "Customer Name *", "text", "e.g. RCM Builders", true),
                  inp("tdtDr", "TDT DR #", "text", "e.g. DR26050"),
                  inp("branch", "Branch", "text", "e.g. Manila"),
                  inp("bdrSummary", "Summary of TDT BDR #", "text", "e.g. BDR-001"),
                  inp("tdtSi", "TDT SI #", "text", "e.g. SI-001"),
                  inp("qtyOut", "QTY Out *", "number", "0"),
                  inp("costUnit", "Unit Cost (₱)", "number", "0.00"),
                  inp("remarks", "Remarks", "text", "Optional notes", true),
                ];
                return (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" }}>
                    {commonFields}
                    {createForm.type === "in" ? inFields : outFields}
                  </div>
                );
              })()}
            </div>
            <div style={modalFooterStyle}>
              <button type="button" onClick={() => setShowCreate(false)} style={modalBtnSecondary}>Cancel</button>
              <button type="button" onClick={() => {
                const isIn = createForm.type === "in";
                if (!createForm.sku || (isIn && (!createForm.date || !createForm.qty)) || (!isIn && (!createForm.dispatchDate || !createForm.qtyOut))) {
                  setToast({ msg: `Please fill in SKU, Date, and ${isIn ? "QTY" : "QTY Out"}.`, type: "error" });
                  setTimeout(() => setToast(null), 3000);
                  return;
                }
                const sku = createForm.sku.trim().toUpperCase();
                const doCreate = () => {
                  if (isIn) {
                    const qty = Number(createForm.qty) || 0;
                    const costUnit = Number(createForm.costUnit) || 0;
                    const newRow = {
                      id: Date.now(),
                      sku, transNo: String(stockInData.filter(r => r.sku === sku).length + 1).padStart(3, "0"),
                      date: createForm.date, tdtPo: createForm.tdtPo, tdtPoDate: createForm.tdtPoDate,
                      vendorNo: createForm.vendorNo, vendorName: createForm.vendorName,
                      customerDr: createForm.customerDr, tdtWo: createForm.tdtWo,
                      acceptDate: createForm.acceptDate, qty,
                      costKilo: Number(createForm.costKilo) || 0, costUnit,
                      totalPurchase: qty * costUnit, runningQty: 0, avgUnitCost: costUnit, totalValue: 0, remark: "",
                    };
                    const next = [...stockInData, newRow];
                    setStockInData(next);
                    syncInUp(next);
                    setLastAddedInId(newRow.id);
                  } else {
                    const qtyOut = Number(createForm.qtyOut) || 0;
                    const unitCost = Number(createForm.costUnit) || 0;
                    const newRow = {
                      id: Date.now(),
                      sku, transNo: String(stockOutData.filter(r => r.sku === sku).length + 1).padStart(3, "0"),
                      dispatchDate: createForm.dispatchDate, tdtWo: createForm.tdtWo,
                      customer: createForm.customer, tdtDr: createForm.tdtDr,
                      branch: createForm.branch, bdrSummary: createForm.bdrSummary,
                      tdtSi: createForm.tdtSi, qtyOut, unitCost,
                      totalPrice: qtyOut * unitCost, s1: "", s2: "", s3: "",
                      runningQty: 0, runningValue: 0, remarks: createForm.remarks,
                    };
                    const next = [...stockOutData, newRow];
                    setStockOutData(next);
                    syncOutUp(next);
                    setLastAddedOutId(newRow.id);
                  }
                };
                doCreate();
                setShowCreate(false);
                setCreateForm({ ...EMPTY_FORM, sku: searchSku });
                setInPage(1);
                setOutPage(1);
                setToast({ msg: "Stock sheet entry added successfully.", type: "success" });
                setTimeout(() => setToast(null), 3000);
              }} style={modalBtnPrimary}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}