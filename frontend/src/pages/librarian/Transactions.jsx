import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export const LibrarianTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [usnFilter, setUsnFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (usnFilter.trim()) params.usn = usnFilter.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchFilter.trim()) params.search = searchFilter.trim();

      const res = await api.get('/transactions', { params });
      if (res.success && res.data) {
        setTransactions(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch transaction logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter]);

  const handleResetFilters = () => {
    setUsnFilter('');
    setStatusFilter('ALL');
    setSearchFilter('');
    // Trigger fetch without filters
    setLoading(true);
    api.get('/transactions')
      .then((res) => { if (res.success && res.data) setTransactions(res.data); })
      .finally(() => setLoading(false));
  };

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold font-outfit text-dark mb-1">Circulation Transactions Audit Log</h3>
          <p className="text-muted fs-7 mb-0">System-wide historical logs of all book borrowing, returns, overdue records, and collected fines.</p>
        </div>
        <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" onClick={fetchTransactions} disabled={loading}>
          <i className="bi bi-arrow-clockwise"></i>
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-danger border-0 rounded-3 mb-4 d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-octagon-fill fs-5"></i>
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-body p-3">
          <div className="row g-3">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control font-outfit"
                placeholder="Filter by Student USN..."
                value={usnFilter}
                onChange={(e) => setUsnFilter(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') fetchTransactions(); }}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="BORROWED">Currently Borrowed</option>
                <option value="RETURNED">Returned</option>
              </select>
            </div>
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Search book or student..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') fetchTransactions(); }}
              />
            </div>
            <div className="col-md-2 d-flex gap-2">
              <button className="btn btn-primary w-50" onClick={fetchTransactions}>
                Filter
              </button>
              <button className="btn btn-outline-secondary w-50" onClick={handleResetFilters}>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card border-0 shadow-sm rounded-3">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th className="ps-3">Tx ID</th>
                  <th>Student Name</th>
                  <th>USN</th>
                  <th>Book Title</th>
                  <th>Issue Date</th>
                  <th>Return Date</th>
                  <th>Status</th>
                  <th className="pe-3 text-end">Fine Paid</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5 text-muted">
                      <span className="spinner-border spinner-border-sm me-2 text-primary"></span>
                      Loading transaction records...
                    </td>
                  </tr>
                ) : transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="ps-3 fw-bold text-secondary font-outfit">#TX-{tx.id}</td>
                      <td>
                        <div className="fw-bold text-dark">{tx.student.name}</div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border font-outfit">{tx.student.usn}</span>
                      </td>
                      <td className="fw-semibold text-primary">{tx.book.title}</td>
                      <td>{tx.issueDate}</td>
                      <td>{tx.returnDate || <span className="text-warning fw-semibold">Pending</span>}</td>
                      <td>
                        <span className={`badge rounded-pill px-3 py-1 ${tx.status === 'RETURNED' ? 'badge-returned' : 'badge-borrowed'}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="pe-3 text-end fw-bold">
                        {tx.fine > 0 ? <span className="text-danger">₹{tx.fine.toFixed(2)}</span> : <span className="text-muted">₹0.00</span>}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-5 text-muted">
                      No transaction records found matching filter criteria.
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
