import { useState, useMemo, useEffect, useRef } from "react";
import XLSX from "xlsx-js-style";
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
  return true; // XLSX is imported as a module, always available
}

function IconUpload2({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
}

const SS_PESO_FMT = '"₱"#,##0.00';
const SS_QTY_FMT = "#,##0";
const SS_MIN_DATA_ROWS = 15;
const SS_TRANS_START = 33;

function formatSsDate(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function parseSkuWeight(weightStr) {
  if (!weightStr || weightStr === "—") return weightStr;
  const m = String(weightStr).match(/[\d.]+/);
  return m ? m[0] : weightStr;
}

function ssTransNo(row, index, base = SS_TRANS_START) {
  const m = String(row?.transNo ?? "").match(/\d+/);
  return m ? Number(m[0]) : base + index;
}

function buildSsSheetStyles() {
  const sheetFill = { patternType: "solid", fgColor: { rgb: "FFF9E6" } };
  const hdrFill = { patternType: "solid", fgColor: { rgb: "F4B084" } };
  const yellowFill = { patternType: "solid", fgColor: { rgb: "FFEB9C" } };
  const totalFill = { patternType: "solid", fgColor: { rgb: "C65911" } };
  const greyFill = { patternType: "solid", fgColor: { rgb: "D9D9D9" } };
  const solidBorder = {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
  };
  const dottedRed = {
    top: { style: "dotted", color: { rgb: "C00000" } },
    bottom: { style: "dotted", color: { rgb: "C00000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
  };
  const underline = { bottom: { style: "thin", color: { rgb: "843C0C" } } };
  const f = {
    title: () => ({ name: "Arial", sz: 14, bold: true, color: { rgb: "E87C27" } }),
    metaLabel: () => ({ name: "Arial", sz: 10, bold: true, color: { rgb: "000000" } }),
    metaVal: () => ({ name: "Arial", sz: 10, color: { rgb: "000000" } }),
    insert: () => ({ name: "Arial", sz: 8, bold: true, color: { rgb: "E87C27" } }),
    hdr: (white = false) => ({
      name: "Arial", sz: 8, bold: true,
      color: { rgb: white ? "FFFFFF" : "000000" },
    }),
    body: () => ({ name: "Arial", sz: 9, color: { rgb: "000000" } }),
    link: () => ({ name: "Arial", sz: 9, color: { rgb: "0563C1" }, underline: true }),
  };
  const center = { horizontal: "center", vertical: "center", wrapText: true };
  const left = { horizontal: "left", vertical: "center", wrapText: true, indent: 1 };
  const right = { horizontal: "right", vertical: "center" };
  return {
    sheetFill, hdrFill, yellowFill, totalFill, greyFill,
    solidBorder, dottedRed, underline, f, center, left, right,
  };
}

function writeSsMeta(ws, C, put, merges, styles, sku, skuInfo, location = "POLYLAND WAREHOUSE") {
  const { sheetFill, underline, f, left, center } = styles;
  put(0, 0, "TDT WAREHOUSE INVENTORY SHEET (TDT WIS)", "s", {
    font: f.title(), alignment: left, fill: sheetFill,
  });
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } });
  put(0, 9, "HOME", "s", { font: f.link(), alignment: center, fill: sheetFill });

  const meta = [
    ["LOCATION", location],
    ["PRODUCT DESCRIPTION", skuInfo.desc || "—"],
    ["SKU NUMBER", sku],
    ["WEIGHT", parseSkuWeight(skuInfo.weight)],
  ];
  meta.forEach(([label, value], i) => {
    const row = 1 + i;
    put(row, 0, label, "s", { font: f.metaLabel(), alignment: left, fill: sheetFill });
    put(row, 1, ":", "s", { font: f.metaLabel(), alignment: center, fill: sheetFill });
    put(row, 2, value, "s", {
      font: f.metaVal(), alignment: left, fill: sheetFill, border: underline,
    });
    merges.push({ s: { r: row, c: 2 }, e: { r: row, c: 6 } });
  });

  put(0, 12, "TDT POWERSTEEL", "s", {
    font: { name: "Arial", sz: 12, bold: true, color: { rgb: "E87C27" } },
    alignment: center, fill: sheetFill,
  });
  put(1, 12, "THE NO. 1 STEEL SUPPLIER", "s", {
    font: { name: "Arial", sz: 8, bold: true, color: { rgb: "000000" } },
    alignment: center, fill: sheetFill,
  });
  merges.push({ s: { r: 0, c: 12 }, e: { r: 0, c: 15 } });
  merges.push({ s: { r: 1, c: 12 }, e: { r: 1, c: 15 } });
}

function putPeso(put, r, c, val, styleBase) {
  const n = Number(val);
  if (!n) {
    put(r, c, "₱ -", "s", styleBase);
    return;
  }
  put(r, c, n, "n", { ...styleBase, numFmt: SS_PESO_FMT });
}

function buildStockInWorksheet(sku, skuInfo, rows) {
  const styles = buildSsSheetStyles();
  const ws = {};
  const merges = [];
  const C = (r, col) => XLSX.utils.encode_cell({ r, c: col });
  const put = (r, c, v, t, s) => { ws[C(r, c)] = { v: v ?? "", t: t || (typeof v === "number" ? "n" : "s"), s }; };

  writeSsMeta(ws, C, put, merges, styles, sku, skuInfo);

  const HDR_ROW = 5;
  const DATA_START = 6;
  const LAST_COL = STOCK_IN_COLS.length - 1;
  const { hdrFill, yellowFill, totalFill, solidBorder, dottedRed, f, center, left, right } = styles;

  const rightInSet = RIGHT_IN;
  STOCK_IN_COLS.forEach((h, ci) => {
    const isQty = rightInSet.has(h);
    put(HDR_ROW, ci, h, "s", {
      font: f.hdr(false),
      fill: ["QTY","COST/KILO","COST/UNIT"].includes(h) ? yellowFill : ["TOTAL PURCHASE","RUNNING QTY","AVG UNIT COST","TOTAL VALUE"].includes(h) ? totalFill : hdrFill,
      alignment: center,
      border: solidBorder,
    });
  });

  const slotCount = Math.max(rows.length, SS_MIN_DATA_ROWS);
  for (let i = 0; i < slotCount; i++) {
    const ri = DATA_START + i;
    const row = rows[i];
    const dataStyle = { font: f.body(), fill: styles.sheetFill, border: dottedRed };

    if (!row) {
      STOCK_IN_COLS.forEach((h, ci) => {
        const isPeso = ["COST/KILO","COST/UNIT","TOTAL PURCHASE","AVG UNIT COST","TOTAL VALUE"].includes(h);
        const isNum = ["QTY","RUNNING QTY"].includes(h);
        put(ri, ci, isPeso ? "₱ -" : isNum ? 0 : "", isPeso ? "s" : "n", {
          ...dataStyle, alignment: rightInSet.has(h) ? right : center,
          ...(isNum ? { numFmt: SS_QTY_FMT } : {}),
        });
      });
      continue;
    }

    const vals = [
      row.transNo || i + 1,
      formatSsDate(row.date),
      row.tdtPo || "",
      formatSsDate(row.tdtPoDate),
      row.vendorNo || "",
      row.vendorName || "",
      row.customerDr || "",
      row.tdtWo || "",
      formatSsDate(row.acceptDate),
      row.qty ?? 0,
      row.costKilo ?? "",
      row.costUnit ?? 0,
      row.totalPurchase ?? 0,
      row.runningQty ?? 0,
      row.avgUnitCost ?? 0,
      row.totalValue ?? 0,
      row.remark || "",
    ];
    STOCK_IN_COLS.forEach((h, ci) => {
      const v = vals[ci];
      const isPeso = ["COST/KILO","COST/UNIT","TOTAL PURCHASE","AVG UNIT COST","TOTAL VALUE"].includes(h);
      const isNum = ["QTY","RUNNING QTY"].includes(h);
      const align = rightInSet.has(h) ? right : h === "CUSTOMER'S NAME AS PER DR" || h === "VENDOR NAME" ? left : center;
      if (isPeso && !v) {
        put(ri, ci, "₱ -", "s", { ...dataStyle, alignment: right });
      } else if (isPeso) {
        put(ri, ci, Number(v), "n", { ...dataStyle, alignment: right, numFmt: SS_PESO_FMT });
      } else if (isNum) {
        put(ri, ci, Number(v) || 0, "n", { ...dataStyle, alignment: right, numFmt: SS_QTY_FMT });
      } else {
        put(ri, ci, String(v ?? ""), "s", { ...dataStyle, alignment: align });
      }
    });
  }

  const lastRow = DATA_START + slotCount - 1;
  ws["!ref"] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: lastRow, c: LAST_COL });
  ws["!merges"] = merges;
  ws["!cols"] = [
    { wch: 8 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 18 },
    { wch: 26 }, { wch: 11 }, { wch: 14 }, { wch: 8 }, { wch: 10 },
    { wch: 12 }, { wch: 14 }, { wch: 11 }, { wch: 14 }, { wch: 14 }, { wch: 20 },
  ];
  ws["!rows"] = [
    { hpt: 22 }, { hpt: 18 }, { hpt: 18 }, { hpt: 18 }, { hpt: 18 },
    { hpt: 36 }, ...Array(slotCount).fill({ hpt: 22 }),
  ];
  return ws;
}

