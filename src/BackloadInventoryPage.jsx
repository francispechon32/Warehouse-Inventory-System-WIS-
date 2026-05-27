import { useState, useRef, useMemo, useEffect } from "react";
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
  { id: 1, date: "2025-03-15", drNo: "", sku: "", item: "Sheet Pile Z type 4 meters", qty: 40, unitCost: 0, customerName: "RCM", totalQtyOut: 0, remarks: "TRANSFER FROM POLYLAND WAREHOUSE", status: "Pending" },
  { id: 2, date: "2025-07-26", drNo: "DR23361", sku: "", item: "Deformed Round Bar, 20mm x 10.5M g40 (25.89kgs)", qty: 44, unitCost: 903.15, customerName: "BRENCON DEVELOPERS PHILS. INC", totalQtyOut: 0, remarks: "FOR ADD TO STOCK", status: "Partial" },
  { id: 3, date: "2025-09-16", drNo: "CEBDR4680", sku: "", item: "Deformed Round Bar, 32mm x 6M g60 (37.88kgs)", qty: 50, unitCost: 1479, customerName: "TALDE CONSTRUCTION INC.", totalQtyOut: 0, remarks: "", status: "Pending" },
  { id: 4, date: "2025-09-30", drNo: "DR25026", sku: "", item: "Deformed Round Bar, 20mm x 6M g60 (14.80kgs)", qty: 123, unitCost: 539.31, customerName: "EC STRUCTURAL COMPOSITE INC.", totalQtyOut: 0, remarks: "DELIVERED/may hindi naisama pero sinign as complete yung DR", status: "Delivered" },
  { id: 5, date: "2025-10-11", drNo: "49754", sku: "49754", item: "GI Rectangular Tube, 2 x 4 x 2mm x 6M", qty: 3, unitCost: 1380, customerName: "for marilao WH use", totalQtyOut: 0, remarks: "", status: "Pending" },
  { id: 6, date: "2025-10-11", drNo: "49754", sku: "49754", item: "GI Square Tube, 2 x 2 x 2mm x 6M", qty: 3, unitCost: 880, customerName: "for marilao WH use", totalQtyOut: 0, remarks: "", status: "Pending" },
  { id: 7, date: "2025-11-28", drNo: "DR25225", sku: "51181", item: "Wide Flange, 10 x 8 x 33# x 6M", qty: 4, unitCost: 12300, customerName: "AGUILA SIMBULAN PLUS PARTNERS", totalQtyOut: 0, remarks: "", status: "Partial" },
  { id: 8, date: "2025-12-05", drNo: "DR25310", sku: "", item: "Deformed Round Bar, 25mm x 6M g40", qty: 30, unitCost: 820, customerName: "PRIME BUILDERS CORP.", totalQtyOut: 10, remarks: "", status: "Partial" },
  { id: 9, date: "2026-01-14", drNo: "DR25400", sku: "", item: "Sheet Pile T3, 400mm x 125mm x 13mm x 60kg/m x 12M", qty: 20, unitCost: 28271, customerName: "SUNWAY CONSTRUCTION INC.", totalQtyOut: 0, remarks: "Awaiting pickup", status: "Pending" },
  { id: 10, date: "2026-02-10", drNo: "DR25600", sku: "SHPT2", item: "Sheet Pile T2, 400mm x 100mm x 10.5mm x 12M", qty: 15, unitCost: 22529, customerName: "AREMAR CONSTRUCTION CORP.", totalQtyOut: 5, remarks: "Partial delivery", status: "Partial" },
  { id: 11, date: "2026-03-01", drNo: "DR25800", sku: "DRB052", item: "Deformed Round Bar, 16mm x 6M g40", qty: 200, unitCost: 346.73, customerName: "EGB/SANRAY CONSTRUCTION", totalQtyOut: 200, remarks: "Fully released", status: "Delivered" },
  { id: 12, date: "2026-03-15", drNo: "DR26001", sku: "MSP010", item: "MS Plate, 6mm x 4' x 8'", qty: 50, unitCost: 554.79, customerName: "ADVANCE INNOVATION CONSTRUCTION", totalQtyOut: 0, remarks: "", status: "Pending" },
];

const PAGE_SIZE = 8;

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

const STATUS_CONFIG = {
  "Pending":   { bg: "#fef3c7", color: "#d97706", label: "Pending" },
  "Partial":   { bg: "#dbeafe", color: "#1d4ed8", label: "Partial" },
  "Delivered": { bg: "#dcfce7", color: "#16a34a", label: "Delivered" },
};

