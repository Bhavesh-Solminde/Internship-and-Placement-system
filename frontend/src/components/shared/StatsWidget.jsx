import React from "react";

const StatsWidget = ({ icon: Icon, label, value, color = "brand" }) => {
  const colorMap = {
    brand:  "bg-brand-50 text-brand-600",
    accent: "bg-orange-50 text-accent-600",
    green:  "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    red:    "bg-red-50 text-red-600",
    blue:   "bg-blue-50 text-blue-600",
  };

  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[color] || colorMap.brand}`}>
        {Icon && <Icon className="w-6 h-6" />}
      </div>
      <div>
        <p className="text-2xl font-bold text-surface-900">{value ?? "—"}</p>
        <p className="text-sm text-surface-500">{label}</p>
      </div>
    </div>
  );
};

export default StatsWidget;
