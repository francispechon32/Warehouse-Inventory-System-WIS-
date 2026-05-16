import { useState, useRef, useMemo, useEffect } from "react";
import PageToolbar from "./PageToolbar";

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

const SEED_DATA = [
  { no:1,  productDescription:"Deformed Round Bar, 10mm x 6M g33",                                               sku:"DRB007", lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,           avgUnitCost:0,       qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:2,  productDescription:"Deformed Round Bar, 12mm x 6M g33",                                               sku:"DRB008", lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,           avgUnitCost:0,       qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:3,  productDescription:"Deformed Round Bar, 16mm x 6M g33",                                               sku:"DRB009", lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,           avgUnitCost:0,       qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:4,  productDescription:"Deformed Round Bar, 10mm x 6M g40",                                               sku:"DRB050", lastAcceptanceDate:"2026-02-21", qtyAsPerWis:1557, totalUnitCost:212686.20,   avgUnitCost:136.60,  qtyAsPerCounting:1557,varianceQty:0, varianceAmount:0, remarks:"" },
  { no:5,  productDescription:"Deformed Round Bar, 12mm x 6M g40",                                               sku:"DRB051", lastAcceptanceDate:"2025-05-31", qtyAsPerWis:1,    totalUnitCost:186.38,      avgUnitCost:186.38,  qtyAsPerCounting:1,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:6,  productDescription:"Deformed Round Bar, 16mm x 6M g40",                                               sku:"DRB052", lastAcceptanceDate:"2026-02-21", qtyAsPerWis:1225, totalUnitCost:424750.18,   avgUnitCost:346.73,  qtyAsPerCounting:1225,varianceQty:0, varianceAmount:0, remarks:"" },
  { no:7,  productDescription:"Sheet Pile, T2, 400mm x 100mm x 10.5mm x 48kg/m x 12M (576 kilos)",              sku:"SHPT2",  lastAcceptanceDate:"2026-03-24", qtyAsPerWis:560,  totalUnitCost:12616608.49, avgUnitCost:22529.66,qtyAsPerCounting:560, varianceQty:0, varianceAmount:0, remarks:"" },
  { no:8,  productDescription:"MS Plate, 6mm x 4' x 8'",                                                         sku:"MSP010", lastAcceptanceDate:"2026-02-21", qtyAsPerWis:322,  totalUnitCost:178642.38,   avgUnitCost:554.79,  qtyAsPerCounting:322, varianceQty:0, varianceAmount:0, remarks:"DRB 20mm x 6M g40" },
  { no:9,  productDescription:"MS Plate, 12mm x 4' x 8'",                                                        sku:"MSP018", lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,           avgUnitCost:0,       qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:10, productDescription:"MS Plate, 10mm X 4' x 8'",                                                        sku:"SKU10",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,           avgUnitCost:0,       qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:11, productDescription:"Sheet Pile, T2, 400mm x 100mm x 10.5mm x 48kg/m x 6M (288 kilos)",               sku:"SHPT2A", lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,           avgUnitCost:0,       qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:12, productDescription:"Sheet Pile Z type 12 meters",                                                      sku:"SHPT7",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,           avgUnitCost:0,       qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:13, productDescription:"Sheet Pile, Z - Pile 770mm W x 354mm H x 8.5mm x 73.2kg/M x 12M (878.40 kilos)", sku:"JINXI",  lastAcceptanceDate:"2025-03-12", qtyAsPerWis:15,   totalUnitCost:627577.90,   avgUnitCost:41838.53,qtyAsPerCounting:15,  varianceQty:0, varianceAmount:0, remarks:"" },
  { no:14, productDescription:"Wide Flange, 8 x 4 x 10# x 6M (approx: Web 4.32mm/Flange 5.21mm)",               sku:"WF016",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,           avgUnitCost:0,       qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:15, productDescription:"Wide Flange, 6 x 4 x 9# x 6M (approx: Web 4.32mm/Flange 5.46mm)",               sku:"WF009",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,           avgUnitCost:0,       qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:16, productDescription:"Sheet Pile, T3, 400mm x 125mm x 13mm x 60kg/m x 12M(720kgs)",                    sku:"SHPT3",  lastAcceptanceDate:"2025-11-29", qtyAsPerWis:481,  totalUnitCost:13598380.80, avgUnitCost:28271.06,qtyAsPerCounting:481, varianceQty:0, varianceAmount:0, remarks:"1 PC DAMAGED" },
  { no:17, productDescription:"Angle Bar, 3mm x 38mm x 38mm x 6M Yellow",                                        sku:"SKU17",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,           avgUnitCost:0,       qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:18, productDescription:"Angle Bar, 4mm x 38mm x 38mm x 6M Orange",                                        sku:"SKU18",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,           avgUnitCost:0,       qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:19, productDescription:"Angle Bar, 5mm x 38mm x 38mm x 6M White",                                         sku:"SKU19",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,           avgUnitCost:0,       qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:20, productDescription:"Angle Bar, 3mm x 50mm x 50mm x 6M Yellow",                                        sku:"SKU20",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,           avgUnitCost:0,       qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:21, productDescription:"Angle Bar, 4mm x 50mm x 50mm x 6M Orange",                                        sku:"SKU21",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,           avgUnitCost:0,       qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:22, productDescription:"Angle Bar, 4.5mm x 50mm x 50mm x 6M Violet",                                      sku:"SKU22",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,           avgUnitCost:0,       qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:23, productDescription:"Angle Bar, 5mm x 50mm x 50mm x 6M White",                                         sku:"SKU23",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,           avgUnitCost:0,       qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:24, productDescription:"Angle Bar, 6mm x 50mm x 50mm x 6M Brown",                                         sku:"SKU24",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,           avgUnitCost:0,       qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:25, productDescription:"Angle Bar, 6mm x 63.5mm x 63.5mm x 6M Brown",                                     sku:"SKU25",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,           avgUnitCost:0,       qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:26, productDescription:"Angle Bar, 5mm x 75mm x 75mm x 6M White",                                         sku:"SKU26",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,           avgUnitCost:0,       qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:27, productDescription:"Angle Bar, 6mm x 75mm x 75mm x 6M Brown",                                         sku:"SKU27",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,           avgUnitCost:0,       qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:28, productDescription:"BI Pipe, 1-1/2\" x 6M s20",                                                       sku:"SKU28",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,           avgUnitCost:0,       qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:29, productDescription:"BI Pipe, 1-1/2\" x 6M s40",                                                       sku:"SKU29",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,           avgUnitCost:0,       qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
  { no:30, productDescription:"GI Pipe, 1\" x 6M s40",                                                            sku:"SKU30",  lastAcceptanceDate:"",           qtyAsPerWis:0,    totalUnitCost:0,           avgUnitCost:0,       qtyAsPerCounting:0,   varianceQty:0, varianceAmount:0, remarks:"" },
];

const PAGE_SIZE = 8;

function fmtPHP(n) {
  if (!n && n !== 0) return "—";
  return "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseWisExcel(file, onDone, onError) {
  if (!window.XLSX) { onError("SheetJS library not loaded yet."); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const uint8 = new Uint8Array(e.target.result);
      const wb = window.XLSX.read(uint8, { type: "array", cellDates: true });
      const ws = wb.Sheets["ENDING INVENTORY"];
      if (!ws) throw new Error('Sheet "ENDING INVENTORY" not found.');
      const raw = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false });
      let dataStart = 6;
      for (let i = 0; i < Math.min(raw.length, 12); i++) {
        if (raw[i] && raw[i].some(v => typeof v === "string" && v.toUpperCase().includes("PRODUCT DESCRIPTION"))) { dataStart = i + 1; break; }
      }
      const toNum = (v) => { if (!v && v !== 0) return 0; const n = parseFloat(String(v).replace(/,/g, "")); return isNaN(n) ? 0 : n; };
      const parseDate = (v) => { if (!v) return ""; if (v instanceof Date) return v.toISOString().slice(0,10); const d = new Date(v); if (!isNaN(d.getTime())) return d.toISOString().slice(0,10); return String(v).slice(0,10); };
      const parsed = [];
      for (let i = dataStart; i < raw.length; i++) {
        const r = raw[i]; if (!r) continue;
        const noNum = parseFloat(String(r[0]||"").replace(/,/g,""));
        if (isNaN(noNum) || noNum <= 0) continue;
        parsed.push({ id: noNum, no: noNum, productDescription: String(r[1]||"").trim(), sku: String(r[2]||"").trim(), lastAcceptanceDate: parseDate(r[3]), qtyAsPerWis: toNum(r[4]), totalUnitCost: toNum(r[5]), avgUnitCost: toNum(r[6]), qtyAsPerCounting: toNum(r[7]), varianceQty: toNum(r[8]), varianceAmount: toNum(r[9]), remarks: String(r[10]||"").trim() });
      }
      if (!parsed.length) throw new Error("No data rows found.");
      onDone(parsed);
    } catch(err) { onError(err.message || "Unknown error"); }
  };
  reader.onerror = () => onError("Could not read the file.");
  reader.readAsArrayBuffer(file);
}

