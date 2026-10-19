import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export const StudentReturn = () => {
  const [activeBooks, setActiveBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState(null);
  const [returning, setReturning] = useState(false);
  const [alert, setAlert] = useState(null);
  const [returnReceipt, setReturnReceipt] = useState(null);
  const navigate = useNavigate();

  const fetchActiveBooks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/student-portal/my-books');
      if (res.success && res.data) {
        setActiveBooks(res.data);
      }
    } catch (err) {
      showAlert('danger', err.message || 'Failed to load your borrowed books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveBooks();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 6000);
  };

  const overdueBooks = activeBooks.filter((b) => b.isOverdue);
  const totalAccruedFine = activeBooks.reduce((sum, b) => sum + (b.fine || 0), 0);

  const handleOpenConfirm = (tx) => {
    setSelectedTx(tx);
  };

  const handleExecuteReturn = async () => {
    if (!selectedTx) return;
    setReturning(true);
    try {
      const res = await api.post(`/student-portal/return/${selectedTx.transactionId}`);
      setSelectedTx(null);
      setReturnReceipt(res);
      showAlert(
        'success',
        res.fine > 0
          ? `Book returned! Late fine of ₹${res.fine.toFixed(2)} recorded.`
          : 'Book returned successfully with zero penalty fee!'
      );
      fetchActiveBooks();
    } catch (err) {
      showAlert('danger', err.message || 'Failed to process book return');
    } finally {
      setReturning(false);
    }
  };

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold font-outfit text-dark mb-1">
            <i className="bi bi-arrow-down-left-circle-fill text-success me-2"></i>
            Return Books
          </h3>
          <p className="text-muted fs-7 mb-0">
            Review active borrowed books and complete check-in returns with automated penalty calculation.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-outline-secondary btn-sm rounded-2 d-flex align-items-center gap-1 shadow-sm"
            onClick={fetchActiveBooks}
            disabled={loading}
          >
            <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i>
            <span>Refresh</span>
          </button>
          <button
            className="btn btn-outline-primary btn-sm rounded-2 d-flex align-items-center gap-1 shadow-sm"
            onClick={() => navigate('/student/borrow')}
          >
            <i className="bi bi-plus-circle me-1"></i>
            <span>Borrow New Book</span>
          </button>
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} border-0 rounded-3 mb-4 d-flex align-items-center gap-2 shadow-sm`}>
          <i className={`bi ${alert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} fs-5`}></i>
          <span>{alert.message}</span>
        </div>
      )}

      {/* Return Receipt Banner (if just returned) */}
      {returnReceipt && (
        <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden border-start border-success border-4 bg-white">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-start">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-success text-white rounded-circle p-3 d-flex align-items-center justify-content-center shadow-sm" style={{ width: '50px', height: '50px' }}>
                  <i className="bi bi-check2-circle fs-3"></i>
                </div>
                <div>
                  <h6 className="fw-bold text-success font-outfit mb-1">Return Receipt #{returnReceipt.transactionId}</h6>
                  <h5 className="fw-bold text-dark font-outfit mb-0">{returnReceipt.book}</h5>
                  <p className="text-muted fs-8 mb-0 mt-1">
                    Borrowed on {returnReceipt.issueDate} • Returned on {returnReceipt.returnDate} ({returnReceipt.daysBorrowed} days held)
                  </p>
                </div>
              </div>
              <div className="text-end">
                <div className="fs-8 text-muted">Late Return Fee</div>
                <div className={`fs-5 fw-bold font-outfit ${returnReceipt.fine > 0 ? 'text-danger' : 'text-success'}`}>
                  ₹{(returnReceipt.fine || 0).toFixed(2)}
                </div>
                <button className="btn btn-sm btn-link text-muted p-0 fs-8 mt-1" onClick={() => setReturnReceipt(null)}>
                  Dismiss receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <small className="text-muted d-block fs-8 fw-semibold text-uppercase">Active Borrowed Books</small>
                <h3 className="fw-bold font-outfit text-dark mb-0">{activeBooks.length} / 3</h3>
              </div>
              <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                <i className="bi bi-book-half fs-5"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <small className="text-muted d-block fs-8 fw-semibold text-uppercase">Overdue Books</small>
                <h3 className={`fw-bold font-outfit mb-0 ${overdueBooks.length > 0 ? 'text-danger' : 'text-success'}`}>
                  {overdueBooks.length}
                </h3>
              </div>
              <div className={`rounded-circle p-2 d-flex align-items-center justify-content-center ${overdueBooks.length > 0 ? 'bg-danger bg-opacity-10 text-danger' : 'bg-success bg-opacity-10 text-success'}`} style={{ width: '42px', height: '42px' }}>
                <i className={`bi ${overdueBooks.length > 0 ? 'bi-exclamation-triangle-fill' : 'bi-shield-check'} fs-5`}></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <small className="text-muted d-block fs-8 fw-semibold text-uppercase">Accrued Late Penalty</small>
                <h3 className={`fw-bold font-outfit mb-0 ${totalAccruedFine > 0 ? 'text-danger' : 'text-success'}`}>
                  ₹{totalAccruedFine.toFixed(2)}
                </h3>
              </div>
              <div className="bg-warning bg-opacity-10 text-warning rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                <i className="bi bi-cash-coin fs-5"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Borrowed Books List */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
          <h6 className="fw-bold font-outfit mb-0 text-dark">
            <i className="bi bi-journal-arrow-down text-success me-2"></i>
            Active Checkouts Pending Return ({activeBooks.length})
          </h6>
          <span className="text-muted fs-8">15-day return window • Late fee: ₹2.00/day</span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="ps-4">Book Title & Details</th>
                <th>Category</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th className="text-center">Loan Status</th>
                <th className="text-end">Late Penalty</th>
                <th className="pe-4 text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <span className="spinner-border spinner-border-sm me-2 text-primary" role="status"></span>
                    Loading borrowed books...
                  </td>
                </tr>
              ) : activeBooks.length > 0 ? (
                activeBooks.map((item) => (
                  <tr key={item.transactionId} className={item.isOverdue ? 'table-danger table-opacity-10' : ''}>
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
                    <td className={`fs-8 fw-semibold ${item.isOverdue ? 'text-danger' : 'text-dark'}`}>
                      {item.dueDate}
                    </td>
                    <td className="text-center">
                      {item.isOverdue ? (
                        <span className="badge bg-danger text-white px-2 py-1 fs-8">
                          <i className="bi bi-exclamation-circle-fill me-1"></i> Overdue (+{item.daysOverdue} days)
                        </span>
                      ) : (
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 fs-8">
                          <i className="bi bi-clock me-1"></i> Normal ({15 - item.daysElapsed} days left)
                        </span>
                      )}
                    </td>
                    <td className="text-end font-outfit fw-bold">
                      {item.fine > 0 ? (
                        <span className="text-danger">₹{item.fine.toFixed(2)}</span>
                      ) : (
                        <span className="text-success">₹0.00</span>
                      )}
                    </td>
                    <td className="pe-4 text-end">
                      <button
                        className={`btn btn-sm rounded-pill px-3 py-1 fs-8 shadow-sm ${item.isOverdue ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => handleOpenConfirm(item)}
                      >
                        <i className="bi bi-arrow-down-left me-1"></i> Return Book
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <div className="p-4">
                      <i className="bi bi-check-circle-fill fs-1 text-success d-block mb-2"></i>
                      <h5 className="fw-bold font-outfit text-dark mb-1">No Books Currently Borrowed</h5>
                      <p className="text-muted fs-7 mb-3">You have zero active borrowed books. All books have been returned!</p>
                      <button className="btn btn-primary btn-sm rounded-pill px-4" onClick={() => navigate('/student/borrow')}>
                        Browse Catalog & Borrow Books &rarr;
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Confirmation Modal */}
      {selectedTx && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-success text-white py-3">
                <h5 className="modal-title fw-bold font-outfit mb-0">
                  <i className="bi bi-arrow-down-left-circle me-2"></i> Confirm Book Return
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedTx(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="p-3 bg-light rounded-3 mb-3 border">
                  <small className="text-muted d-block fs-8">Returning Book</small>
                  <h5 className="fw-bold text-dark font-outfit mb-1">{selectedTx.title}</h5>
                  <p className="text-muted fs-8 mb-0">by {selectedTx.author} • {selectedTx.category}</p>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <div className="p-2 bg-light rounded-2 text-center fs-8">
                      <span className="text-muted d-block">Issue Date</span>
                      <strong>{selectedTx.issueDate}</strong>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-2 bg-light rounded-2 text-center fs-8">
                      <span className="text-muted d-block">Return Date (Today)</span>
                      <strong>{new Date().toISOString().split('T')[0]}</strong>
                    </div>
                  </div>
                </div>

                {selectedTx.isOverdue ? (
                  <div className="alert alert-danger border-0 rounded-3 mb-3 p-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong className="d-block"><i className="bi bi-exclamation-triangle-fill me-1"></i> Overdue Return Penalty</strong>
                        <small className="text-muted">+{selectedTx.daysOverdue} days late × ₹2.00 / day</small>
                      </div>
                      <div className="fs-4 fw-bold text-danger font-outfit">
                        ₹{selectedTx.fine.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-success border-0 rounded-3 mb-3 p-3 d-flex align-items-center gap-2">
                    <i className="bi bi-check-circle-fill fs-5"></i>
                    <div>
                      <strong>On-Time Return!</strong>
                      <div className="fs-8">Returned within the 15-day window. Penalty fee: ₹0.00.</div>
                    </div>
                  </div>
                )}

                <p className="text-secondary fs-8 mb-0">
                  Upon confirmation, the book copy will be returned to library inventory and your quota slot will be freed.
                </p>
              </div>
              <div className="modal-footer bg-light py-2 px-4">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedTx(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success btn-sm px-4"
                  disabled={returning}
                  onClick={handleExecuteReturn}
                >
                  {returning ? 'Processing Return...' : 'Confirm Return'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
