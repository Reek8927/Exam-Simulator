import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, XCircle, MinusCircle } from "lucide-react";

type AnswerKeyItem = {
  questionId: number;
  subject: string;
  text: string;
  imageUrl?: string | null;
  type: "MCQ" | "NUMERIC";
  options?: string[] | null;
  correctAnswer: number | string;
  studentAnswer: number | string | null;
  marks: number;
  negativeMarks: number;
  status: "correct" | "wrong" | "skipped";
};

export default function AnswerKey() {
  const { attemptId } = useParams<{ attemptId: string }>();

  const { data, isLoading, error } = useQuery<AnswerKeyItem[]>({
    queryKey: ["answer-key", attemptId],
    queryFn: async () => {
      const res = await fetch(
        `/api/student/answer-key/${attemptId}`,
        { credentials: "include" }
      );

      if (res.status === 403) {
        throw new Error("NOT_PUBLISHED");
      }

      if (!res.ok) {
        throw new Error("FAILED");
      }

      return res.json();
    },
  });

  /* ===================== STATES ===================== */

  if (isLoading) {
    return (
      <Centered text="Loading answer key…" />
    );
  }

  if ((error as Error)?.message === "NOT_PUBLISHED") {
    return (
      <Centered text="Answer key has not been published yet." />
    );
  }

  if (!data || data.length === 0) {
    return (
      <Centered text="No answer key data available." />
    );
  }

  /* ===================== UI ===================== */

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white px-6 py-4">
        <h1 className="text-lg font-bold">
          Answer Key & Response Sheet
        </h1>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {data.map((q, index) => (
          <div
            key={q.questionId}
            className="bg-white border rounded-xl p-6 shadow-sm"
          >
            {/* Question Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-slate-500">
                  Q{index + 1} • {q.subject}
                </p>
                <p className="font-medium mt-1">{q.text}</p>
              </div>

              <StatusBadge status={q.status} />
            </div>

            {/* Image */}
            {q.imageUrl && (
              <img
                src={q.imageUrl}
                alt="Question"
                className="max-w-full my-4 rounded border"
              />
            )}

            {/* MCQ */}
            {q.type === "MCQ" && q.options && (
              <div className="space-y-2 mt-4">
                {q.options.map((opt, i) => {
                  const isCorrect = i === q.correctAnswer;
                  const isStudent = i === q.studentAnswer;

                  return (
                    <div
                      key={i}
                      className={`p-3 rounded border text-sm
                        ${
                          isCorrect
                            ? "bg-green-50 border-green-400"
                            : isStudent
                            ? "bg-red-50 border-red-400"
                            : "bg-slate-50 border-slate-200"
                        }`}
                    >
                      <span className="font-medium mr-2">
                        {String.fromCharCode(65 + i)}.
                      </span>
                      {opt}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Numeric */}
            {q.type === "NUMERIC" && (
              <div className="mt-4 text-sm space-y-1">
                <p>
                  <b>Your Answer:</b>{" "}
                  {q.studentAnswer ?? "—"}
                </p>
                <p>
                  <b>Correct Answer:</b>{" "}
                  {q.correctAnswer}
                </p>
              </div>
            )}

            {/* Marks */}
            <div className="mt-4 text-xs text-slate-600">
              Marks: +{q.marks} / −{q.negativeMarks}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===================== HELPERS ===================== */

function StatusBadge({
  status,
}: {
  status: "correct" | "wrong" | "skipped";
}) {
  if (status === "correct") {
    return (
      <span className="flex items-center gap-1 text-green-700 text-sm">
        <CheckCircle size={16} /> Correct
      </span>
    );
  }

  if (status === "wrong") {
    return (
      <span className="flex items-center gap-1 text-red-600 text-sm">
        <XCircle size={16} /> Wrong
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-slate-500 text-sm">
      <MinusCircle size={16} /> Skipped
    </span>
  );
}

function Centered({ text }: { text: string }) {
  return (
    <div className="h-screen flex items-center justify-center text-slate-600">
      {text}
    </div>
  );
}
