import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { IndianRupee, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in to FinTrack" },
      { name: "description", content: "Sign in or create your FinTrack account to track spending, budgets and savings." },
      { property: "og:title", content: "Sign in to FinTrack" },
      { property: "og:description", content: "Access your personal finance dashboard." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [resetMode, setResetMode] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/dashboard" });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      toast.success("Account created. Check your email to confirm, then sign in.");
      return;
    }
    toast.success("Account created. You're all set!");
    navigate({ to: "/dashboard" });
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/profile`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password reset link sent to your email.");
    setResetMode(false);
  }

  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      toast.error("Google sign-in failed. Please try again.");
    }
    // On success the browser is redirected to Google, so there's nothing
    // further to do here.
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="gradient-brand flex size-9 items-center justify-center rounded-xl">
            <IndianRupee className="size-5 text-primary-foreground" />
          </span>
          <span className="font-display text-xl font-bold">FinTrack</span>
        </Link>

        <div className="surface p-6">
          {resetMode ? (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <h1 className="text-xl font-semibold">Reset your password</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  We'll email you a secure link to set a new password.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input id="reset-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />} Send reset link
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setResetMode(false)}>
                Back to sign in
              </Button>
            </form>
          ) : (
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="size-4 animate-spin" />} Sign in
                  </Button>
                  <button
                    type="button"
                    onClick={() => setResetMode(true)}
                    className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full name</Label>
                    <Input id="signup-name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="size-4 animate-spin" />} Create account
                  </Button>
                </form>
              </TabsContent>

              <div className="mt-6">
                <div className="relative mb-4 text-center text-xs text-muted-foreground">
                  <span className="bg-card px-2">or continue with</span>
                  <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-border" />
                </div>
                <Button type="button" variant="outline" className="w-full" onClick={handleGoogle}>
                  Continue with Google
                </Button>
              </div>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
