interface Props {
  application: any;
  onConfirm: () => void;
  onBack: () => void;
}

export default function PreviewStep({
  application,
  onConfirm,
  onBack,
}: Props) {
  return (
    <div className="bg-white p-8 rounded-xl border shadow space-y-6">
      <h2 className="text-xl font-bold text-blue-700">
        Application Preview
      </h2>

      {/* PERSONAL DETAILS */}
      <Section title="Personal Details">
        <Row label="Candidate Name" value={application.name} />
        <Row label="Father's Name" value={application.fatherName} />
        <Row label="Mother's Name" value={application.motherName} />
        <Row label="Date of Birth" value={application.dob} />
        <Row label="Gender" value={application.gender} />
        <Row label="Category" value={application.category} />
        <Row label="Nationality" value={application.nationality} />
        <Row
          label="State of Eligibility"
          value={application.stateOfEligibility}
        />
        <Row label="Aadhaar Number" value={application.aadhaarNumber} />
      </Section>

      {/* ACADEMIC */}
      <Section title="Academic Details">
        <Row label="Class 10 Board" value={application.class10Board} />
        <Row label="Class 10 Year" value={application.class10Year} />
        <Row label="Class 10 Roll" value={application.class10Roll} />
        <Row label="Class 12 Status" value={application.class12Status} />
        <Row label="Class 12 Board" value={application.class12Board} />
        <Row label="School Name" value={application.class12School} />
        <Row label="Class 12 Year" value={application.class12Year} />
      </Section>

      {/* DOCUMENTS */}
      <Section title="Uploaded Documents">
        <Doc label="Photo" url={application.photoUrl} />
        <Doc label="Signature" url={application.signatureUrl} />
        <Doc label="Class 10 Certificate" url={application.class10CertUrl} />
        {application.categoryCertUrl && (
          <Doc
            label="Category Certificate"
            url={application.categoryCertUrl}
          />
        )}
      </Section>

      {/* PDF DOWNLOAD */}
      <div className="flex justify-end">
        <a
          href="/api/application/pdf"
          target="_blank"
          className="px-4 py-2 border rounded text-blue-700 font-semibold hover:bg-blue-50"
        >
          ⬇ Download Application PDF
        </a>
      </div>

      {/* ACTIONS */}
      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={onBack}
          className="px-6 py-2 border rounded"
        >
          Back
        </button>

        <button
          onClick={onConfirm}
          className="px-8 py-2 bg-green-600 text-white font-bold rounded"
        >
          Confirm & Proceed to Payment
        </button>
      </div>
    </div>
  );
}

/* ===== Helper Components ===== */

function Section({ title, children }: any) {
  return (
    <div>
      <h3 className="font-bold text-slate-800 mb-3">{title}</h3>
      <div className="grid md:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Row({ label, value }: any) {
  return (
    <div className="text-sm">
      <span className="text-slate-500">{label}: </span>
      <span className="font-semibold">{value || "—"}</span>
    </div>
  );
}

function Doc({ label, url }: any) {
  return (
    <div className="text-sm">
      <span className="text-slate-500">{label}: </span>
      <a
        href={url}
        target="_blank"
        className="text-blue-600 underline"
      >
        View
      </a>
    </div>
  );
}

