import { useState, useRef, useEffect, useMemo } from "react";
import XLSX from "xlsx-js-style";
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
import useSort from "./useSort";
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

function IconEdit({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function IconSave({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
}
function IconX({ size = 14 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }

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
  return true; // XLSX is imported as a module, always available
}

/* ─── EXPORT ─────────────────────────────────────────────── */
function exportProducts(rows) {
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
async function importProducts(file, onDone, onError, existingProducts = []) {
  try {
    const { raw } = await readWorkbookSheet(file, ["LIST OF SKU", "SKU"]);
    const headerIdx = findHeaderRowIndex(raw, ["SKU", "ITEM"], 20);
    const dataStart = headerIdx >= 0 ? headerIdx + 1 : 6;
    const headers = headerIdx >= 0 ? raw[headerIdx] : null;
    const parsed = [];

    for (let i = dataStart; i < raw.length; i++) {
      const r = raw[i];
      if (!rowHasData(r)) continue;

      const sku = cellStr(pickCol(r, headers, ["SKU"], 0));
      const description = cellStr(pickCol(r, headers, ["ITEM"], 1));
      if (isInvalidProductRow(sku, description)) continue;

      // Only import if both SKU and description exist
      if (!sku || !description) continue;

      const category = cellStr(pickCol(r, headers, ["CATEGORY"], 2));
      const stock = cellNum(pickCol(r, headers, ["CURRENT STOCK", "STOCK"], 5));
      const avgCost = cellNum(pickCol(r, headers, ["AVG COST", "AVERAGE"], 6));
      const totalValue = cellNum(pickCol(r, headers, ["TOTAL VALUE", "TOTAL"], 7)) || (stock * avgCost);

      parsed.push({
        id: parsed.length + 1,
        sku: sku.toUpperCase(),
        description,
        category: category || "",
        unit: "pcs",
        stock: normalizeStock(stock),
        avgCost,
        totalValue,
        status: deriveProductStatus(normalizeStock(stock)),
      });
    }

    if (!parsed.length) throw new Error("No product rows found. Make sure Excel has SKU and ITEM columns with data.");

    // Check for duplicate SKUs with existing products
    const existingSkus = new Set(existingProducts.map(p => (p.sku || "").toUpperCase()));
    const duplicateSkus = parsed.filter(p => existingSkus.has(p.sku.toUpperCase()));
    
    if (duplicateSkus.length > 0) {
      return { duplicates: duplicateSkus, newProducts: parsed };
    }

    onDone(dedupeProductsBySku(parsed));
  } catch (err) {
    onError(err.message || "Import failed.");
  }
}

/* ─── DUPLICATE CONFIRMATION MODAL ─────────────────────────── */
function DuplicateConfirmModal({ duplicates, onConfirm, onCancel }) {
  return (
    <div style={modalOverlayStyle} onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div style={{ ...modalPanelStyle, width: "min(96vw, 640px)" }}>
        <div style={modalHeaderStyle}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={modalTitleStyle}>Duplicate SKU Codes Found</h2>
            <p style={{ ...modalSubtitleStyle, margin: "4px 0 0" }}>
              {duplicates.length} SKU{duplicates.length > 1 ? "s" : ""} already exist in the system. 
              Proceeding will overwrite the existing products.
            </p>
          </div>
          <button type="button" onClick={onCancel} style={modalCloseBtnStyle} aria-label="Close"
            onMouseEnter={e => e.currentTarget.style.background = "#e5e7eb"}
            onMouseLeave={e => e.currentTarget.style.background = "#f3f4f6"}>
            <IconX size={18} />
          </button>
        </div>
        
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, maxHeight: "400px" }}>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: "#374151", fontWeight: 600, margin: "0 0 8px" }}>
              Duplicate SKUs to be overwritten:
            </p>
          </div>
          
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ background: "#f8fafc", padding: "8px 12px", borderBottom: "1px solid #e5e7eb" }}>
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12, fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>
                <span>SKU Code</span>
                <span>Product Description</span>
              </div>
            </div>
            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
              {duplicates.map((product, idx) => (
                <div key={idx} style={{ 
                  display: "grid", 
                  gridTemplateColumns: "120px 1fr", 
                  gap: 12, 
                  padding: "10px 12px", 
                  borderBottom: idx < duplicates.length - 1 ? "1px solid #f3f4f6" : "none",
                  background: idx % 2 === 0 ? "#fff" : "#fafafa"
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#e87c27" }}>{product.sku}</span>
                  <span style={{ fontSize: 12, color: "#374151" }}>{product.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div style={modalFooterStyle}>
          <button type="button" onClick={onCancel} style={modalBtnSecondary}>
            Cancel Import
          </button>
          <button type="button" onClick={onConfirm} style={{
            ...modalBtnPrimary,
            background: "#dc2626",
          }}>
            <IconWarning size={15} /> 
            Overwrite {duplicates.length} Product{duplicates.length > 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── SUCCESS MODAL ─────────────────────────────────────── */
function ImportSuccessModal({ overwrittenProducts, newProductsCount, onClose }) {
  const hasOverwrites = overwrittenProducts && overwrittenProducts.length > 0;
  
  return (
    <div style={modalOverlayStyle} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ ...modalPanelStyle, width: "min(96vw, 540px)" }}>
        <div style={modalHeaderStyle}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={modalTitleStyle}>Import Complete</h2>
            <p style={{ ...modalSubtitleStyle, margin: "4px 0 0" }}>
              Successfully imported {newProductsCount} product{newProductsCount > 1 ? "s" : ""}.
              {hasOverwrites && ` ${overwrittenProducts.length} existing product${overwrittenProducts.length > 1 ? "s were" : " was"} overwritten.`}
            </p>
          </div>
          <button type="button" onClick={onClose} style={modalCloseBtnStyle} aria-label="Close"
            onMouseEnter={e => e.currentTarget.style.background = "#e5e7eb"}
            onMouseLeave={e => e.currentTarget.style.background = "#f3f4f6"}>
            <IconX size={18} />
          </button>
        </div>
        
        {hasOverwrites && (
          <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, maxHeight: "400px" }}>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: "#374151", fontWeight: 600, margin: "0 0 8px" }}>
                Overwritten products:
              </p>
            </div>
            
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ background: "#f8fafc", padding: "8px 12px", borderBottom: "1px solid #e5e7eb" }}>
                <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12, fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>
                  <span>SKU Code</span>
                  <span>Product Description</span>
                </div>
              </div>
              <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                {overwrittenProducts.map((product, idx) => (
                  <div key={idx} style={{ 
                    display: "grid", 
                    gridTemplateColumns: "120px 1fr", 
                    gap: 12, 
                    padding: "10px 12px", 
                    borderBottom: idx < overwrittenProducts.length - 1 ? "1px solid #f3f4f6" : "none",
                    background: idx % 2 === 0 ? "#fff" : "#fafafa"
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#e87c27" }}>{product.sku}</span>
                    <span style={{ fontSize: 12, color: "#374151" }}>{product.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <div style={modalFooterStyle}>
          <button type="button" onClick={onClose} style={modalBtnPrimary}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const EMPTY_ITEM = { sku: "", description: "", category: "", unit: "pcs", stock: "", avgCost: "" };

function AddItemModal({ categories, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_ITEM);
  const [error, setError] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.sku.trim()) { setError("SKU Code is required."); return; }
    if (!form.description.trim()) { setError("Product Description is required."); return; }
    const stock = parseFloat(form.stock) || 0;
    const avgCost = parseFloat(form.avgCost) || 0;
    onSave({
      sku: form.sku.trim().toUpperCase(),
      description: form.description.trim(),
      category: form.category.trim() || "Uncategorized",
      unit: form.unit.trim() || "pcs",
      stock,
      avgCost,
      totalValue: stock * avgCost,
      status: deriveProductStatus(stock),
    });
  };

  return (
    <div style={modalOverlayStyle} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ ...modalPanelStyle, width: "min(96vw, 540px)" }}>
        <div style={modalHeaderStyle}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={modalTitleStyle}>Add New Item</h2>
            <p style={{ ...modalSubtitleStyle, margin: "4px 0 0" }}>Add a new product to the inventory. Fields marked with * are required.</p>
          </div>
          <button type="button" onClick={onClose} style={modalCloseBtnStyle} aria-label="Close"
            onMouseEnter={e => e.currentTarget.style.background = "#e5e7eb"}
            onMouseLeave={e => e.currentTarget.style.background = "#f3f4f6"}>
            <IconX size={18} />
          </button>
        </div>
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: "10px 14px", borderRadius: 8, fontSize: 12, marginBottom: 16, fontWeight: 600 }}>{error}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div><label style={modalLabelStyle}>SKU Code *</label><input value={form.sku} onChange={e => set("sku", e.target.value)} placeholder="e.g. DRB007" {...modalInput()} /></div>
            <div><label style={modalLabelStyle}>Unit</label><input value={form.unit} onChange={e => set("unit", e.target.value)} placeholder="pcs / kgs / m" {...modalInput()} /></div>
            <div style={{ gridColumn: "1/-1" }}><label style={modalLabelStyle}>Product Description *</label><input value={form.description} onChange={e => set("description", e.target.value)} placeholder="e.g. Deformed Round Bar, 10mm x 6M" {...modalInput()} /></div>
            <div>
              <label style={modalLabelStyle}>Category</label>
              <input value={form.category} onChange={e => set("category", e.target.value)} list="cat-list" placeholder="e.g. Steel Bars" {...modalInput()} />
              <datalist id="cat-list">{categories.filter(c => c !== "All Categories").map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div><label style={modalLabelStyle}>Warning Level (stock)</label><input type="number" min={1} value={form.warningLevel || 50} onChange={e => set("warningLevel", e.target.value)} {...modalInput()} /></div>
            <div><label style={modalLabelStyle}>Current Stock</label><input type="number" min={0} value={form.stock} onChange={e => set("stock", e.target.value)} placeholder="0" {...modalInput()} /></div>
            <div><label style={modalLabelStyle}>Avg Cost (₱)</label><input type="number" min={0} step="0.01" value={form.avgCost} onChange={e => set("avgCost", e.target.value)} placeholder="0.00" {...modalInput()} /></div>
          </div>
        </div>
        <div style={modalFooterStyle}>
          <button type="button" onClick={onClose} style={modalBtnSecondary}>Cancel</button>
          <button type="button" onClick={handleSave} style={modalBtnPrimary}>
            <IconPlus size={15} /> Add Item
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── INLINE EDIT ROW ─────────────────────────────────────── */
const selectSt = {
  padding: "11px 32px 11px 14px",
  fontSize: 14,
  border: "1px solid #b8bec9",
  borderRadius: 8,
  background: "#ffffff",
  color: "#111827",
  cursor: "pointer",
};

function ProductInlineEditRow({ product, onSave, onCancel }) {
  const [draft, setDraft] = useState({ ...product });
  const set = (k, v) => setDraft(d => {
    const next = { ...d, [k]: v };
    next.totalValue = (parseFloat(next.stock)||0) * (parseFloat(next.avgCost)||0);
    return next;
  });
  return (
    <tr style={{ background: "#fffbf7", borderBottom: "1px solid #fed7aa" }}>
      <td style={{ padding: "6px 20px" }}>
        <input value={draft.sku || ""} onChange={e => set("sku", e.target.value)} {...modalCellInput({ width: 110 })} />
      </td>
      <td style={{ padding: "6px 16px" }}>
        <input value={draft.description || ""} onChange={e => set("description", e.target.value)} {...modalCellInput({ width: 200 })} />
      </td>
      <td style={{ padding: "4px 16px" }}>
        <input value={draft.category || ""} onChange={e => set("category", e.target.value)} {...modalCellInput({ width: 110 })} />
      </td>
      <td style={{ padding: "4px 16px" }}>
        <select value={draft.unit} onChange={e => set("unit", e.target.value)} style={{ ...selectSt, padding: "5px 22px 5px 8px", fontSize: 11, width: 80 }}>
          <option value="pcs">pcs</option>
          <option value="kg">kg</option>
          <option value="m">m</option>
          <option value="L">L</option>
        </select>
      </td>
      <td style={{ padding: "6px 16px", textAlign: "right" }}>
        <input type="number" min={0} value={draft.stock ?? ""} onChange={e => set("stock", parseInt(e.target.value) || 0)} {...modalCellInput({ width: 80, textAlign: "right" })} />
      </td>
      <td style={{ padding: "6px 16px", textAlign: "right" }}>
        <input type="number" min={0} step="0.01" value={draft.avgCost ?? ""} onChange={e => set("avgCost", parseFloat(e.target.value) || 0)} {...modalCellInput({ width: 90, textAlign: "right" })} />
      </td>
      <td style={{ padding: "16px 20px", textAlign: "right", fontWeight: 600, color: "#e87c27" }}>₱{(parseFloat(draft.totalValue) || 0).toFixed(2)}</td>
      <td style={{ padding: "16px 20px", textAlign: "center" }}>
        <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: draft.stock > 10 ? "#d1fae5" : "#fef3c7", color: draft.stock > 10 ? "#065f46" : "#d97706" }}>
          {draft.stock > 10 ? "Active" : "Low Stock"}
        </span>
      </td>
      <td style={{ padding: "6px 8px", textAlign: "center" }}>
        <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
          <button onClick={() => onSave(draft)} title="Save" style={{ padding: "5px 8px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer", display: "flex", alignItems: "center" }}><IconSave size={13} /></button>
          <button onClick={onCancel} title="Cancel" style={{ padding: "5px 8px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 5, cursor: "pointer", display: "flex", alignItems: "center" }}><IconX size={13} /></button>
        </div>
      </td>
    </tr>
  );
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
  const [localProducts, setLocalProducts] = useState([]);
  const products    = propProducts    ?? localProducts;
  const setProducts = propSetProducts ?? setLocalProducts;

  const [searchQuery, setSearchQuery]     = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter]   = useState(initialStatusFilter);
  const [currentPage, setCurrentPage]     = useState(1);
  const [importing, setImporting]         = useState(false);
  const [toast, setToast]                 = useState(null);
  const [showAddModal, setShowAddModal]   = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pendingImport, setPendingImport] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);
  const itemsPerPage = 8;
  const { sortBy, setSortBy, applySort } = useSort("description", "description");
  const [sortOpen, setSortOpen] = useState(false);

  // If navigated here with a pre-set filter, apply it on mount
  useEffect(() => {
    setStatusFilter(initialStatusFilter);
    setCurrentPage(1);
  }, [initialStatusFilter]);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };
  const [editingId, setEditingId] = useState(null);
  const handleSaveEdit = (updated) => {
    setProducts(d => (d || []).map(r => r.id === updated.id ? { ...updated } : r));
    setEditingId(null);
    showToast("Product updated successfully.");
  };

  const filtered = (products || []).filter(p => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || (p.sku || "").toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q);
    const matchCat    = categoryFilter === "All Categories" || p.category === categoryFilter;
    const matchSt     = statusFilter === "All Status"
      || (statusFilter === "Low Stock" ? isLowStock(p) : statusFilter === "Active" ? !isLowStock(p) : p.status === statusFilter);
    return matchSearch && matchCat && matchSt;
  });

  const sorted = useMemo(() => applySort(filtered), [filtered, sortBy]);
  const totalPages    = Math.max(1, Math.ceil(sorted.length / itemsPerPage));
  const startIdx      = (currentPage - 1) * itemsPerPage;
  const paginatedItems = sorted.slice(startIdx, startIdx + itemsPerPage);
  const categories    = ["All Categories", ...new Set((products || []).map(p => p.category || "Uncategorized"))];

  // Count low-stock items for the banner
  const lowStockCount = getLowStockProducts(products || []).length;
  const duplicateSkuCount = (products || []).length - new Set((products || []).map((p) => (p.sku || "").trim().toUpperCase()).filter(Boolean)).size;

  const handleImport = (e) => {
    const file = e.target.files[0]; 
    if (!file) return;
    
    setImporting(true);
    importProducts(file, 
      // Success callback - no duplicates found
      (parsed) => {
        setImporting(false); 
        setProducts(parsed); 
        setCurrentPage(1);
        setImportResult({ overwrittenProducts: [], newProductsCount: parsed.length });
        setShowSuccessModal(true);
        e.target.value = "";
      }, 
      // Error callback
      (err) => {
        setImporting(false);
        showToast(`❌ Import failed: ${err}`, "error");
        e.target.value = "";
      },
      // Pass existing products to check for duplicates
      products || []
    ).then((result) => {
      // Handle duplicate detection
      if (result && result.duplicates) {
        setImporting(false);
        setPendingImport({ file, result });
        setShowDuplicateModal(true);
        e.target.value = "";
      }
    });
  };

  const handleConfirmOverwrite = () => {
    if (!pendingImport) return;
    
    setShowDuplicateModal(false);
    setImporting(true);
    
    const { result } = pendingImport;
    const newProducts = result.newProducts;
    
    // Merge with existing, overwriting duplicates
    const existingSkus = new Set((products || []).map(p => p.sku.toUpperCase()));
    const overwrittenProducts = newProducts.filter(p => existingSkus.has(p.sku.toUpperCase()));
    const mergedProducts = [...(products || [])];
    
    // Remove old versions of duplicates and add new ones
    newProducts.forEach(newProd => {
      const existingIndex = mergedProducts.findIndex(p => p.sku.toUpperCase() === newProd.sku.toUpperCase());
      if (existingIndex >= 0) {
        mergedProducts[existingIndex] = { ...newProd, id: mergedProducts[existingIndex].id };
      } else {
        mergedProducts.push({ ...newProd, id: Math.max(0, ...mergedProducts.map(p => p.id || 0)) + 1 });
      }
    });
    
    setProducts(mergedProducts);
    setCurrentPage(1);
    setImporting(false);
    
    setImportResult({ 
      overwrittenProducts, 
      newProductsCount: newProducts.length 
    });
    setShowSuccessModal(true);
    setPendingImport(null);
  };

  const handleCancelImport = () => {
    setShowDuplicateModal(false);
    setPendingImport(null);
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
        primaryAction={{ label: "Add Item", onClick: () => setShowAddModal(true) }}
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
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#1c2235" }}>
               {["SKU CODE","PRODUCT DESCRIPTION","CATEGORY","UNIT","CURRENT STOCK","AVG COST","TOTAL VALUE","STATUS","ACTION"].map(h => (
  <th key={h} style={{
    padding: "16px 20px",
    textAlign: h === "PRODUCT DESCRIPTION" ? "left" : h === "CURRENT STOCK" || h === "AVG COST" || h === "TOTAL VALUE" ? "right" : "center",
    color: "#fff", fontWeight: 700, fontSize: 12,
    whiteSpace: "nowrap",
  }}>{h}</th>
))}
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "60px 20px", textAlign: "center" }}>
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
                if (editingId === product.id) {
                  return <ProductInlineEditRow key={product.id} product={product} onSave={handleSaveEdit} onCancel={() => setEditingId(null)} />;
                }
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
  {(product.stock || 0).toLocaleString()}
  {low && (
    <span style={{ marginLeft: 6, color: "#d97706" }}><IconWarning size={12} /></span>
  )}
