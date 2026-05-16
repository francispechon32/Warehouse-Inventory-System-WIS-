import { useState, useRef, useEffect } from "react";
import PageToolbar from "./PageToolbar";

/* ─── SAMPLE DATA ─────────────────────────────────────────── */
const sampleProducts = [
  { id: 1,  sku: "DRB007", description: "Deformed Round Bar, 10mm x 6M g33",                                 category: "Deformed Round Bar", unit: "pcs", stock: 0,    avgCost: 0,       totalValue: 0,          status: "Active"   },
  { id: 2,  sku: "DRB008", description: "Deformed Round Bar, 12mm x 6M g33",                                 category: "Deformed Round Bar", unit: "pcs", stock: 0,    avgCost: 0,       totalValue: 0,          status: "Active"   },
  { id: 3,  sku: "DRB009", description: "Deformed Round Bar, 16mm x 6M g33",                                 category: "Deformed Round Bar", unit: "pcs", stock: 0,    avgCost: 0,       totalValue: 0,          status: "Active"   },
  { id: 4,  sku: "DRB050", description: "Deformed Round Bar, 10mm x 6M g40",                                 category: "Deformed Round Bar", unit: "pcs", stock: 1557, avgCost: 136.60,  totalValue: 212886.42,  status: "Active"   },
  { id: 5,  sku: "DRB051", description: "Deformed Round Bar, 12mm x 6M g40",                                 category: "Deformed Round Bar", unit: "pcs", stock: 1,    avgCost: 186.38,  totalValue: 186.38,     status: "Low Stock"},
  { id: 6,  sku: "DRB052", description: "Deformed Round Bar, 16mm x 6M g40",                                 category: "Deformed Round Bar", unit: "pcs", stock: 1225, avgCost: 346.73,  totalValue: 424744.25,  status: "Active"   },
  { id: 7,  sku: "SHPT2",  description: "Sheet Pile, T2, 400mm x 100mm x 10.5mm x 48kg/m x 12M (576 kilos)",category: "Sheet Pile",          unit: "pcs", stock: 560,  avgCost: 22529.66,totalValue: 12616609.60, status: "Active"   },
  { id: 8,  sku: "MSP010", description: "MS Plate, 6mm x 4' x 8'",                                           category: "MS Plate",            unit: "pcs", stock: 322,  avgCost: 554.79,  totalValue: 178642.38,  status: "Active"   },
  { id: 9,  sku: "MSP018", description: "MS Plate, 12mm x 4' x 8'",                                          category: "MS Plate",            unit: "pcs", stock: 0,    avgCost: 0,       totalValue: 0,          status: "Active"   },
  { id: 10, sku: "SKU10",  description: "MS Plate, 10mm X 4' x 8'",                                          category: "MS Plate",            unit: "pcs", stock: 0,    avgCost: 0,       totalValue: 0,          status: "Active"   },
  { id: 11, sku: "SHPT2A", description: "Sheet Pile, T2, 400mm x 100mm x 10.5mm x 48kg/m x 6M (288 kilos)", category: "Sheet Pile",          unit: "pcs", stock: 0,    avgCost: 0,       totalValue: 0,          status: "Active"   },
  { id: 12, sku: "SHPT7",  description: "Sheet Pile Z type 12 meters",                                        category: "Sheet Pile",          unit: "pcs", stock: 0,    avgCost: 0,       totalValue: 0,          status: "Active"   },
  { id: 13, sku: "JINXI",  description: "Sheet Pile, Z - Pile 770mm W x 354mm H x 8.5mm x 73.2kg/M x 12M",  category: "Sheet Pile",          unit: "pcs", stock: 15,   avgCost: 41838.53,totalValue: 627577.95,  status: "Low Stock"},
  { id: 14, sku: "WF016",  description: "Wide Flange, 8 x 4 x 10# x 6M",                                    category: "Wide Flange",         unit: "pcs", stock: 0,    avgCost: 0,       totalValue: 0,          status: "Active"   },
  { id: 15, sku: "WF009",  description: "Wide Flange, 6 x 4 x 9# x 6M",                                     category: "Wide Flange",         unit: "pcs", stock: 0,    avgCost: 0,       totalValue: 0,          status: "Active"   },
  { id: 16, sku: "SHPT3",  description: "Sheet Pile, T3, 400mm x 125mm x 13mm x 60kg/m x 12M (720kgs)",     category: "Sheet Pile",          unit: "pcs", stock: 481,  avgCost: 28271.06,totalValue: 13598379.86, status: "Active"   },
];

