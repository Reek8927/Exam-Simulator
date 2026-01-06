import { useLocation } from "wouter";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

async function fetchAdminMe() {
  const res = await fetch("/api/admin/me", {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Not authenticated");
  }

  return res.json();
}

export default function AdminProtectedRoute({
  children,
}: {
  children: JSX.Element;
}) {
  const [, setLocation] = useLocation();

  const { isLoading, isError } = useQuery({
    queryKey: ["admin-me"],
    queryFn: fetchAdminMe,
    retry: false,
  });

  useEffect(() => {
    if (isError) {
      setLocation("/admin/login");
    }
  }, [isError, setLocation]);

  if (isLoading) {
    return <div className="p-10">Checking admin access…</div>;
  }

  return children;
}
