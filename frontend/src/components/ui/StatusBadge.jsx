import React from "react";

const statusMap = {
  pending:      { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending" },
  under_review: { bg: "bg-blue-100",   text: "text-blue-800",   label: "Under Review" },
  shortlisted:  { bg: "bg-indigo-100", text: "text-indigo-800", label: "Shortlisted" },
  offered:      { bg: "bg-purple-100", text: "text-purple-800", label: "Offered" },
  accepted:     { bg: "bg-green-100",  text: "text-green-800",  label: "Accepted" },
  rejected:     { bg: "bg-red-100",    text: "text-red-800",    label: "Rejected" },
  withdrawn:    { bg: "bg-surface-100",text: "text-surface-600",label: "Withdrawn" },
  open:         { bg: "bg-green-100",  text: "text-green-800",  label: "Open" },
  closed:       { bg: "bg-surface-200",text: "text-surface-600",label: "Closed" },
  filled:       { bg: "bg-blue-100",   text: "text-blue-800",   label: "Filled" },
  passed:       { bg: "bg-green-100",  text: "text-green-800",  label: "Passed" },
  failed:       { bg: "bg-red-100",    text: "text-red-800",    label: "Failed" },
  no_show:      { bg: "bg-surface-200",text: "text-surface-600",label: "No Show" },
  expired:      { bg: "bg-surface-200",text: "text-surface-600",label: "Expired" },
  documents_submitted: { bg: "bg-blue-100",  text: "text-blue-800",  label: "Docs Submitted" },
  in_progress:  { bg: "bg-yellow-100", text: "text-yellow-800", label: "In Progress" },
  completed:    { bg: "bg-green-100",  text: "text-green-800",  label: "Completed" },
  cancelled:    { bg: "bg-red-100",    text: "text-red-800",    label: "Cancelled" },
};

const StatusBadge = ({ status }) => {
  const config = statusMap[status] || { bg: "bg-surface-100", text: "text-surface-600", label: status };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
