import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pin, PinOff, Edit } from "lucide-react";
import { useState } from "react";
import NoticeFormModal from "./NoticeFormModal";

type Notice = {
  id: number;
  title: string;
  description: string;
  type: "public" | "student" | "admin";
  priority: "urgent" | "important" | "normal";
  isPinned: boolean;
  isActive: boolean;
  createdAt: string;
};

export default function AdminNotices() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Notice | null>(null);
  const [open, setOpen] = useState(false);

  const { data: notices = [] } = useQuery<Notice[]>({
    queryKey: ["admin-notices"],
    queryFn: async () => {
      const res = await fetch("/api/admin/notices", {
        credentials: "include",
      });
      return res.json();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (notice: Notice) => {
      await fetch(`/api/admin/notices/${notice.id}/toggle`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !notice.isActive }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-notices"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/admin/notices/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-notices"] }),
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Notice Management</h1>
        <button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          <Plus size={16} />
          New Notice
        </button>
      </div>

      <div className="bg-white rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-3">Title</th>
              <th>Type</th>
              <th>Priority</th>
              <th>Status</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {notices.map(n => (
              <tr key={n.id} className="border-t">
                <td className="p-3">
                  {n.isPinned && "📌 "}
                  {n.title}
                </td>
                <td>{n.type}</td>
                <td>
                  <PriorityBadge value={n.priority} />
                </td>
                <td>
                  {n.isActive ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-slate-400">Inactive</span>
                  )}
                </td>
                <td className="p-3 flex justify-end gap-2">
                  <button onClick={() => toggleMutation.mutate(n)}>
                    {n.isActive ? <PinOff size={16} /> : <Pin size={16} />}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(n);
                      setOpen(true);
                    }}
                  >
                    <Edit size={16} />
                  </button>
                  <button onClick={() => deleteMutation.mutate(n.id)}>
                    <Trash2 size={16} className="text-red-600" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <NoticeFormModal
          notice={editing}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function PriorityBadge({ value }: { value: string }) {
  const map = {
    urgent: "bg-red-100 text-red-700",
    important: "bg-yellow-100 text-yellow-700",
    normal: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`px-2 py-1 rounded text-xs ${map[value as keyof typeof map]}`}>
      {value}
    </span>
  );
}
