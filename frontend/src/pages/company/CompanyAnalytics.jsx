import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { companyAPI } from "../../utils/api.js";
import { ArrowLeft, Users, Briefcase, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4"];

const CompanyAnalytics = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    companyAPI.getAnalytics().then(({ data: res }) => { setData(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-container flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-surface-400">Loading analytics...</div></div>;
  if (!data) return <div className="page-container text-center text-surface-400">Failed to load analytics.</div>;

  const statusData = [
    { name: "Pending", value: Number(data.pending) || 0, color: "#6366f1" },
    { name: "Shortlisted", value: Number(data.shortlisted) || 0, color: "#f59e0b" },
    { name: "Offered", value: Number(data.offered) || 0, color: "#10b981" },
    { name: "Accepted", value: Number(data.accepted) || 0, color: "#06b6d4" },
    { name: "Rejected", value: Number(data.rejected) || 0, color: "#ef4444" },
  ].filter(d => d.value > 0);

  const offerData = [
    { name: "Issued", count: Number(data.total_offers) || 0, fill: "#6366f1" },
    { name: "Accepted", count: Number(data.offers_accepted) || 0, fill: "#10b981" },
    { name: "Rejected", count: Number(data.offers_rejected) || 0, fill: "#ef4444" },
    { name: "Pending", count: Number(data.offers_pending) || 0, fill: "#f59e0b" },
  ];

  const kpis = [
    { label: "Total Applicants", value: data.total_applicants, icon: Users, color: "text-brand-600 bg-brand-100" },
    { label: "Internships", value: data.total_internships, icon: Clock, color: "text-blue-600 bg-blue-100" },
    { label: "Jobs", value: data.total_jobs, icon: Briefcase, color: "text-purple-600 bg-purple-100" },
    { label: "Offers Accepted", value: data.offers_accepted, icon: CheckCircle, color: "text-green-600 bg-green-100" },
  ];

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="page-title flex items-center gap-2"><TrendingUp className="w-5 h-5 text-brand-600" /> Company Analytics</h1>
          <p className="text-surface-500 text-sm">Overview of your hiring activity</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}><Icon className="w-5 h-5" /></div>
            <p className="text-2xl font-bold text-surface-900">{value || 0}</p>
            <p className="text-sm text-surface-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Status Distribution */}
        <div className="card p-6">
          <h3 className="font-semibold text-surface-900 mb-4">Application Status</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-surface-400 py-12">No application data yet.</p>}
        </div>

        {/* Offer Outcomes */}
        <div className="card p-6">
          <h3 className="font-semibold text-surface-900 mb-4">Offer Outcomes</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={offerData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {offerData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-listing breakdown */}
      {data.per_listing?.length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold text-surface-900 mb-4">Applicants per Listing</h3>
          <ResponsiveContainer width="100%" height={Math.max(200, data.per_listing.length * 40)}>
            <BarChart data={data.per_listing} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="listing_title" width={180} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="app_count" fill="#6366f1" radius={[0, 6, 6, 0]} name="Applicants" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default CompanyAnalytics;
