import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import PublicHome from "@/pages/PublicHome";
import Login from "@/pages/Login";
import Declaration from "@/pages/Declaration";
import RegisterBasic from "@/pages/RegisterBasic";
import RegisterSuccess from "@/pages/RegisterSuccess";

import Instructions from "@/pages/Instructions";
import TestInterface from "@/pages/TestInterface";
import Result from "@/pages/Result";
import NotFound from "@/pages/not-found";

// Dashboard
import StudentDashboard from "@/pages/dashboard/StudentDashboard";
import ApplicationStepper from "@/pages/dashboard/ApplicationStepper";

import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import AdminExams from "@/pages/admin/AdminExams";
import AdminCreateExam from "@/pages/admin/AdminCreateExam";
import AdminEditExam from "@/pages/admin/AdminEditExam";
import AdminQuestions from "@/pages/admin/AdminQuestions";
import AdminQuestionEdit from "@/pages/admin/dminQuestionEdit"; 
import AdminStudents from "./pages/admin/AdminStudents";  
import AdminAdmitCards from "./pages/admin/AdminAdmitCards";  
import AdminStudentVerify from "./pages/admin/AdminStudentVerify";
import AdminAssignExam from "@/pages/admin/AdminAssignExam";
import ExamGate from "@/pages/ExamGate";
import AdminResults from "@/pages/admin/AdminResults";
import AdminNotices from "@/pages/admin/AdminNotices";
import AnswerKey from "./pages/AnswerKey";




function Router() {
  return (
    <Switch>
      {/* ================= PUBLIC ================= */}
      <Route path="/" component={PublicHome} />
      <Route path="/login" component={Login} />

      {/* ================= REGISTRATION FLOW ================= */}
      <Route path="/register/declaration" component={Declaration} />
      <Route path="/register/basic" component={RegisterBasic} />
      <Route path="/register-success/:applicationNo">
        {(params) => (
          <RegisterSuccess applicationNo={params.applicationNo} />
        )}
      </Route>

      {/* ================= PROTECTED ================= */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <StudentDashboard />
        </ProtectedRoute>
      </Route>

      {/* 🔥 APPLICATION FORM (STEP-BY-STEP, AUTOSAVE) */}
      <Route path="/application-form">
        <ProtectedRoute>
          <ApplicationStepper />
        </ProtectedRoute>
      </Route>

      <Route path="/exam-gate">
        <ProtectedRoute>
          <ExamGate />
        </ProtectedRoute>
      </Route>

      <Route path="/instructions/:examId">
        <ProtectedRoute>
          <Instructions />
        </ProtectedRoute>
      </Route>

      <Route path="/test/:attemptId">
        <ProtectedRoute>
          <TestInterface />
        </ProtectedRoute>
      </Route>

      <Route path="/result/:attemptId">
        <ProtectedRoute>
          <Result />
        </ProtectedRoute>
      </Route>

      <Route path="/answer-key/:attemptId">
        <ProtectedRoute>
          <AnswerKey />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/AdminLogin" component={AdminLogin} />

<Route path="/admin/AdminDashboard">
  <AdminProtectedRoute>
    <AdminDashboard />
  </AdminProtectedRoute>
</Route>
<Route path="/admin/exams">
  <AdminProtectedRoute>
    <AdminExams />
  </AdminProtectedRoute>
</Route>
<Route path="/admin/exams/create">
  <AdminProtectedRoute>
    <AdminCreateExam />
  </AdminProtectedRoute>
</Route>
<Route path="/admin/exams/edit/:id">
  <AdminProtectedRoute>
    <AdminEditExam />
  </AdminProtectedRoute>
</Route>
<Route path="/admin/questions">
  <AdminProtectedRoute>
    <AdminQuestions />
  </AdminProtectedRoute>
</Route>
<Route path="/admin/questions/edit/:id">
  <AdminProtectedRoute>
    <AdminQuestionEdit />
  </AdminProtectedRoute>
</Route>
<Route path="/admin/students">
  <AdminProtectedRoute>
    <AdminStudents />
  </AdminProtectedRoute>
</Route>
<Route path="/admin/admit-cards"> 
  <AdminProtectedRoute>
    <AdminAdmitCards />
  </AdminProtectedRoute>
</Route>
<Route path="/admin/students/verify/:id">
  <AdminProtectedRoute>
    <AdminStudentVerify />
  </AdminProtectedRoute>
</Route>
<Route path="/admin/assign-exam">
  <AdminProtectedRoute>
    <AdminAssignExam />
  </AdminProtectedRoute>
</Route>

<Route path="/admin/results">
  <AdminProtectedRoute>
    <AdminResults />
  </AdminProtectedRoute>
</Route>

<Route path="/admin/notices">
  <AdminProtectedRoute>
    <AdminNotices />
  </AdminProtectedRoute>
</Route>

      <Route component={NotFound} />
    </Switch>

    
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
