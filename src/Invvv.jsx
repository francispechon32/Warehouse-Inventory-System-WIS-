import { useState, useEffect, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import ProductPage from "./ProductPage";
import EndingInventoryPage from "./EndingInventoryPage";
import StockSheetsPage from "./StockSheetsPage";
import PurchasingOrderPage from "./PurchasingOrderPage";
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
} from "./productUtils";
import { INITIAL_PRODUCTS } from "./initialProducts";

/* ─── SHARED STOCK TRANSACTION DATA (source of truth) ───── */
const INITIAL_STOCK_IN = [
  { id: 1, sku: "DRB007", description: "Deformed Round Bar, 10mm x 6M g33", date: "2026-05-12", qty: 500,  vendor: "Steel Asia Corp"  },
  { id: 2, sku: "DRB052", description: "Deformed Round Bar, 16mm x 6M g40", date: "2026-05-13", qty: 200,  vendor: "Dragon Steel"     },
  { id: 3, sku: "MSP010", description: "MS Plate, 6mm x 4' x 8'",           date: "2026-05-14", qty: 150,  vendor: "Pag-asa Steel"    },
  { id: 4, sku: "SHPT2",  description: "Sheet Pile T2 x 12M",               date: "2026-05-15", qty: 80,   vendor: "Steel Asia Corp"  },
  { id: 5, sku: "DRB050", description: "Deformed Round Bar, 10mm x 6M g40", date: "2026-05-16", qty: 320,  vendor: "Dragon Steel"     },
  { id: 6, sku: "WF016",  description: "Wide Flange, 8 x 4 x 10# x 6M",    date: "2026-05-17", qty: 100,  vendor: "Pag-asa Steel"    },
  { id: 7, sku: "DRB007", description: "Deformed Round Bar, 10mm x 6M g33", date: "2026-05-18", qty: 260,  vendor: "Steel Asia Corp"  },
];

const INITIAL_STOCK_OUT = [
  { id: 1, sku: "DRB050", description: "Deformed Round Bar, 10mm x 6M g40", date: "2026-05-12", qty: 120,  customer: "Michael Santiago",   totalPrice: 25200  },
  { id: 2, sku: "SHPT2",  description: "Sheet Pile T2 x 12M",               date: "2026-05-13", qty: 80,   customer: "RCM Builders",       totalPrice: 16640  },
  { id: 3, sku: "DRB052", description: "Deformed Round Bar, 16mm x 6M g40", date: "2026-05-14", qty: 60,   customer: "Prime Builders Corp.",totalPrice: 12720  },
  { id: 4, sku: "MSP010", description: "MS Plate, 6mm x 4' x 8'",           date: "2026-05-15", qty: 50,   customer: "GW Construction",    totalPrice: 9800   },
  { id: 5, sku: "SHPT3",  description: "Sheet Pile T3 x 12M",               date: "2026-05-16", qty: 40,   customer: "RCM Builders",       totalPrice: 190000 },
  { id: 6, sku: "DRB051", description: "Deformed Round Bar, 12mm x 6M g40", date: "2026-05-17", qty: 1,    customer: "Michael Santiago",   totalPrice: 186    },
  { id: 7, sku: "DRB050", description: "Deformed Round Bar, 10mm x 6M g40", date: "2026-05-18", qty: 290,  customer: "Metro Builders Inc.", totalPrice: 58000  },
];

/* ─── ICONS ─────────────────────────────────────────────── */
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

/* ─── CUSTOM TOOLTIP ─────────────────────────────────────── */
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

/* ─── TOOLTIP WRAPPER ────────────────────────────────────── */
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

/* ─── HELPERS ────────────────────────────────────────────── */
// Build chart data from actual stock-in / stock-out transactions for Last 7 Days
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

// Aggregate stock-out qty by SKU, return top 5
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
    // short name from description
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

