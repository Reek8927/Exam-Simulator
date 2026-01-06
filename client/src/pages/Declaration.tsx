import { useLocation } from "wouter";
import { useState } from "react";

export default function Declaration() {
  const [, setLocation] = useLocation();
  const [checked, setChecked] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="bg-white max-w-3xl p-8 rounded-xl shadow border">

        <h1 className="text-2xl font-bold mb-4">
          JEE (Main) 2026 – Declaration
        </h1>

        <div className="text-sm text-slate-700 space-y-2 h-64 overflow-y-auto border p-4 rounded">
          <p>• I confirm that the information entered is correct.</p>
          <p>• Any incorrect information may lead to rejection.</p>
          <p>• I agree to all JEE (Main) rules and conditions.</p>
        </div>

        <label className="flex gap-2 mt-4 text-sm">
          <input
            type="checkbox"
            checked={checked}
            onChange={e => setChecked(e.target.checked)}
          />
          I agree to the declaration
        </label>

        <button
          disabled={!checked}
          onClick={() => setLocation("/register/basic")}
          className="mt-6 w-full bg-blue-600 text-white py-3 rounded font-bold disabled:opacity-50"
        >
          Proceed to Registration
        </button>
      </div>
    </div>
  );
}
