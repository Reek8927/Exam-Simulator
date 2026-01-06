import { useEffect, useState } from "react";

interface Props {
  data: any;
  onChange: (data: any) => Promise<void> | void;
  onNext: () => void;
}

export default function PersonalStep({ data, onChange, onNext }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [sameAddress, setSameAddress] = useState(false);


  // 🔁 AUTOSAVE (debounced)
  useEffect(() => {
    const t = setTimeout(async () => {
      setSaving(true);
      await onChange({});
      setSaving(false);
    }, 700);

    return () => clearTimeout(t);
  }, [
    data.nationality,
    data.stateOfEligibility,
    data.aadhaarNumber,
    data.parentsIncome,
    data.permanentAddress,
    data.presentAddress,
    data.pwd,
  ]);

  const update = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    onChange({
      [name]:
        type === "radio"
          ? value === "yes"
          : value,
    });
  };

  const validate = () => {
    if (
      !data.nationality ||
      !data.stateOfEligibility ||
      !data.aadhaarNumber ||
      data.aadhaarNumber.length !== 12 ||
      !data.parentsIncome ||
      !data.permanentAddress
    ) {
      setError("Please complete all mandatory personal details.");
      return;
    }
    if (!/^\d{12}$/.test(data.aadhaarNumber)) {
  setError("Invalid Aadhaar number. Must be 12 digits.");
  return;
}


    setError(null);
    onNext();
  };

  return (
    <div className="bg-white border rounded-xl shadow-sm">
      {/* HEADER */}
      <div className="border-b px-6 py-4 flex justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Step 1: Personal Details
          </h2>
          <p className="text-sm text-slate-500">
            Fill details exactly as per Class 10 Certificate
          </p>
        </div>
        {saving && (
          <span className="text-sm text-blue-600 font-semibold">
            Saving…
          </span>
        )}
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-2 rounded">
            ⚠️ {error}
          </div>
        )}

        {/* READ-ONLY DETAILS (FROM REGISTRATION) */}
        <section>
          <h3 className="font-bold text-blue-800 mb-3">Candidate Details</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <input className="input bg-slate-100" value={data.name || ""} disabled />
            <input className="input bg-slate-100" value={data.fatherName} disabled />
            <input className="input bg-slate-100" value={data.motherName } disabled />
            <input
              className="input bg-slate-100"
              value={data.dob}
              disabled
            />
            <select value={data.gender} disabled />
<select value={data.category} disabled />
          </div>
        </section>

        {/* PERSONAL */}
        <section>
          <h3 className="font-bold text-blue-800 mb-3">Personal Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <select name="nationality" value={data.nationality || ""} onChange={update} className="input">
              <option value="">Nationality *</option>
              <option value="Indian">Indian</option>
              <option value="OCI">OCI</option>
              <option value="PIO">PIO</option>
              <option value="Foreign">Foreign National</option>
            </select>

            <select name="stateOfEligibility" value={data.stateOfEligibility || ""} onChange={update} className="input">
              <option value="">State of Eligibility *</option>
              <option>West Bengal</option>
              <option>Delhi</option>
              <option>Maharashtra</option>
              <option>Tamil Nadu</option>
            </select>

            <input
  name="aadhaarNumber"
  value={data.aadhaarNumber || ""}
  onChange={(e) => {
    if (/^\d*$/.test(e.target.value)) {
      onChange({ aadhaarNumber: e.target.value });
    }
  }}
  maxLength={12}
  placeholder="Aadhaar Number *"
  className="input"
/>


            <select name="parentsIncome" value={data.parentsIncome || ""} onChange={update} className="input">
              <option value="">Parents’ Annual Income *</option>
              <option value="<1L">&lt; 1 Lakh</option>
              <option value="1-5L">1 – 5 Lakh</option>
              <option value="5-10L">5 – 10 Lakh</option>
              <option value=">10L">&gt; 10 Lakh</option>
            </select>
          </div>
        </section>

        {/* PwD */}
        <section>
          <h3 className="font-bold text-blue-800 mb-2">PwD Status</h3>
          <div className="flex gap-6">
            <label className="flex gap-2 items-center">
              <input
                type="radio"
                name="pwd"
                value="yes"
                checked={data.pwd === true}
                onChange={() => onChange({ pwd: true })}
              />
              Yes
            </label>
            <label className="flex gap-2 items-center">
              <input
                type="radio"
                name="pwd"
                value="no"
                checked={data.pwd === false}
                onChange={() => onChange({ pwd: false })}
              />
              No
            </label>
          </div>
        </section>

        {/* ADDRESS */}
       <section>
  <h3 className="font-bold text-blue-800 mb-2">Address Details</h3>

  <textarea
    name="permanentAddress"
    value={data.permanentAddress || ""}
    onChange={update}
    className="input h-24"
    placeholder="Permanent Address *"
  />

  <label className="flex items-center gap-2 mt-3 text-sm">
    <input
      type="checkbox"
      checked={sameAddress}
      onChange={(e) => {
        setSameAddress(e.target.checked);
        if (e.target.checked) {
          onChange({ presentAddress: data.permanentAddress });
        }
      }}
    />
    Present address same as permanent address
  </label>

  {!sameAddress && (
    <textarea
      name="presentAddress"
      value={data.presentAddress || ""}
      onChange={update}
      className="input h-24 mt-3"
      placeholder="Present Address"
    />
  )}
</section>


        <div className="flex justify-end">
          <button
            onClick={validate}
            className="px-8 py-3 bg-blue-700 text-white rounded-lg font-bold"
          >
            Save & Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
