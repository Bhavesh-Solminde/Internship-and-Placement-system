import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { companyAPI } from "../../utils/api.js";
import { Building2, MapPin, Globe, Mail, Briefcase, Clock, IndianRupee, Calendar } from "lucide-react";

const CompanyProfile = () => {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    companyAPI.getPublicProfile(id).then(({ data }) => { setCompany(data.data); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-container flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-surface-400">Loading company profile...</div></div>;
  if (!company) return <div className="page-container text-center text-surface-400">Company not found.</div>;

  const formatDeadline = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null;

  return (
    <div className="page-container animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="card p-8 mb-8">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 bg-brand-100 text-brand-700 rounded-2xl flex items-center justify-center shrink-0">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-surface-900">{company.name}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-surface-500">
              {company.industry && <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{company.industry}</span>}
              {company.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{company.location}</span>}
              {company.website && <a href={company.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-brand-600 hover:underline"><Globe className="w-3.5 h-3.5" />{company.website}</a>}
              {company.contact_email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{company.contact_email}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Active Internships */}
      {company.internships?.length > 0 && (
        <div className="mb-8">
          <h2 className="section-title flex items-center gap-2 mb-4"><Clock className="w-4 h-4 text-brand-600" /> Open Internships</h2>
          <div className="space-y-3">
            {company.internships.map((i) => (
              <Link key={i.internship_id} to={`/internships/${i.internship_id}`} className="card-hover p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-surface-900">{i.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-surface-500 mt-1">
                    {i.stipend > 0 && <span className="flex items-center gap-0.5"><IndianRupee className="w-3 h-3" />{Number(i.stipend).toLocaleString()}/mo</span>}
                    {i.duration && <span>{i.duration}</span>}
                    {i.deadline && <span className="flex items-center gap-0.5 text-orange-600"><Calendar className="w-3 h-3" />Deadline: {formatDeadline(i.deadline)}</span>}
                  </div>
                </div>
                <span className="text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full">{i.status}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Active Jobs */}
      {company.jobs?.length > 0 && (
        <div className="mb-8">
          <h2 className="section-title flex items-center gap-2 mb-4"><Briefcase className="w-4 h-4 text-purple-600" /> Open Jobs</h2>
          <div className="space-y-3">
            {company.jobs.map((j) => (
              <Link key={j.job_id} to={`/jobs/${j.job_id}`} className="card-hover p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-surface-900">{j.job_title}</h3>
                  <div className="flex items-center gap-3 text-sm text-surface-500 mt-1">
                    {j.salary && <span className="flex items-center gap-0.5"><IndianRupee className="w-3 h-3" />{Number(j.salary).toLocaleString()}/yr</span>}
                    {j.location && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{j.location}</span>}
                    {j.deadline && <span className="flex items-center gap-0.5 text-orange-600"><Calendar className="w-3 h-3" />Deadline: {formatDeadline(j.deadline)}</span>}
                  </div>
                </div>
                <span className="text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full">{j.status}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {(!company.internships?.length && !company.jobs?.length) && (
        <div className="card p-12 text-center text-surface-400">This company has no active listings right now.</div>
      )}
    </div>
  );
};

export default CompanyProfile;
