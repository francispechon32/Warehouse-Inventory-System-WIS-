import { useState, useMemo } from "react";
import { productSearchInputStyle } from "./searchFieldStyles";

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

export default function StockSheetsPage() {
  const [searchSku, setSearchSku] = useState("DRB007");
  const [activeTab, setActiveTab] = useState("all");
  const [inPage, setInPage] = useState(1);
  const [outPage, setOutPage] = useState(1);

  const skuKey = searchSku.trim().toUpperCase();
  const skuInfo = SKU_CATALOG[skuKey] || { desc: "—", weight: "—" };

  const stockInRows = useMemo(() => {
    if (!skuKey || skuKey === "DRB007") return SEED_STOCK_IN;
    return SEED_STOCK_IN.filter((_, i) => i < 1);
  }, [skuKey]);

  const stockOutRows = useMemo(() => {
    if (!skuKey || skuKey === "DRB007") return SEED_STOCK_OUT;
    return SEED_STOCK_OUT.filter((_, i) => i < 1);
  }, [skuKey]);

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

      <div style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#374151", flexShrink: 0 }}>Search SKU:</span>
          <div style={{ position: "relative", flex: "1 1 200px", maxWidth: 280 }}>
            <input
              type="text"
              value={searchSku}
              onChange={(e) => { setSearchSku(e.target.value); setInPage(1); setOutPage(1); }}
              style={{ ...productSearchInputStyle, paddingLeft: 12 }}
            />
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#374151", pointerEvents: "none" }}><IconSearch size={16} /></span>
          </div>
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
        </div>
      </div>

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
        <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
          <button type="button" style={{ padding: "10px 18px", background: "#e87c27", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
            <IconPlus size={16} />
            New Stock Sheet
          </button>
          <button type="button" style={{ padding: "10px 18px", border: "1px solid #b8bec9", borderRadius: 8, background: "#fff", cursor: "pointer", color: "#374151", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, justifyContent: "center", boxShadow: "inset 0 1px 2px rgba(15,23,42,0.04)" }}>
            <IconDownload size={16} />
            Export WIS
          </button>
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
    </div>
  );
}
