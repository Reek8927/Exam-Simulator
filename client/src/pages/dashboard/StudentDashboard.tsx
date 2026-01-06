import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import {
  FileText,
  User,
  CreditCard,
  Download,
  Lock,
  CheckCircle,
  Clock,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";



/* =====================
   TYPES
===================== */

type Application = {
  submitted: boolean;
  admitCardIssued: boolean;
  paymentStatus: string | null;
};

type ExamStatus = {
  hasExam: boolean;
  canEnter: boolean;
  isLive: boolean;
  isCompleted?: boolean;
  secondsToStart?: number;
  examId?: number;
  attemptId?: number; 
  resultDeclared?: boolean;
  answerKeyPublished?: boolean;
};
type Notice = {
  id: number;
  title: string;
  description: string;
  priority: "urgent" | "important" | "normal";
  isPinned: boolean;
  createdAt: string;
};


export default function StudentDashboard() {
  const { data: user, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  /* =====================
     APPLICATION
  ===================== */
  const { data: application, isLoading: appLoading } =
    useQuery<Application | null>({
      queryKey: ["application"],
      queryFn: async () => {
        const res = await fetch("/api/application", {
          credentials: "include",
        });
        if (!res.ok) return null;
        return res.json();
      },
      refetchOnMount: "always",
    });

  /* =====================
     EXAM STATUS
  ===================== */
  const { data: examStatus } = useQuery<ExamStatus | null>({
    queryKey: ["exam-status"],
    queryFn: async () => {
      const res = await fetch("/api/student/exam-status", {
        credentials: "include",
      });
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 60_000,
  });

  /* =====================
     STUDENT NOTICES ✅ MUST BE HERE
  ===================== */
  const { data: notices = [] } = useQuery<Notice[]>({
    queryKey: ["student-notices"],
    queryFn: async () => {
      const res = await fetch("/api/student/notices", {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  /* =====================
     RETURNS (ONLY AFTER ALL HOOKS)
  ===================== */
  if (isLoading || appLoading) {
    return <div className="p-8 text-slate-600">Loading dashboard…</div>;
  }

  if (!user) return null;

  /* =====================
     DERIVED STATES
  ===================== */

  const applicationCompleted =
    application?.submitted === true ||
    application?.paymentStatus === "success";

  const admitCardReleased = Boolean(application?.admitCardIssued);
  const examCompleted = Boolean(examStatus?.isCompleted);
  const examLive = Boolean(examStatus?.isLive);
  const examEntryOpen = Boolean(examStatus?.canEnter);

  const hasUpcomingExam =
    examStatus?.hasExam &&
    typeof examStatus.secondsToStart === "number" &&
    examStatus.secondsToStart > 15 * 60;

  const minutesToStart =
    examStatus?.secondsToStart != null
      ? Math.ceil(examStatus.secondsToStart / 60)
      : null;

      const answerKeyAvailable =
  Boolean(examStatus?.answerKeyPublished) &&
  Boolean(examStatus?.attemptId);


  const resultDeclared = Boolean(examStatus?.resultDeclared);
  /* =====================
     UI
  ===================== */

  return (
    <div className="min-h-screen bg-slate-100">
      {/* HEADER */}
      <header className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">
          JEE Main 2026 – Candidate Dashboard
        </h1>

        <button
          onClick={async () => {
            await fetch("/api/auth/logout", {
              method: "POST",
              credentials: "include",
            });
            queryClient.clear();
            setLocation("/login");
          }}
          className="text-sm underline opacity-90 hover:opacity-100"
        >
          Logout
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* CANDIDATE INFO */}
        <div className="bg-white rounded-xl border p-6 flex justify-between items-center shadow-sm">
          <div>
            <h2 className="font-bold text-lg">Welcome, {user.name}</h2>
            <p className="text-sm text-slate-600">
              Application No: <b>{user.applicationNo}</b>
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="w-4 h-4 text-blue-600" />
            Last Login: Today
          </div>
        </div>

        {/* STATUS CARDS */}
        <div className="grid md:grid-cols-4 gap-6">
          <StatusCard
            title="Application Form"
            icon={<FileText />}
            status={applicationCompleted ? "Completed" : "Pending"}
            color={applicationCompleted ? "green" : "yellow"}
          />

          <StatusCard
            title="Admit Card"
            icon={<Download />}
            status={admitCardReleased ? "Available" : "Locked"}
            color={admitCardReleased ? "green" : "gray"}
          />

          <StatusCard
            title="Exam Status"
            icon={<BookOpen />}
            status={
              examCompleted
                ? "Completed"
                : examLive
                ? "Live"
                : examEntryOpen
                ? "Entry Open"
                : hasUpcomingExam
                ? "Upcoming"
                : "Not Scheduled"
            }
            color={
              examCompleted || examLive
                ? "green"
                : examEntryOpen
                ? "yellow"
                : "gray"
            }
          />

          <StatusCard
            title="Result"
            icon={<CheckCircle />}
            status={resultDeclared ? "Declared" : "Pending"}
            color={resultDeclared ? "green" : "gray"}
          />
        </div>

        {/* NOTICE BOARD */}
<div className="bg-white rounded-xl border p-6 shadow-sm">
  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
    <FileText className="w-5 h-5 text-blue-700" />
    Notices & Announcements
  </h2>

  {notices.length === 0 ? (
    <p className="text-sm text-slate-500">
      No notices available at the moment.
    </p>
  ) : (
    <div className="space-y-4">
      {notices.map(notice => (
        <div
          key={notice.id}
          className={`border-l-4 rounded-md p-4 ${
            notice.priority === "urgent"
              ? "border-red-600 bg-red-50"
              : notice.priority === "important"
              ? "border-yellow-500 bg-yellow-50"
              : "border-blue-600 bg-blue-50"
          }`}
        >
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-sm">
              {notice.isPinned && "📌 "}
              {notice.title}
            </h3>
            <span className="text-xs text-slate-500">
              {new Date(notice.createdAt).toLocaleDateString("en-GB")}
            </span>
          </div>

          <p className="text-sm text-slate-700 mt-1 whitespace-pre-line">
            {notice.description}
          </p>
        </div>
      ))}
    </div>
  )}
</div>


        {/* DOWNLOADS */}
        {applicationCompleted && (
          <div className="grid md:grid-cols-2 gap-6">
            <DownloadCard
              title="Download Confirmation Page"
              subtitle="Official application confirmation PDF"
              href="/api/application/pdf"
              icon={<Download />}
            />

            <DownloadCard
              title="Download Payment Receipt"
              subtitle="Fee payment receipt"
              href="/api/payment/receipt"
              icon={<CreditCard />}
            />
          </div>
        )}

        {/* ACTIONS */}
        <div className="grid md:grid-cols-2 gap-6">
          <DashboardCard
            title="Fill Application Form"
            description="Complete personal, academic details & payment"
            icon={<User />}
            enabled={!applicationCompleted}
            link="/application-form"
          />

          <DashboardCard
            title="Download Admit Card"
            description="Available after admin release"
            icon={<Download />}
            enabled={admitCardReleased}
            link="/api/admit-card"
            external
          />

          {/* 🔒 HARD LOCKED EXAM CARD */}
          {examCompleted ? (
            <DashboardCard
              title="Examination"
              description="Exam completed successfully. Re-entry is not allowed."
              icon={<CheckCircle />}
              enabled={false}
            />
          ) : (
            <DashboardCard
              title="Start Examination"
              description={
                examLive
                  ? "Exam is live now"
                  : examEntryOpen
                  ? "You can enter the exam hall"
                  : hasUpcomingExam
                  ? `Exam starts in ${minutesToStart} minutes`
                  : "Exam not available"
              }
              icon={<BookOpen />}
              enabled={examLive || examEntryOpen}
              link="/exam-gate"
            />
          )}

        <DashboardCard
  title="Answer Key & Response Sheet"
  description={
    answerKeyAvailable
      ? "View correct answers and your responses"
      : "Answer key not published yet"
  }
  icon={<BookOpen />}
  enabled={answerKeyAvailable}
  link={
    answerKeyAvailable
      ? `/answer-key/${examStatus!.attemptId}`
      : undefined
  }
/>




         <DashboardCard
  title="View Result"
  description="Check your exam score and percentile"
  icon={<CheckCircle />}
  enabled={resultDeclared && !!examStatus?.attemptId}
  link={
    examStatus?.attemptId
      ? `/result/${examStatus.attemptId}`
      : undefined
  }
/>


        </div>

        <div className="text-center text-xs text-slate-500 pt-6">
          © NTA JEE Main 2026 (Demo Portal)
        </div>
      </div>
    </div>
  );
}

/* =====================
   REUSABLE COMPONENTS
===================== */

function StatusCard({
  title,
  icon,
  status,
  color,
}: {
  title: string;
  icon: JSX.Element;
  status: string;
  color: "green" | "yellow" | "gray";
}) {
  const colors = {
    green: "text-green-700 bg-green-50 border-green-200",
    yellow: "text-yellow-700 bg-yellow-50 border-yellow-200",
    gray: "text-slate-600 bg-slate-50 border-slate-200",
  };

  return (
    <div className={`border rounded-xl p-4 flex gap-4 ${colors[color]}`}>
      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs">{status}</p>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  icon,
  enabled,
  link,
  external,
}: {
  title: string;
  description: string;
  icon: JSX.Element;
  enabled: boolean;
  link?: string;
  external?: boolean;
}) {
  const card = (
    <div
      className={`border rounded-xl p-6 flex justify-between items-center transition-all ${
        enabled
          ? "bg-white hover:shadow-md hover:-translate-y-[1px]"
          : "bg-slate-100 opacity-60"
      }`}
    >
      <div>
        <h3 className="font-bold">{title}</h3>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        {!enabled && <Lock size={18} />}
        {icon}
      </div>
    </div>
  );

  if (!enabled || !link) return card;
  if (external)
    return (
      <a href={link} target="_blank" rel="noopener noreferrer">
        {card}
      </a>
    );

  return <Link href={link}>{card}</Link>;
}

function DownloadCard({
  title,
  subtitle,
  href,
  icon,
}: {
  title: string;
  subtitle: string;
  href: string;
  icon: JSX.Element;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="border rounded-xl p-6 flex justify-between items-center bg-white hover:shadow-md transition-all"
    >
      <div>
        <h3 className="font-bold mb-1">{title}</h3>
        <p className="text-sm text-slate-600">{subtitle}</p>
      </div>
      {icon}
    </a>
  );
}
