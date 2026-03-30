import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { studentAPI, offerAPI } from "../../utils/api.js";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { ArrowLeft, Building2, Calendar, FileText, CheckCircle, XCircle, Clock, Download } from "lucide-react";

const STEPS = ["pending", "shortlisted", "offered", "accepted"];

const ApplicationDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentAPI.getApplication(id).then(({ data: res }) => setData(res.data)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleOffer = async (action) => {
    try {
      if (action === "accept") await offerAPI.accept(data.offer.offer_id);
      else await offerAPI.reject(data.offer.offer_id);
      const { data: res } = await studentAPI.getApplication(id);
      setData(res.data);
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="page-container flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-surface-400">Loading...</div></div>;
  if (!data) return <div className="page-container text-center text-surface-400">Application not found.</div>;

  const app = data.application;
  const currentStep = STEPS.indexOf(app.status);

  return (
    <div className="page-container animate-fade-in max-w-3xl mx-auto">
      <Link to="/student/applications" className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 mb-6"><ArrowLeft className="w-4 h-4" /> Back to Applications</Link>

      <div className="card p-8 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-surface-900">{app.internship_title || app.job_title}</h1>
            <p className="text-surface-500 flex items-center gap-1 mt-1"><Building2 className="w-4 h-4" />{app.company_name}</p>
          </div>
          <StatusBadge status={app.status} />
        </div>
        <p className="text-sm text-surface-400">Applied on {new Date(app.apply_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      {/* Stepper */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-surface-900 mb-4">Application Progress</h2>
        <div className="flex items-center gap-2">
          {STEPS.map((step, i) => {
            const isActive = i <= currentStep;
            const isCurrent = i === currentStep;
            return (
              <React.Fragment key={step}>
                <div className={`flex flex-col items-center ${isCurrent ? "scale-110" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isActive ? "bg-brand-600 text-white" : "bg-surface-200 text-surface-400"}`}>{i + 1}</div>
                  <span className={`text-xs mt-1 capitalize ${isActive ? "text-surface-900 font-medium" : "text-surface-400"}`}>{step}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < currentStep ? "bg-brand-600" : "bg-surface-200"}`} />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Interviews */}
      {data.interviews?.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-surface-900 mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-500" /> Interviews</h2>
          <div className="space-y-3">
            {data.interviews.map((iv) => (
              <div key={iv.interview_id} className="border border-surface-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-surface-900">{iv.round || "Interview"}</h3>
                  <StatusBadge status={iv.result} />
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-surface-500">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(iv.date).toLocaleString("en-IN")}</span>
                  {iv.mode && <span className="capitalize">{iv.mode}</span>}
                </div>
                {iv.notes && <p className="text-sm text-surface-600 mt-2 bg-surface-50 p-3 rounded-lg">{iv.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Offer */}
      {data.offer && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-surface-900 mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-green-500" /> Offer</h2>
          <div className="border border-surface-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <StatusBadge status={data.offer.status} />
              {data.offer.deadline && <span className="text-xs text-surface-500">Deadline: {new Date(data.offer.deadline).toLocaleDateString("en-IN")}</span>}
            </div>
            {data.offer.offer_letter_url && (
              <a href={data.offer.offer_letter_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-lg text-sm font-medium hover:bg-brand-100 transition-colors mb-3">
                <Download className="w-4 h-4" /> View Offer Letter
              </a>
            )}
            {data.offer.status === "pending" && (
              <div className="flex gap-3 mt-3">
                <button onClick={() => handleOffer("accept")} className="btn-primary bg-green-600 hover:bg-green-700 flex-1"><CheckCircle className="w-4 h-4" /> Accept</button>
                <button onClick={() => handleOffer("reject")} className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 flex-1"><XCircle className="w-4 h-4" /> Decline</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetail;