/* ─── ADD ENTRY MODAL ── */
function AddEntryModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    drNo: "", sku: "", item: "", qty: "", unitCost: "", customerName: "", remarks: "", status: "Pending",
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
          <div><label style={modalLabelStyle}>Status</label>
            <select value={form.status} onChange={e => set("status", e.target.value)} {...modalInput({ appearance: "none" })}>
              {["Pending", "Partial", "Delivered"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
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
        <select value={draft.status} onChange={e => set("status", e.target.value)} {...modalCellInput({ color: STATUS_CONFIG[draft.status]?.color || "#374151" })}>
          {["Pending","Partial","Delivered"].map(s => <option key={s}>{s}</option>)}
        </select>
      </td>
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

function IconUpload2({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
}

function exportBackload(rows) {
  if (!window.XLSX) { alert("SheetJS not loaded."); return; }
  const XLSX = window.XLSX;
  const wb = XLSX.utils.book_new();
  const headers = [
    ["TDT WAREHOUSE INVENTORY SHEET (TDT WIS)"],
    ["Backload Inventory"],
    ["LOCATION:", "MARILAO WAREHOUSE"],
    ["AS OF:", new Date().toLocaleString()],
    [],
    ["TRANS NO.", "DATE", "DR #", "SKU", "ITEM", "QTY", "UNIT COST", "TOTAL COST", "CUSTOMER NAME", "TOTAL QTY OUT", "QTY BALANCE", "AMOUNT BALANCE", "REMARKS", "STATUS"],
  ];
  const dataRows = rows.map(r => {
    const qtyBal = r.qty - r.totalQtyOut;
    const amtBal = r.unitCost * qtyBal;
    return [r.id, r.date, r.drNo||"—", r.sku||"—", r.item, r.qty, r.unitCost, r.qty*r.unitCost, r.customerName, r.totalQtyOut, qtyBal, amtBal, r.remarks||"—", r.status];
  });
  const ws = XLSX.utils.aoa_to_sheet([...headers, ...dataRows]);
  ws["!cols"] = [{wch:8},{wch:12},{wch:12},{wch:10},{wch:40},{wch:8},{wch:12},{wch:14},{wch:28},{wch:12},{wch:12},{wch:16},{wch:30},{wch:10}];
  XLSX.utils.book_append_sheet(wb, ws, "BACKLOAD INVENTORY");
  XLSX.writeFile(wb, "TDT_WIS_Backload_Inventory.xlsx");
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

      const transOrId = cellStr(pickCol(r, headers, ["TRANS NO", "TRANS", "NO."], 0));
      const item = cellStr(pickCol(r, headers, ["ITEM"], 4));
      const customer = cellStr(pickCol(r, headers, ["CUSTOMER"], 8));
      if (!transOrId && !item && !customer) continue;

      parsed.push({
        id: parseRowId(transOrId, parsed.length + 1),
        date: formatExcelDate(pickCol(r, headers, ["DATE"], 1)),
        drNo: cellStr(pickCol(r, headers, ["DR"], 2)),
        sku: cellStr(pickCol(r, headers, ["SKU"], 3)),
        item,
        qty: cellNum(pickCol(r, headers, ["QTY"], 5)),
        unitCost: cellNum(pickCol(r, headers, ["UNIT COST"], 6)),
        customerName: customer,
        totalQtyOut: cellNum(pickCol(r, headers, ["TOTAL QTY OUT", "QTY OUT"], 9)),
        remarks: cellStr(pickCol(r, headers, ["REMARKS"], 12)),
        status: cellStr(pickCol(r, headers, ["STATUS"], 13)) || "Pending",
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
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(null);
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
    let d = data;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      d = d.filter(r => r.item.toLowerCase().includes(q) || (r.sku||"").toLowerCase().includes(q) || (r.drNo||"").toLowerCase().includes(q) || (r.customerName||"").toLowerCase().includes(q));
    }
    if (statusFilter !== "All Status") d = d.filter(r => r.status === statusFilter);
    return d;
  }, [data, searchQuery, statusFilter]);

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
  const pending = data.filter(r => r.status === "Pending").length;
  const totalValue = data.reduce((s, r) => s + (r.qty * r.unitCost), 0);
  const totalBalance = data.reduce((s, r) => s + ((r.qty - r.totalQtyOut) * r.unitCost), 0);

  const COLS = ["TRANS NO.", "DATE", "DR #", "SKU", "ITEM", "QTY", "UNIT COST", "TOTAL COST", "CUSTOMER NAME", "TOTAL QTY OUT", "QTY BALANCE", "AMOUNT BALANCE", "REMARKS", "STATUS", ""];

  return (
    <div style={{ background: "#f0f2f5", padding: "28px 32px 40px", display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Summary Cards — same style as Home dashboard */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
        <MetricCard
          icon={<IconBox size={34} />}
          label="Total Entries"
          value={String(totalEntries)}
          badge={{ text: "All backload records", color: "#16a34a", bg: "#dcfce7" }}
        />
        <MetricCard
          icon={<IconTruck size={28} />}
          label="Pending Release"
          value={String(pending)}
          badge={{
            text: pending > 0 ? `${pending} awaiting release` : "No pending releases",
            color: "#d97706",
            bg: pending > 0 ? "#fef3c7" : "transparent",
          }}
        />
        <MetricCard
          icon={<IconBarChart size={30} />}
          label="Total Backload Value"
          value={formatCompactPHP(totalValue)}
          badge={{ text: fmtPHP(totalValue), color: "#e87c27", bg: "transparent" }}
        />
        <MetricCard
          icon={<IconBag size={30} />}
          label="Total Balance Amount"
          value={formatCompactPHP(totalBalance)}
          badge={{ text: fmtPHP(totalBalance), color: "#16a34a", bg: "#dcfce7" }}
        />
      </div>

      <PageToolbar
        searchValue={searchQuery}
        onSearchChange={(v) => { setSearchQuery(v); setCurrentPage(1); }}
        filters={[
          { key: "status", value: statusFilter, onChange: (v) => { setStatusFilter(v); setCurrentPage(1); }, options: ["All Status", "Pending", "Partial", "Delivered"], minWidth: 150 },
        ]}
        primaryAction={{ label: "Start Backload Inventory", onClick: () => setShowModal(true) }}
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
                  <th key={h} style={{ padding: "14px 12px", textAlign: ["QTY","UNIT COST","TOTAL COST","TOTAL QTY OUT","QTY BALANCE","AMOUNT BALANCE"].includes(h) ? "right" : "left", color: "#fff", fontWeight: 700, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
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
                const cfg = STATUS_CONFIG[row.status] || STATUS_CONFIG["Pending"];
                const totalCost = row.qty * row.unitCost;
                const qtyBalance = row.qty - row.totalQtyOut;
                const amtBalance = row.unitCost * qtyBalance;
                return (
                  <tr key={row.id}
                    style={{ borderBottom: "1px solid #f3f4f6", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fef6f2"}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#fafafa"}
                  >
                    <td style={{ padding: "12px 12px", color: "#9ca3af", fontSize: 11 }}>{row.id}</td>
                    <td style={{ padding: "12px 12px", color: "#6b7280", whiteSpace: "nowrap" }}>{row.date}</td>
                    <td style={{ padding: "12px 12px", color: "#e87c27", fontWeight: 700 }}>{row.drNo || "—"}</td>
                    <td style={{ padding: "12px 12px", color: "#374151" }}>{row.sku || "—"}</td>
                    <td style={{ padding: "12px 12px", color: "#374151", maxWidth: 220 }}>{row.item}</td>
                    <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 700 }}>{row.qty}</td>
                    <td style={{ padding: "12px 12px", textAlign: "right" }}>{fmtPHP(row.unitCost)}</td>
                    <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 600 }}>{fmtPHP(totalCost)}</td>
                    <td style={{ padding: "12px 12px", color: "#374151", maxWidth: 180 }}>{row.customerName}</td>
                    <td style={{ padding: "12px 12px", textAlign: "right" }}>{row.totalQtyOut}</td>
                    <td style={{ padding: "12px 12px", textAlign: "right" }}>
                      <span style={{ padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: qtyBalance > 0 ? "#fef3c7" : "#d1fae5", color: qtyBalance > 0 ? "#d97706" : "#065f46" }}>{qtyBalance}</span>
                    </td>
                    <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 600 }}>{fmtPHP(amtBalance)}</td>
                    <td style={{ padding: "12px 12px", color: "#6b7280", maxWidth: 180, fontSize: 11 }}>{row.remarks || "—"}</td>
                    <td style={{ padding: "12px 12px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                    </td>
                    <td style={{ padding: "12px 8px" }}>
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