function exportToWis(rows) {
  if (!window.XLSX) { alert("SheetJS not loaded yet."); return; }
  const XLSX = window.XLSX;
  const wb = XLSX.utils.book_new();
  const headers = [
    ["TDT WAREHOUSE INVENTORY SHEET (TDT WIS)"],
    ["Ending Inventory as per WIS"],
    ["LOCATION:", "MARILAO WAREHOUSE"],
    ["AS OF", new Date().toLocaleString()],
    [],
    ["NO.","PRODUCT DESCRIPTION","SKU NUMBER","LAST ACCEPTANCE DATE","QUANTITY AS PER WIS","TOTAL UNIT COST","AVERAGE UNIT COST","QUANTITY AS PER COUNTING","VARIANCE (QUANTITY)","VARIANCE (AMOUNT)","REMARKS"],
  ];
  const dataRows = rows.map(r => [r.no, r.productDescription, r.sku, r.lastAcceptanceDate||"", r.qtyAsPerWis, r.totalUnitCost, r.avgUnitCost, r.qtyAsPerCounting, r.varianceQty, r.varianceAmount, r.remarks]);
  const ws = XLSX.utils.aoa_to_sheet([...headers, ...dataRows]);
  ws["!cols"] = [{wch:5},{wch:65},{wch:10},{wch:20},{wch:18},{wch:18},{wch:18},{wch:22},{wch:18},{wch:18},{wch:22}];
  XLSX.utils.book_append_sheet(wb, ws, "ENDING INVENTORY");
  XLSX.writeFile(wb, "TDT_WIS_Ending_Inventory_Export.xlsx");
}

