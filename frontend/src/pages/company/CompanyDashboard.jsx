import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore.js";
import { companyAPI } from "../../utils/api.js";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { Plus, Briefcase, Clock, Users, TrendingUp, Calendar, ArrowRight } from "lucide-react";

const CompanyDashboard = () => {
  const { user } = useAuthStore();
  const [internships, setInternships] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [tab, setTab] = useState("internships");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([companyAPI.getInternships(), companyAPI.getJobs()])
      .then(([iRes, jRes]) => { setInternships(iRes.data.data); setJobs(jRes.data.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const listings = tab === "internships" ? internships : jobs;
  const isExpired = (d) => d && new Date(d) < new Date();

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">Company Dashboard</h1>
          <p className="text-surface-500 mt-1">Welcome, {user?.name}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/company/post/internship" className="btn-primary">
            <Plus className="w-4 h-4" /> Post Internship
          </Link>
          <Link to="/company/post/job" className="btn-accent">
            <Plus className="w-4 h-4" /> Post Job
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Link to="/company/analytics" className="card-hover p-5 flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-100 text-brand-700 rounded-xl flex items-center justify-center"><TrendingUp className="w-5 h-5" /></div>
            <div><h3 className="font-semibold text-surface-900">Analytics</h3><p className="text-xs text-surface-500">View hiring insights</p></div>
          </div>
          <ArrowRight className="w-4 h-4 text-surface-300 group-hover:text-brand-600 transition-colors" />
        </Link>
        <div className="card p-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center"><Clock className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold text-surface-900">{internships.length}</p><p className="text-xs text-surface-500">Internships</p></div>
        </div>
        <div className="card p-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center"><Briefcase className="w-5 h-5" /></div>
          <div><p className="text-2xl font-bold text-surface-900">{jobs.length}</p><p className="text-xs text-surface-500">Jobs</p></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-100 rounded-xl mb-6 max-w-xs">
        <button onClick={() => setTab("internships")} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === "internships" ? "bg-white shadow-soft text-surface-900" : "text-surface-500"}`}>
          <Clock className="w-4 h-4 inline mr-1" /> Internships ({internships.length})
        </button>
        <button onClick={() => setTab("jobs")} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === "jobs" ? "bg-white shadow-soft text-surface-900" : "text-surface-500"}`}>
          <Briefcase className="w-4 h-4 inline mr-1" /> Jobs ({jobs.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-surface-400">Loading...</div>
      ) : listings.length === 0 ? (
        <div className="card p-10 text-center text-surface-400">No {tab} posted yet.</div>
      ) : (
        <div className="space-y-3">
          {listings.map((item) => {
            const itemId = item.internship_id || item.job_id;
            const itemType = tab === "internships" ? "internships" : "jobs";
            const expired = isExpired(item.deadline);
            return (
              <div key={itemId} className={`card p-5 flex items-center justify-between ${expired ? "opacity-60" : ""}`}>
                <div>
                  <h3 className="font-medium text-surface-900">{item.title || item.job_title}</h3>
                  <div className="flex items-center gap-2 text-sm text-surface-500 mt-0.5">
                    <span>{tab === "internships" ? `₹${item.stipend}/mo · ${item.duration || "N/A"}` : `${item.salary != null ? `₹${Number(item.salary).toLocaleString()}/yr` : "Salary not disclosed"} · ${item.location || "N/A"}`}</span>
                    {Number(item.required_experience_years) > 0 && <span>· {item.required_experience_years}+ yrs</span>}
                    {item.deadline && (
                      <span className={`flex items-center gap-0.5 text-xs ${expired ? "text-red-500" : "text-orange-600"}`}>
                        <Calendar className="w-3 h-3" />{expired ? "Expired" : `Deadline: ${new Date(item.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link to={`/company/listings/${itemType}/${itemId}/applicants`} className="btn-ghost text-xs py-1.5 px-3">
                    <Users className="w-4 h-4" /> Applicants
                  </Link>
                  <StatusBadge status={item.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CompanyDashboard;
