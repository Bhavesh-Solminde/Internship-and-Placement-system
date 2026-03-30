import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jobAPI } from "../../utils/api.js";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { Search, MapPin, IndianRupee, Calendar } from "lucide-react";

const JobListing = () => {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try { const res = await jobAPI.list({ search: search || undefined }); setJobs(res.data.data); }
      catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    const t = setTimeout(fetch, 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="page-container animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Jobs</h1>
          <p className="text-surface-500 mt-1">Explore full-time opportunities</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-300 w-5 h-5" />
          <input className="input-field pl-10" placeholder="Search jobs..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-surface-400">Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="card p-10 text-center text-surface-400">No jobs found.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((item) => (
            <div key={item.job_id} onClick={() => navigate(`/jobs/${item.job_id}`)} className="card-hover p-5 flex flex-col justify-between cursor-pointer">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-surface-900 leading-snug">{item.job_title}</h3>
                  <StatusBadge status={item.status} />
                </div>
                <Link to={`/companies/${item.company_id}`} className="text-sm text-brand-600 font-medium mb-3 block hover:underline" onClick={e => e.stopPropagation()}>{item.company_name}</Link>
                <p className="text-sm text-surface-500 line-clamp-2 mb-4">{item.description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-surface-400">
                {item.salary && <span className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" /> ₹{Number(item.salary).toLocaleString()}/yr</span>}
                {item.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {item.location}</span>}
                {item.deadline && <span className="flex items-center gap-1 text-orange-500"><Calendar className="w-3.5 h-3.5" /> {new Date(item.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobListing;
