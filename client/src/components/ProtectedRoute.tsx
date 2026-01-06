import { ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useAuth();

  // ⏳ WAIT — VERY IMPORTANT
  if (isLoading) {
    return <div className="p-8">Checking session...</div>;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}


