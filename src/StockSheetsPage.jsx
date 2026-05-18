import { useState, useMemo, useEffect, useRef } from "react";
import PageToolbar from "./PageToolbar";

const RECENT_SKUS = ["DRB007", "DRB052", "SHPT2", "MSP010", "WF10833"];

const SKU_CATALOG = {
  DRB007: { desc: "Deformed Round Bar, 10mm x 6M g33", weight: "3.696 kg/pc" },
  DRB052: { desc: "Deformed Round Bar, 16mm x 6M g40", weight: "14.80 kg/pc" },
  SHPT2: { desc: "Sheet Pile T2, 400mm x 100mm x 10.5mm", weight: "576 kg/pc" },
  MSP010: { desc: "MS Plate, 6mm x 4' x 8'", weight: "—" },
  WF10833: { desc: "Wide Flange, 10 x 8 x 33# x 6M", weight: "—" },
};

const STOCK_IN_COLS = [
  "TRANS #", "DATE", "TDT PO #", "TDT PO DATE", "VENDOR #", "VENDOR NAME",
  "CUSTOMER'S NAME AS PER DR", "TDT WO #", "ACCEPTANCE DATE", "QTY", "COST/KILO",
  "COST/UNIT", "TOTAL PURCHASE", "RUNNING QTY", "AVG UNIT COST", "TOTAL VALUE", "REMARK",
];

const STOCK_OUT_COLS = [
  "TRANS #", "DISPATCH DATE", "TDT WO#", "CUSTOMER NAME", "TDT DR#", "BRANCH",
  "SUMMARY OF TDT BDR#", "TDT SI#", "QTY OUT", "UNIT COST", "TOTAL PRICE",
  "SERIES 1 — QTY / DATE", "SERIES 2 — QTY / DATE", "SERIES 3 — QTY / DATE",
  "RUNNING QTY", "RUNNING VALUE", "REMARKS",
];

const SEED_STOCK_IN = [
  { id: 1, transNo: "IN-001", date: "2026-03-02", tdtPo: "PO-2026-0142", tdtPoDate: "2026-03-01", vendorNo: "V-8821", vendorName: "Steel Asia Corp", customerDr: "—", tdtWo: "WO-4401", acceptDate: "2026-03-05", qty: 500, costKilo: 52.4, costUnit: 193.68, totalPurchase: 96840, runningQty: 500, avgUnitCost: 193.68, totalValue: 96840, remark: "" },
  { id: 2, transNo: "IN-002", date: "2026-03-10", tdtPo: "PO-2026-0150", tdtPoDate: "2026-03-08", vendorNo: "V-9012", vendorName: "Dragon Steel", customerDr: "RCM Builders", tdtWo: "WO-4410", acceptDate: "2026-03-12", qty: 200, costKilo: 51.8, costUnit: 191.45, totalPurchase: 38290, runningQty: 700, avgUnitCost: 193.05, totalValue: 135130, remark: "Partial" },
  { id: 3, transNo: "IN-003", date: "2026-03-18", tdtPo: "PO-2026-0155", tdtPoDate: "2026-03-15", vendorNo: "V-9100", vendorName: "Pag-asa Steel", customerDr: "—", tdtWo: "WO-4422", acceptDate: "2026-03-20", qty: 150, costKilo: 53.1, costUnit: 196.26, totalPurchase: 29439, runningQty: 850, avgUnitCost: 193.62, totalValue: 164569, remark: "" },
];

const SEED_STOCK_OUT = [
  { id: 1, transNo: "OUT-001", dispatchDate: "2026-03-06", tdtWo: "WO-5501", customer: "Michael Santiago", tdtDr: "DR1589415", branch: "Manila", bdrSummary: "BDR-2201", tdtSi: "SI-88421", qtyOut: 120, unitCost: 210, totalPrice: 25200, s1: "40 / Mar 5", s2: "40 / Mar 6", s3: "40 / Mar 6", runningQty: 380, runningValue: 79800, remarks: "" },
  { id: 2, transNo: "OUT-002", dispatchDate: "2026-03-14", tdtWo: "WO-5510", customer: "RCM Builders", tdtDr: "DR1589600", branch: "Manila", bdrSummary: "BDR-2210", tdtSi: "SI-88488", qtyOut: 80, unitCost: 208, totalPrice: 16640, s1: "80 / Mar 14", s2: "—", s3: "—", runningQty: 300, runningValue: 62400, remarks: "Delivered" },
  { id: 3, transNo: "OUT-003", dispatchDate: "2026-03-22", tdtWo: "WO-5520", customer: "Prime Builders Corp.", tdtDr: "DR1589722", branch: "Cebu", bdrSummary: "BDR-2220", tdtSi: "SI-88510", qtyOut: 60, unitCost: 212, totalPrice: 12720, s1: "30 / Mar 21", s2: "30 / Mar 22", s3: "—", runningQty: 240, runningValue: 50880, remarks: "" },
];

