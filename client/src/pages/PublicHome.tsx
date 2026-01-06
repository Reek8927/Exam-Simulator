import { Link } from "wouter";
import {
  GraduationCap,
  ClipboardList,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

type PublicNotice = {
  id: number;
  title: string;
  description: string;
  priority: "urgent" | "important" | "normal";
  isPinned: boolean;
  createdAt: string;
};

export default function PublicHome() {
  const glowRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  /* ================= CURSOR GLOW ================= */
  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;

    let raf = 0;
    const move = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        glow.style.transform = `translate(${e.clientX - 200}px, ${e.clientY - 200}px)`;
      });
    };

    window.addEventListener("mousemove", move);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", move);
    };
  }, []);

  /* ================= SCROLL PROGRESS ================= */
  useEffect(() => {
    const onScroll = () => {
      const scroll =
        window.scrollY /
        (document.body.scrollHeight - window.innerHeight);
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${scroll})`;
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ================= PUBLIC NOTICES (BACKEND) ================= */
  const { data: notices = [], isLoading } = useQuery<PublicNotice[]>({
    queryKey: ["public-notices"],
    queryFn: async () => {
      const res = await fetch("/api/notices/public", {  method: "GET",
      cache: "no-store",          // 🔥 IMPORTANT
      credentials: "include",     // 🔒 safe even for public
    });
      if (!res.ok) throw new Error("Failed to load notices");
      return res.json();
    },
      staleTime: 0,                  // 🔥 always fresh
  refetchOnMount: true,          // 🔥 refetch after refresh
  refetchOnWindowFocus: false,
  });

 /* ================= SCROLL REVEAL (FIXED) ================= */
/* ================= SCROLL REVEAL (FIXED & TS SAFE) ================= */
useEffect(() => {
  const elements = document.querySelectorAll(".reveal");
  if (elements.length === 0) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-active");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  elements.forEach(el => observer.observe(el));

  return () => observer.disconnect();
}, [notices.length]); // ✅ SAFE dependency

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">

      {/* Scroll Progress */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-white/10 z-[999]">
        <div
          ref={progressRef}
          className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 origin-left scale-x-0 transition-transform duration-100"
        />
      </div>

      {/* Cursor Glow */}
      <div
        ref={glowRef}
        className="pointer-events-none fixed w-[400px] h-[400px] rounded-full bg-blue-500/20 blur-[120px] z-0 transition-transform duration-75"
      />

      {/* Parallax Blobs */}
      <div className="blob blob-blue" />
      <div className="blob blob-purple" />

      {/* ================= HEADER ================= */}
      <header className="relative z-10 backdrop-blur-xl bg-white/5 border-b border-white/10 sticky top-0">
        <div className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center reveal">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 font-bold flex items-center justify-center shadow-lg">
              NTA
            </div>
            <div>
              <h1 className="font-semibold">National Testing Agency</h1>
              <p className="text-xs text-blue-300">JEE (Main) 2026</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Link href="/login">
              <a className="btn">Candidate Login</a>
            </Link>
            <Link href="/admin/AdminLogin">
              <a className="btn alt">Admin Login</a>
            </Link>
          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 py-36 grid md:grid-cols-2 gap-28 items-center">
        <div className="reveal">
          <h2 className="text-[64px] font-black leading-tight mb-8">
            JEE MAIN <span className="neon">2026</span>
          </h2>
          <p className="text-xl text-blue-200 mb-12 max-w-xl">
            Secure, modern examination platform with seamless digital experience.
          </p>
          <div className="flex gap-6">
            <Link href="/register/declaration">
              <a className="btn glow">Start Registration</a>
            </Link>
            <Link href="/login">
              <a className="btn outline">Enter Portal</a>
            </Link>
          </div>
        </div>

        <div className="reveal glass">
          <h3 className="text-2xl font-bold mb-6 neon">
            Important Information
          </h3>
          <ul className="space-y-4 text-blue-100">
            <li className="flex gap-3">
              <ShieldCheck className="text-green-400" />
              Registration mandatory
            </li>
            <li className="flex gap-3">
              <FileText className="text-green-400" />
              Digital admit cards
            </li>
            <li className="flex gap-3">
              <ClipboardList className="text-green-400" />
              Verify details carefully
            </li>
          </ul>
        </div>
      </section>

      {/* ================= NOTICE BOARD ================= */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 py-24">
        <h3 className="text-4xl font-bold text-center mb-16 neon reveal">
          Public Notices
        </h3>

        <div className="grid md:grid-cols-2 gap-10">
          {isLoading ? (
  <div className="text-blue-300">Loading notices…</div>
) : notices.length === 0 ? (
  <div className="text-blue-300">No notices available</div>
) : (
  notices.map(notice => (
    <div key={notice.id} className="notice reveal group">
      <div className="flex justify-between items-center mb-3">
        <span className={`badge ${notice.priority}`}>
          {notice.priority}
        </span>
        <span className="text-xs text-blue-300">
          {new Date(notice.createdAt).toLocaleDateString("en-GB")}
        </span>
      </div>

      <h4 className="text-lg font-semibold leading-snug">
        {notice.isPinned && "📌 "}
        {notice.title}
      </h4>

      {/* description on hover ONLY */}
      <p
        className="
          mt-3 text-sm text-blue-200
          opacity-0 max-h-0
          group-hover:opacity-100 group-hover:max-h-40
          transition-all duration-500 overflow-hidden
        "
      >
        {notice.description}
      </p>
    </div>
  ))
)}

        </div>
      </section>

      {/* ================= APPLICATION FLOW ================= */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 py-28">
        <h3 className="text-4xl font-bold text-center mb-20 neon reveal">
          Application Flow
        </h3>

        <div className="grid md:grid-cols-4 gap-12">
          {[
            { icon: <ClipboardList />, title: "Register" },
            { icon: <FileText />, title: "Apply" },
            { icon: <ShieldCheck />, title: "Pay" },
            { icon: <GraduationCap />, title: "Exam" },
          ].map((s, i) => (
            <div key={i} className="step reveal">
              <div className="step-icon">{s.icon}</div>
              <h4 className="mt-4 font-semibold">{s.title}</h4>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="relative z-10 border-t border-white/10 bg-white/5 backdrop-blur-xl reveal">
        <div className="max-w-7xl mx-auto px-8 py-8 text-center text-blue-300">
          © {new Date().getFullYear()} National Testing Agency
        </div>
      </footer>
   

      {/* ================= STYLES ================= */}
      <style>{`
        .blob {
          position: absolute;
          width: 520px;
          height: 520px;
          border-radius: 50%;
          filter: blur(140px);
          opacity: 0.45;
          animation: float 20s ease-in-out infinite;
        }
        .blob-blue { background:#3b82f6; top:-200px; left:-200px; }
        .blob-purple { background:#8b5cf6; top:30%; right:-200px; animation-delay:5s; }

        @keyframes float {
          50% { transform: translateY(-60px); }
        }

        .btn {
          padding: 14px 28px;
          border-radius: 14px;
          font-weight: 600;
          background: linear-gradient(135deg,#3b82f6,#6366f1);
          transition: all .35s ease;
        }
        .btn.alt {
          background: linear-gradient(135deg,#8b5cf6,#6366f1);
        }
        .btn.glow {
          box-shadow: 0 0 30px #6366f1aa;
        }
        .btn.outline {
          background: transparent;
          border: 1px solid #6366f1;
        }
        .btn:hover {
          transform: scale(1.08);
          box-shadow: 0 0 40px #6366f1cc;
        }

        .glass {
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(24px);
          border-radius: 28px;
          padding: 40px;
          border: 1px solid rgba(255,255,255,0.15);
        }

        .step {
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 40px;
          text-align: center;
          transition: transform .5s;
        }
        .step:hover { transform: scale(1.08); }

        .step-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg,#3b82f6,#6366f1);
          display:flex;
          align-items:center;
          justify-content:center;
          margin:auto;
        }

        .notice {
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(18px);
          border-radius: 22px;
          padding: 28px;
          border: 1px solid rgba(255,255,255,0.15);
          transition: transform .4s ease, box-shadow .4s ease;
        }
        .notice:hover {
          transform: translateY(-8px);
          box-shadow: 0 0 35px rgba(99,102,241,0.35);
        }

        .badge {
          padding: 4px 12px;
          font-size: 11px;
          border-radius: 999px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .badge.important { background:#3b82f640; color:#93c5fd; }
.badge.urgent { background:#ef444440; color:#fca5a5; }
.badge.normal { background:#3b82f640; color:#93c5fd; }

        .badge.info { background:#22c55e40; color:#86efac; }
        .badge.new { background:#a855f740; color:#d8b4fe; }

        .neon {
          background: linear-gradient(90deg,#60a5fa,#a78bfa,#60a5fa);
          background-size: 200%;
          -webkit-background-clip: text;
          color: transparent;
          animation: neonMove 6s linear infinite;
        }
        @keyframes neonMove {
          to { background-position: 200%; }
        }

        .reveal {
          opacity: 0;
          transform: translateY(24px);
        }
        .reveal-active {
          opacity: 1;
          transform: translateY(0);
          transition: all 0.8s cubic-bezier(.22,1,.36,1);
        }
      `}</style>
    </div>
  );
}
