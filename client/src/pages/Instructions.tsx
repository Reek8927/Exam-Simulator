import { useParams, useLocation } from "wouter";
import { useExam } from "@/hooks/use-exams";
import { useCreateAttempt } from "@/hooks/use-attempts";
import { Loader2, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

export default function Instructions() {
  const { examId } = useParams();
  const [, setLocation] = useLocation();
  const { data: exam, isLoading } = useExam(Number(examId));
  const createAttempt = useCreateAttempt();
  const [agreed, setAgreed] = useState(false);

  const handleStart = async () => {
    if (!exam || !agreed) return;
    
    try {
      const attempt = await createAttempt.mutateAsync({
        examId: exam.id,
      });
      setLocation(`/test/${attempt.id}`);
    } catch (error) {
      console.error("Failed to start test:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!exam) return <div>Exam not found</div>;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-blue-600 text-white py-4 px-6 shadow-md">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-xl font-bold">General Instructions</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 md:p-8">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
             <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
               <img 
                 src="https://upload.wikimedia.org/wikipedia/en/thumb/4/4c/Official_Logo_of_NTA.svg/1200px-Official_Logo_of_NTA.svg.png" 
                 alt="NTA Logo" 
                 className="w-10 opacity-80"
               />
             </div>
             <div>
               <h2 className="text-2xl font-bold text-slate-900">{exam.title}</h2>
               <div className="flex items-center gap-4 text-slate-500 mt-1 text-sm">
                 <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {exam.duration} Minutes</span>
                 <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> {exam.totalMarks} Marks</span>
               </div>
             </div>
          </div>

          <div className="prose prose-slate max-w-none text-slate-700 space-y-4 text-sm md:text-base leading-relaxed">
            <h3 className="text-lg font-bold text-black">Please read the instructions carefully</h3>
            
            <p><strong>1. General Instructions:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>The clock will be set at the server. The countdown timer in the top right corner of screen will display the remaining time available for you to complete the examination. When the timer reaches zero, the examination will end by itself. You will not be required to end or submit your examination.</li>
              <li>The Question Palette displayed on the right side of screen will show the status of each question using one of the following symbols:
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-xs">
                   <div className="flex items-center gap-2"><div className="w-6 h-6 bg-slate-200 border border-slate-300 rounded"></div> Not Visited</div>
                   <div className="flex items-center gap-2"><div className="w-6 h-6 bg-red-500 rounded text-white text-center leading-6"></div> Not Answered</div>
                   <div className="flex items-center gap-2"><div className="w-6 h-6 bg-green-500 rounded text-white text-center leading-6"></div> Answered</div>
                   <div className="flex items-center gap-2"><div className="w-6 h-6 bg-purple-500 rounded text-white text-center leading-6"></div> Marked for Review</div>
                </div>
              </li>
            </ul>

            <p className="mt-4"><strong>2. Navigating to a Question:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Click on the question number in the Question Palette at the right of your screen to go to that numbered question directly. Note that using this option does NOT save your answer to the current question.</li>
              <li>Click on <strong>Save & Next</strong> to save your answer for the current question and then go to the next question.</li>
              <li>Click on <strong>Mark for Review & Next</strong> to save your answer for the current question, mark it for review, and then go to the next question.</li>
            </ul>

            <p className="mt-4"><strong>3. Answering a Question:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>To select your answer, click on the button of one of the options.</li>
              <li>To deselect your chosen answer, click on the button of the chosen option again or click on the <strong>Clear Response</strong> button.</li>
              <li>To change your chosen answer, click on the button of another option.</li>
              <li>To save your answer, you MUST click on the <strong>Save & Next</strong> button.</li>
            </ul>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-200">
            <label className="flex items-start gap-3 cursor-pointer p-4 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200">
              <input 
                type="checkbox" 
                className="mt-1 w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span className="text-slate-700 font-medium select-none">
                I have read and understood the instructions. I agree that in case of not adhering to the exam instructions, I shall be liable to be debarred from this Test and/or to disciplinary action.
              </span>
            </label>

            <button
              onClick={handleStart}
              disabled={!agreed || createAttempt.isPending}
              className={`mt-6 w-full py-4 rounded-xl text-lg font-bold shadow-lg transition-all transform ${
                agreed 
                  ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5" 
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {createAttempt.isPending ? "Starting Test..." : "I am ready to begin"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