function buildStockOutWorksheet(sku, skuInfo, rows) {
  const styles = buildSsSheetStyles();
  const ws = {};
  const merges = [];
  const C = (r, col) => XLSX.utils.encode_cell({ r, c: col });
  const put = (r, c, v, t, s) => { ws[C(r, c)] = { v: v ?? "", t: t || (typeof v === "number" ? "n" : "s"), s }; };

  writeSsMeta(ws, C, put, merges, styles, sku, skuInfo);

  const HDR_ROW = 5;
  const DATA_START = 6;
  const LAST_COL = STOCK_OUT_COLS.length - 1;
  const { hdrFill, totalFill, solidBorder, dottedRed, f, center, left, right } = styles;

  const rightOutSet = RIGHT_OUT;
  STOCK_OUT_COLS.forEach((h, ci) => {
    put(HDR_ROW, ci, h, "s", {
      font: f.hdr(false),
      fill: ["QTY OUT","UNIT COST","TOTAL PRICE","RUNNING QTY","RUNNING VALUE"].includes(h) ? totalFill : hdrFill,
      alignment: center,
      border: solidBorder,
    });
  });

  const slotCount = Math.max(rows.length, SS_MIN_DATA_ROWS);
  for (let i = 0; i < slotCount; i++) {
    const ri = DATA_START + i;
    const row = rows[i];
    const dataStyle = { font: f.body(), fill: styles.sheetFill, border: dottedRed };

    if (!row) {
      STOCK_OUT_COLS.forEach((h, ci) => {
        const isPeso = ["UNIT COST","TOTAL PRICE","RUNNING VALUE"].includes(h);
        const isNum = ["QTY OUT","RUNNING QTY"].includes(h);
        put(ri, ci, isPeso ? "₱ -" : isNum ? 0 : "", isPeso ? "s" : "n", {
          ...dataStyle, alignment: rightOutSet.has(h) ? right : center,
          ...(isNum ? { numFmt: SS_QTY_FMT } : {}),
        });
      });
      continue;
    }

    const vals = [
      row.transNo || i + 1,
      formatSsDate(row.dispatchDate),
      row.tdtWo || "",
      row.customer || "",
      row.tdtDr || "",
      row.branch || "",
      row.bdrSummary || "",
      row.tdtSi || "",
      row.qtyOut ?? 0,
      row.unitCost ?? 0,
      row.totalPrice ?? 0,
      row.s1 || "",
      row.s2 || "",
      row.s3 || "",
      row.runningQty ?? 0,
      row.runningValue ?? 0,
      row.remarks || "",
    ];
    STOCK_OUT_COLS.forEach((h, ci) => {
      const v = vals[ci];
      const isPeso = ["UNIT COST","TOTAL PRICE","RUNNING VALUE"].includes(h);
      const isNum = ["QTY OUT","RUNNING QTY"].includes(h);
      const align = rightOutSet.has(h) ? right : h === "CUSTOMER NAME" ? left : center;
      if (isPeso && !v) {
        put(ri, ci, "₱ -", "s", { ...dataStyle, alignment: right });
      } else if (isPeso) {
        put(ri, ci, Number(v), "n", { ...dataStyle, alignment: right, numFmt: SS_PESO_FMT });
      } else if (isNum) {
        put(ri, ci, Number(v) || 0, "n", { ...dataStyle, alignment: right, numFmt: SS_QTY_FMT });
      } else {
        put(ri, ci, String(v ?? ""), "s", { ...dataStyle, alignment: align });
      }
    });
  }

  const lastRow = DATA_START + slotCount - 1;
  ws["!ref"] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: lastRow, c: LAST_COL });
  ws["!merges"] = merges;
  ws["!cols"] = [
    { wch: 8 }, { wch: 13 }, { wch: 11 }, { wch: 22 }, { wch: 12 }, { wch: 10 },
    { wch: 18 }, { wch: 11 }, { wch: 9 }, { wch: 12 }, { wch: 13 },
    { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 11 }, { wch: 14 }, { wch: 20 },
  ];
  ws["!rows"] = [
    { hpt: 22 }, { hpt: 18 }, { hpt: 18 }, { hpt: 18 }, { hpt: 18 },
    { hpt: 36 }, ...Array(slotCount).fill({ hpt: 22 }),
  ];
  return ws;
}

