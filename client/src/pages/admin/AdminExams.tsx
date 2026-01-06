import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Pencil, Plus, Power } from "lucide-react";

export default function AdminExams() {
  const [exams, setExams] = useState<any[]>([]);
  const [, setLocation] = useLocation();

  const loadExams = async () => {
    const res = await fetch("/api/admin/exams", {
      credentials: "include",
    });
    const data = await res.json();
    setExams(data);
  };

  useEffect(() => {
    loadExams();
  }, []);

  /* 🔥 TOGGLE ACTIVE / INACTIVE */
  const toggleActive = async (examId: number) => {
    await fetch(`/api/admin/exams/${examId}/toggle`, {
      method: "PUT",
      credentials: "include",
    });

    // reload exams after toggle
    loadExams();
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-xl border p-6">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">Manage Exams</h1>

          {/* ✅ CREATE EXAM BUTTON */}
          <button
            onClick={() => setLocation("/admin/exams/create")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus size={16} />
            Create Exam
          </button>
        </div>

        {/* TABLE */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="p-3 border">Title</th>
              <th className="p-3 border">Date</th>
              <th className="p-3 border">Time</th>
              <th className="p-3 border">Duration</th>
              <th className="p-3 border">Status</th>
              <th className="p-3 border">Actions</th>
            </tr>
          </thead>

          <tbody>
            {exams.map((exam) => (
              <tr key={exam.id}>
                <td className="p-3 border">{exam.title}</td>
                <td className="p-3 border">{exam.examDate}</td>
                <td className="p-3 border">{exam.examTime}</td>
                <td className="p-3 border">{exam.durationMinutes} min</td>

                {/* STATUS */}
                <td className="p-3 border">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      exam.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {exam.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </td>

                {/* ACTIONS */}
                <td className="p-3 border flex gap-3">
                  {/* EDIT */}
                  <button
                    onClick={() =>
                      setLocation(`/admin/exams/edit/${exam.id}`)
                    }
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Pencil size={14} /> Edit
                  </button>

                  {/* TOGGLE */}
                  <button
                    onClick={() => toggleActive(exam.id)}
                    className="text-slate-700 hover:underline flex items-center gap-1"
                  >
                    <Power size={14} />
                    {exam.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}

            {exams.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center p-6 text-slate-500">
                  No exams created yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