const PAGE_SIZE = 8;
const RIGHT_IN = new Set(["QTY", "COST/KILO", "COST/UNIT", "TOTAL PURCHASE", "RUNNING QTY", "AVG UNIT COST", "TOTAL VALUE"]);
const RIGHT_OUT = new Set(["QTY OUT", "UNIT COST", "TOTAL PRICE", "RUNNING QTY", "RUNNING VALUE"]);

function fmtPHP(n) {
  if (n === "—" || n === "") return "—";
  return "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function IconSearch({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>;
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

function Pagination({ currentPage, totalPages, onPage }) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      <button type="button" onClick={() => onPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.4 : 1 }}><IconChevronLeft size={14} /></button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 6).map((n) => (
        <button key={n} type="button" onClick={() => onPage(n)} style={{ width: 30, height: 30, border: n === currentPage ? "none" : "1px solid #e5e7eb", borderRadius: 6, background: n === currentPage ? "#e87c27" : "#fff", color: n === currentPage ? "#fff" : "#374151", cursor: "pointer", fontWeight: n === currentPage ? 700 : 400, fontSize: 12 }}>{n}</button>
      ))}
      <button type="button" onClick={() => onPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.4 : 1 }}><IconChevronRight size={14} /></button>
    </div>
  );
}

function SectionTable({ title, cols, rows, renderRow, rightAlign, pagination }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden", marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 0", flexWrap: "wrap", gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 14px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>{title}</span>
        {pagination}
      </div>
      <div style={{ overflowX: "auto", padding: "12px 0 0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ background: "#1c2235" }}>
              {cols.map((h) => (
                <th key={h} style={{ padding: "12px 10px", textAlign: rightAlign.has(h) ? "right" : "left", color: "#fff", fontWeight: 700, fontSize: 9, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={cols.length} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>No records for this SKU.</td></tr>
            ) : rows.map((row, idx) => renderRow(row, idx))}
          </tbody>
        </table>
      </div>
    </div>
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

function exportStockSheets(sku, skuInfo, stockInRows, stockOutRows) {
  if (!window.XLSX) { alert("SheetJS not loaded."); return; }
  const XLSX = window.XLSX;
  const wb = XLSX.utils.book_new();

  // Stock IN sheet
  const inHeaders = [
    ["TDT WAREHOUSE INVENTORY SHEET (TDT WIS)"],
    ["Stock Sheet — Stock IN for SKU: " + sku],
    ["PRODUCT:", skuInfo.desc, "", "WEIGHT:", skuInfo.weight],
    ["AS OF:", new Date().toLocaleString()],
    [],
    ["TRANS #","DATE","TDT PO #","TDT PO DATE","VENDOR #","VENDOR NAME","CUSTOMER'S NAME AS PER DR","TDT WO #","ACCEPTANCE DATE","QTY","COST/KILO","COST/UNIT","TOTAL PURCHASE","RUNNING QTY","AVG UNIT COST","TOTAL VALUE","REMARK"],
  ];
  const inData = stockInRows.map(r => [r.transNo, r.date, r.tdtPo, r.tdtPoDate, r.vendorNo, r.vendorName, r.customerDr, r.tdtWo, r.acceptDate, r.qty, r.costKilo, r.costUnit, r.totalPurchase, r.runningQty, r.avgUnitCost, r.totalValue, r.remark||"—"]);
  const wsIn = XLSX.utils.aoa_to_sheet([...inHeaders, ...inData]);
  wsIn["!cols"] = [{wch:10},{wch:12},{wch:16},{wch:12},{wch:10},{wch:18},{wch:22},{wch:10},{wch:14},{wch:8},{wch:10},{wch:12},{wch:14},{wch:12},{wch:14},{wch:14},{wch:18}];
  XLSX.utils.book_append_sheet(wb, wsIn, sku + " STOCK IN");

  // Stock OUT sheet
  const outHeaders = [
    ["TDT WAREHOUSE INVENTORY SHEET (TDT WIS)"],
    ["Stock Sheet — Stock OUT for SKU: " + sku],
    ["PRODUCT:", skuInfo.desc],
    ["AS OF:", new Date().toLocaleString()],
    [],
    ["TRANS #","DISPATCH DATE","TDT WO#","CUSTOMER NAME","TDT DR#","BRANCH","SUMMARY OF TDT BDR#","TDT SI#","QTY OUT","UNIT COST","TOTAL PRICE","SERIES 1 — QTY / DATE","SERIES 2 — QTY / DATE","SERIES 3 — QTY / DATE","RUNNING QTY","RUNNING VALUE","REMARKS"],
  ];
  const outData = stockOutRows.map(r => [r.transNo, r.dispatchDate, r.tdtWo, r.customer, r.tdtDr, r.branch, r.bdrSummary, r.tdtSi, r.qtyOut, r.unitCost, r.totalPrice, r.s1, r.s2, r.s3, r.runningQty, r.runningValue, r.remarks||"—"]);
  const wsOut = XLSX.utils.aoa_to_sheet([...outHeaders, ...outData]);
  wsOut["!cols"] = [{wch:10},{wch:14},{wch:12},{wch:20},{wch:14},{wch:10},{wch:14},{wch:12},{wch:8},{wch:12},{wch:14},{wch:18},{wch:18},{wch:18},{wch:12},{wch:14},{wch:14}];
  XLSX.utils.book_append_sheet(wb, wsOut, sku + " STOCK OUT");

  XLSX.writeFile(wb, "TDT_WIS_Stock_Sheet_" + sku + ".xlsx");
}

function importStockSheets(file, onInDone, onOutDone, onError) {
  if (!window.XLSX) { onError("SheetJS not loaded."); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const wb = window.XLSX.read(new Uint8Array(e.target.result), { type: "array" });
      const toNum = (v) => { if (!v && v !== 0) return 0; const n = parseFloat(String(v).replace(/,/g, "")); return isNaN(n) ? 0 : n; };
      const parseSheet = (ws, colMap) => {
        if (!ws) return [];
        const raw = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false });
        let start = 0;
        for (let i = 0; i < Math.min(raw.length, 15); i++) {
          if (raw[i] && raw[i].some(v => typeof v === "string" && v.toUpperCase().includes("TRANS"))) { start = i + 1; break; }
        }
        const result = [];
        for (let i = start; i < raw.length; i++) {
          const r = raw[i]; if (!r || !r[0] || String(r[0]).trim() === "") continue;
          const row = { id: i - start + 1 };
          colMap.forEach(([field, idx, numeric]) => { row[field] = numeric ? toNum(r[idx]) : String(r[idx] ?? ""); });
          result.push(row);
        }
        return result;
      };

      // Find IN and OUT sheets
      const inSheetName = wb.SheetNames.find(n => n.toUpperCase().includes("IN")) || wb.SheetNames[0];
      const outSheetName = wb.SheetNames.find(n => n.toUpperCase().includes("OUT")) || wb.SheetNames[1] || wb.SheetNames[0];

      const inCols = [
        ["transNo",0,false],["date",1,false],["tdtPo",2,false],["tdtPoDate",3,false],
        ["vendorNo",4,false],["vendorName",5,false],["customerDr",6,false],["tdtWo",7,false],
        ["acceptDate",8,false],["qty",9,true],["costKilo",10,true],["costUnit",11,true],
        ["totalPurchase",12,true],["runningQty",13,true],["avgUnitCost",14,true],
        ["totalValue",15,true],["remark",16,false],
      ];
      const outCols = [
        ["transNo",0,false],["dispatchDate",1,false],["tdtWo",2,false],["customer",3,false],
        ["tdtDr",4,false],["branch",5,false],["bdrSummary",6,false],["tdtSi",7,false],
        ["qtyOut",8,true],["unitCost",9,true],["totalPrice",10,true],
        ["s1",11,false],["s2",12,false],["s3",13,false],
        ["runningQty",14,true],["runningValue",15,true],["remarks",16,false],
      ];

      const inRows = parseSheet(wb.Sheets[inSheetName], inCols);
      const outRows = parseSheet(wb.Sheets[outSheetName], outCols);
      if (!inRows.length && !outRows.length) throw new Error("No data rows found.");
      onInDone(inRows);
      onOutDone(outRows);
    } catch(err) { onError(err.message); }
  };
  reader.readAsArrayBuffer(file);
}

export default function StockSheetsPage() {
  const xlsxReady = useSheetJS();
  const [searchSku, setSearchSku] = useState("DRB007");
  const [activeTab, setActiveTab] = useState("all");
  const [inPage, setInPage] = useState(1);
  const [outPage, setOutPage] = useState(1);
  const [stockInData, setStockInData] = useState(SEED_STOCK_IN);
  const [stockOutData, setStockOutData] = useState(SEED_STOCK_OUT);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState(null);
  const importRef = useRef(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const skuKey = searchSku.trim().toUpperCase();
  const skuInfo = SKU_CATALOG[skuKey] || { desc: "—", weight: "—" };

  const stockInRows = useMemo(() => {
    if (!skuKey || skuKey === "DRB007") return stockInData;
    return stockInData.filter((_, i) => i < 1);
  }, [skuKey, stockInData]);

  const stockOutRows = useMemo(() => {
    if (!skuKey || skuKey === "DRB007") return stockOutData;
    return stockOutData.filter((_, i) => i < 1);
  }, [skuKey, stockOutData]);

  const inTotalPages = Math.max(1, Math.ceil(stockInRows.length / PAGE_SIZE));
  const outTotalPages = Math.max(1, Math.ceil(stockOutRows.length / PAGE_SIZE));
  const pagedIn = stockInRows.slice((inPage - 1) * PAGE_SIZE, inPage * PAGE_SIZE);
  const pagedOut = stockOutRows.slice((outPage - 1) * PAGE_SIZE, outPage * PAGE_SIZE);

  const showIn = activeTab === "all" || activeTab === "in";
  const showOut = activeTab === "all" || activeTab === "out";

  const tabs = [
    { id: "all", label: "All Transactions" },
    { id: "in", label: "Stock IN" },
    { id: "out", label: "Stock OUT" },
  ];

  return (
    <div style={{ background: "#f0f2f5", padding: "28px 32px 40px", display: "flex", flexDirection: "column", gap: 18 }}>

      <PageToolbar
        searchValue={searchSku}
        onSearchChange={(v) => { setSearchSku(v); setInPage(1); setOutPage(1); }}
        primaryAction={{ label: "New Stock Sheet", onClick: () => {} }}
        row1End={
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flex: "1 1 300px" }}>
            <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>Recent:</span>
            {RECENT_SKUS.map((sku) => {
              const active = skuKey === sku;
              return (
                <button
                  key={sku}
                  type="button"
                  onClick={() => { setSearchSku(sku); setInPage(1); setOutPage(1); }}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 20,
                    border: "none",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    background: active ? "#e87c27" : "#f3f4f6",
                    color: active ? "#fff" : "#6b7280",
                  }}
                >
                  {sku}
                </button>
              );
            })}
          </div>
        }
        importExport={{
          fileInputRef: importRef,
          onFileChange: (e) => {
            const file = e.target.files?.[0]; if (!file) return;
            setImporting(true);
            importStockSheets(
              file,
              (inRows) => { setStockInData(inRows); setInPage(1); },
              (outRows) => { setStockOutData(outRows); setOutPage(1); setImporting(false); showToast(`Imported stock sheet from ${file.name}`); },
              (err) => { setImporting(false); showToast(`Import failed: ${err}`, "error"); }
            );
            e.target.value = "";
          },
          importing,
          importDisabled: !xlsxReady,
          importLabel: "Import WIS",
          onExport: () => exportStockSheets(skuKey, skuInfo, stockInRows, stockOutRows),
        }}
      />

      <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
        <div style={{ display: "flex", flex: "1 1 0", gap: 28, flexWrap: "wrap", minWidth: 0 }}>
          <div style={{ flex: "0 0 auto", minWidth: 110 }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#9ca3af", letterSpacing: "0.14em", textTransform: "uppercase" }}>SKU NUMBER</p>
            <p style={{ margin: "8px 0 0", fontSize: 22, fontWeight: 900, color: "#e87c27" }}>{skuKey || "—"}</p>
          </div>
          <div style={{ flex: "1 1 220px", minWidth: 200, borderLeft: "1px solid #eef0f3", paddingLeft: 28 }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#9ca3af", letterSpacing: "0.14em", textTransform: "uppercase" }}>PRODUCT DESCRIPTION</p>
            <p style={{ margin: "8px 0 0", fontSize: 15, fontWeight: 600, color: "#111827", lineHeight: 1.45 }}>{skuInfo.desc}</p>
          </div>
          <div style={{ flex: "0 0 auto", minWidth: 100, borderLeft: "1px solid #eef0f3", paddingLeft: 28 }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#9ca3af", letterSpacing: "0.12em", textTransform: "uppercase" }}>WEIGHT</p>
            <p style={{ margin: "8px 0 0", fontSize: 16, fontWeight: 800, color: "#111827" }}>{skuInfo.weight}</p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: "10px 18px",
              border: "none",
              borderRadius: "8px 8px 0 0",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              background: activeTab === t.id ? "#e87c27" : "transparent",
              color: activeTab === t.id ? "#fff" : "#6b7280",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {showIn && (
        <SectionTable
          title="Received Purchases — Stock IN"
          cols={STOCK_IN_COLS}
          rows={pagedIn}
          rightAlign={RIGHT_IN}
          pagination={<Pagination currentPage={inPage} totalPages={inTotalPages} onPage={setInPage} />}
          renderRow={(row, idx) => (
            <tr key={row.id} style={{ borderBottom: "1px solid #f3f4f6", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
              <td style={{ padding: "10px", color: "#6b7280", fontWeight: 600 }}>{row.transNo}</td>
              <td style={{ padding: "10px", whiteSpace: "nowrap" }}>{row.date}</td>
              <td style={{ padding: "10px", color: "#e87c27", fontWeight: 700 }}>{row.tdtPo}</td>
              <td style={{ padding: "10px" }}>{row.tdtPoDate}</td>
              <td style={{ padding: "10px" }}>{row.vendorNo}</td>
              <td style={{ padding: "10px" }}>{row.vendorName}</td>
              <td style={{ padding: "10px" }}>{row.customerDr}</td>
              <td style={{ padding: "10px" }}>{row.tdtWo}</td>
              <td style={{ padding: "10px" }}>{row.acceptDate}</td>
              <td style={{ padding: "10px", textAlign: "right", fontWeight: 700 }}>{row.qty}</td>
              <td style={{ padding: "10px", textAlign: "right" }}>{row.costKilo}</td>
              <td style={{ padding: "10px", textAlign: "right" }}>{fmtPHP(row.costUnit)}</td>
              <td style={{ padding: "10px", textAlign: "right", fontWeight: 600 }}>{fmtPHP(row.totalPurchase)}</td>
              <td style={{ padding: "10px", textAlign: "right", fontWeight: 700 }}>{row.runningQty}</td>
              <td style={{ padding: "10px", textAlign: "right" }}>{fmtPHP(row.avgUnitCost)}</td>
              <td style={{ padding: "10px", textAlign: "right", fontWeight: 600 }}>{fmtPHP(row.totalValue)}</td>
              <td style={{ padding: "10px", color: "#6b7280" }}>{row.remark || "—"}</td>
            </tr>
          )}
        />
      )}

      {showOut && (
        <SectionTable
          title="Delivered Goods — Stock OUT"
          cols={STOCK_OUT_COLS}
          rows={pagedOut}
          rightAlign={RIGHT_OUT}
          pagination={<Pagination currentPage={outPage} totalPages={outTotalPages} onPage={setOutPage} />}
          renderRow={(row, idx) => (
            <tr key={row.id} style={{ borderBottom: "1px solid #f3f4f6", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
              <td style={{ padding: "10px", color: "#6b7280", fontWeight: 600 }}>{row.transNo}</td>
              <td style={{ padding: "10px", whiteSpace: "nowrap" }}>{row.dispatchDate}</td>
              <td style={{ padding: "10px" }}>{row.tdtWo}</td>
              <td style={{ padding: "10px", fontWeight: 600 }}>{row.customer}</td>
              <td style={{ padding: "10px", color: "#e87c27", fontWeight: 700 }}>{row.tdtDr}</td>
              <td style={{ padding: "10px" }}>{row.branch}</td>
              <td style={{ padding: "10px" }}>{row.bdrSummary}</td>
              <td style={{ padding: "10px" }}>{row.tdtSi}</td>
              <td style={{ padding: "10px", textAlign: "right", fontWeight: 700 }}>{row.qtyOut}</td>
              <td style={{ padding: "10px", textAlign: "right" }}>{fmtPHP(row.unitCost)}</td>
              <td style={{ padding: "10px", textAlign: "right", fontWeight: 600 }}>{fmtPHP(row.totalPrice)}</td>
              <td style={{ padding: "10px", fontSize: 11 }}>{row.s1}</td>
              <td style={{ padding: "10px", fontSize: 11 }}>{row.s2}</td>
              <td style={{ padding: "10px", fontSize: 11 }}>{row.s3}</td>
              <td style={{ padding: "10px", textAlign: "right", fontWeight: 700 }}>{row.runningQty}</td>
              <td style={{ padding: "10px", textAlign: "right" }}>{fmtPHP(row.runningValue)}</td>
              <td style={{ padding: "10px", color: "#6b7280" }}>{row.remarks || "—"}</td>
            </tr>
          )}
        />
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, paddingTop: 4 }}>
        <span style={{ fontSize: 12, color: "#6b7280" }}>All Transactions — March 2026</span>
        <Pagination currentPage={outPage} totalPages={outTotalPages} onPage={setOutPage} />
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, background: toast.type === "error" ? "#dc2626" : "#16a34a", color: "#fff", borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}