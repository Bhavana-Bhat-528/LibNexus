import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { StatCard } from '../../components/StatCard';

export const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/student-portal/dashboard');
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load student dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const hasOverdue = (data?.overdueCount || 0) > 0;
  const remainingQuota = data?.remainingQuota ?? 3;

  return (
    <div className="fade-in">
      {/* Student Welcome Banner */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
        <div className="card-body p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25 px-3 py-1 rounded-pill mb-2">
              <i className="bi bi-mortarboard me-1"></i> Student Member Portal
            </span>
            <h2 className="fw-bold font-outfit mb-1">
              Welcome back, {data?.studentName || 'Student'}!
            </h2>
            <p className="text-white-50 mb-0 fs-7">
              USN: <strong className="text-white font-outfit">{data?.usn}</strong> • Registered Contact: {data?.contact}
            </p>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-light btn-sm rounded-pill px-3" onClick={fetchDashboard} disabled={loading}>
              <i className="bi bi-arrow-clockwise me-1"></i> Refresh
            </button>
            <button className="btn btn-primary btn-sm rounded-pill px-3 shadow-sm" onClick={() => navigate('/student/borrow')}>
              <i className="bi bi-arrow-up-right me-1"></i> Borrow Books
            </button>
          </div>
        </div>
      </div>

      {/* Alert for overdue books */}
      {hasOverdue && (
        <div className="alert alert-danger border-0 rounded-4 mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2 shadow-sm">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-triangle-fill fs-4 text-danger"></i>
            <div>
              <strong>Action Recommended: You have {data.overdueCount} overdue borrowed book(s).</strong>
              <div className="fs-8 text-muted">Late penalties are accumulating at ₹2.00/day. Please return your books to stop further fees.</div>
            </div>
          </div>
          <button className="btn btn-danger btn-sm rounded-pill px-3" onClick={() => navigate('/student/return')}>
            Return Books Now &rarr;
          </button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger border-0 rounded-3 mb-4 d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill fs-5"></i>
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-sm-6">
          <StatCard
            title="Active Borrowed Books"
            value={`${data?.activeBorrowsCount || 0} / 3`}
            icon="bi-book-half"
            gradient="gradient-card-primary"
            subtitle="Currently checked out"
          />
        </div>
        <div className="col-md-3 col-sm-6">
          <StatCard
            title="Available Borrow Quota"
            value={`${remainingQuota} Slots`}
            icon="bi-check-circle"
            gradient="gradient-card-success"
            subtitle="Eligible to borrow now"
          />
        </div>
        <div className="col-md-3 col-sm-6">
          <StatCard
            title="Overdue Books"
            value={data?.overdueCount || 0}
            icon="bi-clock-history"
            gradient={data?.overdueCount > 0 ? 'gradient-card-danger' : null}
            subtitle={data?.overdueCount > 0 ? 'Fines accruing (₹2.00/day)' : 'All returns within window'}
          />
        </div>
        <div className="col-md-3 col-sm-6">
          <div
            className="card border-0 shadow-sm rounded-3 stat-card p-4 h-100"
            style={{ cursor: 'pointer', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }}
            onClick={() => navigate('/student/penalties')}
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-white-50 fs-7 fw-medium">Penalty Statement</span>
              <div className="bg-white bg-opacity-25 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                <i className="bi bi-cash-coin fs-5 text-white"></i>
              </div>
            </div>
            <h2 className="fw-bold font-outfit mb-1 text-white">
              ₹{(data?.currentEstimatedFines || 0).toFixed(2)}
            </h2>
            <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top border-white border-opacity-25 fs-8 text-white-50">
              <span>View unpaid & paid fees</span>
              <i className="bi bi-arrow-right text-white"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Services Navigation Grid */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-6">
          <div
            className="card border-0 shadow-sm rounded-4 p-3 h-100 text-center service-card bg-white"
            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            onClick={() => navigate('/student/borrow')}
          >
            <div className="bg-primary bg-opacity-10 text-primary rounded-circle mx-auto p-3 mb-2" style={{ width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-arrow-up-right-circle-fill fs-3"></i>
            </div>
            <h6 className="fw-bold font-outfit mb-1 text-dark">Borrow Books</h6>
            <small className="text-muted fs-8">Browse & issue available titles</small>
          </div>
        </div>

        <div className="col-md-3 col-6">
          <div
            className="card border-0 shadow-sm rounded-4 p-3 h-100 text-center service-card bg-white"
            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            onClick={() => navigate('/student/return')}
          >
            <div className="bg-success bg-opacity-10 text-success rounded-circle mx-auto p-3 mb-2" style={{ width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-arrow-down-left-circle-fill fs-3"></i>
            </div>
            <h6 className="fw-bold font-outfit mb-1 text-dark">Return Books</h6>
            <small className="text-muted fs-8">Check in borrowed book copies</small>
          </div>
        </div>

        <div className="col-md-3 col-6">
          <div
            className="card border-0 shadow-sm rounded-4 p-3 h-100 text-center service-card bg-white"
            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            onClick={() => navigate('/student/penalties')}
          >
            <div className="bg-warning bg-opacity-10 text-warning rounded-circle mx-auto p-3 mb-2" style={{ width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-cash-coin fs-3"></i>
            </div>
            <h6 className="fw-bold font-outfit mb-1 text-dark">Penalty Fees</h6>
            <small className="text-muted fs-8">Unpaid & paid penalty history</small>
          </div>
        </div>

        <div className="col-md-3 col-6">
          <div
            className="card border-0 shadow-sm rounded-4 p-3 h-100 text-center service-card bg-white"
            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            onClick={() => navigate('/student/profile')}
          >
            <div className="bg-info bg-opacity-10 text-info rounded-circle mx-auto p-3 mb-2" style={{ width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-shield-lock-fill fs-3"></i>
            </div>
            <h6 className="fw-bold font-outfit mb-1 text-dark">My Profile</h6>
            <small className="text-muted fs-8">Change password & view details</small>
          </div>
        </div>
      </div>

      {/* Active Loans Overview Table */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
          <h6 className="fw-bold font-outfit mb-0 text-dark">
            <i className="bi bi-journal-bookmark-fill text-primary me-2"></i>
            Currently Borrowed Books ({data?.activeBorrows?.length || 0})
          </h6>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-primary btn-sm rounded-pill px-3" onClick={() => navigate('/student/borrow')}>
              <i className="bi bi-plus-circle me-1"></i> Borrow More
            </button>
            <button className="btn btn-outline-success btn-sm rounded-pill px-3" onClick={() => navigate('/student/return')}>
              <i className="bi bi-arrow-down-left me-1"></i> Return Books
            </button>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4">Book Title</th>
                  <th>Category</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th className="text-center">Loan Duration</th>
                  <th className="text-end">Late Fee</th>
                  <th className="pe-4 text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">
                      <span className="spinner-border spinner-border-sm me-2 text-primary"></span>
                      Loading your books...
                    </td>
                  </tr>
                ) : data?.activeBorrows?.length > 0 ? (
                  data.activeBorrows.map((b) => (
                    <tr key={b.transactionId} className={b.isOverdue ? 'table-danger table-opacity-10' : ''}>
                      <td className="ps-4 fw-bold text-dark">{b.title}</td>
                      <td><span className="badge bg-light text-dark border fs-8">{b.category}</span></td>
                      <td className="fs-8">{b.issueDate}</td>
                      <td>
                        <span className={`fw-semibold fs-8 ${b.isOverdue ? 'text-danger' : 'text-muted'}`}>
                          {b.dueDate}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`badge ${b.isOverdue ? 'bg-danger' : 'bg-success'} rounded-pill px-3 py-1 fs-8`}>
                          {b.daysElapsed} Days {b.isOverdue && `(Overdue +${b.daysOverdue}d)`}
                        </span>
                      </td>
                      <td className="text-end fw-bold font-outfit">
                        {b.fine > 0 ? <span className="text-danger">₹{b.fine.toFixed(2)}</span> : <span className="text-success">₹0.00</span>}
                      </td>
                      <td className="pe-4 text-end">
                        <button
                          className="btn btn-sm btn-outline-success rounded-pill px-3 py-1 fs-8"
                          onClick={() => navigate('/student/return')}
                        >
                          Return &rarr;
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <i className="bi bi-check-circle-fill text-success fs-1 d-block mb-2"></i>
                      <div className="fw-bold fs-6 text-dark mb-1">No Active Borrowed Books</div>
                      <p className="text-muted fs-7 mb-3">Your full quota of 3 books is available to borrow.</p>
                      <button className="btn btn-primary btn-sm rounded-pill px-4" onClick={() => navigate('/student/borrow')}>
                        Browse Books & Borrow Now &rarr;
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
