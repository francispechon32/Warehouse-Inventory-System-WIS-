import { useState, useMemo, useRef, useEffect } from "react";
import XLSX from "xlsx-js-style";
import PageToolbar from "./PageToolbar";
import useSort from "./useSort";
import {
  cellStr,
  cellNum,
  formatExcelDate,
  findHeaderRowIndex,
  pickCol,
  rowHasData,
  readWorkbookSheet,
} from "./excelImportUtils";
import { modalCellInput, modalInput } from "./modalFormStyles";

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

const PLACES = ["All locations", "Meycauayan", "Pampanga", "Marilao"];

/** Optional per-row overrides; otherwise SKU/item come from lineItems. */
function getSummaryFields(row) {
  if (!row) return { sku: "—", item: "—", estQtyEnding: "—" };
  const estDefault = row.estEnding !== undefined && row.estEnding !== null && row.estEnding !== ""
    ? String(row.estEnding)
    : "—";
  if (row.summarySku && row.summaryItem) {
    return {
      sku: row.summarySku,
      item: row.summaryItem,
      estQtyEnding: row.summaryEstOverride !== undefined ? row.summaryEstOverride : estDefault,
    };
  }
  const lines = row.lineItems;
  if (!lines?.length) return { sku: "—", item: "—", estQtyEnding: estDefault };
  const codes = [...new Set(lines.map((l) => l.code))];
  if (codes.length === 1) {
    return { sku: codes[0], item: lines[0].desc, estQtyEnding: estDefault };
  }
  const descs = [...new Set(lines.map((l) => l.desc))];
  return {
    sku: `${codes[0]} (+${codes.length - 1})`,
    item: descs.length === 1 ? `${descs[0]} (${lines.length} lines)` : `${descs.slice(0, 2).join(" · ")}…`,
    estQtyEnding: estDefault,
  };
}

