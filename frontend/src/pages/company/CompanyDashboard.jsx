import React, { useEffect, useState } from "react";
import { useAuthStore } from "../../store/useAuthStore.js";
import { companyAPI } from "../../utils/api.js";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { HiOutlinePlus, HiOutlineBriefcase, HiOutlineClock, HiOutlineUsers } from "react-icons/hi";

const CompanyDashboard = () => {
  const { user } = useAuthStore();
  const [internships, setInternships] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [tab, setTab] = useState("internships");
  const [loading, setLoading] = useState(true);

  // ── Post modals state ─────────────────────────────────────────
  const [showModal, setShowModal] = useState(null); // "internship" | "job" | null
  const [form, setForm] = useState({ title: "", stipend: "", duration: "", description: "", job_title: "", salary: "", location: "" });
  const [postLoading, setPostLoading] = useState(false);
  const [postMsg, setPostMsg] = useState("");

  useEffect(() => {
    Promise.all([companyAPI.getInternships(), companyAPI.getJobs()])
      .then(([iRes, jRes]) => { setInternships(iRes.data.data); setJobs(jRes.data.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    setPostLoading(true);
    setPostMsg("");
    try {
      if (showModal === "internship") {
        const res = await companyAPI.postInternship({ title: form.title, stipend: form.stipend, duration: form.duration, description: form.description });
        setInternships((prev) => [res.data.data, ...prev]);
      } else {
        const res = await companyAPI.postJob({ job_title: form.job_title, salary: form.salary, location: form.location, description: form.description });
        setJobs((prev) => [res.data.data, ...prev]);
      }
      setShowModal(null);
      setForm({ title: "", stipend: "", duration: "", description: "", job_title: "", salary: "", location: "" });
    } catch (err) {
      setPostMsg(err.response?.data?.message || "Failed to create");
    } finally { setPostLoading(false); }
  };

  const listings = tab === "internships" ? internships : jobs;

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">Company Dashboard</h1>
          <p className="text-surface-500 mt-1">Welcome, {user?.name}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowModal("internship")} className="btn-primary">
            <HiOutlinePlus className="w-4 h-4" /> Post Internship
          </button>
          <button onClick={() => setShowModal("job")} className="btn-accent">
            <HiOutlinePlus className="w-4 h-4" /> Post Job
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-100 rounded-xl mb-6 max-w-xs">
        <button onClick={() => setTab("internships")} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === "internships" ? "bg-white shadow-soft text-surface-900" : "text-surface-500"}`}>
          <HiOutlineClock className="w-4 h-4 inline mr-1" /> Internships ({internships.length})
        </button>
        <button onClick={() => setTab("jobs")} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === "jobs" ? "bg-white shadow-soft text-surface-900" : "text-surface-500"}`}>
          <HiOutlineBriefcase className="w-4 h-4 inline mr-1" /> Jobs ({jobs.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-surface-400">Loading...</div>
      ) : listings.length === 0 ? (
        <div className="card p-10 text-center text-surface-400">No {tab} posted yet.</div>
      ) : (
        <div className="space-y-3">
          {listings.map((item) => (
            <div key={item.internship_id || item.job_id} className="card p-5 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-surface-900">{item.title || item.job_title}</h3>
                <p className="text-sm text-surface-500 mt-0.5">
                  {tab === "internships" ? `₹${item.stipend}/mo · ${item.duration || "N/A"}` : `₹${Number(item.salary).toLocaleString()}/yr · ${item.location || "N/A"}`}
                </p>
              </div>
              <StatusBadge status={item.status} />
            </div>
          ))}
        </div>
      )}

      {/* ── Post Modal ─────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowModal(null)}>
          <div className="card p-6 sm:p-8 w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-surface-900 mb-5">
              Post {showModal === "internship" ? "Internship" : "Job"}
            </h2>
            <form onSubmit={handlePost} className="space-y-4">
              {postMsg && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">{postMsg}</div>}

              {showModal === "internship" ? (
                <>
                  <div><label className="label">Title</label><input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label">Stipend (₹/mo)</label><input type="number" className="input-field" value={form.stipend} onChange={(e) => setForm({ ...form, stipend: e.target.value })} /></div>
                    <div><label className="label">Duration</label><input className="input-field" placeholder="e.g. 6 months" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div>
                  </div>
                </>
              ) : (
                <>
                  <div><label className="label">Job Title</label><input className="input-field" value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} required /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label">Salary (₹/yr)</label><input type="number" className="input-field" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} /></div>
                    <div><label className="label">Location</label><input className="input-field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
                  </div>
                </>
              )}
              <div><label className="label">Description</label><textarea className="input-field min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(null)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={postLoading} className="btn-primary flex-1">{postLoading ? "Creating..." : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDashboard;
