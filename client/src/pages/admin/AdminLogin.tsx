import { useState } from "react";
import { useLocation } from "wouter";

export default function AdminLogin() {
  const [, setLocation] = useLocation();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const update = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.username || !form.password) {
      alert("Enter username and password");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      alert("Invalid admin credentials");
      return;
    }

    // ✅ success → admin dashboard
    setLocation("/admin/AdminDashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <form
        onSubmit={submit}
        className="bg-white w-full max-w-md p-8 rounded-xl shadow border space-y-6"
      >
        <h1 className="text-2xl font-bold text-center text-blue-700">
          Admin Login
        </h1>

        <p className="text-sm text-center text-slate-500">
          JEE Main Examination Portal
        </p>

        <input
          name="username"
          placeholder="Admin Username"
          className="input w-full"
          value={form.username}
          onChange={update}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          className="input w-full"
          value={form.password}
          onChange={update}
        />

        <button
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        <p className="text-xs text-center text-slate-500">
          Authorized personnel only
        </p>
      </form>
    </div>
  );
}
