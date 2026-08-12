import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Percent,
  Plus,
  Lightbulb,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useBudgets, useTransactions } from "@/hooks/useFinanceData";
import { StatCard } from "@/components/StatCard";
import { TransactionDialog } from "@/components/TransactionDialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CHART_COLORS,
  formatINR,
  formatDate,
  lastMonthKeys,
  monthKey,
  monthLabel,
  sum,
  type Transaction,
} from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — FinTrack" },
      { name: "description", content: "Your balance, income, expenses, savings rate and spending insights." },
      { property: "og:title", content: "Dashboard — FinTrack" },
      { property: "og:description", content: "Live personal finance overview in rupees." },
    ],
  }),
  component: DashboardPage,
});

function buildInsights(txns: Transaction[]) {
  const insights: string[] = [];
  if (txns.length === 0) return insights;

  const keys = lastMonthKeys(2);
  const thisKey = keys[1]!;
  const prevKey = keys[0]!;
  const thisMonth = txns.filter((t) => monthKey(t.date) === thisKey);
  const prevMonth = txns.filter((t) => monthKey(t.date) === prevKey);
  const thisExp = sum(thisMonth, "expense");
  const prevExp = sum(prevMonth, "expense");
  const thisInc = sum(thisMonth, "income");

  if (prevExp > 0) {
    const change = ((thisExp - prevExp) / prevExp) * 100;
    insights.push(
      change >= 0
        ? `Your spending is up ${change.toFixed(0)}% versus last month (${formatINR(thisExp)} vs ${formatINR(prevExp)}).`
        : `Nice — spending is down ${Math.abs(change).toFixed(0)}% versus last month, saving you ${formatINR(prevExp - thisExp)}.`,
    );
  }

  const byCat = new Map<string, number>();
  for (const t of thisMonth.filter((t) => t.type === "expense")) {
    byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount);
  }
  const top = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0];
  if (top && thisExp > 0) {
    insights.push(
      `${top[0]} is your biggest expense this month at ${formatINR(top[1])} (${((top[1] / thisExp) * 100).toFixed(0)}% of spending).`,
    );
  }

  if (thisInc > 0) {
    const rate = ((thisInc - thisExp) / thisInc) * 100;
    insights.push(
      rate >= 20
        ? `You're saving ${rate.toFixed(0)}% of this month's income — a healthy pace.`
        : `You're saving only ${rate.toFixed(0)}% of income this month. Aim for 20% or more.`,
    );
  }

  const day = new Date().getDate();
  if (thisExp > 0) {
    insights.push(`Average daily spend this month is ${formatINR(thisExp / day)}.`);
  }
  return insights;
}

function DashboardPage() {
  const { data: txns = [], isLoading } = useTransactions();
  const { data: budgets = [] } = useBudgets();
  const [dialogOpen, setDialogOpen] = useState(false);

  const stats = useMemo(() => {
    const income = sum(txns, "income");
    const expense = sum(txns, "expense");
    const savings = income - expense;
    return {
      income,
      expense,
      savings,
      balance: savings,
      rate: income > 0 ? (savings / income) * 100 : 0,
    };
  }, [txns]);

  const monthlySeries = useMemo(() => {
    const keys = lastMonthKeys(6);
    return keys.map((key) => {
      const rows = txns.filter((t) => monthKey(t.date) === key);
      return {
        month: monthLabel(key),
        income: sum(rows, "income"),
        expenses: sum(rows, "expense"),
      };
    });
  }, [txns]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of txns.filter((t) => t.type === "expense")) {
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
    }
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [txns]);

  const currentKey = monthKey(new Date());
  const budgetRows = useMemo(() => {
    return budgets
      .filter((b) => monthKey(b.month) === currentKey)
      .map((b) => {
        const spent = txns
          .filter((t) => t.type === "expense" && t.category === b.category && monthKey(t.date) === currentKey)
          .reduce((a, t) => a + t.amount, 0);
        return { category: b.category, budget: b.amount, spent };
      });
  }, [budgets, txns, currentKey]);

  const insights = useMemo(() => buildInsights(txns), [txns]);
  const recent = txns.slice(0, 6);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything calculated live from your transactions.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" /> Add transaction
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Balance" value={formatINR(stats.balance)} icon={Wallet} />
        <StatCard label="Total Income" value={formatINR(stats.income)} icon={TrendingUp} tone="income" />
        <StatCard label="Total Expenses" value={formatINR(stats.expense)} icon={TrendingDown} tone="expense" />
        <StatCard label="Total Savings" value={formatINR(stats.savings)} icon={PiggyBank} tone="savings" />
        <StatCard
          label="Savings Rate"
          value={`${stats.rate.toFixed(1)}%`}
          icon={Percent}
          hint={stats.rate >= 20 ? "On a healthy track" : "Try to reach 20%"}
        />
      </div>

      {txns.length === 0 ? (
        <div className="surface p-10 text-center">
          <h2 className="text-lg font-semibold">No transactions yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Add your first income or expense to unlock charts and insights.
          </p>
          <Button className="mt-5" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" /> Add your first transaction
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="surface p-5">
              <h2 className="text-base font-semibold">Monthly income vs expenses</h2>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlySeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickFormatter={(v) => `₹${Math.round(Number(v) / 1000)}k`} />
                    <Tooltip formatter={(v) => formatINR(Number(v))} contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-card)" }} />
                    <Legend />
                    <Bar dataKey="income" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="expenses" fill="var(--color-chart-3)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="surface p-5">
              <h2 className="text-base font-semibold">Expense distribution by category</h2>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                      {categoryData.map((entry, i) => (
                        <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatINR(Number(v))} contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-card)" }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="surface p-5">
            <h2 className="text-base font-semibold">Monthly spending trend</h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlySeries}>
                  <defs>
                    <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickFormatter={(v) => `₹${Math.round(Number(v) / 1000)}k`} />
                  <Tooltip formatter={(v) => formatINR(Number(v))} contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-card)" }} />
                  <Area type="monotone" dataKey="expenses" stroke="var(--color-chart-1)" strokeWidth={2} fill="url(#spendFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="surface p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Budget vs actual (this month)</h2>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/budgets">Manage</Link>
                </Button>
              </div>
              {budgetRows.length === 0 ? (
                <p className="mt-6 text-sm text-muted-foreground">
                  No budgets set for this month yet.
                </p>
              ) : (
                <div className="mt-5 space-y-4">
                  {budgetRows.map((row) => {
                    const pct = Math.min((row.spent / row.budget) * 100, 100);
                    return (
                      <div key={row.category}>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{row.category}</span>
                          <span className="tabular-nums text-muted-foreground">
                            {formatINR(row.spent)} / {formatINR(row.budget)}
                          </span>
                        </div>
                        <Progress value={pct} className="mt-2" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="surface p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">Recent transactions</h2>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/transactions">View all</Link>
                </Button>
              </div>
              <ul className="mt-4 divide-y divide-border">
                {recent.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.description || t.category}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.category} · {formatDate(t.date)} · {t.payment_method}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-semibold tabular-nums ${t.type === "income" ? "text-success" : "text-destructive"}`}
                    >
                      {t.type === "income" ? "+" : "−"}
                      {formatINR(t.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {insights.length > 0 && (
            <div className="surface p-5">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Lightbulb className="size-4 text-primary" /> Spending insights
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {insights.map((insight) => (
                  <li key={insight} className="rounded-lg bg-secondary px-4 py-3 text-sm text-secondary-foreground">
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <TransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
