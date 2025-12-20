import { useExams } from "@/hooks/use-exams";
import { Link } from "wouter";
import { Loader2, ArrowRight, GraduationCap, CheckCircle2 } from "lucide-react";

export default function Home() {
  const { data: exams, isLoading, error } = useExams();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                New JEE Pattern Updated
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 font-display">
                Master the <span className="text-blue-600">JEE Mains</span> with Real CBT Experience
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl">
                Practice with our NTA-styled Computer Based Test (CBT) simulator. 
                Get detailed analytics, improve your speed, and conquer exam anxiety.
              </p>
              <div className="flex items-center gap-4 pt-4">
                <a href="#available-tests" className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 hover:shadow-lg transition-all flex items-center gap-2">
                  Start Practicing <ArrowRight className="w-4 h-4" />
                </a>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-green-500" /> Free Demo
                </div>
              </div>
            </div>
            {/* Simple Graphic */}
            <div className="flex-1 flex justify-center">
              <div className="relative w-full max-w-md aspect-square bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-full flex items-center justify-center p-8">
                <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-slate-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Mock Test #1</h3>
                      <p className="text-xs text-slate-500">Physics • Chemistry • Maths</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 bg-slate-100 rounded-full w-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-3/4"></div>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Progress</span>
                      <span className="font-medium text-slate-900">75%</span>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-2">
                    <div className="flex-1 bg-slate-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-slate-900">180</div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Mins</div>
                    </div>
                    <div className="flex-1 bg-slate-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-slate-900">75</div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ques</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exam List Section */}
      <div id="available-tests" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 w-full">
        <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
          Available Practice Tests
        </h2>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
            Failed to load exams. Please try again later.
          </div>
        ) : exams?.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <h3 className="text-lg font-medium text-slate-900">No exams available yet</h3>
            <p className="text-slate-500">Check back later for new practice tests.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams?.map((exam) => (
              <div key={exam.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    JEE
                  </div>
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                    Full Syllabus
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-2">{exam.title}</h3>
                <p className="text-slate-500 text-sm mb-6 line-clamp-2">{exam.description || "Comprehensive mock test covering Physics, Chemistry and Mathematics."}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-6 border-t border-slate-100 pt-4">
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Duration</span>
                    <p className="font-semibold text-slate-700">{exam.duration} mins</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Marks</span>
                    <p className="font-semibold text-slate-700">{exam.totalMarks}</p>
                  </div>
                </div>

                <Link href={`/instructions/${exam.id}`} className="block w-full text-center py-3 rounded-xl font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors">
                  Take Test
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} JEE CBT Simulator. Not affiliated with NTA.</p>
        </div>
      </footer>
    </div>
  );
}
