import React, { useEffect, useState } from "react";
import { coordinatorAPI } from "../../utils/api.js";

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coordinatorAPI.getStudents().then((res) => setStudents(res.data.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-container text-center py-20 text-surface-400">Loading...</div>;

  return (
    <div className="page-container animate-fade-in">
      <h1 className="page-title mb-6">Manage Students</h1>
      {students.length === 0 ? (
        <div className="card p-10 text-center text-surface-400">No students linked yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-surface-200 text-left text-surface-500">
              <th className="pb-3 font-medium">Name</th><th className="pb-3 font-medium">Email</th><th className="pb-3 font-medium">Phone</th><th className="pb-3 font-medium">GPA</th><th className="pb-3 font-medium">Skills</th>
            </tr></thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.student_id} className="border-b border-surface-100 hover:bg-surface-50">
                  <td className="py-3 font-medium text-surface-900">{s.name}</td>
                  <td className="py-3 text-surface-600">{s.email}</td>
                  <td className="py-3 text-surface-600">{s.phone || "-"}</td>
                  <td className="py-3 text-surface-600">{s.gpa || "-"}</td>
                  <td className="py-3">{s.skills?.length ? <div className="flex flex-wrap gap-1">{s.skills.map((sk) => <span key={sk} className="badge bg-brand-50 text-brand-600">{sk}</span>)}</div> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageStudents;
