import { useState, useRef, useMemo } from "react";
import * as XLSX from "xlsx";

// ── Colour tokens matching the TDT PowerSteel design in the screenshots ──
const C = {
  bg: "#f4f5f7",
  sidebar: "#1a1d23",
  sidebarActive: "#e85d26",
  white: "#ffffff",
  orange: "#e85d26",
  orangeHover: "#c94d1c",
  text: "#1a1d23",
  textMuted: "#6b7280",
  border: "#e5e7eb",
  headerBg: "#1a1d23",
  headerText: "#ffffff",
  rowHover: "#fef6f2",
  tagGreen: "#d1fae5",
  tagGreenText: "#065f46",
  tagRed: "#fee2e2",
  tagRedText: "#991b1b",
};

// ── Excel column mapping for ENDING INVENTORY sheet (0-indexed rows, header at row 5) ──
// Columns: 0=No, 1=Product Description, 2=SKU, 3=Last Acceptance Date,
//          4=Qty as per WIS, 5=Total Unit Cost, 6=Avg Unit Cost,
//          7=Qty as per Counting, 8=Variance(Qty), 9=Variance(Amt), 10=Remarks
const EXCEL_COL = {
  no: 0, desc: 1, sku: 2, lastDate: 3,
  qty: 4, totalCost: 5, avgCost: 6,
  qtyCount: 7, varianceQty: 8, varianceAmt: 9, remarks: 10,
};
const DATA_START_ROW = 6; // 0-indexed, row 7 in Excel (1-indexed)

