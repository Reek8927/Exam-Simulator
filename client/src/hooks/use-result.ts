import { useQuery } from "@tanstack/react-query";

export function useResult(attemptId: number) {
  return useQuery({
    queryKey: ["result", attemptId],
    queryFn: async () => {
      const res = await fetch(`/api/student/result/${attemptId}`, {
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Result not available");
      }

      return res.json();
    },
    enabled: !!attemptId,
  });
}
