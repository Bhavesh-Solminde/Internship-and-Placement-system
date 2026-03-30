import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore.js";
import { studentAPI } from "../../utils/api.js";
import StatsWidget from "../../components/shared/StatsWidget.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import MatchResults from "../../components/dashboard/MatchResults.jsx";
import { FileText, ClipboardCheck, MessageSquare, Star, Briefcase, ArrowRight, Pencil } from "lucide-react";

const StudentDashboard = () => {
  const { user, updateUser } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, appsRes, profileRes] = await Promise.all([
          studentAPI.getDashboard(),
          studentAPI.getApplications(),
          studentAPI.getProfile(),
        ]);
        setStats(dashRes.data.data);
        setApps(appsRes.data.data.slice(0, 5));
        updateUser(profileRes.data.data);
      } catch (err) { console.error("Failed to fetch dashboard:", err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-surface-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">Welcome back, {user?.name?.split(" ")[0]}</h1>
          <p className="text-surface-500 mt-1">Here's a snapshot of your placement journey.</p>
        </div>
        <Link to="/student/profile/edit" className="btn-secondary">
          <Pencil className="w-4 h-4" /> Edit Profile
        </Link>
      </div>

      {/* Clickable Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        <Link to="/student/applications?status=all">
          <StatsWidget icon={FileText} label="Applied" value={stats?.total_applied} color="brand" />
        </Link>
        <Link to="/student/applications?status=shortlisted">
          <StatsWidget icon={ClipboardCheck} label="Shortlisted" value={stats?.shortlisted} color="blue" />
        </Link>
        <Link to="/student/applications?status=all">
          <StatsWidget icon={MessageSquare} label="Interviews" value={stats?.total_interviews} color="purple" />
        </Link>
        <Link to="/student/applications?status=offered">
          <StatsWidget icon={Star} label="Offers" value={stats?.offered} color="accent" />
        </Link>
        <Link to="/student/applications?status=accepted">
          <StatsWidget icon={Briefcase} label="Accepted" value={stats?.accepted} color="green" />
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <Link to="/internships" className="card-hover p-5 flex items-center justify-between group">
          <div>
            <h3 className="font-semibold text-surface-900">Browse Internships</h3>
            <p className="text-sm text-surface-500 mt-1">Find your next internship opportunity</p>
          </div>
          <ArrowRight className="w-5 h-5 text-surface-300 group-hover:text-brand-600 transition-colors" />
        </Link>
        <Link to="/jobs" className="card-hover p-5 flex items-center justify-between group">
          <div>
            <h3 className="font-semibold text-surface-900">Browse Jobs</h3>
            <p className="text-sm text-surface-500 mt-1">Explore full-time job openings</p>
          </div>
          <ArrowRight className="w-5 h-5 text-surface-300 group-hover:text-brand-600 transition-colors" />
        </Link>
      </div>

      {/* Match Results */}
      <div className="mb-10"><MatchResults /></div>

      {/* Recent Applications */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Recent Applications</h2>
          <Link to="/student/applications" className="text-sm text-brand-600 hover:underline font-medium">View all</Link>
        </div>
        {apps.length === 0 ? (
          <div className="card p-8 text-center text-surface-400">No applications yet. Start by browsing internships or jobs!</div>
        ) : (
          <div className="space-y-3">
            {apps.map((app) => (
              <Link key={app.application_id} to={`/student/applications/${app.application_id}`} className="card-hover p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-surface-900">{app.internship_title || app.job_title}</h3>
                  <p className="text-sm text-surface-500 mt-0.5">{app.company_name} · {app.application_type === "internship" ? `₹${app.stipend}/mo` : (app.salary != null ? `₹${Number(app.salary).toLocaleString()}/yr` : "Salary not disclosed")}</p>
                </div>
                <StatusBadge status={app.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
