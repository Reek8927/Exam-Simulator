import { useParams, useLocation } from "wouter";
import { useResult } from "@/hooks/use-result";
import { Loader2, CheckCircle, XCircle, MinusCircle } from "lucide-react";

export default function Result() {
  const { attemptId } = useParams();
  const [, setLocation] = useLocation();

  const { data, isLoading, error } = useResult(Number(attemptId));

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-600 font-semibold">
          {(error as Error).message}
        </p>
        <button
          onClick={() => setLocation("/dashboard")}
          className="px-6 py-2 bg-blue-600 text-white rounded"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Examination Result
        </h1>

        {/* SCORE */}
        <div className="text-center mb-8">
          <p className="text-sm text-slate-500">Total Score</p>
          <p className="text-5xl font-bold text-blue-600">
            {data.score}
          </p>
        </div>

        {/* BREAKDOWN */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Stat
            label="Correct"
            value={data.correct}
            icon={<CheckCircle className="text-green-600" />}
          />
          <Stat
            label="Wrong"
            value={data.wrong}
            icon={<XCircle className="text-red-600" />}
          />
          <Stat
            label="Skipped"
            value={data.skipped}
            icon={<MinusCircle className="text-slate-500" />}
          />
        </div>

        {/* ACTIONS */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setLocation("/dashboard")}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>

          {/* PDF later */}
          <a
            href={`/api/student/result/${attemptId}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Download Scorecard
          </a>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: JSX.Element;
}) {
  return (
    <div className="border rounded-lg p-4 text-center bg-slate-50">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-sm text-slate-600">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
