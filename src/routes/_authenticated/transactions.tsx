import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTransactions } from "@/hooks/useFinanceData";
import { TransactionDialog } from "@/components/TransactionDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ALL_CATEGORIES,
  PAYMENT_METHODS,
  formatINR,
  formatDate,
  type Transaction,
} from "@/lib/finance";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions — FinTrack" },
      { name: "description", content: "Add, edit, search, filter and sort all your income and expense records." },
      { property: "og:title", content: "Transactions — FinTrack" },
      { property: "og:description", content: "Manage every rupee in and out." },
    ],
  }),
  component: TransactionsPage,
});

type SortKey = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

function TransactionsPage() {
  const { data: txns = [], isLoading } = useTransactions();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [category, setCategory] = useState("all");
  const [method, setMethod] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<SortKey>("date-desc");

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transaction deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = txns.filter((t) => {
      if (type !== "all" && t.type !== type) return false;
      if (category !== "all" && t.category !== category) return false;
      if (method !== "all" && t.payment_method !== method) return false;
      if (from && t.date < from) return false;
      if (to && t.date > to) return false;
      if (q) {
        const haystack = `${t.description} ${t.category} ${t.notes ?? ""} ${t.payment_method}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    return rows.sort((a, b) => {
      switch (sort) {
        case "date-asc":
          return a.date.localeCompare(b.date);
        case "amount-desc":
          return b.amount - a.amount;
        case "amount-asc":
          return a.amount - b.amount;
        default:
          return b.date.localeCompare(a.date);
      }
    });
  }, [txns, search, type, category, method, from, to, sort]);

  const totals = useMemo(
    () => ({
      income: filtered.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0),
      expense: filtered.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0),
    }),
    [filtered],
  );

  function openEdit(t: Transaction) {
    setEditing(t);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Transactions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} record{filtered.length === 1 ? "" : "s"} · Income {formatINR(totals.income)} · Expenses{" "}
            {formatINR(totals.expense)}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" /> Add transaction
        </Button>
      </div>

      <div className="surface space-y-4 p-5">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search description, category, notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="space-y-1.5">
            <Label className="text-xs">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {ALL_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Payment method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All methods</SelectItem>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="from">From</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="to">To</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Sort by</Label>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest first</SelectItem>
                <SelectItem value="date-asc">Oldest first</SelectItem>
                <SelectItem value="amount-desc">Highest amount</SelectItem>
                <SelectItem value="amount-asc">Lowest amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-96" />
      ) : filtered.length === 0 ? (
        <div className="surface p-10 text-center">
          <ArrowUpDown className="mx-auto size-6 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No transactions match your filters.</p>
        </div>
      ) : (
        <div className="surface overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-muted/50">
                  <td className="px-5 py-3 whitespace-nowrap text-muted-foreground">{formatDate(t.date)}</td>
                  <td className="px-5 py-3">
                    <p className="font-medium">{t.description || "—"}</p>
                    {t.notes && <p className="text-xs text-muted-foreground">{t.notes}</p>}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant="secondary">{t.category}</Badge>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{t.payment_method}</td>
                  <td
                    className={`px-5 py-3 text-right font-semibold tabular-nums ${t.type === "income" ? "text-success" : "text-destructive"}`}
                  >
                    {t.type === "income" ? "+" : "−"}
                    {formatINR(t.amount)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => openEdit(t)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete"
                        onClick={() => remove.mutate(t.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} transaction={editing} />
    </div>
  );
}
