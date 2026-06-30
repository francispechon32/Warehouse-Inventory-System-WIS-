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
} from "./modalFormStyles";
import Table from "./Table";
import { fmtPHP } from "./formatUtils";
import Highlight from "./Highlight";

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

const PAGE_SIZE = 8;
const RIGHT_IN = new Set(["QTY", "COST/KILO", "COST/UNIT", "TOTAL PURCHASE", "RUNNING QTY", "AVG UNIT COST", "TOTAL VALUE"]);
const RIGHT_OUT_BASE = new Set(["QTY OUT", "UNIT COST", "TOTAL PRICE", "RUNNING QTY", "RUNNING VALUE"]);


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
    deliveries: [],
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
    deliveries: r.deliveries || (r.tdtDr ? [{
      tdtDr: r.tdtDr,
      branch: r.branch || "",
      bdrSummary: r.bdrSummary || "",
      tdtSi: r.tdtSi || "",
      qty: r.qtyOut ?? 0,
    }] : []),
  }));
  const merged = [...inMapped, ...outMapped].sort((a, b) => {
    const dateCmp = a._sortDate.localeCompare(b._sortDate);
    if (dateCmp !== 0) return dateCmp;
    if (a._type !== b._type) return a._type === "IN" ? -1 : 1;
    return a._sortTrans.localeCompare(b._sortTrans, undefined, { numeric: true });
  });
  let runningQty = 0;
  let runningValue = 0;
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
function IconChevronDown({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>;
}
function IconChevronUp({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6" /></svg>;
}
function IconInfo({ size = 13 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
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

function IconGear({ size = 15 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
}

function StockInEditModal({ row, onSave, onClose }) {
  const [draft, setDraft] = useState({ ...row });
  const set = (k, v) => setDraft(d => {
    const next = { ...d, [k]: v };
    if (k === "qty" || k === "costUnit") {
      const q = parseFloat(k === "qty" ? v : next.qty) || 0;
      const cu = parseFloat(k === "costUnit" ? v : next.costUnit) || 0;
      next.totalPurchase = q * cu;
    }
    return next;
  });
  const inp = { width: "100%", padding: "9px 12px", fontSize: 13, border: "1px solid #e2e8f0", borderRadius: 8, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff", color: "#111827" };
  const F = ({ label, children, full }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: full ? "1 / -1" : undefined }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      {children}
    </div>
  );
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 18, width: "min(660px, 96vw)", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 64px rgba(15,23,42,0.18), 0 0 0 1px rgba(15,23,42,0.06)" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f0f1f3", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="17 11 12 6 7 11"/><line x1="12" y1="6" x2="12" y2="18"/></svg>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111827" }}>Edit Stock IN — {draft.transNo}</h2>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6b7280" }}>Update the transaction fields below.</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}><IconX size={15} /></button>
        </div>
        <div style={{ padding: "18px 24px", overflowY: "auto", flex: 1, background: "#fff" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 18px" }}>
            <F label="Date *"><input type="date" value={draft.date || ""} onChange={e => set("date", e.target.value)} style={inp} /></F>
            <F label="TDT PO #"><input value={draft.tdtPo || ""} onChange={e => set("tdtPo", e.target.value)} style={inp} placeholder="e.g. PO-2026-001" /></F>
            <F label="TDT PO Date"><input type="date" value={draft.tdtPoDate || ""} onChange={e => set("tdtPoDate", e.target.value)} style={inp} /></F>
            <F label="Vendor #"><input value={draft.vendorNo || ""} onChange={e => set("vendorNo", e.target.value)} style={inp} /></F>
            <F label="Vendor Name" full><input value={draft.vendorName || ""} onChange={e => set("vendorName", e.target.value)} style={inp} /></F>
            <F label="Customer's Name as per DR" full><input value={draft.customerDr || ""} onChange={e => set("customerDr", e.target.value)} style={inp} /></F>
            <F label="TDT WO #"><input value={draft.tdtWo || ""} onChange={e => set("tdtWo", e.target.value)} style={inp} /></F>
            <F label="Acceptance Date"><input type="date" value={draft.acceptDate || ""} onChange={e => set("acceptDate", e.target.value)} style={inp} /></F>
            <F label="QTY *"><input type="number" min={0} value={draft.qty ?? ""} onChange={e => set("qty", parseFloat(e.target.value) || 0)} style={{ ...inp, textAlign: "right" }} /></F>
            <F label="Cost / Kilo"><input type="number" min={0} step="0.01" value={draft.costKilo ?? ""} onChange={e => set("costKilo", parseFloat(e.target.value) || 0)} style={{ ...inp, textAlign: "right" }} /></F>
            <F label="Cost / Unit (₱)"><input type="number" min={0} step="0.01" value={draft.costUnit ?? ""} onChange={e => set("costUnit", parseFloat(e.target.value) || 0)} style={{ ...inp, textAlign: "right" }} /></F>
            <F label="Total Purchase (computed)"><input readOnly value={fmtPHP(draft.totalPurchase || 0)} style={{ ...inp, background: "#f8fafc", color: "#6b7280", cursor: "default" }} /></F>
            <F label="Remark" full><input value={draft.remark || ""} onChange={e => set("remark", e.target.value)} style={inp} placeholder="Optional notes..." /></F>
          </div>
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid #e8ecf1", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "9px 18px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", color: "#374151", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>Cancel</button>
          <button onClick={() => onSave(draft)} style={{ padding: "9px 18px", border: "none", borderRadius: 8, background: "linear-gradient(135deg, #f09540 0%, #e87c27 100%)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit", boxShadow: "0 4px 12px rgba(232,124,39,0.35)" }}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

function StockOutEditModal({ row, onSave, onClose }) {
  const [draft, setDraft] = useState({ ...row });
  const set = (k, v) => setDraft(d => {
    const next = { ...d, [k]: v };
    if (k === "qtyOut" || k === "unitCost") {
      const q = parseFloat(k === "qtyOut" ? v : next.qtyOut) || 0;
      const uc = parseFloat(k === "unitCost" ? v : next.unitCost) || 0;
      next.totalPrice = q * uc;
    }
    return next;
  });
  const inp = { width: "100%", padding: "9px 12px", fontSize: 13, border: "1px solid #e2e8f0", borderRadius: 8, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff", color: "#111827" };
  const F = ({ label, children, full }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: full ? "1 / -1" : undefined }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      {children}
    </div>
  );
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 18, width: "min(620px, 96vw)", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 64px rgba(15,23,42,0.18), 0 0 0 1px rgba(15,23,42,0.06)" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f0f1f3", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "#fff1f2", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="17 13 12 18 7 13"/><line x1="12" y1="6" x2="12" y2="18"/></svg>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111827" }}>Edit Stock OUT — {draft.transNo}</h2>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6b7280" }}>Update the delivery details below.</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}><IconX size={15} /></button>
        </div>
        <div style={{ padding: "18px 24px", overflowY: "auto", flex: 1, background: "#fff" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 18px" }}>
            <F label="Dispatch Date *"><input type="date" value={draft.dispatchDate || ""} onChange={e => set("dispatchDate", e.target.value)} style={inp} /></F>
            <F label="TDT WO #"><input value={draft.tdtWo || ""} onChange={e => set("tdtWo", e.target.value)} style={inp} /></F>
            <F label="Customer Name *" full><input value={draft.customer || ""} onChange={e => set("customer", e.target.value)} style={inp} /></F>
            <F label="TDT DR #"><input value={draft.tdtDr || ""} onChange={e => set("tdtDr", e.target.value)} style={inp} /></F>
            <F label="Branch"><input value={draft.branch || ""} onChange={e => set("branch", e.target.value)} style={inp} /></F>
            <F label="Summary of TDT BDR #" full><input value={draft.bdrSummary || ""} onChange={e => set("bdrSummary", e.target.value)} style={inp} /></F>
            <F label="TDT SI #"><input value={draft.tdtSi || ""} onChange={e => set("tdtSi", e.target.value)} style={inp} /></F>
            <F label="QTY Out *"><input type="number" min={0} value={draft.qtyOut ?? ""} onChange={e => set("qtyOut", parseFloat(e.target.value) || 0)} style={{ ...inp, textAlign: "right" }} /></F>
            <F label="Unit Cost (₱)"><input type="number" min={0} step="0.01" value={draft.unitCost ?? ""} onChange={e => set("unitCost", parseFloat(e.target.value) || 0)} style={{ ...inp, textAlign: "right" }} /></F>
            <F label="Total Price (computed)"><input readOnly value={fmtPHP(draft.totalPrice || 0)} style={{ ...inp, background: "#f8fafc", color: "#6b7280", cursor: "default" }} /></F>
            <F label="Remarks" full><input value={draft.remarks || ""} onChange={e => set("remarks", e.target.value)} style={inp} placeholder="Optional notes..." /></F>
          </div>
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid #e8ecf1", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "9px 18px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", color: "#374151", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>Cancel</button>
          <button onClick={() => onSave(draft)} style={{ padding: "9px 18px", border: "none", borderRadius: 8, background: "linear-gradient(135deg, #f09540 0%, #e87c27 100%)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit", boxShadow: "0 4px 12px rgba(232,124,39,0.35)" }}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

const IN_TOGGLE_COLS = [
  { key: "customerDr", label: "Customer DR" },
  { key: "tdtWo",      label: "TDT WO #" },
  { key: "acceptDate", label: "Accept Date" },
  { key: "costKilo",   label: "Cost/Kilo" },
  { key: "avgUnitCost",label: "Avg Unit Cost" },
  { key: "totalValue", label: "Total Value" },
  { key: "remark",     label: "Remark" },
];

function CompactStockInTable({ rows, searchSku, onEdit, pagination }) {
  const [hiddenCols, setHiddenCols] = useState(new Set(["customerDr", "tdtWo"]));
  const [colVisOpen, setColVisOpen] = useState(false);
  const colVisRef = useRef(null);
  const hid = hiddenCols;
  useEffect(() => {
    if (!colVisOpen) return;
    const h = (e) => { if (colVisRef.current && !colVisRef.current.contains(e.target)) setColVisOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [colVisOpen]);
  const toggleCol = (key) => setHiddenCols(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const TH = { padding: "8px 10px", fontSize: 10, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap", background: "#1c2235", textAlign: "center" };
  const TD = { padding: "6px 10px", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", verticalAlign: "middle", borderBottom: "1px solid #f0f1f3", color: "#374151" };
  return (
    <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden", marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid #f0f1f3", background: "#fafbfc" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 12px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>Received Purchases — Stock IN</span>
        <div style={{ position: "relative" }} ref={colVisRef}>
          <button onClick={() => setColVisOpen(o => !o)} className={`wis-colvis-btn${colVisOpen ? " wis-colvis-btn-active" : ""}`}>
            <IconGear size={13} /> Columns
          </button>
          {colVisOpen && (
            <div className="wis-colvis-dropdown">
              <div style={{ padding: "5px 14px 3px", fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>Show / Hide</div>
              {IN_TOGGLE_COLS.map(({ key, label }) => (
                <label key={key} className="wis-colvis-option">
                  <input type="checkbox" checked={!hid.has(key)} onChange={() => toggleCol(key)} />
                  {label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="wis-table-scroll">
        <table className="wis-table" style={{ fontSize: 11 }}>
          <thead className="wis-thead">
            <tr className="wis-tr">
              <th className="wis-th wis-th-sticky" style={{ ...TH, padding: "8px 12px" }}>TRANS #</th>
              <th style={TH}>DATE</th>
              <th style={{ ...TH, textAlign: "left", padding: "8px 12px" }}>VENDOR INFO</th>
              <th style={{ ...TH, textAlign: "left", padding: "8px 12px" }}>PO INFO</th>
              {!hid.has("customerDr") && <th style={{ ...TH, textAlign: "left" }}>CUSTOMER DR</th>}
              {!hid.has("tdtWo") && <th style={TH}>TDT WO #</th>}
              {!hid.has("acceptDate") && <th style={TH}>ACCEPT DATE</th>}
              <th style={{ ...TH, textAlign: "right" }}>QTY</th>
              {!hid.has("costKilo") && <th style={{ ...TH, textAlign: "right" }}>COST/KILO</th>}
              <th style={{ ...TH, textAlign: "right" }}>COST/UNIT</th>
              <th style={{ ...TH, textAlign: "right" }}>TOTAL PURCHASE</th>
              <th style={{ ...TH, textAlign: "right" }}>RUNNING QTY</th>
              {!hid.has("avgUnitCost") && <th style={{ ...TH, textAlign: "right" }}>AVG UNIT COST</th>}
              {!hid.has("totalValue") && <th style={{ ...TH, textAlign: "right" }}>TOTAL VALUE</th>}
              {!hid.has("remark") && <th style={{ ...TH, textAlign: "left" }}>REMARK</th>}
            </tr>
          </thead>
          <tbody className="wis-tbody">
            {rows.length === 0 ? (
              <tr><td colSpan={20} className="wis-empty" style={{ padding: "40px 20px" }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>🔍</div>
                No records found{searchSku ? ` for SKU "${searchSku}"` : ""}.
              </td></tr>
            ) : rows.map((row, idx) => {
              const rowBg = idx % 2 === 0 ? "#fff" : "#fafbfc";
              return (
                <tr key={row.id} onClick={() => onEdit(row)} style={{ cursor: "pointer" }} className={idx % 2 === 0 ? "wis-tr wis-tr-even" : "wis-tr wis-tr-odd"}>
                  <td className="wis-td wis-td-sticky" style={{ ...TD, fontWeight: 700, color: "#6b7280", textAlign: "center", background: rowBg, minWidth: 70 }}>{row.transNo}</td>
                  <td style={{ ...TD, textAlign: "center", color: "#6b7280", minWidth: 85 }}>{row.date || "—"}</td>
                  <td style={{ ...TD, minWidth: 130 }}>
                    <div style={{ fontWeight: 700, fontSize: 11, color: "#374151", overflow: "hidden", textOverflow: "ellipsis" }} title={row.vendorNo}>{row.vendorNo || "—"}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis" }} title={row.vendorName}>{row.vendorName || "—"}</div>
                  </td>
                  <td style={{ ...TD, minWidth: 120 }}>
                    <div style={{ fontWeight: 700, fontSize: 11, color: "#e87c27", overflow: "hidden", textOverflow: "ellipsis" }} title={row.tdtPo}>{row.tdtPo || "—"}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis" }}>{row.tdtPoDate || "—"}</div>
                  </td>
                  {!hid.has("customerDr") && <td style={{ ...TD, maxWidth: 130 }} title={row.customerDr}>{row.customerDr || "—"}</td>}
                  {!hid.has("tdtWo") && <td style={{ ...TD, textAlign: "center", fontWeight: 600, color: "#e87c27" }}>{row.tdtWo || "—"}</td>}
                  {!hid.has("acceptDate") && <td style={{ ...TD, textAlign: "center", color: "#6b7280" }}>{row.acceptDate || "—"}</td>}
                  <td style={{ ...TD, textAlign: "right", fontWeight: 700 }}>{row.qty ?? "—"}</td>
                  {!hid.has("costKilo") && <td style={{ ...TD, textAlign: "right" }}>{row.costKilo != null && row.costKilo !== "" ? parseFloat(Number(row.costKilo).toFixed(2)) : "—"}</td>}
                  <td style={{ ...TD, textAlign: "right" }}>{fmtPHP(row.costUnit)}</td>
                  <td style={{ ...TD, textAlign: "right", fontWeight: 700 }}>{fmtPHP(row.totalPurchase)}</td>
                  <td style={{ ...TD, textAlign: "right", fontWeight: 700 }}>{row.runningQty ?? "—"}</td>
                  {!hid.has("avgUnitCost") && <td style={{ ...TD, textAlign: "right" }}>{fmtPHP(row.avgUnitCost)}</td>}
                  {!hid.has("totalValue") && <td style={{ ...TD, textAlign: "right", fontWeight: 700 }}>{fmtPHP(row.totalValue)}</td>}
                  {!hid.has("remark") && <td style={{ ...TD, maxWidth: 130 }} title={row.remark}>{row.remark || "—"}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pagination && <div className="wis-pagination" style={{ justifyContent: "flex-end" }}>{pagination}</div>}
    </div>
  );
}

const OUT_TOGGLE_COLS = [
  { key: "tdtWo",       label: "TDT WO #" },
  { key: "customer",    label: "Customer Name" },
  { key: "bdrSummary",  label: "BDR Summary" },
  { key: "tdtSi",       label: "TDT SI #" },
  { key: "runningValue",label: "Running Value" },
  { key: "remarks",     label: "Remarks" },
];

function CompactStockOutTable({ rows, searchSku, onEdit, pagination }) {
  const [hiddenCols, setHiddenCols] = useState(new Set(["bdrSummary", "tdtSi"]));
  const [colVisOpen, setColVisOpen] = useState(false);
  const colVisRef = useRef(null);
  const hid = hiddenCols;
  useEffect(() => {
    if (!colVisOpen) return;
    const h = (e) => { if (colVisRef.current && !colVisRef.current.contains(e.target)) setColVisOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [colVisOpen]);
  const toggleCol = (key) => setHiddenCols(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const TH = { padding: "8px 10px", fontSize: 10, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap", background: "#1c2235", textAlign: "center" };
  const TD = { padding: "6px 10px", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", verticalAlign: "middle", borderBottom: "1px solid #f0f1f3", color: "#374151" };
  return (
    <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden", marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid #f0f1f3", background: "#fafbfc" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 12px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>Delivered Goods — Stock OUT</span>
        <div style={{ position: "relative" }} ref={colVisRef}>
          <button onClick={() => setColVisOpen(o => !o)} className={`wis-colvis-btn${colVisOpen ? " wis-colvis-btn-active" : ""}`}>
            <IconGear size={13} /> Columns
          </button>
          {colVisOpen && (
            <div className="wis-colvis-dropdown">
              <div style={{ padding: "5px 14px 3px", fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>Show / Hide</div>
              {OUT_TOGGLE_COLS.map(({ key, label }) => (
                <label key={key} className="wis-colvis-option">
                  <input type="checkbox" checked={!hid.has(key)} onChange={() => toggleCol(key)} />
                  {label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="wis-table-scroll">
        <table className="wis-table" style={{ fontSize: 11 }}>
          <thead className="wis-thead">
            <tr className="wis-tr">
              <th className="wis-th wis-th-sticky" style={{ ...TH, padding: "8px 12px" }}>TRANS #</th>
              <th style={TH}>DISPATCH DATE</th>
              {!hid.has("tdtWo") && <th style={TH}>TDT WO #</th>}
              {!hid.has("customer") && <th style={{ ...TH, textAlign: "left", padding: "8px 12px" }}>CUSTOMER NAME</th>}
              <th style={TH}>TDT DR #</th>
              <th style={TH}>BRANCH</th>
              {!hid.has("bdrSummary") && <th style={{ ...TH, textAlign: "left" }}>BDR SUMMARY</th>}
              {!hid.has("tdtSi") && <th style={TH}>TDT SI #</th>}
              <th style={{ ...TH, textAlign: "right" }}>QTY OUT</th>
              <th style={{ ...TH, textAlign: "right" }}>UNIT COST</th>
              <th style={{ ...TH, textAlign: "right" }}>TOTAL PRICE</th>
              <th style={{ ...TH, textAlign: "right" }}>RUNNING QTY</th>
              {!hid.has("runningValue") && <th style={{ ...TH, textAlign: "right" }}>RUNNING VALUE</th>}
              {!hid.has("remarks") && <th style={{ ...TH, textAlign: "left" }}>REMARKS</th>}
            </tr>
          </thead>
          <tbody className="wis-tbody">
            {rows.length === 0 ? (
              <tr><td colSpan={20} className="wis-empty" style={{ padding: "40px 20px" }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>🔍</div>
                No records found{searchSku ? ` for SKU "${searchSku}"` : ""}.
              </td></tr>
            ) : rows.map((row, idx) => {
              const rowBg = idx % 2 === 0 ? "#fff" : "#fafbfc";
              return (
                <tr key={row.id} onClick={() => onEdit(row)} style={{ cursor: "pointer" }} className={idx % 2 === 0 ? "wis-tr wis-tr-even" : "wis-tr wis-tr-odd"}>
                  <td className="wis-td wis-td-sticky" style={{ ...TD, fontWeight: 700, color: "#6b7280", textAlign: "center", background: rowBg, minWidth: 70 }}>{row.transNo}</td>
                  <td style={{ ...TD, textAlign: "center", color: "#6b7280", minWidth: 95 }}>{row.dispatchDate || "—"}</td>
                  {!hid.has("tdtWo") && <td style={{ ...TD, textAlign: "center", fontWeight: 600, color: "#e87c27" }}>{row.tdtWo || "—"}</td>}
                  {!hid.has("customer") && <td style={{ ...TD, fontWeight: 600, minWidth: 130 }} title={row.customer}>{row.customer || "—"}</td>}
                  <td style={{ ...TD, textAlign: "center", fontWeight: 700, color: "#e87c27" }}>{row.tdtDr || "—"}</td>
                  <td style={{ ...TD, textAlign: "center" }}>{row.branch || "—"}</td>
                  {!hid.has("bdrSummary") && <td style={{ ...TD, maxWidth: 120 }} title={row.bdrSummary}>{row.bdrSummary || "—"}</td>}
                  {!hid.has("tdtSi") && <td style={{ ...TD, textAlign: "center" }}>{row.tdtSi || "—"}</td>}
                  <td style={{ ...TD, textAlign: "right", fontWeight: 700 }}>{row.qtyOut ?? "—"}</td>
                  <td style={{ ...TD, textAlign: "right" }}>{fmtPHP(row.unitCost)}</td>
                  <td style={{ ...TD, textAlign: "right", fontWeight: 700 }}>{fmtPHP(row.totalPrice)}</td>
                  <td style={{ ...TD, textAlign: "right", fontWeight: 700 }}>{row.runningQty ?? "—"}</td>
                  {!hid.has("runningValue") && <td style={{ ...TD, textAlign: "right" }}>{fmtPHP(row.runningValue)}</td>}
                  {!hid.has("remarks") && <td style={{ ...TD, maxWidth: 130 }} title={row.remarks}>{row.remarks || "—"}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pagination && <div className="wis-pagination" style={{ justifyContent: "flex-end" }}>{pagination}</div>}
    </div>
  );
}

function SectionTable({ title, cols, rows, renderRow, rightAlign, pagination, searchSku }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden", marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 12px", flexWrap: "wrap", gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 14px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>{title}</span>
      </div>
      <Table
        columns={cols.map(h => ({
          key: h,
          label: h,
          align: (RIGHT_IN.has(h) || RIGHT_OUT_BASE.has(h)) ? "right" : "center",
        }))}
      >
        {rows.length === 0 ? (
          <tr><td colSpan={cols.length} className="wis-empty" style={{ padding: "48px 20px" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
            No records found{searchSku ? <> for SKU <strong style={{ color: "#374151" }}>"{searchSku}"</strong></> : ""}.
          </td></tr>
        ) : rows.map((row, idx) => renderRow(row, idx))}
      </Table>
      {pagination && (
        <div className="wis-pagination" style={{ justifyContent: "flex-end" }}>
          {pagination}
        </div>
      )}
    </div>
  );
}


function useSheetJS() {
  return true;
}

function IconX({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
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
    { wch: 30 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 24 },
    { wch: 30 }, { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 14 }, { wch: 16 },
    { wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 24 },
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

      const inCols = [
        ["transNo",0,false],["date",1,false],["tdtPo",2,false],["tdtPoDate",3,false],
        ["vendorNo",4,false],["vendorName",5,false],["customerDr",6,false],
        ["tdtWo",7,false],["acceptDate",8,false],
        ["qty",9,true],["costKilo",10,true],["costUnit",11,true],["totalPurchase",12,true],
        ["runningQty",13,true],["avgUnitCost",14,true],["totalValue",15,true],["remark",16,false],
      ];
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

// ─────────────────────────────────────────────────────────────────────────────
// AllTransactionsTable — condensed ledger with improved UI/UX
// ─────────────────────────────────────────────────────────────────────────────
function AllTransactionsTable({ pagedCard, skuKey, searchSku, fmtPHP }) {
  const [expandedId, setExpandedId] = useState(null);
  const toggle = (id) => setExpandedId(prev => prev === id ? null : id);

  if (pagedCard.length === 0) {
    return (
      <tr>
        <td colSpan={11} className="wis-empty" style={{ padding: "48px 20px" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
          No records found{searchSku ? <> for SKU <strong style={{ color: "#374151" }}>"{searchSku}"</strong></> : ""}.
        </td>
      </tr>
    );
  }

  return (
    <>
      {pagedCard.map((row, idx) => {
        const isIn = row.type === "IN";
        const isExpanded = expandedId === row.id;

        // Row background: subtle tint, alternating
        const rowBg = isExpanded
          ? (isIn ? "#f0fdf4" : "#fff7f0")
          : idx % 2 === 0 ? "#fff" : "#fafafa";

        const deliveries = row.deliveries || [];
        const totalDelivered = deliveries.reduce((s, d) => s + (d.qty ?? 0), 0);
        const outQty = row.delivQty ?? 0;
        const isComplete = deliveries.length > 0 && totalDelivered >= outQty;

        // ── Left-border stripe color per type ──
        const stripeColor = isIn ? "#16a34a" : "#dc2626";

        return (
          <>
            {/* ── Main condensed row ── */}
            <tr
              key={row.id}
              onClick={() => toggle(row.id)}
              style={{
                borderBottom: isExpanded ? "none" : "1px solid #f0f0f0",
                background: rowBg,
                cursor: "pointer",
                transition: "background 0.12s",
                borderLeft: `3px solid ${isExpanded ? stripeColor : "transparent"}`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = isIn ? "#f0fdf4" : "#fff7f0";
                e.currentTarget.style.borderLeft = `3px solid ${stripeColor}`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = isExpanded
                  ? (isIn ? "#f0fdf4" : "#fff7f0")
                  : idx % 2 === 0 ? "#fff" : "#fafafa";
                e.currentTarget.style.borderLeft = isExpanded
                  ? `3px solid ${stripeColor}`
                  : "3px solid transparent";
              }}
            >
              {/* TRANS# */}
              <td style={{
                padding: "12px 10px 12px 10px",
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: "nowrap",
                color: isIn ? "#15803d" : "#dc2626",
              }}>
                {row.transNo || "—"}
              </td>

              {/* DATE */}
              <td style={{
                padding: "12px 10px",
                textAlign: "center",
                whiteSpace: "nowrap",
                fontSize: 12,
                color: "#6b7280",
              }}>
                {row.dateToday || "—"}
              </td>

              {/* TYPE badge */}
              <td style={{ padding: "12px 10px", textAlign: "center" }}>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  borderRadius: 20,
                  padding: "3px 9px",
                  background: isIn ? "#dcfce7" : "#fee2e2",
                  color: isIn ? "#15803d" : "#b91c1c",
                  border: `1px solid ${isIn ? "#bbf7d0" : "#fecaca"}`,
                }}>
                  {isIn ? "Stock IN" : "Stock OUT"}
                </span>
              </td>

              {/* WO# */}
              <td style={{
                padding: "12px 10px",
                textAlign: "center",
                whiteSpace: "nowrap",
                fontSize: 12,
                fontWeight: 600,
                color: "#e87c27",
              }}>
                {row.tdtWo || "—"}
              </td>

              {/* QTY IN */}
              <td style={{
                padding: "12px 10px",
                textAlign: "right",
                fontSize: 12,
                fontWeight: isIn ? 700 : 400,
                color: isIn ? "#15803d" : "#d1d5db",
              }}>
                {isIn && row.recvQty != null ? row.recvQty.toLocaleString() : "—"}
              </td>

              {/* TOTAL IN */}
              <td style={{
                padding: "12px 10px",
                textAlign: "right",
                fontSize: 12,
                fontWeight: 500,
                color: isIn ? "#374151" : "#d1d5db",
                borderRight: "1px solid #f0f0f0",
              }}>
                {isIn && row.totalPurchases != null ? fmtPHP(row.totalPurchases) : "—"}
              </td>

              {/* QTY OUT */}
              <td style={{
                padding: "12px 10px",
                textAlign: "right",
                fontSize: 12,
                fontWeight: !isIn ? 700 : 400,
                color: !isIn ? "#dc2626" : "#d1d5db",
              }}>
                {!isIn && row.delivQty != null ? row.delivQty.toLocaleString() : "—"}
              </td>

              {/* TOTAL OUT */}
              <td style={{
                padding: "12px 10px",
                textAlign: "right",
                fontSize: 12,
                fontWeight: 500,
                color: !isIn ? "#374151" : "#d1d5db",
                borderRight: "1px solid #f0f0f0",
              }}>
                {!isIn && row.price != null ? fmtPHP(row.price) : "—"}
              </td>

              {/* BALANCE */}
              <td style={{
                padding: "12px 10px",
                textAlign: "right",
                fontSize: 12,
                fontWeight: 800,
                color: skuKey
                  ? (row.runningQty === 0 ? "#9ca3af" : "#111827")
                  : "#d1d5db",
              }}>
                {skuKey ? row.runningQty.toLocaleString() : "—"}
              </td>

              {/* UNIT COST */}
              <td style={{
                padding: "12px 10px",
                textAlign: "right",
                fontSize: 12,
                color: "#374151",
              }}>
                {skuKey
                  ? fmtPHP(row.avgUnitCost)
                  : (isIn ? fmtPHP(row.costUnit) : fmtPHP(row.unitCost))}
              </td>

              {/* Chevron */}
              <td style={{ padding: "12px 10px", textAlign: "center", color: "#9ca3af" }}>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: isExpanded ? "#f3f4f6" : "transparent",
                  transition: "background 0.15s",
                }}>
                  {isExpanded ? <IconChevronUp size={13} /> : <IconChevronDown size={13} />}
                </span>
              </td>
            </tr>

            {/* ── Expand drawer ── */}
            {isExpanded && (
              <tr key={`${row.id}-drawer`}>
                <td colSpan={11} style={{
                  padding: 0,
                  borderLeft: `3px solid ${stripeColor}`,
                  borderBottom: "2px solid #e5e7eb",
                  background: "#fff",
                }}>
                  <div style={{ padding: "18px 24px 22px 22px" }}>
                    {isIn ? (
                      // ── STOCK IN detail panel ──
                      <div>
                        {/* Section title */}
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 14,
                        }}>
                          <span style={{
                            width: 3,
                            height: 16,
                            background: "#15803d",
                            borderRadius: 2,
                            display: "inline-block",
                            flexShrink: 0,
                          }} />
                          <span style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: "#15803d",
                            letterSpacing: "0.09em",
                            textTransform: "uppercase",
                          }}>
                            {row.transNo} — Purchase Details
                          </span>
                        </div>

                        {/* Detail fields grid */}
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))",
                          gap: "10px 16px",
                        }}>
                          {[
                            ["TDT PO #", row.tdtPo || "—", false],
                            ["TDT PO Date", row.tdtPoDate || "—", false],
                            ["Vendor Name", row.vendorName || "—", false],
                            ["Customer as per DR", row.customerDr || "—", false],
                            ["Acceptance Date", row.acceptDate || "—", false],
                            ["Cost / Kilo", row.costKilo != null ? `₱${Number(row.costKilo).toFixed(2)}` : "—", false],
                            ["Cost / Unit", row.costUnit != null ? fmtPHP(row.costUnit) : "—", true],
                            ["Total Purchase", row.totalPurchases != null ? fmtPHP(row.totalPurchases) : "—", true],
                            ...(row.remarks ? [["Remarks", row.remarks, false]] : []),
                          ].map(([label, val, accent]) => (
                            <div key={label} style={{
                              background: "#fff",
                              border: "1px solid #e5e7eb",
                              borderRadius: 8,
                              padding: "10px 13px",
                            }}>
                              <div style={{
                                fontSize: 9,
                                fontWeight: 700,
                                color: "#6b7280",
                                textTransform: "uppercase",
                                letterSpacing: "0.09em",
                                marginBottom: 4,
                              }}>
                                {label}
                              </div>
                              <div style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: accent ? "#15803d" : "#111827",
                              }}>
                                {val}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    ) : (
                      // ── STOCK OUT detail panel ──
                      <div>
                        {/* Section title */}
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 14,
                        }}>
                          <span style={{
                            width: 3,
                            height: 16,
                            background: "#dc2626",
                            borderRadius: 2,
                            display: "inline-block",
                            flexShrink: 0,
                          }} />
                          <span style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: "#dc2626",
                            letterSpacing: "0.09em",
                            textTransform: "uppercase",
                          }}>
                            {row.transNo} — Delivery Details
                          </span>
                        </div>

                        {/* OUT meta cards */}
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                          gap: 10,
                          marginBottom: 18,
                        }}>
                          {[
                            ["Customer", row.customerDr || "—", false],
                            ["Dispatch Date", row.dispatchDate || "—", false],
                            ["Unit Cost", row.unitCost != null ? fmtPHP(row.unitCost) : "—", false],
                            ["Total Price", row.price != null ? fmtPHP(row.price) : "—", true],
                            ["TDT WO #", row.tdtWo || "—", false],
                          ].map(([label, val, accent]) => (
                            <div key={label} style={{
                              background: "#fff",
                              borderRadius: 8,
                              padding: "10px 14px",
                              border: "1px solid #e5e7eb",
                            }}>
                              <div style={{
                                fontSize: 9,
                                fontWeight: 700,
                                color: "#9ca3af",
                                textTransform: "uppercase",
                                letterSpacing: "0.09em",
                                marginBottom: 4,
                              }}>
                                {label}
                              </div>
                              <div style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: accent ? "#dc2626" : "#111827",
                              }}>
                                {val}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Dynamic delivery list */}
                        {deliveries.length > 0 ? (
                          <div>
                            {/* Delivery sub-header */}
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: 10,
                            }}>
                              <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#6b7280",
                              }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="1" y="3" width="15" height="13"/>
                                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                                  <circle cx="5.5" cy="18.5" r="2.5"/>
                                  <circle cx="18.5" cy="18.5" r="2.5"/>
                                </svg>
                                DELIVERIES ({deliveries.length} of {outQty.toLocaleString()} pcs)
                              </div>

                              {/* Completion status badge */}
                              <span style={{
                                padding: "3px 11px",
                                borderRadius: 20,
                                fontSize: 10,
                                fontWeight: 700,
                                background: isComplete ? "#dcfce7" : "#fef9c3",
                                color: isComplete ? "#15803d" : "#92400e",
                                border: `1px solid ${isComplete ? "#bbf7d0" : "#fde68a"}`,
                              }}>
                                {isComplete ? "✓ Complete" : `${totalDelivered} / ${outQty} delivered`}
                              </span>
                            </div>

                            {/* Delivery rows table */}
                            <div style={{
                              background: "#fff",
                              borderRadius: 10,
                              border: "1px solid #e5e7eb",
                              overflow: "hidden",
                            }}>
                              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                  <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                                    {[
                                      { label: "#",          align: "center" },
                                      { label: "TDT DR #",  align: "left"   },
                                      { label: "Branch",    align: "left"   },
                                      { label: "BDR #",     align: "left"   },
                                      { label: "SI #",      align: "left"   },
                                      { label: "Actual Qty",align: "right"  },
                                    ].map(({ label, align }) => (
                                      <th key={label} style={{
                                        padding: "8px 12px",
                                        fontSize: 10,
                                        fontWeight: 700,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.07em",
                                        color: "#9ca3af",
                                        textAlign: align,
                                      }}>{label}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {deliveries.map((d, di) => (
                                    <tr
                                      key={di}
                                      style={{
                                        borderBottom: di < deliveries.length - 1 ? "1px solid #f3f4f6" : "none",
                                        background: di % 2 === 0 ? "#fff" : "#fafafa",
                                      }}
                                    >
                                      <td style={{ padding: "9px 12px", textAlign: "center", fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>{di + 1}</td>
                                      <td style={{ padding: "9px 12px", textAlign: "left",   fontSize: 12, fontWeight: 700, color: "#e87c27" }}>{d.tdtDr || "—"}</td>
                                      <td style={{ padding: "9px 12px", textAlign: "left",   fontSize: 12, color: "#374151" }}>{d.branch || "—"}</td>
                                      <td style={{ padding: "9px 12px", textAlign: "left",   fontSize: 12, color: "#374151" }}>{d.bdrSummary || "—"}</td>
                                      <td style={{ padding: "9px 12px", textAlign: "left",   fontSize: 12, color: "#374151" }}>{d.tdtSi || "—"}</td>
                                      <td style={{ padding: "9px 12px", textAlign: "right" }}>
                                        <span style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          fontSize: 11,
                                          fontWeight: 700,
                                          padding: "3px 10px",
                                          borderRadius: 20,
                                          background: "#fee2e2",
                                          color: "#b91c1c",
                                        }}>
                                          {(d.qty ?? 0).toLocaleString()} pcs
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr style={{ borderTop: "1px solid #e5e7eb", background: "#f9fafb" }}>
                                    <td colSpan={5} style={{
                                      padding: "9px 12px",
                                      fontSize: 12,
                                      fontWeight: 600,
                                      color: "#9ca3af",
                                      textAlign: "right",
                                    }}>
                                      Total delivered
                                    </td>
                                    <td style={{
                                      padding: "9px 12px",
                                      textAlign: "right",
                                      fontSize: 13,
                                      fontWeight: 800,
                                      color: "#15803d",
                                    }}>
                                      {totalDelivered.toLocaleString()} pcs
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>

                        ) : row.tdtDr ? (
                          // Legacy single-delivery fallback
                          <div>
                            <div style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#6b7280",
                              marginBottom: 8,
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <rect x="1" y="3" width="15" height="13"/>
                                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                                <circle cx="5.5" cy="18.5" r="2.5"/>
                                <circle cx="18.5" cy="18.5" r="2.5"/>
                              </svg>
                              DELIVERY INFO
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "8px 16px" }}>
                              {[
                                ["TDT DR #", row.tdtDr],
                                ["Branch", row.branch || "—"],
                                ["BDR Summary", row.bdrSummary || "—"],
                                ["TDT SI #", row.tdtSi || "—"],
                                ...(row.remarks ? [["Remarks", row.remarks]] : []),
                              ].map(([label, val]) => (
                                <div key={label}>
                                  <div style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{label}</div>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: label === "TDT DR #" ? "#e87c27" : "#111827" }}>{val}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>No delivery details recorded.</div>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </>
        );
      })}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
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

  const [stockInData,  setStockInData]  = useState(() => propStockIn  ?? apiIn.data);
  const [stockOutData, setStockOutData] = useState(() => propStockOut ?? apiOut.data);

  useEffect(() => { if (propStockIn)  setStockInData(propStockIn);  else apiIn.getAll().then(d => setStockInData(d));  }, [propStockIn]);  // eslint-disable-line
  useEffect(() => { if (propStockOut) setStockOutData(propStockOut); else apiOut.getAll().then(d => setStockOutData(d)); }, [propStockOut]); // eslint-disable-line

  useEffect(() => {
    if (defaultSku) {
      setSearchSku(defaultSku);
      setActiveTab("all");
      onConsumeDefaultSku?.();
    }
  }, [defaultSku]); // eslint-disable-line

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
  const [editInRow, setEditInRow] = useState(null);
  const [editOutRow, setEditOutRow] = useState(null);
  const [lastAddedInId, setLastAddedInId] = useState(null);
  const [lastAddedOutId, setLastAddedOutId] = useState(null);
  const [cardPage, setCardPage] = useState(1);

  useEffect(() => { setCardPage(1); }, [searchSku]);

  const handleSaveInEdit = async (updated) => {
    try {
      const next = stockInData.map(r => r.id === updated.id ? { ...updated } : r);
      setStockInData(next); syncInUp(next);
      if (!setPropStockIn) await apiIn.update(updated.id, updated);
      setEditInRow(null);
      showToast("Stock IN row updated.");
    } catch { showToast("Failed to save changes.", "error"); }
  };

  const handleSaveOutEdit = async (updated) => {
    try {
      const next = stockOutData.map(r => r.id === updated.id ? { ...updated } : r);
      setStockOutData(next); syncOutUp(next);
      if (!setPropStockOut) await apiOut.update(updated.id, updated);
      setEditOutRow(null);
      showToast("Stock OUT row updated.");
    } catch { showToast("Failed to save changes.", "error"); }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

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

  const totalIn  = stockInRows.reduce((s, r) => s + (r.qty ?? 0), 0);
  const totalOut = stockOutRows.reduce((s, r) => s + (r.qtyOut ?? 0), 0);
  const balance  = totalIn - totalOut;

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
              (inRows) => { setStockInData(inRows); syncInUp(inRows); setInPage(1); },
              (outRows) => { setStockOutData(outRows); syncOutUp(outRows); setOutPage(1); setImporting(false); showToast(`Imported stock sheet from ${file.name}`); },
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
              showToast(err?.message || "Export failed. Check the browser console.", "error");
            }
          },
        }}
      />

      {/* Recent SKUs */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", background: "#fff", borderRadius: 14, padding: "12px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
        <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>Recent SKUs:</span>
        {recentSkus.map((sku) => {
          const active = skuKey === sku;
          return (
            <button key={sku} type="button" onClick={() => { setSearchSku(sku); setInPage(1); setOutPage(1); }}
              style={{ padding: "5px 12px", borderRadius: 20, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", background: active ? "#e87c27" : "#f3f4f6", color: active ? "#fff" : "#6b7280" }}>
              {sku}
            </button>
          );
        })}
      </div>

      {/* SKU Info panel */}
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

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #e5e7eb", background: "#fff", borderRadius: "12px 12px 0 0", padding: "0 16px 0 0", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex" }}>
          {tabs.map((t) => (
            <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
              style={{ padding: "14px 20px", background: "none", border: "none", cursor: "pointer", borderBottom: activeTab === t.id ? "3px solid #e87c27" : "3px solid transparent", color: activeTab === t.id ? "#e87c27" : "#9ca3af", fontSize: 14, fontWeight: 700, marginBottom: -2 }}>
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

      {/* ── ALL TRANSACTIONS TAB ── */}
      {showStockCard && (
        <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden", marginBottom: 18 }}>

          {/* ── Improved stat bar — clean card strip instead of heavy dark bg ── */}
          {skuKey && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              borderBottom: "1px solid #f3f4f6",
            }}>
              {/* Current Balance */}
              <div style={{
                padding: "18px 24px",
                borderRight: "1px solid #f3f4f6",
                borderLeft: "4px solid #1c2235",
                background: "#fafafa",
              }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: "#9ca3af", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
                  Current Balance
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#111827", lineHeight: 1 }}>
                  {balance.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 600, color: "#6b7280" }}>pcs</span>
                </div>
              </div>

              {/* Total Stock IN */}
              <div style={{
                padding: "18px 24px",
                borderRight: "1px solid #f3f4f6",
                borderLeft: "4px solid #16a34a",
                background: "#f8fefb",
              }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: "#9ca3af", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
                  Total Stock In
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#15803d", lineHeight: 1 }}>
                  {totalIn.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 600, color: "#4ade80" }}>pcs</span>
                </div>
              </div>

              {/* Total Stock OUT */}
              <div style={{
                padding: "18px 24px",
                borderLeft: "4px solid #dc2626",
                background: "#fff8f7",
              }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: "#9ca3af", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
                  Total Stock Out
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#dc2626", lineHeight: 1 }}>
                  {totalOut.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 600, color: "#f87171" }}>pcs</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Hint bar — svg icon instead of emoji ── */}
          <div style={{
            padding: "9px 18px",
            borderBottom: "1px solid #f3f4f6",
            fontSize: 11,
            color: "#9ca3af",
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#fafafa",
          }}>
            <IconInfo size={13} />
            <span>
              Click a row to see full details
              {skuKey ? " · Click an OUT row to see the dynamic delivery list" : ""}
            </span>
          </div>

          {/* ── Condensed table ── */}
          <div className="wis-table-scroll">
            <table className="wis-table">
              <thead className="wis-thead">
                {/* Group header row */}
                <tr style={{ background: "#1a2035" }}>
                  <th colSpan={4} style={{
                    padding: "7px 10px",
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#94a3b8",
                    textAlign: "center",
                    borderRight: "1px solid #2d3a52",
                  }}>
                    Transaction
                  </th>
                  <th colSpan={2} style={{
                    padding: "7px 10px",
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#4ade80",
                    textAlign: "center",
                    borderRight: "1px solid #2d3a52",
                    borderLeft: "2px solid #16a34a",
                  }}>
                    Stock In
                  </th>
                  <th colSpan={2} style={{
                    padding: "7px 10px",
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#f87171",
                    textAlign: "center",
                    borderRight: "1px solid #2d3a52",
                    borderLeft: "2px solid #dc2626",
                  }}>
                    Stock Out
                  </th>
                  <th colSpan={2} style={{
                    padding: "7px 10px",
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#fb923c",
                    textAlign: "center",
                    borderLeft: "2px solid #e87c27",
                  }}>
                    Balance
                  </th>
                  <th style={{ background: "#1a2035", padding: "7px 6px", width: 32 }} />
                </tr>

                {/* Column header row */}
                <tr style={{ background: "#111827" }}>
                  {[
                    ["Trans #",   "center"],
                    ["Date",      "center"],
                    ["Type",      "center"],
                    ["WO #",      "center"],
                    ["Qty In",    "right"],
                    ["Total",     "right"],
                    ["Qty Out",   "right"],
                    ["Total",     "right"],
                    ["Balance",   "right"],
                    ["Unit Cost", "right"],
                    ["",          "center"],
                  ].map(([h, align], i) => (
                    <th key={i} style={{
                      padding: "8px 10px",
                      color: "#cbd5e1",
                      fontSize: 10,
                      fontWeight: 600,
                      textAlign: align,
                      whiteSpace: "nowrap",
                      borderTop: "1px solid #1f2937",
                      letterSpacing: "0.04em",
                      ...(i === 3 ? { borderRight: "1px solid #1f2937" } : {}),
                      ...(i === 5 ? { borderRight: "1px solid #1f2937" } : {}),
                      ...(i === 7 ? { borderRight: "1px solid #1f2937" } : {}),
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="wis-tbody">
                <AllTransactionsTable
                  pagedCard={pagedCard}
                  skuKey={skuKey}
                  searchSku={searchSku}
                  fmtPHP={fmtPHP}
                />
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="wis-pagination" style={{ justifyContent: "flex-end" }}>
            <Pagination currentPage={cardPage} totalPages={cardTotalPages} onPage={setCardPage} />
          </div>
        </div>
      )}

      {/* ── STOCK IN TAB ── */}
      {showIn && (
        <CompactStockInTable
          rows={pagedIn}
          searchSku={searchSku}
          onEdit={row => setEditInRow(row)}
          pagination={<Pagination currentPage={inPage} totalPages={inTotalPages} onPage={setInPage} />}
        />
      )}

      {/* ── STOCK OUT TAB ── */}
      {showOut && (
        <CompactStockOutTable
          rows={pagedOut}
          searchSku={searchSku}
          onEdit={row => setEditOutRow(row)}
          pagination={<Pagination currentPage={outPage} totalPages={outTotalPages} onPage={setOutPage} />}
        />
      )}

      {/* Edit modals */}
      {editInRow && (
        <StockInEditModal
          row={editInRow}
          onSave={handleSaveInEdit}
          onClose={() => setEditInRow(null)}
        />
      )}
      {editOutRow && (
        <StockOutEditModal
          row={editOutRow}
          onSave={handleSaveOutEdit}
          onClose={() => setEditOutRow(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, background: toast.type === "error" ? "#dc2626" : "#16a34a", color: "#fff", borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}>
          {toast.msg}
        </div>
      )}

      {/* Create modal */}
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
                if (isIn) {
                  const qty = Number(createForm.qty) || 0;
                  const costUnit = Number(createForm.costUnit) || 0;
                  const newRow = {
                    id: Date.now(), sku,
                    transNo: String(stockInData.filter(r => r.sku === sku).length + 1).padStart(3, "0"),
                    date: createForm.date, tdtPo: createForm.tdtPo, tdtPoDate: createForm.tdtPoDate,
                    vendorNo: createForm.vendorNo, vendorName: createForm.vendorName,
                    customerDr: createForm.customerDr, tdtWo: createForm.tdtWo,
                    acceptDate: createForm.acceptDate, qty,
                    costKilo: Number(createForm.costKilo) || 0, costUnit,
                    totalPurchase: qty * costUnit, runningQty: 0, avgUnitCost: costUnit, totalValue: 0, remark: "",
                  };
                  const next = [...stockInData, newRow];
                  setStockInData(next); syncInUp(next);
                  setLastAddedInId(newRow.id);
                } else {
                  const qtyOut = Number(createForm.qtyOut) || 0;
                  const unitCost = Number(createForm.costUnit) || 0;
                  const newRow = {
                    id: Date.now(), sku,
                    transNo: String(stockOutData.filter(r => r.sku === sku).length + 1).padStart(3, "0"),
                    dispatchDate: createForm.dispatchDate, tdtWo: createForm.tdtWo,
                    customer: createForm.customer, tdtDr: createForm.tdtDr,
                    branch: createForm.branch, bdrSummary: createForm.bdrSummary,
                    tdtSi: createForm.tdtSi, qtyOut, unitCost,
                    totalPrice: qtyOut * unitCost,
                    runningQty: 0, runningValue: 0, remarks: createForm.remarks,
                    deliveries: createForm.tdtDr ? [{
                      tdtDr: createForm.tdtDr,
                      branch: createForm.branch || "",
                      bdrSummary: createForm.bdrSummary || "",
                      tdtSi: createForm.tdtSi || "",
                      qty: qtyOut,
                    }] : [],
                  };
                  const next = [...stockOutData, newRow];
                  setStockOutData(next); syncOutUp(next);
                  setLastAddedOutId(newRow.id);
                }
                setShowCreate(false);
                setCreateForm({ ...EMPTY_FORM, sku: searchSku });
                setInPage(1); setOutPage(1);
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