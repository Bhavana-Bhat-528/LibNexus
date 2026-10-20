import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LibrarianLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const alertError = location.state?.error;

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Top Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4 py-2 border-bottom border-secondary border-opacity-25 sticky-top">
        <div className="container-fluid px-0">
          <div className="navbar-brand d-flex align-items-center gap-2 font-outfit">
            <div className="bg-primary text-white rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
              <i className="bi bi-journal-bookmark-fill fs-5"></i>
            </div>
            <div>
              <span className="fw-bold tracking-wide text-white">LIB</span>
              <span className="text-primary fw-bold">NEXUS</span>
              <span className="badge bg-primary bg-opacity-25 text-primary-light ms-2 fs-8 fw-semibold border border-primary border-opacity-25">
                LIBRARIAN PORTAL
              </span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3 ms-auto">
            <div className="d-flex align-items-center gap-2 bg-dark bg-opacity-50 px-3 py-1 rounded-pill border border-secondary border-opacity-25 text-white-50 fs-7">
              <span className="d-inline-block rounded-circle bg-success" style={{ width: '8px', height: '8px' }}></span>
              <span>System Online</span>
            </div>

            <div className="dropdown">
              <button
                className="btn btn-outline-light btn-sm rounded-pill d-flex align-items-center gap-2 px-3 py-1 dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bi bi-person-circle fs-6"></i>
                <span className="fw-medium">{user?.username || 'Librarian'}</span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
                <li className="px-3 py-2 text-muted fs-8 border-bottom">
                  Signed in as <strong>{user?.username}</strong>
                  <div className="badge bg-secondary mt-1">Librarian / Staff</div>
                </li>
                <li>
                  <button className="dropdown-item text-danger d-flex align-items-center gap-2 py-2" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right"></i> Sign Out
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Workspace Layout */}
      <div className="d-flex flex-grow-1">
        {/* Sidebar Navigation */}
        <aside className="app-sidebar py-3 d-flex flex-column justify-content-between">
          <div>
            <div className="px-4 mb-3 text-uppercase fs-8 fw-bold" style={{ letterSpacing: '0.08em', color: '#ffffff' }}>
              Main Navigation
            </div>
            <ul className="nav flex-column sidebar-nav list-unstyled">
              <li>
                <NavLink to="/librarian/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <i className="bi bi-grid-1x2-fill"></i>
                  <span>Dashboard</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/librarian/register-student" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <i className="bi bi-person-plus-fill text-primary"></i>
                  <span>Register Student & Give Password</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/librarian/student-credentials" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <i className="bi bi-key-fill text-info"></i>
                  <span>Student Credentials & Passwords</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/librarian/books" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <i className="bi bi-book-half"></i>
                  <span>Books Catalog & Stock</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/librarian/transactions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <i className="bi bi-receipt-cutoff"></i>
                  <span>Transaction Audits</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/librarian/penalties" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <i className="bi bi-cash-coin text-warning"></i>
                  <span>Collected Penalties Ledger</span>
                </NavLink>
              </li>
            </ul>
          </div>

          <div className="p-3 mx-2 rounded-3 bg-dark bg-opacity-50 border border-secondary border-opacity-25 text-white-50 fs-8">
            <div className="fw-bold text-light mb-1"><i className="bi bi-shield-check text-primary me-1"></i> Policy Summary</div>
            <div>• Borrow limit: <strong>3 books</strong></div>
            <div>• Loan duration: <strong>15 days</strong></div>
            <div>• Late fee: <strong>₹2.00 / day</strong></div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-grow-1 p-4 bg-light overflow-auto" style={{ minWidth: 0 }}>
          {alertError && (
            <div className="alert alert-warning alert-dismissible fade show border-0 shadow-sm mb-4" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i> {alertError}
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
};