// ── Seed data loaded from the WIS Excel ──
const SEED = [
  { no:1,  desc:"Deformed Round Bar, 10mm x 6M g33", sku:"DRB007", lastDate:"", qty:0, totalCost:0, avgCost:0, qtyCount:0, varianceQty:0, varianceAmt:0, remarks:"" },
  { no:2,  desc:"Deformed Round Bar, 12mm x 6M g33", sku:"DRB008", lastDate:"", qty:0, totalCost:0, avgCost:0, qtyCount:0, varianceQty:0, varianceAmt:0, remarks:"" },
  { no:3,  desc:"Deformed Round Bar, 16mm x 6M g33", sku:"DRB009", lastDate:"", qty:0, totalCost:0, avgCost:0, qtyCount:0, varianceQty:0, varianceAmt:0, remarks:"" },
  { no:4,  desc:"Deformed Round Bar, 10mm x 6M g40", sku:"DRB050", lastDate:"2026-02-21", qty:1557, totalCost:212686.2, avgCost:136.6, qtyCount:1557, varianceQty:0, varianceAmt:0, remarks:"" },
  { no:5,  desc:"Deformed Round Bar, 12mm x 6M g40", sku:"DRB051", lastDate:"2025-05-31", qty:1, totalCost:186.38, avgCost:186.38, qtyCount:1, varianceQty:0, varianceAmt:0, remarks:"" },
  { no:6,  desc:"Deformed Round Bar, 16mm x 6M g40", sku:"DRB052", lastDate:"2026-02-21", qty:1225, totalCost:424750.18, avgCost:346.73, qtyCount:1225, varianceQty:0, varianceAmt:0, remarks:"" },
  { no:7,  desc:"Sheet Pile, T2, 400mm x 100mm x 10.5mm x 48kg/m x 12M (576 kilos)", sku:"SHPT2", lastDate:"2026-03-24", qty:560, totalCost:12616608.49, avgCost:22529.66, qtyCount:560, varianceQty:0, varianceAmt:0, remarks:"" },
  { no:8,  desc:"MS Plate, 6mm x 4' x 8'", sku:"MSP010", lastDate:"2026-02-21", qty:322, totalCost:178642.38, avgCost:554.79, qtyCount:322, varianceQty:0, varianceAmt:0, remarks:"DRB 20mm x 6M g40" },
  { no:9,  desc:"MS Plate, 12mm x 4' x 8'", sku:"MSP018", lastDate:"", qty:0, totalCost:0, avgCost:0, qtyCount:0, varianceQty:0, varianceAmt:0, remarks:"" },
  { no:10, desc:"MS Plate, 10mm X 4' x 8'", sku:"SKU10", lastDate:"", qty:0, totalCost:0, avgCost:0, qtyCount:0, varianceQty:0, varianceAmt:0, remarks:"" },
  { no:11, desc:"Sheet Pile, T2, 400mm x 100mm x 10.5mm x 48kg/m x 6M (288 kilos)", sku:"SHPT2A", lastDate:"", qty:0, totalCost:0, avgCost:0, qtyCount:0, varianceQty:0, varianceAmt:0, remarks:"" },
  { no:12, desc:"Sheet Pile Z type 12 meters", sku:"SHPT7", lastDate:"", qty:0, totalCost:0, avgCost:0, qtyCount:0, varianceQty:0, varianceAmt:0, remarks:"" },
  { no:13, desc:"Sheet Pile, Z - Pile 770mm W x 354mm H x 8.5mm x 73.2kg/M x 12M (878.40 kilos)", sku:"JINXI", lastDate:"2025-03-12", qty:15, totalCost:627577.9, avgCost:41838.53, qtyCount:15, varianceQty:0, varianceAmt:0, remarks:"" },
  { no:14, desc:"Wide Flange, 8 x 4 x 10# x 6M (approx: Web 4.32mm/Flange 5.21mm)", sku:"WF016", lastDate:"", qty:0, totalCost:0, avgCost:0, qtyCount:0, varianceQty:0, varianceAmt:0, remarks:"" },
  { no:15, desc:"Wide Flange, 6 x 4 x 9# x 6M (approx: Web 4.32mm/Flange 5.46mm)", sku:"WF009", lastDate:"", qty:0, totalCost:0, avgCost:0, qtyCount:0, varianceQty:0, varianceAmt:0, remarks:"" },
  { no:16, desc:"Sheet Pile, T3, 400mm x 125mm x 13mm x 60kg/m x 12M(720kgs)", sku:"SHPT3", lastDate:"2025-11-29", qty:481, totalCost:13598380.8, avgCost:28271.06, qtyCount:481, varianceQty:0, varianceAmt:0, remarks:"1 PC DAMAGED" },
  { no:17, desc:"Wide Flange, Item 4", sku:"SKU17", lastDate:"", qty:0, totalCost:0, avgCost:0, qtyCount:0, varianceQty:0, varianceAmt:0, remarks:"" },
  { no:18, desc:"Wide Flange, Item 5", sku:"SKU18", lastDate:"", qty:0, totalCost:0, avgCost:0, qtyCount:0, varianceQty:0, varianceAmt:0, remarks:"" },
  { no:19, desc:"Wide Flange, Item 6", sku:"SKU19", lastDate:"", qty:0, totalCost:0, avgCost:0, qtyCount:0, varianceQty:0, varianceAmt:0, remarks:"" },
  { no:20, desc:"Angle Bar,  3mm x 38mm x 38mm  x 6M Yellow", sku:"SKU20", lastDate:"", qty:0, totalCost:0, avgCost:0, qtyCount:0, varianceQty:0, varianceAmt:0, remarks:"" },
  { no:21, desc:"Angle Bar,  4mm x 38mm x 38mm  x 6M  Orange", sku:"SKU21", lastDate:"", qty:0, totalCost:0, avgCost:0, qtyCount:0, varianceQty:0, varianceAmt:0, remarks:"" },
  { no:22, desc:"Angle Bar,  5mm x 38mm x 38mm  x 6M White", sku:"SKU22", lastDate:"", qty:0, totalCost:0, avgCost:0, qtyCount:0, varianceQty:0, varianceAmt:0, remarks:"" },
  { no:23, desc:"Angle Bar,  6mm x 38mm x 38mm  x 6M Brown", sku:"SKU23", lastDate:"", qty:0, totalCost:0, avgCost:0, qtyCount:0, varianceQty:0, varianceAmt:0, remarks:"" },
  { no:24, desc:"Angle Bar,  3mm x 50mm x 50mm  x 6M Yellow", sku:"SKU24", lastDate:"", qty:0, totalCost:0, avgCost:0, qtyCount:0, varianceQty:0, varianceAmt:0, remarks:"" },
  { no:25, desc:"Angle Bar,  4mm x 50mm x 50mm  x 6M Orange", sku:"SKU25", lastDate:"", qty:0, totalCost:0, avgCost:0, qtyCount:0, varianceQty:0, varianceAmt:0, remarks:"" },
  { no:26, desc:"Angle Bar,  4.5mm x 50mm x 50mm  x 6M Violet", sku:"SKU26", lastDate:"", qty:0, totalCost:0, avgCost:0, qtyCount:0, varianceQty:0, varianceAmt:0, remarks:"" },
  { no:27, desc:"Angle Bar, 5mm x 50mm x 50mm  x 6M White", sku:"SKU27", lastDate:"", qty:0, totalCost:0, avgCost:0, qtyCount:0, varianceQty:0, varianceAmt:0, remarks:"" },
  { no:28, desc:"Angle Bar, 6mm x 50mm x 50mm  x 6M Brown", sku:"SKU28", lastDate:"", qty:0, totalCost:0, avgCost:0, qtyCount:0, varianceQty:0, varianceAmt:0, remarks:"" },
  { no:29, desc:"Angle Bar,  6mm x 63.5mm x 63.5mm  x 6M Brown", sku:"SKU29", lastDate:"", qty:0, totalCost:0, avgCost:0, qtyCount:0, varianceQty:0, varianceAmt:0, remarks:"" },
  { no:30, desc:"Angle Bar, 6mm x 75mm x 75mm  x 6M Brown", sku:"SKU30", lastDate:"", qty:0, totalCost:0, avgCost:0, qtyCount:0, varianceQty:0, varianceAmt:0, remarks:"" },
];

