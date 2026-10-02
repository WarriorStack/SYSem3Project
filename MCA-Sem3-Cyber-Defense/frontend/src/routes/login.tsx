import { useEffect, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Loader2 } from "lucide-react";
import { z } from "zod";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/auth-context";
import { API_BASE_URL, parseApiError } from "@/lib/api/client";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — SentinelML Cyber Defense" },
      { name: "description", content: "Authenticate to the SentinelML security analytics console." },
      { property: "og:title", content: "Sign in — SentinelML Cyber Defense" },
      {
        property: "og:description",
        content: "Authenticate to the SentinelML security analytics console.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: search.redirect ?? "/dashboard", replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, search.redirect]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!email.trim()) next["email"] = "Email is required.";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) next["email"] = "Enter a valid email address.";
    if (!password) next["password"] = "Password is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate({ to: search.redirect ?? "/dashboard", replace: true });
    } catch (error) {
      const parsed = parseApiError(error);
      setFormError(parsed.message);
      if (parsed.fieldErrors) setErrors(parsed.fieldErrors);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Access the security operations console."
      footer={
        <>
          No account yet?{" "}
          <Link to="/register" className="text-primary hover:underline">
            Register an analyst account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && (
          <div
            role="alert"
            className="border-destructive/40 bg-destructive/10 text-destructive flex items-start gap-2 rounded-md border px-3 py-2 text-sm"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{formError}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(errors["email"])}
            aria-describedby={errors["email"] ? "email-error" : undefined}
            placeholder="analyst@soc.local"
          />
          {errors["email"] && (
            <p id="email-error" className="text-destructive text-xs">
              {errors["email"]}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(errors["password"])}
            aria-describedby={errors["password"] ? "password-error" : undefined}
            placeholder="••••••••"
          />
          {errors["password"] && (
            <p id="password-error" className="text-destructive text-xs">
              {errors["password"]}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {submitting ? "Authenticating…" : "Sign in"}
        </Button>

        <p className="text-muted-foreground text-center text-[11px]">
          Authenticating against <span className="font-mono">{API_BASE_URL}</span>
        </p>
      </form>
    </AuthShell>
  );
}
