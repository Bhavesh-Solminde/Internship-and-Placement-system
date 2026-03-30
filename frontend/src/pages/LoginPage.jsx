import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore.js";
import { authAPI } from "../utils/api.js";
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineArrowRight } from "react-icons/hi";

const roles = [
  { value: "student",     label: "Student",     emoji: "🎓" },
  { value: "coordinator", label: "Coordinator", emoji: "📋" },
  { value: "company",     label: "Company",     emoji: "🏢" },
];

const LoginPage = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDemoLogin = (role, demoEmail) => {
    setActiveRole(role);
    setEmail(demoEmail);
    setPassword("password123");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let res;
      if (activeRole === "student") {
        res = await authAPI.studentLogin({ email, password });
      } else if (activeRole === "coordinator") {
        res = await authAPI.coordinatorLogin({ email, password });
      } else {
        res = await authAPI.companyLogin({ email, password });
      }

      const { user, token, role } = res.data.data;
      login(user, token, role);

      if (role === "student") navigate("/student/dashboard");
      else if (role === "coordinator") navigate("/coordinator/dashboard");
      else navigate("/company/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-surface-900">Welcome back</h1>
          <p className="text-surface-500 mt-2">Sign in to continue to your dashboard</p>
        </div>

        {/* Role Tabs */}
        <div className="flex gap-1 p-1 bg-surface-100 rounded-xl mb-6">
          {roles.map((r) => (
            <button
              key={r.value}
              onClick={() => { setActiveRole(r.value); setError(""); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeRole === r.value
                  ? "bg-white shadow-soft text-surface-900"
                  : "text-surface-500 hover:text-surface-700"
              }`}
            >
              {r.emoji} {r.label}
            </button>
          ))}
        </div>

        <div className="card p-6 sm:p-8">
          {/* Demo Login Shortcuts */}
          <div className="mb-6 p-4 bg-brand-50 rounded-xl border border-brand-100">
            <p className="text-xs font-semibold text-brand-700 mb-2 uppercase tracking-wide">Developer Demo Login</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => handleDemoLogin("student", "rahul@student.edu")} className="btn-secondary text-xs py-1.5 px-3">🎓 Student</button>
              <button type="button" onClick={() => handleDemoLogin("coordinator", "coordinator@college.edu")} className="btn-secondary text-xs py-1.5 px-3">📋 Coordinator</button>
              <button type="button" onClick={() => handleDemoLogin("company", "hr@infosys.com")} className="btn-secondary text-xs py-1.5 px-3">🏢 Company</button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label className="label">
                {activeRole === "company" ? "Contact Email" : "Email Address"}
              </label>
              <div className="relative">
                <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-300 w-5 h-5" />
                <input
                  type="email"
                  className="input-field pl-10"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-300 w-5 h-5" />
                <input
                  type="password"
                  className="input-field pl-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? "Signing in..." : "Sign In"} <HiOutlineArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-sm text-surface-500 mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-brand-600 font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
