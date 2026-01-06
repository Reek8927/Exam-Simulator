import { useState } from "react";
import { useLocation } from "wouter";

export default function RegisterBasic() {
  const [, setLocation] = useLocation();

  const [form, setForm] = useState({
    candidateName: "",
    fatherName: "",
    motherName: "",
    dob: "",
    gender: "",
    category: "",
    mobile: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);

  const update = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const submit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!form.candidateName || !form.email || !form.mobile) {
    alert("Please fill all required fields");
    return;
  }

  setLoading(true);

  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: form.candidateName,   // ✅ CRITICAL FIX
      email: form.email,
      mobile: form.mobile,
      fatherName: form.fatherName,
      motherName: form.motherName,
      dob: form.dob,
      gender: form.gender,
      category: form.category,
    }),
  });

  const data = await res.json();
  setLoading(false);

  if (!res.ok) {
    alert(data.message || "Registration failed");
    return;
  }

  setLocation(`/register-success/${data.applicationNo}`);

};


  return (
    <div className="min-h-screen bg-[#f5f7fb] py-10">
      <div className="max-w-4xl mx-auto bg-white border shadow-sm rounded">

        {/* Header */}
        <div className="border-b bg-blue-900 text-white p-4">
          <h1 className="text-xl font-bold">
            JEE (Main) 2026 – New Registration
          </h1>
          <p className="text-sm text-blue-100">
            Please fill details as per Class 10 Certificate
          </p>
        </div>

        <form onSubmit={submit} className="p-6 space-y-8">

          {/* Candidate Details */}
          <section>
            <h2 className="font-bold text-blue-800 mb-4">
              Candidate Details
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                name="candidateName"
                placeholder="Candidate Name"
                className="input"
                onChange={update}
                required
              />
              <input
                name="dob"
                type="date"
                className="input"
                onChange={update}
                required
              />
            </div>
          </section>

          {/* Parents */}
          <section>
            <h2 className="font-bold text-blue-800 mb-4">
              Parent Details
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                name="fatherName"
                placeholder="Father's Name"
                className="input"
                onChange={update}
              />
              <input
                name="motherName"
                placeholder="Mother's Name"
                className="input"
                onChange={update}
              />
            </div>
          </section>

          {/* Personal */}
          <section>
            <h2 className="font-bold text-blue-800 mb-4">
              Personal Details
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <select name="gender" className="input" onChange={update}>
                <option value="">Gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Third Gender</option>
              </select>

              <select name="category" className="input" onChange={update}>
                <option value="">Category</option>
                <option>General</option>
                <option>OBC-NCL</option>
                <option>SC</option>
                <option>ST</option>
                <option>EWS</option>
              </select>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="font-bold text-blue-800 mb-4">
              Contact Details
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                name="mobile"
                placeholder="Mobile Number"
                className="input"
                onChange={update}
                required
              />
              <input
                name="email"
                type="email"
                placeholder="Email ID"
                className="input"
                onChange={update}
                required
              />
            </div>
          </section>

          {/* Info Box */}
          <div className="bg-yellow-50 border border-yellow-300 p-4 text-sm text-yellow-800 rounded">
            📌 Application Number & Password will be sent to your registered
            mobile number and email ID.
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-blue-700 text-white font-bold rounded hover:bg-blue-800 disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit & Generate Credentials"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
