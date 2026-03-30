import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { companyAPI, interviewAPI, companyOfferAPI } from "../../utils/api.js";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { ArrowLeft, Download, ExternalLink, GitBranch, Globe, Mail, Phone, MapPin, GraduationCap, Briefcase, FolderOpen, Calendar, ChevronDown, ChevronUp, Send } from "lucide-react";

const TABS = ["all", "pending", "shortlisted", "offered", "accepted", "rejected"];

const ApplicantsPage = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [interviewForm, setInterviewForm] = useState({});
  const [offerForm, setOfferForm] = useState({});

  const fetchApplicants = async () => {
    try {
      const { data } = await companyAPI.getApplicants(type, id);
      setApplicants(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchApplicants(); }, [type, id]);

  const filtered = activeTab === "all" ? applicants : applicants.filter((a) => a.status === activeTab);

  const scheduleInterview = async (appId) => {
    const f = interviewForm[appId];
    if (!f?.date) return;
    try {
      await interviewAPI.schedule({ application_id: appId, date: f.date, mode: f.mode || "online", round: f.round || "Round 1", notes: f.notes || "" });
      setInterviewForm({ ...interviewForm, [appId]: {} });
      fetchApplicants();
    } catch (err) { console.error(err); }
  };

  const issueOffer = async (appId) => {
    const f = offerForm[appId];
    try {
      await companyOfferAPI.issue({ application_id: appId, offer_letter_url: f?.offer_letter_url || "", deadline: f?.deadline || null });
      setOfferForm({ ...offerForm, [appId]: {} });
      fetchApplicants();
    } catch (err) { console.error(err); }
  };

  const updateIf = (obj, key, appId, field, value) => {
    const setter = key === "interview" ? setInterviewForm : setOfferForm;
    const src = key === "interview" ? interviewForm : offerForm;
    setter({ ...src, [appId]: { ...(src[appId] || {}), [field]: value } });
  };

  if (loading) return <div className="page-container flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-surface-400">Loading applicants...</div></div>;

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="page-title">Applicants</h1>
          <p className="text-surface-500 text-sm">{applicants.length} total applicant{applicants.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((tab) => {
          const count = tab === "all" ? applicants.length : applicants.filter(a => a.status === tab).length;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${activeTab === tab ? "bg-brand-600 text-white" : "bg-surface-100 text-surface-600 hover:bg-surface-200"}`}>
              {tab} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center text-surface-400">No applicants in this category.</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => {
            const isExpanded = expandedId === app.application_id;
            const iForm = interviewForm[app.application_id] || {};
            const oForm = offerForm[app.application_id] || {};
            return (
              <div key={app.application_id} className="card overflow-hidden">
                {/* Summary row */}
                <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-surface-50 transition-colors" onClick={() => setExpandedId(isExpanded ? null : app.application_id)}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-semibold text-sm">{app.name?.charAt(0)}</div>
                    <div>
                      <h3 className="font-semibold text-surface-900">{app.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-surface-500 mt-0.5">
                        {app.cgpa && <span>CGPA: {app.cgpa}/10</span>}
                        {app.experience_years > 0 && <span>{app.experience_years} yr exp</span>}
                        {app.student_location && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{app.student_location}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={app.status} />
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-surface-400" /> : <ChevronDown className="w-4 h-4 text-surface-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-surface-100 pt-4 space-y-5 animate-fade-in">
                    {/* Contact */}
                    <div>
                      <h4 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Contact</h4>
                      <div className="flex flex-wrap gap-3 text-sm">
                        {app.email && <a href={`mailto:${app.email}`} className="flex items-center gap-1 text-brand-600 hover:underline"><Mail className="w-3.5 h-3.5" />{app.email}</a>}
                        {app.phone && <span className="flex items-center gap-1 text-surface-700"><Phone className="w-3.5 h-3.5" />{app.phone}</span>}
                        {app.linkedin_url && <a href={app.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline"><ExternalLink className="w-3.5 h-3.5" />LinkedIn</a>}
                        {app.github_url && <a href={app.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-surface-700 hover:underline"><GitBranch className="w-3.5 h-3.5" />GitHub</a>}
                        {app.portfolio_url && <a href={app.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-purple-600 hover:underline"><Globe className="w-3.5 h-3.5" />Portfolio</a>}
                      </div>
                    </div>

                    {/* Skills */}
                    {app.skills?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Skills</h4>
                        <div className="flex flex-wrap gap-1.5">{app.skills.map((s) => <span key={s} className="px-2.5 py-1 bg-brand-100 text-brand-700 rounded-full text-xs font-medium">{s}</span>)}</div>
                      </div>
                    )}

                    {/* Education */}
                    {Array.isArray(app.education) && app.education.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2 flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" />Education</h4>
                        {app.education.map((edu, i) => <div key={i} className="text-sm text-surface-700 mb-1"><span className="font-medium">{edu.degree}</span> in {edu.field} — {edu.institution} ({edu.from_year}–{edu.to_year})</div>)}
                      </div>
                    )}

                    {/* Experience */}
                    {Array.isArray(app.experience) && app.experience.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />Experience</h4>
                        {app.experience.map((exp, i) => <div key={i} className="text-sm text-surface-700 mb-2"><span className="font-medium">{exp.title}</span> at {exp.company} ({exp.start}–{exp.is_current ? "Present" : exp.end})<p className="text-surface-500 mt-0.5">{exp.description}</p></div>)}
                      </div>
                    )}

                    {/* Projects */}
                    {Array.isArray(app.projects) && app.projects.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2 flex items-center gap-1"><FolderOpen className="w-3.5 h-3.5" />Projects</h4>
                        {app.projects.map((proj, i) => <div key={i} className="text-sm text-surface-700 mb-2"><span className="font-medium">{proj.name}</span> — {proj.tech}{proj.url && <> · <a href={proj.url} target="_blank" className="text-brand-600 hover:underline">View</a></>}<p className="text-surface-500 mt-0.5">{proj.description}</p></div>)}
                      </div>
                    )}

                    {/* Resume Download */}
                    {app.resume_url && (
                      <a href={`${import.meta.env.VITE_API_URL || "http://localhost:5001"}${app.resume_url}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-surface-100 hover:bg-surface-200 rounded-lg text-sm font-medium transition-colors">
                        <Download className="w-4 h-4" /> Download Resume
                      </a>
                    )}

                    {/* Actions */}
                    <div className="border-t border-surface-100 pt-4 grid sm:grid-cols-2 gap-4">
                      {/* Schedule Interview */}
                      {!["offered", "accepted", "rejected"].includes(app.status) && (
                        <div className="border border-surface-200 rounded-xl p-4">
                          <h5 className="font-medium text-surface-900 mb-3 flex items-center gap-1.5"><Calendar className="w-4 h-4 text-blue-500" /> Schedule Interview</h5>
                          <div className="space-y-2">
                            <input type="datetime-local" value={iForm.date || ""} onChange={(e) => updateIf(interviewForm, "interview", app.application_id, "date", e.target.value)} className="input-field text-sm" />
                            <select value={iForm.mode || "online"} onChange={(e) => updateIf(interviewForm, "interview", app.application_id, "mode", e.target.value)} className="input-field text-sm">
                              <option value="online">Online</option><option value="offline">Offline</option><option value="telephonic">Telephonic</option>
                            </select>
                            <input placeholder="Round (e.g., Technical Round)" value={iForm.round || ""} onChange={(e) => updateIf(interviewForm, "interview", app.application_id, "round", e.target.value)} className="input-field text-sm" />
                            <textarea placeholder="Notes for the candidate" value={iForm.notes || ""} onChange={(e) => updateIf(interviewForm, "interview", app.application_id, "notes", e.target.value)} className="input-field text-sm" rows={2} />
                            <button onClick={() => scheduleInterview(app.application_id)} className="btn-primary w-full text-sm">Schedule</button>
                          </div>
                        </div>
                      )}

                      {/* Issue Offer */}
                      {["shortlisted"].includes(app.status) && (
                        <div className="border border-surface-200 rounded-xl p-4">
                          <h5 className="font-medium text-surface-900 mb-3 flex items-center gap-1.5"><Send className="w-4 h-4 text-green-500" /> Issue Offer</h5>
                          <div className="space-y-2">
                            <input placeholder="Offer Letter URL" value={oForm.offer_letter_url || ""} onChange={(e) => updateIf(offerForm, "offer", app.application_id, "offer_letter_url", e.target.value)} className="input-field text-sm" />
                            <label className="block text-xs text-surface-500">Offer Deadline</label>
                            <input type="date" value={oForm.deadline || ""} onChange={(e) => updateIf(offerForm, "offer", app.application_id, "deadline", e.target.value)} className="input-field text-sm" />
                            <button onClick={() => issueOffer(app.application_id)} className="btn-primary w-full text-sm bg-green-600 hover:bg-green-700">Issue Offer</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ApplicantsPage;
