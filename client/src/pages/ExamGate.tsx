import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Clock, ShieldCheck } from "lucide-react";

type ExamStatus = {
  hasExam: boolean;
  canEnter: boolean;
  isLive: boolean;
  isCompleted?: boolean;
  examId?: number;
  attemptId?: number;
  secondsToStart?: number;
};

export default function ExamGate() {
  const [, setLocation] = useLocation();
  const redirectedRef = useRef(false);

  const { data, isLoading } = useQuery<ExamStatus>({
    queryKey: ["exam-status"],
    queryFn: async () => {
      const res = await fetch("/api/student/exam-status", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch exam status");
      return res.json();
    },
    refetchInterval: 5000,
  });

  /* ======================
     ⏱ LOCAL COUNTDOWN
     (UI ONLY – NO LOGIC CHANGE)
  ====================== */
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (typeof data?.secondsToStart === "number") {
      setSecondsLeft(data.secondsToStart);
    }
  }, [data?.secondsToStart]);

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;

    const t = setInterval(() => {
      setSecondsLeft(s => (s !== null ? s - 1 : s));
    }, 1000);

    return () => clearInterval(t);
  }, [secondsLeft]);

  /* ======================
     🔁 REDIRECT LOGIC (UNCHANGED)
  ====================== */
  useEffect(() => {
    if (!data || redirectedRef.current) return;

    if (data.isCompleted) {
      redirectedRef.current = true;
      setLocation("/dashboard");
      return;
    }

    if (data.attemptId) {
      redirectedRef.current = true;
      setLocation(`/test/${data.attemptId}`);
      return;
    }

    if (data.isLive && data.examId) {
      redirectedRef.current = true;
      setLocation(`/instructions/${data.examId}`);
    }
  }, [data, setLocation]);

  /* ======================
     UI STATES
  ====================== */
  if (isLoading) {
    return <GateShell title="Preparing exam environment…" />;
  }

  if (!data?.hasExam) {
    return <GateShell title="No exam assigned" muted />;
  }

  const mins =
    secondsLeft !== null ? Math.floor(secondsLeft / 60) : null;
  const secs =
    secondsLeft !== null ? secondsLeft % 60 : null;

  return (
    <GateShell>
      <div className="flex flex-col items-center gap-8">
        <div className="relative">
          <div className="w-36 h-36 rounded-full border-4 border-indigo-500/30 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Clock size={46} className="text-indigo-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white tracking-wide">
          Exam Gate
        </h1>

        {data.isLive ? (
          <p className="text-green-400 flex items-center gap-2">
            <ShieldCheck size={18} />
            Exam is live. Verifying access…
          </p>
        ) : secondsLeft !== null ? (
          <>
            <p className="text-slate-300">
              Exam starts in
            </p>
            <div className="text-4xl font-mono text-indigo-400 tracking-widest">
              {String(mins).padStart(2, "0")}:
              {String(secs).padStart(2, "0")}
            </div>
          </>
        ) : (
          <p className="text-slate-400">
            Checking exam timing…
          </p>
        )}
      </div>
    </GateShell>
  );
}

/* ======================
   🌑 DARK UI SHELL
====================== */
function GateShell({
  title,
  muted,
  children,
}: {
  title?: string;
  muted?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black flex items-center justify-center">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl px-10 py-14 w-full max-w-md text-center shadow-2xl">
        {title && (
          <h2
            className={`text-xl font-semibold mb-6 ${
              muted ? "text-slate-400" : "text-indigo-400"
            }`}
          >
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
