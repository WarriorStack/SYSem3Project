import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { PageHeader, Panel } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/SeverityBadge";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/common/States";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminService } from "@/lib/api/services";
import { toErrorState } from "@/lib/api/query";
import { formatDateTime, titleCase } from "@/lib/format";

export const Route = createFileRoute("/_app/admin/users")({
  head: () => ({
    meta: [
      { title: "User Management — SentinelML Admin" },
      { name: "description", content: "Administrative view of platform accounts and roles." },
      { property: "og:title", content: "User Management — SentinelML Admin" },
      { property: "og:description", content: "Administrative view of platform accounts and roles." },
    ],
  }),
  component: () => (
    <RoleGuard roles={["admin"]}>
      <AdminUsersPage />
    </RoleGuard>
  ),
});

function AdminUsersPage() {
  const query = useQuery({ queryKey: ["admin", "users"], queryFn: () => adminService.users() });

  const users = query.data?.items ?? [];
  const error = toErrorState(query.error);

  return (
    <>
      <PageHeader
        title="User Management"
        description="Accounts returned by the backend. Authorization is enforced server-side for every request."
      />

      <Panel>
        {query.isLoading ? (
          <TableSkeleton cols={5} />
        ) : error ? (
          <ErrorState
            title={error.status === 403 ? "Administrator access required" : "Unable to load users"}
            message={error.message}
            onRetry={() => void query.refetch()}
          />
        ) : users.length === 0 ? (
          <EmptyState icon={<Users className="size-5" />} title="No user accounts returned" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={String(user.id)}>
                    <TableCell className="text-sm font-medium">{user.name ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{user.email}</TableCell>
                    <TableCell className="text-sm">{titleCase(user.role)}</TableCell>
                    <TableCell>
                      <StatusBadge status={user.is_active === false ? "dismissed" : "active"} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatDateTime(user.created_at)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatDateTime(user.last_login)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>
    </>
  );
}
