import { useState, useEffect, useRef } from "react";
import {
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
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", minWidth, flex: `0 1 ${minWidth}px` }}>
      {/* Trigger button */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          ...filterSelectStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          userSelect: "none",
              paddingRight: 12,  // <-- dagdag ito

        }}
      >
        <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</span>          {/* <-- dagdag flex:1 */}
  <span style={{ color: "#9E9E9E", display: "flex", alignItems: "center", flexShrink: 0 }}>
    <IconChevronDown size={14} />                    {/* <-- wrap sa span */}
  </span>
      </div>

      {/* Options list */}
      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0,
          minWidth: "100%",
          maxHeight: 280,
          overflowY: "auto",
          background: "#fff",
          border: "1.5px solid #E0E0E0",
          borderRadius: 12,
          boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
          zIndex: 100,
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        }}>
          {options.map(opt => (
            <div
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              style={{
                padding: "10px 14px",
                fontSize: 13,
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                cursor: "pointer",
                color: opt === value ? "#E87722" : "#333",
                fontWeight: opt === value ? 600 : 400,
                background: opt === value ? "#FFF5EE" : "#fff",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#FFF5EE"}
              onMouseLeave={e => e.currentTarget.style.background = opt === value ? "#FFF5EE" : "#fff"}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
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

function CalendarPopup({ dateRange, onDateRangeChange, onApply }) {
  const today = new Date();
  const [localStart, setLocalStart] = useState(dateRange.start || "");
  const [localEnd, setLocalEnd] = useState(dateRange.end || "");
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  useEffect(() => {
    setLocalStart(dateRange.start || "");
    setLocalEnd(dateRange.end || "");
  }, [dateRange.start, dateRange.end]);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const startVal = localStart ? new Date(localStart + "T00:00:00") : null;
  const endVal = localEnd ? new Date(localEnd + "T00:00:00") : null;

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
    if (!localStart || (localStart && localEnd)) {
      setLocalStart(ymd);
      setLocalEnd("");
    } else {
      setLocalEnd(ymd);
    }
  };

  const handleClear = () => {
    setLocalStart("");
    setLocalEnd("");
  };

  const handleApply = () => {
    onDateRangeChange({ start: localStart, end: localEnd });
    onApply?.();
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
  background: "#fff", border: "1.5px solid #E0E0E0", borderRadius: 10,
  padding: "10px 12px", zIndex: 999,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)", width: 272,
}}>
      <div style={{ display: "flex", gap: 6, marginBottom: 10, borderBottom: "1px solid #f3f4f6", paddingBottom: 10 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>From</span>
          <input
            type="date"
            value={localStart}
            onChange={(e) => setLocalStart(e.target.value)}
            style={{ width: "100%", padding: "4px 4px", fontSize: 11, border: "1px solid #d1d5db", borderRadius: 4, fontFamily: "inherit", outline: "none", color: "#374151", background: "#fff", boxSizing: "border-box" }}
            title="Start date"
          />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>To</span>
          <input
            type="date"
            value={localEnd}
            onChange={(e) => setLocalEnd(e.target.value)}
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, borderTop: "1px solid #f3f4f6", paddingTop: 8 }}>
        <button
          type="button"
          onClick={handleClear}
          style={{
            background: "#fff", border: "1px solid #d1d5db", borderRadius: 6,
            padding: "4px 12px", fontSize: 12, color: "#374151", cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#fff7ed"; e.currentTarget.style.color = "#e87c27"; e.currentTarget.style.borderColor = "#fed7aa"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#374151"; e.currentTarget.style.borderColor = "#d1d5db"; }}
          onMouseDown={(e) => { e.currentTarget.style.background = "#ffedd5"; e.currentTarget.style.color = "#d07020"; }}
          onMouseUp={(e) => { e.currentTarget.style.background = "#fff7ed"; e.currentTarget.style.color = "#e87c27"; }}
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleApply}
          style={{
            background: "#fff", border: "1px solid #d1d5db", borderRadius: 6,
            padding: "4px 14px", fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer", fontFamily: "inherit",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#fff7ed"; e.currentTarget.style.color = "#e87c27"; e.currentTarget.style.borderColor = "#fed7aa"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#374151"; e.currentTarget.style.borderColor = "#d1d5db"; }}
          onMouseDown={(e) => { e.currentTarget.style.background = "#ffedd5"; e.currentTarget.style.color = "#d07020"; }}
          onMouseUp={(e) => { e.currentTarget.style.background = "#fff7ed"; e.currentTarget.style.color = "#e87c27"; }}
        >
          Apply
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
            className="wis-search-input"
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
          <button type="button" onClick={primaryAction.onClick} style={primaryButtonStyle} className="wis-btn-orange">
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
  background: dateRange.start || dateRange.end ? "#f9f9f9" : "#fff",
  color: "#8a8787",
  border: "1.5px solid #989090",
}}
                >
                  <IconCalendar size={16} />
                  {dateRange.start || dateRange.end
                    ? `${dateRange.start || "?"} – ${dateRange.end || "?"}`
                    : "Select dates"}
                </button>
                {calOpen && (
                  <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, zIndex: 9999 }}>
                    <CalendarPopup dateRange={dateRange} onDateRangeChange={onDateRangeChange} onApply={() => setCalOpen(false)} />
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
  onMouseEnter={e => {
  e.currentTarget.style.background = "#F95B02";   // <-- orange fill
  e.currentTarget.style.color = "#fff";            // <-- white text
  e.currentTarget.style.borderColor = "#F95B02";
}}
onMouseLeave={e => {
  e.currentTarget.style.background = "#fff";       // <-- balik white
  e.currentTarget.style.color = "#F95B02";         // <-- balik orange text
  e.currentTarget.style.borderColor = "#F95B02";
}}
>
  <IconUpload size={16} />
  {importExport.importing ? "Importing…" : importExport.importLabel || "Import WIS"}
</button>

                    </>
                  )}
                 <button
  type="button"
  onClick={(e) => { e.preventDefault(); e.stopPropagation(); importExport.onExport?.(); }}
  disabled={!!importExport.exportDisabled}
  style={{
    ...exportButtonStyle,
    position: "relative",
    zIndex: 2,
    cursor: importExport.exportDisabled ? "not-allowed" : "pointer",
    opacity: importExport.exportDisabled ? 0.6 : 1,
    pointerEvents: importExport.exportDisabled ? "none" : "auto",
  }}
onMouseEnter={e => {
  e.currentTarget.style.background = "#F95B02";   // <-- orange fill
  e.currentTarget.style.color = "#fff";            // <-- white text
  e.currentTarget.style.borderColor = "#F95B02";
}}
onMouseLeave={e => {
  e.currentTarget.style.background = "#fff";       // <-- balik white
  e.currentTarget.style.color = "#F95B02";         // <-- balik orange text
  e.currentTarget.style.borderColor = "#F95B02";
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
