/** Shared modal / form field styles (Backload, Ending Inventory, etc.) */

export const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(17, 24, 39, 0.45)",
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
};

export const modalPanelStyle = {
  background: "#fff",
  borderRadius: 16,
  boxShadow: "0 24px 64px rgba(0, 0, 0, 0.18)",
  display: "flex",
  flexDirection: "column",
  maxHeight: "90vh",
  overflow: "hidden",
  width: "100%",
};

export const modalHeaderStyle = {
  padding: "20px 24px",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  flexShrink: 0,
  background: "#fff",
};

export const modalFooterStyle = {
  padding: "16px 24px",
  borderTop: "1px solid #e5e7eb",
  display: "flex",
  gap: 12,
  justifyContent: "flex-end",
  flexShrink: 0,
  background: "#fafafa",
};

export const modalTitleStyle = {
  fontSize: 18,
  fontWeight: 800,
  color: "#111827",
  margin: 0,
};

export const modalSubtitleStyle = {
  fontSize: 12,
  color: "#6b7280",
  margin: "6px 0 0",
  lineHeight: 1.45,
};

export const modalLabelStyle = {
  fontSize: 11,
  fontWeight: 700,
  color: "#6b7280",
  marginBottom: 6,
  display: "block",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

/** Form modal inputs (Backload add entry) */
export const modalInputStyle = {
  width: "100%",
  padding: "9px 12px",
  fontSize: 13,
  fontWeight: 500,
  color: "#111827",
  WebkitTextFillColor: "#111827",
  caretColor: "#111827",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  fontFamily: "inherit",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
  colorScheme: "light",
};

/** Compact inputs inside data tables */
export const modalCellInputStyle = {
  padding: "7px 10px",
  fontSize: 13,
  fontWeight: 500,
  color: "#111827",
  WebkitTextFillColor: "#111827",
  caretColor: "#111827",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontFamily: "inherit",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
  colorScheme: "light",
};

export function bindModalInputFocus(e) {
  e.target.style.borderColor = "#e87c27";
  e.target.style.boxShadow = "0 0 0 3px rgba(232, 124, 39, 0.18)";
}

export function bindModalInputBlur(e) {
  e.target.style.borderColor = "#d1d5db";
  e.target.style.boxShadow = "none";
}

export const modalInputFocusHandlers = {
  onFocus: bindModalInputFocus,
  onBlur: bindModalInputBlur,
};

export function modalInput(extraStyle = {}) {
  return { style: { ...modalInputStyle, ...extraStyle }, ...modalInputFocusHandlers };
}

export function modalCellInput(extraStyle = {}) {
  return { style: { ...modalCellInputStyle, ...extraStyle }, ...modalInputFocusHandlers };
}

export const modalBtnSecondary = {
  padding: "10px 20px",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  background: "#fff",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
  fontFamily: "inherit",
};

export const modalBtnPrimary = {
  padding: "10px 20px",
  background: "#e87c27",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 700,
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  gap: 6,
};

export const modalCloseBtnStyle = {
  background: "#f3f4f6",
  border: "none",
  borderRadius: 8,
  width: 36,
  height: 36,
  cursor: "pointer",
  color: "#6b7280",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};
