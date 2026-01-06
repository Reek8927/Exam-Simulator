import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, FileText } from "lucide-react";

type Exam = {
  id: number;
  title: string;
  answerKeyPublished: boolean;
};

export default function AdminAnswerKeySection() {
  const qc = useQueryClient();

  /* ================= FETCH EXAMS ================= */
  const { data: exams = [], isLoading } = useQuery<Exam[]>({
    queryKey: ["admin-exams"],
    queryFn: async () => {
      const res = await fetch("/api/admin/exams", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load exams");
      return res.json();
    },
  });

  /* ================= PUBLISH ================= */
  const publishMutation = useMutation({
    mutationFn: async (examId: number) => {
      const res = await fetch(
        `/api/admin/exams/${examId}/publish-answer-key`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Publish failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-exams"] }),
  });

  /* ================= UNPUBLISH ================= */
  const unpublishMutation = useMutation({
    mutationFn: async (examId: number) => {
      const res = await fetch(
        `/api/admin/exams/${examId}/unpublish-answer-key`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Unpublish failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-exams"] }),
  });

  if (isLoading) {
    return <div className="p-6 text-slate-500">Loading exams…</div>;
  }

  return (
    <div className="bg-white border rounded-xl p-6 space-y-6">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <FileText className="w-5 h-5 text-blue-600" />
        Answer Key Management
      </h2>

      {exams.length === 0 ? (
        <p className="text-sm text-slate-500">No exams found</p>
      ) : (
        <div className="space-y-4">
          {exams.map(exam => (
            <div
              key={exam.id}
              className="flex justify-between items-center border rounded-lg p-4"
            >
              <div>
                <p className="font-semibold">{exam.title}</p>
                <p className="text-sm text-slate-500">
                  Answer Key Status:{" "}
                  {exam.answerKeyPublished ? (
                    <span className="text-green-600 font-medium">
                      Published
                    </span>
                  ) : (
                    <span className="text-red-500 font-medium">
                      Not Published
                    </span>
                  )}
                </p>
              </div>

              {exam.answerKeyPublished ? (
                <button
                  onClick={() => unpublishMutation.mutate(exam.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  <XCircle size={16} />
                  Unpublish
                </button>
              ) : (
                <button
                  onClick={() => publishMutation.mutate(exam.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  <CheckCircle size={16} />
                  Publish
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
