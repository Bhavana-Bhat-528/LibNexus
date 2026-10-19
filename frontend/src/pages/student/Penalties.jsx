import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export const StudentPenalties = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('unpaid'); // 'unpaid' | 'paid'
  const navigate = useNavigate();

  const fetchPenalties = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/student-portal/penalties');
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load penalty fees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPenalties();
  }, []);

  const totalUnpaid = data?.totalUnpaidFines || 0;
  const totalPaid = data?.totalPaidFines || 0;
  const overdueCount = data?.overdueCount || 0;
  const unpaidList = data?.unpaidPenalties || [];
  const paidList = data?.paidPenalties || [];

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold font-outfit text-dark mb-1">
            <i className="bi bi-cash-coin text-warning me-2"></i>
            My Penalty Fees Statement
          </h3>
          <p className="text-muted fs-7 mb-0">
            Statement of late fees yet to be given (accruing on active loans) and penalties already settled.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-outline-secondary btn-sm rounded-2 d-flex align-items-center gap-1 shadow-sm"
            onClick={fetchPenalties}
            disabled={loading}
          >
            <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i>
            <span>Refresh</span>
          </button>
          {totalUnpaid > 0 && (
            <button
              className="btn btn-danger btn-sm rounded-2 d-flex align-items-center gap-1 shadow-sm"
              onClick={() => navigate('/student/return')}
            >
              <i className="bi bi-arrow-down-left-circle"></i>
              <span>Return Overdue Books Now</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger border-0 rounded-3 mb-4 d-flex align-items-center gap-2 shadow-sm">
          <i className="bi bi-exclamation-triangle-fill fs-5"></i>
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards: Yet to be given vs Already given */}
      <div className="row g-3 mb-4">
        {/* Unpaid / Yet to be given */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white border-start border-danger border-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-danger fw-semibold fs-7 text-uppercase" style={{ letterSpacing: '0.05em' }}>
                <i className="bi bi-hourglass-split me-1"></i> Yet to be Given
              </span>
              <div className="bg-danger bg-opacity-10 text-danger rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                <i className="bi bi-exclamation-circle-fill fs-5"></i>
              </div>
            </div>
            <h2 className="fw-bold font-outfit text-danger mb-1">
              ₹{totalUnpaid.toFixed(2)}
            </h2>
            <small className="text-muted">
              {overdueCount > 0 ? `Accruing on ${overdueCount} overdue book(s)` : 'Zero unpaid penalties'}
            </small>
          </div>
        </div>

        {/* Paid / Already given */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white border-start border-success border-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-success fw-semibold fs-7 text-uppercase" style={{ letterSpacing: '0.05em' }}>
                <i className="bi bi-check-circle-fill me-1"></i> Already Given (Paid)
              </span>
              <div className="bg-success bg-opacity-10 text-success rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                <i className="bi bi-receipt-cutoff fs-5"></i>
              </div>
            </div>
            <h2 className="fw-bold font-outfit text-success mb-1">
              ₹{totalPaid.toFixed(2)}
            </h2>
            <small className="text-muted">
              {paidList.length > 0 ? `Settled across ${paidList.length} past return(s)` : 'No past penalties incurred'}
            </small>
          </div>
        </div>

        {/* Overdue Items Count */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white border-start border-warning border-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-warning fw-semibold fs-7 text-uppercase" style={{ letterSpacing: '0.05em' }}>
                <i className="bi bi-clock-history me-1"></i> Active Overdues
              </span>
              <div className="bg-warning bg-opacity-10 text-warning rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                <i className="bi bi-alarm-fill fs-5"></i>
              </div>
            </div>
            <h2 className="fw-bold font-outfit text-dark mb-1">
              {overdueCount}
            </h2>
            <small className="text-muted">
              {overdueCount > 0 ? 'Fines increasing by ₹2.00/day' : 'All loans within 15-day window'}
            </small>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-3">
          <ul className="nav nav-pills gap-2">
            <li className="nav-item">
              <button
                className={`nav-link rounded-pill px-4 py-2 fw-semibold fs-7 ${activeTab === 'unpaid' ? 'active bg-danger text-white' : 'btn-light text-dark'}`}
                onClick={() => setActiveTab('unpaid')}
              >
                <i className="bi bi-exclamation-triangle-fill me-1"></i> Fees Yet to be Given ({unpaidList.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link rounded-pill px-4 py-2 fw-semibold fs-7 ${activeTab === 'paid' ? 'active bg-success text-white' : 'btn-light text-dark'}`}
                onClick={() => setActiveTab('paid')}
              >
                <i className="bi bi-check-circle-fill me-1"></i> Fees Already Given ({paidList.length})
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Tab Content 1: Fees Yet to be Given */}
      {activeTab === 'unpaid' && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
            <div>
              <h6 className="fw-bold font-outfit mb-0 text-danger">
                <i className="bi bi-hourglass-top me-2"></i>
                Outstanding Penalty Fees Yet to be Given
              </h6>
              <small className="text-muted">Accruing on currently checked-out books that have passed the 15-day loan deadline.</small>
            </div>
            <span className="badge bg-danger bg-opacity-10 text-danger fw-bold px-3 py-1 rounded-pill">
              ₹{totalUnpaid.toFixed(2)} Total Accrued
            </span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4">Book Title</th>
                  <th>Category</th>
                  <th>Issue Date</th>
                  <th>Return Deadline</th>
                  <th className="text-center">Days Overdue</th>
                  <th className="text-end">Accrued Penalty (₹)</th>
                  <th className="pe-4 text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <span className="spinner-border spinner-border-sm me-2 text-primary" role="status"></span>
                      Checking outstanding penalties...
                    </td>
                  </tr>
                ) : unpaidList.length > 0 ? (
                  unpaidList.map((item) => (
                    <tr key={item.transactionId} className="table-danger table-opacity-10">
                      <td className="ps-4">
                        <div className="fw-bold text-dark">{item.title}</div>
                        <small className="text-muted font-outfit">by {item.author}</small>
                      </td>
                      <td>
                        <span className="badge bg-light text-secondary border fs-8">
                          {item.category || 'General'}
                        </span>
                      </td>
                      <td className="fs-8">{item.issueDate}</td>
                      <td className="fs-8 text-danger fw-semibold">{item.dueDate}</td>
                      <td className="text-center">
                        <span className="badge bg-danger text-white px-2 py-1 fs-8">
                          +{item.daysOverdue} days overdue
                        </span>
                      </td>
                      <td className="text-end">
                        <span className="fs-6 fw-bold text-danger font-outfit">
                          ₹{item.accruedFine.toFixed(2)}
                        </span>
                        <small className="text-muted d-block fs-8">+₹2.00/day</small>
                      </td>
                      <td className="pe-4 text-end">
                        <button
                          className="btn btn-sm btn-danger rounded-pill px-3 py-1 fs-8 shadow-sm"
                          onClick={() => navigate('/student/return')}
                        >
                          <i className="bi bi-arrow-down-left me-1"></i> Return Book & Settle
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <div className="p-4">
                        <i className="bi bi-shield-check fs-1 text-success d-block mb-2"></i>
                        <h5 className="fw-bold font-outfit text-dark mb-1">Zero Pending Penalties!</h5>
                        <p className="text-muted fs-7 mb-0">
                          All books currently borrowed are within their allowed loan periods. No late penalty fees are due.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 2: Fees Already Given (Paid) */}
      {activeTab === 'paid' && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
            <div>
              <h6 className="fw-bold font-outfit mb-0 text-success">
                <i className="bi bi-check2-all me-2"></i>
                Historical Penalties Already Given & Settled
              </h6>
              <small className="text-muted">Record of all late penalty fees paid on past returned books.</small>
            </div>
            <span className="badge bg-success bg-opacity-10 text-success fw-bold px-3 py-1 rounded-pill">
              ₹{totalPaid.toFixed(2)} Total Settled
            </span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4">Receipt #</th>
                  <th>Book Title</th>
                  <th>Issue Date</th>
                  <th>Return Date</th>
                  <th className="text-center">Days Overdue</th>
                  <th className="text-end">Penalty Fee Paid</th>
                  <th className="pe-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <span className="spinner-border spinner-border-sm me-2 text-primary" role="status"></span>
                      Loading paid penalty history...
                    </td>
                  </tr>
                ) : paidList.length > 0 ? (
                  paidList.map((item) => (
                    <tr key={item.transactionId}>
                      <td className="ps-4 font-outfit fw-bold text-muted">#{item.transactionId}</td>
                      <td>
                        <div className="fw-bold text-dark">{item.title}</div>
                        <small className="text-muted font-outfit">by {item.author}</small>
                      </td>
                      <td className="fs-8">{item.issueDate}</td>
                      <td className="fs-8 text-dark fw-medium">{item.returnDate}</td>
                      <td className="text-center">
                        <span className="badge bg-secondary bg-opacity-10 text-secondary border px-2 py-1 fs-8">
                          +{item.daysOverdue} days
                        </span>
                      </td>
                      <td className="text-end">
                        <span className="fs-6 fw-bold text-success font-outfit">
                          ₹{Number(item.finePaid).toFixed(2)}
                        </span>
                      </td>
                      <td className="pe-4 text-center">
                        <span className="badge bg-success text-white px-3 py-1 rounded-pill fs-8">
                          <i className="bi bi-check-circle-fill me-1"></i> Settled
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <div className="p-4">
                        <i className="bi bi-emoji-smile fs-1 text-success d-block mb-2"></i>
                        <h5 className="fw-bold font-outfit text-dark mb-1">No Past Penalties</h5>
                        <p className="text-muted fs-7 mb-0">
                          You haven't incurred any past penalty fees on returned books. Clean record!
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Policy Notice Card */}
      <div className="card border-0 rounded-4 bg-dark text-white-50 p-4 mt-4 shadow-sm">
        <div className="d-flex align-items-center gap-3">
          <div className="bg-primary text-white rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
            <i className="bi bi-shield-check fs-4"></i>
          </div>
          <div>
            <h6 className="fw-bold text-white font-outfit mb-1">Library Circulation Penalty Policy</h6>
            <p className="fs-8 mb-0">
              Books must be returned within <strong>15 days</strong> from issue date. Late fees accrue automatically at <strong>₹2.00 per calendar day</strong> beyond the 15-day limit until the book is returned. Penalty fees are recorded upon returning the book.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
