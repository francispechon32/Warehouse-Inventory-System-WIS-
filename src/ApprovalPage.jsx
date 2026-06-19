import { useState } from "react";

/* ─── ICONS ───────────────────────────────────────────────── */
function IconCheck({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
}
function IconX({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}
function IconClock({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
}
function IconCheckCircle({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
}
function IconXCircle({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>;
}
function IconUser({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
}
function IconBox({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>;
}
function IconMapPin({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>;
}
function IconHash({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /><line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" /></svg>;
}
function IconAlertTriangle({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
}

/* ─── HELPERS ─────────────────────────────────────────────── */
function fmt(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m,10)-1]} ${parseInt(d,10)}, ${y}`;
}

const PAGE_SIZE = 10;

/* ─── STAT CARD ───────────────────────────────────────────── */
function StatCard({ label, value, icon, accent, sub }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14, padding: "20px 22px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)",
      display: "flex", alignItems: "center", gap: 16,
      borderTop: `3px solid ${accent}`, position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", right: -14, top: -14,
        width: 80, height: 80, borderRadius: "50%",
        background: accent + "10", pointerEvents: "none",
      }} />
      <div style={{
        width: 46, height: 46, borderRadius: 12, flexShrink: 0,
        background: `${accent}18`,
        border: `1.5px solid ${accent}30`,
        display: "flex", alignItems: "center", justifyContent: "center", color: accent,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#111827", lineHeight: 1, letterSpacing: "-1px" }}>
          {value}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginTop: 3 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: accent, fontWeight: 600, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ─── STATUS BADGE ────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    Pending:  { bg: "#fef3c7", color: "#d97706", dot: "#f59e0b" },
    Active:   { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
    Rejected: { bg: "#fee2e2", color: "#dc2626", dot: "#ef4444" },
    Closed:   { bg: "#f1f5f9", color: "#475569", dot: "#94a3b8" },
  };
  const s = map[status] || map.Pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.color, whiteSpace: "nowrap",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}

/* ─── DETAIL FIELD ────────────────────────────────────────── */
function Field({ icon, label, value }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 2,
      padding: "10px 14px", background: "#f9fafb",
      borderRadius: 8, border: "1px solid #f3f4f6",
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", display: "flex", alignItems: "center", gap: 4 }}>
        {icon} {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{value || "—"}</span>
    </div>
  );
}

/* ─── CONFIRM MODAL ───────────────────────────────────────── */
// mode: "approve" | "reject"
function ConfirmModal({ item, mode, onClose, onConfirm }) {
  const [note, setNote] = useState("");
  const isApprove = mode === "approve";

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15,23,42,0.5)", backdropFilter: "blur(2px)",
        zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: 16, width: "min(96vw, 440px)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 22px 16px",
          background: isApprove ? "#f0fdf4" : "#fff5f5",
          borderBottom: "1px solid #f3f4f6",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: isApprove ? "#16a34a" : "#dc2626",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
            }}>
              {isApprove ? <IconCheckCircle size={20} /> : <IconXCircle size={20} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111827" }}>
                {isApprove ? "Approve reservation?" : "Reject reservation?"}
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                #{item.transNo} · {item.customer}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}
          >
            <IconX size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Confirmation strip */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "12px 14px", borderRadius: 10,
            background: isApprove ? "#f0fdf4" : "#fff5f5",
            border: `1px solid ${isApprove ? "#bbf7d0" : "#fecaca"}`,
          }}>
            <span style={{ color: isApprove ? "#16a34a" : "#dc2626", marginTop: 1 }}>
              {isApprove ? <IconCheckCircle size={16} /> : <IconAlertTriangle size={16} />}
            </span>
            <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
              {isApprove
                ? <>This will mark reservation <strong>#{item.transNo}</strong> as <strong>Active</strong> and notify the warehouse staff.</>
                : <>This will mark reservation <strong>#{item.transNo}</strong> as <strong>Rejected</strong> and notify the warehouse staff.</>
              }
            </p>
          </div>

          {/* Reject reason textarea */}
          {!isApprove && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                <IconXCircle size={13} /> Reason for rejection
                <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Describe why this reservation is being rejected…"
                rows={3}
                autoFocus
                style={{
                  width: "100%", padding: "10px 12px",
                  border: "1.5px solid #fca5a5", borderRadius: 8,
                  fontSize: 13, fontFamily: "inherit", resize: "none",
                  outline: "none", boxSizing: "border-box", color: "#111827",
                  background: "#fff5f5",
                }}
                onFocus={e => e.target.style.borderColor = "#ef4444"}
                onBlur={e => e.target.style.borderColor = "#fca5a5"}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 22px", borderTop: "1px solid #f3f4f6",
          background: "#fafafa",
          display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8,
        }}>
          <button
            onClick={onClose}
            style={{ padding: "9px 16px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151" }}
            onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
            onMouseLeave={e => e.currentTarget.style.background = "#fff"}
          >
            Cancel
          </button>
          {isApprove ? (
            <button
              onClick={() => onConfirm(item.id)}
              style={{ padding: "9px 20px", border: "none", borderRadius: 8, background: "#16a34a", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 10px rgba(22,163,74,0.3)" }}
              onMouseEnter={e => e.currentTarget.style.background = "#15803d"}
              onMouseLeave={e => e.currentTarget.style.background = "#16a34a"}
            >
              <IconCheck size={14} /> Confirm Approve
            </button>
          ) : (
            <button
              onClick={() => onConfirm(item.id, note)}
              style={{ padding: "9px 20px", border: "none", borderRadius: 8, background: "#dc2626", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 10px rgba(220,38,38,0.3)" }}
              onMouseEnter={e => e.currentTarget.style.background = "#b91c1c"}
              onMouseLeave={e => e.currentTarget.style.background = "#dc2626"}
            >
              <IconX size={14} /> Confirm Reject
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── DETAIL MODAL ────────────────────────────────────────── */
function DetailModal({ item, onClose, onApprove, onReject }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(2px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: 18, width: "min(96vw, 560px)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.08)",
        display: "flex", flexDirection: "column", maxHeight: "92vh", overflow: "hidden",
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: "22px 24px 18px",
          background: "linear-gradient(135deg, #fff7ed 0%, #fff 60%)",
          borderBottom: "1px solid #f3f4f6",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: "#F95B02",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", boxShadow: "0 4px 12px rgba(249,91,2,0.35)",
            }}>
              <IconClock size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111827" }}>
                Reservation <span style={{ color: "#F95B02" }}>#{item.transNo}</span>
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>Submitted {fmt(item.resDate)}</span>
                <StatusBadge status={item.status || "Pending"} />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b", flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.background = "#e2e8f0"}
            onMouseLeave={e => e.currentTarget.style.background = "#f1f5f9"}
          >
            <IconX size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field icon={<IconUser size={12} />} label="Customer" value={item.customer} />
            <Field icon={<IconMapPin size={12} />} label="Location" value={item.place} />
            <div style={{ gridColumn: "1 / -1" }}>
              <Field icon={<IconBox size={12} />} label="Product" value={item.summaryItem || item.sku} />
            </div>
            <Field icon={<IconHash size={12} />} label="SKU" value={item.summarySku || item.sku} />
            <Field icon={<IconHash size={12} />} label="SO# / WO#" value={item.soWo} />
            <Field icon={<IconHash size={12} />} label="TDT DR#" value={item.tdtDr} />
            <Field icon={<IconUser size={12} />} label="Submitted By" value={item.approvedBy} />
          </div>

          {/* Qty summary strip */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
            {[
              { label: "Reserved Qty", value: item.reservedQty, color: "#F95B02" },
              { label: "Current Stock", value: item.currentStock, color: "#0ea5e9" },
              { label: "Est. Ending",   value: item.estEnding,   color: (item.estEnding ?? 0) >= 0 ? "#16a34a" : "#dc2626" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                padding: "12px 14px", background: "#fff", borderRadius: 10,
                border: `1.5px solid ${color}22`,
                display: "flex", flexDirection: "column", gap: 3, alignItems: "center",
              }}>
                <span style={{ fontSize: 20, fontWeight: 900, color, letterSpacing: "-0.5px" }}>
                  {value != null ? Number(value).toLocaleString() : "—"}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "14px 24px", borderTop: "1px solid #f3f4f6",
          background: "#fafafa",
          display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8,
        }}>
          <button
            onClick={onClose}
            style={{ padding: "9px 16px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151" }}
            onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
            onMouseLeave={e => e.currentTarget.style.background = "#fff"}
          >
            Close
          </button>
          <button
            onClick={() => onReject(item.id)}
            style={{ padding: "9px 16px", border: "1.5px solid #fca5a5", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#dc2626", display: "flex", alignItems: "center", gap: 6 }}
            onMouseEnter={e => { e.currentTarget.style.background = "#fff5f5"; e.currentTarget.style.borderColor = "#ef4444"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#fca5a5"; }}
          >
            <IconX size={14} /> Reject
          </button>
          <button
            onClick={() => onApprove(item.id)}
            style={{ padding: "9px 20px", border: "none", borderRadius: 8, background: "#16a34a", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 10px rgba(22,163,74,0.35)" }}
            onMouseEnter={e => e.currentTarget.style.background = "#15803d"}
            onMouseLeave={e => e.currentTarget.style.background = "#16a34a"}
          >
            <IconCheck size={14} /> Approve
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── COLUMN CONFIG ───────────────────────────────────────── */
const COLS = [
  { key: "transNo",  label: "Trans #",       align: "left",   width: 90  },
  { key: "resDate",  label: "Date",          align: "left",   width: 120 },
  { key: "customer", label: "Customer",      align: "left",   width: "auto" },
  { key: "product",  label: "Product / SKU", align: "left",   width: 220 },
  { key: "qty",      label: "Qty",           align: "right",  width: 70  },
  { key: "place",    label: "Location",      align: "left",   width: 110 },
  { key: "status",   label: "Status",        align: "center", width: 110 },
  { key: "actions",  label: "Actions",       align: "right",  width: 170 },
];

/* ─── MAIN PAGE ───────────────────────────────────────────── */
export default function ApprovalPage({ items = [], onApprove, onReject }) {
  const [selected, setSelected]   = useState(null);   // item open in DetailModal
  const [confirm, setConfirm]     = useState(null);   // { item, mode: "approve"|"reject" }
  const [toast, setToast]         = useState(null);
  const [page, setPage]           = useState(1);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* Called after the ConfirmModal says yes */
  const handleApproveConfirmed = (id) => {
    const item = items.find(i => i.id === id);
    onApprove(id);
    setConfirm(null);
    setSelected(null);
    showToast(`Reservation #${item?.transNo} — ${item?.customer} approved.`);
  };

  const handleRejectConfirmed = (id, note) => {
    const item = items.find(i => i.id === id);
    onReject(id, note);
    setConfirm(null);
    setSelected(null);
    showToast(`Reservation #${item?.transNo} rejected.`, "error");
  };

  /* Inline row buttons → open ConfirmModal directly */
  const openConfirmFromRow = (e, item, mode) => {
    e.stopPropagation();
    setConfirm({ item, mode });
  };

  /* Detail modal buttons → open ConfirmModal on top */
  const openConfirmFromDetail = (id, mode) => {
    const item = items.find(i => i.id === id);
    setConfirm({ item, mode });
  };

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const paged = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div style={{ padding: "28px 32px 48px", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Stat cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <StatCard
          label="Awaiting Approval"
          value={items.length}
          icon={<IconClock size={22} />}
          accent="#F95B02"
          sub={items.length > 0 ? "Requires your attention" : "Nothing pending"}
        />
        <StatCard
          label="Approved Today"
          value={0}
          icon={<IconCheckCircle size={22} />}
          accent="#16a34a"
          sub="No approvals yet today"
        />
        <StatCard
          label="Rejected Today"
          value={0}
          icon={<IconXCircle size={22} />}
          accent="#dc2626"
          sub="No rejections yet today"
        />
      </div>

      {/* ── Table card ── */}
      <div style={{
        background: "#fff", borderRadius: 14,
        boxShadow: "0 2px 8px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)",
        overflow: "hidden",
      }}>

        {/* Card header */}
        <div style={{
          padding: "18px 24px", borderBottom: "1px solid #f3f4f6",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111827", textAlign: "left" }}>Reservation Queue</h3>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "#94a3b8" }}>
              {items.length === 0
                ? "All reservations have been reviewed"
                : `${items.length} reservation${items.length === 1 ? "" : "s"} waiting for your decision`}
            </p>
          </div>
          {items.length > 0 && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "#fff7ed", color: "#d97706",
              border: "1.5px solid #fed7aa",
              borderRadius: 20, padding: "5px 14px",
              fontSize: 12, fontWeight: 700,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f59e0b" }} />
              {items.length} Pending
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <div style={{ padding: "72px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "#f0fdf4",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ color: "#22c55e" }}><IconCheckCircle size={38} /></div>
            </div>
            <p style={{ fontSize: 17, fontWeight: 800, color: "#111827", margin: 0 }}>All caught up!</p>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0, textAlign: "center", maxWidth: 280 }}>
              There are no reservations pending approval at the moment.
            </p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <colgroup>
                  {COLS.map(c => <col key={c.key} style={{ width: c.width === "auto" ? undefined : c.width }} />)}
                </colgroup>

                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    {COLS.map(c => (
                      <th key={c.key} style={{
                        padding: "12px 10px",
                        textAlign: c.align,
                        fontSize: 10, fontWeight: 700, color: "#64748b",
                        textTransform: "uppercase", letterSpacing: "0.04em",
                        borderBottom: "2px solid #e5e7eb",
                        whiteSpace: "nowrap",
                      }}>
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {paged.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelected(item)}
                      style={{ cursor: "pointer", borderBottom: "1px solid #f5f5f6", background: "#fff", transition: "background 0.1s" }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = "#fffbf7";
                        e.currentTarget.style.boxShadow = "inset 3px 0 0 #F95B02";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "#fff";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      {/* Trans # */}
                      <td style={{ padding: "14px 10px", textAlign: "left" }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#F95B02", fontFamily: "monospace" }}>
                          #{item.transNo}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ padding: "14px 10px", textAlign: "left" }}>
                        <span style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
                          {fmt(item.resDate)}
                        </span>
                      </td>

                      {/* Customer */}
                      <td style={{ padding: "14px 10px", textAlign: "left" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.customer}
                        </div>
                        {item.place && (
                          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, display: "flex", alignItems: "center", gap: 3 }}>
                            <IconMapPin size={10} /> {item.place}
                          </div>
                        )}
                      </td>

                      {/* Product / SKU */}
                      <td style={{ padding: "14px 10px", textAlign: "left" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.summaryItem || item.sku || "—"}
                        </div>
                        {(item.summarySku || item.sku) && (
                          <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, marginTop: 2, fontFamily: "monospace" }}>
                            {item.summarySku || item.sku}
                          </div>
                        )}
                      </td>

                      {/* Qty */}
                      <td style={{ padding: "14px 10px", textAlign: "right" }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>
                          {Number(item.reservedQty || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* Location */}
                      <td style={{ padding: "14px 10px", textAlign: "left" }}>
                        <span style={{ fontSize: 12, color: "#374151" }}>{item.place || "—"}</span>
                      </td>

                      {/* Status — own column, no overlap */}
                      <td style={{ padding: "14px 10px", textAlign: "center" }}>
                        <StatusBadge status={item.status || "Pending"} />
                      </td>

                      {/* Actions — own column */}
                      <td style={{ padding: "10px 16px", textAlign: "right" }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                          <button
                            onClick={e => openConfirmFromRow(e, item, "reject")}
                            style={{
                              padding: "5px 11px", border: "1.5px solid #fca5a5",
                              borderRadius: 7, background: "#fff", cursor: "pointer",
                              color: "#dc2626", display: "inline-flex", alignItems: "center",
                              gap: 4, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
                              transition: "all 0.12s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.borderColor = "#ef4444"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#fca5a5"; }}
                          >
                            <IconX size={11} /> Reject
                          </button>
                          <button
                            onClick={e => openConfirmFromRow(e, item, "approve")}
                            style={{
                              padding: "5px 11px", border: "none",
                              borderRadius: 7, background: "#16a34a",
                              cursor: "pointer", color: "#fff",
                              display: "inline-flex", alignItems: "center",
                              gap: 4, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
                              boxShadow: "0 1px 4px rgba(22,163,74,0.3)",
                              transition: "all 0.12s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#15803d"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "#16a34a"; e.currentTarget.style.transform = "translateY(0)"; }}
                          >
                            <IconCheck size={11} /> Approve
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                padding: "12px 24px", borderTop: "1px solid #f3f4f6",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, items.length)} of {items.length}
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      style={{
                        width: 30, height: 30, border: page === i + 1 ? "none" : "1px solid #e5e7eb",
                        borderRadius: 7, background: page === i + 1 ? "#F95B02" : "#fff",
                        color: page === i + 1 ? "#fff" : "#374151",
                        cursor: "pointer", fontSize: 12, fontWeight: page === i + 1 ? 700 : 400,
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Detail modal (view only, triggers ConfirmModal) ── */}
      {selected && !confirm && (
        <DetailModal
          item={selected}
          onClose={() => setSelected(null)}
          onApprove={id => openConfirmFromDetail(id, "approve")}
          onReject={id => openConfirmFromDetail(id, "reject")}
        />
      )}

      {/* ── Confirm modal (approve or reject) ── */}
      {confirm && (
        <ConfirmModal
          item={confirm.item}
          mode={confirm.mode}
          onClose={() => setConfirm(null)}
          onConfirm={confirm.mode === "approve" ? handleApproveConfirmed : handleRejectConfirmed}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 10001,
          background: toast.type === "error" ? "#dc2626" : "#16a34a",
          color: "#fff", borderRadius: 12, padding: "13px 20px",
          fontSize: 13, fontWeight: 600,
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          maxWidth: 380, display: "flex", alignItems: "center", gap: 10,
        }}>
          {toast.type === "error" ? <IconXCircle size={16} /> : <IconCheckCircle size={16} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}