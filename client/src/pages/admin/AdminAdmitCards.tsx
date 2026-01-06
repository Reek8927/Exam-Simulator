import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

type Row = {
  studentId: number;
  name: string;
  applicationNo: string;
  rollNumber: string | null;
  admitCardIssued: boolean;
};

export default function AdminAdmitCards() {
  const [data, setData] = useState<Row[]>([]);

  useEffect(() => {
    fetch("/api/admin/admit-cards", { credentials: "include" })
      .then(res => res.json())
      .then(setData);
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Admit Card Preview</h1>

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Application No</th>
              <th className="p-3">Roll No</th>
              <th className="p-3 text-center">Preview</th>
            </tr>
          </thead>

          <tbody>
            {data.map(s => (
              <tr key={s.studentId} className="border-t">
                <td className="p-3">{s.name}</td>
                <td className="p-3">{s.applicationNo}</td>
                <td className="p-3">{s.rollNumber ?? "—"}</td>

                <td className="p-3 text-center">
                  {s.admitCardIssued ? (
                    <a
                      href={`/api/admin/admit-cards/${s.studentId}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      <Eye size={16} /> Preview
                    </a>
                  ) : (
                    <span className="text-slate-400">
                      Not released
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
