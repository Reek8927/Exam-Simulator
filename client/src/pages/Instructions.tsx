import { useParams, useLocation } from "wouter";
import { useExam } from "@/hooks/use-exams";
import { useCreateAttempt } from "@/hooks/use-attempts";
import { useEffect, useState } from "react";
import {
  Loader2,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function Instructions() {
  /* =========================
     ROUTING
  ========================= */
  const { examId } = useParams<{ examId: string }>();
  const [, setLocation] = useLocation();

  const numericExamId = Number(examId);

  /* =========================
     DATA
  ========================= */
  const { data: exam, isLoading, isError } = useExam(numericExamId, {
    enabled: Number.isFinite(numericExamId) && numericExamId > 0,
  });

  const createAttempt = useCreateAttempt();

  /* =========================
     STATE
  ========================= */
  const [agreed, setAgreed] = useState(false);
  const [checking, setChecking] = useState(true);

  /* =========================
     GUARD – INVALID EXAM ID
  ========================= */
  useEffect(() => {
    if (!examId || Number.isNaN(numericExamId)) {
      setLocation("/dashboard");
    }
  }, [examId, numericExamId, setLocation]);

  /* =========================
     CHECK EXISTING ATTEMPT
  ========================= */
  useEffect(() => {
    async function checkAttempt() {
      try {
        const res = await fetch("/api/student/exam-status", {
          credentials: "include",
        });

        if (!res.ok) return;

        const data = await res.json();

        // ✅ Exam already completed
        if (data?.isCompleted) {
          setLocation("/dashboard");
          return;
        }

        // 🔥 Resume existing attempt
        if (data?.attemptId) {
          setLocation(`/test/${data.attemptId}`);
          return;
        }
      } finally {
        setChecking(false);
      }
    }

    checkAttempt();
  }, [setLocation]);

  /* =========================
     START EXAM
  ========================= */
  const handleStart = async () => {
    if (!exam || !agreed) return;

    try {
      const attempt = await createAttempt.mutateAsync({
        examId: exam.id,
      });

      // 🔥 IMPORTANT: route with ATTEMPT ID
      setLocation(`/test/${attempt.id}`);
    } catch (err) {
      console.error("Failed to start exam:", err);
      alert("Unable to start exam. Please try again.");
    }
  };

  /* =========================
     LOADING STATES
  ========================= */
  if (isLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (isError || !exam) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        Exam not found
      </div>
    );
  }

  /* =========================
     UI
  ========================= */
  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <div className="bg-blue-600 text-white py-4 px-6 shadow">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-xl font-bold">
            General Instructions
          </h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 md:p-8">
        <div className="bg-white rounded-xl border shadow-sm p-8">
          {/* EXAM INFO */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-blue-600" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {exam.title}
              </h2>

              <div className="flex gap-6 text-sm text-slate-500 mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {exam.durationMinutes} Minutes
                </span>

                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  {exam.totalMarks} Marks
                </span>
              </div>
            </div>
          </div>

          {/* INSTRUCTIONS */}
          <div className="prose max-w-none text-slate-700 text-sm leading-relaxed">
            <h3 className="text-lg font-bold text-black">
              Please read the instructions carefully
            </h3>

            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>
                The test will automatically submit when the timer reaches zero.
              </li>
              <li>
                Do not refresh, close, minimize, or switch browser tabs.
              </li>
              <li>
                Switching tabs multiple times may lead to auto-submission.
              </li>
              <li>
                Each question has only one correct answer.
              </li>
              <li>
                Once submitted, answers cannot be changed.
              </li>
            </ul>
          </div>

          {/* AGREEMENT */}
          <div className="mt-10 pt-6 border-t">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 w-5 h-5"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span className="text-slate-700 font-medium">
                I have read and understood all instructions and agree to follow
                them.
              </span>
            </label>

            <button
              onClick={handleStart}
              disabled={!agreed || createAttempt.isPending}
              className={`mt-6 w-full py-4 rounded-xl text-lg font-bold transition ${
                agreed
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {createAttempt.isPending
                ? "Starting Exam…"
                : "I am ready to begin"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
