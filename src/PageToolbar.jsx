import { useState, useEffect, useRef } from "react";
import {
  productSearchInputStyle,
  productSearchWrapStyle,
  productSearchIconLeftStyle,
  filterSelectStyle,
  toolbarCardStyle,
  toolbarRowStyle,
  toolbarRow2Style,
  primaryButtonStyle,
  dateRangeButtonStyle,
  importButtonStyle,
  exportButtonStyle,
} from "./searchFieldStyles";

function IconSearch({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function IconChevronDown({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function IconPlus({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconCalendar({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconUpload({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function IconDownload({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function FilterSelect({ value, onChange, options, minWidth = 160 }) {
  return (
    <div style={{ position: "relative", minWidth, flex: `0 1 ${minWidth}px` }}>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={filterSelectStyle}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6b7280" }}>
        <IconChevronDown size={14} />
      </span>
    </div>
  );
}

function IconX({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconChevronLeft({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function IconChevronRight({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function CalendarPopup({ dateRange, onDateRangeChange }) {
  const today = new Date();
  const startRef = useRef(null);
  const endRef = useRef(null);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const startVal = dateRange.start ? new Date(dateRange.start + "T00:00:00") : null;
  const endVal = dateRange.end ? new Date(dateRange.end + "T00:00:00") : null;

  const inRange = (d) => {
    if (!startVal) return false;
    if (!endVal) return d.toDateString() === startVal.toDateString();
    const s = startVal < endVal ? startVal : endVal;
    const e = startVal < endVal ? endVal : startVal;
    return d >= s && d <= e;
  };

  const isStart = (d) => startVal && d.toDateString() === startVal.toDateString();
  const isEnd = (d) => endVal && d.toDateString() === endVal.toDateString();

  const handleDayClick = (day) => {
    const clicked = new Date(viewYear, viewMonth, day);
    const ymd = clicked.getFullYear() + "-" + String(clicked.getMonth() + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
    if (!dateRange.start || (dateRange.start && dateRange.end)) {
      onDateRangeChange({ start: ymd, end: "" });
    } else {
      const s = new Date(dateRange.start + "T00:00:00");
      onDateRangeChange({ start: dateRange.start, end: ymd });
    }
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} />);
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(viewYear, viewMonth, d);
    const range = inRange(dt);
    const start = isStart(dt);
    const end = isEnd(dt);
    const isToday = dt.toDateString() === today.toDateString();
    cells.push(
      <button
        key={d}
        type="button"
        onClick={() => handleDayClick(d)}
        style={{
          width: 34, height: 30, border: "none", borderRadius: 6,
          background: range ? (start || end ? "#e87c27" : "#fff7ed") : "transparent",
          color: range ? (start || end ? "#fff" : "#e87c27") : (isToday ? "#e87c27" : "#374151"),
          fontWeight: start || end || isToday ? 700 : 400,
          fontSize: 13, cursor: "pointer", fontFamily: "inherit",
        }}
      >
        {d}
      </button>
    );
  }

  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
      padding: "10px 12px", zIndex: 999,
      boxShadow: "0 4px 20px rgba(0,0,0,0.13)", width: 272,
    }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 10, borderBottom: "1px solid #f3f4f6", paddingBottom: 10 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>From</span>
          <input
            ref={startRef}
            type="date"
            value={dateRange.start}
            onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
            style={{ width: "100%", padding: "4px 4px", fontSize: 11, border: "1px solid #d1d5db", borderRadius: 4, fontFamily: "inherit", outline: "none", color: "#374151", background: "#fff", boxSizing: "border-box" }}
            title="Start date"
          />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>To</span>
          <input
            ref={endRef}
            type="date"
            value={dateRange.end}
            onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
            style={{ width: "100%", padding: "4px 4px", fontSize: 11, border: "1px solid #d1d5db", borderRadius: 4, fontFamily: "inherit", outline: "none", color: "#374151", background: "#fff", boxSizing: "border-box" }}
            title="End date"
          />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <button type="button" onClick={() => { if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); } else setViewMonth((m) => m - 1); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 4, display: "flex", borderRadius: 4 }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#f3f4f6"}
          onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
          <IconChevronLeft size={14} />
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{MONTHS[viewMonth]} {viewYear}</span>
        <button type="button" onClick={() => { if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); } else setViewMonth((m) => m + 1); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 4, display: "flex", borderRadius: 4 }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#f3f4f6"}
          onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
          <IconChevronRight size={14} />
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
        {DAYS.map((d) => (
          <div key={d} style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textAlign: "center", padding: "2px 0" }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {cells}
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 8, borderTop: "1px solid #f3f4f6", paddingTop: 8 }}>
        <button
          type="button"
          onClick={() => onDateRangeChange({ start: "", end: "" })}
          style={{
            background: "none", border: "1px solid #d1d5db", borderRadius: 6,
            padding: "4px 12px", fontSize: 12, color: "#6b7280", cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}

/**
 * Standard two-row page toolbar: search + filters + primary CTA on row 1;
 * date range + import/export on row 2.
 */
export default function PageToolbar({
  searchValue,
  searchPlaceholder = "Search SKU or product name...",
  onSearchChange,
  filters = [],
  primaryAction,
  dateRangeLabel = "April 5, 2026 – May 5, 2026",
  showDateRange = true,
  showSecondRow = true,
  importExport,
  row1End,
  row2Start,
  dateRange,
  onDateRangeChange,
}) {
  const showImport = importExport?.showImport !== false;
  const hasRow2 = showSecondRow && (showDateRange || importExport || row2Start);
  const [calOpen, setCalOpen] = useState(false);
  const calRef = useRef(null);

  useEffect(() => {
    if (!calOpen) return;
    const handler = (e) => {
      if (calRef.current && !calRef.current.contains(e.target)) setCalOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [calOpen]);

  return (
    <div style={toolbarCardStyle}>
      <div style={toolbarRowStyle}>
        <div style={productSearchWrapStyle}>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            style={productSearchInputStyle}
          />
          <span style={productSearchIconLeftStyle}>
            <IconSearch size={16} />
          </span>
        </div>

        {filters.map((f) => (
          <FilterSelect
            key={f.key || f.label || f.options[0]}
            value={f.value}
            onChange={f.onChange}
            options={f.options}
            minWidth={f.minWidth}
          />
        ))}

        {row1End}

        {primaryAction && (
          <button type="button" onClick={primaryAction.onClick} style={primaryButtonStyle}>
            <IconPlus size={16} />
            {primaryAction.label}
          </button>
        )}
      </div>

      {hasRow2 && (
        <div style={toolbarRow2Style}>
          {row2Start}
          {showDateRange && (
            dateRange && onDateRangeChange ? (
              <div ref={calRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setCalOpen((v) => !v)}
                  style={{
                    ...dateRangeButtonStyle,
                    background: calOpen ? "#fff7ed" : "#fff",
                    color: "#374151",
                    border: calOpen ? "1.5px solid #fcd9b0" : "1.5px solid #d1d5db",
                    boxShadow: "inset 0 1px 2px rgba(15,23,42,0.04)",
                  }}
                >
                  <IconCalendar size={16} />
                  {dateRange.start || dateRange.end
                    ? `${dateRange.start || "?"} – ${dateRange.end || "?"}`
                    : "Select dates"}
                </button>
                {calOpen && (
                  <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 4 }}>
                    <CalendarPopup dateRange={dateRange} onDateRangeChange={onDateRangeChange} />
                  </div>
                )}
              </div>
            ) : (
              <button type="button" style={dateRangeButtonStyle}>
                <IconCalendar size={16} />
                {dateRangeLabel}
              </button>
            )
          )}
          {(importExport || row2Start) && (
            <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap", alignItems: "center", position: "relative", zIndex: 5 }}>
              {importExport && (
                <>
                  {showImport && (
                    <>
                      <input
                        ref={importExport.fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={importExport.onFileChange}
                        style={{ display: "none" }}
                      />
                      <button
                        type="button"
                        onClick={() => importExport.fileInputRef?.current?.click()}
                        disabled={importExport.importing || importExport.importDisabled}
                        style={{
                          ...importButtonStyle,
                          cursor: importExport.importing || importExport.importDisabled ? "not-allowed" : "pointer",
                          opacity: importExport.importing || importExport.importDisabled ? 0.6 : 1,
                        }}
                      >
                        <IconUpload size={16} />
                        {importExport.importing ? "Importing…" : importExport.importLabel || "Import WIS"}
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      importExport.onExport?.();
                    }}
                    disabled={!!importExport.exportDisabled}
                    style={{
                      ...exportButtonStyle,
                      position: "relative",
                      zIndex: 2,
                      cursor: importExport.exportDisabled ? "not-allowed" : "pointer",
                      opacity: importExport.exportDisabled ? 0.6 : 1,
                      pointerEvents: importExport.exportDisabled ? "none" : "auto",
                    }}
                  >
                    <IconDownload size={16} />
                    {importExport.exportLabel || "Export WIS"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
