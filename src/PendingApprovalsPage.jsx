import { useState, useEffect } from 'react';

// API functions
async function fetchPendingApprovals() {
  const response = await fetch('/api/advance-customer-po');
  if (!response.ok) throw new Error('Failed to fetch pending approvals');
  const data = await response.json();
  return data.filter(item => item.status === 'Pending Approval');
}

async function approveReservation(id, approvedBy, remarks = '') {
  const response = await fetch(`/api/advance-customer-po/${id}/approval`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'approve', approved_by: approvedBy, remarks })
  });
  if (!response.ok) throw new Error('Failed to approve reservation');
  return response.json();
}

async function rejectReservation(id, approvedBy, remarks = '') {
  const response = await fetch(`/api/advance-customer-po/${id}/approval`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'reject', approved_by: approvedBy, remarks })
  });
  if (!response.ok) throw new Error('Failed to reject reservation');
  return response.json();
}

function PendingApprovalsPage({ currentUser }) {
  const [pendingReservations, setPendingReservations] = useState([]);
  const [approvedToday, setApprovedToday] = useState([]);
  const [rejectedToday, setRejectedToday] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const allData = await fetch('/api/advance-customer-po').then(res => res.json());
      
      const today = new Date().toISOString().slice(0, 10);
      
      setPendingReservations(allData.filter(item => item.status === 'Pending Approval'));
      setApprovedToday(allData.filter(item => 
        item.status === 'Approved' && 
        item.approval_date && 
        item.approval_date.slice(0, 10) === today
      ));
      setRejectedToday(allData.filter(item => 
        item.status === 'Rejected' && 
        item.approval_date && 
        item.approval_date.slice(0, 10) === today
      ));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reservationId) => {
    try {
      await approveReservation(reservationId, currentUser.id);
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error approving reservation:', error);
      alert('Failed to approve reservation');
    }
  };

  const handleReject = async (reservationId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    try {
      await rejectReservation(reservationId, currentUser.id, reason);
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error rejecting reservation:', error);
      alert('Failed to reject reservation');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Check if user can approve (Admin or Manager)
  const canApprove = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        color: '#64748b' 
      }}>
        Loading pending approvals...
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          color: '#1e293b', 
          marginBottom: '8px' 
        }}>
          Pending Approvals
        </h1>
        <p style={{ 
          color: '#64748b', 
          fontSize: '14px',
          margin: 0 
        }}>
          Review and act on pending reservation requests
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '20px',
        marginBottom: '32px' 
      }}>
        {/* Awaiting Approval */}
        <div style={{
          background: '#fff7ed',
          border: '1px solid #fed7aa',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: '#fb923c',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#ea580c', marginBottom: '4px' }}>
            {pendingReservations.length}
          </div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#ea580c', marginBottom: '4px' }}>
            Awaiting Approval
          </div>
          <div style={{ fontSize: '12px', color: '#9a3412' }}>
            Requires your attention
          </div>
        </div>

        {/* Approved Today */}
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: '#22c55e',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#16a34a', marginBottom: '4px' }}>
            {approvedToday.length}
          </div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#16a34a', marginBottom: '4px' }}>
            Approved Today
          </div>
          <div style={{ fontSize: '12px', color: '#15803d' }}>
            No approvals yet today
          </div>
        </div>

        {/* Rejected Today */}
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: '#ef4444',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#dc2626', marginBottom: '4px' }}>
            {rejectedToday.length}
          </div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#dc2626', marginBottom: '4px' }}>
            Rejected Today
          </div>
          <div style={{ fontSize: '12px', color: '#b91c1c' }}>
            No rejections yet today
          </div>
        </div>
      </div>

      {/* Reservation Queue */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '700', 
            color: '#1e293b',
            margin: 0 
          }}>
            Reservation Queue
          </h2>
          <div style={{
            background: '#fef3c7',
            color: '#92400e',
            fontSize: '12px',
            fontWeight: '600',
            padding: '4px 12px',
            borderRadius: '20px'
          }}>
            {pendingReservations.length} Pending
          </div>
        </div>

        {pendingReservations.length === 0 ? (
          <div style={{
            padding: '48px 24px',
            textAlign: 'center',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#334155' }}>
              All caught up!
            </h3>
            <p style={{ fontSize: '14px', margin: 0 }}>
              No pending reservations require your approval at the moment.
            </p>
          </div>
        ) : (
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    TRANS #
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    DATE
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    CUSTOMER
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    AMOUNT
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    STATUS
                  </th>
                  {canApprove && (
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      ACTIONS
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {pendingReservations.map((reservation, index) => (
                  <tr key={reservation.id} style={{ 
                    borderBottom: index < pendingReservations.length - 1 ? '1px solid #f1f5f9' : 'none'
                  }}>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: '#e97316' }}>
                      {reservation.customer_po}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>
                      {formatDate(reservation.po_date)}
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        @ {reservation.created_by_name || 'Unknown'}
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#334155' }}>
                      {reservation.customer_name}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                      ₱{Number(reservation.total_amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        background: '#fef3c7',
                        color: '#92400e',
                        fontSize: '12px',
                        fontWeight: '600',
                        padding: '4px 12px',
                        borderRadius: '20px'
                      }}>
                        Pending
                      </span>
                    </td>
                    {canApprove && (
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleReject(reservation.id)}
                            style={{
                              background: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => {
                              e.target.style.background = '#fee2e2';
                              e.target.style.borderColor = '#fca5a5';
                            }}
                            onMouseLeave={e => {
                              e.target.style.background = '#fef2f2';
                              e.target.style.borderColor = '#fecaca';
                            }}
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleApprove(reservation.id)}
                            style={{
                              background: '#22c55e',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => e.target.style.background = '#16a34a'}
                            onMouseLeave={e => e.target.style.background = '#22c55e'}
                          >
                            Approve
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {!canApprove && (
        <div style={{
          marginTop: '24px',
          background: '#f1f5f9',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span style={{ fontSize: '14px', color: '#475569' }}>
            You do not have sufficient permissions to approve or reject reservations. Only Admin and Manager roles can perform approval actions.
          </span>
        </div>
      )}
    </div>
  );
}

export default PendingApprovalsPage;