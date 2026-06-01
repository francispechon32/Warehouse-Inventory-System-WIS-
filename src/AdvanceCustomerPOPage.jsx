import { useState, useMemo, useRef, useEffect } from "react";
import XLSX from "xlsx-js-style";
import PageToolbar from "./PageToolbar";
import {
  cellStr,
  cellNum,
  formatExcelDate,
  findHeaderRowIndex,
  pickCol,
  rowHasData,
  readWorkbookSheet,
} from "./excelImportUtils";

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

/* ─── EXPORT (horizontal SKU blocks) ── */
const ACPO_BLOCK_COLS = 6;
const ACPO_BLOCK_GAP = 1;
const ACPO_BLOCK_WIDTH = ACPO_BLOCK_COLS + ACPO_BLOCK_GAP;
const ACPO_DATA_SLOTS = 20;
const ACPO_ROW_LOGO1 = 0;
const ACPO_ROW_LOGO2 = 1;
const ACPO_ROW_INFO_START = 2;
const ACPO_ROW_SECTION = 5;
const ACPO_ROW_HDR = 6;
const ACPO_ROW_SUMMARY = 7;
const ACPO_ROW_DATA_START = 8;

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

function acpoTransSlotLabels(count = ACPO_DATA_SLOTS) {
  const slots = [1, 2, 3, 4];
  while (slots.length < count) slots.push(slots[slots.length - 1] + 5);
  return slots.slice(0, count);
}

function groupReservationsBySku(rows) {
  const groups = [];
  const map = new Map();
  rows.forEach((row) => {
    const { sku, item, estQtyEnding } = getSummaryFields(row);
    const key = sku === "—" ? `__${row.id}` : sku;
    if (!map.has(key)) {
      const g = { sku, item, estQtyEnding, rows: [] };
      map.set(key, g);
      groups.push(g);
    }
    map.get(key).rows.push(row);
  });
  return groups;
}

function resolveSectionEstEnding(estQtyEnding, groupRows) {
  if (estQtyEnding !== "—" && estQtyEnding !== "" && estQtyEnding != null) {
    const n = Number(estQtyEnding);
    if (!Number.isNaN(n)) return n;
  }
  return groupRows.reduce((s, r) => s + (Number(r.estEnding) || 0), 0);
}

