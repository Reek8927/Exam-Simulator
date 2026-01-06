import { useState } from "react";

type FileError = string | null;

interface Props {
  data: any;
  onNext: () => void;
  onBack: () => void;
}

type UploadKey = "photo" | "signature" | "class10" | "category";

/* =========================
   UPLOAD HELPER (DB CONNECT)
========================= */
async function uploadFile(file: File, type: UploadKey) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`/api/upload/${type}`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text(); // 👈 avoid JSON parse crash
    throw new Error(text || "Upload failed");
  }

  return res.json();
}

export default function UploadStep({ data, onNext, onBack }: Props) {
  const [files, setFiles] = useState<Record<UploadKey, File | null>>({
    photo: null,
    signature: null,
    class10: null,
    category: null,
  });

  const [errors, setErrors] = useState<Record<string, FileError>>({});
  const [uploading, setUploading] = useState(false);

  /* =========================
     CATEGORY LOGIC (FIXED)
  ========================= */
  function isCategoryRequired() {
    if (!data.category) return false;

    const cat = data.category.toLowerCase();
    return !["general", "gen", "ur", "unreserved"].includes(cat);
  }

  /* =========================
     VALIDATION
  ========================= */
  function validateFile(
    file: File,
    type: "image" | "pdf",
    minKB: number,
    maxKB: number
  ): FileError {
    const sizeKB = file.size / 1024;

    if (sizeKB < minKB || sizeKB > maxKB) {
      return `File size must be ${minKB}–${maxKB} KB`;
    }

    if (type === "image" && !file.type.startsWith("image/")) {
      return "Only JPG/JPEG image allowed";
    }

    if (type === "pdf" && file.type !== "application/pdf") {
      return "Only PDF file allowed";
    }

    return null;
  }

  async function handleChange(
    e: React.ChangeEvent<HTMLInputElement>,
    key: UploadKey,
    type: "image" | "pdf",
    minKB: number,
    maxKB: number
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file, type, minKB, maxKB);
    setErrors(prev => ({ ...prev, [key]: error }));
    if (error) return;

    setUploading(true);
    try {
      await uploadFile(file, key);
      setFiles(prev => ({ ...prev, [key]: file }));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  }

  /* =========================
     PROCEED LOGIC (FIXED)
  ========================= */
  function canProceed() {
    return (
      Boolean(data.photoUrl) &&
      Boolean(data.signatureUrl) &&
      Boolean(data.class10CertUrl) &&
      (!isCategoryRequired() || Boolean(data.categoryCertUrl)) &&
      !errors.photo &&
      !errors.signature &&
      !errors.class10 &&
      !errors.category
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-blue-700">
        Step 3: Upload Documents
      </h2>

      {/* Passport Photo */}
      <UploadBlock
        title="Passport Size Photograph"
        hint="JPG | 10–200 KB"
        error={errors.photo}
        preview={files.photo}
        existingUrl={data.photoUrl}
      >
        <input
          type="file"
          accept="image/jpeg,image/jpg"
          onChange={e => handleChange(e, "photo", "image", 10, 200)}
        />
      </UploadBlock>

      {/* Signature */}
      <UploadBlock
        title="Signature"
        hint="JPG | 4–30 KB"
        error={errors.signature}
        preview={files.signature}
        existingUrl={data.signatureUrl}
      >
        <input
          type="file"
          accept="image/jpeg,image/jpg"
          onChange={e => handleChange(e, "signature", "image", 4, 30)}
        />
      </UploadBlock>

      {/* Class 10 Certificate */}
      <UploadBlock
        title="Class 10 Certificate"
        hint="PDF | 50–300 KB"
        error={errors.class10}
        existingUrl={data.class10CertUrl}
      >
        <input
          type="file"
          accept="application/pdf"
          onChange={e => handleChange(e, "class10", "pdf", 50, 300)}
        />
      </UploadBlock>

      {/* Category Certificate – ONLY IF REQUIRED */}
      {isCategoryRequired() && (
        <UploadBlock
          title="Category Certificate"
          hint="PDF | 50–300 KB"
          error={errors.category}
          existingUrl={data.categoryCertUrl}
        >
          <input
            type="file"
            accept="application/pdf"
            onChange={e => handleChange(e, "category", "pdf", 50, 300)}
          />
          <p className="text-xs text-slate-500 mt-1">
            Required for OBC-NCL / SC / ST / EWS only
          </p>
        </UploadBlock>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-2 border rounded-lg"
        >
          Back
        </button>

        <button
          onClick={onNext}
          disabled={!canProceed() || uploading}
          className="px-8 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Save & Continue"}
        </button>
      </div>
    </div>
  );
}

/* =======================
   UPLOAD BLOCK
======================= */

function UploadBlock({
  title,
  hint,
  error,
  preview,
  existingUrl,
  children,
}: {
  title: string;
  hint: string;
  error?: string | null;
  preview?: File | null;
  existingUrl?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-50 p-4 rounded-lg border">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h4 className="font-semibold">{title}</h4>
          <p className="text-xs text-slate-500">{hint}</p>
        </div>

        {(preview || existingUrl) && (
          <img
            src={preview ? URL.createObjectURL(preview) : existingUrl!}
            className="h-16 w-16 object-cover border rounded"
          />
        )}
      </div>

      {children}

      {error && (
        <p className="text-red-600 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}
