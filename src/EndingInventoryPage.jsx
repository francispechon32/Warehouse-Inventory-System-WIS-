import { useState, useRef } from "react";

/* ─── SAMPLE DATA ─────────────────────────────────────────── */
const sampleEndingInventoryData = [
  {
    id: 1,
    productDescription: "Deformed Round Bar, 10mm x 6M g40",
    sku: "DRB050",
    lastAcceptanceDate: "2026-03-20",
    qtyAsPerWis: 1557,
    totalUnitCost: 212686.20,
    avgUnitCost: 136.60,
    qtyAsPerCounting: 1557,
    varianceQty: 0,
    varianceAmount: 0,
  },
  {
    id: 2,
    productDescription: "Deformed Round Bar, 12mm x 6M g40",
    sku: "DRB051",
    lastAcceptanceDate: "2026-03-15",
    qtyAsPerWis: 1,
    totalUnitCost: 186.38,
    avgUnitCost: 186.38,
    qtyAsPerCounting: 1,
    varianceQty: 0,
    varianceAmount: 0,
  },
  {
    id: 3,
    productDescription: "Deformed Round Bar, 16mm x 6M g40",
    sku: "DRB052",
    lastAcceptanceDate: "2026-03-20",
    qtyAsPerWis: 1225,
    totalUnitCost: 424750.18,
    avgUnitCost: 346.73,
    qtyAsPerCounting: 1225,
    varianceQty: 0,
    varianceAmount: 0,
  },
  {
    id: 4,
    productDescription: "Sheet Pile, T2, 400mm x 100mm x 10.5mm x 48kg/m x 12M (576 kilos)",
    sku: "SHPT2",
    lastAcceptanceDate: "2026-03-25",
    qtyAsPerWis: 560,
    totalUnitCost: 12616608.49,
    avgUnitCost: 22529.66,
    qtyAsPerCounting: 560,
    varianceQty: 0,
    varianceAmount: 0,
  },
];

