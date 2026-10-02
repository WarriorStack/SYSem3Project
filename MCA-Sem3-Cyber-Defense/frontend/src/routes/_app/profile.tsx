import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/common/PageHeader";
import { ErrorState, LoadingState } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userService } from "@/lib/api/services";
import { toErrorState } from "@/lib/api/query";
import { formatDateTime, titleCase } from "@/lib/format";
import { useAuth } from "@/lib/auth/auth-context";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "Profile — SentinelML" },
      { name: "description", content: "Review and update your analyst account details." },
      { property: "og:title", content: "Profile — SentinelML" },
      { property: "og:description", content: "Review and update your analyst account details." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const queryClient = useQueryClient();
  const { refresh } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const query = useQuery({ queryKey: ["users", "me"], queryFn: userService.me });

  useEffect(() => {
    if (query.data) {
      setName(query.data.name ?? "");
      setEmail(query.data.email ?? "");
    }
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: (payload: { name: string; email: string }) => userService.updateMe(payload),
    onSuccess: () => {
      toast.success("Profile updated");
      setFieldErrors({});
      void queryClient.invalidateQueries({ queryKey: ["users", "me"] });
      void refresh();
    },
    onError: (error) => {
      const parsed = toErrorState(error);
      toast.error(parsed?.message ?? "Could not update the profile");
    },
  });

  const error = toErrorState(query.error);
  const user = query.data;

  return (
    <>
      <PageHeader title="Profile" description="Your analyst account as stored by the platform." />

      {query.isLoading ? (
        <Panel>
          <LoadingState label="Loading profile…" />
        </Panel>
      ) : error ? (
        <Panel>
          <ErrorState message={error.message} onRetry={() => void query.refetch()} />
        </Panel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="Account details" className="lg:col-span-2" bodyClassName="p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const errors: Record<string, string> = {};
                if (!name.trim()) errors["name"] = "Name is required.";
                if (!email.trim()) errors["email"] = "Email is required.";
                setFieldErrors(errors);
                if (Object.keys(errors).length) return;
                mutation.mutate({ name: name.trim(), email: email.trim() });
              }}
              className="max-w-md space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="profile-name">Name</Label>
                <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
                {fieldErrors["name"] && <p className="text-destructive text-xs">{fieldErrors["name"]}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {fieldErrors["email"] && (
                  <p className="text-destructive text-xs">{fieldErrors["email"]}</p>
                )}
              </div>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                Save changes
              </Button>
            </form>
          </Panel>

          <Panel title="Account metadata" bodyClassName="space-y-3 p-4">
            <div>
              <p className="text-muted-foreground text-[11px] tracking-wider uppercase">role</p>
              <p className="text-sm">{titleCase(user?.role)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-[11px] tracking-wider uppercase">user id</p>
              <p className="font-mono text-xs">{String(user?.id ?? "—")}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-[11px] tracking-wider uppercase">created_at</p>
              <p className="font-mono text-xs">{formatDateTime(user?.created_at)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-[11px] tracking-wider uppercase">last_login</p>
              <p className="font-mono text-xs">{formatDateTime(user?.last_login)}</p>
            </div>
            <p className="text-muted-foreground border-t pt-3 text-xs">
              Passwords and authentication secrets are never exposed by the API.
            </p>
          </Panel>
        </div>
      )}
    </>
  );
}
