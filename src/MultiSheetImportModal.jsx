// Multi-Sheet Import Modal Component
// Handles importing all data types from a single Excel file

import { useState, useRef } from 'react';
import { importMultiSheetExcel } from './multiSheetImport';
import {
  modalOverlayStyle,
  modalPanelStyle,
  modalHeaderStyle,
  modalFooterStyle,
  modalTitleStyle,
  modalSubtitleStyle,
  modalCloseBtnStyle,
  modalBtnSecondary,
  modalBtnPrimary,
} from './modalFormStyles';

function IconUpload({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="12" y1="18" x2="12" y2="12"/>
      <polyline points="9,15 12,12 15,15"/>
    </svg>
  );
}

function IconCheck({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20,6 9,17 4,12"/>
    </svg>
  );
}

function IconX({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function IconSpinner({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
      <path d="M21 12a9 9 0 11-6.219-8.56"/>
    </svg>
  );
}

export default function MultiSheetImportModal({ 
  isOpen, 
  onClose, 
  onImportComplete,
  onSaveData // Callback to save imported data
}) {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef();

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setError('Please select a valid Excel (.xlsx) file');
      return;
    }

    setImporting(true);
    setProgress(null);
    setResults(null);
    setError(null);

    try {
      await importMultiSheetExcel(
        file,
        // onProgress
        (progressData) => {
          setProgress(progressData);
        },
        // onComplete
        (importResults) => {
          setResults(importResults);
          setImporting(false);
          console.log('Import completed successfully:', importResults);
        },
        // onError
        (importError) => {
          setError(importError.message || 'Import failed');
          setImporting(false);
        }
      );
    } catch (err) {
      setError(err.message || 'Unexpected error during import');
      setImporting(false);
    }

    // Clear file input
    e.target.value = '';
  };

  const handleSaveToSystem = async () => {
    if (!results || !onSaveData) return;

    try {
      setImporting(true);
      await onSaveData(results);
      onImportComplete?.(results);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save data to system');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setImporting(false);
    setProgress(null);
    setResults(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={modalOverlayStyle}>
      <div style={{ 
        ...modalPanelStyle, 
        width: 600, 
        maxWidth: '90vw', 
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={modalHeaderStyle}>
          <div>
            <h2 style={modalTitleStyle}>Multi-Sheet Excel Import</h2>
            <p style={modalSubtitleStyle}>
              Import all data types from a single Excel file
            </p>
          </div>
          <button onClick={handleClose} style={modalCloseBtnStyle}>×</button>
        </div>

        {/* Content */}
        <div 
          className="import-modal-content"
          style={{ 
            padding: '24px', 
            flex: 1, 
            overflowY: 'auto',
            minHeight: 0,
            maxHeight: 'calc(90vh - 140px)' // Account for header and footer
          }}>
          <style>
            {`
              .import-modal-content::-webkit-scrollbar {
                width: 6px;
              }
              .import-modal-content::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 3px;
              }
              .import-modal-content::-webkit-scrollbar-thumb {
                background: #c1c1c1;
                border-radius: 3px;
              }
              .import-modal-content::-webkit-scrollbar-thumb:hover {
                background: #a8a8a8;
              }
            `}
          </style>
          
          {/* Expected Sheet Names Info */}
          <div style={{ 
            background: '#f8fafc', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px', 
            padding: '16px', 
            marginBottom: '24px' 
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              Expected Sheet Names:
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '12px', color: '#6b7280' }}>
              <div>• <strong>LIST OF SKU</strong> → Products</div>
              <div>• <strong>LIST OF PURCHASE ORDER</strong> → Purchase Orders</div>
              <div>• <strong>ENDING INVENTORY</strong> → Ending Inventory</div>
              <div>• <strong>ADVANCE CUSTOMER PO & EST END</strong> → Customer POs</div>
              <div>• <strong>BACKLOAD INVENTORY</strong> → Backload</div>
              <div>• <strong>RETURN INVENTORY</strong> → Returns</div>
              <div>• <strong>Individual SKU sheets</strong> → Stock Transactions (e.g., DRB007, SKU17, SHPT2)</div>
            </div>
          </div>

          {/* File Upload */}
          {!results && (
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                disabled={importing}
              />
              
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  padding: '32px',
                  cursor: importing ? 'not-allowed' : 'pointer',
                  background: importing ? '#f9fafb' : '#ffffff',
                  transition: 'all 0.2s',
                  ':hover': { borderColor: '#9ca3af' }
                }}
              >
                <IconUpload size={32} />
                <p style={{ margin: '12px 0 4px 0', fontSize: '16px', fontWeight: '500', color: '#374151' }}>
                  {importing ? 'Processing...' : 'Select Excel File'}
                </p>
                <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                  Choose an .xlsx file with multiple sheets
                </p>
              </div>
            </div>
          )}

          {/* Progress */}
          {progress && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Processing: {progress.sheetName}
                </span>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div style={{ 
                background: '#f3f4f6', 
                height: '8px', 
                borderRadius: '4px', 
                overflow: 'hidden' 
              }}>
                <div style={{
                  background: '#e87c27',
                  height: '100%',
                  width: `${(progress.current / progress.total) * 100}%`,
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                Detected as: {progress.sheetType}
              </p>
            </div>
          )}

          {/* Results */}
          {results && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                Import Results
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                {[
                  { label: 'Products', count: results.summary.totalProducts },
                  { label: 'Purchase Orders', count: results.summary.totalPurchaseOrders },
                  { label: 'Ending Inventory', count: results.summary.totalEndingInventory },
                  { label: 'Customer POs', count: results.summary.totalAdvanceCustomerPo },
                  { label: 'Backload', count: results.summary.totalBackload },
                  { label: 'Returns', count: results.summary.totalReturns },
                  { label: 'Stock Sheets', count: results.summary.totalStockSheets },
                  { label: 'Stock In', count: results.summary.totalStockIn },
                  { label: 'Stock Out', count: results.summary.totalStockOut }
                ].map(item => (
                  <div key={item.label} style={{
                    background: item.count > 0 ? '#f0fdf4' : '#f9fafb',
                    border: `1px solid ${item.count > 0 ? '#bbf7d0' : '#e5e7eb'}`,
                    borderRadius: '6px',
                    padding: '12px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: item.count > 0 ? '#059669' : '#6b7280' }}>
                      {item.count}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>

              {results.stockSheets && results.stockSheets.length > 0 && (
                <div style={{ background: '#f0f9ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '12px', marginBottom: '16px' }}>
                  <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#1e40af' }}>
                    Stock Sheets Processed ({results.stockSheets.length}):
                  </h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {results.stockSheets.slice(0, 10).map((sheet, i) => (
                      <span key={i} style={{
                        fontSize: '11px', 
                        color: '#1e40af',
                        background: '#dbeafe',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontWeight: '500'
                      }}>
                        {sheet.sku} ({sheet.transactions.length})
                      </span>
                    ))}
                    {results.stockSheets.length > 10 && (
                      <span style={{
                        fontSize: '11px', 
                        color: '#6b7280',
                        fontStyle: 'italic'
                      }}>
                        +{results.stockSheets.length - 10} more...
                      </span>
                    )}
                  </div>
                </div>
              )}

              {results.skippedSheets.length > 0 && (
                <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '6px', padding: '12px' }}>
                  <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#92400e' }}>
                    Skipped Sheets ({results.skippedSheets.length}):
                  </h5>
                  {results.skippedSheets.map((sheet, i) => (
                    <div key={i} style={{ fontSize: '12px', color: '#92400e' }}>
                      • {sheet.name}: {sheet.reason}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <IconX size={16} color="#dc2626" />
              <span style={{ fontSize: '14px', color: '#dc2626' }}>{error}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{
          ...modalFooterStyle,
          flexShrink: 0,
          borderTop: '1px solid #e5e7eb'
        }}>
          <button onClick={handleClose} style={modalBtnSecondary} disabled={importing}>
            Cancel
          </button>
          
          {results && onSaveData && (
            <button 
              onClick={handleSaveToSystem} 
              style={modalBtnPrimary}
              disabled={importing}
            >
              {importing ? (
                <>
                  <IconSpinner size={16} />
                  Saving...
                </>
              ) : (
                <>
                  <IconCheck size={16} />
                  Save to System
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}