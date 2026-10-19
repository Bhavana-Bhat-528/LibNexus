import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const StudentProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordAlert, setPasswordAlert] = useState(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/student-portal/profile');
      if (res.success && res.data) {
        setProfile(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordAlert(null);

    if (!newPassword.trim()) {
      setPasswordAlert({ type: 'danger', message: 'New password cannot be empty.' });
      return;
    }

    if (newPassword.trim().length < 4) {
      setPasswordAlert({ type: 'danger', message: 'New password must be at least 4 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordAlert({ type: 'danger', message: 'New password and confirm password do not match.' });
      return;
    }

    setPasswordSubmitting(true);
    try {
      const res = await api.put('/student-portal/change-password', {
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim(),
      });

      setPasswordAlert({
        type: 'success',
        message: res.message || 'Password changed successfully! Please use your new password for future logins.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordAlert({
        type: 'danger',
        message: err.message || 'Failed to update password. Please check your current password.',
      });
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h3 className="fw-bold font-outfit text-dark mb-1">My Student Profile & Security</h3>
        <p className="text-muted fs-7 mb-0">
          Review your university student registration, membership quota limits, and manage your account login password.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger border-0 rounded-3 mb-4 d-flex align-items-center gap-2 shadow-sm">
          <i className="bi bi-exclamation-triangle-fill fs-5"></i>
          <span>{error}</span>
        </div>
      )}

      <div className="row justify-content-center g-4">
        {/* Left Column: Profile Card & Quota */}
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
            <div className="p-4 text-white" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
              <div className="d-flex align-items-center gap-3">
                <div className="bg-success text-white rounded-circle p-3 d-flex align-items-center justify-content-center shadow" style={{ width: '64px', height: '64px' }}>
                  <i className="bi bi-person-fill fs-1"></i>
                </div>
                <div>
                  <h4 className="fw-bold font-outfit mb-1">{profile?.name || user?.username}</h4>
                  <p className="text-white-50 mb-0 fs-7">
                    USN: <span className="text-white font-outfit fw-bold">{profile?.usn || user?.studentUsn}</span> • Student Membership ID: #{profile?.id}
                  </p>
                </div>
              </div>
            </div>

            <div className="card-body p-4">
              <h6 className="fw-bold font-outfit text-muted text-uppercase fs-8 mb-3">Member Details</h6>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <div className="p-3 bg-light rounded-3">
                    <small className="text-muted d-block fs-8">Full Name</small>
                    <strong className="text-dark fs-6">{profile?.name || '-'}</strong>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="p-3 bg-light rounded-3">
                    <small className="text-muted d-block fs-8">University Seat Number (USN)</small>
                    <strong className="text-primary fs-6 font-outfit">{profile?.usn || '-'}</strong>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="p-3 bg-light rounded-3">
                    <small className="text-muted d-block fs-8">Registered Contact</small>
                    <strong className="text-dark fs-6">{profile?.contact || '-'}</strong>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="p-3 bg-light rounded-3">
                    <small className="text-muted d-block fs-8">Login Username</small>
                    <strong className="text-dark fs-6 font-outfit">{profile?.username || user?.username}</strong>
                  </div>
                </div>
              </div>

              <h6 className="fw-bold font-outfit text-muted text-uppercase fs-8 mb-3">Borrow Quota Status</h6>
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <div className="card border rounded-3 p-3 text-center">
                    <small className="text-muted d-block fs-8">Active Borrowed</small>
                    <h3 className="fw-bold text-dark font-outfit mb-0">{profile?.activeBooksCount ?? 0}</h3>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card border rounded-3 p-3 text-center">
                    <small className="text-muted d-block fs-8">Available Quota</small>
                    <h3 className="fw-bold text-success font-outfit mb-0">{profile?.remainingQuota ?? 3} Slots</h3>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card border rounded-3 p-3 text-center">
                    <small className="text-muted d-block fs-8">Maximum Book Limit</small>
                    <h3 className="fw-bold text-primary font-outfit mb-0">3 Books</h3>
                  </div>
                </div>
              </div>

              <div className="alert alert-light border rounded-3 fs-8 text-secondary mb-0">
                <i className="bi bi-info-circle-fill text-primary me-2"></i>
                You can log in to LibNexus using either your <strong>Username ({profile?.username || user?.username})</strong> or your <strong>USN ({profile?.usn || user?.studentUsn})</strong>.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Change Password Card */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="card-header bg-white py-3 border-bottom">
              <h5 className="fw-bold font-outfit mb-0 text-dark">
                <i className="bi bi-shield-lock-fill text-primary me-2"></i>
                Change Login Password
              </h5>
              <small className="text-muted">You have the freedom to change your password at any time.</small>
            </div>

            <div className="card-body p-4">
              {passwordAlert && (
                <div className={`alert alert-${passwordAlert.type} border-0 rounded-3 py-2 px-3 fs-7 mb-3 d-flex align-items-center gap-2`}>
                  <i className={`bi ${passwordAlert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} fs-5`}></i>
                  <span>{passwordAlert.message}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword}>
                <div className="mb-3">
                  <label className="form-label fw-semibold text-secondary fs-7">Current Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <i className="bi bi-lock"></i>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control bg-light border-start-0"
                      placeholder="Enter current password (if known)"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <small className="text-muted fs-8">Leave empty if this is your first time setting a password.</small>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold text-secondary fs-7">New Password *</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <i className="bi bi-key"></i>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control bg-light border-start-0"
                      placeholder="Minimum 4 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold text-secondary fs-7">Confirm New Password *</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <i className="bi bi-check2-circle"></i>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control bg-light border-start-0"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-check mb-4">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="showPassToggle"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                  />
                  <label className="form-check-label fs-8 text-muted" htmlFor="showPassToggle">
                    Show passwords in plain text
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 rounded-3 py-2 fw-semibold shadow-sm"
                  disabled={passwordSubmitting}
                >
                  {passwordSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2 me-1"></i> Update Password
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
