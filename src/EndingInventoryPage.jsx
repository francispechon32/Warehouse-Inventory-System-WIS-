import { useState, useRef, useMemo, useEffect } from "react";

/* ─── Load SheetJS from CDN (no npm install needed) ───────── */
function useSheetJS() {
  const [ready, setReady] = useState(!!window.XLSX);
  useEffect(() => {
    if (window.XLSX) { setReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload = () => setReady(true);
    s.onerror = () => console.error("Failed to load SheetJS");
    document.head.appendChild(s);
  }, []);
  return ready;
}

/* ─── Full seed data from actual TDT WIS MARILAO MARCH 2026 Excel ── */
const SEED_DATA = [
  { no:1,  productDescription:"Deformed Round Bar, 10mm x 6M g33",                                               sku:"DRB007", lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,                avgUnitCost:0,                  qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:2,  productDescription:"Deformed Round Bar, 12mm x 6M g33",                                               sku:"DRB008", lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,                avgUnitCost:0,                  qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:3,  productDescription:"Deformed Round Bar, 16mm x 6M g33",                                               sku:"DRB009", lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,                avgUnitCost:0,                  qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:4,  productDescription:"Deformed Round Bar, 10mm x 6M g40",                                               sku:"DRB050", lastAcceptanceDate:"2026-02-21", qtyAsPerWis:1557, totalUnitCost:212686.20,        avgUnitCost:136.60,             qtyAsPerCounting:1557,varianceQty:0, varianceAmount:0, remarks:"" },
  { no:5,  productDescription:"Deformed Round Bar, 12mm x 6M g40",                                               sku:"DRB051", lastAcceptanceDate:"2025-05-31", qtyAsPerWis:1,    totalUnitCost:186.38,           avgUnitCost:186.38,             qtyAsPerCounting:1,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:6,  productDescription:"Deformed Round Bar, 16mm x 6M g40",                                               sku:"DRB052", lastAcceptanceDate:"2026-02-21", qtyAsPerWis:1225, totalUnitCost:424750.18,        avgUnitCost:346.73,             qtyAsPerCounting:1225,varianceQty:0, varianceAmount:0, remarks:"" },
  { no:7,  productDescription:"Sheet Pile, T2, 400mm x 100mm x 10.5mm x 48kg/m x 12M (576 kilos)",              sku:"SHPT2",  lastAcceptanceDate:"2026-03-24", qtyAsPerWis:560,  totalUnitCost:12616608.49,      avgUnitCost:22529.66,           qtyAsPerCounting:560, varianceQty:0, varianceAmount:0, remarks:"" },
  { no:8,  productDescription:"MS Plate, 6mm x 4' x 8'",                                                         sku:"MSP010", lastAcceptanceDate:"2026-02-21", qtyAsPerWis:322,  totalUnitCost:178642.38,        avgUnitCost:554.79,             qtyAsPerCounting:322, varianceQty:0, varianceAmount:0, remarks:"DRB 20mm x 6M g40" },
  { no:9,  productDescription:"MS Plate, 12mm x 4' x 8'",                                                        sku:"MSP018", lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,                avgUnitCost:0,                  qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:10, productDescription:"MS Plate, 10mm X 4' x 8'",                                                        sku:"SKU10",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,                avgUnitCost:0,                  qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:11, productDescription:"Sheet Pile, T2, 400mm x 100mm x 10.5mm x 48kg/m x 6M (288 kilos)",               sku:"SHPT2A", lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,                avgUnitCost:0,                  qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:12, productDescription:"Sheet Pile Z type 12 meters",                                                      sku:"SHPT7",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,                avgUnitCost:0,                  qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:13, productDescription:"Sheet Pile, Z - Pile 770mm W x 354mm H x 8.5mm x 73.2kg/M x 12M (878.40 kilos)", sku:"JINXI",  lastAcceptanceDate:"2025-03-12", qtyAsPerWis:15,   totalUnitCost:627577.90,        avgUnitCost:41838.53,           qtyAsPerCounting:15,  varianceQty:0, varianceAmount:0, remarks:"" },
  { no:14, productDescription:"Wide Flange, 8 x 4 x 10# x 6M (approx: Web 4.32mm/Flange 5.21mm)",              sku:"WF016",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,                avgUnitCost:0,                  qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:15, productDescription:"Wide Flange, 6 x 4 x 9# x 6M (approx: Web 4.32mm/Flange 5.46mm)",              sku:"WF009",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,                avgUnitCost:0,                  qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:16, productDescription:"Sheet Pile, T3, 400mm x 125mm x 13mm x 60kg/m x 12M(720kgs)",                   sku:"SHPT3",  lastAcceptanceDate:"2025-11-29", qtyAsPerWis:481,  totalUnitCost:13598380.80,      avgUnitCost:28271.06,           qtyAsPerCounting:481, varianceQty:0, varianceAmount:0, remarks:"1 PC DAMAGED" },
  { no:17, productDescription:"Wide Flange, Item 4",                                                              sku:"SKU17",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,                avgUnitCost:0,                  qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:18, productDescription:"Wide Flange, Item 5",                                                              sku:"SKU18",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,                avgUnitCost:0,                  qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:19, productDescription:"Wide Flange, Item 6",                                                              sku:"SKU19",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,                avgUnitCost:0,                  qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:20, productDescription:"Angle Bar,  3mm x 38mm x 38mm  x 6M Yellow",                                      sku:"SKU20",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,                avgUnitCost:0,                  qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:21, productDescription:"Angle Bar,  4mm x 38mm x 38mm  x 6M  Orange",                                     sku:"SKU21",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,                avgUnitCost:0,                  qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:22, productDescription:"Angle Bar,  5mm x 38mm x 38mm  x 6M White",                                       sku:"SKU22",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,                avgUnitCost:0,                  qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:23, productDescription:"Angle Bar,  6mm x 38mm x 38mm  x 6M Brown",                                       sku:"SKU23",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,                avgUnitCost:0,                  qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:24, productDescription:"Angle Bar,  3mm x 50mm x 50mm  x 6M Yellow",                                      sku:"SKU24",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,                avgUnitCost:0,                  qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:25, productDescription:"Angle Bar,  4mm x 50mm x 50mm  x 6M Orange",                                      sku:"SKU25",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,                avgUnitCost:0,                  qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:26, productDescription:"Angle Bar,  4.5mm x 50mm x 50mm  x 6M Violet",                                    sku:"SKU26",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,                avgUnitCost:0,                  qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:27, productDescription:"Angle Bar, 5mm x 50mm x 50mm  x 6M White",                                        sku:"SKU27",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,                avgUnitCost:0,                  qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:28, productDescription:"Angle Bar, 6mm x 50mm x 50mm  x 6M Brown",                                        sku:"SKU28",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,                avgUnitCost:0,                  qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:29, productDescription:"Angle Bar,  6mm x 63.5mm x 63.5mm  x 6M Brown",                                   sku:"SKU29",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,                avgUnitCost:0,                  qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:30, productDescription:"Angle Bar, 6mm x 75mm x 75mm  x 6M Brown",                                        sku:"SKU30",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,                avgUnitCost:0,                  qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
];

const PAGE_SIZE = 8;

function fmtPHP(n) {
  if (!n && n !== 0) return "—";
  return "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ─── Parse WIS Excel using SheetJS loaded from CDN ──────── */
// KEY FIX: readAsArrayBuffer → new Uint8Array(buffer) → XLSX.read(uint8, {type:"array"})
// The old code used readAsText which garbled binary .xlsx files
function parseWisExcel(file, onDone, onError) {
  if (!window.XLSX) { onError("SheetJS library not loaded yet. Please wait a moment and try again."); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      // ✅ Correct: wrap ArrayBuffer as Uint8Array before passing to SheetJS
      const uint8 = new Uint8Array(e.target.result);
      const wb = window.XLSX.read(uint8, { type: "array", cellDates: true });

      const ws = wb.Sheets["ENDING INVENTORY"];
      if (!ws) throw new Error('Sheet "ENDING INVENTORY" not found. Make sure you are importing the correct TDT WIS Excel file.');

      // Get raw 2D array (header:1 = no header row detection, gives us raw rows)
      const raw = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false });

      // Find header row by looking for "PRODUCT DESCRIPTION"
      let dataStart = 6; // default: row index 6 (row 7 in Excel, 1-indexed)
      for (let i = 0; i < Math.min(raw.length, 12); i++) {
        if (raw[i] && raw[i].some(v => typeof v === "string" && v.toUpperCase().includes("PRODUCT DESCRIPTION"))) {
          dataStart = i + 1;
          break;
        }
      }

      const toNum = (v) => {
        if (v === null || v === undefined || v === "") return 0;
        const n = parseFloat(String(v).replace(/,/g, ""));
        return isNaN(n) ? 0 : n;
      };

      const parseDate = (v) => {
        if (!v) return "";
        if (v instanceof Date) return v.toISOString().slice(0, 10);
        const d = new Date(v);
        if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
        return String(v).slice(0, 10);
      };

      const parsed = [];
      for (let i = dataStart; i < raw.length; i++) {
        const r = raw[i];
        if (!r) continue;
        const noVal = r[0];
        if (noVal === null || noVal === undefined || noVal === "") continue;
        const noNum = parseFloat(String(noVal).replace(/,/g, ""));
        if (isNaN(noNum) || noNum <= 0) continue; // skip total/blank rows

        parsed.push({
          id: noNum,
          no: noNum,
          productDescription: String(r[1] ?? "").trim(),
          sku:                String(r[2] ?? "").trim(),
          lastAcceptanceDate: parseDate(r[3]),
          qtyAsPerWis:        toNum(r[4]),
          totalUnitCost:      toNum(r[5]),
          avgUnitCost:        toNum(r[6]),
          qtyAsPerCounting:   toNum(r[7]),
          varianceQty:        toNum(r[8]),
          varianceAmount:     toNum(r[9]),
          remarks:            String(r[10] ?? "").trim(),
        });
      }

      if (!parsed.length) throw new Error("No data rows found in ENDING INVENTORY sheet.");
      onDone(parsed);
    } catch (err) {
      onError(err.message || "Unknown error reading Excel file.");
    }
  };
  reader.onerror = () => onError("Could not read the file.");
  // ✅ Must use readAsArrayBuffer (NOT readAsText) for binary .xlsx files
  reader.readAsArrayBuffer(file);
}

