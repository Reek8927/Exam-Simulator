import { useState } from "react";
import { useLocation } from "wouter";

export default function AdminCreateExam() {
  const [, setLocation] = useLocation();

  const [form, setForm] = useState({
    title: "",
    description: "",
    examDate: "",
    startTime: "",
    durationMinutes: "",
    totalMarks: "",
  });

  const update = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const submit = async () => {
    // 🔒 Frontend validation
    if (
      !form.title ||
      !form.examDate ||
      !form.startTime ||
      !form.durationMinutes ||
      !form.totalMarks
    ) {
      alert("Please fill all required fields");
      return;
    }

    const payload = {
      title: form.title,
      description: form.description || null,
      examDate: form.examDate,                  // yyyy-mm-dd
      startTime: form.startTime,                // HH:mm
      durationMinutes: Number(form.durationMinutes),
      totalMarks: Number(form.totalMarks),
    };

    const res = await fetch("/api/admin/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.message || "Failed to create exam");
      return;
    }

    alert("Exam created successfully");
    setLocation("/admin/exams");
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl border space-y-6">
      <h2 className="text-xl font-bold text-slate-800">
        Create New Exam
      </h2>

      <input
        className="input"
        name="title"
        placeholder="Exam Title"
        value={form.title}
        onChange={update}
      />

      <textarea
        className="input"
        name="description"
        placeholder="Description (optional)"
        value={form.description}
        onChange={update}
      />

      <div className="grid md:grid-cols-2 gap-4">
        <input
          type="date"
          className="input"
          name="examDate"
          value={form.examDate}
          onChange={update}
        />

        <input
          type="time"
          className="input"
          name="startTime"
          value={form.startTime}
          onChange={update}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <input
          type="number"
          className="input"
          name="durationMinutes"
          placeholder="Duration (minutes)"
          value={form.durationMinutes}
          onChange={update}
        />

        <input
          type="number"
          className="input"
          name="totalMarks"
          placeholder="Total Marks"
          value={form.totalMarks}
          onChange={update}
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={submit}
          className="px-8 py-2 bg-blue-600 text-white rounded-lg font-bold"
        >
          Create Exam
        </button>
      </div>
    </div>
  );
}
