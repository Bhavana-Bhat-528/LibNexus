import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export const StudentHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/student-portal/history');
      if (res.success && res.data) {
        setHistory(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch borrowing history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const totalFinesPaid = history.reduce((sum, h) => sum + (h.finePaid || 0), 0);

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold font-outfit text-dark mb-1">My Return & Borrowing History</h3>
          <p className="text-muted fs-7 mb-0">Complete historical archive of your past completed book loans and settled late fees.</p>
        </div>
        <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" onClick={fetchHistory} disabled={loading}>
          <i className="bi bi-arrow-clockwise"></i>
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-danger border-0 rounded-3 mb-4 d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill fs-5"></i>
          <span>{error}</span>
        </div>
      )}

      {/* Summary Banner */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white d-flex flex-row align-items-center justify-content-between">
            <div>
              <span className="text-muted fs-7 text-uppercase fw-semibold">Completed Loans</span>
              <h3 className="fw-bold mb-0 text-dark font-outfit">{history.length} Books</h3>
            </div>
            <div className="p-3 bg-success bg-opacity-10 text-success rounded-circle">
              <i className="bi bi-journal-check fs-3"></i>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white d-flex flex-row align-items-center justify-content-between">
            <div>
              <span className="text-muted fs-7 text-uppercase fw-semibold">Total Fines Settled</span>
              <h3 className="fw-bold mb-0 text-primary font-outfit">₹{totalFinesPaid.toFixed(2)}</h3>
            </div>
            <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-circle">
              <i className="bi bi-receipt fs-3"></i>
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="card border-0 shadow-sm rounded-3">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th className="ps-3">Book Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Issue Date</th>
                  <th>Return Date</th>
                  <th>Status</th>
                  <th className="pe-3 text-end">Fine Paid</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <span className="spinner-border spinner-border-sm me-2 text-primary"></span>
                      Loading return history...
                    </td>
                  </tr>
                ) : history.length > 0 ? (
                  history.map((h) => (
                    <tr key={h.transactionId}>
                      <td className="ps-3 fw-bold text-dark">{h.title}</td>
                      <td className="text-muted">{h.author}</td>
                      <td>
                        <span className="badge bg-light text-dark border">{h.category}</span>
                      </td>
                      <td>{h.issueDate}</td>
                      <td>{h.returnDate}</td>
                      <td>
                        <span className="badge badge-returned rounded-pill px-3 py-1">
                          Returned
                        </span>
                      </td>
                      <td className="pe-3 text-end fw-bold">
                        {h.finePaid > 0 ? <span className="text-danger">₹{h.finePaid.toFixed(2)}</span> : <span className="text-muted">₹0.00</span>}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      No returned borrowing history found.
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
