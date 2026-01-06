import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { CheckCircle, XCircle } from "lucide-react";

type ApplicationData = {
  studentId: number;
  name: string;
  applicationNo: string;
  category: string;
  photoUrl?: string;
  signatureUrl?: string;
  class10CertUrl?: string;
  categoryCertUrl?: string;
  applicationStatus: "pending" | "approved" | "rejected";
};

export default function AdminStudentVerify() {
  const [, params] = useRoute("/admin/students/verify/:id");
  const studentId = Number(params?.id);

  const [, setLocation] = useLocation();

  const [data, setData] = useState<ApplicationData | null>(null);
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function fetchApplication() {
    setLoading(true);

    const res = await fetch(`/api/admin/students/${studentId}`, {
      credentials: "include",
    });

    if (!res.ok) {
      alert("Failed to load application");
      setLocation("/admin/students");
      return;
    }

    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  async function submit(status: "approved" | "rejected") {
    if (saving) return;

    setSaving(true);

    const res = await fetch(
      `/api/admin/students/${studentId}/verify`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, remark }),
      }
    );

    if (!res.ok) {
      alert("Failed to update application");
      setSaving(false);
      return;
    }

    // ✅ IMPORTANT: redirect ONLY after DB success
    setLocation("/admin/students");
  }

  useEffect(() => {
    if (!Number.isNaN(studentId)) {
      fetchApplication();
    }
  }, [studentId]);

  if (loading) {
    return <div className="p-8">Loading application…</div>;
  }

  if (!data) {
    return <div className="p-8">Application not found</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">Verify Application</h1>

      <div className="bg-white border rounded-xl p-6 space-y-4">
        <p><b>Name:</b> {data.name}</p>
        <p><b>Application No:</b> {data.applicationNo}</p>
        <p><b>Category:</b> {data.category}</p>
        <p>
          <b>Status:</b>{" "}
          <span className="capitalize">{data.applicationStatus}</span>
        </p>

        <hr />

        <h3 className="font-semibold">Uploaded Documents</h3>

        <Doc label="Photo" url={data.photoUrl} />
        <Doc label="Signature" url={data.signatureUrl} />
        <Doc label="Class 10 Certificate" url={data.class10CertUrl} />

        {data.category !== "GENERAL" && (
          <Doc
            label="Category Certificate"
            url={data.categoryCertUrl}
          />
        )}

        <textarea
          value={remark}
          onChange={e => setRemark(e.target.value)}
          placeholder="Verification remark (optional)"
          className="w-full border rounded p-2 mt-4"
        />

        <div className="flex gap-4 mt-4">
          <button
            disabled={saving}
            onClick={() => submit("approved")}
            className="px-6 py-2 bg-green-600 text-white rounded flex items-center gap-2 disabled:opacity-60"
          >
            <CheckCircle size={16} />
            Approve
          </button>

          <button
            disabled={saving}
            onClick={() => submit("rejected")}
            className="px-6 py-2 bg-red-600 text-white rounded flex items-center gap-2 disabled:opacity-60"
          >
            <XCircle size={16} />
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

function Doc({
  label,
  url,
}: {
  label: string;
  url?: string;
}) {
  if (!url) {
    return (
      <p className="text-red-500">
        {label}: Not uploaded
      </p>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="text-blue-600 underline block"
    >
      {label} – View
    </a>
  );
}

