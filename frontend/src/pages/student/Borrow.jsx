import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export const StudentBorrow = () => {
  const [books, setBooks] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBookIds, setSelectedBookIds] = useState([]);
  const [borrowing, setBorrowing] = useState(false);
  const [confirmModalBook, setConfirmModalBook] = useState(null); // single book or null
  const [showMultiConfirm, setShowMultiConfirm] = useState(false);
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [booksRes, dashRes] = await Promise.all([
        api.get('/books'),
        api.get('/student-portal/dashboard'),
      ]);

      if (booksRes.success && booksRes.data) {
        setBooks(booksRes.data);
      }
      if (dashRes.success && dashRes.data) {
        setStudentInfo(dashRes.data);
      }
    } catch (err) {
      showAlert('danger', err.message || 'Failed to load library catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 6000);
  };

  const remainingQuota = studentInfo?.remainingQuota ?? 3;
  const activeCount = studentInfo?.activeBorrowsCount ?? 0;

  // Categories
  const categories = ['ALL', ...new Set(books.map((b) => b.category).filter(Boolean))];

  // Filter books
  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase()) ||
      book.category?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const isBookAlreadyBorrowed = (bookId) => {
    if (!studentInfo?.activeBorrows) return false;
    return studentInfo.activeBorrows.some((b) => b.bookId === bookId);
  };

  const handleToggleSelect = (bookId) => {
    if (selectedBookIds.includes(bookId)) {
      setSelectedBookIds(selectedBookIds.filter((id) => id !== bookId));
    } else {
      if (selectedBookIds.length >= remainingQuota) {
        showAlert('warning', `You can only borrow up to ${remainingQuota} more book(s) based on your remaining quota.`);
        return;
      }
      setSelectedBookIds([...selectedBookIds, bookId]);
    }
  };

  const executeBorrow = async (bookIdsToBorrow) => {
    setBorrowing(true);
    try {
      const res = await api.post('/student-portal/borrow', { bookIds: bookIdsToBorrow });
      showAlert(
        'success',
        `Successfully borrowed ${bookIdsToBorrow.length} book(s)! Return window: 15 days. Enjoy your reading!`
      );
      setSelectedBookIds([]);
      setConfirmModalBook(null);
      setShowMultiConfirm(false);
      fetchData();
    } catch (err) {
      showAlert('danger', err.message || 'Failed to complete book borrowing');
    } finally {
      setBorrowing(false);
    }
  };

  const handleSingleBorrowClick = (book) => {
    if (remainingQuota <= 0) {
      showAlert('danger', 'Borrow quota full (3 books). Please return a book before borrowing a new one.');
      return;
    }
    if (isBookAlreadyBorrowed(book.id)) {
      showAlert('warning', `You have already borrowed '${book.title}'. Please return your existing copy first.`);
      return;
    }
    if (book.availableCopies <= 0) {
      showAlert('warning', `'${book.title}' is currently out of stock.`);
      return;
    }
    setConfirmModalBook(book);
  };

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold font-outfit text-dark mb-1">
            <i className="bi bi-arrow-up-right-circle-fill text-warning me-2"></i>
            Borrow Books
          </h3>
          <p className="text-muted fs-7 mb-0">
            Browse available college catalog books and issue them directly to your student account.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-outline-secondary btn-sm rounded-2 d-flex align-items-center gap-1 shadow-sm"
            onClick={fetchData}
            disabled={loading}
          >
            <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i>
            <span>Refresh</span>
          </button>
          <button
            className="btn btn-outline-primary btn-sm rounded-2 d-flex align-items-center gap-1 shadow-sm"
            onClick={() => navigate('/student/my-books')}
          >
            <i className="bi bi-journal-bookmark"></i>
            <span>My Borrowed Books</span>
          </button>
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} border-0 rounded-3 mb-4 d-flex align-items-center gap-2 shadow-sm`}>
          <i className={`bi ${alert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} fs-5`}></i>
          <span>{alert.message}</span>
        </div>
      )}

      {/* Quota Status Banner */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white' }}>
        <div className="card-body p-4">
          <div className="row g-4 align-items-center">
            <div className="col-lg-7">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-warning text-dark rounded-circle p-3 d-flex align-items-center justify-content-center shadow" style={{ width: '56px', height: '56px' }}>
                  <i className="bi bi-book fs-3"></i>
                </div>
                <div>
                  <h5 className="fw-bold font-outfit mb-1 text-white">
                    Membership Quota: {remainingQuota > 0 ? `${remainingQuota} Slots Available` : 'Quota Full'}
                  </h5>
                  <p className="text-white-50 fs-7 mb-0">
                    You currently have <strong className="text-warning">{activeCount}</strong> of <strong>3</strong> permitted books borrowed.
                    Loan period is <strong className="text-light">15 days</strong> per checkout.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-lg-5 text-lg-end">
              {remainingQuota > 0 ? (
                selectedBookIds.length > 0 ? (
                  <button
                    className="btn btn-warning fw-bold px-4 py-2 rounded-3 shadow"
                    onClick={() => setShowMultiConfirm(true)}
                  >
                    <i className="bi bi-cart-check me-2"></i>
                    Borrow {selectedBookIds.length} Selected Book(s)
                  </button>
                ) : (
                  <span className="badge bg-white bg-opacity-10 text-white-50 border border-white border-opacity-25 px-3 py-2 fs-7 rounded-pill">
                    Select books below or click "Borrow Now"
                  </span>
                )
              ) : (
                <div className="d-flex flex-column align-items-lg-end gap-2">
                  <span className="badge bg-danger text-white px-3 py-2 rounded-pill">
                    <i className="bi bi-exclamation-triangle-fill me-1"></i> Max 3-Book Limit Reached
                  </span>
                  <button className="btn btn-sm btn-outline-light rounded-pill" onClick={() => navigate('/student/return')}>
                    Go to Return Books &rarr;
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-3">
          <div className="row g-3">
            <div className="col-md-7">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0"
                  placeholder="Search available books by title, author, or subject..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button className="btn btn-light border" onClick={() => setSearch('')}>
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="col-md-5">
              <select
                className="form-select bg-light"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'ALL' ? 'All Subjects / Categories' : c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Books Table / Cards */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
          <h6 className="fw-bold font-outfit mb-0 text-dark">
            <i className="bi bi-journal-check text-primary me-2"></i>
            Available Library Titles ({filteredBooks.length})
          </h6>
          {selectedBookIds.length > 0 && (
            <span className="badge bg-primary text-white px-3 py-1 rounded-pill fs-8">
              {selectedBookIds.length} book(s) selected
            </span>
          )}
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr>
                {remainingQuota > 0 && <th className="ps-4" style={{ width: '40px' }}>Select</th>}
                <th className={remainingQuota > 0 ? '' : 'ps-4'}>Title & Author</th>
                <th>Category</th>
                <th className="text-center">Shelf Availability</th>
                <th className="pe-4 text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">
                    <span className="spinner-border spinner-border-sm me-2 text-primary" role="status"></span>
                    Loading library catalog...
                  </td>
                </tr>
              ) : filteredBooks.length > 0 ? (
                filteredBooks.map((book) => {
                  const alreadyBorrowed = isBookAlreadyBorrowed(book.id);
                  const isAvailable = book.availableCopies > 0;
                  const isChecked = selectedBookIds.includes(book.id);

                  return (
                    <tr key={book.id} className={alreadyBorrowed ? 'bg-light bg-opacity-50' : ''}>
                      {remainingQuota > 0 && (
                        <td className="ps-4">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={isChecked}
                            disabled={!isAvailable || alreadyBorrowed}
                            onChange={() => handleToggleSelect(book.id)}
                          />
                        </td>
                      )}
                      <td className={remainingQuota > 0 ? '' : 'ps-4'}>
                        <div className="fw-bold text-dark">{book.title}</div>
                        <small className="text-muted font-outfit">{book.author}</small>
                        {alreadyBorrowed && (
                          <span className="badge bg-warning bg-opacity-25 text-dark ms-2 fs-8">
                            <i className="bi bi-clock-history me-1"></i> In Your Possession
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-light text-secondary border fs-8">
                          {book.category || 'General'}
                        </span>
                      </td>
                      <td className="text-center">
                        {isAvailable ? (
                          <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-1 rounded-pill">
                            <i className="bi bi-check-circle-fill me-1"></i> {book.availableCopies} available
                          </span>
                        ) : (
                          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-3 py-1 rounded-pill">
                            <i className="bi bi-x-circle-fill me-1"></i> Out of Stock
                          </span>
                        )}
                      </td>
                      <td className="pe-4 text-end">
                        {alreadyBorrowed ? (
                          <button
                            className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 fs-8"
                            onClick={() => navigate('/student/return')}
                          >
                            Return Book &rarr;
                          </button>
                        ) : isAvailable ? (
                          <button
                            className="btn btn-sm btn-primary rounded-pill px-3 py-1 fs-8 shadow-sm"
                            disabled={remainingQuota <= 0}
                            onClick={() => handleSingleBorrowClick(book)}
                          >
                            <i className="bi bi-arrow-up-right me-1"></i> Borrow Now
                          </button>
                        ) : (
                          <button className="btn btn-sm btn-light border text-muted rounded-pill px-3 py-1 fs-8" disabled>
                            Unavailable
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">
                    No books found matching "{search}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal: Single Book */}
      {confirmModalBook && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-primary text-white py-3">
                <h5 className="modal-title fw-bold font-outfit mb-0">
                  <i className="bi bi-book-half me-2"></i> Confirm Book Borrow
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setConfirmModalBook(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="p-3 bg-light rounded-3 mb-3 border">
                  <small className="text-muted d-block fs-8">Selected Book</small>
                  <h5 className="fw-bold text-dark font-outfit mb-1">{confirmModalBook.title}</h5>
                  <p className="text-muted fs-7 mb-0">by {confirmModalBook.author} • {confirmModalBook.category}</p>
                </div>

                <div className="p-3 bg-info bg-opacity-10 border border-info border-opacity-25 rounded-3 mb-3 fs-7">
                  <div className="fw-bold text-dark mb-1"><i className="bi bi-info-circle-fill text-info me-1"></i> Loan Terms</div>
                  <div>• Loan Duration: <strong>15 days</strong> from today</div>
                  <div>• Return Due Date: <strong>{new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}</strong></div>
                  <div>• Late Fee Policy: <strong>₹2.00 / day</strong> after the due date</div>
                </div>

                <p className="text-secondary fs-8 mb-0">
                  By clicking confirm, this book will be issued to your account and one loan slot will be consumed.
                </p>
              </div>
              <div className="modal-footer bg-light py-2 px-4">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirmModalBook(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm px-4"
                  disabled={borrowing}
                  onClick={() => executeBorrow([confirmModalBook.id])}
                >
                  {borrowing ? 'Borrowing...' : 'Confirm & Borrow'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Multi Select */}
      {showMultiConfirm && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-warning text-dark py-3">
                <h5 className="modal-title fw-bold font-outfit mb-0">
                  <i className="bi bi-cart-check me-2"></i> Confirm Multiple Borrow ({selectedBookIds.length} books)
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowMultiConfirm(false)}></button>
              </div>
              <div className="modal-body p-4">
                <p className="text-secondary fs-7 mb-2">You are about to borrow the following titles:</p>
                <ul className="list-group mb-3">
                  {selectedBookIds.map((id) => {
                    const b = books.find((x) => x.id === id);
                    return (
                      <li key={id} className="list-group-item d-flex justify-content-between align-items-center py-2 fs-7">
                        <div>
                          <strong>{b?.title}</strong>
                          <div className="text-muted fs-8">{b?.author}</div>
                        </div>
                        <span className="badge bg-light text-secondary border">{b?.category}</span>
                      </li>
                    );
                  })}
                </ul>

                <div className="p-3 bg-light rounded-3 fs-8 border">
                  <div>• Due date: <strong>{new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}</strong></div>
                  <div>• Overdue penalty: <strong>₹2.00 / day / book</strong></div>
                </div>
              </div>
              <div className="modal-footer bg-light py-2 px-4">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowMultiConfirm(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-warning fw-bold btn-sm px-4"
                  disabled={borrowing}
                  onClick={() => executeBorrow(selectedBookIds)}
                >
                  {borrowing ? 'Processing...' : 'Confirm & Borrow All'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