function fmtPHP(n) {
  return "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatResDate(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

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
function IconEdit({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function IconSave({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
}
const STATUS_STYLE = {
  Active: { bg: "#dcfce7", color: "#15803d", badgeBg: "#22c55e" },
  Pending: { bg: "#fef3c7", color: "#d97706", badgeBg: "#f59e0b" },
  Closed: { bg: "#e5e7eb", color: "#4b5563", badgeBg: "#6b7280" },
};

function lineTotals(lines) {
  const qty = lines.reduce((s, L) => s + L.qty, 0);
  const value = lines.reduce((s, L) => s + L.qty * L.lineValue, 0);
  return { qty, value };
}


/* ─── SheetJS loader ── */
function useSheetJS() {
  return true; // XLSX is imported as a module, always available
}

function IconUpload({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }

/* ─── EXPORT (flat table matching website columns) ── */
function formatAcpoExportDateTime(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatAcpoExportDate(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function exportToWis(rows) {
  const wb = XLSX.utils.book_new();
  const C = (r, c) => XLSX.utils.encode_cell({ r, c });
  const ws = {};
  const put = (r, c, v, t, style) => {
    ws[C(r, c)] = { v: v ?? "", t: t || (typeof v === "number" ? "n" : "s"), s: style };
  };

  const peachFill = { patternType: "solid", fgColor: { rgb: "FFF9E6" } };
  const hdrFill = { patternType: "solid", fgColor: { rgb: "1C2235" } };
  const dataFill = { patternType: "solid", fgColor: { rgb: "FCE4D6" } };
  const altFill = { patternType: "solid", fgColor: { rgb: "FFF9F0" } };
  const hdrBorder = {
    top: { style: "thin", color: { rgb: "FFFFFF" } },
    bottom: { style: "thin", color: { rgb: "FFFFFF" } },
    left: { style: "thin", color: { rgb: "FFFFFF" } },
    right: { style: "thin", color: { rgb: "FFFFFF" } },
  };
  const dataBorder = {
    top: { style: "thin", color: { rgb: "E5E7EB" } },
    bottom: { style: "thin", color: { rgb: "E5E7EB" } },
    left: { style: "thin", color: { rgb: "E5E7EB" } },
    right: { style: "thin", color: { rgb: "E5E7EB" } },
  };
  const f = {
    title: () => ({ name: "Arial", sz: 13, bold: true, color: { rgb: "1C2235" } }),
    sub: () => ({ name: "Arial", sz: 10, color: { rgb: "6B7280" } }),
    hdr: () => ({ name: "Arial", sz: 9, bold: true, color: { rgb: "FFFFFF" } }),
    body: (bold = false) => ({ name: "Arial", sz: 9, bold, color: { rgb: "374151" } }),
    orange: () => ({ name: "Arial", sz: 9, bold: true, color: { rgb: "E87C27" } }),
  };
  const a = {
    ctr: () => ({ horizontal: "center", vertical: "center" }),
    left: () => ({ horizontal: "left", vertical: "center" }),
    right: () => ({ horizontal: "right", vertical: "center" }),
  };
  const qtyFmt = "#,##0";
  const now = formatAcpoExportDateTime();

  put(0, 0, "TDT ADVANCE CUSTOMER PURCHASE ORDER", "s", { font: f.title(), alignment: a.left(), fill: peachFill });
  put(1, 0, `Exported: ${now}`, "s", { font: f.sub(), alignment: a.left(), fill: peachFill });

  const hdrs = [
    "TRANS NO.", "RESERVATION DATE", "SO#/WO#", "TDT DR#",
    "CUSTOMER'S NAME", "PLACE OF DELIVERY", "RESERVED QTY",
    "CURRENT STOCK", "EST ENDING BALANCE", "APPROVED BY", "STATUS",
  ];
  hdrs.forEach((h, ci) => {
    put(3, ci, h, "s", { font: f.hdr(), fill: hdrFill, alignment: a.ctr(), border: hdrBorder });
  });

  rows.forEach((row, i) => {
    const ri = 4 + i;
    const fill = i % 2 === 0 ? dataFill : altFill;
    const cells = [
      { v: row.transNo, bold: true },
      { v: formatAcpoExportDate(row.resDate) },
      { v: row.soWo || "—" },
      { v: row.tdtDr || "—", orange: true },
      { v: row.customer || "", left: true },
      { v: row.place || "" },
      { v: row.reservedQty ?? 0, num: true, fmt: qtyFmt, bold: true },
      { v: row.currentStock ?? 0, num: true, fmt: qtyFmt },
      { v: row.estEnding ?? "", num: typeof row.estEnding === "number", fmt: qtyFmt, bold: true },
      { v: row.approvedBy || "" },
      { v: row.status || "" },
    ];
    cells.forEach(({ v, bold, orange, left, num, fmt }, ci) => {
      const font = orange ? f.orange() : f.body(bold);
      put(ri, ci, v, num ? "n" : "s", {
        font,
        fill,
        alignment: left ? a.left() : a.ctr(),
        border: dataBorder,
        ...(fmt && num ? { numFmt: fmt } : {}),
      });
    });
  });

  const lastRow = Math.max(4 + rows.length - 1, 3);
  ws["!ref"] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: lastRow, c: hdrs.length - 1 });
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: hdrs.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: hdrs.length - 1 } },
  ];
  ws["!cols"] = [
    { wch: 10 }, { wch: 16 }, { wch: 12 }, { wch: 14 },
    { wch: 28 }, { wch: 16 }, { wch: 13 },
    { wch: 13 }, { wch: 16 }, { wch: 14 }, { wch: 10 },
  ];
  ws["!rows"] = [
    { hpt: 22 }, { hpt: 16 }, { hpt: 6 }, { hpt: 36 },
    ...rows.map(() => ({ hpt: 20 })),
  ];

  XLSX.utils.book_append_sheet(wb, ws, "ADVANCE CUSTOMER PO");
  XLSX.writeFile(wb, "TDT_Advance_Customer_PO_Summary.xlsx");
}

/* ─── IMPORT parser ── */
async function importReservations(file, onDone, onError) {
  try {
    const { raw } = await readWorkbookSheet(file, ["ADVANCE"]);
    
    // Find cards in the Excel sheet - look for SKU headers which indicate card starts
    const cards = [];
    let currentCard = null;
    let cardRow = 0;
    
    for (let i = 0; i < raw.length; i++) {
      const row = raw[i];
      if (!row) continue;
      
      // Look for card headers - check for "SKU" in any column to identify card starts
      let cardFound = false;
      for (let j = 0; j < row.length; j++) {
        const cellValue = cellStr(row[j]).toUpperCase();
        if (cellValue === "SKU") {
          // Found a new card header
          const skuValue = cellStr(row[j + 1]); // SKU value is usually next to "SKU" label
          const itemCell = cellStr(row[j + 2]); // Item description
          const estQtyEndingCell = cellStr(row[j + 3]); // Est Qty Ending
          
          if (skuValue) {
            currentCard = {
              id: cards.length + 1,
              sku: skuValue,
              item: itemCell || "",
              estQtyEnding: estQtyEndingCell || "",
              cardColumn: j, // Track which column this card starts in
              cardStartRow: i,
              lineItems: []
            };
            cards.push(currentCard);
            cardFound = true;
          }
        }
      }
      
      // If we found a card header, look for the line items table below it
      if (cardFound && currentCard) {
        // Look for "TRANS" header to find the start of line items table
        for (let k = i + 1; k < Math.min(i + 20, raw.length); k++) {
          const tableRow = raw[k];
          if (!tableRow) continue;
          
          const startCol = currentCard.cardColumn;
          const transCell = cellStr(tableRow[startCol]).toUpperCase();
          
          if (transCell === "TRANS") {
            // Found line items table header, now read the data rows
            for (let m = k + 1; m < Math.min(k + 20, raw.length); m++) {
              const dataRow = raw[m];
              if (!dataRow) break;
              
              const trans = cellStr(dataRow[startCol]);
              const insertDate = formatExcelDate(dataRow[startCol + 1]);
              const insertLot = cellStr(dataRow[startCol + 2]);
              const insert = cellStr(dataRow[startCol + 3]);
              const insertPlace = cellStr(dataRow[startCol + 4]);
              const estEnding = cellStr(dataRow[startCol + 5]);
              const insertCustomer = cellStr(dataRow[startCol + 6]);
              const insertBalance = cellStr(dataRow[startCol + 7]);
              
              // Skip empty rows or header-like rows
              if (!trans || trans.toUpperCase().includes("ACTUAL") || !insertDate) continue;
              
              // Create reservation record from this line item
              const reservation = {
                id: cards.length * 100 + currentCard.lineItems.length + 1,
                transNo: trans || `T${cards.length}-${currentCard.lineItems.length + 1}`,
                resDate: insertDate,
                soWo: insertLot || "—",
                tdtDr: insert || "",
                customer: insertCustomer || "",
                place: insertPlace || "Manila",
                reservedQty: cellNum(insert) || 0,
                currentStock: cellNum(insertBalance) || 0,
                estEnding: cellNum(estEnding) || null,
                approvedBy: "",
                status: "Pending",
                drNo: insert || "",
                remarks: "",
                lineItems: [],
                summarySku: currentCard.sku,
                summaryItem: currentCard.item,
              };
              
              currentCard.lineItems.push(reservation);
            }
            break;
          }
        }
      }
    }
    
    // Flatten all line items from all cards into a single array
    const parsed = [];
    cards.forEach(card => {
      card.lineItems.forEach((lineItem, index) => {
        parsed.push({
          ...lineItem,
          id: parsed.length + 1,
          // If this is the first line item for this card, use the card's SKU/item info
          summarySku: card.sku,
          summaryItem: card.item,
          summaryEstOverride: index === 0 ? card.estQtyEnding : null
        });
      });
    });

    if (!parsed.length) throw new Error("No reservation data found. Make sure Excel has properly formatted cards with SKU and line item tables.");
    onDone(parsed);
  } catch (err) {
    onError(err.message || "Import failed.");
  }
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
  appearance: "none",
  WebkitAppearance: "none",
  backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 8px center",
  backgroundSize: 14,
};
function AcpoInlineEditRow({ row, onSave, onCancel }) {
  const [draft, setDraft] = useState({ ...row });
  const set = (k, v) => setDraft(d => {
    const next = { ...d, [k]: v };
    const rqty = parseFloat(next.reservedQty) || 0;
    const cstock = parseFloat(next.currentStock) || 0;
    next.estEnding = cstock - rqty;
    return next;
  });
  const st = STATUS_STYLE[draft.status] || STATUS_STYLE.Pending;
  return (
    <tr style={{ background: "#fffbf7", borderBottom: "1px solid #fed7aa" }}>
      <td style={{ padding: "12px 10px", color: "#6b7280", fontWeight: 600 }}>{draft.transNo}</td>
      <td style={{ padding: "6px 10px" }}>
        <input type="date" value={draft.resDate || ""} onChange={e => set("resDate", e.target.value)} {...modalCellInput({ width: 130 })} />
      </td>
      <td style={{ padding: "4px 10px" }}>
        <input value={draft.soWo || ""} onChange={e => set("soWo", e.target.value)} {...modalCellInput({ width: 110 })} />
      </td>
      <td style={{ padding: "4px 10px" }}>
        <input value={draft.tdtDr || ""} onChange={e => set("tdtDr", e.target.value)} {...modalCellInput({ width: 110 })} />
      </td>
      <td style={{ padding: "4px 10px" }}>
        <input value={draft.customer || ""} onChange={e => set("customer", e.target.value)} {...modalCellInput({ width: 140 })} />
      </td>
      <td style={{ padding: "4px 10px" }}>
        <input value={draft.place || ""} onChange={e => set("place", e.target.value)} {...modalCellInput({ width: 120 })} />
      </td>
      <td style={{ padding: "4px 10px" }}>
        <input type="number" min={0} value={draft.reservedQty ?? ""} onChange={e => set("reservedQty", parseFloat(e.target.value) || 0)} {...modalCellInput({ width: 80, textAlign: "right" })} />
      </td>
      <td style={{ padding: "4px 10px" }}>
        <input type="number" min={0} value={draft.currentStock ?? ""} onChange={e => set("currentStock", parseInt(e.target.value) || 0)} {...modalCellInput({ width: 80, textAlign: "right" })} />
      </td>
      <td style={{ padding: "12px 10px", textAlign: "center", fontWeight: 600, color: draft.estEnding < 0 ? "#dc2626" : "#065f46" }}>{draft.estEnding}</td>
      <td style={{ padding: "4px 10px" }}>
        <input value={draft.approvedBy || ""} onChange={e => set("approvedBy", e.target.value)} {...modalCellInput({ width: 100 })} />
      </td>
      <td style={{ padding: "6px 10px", textAlign: "center" }}>
        <select value={draft.status} onChange={e => set("status", e.target.value)} style={{ ...selectSt, padding: "5px 22px 5px 8px", fontSize: 11, width: 100, fontWeight: 700, color: st.color, background: st.bg }}>
          {["Active","Pending","Completed","Cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
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
export default function AdvanceCustomerPOPage({ currentUser }) {
  const [searchSku, setSearchSku] = useState("");
  const [reservations, setReservations] = useState([]);

  const normalizeApiReservation = (item) => ({
    id: item.id,
    transNo: item.customer_po || `T${item.id}`,
    resDate: item.po_date,
    soWo: item.customer_po || "—",
    tdtDr: (item.remarks && item.remarks.includes('TDT DR:'))
      ? item.remarks.split('TDT DR:')[1]?.split('|')[0]?.trim() || "—"
      : "—",
    customer: item.customer_name,
    place: (item.remarks && item.remarks.includes('Place:'))
      ? item.remarks.split('Place:')[1]?.trim() || "Manila"
      : "Manila",
    reservedQty: (item.remarks && item.remarks.includes('Qty:'))
      ? parseInt(item.remarks.split('Qty:')[1]?.split('|')[0]?.trim()) || 0
      : 0,
    currentStock: 0, // Not stored in new schema, default to 0
    estEnding: 0, // Calculated field, default to 0
    approvedBy: item.approved_by_name || "",
    status: item.status === 'Pending Approval' ? 'Pending' : item.status,
    drNo: item.customer_po || "—",
    remarks: item.remarks || "",
    lineItems: [] // Not implemented yet in new schema
  });

  useEffect(() => {
    // Load reservations from API on component mount
    const loadReservations = async () => {
      try {
        const response = await fetch('/api/advance-customer-po');
        if (response.ok) {
          const data = await response.json();
          // Transform API data to match the expected format
          setReservations(data.map(normalizeApiReservation));
        }
      } catch (error) {
        console.error('Error loading reservations:', error);
      }
    };

    loadReservations();
  }, []);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const xlsxReady = useSheetJS();
  const importRef = useRef(null);
  const [place, setPlace] = useState("All locations");
  const [currentPage, setCurrentPage] = useState(1);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ resDate: "", soWo: "", tdtDr: "", customer: "", place: "", sku: "", reservedQty: "", currentStock: "", approvedBy: "" });
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const { sortBy, setSortBy, applySort } = useSort("resDate", "customer");
  const [sortOpen, setSortOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const isEmployee = currentUser?.role === 'Employee';
  useEffect(() => {
    if (isEmployee) {
      setShowCreate(false);
      setEditingId(null);
    }
  }, [isEmployee]);

  const handleSaveEdit = (updated) => {
    setReservations(d => d.map(r => r.id === updated.id ? { ...updated } : r));
    setEditingId(null);
    showToast("Reservation updated successfully.");
  };

  const filtered = useMemo(() => {
    let rows = reservations;
    if (searchSku.trim()) {
      const q = searchSku.toLowerCase();
      rows = rows.filter(
        (r) =>
          (r.customer || "").toLowerCase().includes(q) ||
          (r.tdtDr || "").toLowerCase().includes(q) ||
          (r.soWo || "").toLowerCase().includes(q) ||
          String(r.transNo || "").toLowerCase().includes(q) ||
          (r.drNo || "").toLowerCase().includes(q) ||
          (r.resDate || "").toLowerCase().includes(q) ||
          (r.place || "").toLowerCase().includes(q) ||
          String(r.reservedQty || "").toLowerCase().includes(q) ||
          String(r.currentStock || "").toLowerCase().includes(q) ||
          String(r.estEnding || "").toLowerCase().includes(q) ||
          (r.approvedBy || "").toLowerCase().includes(q) ||
          (r.lineItems || []).some(
            (L) => (L.code || "").toLowerCase().includes(q) || (L.desc || "").toLowerCase().includes(q)
          )
      );
    }
    if (place !== "All locations") rows = rows.filter((r) => r.place === place);
    if (dateRange.start) rows = rows.filter((r) => (r.resDate || "") >= dateRange.start);
    if (dateRange.end)   rows = rows.filter((r) => (r.resDate || "") <= dateRange.end);
    return rows;
  }, [reservations, searchSku, place, dateRange]);

  useEffect(() => {
    if (selectedId != null && !filtered.some((r) => r.id === selectedId)) {
      setSelectedId(null);
      setPanelOpen(false);
    }
  }, [filtered, selectedId]);

  const sorted = useMemo(() => applySort(filtered), [filtered, sortBy]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const selected = selectedId != null ? reservations.find((r) => r.id === selectedId) : null;
  const panelLines = selected
    ? [
        { label: "Trans #", value: selected.transNo },
        { label: "Reservation Date", value: formatResDate(selected.resDate) },
        { label: "TDT DR #", value: selected.tdtDr },
        { label: "Customer Name", value: selected.customer },
        { label: "Total Reserved Qty", value: String(selected.reservedQty) },
        { label: "Remarks", value: selected.remarks.trim() ? selected.remarks : "—" },
      ]
    : [];

  const panelBadge = selected ? (STATUS_STYLE[selected.status] || STATUS_STYLE.Pending) : STATUS_STYLE.Pending;
  const { qty: sumLineQty, value: sumLineValue } = selected ? lineTotals(selected.lineItems) : { qty: 0, value: 0 };

  const summarySource = selectedId != null ? reservations.find((r) => r.id === selectedId) : null;
  const { sku: sumSku, item: sumItem, estQtyEnding: sumEst } = getSummaryFields(summarySource);

  return (
    <div style={{ background: "#f0f2f5", padding: "28px 32px 40px", display: "flex", flexDirection: "column", gap: 18, position: "relative" }}>

      <PageToolbar
        searchValue={searchSku}
        onSearchChange={(v) => { setSearchSku(v); setCurrentPage(1); }}
        filters={[
          { key: "place", value: place, onChange: (v) => { setPlace(v); setCurrentPage(1); }, options: PLACES, minWidth: 170 },
        ]}
        primaryAction={{
          label: isEmployee ? "Create Reservation Request" : "Create New Reservation",
          onClick: () => setShowCreate(true),
        }}
        dateRange={dateRange}
        onDateRangeChange={(r) => { setDateRange(r); setCurrentPage(1); }}
        importExport={isEmployee ? {
          showImport: false,
          onExport: () => exportToWis(reservations),
        } : {
          fileInputRef: importRef,
          onFileChange: (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setImporting(true);
            importReservations(file,
              (parsed) => {
                setImporting(false);
                setReservations(parsed);
                setCurrentPage(1);
                setSelectedId(null);
                setPanelOpen(false);
                showToast(`Imported ${parsed.length} reservations successfully.`);
              },
              (err) => {
                setImporting(false);
                showToast(`Import failed: ${err}`, "error");
              }
            );
            e.target.value = "";
          },
          importing,
          importDisabled: !xlsxReady,
          onExport: () => exportToWis(reservations),
        }}
      />

      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: "20px 24px 22px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", flex: "1 1 0", gap: 28, flexWrap: "wrap", alignItems: "flex-start", minWidth: 0 }}>
          <div style={{ flex: "0 0 auto", minWidth: 100 }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#9ca3af", letterSpacing: "0.14em", textTransform: "uppercase" }}>SKU</p>
            <p style={{ margin: "8px 0 0", fontSize: 22, fontWeight: 900, color: "#e87c27", letterSpacing: "-0.5px", lineHeight: 1.15 }}>{sumSku}</p>
          </div>
          <div style={{ flex: "1 1 220px", minWidth: 180, maxWidth: 520, borderLeft: "1px solid #eef0f3", paddingLeft: 28 }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#9ca3af", letterSpacing: "0.14em", textTransform: "uppercase" }}>ITEM</p>
            <p style={{ margin: "8px 0 0", fontSize: 15, fontWeight: 600, color: "#111827", lineHeight: 1.45 }}>{sumItem}</p>
          </div>
          <div style={{ flex: "0 0 auto", minWidth: 120, borderLeft: "1px solid #eef0f3", paddingLeft: 28 }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#9ca3af", letterSpacing: "0.12em", textTransform: "uppercase" }}>EST QTY ENDING</p>
            <p style={{ margin: "8px 0 0", fontSize: 18, fontWeight: 800, color: "#374151", letterSpacing: "-0.3px" }}>{sumEst}</p>
          </div>
        </div>
      </div>

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
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#1c2235" }}>
                {["TRANS NO.", "RESERVATION DATE", "SO#/WO#", "TDT DR#", "CUSTOMER'S NAME", "PLACE OF DELIVERY", "RESERVED QTY", "CURRENT STOCK", "EST ENDING BALANCE", "APPROVED BY", "STATUS"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "14px 10px",
                     textAlign: "center",

                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 10,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
                {!isEmployee && (
                  <th
                    style={{
                      padding: "14px 10px",
                      textAlign: "center",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 10,
                      whiteSpace: "nowrap",
                    }}
                  >
                    ACTION
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr>
                  <td colSpan={isEmployee ? 11 : 12} style={{ textAlign: "center", padding: "48px 20px", color: "#9ca3af", fontSize: 14 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                    No results found for <strong style={{ color: "#374151" }}>"{searchSku || 'your filters'}"</strong>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Try a different search term or clear your filters.</div>
                  </td>
                </tr>
              )}
              {paged.map((row, idx) => {
                if (editingId === row.id) {
                  return <AcpoInlineEditRow key={row.id} row={row} onSave={handleSaveEdit} onCancel={() => setEditingId(null)} />;
                }
                const st = STATUS_STYLE[row.status] || STATUS_STYLE.Pending;
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
                    onMouseEnter={(e) => {
                      if (!isSel) e.currentTarget.style.background = "#fef6f2";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isSel ? "#fff4ed" : idx % 2 === 0 ? "#fff" : "#fafafa";
                    }}
                  >
                    <td style={{ padding: "12px 10px", color: "#6b7280", fontWeight: 600 }}><Highlight text={row.transNo} query={searchSku} /></td>
                    <td style={{ padding: "12px 10px", color: "#374151", whiteSpace: "nowrap" }}><Highlight text={row.resDate} query={searchSku} /></td>
                    <td style={{ padding: "12px 10px", color: "#374151" }}><Highlight text={row.soWo} query={searchSku} /></td>
                    <td style={{ padding: "12px 10px", color: "#e87c27", fontWeight: 700 }}><Highlight text={row.tdtDr} query={searchSku} /></td>
                    <td style={{ padding: "12px 10px", color: "#111827", fontWeight: 600, maxWidth: 160 }}><Highlight text={row.customer} query={searchSku} /></td>
                    <td style={{ padding: "12px 10px", color: "#6b7280" }}><Highlight text={row.place} query={searchSku} /></td>
                    <td style={{ padding: "12px 10px", textAlign: "center", fontWeight: 700 }}><Highlight text={row.reservedQty} query={searchSku} /></td>
                    <td style={{ padding: "12px 10px", textAlign: "center" }}><Highlight text={row.currentStock} query={searchSku} /></td>
                    <td style={{ padding: "12px 10px", textAlign: "center", fontWeight: 600 }}><Highlight text={row.estEnding} query={searchSku} /></td>
                    <td style={{ padding: "12px 10px", color: "#6b7280" }}><Highlight text={row.approvedBy} query={searchSku} /></td>
                    <td style={{ padding: "12px 10px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: st.badgeBg, display: "inline-block", flexShrink: 0 }} />
                        {row.status}
                      </span>
                    </td>
                    {!isEmployee && (
                      <td style={{ padding: "8px 8px", textAlign: "center" }}>
                        <button onClick={(e) => { e.stopPropagation(); setEditingId(row.id); }} title="Edit row" style={{ padding: "5px 8px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                          <IconEdit size={12} /> Edit
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderTop: "1px solid #f3f4f6", background: "#fafafa", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            Showing {sorted.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sorted.length)} of {sorted.length} Advance Customer PO — May 2026
          </span>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", color: "#374151", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.4 : 1 }}>
              <IconChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 6).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCurrentPage(n)}
                style={{
                  width: 30,
                  height: 30,
                  border: n === currentPage ? "none" : "1px solid #e5e7eb",
                  borderRadius: 6,
                  background: n === currentPage ? "#e87c27" : "#fff",
                  color: n === currentPage ? "#fff" : "#374151",
                  cursor: "pointer",
                  fontWeight: n === currentPage ? 700 : 400,
                  fontSize: 12,
                }}
              >
                {n}
              </button>
            ))}
            <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", color: "#374151", cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.4 : 1 }}>
              <IconChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, background: toast.type === "error" ? "#dc2626" : "#16a34a", color: "#fff", borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}>
          {toast.msg}
        </div>
      )}

      {panelOpen && selected && (
        <>
          <button
            type="button"
            aria-label="Close reservation details"
            onClick={() => setPanelOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,23,42,0.35)",
              zIndex: 1040,
              border: "none",
              cursor: "pointer",
            }}
          />
          <aside
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "min(420px, 100vw)",
              height: "100vh",
              background: "#ffffff",
              zIndex: 1050,
              boxShadow: "-8px 0 40px rgba(0,0,0,0.2)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "22px 22px 16px", background: "#1c2235", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexShrink: 0 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#fff" }}>Reservation Details</h2>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 8, fontWeight: 700, padding: "0 5px", borderRadius: 20, background: panelBadge.badgeBg, color: "#fff", lineHeight: "16px" }}>
                    <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#fff", display: "inline-block", flexShrink: 0 }} />
                    {selected.status.toUpperCase()}
                  </span>
                </div>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#9ca3af", fontWeight: 600, textAlign: "left" }}>DR No. {selected.drNo}</p>
              </div>
              <button type="button" onClick={() => setPanelOpen(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
                <IconX size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px 24px", background: "#ffffff" }}>
              {panelLines.map((line) => (
                <div key={line.label} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>{line.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#111827", textAlign: "right" }}>{line.value}</span>
                </div>
              ))}

              <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.06em", margin: "20px 0 10px" }}>RESERVED ITEMS</p>
              <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#f3f4f6" }}>
                      {["Item Code", "Item Description", "Reserved Qty", "Est. Ending Balance"].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "10px 8px",
                            textAlign: h.includes("Qty") || h.includes("Balance") ? "right" : "center",
                            fontWeight: 700,
                            color: "#111827",
                            fontSize: 11,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selected.lineItems.map((it, i) => (
                      <tr key={i} style={{ borderTop: "1px solid #e5e7eb", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "10px 8px", color: "#111827", fontWeight: 600 }}>{it.code}</td>
                        <td style={{ padding: "10px 8px", color: "#374151" }}>{it.desc}</td>
                        <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 700 }}>{it.qty}</td>
                        <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 600, color: "#e87c27" }}>{fmtPHP(it.qty * it.lineValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #e5e7eb", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, color: "#6b7280" }}>Total Qty (line items)</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>{sumLineQty}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, color: "#6b7280" }}>Total Reserved Value</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#e87c27" }}>{fmtPHP(sumLineValue)}</span>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}

      {showCreate && (
        <>
          <div onClick={() => setShowCreate(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 1100 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 1200, background: "#fff", borderRadius: 16, width: "min(560px,95vw)", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111827" }}>
                  {currentUser?.role === 'Employee' ? "Create Reservation Request" : "Create New Reservation"}
                </h2>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "#6b7280" }}>
                  {currentUser?.role === 'Employee' 
                    ? "Submit a reservation request for admin approval" 
                    : "Fill in the advance customer PO details below"
                  }
                </p>
              </div>
              <button type="button" onClick={() => setShowCreate(false)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, width: 34, height: 34, cursor: "pointer", color: "#4b5563", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
            <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
              {[
                { label: "Reservation Date", key: "resDate", type: "date" },
                { label: "SO / WO No.", key: "soWo", type: "text", placeholder: "e.g. SO-1234" },
                { label: "TDT DR No.", key: "tdtDr", type: "text", placeholder: "e.g. DR26050" },
                { label: "Customer Name", key: "customer", type: "text", placeholder: "e.g. RCM Builders", full: true },
                { label: "SKU Code", key: "sku", type: "text", placeholder: "e.g. DRB052" },
                { label: "Delivery Location", key: "place", type: "text", placeholder: "e.g. Manila" },
                { label: "Reserved Qty", key: "reservedQty", type: "number", placeholder: "0" },
                { label: "Current Stock", key: "currentStock", type: "number", placeholder: "0" },
                { label: "Approved By", key: "approvedBy", type: "text", placeholder: "e.g. J. Santos" },
              ].map(({ label, key, type, placeholder, full }) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: full ? "1 / -1" : undefined }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</label>
                  <input type={type} value={createForm[key]} onChange={e => setCreateForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    {...modalInput()}
                  />
                </div>
              ))}
            </div>
            {currentUser?.role === 'Employee' && (
              <div style={{
                margin: "0 24px",
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: "8px",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <div style={{ fontSize: "13px", color: "#92400e" }}>
                  <strong>Note:</strong> As an Employee, your reservation will be submitted as a request and require approval from an Admin or Manager before it becomes active.
                </div>
              </div>
            )}
            <div style={{ padding: "14px 24px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 10, justifyContent: "flex-end", background: "#fafafa" }}>
              <button type="button" onClick={() => setShowCreate(false)} style={{ padding: "10px 20px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151" }}>Cancel</button>
              <button type="button" onClick={async () => {
                if (!createForm.resDate || !createForm.customer || !createForm.sku) {
                  setToast({ msg: "Please fill in Date, Customer, and SKU.", type: "error" });
                  setTimeout(() => setToast(null), 3000);
                  return;
                }
                
                try {
                  const qty = Number(createForm.reservedQty) || 0;
                  
                  // Create reservation request through API (with approval workflow)
                  const response = await fetch('/api/advance-customer-po', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      customer_po: createForm.soWo || `CPO-${Date.now()}`,
                      customer_name: createForm.customer,
                      po_date: createForm.resDate,
                      delivery_date: createForm.resDate, // Use same date for now
                      total_amount: qty * 100, // Placeholder calculation
                      remarks: `SKU: ${createForm.sku} | TDT DR: ${createForm.tdtDr} | Qty: ${qty} | Place: ${createForm.place}`,
                      created_by: currentUser?.id || 1 // Use current user ID
                    })
                  });

                  if (!response.ok) {
                    throw new Error('Failed to create reservation');
                  }

                  const result = await response.json();
                  
                  // Refresh the reservations list
                  const updatedReservations = await fetch('/api/advance-customer-po')
                    .then(res => res.json())
                    .then((data) => data.map(normalizeApiReservation));
                  setReservations(updatedReservations);
                  
                  setShowCreate(false);
                  setCreateForm({ resDate: "", soWo: "", tdtDr: "", customer: "", place: "", sku: "", reservedQty: "", currentStock: "", approvedBy: "" });
                  
                  // Show appropriate success message based on user role
                  const message = result.status === 'Pending Approval' 
                    ? "Reservation request created and sent for approval."
                    : "Reservation created and automatically approved.";
                  setToast({ msg: message, type: "success" });
                  setTimeout(() => setToast(null), 4000);
                } catch (error) {
                  console.error('Error creating reservation:', error);
                  setToast({ msg: "Failed to create reservation request.", type: "error" });
                  setTimeout(() => setToast(null), 3000);
                }
              }} style={{ padding: "10px 20px", background: "#e87c27", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                {currentUser?.role === 'Employee' ? 'Submit Request' : 'Create Reservation'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}