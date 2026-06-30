import "./modalDesign.css";

export default function Table({
  columns,
  data,
  onRowClick,
  getRowStyle,
  renderCell,
  children,
  emptyMessage = "No items found.",
  emptySubtext, 
  emptyIcon, 
  clearFilters, 
  className = "",
  compact,
}) {
  if (children) {
    return (
      <div className={`wis-table-scroll ${className}`}>
        <table className="wis-table">
          <thead className="wis-thead">
            <tr className="wis-tr">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`wis-th ${col.align === "left" ? "wis-th-left" : col.align === "right" ? "wis-th-right" : ""} ${col.sticky ? "wis-th-sticky" : ""}`}
                  style={{ minWidth: col.minWidth, maxWidth: col.maxWidth, width: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="wis-tbody">{children}</tbody>
        </table>
      </div>
    );
  }

  const hasData = data && data.length > 0;

  return (
    <div className={`wis-table-scroll ${className}`}>
      <table className="wis-table">
        <thead className="wis-thead">
          <tr className="wis-tr">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`wis-th ${col.align === "left" ? "wis-th-left" : col.align === "right" ? "wis-th-right" : ""} ${col.sticky ? "wis-th-sticky" : ""}`}
                style={{ minWidth: col.minWidth, maxWidth: col.maxWidth, width: col.width }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="wis-tbody">
          {!hasData ? (
            <tr>
              <td colSpan={columns.length} className="wis-empty">
                {emptyIcon !== false && (
                  <svg className="wis-empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                )}
                <p className="wis-empty-title">{emptyMessage}</p>
                {emptySubtext && <p className="wis-empty-sub">{emptySubtext}</p>}
                {clearFilters && (
                  <button className="wis-empty-btn" onClick={clearFilters}>
                    Clear search
                  </button>
                )}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => {
              const rowStyle = getRowStyle ? getRowStyle(row, idx) : {};
              const isSelected = rowStyle.background === "#fff4ed" || rowStyle.boxShadow?.includes("inset");
              return (
                <tr
                  key={row.id ?? idx}
                  className={`wis-tr ${idx % 2 === 0 ? "wis-tr-even" : "wis-tr-odd"} ${isSelected ? "wis-tr-selected" : ""}`}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  style={rowStyle}
                >
                  {columns.map((col) => {
                    const cellContent = renderCell ? renderCell(col, row, idx) : null;
                    if (cellContent) return cellContent;

                    const val = row[col.key];
                    const tdClass = `wis-td ${
                      col.align === "left" ? "wis-td-left" : col.align === "right" ? "wis-td-right" : "wis-td-center"
                    } ${col.sticky ? "wis-td-sticky" : ""} ${col.bold ? "wis-td-bold" : ""} ${col.muted ? "wis-td-muted" : ""}`;

                    return (
                      <td
                        key={col.key}
                        className={tdClass}
                        title={typeof val === "string" ? val : undefined}
                        style={{
                          background: col.sticky ? (idx % 2 === 0 ? "#fff" : "#fafbfc") : undefined,
                          ...(compact ? { padding: "10px 12px", fontSize: "12px" } : {}),
                        }}
                      >
                        {val ?? "—"}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
