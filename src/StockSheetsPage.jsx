import { useState, useMemo, useEffect, useRef } from "react";
import PageToolbar from "./PageToolbar";
import { SEED_STOCK_IN, SEED_STOCK_OUT } from "./stockTransactionSeeds";

const RECENT_SKUS = [
  "DRB007", "DRB050", "DRB052", "DRB051", "SHPT2", "SHPT3",
  "MSP010", "MSP018", "JINXI", "WF016", "WF10833", "DRB008",
];

const SKU_CATALOG = {
  DRB007: { desc: "Deformed Round Bar, 10mm x 6M g33", weight: "3.696 kg/pc" },
  DRB008: { desc: "Deformed Round Bar, 12mm x 6M g33", weight: "5.328 kg/pc" },
  DRB050: { desc: "Deformed Round Bar, 10mm x 6M g40", weight: "3.696 kg/pc" },
  DRB051: { desc: "Deformed Round Bar, 12mm x 6M g40", weight: "5.328 kg/pc" },
  DRB052: { desc: "Deformed Round Bar, 16mm x 6M g40", weight: "14.80 kg/pc" },
  SHPT2: { desc: "Sheet Pile T2, 400mm x 100mm x 10.5mm", weight: "576 kg/pc" },
  SHPT3: { desc: "Sheet Pile T3, 400mm x 125mm x 13mm x 12M", weight: "720 kg/pc" },
  MSP010: { desc: "MS Plate, 6mm x 4' x 8'", weight: "—" },
  MSP018: { desc: "MS Plate, 12mm x 4' x 8'", weight: "—" },
  JINXI: { desc: "Sheet Pile, Z-Pile 770mm W x 354mm H x 12M", weight: "878.40 kg/pc" },
  WF016: { desc: "Wide Flange, 8 x 4 x 10# x 6M", weight: "—" },
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

function SectionTable({ title, cols, rows, renderRow, rightAlign, pagination, searchSku }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden", marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 12px", flexWrap: "wrap", gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 14px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>{title}</span>
      </div>
      <div style={{ overflowX: "auto", padding: "0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ background: "#1c2235" }}>
              {cols.map((h) => (
                <th key={h} style={{ padding: "12px 10px", textAlign: rightAlign.has(h) ? "right" : "center", color: "#fff", fontWeight: 700, fontSize: 9, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={cols.length} style={{ textAlign: "center", padding: "48px 20px", color: "#9ca3af" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
                No records found{searchSku ? <> for SKU <strong style={{ color: "#374151" }}>"{searchSku}"</strong></> : ""}.
              </td></tr>
            ) : rows.map((row, idx) => renderRow(row, idx))}
          </tbody>
        </table>
      </div>
      {pagination && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "14px 20px", borderTop: "1px solid #f3f4f6", background: "#fafafa" }}>
          {pagination}
        </div>
      )}
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
  const inData = stockInRows.map(r => [r.transNo, r.date, r.tdtPo, r.tdtPoDate, r.vendorNo, r.vendorName, r.customerDr, r.tdtWo, r.acceptDate, r.qty, r.costKilo != null ? parseFloat(Number(r.costKilo).toFixed(2)) : "", r.costUnit, r.totalPurchase, r.runningQty, r.avgUnitCost, r.totalValue, r.remark||"—"]);
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

export default function StockSheetsPage({
  stockInData: propStockIn,
  setStockInData: setPropStockIn,
  stockOutData: propStockOut,
  setStockOutData: setPropStockOut,
}) {
  const xlsxReady = useSheetJS();
  const [searchSku, setSearchSku] = useState("DRB007");
  const [activeTab, setActiveTab] = useState("all");
  const [inPage, setInPage] = useState(1);
  const [outPage, setOutPage] = useState(1);
  const [localStockIn, setLocalStockIn] = useState(SEED_STOCK_IN);
  const [localStockOut, setLocalStockOut] = useState(SEED_STOCK_OUT);
  const stockInData = propStockIn ?? localStockIn;
  const setStockInData = setPropStockIn ?? setLocalStockIn;
  const stockOutData = propStockOut ?? localStockOut;
  const setStockOutData = setPropStockOut ?? setLocalStockOut;
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ type: "in", date: "", sku: "", description: "", qty: "", unitCost: "", ref: "", customer: "" });
  const importRef = useRef(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const skuKey = searchSku.trim().toUpperCase();
  const skuInfo = SKU_CATALOG[skuKey] || { desc: "—", weight: "—" };

  const stockInRows = useMemo(() => {
    if (!skuKey) return stockInData;
    return stockInData.filter((r) => r.sku === skuKey);
  }, [skuKey, stockInData]);

  const stockOutRows = useMemo(() => {
    if (!skuKey) return stockOutData;
    return stockOutData.filter((r) => r.sku === skuKey);
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
        primaryAction={{ label: "New Stock Sheet", onClick: () => setShowCreate(true) }}
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
          searchSku={searchSku}
          pagination={<Pagination currentPage={inPage} totalPages={inTotalPages} onPage={setInPage} />}
          renderRow={(row, idx) => (
            <tr key={row.id} style={{ borderBottom: "1px solid #f3f4f6", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
              <td style={{ padding: "10px", color: "#6b7280", fontWeight: 600, textAlign: "center" }}>{row.transNo}</td>
              <td style={{ padding: "10px", whiteSpace: "nowrap", textAlign: "center" }}>{row.date}</td>
              <td style={{ padding: "10px", color: "#e87c27", fontWeight: 700, textAlign: "center" }}>{row.tdtPo}</td>
              <td style={{ padding: "10px", textAlign: "center" }}>{row.tdtPoDate}</td>
              <td style={{ padding: "10px", textAlign: "center" }}>{row.vendorNo}</td>
              <td style={{ padding: "10px", textAlign: "center" }}>{row.vendorName}</td>
              <td style={{ padding: "10px", textAlign: "center" }}>{row.customerDr}</td>
              <td style={{ padding: "10px", textAlign: "center" }}>{row.tdtWo}</td>
              <td style={{ padding: "10px", textAlign: "center" }}>{row.acceptDate}</td>
              <td style={{ padding: "10px", textAlign: "right", fontWeight: 700 }}>{row.qty}</td>
              <td style={{ padding: "10px", textAlign: "center" }}>{row.costKilo != null && row.costKilo !== "" ? parseFloat(Number(row.costKilo).toFixed(2)) : "—"}</td>
              <td style={{ padding: "10px", textAlign: "right" }}>{fmtPHP(row.costUnit)}</td>
              <td style={{ padding: "10px", textAlign: "right", fontWeight: 600 }}>{fmtPHP(row.totalPurchase)}</td>
              <td style={{ padding: "10px", textAlign: "right", fontWeight: 700 }}>{row.runningQty}</td>
              <td style={{ padding: "10px", textAlign: "right" }}>{fmtPHP(row.avgUnitCost)}</td>
              <td style={{ padding: "10px", textAlign: "right", fontWeight: 600 }}>{fmtPHP(row.totalValue)}</td>
              <td style={{ padding: "10px", color: "#6b7280", textAlign: "center" }}>{row.remark || "—"}</td>
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
          searchSku={searchSku}
          pagination={<Pagination currentPage={outPage} totalPages={outTotalPages} onPage={setOutPage} />}
          renderRow={(row, idx) => (
            <tr key={row.id} style={{ borderBottom: "1px solid #f3f4f6", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
              <td style={{ padding: "10px", color: "#6b7280", fontWeight: 600, textAlign: "center" }}>{row.transNo}</td>
              <td style={{ padding: "10px", whiteSpace: "nowrap", textAlign: "center" }}>{row.dispatchDate}</td>
              <td style={{ padding: "10px", textAlign: "center" }}>{row.tdtWo}</td>
              <td style={{ padding: "10px", fontWeight: 600, textAlign: "center" }}>{row.customer}</td>
              <td style={{ padding: "10px", color: "#e87c27", fontWeight: 700, textAlign: "center" }}>{row.tdtDr}</td>
              <td style={{ padding: "10px", textAlign: "center" }}>{row.branch}</td>
              <td style={{ padding: "10px", textAlign: "center" }}>{row.bdrSummary}</td>
              <td style={{ padding: "10px", textAlign: "center" }}>{row.tdtSi}</td>
              <td style={{ padding: "10px", textAlign: "right", fontWeight: 700 }}>{row.qtyOut}</td>
              <td style={{ padding: "10px", textAlign: "right" }}>{fmtPHP(row.unitCost)}</td>
              <td style={{ padding: "10px", textAlign: "right", fontWeight: 600 }}>{fmtPHP(row.totalPrice)}</td>
              <td style={{ padding: "10px", fontSize: 11, textAlign: "center" }}>{row.s1}</td>
              <td style={{ padding: "10px", fontSize: 11, textAlign: "center" }}>{row.s2}</td>
              <td style={{ padding: "10px", fontSize: 11, textAlign: "center" }}>{row.s3}</td>
              <td style={{ padding: "10px", textAlign: "right", fontWeight: 700 }}>{row.runningQty}</td>
              <td style={{ padding: "10px", textAlign: "right" }}>{fmtPHP(row.runningValue)}</td>
              <td style={{ padding: "10px", color: "#6b7280", textAlign: "center" }}>{row.remarks || "—"}</td>
            </tr>
          )}
        />
      )}



      {toast && (
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, background: toast.type === "error" ? "#dc2626" : "#16a34a", color: "#fff", borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}>
          {toast.msg}
        </div>
      )}

      {showCreate && (
        <>
          <div onClick={() => setShowCreate(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 1100 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 1200, background: "#fff", borderRadius: 16, width: "min(520px,95vw)", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111827" }}>New Stock Sheet Entry</h2>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "#6b7280" }}>Add a stock in or stock out transaction</p>
              </div>
              <button type="button" onClick={() => setShowCreate(false)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, width: 34, height: 34, cursor: "pointer", color: "#4b5563", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", gap: 8 }}>
                {["in", "out"].map(t => (
                  <button key={t} type="button" onClick={() => setCreateForm(f => ({ ...f, type: t }))}
                    style={{ flex: 1, padding: "10px 16px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700,
                      background: createForm.type === t ? (t === "in" ? "#dcfce7" : "#fee2e2") : "#f3f4f6",
                      color: createForm.type === t ? (t === "in" ? "#16a34a" : "#dc2626") : "#6b7280" }}>
                    {t === "in" ? "▲ Stock In" : "▼ Stock Out"}
                  </button>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" }}>
                {[
                  { label: "Date", key: "date", type: "date" },
                  { label: "SKU Code", key: "sku", type: "text", placeholder: "e.g. DRB052" },
                  { label: "Item Description", key: "description", type: "text", placeholder: "e.g. Deformed Round Bar...", full: true },
                  { label: "Quantity", key: "qty", type: "number", placeholder: "0" },
                  { label: "Unit Cost (₱)", key: "unitCost", type: "number", placeholder: "0.00" },
                  { label: createForm.type === "in" ? "Reference / PO No." : "Customer / DR No.", key: "ref", type: "text", placeholder: createForm.type === "in" ? "e.g. PO-001" : "e.g. DR26050" },
                ].map(({ label, key, type, placeholder, full }) => (
                  <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: full ? "1 / -1" : undefined }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</label>
                    <input type={type} value={createForm[key]} onChange={e => setCreateForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      style={{ padding: "9px 12px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 8, fontFamily: "inherit", outline: "none" }}
                      onFocus={e => { e.target.style.borderColor = "#e87c27"; e.target.style.boxShadow = "0 0 0 3px rgba(232,124,39,0.18)"; }}
                      onBlur={e => { e.target.style.borderColor = "#d1d5db"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: "14px 24px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 10, justifyContent: "flex-end", background: "#fafafa" }}>
              <button type="button" onClick={() => setShowCreate(false)} style={{ padding: "10px 20px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151" }}>Cancel</button>
              <button type="button" onClick={() => {
                if (!createForm.date || !createForm.sku || !createForm.qty) {
                  setToast({ msg: "Please fill in Date, SKU, and Quantity.", type: "error" });
                  setTimeout(() => setToast(null), 3000);
                  return;
                }
                const entry = { id: Date.now(), date: createForm.date, sku: createForm.sku.toUpperCase(), description: createForm.description, qty: Number(createForm.qty) || 0, unitCost: Number(createForm.unitCost) || 0, ref: createForm.ref };
                if (createForm.type === "in") {
                  setStockInData(prev => [entry, ...prev]);
                } else {
                  setStockOutData(prev => [entry, ...prev]);
                }
                setShowCreate(false);
                setCreateForm({ type: "in", date: "", sku: "", description: "", qty: "", unitCost: "", ref: "" });
                setToast({ msg: "Stock sheet entry added successfully.", type: "success" });
                setTimeout(() => setToast(null), 3000);
              }} style={{ padding: "10px 20px", background: "#e87c27", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                Add Entry
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}