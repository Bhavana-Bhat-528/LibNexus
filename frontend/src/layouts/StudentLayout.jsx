import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const StudentLayout = () => {
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
            <div className="bg-success text-white rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
              <i className="bi bi-mortarboard-fill fs-5"></i>
            </div>
            <div>
              <span className="fw-bold tracking-wide text-white">LIB</span>
              <span className="text-success fw-bold">NEXUS</span>
              <span className="badge bg-success bg-opacity-25 text-success ms-2 fs-8 fw-semibold border border-success border-opacity-25">
                STUDENT PORTAL
              </span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3 ms-auto">
            {user?.studentUsn && (
              <div className="d-none d-md-flex align-items-center gap-2 bg-dark bg-opacity-50 px-3 py-1 rounded-pill border border-secondary border-opacity-25 text-white-50 fs-7">
                <i className="bi bi-card-text text-success"></i>
                <span>USN: <strong className="text-white">{user.studentUsn}</strong></span>
              </div>
            )}

            <div className="dropdown">
              <button
                className="btn btn-outline-light btn-sm rounded-pill d-flex align-items-center gap-2 px-3 py-1 dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bi bi-person-circle fs-6"></i>
                <span className="fw-medium">{user?.studentName || user?.username}</span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
                <li className="px-3 py-2 text-muted fs-8 border-bottom">
                  Signed in as <strong>{user?.username}</strong>
                  {user?.studentUsn && <div className="text-dark fw-bold">USN: {user.studentUsn}</div>}
                  <div className="badge bg-success mt-1">Student Member</div>
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
              Student Services
            </div>
            <ul className="nav flex-column sidebar-nav list-unstyled">
              <li>
                <NavLink to="/student/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <i className="bi bi-speedometer2"></i>
                  <span>Dashboard</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/student/books" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <i className="bi bi-book-half"></i>
                  <span>Books Catalog</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/student/my-books" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <i className="bi bi-journal-bookmark-fill text-warning"></i>
                  <span>My Borrowed Books</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/student/borrow" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <i className="bi bi-arrow-up-right-circle-fill text-primary"></i>
                  <span>Borrow Book</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/student/return" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <i className="bi bi-arrow-down-left-circle-fill text-success"></i>
                  <span>Return Book</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/student/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <i className="bi bi-clock-history text-info"></i>
                  <span>Borrowing History</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/student/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <i className="bi bi-person-badge"></i>
                  <span>My Profile</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/student/penalties" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <i className="bi bi-cash-coin text-warning"></i>
                  <span>Penalty Fees</span>
                </NavLink>
              </li>
            </ul>
          </div>

          <div className="p-3 mx-2 rounded-3 bg-dark bg-opacity-50 border border-secondary border-opacity-25 text-white-50 fs-8">
            <div className="fw-bold text-success mb-1"><i className="bi bi-info-circle-fill me-1"></i> Loan Guidelines</div>
            <div>• Maximum quota: <strong>3 books</strong></div>
            <div>• Return window: <strong>15 days</strong></div>
            <div>• Overdue penalty: <strong>₹2.00 / day</strong></div>
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