/* ─── ICONS ─────────────────────────────────────────────── */
function IconSearch({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
}
function IconChevronDown({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 9l-7 7-7-7"/></svg>;
}
function IconChevronLeft({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 19l-7-7 7-7"/></svg>;
}
function IconChevronRight({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"/></svg>;
}
function IconDownload({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
}
function IconUpload({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
}
function IconPlus({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}

/* ─── SHEETJS LOADER ─────────────────────────────────────── */
function useSheetJS() {
  const [ready, setReady] = useState(!!window.XLSX);
  useEffect(() => {
    if (window.XLSX) { setReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload = () => setReady(true);
    document.head.appendChild(s);
  }, []);
  return ready;
}

/* ─── EXPORT ─────────────────────────────────────────────── */
function exportProducts(rows) {
  if (!window.XLSX) { alert("SheetJS not loaded yet."); return; }
  const XLSX = window.XLSX;
  const wb = XLSX.utils.book_new();
  const headers = [
    ["TDT WAREHOUSE INVENTORY SHEET (TDT WIS)"],
    ["List of SKU — Product Master List"],
    ["LOCATION:", "MARILAO WAREHOUSE"],
    ["AS OF:", new Date().toLocaleString()],
    [],
    ["NO.", "SKU CODE", "PRODUCT DESCRIPTION", "CATEGORY", "UNIT", "CURRENT STOCK", "AVG COST", "TOTAL VALUE", "STATUS"],
  ];
  const dataRows = rows.map((r, i) => [i + 1, r.sku, r.description, r.category, r.unit, r.stock, r.avgCost, r.totalValue, r.status]);
  const ws = XLSX.utils.aoa_to_sheet([...headers, ...dataRows]);
  ws["!cols"] = [{wch:5},{wch:12},{wch:55},{wch:22},{wch:6},{wch:14},{wch:12},{wch:14},{wch:10}];
  // Style header row
  const hStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { patternType: "solid", fgColor: { rgb: "1C2235" } }, alignment: { horizontal: "center" } };
  ["A6","B6","C6","D6","E6","F6","G6","H6","I6"].forEach(c => {
    if (!ws[c]) ws[c] = { v: "" };
    ws[c].s = hStyle;
  });
  const titleStyle = { font: { bold: true, sz: 14, color: { rgb: "1C2235" } } };
  if (ws["A1"]) ws["A1"].s = titleStyle;
  ws["!merges"] = [{ s:{r:0,c:0}, e:{r:0,c:8} }, { s:{r:1,c:0}, e:{r:1,c:8} }];
  XLSX.utils.book_append_sheet(wb, ws, "LIST OF SKU");
  XLSX.writeFile(wb, "TDT_WIS_List_of_SKU.xlsx");
}

/* ─── IMPORT ─────────────────────────────────────────────── */
function importProducts(file, onDone, onError) {
  if (!window.XLSX) { onError("SheetJS not loaded."); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const wb = window.XLSX.read(new Uint8Array(e.target.result), { type: "array" });
      const ws = wb.Sheets["LIST OF SKU"] || wb.Sheets[wb.SheetNames[0]];
      if (!ws) throw new Error("No valid sheet found.");
      const raw = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
      let start = 0;
      for (let i = 0; i < Math.min(raw.length, 10); i++) {
        if (raw[i] && raw[i].some(v => typeof v === "string" && v.toUpperCase().includes("SKU"))) { start = i + 1; break; }
      }
      const parsed = [];
      for (let i = start; i < raw.length; i++) {
        const r = raw[i]; if (!r || !r[1]) continue;
        parsed.push({
          id: i, sku: String(r[1]||"").trim(), description: String(r[2]||"").trim(),
          category: String(r[3]||"").trim(), unit: String(r[4]||"pcs").trim(),
          stock: parseFloat(r[5])||0, avgCost: parseFloat(r[6])||0,
          totalValue: parseFloat(r[7])||0, status: String(r[8]||"Active").trim(),
        });
      }
      if (!parsed.length) throw new Error("No data rows found.");
      onDone(parsed);
    } catch(err) { onError(err.message); }
  };
  reader.readAsArrayBuffer(file);
}

export default function ProductPage() {
  const xlsxReady = useSheetJS();
  const [products, setProducts] = useState(sampleProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [currentPage, setCurrentPage] = useState(1);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);
  const itemsPerPage = 8;

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const filtered = products.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || p.sku.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    const matchCat = categoryFilter === "All Categories" || p.category === categoryFilter;
    const matchSt = statusFilter === "All Status" || p.status === statusFilter;
    return matchSearch && matchCat && matchSt;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filtered.slice(startIdx, startIdx + itemsPerPage);
  const categories = ["All Categories", ...new Set(products.map(p => p.category))];

  const handleImport = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setImporting(true);
    importProducts(file, (parsed) => {
      setImporting(false); setProducts(parsed); setCurrentPage(1);
      showToast(`✓ Imported ${parsed.length} SKUs successfully.`);
      e.target.value = "";
    }, (err) => {
      setImporting(false);
      showToast(`❌ Import failed: ${err}`, "error");
      e.target.value = "";
    });
  };

  return (
    <div style={{ background: "#f0f2f5", padding: "28px 32px 40px", display: "flex", flexDirection: "column", gap: 22 }}>
      <PageToolbar
        searchValue={searchQuery}
        onSearchChange={(v) => { setSearchQuery(v); setCurrentPage(1); }}
        filters={[
          { key: "category", value: categoryFilter, onChange: (v) => { setCategoryFilter(v); setCurrentPage(1); }, options: categories, minWidth: 160 },
          { key: "status", value: statusFilter, onChange: (v) => { setStatusFilter(v); setCurrentPage(1); }, options: ["All Status", "Active", "Low Stock"], minWidth: 140 },
        ]}
        primaryAction={{ label: "Add Item", onClick: () => {} }}
        showDateRange={false}
        importExport={{
          fileInputRef,
          onFileChange: handleImport,
          importing,
          importDisabled: !xlsxReady,
          onExport: () => exportProducts(filtered),
        }}
      />

      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#1c2235" }}>
                {["SKU CODE","PRODUCT DESCRIPTION","CATEGORY","UNIT","CURRENT STOCK","AVG COST","TOTAL VALUE","STATUS"].map(h => (
                  <th key={h} style={{ padding: "16px 20px", textAlign: ["CURRENT STOCK","AVG COST","TOTAL VALUE"].includes(h)?"right":"left", color: "#fff", fontWeight: 700, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((product, idx) => (
                <tr key={product.id} style={{ borderBottom: "1px solid #f3f4f6", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f5f9ff"}
                  onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#fafafa"}>
                  <td style={{ padding: "14px 20px", color: "#374151", fontWeight: 600 }}>{product.sku}</td>
                  <td style={{ padding: "14px 20px", color: "#374151", fontSize: 12 }}>{product.description}</td>
                  <td style={{ padding: "14px 20px", color: "#6b7280", fontSize: 12 }}>{product.category}</td>
                  <td style={{ padding: "14px 20px", color: "#374151" }}>{product.unit}</td>
                  <td style={{ padding: "14px 20px", textAlign: "right", color: "#374151" }}>{product.stock.toLocaleString()}</td>
                  <td style={{ padding: "14px 20px", textAlign: "right", color: "#374151" }}>₱{product.avgCost.toFixed(2)}</td>
                  <td style={{ padding: "14px 20px", textAlign: "right", color: "#374151" }}>₱{product.totalValue.toFixed(2)}</td>
                  <td style={{ padding: "14px 20px", textAlign: "center" }}>
                    <span style={{ padding: "4px 12px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: product.status === "Active" ? "#dcfce7" : "#fef3c7", color: product.status === "Active" ? "#16a34a" : "#d97706" }}>{product.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderTop: "1px solid #f3f4f6", background: "#fafafa", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>Showing {startIdx + 1} to {Math.min(startIdx + itemsPerPage, filtered.length)} of {filtered.length} SKUs</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
              style={{ padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: currentPage===1?"not-allowed":"pointer", opacity: currentPage===1?0.5:1 }}>
              <IconChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => setCurrentPage(page)}
                style={{ width: 32, height: 32, border: page===currentPage?"1px solid #e87c27":"1px solid #e5e7eb", borderRadius: 6, background: page===currentPage?"#e87c27":"#fff", color: page===currentPage?"#fff":"#374151", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                {page}
              </button>
            ))}
            <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
              style={{ padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: currentPage===totalPages?"not-allowed":"pointer", opacity: currentPage===totalPages?0.5:1 }}>
              <IconChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, background: toast.type==="error"?"#dc2626":"#16a34a", color: "#fff", borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
