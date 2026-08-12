import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useBudgets, useTransactions } from "@/hooks/useFinanceData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EXPENSE_CATEGORIES, formatINR, monthKey, monthLabel, monthStart, lastMonthKeys } from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/budgets")({
  head: () => ({
    meta: [
      { title: "Budgets — FinTrack" },
      { name: "description", content: "Set monthly category budgets and track spent, remaining and percentage used." },
      { property: "og:title", content: "Budgets — FinTrack" },
      { property: "og:description", content: "Stay under budget every month." },
    ],
  }),
  component: BudgetsPage,
});

function BudgetsPage() {
  const queryClient = useQueryClient();
  const { data: budgets = [] } = useBudgets();
  const { data: txns = [] } = useTransactions();
  const [open, setOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(monthKey(new Date()));
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");

  const monthOptions = useMemo(() => {
    const keys = new Set([...lastMonthKeys(6), monthKey(new Date())]);
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    keys.add(monthKey(next));
    return [...keys].sort().reverse();
  }, []);

  const save = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Not signed in");
      const { error } = await supabase.from("budgets").upsert(
        {
          user_id: userId,
          category,
          amount: Number(amount),
          month: monthStart(selectedMonth),
        },
        { onConflict: "user_id,category,month" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Budget saved");
      setAmount("");
      setOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Budget removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = useMemo(() => {
    return budgets
      .filter((b) => monthKey(b.month) === selectedMonth)
      .map((b) => {
        const spent = txns
          .filter(
            (t) => t.type === "expense" && t.category === b.category && monthKey(t.date) === selectedMonth,
          )
          .reduce((a, t) => a + t.amount, 0);
        const pct = (spent / b.amount) * 100;
        const status = pct >= 100 ? "Over budget" : pct >= 80 ? "Near limit" : "Under budget";
        return { ...b, spent, remaining: b.amount - spent, pct, status };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [budgets, txns, selectedMonth]);

  const totals = useMemo(
    () => ({
      budget: rows.reduce((a, r) => a + r.amount, 0),
      spent: rows.reduce((a, r) => a + r.spent, 0),
    }),
    [rows],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Budgets</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatINR(totals.spent)} spent of {formatINR(totals.budget)} budgeted for {monthLabel(selectedMonth)}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {monthOptions.map((m) => (
                <SelectItem key={m} value={m}>{monthLabel(m)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="size-4" /> Set budget</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Set monthly budget</DialogTitle>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  save.mutate();
                }}
              >
                <div className="space-y-2">
                  <Label>Month</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((m) => (
                        <SelectItem key={m} value={m}>{monthLabel(m)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget-amount">Budget amount (₹)</Label>
                  <Input
                    id="budget-amount"
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={save.isPending}>Save budget</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="surface p-10 text-center">
          <Wallet className="mx-auto size-6 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            No budgets for {monthLabel(selectedMonth)} yet. Set one to start tracking limits.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <div key={row.id} className="surface p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold">{row.category}</h2>
                  <p className="text-xs text-muted-foreground">{monthLabel(selectedMonth)}</p>
                </div>
                <Button variant="ghost" size="icon" aria-label="Delete budget" onClick={() => remove.mutate(row.id)}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <span className="font-display text-xl font-bold tabular-nums">{formatINR(row.spent)}</span>
                <span className="text-sm text-muted-foreground">of {formatINR(row.amount)}</span>
              </div>

              <Progress value={Math.min(row.pct, 100)} className="mt-3" />

              <div className="mt-3 flex items-center justify-between text-sm">
                <Badge
                  variant={row.pct >= 100 ? "destructive" : "secondary"}
                  className={row.pct >= 80 && row.pct < 100 ? "bg-warning/20 text-warning-foreground" : ""}
                >
                  {row.status}
                </Badge>
                <span className="tabular-nums text-muted-foreground">
                  {row.pct.toFixed(0)}% used ·{" "}
                  {row.remaining >= 0
                    ? `${formatINR(row.remaining)} left`
                    : `${formatINR(Math.abs(row.remaining))} over`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
