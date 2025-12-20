import { clsx } from "clsx";
import type { Question, TestResponse } from "@shared/schema";

interface QuestionPaletteProps {
  questions: Question[];
  responses: TestResponse[];
  currentQuestionId: number;
  onQuestionSelect: (id: number) => void;
}

export function QuestionPalette({ 
  questions, 
  responses, 
  currentQuestionId, 
  onQuestionSelect 
}: QuestionPaletteProps) {
  
  const getStatusClass = (questionId: number) => {
    // Check if this question is the current one (border highlight only)
    const isCurrent = currentQuestionId === questionId;
    
    // Find response for this question
    const response = responses.find(r => r.questionId === questionId);
    
    let baseClass = "status-not-visited"; // Default grey
    
    if (response) {
      switch (response.status) {
        case 'answered':
          baseClass = "status-answered";
          break;
        case 'not_answered':
          baseClass = "status-not-answered";
          break;
        case 'marked_for_review':
          baseClass = "status-review";
          break;
        case 'marked_for_review_answered':
          baseClass = "status-review-answered";
          break;
        case 'not_visited':
        default:
          baseClass = "status-not-visited";
          break;
      }
    }

    return clsx(
      "w-10 h-10 rounded-md flex items-center justify-center text-sm font-semibold transition-all border-2",
      baseClass,
      isCurrent ? "ring-2 ring-offset-2 ring-blue-500 scale-110 z-10" : "hover:opacity-90"
    );
  };

  return (
    <div className="grid grid-cols-5 gap-2 p-2">
      {questions.map((q, idx) => (
        <button
          key={q.id}
          onClick={() => onQuestionSelect(q.id)}
          className={getStatusClass(q.id)}
        >
          {idx + 1}
        </button>
      ))}
    </div>
  );
}
