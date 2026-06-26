import { useState } from "react";

/** Home-dashboard style metric card (orange accent, icon, badge). */
export default function MetricCard({ icon, label, value, badge, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        background: "#fff",
        borderRadius: 16,
        padding: "22px 22px 18px",
        minHeight: 160,
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        cursor: onClick ? "pointer" : "default",
        border: "1px solid #f0f0f0",
        borderTop: "5px solid #F95B02",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
      }}
      onMouseEnter={(e) => {
        setHovered(true);
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={(e) => {
        setHovered(false);
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)";
      }}
    >
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        position: "relative",
        zIndex: 2,
      }}>
        <p style={{
          fontSize: 14.5,
          fontWeight: 610,
          color: "#6b7280",
          lineHeight: 1.4,
          margin: 0,
          textAlign: "left",
        }}>
          {label}
        </p>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "#F95B02",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          transition: "transform 0.2s ease",
          transform: hovered ? "scale(1.08)" : "scale(1)",
        }}>
          {icon}
        </div>
      </div>

      <p style={{
        fontSize: 36,
        fontWeight: 700,
        color: "#111827",
        letterSpacing: "-1.5px",
        lineHeight: 1,
        position: "relative",
        zIndex: 2,
        margin: "14px 0 12px",
        textAlign: "left",
        fontFamily: "'Poppins', sans-serif",
      }}>
        {value}
      </p>

      {badge && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          position: "relative",
          zIndex: 2,
          alignSelf: "flex-start",
        }}>
          {badge.icon && (
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#f59e0b",
              flexShrink: 0,
            }}>
              {badge.icon}
            </span>
          )}
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: badge.color,
            letterSpacing: "0.01em",
          }}>
            {badge.text}
          </span>
        </div>
      )}
    </div>
  );
}
