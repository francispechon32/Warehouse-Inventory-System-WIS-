import { useState } from 'react'
import './App.css'
import LoginPage from './LoginPage.jsx'
import Dashboard from './Invvv.jsx'
import { getLowStockProducts } from './productUtils.js'
import { INITIAL_PRODUCTS } from './initialProducts.js'
import { syncProductsStatus } from './productUtils.js'

const LOW_STOCK_ITEMS = getLowStockProducts(syncProductsStatus(INITIAL_PRODUCTS))

/* ── Icons ─────────────────────────────────────────────── */
function IconAlertTriangle({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function IconAlertCircle({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function IconX({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconPackages({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )
}

/* ── Low Stock Login Modal ──────────────────────────────── */
function LowStockLoginModal({ onClose, onViewInventory, items }) {
  const [filter, setFilter] = useState('all')

  const critical = items.filter(i => i.stock <= 10)
  const low      = items.filter(i => i.stock > 10)

  const filtered =
    filter === 'critical' ? critical :
    filter === 'low'      ? low :
    items

  // Sort: critical first, then by stock ascending
  const sorted = [...filtered].sort((a, b) => {
    const aCrit = a.stock <= 10 ? 0 : 1
    const bCrit = b.stock <= 10 ? 0 : 1
    if (aCrit !== bCrit) return aCrit - bCrit
    return a.stock - b.stock
  })

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(8, 12, 20, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
          animation: 'lsBackdropIn 0.2s ease',
        }}
      >
        {/* Modal */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 500,
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #e5e7eb',
            boxShadow: '0 24px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            animation: 'lsModalIn 0.28s cubic-bezier(0.16,1,0.3,1)',
            fontFamily: "'Poppins', sans-serif",
          }}
        >

          {/* ── Header ── */}
          <div style={{
            padding: '18px 20px 16px',
            borderBottom: '1px solid #f3f4f6',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                background: '#FEF3C7',
                border: '1px solid #FDE68A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <IconAlertTriangle size={18} color="#D97706" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>
                  Low stock alert
                </p>
<p style={{ margin: '-5px 0 0', fontSize: 12, color: '#6b7280' }}> {items.length} item{items.length !== 1 ? 's' : ''} need{items.length === 1 ? 's' : ''} restocking
</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                color: '#6b7280', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#e5e7eb'
                e.currentTarget.style.color = '#111827'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#f3f4f6'
                e.currentTarget.style.color = '#6b7280'
              }}
            >
              <IconX size={14} />
            </button>
          </div>

          {/* ── Stat Cards ── */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: 10, padding: '14px 18px',
            borderBottom: '1px solid #f3f4f6',
          }}>
            {/* Critical */}
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 12, padding: '12px 10px', textAlign: 'center',
            }}>
              <p style={{ margin: '0 0 3px', fontSize: 26, fontWeight: 700, color: '#DC2626', lineHeight: 1 }}>
                {critical.length}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: '#DC2626', lineHeight: 1.35 }}>
                Critical<br /><span style={{ opacity: 0.7 }}>≤10 units</span>
              </p>
            </div>
            {/* Low */}
            <div style={{
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: 12, padding: '12px 10px', textAlign: 'center',
            }}>
              <p style={{ margin: '0 0 3px', fontSize: 26, fontWeight: 700, color: '#D97706', lineHeight: 1 }}>
                {low.length}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: '#D97706', lineHeight: 1.35 }}>
                Low<br /><span style={{ opacity: 0.7 }}>≤50 units</span>
              </p>
            </div>
            {/* Total */}
            <div style={{
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: 12, padding: '12px 10px', textAlign: 'center',
            }}>
              <p style={{ margin: '0 0 3px', fontSize: 26, fontWeight: 700, color: '#111827', lineHeight: 1 }}>
                {items.length}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: '#6b7280', lineHeight: 1.35 }}>
                Total<br /><span style={{ opacity: 0.7 }}>items</span>
              </p>
            </div>
          </div>

          {/* ── Filter Pills ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 18px 10px',
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Filter:</span>
            {[
              { id: 'all',      label: 'All',      dot: null },
              { id: 'critical', label: 'Critical', dot: '#ef4444' },
              { id: 'low',      label: 'Low',      dot: '#f59e0b' },
            ].map(({ id, label, dot }) => {
              const active = filter === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 13px', borderRadius: 20, cursor: 'pointer',
                    fontSize: 12, fontWeight: 600,
                    border: active ? '1px solid #e87c27' : '1px solid #e5e7eb',
                    background: active ? '#FFF7ED' : '#fff',
                    color: active ? '#e87c27' : '#6b7280',
                    transition: 'all 0.15s',
                  }}
                >
                  {dot && (
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: dot, display: 'inline-block', flexShrink: 0,
                    }} />
                  )}
                  {label}
                </button>
              )
            })}
          </div>

          {/* ── Item List ── */}
          <div
            style={{ maxHeight: 280, overflowY: 'auto', padding: '0 10px 8px' }}
            className="ls-scroll"
          >
            {sorted.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '24px 0' }}>
                No items in this category
              </p>
            ) : sorted.map((item) => {
              const isCritical = item.stock <= 10
              return (
                <div
                  key={item.sku}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 10px', borderRadius: 10, marginBottom: 2,
                    transition: 'background 0.15s',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Icon */}
                  <div style={{
                    width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                    background: isCritical ? '#FEF2F2' : '#FFFBEB',
                    border: `1px solid ${isCritical ? '#FECACA' : '#FDE68A'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isCritical
                      ? <IconAlertCircle size={15} color="#DC2626" />
                      : <IconAlertTriangle size={15} color="#D97706" />
                    }
                  </div>

                  {/* Info — left aligned */}
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <p style={{
                      margin: 0, fontSize: 13, fontWeight: 600, color: '#111827',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      textAlign: 'left',
                    }}>
                      {item.description}
                    </p>
                    <p style={{ margin: '-5px 0 0', fontSize: 11, color: '#9ca3af', textAlign: 'left' }}>
                      SKU: {item.sku}
                      {item.category && item.category !== 'Uncategorized' ? ` · ${item.category}` : ''}
                    </p>
                  </div>

                  {/* Stock badge */}
                  <div style={{ flexShrink: 0, textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      minWidth: 36, padding: '4px 10px',
                      borderRadius: 20, fontSize: 13, fontWeight: 700,
                      background: isCritical ? '#FEF2F2' : '#FFFBEB',
                      color: isCritical ? '#DC2626' : '#D97706',
                      border: `1px solid ${isCritical ? '#FECACA' : '#FDE68A'}`,
                    }}>
                      {item.stock}
                    </span>
                    <p style={{ margin: '2px 0 0', fontSize: 10, color: '#9ca3af', textAlign: 'center' }}>left</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Footer ── */}
          <div style={{
            padding: '12px 18px 16px',
            borderTop: '1px solid #f3f4f6',
            display: 'flex', gap: 10,
            background: '#fafafa',
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '11px 0', borderRadius: 10,

                background: '#fff',
                border: '1px solid #e5e7eb',
                color: '#374151', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#f3f4f6'
                e.currentTarget.style.borderColor = '#d1d5db'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#fff'
                e.currentTarget.style.borderColor = '#e5e7eb'
              }}
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={onViewInventory}
              style={{
                flex: 1, padding: '11px 0', borderRadius: 10,
                background: '#e87c27',
                border: 'none',
                color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                boxShadow: '0 4px 14px rgba(232,124,39,0.35)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#d07020'
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(232,124,39,0.45)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#e87c27'
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(232,124,39,0.35)'
              }}
            >
              <IconPackages size={15} />
              View inventory ↗
            </button>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes lsBackdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes lsModalIn {
          from { opacity: 0; transform: scale(0.96) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        .ls-scroll::-webkit-scrollbar { width: 4px; }
        .ls-scroll::-webkit-scrollbar-track { background: transparent; }
        .ls-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
      `}</style>
    </>
  )
}

/* ── App ────────────────────────────────────────────────── */
function App() {
  const [loggedIn, setLoggedIn]               = useState(false)
  const [currentUser, setCurrentUser]         = useState(null)
  const [showLowStockModal, setShowLowStockModal] = useState(false)
  const [navigateTarget, setNavigateTarget]   = useState(null)

  const handleLoginSuccess = (userName) => {
    setCurrentUser(userName || 'Admin User')
    setLoggedIn(true)
    if (LOW_STOCK_ITEMS.length > 0) setShowLowStockModal(true)
  }

  const handleLogout = () => {
    setLoggedIn(false)
    setCurrentUser(null)
    setShowLowStockModal(false)
  }

  const handleViewInventory = () => {
    setShowLowStockModal(false)
    setNavigateTarget('Product')
  }

  if (!loggedIn) return <LoginPage onLoginSuccess={handleLoginSuccess} />

  return (
    <>
      <Dashboard
        onLogout={handleLogout}
        userName={currentUser}
        navigateTarget={navigateTarget}
        onNavigated={() => setNavigateTarget(null)}
      />
      {showLowStockModal && (
        <LowStockLoginModal
          items={LOW_STOCK_ITEMS}
          onClose={() => setShowLowStockModal(false)}
          onViewInventory={handleViewInventory}
        />
      )}
    </>
  )
}

export default App