function exportToWis(rows) {
  const wb = XLSX.utils.book_new();
  const C = (r, c) => XLSX.utils.encode_cell({ r, c });
  const groups = groupReservationsBySku(rows);
  if (!groups.length) groups.push({ sku: "—", item: "—", estQtyEnding: "—", rows: [] });

  const sheetFill = { patternType: "solid", fgColor: { rgb: "FFF9E6" } };
  const goldFill = { patternType: "solid", fgColor: { rgb: "FFD966" } };
  const hdrFill = { patternType: "solid", fgColor: { rgb: "806000" } };
  const summaryFill = { patternType: "solid", fgColor: { rgb: "FFEB9C" } };
  const dataFill = { patternType: "solid", fgColor: { rgb: "FCE4D6" } };

  const thickBorder = {
    top: { style: "medium", color: { rgb: "000000" } },
    bottom: { style: "medium", color: { rgb: "000000" } },
    left: { style: "medium", color: { rgb: "000000" } },
    right: { style: "medium", color: { rgb: "000000" } },
  };
  const blackBorder = {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
  };
  const dataBorder = {
    top: { style: "thin", color: { rgb: "B4C6E7" } },
    bottom: { style: "thin", color: { rgb: "B4C6E7" } },
    left: { style: "thin", color: { rgb: "B4C6E7" } },
    right: { style: "thin", color: { rgb: "B4C6E7" } },
  };

  const f = {
    brand: () => ({ name: "Arial", sz: 11, bold: true, color: { rgb: "E87C27" } }),
    brandDark: () => ({ name: "Arial", sz: 11, bold: true, color: { rgb: "000000" } }),
    tagline: () => ({ name: "Arial", sz: 8, bold: true, color: { rgb: "000000" } }),
    infoLabel: () => ({ name: "Arial", sz: 9, bold: true, color: { rgb: "000000" } }),
    sectionNum: () => ({ name: "Arial", sz: 10, bold: true, color: { rgb: "000000" } }),
    hdr: () => ({ name: "Arial", sz: 8, bold: true, color: { rgb: "FFFFFF" } }),
    summary: () => ({ name: "Arial", sz: 9, bold: true, color: { rgb: "000000" } }),
    body: () => ({ name: "Arial", sz: 9, color: { rgb: "000000" } }),
  };
  const center = { horizontal: "center", vertical: "center", wrapText: true };
  const left = { horizontal: "left", vertical: "center", wrapText: true, indent: 1 };
  const qtyFmt = "#,##0";

  const ws = {};
  const merges = [];
  const put = (r, c, v, t, style) => {
    ws[C(r, c)] = { v: v ?? "", t: t || (typeof v === "number" ? "n" : "s"), s: style };
  };
  const blockStart = (bi) => bi * ACPO_BLOCK_WIDTH;
  const now = formatAcpoExportDateTime();
  const transSlots = acpoTransSlotLabels();

  const tableHdrs = [
    "TRANS #", "INSERT DATE", "INSERT DR #",
    "INSERT CUSTOMER NAME", "INSERT PLACE OF DELIVERY", "EST ENDING BALANCE",
  ];

  groups.forEach((group, bi) => {
    const sc = blockStart(bi);
    const endC = sc + ACPO_BLOCK_COLS - 1;
    const actualBal = resolveSectionEstEnding(group.estQtyEnding, group.rows);

    put(ACPO_ROW_LOGO1, sc, "TDT POWERSTEEL", "s", { font: f.brand(), alignment: center, fill: sheetFill });
    merges.push({ s: { r: ACPO_ROW_LOGO1, c: sc }, e: { r: ACPO_ROW_LOGO1, c: endC } });

    put(ACPO_ROW_LOGO2, sc, "THE NO. 1 STEEL SUPPLIER", "s", {
      font: f.tagline(), alignment: center, fill: sheetFill,
    });
    merges.push({ s: { r: ACPO_ROW_LOGO2, c: sc }, e: { r: ACPO_ROW_LOGO2, c: endC } });

    const infoRows = [
      ["SKU", group.sku],
      ["ITEM", group.item],
      ["EST QTY ENDING", group.estQtyEnding],
    ];
    infoRows.forEach(([label, value], ri) => {
      const row = ACPO_ROW_INFO_START + ri;
      put(row, sc, label, "s", {
        font: f.infoLabel(), fill: goldFill, alignment: left, border: thickBorder,
      });
      merges.push({ s: { r: row, c: sc }, e: { r: row, c: sc + 1 } });
      put(row, sc + 2, value, "s", {
        font: f.body(), fill: goldFill, alignment: center, border: thickBorder,
      });
      merges.push({ s: { r: row, c: sc + 2 }, e: { r: row, c: endC } });
    });

    put(ACPO_ROW_SECTION, sc, bi + 1, "n", {
      font: f.sectionNum(), alignment: center, fill: sheetFill,
    });

    tableHdrs.forEach((h, ci) => {
      put(ACPO_ROW_HDR, sc + ci, h, "s", {
        font: f.hdr(), fill: hdrFill, alignment: center, border: blackBorder,
      });
    });

    put(ACPO_ROW_SUMMARY, sc, "", "s", { fill: summaryFill, border: blackBorder });
    put(ACPO_ROW_SUMMARY, sc + 1, now, "s", {
      font: f.summary(), fill: summaryFill, alignment: center, border: blackBorder,
    });
    put(ACPO_ROW_SUMMARY, sc + 2, "ACTUAL ENDING BALANCE >>>", "s", {
      font: f.summary(), fill: summaryFill, alignment: center, border: blackBorder,
    });
    merges.push({ s: { r: ACPO_ROW_SUMMARY, c: sc + 2 }, e: { r: ACPO_ROW_SUMMARY, c: sc + 4 } });
    put(ACPO_ROW_SUMMARY, sc + 5, actualBal, "n", {
      font: f.summary(), fill: summaryFill, alignment: center, border: blackBorder, numFmt: qtyFmt,
    });

    transSlots.forEach((slotLabel, si) => {
      const row = ACPO_ROW_DATA_START + si;
      const data = group.rows[si];
      put(row, sc, slotLabel, "n", {
        font: f.body(), fill: dataFill, alignment: center, border: dataBorder, numFmt: qtyFmt,
      });
      if (data) {
        const dr = data.drNo || data.tdtDr || "";
        const est = data.estEnding ?? "";
        put(row, sc + 1, formatAcpoExportDate(data.resDate), "s", {
          font: f.body(), fill: dataFill, alignment: center, border: dataBorder,
        });
        put(row, sc + 2, dr, "s", { font: f.body(), fill: dataFill, alignment: center, border: dataBorder });
        put(row, sc + 3, data.customer || "", "s", {
          font: f.body(), fill: dataFill, alignment: left, border: dataBorder,
        });
        put(row, sc + 4, data.place || "", "s", {
          font: f.body(), fill: dataFill, alignment: center, border: dataBorder,
        });
        put(row, sc + 5, est === "" || est === null ? "" : est, typeof est === "number" ? "n" : "s", {
          font: f.body(), fill: dataFill, alignment: center, border: dataBorder,
          ...(typeof est === "number" ? { numFmt: qtyFmt } : {}),
        });
      } else {
        for (let ci = 1; ci < ACPO_BLOCK_COLS; ci++) {
          put(row, sc + ci, "", "s", { fill: dataFill, border: dataBorder, alignment: center });
        }
      }
    });
  });

  const lastRow = ACPO_ROW_DATA_START + ACPO_DATA_SLOTS - 1;
  const lastCol = blockStart(groups.length) - 1;
  ws["!ref"] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: lastRow, c: Math.max(lastCol, 0) });

  for (let r = 0; r <= lastRow; r++) {
    for (let c = 0; c <= lastCol; c++) {
      if (!ws[C(r, c)]) {
        put(r, c, "", "s", { fill: sheetFill, border: dataBorder, alignment: center });
      }
    }
  }

  ws["!merges"] = merges;

  const colWidths = [];
  groups.forEach((_, bi) => {
    const sc = blockStart(bi);
    colWidths[sc] = { wch: 7 };
    colWidths[sc + 1] = { wch: 12 };
    colWidths[sc + 2] = { wch: 11 };
    colWidths[sc + 3] = { wch: 24 };
    colWidths[sc + 4] = { wch: 14 };
    colWidths[sc + 5] = { wch: 12 };
    if (bi < groups.length - 1) colWidths[sc + ACPO_BLOCK_COLS] = { wch: 2 };
  });
  ws["!cols"] = colWidths;

  ws["!rows"] = [
    { hpt: 20 },
    { hpt: 16 },
    { hpt: 18 },
    { hpt: 22 },
    { hpt: 18 },
    { hpt: 14 },
    { hpt: 38 },
    { hpt: 22 },
    ...Array(ACPO_DATA_SLOTS).fill({ hpt: 20 }),
  ];

  XLSX.utils.book_append_sheet(wb, ws, "ADVANCE CUSTOMER PO");
  XLSX.writeFile(wb, "TDT_Advance_Customer_PO_Summary.xlsx");
}

