import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export const StudentMyBooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [returningId, setReturningId] = useState(null);
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();

  const fetchMyBooks = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/student-portal/my-books');
      if (res.success && res.data) {
        setBooks(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch borrowed books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBooks();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleReturnBook = async (book) => {
    if (!window.confirm(`Are you sure you want to return '${book.title}'?${book.fine > 0 ? ` Outstanding fine of ₹${book.fine.toFixed(2)} will be recorded.` : ''}`)) return;
    setReturningId(book.transactionId);
    try {
      const res = await api.post(`/student-portal/return/${book.transactionId}`);
      showAlert(
        'success',
        res.fine > 0
          ? `Returned '${book.title}'! Late fine of ₹${res.fine.toFixed(2)} recorded.`
          : `Returned '${book.title}' successfully with ₹0.00 fine!`
      );
      fetchMyBooks();
    } catch (err) {
      showAlert('danger', err.message || 'Failed to return book');
    } finally {
      setReturningId(null);
    }
  };

  return (
    <div className="fade-in">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold font-outfit text-dark mb-1">
            <i className="bi bi-journal-bookmark-fill text-warning me-2"></i>
            My Currently Borrowed Books
          </h3>
          <p className="text-muted fs-7 mb-0">Track your active library loans, return due dates, and monitor overdue fines.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-outline-secondary btn-sm rounded-2 d-flex align-items-center gap-1 shadow-sm" onClick={fetchMyBooks} disabled={loading}>
            <i className="bi bi-arrow-clockwise"></i>
            <span>Refresh</span>
          </button>
          <button className="btn btn-outline-primary btn-sm rounded-2 d-flex align-items-center gap-1 shadow-sm" onClick={() => navigate('/student/borrow')}>
            <i className="bi bi-plus-circle me-1"></i>
            <span>Borrow More</span>
          </button>
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} border-0 rounded-3 mb-4 d-flex align-items-center gap-2 shadow-sm`}>
          <i className={`bi ${alert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} fs-5`}></i>
          <span>{alert.message}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger border-0 rounded-3 mb-4 d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill fs-5"></i>
          <span>{error}</span>
        </div>
      )}

      {/* Information Banner */}
      <div className="alert alert-info border-0 rounded-4 shadow-sm mb-4 d-flex align-items-center gap-3">
        <div className="p-2 bg-info bg-opacity-20 text-info rounded-circle fs-4">
          <i className="bi bi-clock-history"></i>
        </div>
        <div>
          <div className="fw-bold text-dark">Loan Period & Late Fine Policy</div>
          <small className="text-secondary">
            Standard loan period is <strong>15 days</strong>. Returns after 15 days incur an automated fine of <strong>₹2.00 per day</strong> until returned.
          </small>
        </div>
      </div>

      {/* Borrowed Books Grid */}
      {loading ? (
        <div className="text-center py-5 text-muted">
          <span className="spinner-border text-primary mb-2"></span>
          <div>Loading your borrowed books...</div>
        </div>
      ) : books.length > 0 ? (
        <div className="row g-4">
          {books.map((b) => (
            <div className="col-lg-6" key={b.transactionId}>
              <div className={`card h-100 rounded-4 shadow-sm border ${b.isOverdue ? 'border-danger' : 'border-primary border-opacity-25'} overflow-hidden`}>
                <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                  <span className="badge bg-light text-dark border fs-8">{b.category}</span>
                  <span className={`badge ${b.isOverdue ? 'bg-danger' : 'bg-primary'} rounded-pill px-3 py-1`}>
                    {b.isOverdue ? `Overdue by ${b.daysOverdue} Days` : 'Active Loan'}
                  </span>
                </div>
                <div className="card-body p-4 d-flex flex-column justify-content-between">
                  <div>
                    <h5 className="fw-bold text-dark font-outfit mb-1">{b.title}</h5>
                    <p className="text-muted fs-7 mb-3">By {b.author}</p>

                    <div className="bg-light p-3 rounded-3 mb-3">
                      <div className="d-flex justify-content-between mb-2 fs-7">
                        <span className="text-muted"><i className="bi bi-calendar-check me-1"></i> Issue Date:</span>
                        <strong className="text-dark">{b.issueDate}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2 fs-7">
                        <span className="text-muted"><i className="bi bi-calendar-event me-1"></i> Due Date (15 Days):</span>
                        <strong className={b.isOverdue ? 'text-danger' : 'text-primary'}>{b.dueDate}</strong>
                      </div>
                      <div className="d-flex justify-content-between fs-7">
                        <span className="text-muted"><i className="bi bi-hourglass-split me-1"></i> Total Elapsed:</span>
                        <strong className={b.isOverdue ? 'text-danger' : 'text-success'}>{b.daysElapsed} Days</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-top d-flex justify-content-between align-items-center">
                    <div>
                      <span className="text-muted fs-8 d-block">Late Fee Accrued</span>
                      <h4 className={`fw-bold mb-0 font-outfit ${b.fine > 0 ? 'text-danger' : 'text-success'}`}>
                        ₹{b.fine.toFixed(2)}
                      </h4>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <button
                        className={`btn btn-sm rounded-pill px-3 py-1 shadow-sm ${b.isOverdue ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => handleReturnBook(b)}
                        disabled={returningId === b.transactionId}
                      >
                        {returningId === b.transactionId ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                            Returning...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-arrow-down-left me-1"></i> Return Book
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
          <div className="p-4 bg-success bg-opacity-10 text-success rounded-circle d-inline-flex mb-3 mx-auto">
            <i className="bi bi-journal-check fs-1"></i>
          </div>
          <h4 className="fw-bold font-outfit text-dark mb-1">No Active Loans</h4>
          <p className="text-muted fs-7 mb-3">
            You currently have no borrowed books from the library. Your borrowing quota of 3 books is completely open.
          </p>
          <div>
            <button className="btn btn-primary btn-sm rounded-pill px-4 shadow-sm" onClick={() => navigate('/student/borrow')}>
              <i className="bi bi-search me-1"></i> Browse & Borrow Books Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
