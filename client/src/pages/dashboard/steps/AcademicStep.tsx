import { useEffect } from "react";

export type AcademicData = {
  class10Board?: string;
  class10Year?: number | string;
  class10Roll?: string;

  class12Status?: "Appearing" | "Passed" | "";
  class12Board?: string;
  class12School?: string;
  class12Year?: number | string;
};

interface Props {
  data: AcademicData;
  onChange: (data: Partial<AcademicData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function AcademicStep({
  data,
  onChange,
  onNext,
  onBack,
}: Props) {
  const update = (key: keyof AcademicData, value: string) => {
  const parsedValue =
    key === "class10Year" || key === "class12Year"
      ? Number(value)
      : value;

  onChange({ ...data, [key]: parsedValue });
};


  const isComplete =
    data.class10Board &&
    data.class10Year &&
    data.class10Roll &&
    data.class12Status &&
    data.class12Board &&
    data.class12School &&
    data.class12Year;

  return (
    <div className="bg-white p-8 rounded-xl shadow border space-y-10">
      {/* CLASS 10 */}
      <section>
        <h2 className="text-lg font-bold text-blue-700 mb-4">
          Class 10 (or Equivalent) Details
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <input
            className="input"
            placeholder="Board Name (CBSE / ICSE / State Board)"
            value={data.class10Board || ""}
            onChange={(e) => update("class10Board", e.target.value)}
          />

          <input
            className="input"
            placeholder="Year of Passing"
            type = {"number"}
            value={data.class10Year || ""}
            onChange={(e) => update("class10Year", e.target.value)}
          />

          <input
            className="input md:col-span-2"
            placeholder="Roll Number (as per certificate)"
            value={data.class10Roll || ""}
            onChange={(e) => update("class10Roll", e.target.value)}
          />
        </div>
      </section>

      {/* CLASS 12 */}
      <section>
        <h2 className="text-lg font-bold text-blue-700 mb-4">
          Class 12 (or Equivalent) Details
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <select
            className="input"
            value={data.class12Status || ""}
            onChange={(e) =>
              update("class12Status", e.target.value)
            }
          >
            <option value="">Appearing / Passed</option>
            <option value="Appearing">Appearing</option>
            <option value="Passed">Passed</option>
          </select>

          <input
            className="input"
            placeholder="Board Name"
            value={data.class12Board || ""}
            onChange={(e) => update("class12Board", e.target.value)}
          />

          <input
            className="input"
            placeholder="School Name"
            value={data.class12School || ""}
            onChange={(e) => update("class12School", e.target.value)}
          />

          <input
            className="input"
            placeholder="Year of Passing / Appearing"
            type = {"number"}
            value={data.class12Year || ""}
            onChange={(e) => update("class12Year", e.target.value)}
          />
        </div>

        {data.class12Status === "Appearing" && (
          <p className="text-sm text-slate-500 mt-3">
            📌 If appearing in 2026, select <b>Appearing</b> and enter expected year.
          </p>
        )}
      </section>

      {/* NAVIGATION */}
      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={onBack}
          className="px-6 py-3 border rounded-lg font-semibold hover:bg-slate-50"
        >
          Back
        </button>

        <button
          onClick={onNext}
          disabled={!isComplete}
          className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg disabled:opacity-50"
        >
          Save & Continue
        </button>
      </div>
    </div>
  );
}
