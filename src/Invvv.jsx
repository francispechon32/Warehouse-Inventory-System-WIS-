import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import ProductPage from "./ProductPage";
import EndingInventoryPage from "./EndingInventoryPage";

/* ─── DATA ─────────────────────────────────────────────── */
// Different data sets for different time ranges
const inventoryDataByRange = {
  "Last 7 Days": [
    { day: "Mon",   stockIn: 320, stockOut: 180 },
    { day: "Tues",  stockIn: 460, stockOut: 310 },
    { day: "Wed",   stockIn: 260, stockOut: 260 },
    { day: "Thurs", stockIn: 510, stockOut: 200 },
    { day: "Fri",   stockIn: 300, stockOut: 290 },
    { day: "Sat",   stockIn: 180, stockOut: 100 },
    { day: "Sun",   stockIn: 310, stockOut: 290 },
  ],
  "Last 30 Days": [
    { day: "Week 1",   stockIn: 2240, stockOut: 1340 },
    { day: "Week 2",   stockIn: 2680, stockOut: 1820 },
    { day: "Week 3",   stockIn: 1950, stockOut: 1560 },
    { day: "Week 4",   stockIn: 2120, stockOut: 1680 },
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
    { day: "2020", stockIn: 95000, stockOut: 75000 },
    { day: "2021", stockIn: 102000, stockOut: 81000 },
    { day: "2022", stockIn: 115000, stockOut: 92000 },
    { day: "2023", stockIn: 108000, stockOut: 86000 },
    { day: "2024", stockIn: 120000, stockOut: 95000 },
  ],
};

const topItems = [
  { name: "Angle bar 10mm",   value: "₱105K", pct: 55 },
  { name: "Round bar 12mm",   value: "₱95K",  pct: 50 },
  { name: "Steel bar 10mm",   value: "₱190K", pct: 100 },
  { name: "Channel bar 10mm", value: "₱145K", pct: 76 },
  { name: "Wide flange 10mm", value: "₱160K", pct: 84 },
];

const stockAlerts = [
  { name: 'GI pipe 1"', sku: "SKU: GP-3302 – 49 units left", level: "low" },
  { name: 'GI pipe 1"', sku: "SKU: GP-3302 – 51 units left", level: "low" },
];

const recentActivity = [
  { text: "Steel bar 10mm – 50 units received", time: "2:00 pm", type: "in"  },
  { text: "Steel bar 10mm – 50 units released", time: "2:00 pm", type: "out" },
];

