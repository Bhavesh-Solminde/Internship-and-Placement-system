import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore.js";
import { getDashboardPath } from "./utils/navigation.js";
import Navbar from "./components/layout/Navbar.jsx";

// Pages
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";

// Student
import StudentDashboard from "./pages/student/StudentDashboard.jsx";
import EditProfile from "./pages/student/EditProfile.jsx";
import InternshipListing from "./pages/student/InternshipListing.jsx";
import InternshipDetail from "./pages/student/InternshipDetail.jsx";
import JobListing from "./pages/student/JobListing.jsx";
import JobDetail from "./pages/student/JobDetail.jsx";
import MyApplications from "./pages/student/MyApplications.jsx";
import ApplicationDetail from "./pages/student/ApplicationDetail.jsx";
import StudentChat from "./pages/student/StudentChat.jsx";

// Company
import CompanyDashboard from "./pages/company/CompanyDashboard.jsx";
import ApplicantsPage from "./pages/company/ApplicantsPage.jsx";
import PostListingPage from "./pages/company/PostListingPage.jsx";
import CompanyAnalytics from "./pages/company/CompanyAnalytics.jsx";
import CompanyChat from "./pages/company/CompanyChat.jsx";
import CompanyProfile from "./pages/company/CompanyProfile.jsx";

// Coordinator
import CoordinatorDashboard from "./pages/coordinator/CoordinatorDashboard.jsx";
import ManageStudents from "./pages/coordinator/ManageStudents.jsx";
import ManageCompanies from "./pages/coordinator/ManageCompanies.jsx";
import ManageApplications from "./pages/coordinator/ManageApplications.jsx";
import ReportsPage from "./pages/coordinator/ReportsPage.jsx";
import AnalyticsDashboard from "./pages/coordinator/AnalyticsDashboard.jsx";

// ── Route Guard ──────────────────────────────────────────────────────
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, role } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(role)) return <Navigate to="/" replace />;
  return children;
};

/** Redirect authenticated users from `/` to their dashboard */
const RootRedirect = () => {
  const { isAuthenticated, role } = useAuthStore();
  if (isAuthenticated) return <Navigate to={getDashboardPath(role)} replace />;
  return <LandingPage />;
};

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/" element={<RootRedirect />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/internships" element={<InternshipListing />} />
    <Route path="/internships/:id" element={<InternshipDetail />} />
    <Route path="/jobs" element={<JobListing />} />
    <Route path="/jobs/:id" element={<JobDetail />} />
    <Route path="/companies/:id" element={<CompanyProfile />} />

    {/* Student */}
    <Route path="/student/dashboard" element={<ProtectedRoute roles={["student"]}><StudentDashboard /></ProtectedRoute>} />
    <Route path="/student/profile/edit" element={<ProtectedRoute roles={["student"]}><EditProfile /></ProtectedRoute>} />
    <Route path="/student/applications" element={<ProtectedRoute roles={["student"]}><MyApplications /></ProtectedRoute>} />
    <Route path="/student/applications/:id" element={<ProtectedRoute roles={["student"]}><ApplicationDetail /></ProtectedRoute>} />
    <Route path="/student/chat" element={<ProtectedRoute roles={["student"]}><StudentChat /></ProtectedRoute>} />

    {/* Company */}
    <Route path="/company/dashboard" element={<ProtectedRoute roles={["company"]}><CompanyDashboard /></ProtectedRoute>} />
    <Route path="/company/listings/:type/:id/applicants" element={<ProtectedRoute roles={["company"]}><ApplicantsPage /></ProtectedRoute>} />
    <Route path="/company/post/:type" element={<ProtectedRoute roles={["company"]}><PostListingPage /></ProtectedRoute>} />
    <Route path="/company/analytics" element={<ProtectedRoute roles={["company"]}><CompanyAnalytics /></ProtectedRoute>} />
    <Route path="/company/chat" element={<ProtectedRoute roles={["company"]}><CompanyChat /></ProtectedRoute>} />

    {/* Coordinator */}
    <Route path="/coordinator/dashboard" element={<ProtectedRoute roles={["coordinator"]}><CoordinatorDashboard /></ProtectedRoute>} />
    <Route path="/coordinator/students" element={<ProtectedRoute roles={["coordinator"]}><ManageStudents /></ProtectedRoute>} />
    <Route path="/coordinator/companies" element={<ProtectedRoute roles={["coordinator"]}><ManageCompanies /></ProtectedRoute>} />
    <Route path="/coordinator/applications" element={<ProtectedRoute roles={["coordinator"]}><ManageApplications /></ProtectedRoute>} />
    <Route path="/coordinator/reports" element={<ProtectedRoute roles={["coordinator"]}><ReportsPage /></ProtectedRoute>} />
    <Route path="/coordinator/analytics" element={<ProtectedRoute roles={["coordinator"]}><AnalyticsDashboard /></ProtectedRoute>} />

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