/* ─── Export to Excel using SheetJS ──────────────────────── */
function exportToWis(rows) {
  if (!window.XLSX) { alert("SheetJS not loaded yet. Please try again."); return; }
  const XLSX = window.XLSX;
  const wb = XLSX.utils.book_new();
  const headers = [
    ["TDT WAREHOUSE INVENTORY SHEET (TDT WIS)"],
    ["Ending Inventory as per WIS"],
    ["LOCATION:", "MARILAO WAREHOUSE"],
    ["AS OF", new Date().toLocaleString()],
    [],
    ["NO.", "PRODUCT DESCRIPTION", "SKU NUMBER", "LAST ACCEPTANCE DATE",
      "QUANTITY AS PER WIS", "TOTAL UNIT COST", "AVERAGE UNIT COST",
      "QUANTITY AS PER COUNTING", "VARIANCE (QUANTITY)", "VARIANCE (AMOUNT)", "REMARKS"],
  ];
  const dataRows = rows.map(r => [
    r.no, r.productDescription, r.sku, r.lastAcceptanceDate || "",
    r.qtyAsPerWis, r.totalUnitCost, r.avgUnitCost,
    r.qtyAsPerCounting, r.varianceQty, r.varianceAmount, r.remarks,
  ]);
  const ws = XLSX.utils.aoa_to_sheet([...headers, ...dataRows]);
  ws["!cols"] = [
    {wch:5},{wch:65},{wch:10},{wch:20},
    {wch:18},{wch:18},{wch:18},{wch:22},{wch:18},{wch:18},{wch:22},
  ];
  XLSX.utils.book_append_sheet(wb, ws, "ENDING INVENTORY");
  XLSX.writeFile(wb, "TDT_WIS_Ending_Inventory_Export.xlsx");
}

