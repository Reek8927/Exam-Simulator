import {
  Users,
  FileText,
  Calendar,
  BookOpen,
  Download,
  BarChart3,
  LogOut,
} from "lucide-react";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();

  async function releaseAdmitCards() {
    try {
      const res = await fetch("/api/admin/release-admit-cards", {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to release admit cards");
        return;
      }

      alert(
        `✅ Admit Cards Released Successfully\n\n` +
          `Exam: ${data.exam}\n` +
          `Students: ${data.releasedFor}`
      );
    } catch {
      alert("❌ Server error while releasing admit cards");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      {/* ================= HEADER ================= */}
      <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold tracking-wide">
          Admin Panel – JEE Main 2026
        </h1>

        <button
          onClick={async () => {
            await fetch("/api/admin/logout", {
              method: "POST",
              credentials: "include",
            });
            setLocation("/admin/login");
          }}
          className="text-sm underline flex items-center gap-2 hover:text-red-300 transition"
        >
          <LogOut size={16} /> Logout
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* ================= QUICK STATS ================= */}
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard title="Total Students" icon={<Users />} value="—" />
          <StatCard title="Submitted Applications" icon={<FileText />} value="—" />
          <StatCard title="Exams Created" icon={<Calendar />} value="—" />
          <StatCard title="Results Published" icon={<BarChart3 />} value="—" />
        </div>

        {/* ================= ACTIONS ================= */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AdminCard
            title="Create / Manage Exams"
            description="Create exam, date, time & duration"
            icon={<Calendar />}
            onClick={() => setLocation("/admin/exams")}
          />

          <AdminCard
            title="Upload Questions"
            description="MCQ & Numeric questions"
            icon={<BookOpen />}
            onClick={() => setLocation("/admin/questions")}
          />

          <AdminCard
            title="Manage Students"
            description="Verify applications & documents"
            icon={<Users />}
            onClick={() => setLocation("/admin/students")}
          />

          <AdminCard
            title="Assign Exam"
            description="Assign approved students to exams"
            icon={<Calendar />}
            onClick={() => setLocation("/admin/assign-exam")}
          />

          <AdminCard
            title="Release Admit Cards"
            description="Generate roll numbers & unlock admit cards"
            icon={<Download />}
            onClick={releaseAdmitCards}
            accent="blue"
          />

          <AdminCard
            title="Preview Admit Cards"
            description="Preview admit cards before students"
            icon={<FileText />}
            onClick={() => setLocation("/admin/admit-cards")}
          />
          <AdminCard
  title="Manage Notices"
  description="Create, pin & control student notices"
  icon={<FileText />}
  onClick={() => setLocation("/admin/notices")}
  accent="blue"
/>


          <AdminCard
            title="Publish Results"
            description="Preview, publish & unpublish results"
            icon={<BarChart3 />}
            onClick={() => setLocation("/admin/results")}
            accent="green"
          />
        </div>
      </div>
    </div>
  );
}

/* =====================
   SMALL COMPONENTS
===================== */

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: JSX.Element;
}) {
  return (
    <div className="bg-white border rounded-xl p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition">
      <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function AdminCard({
  title,
  description,
  icon,
  onClick,
  accent = "slate",
}: {
  title: string;
  description: string;
  icon: JSX.Element;
  onClick: () => void;
  accent?: "slate" | "blue" | "green";
}) {
  const accentStyles = {
    slate: "hover:border-slate-400",
    blue: "hover:border-blue-500",
    green: "hover:border-green-500",
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white border rounded-xl p-6 cursor-pointer transition-all
      hover:shadow-lg hover:-translate-y-1 ${accentStyles[accent]}`}
    >
      <div className="flex justify-between items-start gap-4">
        <div>
          <h3 className="font-bold mb-1 text-slate-800">{title}</h3>
          <p className="text-sm text-slate-600">{description}</p>
        </div>

        <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
          {icon}
        </div>
      </div>
    </div>
  );
}
