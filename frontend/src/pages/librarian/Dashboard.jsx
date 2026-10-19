import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { StatCard } from '../../components/StatCard';

export const LibrarianDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/dashboard/stats');
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="container-fluid px-0">
      {/* Welcome Banner */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold font-outfit mb-1 text-dark">Librarian Overview</h2>
          <p className="text-muted mb-0">
            Real-time library analytics, circulation records, and book inventory health.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary rounded-pill px-3 py-2 d-flex align-items-center gap-2"
            onClick={fetchStats}
            title="Refresh metrics"
          >
            <i className="bi bi-arrow-clockwise"></i> Refresh
          </button>
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show border-0 shadow-sm mb-4`} role="alert">
          <i className={`bi ${alert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
          {alert.message}
          <button type="button" className="btn-close" onClick={() => setAlert(null)} aria-label="Close"></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger border-0 shadow-sm mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
        </div>
      )}

      {/* Metrics Row */}
      <div className="row g-3 mb-4">
        <div className="col-xl-3 col-md-6">
          <StatCard
            title="Total Book Titles"
            value={stats?.totalBooks ?? '0'}
            icon="bi-journal-bookmark-fill"
            gradient="gradient-card-primary"
            subtitle="Distinct catalog titles"
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <StatCard
            title="Total Copies"
            value={stats?.totalCopies ?? '0'}
            icon="bi-layers-fill"
            subtitle="Total physical copies"
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <StatCard
            title="Available Copies"
            value={stats?.availableCopies ?? '0'}
            icon="bi-check-circle-fill"
            gradient="gradient-card-success"
            subtitle="Ready to be borrowed"
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <StatCard
            title="Active Borrows"
            value={stats?.currentlyBorrowedBooks ?? '0'}
            icon="bi-arrow-up-right-circle"
            gradient="gradient-card-warning"
            subtitle="Books currently checked out"
            textColor="text-dark"
          />
        </div>
        <div className="col-xl-4 col-md-6">
          <StatCard
            title="Returned Books"
            value={stats?.returnedBooks ?? '0'}
            icon="bi-arrow-down-left-circle"
            subtitle="Completed borrowing records"
          />
        </div>
        <div className="col-xl-4 col-md-6">
          <StatCard
            title="Overdue Loans (>15 Days)"
            value={stats?.pendingReturns ?? '0'}
            icon="bi-clock-history"
            gradient={stats?.pendingReturns > 0 ? 'gradient-card-danger' : null}
            subtitle={stats?.pendingReturns > 0 ? 'Late fines accruing (₹2/day)' : 'All returns within window'}
          />
        </div>
        <div className="col-xl-4 col-md-12">
          <div
            className="card border-0 shadow-sm rounded-3 stat-card p-4 h-100"
            style={{ cursor: 'pointer', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}
            onClick={() => navigate('/librarian/penalties')}
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-white-50 fs-7 fw-medium">Penalty Fees Collected</span>
              <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                <i className="bi bi-cash-coin fs-5 text-white"></i>
              </div>
            </div>
            <h2 className="fw-bold font-outfit mb-1 text-white">
              ₹{(stats?.totalFinesCollected || 0).toFixed(2)}
            </h2>
            <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top border-white border-opacity-25 fs-8 text-white-50">
              <span>View full penalties ledger</span>
              <i className="bi bi-arrow-right text-white"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics & Audits Section */}
      <div className="row g-4">
        {/* Recent Circulation Audits Table */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <h6 className="fw-bold font-outfit mb-0 text-dark">
                <i className="bi bi-receipt-cutoff text-primary me-2"></i>
                Recent Circulation Audits
              </h6>
              <button className="btn btn-link btn-sm text-decoration-none p-0 fw-semibold" onClick={() => navigate('/librarian/transactions')}>
                View All Audits &rarr;
              </button>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="ps-3">Student</th>
                      <th>Book Title</th>
                      <th>Issue Date</th>
                      <th>Status</th>
                      <th className="pe-3 text-end">Fine Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-muted">
                          <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
                          Loading audits...
                        </td>
                      </tr>
                    ) : stats?.recentTransactions?.length > 0 ? (
                      stats.recentTransactions.map((tx) => (
                        <tr key={tx.id}>
                          <td className="ps-3">
                            <div className="fw-semibold text-dark">{tx.studentName}</div>
                            <small className="text-muted font-monospace">{tx.studentUsn}</small>
                          </td>
                          <td>
                            <div className="fw-medium text-dark">{tx.bookTitle}</div>
                          </td>
                          <td>
                            <span className="text-muted fs-8">{tx.issueDate}</span>
                          </td>
                          <td>
                            <span className={`badge ${tx.status === 'BORROWED' ? 'bg-warning text-dark' : 'bg-success'}`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="pe-3 text-end">
                            {tx.fine && tx.fine > 0 ? (
                              <span className="text-danger fw-bold">₹{tx.fine.toFixed(2)}</span>
                            ) : (
                              <span className="text-muted">₹0.00</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-muted">
                          No recent transactions recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Inventory & Policy Health */}
        <div className="col-lg-4 d-flex flex-column gap-4">
          {/* Stock Health Widget */}
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-header bg-white py-3 border-bottom">
              <h6 className="fw-bold font-outfit mb-0 text-dark">
                <i className="bi bi-pie-chart-fill text-primary me-2"></i>
                Inventory Distribution
              </h6>
            </div>
            <div className="card-body p-3">
              <div className="d-flex justify-content-between mb-2 fs-7">
                <span className="text-muted">Available on Shelves:</span>
                <strong className="text-success">{stats?.availableCopies || 0} copies</strong>
              </div>
              <div className="d-flex justify-content-between mb-3 fs-7">
                <span className="text-muted">Currently Issued:</span>
                <strong className="text-warning">{stats?.currentlyBorrowedBooks || 0} copies</strong>
              </div>

              {/* Progress Bar */}
              <div className="progress mb-2" style={{ height: '10px' }}>
                <div
                  className="progress-bar bg-success"
                  role="progressbar"
                  style={{
                    width: stats?.totalCopies
                      ? `${((stats.availableCopies / stats.totalCopies) * 100).toFixed(0)}%`
                      : '0%',
                  }}
                ></div>
                <div
                  className="progress-bar bg-warning"
                  role="progressbar"
                  style={{
                    width: stats?.totalCopies
                      ? `${((stats.currentlyBorrowedBooks / stats.totalCopies) * 100).toFixed(0)}%`
                      : '0%',
                  }}
                ></div>
              </div>

              <div className="d-flex justify-content-between text-muted fs-8">
                <span><i className="bi bi-square-fill text-success me-1"></i> Available</span>
                <span><i className="bi bi-square-fill text-warning me-1"></i> Borrowed ({stats?.currentlyBorrowedBooks || 0})</span>
              </div>
            </div>
          </div>

          {/* Quick System Rules Widget */}
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-header bg-white py-3 border-bottom">
              <h6 className="fw-bold font-outfit mb-0 text-dark">
                <i className="bi bi-shield-check text-success me-2"></i>
                Circulation Rules & Policy
              </h6>
            </div>
            <div className="card-body p-3 text-muted fs-8 d-flex flex-column gap-2">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-check-circle-fill text-primary"></i>
                <span><strong>Max Borrow Limit:</strong> 3 books per student</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-check-circle-fill text-primary"></i>
                <span><strong>Borrowing Duration:</strong> 15 calendar days</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-check-circle-fill text-primary"></i>
                <span><strong>Late Penalty Fee:</strong> ₹2.00 / day overdue</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-check-circle-fill text-primary"></i>
                <span><strong>Student Password Liberty:</strong> Allowed anytime via profile</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
