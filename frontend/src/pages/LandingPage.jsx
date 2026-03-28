import React from "react";
import { Link } from "react-router-dom";
import { HiOutlineBriefcase, HiOutlineAcademicCap, HiOutlineClipboardList, HiOutlineUserGroup, HiOutlineArrowRight, HiOutlineCheckCircle } from "react-icons/hi";

const features = [
  {
    icon: HiOutlineBriefcase,
    title: "Browse Opportunities",
    desc: "Explore internships and full-time jobs from top companies, all in one place.",
    color: "text-brand-600 bg-brand-50",
  },
  {
    icon: HiOutlineClipboardList,
    title: "Track Applications",
    desc: "Follow every stage — from application to interview to offer to onboarding.",
    color: "text-accent-600 bg-orange-50",
  },
  {
    icon: HiOutlineUserGroup,
    title: "Coordinator Oversight",
    desc: "Coordinators manage students, companies, and monitor placement performance.",
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    icon: HiOutlineAcademicCap,
    title: "Seamless Onboarding",
    desc: "Once you accept an offer, the system guides you through the full onboarding flow.",
    color: "text-purple-600 bg-purple-50",
  },
];

const stats = [
  { value: "500+", label: "Companies" },
  { value: "10K+", label: "Students" },
  { value: "95%", label: "Placement Rate" },
  { value: "24h", label: "Avg Response" },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-brand-100/50" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-brand-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-accent-400/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100/80 text-brand-700 text-sm font-medium mb-6">
              <HiOutlineCheckCircle className="w-4 h-4" />
              Trusted by 500+ companies
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-surface-900 leading-tight tracking-tight">
              Your path to the
              <span className="bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent"> perfect career</span>
              {" "}starts here
            </h1>

            <p className="mt-6 text-lg text-surface-600 max-w-2xl mx-auto leading-relaxed">
              Connect with top companies, discover internships and job opportunities,
              and track your entire journey from application to onboarding — all in one platform.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="btn-primary text-base px-8 py-3">
                Get Started Free <HiOutlineArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/internships" className="btn-secondary text-base px-8 py-3">
                Browse Internships
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto animate-slide-up">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-brand-700">{s.value}</div>
                <div className="text-sm text-surface-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-surface-900">
              Everything you need, in one platform
            </h2>
            <p className="mt-3 text-surface-500 max-w-xl mx-auto">
              From discovering opportunities to getting onboarded — we handle the entire lifecycle.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="card-hover p-6 group"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-surface-900 mb-2">{f.title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card p-10 sm:p-14 text-center bg-gradient-to-br from-brand-600 to-brand-800 border-0">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to kickstart your career?
            </h2>
            <p className="text-brand-200 mb-8 max-w-lg mx-auto">
              Join thousands of students who've already landed their dream internships and jobs through our platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="btn bg-white text-brand-700 hover:bg-brand-50 px-8 py-3 text-base">
                Create Account
              </Link>
              <Link to="/jobs" className="btn border border-brand-400 text-white hover:bg-brand-700 px-8 py-3 text-base">
                Browse Jobs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="py-8 border-t border-surface-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-surface-400">
          © {new Date().getFullYear()} InternPlace — Internship & Job Management System
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
