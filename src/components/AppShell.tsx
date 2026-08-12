import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PieChart,
  User,
  LogOut,
  Menu,
  X,
  IndianRupee,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/budgets", label: "Budgets", icon: Wallet },
  { to: "/analytics", label: "Analytics", icon: PieChart },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-sidebar p-4 lg:flex">
        <Link to="/dashboard" className="mb-8 flex items-center gap-2 px-2 pt-2">
          <span className="gradient-brand flex size-9 items-center justify-center rounded-xl">
            <IndianRupee className="size-5 text-primary-foreground" />
          </span>
          <span className="font-display text-lg font-bold text-sidebar-foreground">FinTrack</span>
        </Link>
        {nav}
        <Button variant="ghost" onClick={handleSignOut} className="justify-start text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground">
          <LogOut className="size-4" /> Sign out
        </Button>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="gradient-brand flex size-8 items-center justify-center rounded-lg">
            <IndianRupee className="size-4 text-primary-foreground" />
          </span>
          <span className="font-display text-base font-bold">FinTrack</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </header>

      {open && (
        <div className="fixed inset-x-0 top-[57px] z-30 flex flex-col gap-1 bg-sidebar p-4 lg:hidden">
          {nav}
          <Button variant="ghost" onClick={handleSignOut} className="justify-start text-sidebar-foreground/75">
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      )}

      <main className="px-4 py-6 sm:px-6 lg:ml-64 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
