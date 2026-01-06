import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

export default function Login() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [applicationNo, setApplicationNo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!applicationNo || !password) {
      setError("Please enter Application Number and Password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          applicationNo: applicationNo.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid credentials");
        setLoading(false);
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      setLocation("/dashboard");
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#050816] overflow-hidden px-4">

      {/* ===== Background Glow ===== */}
      <div className="absolute -top-40 -left-40 w-[420px] h-[420px] bg-blue-600/30 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-200px] right-[-200px] w-[420px] h-[420px] bg-indigo-600/30 rounded-full blur-[120px]" />

      {/* ===== Login Card ===== */}
      <form
        onSubmit={submit}
        className="relative w-full max-w-md p-8 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-2xl space-y-6 animate-login"
      >
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-white tracking-wide">
            JEE (Main) Candidate Login
          </h1>
          <p className="text-sm text-blue-200">
            Login using Application Number & Password
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-400/40 text-red-300 text-sm p-3 rounded-lg animate-error">
            {error}
          </div>
        )}

        {/* Inputs */}
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Application Number"
            value={applicationNo}
            onChange={(e) => setApplicationNo(e.target.value)}
            autoComplete="off"
            className="w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder:text-blue-200 border border-white/20 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 transition"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder:text-blue-200 border border-white/20 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 transition"
          />
        </div>

        {/* Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-[0_0_30px_#6366f1aa] hover:scale-[1.02] transition-all disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Footer */}
        <div className="text-xs text-center text-blue-300">
          Forgot password? Contact helpdesk
        </div>
      </form>

      {/* ===== Animations ===== */}
      <style>{`
        @keyframes login {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-login {
          animation: login 0.8s cubic-bezier(.22,1,.36,1);
        }

        @keyframes error {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-error {
          animation: error 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
