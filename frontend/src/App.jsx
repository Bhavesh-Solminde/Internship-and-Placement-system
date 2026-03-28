import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore.js";
import Navbar from "./components/layout/Navbar.jsx";

// Pages
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";

// Student
import StudentDashboard from "./pages/student/StudentDashboard.jsx";
import InternshipListing from "./pages/student/InternshipListing.jsx";
import InternshipDetail from "./pages/student/InternshipDetail.jsx";
import JobListing from "./pages/student/JobListing.jsx";
import JobDetail from "./pages/student/JobDetail.jsx";
import MyApplications from "./pages/student/MyApplications.jsx";

// Company
import CompanyDashboard from "./pages/company/CompanyDashboard.jsx";

// Coordinator
import CoordinatorDashboard from "./pages/coordinator/CoordinatorDashboard.jsx";
import ManageStudents from "./pages/coordinator/ManageStudents.jsx";
import ManageCompanies from "./pages/coordinator/ManageCompanies.jsx";
import ManageApplications from "./pages/coordinator/ManageApplications.jsx";
import ReportsPage from "./pages/coordinator/ReportsPage.jsx";

// ── Route Guard ──────────────────────────────────────────────────────
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, role } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(role)) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/internships" element={<InternshipListing />} />
    <Route path="/internships/:id" element={<InternshipDetail />} />
    <Route path="/jobs" element={<JobListing />} />
    <Route path="/jobs/:id" element={<JobDetail />} />

    {/* Student */}
    <Route path="/student/dashboard" element={<ProtectedRoute roles={["student"]}><StudentDashboard /></ProtectedRoute>} />
    <Route path="/student/applications" element={<ProtectedRoute roles={["student"]}><MyApplications /></ProtectedRoute>} />
    <Route path="/student/applications/:id" element={<ProtectedRoute roles={["student"]}><StudentDashboard /></ProtectedRoute>} />

    {/* Company */}
    <Route path="/company/dashboard" element={<ProtectedRoute roles={["company"]}><CompanyDashboard /></ProtectedRoute>} />

    {/* Coordinator */}
    <Route path="/coordinator/dashboard" element={<ProtectedRoute roles={["coordinator"]}><CoordinatorDashboard /></ProtectedRoute>} />
    <Route path="/coordinator/students" element={<ProtectedRoute roles={["coordinator"]}><ManageStudents /></ProtectedRoute>} />
    <Route path="/coordinator/companies" element={<ProtectedRoute roles={["coordinator"]}><ManageCompanies /></ProtectedRoute>} />
    <Route path="/coordinator/applications" element={<ProtectedRoute roles={["coordinator"]}><ManageApplications /></ProtectedRoute>} />
    <Route path="/coordinator/reports" element={<ProtectedRoute roles={["coordinator"]}><ReportsPage /></ProtectedRoute>} />

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <div className="min-h-screen bg-surface-50 font-body">
      <Navbar />
      <AppRoutes />
    </div>
  </BrowserRouter>
);

export default App;