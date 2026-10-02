import { useEffect, useRef } from "react";
import { Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoadingState } from "@/components/common/States";
import { useAuth } from "@/lib/auth/auth-context";

/**
 * Protected application shell. JWT state lives in the browser, so this layout
 * is client-rendered and redirects unauthenticated visitors to /login.
 */
export const Route = createFileRoute("/_app")({
  ssr: false,
  component: ProtectedShell,
});

function ProtectedShell() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const target = useRouterState({
    select: (s) => s.location.pathname + s.location.searchStr,
  });
  const redirected = useRef(false);

  useEffect(() => {
    if (isLoading || isAuthenticated || redirected.current) return;
    redirected.current = true;
    navigate({
      to: "/login",
      search: { redirect: target.startsWith("/login") ? "/dashboard" : target },
      replace: true,
    });
  }, [isAuthenticated, isLoading, navigate, target]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <LoadingState label="Verifying session…" />
      </div>
    );
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
