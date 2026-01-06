import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";

export default function AdminEditExam() {
  const [, setLocation] = useLocation();

  // 🔥 GET ROUTE PARAM
  const [match, params] = useRoute("/admin/exams/edit/:id");
  const examId = params?.id;

  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!examId) return;

    fetch(`/api/admin/exams/${examId}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setForm(data);
        setLoading(false);
      });
  }, [examId]);

  if (!match) return <div className="p-6">Invalid route</div>;
  if (loading) return <div className="p-6">Loading exam…</div>;

  const updateExam = async () => {
    await fetch(`/api/admin/exams/${examId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });

    alert("Exam updated");
    setLocation("/admin/exams");
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Edit Exam</h1>

      <input
        className="border p-2 w-full"
        value={form.title}
        onChange={(e) =>
          setForm({ ...form, title: e.target.value })
        }
        placeholder="Exam title"
      />

      <input
        type="date"
        className="border p-2 w-full"
        value={form.examDate}
        onChange={(e) =>
          setForm({ ...form, examDate: e.target.value })
        }
      />

      <input
        type="time"
        className="border p-2 w-full"
        value={form.startTime}
        onChange={(e) =>
          setForm({ ...form, startTime: e.target.value })
        }
      />

      <input
        type="number"
        className="border p-2 w-full"
        value={form.durationMinutes}
        onChange={(e) =>
          setForm({
            ...form,
            durationMinutes: Number(e.target.value),
          })
        }
      />

      <button
        onClick={updateExam}
        className="bg-blue-600 text-white px-6 py-2 rounded"
      >
        Save Changes
      </button>
    </div>
  );
}
