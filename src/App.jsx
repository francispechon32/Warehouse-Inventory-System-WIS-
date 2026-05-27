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
  ModalAccentBar,
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
      <ModalFrame maxWidth={480}>
        <ModalAccentBar accent={theme.accent} />
        <ModalHeader
          theme={theme}
          title="Low stock alert"
          subtitle={`${items.length} item${items.length !== 1 ? 's' : ''} need${items.length === 1 ? 's' : ''} restocking`}
          onClose={onClose}
        />
        <ModalBody style={{ paddingTop: 8 }}>
          <ModalStatGrid stats={[
            { value: critical.length, label: 'Critical (≤10)', color: '#dc2626' },
            { value: warning.length, label: 'Low (≤50)', color: '#d97706' },
            { value: items.length, label: 'Total items', color: '#0f172a' },
          ]} />
          <div style={{
            border: '1px solid #e8ecf1',
            borderRadius: 14,
            overflow: 'hidden',
            background: '#fff',
            boxShadow: '0 6px 24px rgba(15, 23, 42, 0.06)',
            maxHeight: 260,
            overflowY: 'auto',
          }}>
            {items.slice(0, 10).map((item) => {
              const isCritical = item.stock <= 10
              return (
                <div key={item.sku} className="wis-modal-low-item">
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                    background: isCritical ? '#ef4444' : '#f59e0b',
                    boxShadow: `0 0 0 3px ${isCritical ? '#fecaca' : '#fde68a'}`,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{item.description}</p>
                    <p style={{ margin: '3px 0 0', fontSize: 11, color: '#94a3b8' }}>
                      SKU: {item.sku} · {item.category}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 800, padding: '5px 12px', borderRadius: 20, flexShrink: 0,
                    background: isCritical ? '#fee2e2' : '#fef3c7',
                    color: isCritical ? '#b91c1c' : '#b45309',
                  }}>
                    {item.stock} left
                  </span>
                </div>
              )
            })}
            {items.length > 10 && (
              <p style={{ margin: 0, padding: '10px 20px', fontSize: 12, color: '#94a3b8', background: '#f8fafc' }}>
                +{items.length - 10} more items
              </p>
            )}
          </div>
        </ModalBody>
        <ModalFooter style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Updated just now</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <ModalBtn variant="secondary" onClick={onClose}>Dismiss</ModalBtn>
            <ModalBtn variant="primary" onClick={onClose}>
              View inventory →
            </ModalBtn>
          </div>
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
