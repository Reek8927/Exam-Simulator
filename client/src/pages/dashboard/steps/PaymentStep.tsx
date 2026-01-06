import { useState } from "react";

interface PaymentStepProps {
  category: string;
  onPaymentSuccess: () => void;
}

export default function PaymentStep({
  category,
  onPaymentSuccess,
}: PaymentStepProps) {
  const [paymentMode, setPaymentMode] = useState("");

  const getFee = () => {
    if (category === "SC" || category === "ST" || category === "PwD") {
      return 500;
    }
    return 1000;
  };

  const feeAmount = getFee();

  const handlePay = async () => {
  if (!paymentMode) {
    alert("Please select a payment mode");
    return;
  }

  const res = await fetch("/api/payment/demo", {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    alert("Payment failed");
    return;
  }

  alert("Payment Successful!");

  onPaymentSuccess(); // 🔥 tell parent stepper
};


  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-blue-700">
          Step 4: Fee Payment
        </h2>
        <p className="text-sm text-slate-500">
          Pay the examination fee to complete application
        </p>
      </div>

      {/* Fee Summary */}
      <div className="border rounded-lg p-6 bg-slate-50">
        <h3 className="font-bold text-lg mb-4">Fee Details</h3>

        <div className="flex justify-between text-sm mb-2">
          <span>Candidate Category</span>
          <span className="font-medium">{category}</span>
        </div>

        <div className="flex justify-between text-sm mb-2">
          <span>Application Fee</span>
          <span className="font-medium">₹ {feeAmount}</span>
        </div>

        <div className="border-t mt-3 pt-3 flex justify-between font-bold">
          <span>Total Payable</span>
          <span className="text-green-700">₹ {feeAmount}</span>
        </div>
      </div>

      {/* Payment Mode */}
      <div className="border rounded-lg p-6">
        <h3 className="font-bold mb-4">Select Payment Mode</h3>

        <div className="space-y-3 text-sm">
          {[
            "Debit Card",
            "Credit Card",
            "Net Banking",
            "UPI",
          ].map(mode => (
            <label
              key={mode}
              className="flex items-center gap-3 cursor-pointer"
            >
              <input
                type="radio"
                name="paymentMode"
                value={mode}
                onChange={() => setPaymentMode(mode)}
              />
              <span>{mode}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 text-sm">
        <p className="font-bold mb-2">Important Instructions:</p>
        <ul className="list-disc ml-5 space-y-1">
          <li>Do not refresh during payment</li>
          <li>Save payment receipt after successful payment</li>
          <li>Fee once paid is non-refundable</li>
        </ul>
      </div>

      {/* Pay Button */}
      <div className="flex justify-end">
        <button
          onClick={handlePay}
          className="px-10 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
        >
          Proceed to Pay ₹ {feeAmount}
        </button>
      </div>
    </div>
  );
}
