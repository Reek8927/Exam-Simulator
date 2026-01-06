import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  Lock,
  Unlock,
  Users,
  Trophy,
} from "lucide-react";
import AdminAnswerKeySection from "./AdminAnswerKeySection";

/* =====================
   TYPES
===================== */

type Exam = {
  id: number;
  title: string;
  resultDeclared: boolean;
};

type ResultRow = {
  id: number;
  totalMarksObtained: number | null;
  percentile: number | null;
  status: string;
  student: {
    name: string;
    applicationNo: string;
  };
};

export default function AdminResults() {
  const queryClient = useQueryClient();
  const [examId, setExamId] = useState<number | null>(null);

  /* =====================
     FETCH EXAMS
  ===================== */
  const { data: exams, isLoading } = useQuery<Exam[]>({
    queryKey: ["admin-exams"],
    queryFn: async () => {
      const res = await fetch("/api/admin/exams", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch exams");
      return res.json();
    },
  });

  /* =====================
     FETCH RESULTS
  ===================== */
  const { data: results } = useQuery<ResultRow[]>({
    queryKey: ["admin-results", examId],
    enabled: !!examId,
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/exams/${examId}/results`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch results");
      return res.json();
    },
  });

  /* =====================
     PUBLISH RESULT
  ===================== */
  const publish = useMutation({
    mutationFn: async () => {
      await fetch(
        `/api/admin/exams/${examId}/publish-result`,
        { method: "POST", credentials: "include" }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      alert("✅ Result published");
    },
  });

  /* =====================
     UNPUBLISH RESULT
  ===================== */
  const unpublish = useMutation({
    mutationFn: async () => {
      await fetch(
        `/api/admin/exams/${examId}/unpublish-result`,
        { method: "POST", credentials: "include" }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      alert("❌ Result unpublished");
    },
  });

  if (isLoading) {
    return <div className="p-8">Loading…</div>;
  }

  const selectedExam = exams?.find(e => e.id === examId);

  return (
    <div className="p-8 space-y-8 bg-slate-100 min-h-screen">
      <h1 className="text-2xl font-bold">Admin – Results</h1>

      {/* =====================
         EXAM LIST
      ===================== */}
      <div className="grid md:grid-cols-3 gap-6">
        {exams?.map(exam => (
          <div
            key={exam.id}
            onClick={() => setExamId(exam.id)}
            className={`p-6 rounded-xl border cursor-pointer transition ${
              examId === exam.id
                ? "border-blue-500 bg-blue-50"
                : "bg-white hover:shadow"
            }`}
          >
            <h3 className="font-bold">{exam.title}</h3>
            <p className="text-sm mt-1 flex items-center gap-2">
              {exam.resultDeclared ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Published
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-red-500" />
                  Not Published
                </>
              )}
            </p>
          </div>
        ))}
      </div>

      {/* =====================
         RESULT TABLE
      ===================== */}
      {examId && (
        <div className="bg-white rounded-xl border p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Student Results
            </h2>

            {selectedExam?.resultDeclared ? (
              <button
                onClick={() => unpublish.mutate()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg flex gap-2"
              >
                <Unlock className="w-4 h-4" />
                Unpublish
              </button>
            ) : (
              <button
                onClick={() => publish.mutate()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg flex gap-2"
              >
                <Trophy className="w-4 h-4" />
                Publish
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3">Application No</th>
                  <th className="p-3">Score</th>
                  <th className="p-3">Percentile</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {results?.map(r => (
                  <tr key={r.id} className="border-t">
                    <td className="p-3">{r.student.name}</td>
                    <td className="p-3">{r.student.applicationNo}</td>

                    <td className="p-3 font-bold">
                      {typeof r.totalMarksObtained === "number"
                        ? r.totalMarksObtained
                        : "—"}
                    </td>

                    <td className="p-3">
                      {typeof r.percentile === "number"
                        ? r.percentile.toFixed(2)
                        : "—"}
                    </td>

                    <td className="p-3 capitalize">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <AdminAnswerKeySection />
    </div>
  );
}
