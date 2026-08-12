import { createFileRoute, Link } from "@tanstack/react-router";
import {
  IndianRupee,
  TrendingUp,
  PieChart,
  Wallet,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FinTrack — Track Expenses, Budgets & Savings in ₹" },
      {
        name: "description",
        content:
          "FinTrack is a personal finance dashboard for Indian users: log income and expenses, set category budgets, and see analytics on spending and savings.",
      },
      { property: "og:title", content: "FinTrack — Personal Finance & Expense Analytics" },
      {
        property: "og:description",
        content: "Log income and expenses, set monthly budgets, and understand where your money goes.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: TrendingUp,
    title: "Live dashboard",
    body: "Balance, income, expenses, savings rate and monthly trends computed from your own data.",
  },
  {
    icon: Wallet,
    title: "Budgets that warn you",
    body: "Set monthly category budgets and see under-budget, near-limit and over-budget status at a glance.",
  },
  {
    icon: PieChart,
    title: "Deep analytics",
    body: "Category breakdowns, payment-method mix, average daily spend and top spending categories.",
  },
  {
    icon: Sparkles,
    title: "Automatic insights",
    body: "Plain-English observations about your spending shifts, savings pace and budget risk.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <span className="gradient-brand flex size-9 items-center justify-center rounded-xl">
            <IndianRupee className="size-5 text-primary-foreground" />
          </span>
          <span className="font-display text-lg font-bold">FinTrack</span>
        </div>
        <Button asChild variant="ghost">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <section className="mx-auto max-w-6xl px-5 pt-10 pb-16 sm:pt-16">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            <ShieldCheck className="size-3.5" /> Private by default — your data is yours alone
          </span>
          <h1 className="mt-6 text-4xl leading-tight font-bold sm:text-6xl">
            Know exactly where your <span className="text-gradient-brand">rupees</span> go.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            FinTrack turns everyday transactions into a clear picture of your income, spending
            habits, budgets and savings rate — with charts that actually help you decide.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth">
                Get started free <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">
                I already have an account
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="surface p-5">
                <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="size-5" />
                </span>
                <h2 className="mt-4 text-base font-semibold">{f.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        FinTrack — personal finance analytics in Indian Rupees.
      </footer>
    </div>
  );
}
