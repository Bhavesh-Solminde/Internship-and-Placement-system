import React, { useEffect, useState } from "react";
import { coordinatorAPI } from "../../utils/api.js";

const ManageCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coordinatorAPI.getCompanies().then((res) => setCompanies(res.data.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-container text-center py-20 text-surface-400">Loading...</div>;

  return (
    <div className="page-container animate-fade-in">
      <h1 className="page-title mb-6">Manage Companies</h1>
      {companies.length === 0 ? (
        <div className="card p-10 text-center text-surface-400">No companies linked yet.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {companies.map((c) => (
            <div key={c.company_id} className="card p-5">
              <h3 className="font-semibold text-surface-900 mb-1">{c.name}</h3>
              <p className="text-sm text-brand-600 mb-2">{c.industry || "N/A"}</p>
              <p className="text-sm text-surface-500">{c.location || "N/A"}</p>
              <p className="text-xs text-surface-400 mt-2">{c.contact_email}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageCompanies;