/* ─── ICONS ─────────────────────────────────────────────── */
function IconSearch({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function IconChevronDown({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function IconDownload({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconUpload({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function IconPlus({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export default function EndingInventoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [inventoryData, setInventoryData] = useState(sampleEndingInventoryData);
  const fileInputRef = useRef(null);

  // Filter data
  let filtered = inventoryData.filter(item => {
    const matchSearch = item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.productDescription.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  // Export to Excel (CSV format)
  const handleExportWis = () => {
    const data = filtered;
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Headers - match Excel file structure
    const headers = ["PRODUCT DESCRIPTION", "SKU NUMBER", "LAST ACCEPTANCE DATE", "QUANTITY AS PER WIS", "TOTAL UNIT COST", "AVERAGE UNIT COST", "QUANTITY AS PER COUNTING", "VARIANCE (QUANTITY)", "VARIANCE (AMOUNT)"];
    csvContent += headers.join(",") + "\n";
    
    // Data rows
    data.forEach(row => {
      const values = [
        `"${row.productDescription}"`,
        row.sku,
        row.lastAcceptanceDate,
        row.qtyAsPerWis,
        row.totalUnitCost.toFixed(2),
        row.avgUnitCost.toFixed(2),
        row.qtyAsPerCounting,
        row.varianceQty,
        row.varianceAmount.toFixed(2),
      ];
      csvContent += values.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Ending_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Excel file upload
  const handleImportWis = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split("\n");
        const importedData = [];

        // Skip header row and look for data rows
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim() === "") continue;

          const values = lines[i].split(",");
          // Check if this row has SKU (column 2)
          if (values.length >= 5 && values[1] && values[1].trim()) {
            try {
              importedData.push({
                id: Date.now() + i,
                productDescription: values[0].replace(/"/g, "").trim(),
                sku: values[1].trim(),
                lastAcceptanceDate: values[2].trim(),
                qtyAsPerWis: parseInt(values[3]) || 0,
                totalUnitCost: parseFloat(values[4]) || 0,
                avgUnitCost: parseFloat(values[5]) || 0,
                qtyAsPerCounting: parseInt(values[6]) || 0,
                varianceQty: parseInt(values[7]) || 0,
                varianceAmount: parseFloat(values[8]) || 0,
              });
            } catch (err) {
              // Skip malformed rows
            }
          }
        }

        if (importedData.length > 0) {
          setInventoryData(importedData);
          alert(`Successfully imported ${importedData.length} items!`);
        } else {
          alert("No valid data found in the file.");
        }
      } catch (error) {
        alert("Error importing file: " + error.message);
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div style={{
      background: "#f0f2f5",
      padding: "28px 32px 40px",
      display: "flex",
      flexDirection: "column",
      gap: 22,
    }}>
      {/* ── Search and Filters Section ── */}
      <div style={{
        background: "#fff",
        borderRadius: 14,
        padding: "16px 24px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
      }}>
        <div style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          {/* Search */}
          <div style={{
            flex: 1,
            position: "relative",
            maxWidth: 320,
          }}>
            <input
              type="text"
              placeholder="Search SKU or product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "11px 14px 11px 36px",
                fontSize: 14,
                border: "1px solid #d1d5db",
                borderRadius: 8,
                fontFamily: "inherit",
                color: "#111827",
                background: "#ffffff",
                fontWeight: 500,
              }}
            />
            <span style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9ca3af",
            }}>
              <IconSearch size={16} />
            </span>
          </div>

          {/* Status Filter */}
          <div style={{ position: "relative", minWidth: 140 }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "11px 14px",
                fontSize: 14,
                border: "1px solid #d1d5db",
                borderRadius: 8,
                background: "#ffffff",
                color: "#111827",
                cursor: "pointer",
                fontFamily: "inherit",
                width: "100%",
                appearance: "none",
                paddingRight: 28,
                fontWeight: 500,
              }}
            >
              <option value="All Status">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
            <span style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              color: "#6b7280",
            }}>
              <IconChevronDown size={14} />
            </span>
          </div>

          {/* Start Ending Inventory Button */}
          <button style={{
            padding: "10px 16px",
            background: "#e87c27",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => e.target.style.background = "#d66d1a"}
          onMouseLeave={(e) => e.target.style.background = "#e87c27"}
          >
            <IconPlus size={16} />
            Start Ending Inventory
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: "flex",
        gap: 20,
        borderBottom: "1px solid #e5e7eb",
        paddingBottom: 0,
      }}>
        <button style={{
          padding: "12px 0",
          background: "none",
          border: "none",
          borderBottom: "3px solid #e87c27",
          color: "#e87c27",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}>
          Ending Inventory as per WIS
        </button>
        <button style={{
          padding: "12px 0",
          background: "none",
          border: "none",
          borderBottom: "3px solid transparent",
          color: "#9ca3af",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}>
          Cost of Goods Sold
        </button>
      </div>

      {/* ── Table Section ── */}
      <div style={{
        background: "#fff",
        borderRadius: 14,
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        overflow: "hidden",
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
          }}>
            <thead>
              <tr style={{ background: "#1c2235", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: "16px 20px", textAlign: "left", color: "#fff", fontWeight: 700, fontSize: 12 }}>PRODUCT DESCRIPTION</th>
                <th style={{ padding: "16px 20px", textAlign: "left", color: "#fff", fontWeight: 700, fontSize: 12 }}>SKU NUMBER</th>
                <th style={{ padding: "16px 20px", textAlign: "left", color: "#fff", fontWeight: 700, fontSize: 12 }}>LAST ACCEPTANCE DATE</th>
                <th style={{ padding: "16px 20px", textAlign: "right", color: "#fff", fontWeight: 700, fontSize: 12 }}>QTY AS PER WIS</th>
                <th style={{ padding: "16px 20px", textAlign: "right", color: "#fff", fontWeight: 700, fontSize: 12 }}>TOTAL UNIT COST</th>
                <th style={{ padding: "16px 20px", textAlign: "right", color: "#fff", fontWeight: 700, fontSize: 12 }}>AVG UNIT COST</th>
                <th style={{ padding: "16px 20px", textAlign: "right", color: "#fff", fontWeight: 700, fontSize: 12 }}>QTY AS PER COUNTING</th>
                <th style={{ padding: "16px 20px", textAlign: "right", color: "#fff", fontWeight: 700, fontSize: 12 }}>VARIANCE (QTY)</th>
                <th style={{ padding: "16px 20px", textAlign: "right", color: "#fff", fontWeight: 700, fontSize: 12 }}>VARIANCE (AMOUNT)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((item, idx) => (
                  <tr key={item.id} style={{
                    borderBottom: "1px solid #f3f4f6",
                    background: idx % 2 === 0 ? "#fff" : "#fafafa",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f5f9ff"}
                  onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#fafafa"}
                  >
                    <td style={{ padding: "14px 20px", color: "#374151", fontSize: 12 }}>{item.productDescription}</td>
                    <td style={{ padding: "14px 20px", color: "#374151", fontWeight: 600 }}>{item.sku}</td>
                    <td style={{ padding: "14px 20px", color: "#374151" }}>{item.lastAcceptanceDate}</td>
                    <td style={{ padding: "14px 20px", textAlign: "right", color: "#374151" }}>{item.qtyAsPerWis.toLocaleString()}</td>
                    <td style={{ padding: "14px 20px", textAlign: "right", color: "#374151" }}>₱{item.totalUnitCost.toFixed(2)}</td>
                    <td style={{ padding: "14px 20px", textAlign: "right", color: "#374151" }}>₱{item.avgUnitCost.toFixed(2)}</td>
                    <td style={{ padding: "14px 20px", textAlign: "right", color: "#374151" }}>{item.qtyAsPerCounting.toLocaleString()}</td>
                    <td style={{ padding: "14px 20px", textAlign: "right", color: item.varianceQty < 0 ? "#dc2626" : item.varianceQty > 0 ? "#16a34a" : "#6b7280", fontWeight: 600 }}>
                      {item.varianceQty > 0 ? "+" : ""}{item.varianceQty}
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right", color: item.varianceAmount < 0 ? "#dc2626" : item.varianceAmount > 0 ? "#16a34a" : "#6b7280", fontWeight: 600 }}>
                      {item.varianceAmount > 0 ? "+" : ""}₱{item.varianceAmount.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
                    No items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Footer with Export/Import ── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderTop: "1px solid #f3f4f6",
          background: "#fafafa",
          gap: 12,
        }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            Showing {filtered.length} of {inventoryData.length} items
          </span>

          <div style={{ display: "flex", gap: 10 }}>
            {/* Import Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: "8px 14px",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                background: "#fff",
                cursor: "pointer",
                color: "#374151",
                fontSize: 12,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => e.target.style.background = "#f3f4f6"}
              onMouseLeave={(e) => e.target.style.background = "#fff"}
            >
              <IconUpload size={14} />
              Import WIS
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleImportWis}
              style={{ display: "none" }}
            />

            {/* Export Button */}
            <button
              onClick={handleExportWis}
              style={{
                padding: "8px 14px",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                background: "#fff",
                cursor: "pointer",
                color: "#374151",
                fontSize: 12,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => e.target.style.background = "#f3f4f6"}
              onMouseLeave={(e) => e.target.style.background = "#fff"}
            >
              <IconDownload size={14} />
              Export WIS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
