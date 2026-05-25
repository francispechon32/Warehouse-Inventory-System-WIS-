import { useState } from 'react'
import './App.css'
import LoginPage from './LoginPage.jsx'
import Dashboard from './Invvv.jsx'
import { getLowStockProducts } from './productUtils.js'
import { INITIAL_PRODUCTS } from './initialProducts.js'
import { syncProductsStatus } from './productUtils.js'

const LOW_STOCK_ITEMS = getLowStockProducts(syncProductsStatus(INITIAL_PRODUCTS))

function LowStockLoginModal({ onClose, items }) {
  const critical = items.filter(i => i.stock <= 10)
  const warning = items.filter(i => i.stock > 10)

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.52)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16,
        border: "0.5px solid #e5e7eb",
        width: "100%", maxWidth: 460,
        overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "0.5px solid #e5e7eb" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8,
                background: "#FAEEDA",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#854F0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111827" }}>Low stock alert</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                  {items.length} item{items.length !== 1 ? "s" : ""} need{items.length === 1 ? "s" : ""} restocking
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 8,
              background: "#f3f4f6", border: "0.5px solid #e5e7eb",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {[
              { num: critical.length, label: "Critical (≤10)", numColor: "#A32D2D" },
              { num: warning.length,  label: "Low (≤50)",      numColor: "#854F0B" },
              { num: items.length,    label: "Total items",    numColor: "#111827" },
            ].map(({ num, label, numColor }) => (
              <div key={label} style={{
                background: "#f9fafb", borderRadius: 8,
                border: "0.5px solid #e5e7eb",
                padding: "10px 12px", textAlign: "center",
              }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: numColor }}>{num}</div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Item list */}
        <div style={{ maxHeight: 228, overflowY: "auto" }}>
          {items.slice(0, 10).map((item) => {
            const isCritical = item.stock <= 10
            return (
              <div key={item.sku} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "9px 24px",
                borderBottom: "0.5px solid #f3f4f6",
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                  background: isCritical ? "#E24B4A" : "#EF9F27",
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: 0, fontSize: 12, fontWeight: 600, color: "#111827",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>{item.description}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>
                    SKU: {item.sku} · {item.category}
                  </p>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  padding: "3px 10px", borderRadius: 20, flexShrink: 0,
                  background: isCritical ? "#FCEBEB" : "#FAEEDA",
                  color: isCritical ? "#A32D2D" : "#854F0B",
                }}>
                  {item.stock} left
                </span>
              </div>
            )
          })}
          {items.length > 10 && (
            <p style={{ margin: 0, padding: "8px 24px", fontSize: 11, color: "#9ca3af" }}>
              +{items.length - 10} more items
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 24px",
          borderTop: "0.5px solid #e5e7eb",
          background: "#f9fafb",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ flex: 1, fontSize: 11, color: "#9ca3af" }}>
            Updated just now
          </span>
          <button onClick={onClose} style={{
            padding: "8px 16px", borderRadius: 8,
            border: "0.5px solid #d1d5db", background: "#fff",
            fontSize: 13, fontWeight: 600, color: "#374151",
            cursor: "pointer", fontFamily: "inherit",
          }}>
            Dismiss
          </button>
          <button onClick={onClose} style={{
            padding: "8px 16px", borderRadius: 8,
            border: "none", background: "#e87c27",
            fontSize: 13, fontWeight: 600, color: "#fff",
            cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            View inventory
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [showLowStockModal, setShowLowStockModal] = useState(false)

  const handleLoginSuccess = (userName) => {
    setCurrentUser(userName || "Admin User")
    setLoggedIn(true)
    if (LOW_STOCK_ITEMS.length > 0) {
      setShowLowStockModal(true)
    }
  }

  const handleLogout = () => {
    setLoggedIn(false)
    setCurrentUser(null)
    setShowLowStockModal(false)
  }

  if (!loggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <>
      <Dashboard onLogout={handleLogout} userName={currentUser} />
      {showLowStockModal && (
        <LowStockLoginModal
          items={LOW_STOCK_ITEMS}
          onClose={() => setShowLowStockModal(false)}
        />
      )}
    </>
  )
}

export default App