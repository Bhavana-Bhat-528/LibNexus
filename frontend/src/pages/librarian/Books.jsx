import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { StockBadge } from '../../components/StockBadge';

export const LibrarianBooks = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [formData, setFormData] = useState({
    id: null,
    title: '',
    author: '',
    category: '',
    totalCopies: 5,
    availableCopies: 5,
  });

  // Availability modal
  const [availabilityBook, setAvailabilityBook] = useState(null);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/books');
      if (res.success && res.data) {
        setBooks(res.data);
      }
    } catch (err) {
      showAlert('danger', err.message || 'Failed to load books catalog');
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
    setTimeout(() => setAlert(null), 4000);
  };

  const handleOpenAddModal = () => {
    setFormData({
      id: null,
      title: '',
      author: '',
      category: '',
      totalCopies: 5,
      availableCopies: 5,
    });
    setModalMode('add');
    setShowModal(true);
  };

  const handleOpenEditModal = (book) => {
    setFormData({
      id: book.id,
      title: book.title,
      author: book.author,
      category: book.category,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
    });
    setModalMode('edit');
    setShowModal(true);
  };

  const handleSaveBook = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        const res = await api.post('/books', formData);
        showAlert('success', `Book '${res.data.title}' added successfully!`);
      } else {
        const res = await api.put(`/books/${formData.id}`, formData);
        showAlert('success', `Book '${res.data.title}' updated successfully!`);
      }
      setShowModal(false);
      fetchBooks();
      fetchCategories();
    } catch (err) {
      showAlert('danger', err.message);
    }
  };

  const handleDeleteBook = async (book) => {
    if (!window.confirm(`Are you sure you want to delete '${book.title}' from catalog?`)) return;
    try {
      await api.delete(`/books/${book.id}`);
      showAlert('success', `Book '${book.title}' deleted successfully`);
      fetchBooks();
    } catch (err) {
      showAlert('danger', err.message);
    }
  };

  const handleCheckAvailability = async (id) => {
    try {
      const res = await api.get(`/books/${id}/availability`);
      if (res.success) {
        setAvailabilityBook(res.data);
      }
    } catch (err) {
      showAlert('danger', err.message);
    }
  };

  // Filter books
  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(search.toLowerCase().trim()) ||
      book.author.toLowerCase().includes(search.toLowerCase().trim());
    const matchesCategory =
      selectedCategory === 'ALL' ||
      book.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold font-outfit text-dark mb-1">Books Catalog Management</h3>
          <p className="text-muted fs-7 mb-0">Browse titles, adjust stock allocations, check copy availability, and manage catalog records.</p>
        </div>
        <button className="btn btn-primary rounded-2 px-3 d-flex align-items-center gap-2" onClick={handleOpenAddModal}>
          <i className="bi bi-plus-circle"></i>
          <span>Add New Book</span>
        </button>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} border-0 rounded-3 mb-4 shadow-sm d-flex align-items-center gap-2`} role="alert">
          <i className={`bi ${alert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} fs-5`}></i>
          <span>{alert.message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-body p-3">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white"><i className="bi bi-search text-muted"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by book title or author..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
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
                <i className="bi bi-arrow-counterclockwise me-1"></i> Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Books Table */}
      <div className="card border-0 shadow-sm rounded-3">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th className="ps-3">ID</th>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Total Copies</th>
                  <th>Available</th>
                  <th>Stock Status</th>
                  <th className="pe-3 text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5 text-muted">
                      <span className="spinner-border spinner-border-sm me-2 text-primary"></span>
                      Loading books catalog...
                    </td>
                  </tr>
                ) : filteredBooks.length > 0 ? (
                  filteredBooks.map((book) => (
                    <tr key={book.id}>
                      <td className="ps-3 text-secondary fw-semibold">#{book.id}</td>
                      <td>
                        <div className="fw-bold text-dark">{book.title}</div>
                      </td>
                      <td className="text-muted">{book.author}</td>
                      <td>
                        <span className="badge bg-light text-dark border">{book.category}</span>
                      </td>
                      <td>{book.totalCopies}</td>
                      <td className="fw-bold text-primary">{book.availableCopies}</td>
                      <td>
                        <StockBadge availableCopies={book.availableCopies} />
                      </td>
                      <td className="pe-3 text-end">
                        <button
                          className="btn btn-sm btn-outline-info me-1"
                          title="Quick Availability"
                          onClick={() => handleCheckAvailability(book.id)}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          title="Edit Book"
                          onClick={() => handleOpenEditModal(book)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          title="Delete Book"
                          onClick={() => handleDeleteBook(book)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-5 text-muted">
                      No matching books found in catalog.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title font-outfit fw-bold">
                  {modalMode === 'add' ? 'Add New Catalog Book' : 'Edit Book Information'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSaveBook}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Book Title <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Clean Code"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Author <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Robert C. Martin"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Category <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Software Engineering"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    />
                  </div>
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold">Total Stock <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        value={formData.totalCopies}
                        onChange={(e) => setFormData({ ...formData, totalCopies: parseInt(e.target.value) || 0 })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold">Available Copies</label>
                      <input
                        type="number"
                        className="form-control"
                        min="0"
                        max={formData.totalCopies}
                        value={formData.availableCopies}
                        onChange={(e) => setFormData({ ...formData, availableCopies: parseInt(e.target.value) || 0 })}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light px-4 py-3">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4">
                    <i className="bi bi-save me-1"></i> Save Book
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Availability Modal */}
      {availabilityBook && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title font-outfit fw-bold">Book Stock Status</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setAvailabilityBook(null)}></button>
              </div>
              <div className="modal-body p-4 text-center">
                <div className="p-3 bg-light rounded-circle d-inline-flex mb-3">
                  <i className="bi bi-book fs-1 text-primary"></i>
                </div>
                <h5 className="fw-bold mb-1">{availabilityBook.title}</h5>
                <p className="text-muted fs-7 mb-3">By {availabilityBook.author} • {availabilityBook.category}</p>

                <div className="d-flex justify-content-center gap-3 my-3">
                  <div className="p-3 bg-light rounded-3 text-center" style={{ minWidth: '120px' }}>
                    <small className="text-muted d-block">Total Inventory</small>
                    <h3 className="fw-bold mb-0 text-dark">{availabilityBook.totalCopies}</h3>
                  </div>
                  <div className="p-3 bg-light rounded-3 text-center" style={{ minWidth: '120px' }}>
                    <small className="text-muted d-block">Available On Shelf</small>
                    <h3 className="fw-bold mb-0 text-primary">{availabilityBook.availableCopies}</h3>
                  </div>
                </div>

                <div className="mt-3">
                  <StockBadge availableCopies={availabilityBook.availableCopies} />
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary w-100" onClick={() => setAvailabilityBook(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
