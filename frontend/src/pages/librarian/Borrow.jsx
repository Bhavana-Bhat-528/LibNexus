import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export const LibrarianBorrow = () => {
  const [usn, setUsn] = useState('');
  const [verifiedStudent, setVerifiedStudent] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [availableBooks, setAvailableBooks] = useState([]);
  const [selectedBookIds, setSelectedBookIds] = useState(['', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);

  const fetchBooks = async () => {
    try {
      const res = await api.get('/books');
      if (res.success && res.data) {
        setAvailableBooks(res.data.filter((b) => b.availableCopies > 0));
      }
    } catch (err) {
      console.error('Failed to load books', err);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleLookupStudent = async () => {
    if (!usn.trim()) {
      showAlert('warning', 'Please enter a student USN to verify.');
      return;
    }
    setLookupLoading(true);
    setVerifiedStudent(null);
    try {
      const res = await api.get(`/students/usn/${usn.trim().toUpperCase()}`);
      if (res.success && res.data) {
        setVerifiedStudent(res.data);
      }
    } catch (err) {
      showAlert('danger', err.message || `No registered student found with USN '${usn.toUpperCase()}'.`);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleBookChange = (index, value) => {
    const updated = [...selectedBookIds];
    updated[index] = value;
    setSelectedBookIds(updated);
  };

  const chosenIds = selectedBookIds.filter((id) => id !== '').map((id) => Number(id));
  const activeCount = verifiedStudent?.activeBooksCount || 0;
  const remainingQuota = verifiedStudent ? verifiedStudent.remainingBorrowLimit : 3;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!verifiedStudent) {
      showAlert('warning', 'Please verify student USN first.');
      return;
    }

    if (chosenIds.length === 0) {
      showAlert('warning', 'Please select at least one book to issue.');
      return;
    }

    // Check duplicate selection within dropdowns
    const uniqueIds = new Set(chosenIds);
    if (uniqueIds.size !== chosenIds.length) {
      showAlert('warning', 'Cannot select the same book multiple times in one request.');
      return;
    }

    if (activeCount + chosenIds.length > 3) {
      showAlert('danger', `Limit exceeded! Student can only borrow ${remainingQuota} more book(s).`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/transactions/borrow', {
        usn: verifiedStudent.usn,
        bookIds: chosenIds,
      });

      if (res.success) {
        showAlert('success', `✅ Successfully issued ${chosenIds.length} book(s) to ${verifiedStudent.name}!`);
        // Reset form
        setSelectedBookIds(['', '', '']);
        setVerifiedStudent(null);
        setUsn('');
        fetchBooks();
      }
    } catch (err) {
      showAlert('danger', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h3 className="fw-bold font-outfit text-dark mb-1">Issue / Borrow Books</h3>
        <p className="text-muted fs-7 mb-0">Verify student membership by USN, validate active borrowing quotas, and check out up to 3 books.</p>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} border-0 rounded-3 mb-4 shadow-sm d-flex align-items-center gap-2`} role="alert">
          <i className={`bi ${alert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} fs-5`}></i>
          <span>{alert.message}</span>
        </div>
      )}

      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-white py-3 border-bottom">
              <h6 className="fw-bold font-outfit mb-0 text-primary">Book Checkout Circulation Form</h6>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                {/* Step 1: Student Lookup */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">1. Student Identification (USN) <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted"><i className="bi bi-person-badge"></i></span>
                    <input
                      type="text"
                      className="form-control text-uppercase font-outfit"
                      placeholder="Enter Student USN (e.g. 1MS21CS001)"
                      value={usn}
                      onChange={(e) => setUsn(e.target.value.toUpperCase())}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLookupStudent(); } }}
                    />
                    <button
                      className="btn btn-outline-primary"
                      type="button"
                      onClick={handleLookupStudent}
                      disabled={lookupLoading}
                    >
                      {lookupLoading ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="bi bi-search me-1"></i>}
                      Verify Student
                    </button>
                  </div>

                  {/* Verification Card */}
                  {verifiedStudent && (
                    <div className="card bg-light border-primary border-opacity-25 p-3 rounded-3 mt-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="fw-bold mb-0 text-dark">{verifiedStudent.name}</h6>
                          <small className="text-muted">
                            USN: <strong>{verifiedStudent.usn}</strong> • Contact: {verifiedStudent.contact}
                          </small>
                        </div>
                        <div className="text-end">
                          <span className={`badge ${verifiedStudent.activeBooksCount >= 3 ? 'bg-danger' : 'bg-success'} fs-7`}>
                            {verifiedStudent.activeBooksCount} / 3 Active Loans
                          </span>
                          <div className="fs-8 text-muted mt-1">
                            Available Quota: <strong>{verifiedStudent.remainingBorrowLimit} Books</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 2: Book Selections */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">2. Select Books to Issue (Max 3 Total Active)</label>
                  <div className="d-flex flex-column gap-3">
                    <div>
                      <label className="form-label fs-8 text-muted mb-1">Book 1 <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={selectedBookIds[0]}
                        onChange={(e) => handleBookChange(0, e.target.value)}
                        required
                      >
                        <option value="">-- Choose Book 1 --</option>
                        {availableBooks.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.title} by {b.author} ({b.availableCopies} available)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="form-label fs-8 text-muted mb-1">Book 2 (Optional)</label>
                      <select
                        className="form-select"
                        value={selectedBookIds[1]}
                        onChange={(e) => handleBookChange(1, e.target.value)}
                        disabled={!selectedBookIds[0]}
                      >
                        <option value="">-- Choose Book 2 (Optional) --</option>
                        {availableBooks.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.title} by {b.author} ({b.availableCopies} available)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="form-label fs-8 text-muted mb-1">Book 3 (Optional)</label>
                      <select
                        className="form-select"
                        value={selectedBookIds[2]}
                        onChange={(e) => handleBookChange(2, e.target.value)}
                        disabled={!selectedBookIds[1]}
                      >
                        <option value="">-- Choose Book 3 (Optional) --</option>
                        {availableBooks.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.title} by {b.author} ({b.availableCopies} available)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Real-time Borrow Limit Indicator */}
                <div className="mb-4">
                  {!verifiedStudent ? (
                    <div className="alert alert-info border-0 rounded-3 mb-0 fs-7 d-flex align-items-center gap-2">
                      <i className="bi bi-info-circle-fill fs-5"></i>
                      <span>Please verify the student USN above to inspect eligibility and remaining borrow quota.</span>
                    </div>
                  ) : activeCount >= 3 ? (
                    <div className="alert alert-danger border-0 rounded-3 mb-0 fs-7 d-flex align-items-center gap-2">
                      <i className="bi bi-x-circle-fill fs-5"></i>
                      <span><strong>Borrow Limit Reached:</strong> Student currently holds 3 active books. Cannot check out more.</span>
                    </div>
                  ) : activeCount + chosenIds.length > 3 ? (
                    <div className="alert alert-warning border-0 rounded-3 mb-0 fs-7 d-flex align-items-center gap-2">
                      <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                      <span>
                        <strong>Limit Exceeded:</strong> Student holds {activeCount} active books and can only borrow {remainingQuota} more. You have selected {chosenIds.length}.
                      </span>
                    </div>
                  ) : (
                    <div className="alert alert-success border-0 rounded-3 mb-0 fs-7 d-flex align-items-center gap-2">
                      <i className="bi bi-check-circle-fill fs-5"></i>
                      <span>
                        <strong>Eligible:</strong> Issuing {chosenIds.length} book(s) will leave <strong>{remainingQuota - chosenIds.length}</strong> remaining slot(s).
                      </span>
                    </div>
                  )}
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-light px-4"
                    onClick={() => { setSelectedBookIds(['', '', '']); setVerifiedStudent(null); setUsn(''); }}
                  >
                    Reset Form
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4 d-flex align-items-center gap-2"
                    disabled={submitting || !verifiedStudent || chosenIds.length === 0 || activeCount + chosenIds.length > 3}
                  >
                    {submitting ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-check2-circle"></i>}
                    <span>Issue Selected Books</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
