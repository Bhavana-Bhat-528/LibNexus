import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export const LibrarianStudents = () => {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [formData, setFormData] = useState({ id: null, name: '', usn: '', contact: '' });

  // Student history modal
  const [historyStudent, setHistoryStudent] = useState(null);
  const [studentTransactions, setStudentTransactions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/students');
      if (res.success && res.data) {
        setStudents(res.data);
      }
    } catch (err) {
      showAlert('danger', err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleOpenAddModal = () => {
    setFormData({ id: null, name: '', usn: '', contact: '' });
    setModalMode('add');
    setShowModal(true);
  };

  const handleOpenEditModal = (student) => {
    setFormData({ id: student.id, name: student.name, usn: student.usn, contact: student.contact });
    setModalMode('edit');
    setShowModal(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        const res = await api.post('/students', formData);
        showAlert('success', `Student '${res.data.name}' registered successfully!`);
      } else {
        const res = await api.put(`/students/${formData.id}`, formData);
        showAlert('success', `Student '${res.data.name}' updated successfully!`);
      }
      setShowModal(false);
      fetchStudents();
    } catch (err) {
      showAlert('danger', err.message);
    }
  };

  const handleDeleteStudent = async (student) => {
    if (!window.confirm(`Are you sure you want to delete student '${student.name}' (${student.usn})?`)) return;
    try {
      await api.delete(`/students/${student.id}`);
      showAlert('success', `Student '${student.name}' deleted successfully`);
      fetchStudents();
    } catch (err) {
      showAlert('danger', err.message);
    }
  };

  const handleViewHistory = async (student) => {
    setHistoryStudent(student);
    setHistoryLoading(true);
    try {
      const res = await api.get(`/transactions/student/${student.usn}`);
      if (res.success && res.data) {
        setStudentTransactions(res.data);
      }
    } catch (err) {
      showAlert('danger', err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase().trim()) ||
      s.usn.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold font-outfit text-dark mb-1">Students Directory</h3>
          <p className="text-muted fs-7 mb-0">Register students, manage member profiles by USN, and audit individual borrowing quotas.</p>
        </div>
        <button className="btn btn-primary rounded-2 px-3 d-flex align-items-center gap-2" onClick={handleOpenAddModal}>
          <i className="bi bi-person-plus-fill"></i>
          <span>Add New Student</span>
        </button>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} border-0 rounded-3 mb-4 shadow-sm d-flex align-items-center gap-2`} role="alert">
          <i className={`bi ${alert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} fs-5`}></i>
          <span>{alert.message}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-body p-3">
          <div className="row g-3">
            <div className="col-md-9">
              <div className="input-group">
                <span className="input-group-text bg-white"><i className="bi bi-search text-muted"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search student by full name or USN..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <button className="btn btn-outline-secondary w-100" onClick={() => setSearch('')}>
                <i className="bi bi-arrow-counterclockwise me-1"></i> Clear Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="card border-0 shadow-sm rounded-3">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th className="ps-3">ID</th>
                  <th>Student Name</th>
                  <th>USN</th>
                  <th>Contact Info</th>
                  <th>Active Borrows</th>
                  <th>Remaining Quota</th>
                  <th className="pe-3 text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <span className="spinner-border spinner-border-sm me-2 text-primary"></span>
                      Loading students directory...
                    </td>
                  </tr>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((s) => (
                    <tr key={s.id}>
                      <td className="ps-3 text-secondary fw-semibold">#{s.id}</td>
                      <td>
                        <div className="fw-bold text-dark">{s.name}</div>
                      </td>
                      <td>
                        <span className="badge bg-dark-subtle text-dark border font-outfit px-2 py-1">{s.usn}</span>
                      </td>
                      <td className="text-muted"><i className="bi bi-telephone me-1"></i>{s.contact}</td>
                      <td>
                        <span className={`badge rounded-pill px-3 py-1 ${s.activeBooksCount >= 3 ? 'bg-danger' : s.activeBooksCount > 0 ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                          {s.activeBooksCount} / 3 Active
                        </span>
                      </td>
                      <td>
                        <span className="text-success fw-bold">{s.remainingBorrowLimit} Slots Available</span>
                      </td>
                      <td className="pe-3 text-end">
                        <button
                          className="btn btn-sm btn-outline-info me-1"
                          title="Borrowing History"
                          onClick={() => handleViewHistory(s)}
                        >
                          <i className="bi bi-journal-text"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          title="Edit Student"
                          onClick={() => handleOpenEditModal(s)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          title="Delete Student"
                          onClick={() => handleDeleteStudent(s)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      No matching student records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title font-outfit fw-bold">
                  {modalMode === 'add' ? 'Register New Student' : 'Edit Student Details'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSaveStudent}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Student Full Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">USN (University Seat Number) <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control text-uppercase font-outfit"
                      placeholder="e.g. 1MS21CS001"
                      value={formData.usn}
                      onChange={(e) => setFormData({ ...formData, usn: e.target.value.toUpperCase() })}
                      required
                    />
                    <small className="text-muted">USN must be uniquely registered.</small>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Contact Phone / Email <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. +91 9876543210"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light px-4 py-3">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4">
                    <i className="bi bi-save me-1"></i> Save Student
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Student Loan History Modal */}
      {historyStudent && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title font-outfit fw-bold">
                  Borrowing History: {historyStudent.name} ({historyStudent.usn})
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setHistoryStudent(null)}></button>
              </div>
              <div className="modal-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="ps-3">Book Title</th>
                        <th>Issue Date</th>
                        <th>Return Date</th>
                        <th>Status</th>
                        <th className="pe-3 text-end">Fine</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyLoading ? (
                        <tr>
                          <td colSpan="5" className="text-center py-4 text-muted">
                            <span className="spinner-border spinner-border-sm me-2 text-primary"></span>
                            Loading history...
                          </td>
                        </tr>
                      ) : studentTransactions.length > 0 ? (
                        studentTransactions.map((tx) => (
                          <tr key={tx.id}>
                            <td className="ps-3 fw-bold text-dark">{tx.book.title}</td>
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
                          <td colSpan="5" className="text-center py-4 text-muted">No circulation records found for this student.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary" onClick={() => setHistoryStudent(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
