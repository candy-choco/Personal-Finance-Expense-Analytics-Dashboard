import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarDays, Percent, TrendingDown, TrendingUp } from "lucide-react";
import { useTransactions } from "@/hooks/useFinanceData";
import { StatCard } from "@/components/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  CHART_COLORS,
  formatINR,
  lastMonthKeys,
  monthKey,
  monthLabel,
  sum,
} from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — FinTrack" },
      { name: "description", content: "Category expenses, payment-method mix, savings rate and spending trends." },
      { property: "og:title", content: "Analytics — FinTrack" },
      { property: "og:description", content: "Understand your spending patterns in depth." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data: txns = [], isLoading } = useTransactions();

  const monthly = useMemo(() => {
    return lastMonthKeys(12).map((key) => {
      const rows = txns.filter((t) => monthKey(t.date) === key);
      const income = sum(rows, "income");
      const expenses = sum(rows, "expense");
      return { month: monthLabel(key), income, expenses, savings: income - expenses };
    });
  }, [txns]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of txns.filter((t) => t.type === "expense")) {
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
    }
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [txns]);

  const byMethod = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of txns.filter((t) => t.type === "expense")) {
      map.set(t.payment_method, (map.get(t.payment_method) ?? 0) + t.amount);
    }
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [txns]);

  const totals = useMemo(() => {
    const income = sum(txns, "income");
    const expense = sum(txns, "expense");
    const dates = txns.map((t) => t.date).sort();
    const first = dates[0];
    const days = first
      ? Math.max(1, Math.round((Date.now() - new Date(`${first}T00:00:00`).getTime()) / 86400000) + 1)
      : 1;
    return {
      income,
      expense,
      avgDaily: expense / days,
      rate: income > 0 ? ((income - expense) / income) * 100 : 0,
    };
  }, [txns]);

  const expenseTotal = byCategory.reduce((a, c) => a + c.value, 0);

  if (isLoading) return <Skeleton className="h-96" />;

  if (txns.length === 0) {
    return (
      <div className="surface p-10 text-center">
        <h1 className="text-lg font-semibold">Analytics</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add some transactions and your analytics will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">A deeper look at how money moves.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Income" value={formatINR(totals.income)} icon={TrendingUp} tone="income" />
        <StatCard label="Total Expenses" value={formatINR(totals.expense)} icon={TrendingDown} tone="expense" />
        <StatCard label="Average Daily Spend" value={formatINR(totals.avgDaily)} icon={CalendarDays} />
        <StatCard label="Savings Rate" value={`${totals.rate.toFixed(1)}%`} icon={Percent} tone="savings" />
      </div>

      <div className="surface p-5">
        <h2 className="text-base font-semibold">Income vs expenses (last 12 months)</h2>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface p-5">
          <h2 className="text-base font-semibold">Spending trend & savings</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickFormatter={(v) => `₹${Math.round(Number(v) / 1000)}k`} />
                <Tooltip formatter={(v) => formatINR(Number(v))} contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-card)" }} />
                <Legend />
                <Line type="monotone" dataKey="expenses" stroke="var(--color-chart-3)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="savings" stroke="var(--color-chart-1)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface p-5">
          <h2 className="text-base font-semibold">Payment method distribution</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byMethod} dataKey="value" nameKey="name" outerRadius={100}>
                  {byMethod.map((entry, i) => (
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

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface p-5">
          <h2 className="text-base font-semibold">Category-wise expenses</h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={12} tickFormatter={(v) => `₹${Math.round(Number(v) / 1000)}k`} />
                <YAxis type="category" dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} width={90} />
                <Tooltip formatter={(v) => formatINR(Number(v))} contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-card)" }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {byCategory.map((entry, i) => (
                    <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface p-5">
          <h2 className="text-base font-semibold">Top spending categories</h2>
          <ul className="mt-5 space-y-4">
            {byCategory.slice(0, 6).map((c, i) => (
              <li key={c.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    <span className="mr-2 text-muted-foreground">#{i + 1}</span>
                    {c.name}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatINR(c.value)} · {((c.value / expenseTotal) * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress value={(c.value / expenseTotal) * 100} className="mt-2" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
