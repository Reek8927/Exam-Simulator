import { useParams, useLocation } from "wouter";
import { useAttempt, useSubmitAttempt, useUpsertResponse } from "@/hooks/use-attempts";
import { useExam } from "@/hooks/use-exams";
import { Loader2, User, HelpCircle, ChevronLeft, ChevronRight, Save, Flag, Eraser, CheckSquare } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Timer } from "@/components/Timer";
import { QuestionPalette } from "@/components/QuestionPalette";
import { differenceInSeconds } from "date-fns";
import type { TestResponse } from "@shared/schema";
import { clsx } from "clsx";

export default function TestInterface() {
  const { attemptId } = useParams();
  const [, setLocation] = useLocation();
  const { data: attempt, isLoading: attemptLoading } = useAttempt(Number(attemptId));
  const { data: exam, isLoading: examLoading } = useExam(attempt?.examId || 0);
  
  const submitAttempt = useSubmitAttempt();
  const upsertResponse = useUpsertResponse();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedSection, setSelectedSection] = useState<string>("Physics");
  
  // Track time spent on current question locally before syncing
  const [startTimeForQuestion, setStartTimeForQuestion] = useState(Date.now());

  // Filter questions by section
  const sectionQuestions = useMemo(() => {
    if (!exam) return [];
    return exam.questions.filter(q => q.subject === selectedSection);
  }, [exam, selectedSection]);

  const currentQuestion = sectionQuestions[currentQuestionIndex];
  
  // Get current response
  const currentResponse = useMemo(() => {
    if (!attempt || !currentQuestion) return undefined;
    return attempt.responses.find(r => r.questionId === currentQuestion.id);
  }, [attempt, currentQuestion]);

  const [localAnswer, setLocalAnswer] = useState<string | null>(null);

  // Sync local state when question changes
  useEffect(() => {
    setLocalAnswer(currentResponse?.selectedAnswer || null);
    setStartTimeForQuestion(Date.now());
  }, [currentQuestion?.id, currentResponse]);
  
  // Calculate remaining time
  const remainingTime = useMemo(() => {
    if (!attempt || !exam) return 0;
    const startTime = new Date(attempt.startTime!);
    const elapsed = differenceInSeconds(new Date(), startTime);
    return Math.max(0, (exam.duration * 60) - elapsed);
  }, [attempt, exam]);

  // Handlers
  const handleSaveResponse = async (status: string, nextIndex?: number) => {
    if (!currentQuestion) return;
    
    const timeSpentOnThisVisit = Math.round((Date.now() - startTimeForQuestion) / 1000);
    const existingTime = currentResponse?.timeSpent || 0;

    await upsertResponse.mutateAsync({
      attemptId: Number(attemptId),
      questionId: currentQuestion.id,
      selectedAnswer: localAnswer || undefined,
      status: status,
      timeSpent: existingTime + timeSpentOnThisVisit,
    });
    
    // Move to next
    if (nextIndex !== undefined) {
      if (nextIndex < sectionQuestions.length) {
        setCurrentQuestionIndex(nextIndex);
      }
    } else if (currentQuestionIndex < sectionQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleClear = () => {
    setLocalAnswer(null);
  };

  const handleSubmit = async () => {
    if (window.confirm("Are you sure you want to submit the test? You cannot change answers after submitting.")) {
      await submitAttempt.mutateAsync(Number(attemptId));
      setLocation(`/result/${attemptId}`);
    }
  };

  const jumpToQuestion = (qId: number) => {
    // Before jumping, save "Not Answered" status if visited but nothing done? 
    // Usually standard CBT saves current state as 'not_answered' if you leave without saving.
    // Simplifying: Just updating status to 'not_answered' if currently 'not_visited'
    
    if (currentResponse?.status === 'not_visited') {
       upsertResponse.mutate({
         attemptId: Number(attemptId),
         questionId: currentQuestion.id,
         status: 'not_answered',
         timeSpent: currentResponse.timeSpent || 0
       });
    }

    // Find section of target question
    const targetQ = exam?.questions.find(q => q.id === qId);
    if (targetQ && targetQ.subject !== selectedSection) {
      setSelectedSection(targetQ.subject);
      // Wait for re-render with new section questions? 
      // Better: find index in NEW section
      const newSectionQs = exam!.questions.filter(q => q.subject === targetQ.subject);
      const idx = newSectionQs.findIndex(q => q.id === qId);
      setCurrentQuestionIndex(idx);
    } else {
      const idx = sectionQuestions.findIndex(q => q.id === qId);
      if (idx !== -1) setCurrentQuestionIndex(idx);
    }
  };

  if (attemptLoading || examLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-medium">Loading Test Interface...</p>
        </div>
      </div>
    );
  }

  if (!attempt || !exam) return <div>Error loading test</div>;
  if (attempt.status === 'completed') {
    setLocation(`/result/${attemptId}`);
    return null;
  }

  const subjects = Array.from(new Set(exam.questions.map(q => q.subject)));

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 text-white px-3 py-1 rounded font-bold text-lg">JEE CBT</div>
          <h1 className="text-slate-700 font-semibold truncate max-w-md hidden md:block">{exam.title}</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center border border-slate-300">
               <User className="w-5 h-5 text-slate-500" />
             </div>
             <div className="hidden sm:block">
               <p className="text-sm font-bold text-slate-900">Candidate Name</p>
               <p className="text-xs text-slate-500">ID: {attemptId}</p>
             </div>
          </div>
          <Timer initialSeconds={remainingTime} onTimeUp={() => submitAttempt.mutate(Number(attemptId))} />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Question Area */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
          
          {/* Section Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto scrollbar-hide">
            {subjects.map(subject => (
              <button
                key={subject}
                onClick={() => {
                  setSelectedSection(subject);
                  setCurrentQuestionIndex(0);
                }}
                className={clsx(
                  "px-6 py-3 text-sm font-bold uppercase tracking-wide whitespace-nowrap transition-colors border-b-2",
                  selectedSection === subject 
                    ? "border-blue-600 text-blue-700 bg-white" 
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                )}
              >
                {subject}
              </button>
            ))}
          </div>

          {/* Question Header & Marks */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">
              Question No. {currentQuestion?.order || currentQuestionIndex + 1}
            </h2>
            <div className="flex flex-col items-end">
               <span className="text-xs font-bold text-slate-400 uppercase">Marks</span>
               <div className="flex items-center gap-1 text-sm font-bold">
                 <span className="text-green-600">+{currentQuestion?.marks}</span>
                 <span className="text-slate-300">/</span>
                 <span className="text-red-500">-{currentQuestion?.negativeMarks}</span>
               </div>
            </div>
          </div>

          {/* Scrollable Question Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
             <div className="max-w-4xl mx-auto">
                <div className="prose prose-lg max-w-none text-slate-800 mb-8">
                  <p className="whitespace-pre-wrap font-serif text-lg leading-relaxed">
                    {currentQuestion?.questionText}
                  </p>
                </div>

                {/* Options Area */}
                <div className="space-y-4 max-w-2xl">
                  {currentQuestion?.type === 'MCQ' ? (
                    currentQuestion.options?.map((option, idx) => (
                      <label 
                        key={idx}
                        className={clsx(
                          "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all group",
                          localAnswer === option 
                            ? "border-blue-500 bg-blue-50/50 shadow-md ring-1 ring-blue-500" 
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        <div className={clsx(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                          localAnswer === option 
                            ? "border-blue-500 bg-blue-500" 
                            : "border-slate-300 group-hover:border-slate-400"
                        )}>
                          {localAnswer === option && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                        </div>
                        <span className="font-medium text-slate-700">{option}</span>
                        <input 
                          type="radio" 
                          name="question-option" 
                          className="hidden" 
                          value={option}
                          checked={localAnswer === option}
                          onChange={() => setLocalAnswer(option)}
                        />
                      </label>
                    ))
                  ) : (
                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Your Answer (Numerical Value)</label>
                      <input 
                        type="text" 
                        className="w-full text-lg p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Enter numerical value..."
                        value={localAnswer || ''}
                        onChange={(e) => setLocalAnswer(e.target.value)}
                      />
                    </div>
                  )}
                </div>
             </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
               <div className="flex gap-2">
                 <button 
                   onClick={() => handleSaveResponse('marked_for_review_answered')}
                   className="px-4 py-2.5 rounded-lg border-2 border-purple-600 text-purple-700 font-bold hover:bg-purple-50 transition-colors flex items-center gap-2"
                 >
                   <Flag className="w-4 h-4" /> Mark for Review & Next
                 </button>
                 <button 
                   onClick={handleClear}
                   className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-600 font-semibold hover:bg-slate-100 transition-colors flex items-center gap-2"
                 >
                   <Eraser className="w-4 h-4" /> Clear Response
                 </button>
               </div>

               <button 
                 onClick={() => handleSaveResponse(localAnswer ? 'answered' : 'not_answered')}
                 disabled={upsertResponse.isPending}
                 className="px-8 py-2.5 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
               >
                 {upsertResponse.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                 Save & Next
               </button>
            </div>
          </div>
        </div>

        {/* Right: Question Palette (Collapsible on mobile?) */}
        <div className="w-80 bg-slate-50 border-l border-slate-200 flex flex-col shrink-0 hidden lg:flex">
          <div className="p-4 bg-white border-b border-slate-200">
             <h3 className="font-bold text-slate-800 mb-4">Question Status</h3>
             <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs text-slate-600">
                <div className="flex items-center gap-2"><div className="w-4 h-4 status-not-visited rounded-sm"></div> Not Visited</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 status-not-answered rounded-sm"></div> Not Answered</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 status-answered rounded-sm"></div> Answered</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 status-review rounded-sm"></div> Marked for Review</div>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
             <div className="mb-2 font-bold text-slate-700 text-sm uppercase tracking-wider">{selectedSection}</div>
             <QuestionPalette 
               questions={sectionQuestions} 
               responses={attempt.responses} 
               currentQuestionId={currentQuestion?.id || 0}
               onQuestionSelect={jumpToQuestion}
             />
          </div>

          <div className="p-4 bg-white border-t border-slate-200">
            <button 
              onClick={handleSubmit}
              className="w-full py-3 bg-blue-100 text-blue-700 font-bold rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center gap-2"
            >
              <CheckSquare className="w-5 h-5" /> Submit Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
