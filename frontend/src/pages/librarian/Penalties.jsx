import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { StatCard } from '../../components/StatCard';

export const LibrarianPenalties = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('collected'); // 'collected' | 'summary' | 'accruing'
  const [activeOverdues, setActiveOverdues] = useState([]);

  const fetchPenalties = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/transactions/penalties');
      if (res.success && res.data) {
        setReport(res.data);
      }

      // Also fetch active transactions to display the live accruing fines list
      const txRes = await api.get('/transactions?status=BORROWED');
      if (txRes.success && txRes.data) {
        const today = new Date();
        const overdues = txRes.data
          .map((tx) => {
            const issueDate = new Date(tx.issueDate);
            const daysBorrowed = Math.floor((today - issueDate) / (1000 * 60 * 60 * 24));
            const daysOverdue = Math.max(0, daysBorrowed - 15);
            const fine = daysOverdue * 2.0;
            return {
              ...tx,
              daysBorrowed,
              daysOverdue,
              accruedFine: fine,
              dueDate: new Date(issueDate.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            };
          })
          .filter((tx) => tx.daysOverdue > 0);
        setActiveOverdues(overdues);
      }
    } catch (err) {
      setError(err.message || 'Failed to load penalty records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPenalties();
  }, []);

  const totalCollected = report?.totalCollectedFines || 0;
  const fineCount = report?.totalFineTransactionsCount || 0;
  const avgFine = fineCount > 0 ? (totalCollected / fineCount).toFixed(2) : '0.00';
  const accruingFines = report?.activeAccruingFines || 0;

  // Filter collected penalties
  const filteredCollected = (report?.collectedPenalties || []).filter(
    (p) =>
      p.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      p.studentUsn?.toLowerCase().includes(search.toLowerCase()) ||
      p.bookTitle?.toLowerCase().includes(search.toLowerCase())
  );

  // Filter student summary
  const filteredSummary = (report?.studentSummary || []).filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.usn?.toLowerCase().includes(search.toLowerCase())
  );

  // Filter accruing list
  const filteredAccruing = activeOverdues.filter(
    (o) =>
      o.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.student?.usn?.toLowerCase().includes(search.toLowerCase()) ||
      o.book?.title?.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportCSV = () => {
    if (!report?.collectedPenalties || report.collectedPenalties.length === 0) return;
    const headers = ['Transaction ID', 'Student Name', 'USN', 'Contact', 'Book Title', 'Category', 'Issue Date', 'Return Date', 'Days Borrowed', 'Days Overdue', 'Fine Collected (INR)'];
    const rows = report.collectedPenalties.map((p) => [
      p.transactionId,
      `"${p.studentName}"`,
      p.studentUsn,
      p.studentContact,
      `"${p.bookTitle}"`,
      `"${p.bookCategory}"`,
      p.issueDate,
      p.returnDate,
      p.daysBorrowed,
      p.daysOverdue,
      p.fine,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `penalties_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold font-outfit text-dark mb-1">
            <i className="bi bi-cash-coin text-warning me-2"></i>
            Penalty Fees Collection Ledger
          </h3>
          <p className="text-muted fs-7 mb-0">
            Audit record of late return penalty fees collected from students and pending accrued fines.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-outline-secondary btn-sm rounded-2 d-flex align-items-center gap-1 shadow-sm"
            onClick={handleExportCSV}
            disabled={!report?.collectedPenalties?.length}
          >
            <i className="bi bi-download"></i>
            <span>Export CSV</span>
          </button>
          <button
            className="btn btn-outline-primary btn-sm rounded-2 d-flex align-items-center gap-1 shadow-sm"
            onClick={fetchPenalties}
            disabled={loading}
          >
            <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger border-0 rounded-3 mb-4 d-flex align-items-center gap-2 shadow-sm">
          <i className="bi bi-exclamation-triangle-fill fs-5"></i>
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-xl-3 col-md-6">
          <StatCard
            title="Total Penalties Collected"
            value={`₹${totalCollected.toFixed(2)}`}
            icon="bi-cash-stack"
            gradient="gradient-card-success"
            subtitle="Realized late return revenue"
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <StatCard
            title="Penalty Incidents"
            value={fineCount}
            icon="bi-receipt-cutoff"
            gradient="gradient-card-primary"
            subtitle="Transactions with fines paid"
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <StatCard
            title="Average Late Fine"
            value={`₹${avgFine}`}
            icon="bi-calculator"
            gradient="gradient-card-info"
            subtitle="Mean fee per penalty incident"
          />
        </div>
        <div className="col-xl-3 col-md-6">
          <StatCard
            title="Accruing Unpaid Fines"
            value={`₹${accruingFines.toFixed(2)}`}
            icon="bi-clock-history"
            gradient={accruingFines > 0 ? 'gradient-card-danger' : null}
            subtitle={`${report?.overdueTransactionsCount || 0} overdue loans in circulation`}
          />
        </div>
      </div>

      {/* Filter and Tab Navigation */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-3">
          <div className="row g-3 align-items-center">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0"
                  placeholder="Filter by student name, USN, or book title..."
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
            <div className="col-md-6">
              <ul className="nav nav-pills justify-content-md-end gap-2">
                <li className="nav-item">
                  <button
                    className={`nav-link btn-sm rounded-pill px-3 py-1 ${activeTab === 'collected' ? 'active' : ''}`}
                    onClick={() => setActiveTab('collected')}
                  >
                    <i className="bi bi-check2-circle me-1"></i> Collected Fines ({report?.collectedPenalties?.length || 0})
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link btn-sm rounded-pill px-3 py-1 ${activeTab === 'summary' ? 'active' : ''}`}
                    onClick={() => setActiveTab('summary')}
                  >
                    <i className="bi bi-people me-1"></i> By Student ({report?.studentSummary?.length || 0})
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link btn-sm rounded-pill px-3 py-1 ${activeTab === 'accruing' ? 'active' : ''}`}
                    onClick={() => setActiveTab('accruing')}
                  >
                    <i className="bi bi-hourglass-split me-1"></i> Accruing Overdues ({activeOverdues.length})
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Tab 1: Collected Fines Table */}
      {activeTab === 'collected' && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
            <h6 className="fw-bold font-outfit mb-0 text-dark">
              <i className="bi bi-receipt text-success me-2"></i>
              Realized Penalty Transactions
            </h6>
            <span className="badge bg-success bg-opacity-10 text-success fw-bold px-3 py-1 rounded-pill">
              ₹{totalCollected.toFixed(2)} Total Settled
            </span>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4">Tx ID</th>
                  <th>Student Info</th>
                  <th>Book Title</th>
                  <th>Loan Period</th>
                  <th className="text-center">Overdue Days</th>
                  <th className="text-end">Fine Collected</th>
                  <th className="pe-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <span className="spinner-border spinner-border-sm me-2 text-primary" role="status"></span>
                      Loading collected penalties...
                    </td>
                  </tr>
                ) : filteredCollected.length > 0 ? (
                  filteredCollected.map((p) => (
                    <tr key={p.transactionId}>
                      <td className="ps-4 font-outfit fw-bold text-muted">#{p.transactionId}</td>
                      <td>
                        <div className="fw-bold text-dark">{p.studentName}</div>
                        <div className="fs-8 text-primary font-outfit">{p.studentUsn}</div>
                        <small className="text-muted fs-8">{p.studentContact}</small>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{p.bookTitle}</div>
                        <span className="badge bg-light text-secondary border fs-8">{p.bookCategory}</span>
                      </td>
                      <td>
                        <div className="fs-8 text-muted">Issued: {p.issueDate}</div>
                        <div className="fs-8 text-dark fw-medium">Returned: {p.returnDate}</div>
                        <small className="text-muted fs-8">({p.daysBorrowed} days held)</small>
                      </td>
                      <td className="text-center">
                        <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1">
                          +{p.daysOverdue} days
                        </span>
                      </td>
                      <td className="text-end">
                        <span className="fs-6 fw-bold text-success font-outfit">
                          ₹{Number(p.fine).toFixed(2)}
                        </span>
                      </td>
                      <td className="pe-4 text-center">
                        <span className="badge bg-success text-white px-3 py-1 rounded-pill fs-8">
                          <i className="bi bi-check-circle-fill me-1"></i> Paid
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <i className="bi bi-shield-check fs-1 text-success d-block mb-2"></i>
                      No penalty records matching your filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Student Summary Table */}
      {activeTab === 'summary' && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
            <h6 className="fw-bold font-outfit mb-0 text-dark">
              <i className="bi bi-people text-primary me-2"></i>
              Penalty Fees Summary by Student
            </h6>
            <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-3 py-1 rounded-pill">
              {filteredSummary.length} Penalized Students
            </span>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4">Rank</th>
                  <th>Student Name</th>
                  <th>University Seat Number</th>
                  <th>Contact Details</th>
                  <th className="text-center">Penalty Incidents</th>
                  <th className="pe-4 text-end">Total Late Fines Paid</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      <span className="spinner-border spinner-border-sm me-2 text-primary" role="status"></span>
                      Loading student summaries...
                    </td>
                  </tr>
                ) : filteredSummary.length > 0 ? (
                  filteredSummary.map((s, idx) => (
                    <tr key={s.usn}>
                      <td className="ps-4 font-outfit fw-bold text-muted">#{idx + 1}</td>
                      <td className="fw-bold text-dark">{s.name}</td>
                      <td className="font-outfit text-primary fw-semibold">{s.usn}</td>
                      <td className="text-muted">{s.contact || 'N/A'}</td>
                      <td className="text-center">
                        <span className="badge bg-secondary bg-opacity-10 text-secondary border px-3 py-1 rounded-pill">
                          {s.penaltyCount} {s.penaltyCount === 1 ? 'time' : 'times'}
                        </span>
                      </td>
                      <td className="pe-4 text-end">
                        <span className="fs-6 fw-bold text-danger font-outfit">
                          ₹{Number(s.totalFine).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      No student penalty summary records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Accruing Overdues Live Watchlist */}
      {activeTab === 'accruing' && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
            <div>
              <h6 className="fw-bold font-outfit mb-0 text-dark">
                <i className="bi bi-clock-history text-danger me-2"></i>
                Active Overdue Loans (Accruing Penalties)
              </h6>
              <small className="text-muted">Estimated fees calculating at ₹2.00 per late day until returned</small>
            </div>
            <span className="badge bg-danger bg-opacity-10 text-danger fw-bold px-3 py-1 rounded-pill">
              ₹{accruingFines.toFixed(2)} Estimated Accruing
            </span>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4">Tx ID</th>
                  <th>Student Info</th>
                  <th>Book Title</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th className="text-center">Days Overdue</th>
                  <th className="pe-4 text-end">Accrued Fine</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <span className="spinner-border spinner-border-sm me-2 text-primary" role="status"></span>
                      Checking active overdue loans...
                    </td>
                  </tr>
                ) : filteredAccruing.length > 0 ? (
                  filteredAccruing.map((o) => (
                    <tr key={o.id}>
                      <td className="ps-4 font-outfit fw-bold text-muted">#{o.id}</td>
                      <td>
                        <div className="fw-bold text-dark">{o.student?.name}</div>
                        <span className="font-outfit text-primary fs-8">{o.student?.usn}</span>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{o.book?.title}</div>
                        <small className="text-muted">{o.book?.author}</small>
                      </td>
                      <td>{o.issueDate}</td>
                      <td className="text-danger fw-semibold">{o.dueDate}</td>
                      <td className="text-center">
                        <span className="badge bg-danger text-white px-2 py-1">
                          +{o.daysOverdue} days late
                        </span>
                      </td>
                      <td className="pe-4 text-end">
                        <span className="fs-6 fw-bold text-danger font-outfit">
                          ₹{o.accruedFine.toFixed(2)}
                        </span>
                        <small className="text-muted d-block fs-8">unpaid (active)</small>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <i className="bi bi-emoji-smile fs-1 text-success d-block mb-2"></i>
                      All active loans are currently within the 15-day return window. No pending fines accruing!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
