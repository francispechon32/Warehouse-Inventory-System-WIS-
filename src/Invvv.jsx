import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

/* ─── DATA ─────────────────────────────────────────────── */
const inventoryData = [
  { day: "Mon",   stockIn: 120, stockOut: 60  },
  { day: "Tues",  stockIn: 210, stockOut: 110 },
  { day: "Wed",   stockIn: 160, stockOut: 130 },
  { day: "Thurs", stockIn: 290, stockOut: 95  },
  { day: "Fri",   stockIn: 175, stockOut: 140 },
  { day: "Sat",   stockIn: 130, stockOut: 55  },
  { day: "Sun",   stockIn: 100, stockOut: 75  },
];

const topItems = [
  { name: "Steel bar 10mm", value: "₱155K", pct: 90, color: "#f97316" },
  { name: "Round bar 12mm", value: "₱155K", pct: 74, color: "#14b8a6" },
  { name: "Steel bar 14mm", value: "₱155K", pct: 83, color: "#f97316" },
  { name: "Steel bar 8mm",  value: "₱155K", pct: 65, color: "#14b8a6" },
  { name: "Steel bar 6mm",  value: "₱155K", pct: 78, color: "#f97316" },
];

const stockAlerts = [
  { name: 'GI pipe 1"', sku: "SKU: GP-3302 – 49 units left", level: "low"      },
  { name: 'GI pipe 1"', sku: "SKU: GP-3302 – 51 units left", level: "low"      },
  { name: 'GI pipe 1"', sku: "SKU: GP-3302 – 12 units left", level: "critical" },
  { name: 'GI pipe 1"', sku: "SKU: GP-3302 – 42 units left", level: "low"      },
  { name: 'GI pipe 1"', sku: "SKU: GP-3302 – 59 units left", level: "low"      },
  { name: 'GI pipe 1"', sku: "SKU: GP-3302 – 8 units left",  level: "critical" },
];

const recentActivity = [
  { text: "Steel bar 10mm – 50 units received", time: "2:00 pm", type: "in"  },
  { text: "Steel bar 10mm – 50 units released", time: "2:00 pm", type: "out" },
  { text: "Steel bar 10mm – 50 units adjusted", time: "2:00 pm", type: "adj" },
  { text: "Steel bar 10mm – 50 units received", time: "1:45 pm", type: "in"  },
  { text: "Round bar 12mm – 30 units received", time: "1:30 pm", type: "in"  },
  { text: 'GI pipe 1" – 20 units released',     time: "1:10 pm", type: "out" },
];

const navMain = [
  { label: "Home",             Icon: IconHome      },
  { label: "Product",          Icon: IconPackage   },
  { label: "Stock Management", Icon: IconChart     },
  { label: "List of Purchase", Icon: IconClipboard },
];
const navOps = [
  { label: "Advance Customer PO", Icon: IconUsers   },
  { label: "Backload",            Icon: IconTruck   },
  { label: "Return",              Icon: IconReturn  },
  { label: "Stock sheets/SKU",    Icon: IconTable   },
];

