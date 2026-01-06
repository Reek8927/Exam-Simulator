import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";

type NoticeType = "public" | "student" | "admin";
type PriorityType = "urgent" | "important" | "normal";

export default function NoticeFormModal({
  notice,
  onClose,
}: {
  notice: any | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();

  const [form, setForm] = useState<{
    title: string;
    description: string;
    type: NoticeType;
    priority: PriorityType;
    isPinned: boolean;
    isActive: boolean;
  }>({
    title: notice?.title ?? "",
    description: notice?.description ?? "",
    type: notice?.type ?? "student",
    priority: notice?.priority ?? "normal",
    isPinned: notice?.isPinned ?? false,
    isActive: notice?.isActive ?? true,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      // 🔒 FINAL SAFETY NORMALIZATION
      const safeType: NoticeType =
        form.type === "public" ||
        form.type === "student" ||
        form.type === "admin"
          ? form.type
          : "student";

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        type: safeType,
        priority: form.priority,
        isPinned: form.isPinned,
        isActive: form.isActive,
      };

      // 🔥 BACKEND WILL HANDLE REQUIRED FIELD VALIDATION
      const res = await fetch(
        notice ? `/api/admin/notices/${notice.id}` : "/api/admin/notices",
        {
          method: notice ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to save notice");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-notices"] });
      onClose();
    },
    onError: (err: any) => {
      alert(err.message);
    },
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg space-y-4 shadow-xl">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-lg">
            {notice ? "Edit Notice" : "Create Notice"}
          </h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* TITLE */}
        <input
          placeholder="Notice Title"
          className="border rounded w-full p-2"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
        />

        {/* DESCRIPTION */}
        <textarea
          placeholder="Notice Description"
          rows={4}
          className="border rounded w-full p-2"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
        />

        {/* TYPE & PRIORITY */}
        <div className="grid grid-cols-2 gap-3">
          <select
            className="border rounded p-2"
            value={form.type}
            onChange={e =>
              setForm({
                ...form,
                type: (e.target.value || "student") as NoticeType,
              })
            }
          >
            <option value="public">Public</option>
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>

          <select
            className="border rounded p-2"
            value={form.priority}
            onChange={e =>
              setForm({
                ...form,
                priority: e.target.value as PriorityType,
              })
            }
          >
            <option value="urgent">Urgent</option>
            <option value="important">Important</option>
            <option value="normal">Normal</option>
          </select>
        </div>

        {/* PIN */}
        <label className="flex gap-2 items-center text-sm">
          <input
            type="checkbox"
            checked={form.isPinned}
            onChange={e =>
              setForm({ ...form, isPinned: e.target.checked })
            }
          />
          Pin this notice
        </label>

        {/* SAVE */}
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition disabled:opacity-50"
        >
          {saveMutation.isPending ? "Saving..." : "Save Notice"}
        </button>
      </div>
    </div>
  );
}