/* ─── IMPORT parser ── */
async function importReservations(file, onDone, onError) {
  try {
    const { raw } = await readWorkbookSheet(file, ["ADVANCE"]);
    const headerIdx = findHeaderRowIndex(raw, ["TRANS"], 20);
    const dataStart = headerIdx >= 0 ? headerIdx + 1 : 6;
    const headers = headerIdx >= 0 ? raw[headerIdx] : null;
    const parsed = [];

    for (let i = dataStart; i < raw.length; i++) {
      const r = raw[i];
      if (!rowHasData(r)) continue;

      let transNo = cellStr(pickCol(r, headers, ["TRANS #", "TRANS"], 1));
      let resDate = formatExcelDate(pickCol(r, headers, ["DATE", "RESERVATION"], 2));
      const col0 = cellStr(r[0]);
      const col1 = cellStr(r[1]);
      const col2 = r[2];
      if (!transNo && col0 && formatExcelDate(col1).match(/^\d{4}-\d{2}-\d{2}/)) {
        transNo = col0;
        resDate = formatExcelDate(col1);
      } else if (!transNo && col1 && !formatExcelDate(col1).match(/^\d{4}-\d{2}-\d{2}/)) {
        transNo = col1;
        if (formatExcelDate(col2).match(/^\d{4}-\d{2}-\d{2}/)) resDate = formatExcelDate(col2);
      }

      const customer = cellStr(pickCol(r, headers, ["CUSTOMER"], 5));
      const tdtDr = cellStr(pickCol(r, headers, ["TDT DR", "DR"], 4));
      if (!transNo && !customer && !tdtDr) continue;

      const estRaw = pickCol(r, headers, ["EST", "ENDING"], 9);
      const estStr = cellStr(estRaw);

      parsed.push({
        id: parsed.length + 1,
        transNo: transNo || String(parsed.length + 1).padStart(3, "0"),
        resDate,
        soWo: cellStr(pickCol(r, headers, ["SO", "WO"], 3)) || "—",
        tdtDr,
        customer,
        place: cellStr(pickCol(r, headers, ["PLACE"], 6)) || "Manila",
        reservedQty: cellNum(pickCol(r, headers, ["RESERVED"], 7)),
        currentStock: cellNum(pickCol(r, headers, ["CURRENT STOCK", "STOCK"], 8)),
        estEnding: estStr && estStr !== "—" ? cellNum(estRaw) : null,
        approvedBy: cellStr(pickCol(r, headers, ["APPROVED"], 10)),
        status: cellStr(pickCol(r, headers, ["STATUS"], 11)) || "Pending",
        drNo: tdtDr,
        remarks: "",
        lineItems: [],
        summarySku: "",
        summaryItem: "",
      });
    }

    if (!parsed.length) throw new Error("No data rows found. Fill TRANS #, CUSTOMER, or TDT DR columns.");
    onDone(parsed);
  } catch (err) {
    onError(err.message || "Import failed.");
  }
}
export default function AdvanceCustomerPOPage() {
  const [searchSku, setSearchSku] = useState("");
  const [reservations, setReservations] = useState(SEED_RESERVATIONS);
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
    return rows;
  }, [reservations, searchSku, place]);

  useEffect(() => {
    if (selectedId != null && !filtered.some((r) => r.id === selectedId)) {
      setSelectedId(null);
      setPanelOpen(false);
    }
  }, [filtered, selectedId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
        primaryAction={{ label: "Create New Reservation", onClick: () => setShowCreate(true) }}
        importExport={{
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
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#1c2235" }}>
                {["TRANS NO.", "RESERVATION DATE", "SO#/WO#", "TDT DR#", "CUSTOMER'S NAME", "PLACE OF DELIVERY", "RESERVED QTY", "CURRENT STOCK", "EST ENDING BALANCE", "APPROVED BY", "STATUS"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "14px 10px",
                      textAlign: ["RESERVED QTY", "CURRENT STOCK", "EST ENDING BALANCE"].includes(h) ? "right" : "center",
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
                  <td colSpan={11} style={{ textAlign: "center", padding: "48px 20px", color: "#9ca3af", fontSize: 14 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                    No results found for <strong style={{ color: "#374151" }}>"{searchSku || "your filters"}"</strong>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Try a different search term or clear your filters.</div>
                  </td>
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
                    <td style={{ padding: "12px 10px", color: "#6b7280", fontWeight: 600 }}><Highlight text={row.transNo} query={searchSku} /></td>
                    <td style={{ padding: "12px 10px", color: "#374151", whiteSpace: "nowrap" }}><Highlight text={row.resDate} query={searchSku} /></td>
                    <td style={{ padding: "12px 10px", color: "#374151" }}><Highlight text={row.soWo} query={searchSku} /></td>
                    <td style={{ padding: "12px 10px", color: "#e87c27", fontWeight: 700 }}><Highlight text={row.tdtDr} query={searchSku} /></td>
                    <td style={{ padding: "12px 10px", color: "#111827", fontWeight: 600, maxWidth: 160 }}><Highlight text={row.customer} query={searchSku} /></td>
                    <td style={{ padding: "12px 10px", color: "#6b7280" }}><Highlight text={row.place} query={searchSku} /></td>
                    <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: 700 }}><Highlight text={row.reservedQty} query={searchSku} /></td>
                    <td style={{ padding: "12px 10px", textAlign: "right" }}><Highlight text={row.currentStock} query={searchSku} /></td>
                    <td style={{ padding: "12px 10px", textAlign: "right", fontWeight: 600 }}><Highlight text={row.estEnding} query={searchSku} /></td>
                    <td style={{ padding: "12px 10px", color: "#6b7280" }}><Highlight text={row.approvedBy} query={searchSku} /></td>
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
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111827" }}>Create New Reservation</h2>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "#6b7280" }}>Fill in the advance customer PO details below</p>
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
                    style={{ padding: "9px 12px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 8, fontFamily: "inherit", outline: "none" }}
                    onFocus={e => { e.target.style.borderColor = "#e87c27"; e.target.style.boxShadow = "0 0 0 3px rgba(232,124,39,0.18)"; }}
                    onBlur={e => { e.target.style.borderColor = "#d1d5db"; e.target.style.boxShadow = "none"; }}
                  />
                </div>
              ))}
            </div>
            <div style={{ padding: "14px 24px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 10, justifyContent: "flex-end", background: "#fafafa" }}>
              <button type="button" onClick={() => setShowCreate(false)} style={{ padding: "10px 20px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151" }}>Cancel</button>
              <button type="button" onClick={() => {
                if (!createForm.resDate || !createForm.customer || !createForm.sku) {
                  setToast({ msg: "Please fill in Date, Customer, and SKU.", type: "error" });
                  setTimeout(() => setToast(null), 3000);
                  return;
                }
                const qty = Number(createForm.reservedQty) || 0;
                const stock = Number(createForm.currentStock) || 0;
                const newRes = {
                  id: reservations.length + 1,
                  transNo: String(reservations.length + 1).padStart(3, "0"),
                  resDate: createForm.resDate,
                  soWo: createForm.soWo,
                  tdtDr: createForm.tdtDr,
                  customer: createForm.customer,
                  place: createForm.place,
                  sku: createForm.sku.toUpperCase(),
                  reservedQty: qty,
                  currentStock: stock,
                  estEnding: stock - qty,
                  approvedBy: createForm.approvedBy,
                  status: "Pending",
                  lineItems: [{ sku: createForm.sku.toUpperCase(), desc: "", qty, unitCost: 0, totalCost: 0 }],
                };
                setReservations(prev => [newRes, ...prev]);
                setShowCreate(false);
                setCreateForm({ resDate: "", soWo: "", tdtDr: "", customer: "", place: "", sku: "", reservedQty: "", currentStock: "", approvedBy: "" });
                setToast({ msg: "Reservation created successfully.", type: "success" });
                setTimeout(() => setToast(null), 3000);
              }} style={{ padding: "10px 20px", background: "#e87c27", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                Create Reservation
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}