function downloadWorkbook(wb, filename) {
  try {
    XLSX.writeFile(wb, filename);
  } catch {
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
}

function exportStockSheets(sku, skuInfo, stockInRows, stockOutRows) {
  const safeSku = String(sku || "SKU").trim() || "SKU";
  const wb = XLSX.utils.book_new();
  const inSheet = buildStockInWorksheet(safeSku, skuInfo, stockInRows);
  const outSheet = buildStockOutWorksheet(safeSku, skuInfo, stockOutRows);
  XLSX.utils.book_append_sheet(wb, inSheet, `${safeSku} STOCK IN`.slice(0, 31));
  XLSX.utils.book_append_sheet(wb, outSheet, `${safeSku} STOCK OUT`.slice(0, 31));
  downloadWorkbook(wb, `TDT_WIS_Stock_Sheet_${safeSku}.xlsx`);
}

function importStockSheets(file, onInDone, onOutDone, onError) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array", cellDates: true, cellText: false, dateNF: "yyyy-mm-dd" });
      const toNum = (v) => { if (!v && v !== 0) return 0; const n = parseFloat(String(v).replace(/[₱,]/g, "")); return isNaN(n) ? 0 : n; };
      const toStr = (v) => { if (v == null) return ""; if (v instanceof Date) return v.toISOString().slice(0, 10); return String(v).trim(); };
      const parseSheet = (ws, fieldMap) => {
        if (!ws) return [];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: false });
        let hdrIdx = -1;
        for (let i = 0; i < Math.min(raw.length, 15); i++) {
          if (raw[i] && raw[i].some(v => typeof v === "string" && v.toUpperCase().includes("TRANS"))) { hdrIdx = i; break; }
        }
        const dataStart = hdrIdx >= 0 ? hdrIdx + 1 : 6;
        const result = [];
        for (let i = dataStart; i < raw.length; i++) {
          const r = raw[i];
          if (!r || r.every(v => !v || String(v).trim() === "")) continue;
          const row = { id: result.length + 1 };
          fieldMap.forEach(([field, idx, numeric]) => {
            row[field] = numeric ? toNum(r[idx]) : toStr(r[idx]);
          });
          result.push(row);
        }
        return result;
      };

      const inSheetName = wb.SheetNames.find(n => n.toUpperCase().includes("IN")) || wb.SheetNames[0];
      const outSheetName = wb.SheetNames.find(n => n.toUpperCase().includes("OUT")) || wb.SheetNames[1] || wb.SheetNames[0];

      // New flat IN format: cols match STOCK_IN_COLS exactly (0-16)
      const inCols = [
        ["transNo",0,false],["date",1,false],["tdtPo",2,false],["tdtPoDate",3,false],
        ["vendorNo",4,false],["vendorName",5,false],["customerDr",6,false],
        ["tdtWo",7,false],["acceptDate",8,false],
        ["qty",9,true],["costKilo",10,true],["costUnit",11,true],["totalPurchase",12,true],
        ["runningQty",13,true],["avgUnitCost",14,true],["totalValue",15,true],["remark",16,false],
      ];
      // New flat OUT format: cols match STOCK_OUT_COLS exactly (0-16)
      const outCols = [
        ["transNo",0,false],["dispatchDate",1,false],["tdtWo",2,false],["customer",3,false],
        ["tdtDr",4,false],["branch",5,false],["bdrSummary",6,false],["tdtSi",7,false],
        ["qtyOut",8,true],["unitCost",9,true],["totalPrice",10,true],
        ["s1",11,false],["s2",12,false],["s3",13,false],
        ["runningQty",14,true],["runningValue",15,true],["remarks",16,false],
      ];

      const inRows = parseSheet(wb.Sheets[inSheetName], inCols);
      const outRows = parseSheet(wb.Sheets[outSheetName], outCols);
      if (!inRows.length && !outRows.length) throw new Error("No data rows found. Ensure you are importing a Stock Sheet exported from this system.");
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
  const EMPTY_FORM = { type: "in", sku: "", date: "", tdtPo: "", tdtPoDate: "", vendorNo: "", vendorName: "", customerDr: "", tdtWo: "", acceptDate: "", qty: "", costKilo: "", costUnit: "", dispatchDate: "", customer: "", tdtDr: "", branch: "", bdrSummary: "", tdtSi: "", qtyOut: "", remarks: "" };
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
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
        showDateRange={false}
        primaryAction={{ label: "New Stock Sheet", onClick: () => setShowCreate(true) }}
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
          onExport: () => {
            try {
              exportStockSheets(skuKey, skuInfo, stockInRows, stockOutRows);
              showToast(`Exported stock sheet for ${skuKey || "SKU"}.`);
            } catch (err) {
              console.error("Stock sheet export failed:", err);
              showToast(err?.message || "Export failed. Check the browser console.", "error");
            }
          },
        }}
      />

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
        background: "#fff",
        borderRadius: 14,
        padding: "12px 16px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
      }}>
        <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>Recent SKUs:</span>
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
              {(() => {
                const fldStyle = { padding: "9px 12px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 8, fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box" };
                const lbl = { fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" };
                const set = (k, v) => setCreateForm(f => ({ ...f, [k]: v }));
                const inp = (key, label, type = "text", placeholder = "", full = false) => (
                  <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: full ? "1 / -1" : undefined }}>
                    <label style={lbl}>{label}</label>
                    <input type={type} value={createForm[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder}
                      style={fldStyle}
                      onFocus={e => { e.target.style.borderColor = "#e87c27"; e.target.style.boxShadow = "0 0 0 3px rgba(232,124,39,0.18)"; }}
                      onBlur={e => { e.target.style.borderColor = "#d1d5db"; e.target.style.boxShadow = "none"; }} />
                  </div>
                );
                const commonFields = [inp("sku", "SKU Code *", "text", "e.g. DRB052")];
                const inFields = [
                  inp("date", "Date *", "date"),
                  inp("tdtPo", "TDT PO #", "text", "e.g. PO-2026-001"),
                  inp("tdtPoDate", "TDT PO Date", "date"),
                  inp("vendorNo", "Vendor #", "text", "e.g. V-001"),
                  inp("vendorName", "Vendor Name", "text", "e.g. Steel Asia Corp"),
                  inp("customerDr", "Customer's Name as per DR", "text", "e.g. RCM Builders", true),
                  inp("tdtWo", "TDT WO #", "text", "e.g. WO-001"),
                  inp("acceptDate", "Acceptance Date", "date"),
                  inp("qty", "QTY *", "number", "0"),
                  inp("costKilo", "Cost/Kilo", "number", "0.00"),
                  inp("costUnit", "Cost/Unit (₱)", "number", "0.00"),
                ];
                const outFields = [
                  inp("dispatchDate", "Dispatch Date *", "date"),
                  inp("tdtWo", "TDT WO #", "text", "e.g. WO-001"),
                  inp("customer", "Customer Name *", "text", "e.g. RCM Builders", true),
                  inp("tdtDr", "TDT DR #", "text", "e.g. DR26050"),
                  inp("branch", "Branch", "text", "e.g. Manila"),
                  inp("bdrSummary", "Summary of TDT BDR #", "text", "e.g. BDR-001"),
                  inp("tdtSi", "TDT SI #", "text", "e.g. SI-001"),
                  inp("qtyOut", "QTY Out *", "number", "0"),
                  inp("costUnit", "Unit Cost (₱)", "number", "0.00"),
                  inp("remarks", "Remarks", "text", "Optional notes", true),
                ];
                return (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" }}>
                    {commonFields}
                    {createForm.type === "in" ? inFields : outFields}
                  </div>
                );
              })()}
            </div>
            <div style={{ padding: "14px 24px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 10, justifyContent: "flex-end", background: "#fafafa" }}>
              <button type="button" onClick={() => setShowCreate(false)} style={{ padding: "10px 20px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151" }}>Cancel</button>
              <button type="button" onClick={() => {
                const isIn = createForm.type === "in";
                if (!createForm.sku || (isIn && (!createForm.date || !createForm.qty)) || (!isIn && (!createForm.dispatchDate || !createForm.qtyOut))) {
                  setToast({ msg: `Please fill in SKU, Date, and ${isIn ? "QTY" : "QTY Out"}.`, type: "error" });
                  setTimeout(() => setToast(null), 3000);
                  return;
                }
                const sku = createForm.sku.trim().toUpperCase();
                if (isIn) {
                  const qty = Number(createForm.qty) || 0;
                  const costUnit = Number(createForm.costUnit) || 0;
                  const entry = {
                    id: Date.now(), sku,
                    transNo: String(stockInData.filter(r => r.sku === sku).length + 1).padStart(3, "0"),
                    date: createForm.date, tdtPo: createForm.tdtPo, tdtPoDate: createForm.tdtPoDate,
                    vendorNo: createForm.vendorNo, vendorName: createForm.vendorName,
                    customerDr: createForm.customerDr, tdtWo: createForm.tdtWo,
                    acceptDate: createForm.acceptDate, qty,
                    costKilo: Number(createForm.costKilo) || 0, costUnit,
                    totalPurchase: qty * costUnit, runningQty: 0, avgUnitCost: costUnit, totalValue: 0, remark: "",
                  };
                  setStockInData(prev => [...prev, entry]);
                } else {
                  const qtyOut = Number(createForm.qtyOut) || 0;
                  const unitCost = Number(createForm.costUnit) || 0;
                  const entry = {
                    id: Date.now(), sku,
                    transNo: String(stockOutData.filter(r => r.sku === sku).length + 1).padStart(3, "0"),
                    dispatchDate: createForm.dispatchDate, tdtWo: createForm.tdtWo,
                    customer: createForm.customer, tdtDr: createForm.tdtDr,
                    branch: createForm.branch, bdrSummary: createForm.bdrSummary,
                    tdtSi: createForm.tdtSi, qtyOut, unitCost,
                    totalPrice: qtyOut * unitCost, s1: "", s2: "", s3: "",
                    runningQty: 0, runningValue: 0, remarks: createForm.remarks,
                  };
                  setStockOutData(prev => [...prev, entry]);
                }
                setShowCreate(false);
                setCreateForm(EMPTY_FORM);
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