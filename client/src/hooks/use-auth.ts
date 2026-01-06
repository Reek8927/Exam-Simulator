import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  return useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}

