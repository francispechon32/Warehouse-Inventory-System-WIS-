import { useState } from "react";

/* ─── SAMPLE DATA ─────────────────────────────────────────── */
const sampleProducts = [
  { id: 1, sku: "DRB60", description: "Deformed Round Bar, 10mm x 6M gal", category: "Deformed Round Bar", unit: "pcs", stock: 1557, avgCost: 138.60, totalValue: 212686.20, status: "Active" },
  { id: 2, sku: "DRB62", description: "Deformed Round Bar, 16mm x 6M gal", category: "Deformed Round Bar", unit: "pcs", stock: 1225, avgCost: 348.73, totalValue: 424750.18, status: "Active" },
  { id: 3, sku: "SHPT2", description: "Sheet Pile, 12, 450mm x 100mm x 10.5mm", category: "Sheet Pile", unit: "pcs", stock: 560, avgCost: 2329.88, totalValue: 12035.09, status: "Active" },
  { id: 4, sku: "MSPL90", description: "MS Plate, 6mm x 4' x 8'", category: "MS Plate", unit: "pcs", stock: 322, avgCost: 854.79, totalValue: 778642.38, status: "Active" },
  { id: 5, sku: "JIMM", description: "Sheet Pile, Z - Pile 770mm W x 354mm H", category: "Sheet Pile", unit: "pcs", stock: 15, avgCost: 5438.53, totalValue: 627577.90, status: "Low Stock" },
  { id: 6, sku: "DRB09", description: "Deformed Round Bar, 10mm x 6M gal3", category: "Deformed Round Bar", unit: "pcs", stock: 40, avgCost: 45, totalValue: 1800.00, status: "Low Stock" },
  { id: 7, sku: "ABB18", description: "Angle Bar, 3mm x 38mm x 38mm x 6M yellow", category: "Angle Bar", unit: "pcs", stock: 240, avgCost: 98.50, totalValue: 23640.00, status: "Active" },
  { id: 8, sku: "BBP25", description: "BI Pipe, 1-1/2\" x 6M x40 Commercial", category: "BI Pipe", unit: "pcs", stock: 88, avgCost: 312, totalValue: 27456.00, status: "Active" },
  { id: 9, sku: "BBP25", description: "BI Pipe, 1-1/2\" x 6M x40 Commercial", category: "BI Pipe", unit: "pcs", stock: 88, avgCost: 312, totalValue: 27456.00, status: "Active" },
  { id: 10, sku: "BBP25", description: "BI Pipe, 1-1/2\" x 6M x40 Commercial", category: "BI Pipe", unit: "pcs", stock: 88, avgCost: 312, totalValue: 27456.00, status: "Active" },
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

function IconChevronLeft({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function IconChevronRight({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5l7 7-7 7" />
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

function IconPlus({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export default function ProductPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter products
  let filtered = sampleProducts.filter(product => {
    const matchSearch = product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = categoryFilter === "All Categories" || product.category === categoryFilter;
    const matchStatus = statusFilter === "All Status" || product.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filtered.slice(startIdx, startIdx + itemsPerPage);

  // Get unique categories
  const categories = ["All Categories", ...new Set(sampleProducts.map(p => p.category))];
  const statuses = ["All Status", "Active", "Low Stock"];

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
        {/* ── Search and Filters Row ── */}
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
              placeholder="Search SKU or product des..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
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

          {/* Category Filter */}
          <div style={{ position: "relative", minWidth: 160 }}>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
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
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
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

          {/* Status Filter */}
          <div style={{ position: "relative", minWidth: 140 }}>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
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
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
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

          {/* Add Item Button */}
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
            Add Item
          </button>
        </div>
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
                <th style={{ padding: "16px 20px", textAlign: "left", color: "#fff", fontWeight: 700, fontSize: 12 }}>SKU CODE</th>
                <th style={{ padding: "16px 20px", textAlign: "left", color: "#fff", fontWeight: 700, fontSize: 12 }}>PRODUCT DESCRIPTION</th>
                <th style={{ padding: "16px 20px", textAlign: "left", color: "#fff", fontWeight: 700, fontSize: 12 }}>CATEGORY</th>
                <th style={{ padding: "16px 20px", textAlign: "left", color: "#fff", fontWeight: 700, fontSize: 12 }}>UNIT</th>
                <th style={{ padding: "16px 20px", textAlign: "right", color: "#fff", fontWeight: 700, fontSize: 12 }}>CURRENT STOCK</th>
                <th style={{ padding: "16px 20px", textAlign: "right", color: "#fff", fontWeight: 700, fontSize: 12 }}>AVG COST</th>
                <th style={{ padding: "16px 20px", textAlign: "right", color: "#fff", fontWeight: 700, fontSize: 12 }}>TOTAL VALUE</th>
                <th style={{ padding: "16px 20px", textAlign: "center", color: "#fff", fontWeight: 700, fontSize: 12 }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((product, idx) => (
                <tr key={product.id} style={{
                  borderBottom: "1px solid #f3f4f6",
                  background: idx % 2 === 0 ? "#fff" : "#fafafa",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f5f9ff"}
                onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#fafafa"}
                >
                  <td style={{ padding: "14px 20px", color: "#374151", fontWeight: 600 }}>{product.sku}</td>
                  <td style={{ padding: "14px 20px", color: "#374151", fontSize: 12 }}>{product.description}</td>
                  <td style={{ padding: "14px 20px", color: "#6b7280", fontSize: 12 }}>{product.category}</td>
                  <td style={{ padding: "14px 20px", color: "#374151" }}>{product.unit}</td>
                  <td style={{ padding: "14px 20px", textAlign: "right", color: "#374151" }}>{product.stock.toLocaleString()}</td>
                  <td style={{ padding: "14px 20px", textAlign: "right", color: "#374151" }}>₱{product.avgCost.toFixed(2)}</td>
                  <td style={{ padding: "14px 20px", textAlign: "right", color: "#374151" }}>₱{product.totalValue.toFixed(2)}</td>
                  <td style={{ padding: "14px 20px", textAlign: "center" }}>
                    <span style={{
                      display: "inline-block",
                      padding: "4px 12px",
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 700,
                      background: product.status === "Active" ? "#dcfce7" : "#fef3c7",
                      color: product.status === "Active" ? "#16a34a" : "#d97706",
                    }}>
                      {product.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderTop: "1px solid #f3f4f6",
          background: "#fafafa",
        }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            Showing {startIdx + 1} to {Math.min(startIdx + itemsPerPage, filtered.length)} of {filtered.length} SKUs
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{
                padding: "8px 10px",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                background: "#fff",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                color: currentPage === 1 ? "#d1d5db" : "#374151",
                opacity: currentPage === 1 ? 0.5 : 1,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (currentPage > 1) e.target.style.background = "#f3f4f6";
              }}
              onMouseLeave={(e) => e.target.style.background = "#fff"}
            >
              <IconChevronLeft size={16} />
            </button>

            {/* Page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{
                  width: 32,
                  height: 32,
                  padding: 0,
                  border: page === currentPage ? "1px solid #e87c27" : "1px solid #e5e7eb",
                  borderRadius: 6,
                  background: page === currentPage ? "#e87c27" : "#fff",
                  color: page === currentPage ? "#fff" : "#374151",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (page !== currentPage) e.target.style.background = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  if (page !== currentPage) e.target.style.background = "#fff";
                }}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: "8px 10px",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                background: "#fff",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                color: currentPage === totalPages ? "#d1d5db" : "#374151",
                opacity: currentPage === totalPages ? 0.5 : 1,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (currentPage < totalPages) e.target.style.background = "#f3f4f6";
              }}
              onMouseLeave={(e) => e.target.style.background = "#fff"}
            >
              <IconChevronRight size={16} />
            </button>
          </div>

          {/* Export Button */}
          <button style={{
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
  );
}
