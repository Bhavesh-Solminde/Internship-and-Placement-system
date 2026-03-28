import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore.js";
import { coordinatorAPI } from "../../utils/api.js";
import StatsWidget from "../../components/shared/StatsWidget.jsx";
import { HiOutlineUsers, HiOutlineBriefcase, HiOutlineDocumentText, HiOutlineChartBar, HiOutlineCheckCircle, HiOutlineArrowRight } from "react-icons/hi";

const CoordinatorDashboard = () => {
  const { user } = useAuthStore();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coordinatorAPI.getReports()
      .then((res) => setReport(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-container text-center py-20 text-surface-400">Loading dashboard...</div>;

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-8">
        <h1 className="page-title">Coordinator Dashboard</h1>
        <p className="text-surface-500 mt-1">Welcome, {user?.name}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatsWidget icon={HiOutlineUsers} label="Students" value={report?.total_students} color="brand" />
        <StatsWidget icon={HiOutlineBriefcase} label="Companies" value={report?.total_companies} color="accent" />
        <StatsWidget icon={HiOutlineDocumentText} label="Applications" value={report?.total_applications} color="purple" />
        <StatsWidget icon={HiOutlineCheckCircle} label="Offers Accepted" value={report?.offers_accepted} color="green" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        <StatsWidget icon={HiOutlineDocumentText} label="Pending" value={report?.pending} color="blue" />
        <StatsWidget icon={HiOutlineChartBar} label="Internship Apps" value={report?.internship_apps} color="brand" />
        <StatsWidget icon={HiOutlineChartBar} label="Job Apps" value={report?.job_apps} color="accent" />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { to: "/coordinator/students", label: "Manage Students", desc: "View and edit student records", icon: HiOutlineUsers },
          { to: "/coordinator/companies", label: "Manage Companies", desc: "View linked companies", icon: HiOutlineBriefcase },
          { to: "/coordinator/applications", label: "Manage Applications", desc: "Oversee all applications", icon: HiOutlineDocumentText },
        ].map((item) => (
          <Link key={item.to} to={item.to} className="card-hover p-5 group">
            <div className="flex items-center justify-between mb-3">
              <item.icon className="w-6 h-6 text-brand-600" />
              <HiOutlineArrowRight className="w-4 h-4 text-surface-300 group-hover:text-brand-600 transition-colors" />
            </div>
            <h3 className="font-semibold text-surface-900 mb-1">{item.label}</h3>
            <p className="text-sm text-surface-500">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CoordinatorDashboard;
