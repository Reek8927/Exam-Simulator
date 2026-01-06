import { useEffect, useState } from "react";

type Student = {
  studentId: number;
  name: string;
  applicationNo: string;
  examId: number | null;
};

type Exam = {
  id: number;
  title: string;
};

export default function AdminAssignExam() {
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    fetch("/api/admin/assign-exam/students", { credentials: "include" })
      .then(res => res.json())
      .then(setStudents);

    fetch("/api/admin/assign-exam/exams", { credentials: "include" })
      .then(res => res.json())
      .then(setExams);
  }, []);

  function toggleStudent(id: number) {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  }

  function toggleAll() {
    if (selected.length === students.length) {
      setSelected([]);
    } else {
      setSelected(students.map(s => s.studentId));
    }
  }

  async function bulkAssign() {
    if (!selectedExam) {
      alert("Select exam first");
      return;
    }

    if (selected.length === 0) {
      alert("Select at least one student");
      return;
    }

    const res = await fetch("/api/admin/assign-exam/bulk", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentIds: selected,
        examId: Number(selectedExam),
      }),
    });

    const data = await res.json();

    alert(`✅ Exam assigned to ${data.assigned} students`);

    setStudents(prev =>
      prev.map(s =>
        selected.includes(s.studentId)
          ? { ...s, examId: Number(selectedExam) }
          : s
      )
    );

    setSelected([]);
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Bulk Assign Exam</h1>

      <div className="flex gap-4 items-center">
        <select
          className="border p-2 rounded"
          value={selectedExam}
          onChange={e => setSelectedExam(e.target.value)}
        >
          <option value="">Select Active Exam</option>
          {exams.map(e => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </select>

        <button
          onClick={bulkAssign}
          className="px-6 py-2 bg-blue-600 text-white rounded"
        >
          Assign to Selected
        </button>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3">
                <input
                  type="checkbox"
                  checked={selected.length === students.length}
                  onChange={toggleAll}
                />
              </th>
              <th className="p-3">Name</th>
              <th className="p-3">Application No</th>
              <th className="p-3">Assigned</th>
            </tr>
          </thead>

          <tbody>
            {students.map(s => (
              <tr key={s.studentId} className="border-t">
                <td className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={selected.includes(s.studentId)}
                    onChange={() => toggleStudent(s.studentId)}
                  />
                </td>
                <td className="p-3">{s.name}</td>
                <td className="p-3">{s.applicationNo}</td>
                <td className="p-3">
                  {s.examId ? "✅ Assigned" : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
