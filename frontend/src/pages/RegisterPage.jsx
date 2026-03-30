import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore.js";
import { authAPI } from "../utils/api.js";
import { User, Mail, Lock, Phone, ArrowRight, GraduationCap, ClipboardList, Building2 } from "lucide-react";

const roles = [
  { value: "student",     label: "Student",     icon: GraduationCap },
  { value: "coordinator", label: "Coordinator", icon: ClipboardList },
  { value: "company",     label: "Company",     icon: Building2 },
];

const RegisterPage = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState("student");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", industry: "", location: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let res;
      if (activeRole === "student") {
        res = await authAPI.studentRegister({
          name: form.name, email: form.email, phone: form.phone, password: form.password,
        });
      } else if (activeRole === "coordinator") {
        res = await authAPI.coordinatorRegister({
          name: form.name, email: form.email, phone: form.phone, password: form.password,
        });
      } else {
        res = await authAPI.companyRegister({
          name: form.name, contact_email: form.email, password: form.password,
          industry: form.industry, location: form.location,
        });
      }

      const { user, token, role } = res.data.data;
      login(user, token, role);

      if (role === "student") navigate("/student/dashboard");
      else if (role === "coordinator") navigate("/coordinator/dashboard");
      else navigate("/company/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-surface-900">Create your account</h1>
          <p className="text-surface-500 mt-2">Join InternPlace and start your journey</p>
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
              <r.icon className="w-4 h-4 inline mr-1" /> {r.label}
            </button>
          ))}
        </div>

        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label className="label">{activeRole === "company" ? "Company Name" : "Full Name"}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-300 w-5 h-5" />
                <input name="name" className="input-field pl-10" placeholder={activeRole === "company" ? "Infosys Limited" : "John Doe"} value={form.name} onChange={handleChange} required />
              </div>
            </div>

            <div>
              <label className="label">{activeRole === "company" ? "Contact Email" : "Email"}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-300 w-5 h-5" />
                <input name="email" type="email" className="input-field pl-10" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
              </div>
            </div>

            {activeRole !== "company" && (
              <div>
                <label className="label">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-300 w-5 h-5" />
                  <input name="phone" className="input-field pl-10" placeholder="9876543210" value={form.phone} onChange={handleChange} />
                </div>
              </div>
            )}

            {activeRole === "company" && (
              <>
                <div>
                  <label className="label">Industry</label>
                  <input name="industry" className="input-field" placeholder="e.g. IT Services" value={form.industry} onChange={handleChange} />
                </div>
                <div>
                  <label className="label">Location</label>
                  <input name="location" className="input-field" placeholder="e.g. Bengaluru" value={form.location} onChange={handleChange} />
                </div>
              </>
            )}

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-300 w-5 h-5" />
                <input name="password" type="password" className="input-field pl-10" placeholder="Min 6 characters" value={form.password} onChange={handleChange} required minLength={6} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? "Creating account..." : "Create Account"} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-sm text-surface-500 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
