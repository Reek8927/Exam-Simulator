import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

/* =========================
   GET ALL EXAMS
========================= */
export function useExams() {
  return useQuery({
    queryKey: [api.exams.list.path],
    queryFn: async () => {
      const res = await fetch(api.exams.list.path, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch exams");
      }

      return api.exams.list.responses[200].parse(await res.json());
    },
  });
}

/* =========================
   GET SINGLE EXAM (SAFE)
========================= */
export function useExam(
  examId?: number,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: [api.exams.get.path, examId],

    enabled:
      typeof examId === "number" &&
      examId > 0 &&
      (options?.enabled ?? true),

    queryFn: async () => {
      if (!examId || examId <= 0) {
        throw new Error("Invalid exam id");
      }

      const url = buildUrl(api.exams.get.path, { id: examId });

      const res = await fetch(url, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch exam details");
      }

      return api.exams.get.responses[200].parse(await res.json());
    },
  });
}
