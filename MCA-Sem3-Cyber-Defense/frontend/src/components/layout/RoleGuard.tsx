import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { EmptyState } from "@/components/common/States";

/**
 * Hides UI a role should not see. Authorization itself is enforced by the
 * FastAPI backend — this guard is a usability layer, never a security control.
 */
export function RoleGuard({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { role } = useAuth();
  if (!role || !roles.includes(role)) {
    return (
      <EmptyState
        icon={<ShieldAlert className="size-5" />}
        title="Restricted area"
        message="Your account role does not grant access to this section. Administrative APIs remain enforced server-side."
      />
    );
  }
  return <>{children}</>;
}