/* ─── ICONS ─────────────────────────────────────────────── */
function IconSearch({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}
function IconChevronDown({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 9l-7 7-7-7" />
    </svg>
  );
}
function IconDownload({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
function IconUpload({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
function IconPlus({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function IconChevronLeft({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 19l-7-7 7-7" />
    </svg>
  );
}
function IconChevronRight({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────────── */
export default function EndingInventoryPage() {
  const xlsxReady = useSheetJS();
  const [inventoryData, setInventoryData] = useState(
    SEED_DATA.map((r, i) => ({ ...r, id: r.no ?? i + 1 }))
  );
  const [searchQuery, setSearchQuery]   = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [activeTab, setActiveTab]       = useState("wis");
  const [currentPage, setCurrentPage]   = useState(1);
  const [importing, setImporting]       = useState(false);
  const [toast, setToast]               = useState(null);
  const fileInputRef = useRef(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  /* ─── Filter ─── */
  const filtered = useMemo(() => {
    let d = inventoryData;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      d = d.filter(r => r.sku.toLowerCase().includes(q) || r.productDescription.toLowerCase().includes(q));
    }
    if (statusFilter === "In Stock")     d = d.filter(r => r.qtyAsPerWis > 0);
    if (statusFilter === "Out of Stock") d = d.filter(r => r.qtyAsPerWis === 0);
    if (statusFilter === "Variance")     d = d.filter(r => r.varianceQty !== 0);
    return d;
  }, [inventoryData, searchQuery, statusFilter]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const startIdx    = (currentPage - 1) * PAGE_SIZE;
  const paged       = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  /* ─── Import ─── */
  const handleImportWis = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!xlsxReady) { showToast("SheetJS not loaded yet. Please try again.", "error"); return; }
    setImporting(true);
    parseWisExcel(
      file,
      (parsed) => {
        setImporting(false);
        setInventoryData(prev => {
          const map = new Map(prev.map(r => [r.sku, r]));
          parsed.forEach(p => { if (p.sku) map.set(p.sku, p); });
          return Array.from(map.values()).sort((a, b) => (a.no ?? 0) - (b.no ?? 0));
        });
        setCurrentPage(1);
        showToast(`✓ Imported ${parsed.length} SKUs from WIS Excel file successfully.`);
        e.target.value = "";
      },
      (err) => {
        setImporting(false);
        showToast(`❌ Import failed: ${err}`, "error");
        e.target.value = "";
      }
    );
  };

  /* ─── Export ─── */
  const handleExportWis = () => {
    exportToWis(inventoryData);
    showToast("✓ WIS exported as Excel file.");
  };

  /* ─── Summary stats ─── */
  const totalValue   = inventoryData.reduce((s, r) => s + (r.totalUnitCost || 0), 0);
  const inStockCount = inventoryData.filter(r => r.qtyAsPerWis > 0).length;

  return (
    <div style={{ background: "#f0f2f5", padding: "28px 32px 40px", display: "flex", flexDirection: "column", gap: 18 }}>

      {/* ── Summary Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {[
          { label: "Total SKUs",            value: inventoryData.length,         color: "#3b82f6" },
          { label: "In Stock",              value: inStockCount,                 color: "#16a34a" },
          { label: "Total Inventory Value", value: fmtPHP(totalValue),           color: "#e87c27" },
        ].map(c => (
          <div key={c.label} style={{ background:"#fff", borderRadius:10, padding:"14px 18px", border:"1px solid #e5e7eb", boxShadow:"0 1px 3px rgba(0,0,0,0.05)" }}>
            <p style={{ margin:0, fontSize:11, color:"#6b7280", fontWeight:600 }}>{c.label}</p>
            <p style={{ margin:"4px 0 0", fontSize:22, fontWeight:800, color:c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* ── Search / Filter / Buttons ── */}
      <div style={{ background:"#fff", borderRadius:14, padding:"16px 24px", boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
        <div style={{ display:"flex", gap:12, alignItems:"center", justifyContent:"space-between", flexWrap:"wrap" }}>

          {/* Search */}
          <div style={{ flex:1, position:"relative", maxWidth:320 }}>
            <input
              type="text"
              placeholder="Search SKU or product name..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{ width:"100%", padding:"11px 14px 11px 36px", fontSize:14, border:"1px solid #d1d5db", borderRadius:8, fontFamily:"inherit", color:"#111827", background:"#ffffff", fontWeight:500, outline:"none" }}
            />
            <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#9ca3af" }}>
              <IconSearch size={16} />
            </span>
          </div>

          {/* Status Filter */}
          <div style={{ position:"relative", minWidth:150 }}>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              style={{ padding:"11px 32px 11px 14px", fontSize:14, border:"1px solid #d1d5db", borderRadius:8, background:"#ffffff", color:"#111827", cursor:"pointer", fontFamily:"inherit", width:"100%", appearance:"none", fontWeight:500, outline:"none" }}
            >
              {["All Status","In Stock","Out of Stock","Variance"].map(s => <option key={s}>{s}</option>)}
            </select>
            <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"#6b7280" }}>
              <IconChevronDown size={14} />
            </span>
          </div>

          {/* Month badge */}
          <div style={{ background:"#e87c27", color:"#fff", borderRadius:8, padding:"9px 16px", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:6, marginLeft:"auto" }}>
            📅 April 2026 ▾
          </div>

          {/* Start Ending Inventory */}
          <button style={{ padding:"10px 16px", background:"#e87c27", color:"#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
            <IconPlus size={16} /> Start Ending Inventory
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:"flex", gap:4, borderBottom:"2px solid #e5e7eb", background:"#fff", borderRadius:"12px 12px 0 0", padding:"0 24px", boxShadow:"0 1px 4px rgba(0,0,0,0.07)" }}>
        {[["wis","Ending Inventory as per WIS"],["cogs","Cost of Goods Sold"]].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            padding:"14px 20px", background:"none", border:"none", cursor:"pointer",
            borderBottom: activeTab===key ? "3px solid #e87c27" : "3px solid transparent",
            color: activeTab===key ? "#e87c27" : "#9ca3af",
            fontSize:14, fontWeight:700, marginBottom:-2,
          }}>{label}</button>
        ))}
      </div>

      {/* ── Table ── */}
      <div style={{ background:"#fff", borderRadius:"0 0 14px 14px", boxShadow:"0 1px 4px rgba(0,0,0,0.07)", overflow:"hidden", marginTop:-2 }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ background:"#1c2235" }}>
                {(activeTab === "wis"
                  ? ["#","PRODUCT DESCRIPTION","SKU","LAST ACCEPTANCE DATE","QTY AS PER WIS","TOTAL UNIT COST","AVG UNIT COST","QTY AS PER COUNTING","VARIANCE (QTY)","VARIANCE (AMT)","REMARKS"]
                  : ["#","PRODUCT DESCRIPTION","SKU","QTY AS PER WIS","AVG UNIT COST","TOTAL COST OF GOODS SOLD"]
                ).map((h,i) => (
                  <th key={h+i} style={{ padding:"14px 16px", textAlign: (h==="PRODUCT DESCRIPTION"||h==="SKU"||h==="LAST ACCEPTANCE DATE"||h==="REMARKS"||h==="#") ? "left" : "right", color:"#fff", fontWeight:700, fontSize:11, whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr><td colSpan={11} style={{ textAlign:"center", padding:48, color:"#9ca3af", fontSize:14 }}>No items found.</td></tr>
              )}
              {paged.map((item, idx) => (
                <tr key={item.id ?? item.sku}
                  style={{ borderBottom:"1px solid #f3f4f6", background: idx%2===0 ? "#fff" : "#fafafa", transition:"background .1s" }}
                  onMouseEnter={e => e.currentTarget.style.background="#fef6f2"}
                  onMouseLeave={e => e.currentTarget.style.background=idx%2===0?"#fff":"#fafafa"}
                >
                  {activeTab === "wis" ? (
                    <>
                      <td style={{ padding:"12px 16px", color:"#9ca3af", fontSize:11 }}>{item.no}</td>
                      <td style={{ padding:"12px 16px", color:"#374151", fontSize:12, maxWidth:280 }}>{item.productDescription}</td>
                      <td style={{ padding:"12px 16px", color:"#e87c27", fontWeight:700 }}>{item.sku}</td>
                      <td style={{ padding:"12px 16px", color:"#6b7280", whiteSpace:"nowrap" }}>{item.lastAcceptanceDate || "—"}</td>
                      <td style={{ padding:"12px 16px", textAlign:"right", fontWeight:700 }}>{item.qtyAsPerWis.toLocaleString()}</td>
                      <td style={{ padding:"12px 16px", textAlign:"right" }}>{fmtPHP(item.totalUnitCost)}</td>
                      <td style={{ padding:"12px 16px", textAlign:"right" }}>{fmtPHP(item.avgUnitCost)}</td>
                      <td style={{ padding:"12px 16px", textAlign:"right", fontWeight:700 }}>{item.qtyAsPerCounting.toLocaleString()}</td>
                      <td style={{ padding:"12px 16px", textAlign:"right" }}>
                        <span style={{ padding:"2px 10px", borderRadius:12, fontSize:11, fontWeight:700, background: item.varianceQty===0?"#d1fae5":"#fee2e2", color: item.varianceQty===0?"#065f46":"#991b1b" }}>
                          {item.varianceQty}
                        </span>
                      </td>
                      <td style={{ padding:"12px 16px", textAlign:"right" }}>
                        <span style={{ padding:"2px 10px", borderRadius:12, fontSize:11, fontWeight:700, background: item.varianceAmount===0?"#d1fae5":"#fee2e2", color: item.varianceAmount===0?"#065f46":"#991b1b" }}>
                          {item.varianceAmount===0 ? "—" : fmtPHP(item.varianceAmount)}
                        </span>
                      </td>
                      <td style={{ padding:"12px 16px", color:"#6b7280", fontSize:12, maxWidth:150 }}>{item.remarks || "—"}</td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding:"12px 16px", color:"#9ca3af", fontSize:11 }}>{item.no}</td>
                      <td style={{ padding:"12px 16px", color:"#374151", fontSize:12, maxWidth:280 }}>{item.productDescription}</td>
                      <td style={{ padding:"12px 16px", color:"#e87c27", fontWeight:700 }}>{item.sku}</td>
                      <td style={{ padding:"12px 16px", textAlign:"right", fontWeight:700 }}>{item.qtyAsPerWis.toLocaleString()}</td>
                      <td style={{ padding:"12px 16px", textAlign:"right" }}>{fmtPHP(item.avgUnitCost)}</td>
                      <td style={{ padding:"12px 16px", textAlign:"right", fontWeight:700, color: item.totalUnitCost>0?"#065f46":"#9ca3af" }}>
                        {item.totalUnitCost>0 ? fmtPHP(item.totalUnitCost) : "—"}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Footer: pagination + import/export ── */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 24px", borderTop:"1px solid #f3f4f6", background:"#fafafa", flexWrap:"wrap", gap:10 }}>
          <span style={{ fontSize:12, color:"#6b7280" }}>
            Showing {filtered.length===0?0:startIdx+1}–{Math.min(startIdx+PAGE_SIZE,filtered.length)} of {filtered.length} SKUs
          </span>

          {/* Pagination */}
          <div style={{ display:"flex", gap:4, alignItems:"center" }}>
            <button onClick={() => setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1}
              style={{ padding:"6px 10px", border:"1px solid #e5e7eb", borderRadius:6, background:"#fff", cursor:currentPage===1?"not-allowed":"pointer", opacity:currentPage===1?0.4:1 }}>
              <IconChevronLeft size={14} />
            </button>
            {Array.from({length:totalPages},(_,i)=>i+1).slice(0,10).map(n=>(
              <button key={n} onClick={()=>setCurrentPage(n)}
                style={{ width:30, height:30, border: n===currentPage?"none":"1px solid #e5e7eb", borderRadius:6, background: n===currentPage?"#e87c27":"#fff", color: n===currentPage?"#fff":"#374151", cursor:"pointer", fontWeight: n===currentPage?700:400, fontSize:13 }}>
                {n}
              </button>
            ))}
            {totalPages>10 && <span style={{fontSize:12,color:"#9ca3af"}}>…{totalPages}</span>}
            <button onClick={() => setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages}
              style={{ padding:"6px 10px", border:"1px solid #e5e7eb", borderRadius:6, background:"#fff", cursor:currentPage===totalPages?"not-allowed":"pointer", opacity:currentPage===totalPages?0.4:1 }}>
              <IconChevronRight size={14} />
            </button>
          </div>

          {/* Import / Export buttons */}
          <div style={{ display:"flex", gap:10 }}>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImportWis} style={{ display:"none" }} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing || !xlsxReady}
              style={{ padding:"8px 14px", border:"1.5px solid #e87c27", borderRadius:6, background:"#fff", cursor: (importing||!xlsxReady)?"not-allowed":"pointer", color:"#e87c27", fontSize:12, fontWeight:700, display:"flex", alignItems:"center", gap:6, opacity:(importing||!xlsxReady)?0.6:1 }}
            >
              <IconUpload size={14} />
              {importing ? "Importing…" : !xlsxReady ? "Loading…" : "Import WIS"}
            </button>
            <button
              onClick={handleExportWis}
              style={{ padding:"8px 14px", border:"1px solid #e5e7eb", borderRadius:6, background:"#fff", cursor:"pointer", color:"#374151", fontSize:12, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}
            >
              <IconDownload size={14} />
              Export WIS
            </button>
          </div>
        </div>
      </div>
      {/* ── Toast ── */}
      {toast && (
        <div style={{ position:"fixed", bottom:28, right:28, zIndex:9999, background: toast.type==="error"?"#dc2626":"#16a34a", color:"#fff", borderRadius:10, padding:"12px 20px", fontSize:13, fontWeight:600, boxShadow:"0 4px 20px rgba(0,0,0,0.18)", maxWidth:440, lineHeight:1.5 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}