import { useState, useMemo, useRef, useEffect } from "react";
import PageToolbar from "./PageToolbar";

const PAGE_SIZE = 8;

const PLACES = ["All locations", "Manila", "Cebu", "Davao"];

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
/** Each reservation includes everything the detail panel needs */
const SEED_RESERVATIONS = [
  {
    id: 1,
    transNo: "011",
    resDate: "2026-05-01",
    soWo: "SO-88421",
    tdtDr: "DR1589415",
    customer: "Michael Santiago",
    place: "Manila",
    reservedQty: 127,
    currentStock: 500,
    estEnding: 373,
    approvedBy: "A. Reyes",
    status: "Active",
    drNo: "DR26030",
    remarks: "Delivered",
    summarySku: "DRB007",
    summaryItem: "Deformed Round Bar, 10mm x 6M g33",
    summaryEstOverride: "—",
    lineItems: [
      { code: "HB100XAWD14DSAD", desc: "H-BEAM", qty: 40, lineValue: 240 },
      { code: "HB100XAWD14DSAD", desc: "H-BEAM", qty: 40, lineValue: 240 },
      { code: "HB100XAWD14DSAD", desc: "H-BEAM", qty: 47, lineValue: 240 },
    ],
  },
  {
    id: 2,
    transNo: "012",
    resDate: "2026-05-02",
    soWo: "WO-1203",
    tdtDr: "DR1589600",
    customer: "RCM Builders",
    place: "Manila",
    reservedQty: 24,
    currentStock: 500,
    estEnding: 476,
    approvedBy: "M. Cruz",
    status: "Active",
    drNo: "DR26031",
    remarks: "Hold for pickup May 8",
    lineItems: [
      { code: "DRB007", desc: "Deformed Round Bar, 10mm x 6M g33", qty: 24, lineValue: 346.73 },
    ],
  },
  {
    id: 3,
    transNo: "013",
    resDate: "2026-05-03",
    soWo: "SO-88488",
    tdtDr: "DR1589722",
    customer: "Prime Builders Corp.",
    place: "Cebu",
    reservedQty: 18,
    currentStock: 200,
    estEnding: 182,
    approvedBy: "A. Reyes",
    status: "Pending",
    drNo: "DR26032",
    remarks: "Awaiting approval",
    lineItems: [
      { code: "WF10833", desc: "Wide Flange, 10 x 8 x 33# x 6M", qty: 10, lineValue: 12300 },
      { code: "MSP010", desc: "MS Plate, 6mm x 4' x 8'", qty: 8, lineValue: 554.79 },
    ],
  },
  {
    id: 4,
    transNo: "014",
    resDate: "2026-05-04",
    soWo: "—",
    tdtDr: "DR1589801",
    customer: "EGB Construction",
    place: "Manila",
    reservedQty: 60,
    currentStock: 500,
    estEnding: 440,
    approvedBy: "L. Santos",
    status: "Active",
    drNo: "DR26033",
    remarks: "",
    lineItems: [
      { code: "DRB052", desc: "Deformed Round Bar, 16mm x 6M g40", qty: 60, lineValue: 346.73 },
    ],
  },
  {
    id: 5,
    transNo: "015",
    resDate: "2026-05-05",
    soWo: "SO-88510",
    tdtDr: "DR1589900",
    customer: "Sunway Construction Inc.",
    place: "Manila",
    reservedQty: 33,
    currentStock: 500,
    estEnding: 467,
    approvedBy: "A. Reyes",
    status: "Active",
    drNo: "DR26034",
    remarks: "Partial — balance next week",
    lineItems: [
      { code: "SHPT2", desc: "Sheet Pile T2, 400mm x 100mm", qty: 15, lineValue: 22529 },
      { code: "SHPT2", desc: "Sheet Pile T2, 400mm x 100mm", qty: 18, lineValue: 22529 },
    ],
  },
  {
    id: 6,
    transNo: "016",
    resDate: "2026-05-06",
    soWo: "WO-1210",
    tdtDr: "DR1590001",
    customer: "Aguila Simbulan Partners",
    place: "Manila",
    reservedQty: 12,
    currentStock: 500,
    estEnding: 488,
    approvedBy: "M. Cruz",
    status: "Closed",
    drNo: "DR26035",
    remarks: "Released in full",
    lineItems: [
      { code: "51181", desc: "Wide Flange, 10 x 8 x 33# x 6M", qty: 12, lineValue: 12300 },
    ],
  },
  {
    id: 7,
    transNo: "017",
    resDate: "2026-05-07",
    soWo: "SO-88544",
    tdtDr: "DR1590105",
    customer: "Talde Construction Inc.",
    place: "Cebu",
    reservedQty: 55,
    currentStock: 200,
    estEnding: 145,
    approvedBy: "L. Santos",
    status: "Active",
    drNo: "DR26036",
    remarks: "Cebu wharf delivery",
    lineItems: [
      { code: "DRB032", desc: "Deformed Round Bar, 32mm x 6M g60", qty: 30, lineValue: 1479 },
      { code: "DRB032", desc: "Deformed Round Bar, 32mm x 6M g60", qty: 25, lineValue: 1479 },
    ],
  },
  {
    id: 8,
    transNo: "018",
    resDate: "2026-05-08",
    soWo: "SO-88550",
    tdtDr: "DR1590220",
    customer: "Brencon Developers Phils.",
    place: "Manila",
    reservedQty: 28,
    currentStock: 500,
    estEnding: 472,
    approvedBy: "A. Reyes",
    status: "Pending",
    drNo: "DR26037",
    remarks: "Docs pending",
    lineItems: [
      { code: "GP3302", desc: 'GI pipe 1"', qty: 28, lineValue: 1380 },
    ],
  },
  {
    id: 9,
    transNo: "019",
    resDate: "2026-05-09",
    soWo: "—",
    tdtDr: "DR1590300",
    customer: "EC Structural Composite Inc.",
    place: "Manila",
    reservedQty: 15,
    currentStock: 500,
    estEnding: 485,
    approvedBy: "M. Cruz",
    status: "Active",
    drNo: "DR26038",
    remarks: "",
    lineItems: [
      { code: "DRB020", desc: "Deformed Round Bar, 20mm x 6M g60", qty: 15, lineValue: 539.31 },
    ],
  },
  {
    id: 10,
    transNo: "020",
    resDate: "2026-05-10",
    soWo: "SO-88590",
    tdtDr: "DR1590402",
    customer: "Aremar Construction Corp.",
    place: "Davao",
    reservedQty: 40,
    currentStock: 120,
    estEnding: 80,
    approvedBy: "L. Santos",
    status: "Active",
    drNo: "DR26039",
    remarks: "Davao transfer",
    lineItems: [
      { code: "RECT24", desc: "GI Rectangular Tube, 2 x 4 x 2mm x 6M", qty: 20, lineValue: 1380 },
      { code: "SQ22", desc: "GI Square Tube, 2 x 2 x 2mm x 6M", qty: 20, lineValue: 880 },
    ],
  },
];

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