/* ─── ICONS ─────────────────────────────────────────────── */
function IconHome({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}
function IconCart({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <path d="M3 6h18M16 10a4 4 0 01-8 0" />
    </svg>
  );
}
function IconStock({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
function IconPO({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M12 12h.01M12 16h.01M8 12h.01M8 16h.01" />
    </svg>
  );
}
function IconSheets({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18" />
    </svg>
  );
}
function IconSettings({ size = 16 }) {
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
function IconChevronRight({ size = 12 }) {
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
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
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

/* ─── SUB-NAV ICONS ─────────────────────────────────────── */
function IconEndingInv({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
function IconBackload({ size = 14 }) {
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
function IconAdvancePO({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}
function IconReturn({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  );
}

const stockSubItems = [
  { label: "Ending Inventory",    Icon: IconEndingInv  },
  { label: "Backload Inventory",  Icon: IconBackload   },
  { label: "Advance Customer PO", Icon: IconAdvancePO  },
  { label: "Return",              Icon: IconReturn     },
];

/* ─── MAIN DASHBOARD ─────────────────────────────────────── */
export default function Dashboard() {
  const [activeNav, setActiveNav] = useState("Home");
  const [stockExpanded, setStockExpanded] = useState(true);
  const [dateRange, setDateRange] = useState("Last 30 Days");

  const navItems = [
    { label: "Home",             Icon: IconHome,   hasChildren: false },
    { label: "Product",          Icon: IconCart,   hasChildren: false },
    { label: "Stock Management", Icon: IconStock,  hasChildren: true  },
    { label: "Purchasing Order", Icon: IconPO,     hasChildren: false },
    { label: "Stock Sheets",     Icon: IconSheets, hasChildren: false },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { width: 100%; height: 100%; overflow: hidden; }
        body { font-family: 'Inter', sans-serif; background: #f5f6fa; }
        #root { max-width: 100% !important; width: 100% !important; border: none !important; }
        #scroll-area::-webkit-scrollbar { width: 4px; }
        #scroll-area::-webkit-scrollbar-track { background: #f1f1f1; }
        #scroll-area::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        .sub-item-btn:hover { background: rgba(255,255,255,0.06) !important; }
        .nav-item-btn:hover { background: rgba(255,255,255,0.05) !important; }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden", background: "#f0f2f5" }}>

        {/* ── SIDEBAR ── */}
        <aside style={{
          width: 290, minWidth: 290, height: "100vh",
          background: "#1c2235",
          display: "flex", flexDirection: "column",
          flexShrink: 0,
        }}>
          {/* Logo */}
          <div style={{ padding: "28px 28px 24px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: "#e87c27", letterSpacing: "0.04em" }}>TDT</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>POWER</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: "#e87c27", letterSpacing: "-0.5px" }}>STEEL</span>
            </div>
            <div style={{ fontSize: 9.5, color: "#4b5563", letterSpacing: "0.12em", marginTop: 3, textTransform: "uppercase" }}>
              THE N°1 STEEL SUPPLIER
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, paddingTop: 6, overflowY: "auto" }}>
            {navItems.map(({ label, Icon, hasChildren }) => {
              const isActive = activeNav === label;
              const isStockParent = label === "Stock Management";
              const isStockActive = isStockParent && activeNav === "Stock Management";

              return (
                <div key={label}>
                  {/* Parent nav item */}
                  <button
                    className="nav-item-btn"
                    onClick={() => {
                      if (hasChildren) {
                        setStockExpanded(v => !v);
                        setActiveNav(label);
                      } else {
                        setActiveNav(label);
                      }
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      width: "100%", padding: "13px 28px",
                      background: (isActive && !hasChildren) || isStockActive ? "#e87c27" : "transparent",
                      border: "none", cursor: "pointer",
                      color: (isActive || isStockActive) ? "#fff" : "#8b95a9",
                      fontSize: 15,
                      fontWeight: (isActive || isStockActive) ? 700 : 400,
                      textAlign: "left",
                      transition: "background .15s",
                    }}
                  >
                    <span style={{ display: "flex", flexShrink: 0 }}><Icon size={18} /></span>
                    <span style={{ flex: 1 }}>{label}</span>
                    {hasChildren && (
                      <span style={{
                        display: "flex", flexShrink: 0,
                        transform: stockExpanded ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform .22s ease",
                        color: isStockActive ? "#fff" : "#8b95a9",
                      }}>
                        <IconChevronDown size={15} />
                      </span>
                    )}
                  </button>

                  {/* Sub-items dropdown */}
                  {hasChildren && stockExpanded && (
                    <div style={{ animation: "slideDown .2s ease" }}>
                      {stockSubItems.map(({ label: subLabel, Icon: SubIcon }) => {
                        const isSubActive = activeNav === subLabel;
                        return (
                          <button
                            key={subLabel}
                            className="sub-item-btn"
                            onClick={() => setActiveNav(subLabel)}
                            style={{
                              display: "flex", alignItems: "center", gap: 12,
                              width: "100%", padding: "11px 28px 11px 58px",
                              background: isSubActive ? "rgba(232,124,39,0.12)" : "transparent",
                              border: "none", cursor: "pointer",
                              color: isSubActive ? "#e87c27" : "#6b7585",
                              fontSize: 14,
                              fontWeight: isSubActive ? 600 : 400,
                              textAlign: "left",
                              transition: "background .12s",
                              borderLeft: isSubActive ? "3px solid #e87c27" : "3px solid transparent",
                            }}
                          >
                            <span style={{ display: "flex", flexShrink: 0 }}><SubIcon size={15} /></span>
                            {subLabel}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Settings */}
          <div style={{ padding: "18px 28px 24px", borderTop: "1px solid #252d42" }}>
            <button
              className="nav-item-btn"
              style={{
                display: "flex", alignItems: "center", gap: 14,
                background: "transparent", border: "none", cursor: "pointer",
                color: "#8b95a9", fontSize: 15, fontWeight: 400, width: "100%",
                padding: "10px 0", borderRadius: 6,
              }}
            >
              <IconSettings size={18} />
              Settings
            </button>
          </div>
        </aside>

        {/* ── MAIN COLUMN ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflow: "hidden" }}>

          {/* Header */}
          <header style={{
            minHeight: 80, background: "#fff",
            borderBottom: "1px solid #e9ecef",
            padding: "16px 36px", display: "flex",
            alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: "#111827", letterSpacing: "-0.5px", margin: 0 }}>
                  {activeNav === "Product" ? "List of SKU" : activeNav === "Ending Inventory" ? "Ending Inventory" : "Welcome Back, Chelsea!"}
                </h1>
                {activeNav === "Product" && (
                  <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2, margin: "2px 0 0 0" }}>Master list of all of Stock Keeping Units</p>
                )}
                {activeNav === "Ending Inventory" && (
                  <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2, margin: "2px 0 0 0" }}>Monthly Warehouse Inventory</p>
                )}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              {/* Bell */}
              <div style={{ position: "relative", color: "#374151", cursor: "pointer" }}>
                <IconBell size={26} />
                <span style={{
                  position: "absolute", top: -6, right: -7,
                  background: "#ef4444", color: "#fff", borderRadius: "50%",
                  width: 18, height: 18, fontSize: 9, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>9+</span>
              </div>
              {/* Avatar + name */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <div style={{
                  width: 42, height: 42, borderRadius: "50%",
                  background: "#e5e7eb",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 800, fontSize: 14, flexShrink: 0,
                  overflow: "hidden", border: "2px solid #e5e7eb",
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
            {/* Conditionally render different pages */}
            {activeNav === "Product" ? (
              <ProductPage />
            ) : activeNav === "Ending Inventory" ? (
              <EndingInventoryPage />
            ) : (
              <div style={{
                padding: "28px 32px 40px",
                display: "flex", flexDirection: "column", gap: 22,
              }}>
              {/* ── Date Range Filter ── */}
              <div style={{
                display: "flex",
                gap: 10,
              }}>
                {["Last 7 Days", "Last 30 Days", "Last 6 Months", "Last 1 Year", "Last 5 Years"].map(range => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    style={{
                      padding: "10px 16px",
                      border: dateRange === range ? "2px solid #e87c27" : "1px solid #d1d5db",
                      borderRadius: 8,
                      background: dateRange === range ? "#e87c27" : "#fff",
                      color: dateRange === range ? "#fff" : "#374151",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => {
                      if (dateRange !== range) {
                        e.target.style.borderColor = "#c4c7ce";
                        e.target.style.background = "#f9fafb";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (dateRange !== range) {
                        e.target.style.borderColor = "#d1d5db";
                        e.target.style.background = "#fff";
                      }
                    }}
                  >
                    {range}
                  </button>
                ))}
              </div>

              {/* ── Metric Cards Row ── */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
                {/* Card 1 - Total SKU */}
                <MetricCard
                  icon={<IconBox size={30} />}
                  iconBg="#f0f4ff"
                  iconColor="#3b82f6"
                  label="Total List of SKU"
                  value="231"
                  badge={{ text: "100% Tag in", color: "#16a34a", bg: "#dcfce7" }}
                  badgeUp={true}
                  onClick={() => setActiveNav("Product")}
                />
              {/* Card 2 - Pending Deliveries */}
              <MetricCard
                icon={<IconTruck size={28} />}
                iconBg="#fff7ed"
                iconColor="#f97316"
                label="Total Pending Deliveries"
                value="13"
                badge={{ text: "3 High Priority", color: "#d97706", bg: "#fef3c7", icon: <IconWarning size={12} /> }}
                badgeUp={null}
              />
              {/* Card 3 - Inventory Value */}
              <MetricCard
                icon={<IconBarChart size={28} />}
                iconBg="#f0fdf4"
                iconColor="#22c55e"
                label="Total Inventory Value"
                value="₱2.4M"
                badge={{ text: "3.5% from last month", color: "#16a34a", bg: "transparent", iconEl: <IconTrendUp size={13} /> }}
                badgeUp={true}
              />
              {/* Card 4 - Transactions */}
              <MetricCard
                icon={<IconBag size={28} />}
                iconBg="#fdf4ff"
                iconColor="#a855f7"
                label="Transactions Today"
                value="48"
                badge={{ text: "0.8% from last month", color: "#dc2626", bg: "transparent", iconEl: <IconTrendDown size={13} /> }}
                badgeUp={false}
              />
            </div>

            {/* ── Chart + Top Released Items ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 18 }}>
              {/* Bar Chart */}
              <div style={{ background: "#fff", borderRadius: 14, padding: "24px 24px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>Inventory Movement – {dateRange}</p>
                  <div style={{ display: "flex", gap: 20 }}>
                    {[["#e87c27", "Stock in"], ["#52c4b0", "Stock out"]].map(([c, l]) => (
                      <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6b7280" }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: c }} />
                        {l}
                      </div>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={inventoryDataByRange[dateRange]} barCategoryGap="35%" barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickCount={6} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                    <Bar dataKey="stockIn"  fill="#e87c27" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="stockOut" fill="#52c4b0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Released Items */}
              <div style={{ background: "#fff", borderRadius: 14, padding: "24px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                <p style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 18 }}>Top Released Items</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {topItems.map((item, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 0",
                      borderBottom: i < topItems.length - 1 ? "1px solid #f3f4f6" : "none",
                    }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{item.name}</p>
                        <div style={{ height: 6, background: "#f3f4f6", borderRadius: 3 }}>
                          <div style={{
                            height: "100%", width: `${item.pct}%`,
                            background: i % 2 === 0 ? "#e87c27" : "#1a1f2e",
                            borderRadius: 3,
                          }} />
                        </div>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginLeft: 16, minWidth: 56, textAlign: "right" }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Alerts + Activity ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              {/* Stock Alerts */}
              <div style={{ background: "#fff", borderRadius: 14, padding: "24px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#374151", marginBottom: 16 }}>Stocks alerts</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {stockAlerts.map((a, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 16px", background: "#fafafa",
                      borderRadius: 10, border: "1px solid #f3f4f6",
                    }}>
                      <div>
                        <p style={{ fontSize: 13.5, fontWeight: 600, color: "#374151", marginBottom: 3 }}>{a.name}</p>
                        <p style={{ fontSize: 11, color: "#9ca3af" }}>{a.sku}</p>
                      </div>
                      <span style={{
                        fontSize: 10.5, fontWeight: 600, padding: "4px 12px", borderRadius: 20,
                        background: "#fef3c7", color: "#d97706", border: "1px solid #fde68a",
                      }}>
                        Low stock
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 14 }}>Recently activity</p>
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
                    <span style={{ fontSize: 12, color: "#374151", flex: 1 }}>{a.text}</span>
                    <span style={{ fontSize: 11, color: "#9ca3af", flexShrink: 0 }}>{a.time}</span>
                  </div>
                ))}
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
function MetricCard({ icon, iconBg, iconColor, label, value, badge, badgeUp, onClick }) {
  return (
    <div 
      onClick={onClick}
      style={{
        background: "#fff", borderRadius: 12, padding: "18px 18px 16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        display: "flex", flexDirection: "column", gap: 8,
        cursor: onClick ? "pointer" : "default",
        transition: onClick ? "all 0.2s" : "none",
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
          e.currentTarget.style.transform = "translateY(0)";
        }
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <p style={{ fontSize: 11.5, fontWeight: 600, color: "#6b7280", lineHeight: 1.4, maxWidth: 110 }}>{label}</p>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: iconBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: iconColor, flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>
      <p style={{ fontSize: 30, fontWeight: 900, color: "#111827", letterSpacing: "-1px", lineHeight: 1 }}>
        {value}
      </p>
      {badge && (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {badge.icon && (
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 16, height: 16, borderRadius: "50%", background: "#f59e0b",
            }}>
              {badge.icon}
            </span>
          )}
          {badge.iconEl && (
            <span style={{ color: badge.color, display: "flex" }}>{badge.iconEl}</span>
          )}
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: badge.color,
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