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
}) {
  const showImport = importExport?.showImport !== false;
  const hasRow2 = showSecondRow && (showDateRange || importExport || row2Start);

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
            <button type="button" style={dateRangeButtonStyle}>
              <IconCalendar size={16} />
              {dateRangeLabel}
            </button>
          )}
          {(importExport || row2Start) && (
            <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap", alignItems: "center" }}>
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
                    onClick={importExport.onExport}
                    disabled={importExport.exportDisabled}
                    style={{
                      ...exportButtonStyle,
                      cursor: importExport.exportDisabled ? "not-allowed" : "pointer",
                      opacity: importExport.exportDisabled ? 0.6 : 1,
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