function IconUpload({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }

/* ─── EXPORT ── */
function exportToWis(rows) {
  if (!window.XLSX) { alert("SheetJS not loaded yet."); return; }
  const XLSX = window.XLSX;
  const wb = XLSX.utils.book_new();
  const headers = [
    ["TDT WAREHOUSE INVENTORY SHEET (TDT WIS)"],
    ["Advance Customer Purchase Orders"],
    ["LOCATION:", "MARILAO WAREHOUSE"],
    ["AS OF", new Date().toLocaleString()],
    [],
    ["NO.", "TRANS #", "DATE", "SO/WO", "TDT DR", "CUSTOMER", "PLACE", "RESERVED QTY", "CURRENT STOCK", "EST. ENDING", "APPROVED BY", "STATUS"],
  ];
  const dataRows = rows.map((r, i) => [i+1, r.transNo, r.resDate, r.soWo, r.tdtDr, r.customer, r.place, r.reservedQty, r.currentStock, r.estEnding ?? "—", r.approvedBy, r.status]);
  const ws = XLSX.utils.aoa_to_sheet([...headers, ...dataRows]);
  ws["!cols"] = [{wch:5},{wch:8},{wch:12},{wch:12},{wch:12},{wch:30},{wch:14},{wch:14},{wch:14},{wch:12},{wch:14},{wch:12}];
  const numCols = ws["!cols"].length;
  // Style header row 6
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ".slice(0, numCols).split("").forEach(c => {
    const addr = `${c}6`;
    if (ws[addr]) ws[addr].s = { font: { bold: true, sz: 9, color: { rgb: "FFFFFF" }, name: "Arial" }, fill: { patternType: "solid", fgColor: { rgb: "1C2235" } }, alignment: { horizontal: "center", wrapText: true } };
  });
  // Style title rows
  ["A1","A2","A3","B3","A4","B4"].forEach(cell => {
    if (ws[cell]) ws[cell].s = { font: { bold: true, sz: 13, name: "Arial" }, alignment: { horizontal: "left" } };
  });
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: numCols - 1 } },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "ADVANCE CUSTOMER PO");
  XLSX.writeFile(wb, "TDT_WIS_Advance_Customer_PO_Export.xlsx");
}

