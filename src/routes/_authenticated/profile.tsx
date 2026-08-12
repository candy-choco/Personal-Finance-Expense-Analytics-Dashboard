import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut, UserRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useTransactions } from "@/hooks/useFinanceData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatINR, sum } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — FinTrack" },
      { name: "description", content: "Manage your FinTrack account details and password." },
      { property: "og:title", content: "Profile — FinTrack" },
      { property: "og:description", content: "Your FinTrack account settings." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: txns = [] } = useTransactions();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile?.full_name]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, full_name: fullName }, { onConflict: "id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
    onSuccess: () => {
      setPassword("");
      toast.success("Password updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const income = sum(txns, "income");
  const expense = sum(txns, "expense");

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your account and financial summary.</p>
      </div>

      <div className="surface flex flex-wrap items-center gap-4 p-5">
        <span className="gradient-brand flex size-14 items-center justify-center rounded-2xl">
          <UserRound className="size-7 text-primary-foreground" />
        </span>
        <div className="min-w-0">
          <p className="text-lg font-semibold">{fullName || "FinTrack user"}</p>
          <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <div className="ml-auto grid grid-cols-3 gap-6 text-right text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Transactions</p>
            <p className="font-semibold tabular-nums">{txns.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Income</p>
            <p className="font-semibold tabular-nums text-success">{formatINR(income)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Expenses</p>
            <p className="font-semibold tabular-nums text-destructive">{formatINR(expense)}</p>
          </div>
        </div>
      </div>

      <form
        className="surface space-y-4 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          saveProfile.mutate();
        }}
      >
        <h2 className="text-base font-semibold">Account details</h2>
        <div className="space-y-2">
          <Label htmlFor="full-name">Full name</Label>
          <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={user?.email ?? ""} disabled />
        </div>
        <Button type="submit" disabled={saveProfile.isPending}>Save changes</Button>
      </form>

      <form
        className="surface space-y-4 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          changePassword.mutate();
        }}
      >
        <h2 className="text-base font-semibold">Change password</h2>
        <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            minLength={6}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" variant="outline" disabled={changePassword.isPending}>
          Update password
        </Button>
      </form>

      <Button variant="destructive" onClick={handleSignOut}>
        <LogOut className="size-4" /> Sign out
      </Button>
    </div>
  );
}
