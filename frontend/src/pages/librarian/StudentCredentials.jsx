import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export const LibrarianStudentCredentials = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alert, setAlert] = useState(null);
  const [search, setSearch] = useState('');

  // Password reset modal state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/students');
      if (res.success && res.data) {
        setStudents(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load students directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleOpenResetModal = (student) => {
    setSelectedStudent(student);
    setNewPassword('');
    setShowPassword(false);
  };

  const handleGenerateRandomPassword = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setNewPassword(`Student@${randomNum}`);
    setShowPassword(true);
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      showAlert('danger', 'Password cannot be empty.');
      return;
    }
    if (newPassword.trim().length < 4) {
      showAlert('danger', 'Password must be at least 4 characters long.');
      return;
    }

    setResetting(true);
    try {
      await api.put(`/students/${selectedStudent.id}/credentials`, {
        password: newPassword.trim(),
      });
      showAlert(
        'success',
        `Password updated successfully for student '${selectedStudent.name}' (${selectedStudent.usn})! New password: '${newPassword.trim()}'`
      );
      setSelectedStudent(null);
      setNewPassword('');
      fetchStudents();
    } catch (err) {
      showAlert('danger', err.message || 'Failed to update student credentials');
    } finally {
      setResetting(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.usn && s.usn.toLowerCase().includes(q)) ||
      (s.username && s.username.toLowerCase().includes(q)) ||
      (s.contact && s.contact.toLowerCase().includes(q))
    );
  });

  return (
    <div className="container-fluid px-0">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold font-outfit mb-1 text-dark d-flex align-items-center gap-2">
            <span className="bg-info text-white p-2 rounded-3 fs-5 d-inline-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
              <i className="bi bi-key-fill"></i>
            </span>
            Student Credentials & Passwords
          </h2>
          <p className="text-muted mb-0">
            View student accounts, assigned usernames, and reset passwords as requested by students.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-primary rounded-pill px-3 py-2 d-flex align-items-center gap-2"
            onClick={() => navigate('/librarian/register-student')}
          >
            <i className="bi bi-person-plus-fill"></i> Register New Student
          </button>
          <button
            className="btn btn-outline-secondary rounded-pill px-3 py-2"
            onClick={fetchStudents}
            title="Refresh directory"
          >
            <i className="bi bi-arrow-clockwise"></i>
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

      {/* Directory Card */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        {/* Card Header & Search */}
        <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div className="d-flex align-items-center gap-2">
            <h5 className="fw-bold font-outfit mb-0 text-dark">
              <i className="bi bi-people-fill text-primary me-2"></i>
              Registered Students Directory
            </h5>
            <span className="badge bg-secondary rounded-pill">{filteredStudents.length} Students</span>
          </div>

          <div style={{ minWidth: '280px' }}>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by name, USN, or username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="btn btn-outline-secondary border-start-0" onClick={() => setSearch('')}>
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4">Student Details</th>
                  <th>University USN</th>
                  <th>Contact Info</th>
                  <th>Login Username</th>
                  <th>Account Status</th>
                  <th>Active Loans</th>
                  <th className="pe-4 text-end">Credentials Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
                      Loading student credentials directory...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <i className="bi bi-people fs-1 d-block mb-2 text-secondary opacity-50"></i>
                      No students found {search ? `matching "${search}"` : 'in library records'}.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr key={s.id}>
                      <td className="ps-4">
                        <div className="d-flex align-items-center gap-3">
                          <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-2 d-flex align-items-center justify-content-center fw-bold" style={{ width: '38px', height: '38px' }}>
                            {s.name ? s.name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <div className="fw-semibold text-dark">{s.name}</div>
                            <small className="text-muted">Student ID: #{s.id}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-dark bg-opacity-75 font-monospace">{s.usn}</span>
                      </td>
                      <td>
                        <span className="text-muted fs-8">
                          <i className="bi bi-telephone text-primary me-1"></i>
                          {s.contact || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 font-monospace">
                          {s.username || s.usn.toLowerCase()}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25">
                          <i className="bi bi-check-circle-fill me-1"></i> Active Login
                        </span>
                      </td>
                      <td>
                        {s.activeBorrowedBooksCount > 0 ? (
                          <span className="badge bg-warning text-dark">
                            {s.activeBorrowedBooksCount} book(s)
                          </span>
                        ) : (
                          <span className="badge bg-light text-muted border">0 books</span>
                        )}
                      </td>
                      <td className="pe-4 text-end">
                        <button
                          className="btn btn-outline-info btn-sm rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1 shadow-sm"
                          onClick={() => handleOpenResetModal(s)}
                          title="Reset student password"
                        >
                          <i className="bi bi-key-fill"></i> Reset Password
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {selectedStudent && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom py-3">
                <h5 className="modal-title fw-bold font-outfit text-dark d-flex align-items-center gap-2">
                  <i className="bi bi-shield-lock-fill text-info"></i>
                  Reset Student Password
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedStudent(null)}
                  disabled={resetting}
                ></button>
              </div>

              <form onSubmit={handleSavePassword}>
                <div className="modal-body p-4">
                  <div className="alert alert-light border mb-3 p-3 rounded-3 fs-8">
                    <div className="fw-semibold text-dark mb-1">Target Student Profile:</div>
                    <div>• Name: <strong>{selectedStudent.name}</strong></div>
                    <div>• USN: <span className="font-monospace fw-bold">{selectedStudent.usn}</span></div>
                    <div>• Username: <span className="font-monospace fw-bold">{selectedStudent.username || selectedStudent.usn.toLowerCase()}</span></div>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label fw-semibold mb-0">New Password to Assign:</label>
                      <button
                        type="button"
                        className="btn btn-link btn-sm text-decoration-none p-0 fs-8 fw-semibold"
                        onClick={handleGenerateRandomPassword}
                      >
                        <i className="bi bi-shuffle me-1"></i> Auto-Generate
                      </button>
                    </div>

                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="bi bi-key text-muted"></i>
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-control border-start-0 border-end-0"
                        placeholder="Enter new password (min 4 chars)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        className="btn btn-light border border-start-0 text-muted"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                      </button>
                    </div>
                    <small className="text-muted fs-8">
                      Librarian assigns this password. Student can change it if they want upon login.
                    </small>
                  </div>
                </div>

                <div className="modal-footer border-top py-2">
                  <button
                    type="button"
                    className="btn btn-light rounded-pill px-4"
                    onClick={() => setSelectedStudent(null)}
                    disabled={resetting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-info rounded-pill px-4 text-white d-flex align-items-center gap-2"
                    disabled={resetting}
                  >
                    {resetting ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check2"></i> Save New Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