/* ─── ICONS ─────────────────────────────────────────────── */
function IconHome({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}
function IconPackage({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
    </svg>
  );
}
function IconChart({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
function IconClipboard({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}
function IconUsers({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}
function IconTruck({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}
function IconReturn({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  );
}
function IconTable({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}
function IconBell({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}
function IconSettings({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function IconChevronDown({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 9l-7 7-7-7" />
    </svg>
  );
}
function IconTrendUp({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 6l-9.5 9.5-5-5L1 18" /><path d="M17 6h6v6" />
    </svg>
  );
}
function IconTrendDown({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 18l-9.5-9.5-5 5L1 6" /><path d="M17 18h6v-6" />
    </svg>
  );
}
function IconAlert({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
    </svg>
  );
}

/* ─── CUSTOM TOOLTIP ─────────────────────────────────────── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#1e2535", border: "1px solid #2d3a50",
      borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#e2e8f0",
    }}>
      <p style={{ marginBottom: 6, fontWeight: 700, color: "#f1f5f9" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: "3px 0", display: "flex", gap: 8 }}>
          <span>{p.dataKey === "stockIn" ? "Stock In" : "Stock Out"}:</span>
          <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

/* ─── NAV BUTTON ─────────────────────────────────────────── */
function NavButton({ label, Icon, active, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 9,
        width: active ? "calc(100% - 16px)" : "100%",
        margin: active ? "2px 8px" : "1px 0",
        padding: active ? "9px 13px" : "9px 18px",
        background: active ? "#f97316" : hovered ? "#1e2535" : "transparent",
        border: "none", cursor: "pointer",
        color: active ? "#fff" : hovered ? "#cbd5e1" : "#6b7280",
        fontSize: 12.5, fontWeight: active ? 700 : 400,
        textAlign: "left", borderRadius: active ? 8 : 0,
        transition: "all .14s ease",
      }}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

/* ─── METRIC CARD ────────────────────────────────────────── */
function MetricCard({ label, value, change, up, valueColor, icon, iconBg, iconColor, topColor }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#1a2030", borderRadius: 12,
        border: `1px solid ${hovered ? "#2d3a50" : "#1e2535"}`,
        padding: 18, position: "relative", overflow: "hidden",
        transform: hovered ? "translateY(-3px)" : "none",
        transition: "all .18s ease", cursor: "default",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: topColor, borderRadius: "12px 12px 0 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, paddingTop: 4 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", lineHeight: 1.4, maxWidth: 100 }}>{label}</p>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", color: iconColor, flexShrink: 0 }}>
          {icon}
        </div>
      </div>
      <p style={{ fontSize: 28, fontWeight: 900, color: valueColor || "#f1f5f9", marginBottom: 8, letterSpacing: "-.5px" }}>{value}</p>
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 10.5, fontWeight: 600, padding: "3px 8px", borderRadius: 20,
        background: up ? "#052e16" : "#450a0a",
        color: up ? "#4ade80" : "#f87171",
      }}>
        {up ? <IconTrendUp size={11} /> : <IconTrendDown size={11} />}
        {change}
      </span>
    </div>
  );
}

/* ─── ALERT ROW ──────────────────────────────────────────── */
function AlertRow({ name, sku, level }) {
  const [hovered, setHovered] = useState(false);
  const isCrit = level === "critical";
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 12px", background: "#131720", borderRadius: 8,
        border: `1px solid ${hovered ? "rgba(249,115,22,.45)" : "#1e2535"}`,
        transition: "border-color .14s ease",
      }}
    >
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", marginBottom: 2 }}>{name}</p>
        <p style={{ fontSize: 10.5, color: "#374151" }}>{sku}</p>
      </div>
      <span style={{
        fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, flexShrink: 0,
        ...(isCrit
          ? { background: "#450a0a", color: "#f87171", border: "1px solid #7f1d1d" }
          : { background: "#431407", color: "#fb923c", border: "1px solid #7c2d12" }),
      }}>
        {isCrit ? "Critical" : "Low stock"}
      </span>
    </div>
  );
}

/* ─── MAIN DASHBOARD ─────────────────────────────────────── */
export default function Dashboard() {
  const [activeNav, setActiveNav] = useState("Home");

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { width: 100%; height: 100%; overflow: hidden; }
        body { font-family: 'DM Sans', 'Segoe UI', sans-serif; background: #0d1117; }
        #scroll-area { scrollbar-width: thin; scrollbar-color: #252e42 #0d1117; }
        #scroll-area::-webkit-scrollbar { width: 5px; }
        #scroll-area::-webkit-scrollbar-track { background: #0d1117; }
        #scroll-area::-webkit-scrollbar-thumb { background: #252e42; border-radius: 4px; }
        #scroll-area::-webkit-scrollbar-thumb:hover { background: #374151; }
      `}</style>

      <div style={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden", background: "#0d1117" }}>

        {/* ── SIDEBAR ── */}
        <aside style={{
          width: 210, minWidth: 210, height: "100vh",
          background: "#131720", display: "flex", flexDirection: "column",
          borderRight: "1px solid #1e2535", flexShrink: 0, overflow: "hidden",
        }}>
          <div style={{ padding: "20px 18px 18px", borderBottom: "1px solid #1e2535" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#4b5563", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 4 }}>TDT</div>
            <div style={{ fontSize: 19, fontWeight: 900, lineHeight: 1 }}>
              <span style={{ color: "#f1f5f9" }}>POWER</span>
              <span style={{ color: "#f97316" }}>STEEL</span>
            </div>
            <div style={{ fontSize: 8, color: "#374151", marginTop: 4, letterSpacing: ".06em" }}>Warehouse Inventory System</div>
          </div>

          <nav style={{ flex: 1, padding: "10px 0", overflowY: "auto" }}>
            {navMain.map(({ label, Icon }) => (
              <NavButton key={label} label={label} Icon={Icon}
                active={activeNav === label} onClick={() => setActiveNav(label)} />
            ))}
            <div style={{ fontSize: 9, fontWeight: 700, color: "#374151", letterSpacing: ".12em", textTransform: "uppercase", padding: "14px 18px 6px" }}>
              Operations
            </div>
            {navOps.map(({ label, Icon }) => (
              <NavButton key={label} label={label} Icon={Icon}
                active={activeNav === label} onClick={() => setActiveNav(label)} />
            ))}
          </nav>

          <div style={{ padding: "14px 16px", borderTop: "1px solid #1e2535", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: "#1e2535", display: "flex", alignItems: "center", justifyContent: "center", color: "#4b5563", flexShrink: 0 }}>
              <IconSettings size={15} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Manila Warehouse</div>
              <div style={{ fontSize: 10, color: "#374151" }}>March 2026</div>
            </div>
          </div>
        </aside>

        {/* ── MAIN COLUMN ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflow: "hidden" }}>

          {/* Header */}
          <header style={{
            height: 60, background: "#131720",
            borderBottom: "3px solid #f97316",
            padding: "0 28px", display: "flex",
            alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: "#f97316" }}><IconHome size={18} /></span>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9" }}>Welcome Back, Chelsea!</h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ position: "relative", color: "#6b7280", cursor: "pointer" }}>
                <IconBell size={20} />
                <span style={{
                  position: "absolute", top: -6, right: -7,
                  background: "#f97316", color: "#fff", borderRadius: "50%",
                  width: 15, height: 15, fontSize: 8, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>1</span>
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "#1e2535", borderRadius: 30,
                padding: "4px 12px 4px 4px", cursor: "pointer",
              }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#f97316,#ea580c)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 11 }}>CL</div>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#cbd5e1" }}>Chelsea Lopez</span>
                <span style={{ color: "#6b7280" }}><IconChevronDown size={13} /></span>
              </div>
            </div>
          </header>

          {/* ── Scrollable Content ── */}
          <main id="scroll-area" style={{ flex: 1, overflowY: "auto", padding: "24px 28px 36px", display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Metric Cards */}
            <div>
              <p style={{ fontSize: 10.5, color: "#374151", fontWeight: 500, marginBottom: 10 }}>4 metric summary cards</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 14 }}>
                <MetricCard label="Total Sales Today" value="1,284" change="4.2% this month" up
                  icon={<IconPackage size={15} />} iconBg="#052e16" iconColor="#4ade80" topColor="#22c55e" />
                <MetricCard label="Low Stock" value="23" change="4.2% this month" up={false}
                  valueColor="#f97316"
                  icon={<IconAlert size={15} />} iconBg="#431407" iconColor="#fb923c" topColor="#f97316" />
                <MetricCard label="Total Inventory Value" value="₱2.4M" change="7.2% this month" up
                  icon={<IconChart size={15} />} iconBg="#0c1a3a" iconColor="#60a5fa" topColor="#3b82f6" />
                <MetricCard label="Transactions Today" value="48" change="7.2% this month" up
                  icon={<IconClipboard size={15} />} iconBg="#3d2005" iconColor="#fbbf24" topColor="#f59e0b" />
              </div>
            </div>

            {/* Chart + Top Items */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
              <div style={{ background: "#1a2030", borderRadius: 12, border: "1px solid #1e2535", padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1" }}>Inventory Movement – Last 7 days</p>
                  <div style={{ display: "flex", gap: 14 }}>
                    {[["#f97316", "Stock In"], ["#14b8a6", "Stock Out"]].map(([c, l]) => (
                      <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6b7280" }}>
                        <div style={{ width: 9, height: 9, borderRadius: 2, background: c }} />{l}
                      </div>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={inventoryData} barCategoryGap="28%" barGap={3}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#4b5563" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#4b5563" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,.04)" }} />
                    <Bar dataKey="stockIn"  fill="#f97316" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="stockOut" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: "#1a2030", borderRadius: 12, border: "1px solid #1e2535", padding: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1", marginBottom: 18 }}>Top items by value</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {topItems.map((item, i) => (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 11.5, color: "#94a3b8", fontWeight: 500 }}>{item.name}</span>
                        <span style={{ fontSize: 11.5, color: "#f1f5f9", fontWeight: 700 }}>{item.value}</span>
                      </div>
                      <div style={{ height: 5, background: "#252e42", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${item.pct}%`, background: item.color, borderRadius: 3 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Alerts + Activity */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: "#1a2030", borderRadius: 12, border: "1px solid #1e2535", padding: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1", marginBottom: 14 }}>Stocks alerts</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {stockAlerts.map((a, i) => <AlertRow key={i} {...a} />)}
                </div>
              </div>

              <div style={{ background: "#1a2030", borderRadius: 12, border: "1px solid #1e2535", padding: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1", marginBottom: 14 }}>Recently activity</p>
                {recentActivity.map((a, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 11,
                    padding: "10px 0",
                    borderBottom: i < recentActivity.length - 1 ? "1px solid #1e2535" : "none",
                  }}>
                    <div style={{
                      width: 9, height: 9, borderRadius: "50%", flexShrink: 0,
                      background: a.type === "in" ? "#22c55e" : a.type === "out" ? "#ef4444" : "#f59e0b",
                      boxShadow: `0 0 6px ${a.type === "in" ? "#22c55e55" : a.type === "out" ? "#ef444455" : "#f59e0b55"}`,
                    }} />
                    <span style={{ fontSize: 11.5, color: "#94a3b8", flex: 1 }}>{a.text}</span>
                    <span style={{ fontSize: 10.5, color: "#374151", flexShrink: 0 }}>{a.time}</span>
                  </div>
                ))}
              </div>
            </div>

          </main>
        </div>
      </div>
    </>
  );
}