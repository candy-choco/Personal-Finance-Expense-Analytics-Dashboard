export type TxnType = "income" | "expense";

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: TxnType;
  category: string;
  description: string;
  date: string;
  payment_method: string;
  notes: string | null;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  month: string;
}

export const EXPENSE_CATEGORIES = [
  "Food",
  "Transportation",
  "Shopping",
  "Education",
  "Healthcare",
  "Entertainment",
  "Bills",
  "Rent",
  "Travel",
  "Subscriptions",
  "Other",
] as const;

export const INCOME_CATEGORIES = ["Salary", "Freelance", "Investment", "Other"] as const;

export const ALL_CATEGORIES = [
  "Food",
  "Transportation",
  "Shopping",
  "Education",
  "Healthcare",
  "Entertainment",
  "Bills",
  "Rent",
  "Travel",
  "Subscriptions",
  "Salary",
  "Freelance",
  "Investment",
  "Other",
] as const;

export const PAYMENT_METHODS = [
  "Cash",
  "UPI",
  "Credit Card",
  "Debit Card",
  "Bank Transfer",
  "Other",
] as const;

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrPrecise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatINR = (value: number) => inr.format(Math.round(value || 0));
export const formatINRPrecise = (value: number) => inrPrecise.format(value || 0);
export const formatNumber = (value: number) => new Intl.NumberFormat("en-IN").format(value || 0);

export const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export const monthKey = (d: Date | string) => {
  const date = typeof d === "string" ? new Date(`${d}T00:00:00`) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export const monthLabel = (key: string) => {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "2-digit",
  });
};

export const monthStart = (key: string) => `${key}-01`;

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
  "var(--color-chart-7)",
  "var(--color-chart-8)",
];

export const sum = (rows: Transaction[], type?: TxnType) =>
  rows.filter((r) => (type ? r.type === type : true)).reduce((a, r) => a + Number(r.amount), 0);

export function groupBy<T>(rows: T[], key: (row: T) => string) {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const k = key(row);
    const list = map.get(k);
    if (list) list.push(row);
    else map.set(k, [row]);
  }
  return map;
}

export function lastMonthKeys(count: number) {
  const keys: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    keys.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  return keys;
}
