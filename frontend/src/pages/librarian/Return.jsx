import React, { useState } from 'react';
import api from '../../services/api';

export const LibrarianReturn = () => {
  const [usn, setUsn] = useState('');
  const [student, setStudent] = useState(null);
  const [activeLoans, setActiveLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Return Confirmation Modal state
  const [selectedTx, setSelectedTx] = useState(null);
  const [processingReturn, setProcessingReturn] = useState(false);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSearchStudent = async () => {
    if (!usn.trim()) {
      showAlert('warning', 'Please enter a student USN.');
      return;
    }
    setLoading(true);
    setStudent(null);
    setActiveLoans([]);

    try {
      const studentRes = await api.get(`/students/usn/${usn.trim().toUpperCase()}`);
      if (studentRes.success && studentRes.data) {
        setStudent(studentRes.data);

        // Fetch student transactions
        const txRes = await api.get(`/transactions/student/${usn.trim().toUpperCase()}`);
        if (txRes.success && txRes.data) {
          const active = txRes.data.filter((t) => t.status === 'BORROWED');
          setActiveLoans(active);
        }
      }
    } catch (err) {
      showAlert('danger', err.message || `No active record found for USN '${usn.toUpperCase()}'.`);
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysElapsed = (issueDateStr) => {
    const issueDate = new Date(issueDateStr);
    const today = new Date();
    const diffTime = Math.abs(today - issueDate);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateFine = (days) => {
    return days > 15 ? (days - 15) * 2.0 : 0.0;
  };

  const handleOpenConfirmModal = (tx) => {
    const days = calculateDaysElapsed(tx.issueDate);
    const fine = calculateFine(days);
    setSelectedTx({ ...tx, daysElapsed: days, calculatedFine: fine });
  };

  const handleConfirmReturn = async () => {
    if (!selectedTx) return;
    setProcessingReturn(true);
    try {
      const res = await api.post(`/transactions/return/${selectedTx.id}`);
      showAlert('success', res.message || `Book '${selectedTx.book.title}' returned successfully!`);
      setSelectedTx(null);
      // Refresh active loans list
      handleSearchStudent();
    } catch (err) {
      showAlert('danger', err.message);
    } finally {
      setProcessingReturn(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h3 className="fw-bold font-outfit text-dark mb-1">Process Book Returns</h3>
        <p className="text-muted fs-7 mb-0">Search student loans, review overdue loan durations, calculate automated late fines, and restore inventory.</p>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} border-0 rounded-3 mb-4 shadow-sm d-flex align-items-center gap-2`} role="alert">
          <i className={`bi ${alert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} fs-5`}></i>
          <span>{alert.message}</span>
        </div>
      )}

      <div className="row justify-content-center">
        <div className="col-lg-9">
          {/* Search Box */}
          <div className="card border-0 shadow-sm rounded-3 mb-4">
            <div className="card-header bg-white py-3 border-bottom">
              <h6 className="fw-bold font-outfit mb-0 text-success">Student Return Lookup</h6>
            </div>
            <div className="card-body p-4">
              <div className="row g-3 align-items-end">
                <div className="col-md-8">
                  <label className="form-label fw-semibold">Enter Student USN <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted"><i className="bi bi-person-badge"></i></span>
                    <input
                      type="text"
                      className="form-control text-uppercase font-outfit"
                      placeholder="e.g. 1MS21CS001"
                      value={usn}
                      onChange={(e) => setUsn(e.target.value.toUpperCase())}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSearchStudent(); }}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <button
                    className="btn btn-success w-100 d-flex align-items-center justify-content-center gap-2"
                    onClick={handleSearchStudent}
                    disabled={loading}
                  >
                    {loading ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-search"></i>}
                    <span>Find Active Loans</span>
                  </button>
                </div>
              </div>

              {student && (
                <div className="alert alert-light border p-3 rounded-3 mt-4 mb-0 d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="fw-bold mb-0 text-dark"><i className="bi bi-person-check-fill text-success me-2"></i>{student.name}</h6>
                    <small className="text-muted">USN: <strong>{student.usn}</strong> • Contact: {student.contact}</small>
                  </div>
                  <span className="badge bg-success fs-7">Active Loans: {activeLoans.length}</span>
                </div>
              )}
            </div>
          </div>

          {/* Active Borrow Records */}
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <h6 className="fw-bold font-outfit mb-0 text-dark">Active Loans Eligible for Return</h6>
              {activeLoans.length > 0 && <span className="badge bg-primary rounded-pill">{activeLoans.length} Book(s)</span>}
            </div>
            <div className="card-body p-4">
              {loading ? (
                <div className="text-center py-5 text-muted">
                  <span className="spinner-border text-success mb-2"></span>
                  <div>Loading student's borrowed books...</div>
                </div>
              ) : activeLoans.length > 0 ? (
                <div className="row g-3">
                  {activeLoans.map((tx) => {
                    const days = calculateDaysElapsed(tx.issueDate);
                    const fine = calculateFine(days);
                    const isOverdue = days > 15;

                    return (
                      <div className="col-md-6" key={tx.id}>
                        <div className={`card h-100 rounded-3 shadow-sm border ${isOverdue ? 'border-danger' : 'border-success'} border-opacity-50`}>
                          <div className="card-body p-3 d-flex flex-column justify-content-between">
                            <div>
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <h6 className="fw-bold text-dark mb-0">{tx.book.title}</h6>
                                <span className="badge bg-secondary font-outfit fs-8">#TX-{tx.id}</span>
                              </div>
                              <p className="text-muted fs-8 mb-1"><i className="bi bi-person me-1"></i> Author: {tx.book.author}</p>
                              <p className="text-muted fs-8 mb-1"><i className="bi bi-calendar-event me-1"></i> Issued: <strong>{tx.issueDate}</strong></p>
                              <p className="fs-7 mb-2">
                                Loan Duration: <strong className={isOverdue ? 'text-danger' : 'text-success'}>{days} Days</strong>
                                {isOverdue && <span className="badge bg-danger ms-2">Overdue ({days - 15} days)</span>}
                              </p>
                            </div>

                            <div className="pt-3 border-top d-flex justify-content-between align-items-center">
                              <div>
                                {fine > 0 ? (
                                  <span className="badge bg-danger fs-7">Late Fine: ₹{fine.toFixed(2)}</span>
                                ) : (
                                  <span className="badge bg-success fs-7">No Late Fine</span>
                                )}
                              </div>
                              <button
                                className="btn btn-success btn-sm px-3 d-flex align-items-center gap-1"
                                onClick={() => handleOpenConfirmModal(tx)}
                              >
                                <i className="bi bi-box-arrow-in-down"></i>
                                <span>Return Book</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-journal-check fs-1 text-secondary d-block mb-2"></i>
                  {student
                    ? `Student ${student.name} has no active borrowed books to return.`
                    : 'Search a student USN above to display eligible return items.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Return Confirmation Modal */}
      {selectedTx && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title font-outfit fw-bold">Confirm Book Return</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedTx(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="text-center mb-3">
                  <div className="p-3 bg-success bg-opacity-10 rounded-circle d-inline-flex mb-2">
                    <i className="bi bi-journal-arrow-down fs-1 text-success"></i>
                  </div>
                  <h5 className="fw-bold mb-0 text-dark">{selectedTx.book.title}</h5>
                  <p className="text-muted fs-7">Student USN: <strong>{selectedTx.student.usn}</strong> ({selectedTx.student.name})</p>
                </div>

                <ul className="list-group list-group-flush border rounded-3 mb-3 fs-7">
                  <li className="list-group-item d-flex justify-content-between">
                    <span className="text-muted">Transaction ID:</span>
                    <strong className="text-primary font-outfit">#TX-{selectedTx.id}</strong>
                  </li>
                  <li className="list-group-item d-flex justify-content-between">
                    <span className="text-muted">Issue Date:</span>
                    <strong>{selectedTx.issueDate}</strong>
                  </li>
                  <li className="list-group-item d-flex justify-content-between">
                    <span className="text-muted">Days Borrowed:</span>
                    <strong className={selectedTx.daysElapsed > 15 ? 'text-danger' : 'text-success'}>
                      {selectedTx.daysElapsed} Days
                    </strong>
                  </li>
                  <li className="list-group-item d-flex justify-content-between">
                    <span className="text-muted">Grace Loan Limit:</span>
                    <span>15 Days</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between bg-light">
                    <span className="fw-bold text-dark">Calculated Overdue Fine (₹2/day):</span>
                    <strong className={`fs-6 ${selectedTx.calculatedFine > 0 ? 'text-danger' : 'text-success'}`}>
                      ₹{selectedTx.calculatedFine.toFixed(2)}
                    </strong>
                  </li>
                </ul>

                <p className="text-muted fs-8 mb-0 text-center">
                  Confirming this return will atomically restore available inventory copy and finalize the circulation record.
                </p>
              </div>
              <div className="modal-footer bg-light px-4 py-3">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedTx(null)}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-success px-4 d-flex align-items-center gap-2"
                  onClick={handleConfirmReturn}
                  disabled={processingReturn}
                >
                  {processingReturn ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-check2-circle"></i>}
                  <span>Confirm & Return</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
