import React, { useEffect, useState } from "react";
import { coordinatorAPI } from "../../utils/api.js";
import StatsWidget from "../../components/shared/StatsWidget.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { Users, Building2, FileText, CheckCircle } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const STATUS_COLORS = {
  Pending: "#6366f1",
  Shortlisted: "#f59e0b",
  Offered: "#8b5cf6",
  Accepted: "#10b981",
  Rejected: "#ef4444",
};

const AnalyticsDashboard = () => {
  const [report, setReport] = useState(null);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([coordinatorAPI.getReports(), coordinatorAPI.getApplications()])
      .then(([rRes, aRes]) => { setReport(rRes.data.data); setApps(aRes.data.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-container text-center py-20 text-surface-400">Loading analytics...</div>;

  const appTypeData = [
    { name: "Internships", value: Number(report?.internship_apps) || 0, fill: "#6366f1" },
    { name: "Jobs", value: Number(report?.job_apps) || 0, fill: "#f59e0b" },
  ];

  const statusData = [
    { name: "Pending", value: Number(report?.pending) || 0 },
    { name: "Shortlisted", value: Number(report?.shortlisted || 0) },
    { name: "Offered", value: Number(report?.offered) || 0 },
    { name: "Accepted", value: Number(report?.accepted) || 0 },
    { name: "Rejected", value: Number(report?.rejected) || 0 },
  ].filter((d) => d.value > 0);

  const offerData = [
    { name: "Issued", count: Number(report?.total_offers) || 0, fill: "#6366f1" },
    { name: "Accepted", count: Number(report?.offers_accepted) || 0, fill: "#10b981" },
    { name: "Rejected", count: Number(report?.offers_rejected) || 0, fill: "#ef4444" },
  ];

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-8">
        <h1 className="page-title">Analytics Dashboard</h1>
        <p className="text-surface-500 mt-1">System-wide placement analytics and insights</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatsWidget icon={Users} label="Students" value={report?.total_students} color="brand" />
        <StatsWidget icon={Building2} label="Companies" value={report?.total_companies} color="accent" />
        <StatsWidget icon={FileText} label="Applications" value={report?.total_applications} color="purple" />
        <StatsWidget icon={CheckCircle} label="Offers Accepted" value={report?.offers_accepted} color="green" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-10">
        {/* App Type Bar */}
        <div className="card p-6">
          <h2 className="section-title mb-4">Application Types</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={appTypeData} barSize={48}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 13 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 13 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB" }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {appTypeData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Pie — fixed color mapping */}
        <div className="card p-6">
          <h2 className="section-title mb-4">Status Distribution</h2>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] || "#6b7280"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-surface-400">No data yet</div>
          )}
        </div>
      </div>

      {/* Offer Outcomes — explicit fill per cell */}
      <div className="card p-6 mb-10">
        <h2 className="section-title mb-4">Offer Outcomes</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={offerData} barSize={48}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" tick={{ fontSize: 13 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 13 }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB" }} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {offerData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Applications Table */}
      <div className="card p-6">
        <h2 className="section-title mb-4">Recent Applications</h2>
        {apps.length === 0 ? (
          <div className="text-center py-8 text-surface-400">No applications yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 text-left text-surface-500">
                  <th className="pb-3 font-medium">Student</th>
                  <th className="pb-3 font-medium">Position</th>
                  <th className="pb-3 font-medium">Company</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Applied</th>
                </tr>
              </thead>
              <tbody>
                {apps.slice(0, 15).map((app) => (
                  <tr key={app.application_id} className="border-b border-surface-100 hover:bg-surface-50">
                    <td className="py-3 font-medium text-surface-900">{app.student_name}</td>
                    <td className="py-3 text-surface-600">{app.internship_title || app.job_title}</td>
                    <td className="py-3 text-surface-600">{app.company_name}</td>
                    <td className="py-3"><span className="capitalize text-xs font-medium bg-surface-100 text-surface-600 px-2 py-0.5 rounded-full">{app.application_type}</span></td>
                    <td className="py-3"><StatusBadge status={app.status} /></td>
                    <td className="py-3 text-surface-400 text-xs">{new Date(app.apply_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
