import { useState } from "react";
import { CheckCircle } from "lucide-react";

const steps = [
  "Personal Details",
  "Academic Details",
  "Upload Documents",
  "Fee Payment",
];

export default function ApplicationForm() {
  const [step, setStep] = useState(0);

  return (
    <div className="min-h-screen bg-slate-100 py-8">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow border">

        {/* Header */}
        <div className="border-b px-6 py-4">
          <h1 className="text-2xl font-bold text-slate-800">
            JEE (Main) 2026 – Application Form
          </h1>
          <p className="text-sm text-slate-500">
            Complete all steps carefully before final submission
          </p>
        </div>

        {/* Stepper */}
        <div className="flex justify-between px-8 py-6">
          {steps.map((label, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold
                ${index <= step ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"}`}
              >
                {index < step ? <CheckCircle className="w-5 h-5" /> : index + 1}
              </div>
              <span
                className={`text-sm font-semibold
                ${index <= step ? "text-blue-700" : "text-slate-400"}`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="px-8 py-6">
          {step === 0 && <PersonalDetails />}
          {step === 1 && <AcademicDetails />}
          {step === 2 && <UploadDocuments />}
          {step === 3 && <Payment />}
        </div>

        {/* Navigation */}
        <div className="flex justify-between border-t px-8 py-4">
          <button
            disabled={step === 0}
            onClick={() => setStep(step - 1)}
            className="px-6 py-2 rounded-lg border text-slate-600 disabled:opacity-50"
          >
            Back
          </button>

          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700"
            >
              Save & Continue
            </button>
          ) : (
            <button className="px-6 py-2 rounded-lg bg-green-600 text-white font-bold">
              Final Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* =======================
   STEP COMPONENTS
======================= */

function PersonalDetails() {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-blue-700">Personal Details</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <input className="input" placeholder="Nationality" />
        <input className="input" placeholder="State of Eligibility" />
        <input className="input" placeholder="Aadhaar / ID Number" />
        <select className="input">
          <option>PwD Status</option>
          <option>No</option>
          <option>Yes</option>
        </select>
        <input className="input" placeholder="Parents' Annual Income" />
      </div>
    </section>
  );
}

function AcademicDetails() {
  return (
    <section className="space-y-6">
      <h2 className="text-lg font-bold text-blue-700">Academic Details</h2>

      <div>
        <h3 className="font-semibold mb-2">Class 10</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <input className="input" placeholder="Board Name" />
          <input className="input" placeholder="Year of Passing" />
          <input className="input" placeholder="Roll Number" />
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Class 12</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <select className="input">
            <option>Appearing / Passed</option>
            <option>Appearing</option>
            <option>Passed</option>
          </select>
          <input className="input" placeholder="Board Name" />
          <input className="input" placeholder="School Name" />
          <input className="input" placeholder="Passing Year" />
        </div>
      </div>
    </section>
  );
}

function UploadDocuments() {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-blue-700">Upload Documents</h2>

      <div className="space-y-3">
        <input type="file" className="input" />
        <p className="text-xs text-slate-500">Passport Photo (10–200 KB, JPG)</p>

        <input type="file" className="input" />
        <p className="text-xs text-slate-500">Signature (4–30 KB, JPG)</p>

        <input type="file" className="input" />
        <p className="text-xs text-slate-500">Class 10 Certificate (PDF)</p>
      </div>
    </section>
  );
}

function Payment() {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-blue-700">Fee Payment</h2>

      <div className="bg-slate-50 p-4 rounded-lg border">
        <p className="font-semibold">Amount Payable</p>
        <p className="text-2xl font-bold text-green-600">₹1000</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <button className="payment-btn">UPI</button>
        <button className="payment-btn">Debit Card</button>
        <button className="payment-btn">Credit Card</button>
        <button className="payment-btn">Net Banking</button>
      </div>
    </section>
  );
}
