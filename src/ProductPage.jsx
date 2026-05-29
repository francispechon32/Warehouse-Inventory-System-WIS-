import { useState, useRef, useEffect } from "react";
import PageToolbar from "./PageToolbar";
import {
  cellStr,
  cellNum,
  findHeaderRowIndex,
  pickCol,
  rowHasData,
  readWorkbookSheet,
  isInvalidProductRow,
} from "./excelImportUtils";
import {
  dedupeProductsBySku,
  deriveProductStatus,
  getLowStockProducts,
  isLowStock,
  syncProductsStatus,
  normalizeStock,
} from "./productUtils";
import { INITIAL_PRODUCTS } from "./initialProducts";

const sampleProducts = INITIAL_PRODUCTS;

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
function IconWarning({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

/* ─── SEARCH HIGHLIGHT ───────────────────────────────────── */
function HighlightText({ text, query }) {
  if (!query || !text) return <>{text}</>;
  const str = String(text);
  const idx = str.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{str}</>;
  return (
    <>
      {str.slice(0, idx)}
      <mark style={{
        background: "#fef08a",
        color: "#78350f",
        borderRadius: 3,
        padding: "0 1px",
        fontWeight: 700,
      }}>
        {str.slice(idx, idx + query.length)}
      </mark>
      {str.slice(idx + query.length)}
    </>
  );
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
  const dataRows = rows.map((r, i) => [
    i + 1, r.sku, r.description, r.category, r.unit, r.stock, r.avgCost, r.totalValue,
    deriveProductStatus(r.stock),
  ]);
  const ws = XLSX.utils.aoa_to_sheet([...headers, ...dataRows]);
  ws["!cols"] = [{wch:5},{wch:12},{wch:55},{wch:22},{wch:6},{wch:14},{wch:12},{wch:14},{wch:10}];
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
async function importProducts(file, onDone, onError) {
  try {
    const { raw } = await readWorkbookSheet(file, ["LIST OF SKU", "SKU"]);
    const headerIdx = findHeaderRowIndex(raw, ["SKU CODE", "PRODUCT DESCRIPTION"], 20);
    const dataStart = headerIdx >= 0 ? headerIdx + 1 : 6;
    const headers = headerIdx >= 0 ? raw[headerIdx] : null;
    const parsed = [];

    for (let i = dataStart; i < raw.length; i++) {
      const r = raw[i];
      if (!rowHasData(r)) continue;

      const sku = cellStr(pickCol(r, headers, ["SKU CODE", "SKU"], 1));
      const description = cellStr(pickCol(r, headers, ["PRODUCT DESCRIPTION", "PRODUCT"], 2));
      if (isInvalidProductRow(sku, description)) continue;

      const stock = normalizeStock(cellNum(pickCol(r, headers, ["CURRENT STOCK", "STOCK"], 5)));
      const avgCost = cellNum(pickCol(r, headers, ["AVG COST", "AVERAGE"], 6));
      const totalValue = cellNum(pickCol(r, headers, ["TOTAL VALUE", "TOTAL"], 7)) || stock * avgCost;

      parsed.push({
        id: parsed.length + 1,
        sku,
        description,
        category: cellStr(pickCol(r, headers, ["CATEGORY"], 3)) || "Uncategorized",
        unit: cellStr(pickCol(r, headers, ["UNIT"], 4)) || "pcs",
        stock,
        avgCost,
        totalValue,
        status: deriveProductStatus(stock),
      });
    }

    if (!parsed.length) throw new Error("No product rows found. Use Export WIS template or check SKU column.");
    onDone(dedupeProductsBySku(parsed));
  } catch (err) {
    onError(err.message || "Import failed.");
  }
}

/* ─── PRODUCT PAGE ───────────────────────────────────────── */
/**
 * Props:
 *   products    – shared product list from Dashboard (optional)
 *   setProducts – setter for shared product list (optional)
 *   initialStatusFilter – pre-select status filter, e.g. "Low Stock" (optional)
 */
export default function ProductPage({ products: propProducts, setProducts: propSetProducts, initialStatusFilter = "All Status" }) {
  const xlsxReady = useSheetJS();

  // If no props passed (standalone use), manage local state
  const [localProducts, setLocalProducts] = useState(() => syncProductsStatus(sampleProducts));
  const products    = propProducts    ?? localProducts;
  const setProducts = propSetProducts ?? setLocalProducts;

  const [searchQuery, setSearchQuery]     = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter]   = useState(initialStatusFilter);
  const [currentPage, setCurrentPage]     = useState(1);
  const [importing, setImporting]         = useState(false);
  const [toast, setToast]                 = useState(null);
  const fileInputRef = useRef(null);
  const itemsPerPage = 8;

  // If navigated here with a pre-set filter, apply it on mount
  useEffect(() => {
    setStatusFilter(initialStatusFilter);
    setCurrentPage(1);
  }, [initialStatusFilter]);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const filtered = products.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || p.sku.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    const matchCat    = categoryFilter === "All Categories" || p.category === categoryFilter;
    const matchSt     = statusFilter === "All Status"
      || (statusFilter === "Low Stock" ? isLowStock(p) : statusFilter === "Active" ? !isLowStock(p) : p.status === statusFilter);
    return matchSearch && matchCat && matchSt;
  });

  const totalPages    = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const startIdx      = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filtered.slice(startIdx, startIdx + itemsPerPage);
  const categories    = ["All Categories", ...new Set(products.map(p => p.category))];

  // Count low-stock items for the banner
  const lowStockCount = getLowStockProducts(products).length;
  const duplicateSkuCount = products.length - new Set(products.map((p) => (p.sku || "").trim().toUpperCase()).filter(Boolean)).size;

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

      {/* ── Low-stock banner when filter is active ── */}
      {statusFilter === "Low Stock" && lowStockCount > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          background: "#fffbeb", border: "1px solid #fde68a",
          borderRadius: 10, padding: "12px 18px",
        }}>
          <span style={{ color: "#d97706", display: "flex" }}><IconWarning size={18} /></span>
          <p style={{ fontSize: 13, color: "#92400e", fontWeight: 600 }}>
            {lowStockCount} item{lowStockCount > 1 ? "s" : ""} with low stock — review and reorder as needed.
            {duplicateSkuCount > 0 && (
              <span style={{ display: "block", fontWeight: 500, marginTop: 4, fontSize: 12 }}>
                Note: {duplicateSkuCount} duplicate SKU{duplicateSkuCount > 1 ? "s" : ""} in the list — import merges rows with the same SKU.
              </span>
            )}
          </p>
          <button
            onClick={() => { setStatusFilter("All Status"); setCurrentPage(1); }}
            style={{
              marginLeft: "auto", fontSize: 12, color: "#92400e",
              background: "none", border: "1px solid #fcd34d",
              borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontWeight: 600,
            }}
          >
            Show all items
          </button>
        </div>
      )}

      <PageToolbar
        searchValue={searchQuery}
        onSearchChange={(v) => { setSearchQuery(v); setCurrentPage(1); }}
        filters={[
          { key: "category", value: categoryFilter, onChange: (v) => { setCategoryFilter(v); setCurrentPage(1); }, options: categories, minWidth: 160 },
          { key: "status",   value: statusFilter,   onChange: (v) => { setStatusFilter(v);   setCurrentPage(1); }, options: ["All Status", "Active", "Low Stock"], minWidth: 140 },
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
                  <th key={h} style={{
                    padding: "16px 20px",
                    textAlign: h === "PRODUCT DESCRIPTION" ? "left" : "center",
                    color: "#fff", fontWeight: 700, fontSize: 12,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "60px 20px", textAlign: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                      <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                      </svg>
                      <p style={{ fontSize: 15, fontWeight: 700, color: "#374151", margin: 0 }}>
                        {searchQuery
                          ? `No products matching "${searchQuery}"`
                          : statusFilter !== "All Status"
                            ? `No ${statusFilter.toLowerCase()} items found`
                            : "No items found"}
                      </p>
                      <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                        {searchQuery
                          ? "Try a different search term or clear the filters"
                          : "Adjust your filters or import a product list"}
                      </p>
                      {searchQuery && (
                        <button
                          onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
                          style={{
                            marginTop: 4, fontSize: 12, color: "#e87c27",
                            background: "none", border: "1px solid #e87c27",
                            borderRadius: 6, padding: "5px 14px", cursor: "pointer", fontWeight: 600,
                          }}
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : paginatedItems.map((product, idx) => {
                const low = isLowStock(product);
                const displayStatus = deriveProductStatus(product.stock);
                return (
                <tr
                  key={product.id}
                  style={{
                    borderBottom: "1px solid #f3f4f6",
                    background: low
                      ? (idx % 2 === 0 ? "#fffdf5" : "#fffbeb")
                      : (idx % 2 === 0 ? "#fff" : "#fafafa"),
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f5f9ff"}
                  onMouseLeave={(e) => e.currentTarget.style.background =
                    low
                      ? (idx % 2 === 0 ? "#fffdf5" : "#fffbeb")
                      : (idx % 2 === 0 ? "#fff" : "#fafafa")
                  }
                >
                  <td style={{ padding: "14px 20px", color: "#374151", fontWeight: 600, textAlign: "center" }}>
                    <HighlightText text={product.sku} query={searchQuery} />
                  </td>
                  <td style={{ padding: "14px 20px", color: "#374151", fontSize: 12, textAlign: "left" }}>
                    <HighlightText text={product.description} query={searchQuery} />
                  </td>
                  <td style={{ padding: "14px 20px", color: "#6b7280", fontSize: 12, textAlign: "center" }}>
                    <HighlightText text={product.category} query={searchQuery} />
                  </td>
                  <td style={{ padding: "14px 20px", color: "#374151", textAlign: "center" }}>{product.unit}</td>
                  <td style={{
                    padding: "14px 20px", textAlign: "right",
                    color: low ? "#d97706" : "#374151",
                    fontWeight: low ? 700 : 400,
                  }}>
                    {product.stock.toLocaleString()}
                    {low && (
                      <span style={{ marginLeft: 6, color: "#d97706" }}><IconWarning size={12} /></span>
                    )}
                  </td>
                  <td style={{ padding: "14px 20px", textAlign: "right", color: "#374151" }}>₱{product.avgCost.toFixed(2)}</td>
                  <td style={{ padding: "14px 20px", textAlign: "right", color: "#374151" }}>₱{product.totalValue.toFixed(2)}</td>
                  <td style={{ padding: "14px 20px", textAlign: "center" }}>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      whiteSpace: "nowrap",
                      padding: "4px 12px",
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 700,
                      lineHeight: 1.2,
                      background: displayStatus === "Active" ? "#dcfce7" : "#fef3c7",
                      color: displayStatus === "Active" ? "#16a34a" : "#d97706",
                    }}>
                      {displayStatus}
                    </span>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 24px", borderTop: "1px solid #f3f4f6",
          background: "#fafafa", flexWrap: "wrap", gap: 10,
        }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            Showing {filtered.length === 0 ? 0 : startIdx + 1} to {Math.min(startIdx + itemsPerPage, filtered.length)} of {filtered.length} SKUs
            {statusFilter === "Low Stock" && (
              <span style={{ marginLeft: 8, color: "#d97706", fontWeight: 600 }}>· {lowStockCount} Low Stock</span>
            )}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{ padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: currentPage===1?"not-allowed":"pointer", opacity: currentPage===1?0.5:1 }}
            >
              <IconChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => setCurrentPage(page)}
                style={{
                  width: 32, height: 32,
                  border: page===currentPage ? "1px solid #e87c27" : "1px solid #e5e7eb",
                  borderRadius: 6,
                  background: page===currentPage ? "#e87c27" : "#fff",
                  color: page===currentPage ? "#fff" : "#374151",
                  cursor: "pointer", fontSize: 12, fontWeight: 600,
                }}>
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{ padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: currentPage===totalPages?"not-allowed":"pointer", opacity: currentPage===totalPages?0.5:1 }}
            >
              <IconChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9999,
          background: toast.type==="error" ? "#dc2626" : "#16a34a",
          color: "#fff", borderRadius: 10, padding: "12px 20px",
          fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}