import { useEffect, useState } from "react";

export default function AdminQuestions() {
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/exams/1/questions", {
      credentials: "include",
    })
      .then(res => res.json())
      .then(setQuestions);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">Questions</h1>

      {questions.map(q => (
        <div key={q.id} className="border p-4 rounded mb-4">
          <p className="font-semibold">{q.text}</p>

          {q.options && (
            <ul className="list-disc ml-5">
              {q.options.map((o: string, i: number) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          )}

          <p className="text-sm text-slate-500">
            Correct:{" "}
            {q.type === "MCQ"
              ? `Option ${q.correctOption + 1}`
              : q.correctNumericAnswer}
          </p>
        </div>
      ))}
    </div>
  );
}
