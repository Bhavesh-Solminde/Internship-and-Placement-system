import React, { useEffect, useState } from "react";
import { coordinatorAPI } from "../../utils/api.js";
import StatsWidget from "../../components/shared/StatsWidget.jsx";
import { HiOutlineUsers, HiOutlineBriefcase, HiOutlineDocumentText, HiOutlineCheckCircle, HiOutlineStar, HiOutlineXCircle } from "react-icons/hi";

const ReportsPage = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coordinatorAPI.getReports().then((res) => setReport(res.data.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-container text-center py-20 text-surface-400">Loading...</div>;

  return (
    <div className="page-container animate-fade-in">
      <h1 className="page-title mb-8">Reports & Analytics</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsWidget icon={HiOutlineUsers} label="Students" value={report?.total_students} color="brand" />
        <StatsWidget icon={HiOutlineBriefcase} label="Companies" value={report?.total_companies} color="accent" />
        <StatsWidget icon={HiOutlineDocumentText} label="Total Applications" value={report?.total_applications} color="purple" />
        <StatsWidget icon={HiOutlineStar} label="Total Offers" value={report?.total_offers} color="blue" />
      </div>

      <h2 className="section-title mb-4">Application Breakdown</h2>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatsWidget icon={HiOutlineDocumentText} label="Pending" value={report?.pending} color="blue" />
        <StatsWidget icon={HiOutlineDocumentText} label="Internship Apps" value={report?.internship_apps} color="brand" />
        <StatsWidget icon={HiOutlineDocumentText} label="Job Apps" value={report?.job_apps} color="accent" />
        <StatsWidget icon={HiOutlineCheckCircle} label="Accepted" value={report?.accepted} color="green" />
        <StatsWidget icon={HiOutlineXCircle} label="Rejected" value={report?.rejected} color="red" />
      </div>

      <h2 className="section-title mb-4">Offer Breakdown</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsWidget icon={HiOutlineStar} label="Offers Issued" value={report?.total_offers} color="purple" />
        <StatsWidget icon={HiOutlineCheckCircle} label="Offers Accepted" value={report?.offers_accepted} color="green" />
        <StatsWidget icon={HiOutlineXCircle} label="Offers Rejected" value={report?.offers_rejected} color="red" />
      </div>
    </div>
  );
};

export default ReportsPage;
