import React, { useEffect, useState } from "react";
import { coordinatorAPI } from "../../utils/api.js";
import StatusBadge from "../../components/ui/StatusBadge.jsx";

const ManageApplications = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coordinatorAPI.getApplications().then((res) => setApps(res.data.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-container text-center py-20 text-surface-400">Loading...</div>;

  return (
    <div className="page-container animate-fade-in">
      <h1 className="page-title mb-6">Manage Applications</h1>
      {apps.length === 0 ? (
        <div className="card p-10 text-center text-surface-400">No applications found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-surface-200 text-left text-surface-500">
              <th className="pb-3 font-medium">Student</th>
              <th className="pb-3 font-medium">Position</th>
              <th className="pb-3 font-medium">Company</th>
              <th className="pb-3 font-medium">Type</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Applied</th>
            </tr></thead>
            <tbody>
              {apps.map((app) => (
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
  );
};

export default ManageApplications;
