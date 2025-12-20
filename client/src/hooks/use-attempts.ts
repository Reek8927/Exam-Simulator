import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertTestAttempt, InsertTestResponse, TestResponse } from "@shared/schema";

// POST /api/attempts - Start a new test
export function useCreateAttempt() {
  return useMutation({
    mutationFn: async (data: InsertTestAttempt) => {
      const res = await fetch(api.attempts.create.path, {
        method: api.attempts.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to start attempt");
      return api.attempts.create.responses[201].parse(await res.json());
    },
  });
}

// GET /api/attempts/:id - Get test state (resume or view result)
export function useAttempt(id: number) {
  return useQuery({
    queryKey: [api.attempts.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.attempts.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch attempt");
      return api.attempts.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
    refetchInterval: (query) => {
      // Don't auto-refetch if completed to avoid overwrite
      const data = query.state.data;
      if (data && data.status === 'completed') return false;
      return false; // Manually managing state mostly
    }
  });
}

// POST /api/attempts/:id/submit - Finish test
export function useSubmitAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (attemptId: number) => {
      const url = buildUrl(api.attempts.submit.path, { id: attemptId });
      const res = await fetch(url, {
        method: api.attempts.submit.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to submit test");
      return api.attempts.submit.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      // Invalidate specific attempt query
      queryClient.invalidateQueries({ queryKey: [api.attempts.get.path, data.id] });
    },
  });
}

// POST /api/responses - Save answer
export function useUpsertResponse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertTestResponse) => {
      const res = await fetch(api.responses.upsert.path, {
        method: api.responses.upsert.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save response");
      return api.responses.upsert.responses[200].parse(await res.json());
    },
    onMutate: async (newResponse) => {
      // Optimistic Update
      const attemptId = newResponse.attemptId;
      const queryKey = [api.attempts.get.path, attemptId];
      
      await queryClient.cancelQueries({ queryKey });
      
      const previousAttempt = queryClient.getQueryData(queryKey);
      
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        
        // Find if response exists
        const existingResponseIndex = old.responses.findIndex((r: TestResponse) => r.questionId === newResponse.questionId);
        const updatedResponses = [...old.responses];
        
        const optimisticResponse = {
          ...newResponse,
          id: -1, // Temp ID
          timeSpent: newResponse.timeSpent || 0
        };

        if (existingResponseIndex >= 0) {
          updatedResponses[existingResponseIndex] = { ...updatedResponses[existingResponseIndex], ...optimisticResponse };
        } else {
          updatedResponses.push(optimisticResponse);
        }
        
        return {
          ...old,
          responses: updatedResponses
        };
      });

      return { previousAttempt };
    },
    onError: (err, newResponse, context: any) => {
      queryClient.setQueryData([api.attempts.get.path, newResponse.attemptId], context.previousAttempt);
    },
    onSettled: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: [api.attempts.get.path, data.attemptId] });
      }
    }
  });
}
