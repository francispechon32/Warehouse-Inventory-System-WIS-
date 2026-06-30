/**
 * Shared toolbar / filter field styles for list pages.
 */
export const productSearchInputStyle = {
  width: "100%",
  padding: "9px 14px 9px 36px",
  fontSize: 13,
  border: "1.5px solid #E0E0E0",
  borderRadius: 20,
  fontFamily: "inherit",
  color: "#111827",
  background: "#ffffff",
  fontWeight: 500,
  outline: "none",
  boxShadow: "inset 0 1px 2px rgba(15,23,42,0.06)",
};
export const productSearchWrapStyle = {
  position: "relative",
  flex: 1,
  minWidth: 200,
  maxWidth: 420,
};
export const productSearchIconLeftStyle = {
  position: "absolute",
  left: "1rem",
  top: "50%",
  transform: "translateY(-50%)",
  color: "#9E9E9E",   // <-- dati orange, ngayon gray
  fill: "#000000",
  pointerEvents: "none",
  zIndex: 1,
  display: "flex",
  alignItems: "center",
};

export const filterSelectStyle = {
  padding: "6px 28px 6px 12px",
  fontSize: 13,
  fontWeight: 600,
  border: "1.5px solid #E0E0E0",
  borderRadius: 20,
  background: "#fff",
  color: "#333",
  cursor: "pointer",
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  appearance: "none",
  WebkitAppearance: "none",
  outline: "none",
  boxShadow: "0px 2px 4px 0px rgba(0,0,0,0.08)",
  width: "100%",
  height: 38,
};

export const toolbarCardStyle = {
  background: "#fff",
  borderRadius: 14,
  padding: "12px 20px",
  boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
};

export const toolbarRowStyle = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  flexWrap: "wrap",
};

export const toolbarRow2Style = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  marginTop: 10,
  flexWrap: "wrap",
};

export const primaryButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "8px 16px",
  border: "1px solid transparent",
  fontSize: 13,
  fontWeight: 600,
  borderRadius: 20,
  boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
  color: "#fff",
  background: "#F95B02",
  cursor: "pointer",
  transition: "background 150ms ease-in-out, box-shadow 150ms ease-in-out, transform 150ms ease-in-out",
  gap: 6,
  marginLeft: "auto",
  whiteSpace: "nowrap",
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
};

export const dateRangeButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "10px 16px",
  background: "#fff",
  color: "#9E9E9E",
  border: "1.5px solid #E0E0E0",
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  gap: 8,
  whiteSpace: "nowrap",
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
};
export const importButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "10px 20px",
  border: "1.5px solid #F95B02",   // <-- outlined
  fontSize: 14,
  fontWeight: 600,
  borderRadius: 8,
  color: "#F95B02",                 // <-- orange text
  background: "#fff",              // <-- white bg
  cursor: "pointer",
  gap: 8,
  whiteSpace: "nowrap",
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
};

export const exportButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "10px 20px",
  border: "1.5px solid #F95B02",   // <-- outlined
  fontSize: 14,
  fontWeight: 600,
  borderRadius: 8,
  color: "#F95B02",                 // <-- orange text
  background: "#fff",              // <-- white bg
  cursor: "pointer",
  gap: 8,
  whiteSpace: "nowrap",
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
};