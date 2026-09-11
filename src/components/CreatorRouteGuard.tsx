import { Navigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAccountType } from "@/hooks/use-account-type";

export function CreatorRouteGuard({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const path = pathname.replace(/\/+$/, "");
  // Onboarding keeps its existing access and account setup behavior.
  if (!path.startsWith("/creator/") || path === "/creator/onboarding") return children;
  return <CreatorAccess key={path}>{children}</CreatorAccess>;
}

function CreatorAccess({ children }: { children: ReactNode }) {
  const { userId, loading, accountType, error, retry } = useAccountType();
  if (loading) {
    return (
      <p role="status" className="px-4 py-10 text-center text-sm text-muted-foreground">
        Checking creator access...
      </p>
    );
  }
  if (!userId) return <Navigate to="/login" replace />;
  if (accountType === "user") return <Navigate to="/explore" replace />;
  if (accountType === "creator") return children;
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <p role="alert" className="text-sm text-destructive">
        {error?.message ?? "We couldn't verify your creator access."}
      </p>
      <button
        type="button"
        onClick={() => void retry()}
        className="mt-4 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white"
      >
        Try again
      </button>
    </div>
  );
}