</td>
                  <td style={{ padding: "14px 20px", textAlign: "right", color: "#374151" }}>₱{(parseFloat(product.avgCost) || 0).toFixed(2)}</td>
<td style={{ padding: "14px 20px", textAlign: "right", color: "#374151" }}>₱{(parseFloat(product.totalValue) || 0).toFixed(2)}</td>
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
                    <td style={{ padding: "8px 8px", textAlign: "center" }}>
                      <button onClick={(e) => { e.stopPropagation(); setEditingId(product.id); }} title="Edit row" style={{ padding: "5px 8px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                        <IconEdit size={12} /> Edit
                      </button>
                    </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 24px", borderTop: "1px solid #f3f4f6",
          background: "#fafafa", flexWrap: "wrap", gap: 10,
        }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            Showing {sorted.length === 0 ? 0 : startIdx + 1} to {Math.min(startIdx + itemsPerPage, sorted.length)} of {sorted.length} SKUs
            {statusFilter === "Low Stock" && (
              <span style={{ marginLeft: 8, color: "#d97706", fontWeight: 600 }}>· {lowStockCount} Low Stock</span>
            )}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{ padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", color: "#374151", cursor: currentPage===1?"not-allowed":"pointer", opacity: currentPage===1?0.5:1 }}
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
              style={{ padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", color: "#374151", cursor: currentPage===totalPages?"not-allowed":"pointer", opacity: currentPage===totalPages?0.5:1 }}
            >
              <IconChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {showDuplicateModal && pendingImport && (
        <DuplicateConfirmModal
          duplicates={pendingImport.result.duplicates}
          onConfirm={handleConfirmOverwrite}
          onCancel={handleCancelImport}
        />
      )}

      {showSuccessModal && importResult && (
        <ImportSuccessModal
          overwrittenProducts={importResult.overwrittenProducts}
          newProductsCount={importResult.newProductsCount}
          onClose={() => setShowSuccessModal(false)}
        />
      )}

      {showAddModal && (
        <AddItemModal
          categories={categories}
          onClose={() => setShowAddModal(false)}
          onSave={(newItem) => {
            const newId = Math.max(0, ...(products || []).map(p => p.id || 0)) + 1;
            setProducts(prev => [...(prev || []), { id: newId, ...newItem }]);
            setShowAddModal(false);
            showToast(`✓ "${newItem.sku}" added successfully.`);
          }}
        />
      )}

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