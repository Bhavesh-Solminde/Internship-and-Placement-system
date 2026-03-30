import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jobAPI } from "../../utils/api.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { HiOutlineCurrencyRupee, HiOutlineLocationMarker, HiOutlineGlobe, HiOutlineArrowLeft } from "react-icons/hi";

const JobDetail = () => {
  const { id } = useParams();
  const { role, user } = useAuthStore();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    jobAPI.detail(id).then((res) => setData(res.data.data)).catch(() => navigate("/jobs"));
  }, [id]);

  const handleApply = async () => {
    setApplyLoading(true);
    try {
      await jobAPI.apply(id);
      setMsg("✅ Application submitted!");
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to apply");
    } finally { setApplyLoading(false); }
  };

  if (!data) return <div className="page-container text-center py-20 text-surface-400">Loading...</div>;

  return (
    <div className="page-container animate-fade-in max-w-3xl">
      <button onClick={() => navigate(-1)} className="btn-ghost mb-6 -ml-2 text-surface-500">
        <HiOutlineArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="card p-6 sm:p-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">{data.job_title}</h1>
            <p className="text-brand-600 font-medium mt-1">{data.company_name}</p>
          </div>
          <StatusBadge status={data.status} />
        </div>
        <div className="flex flex-wrap gap-4 mb-6 text-sm text-surface-500">
          {data.salary && <span className="flex items-center gap-1"><HiOutlineCurrencyRupee className="w-4 h-4" /> ₹{Number(data.salary).toLocaleString()}/year</span>}
          {data.location && <span className="flex items-center gap-1"><HiOutlineLocationMarker className="w-4 h-4" /> {data.location}</span>}
          {data.website && <a href={data.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-brand-600 hover:underline"><HiOutlineGlobe className="w-4 h-4" /> Website</a>}
        </div>
        <hr className="border-surface-100 mb-6" />
        <div className="mb-6">
          <h2 className="section-title mb-2">About the role</h2>
          <p className="text-surface-600 leading-relaxed whitespace-pre-wrap">{data.description || "No description."}</p>
        </div>
        {msg && <div className={`text-sm p-3 rounded-xl mb-4 ${msg.includes("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>{msg}</div>}
        {role === "student" && data.status === "open" && !msg.includes("✅") && (
          <button onClick={handleApply} disabled={applyLoading} className="btn-primary w-full py-3">
            {applyLoading ? "Submitting..." : "Apply Now"}
          </button>
        )}
      </div>
    </div>
  );
};

export default JobDetail;
