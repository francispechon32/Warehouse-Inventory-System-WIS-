import { useState, useMemo, useEffect } from "react";
import { productSearchInputStyle, productSearchWrapStyle, productSearchIconLeftStyle } from "./searchFieldStyles";

const PAGE_SIZE = 5;

const STATUS_OPTS = ["All Status", "Approved", "Pending", "Received"];
const DISP_OPTS = ["All Dispositions", "Restock", "Scrap", "Credit memo"];
const REASON_OPTS = ["All Reasons", "Damaged During Delivery", "Wrong item", "Customer cancel", "Quality hold"];

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

const selectSt = { padding: "11px 32px 11px 14px", fontSize: 14, border: "1px solid #b8bec9", borderRadius: 8, background: "#ffffff", color: "#111827", cursor: "pointer", fontFamily: "inherit", width: "100%", appearance: "none", fontWeight: 500, outline: "none", boxShadow: "inset 0 1px 2px rgba(15,23,42,0.04)" };

function lineQtySum(lines) {
  return lines.reduce((s, L) => s + L.qty, 0);
}
function lineValSum(lines) {
  return lines.reduce((s, L) => s + L.val, 0);
}

export default function ReturnPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [dispFilter, setDispFilter] = useState("All Dispositions");
  const [reasonFilter, setReasonFilter] = useState("All Reasons");
  const [currentPage, setCurrentPage] = useState(1);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const filtered = useMemo(() => {
    let rows = SEED_RETURNS;
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
    return rows;
  }, [searchQuery, statusFilter, dispFilter, reasonFilter]);

  useEffect(() => {
    if (selectedId != null && !filtered.some((r) => r.id === selectedId)) {
      setSelectedId(null);
      setPanelOpen(false);
    }
  }, [filtered, selectedId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selected = selectedId != null ? SEED_RETURNS.find((r) => r.id === selectedId) : null;

  const COLS = ["TRANS #", "RETURN DATE", "DR#", "SKU", "ITEM", "QTY RETURNED", "UNIT COST", "TOTAL COST", "CUSTOMER NAME", "REASON", "DISPOSITION", "STATUS"];

  return (
    <div style={{ background: "#f0f2f5", padding: "28px 32px 40px", display: "flex", flexDirection: "column", gap: 18 }}>

      <div style={{ background: "#fff", borderRadius: 14, padding: "16px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ ...productSearchWrapStyle, flex: "1 1 280px", maxWidth: 520 }}>
            <input
              type="text"
              placeholder="Search SKU or product name..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={productSearchInputStyle}
            />
            <span style={productSearchIconLeftStyle}><IconSearch size={16} /></span>
          </div>
          <div style={{ position: "relative", minWidth: 160, flex: "0 1 160px" }}>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} style={selectSt}>
              {STATUS_OPTS.map((o) => <option key={o}>{o}</option>)}
            </select>
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6b7280" }}><IconChevronDown size={14} /></span>
          </div>
          <div style={{ position: "relative", minWidth: 170, flex: "0 1 170px" }}>
            <select value={dispFilter} onChange={(e) => { setDispFilter(e.target.value); setCurrentPage(1); }} style={selectSt}>
              {DISP_OPTS.map((o) => <option key={o}>{o}</option>)}
            </select>
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6b7280" }}><IconChevronDown size={14} /></span>
          </div>
          <div style={{ position: "relative", minWidth: 180, flex: "0 1 200px" }}>
            <select value={reasonFilter} onChange={(e) => { setReasonFilter(e.target.value); setCurrentPage(1); }} style={selectSt}>
              {REASON_OPTS.map((o) => <option key={o}>{o}</option>)}
            </select>
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6b7280" }}><IconChevronDown size={14} /></span>
          </div>
          <button type="button" style={{ padding: "10px 16px", background: "#e87c27", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
            <IconPlus size={16} />
            Create New Return
          </button>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 14, flexWrap: "wrap" }}>
          <button type="button" style={{ padding: "10px 16px", background: "#e87c27", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <IconCalendar size={16} />
            April 5, 2026 – May 5, 2026
          </button>
          <button type="button" style={{ padding: "10px 16px", border: "1px solid #b8bec9", borderRadius: 8, background: "#fff", cursor: "pointer", color: "#374151", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", boxShadow: "inset 0 1px 2px rgba(15,23,42,0.04)" }}>
            <IconDownload size={16} />
            Export WIS
          </button>
        </div>
      </div>

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
                      textAlign: ["QTY RETURNED", "UNIT COST", "TOTAL COST"].includes(h) ? "right" : "left",
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
                <tr><td colSpan={12} style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>No returns match your filters.</td></tr>
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
                    <td style={{ padding: "12px 10px", color: "#6b7280", fontWeight: 600 }}>{row.transNo}</td>
                    <td style={{ padding: "12px 10px", color: "#374151", whiteSpace: "nowrap" }}>{row.returnDate}</td>
                    <td style={{ padding: "12px 10px", color: "#e87c27", fontWeight: 700 }}>{row.drNo}</td>
                    <td style={{ padding: "12px 10px", color: "#374151", fontWeight: 600 }}>{row.sku}</td>
                    <td style={{ padding: "12px 10px", color: "#111827", maxWidth: 200 }}>{row.item}</td>
                    <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: 700 }}>{row.qtyReturned}</td>
                    <td style={{ padding: "12px 10px", textAlign: "right" }}>{fmtPHP(row.unitCost)}</td>
                    <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: 600 }}>{fmtPHP(row.totalCost)}</td>
                    <td style={{ padding: "12px 10px", color: "#374151", maxWidth: 140 }}>{row.customer}</td>
                    <td style={{ padding: "12px 10px", color: "#6b7280", fontSize: 11 }}>{row.reason}</td>
                    <td style={{ padding: "12px 10px", color: "#6b7280" }}>{row.disposition}</td>
                    <td style={{ padding: "12px 10px" }}>
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
                        <th key={h} style={{ padding: "10px 8px", textAlign: h.includes("Qty") || h.includes("Cost") || h.includes("Value") ? "right" : "left", fontWeight: 700, color: "#111827" }}>{h}</th>
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
    </div>
  );
}
