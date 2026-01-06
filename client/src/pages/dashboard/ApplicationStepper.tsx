import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import PersonalStep from "./steps/PersonalStep";
import AcademicStep from "./steps/AcademicStep";
import UploadStep from "./steps/UploadStep";
import PreviewStep from "./steps/PreviewStep";
import PaymentStep from "./steps/PaymentStep";
import { useLocation } from "wouter";



/* ===================
   VALIDATION
=================== */
function isPersonalComplete(app: any) {
  return (
    app &&
    app.nationality &&
    app.stateOfEligibility &&
    app.aadhaarNumber &&
    app.parentsIncome &&
    app.permanentAddress
  );
}

function isAcademicComplete(app: any) {
  return (
    app.class10Board &&
    app.class10Year &&
    app.class10Roll &&
    app.class12Status &&
    app.class12Board &&
    app.class12School &&
    app.class12Year
  );
}

const steps = [
  "Personal Details",
  "Academic Details",
  "Upload Documents",
  "Preview Application",
  "Payment"
];

export default function ApplicationStepper() {
  const [currentStep, setCurrentStep] = useState(0);
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();


  useEffect(() => {
    fetch("/api/application", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setApplication(data);
        setLoading(false);
      });
  }, []);

  const autosave = async (data: any) => {
    setApplication((p: any) => ({ ...p, ...data }));
    await fetch("/api/application/save", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
  };

  const next = () => {
    if (currentStep === 0 && !isPersonalComplete(application)) {
      alert("Complete personal details first");
      return;
    }
    if (currentStep === 1 && !isAcademicComplete(application)) {
      alert("Complete academic details first");
      return;
    }
    setCurrentStep((p) => p + 1);
  };
  

  const back = () => setCurrentStep((p) => Math.max(0, p - 1));

  if (loading) return <div className="p-10">Loading…</div>;

  return (
    <div className="min-h-screen bg-slate-100 py-8">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow border">
        {/* HEADER */}
        <div className="border-b p-6">
          <h1 className="text-2xl font-bold">JEE Main 2026 – Application Form</h1>
          <p className="text-sm text-slate-500">
            Data is saved automatically
          </p>
        </div>

        {/* STEPPER */}
        <div className="flex justify-between px-8 py-6">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold
                ${
                  i <= currentStep
                    ? "bg-blue-600 text-white"
                    : "bg-slate-300"
                }`}
              >
                {i < currentStep ? <Check size={16} /> : i + 1}
              </div>
              <span className="text-sm">{s}</span>
            </div>
          ))}
        </div>

        {/* CONTENT */}
        <div className="p-8">
          {currentStep === 0 && (
            <PersonalStep data={application} onChange={autosave} onNext={next} />
          )}

          {currentStep === 1 && (
            <AcademicStep
              data={application}
              onChange={autosave}
              onNext={next}
              onBack={back}
            />
          )}

          {currentStep === 2 && (
            <UploadStep
              data={application}
             // onChange={autosave}
              onNext={next}
              onBack={back}
            />
          )}
          {currentStep === 3 && (
  <PreviewStep
    application={application}
    onBack={back}
    onConfirm={() => setCurrentStep(4)}
  />
)}

{currentStep === 4 && (
  <PaymentStep
    category={application.category}
    onPaymentSuccess={() => {
      setLocation("/dashboard"); // 🔥 redirect
    }}
  />
)}




          {currentStep === 4 && (
            <div className="text-green-700 font-bold">
              Payment Integration Next
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
