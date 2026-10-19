import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Self-Registration Modal State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regForm, setRegForm] = useState({
    name: '',
    usn: '',
    contact: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const sessionExpired = new URLSearchParams(location.search).get('expired');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!username.trim() || !password.trim()) {
      setError('Please provide both username/USN and password.');
      return;
    }

    setLoading(true);

    try {
      const user = await login(username.trim(), password.trim());
      // Role-based redirection
      if (user.role === 'ROLE_LIBRARIAN') {
        navigate('/librarian/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');

    if (!regForm.name.trim() || !regForm.usn.trim() || !regForm.contact.trim() || !regForm.password.trim()) {
      setRegError('Please complete all required fields.');
      return;
    }

    if (regForm.password.length < 4) {
      setRegError('Password must be at least 4 characters long.');
      return;
    }

    if (regForm.password !== regForm.confirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    setRegLoading(true);
    try {
      const payload = {
        name: regForm.name.trim(),
        usn: regForm.usn.trim().toUpperCase(),
        contact: regForm.contact.trim(),
        username: regForm.username.trim() || regForm.usn.trim().toLowerCase(),
        password: regForm.password.trim(),
      };

      const res = await api.post('/auth/register-student', payload);
      setShowRegisterModal(false);
      setSuccessMsg(`Registration successful! You can now log in using your USN or username.`);
      setUsername(payload.username);
      setPassword(payload.password);
    } catch (err) {
      setRegError(err.message || 'Registration failed. The USN may already be registered.');
    } finally {
      setRegLoading(false);
    }
  };

  const handleQuickFill = (userType) => {
    setError('');
    setSuccessMsg('');
    if (userType === 'librarian') {
      setUsername('librarian');
      setPassword('librarian123');
    } else {
      setUsername('rahul');
      setPassword('student123');
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center bg-light p-3">
      <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ maxWidth: '440px', width: '100%' }}>
        {/* Header Banner */}
        <div className="p-4 text-white text-center" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
          <div className="bg-primary text-white rounded-circle p-3 d-inline-flex align-items-center justify-content-center mb-2 shadow-sm" style={{ width: '60px', height: '60px' }}>
            <i className="bi bi-journal-bookmark-fill fs-2"></i>
          </div>
          <h3 className="fw-bold font-outfit mb-0 tracking-wide">
            LIB<span className="text-primary">NEXUS</span>
          </h3>
          <p className="text-white-50 fs-7 mb-0 mt-1">College Library Portal Authentication</p>
        </div>

        <div className="card-body p-4">
          {sessionExpired && (
            <div className="alert alert-warning border-0 rounded-3 py-2 px-3 fs-7 mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-clock-history fs-5"></i>
              <span>Your session has expired. Please log in again.</span>
            </div>
          )}

          {successMsg && (
            <div className="alert alert-success border-0 rounded-3 py-2 px-3 fs-7 mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-check-circle-fill fs-5"></i>
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="alert alert-danger border-0 rounded-3 py-2 px-3 fs-7 mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill fs-5"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold text-secondary fs-7">Username / Student USN</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted"><i className="bi bi-person"></i></span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0"
                  placeholder="e.g. librarian, rahul, or 1MS21CS001"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <small className="text-muted fs-8">Students can log in with their USN or username.</small>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold text-secondary fs-7">Password</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted"><i className="bi bi-lock"></i></span>
                <input
                  type="password"
                  className="form-control bg-light border-start-0"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 rounded-3 fw-semibold d-flex align-items-center justify-content-center gap-2 shadow-sm"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right fs-5"></i>
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Student Self Registration Link */}
          <div className="text-center mt-3 pt-2">
            <span className="text-muted fs-8">Newly admitted student? </span>
            <button
              type="button"
              className="btn btn-link p-0 fs-8 fw-semibold text-primary text-decoration-none"
              onClick={() => setShowRegisterModal(true)}
            >
              Register your account
            </button>
          </div>

          {/* Quick Demo Switcher */}
          <div className="mt-4 pt-3 border-top text-center">
            <span className="text-muted fs-8 text-uppercase fw-semibold d-block mb-2">Demo Quick Sign In</span>
            <div className="d-flex gap-2 justify-content-center">
              <button
                type="button"
                className="btn btn-outline-dark btn-sm rounded-pill fs-8 px-3"
                onClick={() => handleQuickFill('librarian')}
              >
                <i className="bi bi-shield-lock me-1"></i> Librarian
              </button>
              <button
                type="button"
                className="btn btn-outline-success btn-sm rounded-pill fs-8 px-3"
                onClick={() => handleQuickFill('student')}
              >
                <i className="bi bi-mortarboard me-1"></i> Student (Rahul)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Student Self-Registration Modal */}
      {showRegisterModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-success text-white py-3">
                <h5 className="modal-title fw-bold font-outfit mb-0">
                  <i className="bi bi-mortarboard-fill me-2"></i> Student Account Registration
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowRegisterModal(false)}></button>
              </div>
              <form onSubmit={handleRegisterSubmit}>
                <div className="modal-body p-4">
                  {regError && (
                    <div className="alert alert-danger border-0 rounded-3 py-2 px-3 fs-7 mb-3">
                      <i className="bi bi-exclamation-triangle-fill me-1"></i> {regError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-semibold text-secondary fs-7">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Ananya Rao"
                      value={regForm.name}
                      onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-secondary fs-7">USN *</label>
                      <input
                        type="text"
                        className="form-control font-outfit text-uppercase"
                        placeholder="e.g. 1MS21CS099"
                        value={regForm.usn}
                        onChange={(e) => setRegForm({ ...regForm, usn: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-secondary fs-7">Contact Number *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. +91 9876543210"
                        value={regForm.contact}
                        onChange={(e) => setRegForm({ ...regForm, contact: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold text-secondary fs-7">Desired Username (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Defaults to your USN if left blank"
                      value={regForm.username}
                      onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                    />
                  </div>

                  <div className="row g-2 mb-2">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-secondary fs-7">Set Password *</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Minimum 4 characters"
                        value={regForm.password}
                        onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold text-secondary fs-7">Confirm Password *</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Re-enter password"
                        value={regForm.confirmPassword}
                        onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <small className="text-muted fs-8 d-block mb-1">
                    You can change your password anytime after logging in.
                  </small>
                </div>

                <div className="modal-footer bg-light py-2 px-4">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowRegisterModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success btn-sm px-4" disabled={regLoading}>
                    {regLoading ? 'Registering...' : 'Complete Registration'}
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
