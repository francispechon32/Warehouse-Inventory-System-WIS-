import { useState, useMemo, useEffect } from "react";
import { productSearchInputStyle, productSearchWrapStyle, productSearchIconLeftStyle } from "./searchFieldStyles";

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

const SEED_PURCHASE_ORDERS = [
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

export default function PurchasingOrderPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [supplierFilter, setSupplierFilter] = useState("All Suppliers");
  const [currentPage, setCurrentPage] = useState(1);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const filtered = useMemo(() => {
    let rows = SEED_PURCHASE_ORDERS;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.tdtPo.toLowerCase().includes(q) ||
          r.vendor.toLowerCase().includes(q) ||
          r.txnNo.toLowerCase().includes(q) ||
          r.purchaser.toLowerCase().includes(q) ||
          r.productDesc.toLowerCase().includes(q) ||
          String(r.transNo).includes(q)
      );
    }
    if (statusFilter !== "All Status") rows = rows.filter((r) => r.status === statusFilter);
    if (supplierFilter !== "All Suppliers") rows = rows.filter((r) => r.vendor === supplierFilter);
    return rows;
  }, [searchQuery, statusFilter, supplierFilter]);

  useEffect(() => {
    if (selectedId != null && !filtered.some((r) => r.id === selectedId)) {
      setSelectedId(null);
      setPanelOpen(false);
    }
  }, [filtered, selectedId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selected = selectedId != null ? SEED_PURCHASE_ORDERS.find((r) => r.id === selectedId) : null;
  const panelBadge = selected ? (STATUS_BADGE[selected.status] || STATUS_BADGE.Pending) : STATUS_BADGE.Pending;

  const totalSeed = 218;

  return (
    <div style={{ background: "#f0f2f5", padding: "28px 32px 40px", display: "flex", flexDirection: "column", gap: 18 }}>

      <div style={{ background: "#fff", borderRadius: 14, padding: "16px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ ...productSearchWrapStyle, flex: "1 1 280px", maxWidth: 520 }}>
            <input
              type="text"
              placeholder="Search PO# or vendor..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={productSearchInputStyle}
            />
            <span style={productSearchIconLeftStyle}><IconSearch size={16} /></span>
          </div>
          <div style={{ position: "relative", minWidth: 140, flex: "0 1 140px" }}>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} style={selectSt}>
              {STATUS_OPTS.map((o) => <option key={o}>{o}</option>)}
            </select>
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6b7280" }}><IconChevronDown size={14} /></span>
          </div>
          <div style={{ position: "relative", minWidth: 160, flex: "0 1 160px" }}>
            <select value={supplierFilter} onChange={(e) => { setSupplierFilter(e.target.value); setCurrentPage(1); }} style={selectSt}>
              {SUPPLIER_OPTS.map((o) => <option key={o}>{o}</option>)}
            </select>
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6b7280" }}><IconChevronDown size={14} /></span>
          </div>
          <button type="button" style={{ padding: "10px 16px", background: "#e87c27", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
            <IconPlus size={16} />
            Create Purchase Order
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
                {TABLE_COLS.map((h) => (
                  <th key={h} style={{ padding: "14px 10px", textAlign: RIGHT_ALIGN.has(h) ? "right" : "left", color: "#fff", fontWeight: 700, fontSize: 10, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr><td colSpan={TABLE_COLS.length} style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>No purchase orders match your filters.</td></tr>
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
                    <td style={{ padding: "12px 10px", color: "#6b7280", fontWeight: 600 }}>{row.transNo}</td>
                    <td style={{ padding: "12px 10px", color: "#374151", whiteSpace: "nowrap" }}>{row.poDate}</td>
                    <td style={{ padding: "12px 10px", color: "#374151", whiteSpace: "nowrap" }}>{row.eta}</td>
                    <td style={{ padding: "12px 10px", color: "#374151" }}>{row.purchaser}</td>
                    <td style={{ padding: "12px 10px", color: "#e87c27", fontWeight: 700 }}>{row.tdtPo}</td>
                    <td style={{ padding: "12px 10px", color: "#111827", fontWeight: 600, maxWidth: 160 }}>{row.vendor}</td>
                    <td style={{ padding: "12px 10px", color: "#374151", maxWidth: 220 }}>{row.productDesc}</td>
                    <td style={{ padding: "12px 10px", color: "#6b7280" }}>{row.destination}</td>
                    <td style={{ padding: "12px 10px", color: "#6b7280" }}>{row.tradingOrStocks}</td>
                    <td style={{ padding: "12px 10px", color: "#6b7280" }}>{row.warehouseType}</td>
                    <td style={{ padding: "12px 10px", textAlign: "right" }}>{row.metricTons}</td>
                    <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: 700 }}>{row.qtyPerPo}</td>
                    <td style={{ padding: "12px 10px", color: "#6b7280" }}>{row.weight}</td>
                    <td style={{ padding: "12px 10px" }}>
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
                        <th key={h} style={{ padding: "10px 8px", textAlign: h === "Item Code" || h === "Item Description" ? "left" : "right", fontWeight: 700, color: "#111827" }}>{h}</th>
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
    </div>
  );
}