// Last 6 activity entries (most recent stock-in + stock-out combined)
function buildRecentActivity(stockIn, stockOut, limit = 6) {
  const ins  = stockIn.map(t  => ({ text: `${t.description} – ${t.qty} units received`, time: t.date, type: "in"  }));
  const outs = stockOut.map(t => ({ text: `${t.description} – ${t.qty} units released`, time: t.date, type: "out" }));
  return [...ins, ...outs]
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, limit)
    .map(a => ({ ...a, time: new Date(a.time).toLocaleDateString("en-PH", { month: "short", day: "numeric" }) }));
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

/* ─── MAIN DASHBOARD ─────────────────────────────────────── */
export default function Dashboard() {
  const [activeNav, setActiveNav]         = useState("Home");
  const [stockExpanded, setStockExpanded] = useState(true);
  const [dateRange, setDateRange]         = useState("Last 7 Days");
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const [productStatusFilter, setProductStatusFilter] = useState("All Status");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationTab, setNotificationTab] = useState("all");
  const lowStockPromptChecked = useRef(false);

  // ── Shared data lifted here ──────────────────────────────
  const [products, setProducts]   = useState(() => syncProductsStatus(INITIAL_PRODUCTS));
  const [stockIn,  setStockIn]    = useState(INITIAL_STOCK_IN);
  const [stockOut, setStockOut]   = useState(INITIAL_STOCK_OUT);

  // ── Derived dashboard data ───────────────────────────────
  const lowStockAll      = getLowStockProducts(products);
  const stockAlerts      = getUniqueStockAlerts(products);
  const topReleasedItems = buildTopReleasedItems(stockOut, products);
  const recentActivity        = buildRecentActivity(stockIn, stockOut);
  const notificationActivity  = buildRecentActivity(stockIn, stockOut, 12);
  const notificationCount     = stockAlerts.length + notificationActivity.length;
  const chartData = dateRange === "Last 7 Days"
    ? buildLast7DaysChart(stockIn, stockOut)
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

  // Auto-open low-stock notifications once per login (once ever while guest / no auth)
  useEffect(() => {
    if (lowStockPromptChecked.current || stockAlerts.length === 0) return;
    lowStockPromptChecked.current = true;

    const userId = null; // TODO: set from auth after login is implemented
    if (!shouldShowLowStockPrompt(userId)) return;

    setNotificationTab("stock");
    setNotificationsOpen(true);
    markLowStockPromptShown(userId);
  }, [stockAlerts.length]);

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
          transition: all 0.15s ease;
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
          transition: all 0.15s ease;
        }
        .sub-btn:hover { background: rgba(255,255,255,0.04); color: #a0a8b4; }
        .sub-btn.active {
          border-left: 3px solid #e87c27;
          background: rgba(232,124,39,0.08);
          color: #e87c27; font-weight: 600;
        }

        .sidebar-transition {
          transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
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
          padding: 12px 16px; background: #fafafa;
          border-radius: 10; border: 1px solid #f3f4f6;
          cursor: pointer;
          transition: background 0.15s ease, box-shadow 0.15s ease;
          border-radius: 10px;
        }
        .alert-row:hover {
          background: #fff7ed;
          box-shadow: 0 2px 8px rgba(232,124,39,0.12);
          border-color: #fde68a;
        }
        .alert-row:hover .alert-arrow { opacity: 1; transform: translateX(2px); }
        .alert-arrow {
          opacity: 0;
          transition: opacity 0.15s ease, transform 0.15s ease;
          color: #e87c27;
          display: flex;
          align-items: center;
        }

        .dashboard-scroll-panel {
          max-height: 320px;
          overflow-y: auto;
          overflow-x: hidden;
          padding-right: 4px;
          margin-right: -4px;
        }
        .dashboard-scroll-panel::-webkit-scrollbar { width: 6px; }
        .dashboard-scroll-panel::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
        .dashboard-scroll-panel::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
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
          0%, 100% { transform: scale(1); opacity: 0.12; }
          50% { transform: scale(1.1); opacity: 0.18; }
        }
      `}</style>

      <div style={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden" }}>

        {/* ── SIDEBAR ── */}
        <aside
          className="sidebar-transition"
          style={{
            width: sidebarWidth, minWidth: sidebarWidth, height: "100vh",
            background: "#141C25", display: "flex", flexDirection: "column",
            flexShrink: 0, position: "relative",
          }}
        >
          <div style={{
            padding: "16px 14px 12px", display: "flex", alignItems: "center",
            justifyContent: sidebarOpen ? "space-between" : "center",
            gap: 8, minHeight: 64,
          }}>
            {sidebarOpen && (
              <img src={Logo} alt="TDT PowerSteel Logo"
                style={{ width: "170px", height: "auto", display: "block", flexShrink: 0 }} />
            )}
            <button className="toggle-btn" onClick={() => setSidebarOpen(v => !v)}
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

          <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
            {menuItems.map(({ label, Icon, hasChildren }) => {
              const isActive      = activeNav === label;
              const isStockParent = label === "Stock Management";
              const isStockActive = isStockParent && (activeNav === label || isAnyStockSubActive);
              const isItemActive  = (isActive && !isStockParent) || isStockActive;

              return (
                <div key={label}>
                  <NavTooltip label={label} show={!sidebarOpen}>
                    <button
                      className={`nav-btn ${sidebarOpen ? "expanded" : ""} ${isItemActive ? "active" : ""}`}
                      onClick={() => {
                        if (hasChildren) {
                          if (sidebarOpen) { setStockExpanded(v => !v); }
                          else { setSidebarOpen(true); setStockExpanded(true); }
                          setActiveNav(label);
                        } else {
                          if (label === "Product") setProductStatusFilter("All Status");
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
                    <div style={{ animation: "slideDown .2s ease" }}>
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
          </nav>

          <div style={{ height: 1, background: "#1e2a38", margin: "0 14px" }} />

          {sidebarOpen && (
            <p style={{
              fontSize: 12, fontWeight: 700, color: "#3d4f63",
              letterSpacing: "0.12em", textTransform: "uppercase",
              padding: "12px 20px 8px",
            }}>GENERAL</p>
          )}

          <div style={{ paddingBottom: 20 }}>
            <NavTooltip label="Settings" show={!sidebarOpen}>
              <button className={`nav-btn ${sidebarOpen ? "expanded" : ""}`}>
                <IconSettings size={22} />
                {sidebarOpen && "Settings"}
              </button>
            </NavTooltip>
            <NavTooltip label="Help" show={!sidebarOpen}>
              <button className={`nav-btn ${sidebarOpen ? "expanded" : ""}`}>
                <IconHelp size={22} />
                {sidebarOpen && "Help"}
              </button>
            </NavTooltip>
          </div>
        </aside>

        {/* ── MAIN COLUMN ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflow: "hidden" }}>

          {/* ── Header ── */}
          <header style={{
            minHeight: 80, background: "#fff",
            borderBottom: "1px solid #e9ecef",
            padding: "16px 36px", display: "flex",
            alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: "#111827", letterSpacing: "-0.5px", margin: 0 }}>
                {activeNav === "Product"              ? "List of SKU"
                  : activeNav === "Ending Inventory"  ? "Ending Inventory"
                  : activeNav === "Stock Sheets"      ? "Stock Sheets"
                  : activeNav === "Purchasing Order"  ? "Purchasing Orders"
                  : activeNav === "Backload Inventory"? "Backload Inventory"
                  : activeNav === "Advance Customer PO"?"Advance Customer PO"
                  : activeNav === "Return"            ? "Returns"
                  : "Welcome Back, Chelsea!"}
              </h1>
              {activeNav === "Product"               && <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>Master list of all Stock Keeping Units</p>}
              {activeNav === "Ending Inventory"      && <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>Monthly Warehouse Inventory</p>}
              {activeNav === "Stock Sheets"          && <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>Stock transaction records</p>}
              {activeNav === "Purchasing Order"      && <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>Manage purchase orders from suppliers</p>}
              {activeNav === "Backload Inventory"    && <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>Track backloaded inventory</p>}
              {activeNav === "Advance Customer PO"   && <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>Advance customer purchase orders</p>}
              {activeNav === "Return"                && <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>Manage returned items</p>}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              {/* Bell — notification panel */}
              <div style={{ position: "relative", zIndex: notificationsOpen ? 2001 : undefined }}>
                <button
                  type="button"
                  onClick={() => {
                    setNotificationTab("all");
                    setNotificationsOpen((v) => !v);
                  }}
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
                  onViewStockSheets={() => {
                    setNotificationsOpen(false);
                    setActiveNav("Stock Sheets");
                  }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <div style={{
                  width: 42, height: 42, borderRadius: "50%",
                  overflow: "hidden", border: "2px solid #e5e7eb", flexShrink: 0,
                }}>
                  <img
                    src="https://ui-avatars.com/api/?name=Chelsea+Lopez&background=d1d5db&color=374151&size=42"
                    alt="CL"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={e => { e.target.style.display = "none"; }}
                  />
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>Chelsea Lopez</span>
                <span style={{ color: "#9ca3af" }}><IconChevronDown size={15} /></span>
              </div>
            </div>
          </header>

          {/* ── Scrollable Content ── */}
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
              <EndingInventoryPage />
            ) : activeNav === "Stock Sheets" ? (
              <StockSheetsPage />
            ) : activeNav === "Purchasing Order" ? (
              <PurchasingOrderPage />
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
                    icon={<IconBox size={34} />} iconBg="#f0f4ff" iconColor="#000000"
                    label="Total List of SKU" value={products.length.toString()}
                    badge={{ text: "100% Tag in", color: "#16a34a", bg: "#dcfce7" }}
                    onClick={() => { setProductStatusFilter("All Status"); setActiveNav("Product"); }}
                  />
                  <MetricCard
                    icon={<IconTruck size={32} />} iconBg="#fff7ed" iconColor="#000000"
                    label="Total Pending Deliveries" value="13"
                    badge={{ text: "3 High Priority", color: "#d97706", bg: "#fef3c7", icon: <IconWarning size={12} /> }}
                  />
                  <MetricCard
                    icon={<IconBarChart size={32} />} iconBg="#f0fdf4" iconColor="#000000"
                    label="Total Inventory Value" value="₱2.4M"
                    badge={{ text: "3.5% from last month", color: "#16a34a", bg: "transparent", iconEl: <IconTrendUp size={13} /> }}
                  />
                  <MetricCard
                    icon={<IconBag size={32} />} iconBg="#fdf4ff" iconColor="#000000"
                    label="Transactions Today" value={
                      (() => {
                        const today = new Date().toISOString().slice(0, 10);
                        return String(
                          stockIn.filter(t => t.date === today).length +
                          stockOut.filter(t => t.date === today).length
                        );
                      })()
                    }
                    badge={{ text: "0.8% from last month", color: "#dc2626", bg: "transparent", iconEl: <IconTrendDown size={13} /> }}
                  />
                </div>

                {/* Chart + Top Released Items */}
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(300px, 34%)", gap: 18, alignItems: "stretch" }}>
                  <div className="dashboard-pair-card">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexShrink: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>Inventory Movement – {dateRange}</p>
                      <div style={{ display: "flex", gap: 8 }}>
                        {/* Date range selector */}
                        {["Last 7 Days"].map(r => (
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
                    <div style={{ display: "flex", gap: 16, marginBottom: 10, flexShrink: 0 }}>
                      {[["#e87c27", "Stock in"], ["#52c4b0", "Stock out"]].map(([c, l]) => (
                        <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b7280" }}>
                          <div style={{ width: 12, height: 12, borderRadius: 3, background: c }} />
                          {l}
                        </div>
                      ))}
                    </div>
                    <div className="dashboard-pair-chart">
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
                          <Bar dataKey="stockIn"  fill="#e87c27" radius={0} maxBarSize={40} />
                          <Bar dataKey="stockOut" fill="#52c4b0" radius={0} maxBarSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Top Released Items — from real stock-out data */}
                  <div className="dashboard-pair-card">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexShrink: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>Top Released Items</p>
                      <button onClick={() => setActiveNav("Stock Sheets")} style={{
                        fontSize: 11, color: "#e87c27", background: "none", border: "none",
                        cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 4,
                      }}>
                        View all <IconArrowRight size={12} />
                      </button>
                    </div>
                    {topReleasedItems.length === 0 ? (
                      <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "20px 0" }}>No stock-out data yet</p>
                    ) : (
                      <div className="dashboard-pair-list">
                        {topReleasedItems.map((item, i) => (
                          <div key={i} className="dashboard-pair-list-row">
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {item.name}
                              </p>
                              <p style={{ fontSize: 10, color: "#9ca3af", marginBottom: 6 }}>{item.sku}</p>
                              <div className="dashboard-pair-bar-track">
                                <div
                                  className="dashboard-pair-bar-fill"
                                  style={{
                                    width: `${item.pct}%`,
                                    background: i % 2 === 0 ? "#e87c27" : "#1a1f2e",
                                    minWidth: item.pct > 0 ? 4 : 0,
                                  }}
                                />
                              </div>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#111827", flexShrink: 0, minWidth: 52, textAlign: "right" }}>
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Alerts + Activity */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

                  {/* ── Stock Alerts — from real low-stock products ── */}
                  <div style={{
                    background: "#fff", borderRadius: 14, padding: "24px",
                    boxShadow: "0px 10px 21px rgba(0,0,0,0.07), 0px 2px 6px rgba(0,0,0,0.05)",
                    display: "flex", flexDirection: "column", minHeight: 0,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexShrink: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: "#374151" }}>
                        Stock Alerts
                        {lowStockAll.length > 0 && (
                          <span style={{
                            marginLeft: 8, fontSize: 11, fontWeight: 700,
                            background: "#fef3c7", color: "#d97706",
                            padding: "2px 8px", borderRadius: 20,
                          }} title={lowStockAll.length !== stockAlerts.length ? `${lowStockAll.length} rows, ${stockAlerts.length} unique SKUs` : undefined}>
                            {stockAlerts.length}
                            {lowStockAll.length !== stockAlerts.length ? ` (${lowStockAll.length} rows)` : ""}
                          </span>
                        )}
                      </p>
                      <button onClick={goToLowStock} style={{
                        fontSize: 11, color: "#e87c27", background: "none", border: "none",
                        cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 4,
                      }}>
                        View all <IconArrowRight size={12} />
                      </button>
                    </div>

                    {stockAlerts.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "24px 0" }}>
                        <p style={{ fontSize: 13, color: "#9ca3af" }}>✓ All items are well-stocked</p>
                      </div>
                    ) : (
                      <div className="dashboard-scroll-panel" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {stockAlerts.map((a) => (
                          <div
                            key={a.sku}
                            className="alert-row"
                            onClick={goToLowStock}
                            title={`Click to view ${a.sku} in Product page`}
                          >
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {a.description.length > 36 ? a.description.slice(0, 36) + "…" : a.description}
                              </p>
                              <p style={{ fontSize: 11, color: "#9ca3af" }}>
                                SKU: {a.sku} — {a.stock} unit{a.stock !== 1 ? "s" : ""} left
                              </p>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 10 }}>
                              <span style={{
                                fontSize: 10.5, fontWeight: 600, padding: "4px 12px", borderRadius: 20,
                                background: "#fef3c7", color: "#d97706", border: "1px solid #fde68a",
                              }}>
                                Low stock
                              </span>
                              <span className="alert-arrow">
                                <IconArrowRight size={14} />
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* hint text */}
                    {stockAlerts.length > 0 && (
                      <p style={{ fontSize: 10, color: "#d97706", marginTop: 12, flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
                        <span>↑</span> Click any alert to go to Product page
                      </p>
                    )}
                  </div>

                  {/* ── Recent Activity — from real stock transactions ── */}
                  <div style={{
                    background: "#fff", borderRadius: 14, padding: "24px",
                    boxShadow: "0px 10px 21px rgba(0,0,0,0.07), 0px 2px 6px rgba(0,0,0,0.05)",
                    display: "flex", flexDirection: "column", minHeight: 0,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexShrink: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: "#374151" }}>Recent Activity</p>
                      <button onClick={() => setActiveNav("Stock Sheets")} style={{
                        fontSize: 11, color: "#e87c27", background: "none", border: "none",
                        cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 4,
                      }}>
                        View all <IconArrowRight size={12} />
                      </button>
                    </div>
                    {recentActivity.length === 0 ? (
                      <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "20px 0" }}>No recent transactions</p>
                    ) : (
                      <div className="dashboard-scroll-panel">
                        {recentActivity.map((a, i) => (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "11px 0",
                          borderBottom: i < recentActivity.length - 1 ? "1px solid #f3f4f6" : "none",
                        }}>
                          <div style={{
                            width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                            background: a.type === "in" ? "#22c55e" : "#ef4444",
                          }} />
                          <span style={{ fontSize: 12, color: "#374151", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {a.text}
                          </span>
                          <span style={{ fontSize: 11, color: "#9ca3af", flexShrink: 0 }}>{a.time}</span>
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
    </>
  );
}

/* ── METRIC CARD ─────────────────────────────────────────── */
function MetricCard({ icon, iconBg, iconColor, label, value, badge, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        background: "#fff",
        borderRadius: 18,
        padding: "20px 22px 16px",
        minHeight: 188,
        overflow: "hidden",
        boxShadow: "0px 10px 21px rgba(0,0,0,0.07), 0px 2px 6px rgba(0,0,0,0.05)",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.4s cubic-bezier(0.15, 0.83, 0.66, 1)",
      }}
      onMouseEnter={e => { setHovered(true);  e.currentTarget.style.transform = "scale(1.03)"; }}
      onMouseLeave={e => { setHovered(false); e.currentTarget.style.transform = "scale(1)"; }}
    >
      <div style={{
        position: "absolute", inset: 0, borderRadius: 16,
        background: `radial-gradient(ellipse at 80% 110%, ${iconBg} 0%, rgba(255,255,255,0) 65%)`,
        opacity: 0.7, pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", right: -18, top: -22,
        width: 100, height: 100, borderRadius: "50%",
        background: iconColor,
        opacity: hovered ? 0.12 : 0,
        animation: hovered ? "metricPulse 3s ease-in-out infinite" : "none",
        transition: "opacity 0.3s ease",
        pointerEvents: "none",
      }} />
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        gap: 10, position: "relative", zIndex: 2,
      }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#6b7280", lineHeight: 1.35, flex: 1, paddingRight: 4 }}>
          {label}
        </p>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: iconBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: iconColor, flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>
      <p style={{
        fontSize: 42, fontWeight: 800, color: "#111827", letterSpacing: "-1px",
        lineHeight: 1, position: "relative", zIndex: 2, margin: "14px 0 8px",
      }}>
        {value}
      </p>
      {badge && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, position: "relative", zIndex: 2 }}>
          {badge.icon && (
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, borderRadius: "50%", background: "#f59e0b" }}>
              {badge.icon}
            </span>
          )}
          {badge.iconEl && <span style={{ color: badge.color, display: "flex" }}>{badge.iconEl}</span>}
          <span style={{
            fontSize: 12, fontWeight: 600, color: badge.color,
            background: badge.bg !== "transparent" ? badge.bg : "transparent",
            padding: badge.bg !== "transparent" ? "2px 8px" : "0",
            borderRadius: 20,
          }}>
            {badge.text}
          </span>
        </div>
      )}
    </div>
  );
}