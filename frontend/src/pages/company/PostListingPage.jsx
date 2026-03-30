import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { companyAPI } from "../../utils/api.js";
import { ArrowLeft, Briefcase, Clock, MapPin, IndianRupee, FileText, Calendar, Save, AlertCircle } from "lucide-react";

const PostListingPage = () => {
  const { type } = useParams(); // 'internship' or 'job'
  const navigate = useNavigate();
  const isInternship = type === "internship";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "", description: "", location: "",
    stipend: "", salary: "", duration: "",
    required_experience_years: "0", deadline: "",
  });

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) { setError("Title is required"); return; }
    setSaving(true);
    try {
      if (isInternship) {
        await companyAPI.postInternship({
          title: form.title, description: form.description,
          stipend: form.stipend ? Number(form.stipend) : 0,
          duration: form.duration, required_experience_years: Number(form.required_experience_years) || 0,
          deadline: form.deadline || null,
        });
      } else {
        await companyAPI.postJob({
          job_title: form.title, description: form.description,
          location: form.location, salary: form.salary ? Number(form.salary) : null,
          required_experience_years: Number(form.required_experience_years) || 0,
          deadline: form.deadline || null,
        });
      }
      navigate("/company/dashboard");
    } catch (err) { setError(err.response?.data?.message || "Failed to post listing"); }
    finally { setSaving(false); }
  };

  const deadlineFormatted = form.deadline ? new Date(form.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : null;

  return (
    <div className="page-container animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-100 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="page-title">Post {isInternship ? "Internship" : "Job"}</h1>
          <p className="text-surface-500 text-sm mt-0.5">Fill in the details to create a new listing</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="card p-6">
          <h2 className="font-semibold text-surface-900 mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4 text-brand-600" /> Basic Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">{isInternship ? "Internship Title" : "Job Title"} *</label>
              <input name="title" value={form.title} onChange={handleChange} className="input" placeholder={isInternship ? "e.g., Frontend Developer Intern" : "e.g., Senior Software Engineer"} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1"><FileText className="w-3.5 h-3.5 inline" /> Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} className="input" rows={5} placeholder="Describe the role, responsibilities, and requirements..." />
            </div>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="font-semibold text-surface-900 mb-4 flex items-center gap-2"><IndianRupee className="w-4 h-4 text-green-600" /> Compensation & Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {isInternship ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Stipend (₹/month)</label>
                  <input name="stipend" type="number" value={form.stipend} onChange={handleChange} className="input" placeholder="15000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1"><Clock className="w-3.5 h-3.5 inline" /> Duration</label>
                  <input name="duration" value={form.duration} onChange={handleChange} className="input" placeholder="e.g., 3 months" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Salary (₹/year)</label>
                  <input name="salary" type="number" value={form.salary} onChange={handleChange} className="input" placeholder="1200000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1"><MapPin className="w-3.5 h-3.5 inline" /> Location</label>
                  <input name="location" value={form.location} onChange={handleChange} className="input" placeholder="e.g., Bengaluru, Remote" />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Min. Experience (years)</label>
              <input name="required_experience_years" type="number" min="0" step="0.5" value={form.required_experience_years} onChange={handleChange} className="input" />
            </div>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="font-semibold text-surface-900 mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-orange-500" /> Application Deadline</h2>
          <p className="text-sm text-surface-500 mb-3">Set when this listing should stop accepting new applications. After this date, only you can view the applicants.</p>
          <input name="deadline" type="date" value={form.deadline} onChange={handleChange} className="input max-w-xs" min={new Date().toISOString().split("T")[0]} />
          {deadlineFormatted && (
            <p className="text-sm text-surface-600 mt-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-orange-500" />
              Applications close on <span className="font-semibold">{deadlineFormatted}</span>
            </p>
          )}
        </section>

        <div className="flex justify-end gap-3 pb-10">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            <Save className="w-4 h-4" /> {saving ? "Posting..." : `Post ${isInternship ? "Internship" : "Job"}`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostListingPage;
