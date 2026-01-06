import { useParams, useLocation } from "wouter";
import {
  useAttempt,
  useSubmitAttempt,
  useUpsertResponse,
} from "@/hooks/use-attempts";
import { useExam } from "@/hooks/use-exams";
import {
  Loader2,
  Save,
  CheckSquare,
  User,
  AlertTriangle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Timer } from "@/components/Timer";
import { QuestionPalette } from "@/components/QuestionPalette";
import { differenceInSeconds } from "date-fns";
import { clsx } from "clsx";
import { useQueryClient } from "@tanstack/react-query";

/* =====================
   TYPES
===================== */

type ResponseStatus =
  | "not_visited"
  | "not_answered"
  | "answered"
  | "marked_for_review"
  | "answered_and_marked";

export default function TestInterface() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  /* =====================
     PARAM
  ===================== */

  const { attemptId } = useParams<{ attemptId: string }>();
  const numericAttemptId = Number(attemptId);

  if (!attemptId || Number.isNaN(numericAttemptId)) {
    return (
      <div className="h-screen flex items-center justify-center text-red-600">
        Invalid attempt
      </div>
    );
  }

  /* =====================
     DATA
  ===================== */

  const attemptQuery = useAttempt(numericAttemptId);
  const attempt = attemptQuery.data ?? null;

  const examQuery = useExam(attempt?.examId, {
    enabled: !!attempt?.examId,
  });
  const exam = examQuery.data ?? null;

  const submitAttempt = useSubmitAttempt();
  const upsertResponse = useUpsertResponse();

  /* =====================
     STATE
  ===================== */

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState<string>("");
  const [startTime, setStartTime] = useState(Date.now());
  const [warning, setWarning] = useState<string | null>(null);

  const finalizedRef = useRef(false);
  const autoSubmitRef = useRef(false);
  const violationCountRef = useRef(0);

  /* =====================
     DERIVED
  ===================== */

  const isLoading = attemptQuery.isLoading || examQuery.isLoading;
  const questions = exam?.questions ?? [];
  const currentQuestion = questions[currentIndex] ?? null;

  const currentResponse = useMemo(() => {
    if (!attempt || !currentQuestion) return null;
    return (
      attempt.responses.find(
        r => r.questionId === currentQuestion.id
      ) ?? null
    );
  }, [attempt, currentQuestion]);

  const remainingTime = useMemo(() => {
    if (!attempt || !exam) return 0;
    const elapsed = differenceInSeconds(
      new Date(),
      new Date(attempt.startTime!)
    );
    return Math.max(0, exam.durationMinutes * 60 - elapsed);
  }, [attempt, exam]);

  /* =====================
     CORE HANDLERS
  ===================== */

  const forceSubmit = async (reason: string) => {
    if (!attempt || autoSubmitRef.current) return;

    autoSubmitRef.current = true;
    alert(`Exam auto-submitted.\nReason: ${reason}`);

    await submitAttempt.mutateAsync(attempt.id);

    queryClient.invalidateQueries({ queryKey: ["exam-status"] });
    setLocation("/dashboard");
  };

  const saveAndNext = async () => {
    if (!attempt || !currentQuestion) return;

    const timeSpent =
      Math.floor((Date.now() - startTime) / 1000) +
      (currentResponse?.timeSpent ?? 0);

    await upsertResponse.mutateAsync({
      attemptId: attempt.id,
      questionId: currentQuestion.id,
      selectedAnswer: answer || null,
      status: (answer ? "answered" : "not_answered") as ResponseStatus,
      timeSpent,
    });

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
    }
  };

  const submitTest = async () => {
    if (!attempt || autoSubmitRef.current) return;
    if (!confirm("Submit test?")) return;

    autoSubmitRef.current = true;
    await submitAttempt.mutateAsync(attempt.id);

    queryClient.invalidateQueries({ queryKey: ["exam-status"] });
    setLocation("/dashboard");
  };

  /* =====================
     ANTI-CHEAT EFFECTS
  ===================== */

  useEffect(() => {
    if (!attempt || attempt.status === "completed") return;

    /* FULLSCREEN */
    const enterFullscreen = async () => {
      if (!document.fullscreenElement) {
        try {
          await document.documentElement.requestFullscreen();
        } catch {}
      }
    };
    enterFullscreen();

    /* TAB / WINDOW SWITCH */
    const onBlur = () => {
      violationCountRef.current++;
      forceSubmit("Window or tab switched");
    };

    /* EXIT FULLSCREEN */
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        forceSubmit("Exited fullscreen mode");
      }
    };

    /* KEYBOARD SHORTCUT BLOCK */
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey &&
          ["c", "v", "x", "a", "u", "s"].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
        setWarning("Restricted key pressed");
      }
    };

    /* RIGHT CLICK */
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setWarning("Right click disabled");
    };

    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("contextmenu", onContextMenu);

    return () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("contextmenu", onContextMenu);
    };
  }, [attempt]);

  /* =====================
     EFFECTS
  ===================== */

  useEffect(() => {
    if (currentResponse?.selectedAnswer) {
      setAnswer(currentResponse.selectedAnswer);
    } else {
      setAnswer("");
    }
    setStartTime(Date.now());
  }, [currentQuestion?.id]);

  useEffect(() => {
    if (attempt?.status === "completed" && !finalizedRef.current) {
      finalizedRef.current = true;
      setLocation(`/result/${attempt.id}`);
    }
  }, [attempt?.status]);

  /* =====================
     RENDER
  ===================== */

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!attempt || !exam || questions.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center">
        No questions found
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 select-none">
      {/* WARNING BAR */}
      {warning && (
        <div className="bg-red-600 text-white text-sm px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {warning}
        </div>
      )}

      <header className="h-16 bg-white border-b px-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-slate-500" />
          <span className="font-semibold">JEE CBT</span>
        </div>

        <Timer initialSeconds={remainingTime} onTimeUp={submitTest} />
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto">
          <h2 className="font-bold text-lg mb-4">
            Question {currentIndex + 1}
          </h2>

          <p className="mb-4">{currentQuestion.text}</p>

          {currentQuestion.imageUrl && (
            <img
              src={currentQuestion.imageUrl}
              className="max-w-full mb-6 rounded border"
              alt="Question"
            />
          )}

          {currentQuestion.type === "MCQ" &&
            currentQuestion.options?.map(
              (opt: string, i: number) => (
                <label
                  key={i}
                  className={clsx(
                    "block p-3 mb-2 border rounded cursor-pointer",
                    answer === String(i) &&
                      "bg-blue-50 border-blue-500"
                  )}
                >
                  <input
                    type="radio"
                    className="hidden"
                    checked={answer === String(i)}
                    onChange={() => setAnswer(String(i))}
                  />
                  {opt}
                </label>
              )
            )}

          {currentQuestion.type === "NUMERIC" && (
            <input
              type="number"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              className="border p-3 rounded w-64"
            />
          )}

          <button
            onClick={saveAndNext}
            className="mt-6 px-6 py-2 bg-green-600 text-white rounded"
          >
            <Save className="inline w-4 h-4 mr-2" />
            Save & Next
          </button>
        </div>

        <div className="w-80 border-l bg-white p-4 hidden lg:block">
          <QuestionPalette
            questions={questions}
            responses={attempt.responses}
            currentQuestionId={currentQuestion.id}
            onQuestionSelect={(id: number) => {
              const idx = questions.findIndex(q => q.id === id);
              if (idx !== -1) setCurrentIndex(idx);
            }}
          />

          <button
            onClick={submitTest}
            className="mt-4 w-full py-3 bg-blue-600 text-white rounded"
          >
            <CheckSquare className="inline w-4 h-4 mr-2" />
            Submit Test
          </button>
        </div>
      </div>
    </div>
  );
}
