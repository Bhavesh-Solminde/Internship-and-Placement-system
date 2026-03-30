import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { studentAPI } from "../../utils/api.js";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { FileText } from "lucide-react";

const TABS = ["all", "pending", "shortlisted", "offered", "accepted", "rejected"];

const MyApplications = () => {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get("status") || "all";
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialStatus);

  useEffect(() => {
    studentAPI.getApplications().then(({ data }) => setApps(data.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = activeTab === "all" ? apps : apps.filter((a) => a.status === activeTab);

  if (loading) return <div className="page-container flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-surface-400">Loading applications...</div></div>;

  return (
    <div className="page-container animate-fade-in">
      <h1 className="page-title mb-6 flex items-center gap-2"><FileText className="w-5 h-5 text-brand-600" /> My Applications</h1>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((tab) => {
          const count = tab === "all" ? apps.length : apps.filter(a => a.status === tab).length;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${activeTab === tab ? "bg-brand-600 text-white" : "bg-surface-100 text-surface-600 hover:bg-surface-200"}`}>
              {tab} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-surface-400">No applications found{activeTab !== "all" ? ` with status "${activeTab}"` : ""}.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <Link key={app.application_id} to={`/student/applications/${app.application_id}`} className="card-hover p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-surface-900">{app.internship_title || app.job_title}</h3>
                <p className="text-sm text-surface-500 mt-0.5">
                  {app.company_name} · {app.application_type === "internship" ? `₹${app.stipend}/mo` : (app.salary != null ? `₹${Number(app.salary).toLocaleString()}/yr` : "Salary not disclosed")}
                </p>
                <p className="text-xs text-surface-400 mt-0.5">Applied {new Date(app.apply_date).toLocaleDateString("en-IN")}</p>
              </div>
              <StatusBadge status={app.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyApplications;
