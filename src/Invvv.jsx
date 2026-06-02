import { useState, useEffect, useRef, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import ProductPage from "./ProductPage";
import EndingInventoryPage, { INITIAL_ENDING_INVENTORY } from "./EndingInventoryPage";
import StockSheetsPage from "./StockSheetsPage";
import PurchasingOrderPage, { INITIAL_PURCHASE_ORDERS } from "./PurchasingOrderPage";
import AdvanceCustomerPOPage from "./AdvanceCustomerPOPage";
import BackloadInventoryPage from "./BackloadInventoryPage";
import ReturnPage from "./ReturnPage";
import NotificationPanel from "./NotificationPanel";
import { shouldShowLowStockPrompt, markLowStockPromptShown } from "./notificationPrompt";
import Logo from "./assets/Untitled_design.svg";
import {
  getLowStockProducts,
  getUniqueStockAlerts,
  syncProductsStatus,
  normalizeWarningLevel,
} from "./productUtils";
import { INITIAL_PRODUCTS } from "./initialProducts";
import {
  buildInitialEndingInventory,
  sumEndingInventoryValue,
  formatCompactPHP,
} from "./inventoryUtils";
import {
  SEED_STOCK_IN,
  SEED_STOCK_OUT,
  toDashboardStockIn,
  toDashboardStockOut,
} from "./stockTransactionSeeds";
import MetricCard from "./MetricCard";
import SystemModal from "./SystemModal";

/* --- ICONS ----------------------------------------------- */
function IconHome({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}
function IconCart({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <path d="M3 6h18M16 10a4 4 0 01-8 0" />
    </svg>
  );
}
function IconStock({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
function IconPO({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M12 12h.01M12 16h.01M8 12h.01M8 16h.01" />
    </svg>
  );
}
function IconSheets({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18" />
    </svg>
  );
}
function IconSettings({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}
function IconBell({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}
function IconChevronDown({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 9l-7 7-7-7" />
    </svg>
  );
}
function IconChevronLeft({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
function IconChevronRight({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
function IconBox({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}
function IconTruck({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}
function IconBarChart({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6"  y1="20" x2="6"  y2="14" />
      <line x1="2"  y1="20" x2="22" y2="20" />
    </svg>
  );
}
function IconBag({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}
function IconTrendUp({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
function IconTrendDown({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  );
}
function IconWarning({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"
        stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  );
}
function IconEndingInv({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}
function IconBackload({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}
function IconAdvancePO({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}
function IconReturn({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  );
}
function IconHelp({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
function IconArrowRight({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
function IconLogOut({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}
function IconUser({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconShield({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

/* --- CUSTOM TOOLTIP --------------------------------------- */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb",
      borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#374151",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    }}>
      <p style={{ marginBottom: 4, fontWeight: 700, color: "#111827" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: "2px 0", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.fill, display: "inline-block" }} />
          <span>{p.dataKey === "stockIn" ? "Stock in" : "Stock out"}:</span>
          <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

const stockSubItems = [
  { label: "Ending Inventory",    Icon: IconEndingInv  },
  { label: "Backload Inventory",  Icon: IconBackload   },
  { label: "Advance Customer PO", Icon: IconAdvancePO  },
  { label: "Return",              Icon: IconReturn     },
];

/* --- TOOLTIP WRAPPER -------------------------------------- */
function NavTooltip({ label, children, show }) {
  const [visible, setVisible] = useState(false);
  if (!show) return children;
  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div style={{
          position: "absolute", left: "calc(100% + 10px)", top: "50%",
          transform: "translateY(-50%)",
          background: "#1e2a38", color: "#fff",
          fontSize: 12, fontWeight: 500,
          padding: "6px 12px", borderRadius: 6,
          whiteSpace: "nowrap", zIndex: 9999,
          boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
          pointerEvents: "none",
        }}>
          {label}
          <div style={{
            position: "absolute", right: "100%", top: "50%",
            transform: "translateY(-50%)",
            border: "5px solid transparent",
            borderRightColor: "#1e2a38",
          }} />
        </div>
      )}
    </div>
  );
}

/* --- HELPERS ---------------------------------------------- */
function buildLast7DaysChart(stockIn, stockOut) {
  const days = ["Sun","Mon","Tues","Wed","Thurs","Fri","Sat"];
  const today = new Date();
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = days[d.getDay()];
    const inQty  = stockIn.filter(t => t.date === dateStr).reduce((s, t) => s + t.qty, 0);
    const outQty = stockOut.filter(t => t.date === dateStr).reduce((s, t) => s + t.qty, 0);
    result.push({ day: dayLabel, stockIn: inQty, stockOut: outQty });
  }
  return result;
}

function buildLast30DaysChart(stockIn, stockOut) {
  const today = new Date();
  const result = [];
  for (let i = 3; i >= 0; i--) {
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() - i * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);
    const startStr = weekStart.toISOString().slice(0, 10);
    const endStr = weekEnd.toISOString().slice(0, 10);
    const inQty  = stockIn.filter(t => t.date >= startStr && t.date <= endStr).reduce((s, t) => s + (t.qty || 0), 0);
    const outQty = stockOut.filter(t => t.date >= startStr && t.date <= endStr).reduce((s, t) => s + (t.qty || 0), 0);
    result.push({ day: `Wk ${4 - i}`, stockIn: inQty, stockOut: outQty });
  }
  return result;
}

function buildTopReleasedItems(stockOut, products) {
  const totals = {};
  stockOut.forEach(t => {
    totals[t.sku] = (totals[t.sku] || 0) + t.qty;
  });
  const sorted = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxQty = sorted[0]?.[1] || 1;
  return sorted.map(([sku, qty]) => {
    const p = products.find(p => p.sku === sku);
    const desc = p?.description || sku;
    const shortName = desc.length > 22 ? desc.slice(0, 22) + "…" : desc;
    return {
      sku,
      name: shortName,
      value: `${qty} pcs`,
      pct: Math.round((qty / maxQty) * 100),
    };
  });
}

function buildRecentActivity(stockIn, stockOut, limit = 12) {
  const ins  = stockIn.map(t => ({
    text: `${t.description} – ${t.qty.toLocaleString()} units received`,
    time: t.date,
    type: "in",
  }));
  const outs = stockOut.map(t => ({
    text: `${t.description} – ${t.qty.toLocaleString()} units released`,
    time: t.date,
    type: "out",
  }));
  return [...ins, ...outs]
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, limit)
    .map(a => ({ ...a, time: new Date(a.time).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" }) }));
}

const inventoryDataByRange = {
  "Last 30 Days": [
    { day: "Week 1", stockIn: 2240, stockOut: 1340 },
    { day: "Week 2", stockIn: 2680, stockOut: 1820 },
    { day: "Week 3", stockIn: 1950, stockOut: 1560 },
    { day: "Week 4", stockIn: 2120, stockOut: 1680 },
  ],
  "Last 6 Months": [
    { day: "Jan", stockIn: 8500, stockOut: 6200 },
    { day: "Feb", stockIn: 7800, stockOut: 5900 },
    { day: "Mar", stockIn: 9200, stockOut: 7100 },
    { day: "Apr", stockIn: 8900, stockOut: 6800 },
    { day: "May", stockIn: 9600, stockOut: 7400 },
    { day: "Jun", stockIn: 8200, stockOut: 6500 },
  ],
  "Last 1 Year": [
    { day: "Jan", stockIn: 8500, stockOut: 6200 },
    { day: "Feb", stockIn: 7800, stockOut: 5900 },
    { day: "Mar", stockIn: 9200, stockOut: 7100 },
    { day: "Apr", stockIn: 8900, stockOut: 6800 },
    { day: "May", stockIn: 9600, stockOut: 7400 },
    { day: "Jun", stockIn: 8200, stockOut: 6500 },
    { day: "Jul", stockIn: 9100, stockOut: 7200 },
    { day: "Aug", stockIn: 8700, stockOut: 6900 },
    { day: "Sep", stockIn: 9300, stockOut: 7500 },
    { day: "Oct", stockIn: 8800, stockOut: 6700 },
    { day: "Nov", stockIn: 9500, stockOut: 7600 },
    { day: "Dec", stockIn: 9900, stockOut: 8000 },
  ],
  "Last 5 Years": [
    { day: "2020", stockIn: 95000,  stockOut: 75000 },
    { day: "2021", stockIn: 102000, stockOut: 81000 },
    { day: "2022", stockIn: 115000, stockOut: 92000 },
    { day: "2023", stockIn: 108000, stockOut: 86000 },
    { day: "2024", stockIn: 120000, stockOut: 95000 },
  ],
};

/* --- PROFILE PAGE ----------------------------------------- */
function ProfileField({ label, value, editing, name, onChange, type = "text" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, textAlign: "left" }}>
      <label style={{
        fontSize: 10, fontWeight: 700, color: "#b0b9c6",
        textTransform: "uppercase", letterSpacing: "0.07em", textAlign: "left",
      }}>
        {label}
      </label>
      {editing ? (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          style={{
            padding: "9px 12px", fontSize: 13, fontWeight: 500, color: "#111827",
            border: "1.5px solid #e87c27", borderRadius: 9, outline: "none",
            fontFamily: "inherit", background: "#fff", boxSizing: "border-box",
            boxShadow: "0 0 0 3px rgba(232,124,39,0.1)", textAlign: "left",
          }}
        />
      ) : (
        <p style={{
          fontSize: 13, color: "#1e293b", fontWeight: 500,
          padding: "8px 0 7px", borderBottom: "1px solid #f1f5f9", margin: 0,
          textAlign: "left",
        }}>
          {value || "—"}
        </p>
      )}
    </div>
  );
}

function ProfilePage({ profile, onSave, onClose }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...profile });
  const loginTime = useState(() =>
    new Date().toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })
  )[0];

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave(form);
    setEditing(false);
  };
  const handleCancel = () => { setForm({ ...profile }); setEditing(false); };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 620,
        maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 32px 80px rgba(0,0,0,0.22)",
        animation: "wisModalFrameIn 0.28s cubic-bezier(0.16,1,0.3,1)",
      }} onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div style={{
          padding: "22px 28px 18px", borderBottom: "1px solid #f1f5f9",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#fff", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Flat solid avatar — no gradient, no shadow */}
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "#e87c27",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: 20, flexShrink: 0,
            }}>
              {(form.name || "?")[0].toUpperCase()}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a", textAlign: "left" }}>
                My Profile
              </h2>
              {/* Role pill badge instead of plain text */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  fontSize: 11, fontWeight: 600, color: "#e87c27",
                  padding: "3px 10px", borderRadius: 20,
                  background: "#fff7ed", border: "1px solid #fde8cc",
                }}>
                  <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  {form.role}
                </span>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{form.department}</span>
              </div>
            </div>
          </div>
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32, height: 32, border: "1px solid #e5e7eb", borderRadius: 8,
              background: "#fafafa", color: "#9ca3af", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "#f1f5f9";
              e.currentTarget.style.color = "#374151";
              e.currentTarget.style.borderColor = "#d1d5db";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "#fafafa";
              e.currentTarget.style.color = "#9ca3af";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{
          padding: "20px 28px 4px", overflowY: "auto", flex: 1,
          display: "flex", flexDirection: "column", gap: 16,
        }}>

          {/* Personal Information */}
          <section style={{
            background: "#fffdf9", borderRadius: 12, padding: "18px 20px",
            border: "1px solid #fde8cc", borderLeft: "3px solid #e87c27",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: "#e87c27",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", flexShrink: 0,
              }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <h3 style={{
                margin: 0, fontSize: 11, fontWeight: 700, color: "#0f172a",
                textTransform: "uppercase", letterSpacing: "0.07em",
              }}>Personal Information</h3>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                background: "#fff7ed", color: "#e87c27", border: "1px solid #fde8cc",
              }}>editable</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <ProfileField label="Full Name" value={form.name} editing={editing} name="name" onChange={handleChange} />
              <ProfileField label="Email Address" value={form.email} editing={editing} name="email" onChange={handleChange} type="email" />
              <ProfileField label="Contact Number" value={form.phone} editing={editing} name="phone" onChange={handleChange} />
            </div>
          </section>

          {/* Work Information */}
          <section style={{
            background: "#fffdf9", borderRadius: 12, padding: "18px 20px",
            border: "1px solid #fde8cc", borderLeft: "3px solid #e87c27",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: "#e87c27",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", flexShrink: 0,
              }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
                </svg>
              </div>
              <h3 style={{
                margin: 0, fontSize: 11, fontWeight: 700, color: "#0f172a",
                textTransform: "uppercase", letterSpacing: "0.07em",
              }}>Work Information</h3>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                background: "#fff7ed", color: "#e87c27", border: "1px solid #fde8cc",
              }}>editable</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <ProfileField label="Role" value={form.role} editing={editing} name="role" onChange={handleChange} />
              <ProfileField label="Department" value={form.department} editing={editing} name="department" onChange={handleChange} />
              <ProfileField label="Location" value={form.location} editing={editing} name="location" onChange={handleChange} />
            </div>
          </section>

          {/* Account Info — neutral, read-only */}
          <section style={{
            background: "#fafbfc", borderRadius: 12, padding: "18px 20px",
            border: "1px solid #eaedf1",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: "#f1f5f9",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#94a3b8", flexShrink: 0,
              }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h3 style={{
                margin: 0, fontSize: 11, fontWeight: 700, color: "#64748b",
                textTransform: "uppercase", letterSpacing: "0.07em",
              }}>Account Info</h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <ProfileField label="Username" value={form.email?.split("@")[0] || "admin"} editing={false} />
              <ProfileField label="Last Log In" value={loginTime} editing={false} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4, textAlign: "left" }}>
                <label style={{
                  fontSize: 10, fontWeight: 700, color: "#b0b9c6",
                  textTransform: "uppercase", letterSpacing: "0.07em", textAlign: "left",
                }}>Password</label>
                <button
                  type="button"
                  style={{
                    alignSelf: "flex-start", marginTop: 4,
                    padding: "7px 16px", borderRadius: 8,
                    border: "1.5px solid #e5e7eb",
                    background: "#fff", color: "#64748b",
                    fontSize: 11, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "#e87c27";
                    e.currentTarget.style.color = "#e87c27";
                    e.currentTarget.style.background = "#fff7ed";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    e.currentTarget.style.color = "#64748b";
                    e.currentTarget.style.background = "#fff";
                  }}
                  onClick={() => alert("Password change flow coming soon.")}
                >
                  Change Password
                </button>
              </div>
            </div>
          </section>

          {/* Info note */}
          <div style={{
            background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10,
            padding: "12px 16px", fontSize: 12, color: "#92400e",
            display: "flex", gap: 10, alignItems: "flex-start", lineHeight: 1.5,
            marginBottom: 8,
          }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>
              <strong>Note:</strong> Personal and Work Information can be edited. Account Info fields (username, password, last login) are managed by your system administrator.
            </span>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "16px 28px", borderTop: "1px solid #f1f5f9",
          background: "#fafbfc", display: "flex", justifyContent: "flex-end", gap: 8, flexShrink: 0,
        }}>
          {editing ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: "9px 22px", borderRadius: 9, border: "1px solid #e2e8f0",
                  background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600,
                  color: "#374151", fontFamily: "inherit", transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
              >Cancel</button>
              <button
                type="button"
                onClick={handleSave}
                style={{
                  padding: "9px 22px", borderRadius: 9, border: "none",
                  background: "#e87c27",
                  color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700,
                  fontFamily: "inherit", boxShadow: "0 2px 8px rgba(232,124,39,0.25)",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "#d07020";
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(232,124,39,0.35)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "#e87c27";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(232,124,39,0.25)";
                }}
              >Save Changes</button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              style={{
                padding: "9px 22px", borderRadius: 9, border: "none",
                background: "#e87c27",
                color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700,
                fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8,
                boxShadow: "0 2px 8px rgba(232,124,39,0.25)",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "#d07020";
                e.currentTarget.style.boxShadow = "0 4px 14px rgba(232,124,39,0.35)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "#e87c27";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(232,124,39,0.25)";
              }}
            >
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ onLogout, userName }) {
  const [activeNav, setActiveNav]         = useState("Home");
  const [stockExpanded, setStockExpanded] = useState(false);
  const [dateRange, setDateRange]         = useState("Last 30 Days");
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const [productStatusFilter, setProductStatusFilter] = useState("All Status");
  const [poStatusFilter, setPoStatusFilter]           = useState("All Status");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationTab, setNotificationTab] = useState("all");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState("All Warehouses");
  const [userProfile, setUserProfile] = useState({
    name: userName || "Admin User",
    email: "chelsea.lopez@tdt.com",
    phone: "+63 917 123 4567",
    role: "Warehouse Administrator",
    department: "Operations",
    location: "Marilao Warehouse",
  });
  const sidebarRef = useRef(null);
  const profileRef = useRef(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };
  const lowStockPromptChecked = useRef(false);
  const displayName = userProfile.name || "Admin User";
  const firstName = displayName.split(" ")[0];

  const [products, setProducts] = useState(() =>
    syncProductsStatus(INITIAL_PRODUCTS).map((p) => ({
      ...p,
      warningLevel: normalizeWarningLevel(p.warningLevel),
      targetMax: Math.max(
        normalizeWarningLevel(p.warningLevel),
        Number(p.targetMax) || normalizeWarningLevel(p.warningLevel) * 4
      ),
    }))
  );
  const [stockInRows, setStockInRows] = useState(SEED_STOCK_IN);
  const [stockOutRows, setStockOutRows] = useState(SEED_STOCK_OUT);
  const stockIn = useMemo(() => toDashboardStockIn(stockInRows), [stockInRows]);
  const stockOut = useMemo(() => toDashboardStockOut(stockOutRows), [stockOutRows]);
  const [purchaseOrders, setPurchaseOrders] = useState(INITIAL_PURCHASE_ORDERS);
  const [endingInventory, setEndingInventory] = useState(() =>
    buildInitialEndingInventory(INITIAL_ENDING_INVENTORY),
  );

  const pendingDeliveries = useMemo(
    () => purchaseOrders.filter((o) => o.status === "Pending"),
    [purchaseOrders],
  );
  const pendingDeliveryCount = pendingDeliveries.length;
  const totalInventoryValue = useMemo(
    () => sumEndingInventoryValue(endingInventory),
    [endingInventory],
  );
  const transactionsToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return stockIn.filter((t) => t.date === today).length + stockOut.filter((t) => t.date === today).length;
  }, [stockIn, stockOut]);

  const goToPendingDeliveries = () => {
    setPoStatusFilter("Pending");
    setActiveNav("Purchasing Order");
  };
  const goToEndingInventory = () => {
    setStockExpanded(true);
    setActiveNav("Ending Inventory");
  };
  const goToStockSheets = () => setActiveNav("Stock Sheets");

  const lowStockAll      = getLowStockProducts(products);
  const stockAlerts      = getUniqueStockAlerts(products);
  const topReleasedItems = buildTopReleasedItems(stockOut, products);
  const recentActivity        = buildRecentActivity(stockIn, stockOut, 30);
  const notificationActivity  = buildRecentActivity(stockIn, stockOut, 20);
  const notificationCount     = stockAlerts.length + notificationActivity.length;
  const chartData = dateRange === "Last 7 Days"
    ? buildLast7DaysChart(stockIn, stockOut)
    : dateRange === "Last 30 Days"
    ? buildLast30DaysChart(stockIn, stockOut)
    : inventoryDataByRange[dateRange] || [];
  const chartYMax = (() => {
    const peak = chartData.reduce((m, d) => Math.max(m, d.stockIn || 0, d.stockOut || 0), 0);
    if (peak <= 0) return 100;
    const padded = peak * 1.25;
    const step = padded <= 120 ? 25 : padded <= 600 ? 50 : 100;
    return Math.ceil(padded / step) * step;
  })();

  const goToLowStock = () => {
    setNotificationsOpen(false);
    setProductStatusFilter("Low Stock");
    setActiveNav("Product");
  };

  useEffect(() => {
    setNotificationsOpen(false);
  }, [activeNav]);

  useEffect(() => {
    if (lowStockPromptChecked.current || stockAlerts.length === 0) return;
    lowStockPromptChecked.current = true;
    const userId = null;
    if (!shouldShowLowStockPrompt(userId)) return;
    setNotificationTab("stock");
    setNotificationsOpen(true);
    markLowStockPromptShown(userId);
  }, [stockAlerts.length]);

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        if (profileMenuOpen) setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, [profileMenuOpen]);

  const SIDEBAR_FULL      = 250;
  const SIDEBAR_COLLAPSED = 68;
  const sidebarWidth      = sidebarOpen ? SIDEBAR_FULL : SIDEBAR_COLLAPSED;

  const menuItems = [
    { label: "Home",             Icon: IconHome,   hasChildren: false },
    { label: "Product",          Icon: IconCart,   hasChildren: false },
    { label: "Stock Management", Icon: IconStock,  hasChildren: true  },
    { label: "Purchasing Order", Icon: IconPO,     hasChildren: false },
    { label: "Stock Sheets",     Icon: IconSheets, hasChildren: false },
  ];

  const isAnyStockSubActive = stockSubItems.some(s => s.label === activeNav);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { width: 100%; height: 100%; overflow: hidden; }
        body { font-family: 'Poppins', sans-serif; background: #f5f6fa; }
        #root { max-width: 100% !important; width: 100% !important; border: none !important; }
        #scroll-area::-webkit-scrollbar { width: 4px; }
        #scroll-area::-webkit-scrollbar-track { background: #f1f1f1; }
        #scroll-area::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }

        .nav-btn {
          display: flex; align-items: center; gap: 12px;
          width: 100%; padding: 11px 0;
          background: transparent; border: none; border-left: 3px solid transparent;
          cursor: pointer; text-align: left;
          color: #8b95a9; font-size: 14px; font-weight: 400;
          font-family: 'Poppins', sans-serif;
          transition: background 0.15s ease, color 0.15s ease;
          border-radius: 0;
          justify-content: center;
        }
        .nav-btn.expanded {
          padding: 11px 20px;
          justify-content: flex-start;
        }
        .nav-btn:hover { background: rgba(255,255,255,0.05); color: #c8cdd6; }
        .nav-btn.active {
          border-left: 3px solid #e87c27;
          background: rgba(232,124,39,0.08);
          color: #fff; font-weight: 600;
        }
        .nav-btn.active svg { color: #e87c27; }

        .sub-btn {
          display: flex; align-items: center; gap: 10px;
          width: 100%; padding: 9px 20px 9px 48px;
          background: transparent; border: none; border-left: 3px solid transparent;
          cursor: pointer; text-align: left;
          color: #6b7585; font-size: 13px; font-weight: 400;
          font-family: 'Poppins', sans-serif;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .sub-btn:hover { background: rgba(255,255,255,0.04); color: #a0a8b4; }
        .sub-btn.active {
          border-left: 3px solid #e87c27;
          background: rgba(232,124,39,0.08);
          color: #e87c27; font-weight: 600;
        }

        .sidebar-transition {
          transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          overflow-x: hidden;
          overflow-y: hidden;
        }
        .label-fade {
          transition: opacity 0.15s ease, width 0.25s ease;
          white-space: nowrap;
          overflow: hidden;
        }
        .toggle-btn {
          display: flex; align-items: center; justify-content: center;
          width: 26px; height: 26px; border-radius: 50%;
          background: #1e2a38; border: 2px solid #2d3e52;
          color: #8b95a9; cursor: pointer;
          transition: all 0.2s ease; flex-shrink: 0;
        }
        .toggle-btn:hover { background: #e87c27; border-color: #e87c27; color: #fff; }

        .alert-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px;
          text-align: left;
          border-bottom: 1px solid #f3f4f6;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .alert-row:last-child { border-bottom: none; }
        .alert-row:hover { background: #fffbf5; }
        .alert-row:hover .alert-arrow { opacity: 1; transform: translateX(2px); }
        .alert-arrow {
          opacity: 0;
          transition: opacity 0.15s ease, transform 0.15s ease;
          color: #e87c27;
          display: flex; align-items: center;
        }

        .activity-row {
          display: flex; align-items: center; gap: 14px;
          padding: 13px 0;
          border-bottom: 1px solid #f3f4f6;
          cursor: pointer;
          transition: background 0.12s;
          text-align: left;
        }
        .activity-row:last-child { border-bottom: none; }
        .activity-row:hover { background: #fafafa; }

        .dashboard-scroll-panel {
          flex: 1; overflow-y: auto; overflow-x: hidden;
        }
        .dashboard-scroll-panel::-webkit-scrollbar { width: 4px; }
        .dashboard-scroll-panel::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 2px; }
        .dashboard-scroll-panel::-webkit-scrollbar-track { background: transparent; }

        .dashboard-pair-card {
          background: #fff;
          border-radius: 14px;
          padding: 16px 18px;
          box-shadow: 0px 10px 21px rgba(0,0,0,0.07), 0px 2px 6px rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
          min-height: 400px;
          height: 100%;
        }
        .dashboard-pair-chart {
          flex: 1;
          min-height: 280px;
          width: 100%;
        }
        .dashboard-pair-list {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 4px;
          min-height: 280px;
        }
        .dashboard-pair-list-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex: 1;
        }
        .dashboard-pair-bar-track {
          height: 14px;
          background: #f3f4f6;
          border-radius: 0;
          overflow: hidden;
        }
        .dashboard-pair-bar-fill {
          height: 100%;
          border-radius: 0;
        }

        .notif-backdrop {
          position: fixed; inset: 0; z-index: 1999; background: transparent;
        }
        .profile-dropdown {
          position: absolute; top: calc(100% + 10px); right: 0;
          width: 220px;
          background: #fff; border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1), 0 2px 10px rgba(0,0,0,0.05);
          border: 1px solid #e5e7eb;
          z-index: 2000;
          display: flex; flex-direction: column; overflow: hidden;
          animation: slideDown 0.15s ease;
        }
        .sidebar-dropdown {
          position: absolute;
          width: 190px;
          background: #141c25;
          border: 1px solid #1e2a38;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          z-index: 2000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: slideRight 0.15s ease;
        }
        @keyframes slideRight {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .sidebar-dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
          font-size: 13px;
          color: #9ca3af;
          font-weight: 500;
          transition: background 0.15s, color 0.15s;
        }
        .sidebar-dropdown-item:hover {
          background: #1e2a38;
          color: #fff;
        }
        .notif-panel {
          position: absolute; top: calc(100% + 10px); right: 0;
          width: min(420px, calc(100vw - 48px));
          max-height: min(560px, calc(100vh - 96px));
          background: #fff; border-radius: 14px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.14), 0 4px 14px rgba(0,0,0,0.08);
          border: 1px solid #e5e7eb;
          z-index: 2000;
          display: flex; flex-direction: column; overflow: hidden;
          animation: notifSlideIn 0.18s ease;
        }
        @keyframes notifSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .notif-panel-body {
          flex: 1; overflow-y: auto; min-height: 0; max-height: 400px;
        }
        .notif-panel-body::-webkit-scrollbar { width: 5px; }
        .notif-panel-body::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
        .notif-item-btn {
          display: flex; align-items: center; gap: 12px; width: 100%;
          padding: 12px 16px; border: none; border-bottom: 1px solid #f3f4f6;
          background: #fff; cursor: pointer; text-align: left;
          transition: background 0.15s ease;
        }
        .notif-item-btn:hover { background: #fff7ed; }
        .notif-item-static {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px; border-bottom: 1px solid #f3f4f6;
        }
        .notif-footer-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          padding: 10px 14px; border-radius: 8px; border: none; cursor: pointer;
          font-size: 11px; font-weight: 700; font-family: inherit;
          transition: opacity 0.15s ease;
        }
        .notif-footer-btn:hover { opacity: 0.9; }
        .notif-footer-primary {
          flex: 1; background: #e87c27; color: #fff;
        }
        .notif-footer-secondary {
          flex: 1; background: #fff; color: #374151; border: 1px solid #e5e7eb;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes metricPulse {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.15); opacity: 0.25; }
        }

        @keyframes wisModalFrameIn {
          from { opacity: 0; transform: scale(0.97) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <div style={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden" }}>

        {/* -- SIDEBAR -- */}
        <aside
          ref={sidebarRef}
          className="sidebar-transition"
          style={{
            width: sidebarWidth, minWidth: sidebarWidth, height: "100vh",
            background: "#141C25", display: "flex", flexDirection: "column",
            flexShrink: 0, position: "relative", overflowX: "hidden", overflowY: "hidden", zIndex: 1,
          }}
        >
          <div style={{
            padding: "16px 14px 12px", display: "flex", alignItems: "center",
            justifyContent: sidebarOpen ? "space-between" : "center",
            gap: 8, minHeight: 64,
          }}>
            {sidebarOpen && (
              <img src={Logo} alt="TDT PowerSteel Logo"
                style={{ width: "195px", height: "auto", display: "block", flexShrink: 0 }} />
            )}
            <button className="toggle-btn" onClick={() => {
                setSidebarOpen(v => {
                  if (v) { setSettingsOpen(false); setHelpOpen(false); }
                  return !v;
                });
              }}
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}>
              {sidebarOpen ? <IconChevronLeft size={14} /> : <IconChevronRight size={14} />}
            </button>
          </div>

          <div style={{ height: 2, background: "#1e2a38", margin: "0 14px 12px" }} />

          {sidebarOpen && (
            <p style={{
              fontSize: 12, fontWeight: 700, color: "#3d4f63",
              letterSpacing: "0.12em", textTransform: "uppercase",
              padding: "10px 20px 8px",
            }}>Menu</p>
          )}

          <nav style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", paddingBottom: 20 }}>
            {menuItems.map(({ label, Icon, hasChildren }) => {
              const isActive     = activeNav === label;
              const isItemActive = isActive;

              return (
                <div key={label}>
                  <NavTooltip label={label} show={!sidebarOpen}>
                    <button
                      className={`nav-btn ${sidebarOpen ? "expanded" : ""} ${isItemActive ? "active" : ""}`}
                      onClick={() => {
                        if (hasChildren) {
                          if (sidebarOpen) {
                            setStockExpanded(v => !v);
                          } else {
                            setSidebarOpen(true);
                            setStockExpanded(true);
                          }
                          setActiveNav(label);
                        } else {
                          if (label === "Product") setProductStatusFilter("All Status");
                          if (label === "Purchasing Order") setPoStatusFilter("All Status");
                          setActiveNav(label);
                        }
                      }}
                    >
                      <Icon size={25} style={{ flexShrink: 0 }} />
                      {sidebarOpen && (
                        <>
                          <span style={{ flex: 1 }}>{label}</span>
                          {hasChildren && (
                            <span style={{
                              display: "flex",
                              transform: stockExpanded ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform .22s ease", opacity: 0.6,
                            }}>
                              <IconChevronDown size={13} />
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  </NavTooltip>

                  {hasChildren && stockExpanded && sidebarOpen && (
                    <div>
                      {stockSubItems.map(({ label: subLabel, Icon: SubIcon }) => (
                        <button key={subLabel}
                          className={`sub-btn ${activeNav === subLabel ? "active" : ""}`}
                          onClick={() => setActiveNav(subLabel)}>
                          <SubIcon size={15} />
                          {subLabel}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <div style={{ height: 1, background: "#1e2a38", margin: "12px 14px 0" }} />

            {sidebarOpen && (
              <p style={{
                fontSize: 12, fontWeight: 700, color: "#3d4f63",
                letterSpacing: "0.12em", textTransform: "uppercase",
                padding: "12px 20px 8px",
              }}>GENERAL</p>
            )}

            <div>
              <NavTooltip label="Settings" show={!sidebarOpen}>
                <button
                  type="button"
                  className={`nav-btn ${sidebarOpen ? "expanded" : ""} ${activeNav === "Settings" ? "active" : ""}`}
                  onClick={() => {
                    if (!sidebarOpen) {
                      setSidebarOpen(true);
                      setSettingsOpen(true);
                    } else {
                      setSettingsOpen((current) => !current);
                    }
                    setActiveNav("Settings");
                  }}
                >
                  <IconSettings size={22} />
                  {sidebarOpen && (
                    <>
                      <span style={{ flex: 1 }}>Settings</span>
                      <span style={{
                        display: "flex",
                        transform: settingsOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform .22s ease", opacity: 0.6,
                      }}>
                        <IconChevronDown size={13} />
                      </span>
                    </>
                  )}
                </button>
              </NavTooltip>

              {settingsOpen && sidebarOpen && (
                <div>
                  <button type="button"
                    className={`sub-btn ${activeNav === "user-management" ? "active" : ""}`}
                    onClick={() => { setActiveNav("user-management"); setActiveModal("user-management"); }}>
                    <IconUser size={15} />
                    User Management
                  </button>
                  <button type="button"
                    className={`sub-btn ${activeNav === "stock-limits" ? "active" : ""}`}
                    onClick={() => { setActiveNav("stock-limits"); setActiveModal("stock-limits"); }}>
                    <IconShield size={15} />
                    Stock Limits
                  </button>
                </div>
              )}
            </div>

            <div style={{ marginTop: 4 }}>
              <NavTooltip label="Help" show={!sidebarOpen}>
                <button
                  type="button"
                  className={`nav-btn ${sidebarOpen ? "expanded" : ""} ${activeNav === "Help" ? "active" : ""}`}
                  onClick={() => {
                    if (!sidebarOpen) {
                      setSidebarOpen(true);
                      setHelpOpen(true);
                    } else {
                      setHelpOpen((current) => !current);
                    }
                    setActiveNav("Help");
                  }}
                >
                  <IconHelp size={22} />
                  {sidebarOpen && (
                    <>
                      <span style={{ flex: 1 }}>Help</span>
                      <span style={{
                        display: "flex",
                        transform: helpOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform .22s ease", opacity: 0.6,
                      }}>
                        <IconChevronDown size={13} />
                      </span>
                    </>
                  )}
                </button>
              </NavTooltip>

              {helpOpen && sidebarOpen && (
                <div>
                  <button type="button"
                    className={`sub-btn ${activeNav === "user-guide" ? "active" : ""}`}
                    onClick={() => { setActiveNav("user-guide"); setActiveModal("user-guide"); }}>
                    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
                    User Guide
                  </button>
                  <button type="button"
                    className={`sub-btn ${activeNav === "faqs" ? "active" : ""}`}
                    onClick={() => { setActiveNav("faqs"); setActiveModal("faqs"); }}>
                    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    FAQs
                  </button>
                  <button type="button"
                    className={`sub-btn ${activeNav === "about" ? "active" : ""}`}
                    onClick={() => { setActiveNav("about"); setActiveModal("about"); }}>
                    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    About
                  </button>
                  <button type="button"
                    className={`sub-btn ${activeNav === "contact" ? "active" : ""}`}
                    onClick={() => { setActiveNav("contact"); setActiveModal("contact"); }}>
                    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    Contact Support
                  </button>
                </div>
              )}
            </div>
          </nav>
        </aside>

        {/* -- MAIN COLUMN -- */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflow: "hidden" }}>

          {/* -- Header -- */}
          <header style={{
            minHeight: 80, background: "#fff",
            borderBottom: "1px solid #e9ecef",
            padding: "16px 36px", display: "flex",
            alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: "#111827", letterSpacing: "-0.5px", margin: 0, textAlign: "left" }}>
                {activeNav === "Product"               ? "List of SKU"
                  : activeNav === "Ending Inventory"   ? "Ending Inventory"
                  : activeNav === "Stock Sheets"       ? "Stock Sheets"
                  : activeNav === "Purchasing Order"   ? "Purchasing Orders"
                  : activeNav === "Backload Inventory" ? "Backload Inventory"
                  : activeNav === "Advance Customer PO"? "Advance Customer PO"
                  : activeNav === "Return"             ? "Returns"
                  : `Welcome Back, ${firstName}!`}
              </h1>
              {activeNav === "Product"                && <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>Master list of all Stock Keeping Units</p>}
              {activeNav === "Ending Inventory"       && <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0", textAlign: "left" }}>Monthly Warehouse Inventory</p>}
              {activeNav === "Stock Sheets"           && <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>Stock transaction records</p>}
              {activeNav === "Purchasing Order"       && <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>Manage purchase orders from suppliers</p>}
              {activeNav === "Backload Inventory"     && <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0", textAlign: "left" }}>Track backloaded inventory</p>}
              {activeNav === "Advance Customer PO"    && <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0", textAlign: "left" }}>Advance customer purchase orders</p>}
              {activeNav === "Return"                 && <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>Manage returned items</p>}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ position: "relative", minWidth: 160 }}>
                <select
                  value={selectedWarehouse}
                  onChange={e => setSelectedWarehouse(e.target.value)}
                  style={{
                    padding: "8px 32px 8px 12px", fontSize: 13, fontWeight: 600,
                    border: "1.5px solid #e5e7eb", borderRadius: 9,
                    background: "#fff", color: "#374151", cursor: "pointer",
                    fontFamily: "inherit", appearance: "none", outline: "none",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  {["All Warehouses", "Manila Warehouse", "Cebu Warehouse", "Davao Warehouse"].map(w => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
                <span style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  pointerEvents: "none", color: "#6b7280",
                }}>
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M19 9l-7 7-7-7"/></svg>
                </span>
              </div>

              <div style={{ position: "relative", zIndex: notificationsOpen ? 2001 : undefined }}>
                <button
                  type="button"
                  onClick={() => { setNotificationTab("all"); setNotificationsOpen((v) => !v); }}
                  title="Notifications"
                  aria-expanded={notificationsOpen}
                  aria-haspopup="dialog"
                  style={{
                    position: "relative", background: "none", border: "none", padding: 4,
                    color: notificationsOpen ? "#e87c27" : "#374151",
                    cursor: "pointer", display: "flex", alignItems: "center",
                  }}
                >
                  <IconBell size={26} />
                  {notificationCount > 0 && (
                    <span style={{
                      position: "absolute", top: -2, right: -4,
                      background: "#ef4444", color: "#fff", borderRadius: "50%",
                      minWidth: 18, height: 18, fontSize: 9, fontWeight: 800,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "0 4px",
                    }}>
                      {notificationCount > 99 ? "99+" : notificationCount}
                    </span>
                  )}
                </button>
                <NotificationPanel
                  open={notificationsOpen}
                  onClose={() => setNotificationsOpen(false)}
                  initialTab={notificationTab}
                  stockAlerts={stockAlerts}
                  lowStockRowCount={lowStockAll.length}
                  recentActivity={notificationActivity}
                  onViewLowStock={goToLowStock}
                  onViewStockSheets={() => { setNotificationsOpen(false); goToStockSheets(); }}
                />
              </div>

              <div
                ref={profileRef}
                onClick={() => setProfileMenuOpen(v => !v)}
                style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", position: "relative" }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: "50%",
                  overflow: "hidden", border: "2px solid #e5e7eb", flexShrink: 0,
                }}>
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=d1d5db&color=374151&size=42`}
                    alt="avatar"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={e => { e.target.style.display = "none"; }}
                  />
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>{displayName}</span>
                <span style={{ color: "#9ca3af", display: "flex", transform: profileMenuOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                  <IconChevronDown size={15} />
                </span>

                {profileMenuOpen && (
                  <div className="profile-dropdown" onClick={e => e.stopPropagation()}>
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111827" }}>{displayName}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6b7280" }}>{userProfile.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setProfileMenuOpen(false); setShowProfilePage(true); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
                        border: "none", background: "none", width: "100%", textAlign: "left",
                        cursor: "pointer", fontSize: 13, color: "#374151", fontWeight: 600,
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      <IconUser size={16} />
                      My Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => { setProfileMenuOpen(false); setActiveModal("logout"); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
                        border: "none", background: "none", width: "100%", textAlign: "left",
                        cursor: "pointer", fontSize: 13, color: "#ef4444", fontWeight: 600,
                        transition: "background 0.15s", borderTop: "1px solid #f3f4f6",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#fee2e2"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      <IconLogOut size={16} />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* -- Scrollable Content -- */}
          <main id="scroll-area" style={{
            flex: 1, overflowY: "auto",
            background: "#f0f2f5",
            display: "flex", flexDirection: "column",
          }}>
            {activeNav === "Product" ? (
              <ProductPage
                products={products}
                setProducts={setProducts}
                initialStatusFilter={productStatusFilter}
              />
            ) : activeNav === "Ending Inventory" ? (
              <EndingInventoryPage
                inventoryData={endingInventory}
                setInventoryData={setEndingInventory}
              />
            ) : activeNav === "Stock Sheets" ? (
              <StockSheetsPage
                stockInData={stockInRows}
                setStockInData={setStockInRows}
                stockOutData={stockOutRows}
                setStockOutData={setStockOutRows}
              />
            ) : activeNav === "Purchasing Order" ? (
              <PurchasingOrderPage
                initialStatusFilter={poStatusFilter}
                orders={purchaseOrders}
                setOrders={setPurchaseOrders}
              />
            ) : activeNav === "Backload Inventory" ? (
              <BackloadInventoryPage />
            ) : activeNav === "Advance Customer PO" ? (
              <AdvanceCustomerPOPage />
            ) : activeNav === "Return" ? (
              <ReturnPage />
            ) : (
              /* ══ HOME DASHBOARD ══ */
              <div style={{ padding: "28px 32px 40px", display: "flex", flexDirection: "column", gap: 22 }}>

                {/* Metric Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
                  <MetricCard
                    icon={<IconBox size={34} />} iconBg="#F95B02" iconColor="#ffffff"
                    label="Total List of SKU" value={products.length.toString()}
                    badge={{ text: "100% Tag in", color: "#16a34a", bg: "#dcfce7" }}
                    onClick={() => { setProductStatusFilter("All Status"); setActiveNav("Product"); }}
                  />
                  <MetricCard
                    icon={<IconTruck size={28} />} iconBg="#F95B02" iconColor="#ffffff"
                    label="Total Pending Deliveries" value={String(pendingDeliveryCount)}
                    badge={{
                      text: pendingDeliveryCount > 0
                        ? `${pendingDeliveryCount} pending order${pendingDeliveryCount === 1 ? "" : "s"}`
                        : "No pending orders",
                      color: "#d97706",
                      bg: pendingDeliveryCount > 0 ? "#fef3c7" : "transparent",
                      icon: pendingDeliveryCount > 0 ? <IconWarning size={12} /> : undefined,
                    }}
                    onClick={goToPendingDeliveries}
                  />
                  <MetricCard
                    icon={<IconBarChart size={30} />} iconBg="#F95B02" iconColor="#ffffff"
                    label="Total Inventory Value" value={formatCompactPHP(totalInventoryValue)}
                    badge={{ text: "WIS ending inventory total", color: "#16a34a", bg: "#dcfce7" }}
                    onClick={goToEndingInventory}
                  />
                  <MetricCard
                    icon={<IconBag size={30} />} iconBg="#F95B02" iconColor="#ffffff"
                    label="Transactions Today" value={String(transactionsToday)}
                    badge={{
                      text: transactionsToday > 0 ? "View in Stock Sheets" : "No transactions yet",
                      color: transactionsToday > 0 ? "#e87c27" : "#6b7280",
                      bg: "transparent",
                    }}
                    onClick={goToStockSheets}
                  />
                </div>

                {/* Row 2: Chart + Top Released Items */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 18, alignItems: "stretch" }}>

                  {/* Inventory Movement Chart */}
                  <div style={{
                    background: "#fff", borderRadius: 16, padding: "22px 24px 18px",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0",
                    display: "flex", flexDirection: "column",
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>
                          Inventory Movement – {dateRange}
                        </p>
                        <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                          {[["#e87c27", "Stock in"], ["#52c4b0", "Stock out"]].map(([c, l]) => (
                            <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b7280" }}>
                              <div style={{ width: 12, height: 12, borderRadius: 3, background: c }} />
                              {l}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {["Last 7 Days", "Last 30 Days"].map(r => (
                          <button key={r} onClick={() => setDateRange(r)} style={{
                            padding: "4px 10px", fontSize: 11, fontWeight: 600,
                            borderRadius: 6, cursor: "pointer",
                            border: dateRange === r ? "1px solid #e87c27" : "1px solid #e5e7eb",
                            background: dateRange === r ? "#fff7ed" : "#fff",
                            color: dateRange === r ? "#e87c27" : "#6b7280",
                          }}>{r.replace("Last ", "")}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ flex: 1, minHeight: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData}
                          barCategoryGap="22%"
                          barGap={5}
                          margin={{ top: 8, right: 10, left: -6, bottom: 4 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                          <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                          <YAxis domain={[0, chartYMax]} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickCount={6} width={38} />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                          <Bar dataKey="stockIn"  fill="#e87c27" radius={[3, 3, 0, 0]} maxBarSize={36} />
                          <Bar dataKey="stockOut" fill="#52c4b0" radius={[3, 3, 0, 0]} maxBarSize={36} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Top Released Items */}
                  <div style={{
                    background: "#fff", borderRadius: 16, padding: "22px 24px",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0",
                    display: "flex", flexDirection: "column",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                      <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>Top Released Items</p>
                      <button onClick={goToStockSheets} style={{
                        fontSize: 11, color: "#e87c27", background: "none", border: "none",
                        cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 4,
                      }}>
                        View all <IconArrowRight size={12} />
                      </button>
                    </div>
                    {topReleasedItems.length === 0 ? (
                      <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "20px 0" }}>No stock-out data yet</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 18, flex: 1, justifyContent: "space-between" }}>
                        {topReleasedItems.map((item, i) => (
                          <div key={i}>
                            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 }}>
                                {item.name}
                              </p>
                              <span style={{ fontSize: 14, fontWeight: 700, color: "#111827", flexShrink: 0, marginLeft: 12 }}>
                                {item.value}
                              </span>
                            </div>
                            <div style={{ display: "flex", height: 9, overflow: "hidden" }}>
                              <div style={{ width: `${item.pct}%`, height: "100%", background: "#e87c27", flexShrink: 0 }} />
                              <div style={{ flex: 1, height: "100%", background: "#1e2330" }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 3: Stock Alerts + Recent Activity */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

                  {/* Stock Alerts */}
                  <div style={{
                    background: "#fff", borderRadius: 16,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0",
                    display: "flex", flexDirection: "column", overflow: "hidden",
                  }}>
                    <div style={{ padding: "20px 24px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>
                        Stock Alerts
                        {lowStockAll.length > 0 && (
                          <span style={{
                            marginLeft: 8, fontSize: 11, fontWeight: 700,
                            background: "#fef3c7", color: "#d97706",
                            padding: "2px 8px", borderRadius: 20,
                          }}>
                            {stockAlerts.length}
                            {lowStockAll.length !== stockAlerts.length ? ` (${lowStockAll.length} rows)` : ""}
                          </span>
                        )}
                      </p>
                    </div>
                    {stockAlerts.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "32px 24px" }}>
                        <p style={{ fontSize: 13, color: "#9ca3af" }}>✓ All items are well-stocked</p>
                      </div>
                    ) : (
                      <div className="dashboard-scroll-panel" style={{ maxHeight: 320 }}>
                        {stockAlerts.map((a) => (
                          <div key={a.sku} className="alert-row" onClick={goToLowStock}>
                            <div style={{ minWidth: 0, flex: 1, textAlign: "left" }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {a.description.length > 30 ? a.description.slice(0, 30) + "…" : a.description}
                              </p>
                              <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0" }}>
                                SKU: {a.sku} · {a.stock} unit{a.stock !== 1 ? "s" : ""} left
                              </p>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 12 }}>
                              <span style={{
                                fontSize: 11, fontWeight: 700, padding: "5px 14px", borderRadius: 20,
                                background: "#fff7ed", color: "#e87c27",
                                border: "1.5px solid #fcd9b0",
                              }}>
                                Low stock
                              </span>
                              <span className="alert-arrow"><IconArrowRight size={13} /></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Activity */}
                  <div style={{
                    background: "#fff", borderRadius: 16,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0",
                    display: "flex", flexDirection: "column", overflow: "hidden",
                  }}>
                    <div style={{ padding: "20px 24px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>Recent Activity</p>
                      <button onClick={goToStockSheets} style={{
                        fontSize: 11, color: "#e87c27", background: "none", border: "none",
                        cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 4,
                      }}>
                        View all <IconArrowRight size={12} />
                      </button>
                    </div>
                    {recentActivity.length === 0 ? (
                      <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "32px 24px" }}>No recent transactions</p>
                    ) : (
                      <div className="dashboard-scroll-panel" style={{ maxHeight: 320, paddingLeft: 24, paddingRight: 24 }}>
                        {recentActivity.map((a, i) => (
                          <div key={i} className="activity-row" onClick={goToStockSheets}>
                            <div style={{
                              width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                              background: a.type === "in" ? "#22c55e" : "#ef4444",
                            }} />
                            <span style={{ fontSize: 12.5, color: "#374151", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "left" }}>
                              {a.text}
                            </span>
                            <span style={{ fontSize: 12, color: "#9ca3af", flexShrink: 0, marginLeft: 8 }}>
                              {a.time}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}
          </main>
        </div>
      </div>

      {/* Custom Modal */}
      {activeModal && (
        <SystemModal
          type={activeModal}
          onClose={() => setActiveModal(null)}
          onAction={(msg, type) => {
            if (msg === "Logged out successfully!") { setActiveModal(null); setTimeout(() => onLogout?.(), 100); return; }
            showToast(msg, type);
          }}
          products={products}
          setProducts={setProducts}
        />
      )}

      {/* Profile Page Modal */}
      {showProfilePage && (
        <ProfilePage
          profile={userProfile}
          onSave={(updated) => {
            setUserProfile(updated);
            setShowProfilePage(false);
            showToast("Profile updated successfully!");
          }}
          onClose={() => setShowProfilePage(false)}
        />
      )}

      {/* Global Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9999,
          background: toast.type === "error" ? "#dc2626" : "#16a34a",
          color: "#fff", borderRadius: 10, padding: "12px 20px",
          fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
          animation: "slideDown 0.2s ease",
        }}>
          {toast.msg}
        </div>
      )}
    </>
  );
}