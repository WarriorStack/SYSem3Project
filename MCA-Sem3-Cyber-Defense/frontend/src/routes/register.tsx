import { useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/auth-context";
import { parseApiError } from "@/lib/api/client";

export const Route = createFileRoute("/register")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Create account — SentinelML Cyber Defense" },
      {
        name: "description",
        content: "Register an analyst account for the SentinelML security analytics console.",
      },
      { property: "og:title", content: "Create account — SentinelML Cyber Defense" },
      {
        property: "og:description",
        content: "Register an analyst account for the SentinelML security analytics console.",
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { register, login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next["name"] = "Name is required.";
    if (!email.trim()) next["email"] = "Email is required.";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) next["email"] = "Enter a valid email address.";
    if (!password) next["password"] = "Password is required.";
    else if (password.length < 8) next["password"] = "Use at least 8 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const result = await register(name.trim(), email.trim(), password);
      const token = (result as { access_token?: string })?.access_token;
      if (token) {
        // Backend issued a session directly — complete the login flow.
        await login(email.trim(), password);
        navigate({ to: "/dashboard", replace: true });
        return;
      }
      setSuccess(true);
    } catch (error) {
      const parsed = parseApiError(error);
      setFormError(parsed.message);
      if (parsed.fieldErrors) setErrors(parsed.fieldErrors);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <AuthShell title="Account created" subtitle="Your analyst account is ready.">
        <div className="space-y-4">
          <div className="border-success/40 bg-success/10 text-success flex items-start gap-2 rounded-md border px-3 py-2 text-sm">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>Registration succeeded. Sign in to open the console.</span>
          </div>
          <Button className="w-full" onClick={() => navigate({ to: "/login" })}>
            Continue to sign in
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create account"
      subtitle="Register to access the threat detection console."
      footer={
        <>
          Already registered?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
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
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            aria-invalid={Boolean(errors["name"])}
          />
          {errors["name"] && <p className="text-destructive text-xs">{errors["name"]}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            aria-invalid={Boolean(errors["email"])}
          />
          {errors["email"] && <p className="text-destructive text-xs">{errors["email"]}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            aria-invalid={Boolean(errors["password"])}
          />
          {errors["password"] && <p className="text-destructive text-xs">{errors["password"]}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
