import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { StockBadge } from '../../components/StockBadge';

export const StudentBooks = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [borrowing, setBorrowing] = useState(false);
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/books');
      if (res.success && res.data) {
        setBooks(res.data);
      }
    } catch (err) {
      console.error('Failed to load books', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/books/categories');
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchCategories();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleQuickBorrow = async (book) => {
    setBorrowing(true);
    try {
      await api.post('/student-portal/borrow', { bookIds: [book.id] });
      showAlert('success', `Successfully borrowed '${book.title}'! Due in 15 days.`);
      setSelectedBook(null);
      fetchBooks();
    } catch (err) {
      showAlert('danger', err.message || 'Failed to borrow book. Check quota limit.');
    } finally {
      setBorrowing(false);
    }
  };

  const filteredBooks = books.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(search.toLowerCase().trim()) ||
      b.author.toLowerCase().includes(search.toLowerCase().trim());
    const matchesCategory =
      selectedCategory === 'ALL' || b.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fade-in">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold font-outfit text-dark mb-1">
            <i className="bi bi-book-half text-primary me-2"></i>
            Library Book Catalog
          </h3>
          <p className="text-muted fs-7 mb-0">Browse through available catalog titles, check shelf availability, and borrow directly.</p>
        </div>
        <button className="btn btn-primary btn-sm rounded-pill px-3 shadow-sm" onClick={() => navigate('/student/borrow')}>
          <i className="bi bi-arrow-up-right me-1"></i> Dedicated Borrow Page
        </button>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} border-0 rounded-3 mb-4 d-flex align-items-center gap-2 shadow-sm`}>
          <i className={`bi ${alert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} fs-5`}></i>
          <span>{alert.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-3">
          <div className="row g-3">
            <div className="col-md-7">
              <div className="input-group">
                <span className="input-group-text bg-white"><i className="bi bi-search text-muted"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search book title or author..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => { setSearch(''); setSelectedCategory('ALL'); }}
              >
                Reset Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Books Table */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4">Book Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Available Copies</th>
                  <th>Status</th>
                  <th className="pe-4 text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      <span className="spinner-border spinner-border-sm me-2 text-primary"></span>
                      Loading library catalog...
                    </td>
                  </tr>
                ) : filteredBooks.length > 0 ? (
                  filteredBooks.map((b) => (
                    <tr key={b.id}>
                      <td className="ps-4 fw-bold text-dark">{b.title}</td>
                      <td className="text-muted">{b.author}</td>
                      <td>
                        <span className="badge bg-light text-dark border">{b.category}</span>
                      </td>
                      <td className="fw-bold text-primary font-outfit">{b.availableCopies} of {b.totalCopies}</td>
                      <td>
                        <StockBadge availableCopies={b.availableCopies} />
                      </td>
                      <td className="pe-4 text-end">
                        <div className="d-inline-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 fs-8"
                            onClick={() => setSelectedBook(b)}
                          >
                            Details
                          </button>
                          {b.availableCopies > 0 ? (
                            <button
                              className="btn btn-sm btn-primary rounded-pill px-3 py-1 fs-8 shadow-sm"
                              onClick={() => handleQuickBorrow(b)}
                              disabled={borrowing}
                            >
                              <i className="bi bi-arrow-up-right me-1"></i> Borrow
                            </button>
                          ) : (
                            <button className="btn btn-sm btn-light border text-muted rounded-pill px-3 py-1 fs-8" disabled>
                              Out of Stock
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      No books found matching search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Book Details Modal */}
      {selectedBook && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title font-outfit fw-bold mb-0">Book Details</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedBook(null)}></button>
              </div>
              <div className="modal-body p-4 text-center">
                <div className="p-3 bg-light rounded-circle d-inline-flex mb-3">
                  <i className="bi bi-book-half fs-1 text-primary"></i>
                </div>
                <h4 className="fw-bold font-outfit mb-1 text-dark">{selectedBook.title}</h4>
                <p className="text-muted fs-7 mb-3">Written by <strong>{selectedBook.author}</strong></p>

                <div className="badge bg-light text-dark border px-3 py-2 fs-7 mb-4">
                  Category: {selectedBook.category}
                </div>

                <div className="row g-2 justify-content-center mb-3">
                  <div className="col-6">
                    <div className="p-3 bg-light rounded-3 text-center">
                      <small className="text-muted d-block fs-8">Total Copies</small>
                      <h4 className="fw-bold mb-0 text-dark font-outfit">{selectedBook.totalCopies}</h4>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 bg-light rounded-3 text-center">
                      <small className="text-muted d-block fs-8">Available On Shelf</small>
                      <h4 className="fw-bold mb-0 text-success font-outfit">{selectedBook.availableCopies}</h4>
                    </div>
                  </div>
                </div>

                <div className="mt-2">
                  <StockBadge availableCopies={selectedBook.availableCopies} />
                </div>
              </div>
              <div className="modal-footer bg-light py-2 px-4 d-flex justify-content-between">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedBook(null)}>
                  Close
                </button>
                {selectedBook.availableCopies > 0 && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm px-4"
                    disabled={borrowing}
                    onClick={() => handleQuickBorrow(selectedBook)}
                  >
                    {borrowing ? 'Borrowing...' : 'Borrow This Book Now'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
