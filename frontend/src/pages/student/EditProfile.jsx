import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { studentAPI } from "../../utils/api.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import { ArrowLeft, Plus, Trash2, Upload, Sparkles, Save, ExternalLink, GitBranch, Globe, MapPin, Phone, Mail } from "lucide-react";

const empty = { education: { degree: "", institution: "", field: "", from_year: "", to_year: "" }, experience: { title: "", company: "", start: "", end: "", description: "", is_current: false }, project: { name: "", tech: "", description: "", url: "" } };

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", cgpa: "", location: "",
    linkedin_url: "", github_url: "", portfolio_url: "",
    skills: [], education: [], experience: [], projects: [],
    experience_years: "",
  });
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    studentAPI.getProfile().then(({ data }) => {
      const p = data.data;
      setForm({
        name: p.name || "", phone: p.phone || "", cgpa: p.cgpa || "",
        location: p.location || "", linkedin_url: p.linkedin_url || "",
        github_url: p.github_url || "", portfolio_url: p.portfolio_url || "",
        skills: p.skills || [], education: Array.isArray(p.education) ? p.education : [],
        experience: Array.isArray(p.experience) ? p.experience : [],
        projects: Array.isArray(p.projects) ? p.projects : [],
        experience_years: p.experience_years || "",
      });
    });
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addItem = (key, template) => setForm({ ...form, [key]: [...form[key], { ...template }] });

  const removeItem = (key, idx) => setForm({ ...form, [key]: form[key].filter((_, i) => i !== idx) });

  const updateItem = (key, idx, field, value) => {
    const updated = [...form[key]];
    updated[idx] = { ...updated[idx], [field]: value };
    setForm({ ...form, [key]: updated });
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) { setForm({ ...form, skills: [...form.skills, s] }); setSkillInput(""); }
  };

  const removeSkill = (s) => setForm({ ...form, skills: form.skills.filter((sk) => sk !== s) });

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        cgpa: form.cgpa ? Number(form.cgpa) : null,
        experience_years: form.experience_years ? Number(form.experience_years) : null,
        education: form.education, experience: form.experience, projects: form.projects,
      };
      const { data } = await studentAPI.updateProfile(payload);
      updateUser(data.data);
      navigate("/student/dashboard");
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleResumeParse = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setParsing(true);
    try {
      const { data } = await studentAPI.parseResume(file);
      const p = data.data.parsed;
      if (p) {
        setForm((prev) => ({
          ...prev,
          name: p.name || prev.name, phone: p.phone || prev.phone,
          skills: p.skills?.length ? p.skills : prev.skills,
          education: p.education?.length ? p.education : prev.education,
          experience: p.experience?.length ? p.experience : prev.experience,
          projects: p.projects?.length ? p.projects : prev.projects,
          experience_years: p.experience_years || prev.experience_years,
        }));
      }
    } catch (err) {
      console.error("Resume parse failed:", err);
      const msg = err.response?.data?.message || "Failed to parse resume. Please try again.";
      alert(msg);
    }
    finally { setParsing(false); e.target.value = ""; }
  };

  return (
    <div className="page-container animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-100 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="page-title">Edit Profile</h1>
          <p className="text-surface-500 text-sm mt-0.5">Update your details for better job matching</p>
        </div>
      </div>

      {/* AI Resume Parse */}
      <div className="card p-6 mb-6 border-2 border-dashed border-brand-200 bg-brand-50/30">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="w-5 h-5 text-brand-600" />
          <h2 className="font-semibold text-surface-900">Smart Resume Import</h2>
        </div>
        <p className="text-sm text-surface-500 mb-4">Upload your PDF resume and our AI will auto-fill your profile fields.</p>
        <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm cursor-pointer transition-all ${parsing ? "bg-surface-200 text-surface-400" : "bg-brand-600 text-white hover:bg-brand-700"}`}>
          <Upload className="w-4 h-4" />
          {parsing ? "Analyzing..." : "Upload Resume"}
          <input type="file" accept=".pdf" onChange={handleResumeParse} className="hidden" disabled={parsing} />
        </label>
      </div>

      {/* Contact Details */}
      <section className="card p-6 mb-6">
        <h2 className="font-semibold text-surface-900 mb-4 flex items-center gap-2"><Mail className="w-4 h-4 text-brand-600" /> Contact Details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Full Name</label>
            <input name="name" value={form.name} onChange={handleChange} className="input" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Phone</label>
            <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" /><input name="phone" value={form.phone} onChange={handleChange} className="input pl-10" placeholder="+91 98765 43210" /></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Location</label>
            <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" /><input name="location" value={form.location} onChange={handleChange} className="input pl-10" placeholder="Mumbai, India" /></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">CGPA (out of 10)</label>
            <input name="cgpa" type="number" min="0" max="10" step="0.01" value={form.cgpa} onChange={handleChange} className="input" placeholder="8.50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Experience (years)</label>
            <input name="experience_years" type="number" min="0" step="0.5" value={form.experience_years} onChange={handleChange} className="input" placeholder="2" />
          </div>
        </div>
      </section>

      {/* Social Links */}
      <section className="card p-6 mb-6">
        <h2 className="font-semibold text-surface-900 mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-brand-600" /> Social & Portfolio Links</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-surface-700 mb-1 flex items-center gap-1"><ExternalLink className="w-3.5 h-3.5" /> LinkedIn URL</label>
            <input name="linkedin_url" value={form.linkedin_url} onChange={handleChange} className="input" placeholder="https://linkedin.com/in/your-profile" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1 flex items-center gap-1"><GitBranch className="w-3.5 h-3.5" /> GitHub URL</label>
            <input name="github_url" value={form.github_url} onChange={handleChange} className="input" placeholder="https://github.com/username" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1 flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> Portfolio URL</label>
            <input name="portfolio_url" value={form.portfolio_url} onChange={handleChange} className="input" placeholder="https://yoursite.com" />
          </div>
        </div>
      </section>

      {/* Education */}
      <section className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-surface-900">Education</h2>
          <button onClick={() => addItem("education", empty.education)} className="btn-secondary text-sm"><Plus className="w-4 h-4" /> Add</button>
        </div>
        {form.education.length === 0 && <p className="text-sm text-surface-400">No education entries yet.</p>}
        {form.education.map((edu, i) => (
          <div key={i} className="border border-surface-200 rounded-xl p-4 mb-3 relative bg-surface-50/50">
            <button onClick={() => removeItem("education", i)} className="absolute top-3 right-3 p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
            <div className="grid sm:grid-cols-2 gap-3">
              <input placeholder="Degree (e.g., B.Tech)" value={edu.degree} onChange={(e) => updateItem("education", i, "degree", e.target.value)} className="input" />
              <input placeholder="Institution" value={edu.institution} onChange={(e) => updateItem("education", i, "institution", e.target.value)} className="input" />
              <input placeholder="Field of Study" value={edu.field} onChange={(e) => updateItem("education", i, "field", e.target.value)} className="input" />
              <div className="flex gap-2">
                <input placeholder="From Year" value={edu.from_year} onChange={(e) => updateItem("education", i, "from_year", e.target.value)} className="input" />
                <input placeholder="To Year" value={edu.to_year} onChange={(e) => updateItem("education", i, "to_year", e.target.value)} className="input" />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Experience */}
      <section className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-surface-900">Experience</h2>
          <button onClick={() => addItem("experience", empty.experience)} className="btn-secondary text-sm"><Plus className="w-4 h-4" /> Add</button>
        </div>
        {form.experience.length === 0 && <p className="text-sm text-surface-400">No experience entries yet.</p>}
        {form.experience.map((exp, i) => (
          <div key={i} className="border border-surface-200 rounded-xl p-4 mb-3 relative bg-surface-50/50">
            <button onClick={() => removeItem("experience", i)} className="absolute top-3 right-3 p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
            <div className="grid sm:grid-cols-2 gap-3">
              <input placeholder="Job Title" value={exp.title} onChange={(e) => updateItem("experience", i, "title", e.target.value)} className="input" />
              <input placeholder="Company" value={exp.company} onChange={(e) => updateItem("experience", i, "company", e.target.value)} className="input" />
              <input placeholder="Start (e.g., Jan 2023)" value={exp.start} onChange={(e) => updateItem("experience", i, "start", e.target.value)} className="input" />
              <input placeholder="End (e.g., Dec 2023)" value={exp.end} onChange={(e) => updateItem("experience", i, "end", e.target.value)} className="input" />
              <textarea placeholder="Description" value={exp.description} onChange={(e) => updateItem("experience", i, "description", e.target.value)} className="input sm:col-span-2" rows={2} />
              <label className="flex items-center gap-2 text-sm text-surface-600">
                <input type="checkbox" checked={exp.is_current} onChange={(e) => updateItem("experience", i, "is_current", e.target.checked)} className="rounded" />
                Currently working here
              </label>
            </div>
          </div>
        ))}
      </section>

      {/* Projects */}
      <section className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-surface-900">Projects</h2>
          <button onClick={() => addItem("projects", empty.project)} className="btn-secondary text-sm"><Plus className="w-4 h-4" /> Add</button>
        </div>
        {form.projects.length === 0 && <p className="text-sm text-surface-400">No projects yet.</p>}
        {form.projects.map((proj, i) => (
          <div key={i} className="border border-surface-200 rounded-xl p-4 mb-3 relative bg-surface-50/50">
            <button onClick={() => removeItem("projects", i)} className="absolute top-3 right-3 p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
            <div className="grid sm:grid-cols-2 gap-3">
              <input placeholder="Project Name" value={proj.name} onChange={(e) => updateItem("projects", i, "name", e.target.value)} className="input" />
              <input placeholder="Tech Stack (e.g., React, Node)" value={proj.tech} onChange={(e) => updateItem("projects", i, "tech", e.target.value)} className="input" />
              <textarea placeholder="Description" value={proj.description} onChange={(e) => updateItem("projects", i, "description", e.target.value)} className="input sm:col-span-2" rows={2} />
              <input placeholder="Project URL" value={proj.url} onChange={(e) => updateItem("projects", i, "url", e.target.value)} className="input" />
            </div>
          </div>
        ))}
      </section>

      {/* Skills */}
      <section className="card p-6 mb-6">
        <h2 className="font-semibold text-surface-900 mb-4">Skills</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {form.skills.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-sm font-medium">
              {s}
              <button onClick={() => removeSkill(s)} className="hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())} className="input flex-1" placeholder="Type a skill and press Enter" />
          <button onClick={addSkill} className="btn-secondary"><Plus className="w-4 h-4" /></button>
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end gap-3 pb-10">
        <button onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
};

export default EditProfile;
