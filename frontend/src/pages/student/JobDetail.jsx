import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { jobAPI, studentAPI } from "../../utils/api.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import { ArrowLeft, Building2, MapPin, IndianRupee, Briefcase, Calendar, CheckCircle, AlertCircle } from "lucide-react";

const JobDetail = () => {
  const { id } = useParams();
  const { isAuthenticated, role } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [msg, setMsg] = useState("");
  const [studentExp, setStudentExp] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: res } = await jobAPI.detail(id);
        setData(res.data);
        if (isAuthenticated && role === "student") {
          const [profileRes, appliedRes] = await Promise.all([
            studentAPI.getProfile(), studentAPI.getAppliedIds()
          ]);
          setStudentExp(Number(profileRes.data.data.experience_years) || 0);
          if (appliedRes.data.data.job_ids.includes(id)) setApplied(true);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  const handleApply = async () => {
    setApplying(true); setMsg("");
    try {
      await jobAPI.apply(id);
      setApplied(true); setMsg("Applied successfully!");
    } catch (err) { setMsg(err.response?.data?.message || "Failed to apply"); }
    finally { setApplying(false); }
  };

  if (loading) return <div className="page-container flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-surface-400">Loading...</div></div>;
  if (!data) return <div className="page-container text-center text-surface-400">Job not found.</div>;

  const reqExp = Number(data.required_experience_years) || 0;
  const isExpLocked = isAuthenticated && role === "student" && reqExp > 0 && studentExp < reqExp;
  const isDeadlinePassed = data.deadline && new Date(data.deadline) < new Date();
  const canApply = isAuthenticated && role === "student" && !applied && !isExpLocked && !isDeadlinePassed;

  return (
    <div className="page-container animate-fade-in max-w-3xl mx-auto">
      <Link to="/jobs" className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 mb-6"><ArrowLeft className="w-4 h-4" /> Back to Jobs</Link>

      <div className="card p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">{data.job_title}</h1>
            <Link to={`/companies/${data.company_id}`} className="text-brand-600 hover:underline font-medium flex items-center gap-1 mt-1"><Building2 className="w-4 h-4" />{data.company_name}</Link>
          </div>
          <span className="text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full">{data.status}</span>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-surface-600 mb-6">
          {data.salary && <span className="flex items-center gap-1"><IndianRupee className="w-4 h-4" />₹{Number(data.salary).toLocaleString()}/yr</span>}
          {data.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{data.location}</span>}
          {reqExp > 0 && <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" />{reqExp}+ yrs exp required</span>}
          {data.deadline && <span className={`flex items-center gap-1 ${isDeadlinePassed ? "text-red-500" : "text-orange-600"}`}><Calendar className="w-4 h-4" />{isDeadlinePassed ? "Deadline passed" : `Deadline: ${new Date(data.deadline).toLocaleDateString("en-IN")}`}</span>}
        </div>

        {data.description && <div className="prose text-surface-700 mb-8 whitespace-pre-wrap">{data.description}</div>}

        {msg && <div className={`p-3 rounded-xl text-sm mb-4 ${msg.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{msg}</div>}

        {isAuthenticated && role === "student" && (
          <div>
            {applied ? (
              <div className="flex items-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-xl text-sm font-medium"><CheckCircle className="w-4 h-4" /> Already Applied</div>
            ) : isExpLocked ? (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl text-sm"><AlertCircle className="w-4 h-4" /> Requires {reqExp}+ years experience (you have {studentExp})</div>
            ) : isDeadlinePassed ? (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl text-sm"><AlertCircle className="w-4 h-4" /> Application deadline has passed</div>
            ) : (
              <button onClick={handleApply} disabled={applying} className="btn-primary">{applying ? "Applying..." : "Apply Now"}</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetail;
