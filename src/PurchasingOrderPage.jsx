import React, { useState, useMemo, useRef, useEffect } from "react";
import XLSX from "xlsx-js-style";
import PageToolbar from "./PageToolbar";
import useSort from "./useSort";
import useApi from "./hooks/useApi";
import { ENDPOINTS } from "./api/apiConfig";
import {
  cellStr,
  cellNum,
  formatExcelDate,
  findHeaderRowIndex,
  pickCol,
  rowHasData,
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

const STATUS_OPTS = ["All Status", "Active", "Completed", "Pending", "Cancelled"];
const SUPPLIER_OPTS = ["All Suppliers", "Steel Asia Corp", "Dragon Steel", "Pag-asa Steel", "Steelworld"];

function fmtPHP(n) {
  return "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export const INITIAL_PURCHASE_ORDERS = [
  {
    id: 1,
    transNo: "001",
    poDate: "2026-05-02",
    eta: "2026-05-15",
    purchaser: "Maria Santos",
    tdtPo: "PO-2026-0142",
    vendor: "Steel Asia Corp",
    productDesc: "Deformed Round Bar, 10mm x 6M g40",
    destination: "Marilao",
    tradingOrStocks: "Stocks",
    warehouseType: "Stocks",
    metricTons: 2.4,
    qtyPerPo: 400,
    weight: "—",
    status: "Active",
    txnNo: "TXN-2026-001",
    receiptDate: "2026-05-14",
    supplierDrNo: "DR-2026-0880",
    actualQtyReceived: 400,
    qtyVariance: 0,
    varianceAmount: 0,
    encoder: "M. Santos",
    checkerName: "C. Gomez",
    receiverName: "B. Lim",
    storerName: "R. Tan",
    manager: "E. Santos",
    remarksVariance: "Complete delivery",
    recordedToPe: "Yes",
    lineItems: [
      { code: "DRB050", desc: "Deformed Round Bar, 10mm x 6M", qty: 100, unit: 485, val: 48500 },
      { code: "DRB050", desc: "Deformed Round Bar, 10mm x 6M", qty: 100, unit: 485, val: 48500 },
      { code: "DRB050", desc: "Deformed Round Bar, 10mm x 6M", qty: 100, unit: 485, val: 48500 },
      { code: "DRB050", desc: "Deformed Round Bar, 10mm x 6M", qty: 100, unit: 485, val: 48500 },
    ],
  },
  {
    id: 2,
    transNo: "002",
    poDate: "2026-05-03",
    eta: "2026-05-18",
    purchaser: "Juan Reyes",
    tdtPo: "PO-2026-0143",
    vendor: "Dragon Steel",
    productDesc: "Wide Flange, 10 x 8 x 33# x 6M",
    destination: "Marilao",
    tradingOrStocks: "Trading",
    warehouseType: "Backload",
    metricTons: 5.1,
    qtyPerPo: 12,
    weight: "12.2 MT",
    status: "Completed",
    txnNo: "TXN-2026-002",
    receiptDate: "2026-05-17",
    supplierDrNo: "DR-2026-0891",
    actualQtyReceived: 12,
    qtyVariance: 0,
    varianceAmount: 0,
    encoder: "J. Reyes",
    checkerName: "M. Cruz",
    receiverName: "A. Lopez",
    storerName: "R. Tan",
    manager: "E. Santos",
    remarksVariance: "Complete delivery",
    recordedToPe: "Yes",
    lineItems: [
      { code: "WF10833", desc: "Wide Flange, 10 x 8 x 33# x 6M", qty: 12, unit: 12300, val: 147600 },
    ],
  },
  {
    id: 3,
    transNo: "003",
    poDate: "2026-05-04",
    eta: "2026-05-20",
    purchaser: "Ana Cruz",
    tdtPo: "PO-2026-0144",
    vendor: "Pag-asa Steel",
    productDesc: "Sheet Pile T2, 400mm x 100mm",
    destination: "Marilao",
    tradingOrStocks: "Stocks",
    warehouseType: "Stocks",
    metricTons: 8.6,
    qtyPerPo: 15,
    weight: "—",
    status: "Pending",
    txnNo: "TXN-2026-003",
    receiptDate: "2026-05-19",
    supplierDrNo: "DR-2026-0902",
    actualQtyReceived: 15,
    qtyVariance: 0,
    varianceAmount: 0,
    encoder: "A. Cruz",
    checkerName: "M. Cruz",
    receiverName: "A. Lopez",
    storerName: "T. Uy",
    manager: "E. Santos",
    remarksVariance: "Complete",
    recordedToPe: "Yes",
    lineItems: [
      { code: "SHPT2", desc: "Sheet Pile T2, 400mm x 100mm x 10.5mm", qty: 15, unit: 22529.66, val: 337944.9 },
    ],
  },
  {
    id: 4,
    transNo: "004",
    poDate: "2026-05-05",
    eta: "2026-05-22",
    purchaser: "Leo Santos",
    tdtPo: "PO-2026-0145",
    vendor: "Steelworld",
    productDesc: "MS Plate, 6mm x 4' x 8'",
    destination: "Marilao",
    tradingOrStocks: "Stocks",
    warehouseType: "Stocks",
    metricTons: 1.2,
    qtyPerPo: 50,
    weight: "—",
    status: "Active",
    txnNo: "TXN-2026-004",
    receiptDate: "2026-05-21",
    supplierDrNo: "DR-2026-0921",
    actualQtyReceived: 48,
    qtyVariance: -2,
    varianceAmount: -1109.58,
    encoder: "L. Santos",
    checkerName: "C. Gomez",
    receiverName: "B. Lim",
    storerName: "R. Tan",
    manager: "E. Santos",
    remarksVariance: "Short by 2 pcs",
    recordedToPe: "Yes",
    lineItems: [
      { code: "MSP010", desc: "MS Plate, 6mm x 4' x 8'", qty: 50, unit: 554.79, val: 27739.5 },
    ],
  },
  {
    id: 5,
    transNo: "005",
    poDate: "2026-05-06",
    eta: "2026-05-25",
    purchaser: "Maria Santos",
    tdtPo: "PO-2026-0146",
    vendor: "Steel Asia Corp",
    productDesc: "Deformed Round Bar, 16mm x 6M g40",
    destination: "Marilao",
    tradingOrStocks: "Trading",
    warehouseType: "Backload",
    metricTons: 3.8,
    qtyPerPo: 200,
    weight: "3.8 MT",
    status: "Completed",
    txnNo: "TXN-2026-005",
    receiptDate: "2026-05-24",
    supplierDrNo: "DR-2026-0945",
    actualQtyReceived: 196,
    qtyVariance: -4,
    varianceAmount: -1386.92,
    encoder: "M. Santos",
    checkerName: "C. Gomez",
    receiverName: "B. Lim",
    storerName: "T. Uy",
    manager: "E. Santos",
    remarksVariance: "Short by 4 pcs — documented",
    recordedToPe: "Yes",
    lineItems: [
      { code: "DRB052", desc: "Deformed Round Bar, 16mm x 6M g40", qty: 200, unit: 346.73, val: 69346 },
    ],
  },
  {
    id: 6,
    transNo: "006",
    poDate: "2026-05-07",
    eta: "2026-05-28",
    purchaser: "Juan Reyes",
    tdtPo: "PO-2026-0147",
    vendor: "Dragon Steel",
    productDesc: "GI Rectangular Tube, 2 x 4 x 2mm x 6M",
    destination: "Marilao",
    tradingOrStocks: "Stocks",
    warehouseType: "Stocks",
    metricTons: 0.9,
    qtyPerPo: 80,
    weight: "—",
    status: "Pending",
    txnNo: "TXN-2026-006",
    receiptDate: "2026-05-27",
    supplierDrNo: "DR-2026-0960",
    actualQtyReceived: 80,
    qtyVariance: 0,
    varianceAmount: 0,
    encoder: "J. Reyes",
    checkerName: "M. Cruz",
    receiverName: "A. Lopez",
    storerName: "T. Uy",
    manager: "E. Santos",
    remarksVariance: "Complete",
    recordedToPe: "Yes",
    lineItems: [
      { code: "RECT24", desc: "GI Rectangular Tube, 2 x 4 x 2mm x 6M", qty: 80, unit: 1380, val: 110400 },
    ],
  },
  {
    id: 7,
    transNo: "007",
    poDate: "2026-05-08",
    eta: "2026-06-01",
    purchaser: "Ana Cruz",
    tdtPo: "PO-2026-0148",
    vendor: "Pag-asa Steel",
    productDesc: "Angle Bar, 5mm x 50mm x 50mm x 6M",
    destination: "Marilao",
    tradingOrStocks: "Stocks",
    warehouseType: "Stocks",
    metricTons: 0.5,
    qtyPerPo: 120,
    weight: "—",
    status: "Active",
    txnNo: "TXN-2026-007",
    receiptDate: "2026-05-30",
    supplierDrNo: "DR-2026-0988",
    actualQtyReceived: 120,
    qtyVariance: 0,
    varianceAmount: 0,
    encoder: "A. Cruz",
    checkerName: "M. Cruz",
    receiverName: "B. Lim",
    storerName: "R. Tan",
    manager: "E. Santos",
    remarksVariance: "Complete — all received",
    recordedToPe: "Yes",
    lineItems: [
      { code: "ABB18", desc: "Angle Bar, 5mm x 50mm x 50mm x 6M White", qty: 120, unit: 98.5, val: 11820 },
    ],
  },
  {
    id: 8,
    transNo: "008",
    poDate: "2026-05-09",
    eta: "2026-06-03",
    purchaser: "Leo Santos",
    tdtPo: "PO-2026-0149",
    vendor: "Steelworld",
    productDesc: "GI pipe 1\" x 6M s40",
    destination: "Marilao",
    tradingOrStocks: "Trading",
    warehouseType: "Backload",
    metricTons: 1.1,
    qtyPerPo: 60,
    weight: "1.1 MT",
    status: "Cancelled",
    txnNo: "TXN-2026-008",
    lineItems: [
      { code: "GP3302", desc: 'GI pipe 1" x 6M s40', qty: 60, unit: 1380, val: 82800 },
    ],
  },
  {
    id: 9,
    transNo: "009",
    poDate: "2026-05-10",
    eta: "2026-06-05",
    purchaser: "Maria Santos",
    tdtPo: "PO-2026-0150",
    vendor: "Steel Asia Corp",
    productDesc: "Deformed Round Bar, 20mm x 6M g60",
    destination: "Marilao",
    tradingOrStocks: "Stocks",
    warehouseType: "Stocks",
    metricTons: 2.2,
    qtyPerPo: 90,
    weight: "—",
    status: "Completed",
    txnNo: "TXN-2026-009",
    receiptDate: "2026-06-04",
    supplierDrNo: "DR-2026-1001",
    actualQtyReceived: 88,
    qtyVariance: -2,
    varianceAmount: -1078.62,
    encoder: "M. Santos",
    checkerName: "C. Gomez",
    receiverName: "B. Lim",
    storerName: "R. Tan",
    manager: "E. Santos",
    remarksVariance: "Short by 2 pcs",
    recordedToPe: "Yes",
    lineItems: [
      { code: "DRB020", desc: "Deformed Round Bar, 20mm x 6M g60", qty: 90, unit: 539.31, val: 48537.9 },
    ],
  },
  {
    id: 10,
    transNo: "010",
    poDate: "2026-05-11",
    eta: "2026-06-08",
    purchaser: "Juan Reyes",
    tdtPo: "PO-2026-0151",
    vendor: "Dragon Steel",
    productDesc: "Sheet Pile Z type 12 meters",
    destination: "Marilao",
    tradingOrStocks: "Stocks",
    warehouseType: "Stocks",
    metricTons: 10.5,
    qtyPerPo: 8,
    weight: "10.5 MT",
    status: "Pending",
    txnNo: "TXN-2026-010",
    lineItems: [
      { code: "SHPT7", desc: "Sheet Pile Z type 12 meters", qty: 8, unit: 41838.53, val: 334708.24 },
    ],
  },
  {
    id: 11,
    transNo: "011",
    poDate: "2026-05-12",
    eta: "2026-05-28",
    purchaser: "Maria Santos",
    tdtPo: "PO-2026-0152",
    vendor: "Steel Asia Corp",
    productDesc: "Deformed Round Bar, 16mm x 6M g40",
    destination: "Marilao",
    tradingOrStocks: "Trading",
    warehouseType: "Backload",
    metricTons: 3.8,
    qtyPerPo: 200,
    weight: "3.8 MT",
    status: "Completed",
    txnNo: "TXN-2026-011",
    receiptDate: "2026-05-26",
    supplierDrNo: "DR-2026-0975",
    actualQtyReceived: 200,
    qtyVariance: 0,
    varianceAmount: 0,
    encoder: "M. Santos",
    checkerName: "C. Gomez",
    receiverName: "B. Lim",
    storerName: "R. Tan",
    manager: "E. Santos",
    remarksVariance: "Supplemental delivery",
    recordedToPe: "Yes",
    lineItems: [
      { code: "DRB052", desc: "Deformed Round Bar, 16mm x 6M g40", qty: 200, unit: 346.73, val: 69346 },
    ],
  },
  {
    id: 12,
    transNo: "012",
    poDate: "2026-05-14",
    eta: "2026-06-05",
    purchaser: "Ana Cruz",
    tdtPo: "PO-2026-0153",
    vendor: "Pag-asa Steel",
    productDesc: "Angle Bar, 5mm x 50mm x 50mm x 6M",
    destination: "Marilao",
    tradingOrStocks: "Stocks",
    warehouseType: "Stocks",
    metricTons: 0.5,
    qtyPerPo: 120,
    weight: "—",
    status: "Completed",
    txnNo: "TXN-2026-012",
    receiptDate: "2026-06-03",
    supplierDrNo: "DR-2026-1012",
    actualQtyReceived: 115,
    qtyVariance: -5,
    varianceAmount: -492.5,
    encoder: "A. Cruz",
    checkerName: "M. Cruz",
    receiverName: "B. Lim",
    storerName: "R. Tan",
    manager: "E. Santos",
    remarksVariance: "Short by 5 pcs",
    recordedToPe: "Yes",
    lineItems: [
      { code: "ABB18", desc: "Angle Bar, 5mm x 50mm x 50mm x 6M White", qty: 120, unit: 98.5, val: 11820 },
    ],
  },
];

const STATUS_BADGE = {
  Active: { bg: "#dcfce7", color: "#15803d", panel: "#22c55e" },
  Completed: { bg: "#dcfce7", color: "#15803d", panel: "#22c55e" },
  Pending: { bg: "#fef3c7", color: "#d97706", panel: "#f59e0b" },
  Cancelled: { bg: "#e5e7eb", color: "#4b5563", panel: "#6b7280" },
};

const PURCH_COLDEFS = [
  { key: "transNo",         label: "TRANS #",        sticky: true,  alwaysVisible: true  },
  { key: "poInfo",          label: "PO INFO",         hideable: true                       },
  { key: "eta",             label: "ETA",             hideable: true                       },
  { key: "purchaser",       label: "PURCHASER",       hideable: true                       },
  { key: "vendorInfo",      label: "VENDOR INFO",     hideable: true                       },
  { key: "productDesc",     label: "PRODUCT DESC",    alwaysVisible: true                  },
  { key: "destination",     label: "DEST.",           hideable: true                       },
  { key: "tradingOrStocks", label: "TYPE",            hideable: true                       },
  { key: "warehouseType",   label: "WH TYPE",         hideable: true                       },
  { key: "metricTons",      label: "MT",              hideable: true                       },
  { key: "qtyPerPo",        label: "QTY/PO",          alwaysVisible: true                  },
  { key: "weight",          label: "WEIGHT",          hideable: true                       },
  { key: "retention",       label: "RETENTION",       hideable: true                       },
  { key: "costPerKilo",     label: "COST/KG",         hideable: true                       },
  { key: "unitCost",        label: "UNIT COST",       hideable: true                       },
  { key: "totalCost",       label: "TOTAL COST",      alwaysVisible: true                  },
  { key: "status",          label: "STATUS",          alwaysVisible: true                  },
];

const TABLE_COLS_PURCH = [
  "TRANS NO.",
  "PO DATE",
  "ETA",
  "NAME OF PURCHASER",
  "TDT PURCHASE ORDER #",
  "VENDOR / SUPPLIER'S NAME",
  "PRODUCT DESCRIPTION",
  "DESTINATION",
  "IF FOR TRADING OR STOCKS",
  "IF TO WAREHOUSE — STOCKS OR BACKLOAD",
  "METRIC TONS",
  "QTY AS PER PO",
  "WEIGHT (IF NEEDED)",
  "RETENTION",
  "COST PER KILO",
  "COST PER UNIT",
  "TOTAL COST",
];

const TABLE_COLS = [...TABLE_COLS_PURCH, "STATUS", "ACTION"];

const PO_FIELD_DEFAULTS = {
  retention: "",
  costPerKilo: "",
  receiptDate: "",
  supplierDrNo: "",
  actualQtyReceived: 0,
  qtyVariance: 0,
  varianceAmount: 0,
  checkerName: "",
  receiverName: "",
  storerName: "",
  remarksVariance: "",
  encoder: "",
  manager: "",
  recordedToPe: "No",
};

function normalizePurchaseOrder(row) {
  return { ...PO_FIELD_DEFAULTS, ...row };
}

function poComputedCosts(row) {
  const lines = row.lineItems || [];
  const totalCost = lineValSum(lines);
  const totalQty = lineQtySum(lines);
  const unitCost =
    totalQty > 0 ? totalCost / totalQty : Number(row.costPerUnit) || null;
  return { totalCost, unitCost, totalQty };
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
function IconGear({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
}

const selectSt = {
  padding: "10px 30px 10px 12px",
  fontSize: 14,
  border: "2px solid #F95B02",
  borderRadius: 15,
  background: "#ffffff",
  color: "#F95B02",
  cursor: "pointer",
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  width: "100%",
  appearance: "none",
  WebkitAppearance: "none",
  fontWeight: 700,
  outline: "none",
  boxShadow: "0px 8px 16px 0px rgba(0,0,0,0.2)",
};

function lineQtySum(lines) {
  return lines.reduce((s, L) => s + L.qty, 0);
}
function lineValSum(lines) {
  return lines.reduce((s, L) => s + L.val, 0);
}


/* ─── Inline Edit Row Components ── */
function POInlineEditRow({ row, onSave, onCancel }) {
  const [draft, setDraft] = useState({ ...row });
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const { totalCost, unitCost } = poComputedCosts(draft);
  const st = STATUS_BADGE[draft.status] || STATUS_BADGE.Pending;
  const cellSt = (alignRight = false) => ({
    padding: "10px 8px", textAlign: alignRight ? "right" : "center",
    color: "#374151", fontSize: 11, whiteSpace: "nowrap",
  });
  return (
    <tr style={{ background: "#fffbf7", borderBottom: "1px solid #fed7aa" }}>
      <td style={cellSt()}>{draft.transNo}</td>
      <td style={cellSt()}>{draft.poDate}</td>
      <td style={{ padding: "6px 8px" }}>
        <input type="date" value={draft.eta || ""} onChange={e => set("eta", e.target.value)} {...modalCellInput({ width: 118 })} />
      </td>
      <td style={{ padding: "4px 8px" }}>
        <input value={draft.purchaser || ""} onChange={e => set("purchaser", e.target.value)} {...modalCellInput({ width: 110 })} />
      </td>
      <td style={cellSt()}>{draft.tdtPo}</td>
      <td style={cellSt()}>{draft.vendor}</td>
      <td style={{ ...cellSt(), textAlign: "left" }}>{draft.productDesc}</td>
      <td style={{ padding: "4px 8px" }}>
        <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>Marilao</span>
      </td>
      <td style={{ padding: "2px 8px" }}>
        <select value={draft.tradingOrStocks} onChange={e => set("tradingOrStocks", e.target.value)} style={{ ...selectSt, padding: "6px 24px 6px 8px", fontSize: 11, width: 80 }}>
          <option value="Stocks">Stocks</option>
          <option value="Trading">Trading</option>
        </select>
      </td>
      <td style={{ padding: "2px 8px" }}>
        <select value={draft.warehouseType} onChange={e => set("warehouseType", e.target.value)} style={{ ...selectSt, padding: "6px 24px 6px 8px", fontSize: 11, width: 90 }}>
          <option value="Stocks">Stocks</option>
          <option value="Backload">Backload</option>
        </select>
      </td>
      <td style={{ padding: "4px 8px" }}>
        <input type="number" min={0} step="0.1" value={draft.metricTons ?? ""} onChange={e => set("metricTons", parseFloat(e.target.value) || 0)} {...modalCellInput({ width: 70, textAlign: "right" })} />
      </td>
      <td style={{ padding: "4px 8px" }}>
        <input type="number" min={0} value={draft.qtyPerPo ?? ""} onChange={e => set("qtyPerPo", parseInt(e.target.value) || 0)} {...modalCellInput({ width: 70, textAlign: "right" })} />
      </td>
      <td style={{ padding: "4px 8px" }}>
        <input value={draft.weight || ""} onChange={e => set("weight", e.target.value)} {...modalCellInput({ width: 80 })} />
      </td>
      <td style={{ padding: "4px 8px" }}>
        <input value={draft.retention || ""} onChange={e => set("retention", e.target.value)} {...modalCellInput({ width: 70 })} />
      </td>
      <td style={{ padding: "4px 8px" }}>
        <input type="number" min={0} step="0.01" value={draft.costPerKilo ?? ""} onChange={e => set("costPerKilo", parseFloat(e.target.value) || 0)} {...modalCellInput({ width: 80, textAlign: "right" })} />
      </td>
      <td style={cellSt()}>{unitCost ? fmtPHP(unitCost) : "—"}</td>
      <td style={{ ...cellSt(true), fontWeight: 600, color: "#e87c27" }}>{totalCost ? fmtPHP(totalCost) : "—"}</td>
      <td style={{ padding: "6px 8px", textAlign: "center" }}>
        <select value={draft.status} onChange={e => set("status", e.target.value)} style={{ ...selectSt, padding: "5px 22px 5px 8px", fontSize: 11, width: 100, fontWeight: 700, color: st.color, background: st.bg }}>
          {STATUS_OPTS.filter(s => s !== "All Status").map(s => <option key={s} value={s}>{s}</option>)}
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

function WHInlineEditRow({ row, onSave, onCancel }) {
  const [draft, setDraft] = useState({ ...row });
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  return (
    <tr style={{ background: "#fffbf7", borderBottom: "1px solid #fed7aa" }}>
      <td style={{ padding: "14px 10px", color: "#9ca3af", fontSize: 11, textAlign: "center" }}>{draft.transNo}</td>
      <td style={{ padding: "6px 12px" }}>
        <input type="date" value={draft.receiptDate || ""} onChange={e => set("receiptDate", e.target.value)} {...modalCellInput({ width: 130 })} />
      </td>
      <td style={{ padding: "6px 12px" }}>
        <input value={draft.supplierDrNo || ""} onChange={e => set("supplierDrNo", e.target.value)} {...modalCellInput({ width: 110 })} />
      </td>
      <td style={{ padding: "6px 12px" }}>
        <input type="number" min={0} value={draft.actualQtyReceived ?? ""} onChange={e => set("actualQtyReceived", parseFloat(e.target.value) || 0)} {...modalCellInput({ width: 80, textAlign: "right" })} />
      </td>
      <td style={{ padding: "14px 10px", textAlign: "center" }}>
        <span style={{ padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: "#d1fae5", color: "#065f46" }}>0</span>
      </td>
      <td style={{ padding: "14px 10px", textAlign: "center" }}>
        <span style={{ padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: "#d1fae5", color: "#065f46" }}>—</span>
      </td>
      <td style={{ padding: "4px 12px" }}>
        <input value={draft.encoder || ""} onChange={e => set("encoder", e.target.value)} {...modalCellInput({ width: 80 })} />
      </td>
      <td style={{ padding: "4px 12px" }}>
        <input value={draft.receiverName || ""} onChange={e => set("receiverName", e.target.value)} {...modalCellInput({ width: 80 })} />
      </td>
      <td style={{ padding: "4px 12px" }}>
        <input value={draft.checkerName || ""} onChange={e => set("checkerName", e.target.value)} {...modalCellInput({ width: 80 })} />
      </td>
      <td style={{ padding: "4px 12px" }}>
        <input value={draft.manager || ""} onChange={e => set("manager", e.target.value)} {...modalCellInput({ width: 80 })} />
      </td>
      <td style={{ padding: "4px 12px" }}>
        <input value={draft.remarksVariance || ""} onChange={e => set("remarksVariance", e.target.value)} {...modalCellInput({ width: 130 })} />
      </td>
      <td style={{ padding: "4px 12px", textAlign: "center" }}>
        <select value={draft.recordedToPe} onChange={e => set("recordedToPe", e.target.value)} style={{ ...selectSt, padding: "5px 22px 5px 8px", fontSize: 11, width: 70 }}>
          <option value="No">No</option>
          <option value="Yes">Yes</option>
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

/* ─── SheetJS loader ── */
function useSheetJS() {
  return true; // XLSX is imported as a module, always available
}

function IconUpload({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }

/* ─── EXPORT (Purchase Order Control layout) ── */
const PO_PURCH_COLS = 16;
const PO_WH_COLS = 9;
const PO_TOTAL_COLS = PO_PURCH_COLS + PO_WH_COLS;

const PO_PURCH_HEADERS = [
  "TRANS NO.",
  "INSERT DATE OF P.O.",
  "INSERT ETA",
  "INSERT NAME OF PURCHASER",
  "INSERT TDT PURCHASE ORDER #",
  "INSERT VENDOR OR SUPPLIER'S NAME",
  "INSERT PRODUCT DESCRIPTION",
  "INSERT WAREHOUSE OR CUSTOMER ORGANIZATION",
  "INSERT IF FOR TRADING OR STOCKS",
  "IF TO WAREHOUSE, INSERT STORE OF DESTINATION",
  "INSERT RETENTION",
  "INSERT QUANTITY AS PER PURCHASE ORDER",
  "INSERT WEIGHT (IF NEEDED)",
  "COST PER KILO",
  "INSERT COST PER UNIT (FOR PURCHASING)",
  "INSERT TOTAL COST OF PURCHASE",
];

const PO_WH_HEADERS = [
  "INSERT DATE OF ACTUAL RECEIPT",
  "INSERT SUPPLIER'S DELIVERY RECEIPT NO.",
  "INSERT ACTUAL QUANTITY RECEIVED",
  "QUANTITY VARIANCE (DIFF/SHORT)",
  "VARIANCE AMOUNT (DIFF/SHORT)",
  "INSERT NAME OF CHECKER",
  "INSERT NAME OF RECEIVER",
  "INSERT NAME OF STORER",
  "REMARKS / VARIANCE",
];

function exportToWis(rows, options = {}) {
  const { drSlotCount = 8 } = options;
  const wb = XLSX.utils.book_new();
  const C = (r, c) => XLSX.utils.encode_cell({ r, c });

  /* ─── Pre-compute Series groups ── */
  const seriesGroups = {};
  rows.forEach(r => {
    if (r.supplierDrNo && r.actualQtyReceived > 0) {
      const key = r.productDesc;
      if (!seriesGroups[key]) seriesGroups[key] = { drs: [], totalQty: 0 };
      seriesGroups[key].drs.push({ dr: r.supplierDrNo, qty: r.actualQtyReceived });
      seriesGroups[key].totalQty += r.actualQtyReceived;
    }
  });

  const purchDark = { patternType: "solid", fgColor: { rgb: "2F5597" } };
  const purchMid = { patternType: "solid", fgColor: { rgb: "4472C4" } };
  const whDark = { patternType: "solid", fgColor: { rgb: "548235" } };
  const whMid = { patternType: "solid", fgColor: { rgb: "70AD47" } };
  const seriesDark = { patternType: "solid", fgColor: { rgb: "BF8F00" } };
  const seriesMid = { patternType: "solid", fgColor: { rgb: "D6A800" } };
  const dataFill = { patternType: "solid", fgColor: { rgb: "DDEBF7" } };
  const grandFill = { patternType: "solid", fgColor: { rgb: "FFF2CC" } };
  const seriesDataFill = { patternType: "solid", fgColor: { rgb: "FFF9E6" } };
  const vdrFill = { patternType: "solid", fgColor: { rgb: "E2EFDA" } };
  const qtyFill = { patternType: "solid", fgColor: { rgb: "FCE4D6" } };

  const cellBorder = {
    top: { style: "thin", color: { rgb: "2F5597" } },
    bottom: { style: "thin", color: { rgb: "2F5597" } },
    left: { style: "thin", color: { rgb: "2F5597" } },
    right: { style: "thin", color: { rgb: "2F5597" } },
  };
  const hdrBorder = {
    top: { style: "thin", color: { rgb: "FFFFFF" } },
    bottom: { style: "thin", color: { rgb: "FFFFFF" } },
    left: { style: "thin", color: { rgb: "FFFFFF" } },
    right: { style: "thin", color: { rgb: "FFFFFF" } },
  };
  const seriesBorder = {
    top: { style: "thin", color: { rgb: "999999" } },
    bottom: { style: "thin", color: { rgb: "999999" } },
    left: { style: "thin", color: { rgb: "999999" } },
    right: { style: "thin", color: { rgb: "999999" } },
  };

  const f = {
    note: () => ({ name: "Arial", sz: 9, color: { rgb: "000000" } }),
    section: () => ({ name: "Arial", sz: 11, bold: true, color: { rgb: "FFFFFF" } }),
    colHdr: () => ({ name: "Arial", sz: 8, bold: true, color: { rgb: "FFFFFF" } }),
    grand: () => ({ name: "Arial", sz: 9, bold: true, color: { rgb: "000000" } }),
    body: (bold = false) => ({ name: "Arial", sz: 9, bold, color: { rgb: "000000" } }),
  };
  const a = {
    ctr: (wrap = true) => ({ horizontal: "center", vertical: "center", wrapText: wrap }),
    left: (wrap = true) => ({ horizontal: "left", vertical: "center", wrapText: wrap }),
    right: () => ({ horizontal: "right", vertical: "center" }),
  };
  const aCenter = { horizontal: "center", vertical: "center", wrapText: true };

  const phpFmt = '"₱"#,##0.00';
  const qtyFmt = "#,##0";
  const varFmt = "#,##0.00";

  const ws = {};

  const put = (r, c, v, style) => {
    const empty = v === null || v === undefined || v === "";
    ws[C(r, c)] = {
      v: empty ? "" : v,
      t: typeof v === "number" && !Number.isNaN(v) ? "n" : "s",
      s: style,
    };
  };

  const hdrStyle = (fill, border = hdrBorder) => ({
    font: f.colHdr(),
    fill,
    alignment: a.ctr(),
    border,
  });
  const dataStyle = (align, numFmt = null, bold = false) => ({
    font: f.body(bold),
    fill: dataFill,
    alignment: align,
    border: cellBorder,
    ...(numFmt ? { numFmt } : {}),
  });

  // Column layout
  const seriesSpacer = 1;
  const seriesPairs = drSlotCount;
  const seriesStart = PO_PURCH_COLS + PO_WH_COLS;
  const TOTAL_COLS = seriesStart + seriesSpacer + seriesPairs * 2 + 1;
  const seriesSectionEnd = TOTAL_COLS - 1;

  // Row 0–1: layout instructions
  put(0, 0, "1. Purchase Order System Layout should be followed.", {
    font: f.note(),
    alignment: a.left(false),
  });
  put(1, 0, "2. IF FOR THE UNIT COST IS OPTIONAL, IT SHOULD BE ADDED IF THE STORE HAS IT ON THEIR SUMMARY. IT SHOULD BE THE SAME AS THE UNIT PRICE OF THE SPECIFIC PRODUCT.", {
    font: f.note(),
    alignment: a.left(true),
  });

  // Row 2: section banners
  put(2, 0, "PURCHASING", { font: f.section(), fill: purchDark, alignment: a.ctr(false), border: hdrBorder });
  put(2, PO_PURCH_COLS, "WAREHOUSE", { font: f.section(), fill: whDark, alignment: a.ctr(false), border: hdrBorder });
  put(2, seriesStart, "", { font: f.section(), fill: dataFill, alignment: a.ctr(false), border: cellBorder }); // spacer
  put(2, seriesStart + seriesSpacer, "SERIES OF ACCEPTANCE — DELIVERY RECEIPTS", { font: f.section(), fill: seriesDark, alignment: a.ctr(false), border: hdrBorder });

  // Row 3: column headers
  PO_PURCH_HEADERS.forEach((h, ci) => put(3, ci, h, hdrStyle(purchMid)));
  PO_WH_HEADERS.forEach((h, ci) => put(3, PO_PURCH_COLS + ci, h, hdrStyle(whMid)));
  put(3, seriesStart, "", { font: f.colHdr(), fill: dataFill, alignment: a.ctr(), border: cellBorder });
  for (let p = 0; p < seriesPairs; p++) {
    const col = seriesStart + seriesSpacer + p * 2;
    put(3, col, "VDR#", { font: f.colHdr(), fill: seriesMid, alignment: a.ctr(), border: cellBorder });
    put(3, col + 1, "QTY", { font: f.colHdr(), fill: seriesMid, alignment: a.ctr(), border: cellBorder });
  }
  put(3, seriesSectionEnd, "TOTAL QTY", { font: f.colHdr(), fill: seriesMid, alignment: a.ctr(), border: cellBorder });

  // Row 4: Grand Total
  const grandStyle = { font: f.grand(), fill: grandFill, alignment: a.ctr(), border: cellBorder };
  for (let c = 0; c < TOTAL_COLS; c++) put(4, c, "", grandStyle);
  put(4, 9, "GRAND TOTAL>>>>>", { ...grandStyle, alignment: a.left(false) });
  put(4, 11, rows.reduce((s, r) => s + (r.qtyPerPo || 0), 0), { ...grandStyle, numFmt: qtyFmt });
  put(4, 12, rows.reduce((s, r) => s + (r.metricTons || 0), 0), { ...grandStyle, numFmt: varFmt });
  put(4, 13, "₱ -", grandStyle);
  put(4, 14, "₱ -", grandStyle);
  put(4, 15, rows.reduce((s, r) => s + lineValSum(r.lineItems || []), 0), { ...grandStyle, numFmt: phpFmt, alignment: a.right() });
  put(4, 18, 0, { ...grandStyle, numFmt: qtyFmt });
  put(4, 19, 0, { ...grandStyle, numFmt: varFmt });
  put(4, 20, 0, { ...grandStyle, numFmt: phpFmt, alignment: a.right() });
  const overallTotal = Object.values(seriesGroups).reduce((s, g) => s + g.totalQty, 0);
  put(4, seriesSectionEnd, overallTotal, { ...grandStyle, numFmt: qtyFmt });

  // Row 5+: data
  rows.forEach((r, i) => {
    const ri = 5 + i;
    const lines = r.lineItems || [];
    const totalCost = lineValSum(lines);
    const totalQty = lineQtySum(lines);
    const unitCost = totalQty > 0 ? totalCost / totalQty : null;
    const kilo = r.costPerKilo;

    // Purchasing columns
    const purchVals = [
      r.transNo || String(i + 1).padStart(3, "0"),
      r.poDate || "",
      r.eta || "",
      r.purchaser || "",
      r.tdtPo || "",
      r.vendor || "",
      r.productDesc || "",
      r.destination || "",
      r.tradingOrStocks || "",
      r.warehouseType || "",
      r.metricTons ?? "",
      r.qtyPerPo ?? 0,
      r.weight && r.weight !== "—" ? r.weight : "",
      r.retention || "",
      kilo === "" || kilo === null || kilo === undefined ? "" : Number(kilo) || kilo,
      unitCost,
      totalCost || 0,
    ];
    purchVals.forEach((v, ci) => {
      const isQty = ci === 11;
      const isKilo = ci === 13;
      const isUnit = ci === 14;
      const isTotal = ci === 15;
      if (isKilo || (isUnit && (v === null || v === "" || v === 0))) { put(ri, ci, "₱ -", dataStyle(a.ctr())); return; }
      if (isTotal && (!v || v === 0)) { put(ri, ci, "₱ -", dataStyle(a.right())); return; }
      put(ri, ci, v, dataStyle(isUnit || isTotal ? a.right() : ci <= 6 ? a.left() : a.ctr(), isQty ? qtyFmt : isUnit || isTotal ? phpFmt : null, ci === 0));
    });

    // Warehouse columns
    const whVals = [
      r.receiptDate || "",
      r.supplierDrNo || "",
      r.actualQtyReceived ?? 0,
      r.qtyVariance ?? 0,
      r.varianceAmount ?? 0,
      r.checkerName || "",
      r.receiverName || "",
      r.storerName || "",
      r.remarksVariance || "",
    ];
    whVals.forEach((v, ci) => {
      const col = PO_PURCH_COLS + ci;
      const isNum = ci === 2 || ci === 3;
      const isAmt = ci === 4;
      put(ri, col, v, dataStyle(isAmt ? a.right() : a.ctr(), isNum ? qtyFmt : isAmt ? varFmt : null));
    });

    // Series columns
    const sDataStyle = (fill, align, numFmt = null, bold = false) => ({
      font: f.body(bold), fill, alignment: align, border: seriesBorder, ...(numFmt ? { numFmt } : {}),
    });
    const group = seriesGroups[r.productDesc] || { drs: [], totalQty: 0 };
    put(ri, seriesStart, "", sDataStyle(dataFill, aCenter)); // spacer
    for (let p = 0; p < seriesPairs; p++) {
      const dr = group.drs[p];
      const col = seriesStart + seriesSpacer + p * 2;
      if (dr) {
        put(ri, col, dr.dr, sDataStyle(vdrFill, aCenter, null, true));
        put(ri, col + 1, dr.qty, sDataStyle(qtyFill, aCenter, qtyFmt, true));
      } else {
        put(ri, col, "", sDataStyle(vdrFill, aCenter));
        put(ri, col + 1, "", sDataStyle(qtyFill, aCenter));
      }
    }
    put(ri, seriesSectionEnd, group.totalQty, sDataStyle(seriesDataFill, aCenter, qtyFmt, true));
  });

  const lastRow = Math.max(5 + rows.length - 1, 4);
  ws["!ref"] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: lastRow, c: TOTAL_COLS - 1 });

  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: TOTAL_COLS - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: TOTAL_COLS - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: PO_PURCH_COLS - 1 } },
    { s: { r: 2, c: PO_PURCH_COLS }, e: { r: 2, c: seriesStart - 1 } },
    { s: { r: 2, c: seriesStart + seriesSpacer }, e: { r: 2, c: seriesSectionEnd } },
  ];

  ws["!cols"] = [
    { wch: 8 }, { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 16 },
    { wch: 22 }, { wch: 36 }, { wch: 22 }, { wch: 14 }, { wch: 18 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
    { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 18 },
    { wch: 4 }, // spacer
    ...Array.from({ length: seriesPairs }, () => [{ wch: 14 }, { wch: 10 }]).flat(),
    { wch: 12 },
  ];

  ws["!rows"] = [
    { hpt: 16 }, { hpt: 28 }, { hpt: 22 }, { hpt: 48 }, { hpt: 20 },
    ...rows.map(() => ({ hpt: 22 })),
  ];

  XLSX.utils.book_append_sheet(wb, ws, "PURCHASING");
  XLSX.writeFile(wb, "TDT_WIS_Purchasing_Order_Export.xlsx");
}

/* ─── IMPORT parser ── */
async function importPurchaseOrders(file, onDone, onError) {
  try {
    const { raw } = await readWorkbookSheet(file, ["PURCHASING"]);
    const headerIdx = findHeaderRowIndex(raw, ["TRANS"], 20);
    let dataStart = headerIdx >= 0 ? headerIdx + 1 : 6;
    const headers = headerIdx >= 0 ? raw[headerIdx] : null;
    if (dataStart < raw.length) {
      const maybeGrand = cellStr(raw[dataStart][9] ?? raw[dataStart][0]).toUpperCase();
      if (maybeGrand.includes("GRAND TOTAL")) dataStart += 1;
    }
    const parsed = [];
    const whStatusCol = PO_PURCH_COLS + 8;

    for (let i = dataStart; i < raw.length; i++) {
      const r = raw[i];
      if (!rowHasData(r)) continue;

      let transNo = cellStr(pickCol(r, headers, ["TRANS NO.", "TRANS #", "TRANS"], 0));
      let poDate = formatExcelDate(pickCol(r, headers, ["PO DATE", "INSERT DATE OF P.O.", "DATE"], 1));
      const col0 = cellStr(r[0]);
      const col1 = r[1];
      if (!transNo && col0 && formatExcelDate(col1).match(/^\d{4}-\d{2}-\d{2}/)) {
        transNo = col0;
        poDate = formatExcelDate(col1);
      }
      const productDesc = cellStr(pickCol(r, headers, ["PRODUCT DESCRIPTION", "PRODUCT"], 6));
      const vendor = cellStr(pickCol(r, headers, ["VENDOR", "SUPPLIER"], 5));
      if (!transNo && !productDesc && !vendor) continue;

      const weightVal = cellStr(pickCol(r, headers, ["WEIGHT", "INSERT WEIGHT"], 12));
      const statusFromPurch = cellStr(pickCol(r, headers, ["STATUS"], TABLE_COLS.length - 1));

      parsed.push(normalizePurchaseOrder({
        id: parsed.length + 1,
        transNo: transNo || String(parsed.length + 1).padStart(3, "0"),
        poDate,
        eta: formatExcelDate(pickCol(r, headers, ["ETA", "INSERT ETA"], 2)),
        purchaser: cellStr(pickCol(r, headers, ["NAME OF PURCHASER", "PURCHASER"], 3)),
        tdtPo: cellStr(pickCol(r, headers, ["TDT PURCHASE ORDER", "TDT PO", "PURCHASE ORDER"], 4)),
        vendor,
        productDesc,
        destination: "Marilao",
        tradingOrStocks: cellStr(pickCol(r, headers, ["TRADING OR STOCKS", "TRADING"], 8)) || "Stocks",
        warehouseType: cellStr(pickCol(r, headers, ["BACKLOAD", "WAREHOUSE", "STORE OF DESTINATION"], 9)) || "Stocks",
        retention: cellStr(pickCol(r, headers, ["RETENTION"], 10)),
        metricTons: cellNum(pickCol(r, headers, ["METRIC TONS"], 10)),
        qtyPerPo: cellNum(pickCol(r, headers, ["QTY AS PER PO", "QUANTITY", "QTY"], 11)),
        weight: weightVal || "—",
        costPerKilo: cellNum(pickCol(r, headers, ["COST PER KILO", "KILO"], 13)) || "",
        receiptDate: formatExcelDate(pickCol(r, headers, ["ACTUAL RECEIPT", "RECEIPT"], PO_PURCH_COLS)),
        supplierDrNo: cellStr(pickCol(r, headers, ["DELIVERY RECEIPT", "SUPPLIER DR"], PO_PURCH_COLS + 1)),
        actualQtyReceived: cellNum(pickCol(r, headers, ["ACTUAL QUANTITY RECEIVED", "ACTUAL QTY"], PO_PURCH_COLS + 2)),
        qtyVariance: cellNum(pickCol(r, headers, ["QUANTITY VARIANCE", "QTY VARIANCE"], PO_PURCH_COLS + 3)),
        varianceAmount: cellNum(pickCol(r, headers, ["VARIANCE AMOUNT"], PO_PURCH_COLS + 4)),
        checkerName: cellStr(pickCol(r, headers, ["CHECKER"], PO_PURCH_COLS + 5)),
        receiverName: cellStr(pickCol(r, headers, ["RECEIVER"], PO_PURCH_COLS + 6)),
        storerName: cellStr(pickCol(r, headers, ["STORER"], PO_PURCH_COLS + 7)),
        remarksVariance: cellStr(pickCol(r, headers, ["REMARKS", "VARIANCE"], whStatusCol)),
        status: statusFromPurch || "Pending",
        txnNo: "",
        lineItems: [],
      }));
    }

    if (!parsed.length) throw new Error("No data rows found. Fill TRANS # or product/vendor columns.");
    onDone(parsed.map(normalizePurchaseOrder));
  } catch (err) {
    onError(err.message || "Import failed.");
  }
}

export default function PurchasingOrderPage({
  initialStatusFilter = "All Status",
  orders: propOrders,
  setOrders: propSetOrders,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const api = useApi(ENDPOINTS.purchasingOrders, INITIAL_PURCHASE_ORDERS.map(normalizePurchaseOrder));
  const orders = propOrders ?? api.data;
  const setOrders = propSetOrders ?? null;
  useEffect(() => { if (!propOrders) api.getAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState(null);

  const xlsxReady = useSheetJS();
  const importRef = useRef(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [supplierFilter, setSupplierFilter] = useState("All Suppliers");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const EMPTY_CREATE_FORM = {
    poDate: "", eta: "", purchaser: "", tdtPo: "", vendor: "", productDesc: "", sku: "",
    qty: "", unitCost: "", destination: "Marilao", tradingOrStocks: "Stocks", warehouseType: "Stocks",
    metricTons: "", weight: "", retention: "", costPerKilo: "",
  };
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [activeTab, setActiveTab] = useState("purchasing");
  const [whTab, setWhTab] = useState("receiving");
  const [editingId, setEditingId] = useState(null);
  const [editingSeriesProduct, setEditingSeriesProduct] = useState(null);
  const [seriesDraft, setSeriesDraft] = useState({});
  const [drSlotCount, setDrSlotCount] = useState(8);
  const { sortBy, setSortBy, applySort } = useSort("poDate", "productDesc");
  const [sortOpen, setSortOpen] = useState(false);

  /* ── column visibility ── */
  const [hiddenCols, setHiddenCols] = useState(new Set());
  const [colVisOpen, setColVisOpen] = useState(false);
  const colVisRef = useRef(null);

  /* ── edit drawer ── */
  const [editDrawerRow, setEditDrawerRow] = useState(null);
  const [editDraft, setEditDraft] = useState(null);

  useEffect(() => {
    if (!colVisOpen) return;
    const handler = (e) => {
      if (colVisRef.current && !colVisRef.current.contains(e.target)) setColVisOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [colVisOpen]);

  const toggleCol = (key) => {
    setHiddenCols(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const openEditDrawer = (row) => { setEditDrawerRow(row); setEditDraft({ ...row }); };
  const closeEditDrawer = () => { setEditDrawerRow(null); setEditDraft(null); };
  const handleSaveDrawer = async () => {
    if (!editDraft) return;
    await handleSaveEdit(editDraft);
    closeEditDrawer();
  };

  const visiblePurchCols = PURCH_COLDEFS.filter(c => c.alwaysVisible || !hiddenCols.has(c.key));

  const handleSaveEdit = async (updated) => {
    try {
      if (setOrders) {
        setOrders(d => d.map(r => r.id === updated.id ? { ...updated } : r));
      } else {
        await api.update(updated.id, updated);
      }
      setEditingId(null);
      showToast("Row updated successfully.");
    } catch {
      showToast("Failed to save changes.", "error");
    }
  };
  const handleSaveWhEdit = async (updated) => {
    try {
      if (setOrders) {
        setOrders(d => d.map(r => r.id === updated.id ? { ...updated } : r));
      } else {
        await api.update(updated.id, updated);
      }
      setEditingId(null);
      showToast("Warehouse row updated successfully.");
    } catch {
      showToast("Failed to save changes.", "error");
    }
  };

  useEffect(() => {
    setStatusFilter(initialStatusFilter);
    setCurrentPage(1);
    closeEditDrawer();
  }, [initialStatusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    let rows = orders;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.tdtPo.toLowerCase().includes(q) ||
          r.vendor.toLowerCase().includes(q) ||
          r.txnNo.toLowerCase().includes(q) ||
          r.purchaser.toLowerCase().includes(q) ||
          r.productDesc.toLowerCase().includes(q) ||
          r.destination.toLowerCase().includes(q) ||
          String(r.transNo).includes(q)
      );
    }
    if (statusFilter !== "All Status") rows = rows.filter((r) => r.status === statusFilter);
    if (supplierFilter !== "All Suppliers") rows = rows.filter((r) => r.vendor === supplierFilter);
    if (dateRange.start) rows = rows.filter((r) => (r.poDate || "") >= dateRange.start);
    if (dateRange.end)   rows = rows.filter((r) => (r.poDate || "") <= dateRange.end);
    return rows;
  }, [orders, searchQuery, statusFilter, supplierFilter, dateRange]);

  useEffect(() => {
    if (editDrawerRow != null && !filtered.some((r) => r.id === editDrawerRow.id)) {
      closeEditDrawer();
    }
  }, [filtered, editDrawerRow]); // eslint-disable-line react-hooks/exhaustive-deps

  const sorted = useMemo(() => applySort(filtered), [filtered, sortBy]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const totalSeed = 218;

  return (
    <div style={{ background: "#f0f2f5", padding: "28px 32px 40px", display: "flex", flexDirection: "column", gap: 18 }}>

      <PageToolbar
        searchValue={searchQuery}
        searchPlaceholder="Search PO# or vendor..."
        onSearchChange={(v) => { setSearchQuery(v); setCurrentPage(1); }}
        filters={[
          { key: "status", value: statusFilter, onChange: (v) => { setStatusFilter(v); setCurrentPage(1); }, options: STATUS_OPTS, minWidth: 140 },
          { key: "supplier", value: supplierFilter, onChange: (v) => { setSupplierFilter(v); setCurrentPage(1); }, options: SUPPLIER_OPTS, minWidth: 160 },
        ]}
        primaryAction={{ label: "Create Purchase Order", onClick: () => setShowCreate(true) }}
        dateRange={dateRange}
        onDateRangeChange={(r) => { setDateRange(r); setCurrentPage(1); }}
        importExport={{
          fileInputRef: importRef,
          onFileChange: (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setImporting(true);
            importPurchaseOrders(
              file,
              async (parsed) => {
                try {
                  if (setOrders) {
                    setOrders(parsed);
                  } else {
                    await api.bulkReplace(parsed);
                  }
                  setCurrentPage(1);
                  closeEditDrawer();
                  showToast(`Imported ${parsed.length} purchase orders successfully.`);
                } catch {
                  showToast("Import succeeded but failed to save.", "error");
                } finally {
                  setImporting(false);
                  e.target.value = "";
                }
              },
              (err) => {
                setImporting(false);
                showToast(`Import failed: ${err}`, "error");
                e.target.value = "";
              }
            );
          },
          importing,
          importDisabled: !xlsxReady,
          onExport: () => {
            try {
              exportToWis(filtered, { drSlotCount });
              showToast(`Exported ${filtered.length} purchase order(s).`);
            } catch (err) {
              console.error("PO export failed:", err);
              showToast(err?.message || "Export failed.", "error");
            }
          },
        }}
      />

      <div style={{ display: "flex", gap: 4, borderBottom: "2px solid #e5e7eb", background: "#fff", borderRadius: "12px 12px 0 0", padding: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", position: "relative", zIndex: 1 }}>
        {[["purchasing","Purchase Orders"],["warehouse","Warehouse"]].map(([key,label]) => (
            <button key={key} onClick={() => { setActiveTab(key); setCurrentPage(1); }} style={{ padding: "14px 20px", background: "none", border: "none", cursor: "pointer", borderBottom: activeTab===key?"3px solid #e87c27":"3px solid transparent", color: activeTab===key?"#e87c27":"#9ca3af", fontSize: 14, fontWeight: 700, fontFamily: "inherit", marginBottom: -2 }}>{label}</button>
        ))}
      </div>

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

      {activeTab === "purchasing" && (
      <div style={{ background: "#fff", borderRadius: "0 0 14px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>

        {/* ── Column Visibility Toggle ── */}
        <div ref={colVisRef} style={{ display: "flex", justifyContent: "flex-end", padding: "6px 12px 2px", position: "relative" }}>
          <button
            onClick={() => setColVisOpen(v => !v)}
            title="Toggle column visibility"
            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 9px", border: "1px solid #d1d5db", borderRadius: 6, background: colVisOpen ? "#fff4ed" : "#fafafa", color: colVisOpen ? "#e87c27" : "#6b7280", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit", transition: "all 0.15s" }}
          >
            <IconGear size={12} /> Columns
          </button>
          {colVisOpen && (
            <div style={{ position: "absolute", top: "calc(100% + 2px)", right: 12, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 200, minWidth: 180, padding: "6px 0" }}>
              <div style={{ padding: "3px 12px 5px", fontSize: 9, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase" }}>Show / Hide Columns</div>
              {PURCH_COLDEFS.filter(c => c.hideable).map(col => (
                <label key={col.key}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 12px", cursor: "pointer", fontSize: 11, color: "#374151" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <input type="checkbox" checked={!hiddenCols.has(col.key)} onChange={() => toggleCol(col.key)} style={{ cursor: "pointer", accentColor: "#e87c27", width: 13, height: 13 }} />
                  {col.label}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* ── Compact Table ── */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 12, width: "max-content", minWidth: "100%" }}>
            <thead>
              <tr style={{ background: "#1c2235" }}>
                {visiblePurchCols.map((col) => (
                  <th key={col.key} style={{
                    padding: "12px 10px",
                    textAlign: "center",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 10,
                    whiteSpace: "nowrap",
                    letterSpacing: "0.04em",
                    userSelect: "none",
                    ...(col.sticky ? { position: "sticky", left: 0, zIndex: 3, background: "#1c2235", boxShadow: "3px 0 6px rgba(0,0,0,0.18)" } : {}),
                  }}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr><td colSpan={visiblePurchCols.length} style={{ textAlign: "center", padding: "48px 20px", color: "#9ca3af" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                  No results found for <strong style={{ color: "#374151" }}>"{searchQuery || "your filters"}"</strong>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Try a different search term or clear your filters.</div>
                </td></tr>
              )}
              {paged.map((row, idx) => {
                const isActive = editDrawerRow?.id === row.id;
                const st = STATUS_BADGE[row.status] || STATUS_BADGE.Pending;
                const { totalCost, unitCost } = poComputedCosts(row);
                const kiloDisplay = row.costPerKilo === "" || row.costPerKilo == null ? "—" : typeof row.costPerKilo === "number" ? fmtPHP(row.costPerKilo) : row.costPerKilo;
                const rowBg = isActive ? "#fff4ed" : idx % 2 === 0 ? "#fff" : "#fafafa";
                const cell = { padding: "14px 10px", fontSize: 11, color: "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 150 };
                return (
                  <tr
                    key={row.id}
                    style={{ borderBottom: "1px solid #f5f5f6", background: rowBg, cursor: "pointer", boxShadow: isActive ? "inset 3px 0 0 #e87c27" : "none" }}
                    onClick={() => openEditDrawer(row)}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#fef6f2"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = rowBg; }}
                  >
                    {visiblePurchCols.map(col => {
                      if (col.key === "transNo") return (
                        <td key="transNo" title={row.transNo} style={{ ...cell, textAlign: "center", color: "#6b7280", fontWeight: 700, position: "sticky", left: 0, background: rowBg, zIndex: 1, boxShadow: "3px 0 5px rgba(0,0,0,0.07)" }}>{row.transNo}</td>
                      );
                      if (col.key === "poInfo") return (
                        <td key="poInfo" style={{ ...cell, textAlign: "left", minWidth: 115, maxWidth: 160 }}>
                          <div title={row.tdtPo} style={{ fontWeight: 700, color: "#e87c27", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><Highlight text={row.tdtPo} query={searchQuery} /></div>
                          <div title={row.poDate} style={{ fontSize: 9, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.poDate}</div>
                        </td>
                      );
                      if (col.key === "eta") return (
                        <td key="eta" title={row.eta} style={{ ...cell, textAlign: "center" }}>{row.eta}</td>
                      );
                      if (col.key === "purchaser") return (
                        <td key="purchaser" title={row.purchaser} style={{ ...cell, textAlign: "left" }}><Highlight text={row.purchaser} query={searchQuery} /></td>
                      );
                      if (col.key === "vendorInfo") return (
                        <td key="vendorInfo" style={{ ...cell, textAlign: "left", minWidth: 120, maxWidth: 170 }}>
                          <div title={row.vendor} style={{ fontWeight: 700, color: "#111827", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><Highlight text={row.vendor} query={searchQuery} /></div>
                          <div style={{ fontSize: 9, color: "#9ca3af", whiteSpace: "nowrap" }}>Supplier</div>
                        </td>
                      );
                      if (col.key === "productDesc") return (
                        <td key="productDesc" title={row.productDesc} style={{ ...cell, textAlign: "left", minWidth: 140, maxWidth: 210 }}><Highlight text={row.productDesc} query={searchQuery} /></td>
                      );
                      if (col.key === "destination") return (
                        <td key="destination" title={row.destination} style={{ ...cell, textAlign: "center" }}><Highlight text={row.destination} query={searchQuery} /></td>
                      );
                      if (col.key === "tradingOrStocks") return (
                        <td key="tradingOrStocks" style={{ ...cell, textAlign: "center" }}>{row.tradingOrStocks}</td>
                      );
                      if (col.key === "warehouseType") return (
                        <td key="warehouseType" style={{ ...cell, textAlign: "center" }}>{row.warehouseType}</td>
                      );
                      if (col.key === "metricTons") return (
                        <td key="metricTons" style={{ ...cell, textAlign: "right" }}>{row.metricTons}</td>
                      );
                      if (col.key === "qtyPerPo") return (
                        <td key="qtyPerPo" style={{ ...cell, textAlign: "right", fontWeight: 700 }}>{row.qtyPerPo}</td>
                      );
                      if (col.key === "weight") return (
                        <td key="weight" style={{ ...cell, textAlign: "center" }}>{row.weight}</td>
                      );
                      if (col.key === "retention") return (
                        <td key="retention" style={{ ...cell, textAlign: "center" }}>{row.retention || "—"}</td>
                      );
                      if (col.key === "costPerKilo") return (
                        <td key="costPerKilo" style={{ ...cell, textAlign: "right" }}>{kiloDisplay}</td>
                      );
                      if (col.key === "unitCost") return (
                        <td key="unitCost" style={{ ...cell, textAlign: "right" }}>{unitCost ? fmtPHP(unitCost) : "—"}</td>
                      );
                      if (col.key === "totalCost") return (
                        <td key="totalCost" style={{ ...cell, textAlign: "right", fontWeight: 600, color: "#e87c27" }}>{totalCost ? fmtPHP(totalCost) : "—"}</td>
                      );
                      if (col.key === "status") return (
                        <td key="status" style={{ padding: "14px 10px", textAlign: "center", whiteSpace: "nowrap" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 12, background: st.bg, color: st.color }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: st.panel, display: "inline-block", flexShrink: 0 }} />
                            {row.status}
                          </span>
                        </td>
                      );
                      return null;
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderTop: "1px solid #f3f4f6", background: "#fafafa", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            Showing {sorted.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sorted.length)} of {sorted.length} entries
          </span>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", color: "#374151", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.4 : 1 }}><IconChevronLeft size={14} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 8).map((n) => (
              <button key={n} type="button" onClick={() => setCurrentPage(n)} style={{ width: 30, height: 30, border: n === currentPage ? "none" : "1px solid #e5e7eb", borderRadius: 6, background: n === currentPage ? "#e87c27" : "#fff", color: n === currentPage ? "#fff" : "#374151", cursor: "pointer", fontWeight: n === currentPage ? 700 : 400, fontSize: 12 }}>{n}</button>
            ))}
            <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", color: "#374151", cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.4 : 1 }}><IconChevronRight size={14} /></button>
          </div>
        </div>
      </div>
      )}

      {activeTab === "warehouse" && (
      <div style={{ background: "#fff", borderRadius: "0 0 14px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 4, borderBottom: "2px solid #e5e7eb", background: "#fff", padding: "0 0 0 0" }}>
          {[["receiving","Warehouse Receiving"],["series","Series of Acceptance"]].map(([key,label]) => (
            <button key={key} onClick={() => { setWhTab(key); setCurrentPage(1); }} style={{ padding: "14px 10px", background: "none", border: "none", cursor: "pointer", borderBottom: whTab===key?"3px solid #e87c27":"3px solid transparent", color: whTab===key?"#e87c27":"#9ca3af", fontSize: 13, fontWeight: 700, marginBottom: -2 }}>{label}</button>
          ))}
        </div>
        {whTab === "receiving" ? (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#1c2235" }}>
                {["TRANS NO.","ACTUAL RECEIPT","DELIVERY RECEIPT NO.","QTY RECEIVED","QTY VARIANCE","VARIANCE AMOUNT","ENCODER","RECIPIENT","CHECKER","MANAGER","REMARKS / MEMO","RECORDED TO PE?","ACTION"].map((h,i) => (
                  <th key={h+i} style={{ padding: "12px 10px", textAlign: h==="REMARKS / MEMO"?"left":"center", color: "#fff", fontWeight: 700, fontSize: 10, whiteSpace: "nowrap", letterSpacing: "0.04em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && <tr><td colSpan={13} style={{ textAlign: "center", padding: 48, color: "#9ca3af", fontSize: 14 }}>No warehouse receiving records found.</td></tr>}
              {paged.map((row, idx) => {
                if (editingId === row.id) {
                  return <WHInlineEditRow key={row.id} row={row} onSave={handleSaveWhEdit} onCancel={() => setEditingId(null)} />;
                }
                const actualQty = row.actualQtyReceived || 0;
                return (
                  <tr key={row.id}
                    style={{ borderBottom: "1px solid #f5f5f6", background: idx%2===0?"#fff":"#fafafa" }}
                    onMouseEnter={e => e.currentTarget.style.background="#fef6f2"}
                    onMouseLeave={e => e.currentTarget.style.background=idx%2===0?"#fff":"#fafafa"}
                  >
                    <td style={{ padding: "14px 10px", color: "#9ca3af", fontSize: 11, textAlign: "center" }}>{row.transNo}</td>
                    <td style={{ padding: "14px 10px", color: "#6b7280", whiteSpace: "nowrap", textAlign: "center" }}>{row.receiptDate || "—"}</td>
                    <td style={{ padding: "14px 10px", color: "#e87c27", fontWeight: 700, textAlign: "center" }}>{row.supplierDrNo || "—"}</td>
                    <td style={{ padding: "14px 10px", textAlign: "center", fontWeight: 700 }}>{actualQty.toLocaleString()}</td>
                    <td style={{ padding: "14px 10px", textAlign: "center" }}>
                      <span style={{ padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: "#d1fae5", color: "#065f46" }}>0</span>
                    </td>
                    <td style={{ padding: "14px 10px", textAlign: "center" }}>
                      <span style={{ padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: "#d1fae5", color: "#065f46" }}>—</span>
                    </td>
                    <td style={{ padding: "14px 10px", color: "#374151", fontSize: 12, textAlign: "center" }}>{row.encoder || "—"}</td>
                    <td style={{ padding: "14px 10px", color: "#374151", fontSize: 12, textAlign: "center" }}>{row.receiverName || "—"}</td>
                    <td style={{ padding: "14px 10px", color: "#374151", fontSize: 12, textAlign: "center" }}>{row.checkerName || "—"}</td>
                    <td style={{ padding: "14px 10px", color: "#374151", fontSize: 12, textAlign: "center" }}>{row.manager || "—"}</td>
                    <td style={{ padding: "14px 10px", color: "#6b7280", fontSize: 12, maxWidth: 180, textAlign: "left" }}>{row.remarksVariance || "—"}</td>
                    <td style={{ padding: "14px 10px", textAlign: "center" }}>
                      <span style={{ padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700,
                        background: row.recordedToPe==="Yes"?"#d1fae5":"#fef3c7",
                        color: row.recordedToPe==="Yes"?"#065f46":"#d97706" }}>
                        {row.recordedToPe || "No"}
                      </span>
                    </td>
                    <td style={{ padding: "8px 8px", textAlign: "center" }}>
                      <button onClick={() => setEditingId(row.id)} title="Edit row" style={{ padding: "5px 8px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                        <IconEdit size={12} /> Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        ) : (
        <div style={{ padding: "16px 20px" }}>
          {(() => {
            const withReceipts = sorted.filter(r => r.supplierDrNo && r.actualQtyReceived > 0);
            if (withReceipts.length === 0) {
              return <div style={{ textAlign: "center", padding: 48, color: "#9ca3af", fontSize: 14 }}>No accepted deliveries recorded yet.</div>;
            }
            const groups = {};
            withReceipts.forEach(r => {
              const key = r.productDesc;
              if (!groups[key]) {
                groups[key] = { productDesc: r.productDesc, vendor: r.vendor, drs: [], totalQty: 0 };
              }
              groups[key].drs.push({ dr: r.supplierDrNo, qty: r.actualQtyReceived, orderId: r.id });
              groups[key].totalQty += r.actualQtyReceived;
            });
            const grouped = Object.values(groups);
            const overallTotal = grouped.reduce((s, g) => s + g.totalQty, 0);
            const slots = drSlotCount;
            return (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>VDR#/QTY Pairs: {slots}</span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button onClick={() => setDrSlotCount(s => Math.min(20, s + 1))} title="Add VDR#/QTY column pair" style={{ padding: "4px 10px", border: "1px solid #16a34a", borderRadius: 5, background: "#f0fdf4", cursor: "pointer", fontSize: 13, color: "#16a34a", fontWeight: 700, fontFamily: "inherit", lineHeight: 1, display: "flex", alignItems: "center", gap: 4 }}>+ Add Pair</button>
                    <button onClick={() => setDrSlotCount(s => Math.max(1, s - 1))} title="Remove last VDR#/QTY column pair" disabled={drSlotCount <= 1} style={{ padding: "4px 10px", border: "1px solid #ef4444", borderRadius: 5, background: "#fef2f2", cursor: drSlotCount <= 1 ? "not-allowed" : "pointer", fontSize: 13, color: "#ef4444", fontWeight: 700, fontFamily: "inherit", lineHeight: 1, display: "flex", alignItems: "center", gap: 4, opacity: drSlotCount <= 1 ? 0.4 : 1 }}>− Remove Pair</button>
                  </div>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "#1c2235" }}>
                        <th rowSpan={2} style={{ padding: "12px 14px", color: "#fff", fontWeight: 700, fontSize: 10, whiteSpace: "nowrap", textAlign: "center", borderRight: "1px solid #2a3450" }}>PRODUCT DESCRIPTION</th>
                        <th rowSpan={2} style={{ padding: "12px 14px", color: "#fff", fontWeight: 700, fontSize: 10, whiteSpace: "nowrap", textAlign: "center", borderRight: "1px solid #2a3450" }}>SUPPLIER</th>
                        <th colSpan={slots * 2} style={{ padding: "12px 10px", color: "#fff", fontWeight: 700, fontSize: 10, textAlign: "center", borderBottom: "1px solid #2a3450", letterSpacing: "0.04em" }}>SERIES OF ACCEPTANCE — DELIVERY RECEIPTS</th>
                        <th rowSpan={2} style={{ padding: "12px 10px", color: "#fff", fontWeight: 700, fontSize: 10, whiteSpace: "nowrap", textAlign: "center", borderLeft: "1px solid #2a3450", minWidth: 90, letterSpacing: "0.04em" }}>TOTAL QTY RECEIVED</th>
                        <th rowSpan={2} style={{ padding: "12px 10px", color: "#fff", fontWeight: 700, fontSize: 10, whiteSpace: "nowrap", textAlign: "center", borderLeft: "1px solid #2a3450", minWidth: 60, letterSpacing: "0.04em" }}>ACTION</th>
                      </tr>
                      <tr style={{ background: "#1c2235" }}>
                        {Array.from({ length: slots }, (_, i) => (
                          <React.Fragment key={i}>
                            <th style={{ padding: "12px 10px", color: "#93a3c7", fontWeight: 600, fontSize: 10, whiteSpace: "nowrap", textAlign: "center", borderRight: "1px solid #2a3450", letterSpacing: "0.04em" }}>VDR#</th>
                            <th style={{ padding: "12px 10px", color: "#93a3c7", fontWeight: 600, fontSize: 10, whiteSpace: "nowrap", textAlign: "center", letterSpacing: "0.04em" }}>QTY</th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {grouped.map((g, gi) => {
                        const isEditing = editingSeriesProduct === g.productDesc;
                        return (
                          <tr key={g.productDesc}
                            style={{ borderBottom: "1px solid #f5f5f6", background: isEditing ? "#fffbf7" : gi % 2 === 0 ? "#fff" : "#fafafa" }}
                          >
                            <td style={{ padding: "14px 10px", color: "#111827", fontWeight: 600, fontSize: 12, textAlign: "left", borderRight: "1px solid #f3f4f6", maxWidth: 240, minWidth: 180 }}>{g.productDesc}</td>
                            <td style={{ padding: "14px 10px", color: "#6b7280", fontSize: 11, textAlign: "center", borderRight: "1px solid #f3f4f6" }}>{g.vendor}</td>
                            {Array.from({ length: slots }, (_, slotIdx) => {
                              const dr = g.drs[slotIdx];
                              if (isEditing) {
                                return (
                                  <React.Fragment key={slotIdx}>
                                    <td style={{ padding: "4px 6px", borderRight: "1px solid #f3f4f6" }}>
                                      <input value={seriesDraft[`${g.productDesc}-${slotIdx}-dr`] ?? dr?.dr ?? ""} onChange={e => setSeriesDraft(d => ({ ...d, [`${g.productDesc}-${slotIdx}-dr`]: e.target.value }))} placeholder="VDR#" {...modalCellInput({ width: 90 })} />
                                    </td>
                                    <td style={{ padding: "4px 6px" }}>
                                      <input type="number" min={0} value={seriesDraft[`${g.productDesc}-${slotIdx}-qty`] ?? dr?.qty ?? ""} onChange={e => setSeriesDraft(d => ({ ...d, [`${g.productDesc}-${slotIdx}-qty`]: parseFloat(e.target.value) || "" }))} placeholder="Qty" {...modalCellInput({ width: 60, textAlign: "right" })} />
                                    </td>
                                  </React.Fragment>
                                );
                              }
                              return (
                                <React.Fragment key={slotIdx}>
                                  <td style={{ padding: "14px 10px", color: dr ? "#e87c27" : "#e5e7eb", fontWeight: dr ? 700 : 400, fontSize: 11, textAlign: "center", borderRight: "1px solid #f3f4f6", whiteSpace: "nowrap", minWidth: 100 }}>{dr ? dr.dr : "—"}</td>
                                  <td style={{ padding: "14px 10px", color: dr ? "#111827" : "#e5e7eb", fontWeight: dr ? 700 : 400, fontSize: 12, textAlign: "center", minWidth: 60 }}>{dr ? dr.qty.toLocaleString() : "—"}</td>
                                </React.Fragment>
                              );
                            })}
                            <td style={{ padding: "14px 10px", textAlign: "center", fontWeight: 800, color: "#e87c27", fontSize: 13, borderLeft: "1px solid #f3f4f6", background: isEditing ? "#fffbf7" : "#fff4ed" }}>{g.drs.reduce((s, d) => s + d.qty, 0).toLocaleString()}</td>
                            <td style={{ padding: "8px 8px", textAlign: "center" }}>
                              {isEditing ? (
                                <div style={{ display: "flex", gap: 3, flexDirection: "column", alignItems: "center" }}>
                                  <button onClick={() => {
                                    const updated = { ...seriesDraft };
                                    const newDrs = [];
                                    for (let i = 0; i < slots; i++) {
                                      const dr = updated[`${g.productDesc}-${i}-dr`];
                                      const qty = updated[`${g.productDesc}-${i}-qty`];
                                      if (dr || qty) {
                                        newDrs.push({ dr: dr || "", qty: parseFloat(qty) || 0, orderId: g.drs[i]?.orderId });
                                      }
                                    }
                                    const existingIds = g.drs.map(d => d.orderId).filter(Boolean);
                                    setOrders(prev => {
                                      const curMax = Math.max(...prev.map(o => o.id));
                                      let next = [...prev];
                                      newDrs.forEach((nd, ni) => {
                                        if (nd.orderId) {
                                          next = next.map(o => o.id === nd.orderId ? { ...o, supplierDrNo: nd.dr, actualQtyReceived: nd.qty } : o);
                                        } else {
                                          next.push({
                                            id: curMax + 1 + ni,
                                            transNo: String(curMax + 1 + ni).padStart(3, "0"),
                                            poDate: "", eta: "", purchaser: "", tdtPo: "",
                                            vendor: g.vendor, productDesc: g.productDesc, destination: "Marilao",
                                            tradingOrStocks: "", warehouseType: "", metricTons: 0,
                                            qtyPerPo: nd.qty, weight: "", status: "Active",
                                            txnNo: `TXN-2026-${String(curMax + 1 + ni).padStart(3, "0")}`,
                                            receiptDate: "", supplierDrNo: nd.dr, actualQtyReceived: nd.qty,
                                            qtyVariance: 0, varianceAmount: 0, encoder: "", checkerName: "",
                                            receiverName: "", storerName: "", manager: "", remarksVariance: "",
                                            recordedToPe: "No", lineItems: [],
                                          });
                                        }
                                      });
                                      const removedIds = existingIds.filter(id => !newDrs.some(nd => nd.orderId === id));
                                      removedIds.forEach(id => {
                                        next = next.map(o => o.id === id ? { ...o, supplierDrNo: "", actualQtyReceived: 0, qtyVariance: 0, varianceAmount: 0 } : o);
                                      });
                                      return next;
                                    });
                                    setEditingSeriesProduct(null);
                                    setSeriesDraft({});
                                    showToast("Series of Acceptance updated.");
                                  }} title="Save" style={{ padding: "4px 7px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center" }}><IconSave size={11} /></button>
                                  <button onClick={() => { setEditingSeriesProduct(null); setSeriesDraft({}); }} title="Cancel" style={{ padding: "4px 7px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center" }}><IconX size={11} /></button>
                                </div>
                              ) : (
                                <button onClick={() => { setEditingSeriesProduct(g.productDesc); setSeriesDraft({}); }} title="Edit" style={{ padding: "4px 7px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 4, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 2, fontSize: 10, fontWeight: 600, fontFamily: "inherit" }}><IconEdit size={11} /> Edit</button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      <tr style={{ background: "#1c2235" }}>
                        <td style={{ padding: "12px 14px", fontWeight: 800, color: "#fff", fontSize: 12, textAlign: "left", borderRight: "1px solid #2a3450" }}>GRAND TOTAL</td>
                        <td style={{ padding: "12px 14px", fontWeight: 700, color: "#93a3c7", fontSize: 11, textAlign: "center", borderRight: "1px solid #2a3450" }}>{grouped.length} item(s)</td>
                        {Array.from({ length: slots * 2 }, (_, i) => (
                          <td key={i} style={{ padding: "10px", textAlign: "center", color: "#93a3c7", fontSize: 11, borderRight: i < slots * 2 - 1 ? "1px solid #2a3450" : "none" }}></td>
                        ))}
                        <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: 800, color: "#fca5a5", fontSize: 14, borderLeft: "1px solid #2a3450", background: "#2a3450" }}>{overallTotal.toLocaleString()}</td>
                        <td style={{ padding: "12px 14px", borderLeft: "1px solid #2a3450" }}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderTop: "1px solid #f3f4f6", background: "#fafafa", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            Showing {sorted.length===0?0:(currentPage-1)*PAGE_SIZE+1}–{Math.min(currentPage*PAGE_SIZE,sorted.length)} of {sorted.length} entries
          </span>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", color: "#374151", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.4 : 1 }}><IconChevronLeft size={14} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 8).map((n) => (
              <button key={n} type="button" onClick={() => setCurrentPage(n)} style={{ width: 30, height: 30, border: n === currentPage ? "none" : "1px solid #e5e7eb", borderRadius: 6, background: n === currentPage ? "#e87c27" : "#fff", color: n === currentPage ? "#fff" : "#374151", cursor: "pointer", fontWeight: n === currentPage ? 700 : 400, fontSize: 12 }}>{n}</button>
            ))}
            <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", color: "#374151", cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.4 : 1 }}><IconChevronRight size={14} /></button>
          </div>
        </div>
      </div>
      )}

      {/* ── Edit Drawer ── */}
      {editDrawerRow && editDraft && (
        <>
          <button type="button" aria-label="Close" onClick={closeEditDrawer}
            style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.35)", zIndex: 1040, border: "none", cursor: "pointer" }} />
          <aside style={{ position: "fixed", top: 0, right: 0, width: "min(500px, 100vw)", height: "100vh", background: "#fff", zIndex: 1050, boxShadow: "-8px 0 40px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* Header */}
            <div style={{ padding: "18px 22px", background: "#1c2235", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexShrink: 0 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#fff" }}>Edit Purchase Order</h2>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: (STATUS_BADGE[editDraft.status] || STATUS_BADGE.Pending).panel, color: "#fff", lineHeight: "14px" }}>
                    {editDraft.status}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: "#9ca3af", fontWeight: 500, textAlign: "left" }}>Trans #{editDraft.transNo} · {editDraft.tdtPo}</p>
              </div>
              <button type="button" onClick={closeEditDrawer} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", flexShrink: 0 }}>
                <IconX size={17} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px 24px" }}>
              {(() => {
                const fieldStyle = { display: "flex", flexDirection: "column", gap: 4 };
                const labelStyle = { fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" };
                const inputStyle = { padding: "7px 10px", border: "1.5px solid #e5e7eb", borderRadius: 7, fontSize: 12, fontFamily: "inherit", outline: "none", color: "#374151", transition: "border-color 0.15s" };
                const setD = (k, v) => setEditDraft(d => ({ ...d, [k]: v }));
                return (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "13px 14px" }}>

                    <div style={fieldStyle}>
                      <label style={labelStyle}>PO Date</label>
                      <input type="date" value={editDraft.poDate || ""} onChange={e => setD("poDate", e.target.value)} style={inputStyle}
                        onFocus={e => e.target.style.borderColor = "#e87c27"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                    </div>

                    <div style={fieldStyle}>
                      <label style={labelStyle}>ETA</label>
                      <input type="date" value={editDraft.eta || ""} onChange={e => setD("eta", e.target.value)} style={inputStyle}
                        onFocus={e => e.target.style.borderColor = "#e87c27"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                    </div>

                    <div style={fieldStyle}>
                      <label style={labelStyle}>Name of Purchaser</label>
                      <input value={editDraft.purchaser || ""} onChange={e => setD("purchaser", e.target.value)} placeholder="e.g. Maria Santos" style={inputStyle}
                        onFocus={e => e.target.style.borderColor = "#e87c27"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                    </div>

                    <div style={fieldStyle}>
                      <label style={labelStyle}>TDT Purchase Order #</label>
                      <input value={editDraft.tdtPo || ""} onChange={e => setD("tdtPo", e.target.value)} placeholder="e.g. PO-2026-0142" style={inputStyle}
                        onFocus={e => e.target.style.borderColor = "#e87c27"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                    </div>

                    <div style={fieldStyle}>
                      <label style={labelStyle}>Vendor / Supplier</label>
                      <input value={editDraft.vendor || ""} onChange={e => setD("vendor", e.target.value)} placeholder="e.g. Steel Asia Corp" style={inputStyle}
                        onFocus={e => e.target.style.borderColor = "#e87c27"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                    </div>

                    <div style={fieldStyle}>
                      <label style={labelStyle}>Destination</label>
                      <input value={editDraft.destination || ""} onChange={e => setD("destination", e.target.value)} style={inputStyle}
                        onFocus={e => e.target.style.borderColor = "#e87c27"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                    </div>

                    <div style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
                      <label style={labelStyle}>Product Description</label>
                      <textarea value={editDraft.productDesc || ""} onChange={e => setD("productDesc", e.target.value)} rows={2}
                        style={{ ...inputStyle, resize: "vertical" }}
                        onFocus={e => e.target.style.borderColor = "#e87c27"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                    </div>

                    <div style={fieldStyle}>
                      <label style={labelStyle}>Trading or Stocks</label>
                      <select value={editDraft.tradingOrStocks || "Stocks"} onChange={e => setD("tradingOrStocks", e.target.value)}
                        style={{ ...inputStyle, background: "#fff", cursor: "pointer" }}>
                        <option value="Stocks">Stocks</option>
                        <option value="Trading">Trading</option>
                      </select>
                    </div>

                    <div style={fieldStyle}>
                      <label style={labelStyle}>Warehouse Type</label>
                      <select value={editDraft.warehouseType || "Stocks"} onChange={e => setD("warehouseType", e.target.value)}
                        style={{ ...inputStyle, background: "#fff", cursor: "pointer" }}>
                        <option value="Stocks">Stocks</option>
                        <option value="Backload">Backload</option>
                      </select>
                    </div>

                    <div style={fieldStyle}>
                      <label style={labelStyle}>Metric Tons</label>
                      <input type="number" min={0} step="0.1" value={editDraft.metricTons ?? ""} onChange={e => setD("metricTons", parseFloat(e.target.value) || 0)}
                        style={{ ...inputStyle, textAlign: "right" }}
                        onFocus={e => e.target.style.borderColor = "#e87c27"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                    </div>

                    <div style={fieldStyle}>
                      <label style={labelStyle}>Qty as per PO</label>
                      <input type="number" min={0} value={editDraft.qtyPerPo ?? ""} onChange={e => setD("qtyPerPo", parseInt(e.target.value) || 0)}
                        style={{ ...inputStyle, textAlign: "right" }}
                        onFocus={e => e.target.style.borderColor = "#e87c27"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                    </div>

                    <div style={fieldStyle}>
                      <label style={labelStyle}>Weight</label>
                      <input value={editDraft.weight || ""} onChange={e => setD("weight", e.target.value)} placeholder="e.g. 2.4 MT" style={inputStyle}
                        onFocus={e => e.target.style.borderColor = "#e87c27"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                    </div>

                    <div style={fieldStyle}>
                      <label style={labelStyle}>Retention</label>
                      <input value={editDraft.retention || ""} onChange={e => setD("retention", e.target.value)} placeholder="If applicable" style={inputStyle}
                        onFocus={e => e.target.style.borderColor = "#e87c27"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                    </div>

                    <div style={fieldStyle}>
                      <label style={labelStyle}>Cost per Kilo (₱)</label>
                      <input type="number" min={0} step="0.01" value={editDraft.costPerKilo ?? ""} onChange={e => setD("costPerKilo", parseFloat(e.target.value) || "")}
                        style={{ ...inputStyle, textAlign: "right" }}
                        onFocus={e => e.target.style.borderColor = "#e87c27"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                    </div>

                    <div style={fieldStyle}>
                      <label style={labelStyle}>Status</label>
                      <select value={editDraft.status || "Pending"} onChange={e => setD("status", e.target.value)}
                        style={{ ...inputStyle, background: "#fff", cursor: "pointer", fontWeight: 700, color: (STATUS_BADGE[editDraft.status] || STATUS_BADGE.Pending).color }}>
                        {STATUS_OPTS.filter(s => s !== "All Status").map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div style={{ padding: "14px 22px", borderTop: "1px solid #f1f5f9", background: "#fafbfc", display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
              <button type="button" onClick={closeEditDrawer}
                style={{ padding: "9px 18px", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.borderColor = "#d1d5db"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e5e7eb"; }}>
                Cancel
              </button>
              <button type="button" onClick={handleSaveDrawer}
                style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#e87c27", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 8px rgba(232,124,39,0.3)", transition: "all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#d07020"}
                onMouseLeave={e => e.currentTarget.style.background = "#e87c27"}>
                <IconSave size={13} />
                Save Changes
              </button>
            </div>
          </aside>
        </>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, background: toast.type === "error" ? "#dc2626" : "#16a34a", color: "#fff", borderRadius: 10, padding: "12px 20px", fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}>
          {toast.msg}
        </div>
      )}

      {showCreate && (
        <div style={modalOverlayStyle} onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div style={{ ...modalPanelStyle, width: "min(620px, 96vw)" }}>
            <div style={modalHeaderStyle}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={modalTitleStyle}>Create Purchase Order</h2>
                <p style={{ ...modalSubtitleStyle, margin: "4px 0 0" }}>Fill in the purchase order details. Fields marked with * are required.</p>
              </div>
              <button type="button" onClick={() => setShowCreate(false)} style={modalCloseBtnStyle} aria-label="Close"
                onMouseEnter={e => e.currentTarget.style.background = "#e5e7eb"}
                onMouseLeave={e => e.currentTarget.style.background = "#f3f4f6"}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" }}>
              {(() => {
                const inp = (key, label, type = "text", placeholder = "", fullWidth = false) => (
                  <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: fullWidth ? "1 / -1" : undefined }}>
                    <label style={modalLabelStyle}>{label}</label>
                    <input type={type} value={createForm[key]} onChange={e => setCreateForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} {...modalInput()} />
                  </div>
                );
                const sel = (key, label, opts, fullWidth = false) => (
                  <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: fullWidth ? "1 / -1" : undefined }}>
                    <label style={modalLabelStyle}>{label}</label>
                    <div style={{ position: "relative" }}>
                      <select value={createForm[key]} onChange={e => setCreateForm(f => ({ ...f, [key]: e.target.value }))}
                        style={{ width: "100%", padding: "9px 30px 9px 12px", fontSize: 13, fontWeight: 700, color: "#F95B02", border: "2px solid #F95B02", borderRadius: 15, fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", outline: "none", background: "#fff", cursor: "pointer", appearance: "none", boxShadow: "0px 8px 16px 0px rgba(0,0,0,0.2)" }}>
                        {opts.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                      <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#F95B02", pointerEvents: "none", fontSize: 10 }}>▼</span>
                    </div>
                  </div>
                );
                return [
                  inp("poDate", "PO Date *", "date"),
                  inp("eta", "ETA Date", "date"),
                  inp("purchaser", "Name of Purchaser", "text", "e.g. Maria Santos"),
                  inp("tdtPo", "TDT Purchase Order #", "text", "e.g. PO-2026-0142"),
                  inp("vendor", "Vendor / Supplier *", "text", "e.g. Steel Asia Corp"),
                  sel("destination", "Destination", ["Marilao"]),
                  sel("tradingOrStocks", "Trading or Stocks", ["Stocks", "Trading"]),
                  sel("warehouseType", "Warehouse Type", ["Stocks", "Backload"]),
                  inp("sku", "SKU Code", "text", "e.g. DRB052"),
                  inp("qty", "Quantity per PO", "number", "0"),
                  inp("metricTons", "Metric Tons", "number", "0.0"),
                  inp("weight", "Weight", "text", "e.g. 2.4 MT"),
                  inp("retention", "Retention", "text", "If applicable"),
                  inp("costPerKilo", "Cost per Kilo (₱)", "number", ""),
                  inp("productDesc", "Product Description *", "text", "e.g. Deformed Round Bar...", true),
                  inp("unitCost", "Unit Cost (₱)", "number", "0.00"),
                ];
              })()}
            </div>
            <div style={modalFooterStyle}>
              <button type="button" onClick={() => setShowCreate(false)} style={modalBtnSecondary}>Cancel</button>
              <button type="button" onClick={() => {
                if (!createForm.poDate || !createForm.vendor || !createForm.productDesc) {
                  showToast("Please fill in all required fields.", "error");
                  return;
                }
                const qty = Number(createForm.qty) || 0;
                const cost = Number(createForm.unitCost) || 0;
                const lineItems = qty > 0 && cost > 0
                  ? [{ code: createForm.sku || "—", desc: createForm.productDesc, qty, unit: cost, val: qty * cost }]
                  : [];
                const newPO = normalizePurchaseOrder({
                  id: orders.length + 1,
                  transNo: String(orders.length + 1).padStart(3, "0"),
                  poDate: createForm.poDate,
                  eta: createForm.eta || "",
                  purchaser: createForm.purchaser || "",
                  tdtPo: createForm.tdtPo || "",
                  vendor: createForm.vendor,
                  productDesc: createForm.productDesc,
                  destination: createForm.destination || "Marilao",
                  tradingOrStocks: createForm.tradingOrStocks || "Stocks",
                  warehouseType: createForm.warehouseType || "Stocks",
                  metricTons: Number(createForm.metricTons) || 0,
                  qtyPerPo: qty,
                  weight: createForm.weight || "—",
                  retention: createForm.retention || "",
                  costPerKilo: createForm.costPerKilo === "" ? "" : Number(createForm.costPerKilo) || createForm.costPerKilo,
                  status: "Pending",
                  txnNo: `TXN-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, "0")}`,
                  lineItems,
                });
                setOrders(prev => [newPO, ...prev]);
                setShowCreate(false);
                setCreateForm(EMPTY_CREATE_FORM);
                showToast("Purchase order created successfully.", "success");
              }} style={modalBtnPrimary}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Create Purchase Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}