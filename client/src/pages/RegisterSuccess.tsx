import { useLocation } from "wouter";

interface RegisterSuccessProps {
  applicationNo: string;
}

export default function RegisterSuccess({ applicationNo }: RegisterSuccessProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white border shadow-lg rounded-xl">

        {/* Header */}
        <div className="border-b px-6 py-4 bg-blue-50 rounded-t-xl">
          <h1 className="text-xl font-bold text-blue-700">
            JEE (Main) 2026 – Registration Successful
          </h1>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">

          <div className="text-green-600 font-bold text-lg">
            ✔ Registration Completed Successfully
          </div>

          <p className="text-slate-700">
            Your application has been successfully submitted. Please note your
            <b> Application Number</b> for future reference.
          </p>

          {/* Application Number Box */}
          <div className="bg-slate-50 border rounded-lg p-4">
            <p className="text-sm text-slate-500 mb-1">
              Application Number
            </p>
            <div className="text-2xl font-mono font-bold text-blue-700 tracking-wide">
              {applicationNo}
            </div>
          </div>

          {/* Info */}
          <div className="text-sm text-slate-600 leading-relaxed">
            🔐 Your <b>password</b> has been sent to your registered
            <b> email ID and mobile number</b>.
            <br />
            <br />
            Please keep your credentials confidential.
          </div>

          {/* Important Note */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-sm text-yellow-800">
            📌 You will need your Application Number and Password to log in and
            complete the remaining steps of the application form.
          </div>

          {/* Action */}
          <button
            onClick={() => setLocation("/login")}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
          >
            Proceed to Login
          </button>
        </div>
      </div>
    </div>
  );
}
