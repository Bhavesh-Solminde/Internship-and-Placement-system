import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { internshipAPI } from "../../utils/api.js";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { Search, MapPin, IndianRupee, Clock, Calendar } from "lucide-react";

const InternshipListing = () => {
  const [internships, setInternships] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try { const res = await internshipAPI.list({ search: search || undefined }); setInternships(res.data.data); }
      catch (err) { console.error("Failed:", err); }
      finally { setLoading(false); }
    };
    const debounce = setTimeout(fetch, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  return (
    <div className="page-container animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Internships</h1>
          <p className="text-surface-500 mt-1">Discover internship opportunities</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-300 w-5 h-5" />
          <input className="input-field pl-10" placeholder="Search internships..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-surface-400">Loading internships...</div>
      ) : internships.length === 0 ? (
        <div className="card p-10 text-center text-surface-400">No internships found.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {internships.map((item) => (
            <div key={item.internship_id} onClick={() => navigate(`/internships/${item.internship_id}`)} className="card-hover p-5 flex flex-col justify-between cursor-pointer">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-surface-900 leading-snug">{item.title}</h3>
                  <StatusBadge status={item.status} />
                </div>
                <Link to={`/companies/${item.company_id}`} className="text-sm text-brand-600 font-medium mb-3 block hover:underline" onClick={e => e.stopPropagation()}>{item.company_name}</Link>
                <p className="text-sm text-surface-500 line-clamp-2 mb-4">{item.description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-surface-400">
                <span className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" /> ₹{item.stipend}/mo</span>
                {item.duration && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {item.duration}</span>}
                {item.company_location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {item.company_location}</span>}
                {item.deadline && <span className="flex items-center gap-1 text-orange-500"><Calendar className="w-3.5 h-3.5" /> {new Date(item.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InternshipListing;