/* ─── IMPORT parser ── */
function parseImportExcel(file, onDone, onError) {
  if (!window.XLSX) { onError("SheetJS library not loaded yet."); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const uint8 = new Uint8Array(e.target.result);
      const wb = window.XLSX.read(uint8, { type: "array", cellDates: true });
      const wsName = wb.SheetNames.find(n => n.toUpperCase().includes("ADVANCE")) || wb.SheetNames[0];
      const ws = wb.Sheets[wsName];
      if (!ws) throw new Error("No matching sheet found.");
      const raw = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false });
      let dataStart = 6;
      for (let i = 0; i < Math.min(raw.length, 12); i++) {
        if (raw[i] && raw[i].filter(Boolean).length >= 4) { dataStart = i + 1; break; }
      }
      const toNum = (v) => { if (!v && v !== 0) return 0; const n = parseFloat(String(v).replace(/,/g, "")); return isNaN(n) ? 0 : n; };
      const parsed = [];
      for (let i = dataStart; i < raw.length; i++) {
        const r = raw[i];
        if (!r || r.filter(Boolean).length < 2) continue;
        const row = {};
        r.forEach((v, idx) => { row[`col${idx}`] = v; });
        row.id = i - dataStart + 1;
        parsed.push(row);
      }
      if (!parsed.length) throw new Error("No data rows found in the sheet.");
      onDone(parsed);
    } catch (err) { onError(err.message || "Unknown error"); }
  };
  reader.onerror = () => onError("Could not read the file.");
  reader.readAsArrayBuffer(file);
}
export default function AdvanceCustomerPOPage() {
  const [searchSku, setSearchSku] = useState("");

  const xlsxReady = useSheetJS();
  const importRef = useRef(null);
  const [place, setPlace] = useState("All locations");
  const [currentPage, setCurrentPage] = useState(1);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const filtered = useMemo(() => {
    let rows = SEED_RESERVATIONS;
    if (searchSku.trim()) {
      const q = searchSku.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.customer.toLowerCase().includes(q) ||
          r.tdtDr.toLowerCase().includes(q) ||
          r.soWo.toLowerCase().includes(q) ||
          String(r.transNo).includes(q) ||
          r.drNo.toLowerCase().includes(q) ||
          r.lineItems.some(
            (L) => L.code.toLowerCase().includes(q) || L.desc.toLowerCase().includes(q)
          )
      );
    }
    if (place !== "All locations") rows = rows.filter((r) => r.place === place);
    return rows;
  }, [searchSku, place]);

  useEffect(() => {
    if (selectedId != null && !filtered.some((r) => r.id === selectedId)) {
      setSelectedId(null);
      setPanelOpen(false);
    }
  }, [filtered, selectedId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const selected = selectedId != null ? SEED_RESERVATIONS.find((r) => r.id === selectedId) : null;
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

  const summarySource = selectedId != null ? SEED_RESERVATIONS.find((r) => r.id === selectedId) : null;
  const { sku: sumSku, item: sumItem, estQtyEnding: sumEst } = getSummaryFields(summarySource);

  return (
    <div style={{ background: "#f0f2f5", padding: "28px 32px 40px", display: "flex", flexDirection: "column", gap: 18, position: "relative" }}>

      <PageToolbar
        searchValue={searchSku}
        onSearchChange={(v) => { setSearchSku(v); setCurrentPage(1); }}
        filters={[
          { key: "place", value: place, onChange: (v) => { setPlace(v); setCurrentPage(1); }, options: PLACES, minWidth: 170 },
        ]}
        primaryAction={{ label: "Create New Reservation", onClick: () => {} }}
        importExport={{
          fileInputRef: importRef,
          onFileChange: (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            parseImportExcel(file,
              (parsed) => alert(`Imported ${parsed.length} rows from ${file.name}`),
              (err) => alert(`Import failed: ${err}`)
            );
            e.target.value = "";
          },
          onExport: () => { if (!xlsxReady) { alert("SheetJS not ready yet."); return; } exportToWis(SEED_RESERVATIONS); },
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
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#1c2235" }}>
                {["TRANS NO.", "RESERVATION DATE", "SO#/WO#", "TDT DR#", "CUSTOMER'S NAME", "PLACE OF DELIVERY", "RESERVED QTY", "CURRENT STOCK", "EST ENDING BALANCE", "APPROVED BY", "STATUS"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "14px 10px",
                      textAlign: ["RESERVED QTY", "CURRENT STOCK", "EST ENDING BALANCE"].includes(h) ? "right" : "left",
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
                <tr>
                  <td colSpan={11} style={{ textAlign: "center", padding: 48, color: "#9ca3af", fontSize: 14 }}>No reservations match your filters.</td>
                </tr>
              )}
              {paged.map((row, idx) => {
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
                    <td style={{ padding: "12px 10px", color: "#6b7280", fontWeight: 600 }}>{row.transNo}</td>
                    <td style={{ padding: "12px 10px", color: "#374151", whiteSpace: "nowrap" }}>{row.resDate}</td>
                    <td style={{ padding: "12px 10px", color: "#374151" }}>{row.soWo}</td>
                    <td style={{ padding: "12px 10px", color: "#e87c27", fontWeight: 700 }}>{row.tdtDr}</td>
                    <td style={{ padding: "12px 10px", color: "#111827", fontWeight: 600, maxWidth: 160 }}>{row.customer}</td>
                    <td style={{ padding: "12px 10px", color: "#6b7280" }}>{row.place}</td>
                    <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: 700 }}>{row.reservedQty}</td>
                    <td style={{ padding: "12px 10px", textAlign: "right" }}>{row.currentStock}</td>
                    <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: 600 }}>{row.estEnding}</td>
                    <td style={{ padding: "12px 10px", color: "#6b7280" }}>{row.approvedBy}</td>
                    <td style={{ padding: "12px 10px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color }}>{row.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderTop: "1px solid #f3f4f6", background: "#fafafa", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} Advance Customer PO — May 2026
          </span>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.4 : 1 }}>
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
            <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.4 : 1 }}>
              <IconChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

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
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#fff" }}>Reservation Details</h2>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: panelBadge.badgeBg, color: "#fff" }}>{selected.status.toUpperCase()}</span>
                </div>
                <p style={{ margin: "10px 0 0", fontSize: 13, color: "#9ca3af", fontWeight: 600 }}>DR No. {selected.drNo}</p>
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
                            textAlign: h.includes("Qty") || h.includes("Balance") ? "right" : "left",
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
    </div>
  );
}