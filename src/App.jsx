import { useState } from 'react'
import './App.css'
import LoginPage from './LoginPage.jsx'
import Dashboard from './Invvv.jsx'
import { getLowStockProducts } from './productUtils.js'
import { INITIAL_PRODUCTS } from './initialProducts.js'
import { syncProductsStatus } from './productUtils.js'
import {
  MODAL_THEME,
  ModalBackdrop,
  ModalFrame,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalStatGrid,
  ModalBtn,
} from './ModalUI.jsx'

const LOW_STOCK_ITEMS = getLowStockProducts(syncProductsStatus(INITIAL_PRODUCTS))

function LowStockLoginModal({ onClose, items }) {
  const critical = items.filter(i => i.stock <= 10)
  const warning = items.filter(i => i.stock > 10)
  const theme = MODAL_THEME['low-stock']

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalFrame maxWidth={500}>
        <ModalHeader
          theme={theme}
          title="Low stock alert"
          subtitle={`${items.length} item${items.length !== 1 ? 's' : ''} need${items.length === 1 ? 's' : ''} restocking`}
          onClose={onClose}
        />
        <ModalBody style={{ paddingTop: 10 }}>
          <ModalStatGrid stats={[
            { value: critical.length, label: 'Critical (≤10)', color: '#dc2626' },
            { value: warning.length, label: 'Low (≤50)', color: '#d97706' },
            { value: items.length, label: 'Total items', color: '#0f172a' },
          ]} />
          <div style={{
            border: '1px solid #e8ecf1', borderRadius: 14, overflow: 'hidden',
            background: '#fff', boxShadow: '0 6px 24px rgba(15, 23, 42, 0.06)',
            maxHeight: 270, overflowY: 'auto',
          }}>
            <div style={{
              display: 'flex', gap: 16, padding: '8px 16px', background: '#f8fafc',
              borderBottom: '1px solid #e8ecf1', fontSize: 11, fontWeight: 600, color: '#94a3b8',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                Critical
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                Low
              </span>
            </div>
            {items.slice(0, 10).map((item, idx) => {
              const isCritical = item.stock <= 10
              return (
                <div key={item.sku} className="wis-modal-low-item" style={{ background: isCritical ? '#fffbfb' : idx % 2 === 1 ? '#fafbfc' : '#fff' }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={isCritical ? '#ef4444' : '#f59e0b'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{item.description}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8' }}>
                      SKU: {item.sku}
                      {item.category !== "Uncategorized" ? ` · ${item.category}` : ''}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                    <span style={{
                      fontSize: 12, fontWeight: 800, padding: '3px 14px', borderRadius: 20, flexShrink: 0,
                      background: isCritical ? '#fee2e2' : '#fef3c7',
                      color: isCritical ? '#b91c1c' : '#b45309',
                    }}>
                      {item.stock}
                    </span>
                    <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>left</span>
                  </div>
                </div>
              )
            })}
            {items.length > 10 && (
              <div style={{
                padding: '12px 20px', fontSize: 12, color: '#64748b', fontWeight: 600,
                background: 'linear-gradient(180deg, #f8fafc, #f1f5f9)', textAlign: 'center',
                borderTop: '1px solid #e8ecf1',
              }}>
                +{items.length - 10} more item{items.length - 10 !== 1 ? 's' : ''} need attention
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter style={{ justifyContent: 'flex-end', gap: 10 }}>
          <ModalBtn variant="secondary" onClick={onClose}>Dismiss</ModalBtn>
          <ModalBtn variant="primary" onClick={onClose}>
            View Inventory
          </ModalBtn>
        </ModalFooter>
      </ModalFrame>
    </ModalBackdrop>
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