/* ─── ICONS ── */
function IconSearch({ size=16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>; }
function IconChevronDown({ size=14 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M19 9l-7 7-7-7"/></svg>; }
function IconDownload({ size=16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
function IconUpload({ size=16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }
function IconPlus({ size=16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function IconChevronLeft({ size=14 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M15 19l-7-7 7-7"/></svg>; }
function IconChevronRight({ size=14 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"/></svg>; }
function IconSave({ size=14 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>; }
function IconX({ size=14 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function IconEdit({ size=14 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }

/* ─── START ENDING INVENTORY MODAL ── */
function StartInventoryModal({ data, onClose, onSave }) {
  const [edits, setEdits] = useState(
    data.reduce((acc, r) => {
      acc[r.no] = {
        lastAcceptanceDate: r.lastAcceptanceDate || "",
        qtyAsPerWis: r.qtyAsPerWis,
        avgUnitCost: r.avgUnitCost,
        qtyAsPerCounting: r.qtyAsPerCounting,
        remarks: r.remarks || "",
      };
      return acc;
    }, {})
  );

  const setField = (no, field, val) => setEdits(e => ({ ...e, [no]: { ...e[no], [field]: val } }));

  const handleSave = () => {
    onSave(edits);
    onClose();
  };

  const inputSt = { padding: "6px 8px", fontSize: 12, border: "1px solid #d1d5db", borderRadius: 6, fontFamily: "inherit", background: "#fff", width: "100%" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "92vw", maxWidth: 1100, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        {/* Header */}
        <div style={{ padding: "20px 28px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: 0 }}>Start Ending Inventory</h2>
            <p style={{ fontSize: 12, color: "#6b7280", margin: "4px 0 0" }}>Fill in the editable fields. Total Cost and Variances are auto-calculated.</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}><IconX size={20} /></button>
        </div>



        {/* Table */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
              <tr style={{ background: "#1c2235" }}>
                {["#","PRODUCT DESCRIPTION","SKU","LAST ACCEPTANCE DATE","QTY AS PER WIS","TOTAL COST (AUTO)","AVG UNIT COST","QTY AS PER COUNTING","VARIANCE (QTY)","VARIANCE (AMT)","REMARKS"].map(h => (
                  <th key={h} style={{ padding: "12px 10px", textAlign: ["QTY AS PER WIS","TOTAL COST (AUTO)","AVG UNIT COST","QTY AS PER COUNTING","VARIANCE (QTY)","VARIANCE (AMT)"].includes(h) ? "right" : "left", color: "#fff", fontWeight: 700, fontSize: 10, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => {
                const ed = edits[row.no] || {};
                const qty = parseFloat(ed.qtyAsPerWis) || 0;
                const avg = parseFloat(ed.avgUnitCost) || 0;
                const totalCost = qty * avg;
                const counting = parseFloat(ed.qtyAsPerCounting) || 0;
                const varQty = counting - qty;
                const varAmt = varQty * avg;
                const isEditable = row => true; // all rows editable

                return (
                  <tr key={row.no} style={{ borderBottom: "1px solid #f3f4f6", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "8px 10px", color: "#9ca3af", fontSize: 11 }}>{row.no}</td>
                    <td style={{ padding: "8px 10px", color: "#374151", maxWidth: 240, fontSize: 11 }}>{row.productDescription}</td>
                    <td style={{ padding: "8px 10px", color: "#e87c27", fontWeight: 700 }}>{row.sku}</td>
                    {/* EDITABLE: Last Acceptance Date */}
                    <td style={{ padding: "6px 8px" }}>
                      <input type="date" value={ed.lastAcceptanceDate||""} onChange={e => setField(row.no, "lastAcceptanceDate", e.target.value)} style={{ ...inputSt, width: 130, borderColor: "#e87c27" }} />
                    </td>
                    {/* EDITABLE: Qty as per WIS */}
                    <td style={{ padding: "6px 8px", textAlign: "right" }}>
                      <input type="number" value={ed.qtyAsPerWis||0} onChange={e => setField(row.no, "qtyAsPerWis", parseFloat(e.target.value)||0)} style={{ ...inputSt, width: 80, textAlign: "right", borderColor: "#e87c27" }} />
                    </td>
                    {/* AUTO: Total Cost */}
                    <td style={{ padding: "8px 10px", textAlign: "right", color: "#374151", fontWeight: 600, fontSize: 11 }}>{totalCost > 0 ? fmtPHP(totalCost) : "—"}</td>
                    {/* EDITABLE: Avg Unit Cost */}
                    <td style={{ padding: "6px 8px", textAlign: "right" }}>
                      <input type="number" value={ed.avgUnitCost||0} onChange={e => setField(row.no, "avgUnitCost", parseFloat(e.target.value)||0)} step="0.01" style={{ ...inputSt, width: 100, textAlign: "right", borderColor: "#e87c27" }} />
                    </td>
                    {/* EDITABLE: Qty as per Counting */}
                    <td style={{ padding: "6px 8px", textAlign: "right" }}>
                      <input type="number" value={ed.qtyAsPerCounting||0} onChange={e => setField(row.no, "qtyAsPerCounting", parseFloat(e.target.value)||0)} style={{ ...inputSt, width: 80, textAlign: "right", borderColor: "#e87c27" }} />
                    </td>
                    {/* AUTO: Variance Qty */}
                    <td style={{ padding: "8px 10px", textAlign: "right" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700, background: varQty===0?"#d1fae5":varQty>0?"#dcfce7":"#fee2e2", color: varQty===0?"#065f46":varQty>0?"#16a34a":"#991b1b" }}>{varQty}</span>
                    </td>
                    {/* AUTO: Variance Amount */}
                    <td style={{ padding: "8px 10px", textAlign: "right" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700, background: varAmt===0?"#d1fae5":"#fee2e2", color: varAmt===0?"#065f46":"#991b1b" }}>{varAmt===0?"—":fmtPHP(varAmt)}</span>
                    </td>
                    {/* EDITABLE: Remarks */}
                    <td style={{ padding: "6px 8px" }}>
                      <input value={ed.remarks||""} onChange={e => setField(row.no, "remarks", e.target.value)} style={{ ...inputSt, width: 140, borderColor: "#e87c27" }} placeholder="Notes..." />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 28px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 12, justifyContent: "flex-end", flexShrink: 0, background: "#fafafa" }}>
          <button onClick={onClose} style={{ padding: "10px 22px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151" }}>Cancel</button>
          <button onClick={handleSave} style={{ padding: "10px 22px", background: "#e87c27", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
            <IconSave size={14} /> Save Inventory Count
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── INLINE EDIT ROW ── */
function InlineEditRow({ item, onSave, onCancel, idx }) {
  const [draft, setDraft] = useState({ ...item });
  const set = (k, v) => setDraft(d => {
    const next = { ...d, [k]: v };
    next.varianceQty = (parseFloat(next.qtyAsPerCounting)||0) - (parseFloat(next.qtyAsPerWis)||0);
    next.varianceAmount = next.varianceQty * (parseFloat(next.avgUnitCost)||0);
    next.totalUnitCost = (parseFloat(next.qtyAsPerWis)||0) * (parseFloat(next.avgUnitCost)||0);
    return next;
  });

  const inputSt = { padding: "5px 7px", fontSize: 12, border: "1.5px solid #e87c27", borderRadius: 6, fontFamily: "inherit", background: "#fffbf7" };

  return (
    <tr style={{ background: "#fffbf7", borderBottom: "1px solid #fed7aa" }}>
      <td style={{ padding: "8px 16px", color: "#9ca3af", fontSize: 11 }}>{item.no}</td>
      <td style={{ padding: "8px 16px", color: "#374151", fontSize: 11, maxWidth: 240 }}>{item.productDescription}</td>
      <td style={{ padding: "8px 16px", color: "#e87c27", fontWeight: 700 }}>{item.sku}</td>
      {/* EDITABLE: Last Acceptance Date */}
      <td style={{ padding: "6px 10px" }}>
        <input type="date" value={draft.lastAcceptanceDate||""} onChange={e => set("lastAcceptanceDate", e.target.value)} style={{ ...inputSt, width: 130 }} />
      </td>
      {/* EDITABLE: Qty as per WIS */}
      <td style={{ padding: "6px 10px", textAlign: "right" }}>
        <input type="number" value={draft.qtyAsPerWis} onChange={e => set("qtyAsPerWis", parseFloat(e.target.value)||0)} style={{ ...inputSt, width: 80, textAlign: "right" }} />
      </td>
      {/* AUTO: Total Unit Cost */}
      <td style={{ padding: "8px 16px", textAlign: "right", color: "#374151", fontSize: 11 }}>{fmtPHP(draft.totalUnitCost)}</td>
      {/* EDITABLE: Avg Unit Cost */}
      <td style={{ padding: "6px 10px", textAlign: "right" }}>
        <input type="number" value={draft.avgUnitCost} onChange={e => set("avgUnitCost", parseFloat(e.target.value)||0)} step="0.01" style={{ ...inputSt, width: 100, textAlign: "right" }} />
      </td>
      {/* EDITABLE: Qty as per Counting */}
      <td style={{ padding: "6px 10px", textAlign: "right" }}>
        <input type="number" value={draft.qtyAsPerCounting} onChange={e => set("qtyAsPerCounting", parseFloat(e.target.value)||0)} style={{ ...inputSt, width: 80, textAlign: "right" }} />
      </td>
      {/* AUTO: Variance Qty */}
      <td style={{ padding: "8px 16px", textAlign: "right" }}>
        <span style={{ padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: draft.varianceQty===0?"#d1fae5":"#fee2e2", color: draft.varianceQty===0?"#065f46":"#991b1b" }}>{draft.varianceQty}</span>
      </td>
      {/* AUTO: Variance Amount */}
      <td style={{ padding: "8px 16px", textAlign: "right" }}>
        <span style={{ padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: draft.varianceAmount===0?"#d1fae5":"#fee2e2", color: draft.varianceAmount===0?"#065f46":"#991b1b" }}>{draft.varianceAmount===0?"—":fmtPHP(draft.varianceAmount)}</span>
      </td>
      {/* EDITABLE: Remarks */}
      <td style={{ padding: "6px 10px" }}>
        <input value={draft.remarks||""} onChange={e => set("remarks", e.target.value)} style={{ ...inputSt, width: 140 }} placeholder="Notes..." />
      </td>
      <td style={{ padding: "8px 10px" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => onSave(draft)} style={{ padding: "5px 10px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700 }}>
            <IconSave size={12} /> Save
          </button>
          <button onClick={onCancel} style={{ padding: "5px 8px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 6, cursor: "pointer" }}><IconX size={12} /></button>
        </div>
      </td>
    </tr>
  );
}

/* ─── MAIN COMPONENT ── */
export default function EndingInventoryPage() {
  const xlsxReady = useSheetJS();
  const [inventoryData, setInventoryData] = useState(
    SEED_DATA.map((r, i) => ({ ...r, id: r.no ?? i+1, totalUnitCost: r.qtyAsPerWis * r.avgUnitCost || r.totalUnitCost }))
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [activeTab, setActiveTab] = useState("wis");
  const [currentPage, setCurrentPage] = useState(1);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState(null);
  const [editingNo, setEditingNo] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const fileInputRef = useRef(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const filtered = useMemo(() => {
    let d = inventoryData;
    if (searchQuery.trim()) { const q = searchQuery.toLowerCase(); d = d.filter(r => r.sku.toLowerCase().includes(q) || r.productDescription.toLowerCase().includes(q)); }
    if (statusFilter === "In Stock")     d = d.filter(r => r.qtyAsPerWis > 0);
    if (statusFilter === "Out of Stock") d = d.filter(r => r.qtyAsPerWis === 0);
    if (statusFilter === "Variance")     d = d.filter(r => r.varianceQty !== 0);
    return d;
  }, [inventoryData, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const startIdx = (currentPage-1)*PAGE_SIZE;
  const paged = filtered.slice(startIdx, startIdx+PAGE_SIZE);

  const handleImportWis = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    parseWisExcel(file, (parsed) => {
      setImporting(false);
      setInventoryData(prev => {
        const map = new Map(prev.map(r => [r.sku, r]));
        parsed.forEach(p => { if (p.sku) map.set(p.sku, p); });
        return Array.from(map.values()).sort((a,b) => (a.no||0)-(b.no||0));
      });
      setCurrentPage(1);
      showToast(`✓ Imported ${parsed.length} SKUs successfully.`);
      e.target.value = "";
    }, (err) => {
      setImporting(false);
      showToast(`❌ Import failed: ${err}`, "error");
      e.target.value = "";
    });
  };

  const handleSaveEdit = (updated) => {
    setInventoryData(d => d.map(r => r.no === updated.no ? { ...updated } : r));
    setEditingNo(null);
    showToast("Row updated successfully.");
  };

  const handleStartInventorySave = (edits) => {
    setInventoryData(d => d.map(r => {
      const ed = edits[r.no];
      if (!ed) return r;
      const qtyWis = parseFloat(ed.qtyAsPerWis) || 0;
      const avg = parseFloat(ed.avgUnitCost) || 0;
      const qtyCounting = parseFloat(ed.qtyAsPerCounting) || 0;
      return {
        ...r,
        lastAcceptanceDate: ed.lastAcceptanceDate || r.lastAcceptanceDate,
        qtyAsPerWis: qtyWis,
        avgUnitCost: avg,
        totalUnitCost: qtyWis * avg,
        qtyAsPerCounting: qtyCounting,
        varianceQty: qtyCounting - qtyWis,
        varianceAmount: (qtyCounting - qtyWis) * avg,
        remarks: ed.remarks !== undefined ? ed.remarks : r.remarks,
      };
    }));
    showToast("✓ Ending inventory count saved.");
  };

  const totalValue = inventoryData.reduce((s,r) => s + (r.totalUnitCost||0), 0);
  const inStockCount = inventoryData.filter(r => r.qtyAsPerWis > 0).length;
  const varianceCount = inventoryData.filter(r => r.varianceQty !== 0).length;

  return (
    <div style={{ background: "#f0f2f5", padding: "28px 32px 40px", display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {[
          { label: "Total SKUs",            value: inventoryData.length, color: "#3b82f6" },
          { label: "In Stock",              value: inStockCount,          color: "#16a34a" },
          { label: "Variance Items",        value: varianceCount,         color: varianceCount > 0 ? "#dc2626" : "#6b7280" },
          { label: "Total Inventory Value", value: fmtPHP(totalValue),    color: "#e87c27" },
        ].map(c => (
          <div key={c.label} style={{ background: "#fff", borderRadius: 10, padding: "14px 18px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <p style={{ margin: 0, fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{c.label}</p>
            <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 800, color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      <PageToolbar
        searchValue={searchQuery}
        onSearchChange={(v) => { setSearchQuery(v); setCurrentPage(1); }}
        filters={[
          { key: "status", value: statusFilter, onChange: (v) => { setStatusFilter(v); setCurrentPage(1); }, options: ["All Status", "In Stock", "Out of Stock", "Variance"], minWidth: 150 },
        ]}
        primaryAction={{ label: "Start Ending Inventory", onClick: () => setShowStartModal(true) }}
        importExport={{
          fileInputRef,
          onFileChange: handleImportWis,
          importing,
          importDisabled: !xlsxReady,
          importLabel: importing ? "Importing…" : !xlsxReady ? "Loading…" : "Import WIS",
          onExport: () => exportToWis(inventoryData),
        }}
      />

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "2px solid #e5e7eb", background: "#fff", borderRadius: "12px 12px 0 0", padding: "0 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
        {[["wis","Ending Inventory as per WIS"],["cogs","Cost of Goods Sold"]].map(([key,label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{ padding: "14px 20px", background: "none", border: "none", cursor: "pointer", borderBottom: activeTab===key?"3px solid #e87c27":"3px solid transparent", color: activeTab===key?"#e87c27":"#9ca3af", fontSize: 14, fontWeight: 700, marginBottom: -2 }}>{label}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: "0 0 14px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden", marginTop: -2 }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#1c2235" }}>
                {(activeTab === "wis"
                  ? ["#","PRODUCT DESCRIPTION","SKU","LAST ACCEPTANCE DATE","QTY AS PER WIS","TOTAL COST (AUTO)","AVG UNIT COST","QTY AS PER COUNTING","VARIANCE (QTY)","VARIANCE (AMT)","REMARKS"]
                  : ["#","PRODUCT DESCRIPTION","SKU","QTY AS PER WIS","AVG UNIT COST","TOTAL COST OF GOODS SOLD"]
                ).map((h,i) => (
                  <th key={h+i} style={{ padding: "14px 16px", textAlign: ["QTY AS PER WIS","TOTAL COST (AUTO)","AVG UNIT COST","QTY AS PER COUNTING","VARIANCE (QTY)","VARIANCE (AMT)","QTY AS PER WIS","AVG UNIT COST","TOTAL COST OF GOODS SOLD"].includes(h)?"right":"left", color: "#fff", fontWeight: 700, fontSize: 10, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && <tr><td colSpan={12} style={{ textAlign: "center", padding: 48, color: "#9ca3af", fontSize: 14 }}>No items found.</td></tr>}
              {paged.map((item, idx) => {
                if (activeTab === "wis" && editingNo === item.no) {
                  return <InlineEditRow key={item.id} item={item} idx={idx} onSave={handleSaveEdit} onCancel={() => setEditingNo(null)} />;
                }
                return (
                  <tr key={item.id ?? item.sku}
                    style={{ borderBottom: "1px solid #f3f4f6", background: idx%2===0?"#fff":"#fafafa" }}
                    onMouseEnter={e => e.currentTarget.style.background="#fef6f2"}
                    onMouseLeave={e => e.currentTarget.style.background=idx%2===0?"#fff":"#fafafa"}
                  >
                    {activeTab === "wis" ? (
                      <>
                        <td style={{ padding: "12px 16px", color: "#9ca3af", fontSize: 11 }}>{item.no}</td>
                        <td style={{ padding: "12px 16px", color: "#374151", fontSize: 12, maxWidth: 280 }}>{item.productDescription}</td>
                        <td style={{ padding: "12px 16px", color: "#e87c27", fontWeight: 700 }}>{item.sku}</td>
                        <td style={{ padding: "12px 16px", color: "#6b7280", whiteSpace: "nowrap" }}>{item.lastAcceptanceDate || "—"}</td>
                        <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700 }}>{item.qtyAsPerWis.toLocaleString()}</td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>{fmtPHP(item.totalUnitCost)}</td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>{fmtPHP(item.avgUnitCost)}</td>
                        <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700 }}>{item.qtyAsPerCounting.toLocaleString()}</td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <span style={{ padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: item.varianceQty===0?"#d1fae5":"#fee2e2", color: item.varianceQty===0?"#065f46":"#991b1b" }}>{item.varianceQty}</span>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <span style={{ padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: item.varianceAmount===0?"#d1fae5":"#fee2e2", color: item.varianceAmount===0?"#065f46":"#991b1b" }}>{item.varianceAmount===0?"—":fmtPHP(item.varianceAmount)}</span>
                        </td>
                         <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: 12, maxWidth: 150 }}>{item.remarks || "—"}</td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: "12px 16px", color: "#9ca3af", fontSize: 11 }}>{item.no}</td>
                        <td style={{ padding: "12px 16px", color: "#374151", fontSize: 12, maxWidth: 280 }}>{item.productDescription}</td>
                        <td style={{ padding: "12px 16px", color: "#e87c27", fontWeight: 700 }}>{item.sku}</td>
                        <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700 }}>{item.qtyAsPerWis.toLocaleString()}</td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>{fmtPHP(item.avgUnitCost)}</td>
                        <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: item.totalUnitCost>0?"#065f46":"#9ca3af" }}>{item.totalUnitCost>0?fmtPHP(item.totalUnitCost):"—"}</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderTop: "1px solid #f3f4f6", background: "#fafafa", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            Showing {filtered.length===0?0:startIdx+1}–{Math.min(startIdx+PAGE_SIZE,filtered.length)} of {filtered.length} SKUs
          </span>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button onClick={() => setCurrentPage(p => Math.max(1,p-1))} disabled={currentPage===1}
              style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: currentPage===1?"not-allowed":"pointer", opacity: currentPage===1?0.4:1 }}>
              <IconChevronLeft size={14} />
            </button>
            {Array.from({length: totalPages}, (_,i) => i+1).slice(0,10).map(n => (
              <button key={n} onClick={() => setCurrentPage(n)}
                style={{ width: 30, height: 30, border: n===currentPage?"none":"1px solid #e5e7eb", borderRadius: 6, background: n===currentPage?"#e87c27":"#fff", color: n===currentPage?"#fff":"#374151", cursor: "pointer", fontWeight: n===currentPage?700:400, fontSize: 13 }}>
                {n}
              </button>
            ))}
            {totalPages > 10 && <span style={{ fontSize: 12, color: "#9ca3af" }}>…{totalPages}</span>}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages,p+1))} disabled={currentPage===totalPages}
              style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: currentPage===totalPages?"not-allowed":"pointer", opacity: currentPage===totalPages?0.4:1 }}>
              <IconChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {showStartModal && (
        <StartInventoryModal
          data={inventoryData}
          onClose={() => setShowStartModal(false)}
          onSave={handleStartInventorySave}
        />
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, background: toast.type==="error"?"#dc2626":"#16a34a", color: "#fff", borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.18)", maxWidth: 440 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}