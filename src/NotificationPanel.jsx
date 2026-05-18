import { useEffect, useState } from "react";

function IconX({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconArrowRight({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function IconWarning({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

const TABS = [
  { id: "all", label: "All" },
  { id: "stock", label: "Low Stock" },
  { id: "activity", label: "Activity" },
];

function stockLabel() {
  return { text: "Low stock", bg: "#fef3c7", color: "#d97706", border: "#fde68a" };
}

function LowStockItem({ item, onClick }) {
  const badge = stockLabel();
  return (
    <button type="button" onClick={onClick} className="notif-item-btn">
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: "#fffbeb",
        color: "#d97706",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <IconWarning size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
        <p style={{
          fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 2,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {item.description}
        </p>
        <p style={{ fontSize: 11, color: "#9ca3af" }}>
          SKU: {item.sku} · {item.stock} unit{item.stock !== 1 ? "s" : ""} left
        </p>
      </div>
      <span style={{
        fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 20, flexShrink: 0,
        background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
      }}>
        {badge.text}
      </span>
    </button>
  );
}

function ActivityItem({ item }) {
  const isIn = item.type === "in";
  return (
    <div className="notif-item-static">
      <div style={{
        width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
        background: isIn ? "#22c55e" : "#ef4444",
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 12, color: "#374151", fontWeight: 500,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {item.text}
        </p>
        <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{item.time}</p>
      </div>
      <span style={{
        fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, flexShrink: 0,
        background: isIn ? "#dcfce7" : "#fee2e2",
        color: isIn ? "#16a34a" : "#dc2626",
      }}>
        {isIn ? "IN" : "OUT"}
      </span>
    </div>
  );
}

function SectionLabel({ children, count }) {
  return (
    <p style={{
      fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase",
      letterSpacing: "0.06em", padding: "12px 16px 6px",
    }}>
      {children}{count != null ? ` (${count})` : ""}
    </p>
  );
}

function EmptyState({ message }) {
  return (
    <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "28px 20px" }}>
      {message}
    </p>
  );
}

export default function NotificationPanel({
  open,
  onClose,
  stockAlerts = [],
  lowStockRowCount = 0,
  recentActivity = [],
  onViewLowStock,
  onViewStockSheets,
  initialTab = "all",
}) {
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  if (!open) return null;

  const stockCount = stockAlerts.length;
  const activityCount = recentActivity.length;
  const totalCount = stockCount + activityCount;

  const showStock = tab === "all" || tab === "stock";
  const showActivity = tab === "all" || tab === "activity";

  const handleLowStock = () => {
    onClose();
    onViewLowStock?.();
  };

  const handleStockSheets = () => {
    onClose();
    onViewStockSheets?.();
  };

  return (
    <>
      <div className="notif-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="notif-panel" role="dialog" aria-label="Notifications">
        <div style={{
          padding: "16px 18px 12px",
          borderBottom: "1px solid #f3f4f6",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
        }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>Notifications</p>
            <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
              {totalCount === 0
                ? "You're all caught up"
                : `${totalCount} update${totalCount !== 1 ? "s" : ""} · ${stockCount} low stock · ${activityCount} recent`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notifications"
            style={{
              background: "#f3f4f6", border: "none", borderRadius: 8,
              width: 32, height: 32, cursor: "pointer", color: "#6b7280",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >
            <IconX size={16} />
          </button>
        </div>

        <div style={{
          display: "flex", gap: 6, padding: "10px 14px",
          borderBottom: "1px solid #f3f4f6", background: "#fafafa",
        }}>
          {TABS.map(({ id, label }) => {
            const count = id === "stock" ? stockCount : id === "activity" ? activityCount : totalCount;
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                style={{
                  flex: 1, padding: "8px 6px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontSize: 11, fontWeight: 700,
                  background: active ? "#fff" : "transparent",
                  color: active ? "#e87c27" : "#6b7280",
                  boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {label}
                {count > 0 && (
                  <span style={{
                    marginLeft: 4, fontSize: 10, fontWeight: 800,
                    color: active ? "#e87c27" : "#9ca3af",
                  }}>
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="notif-panel-body">
          {tab === "stock" && stockCount === 0 && (
            <EmptyState message="✓ All items are well-stocked" />
          )}
          {tab === "activity" && activityCount === 0 && (
            <EmptyState message="No recent stock transactions" />
          )}
          {tab === "all" && totalCount === 0 && (
            <EmptyState message="✓ No notifications right now" />
          )}

          {showStock && stockCount > 0 && (
            <>
              {tab === "all" && <SectionLabel count={stockCount}>Low stock alerts</SectionLabel>}
              {stockAlerts.map((item) => (
                <LowStockItem key={item.sku} item={item} onClick={handleLowStock} />
              ))}
              {lowStockRowCount > stockCount && tab !== "activity" && (
                <p style={{ fontSize: 10, color: "#9ca3af", padding: "4px 16px 8px" }}>
                  {lowStockRowCount - stockCount} duplicate SKU row{lowStockRowCount - stockCount !== 1 ? "s" : ""} merged in Product list
                </p>
              )}
            </>
          )}

          {showActivity && activityCount > 0 && (
            <>
              {tab === "all" && <SectionLabel count={activityCount}>Recent activity</SectionLabel>}
              {recentActivity.map((item, i) => (
                <ActivityItem key={`${item.time}-${i}`} item={item} />
              ))}
            </>
          )}
        </div>

        <div style={{
          padding: "12px 14px", borderTop: "1px solid #f3f4f6",
          display: "flex", gap: 8, background: "#fafafa", borderRadius: "0 0 14px 14px",
        }}>
          {stockCount > 0 && (
            <button type="button" onClick={handleLowStock} className="notif-footer-btn notif-footer-primary">
              View low stock <IconArrowRight size={12} />
            </button>
          )}
          <button
            type="button"
            onClick={handleStockSheets}
            className={`notif-footer-btn ${stockCount > 0 ? "notif-footer-secondary" : "notif-footer-primary"}`}
            style={{ flex: stockCount > 0 ? undefined : 1 }}
          >
            Stock sheets <IconArrowRight size={12} />
          </button>
        </div>
      </div>
    </>
  );
}