const PAGE_SIZE = 8;

function fmt(n) {
  if (!n && n !== 0) return "—";
  return Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Parse a WIS Excel file and return rows matching SEED SKUs ──
function parseWisExcel(file, onDone, onError) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const wb = XLSX.read(e.target.result, { type: "array", cellDates: true });
      const ws = wb.Sheets["ENDING INVENTORY"];
      if (!ws) throw new Error('Sheet "ENDING INVENTORY" not found in this file.');
      const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
      const parsed = [];
      for (let i = DATA_START_ROW; i < raw.length; i++) {
        const r = raw[i];
        const noVal = r[EXCEL_COL.no];
        if (!noVal && noVal !== 0) continue;
        const dateRaw = r[EXCEL_COL.lastDate];
        let lastDate = "";
        if (dateRaw instanceof Date) {
          lastDate = dateRaw.toISOString().slice(0, 10);
        } else if (typeof dateRaw === "string" && dateRaw.trim()) {
          lastDate = dateRaw.trim().slice(0, 10);
        }
        parsed.push({
          no: Number(noVal),
          desc: String(r[EXCEL_COL.desc] ?? "").trim(),
          sku: String(r[EXCEL_COL.sku] ?? "").trim(),
          lastDate,
          qty: Number(r[EXCEL_COL.qty] ?? 0),
          totalCost: Number(r[EXCEL_COL.totalCost] ?? 0),
          avgCost: Number(r[EXCEL_COL.avgCost] ?? 0),
          qtyCount: Number(r[EXCEL_COL.qtyCount] ?? 0),
          varianceQty: Number(r[EXCEL_COL.varianceQty] ?? 0),
          varianceAmt: Number(r[EXCEL_COL.varianceAmt] ?? 0),
          remarks: String(r[EXCEL_COL.remarks] ?? "").trim(),
        });
      }
      onDone(parsed);
    } catch (err) {
      onError(err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

// ── Export current table rows back into the WIS Excel structure ──
function exportToWis(rows) {
  // Build a simple, clean workbook matching the WIS ENDING INVENTORY layout
  const wb = XLSX.utils.book_new();

  // Header rows
  const headers = [
    ["TDT WAREHOUSE INVENTORY SHEET (TDT WIS)"],
    ["Ending Inventory as per WIS"],
    ["LOCATION:", "MARILAO WAREHOUSE"],
    ["AS OF", new Date().toLocaleString()],
    [],
    ["NO.", "PRODUCT DESCRIPTION", "SKU NUMBER", "LAST ACCEPTANCE DATE",
      "QTY AS PER WIS", "TOTAL UNIT COST", "AVG UNIT COST",
      "QTY AS PER COUNTING", "VARIANCE (QTY)", "VARIANCE (AMOUNT)", "REMARKS"],
  ];

  const dataRows = rows.map((r) => [
    r.no, r.desc, r.sku, r.lastDate || "",
    r.qty, r.totalCost, r.avgCost,
    r.qtyCount, r.varianceQty, r.varianceAmt, r.remarks,
  ]);

  const allRows = [...headers, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Column widths
  ws["!cols"] = [
    { wch: 5 }, { wch: 60 }, { wch: 10 }, { wch: 20 },
    { wch: 15 }, { wch: 18 }, { wch: 16 },
    { wch: 20 }, { wch: 16 }, { wch: 18 }, { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "ENDING INVENTORY");
  XLSX.writeFile(wb, "TDT_WIS_Ending_Inventory_Export.xlsx");
}

// ══════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════
export default function EndingInventory() {
  const [rows, setRows] = useState(SEED);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("wis"); // "wis" | "cogs"
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(null);
  const [importing, setImporting] = useState(false);
  const importRef = useRef();

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Filter ──
  const filtered = useMemo(() => {
    let r = rows;
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((x) => x.desc.toLowerCase().includes(q) || x.sku.toLowerCase().includes(q));
    }
    if (statusFilter === "In Stock") r = r.filter((x) => x.qty > 0);
    if (statusFilter === "Out of Stock") r = r.filter((x) => x.qty === 0);
    if (statusFilter === "Variance") r = r.filter((x) => x.varianceQty !== 0);
    return r;
  }, [rows, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Import from Excel ──
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    parseWisExcel(
      file,
      (parsed) => {
        setImporting(false);
        if (!parsed.length) { showToast("No data rows found in ENDING INVENTORY sheet.", "error"); return; }
        // Merge: match by SKU; update existing, append new
        setRows((prev) => {
          const map = new Map(prev.map((r) => [r.sku, r]));
          parsed.forEach((p) => map.set(p.sku, p));
          return Array.from(map.values()).sort((a, b) => a.no - b.no);
        });
        showToast(`✓ Imported ${parsed.length} SKUs from Excel.`);
        e.target.value = "";
      },
      (err) => { setImporting(false); showToast(err, "error"); e.target.value = ""; }
    );
  };

  // ── Export to Excel ──
  const handleExport = () => {
    exportToWis(rows);
    showToast("✓ WIS exported as Excel file.");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "'Segoe UI', sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: 200, background: C.sidebar, display: "flex", flexDirection: "column", padding: "20px 0", flexShrink: 0 }}>
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid #2d3139" }}>
          <div style={{ fontWeight: 900, fontSize: 13, color: C.orange, letterSpacing: 1 }}>TDT</div>
          <div style={{ fontWeight: 900, fontSize: 15, color: C.white, letterSpacing: 1 }}>POWERSTEEL</div>
          <div style={{ fontSize: 9, color: "#6b7280", marginTop: 2 }}>THE NO.1 STEEL SUPPLIER</div>
        </div>
        {[
          { label: "Home", icon: "🏠" },
          { label: "Product", icon: "🛒" },
          { label: "Stock Management", icon: "📦", active: true },
          { label: "Purchasing Order", icon: "🛒" },
          { label: "Stock Sheets", icon: "📋" },
        ].map((item) => (
          <div key={item.label} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "11px 20px", cursor: "pointer",
            background: item.active ? C.orange : "transparent",
            color: item.active ? C.white : "#9ca3af",
            fontSize: 13, fontWeight: item.active ? 700 : 400,
          }}>
            <span>{item.icon}</span><span>{item.label}</span>
          </div>
        ))}
        <div style={{ marginTop: "auto", padding: "12px 20px", display: "flex", alignItems: "center", gap: 10, color: "#9ca3af", fontSize: 13, cursor: "pointer" }}>
          <span>⚙️</span><span>Settings</span>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Top bar */}
        <header style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>Ending Inventory</h1>
            <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>Marilao Warehouse</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ background: C.orange, color: C.white, borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>🔔</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#d1d5db", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👤</div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Chelsea Lopez</span>
              <span style={{ fontSize: 11 }}>▾</span>
            </div>
          </div>
        </header>

        <div style={{ padding: "24px 28px", flex: 1 }}>

          {/* Controls row */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ display: "flex", alignItems: "center", background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "0 12px", flex: "1 1 220px", maxWidth: 320 }}>
              <span style={{ color: C.textMuted, marginRight: 8 }}>🔍</span>
              <input
                placeholder="Search SKU or product name..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{ border: "none", outline: "none", fontSize: 13, padding: "10px 0", width: "100%", background: "transparent" }}
              />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 14px", fontSize: 13, background: C.white, cursor: "pointer", outline: "none" }}
            >
              {["All", "In Stock", "Out of Stock", "Variance"].map((s) => <option key={s}>{s}</option>)}
            </select>

            <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
              {/* Import from Excel */}
              <input ref={importRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleImport} />
              <button
                onClick={() => importRef.current.click()}
                disabled={importing}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  background: C.white, border: `1.5px solid ${C.orange}`,
                  color: C.orange, borderRadius: 8, padding: "9px 18px",
                  fontWeight: 700, fontSize: 13, cursor: "pointer",
                  opacity: importing ? 0.6 : 1,
                }}
              >
                📥 {importing ? "Importing…" : "Import from WIS"}
              </button>

              {/* Export WIS */}
              <button
                onClick={handleExport}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  background: C.white, border: `1.5px solid ${C.border}`,
                  color: C.text, borderRadius: 8, padding: "9px 18px",
                  fontWeight: 600, fontSize: 13, cursor: "pointer",
                }}
              >
                📤 Export WIS
              </button>

              {/* Start Ending Inventory */}
              <button style={{
                display: "flex", alignItems: "center", gap: 7,
                background: C.orange, color: C.white,
                border: "none", borderRadius: 8, padding: "9px 18px",
                fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}>
                ＋ Start Ending Inventory
              </button>
            </div>
          </div>

          {/* Month badge */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <div style={{ background: C.orange, color: C.white, borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
              📅 April 2026 ▾
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: `2px solid ${C.border}`, marginBottom: 0 }}>
            {[["wis", "Ending Inventory as per WIS"], ["cogs", "Cost of Goods Sold"]].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  padding: "10px 20px", fontWeight: 600, fontSize: 13,
                  border: "none", background: "transparent", cursor: "pointer",
                  borderBottom: activeTab === key ? `2px solid ${C.orange}` : "2px solid transparent",
                  color: activeTab === key ? C.orange : C.textMuted,
                  marginBottom: -2,
                }}
              >{label}</button>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: C.white, borderRadius: "0 0 10px 10px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: C.headerBg }}>
                    {activeTab === "wis"
                      ? ["PRODUCT DESCRIPTION", "SKU", "LAST ACCEPTANCE DATE", "QTY AS PER WIS", "TOTAL UNIT COST", "AVG UNIT COST", "VARIANCE (QTY)", "VARIANCE (AMOUNT)", "REMARKS"]
                        .map((h) => (
                          <th key={h} style={{ padding: "12px 14px", color: C.headerText, fontWeight: 700, textAlign: "left", whiteSpace: "nowrap", letterSpacing: 0.3, fontSize: 11 }}>{h}</th>
                        ))
                      : ["PRODUCT DESCRIPTION", "SKU", "QTY SOLD AS PER WIS", "AVG UNIT COST", "TOTAL COST OF GOODS SOLD"]
                        .map((h) => (
                          <th key={h} style={{ padding: "12px 14px", color: C.headerText, fontWeight: 700, textAlign: "left", whiteSpace: "nowrap", letterSpacing: 0.3, fontSize: 11 }}>{h}</th>
                        ))
                    }
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 && (
                    <tr><td colSpan={9} style={{ textAlign: "center", padding: 40, color: C.textMuted }}>No items found.</td></tr>
                  )}
                  {paged.map((row, i) => (
                    <tr
                      key={row.sku}
                      style={{ background: i % 2 === 0 ? C.white : "#fafafa", borderBottom: `1px solid ${C.border}` }}
                      onMouseEnter={(e) => e.currentTarget.style.background = C.rowHover}
                      onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? C.white : "#fafafa"}
                    >
                      {activeTab === "wis" ? (
                        <>
                          <td style={{ padding: "11px 14px", maxWidth: 280 }}>
                            <div style={{ fontWeight: 600, color: C.text, lineHeight: 1.4 }}>{row.desc}</div>
                          </td>
                          <td style={{ padding: "11px 14px", color: C.orange, fontWeight: 700, whiteSpace: "nowrap" }}>{row.sku}</td>
                          <td style={{ padding: "11px 14px", color: C.textMuted, whiteSpace: "nowrap" }}>{row.lastDate || "—"}</td>
                          <td style={{ padding: "11px 14px", textAlign: "right", fontWeight: 700 }}>{row.qty.toLocaleString()}</td>
                          <td style={{ padding: "11px 14px", textAlign: "right" }}>₱{fmt(row.totalCost)}</td>
                          <td style={{ padding: "11px 14px", textAlign: "right" }}>₱{fmt(row.avgCost)}</td>
                          <td style={{ padding: "11px 14px", textAlign: "right" }}>
                            <span style={{
                              padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                              background: row.varianceQty === 0 ? C.tagGreen : C.tagRed,
                              color: row.varianceQty === 0 ? C.tagGreenText : C.tagRedText,
                            }}>{row.varianceQty}</span>
                          </td>
                          <td style={{ padding: "11px 14px", textAlign: "right" }}>
                            <span style={{
                              padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                              background: row.varianceAmt === 0 ? C.tagGreen : C.tagRed,
                              color: row.varianceAmt === 0 ? C.tagGreenText : C.tagRedText,
                            }}>{row.varianceAmt === 0 ? "—" : `₱${fmt(row.varianceAmt)}`}</span>
                          </td>
                          <td style={{ padding: "11px 14px", color: C.textMuted, fontStyle: row.remarks ? "normal" : "italic" }}>
                            {row.remarks || "—"}
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: "11px 14px", maxWidth: 280 }}>
                            <div style={{ fontWeight: 600, color: C.text, lineHeight: 1.4 }}>{row.desc}</div>
                          </td>
                          <td style={{ padding: "11px 14px", color: C.orange, fontWeight: 700 }}>{row.sku}</td>
                          <td style={{ padding: "11px 14px", textAlign: "right", fontWeight: 700 }}>{row.qty.toLocaleString()}</td>
                          <td style={{ padding: "11px 14px", textAlign: "right" }}>₱{fmt(row.avgCost)}</td>
                          <td style={{ padding: "11px 14px", textAlign: "right", fontWeight: 700, color: row.totalCost > 0 ? "#065f46" : C.textMuted }}>
                            {row.totalCost > 0 ? `₱${fmt(row.totalCost)}` : "—"}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${C.border}`, background: "#fafafa" }}>
              <span style={{ fontSize: 13, color: C.textMuted }}>
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} SKUs
              </span>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ border: `1px solid ${C.border}`, background: C.white, borderRadius: 6, width: 30, height: 30, cursor: page === 1 ? "default" : "pointer", opacity: page === 1 ? 0.4 : 1, fontSize: 14 }}>←</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button key={n} onClick={() => setPage(n)}
                    style={{
                      border: n === page ? "none" : `1px solid ${C.border}`,
                      background: n === page ? C.orange : C.white,
                      color: n === page ? C.white : C.text,
                      borderRadius: 6, width: 30, height: 30,
                      cursor: "pointer", fontWeight: n === page ? 700 : 400, fontSize: 13,
                    }}>{n}</button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ border: `1px solid ${C.border}`, background: C.white, borderRadius: 6, width: 30, height: 30, cursor: page === totalPages ? "default" : "pointer", opacity: page === totalPages ? 0.4 : 1, fontSize: 14 }}>→</button>
              </div>
            </div>
          </div>

          {/* ── HOW IT WORKS card ── */}
          <div style={{ marginTop: 24, background: C.white, borderRadius: 10, padding: "18px 22px", border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: C.text }}>📋 How Excel Sync Works</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: C.orange }}>📥 Import from WIS (Excel → Website)</p>
                <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: C.textMuted, lineHeight: 1.8 }}>
                  <li>Click <strong>"Import from WIS"</strong></li>
                  <li>Pick your <code>TDT_WIS_...xlsx</code> file</li>
                  <li>Rows from the <strong>ENDING INVENTORY</strong> sheet are matched by <strong>SKU</strong> and loaded into the table automatically</li>
                  <li>New SKUs from the file are appended; existing ones are updated</li>
                </ol>
              </div>
              <div>
                <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: C.orange }}>📤 Export WIS (Website → Excel)</p>
                <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: C.textMuted, lineHeight: 1.8 }}>
                  <li>Click <strong>"Export WIS"</strong></li>
                  <li>An Excel file is generated with every row currently shown in the table</li>
                  <li>Columns match the original WIS format exactly (description, SKU, dates, costs, variances, remarks)</li>
                  <li>Open the downloaded file in Excel — all rows are there, ready to share or archive</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Toast notification ── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9999,
          background: toast.type === "error" ? "#dc2626" : "#16a34a",
          color: C.white, borderRadius: 10, padding: "12px 20px",
          fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
          animation: "fadeIn .2s ease",
          maxWidth: 360,
        }}>
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>
    </div>
  );
}