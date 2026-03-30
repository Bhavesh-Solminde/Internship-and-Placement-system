import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore.js";
import { Menu, X, LogOut, GraduationCap } from "lucide-react";

const Navbar = () => {
  const { isAuthenticated, role, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/login"); };
  const isActive = (path) => location.pathname.startsWith(path);
  const navLink = (to, label) => (
    <Link key={to} to={to} onClick={() => setMobileOpen(false)}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(to) ? "bg-brand-100 text-brand-700" : "text-surface-600 hover:text-surface-900 hover:bg-surface-100"}`}>
      {label}
    </Link>
  );

  const getLinks = () => {
    if (!isAuthenticated) return [navLink("/internships", "Internships"), navLink("/jobs", "Jobs")];
    if (role === "student") return [navLink("/student/dashboard", "Dashboard"), navLink("/internships", "Internships"), navLink("/jobs", "Jobs"), navLink("/student/applications", "My Applications")];
    if (role === "company") return [navLink("/company/dashboard", "Dashboard"), navLink("/company/analytics", "Analytics")];
    if (role === "coordinator") return [navLink("/coordinator/dashboard", "Dashboard"), navLink("/coordinator/students", "Students"), navLink("/coordinator/companies", "Companies"), navLink("/coordinator/applications", "Applications"), navLink("/coordinator/reports", "Reports"), navLink("/coordinator/analytics", "Analytics")];
    return [];
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-surface-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-surface-900 hidden sm:block">SmartNiyukti</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">{getLinks()}</div>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-50 border border-surface-200">
                  <div className="w-6 h-6 rounded-full bg-brand-200 flex items-center justify-center">
                    <span className="text-xs font-bold text-brand-700">{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
                  </div>
                  <span className="text-sm font-medium text-surface-700">{user?.name || user?.contact_email || "User"}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-brand-100 text-brand-600 font-semibold capitalize">{role}</span>
                </div>
                <button onClick={handleLogout} className="btn-ghost text-surface-500 !px-2.5"><LogOut className="w-5 h-5" /></button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">Sign In</Link>
                <Link to="/register" className="btn-primary">Get Started</Link>
              </>
            )}
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg hover:bg-surface-100">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-surface-100 animate-slide-down">
          <div className="px-4 py-3 flex flex-col gap-1">
            {getLinks()}
            {isAuthenticated ? (
              <button onClick={handleLogout} className="btn-ghost text-red-500 mt-2 justify-start"><LogOut className="w-5 h-5" /> Sign Out</button>
            ) : (
              <div className="flex flex-col gap-2 mt-3">
                <Link to="/login" className="btn-secondary" onClick={() => setMobileOpen(false)}>Sign In</Link>
                <Link to="/register" className="btn-primary" onClick={() => setMobileOpen(false)}>Get Started</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
