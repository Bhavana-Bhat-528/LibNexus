import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export const LibrarianRegisterStudent = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    usn: '',
    contact: '',
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [registeredStudent, setRegisteredStudent] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // Auto-suggest username if user hasn't explicitly customized username
      if (name === 'usn' && !prev.usernameCustomized) {
        next.username = value.trim().toLowerCase();
      }
      return next;
    });
  };

  const handleGeneratePassword = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const generated = `Student@${randomNum}`;
    setFormData((prev) => ({ ...prev, password: generated }));
    setShowPassword(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!formData.name.trim() || !formData.usn.trim() || !formData.contact.trim()) {
      setAlert({
        type: 'danger',
        message: 'Please fill in Student Name, USN, and Contact details.',
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        usn: formData.usn.trim().toUpperCase(),
        contact: formData.contact.trim(),
        username: formData.username.trim() || formData.usn.trim().toLowerCase(),
        password: formData.password.trim() || 'student123',
      };

      const res = await api.post('/students', payload);
      setRegisteredStudent({
        ...res.data,
        assignedPassword: payload.password,
      });

      setAlert({
        type: 'success',
        message: `Student '${payload.name}' registered successfully! Credentials have been generated.`,
      });

      // Clear form
      setFormData({
        name: '',
        usn: '',
        contact: '',
        username: '',
        password: '',
      });
    } catch (err) {
      setAlert({
        type: 'danger',
        message: err.message || 'Failed to register student. Please check input details.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-0">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold font-outfit mb-1 text-dark d-flex align-items-center gap-2">
            <span className="bg-primary text-white p-2 rounded-3 fs-5 d-inline-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
              <i className="bi bi-person-plus-fill"></i>
            </span>
            Register Student & Give Password
          </h2>
          <p className="text-muted mb-0">
            Create new student accounts and assign their initial login password. Students can later change their password anytime.
          </p>
        </div>

        <button
          className="btn btn-outline-secondary rounded-pill px-3 py-2 d-flex align-items-center gap-2"
          onClick={() => navigate('/librarian/student-credentials')}
        >
          <i className="bi bi-key-fill"></i> View Student Credentials
        </button>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show border-0 shadow-sm mb-4`} role="alert">
          <i className={`bi ${alert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
          {alert.message}
          <button type="button" className="btn-close" onClick={() => setAlert(null)} aria-label="Close"></button>
        </div>
      )}

      {/* Newly Registered Receipt Card */}
      {registeredStudent && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden border-top border-4 border-success mb-4">
          <div className="card-header bg-success bg-opacity-10 py-3 border-bottom d-flex justify-content-between align-items-center">
            <h6 className="fw-bold font-outfit mb-0 text-success d-flex align-items-center gap-2">
              <i className="bi bi-patch-check-fill fs-5"></i>
              Account Created Successfully
            </h6>
            <span className="badge bg-success">Active Student</span>
          </div>
          <div className="card-body p-4">
            <p className="text-muted fs-7 mb-3">
              Share these login credentials with the student. They can use either their username or USN to log in.
            </p>

            <div className="row g-3 bg-light p-3 rounded-3 mb-3 border">
              <div className="col-md-3 col-sm-6">
                <span className="text-muted fs-8 d-block">Student Name:</span>
                <strong className="fs-6 text-dark">{registeredStudent.name}</strong>
              </div>
              <div className="col-md-3 col-sm-6">
                <span className="text-muted fs-8 d-block">University Seat Number (USN):</span>
                <span className="badge bg-dark font-monospace fs-7">{registeredStudent.usn}</span>
              </div>
              <div className="col-md-3 col-sm-6">
                <span className="text-muted fs-8 d-block">Assigned Username:</span>
                <span className="badge bg-primary bg-opacity-25 text-primary border border-primary font-monospace fs-7">
                  {registeredStudent.username || registeredStudent.usn.toLowerCase()}
                </span>
              </div>
              <div className="col-md-3 col-sm-6">
                <span className="text-muted fs-8 d-block">Librarian-Assigned Password:</span>
                <span className="badge bg-warning bg-opacity-25 text-dark border border-warning font-monospace fs-7">
                  {registeredStudent.assignedPassword}
                </span>
              </div>
            </div>

            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-primary btn-sm rounded-pill px-4"
                onClick={() => {
                  const text = `Library Login Credentials:\nName: ${registeredStudent.name}\nUSN: ${registeredStudent.usn}\nUsername: ${registeredStudent.username || registeredStudent.usn.toLowerCase()}\nPassword: ${registeredStudent.assignedPassword}\nPortal: http://localhost:5173/login`;
                  navigator.clipboard.writeText(text);
                  alert('Credentials copied to clipboard!');
                }}
              >
                <i className="bi bi-clipboard-check me-1"></i> Copy Credentials
              </button>
              <button
                className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                onClick={() => setRegisteredStudent(null)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registration Form */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <div className="card-header bg-white py-3 border-bottom">
          <h5 className="fw-bold font-outfit mb-0 text-dark">
            <i className="bi bi-pencil-square text-primary me-2"></i>
            Student Information & Login Account
          </h5>
        </div>

        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              {/* Name */}
              <div className="col-md-12">
                <label className="form-label fw-semibold">
                  Student Full Name <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-person text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="e.g. Rahul Sharma"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* USN */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  University Seat Number (USN) <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-card-heading text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 text-uppercase"
                    placeholder="e.g. 1MS21CS045"
                    name="usn"
                    value={formData.usn}
                    onChange={handleChange}
                    required
                  />
                </div>
                <small className="text-muted fs-8">Must be unique per student</small>
              </div>

              {/* Contact */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Contact / Phone Number <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-telephone text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="e.g. +91 9876543210"
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="col-12 pt-2">
                <hr className="my-2" />
                <div className="d-flex align-items-center gap-2 mb-2 text-primary fw-bold fs-7 text-uppercase" style={{ letterSpacing: '0.05em' }}>
                  <i className="bi bi-shield-lock-fill"></i>
                  Student Login Credentials (Given by Librarian)
                </div>
              </div>

              {/* Username */}
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Login Username
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-at text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="e.g. rahul or 1ms21cs045"
                    name="username"
                    value={formData.username}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, username: e.target.value, usernameCustomized: true }));
                    }}
                  />
                </div>
                <small className="text-muted fs-8">Student can also log in using their USN directly</small>
              </div>

              {/* Password given by librarian */}
              <div className="col-md-6">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label fw-semibold mb-0">
                    Assign Password <span className="text-danger">*</span>
                  </label>
                  <button
                    type="button"
                    className="btn btn-link btn-sm text-decoration-none p-0 fs-8 fw-semibold"
                    onClick={handleGeneratePassword}
                  >
                    <i className="bi bi-shuffle me-1"></i> Generate
                  </button>
                </div>

                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-key text-muted"></i>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control border-start-0 border-end-0"
                    placeholder="Enter password (default: student123)"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="btn btn-light border border-start-0 text-muted"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                  </button>
                </div>
                <small className="text-muted fs-8">Librarian gives this password. Student can change it anytime in their profile.</small>
              </div>

              {/* Action Buttons */}
              <div className="col-12 pt-3">
                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary rounded-pill px-4 py-2 d-flex align-items-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Registering Student...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-person-check-fill"></i>
                        Register Student & Create Login
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-light rounded-pill px-4 py-2 border"
                    onClick={() => {
                      setFormData({ name: '', usn: '', contact: '', username: '', password: '' });
                      setAlert(null);
                    }}
                  >
                    Reset Form
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Guidelines & Policy Card (Moved to the bottom of the page) */}
      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-header bg-white py-3 border-bottom d-flex align-items-center gap-2">
          <i className="bi bi-shield-check text-primary fs-5"></i>
          <h6 className="fw-bold font-outfit mb-0 text-dark">
            Student Account Policy
          </h6>
        </div>
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-lg-3 col-md-6">
              <div className="p-3 rounded-3 bg-light h-100 border border-light-subtle">
                <div className="d-flex align-items-center gap-2 mb-2 text-primary fw-semibold fs-7">
                  <i className="bi bi-person-badge fs-5"></i>
                  <span>Flexible Login</span>
                </div>
                <p className="text-muted fs-8 mb-0">
                  Students can log in using their <strong>Username</strong> or their <strong>USN</strong> interchangeably.
                </p>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="p-3 rounded-3 bg-light h-100 border border-light-subtle">
                <div className="d-flex align-items-center gap-2 mb-2 text-success fw-semibold fs-7">
                  <i className="bi bi-shield-lock fs-5"></i>
                  <span>Password Liberty</span>
                </div>
                <p className="text-muted fs-8 mb-0">
                  The student has complete freedom to update their password at any time via <em>My Profile &rarr; Change Password</em>.
                </p>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="p-3 rounded-3 bg-light h-100 border border-light-subtle">
                <div className="d-flex align-items-center gap-2 mb-2 text-warning fw-semibold fs-7">
                  <i className="bi bi-arrow-repeat fs-5"></i>
                  <span>Reset Facility</span>
                </div>
                <p className="text-muted fs-8 mb-0">
                  If a student forgets their password, the librarian can reset it from the <em>Student Credentials & Passwords</em> page.
                </p>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="p-3 rounded-3 bg-light h-100 border border-light-subtle">
                <div className="d-flex align-items-center gap-2 mb-2 text-info fw-semibold fs-7">
                  <i className="bi bi-journal-bookmark fs-5"></i>
                  <span>Borrowing Quota</span>
                </div>
                <p className="text-muted fs-8 mb-0">
                  Each registered student is entitled to borrow up to a maximum of <strong>3 books</strong> simultaneously for <strong>15 days</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
