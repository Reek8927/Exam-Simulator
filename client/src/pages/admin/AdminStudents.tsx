import { useEffect, useState } from "react";
import { Eye, CheckCircle, XCircle, Clock } from "lucide-react";
import { useLocation } from "wouter";

type StudentRow = {
  studentId: number;
  name: string;
  applicationNo: string;
  category: string | null;
  applicationStatus: "pending" | "approved" | "rejected";
};

export default function AdminStudents() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  async function fetchStudents() {
    setLoading(true);
    const res = await fetch("/api/admin/students", {
      credentials: "include",
    });
    const data = await res.json();
    setStudents(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchStudents();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Manage Students</h1>

      {loading ? (
        <div className="text-slate-500">Loading students…</div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Application No</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {students.map(s => (
                <tr key={s.studentId} className="border-t">
                  <td className="p-3">{s.name}</td>
                  <td className="p-3">{s.applicationNo}</td>
                  <td className="p-3">{s.category ?? "—"}</td>

                  {/* STATUS */}
                  <td className="p-3">
                    {s.applicationStatus === "approved" && (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle size={16} /> Approved
                      </span>
                    )}

                    {s.applicationStatus === "rejected" && (
                      <span className="flex items-center gap-1 text-red-600">
                        <XCircle size={16} /> Rejected
                      </span>
                    )}

                    {s.applicationStatus === "pending" && (
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock size={16} /> Pending
                      </span>
                    )}
                  </td>

                  {/* ACTION */}
                  <td className="p-3 text-center">
                    <button
                      onClick={() =>
                        setLocation(`/admin/students/verify/${s.studentId}`)
                      }
                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      <Eye size={16} />
                      View / Verify
                    </button>
                  </td>
                </tr>
              ))}

              {students.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="p-6 text-center text-slate-500"
                  >
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
