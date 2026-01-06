import { useEffect, useState } from "react";
import {
  Upload,
  FileText,
  Image,
  Pencil,
  Trash2,
  Download,
} from "lucide-react";
import { useLocation } from "wouter";

/* =====================================================
   TYPES
===================================================== */
type Question = {
  id: number;
  examId: number;
  subject: string;
  type: "MCQ" | "NUMERIC";
  text: string;
  options?: string[];
  correctOption?: number;
  correctNumericAnswer?: number;
  marks: number;
  negativeMarks: number;
  imageUrl?: string;
};

type CsvPreviewRow = {
  subject: string;
  type: string;
  text: string;
  marks: string;
  negativeMarks: string;
};

/* =====================================================
   COMPONENT
===================================================== */
export default function AdminQuestions() {
  const [exams, setExams] = useState<any[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [examId, setExamId] = useState("");
  const [, setLocation] = useLocation();

  // form
  const [type, setType] = useState<"MCQ" | "NUMERIC">("MCQ");
  const [subject, setSubject] = useState("Physics");
  const [text, setText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState<number | null>(null);
  const [numericAnswer, setNumericAnswer] = useState("");
  const [marks, setMarks] = useState(4);
  const [negativeMarks, setNegativeMarks] = useState(1);
  const [imageUrl, setImageUrl] = useState("");

  // bulk
  const [csvPreview, setCsvPreview] = useState<CsvPreviewRow[]>([]);

  /* ================= LOAD EXAMS ================= */
  useEffect(() => {
    fetch("/api/admin/exams", { credentials: "include" })
      .then(r => r.json())
      .then(setExams);
  }, []);

  /* ================= LOAD QUESTIONS ================= */
  useEffect(() => {
    if (!examId) return;

    fetch(`/api/admin/exams/${examId}/questions`, {
      credentials: "include",
    })
      .then(r => r.json())
      .then(setQuestions);
  }, [examId]);

  /* ================= IMAGE UPLOAD ================= */
  async function uploadImage(file: File) {
    const fd = new FormData();
    fd.append("image", file);

    const res = await fetch("/api/admin/questions/image", {
      method: "POST",
      credentials: "include",
      body: fd,
    });

    const data = await res.json();
    setImageUrl(data.imageUrl);
  }

  /* ================= SUBMIT SINGLE QUESTION ================= */
  async function submitQuestion() {
    const payload: any = {
      examId: Number(examId),
      subject,
      type,
      text,
      marks,
      negativeMarks,
      imageUrl,
    };

    if (type === "MCQ") {
      payload.options = options;
      payload.correctOption = correctOption;
    } else {
      payload.correctNumericAnswer = Number(numericAnswer);
    }

    const res = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      alert("Failed to add question");
      return;
    }

    alert("Question added");
    setText("");
    setOptions(["", "", "", ""]);
    setCorrectOption(null);
    setNumericAnswer("");
    setImageUrl("");

    // reload list
    fetch(`/api/admin/exams/${examId}/questions`, {
      credentials: "include",
    })
      .then(r => r.json())
      .then(setQuestions);
  }

  /* ================= DELETE QUESTION ================= */
  async function deleteQuestion(id: number) {
    if (!confirm("Delete this question?")) return;

    await fetch(`/api/admin/questions/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    setQuestions(q => q.filter(x => x.id !== id));
  }

  /* ================= CSV TEMPLATE ================= */
  function downloadCsvTemplate() {
    const csv =
      "examId,subject,type,text,optionA,optionB,optionC,optionD,correctOption,correctNumericAnswer,marks,negativeMarks\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "question-template.csv";
    a.click();
  }

  /* ================= CSV PREVIEW ================= */
  function previewCSV(file: File) {
    const reader = new FileReader();
    reader.onload = e => {
      const lines = String(e.target?.result).split("\n").slice(1);
      const rows = lines
        .filter(Boolean)
        .map(l => {
          const c = l.split(",");
          return {
            subject: c[1],
            type: c[2],
            text: c[3],
            marks: c[10],
            negativeMarks: c[11],
          };
        });
      setCsvPreview(rows);
    };
    reader.readAsText(file);
  }

  async function uploadCSV(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("examId", examId);

    const res = await fetch("/api/admin/questions/bulk", {
      method: "POST",
      credentials: "include",
      body: fd,
    });

    if (!res.ok) {
      alert("Bulk upload failed");
      return;
    }

    alert("Bulk upload successful");
    setCsvPreview([]);
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-6xl mx-auto bg-white border rounded-xl p-6 space-y-8">

        <h1 className="text-xl font-bold">Question Management</h1>

        {/* ================= SELECT EXAM ================= */}
        <select
          className="input"
          value={examId}
          onChange={e => setExamId(e.target.value)}
        >
          <option value="">Select Exam</option>
          {exams.map(e => (
            <option key={e.id} value={e.id}>{e.title}</option>
          ))}
        </select>

        {/* ================= QUESTION FORM ================= */}
        <div className="border rounded-lg p-4 space-y-4">
          <h3 className="font-bold">Add Question</h3>

          <div className="grid md:grid-cols-4 gap-3">
            <select className="input" value={subject} onChange={e => setSubject(e.target.value)}>
              <option>Physics</option>
              <option>Chemistry</option>
              <option>Mathematics</option>
            </select>

            <select className="input" value={type} onChange={e => setType(e.target.value as any)}>
              <option value="MCQ">MCQ</option>
              <option value="NUMERIC">Numeric</option>
            </select>

            <input className="input" type="number" value={marks} onChange={e => setMarks(+e.target.value)} placeholder="Marks" />
            <input className="input" type="number" value={negativeMarks} onChange={e => setNegativeMarks(+e.target.value)} placeholder="Negative" />
          </div>

          <textarea
            className="input h-24"
            placeholder="Question text"
            value={text}
            onChange={e => setText(e.target.value)}
          />

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Image /> Upload Image
            <input hidden type="file" onChange={e => e.target.files && uploadImage(e.target.files[0])} />
          </label>

          {imageUrl && <img src={imageUrl} className="max-w-xs border" />}

          {type === "MCQ" && options.map((o, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="input flex-1"
                placeholder={`Option ${i + 1}`}
                value={o}
                onChange={e => {
                  const copy = [...options];
                  copy[i] = e.target.value;
                  setOptions(copy);
                }}
              />
              <input type="radio" name="correct" onChange={() => setCorrectOption(i)} />
            </div>
          ))}

          {type === "NUMERIC" && (
            <input
              className="input"
              placeholder="Correct numeric answer"
              value={numericAnswer}
              onChange={e => setNumericAnswer(e.target.value)}
            />
          )}

          <button onClick={submitQuestion} className="btn-primary">
            Add Question
          </button>
        </div>

        {/* ================= QUESTION LIST ================= */}
        <div>
          <h3 className="font-bold mb-3">Questions Preview</h3>

          <table className="w-full border">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-2 border">Question</th>
                <th className="p-2 border">Marks</th>
                <th className="p-2 border">Negative</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map(q => (
                <tr key={q.id}>
                  <td className="p-2 border">{q.text}</td>
                  <td className="p-2 border">{q.marks}</td>
                  <td className="p-2 border">{q.negativeMarks}</td>
                  <td className="p-2 border flex gap-2">
                    <button onClick={() => setLocation(`/admin/questions/edit/${q.id}`)}>
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => deleteQuestion(q.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================= BULK UPLOAD ================= */}
        <div className="border-t pt-6 space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <FileText /> Bulk Upload
          </h3>

          <button onClick={downloadCsvTemplate} className="btn-secondary flex gap-2">
            <Download /> Download CSV Template
          </button>

          <input
            type="file"
            accept=".csv"
            onChange={e => e.target.files && previewCSV(e.target.files[0])}
          />

          {csvPreview.length > 0 && (
            <>
              <h4 className="font-semibold">Preview</h4>
              <table className="w-full border">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-2 border">Text</th>
                    <th className="p-2 border">Marks</th>
                    <th className="p-2 border">Negative</th>
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.map((r, i) => (
                    <tr key={i}>
                      <td className="p-2 border">{r.text}</td>
                      <td className="p-2 border">{r.marks}</td>
                      <td className="p-2 border">{r.negativeMarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button
                onClick={() => {
                  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
                  if (input?.files?.[0]) uploadCSV(input.files[0]);
                }}
                className="btn-primary"
              >
                Upload Bulk Questions
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

