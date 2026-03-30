import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { studentAPI } from "../../utils/api.js";
import { Sparkles, Clock, Briefcase, IndianRupee, MapPin } from "lucide-react";

const MatchResults = () => {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("internships");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentAPI.getMatches()
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse text-surface-400 text-sm py-4">Finding matches...</div>;

  if (!data || (data.internships.length === 0 && data.jobs.length === 0)) {
    return (
      <div className="card p-6 text-center">
        <Sparkles className="w-8 h-8 text-surface-300 mx-auto mb-2" />
        <p className="text-surface-400 text-sm">Add skills to your profile to get personalized recommendations.</p>
      </div>
    );
  }

  const items = tab === "internships" ? data.internships : data.jobs;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-600" />
          <h2 className="section-title">Recommended for You</h2>
        </div>
        <div className="flex gap-1 p-0.5 bg-surface-100 rounded-lg">
          <button
            onClick={() => setTab("internships")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              tab === "internships" ? "bg-white shadow-sm text-surface-900" : "text-surface-500"
            }`}
          >
            <Clock className="w-3.5 h-3.5 inline mr-1" />Internships ({data.internships.length})
          </button>
          <button
            onClick={() => setTab("jobs")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              tab === "jobs" ? "bg-white shadow-sm text-surface-900" : "text-surface-500"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 inline mr-1" />Jobs ({data.jobs.length})
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="card p-6 text-center text-surface-400 text-sm">
          No matching {tab} found based on your skills and experience.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const id = item.internship_id || item.job_id;
            const title = item.title || item.job_title;
            const link = item.internship_id ? `/internships/${id}` : `/jobs/${id}`;

            return (
              <Link key={id} to={link} className="card-hover p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-surface-900 leading-snug text-sm">{title}</h3>
                    <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      item.match_score >= 70 ? "bg-green-100 text-green-700" :
                      item.match_score >= 40 ? "bg-yellow-100 text-yellow-700" :
                      "bg-surface-100 text-surface-600"
                    }`}>
                      {item.match_score}%
                    </div>
                  </div>
                  <p className="text-xs text-brand-600 font-medium mb-2">{item.company_name}</p>

                  {/* Match Score Bar */}
                  <div className="w-full h-1.5 bg-surface-100 rounded-full mb-3">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.match_score >= 70 ? "bg-green-500" :
                        item.match_score >= 40 ? "bg-yellow-500" :
                        "bg-surface-400"
                      }`}
                      style={{ width: `${item.match_score}%` }}
                    />
                  </div>

                  {/* Matched Skills */}
                  {item.matched_skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.matched_skills.map((s) => (
                        <span key={s} className="badge bg-green-50 text-green-700 text-[10px]">{s}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-surface-400 mt-auto pt-2">
                  {tab === "internships" && item.stipend && (
                    <span className="flex items-center gap-0.5">
                      <IndianRupee className="w-3 h-3" />₹{item.stipend}/mo
                    </span>
                  )}
                  {tab === "jobs" && item.salary && (
                    <span className="flex items-center gap-0.5">
                      <IndianRupee className="w-3 h-3" />₹{Number(item.salary).toLocaleString()}/yr
                    </span>
                  )}
                  {item.company_location && (
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-3 h-3" />{item.company_location}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MatchResults;
