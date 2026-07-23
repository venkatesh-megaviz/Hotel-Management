import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Paperclip, Trash2, Upload, X } from "lucide-react";
import clsx from "clsx";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { Toast, useToast } from "@/components/Toast";
import { fetchExpenses, createExpense, deleteExpense, ApiError, type Expense, type ExpenseCategory } from "@/lib/api";

const categories: ExpenseCategory[] = ["Raw Materials", "Fuel", "Payroll", "Utilities", "Operations", "Maintenance", "Other"];
const paymentModes = ["Cash", "UPI", "Card", "Online", "Bank Transfer"] as const;

const categoryColors: Record<string, string> = {
  "Raw Materials": "bg-brand-50 text-brand-600",
  Fuel: "bg-warning-50 text-warning-600",
  Payroll: "bg-success-50 text-success-600",
  Utilities: "bg-danger-50 text-danger-600",
  Operations: "bg-slate-100 text-slate-600",
  Maintenance: "bg-warning-50 text-warning-600",
  Other: "bg-slate-100 text-slate-600",
};

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}
function isThisMonth(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

type View = "list" | "add";

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  description: "",
  category: "Raw Materials" as ExpenseCategory,
  amount: "",
  paymentMode: "Cash" as (typeof paymentModes)[number],
  billUrl: "",
  billName: "",
};

export default function Expenses() {
  const [view, setView] = useState<View>("list");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast, showToast } = useToast();

  function load() {
    setLoading(true);
    fetchExpenses()
      .then((res) => setExpenses(res.expenses))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const filtered = activeCategory === "All" ? expenses : expenses.filter((e) => e.category === activeCategory);

  const monthTotal = useMemo(() => expenses.filter((e) => isThisMonth(e.createdAt)).reduce((s, e) => s + e.amount, 0), [expenses]);
  const rawMaterialsTotal = useMemo(
    () => expenses.filter((e) => e.category === "Raw Materials" && isThisMonth(e.createdAt)).reduce((s, e) => s + e.amount, 0),
    [expenses],
  );
  const billsAttached = useMemo(() => expenses.filter((e) => e.hasBill && isThisMonth(e.createdAt)).length, [expenses]);
  const todayTotal = useMemo(() => expenses.filter((e) => isToday(e.createdAt)).reduce((s, e) => s + e.amount, 0), [expenses]);
  const monthName = new Date().toLocaleDateString("en-US", { month: "long" });

  function handleFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, billUrl: reader.result as string, billName: file.name }));
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const createdAt = form.date ? new Date(`${form.date}T12:00`).toISOString() : undefined;
      const res = await createExpense({
        description: form.description,
        category: form.category,
        paymentMode: form.paymentMode,
        amount: Number(form.amount),
        hasBill: !!form.billUrl,
        billUrl: form.billUrl,
        createdAt,
      });
      setExpenses((prev) => [res.expense, ...prev]);
      showToast("success", "Expense saved successfully");
      setForm(emptyForm);
      setView("list");
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.message : "Failed to save expense");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteExpense(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  if (view === "add") {
    return (
      <div>
        <Toast toast={toast} />
        <PageHeader title="Add Daily Expense" subtitle="Record a new expense entry" />

        <div className="card max-w-2xl p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Date</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
              <input
                type="text"
                required
                placeholder="e.g. Vegetables Purchase"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min={0}
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Payment Mode</label>
                <select
                  value={form.paymentMode}
                  onChange={(e) => setForm((f) => ({ ...f, paymentMode: e.target.value as (typeof paymentModes)[number] }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                >
                  {paymentModes.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Attach Bill (Optional)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              {form.billUrl ? (
                <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm text-slate-600">
                    <Paperclip size={14} className="text-brand-600" />
                    {form.billName || "Bill attached"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, billUrl: "", billName: "" }))}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-danger-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-8 text-slate-400 hover:border-brand-300 hover:text-brand-500"
                >
                  <Upload size={22} />
                  <span className="text-sm">Click to upload or drag &amp; drop</span>
                  <span className="text-xs text-slate-300">PNG, JPG or PDF</span>
                </button>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setForm(emptyForm);
                  setView("list");
                }}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {submitting ? "Saving…" : "Save Expense"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Toast toast={toast} />
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard data={{ label: `${monthName} Total`, value: `₹${monthTotal.toLocaleString()}`, icon: "CircleDollarSign", accent: "danger" }} />
        <StatCard data={{ label: "Raw Materials", value: `₹${rawMaterialsTotal.toLocaleString()}`, icon: "Box", accent: "brand" }} />
        <StatCard data={{ label: "Bills Attached", value: `${billsAttached}`, icon: "Paperclip", accent: "success" }} />
        <StatCard data={{ label: "Today", value: `₹${todayTotal.toLocaleString()}`, icon: "Calendar", accent: "warning" }} />
      </div>

      <PageHeader
        title="Expense Management"
        subtitle="Daily expenses with bill upload"
        action={
          <button
            onClick={() => setView("add")}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus size={16} />
            Add Expense
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {["All", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={clsx(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              activeCategory === cat ? "bg-brand-600 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-sm text-slate-400">Loading expenses…</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">No expenses recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Payment Mode</th>
                  <th className="px-5 py-3 font-medium">Bill</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((e) => (
                  <tr key={e.id}>
                    <td className="px-5 py-3 text-slate-500">
                      {new Date(e.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800">{e.description}</td>
                    <td className="px-5 py-3">
                      <span className={clsx("badge", categoryColors[e.category])}>{e.category}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{e.paymentMode}</td>
                    <td className="px-5 py-3">
                      {e.hasBill ? (
                        e.billUrl ? (
                          <a
                            href={e.billUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                          >
                            <Paperclip size={12} /> Attached
                          </a>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-medium text-brand-600">
                            <Paperclip size={12} /> Attached
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-slate-300">No bill</span>
                      )}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800">₹{e.amount.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => handleDelete(e.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-danger-50 hover:text-danger-600">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
