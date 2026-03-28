import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { studentAPI } from "../../utils/api.js";
import StatusBadge from "../../components/ui/StatusBadge.jsx";

const MyApplications = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentAPI.getApplications()
      .then((res) => setApps(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-container text-center py-20 text-surface-400">Loading...</div>;

  return (
    <div className="page-container animate-fade-in">
      <h1 className="page-title mb-6">My Applications</h1>

      {apps.length === 0 ? (
        <div className="card p-10 text-center text-surface-400">
          You haven't applied to anything yet. <Link to="/internships" className="text-brand-600 hover:underline">Browse internships</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <Link
              key={app.application_id}
              to={`/student/applications/${app.application_id}`}
              className="card-hover p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <h3 className="font-medium text-surface-900">
                  {app.internship_title || app.job_title}
                </h3>
                <p className="text-sm text-surface-500 mt-0.5">
                  {app.company_name} · <span className="capitalize">{app.application_type}</span> ·{" "}
                  {new Date(app.apply_date).toLocaleDateString()}
                </p>
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
