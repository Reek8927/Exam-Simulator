import { useParams, Link } from "wouter";
import { useAttempt } from "@/hooks/use-attempts";
import { useExam } from "@/hooks/use-exams";
import { Loader2, Award, Clock, ArrowLeft, BarChart2, CheckCircle, XCircle, Circle } from "lucide-react";
import { useMemo } from "react";
import { format } from "date-fns";

export default function Result() {
  const { attemptId } = useParams();
  const { data: attempt, isLoading: attemptLoading } = useAttempt(Number(attemptId));
  const { data: exam, isLoading: examLoading } = useExam(attempt?.examId || 0);

  const stats = useMemo(() => {
    if (!attempt || !exam) return null;

    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;
    let score = 0;
    let sectionStats: Record<string, { correct: number, incorrect: number, unattempted: number, score: number }> = {};

    exam.questions.forEach(q => {
      // Initialize section if needed
      if (!sectionStats[q.subject]) {
        sectionStats[q.subject] = { correct: 0, incorrect: 0, unattempted: 0, score: 0 };
      }

      const response = attempt.responses.find(r => r.questionId === q.id);
      
      if (!response || !response.selectedAnswer) {
        unattempted++;
        sectionStats[q.subject].unattempted++;
      } else if (response.selectedAnswer === q.correctAnswer) {
        correct++;
        score += (q.marks || 4);
        sectionStats[q.subject].correct++;
        sectionStats[q.subject].score += (q.marks || 4);
      } else {
        incorrect++;
        score -= (q.negativeMarks || 1);
        sectionStats[q.subject].incorrect++;
        sectionStats[q.subject].score -= (q.negativeMarks || 1);
      }
    });

    return { correct, incorrect, unattempted, score, sectionStats };
  }, [attempt, exam]);

  if (attemptLoading || examLoading) {
    return (
       <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!attempt || !exam || !stats) return <div>Result not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
               <Award className="w-6 h-6" />
             </div>
             <div>
               <h1 className="text-2xl font-bold text-slate-900">Test Result</h1>
               <p className="text-slate-500 text-sm">{exam.title} • {format(new Date(attempt.startTime!), "PPP")}</p>
             </div>
           </div>
           <Link href="/" className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-colors">
             Back to Home
           </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-8 space-y-8">
        
        {/* Score Card */}
        <div className="grid md:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
             <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Total Score</div>
             <div className="text-5xl font-black text-slate-900 mb-2">{stats.score}<span className="text-2xl text-slate-400 font-medium">/{exam.totalMarks}</span></div>
             <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
               {Math.round((stats.score / exam.totalMarks) * 100)}% Percentage
             </div>
           </div>
           
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Question Analysis</h3>
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <CheckCircle className="w-5 h-5 text-green-500" />
                   <span className="text-slate-700 font-medium">Correct</span>
                 </div>
                 <span className="font-bold text-slate-900">{stats.correct}</span>
               </div>
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <XCircle className="w-5 h-5 text-red-500" />
                   <span className="text-slate-700 font-medium">Incorrect</span>
                 </div>
                 <span className="font-bold text-slate-900">{stats.incorrect}</span>
               </div>
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <Circle className="w-5 h-5 text-slate-300" />
                   <span className="text-slate-700 font-medium">Unattempted</span>
                 </div>
                 <span className="font-bold text-slate-900">{stats.unattempted}</span>
               </div>
             </div>
           </div>

           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
             <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
               <Clock className="w-8 h-8" />
             </div>
             <div className="text-2xl font-bold text-slate-900 mb-1">
               {attempt.endTime 
                 ? Math.floor(differenceInSeconds(new Date(attempt.endTime), new Date(attempt.startTime!)) / 60) + " mins" 
                 : "N/A"
               }
             </div>
             <div className="text-sm text-slate-500">Time Taken</div>
           </div>
        </div>

        {/* Section Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-slate-500" />
            <h3 className="font-bold text-slate-800">Section-wise Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Score</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Correct</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Wrong</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.sectionStats).map(([subject, data]) => (
                  <tr key={subject} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                    <td className="px-6 py-4 font-semibold text-slate-900">{subject}</td>
                    <td className="px-6 py-4 text-right font-bold text-blue-600">{data.score}</td>
                    <td className="px-6 py-4 text-right text-green-600 font-medium">{data.correct}</td>
                    <td className="px-6 py-4 text-right text-red-500 font-medium">{data.incorrect}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-700">
                      {data.correct + data.incorrect > 0 
                        ? Math.round((data.correct / (data.correct + data.incorrect)) * 100) 
                        : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
