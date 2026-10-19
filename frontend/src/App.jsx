import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Layouts
import { LibrarianLayout } from './layouts/LibrarianLayout';
import { StudentLayout } from './layouts/StudentLayout';

// Pages
import { Login } from './pages/Login';

// Librarian Pages
import { LibrarianDashboard } from './pages/librarian/Dashboard';
import { LibrarianRegisterStudent } from './pages/librarian/RegisterStudent';
import { LibrarianStudentCredentials } from './pages/librarian/StudentCredentials';
import { LibrarianBooks } from './pages/librarian/Books';
import { LibrarianTransactions } from './pages/librarian/Transactions';
import { LibrarianPenalties } from './pages/librarian/Penalties';

// Student Pages (Dashboard, catalog, my borrowed books, borrow book, return book, borrowing history, my profile, penalty fees)
import { StudentDashboard } from './pages/student/Dashboard';
import { StudentBooks } from './pages/student/Books';
import { StudentMyBooks } from './pages/student/MyBooks';
import { StudentBorrow } from './pages/student/Borrow';
import { StudentReturn } from './pages/student/Return';
import { StudentHistory } from './pages/student/History';
import { StudentProfile } from './pages/student/Profile';
import { StudentPenalties } from './pages/student/Penalties';

// Root Redirect Helper
const RootRedirect = () => {
  const { isAuthenticated, isLibrarian, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return isLibrarian ? (
    <Navigate to="/librarian/dashboard" replace />
  ) : (
    <Navigate to="/student/dashboard" replace />
  );
};

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Root path redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Librarian Routes */}
          <Route
            path="/librarian"
            element={
              <ProtectedRoute allowedRole="ROLE_LIBRARIAN">
                <LibrarianLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/librarian/dashboard" replace />} />
            <Route path="dashboard" element={<LibrarianDashboard />} />
            <Route path="register-student" element={<LibrarianRegisterStudent />} />
            <Route path="student-credentials" element={<LibrarianStudentCredentials />} />
            <Route path="books" element={<LibrarianBooks />} />
            <Route path="transactions" element={<LibrarianTransactions />} />
            <Route path="penalties" element={<LibrarianPenalties />} />
            {/* Redirect any legacy routes */}
            <Route path="borrow" element={<Navigate to="/librarian/dashboard" replace />} />
            <Route path="return" element={<Navigate to="/librarian/dashboard" replace />} />
            <Route path="students" element={<Navigate to="/librarian/student-credentials" replace />} />
          </Route>

          {/* Student Routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRole="ROLE_STUDENT">
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/student/dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="books" element={<StudentBooks />} />
            <Route path="my-books" element={<StudentMyBooks />} />
            <Route path="borrow" element={<StudentBorrow />} />
            <Route path="return" element={<StudentReturn />} />
            <Route path="history" element={<StudentHistory />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="penalties" element={<StudentPenalties />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
