import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Paperclip,
  Trash2,
  Upload,
  X,
  ChevronLeft,
  CircleDollarSign,
  ShoppingCart,
  Calendar,
  Pencil,
} from "lucide-react";
import clsx from "clsx";
import { Toast, useToast } from "@/components/Toast";
import { fetchExpenses, createExpense, updateExpense, deleteExpense, ApiError, type Expense, type ExpenseCategory } from "@/lib/api";

const categories: ExpenseCategory[] = ["Raw Materials", "Fuel", "Payroll", "Utilities", "Operations", "Maintenance", "Other"];
const paymentModes = ["Cash", "UPI", "Card", "Online", "Bank Transfer"] as const;

const categoryColors: Record<string, string> = {
  "Raw Materials": "bg-[#EFF6FF] text-[#155DFC]",
  Fuel: "bg-[#FFF7ED] text-[#FE9A00]",
  Payroll: "bg-[#F5F3FF] text-[#7C3AED]",
  Utilities: "bg-[#ECFEFF] text-[#0891B2]",
  Operations: "bg-slate-100 text-slate-600",
  Maintenance: "bg-[#FFF7ED] text-[#FE9A00]",
  Other: "bg-slate-100 text-slate-600",
};

const KPI_CARDS = [
  { key: "month", labelSuffix: "Total", icon: CircleDollarSign, color: "#DC2626", bg: "#FDF2F8" },
  { key: "raw", label: "Raw Materials", icon: ShoppingCart, color: "#155DFC", bg: "#EFF6FF" },
  { key: "bills", label: "Bills Attached", icon: Paperclip, color: "#009966", bg: "#ECFDF5" },
  { key: "today", label: "Today", icon: Calendar, color: "#FE9A00", bg: "#FFF7ED" },
] as const;

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
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const monthExpenses = useMemo(() => expenses.filter((e) => isThisMonth(e.createdAt)), [expenses]);
  const filtered = activeCategory === "All" ? expenses : expenses.filter((e) => e.category === activeCategory);

  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const rawMaterialsTotal = monthExpenses.filter((e) => e.category === "Raw Materials").reduce((s, e) => s + e.amount, 0);
  const billsAttached = monthExpenses.filter((e) => e.hasBill).length;
  const todayTotal = expenses.filter((e) => isToday(e.createdAt)).reduce((s, e) => s + e.amount, 0);
  const todayEntries = expenses.filter((e) => isToday(e.createdAt)).length;
  const monthName = new Date().toLocaleDateString("en-US", { month: "long" });

  const kpiValues: Record<(typeof KPI_CARDS)[number]["key"], { value: string; hint: string }> = {
    month: { value: `₹${monthTotal.toLocaleString()}`, hint: `${monthExpenses.length} entries` },
    raw: { value: `₹${rawMaterialsTotal.toLocaleString()}`, hint: "Largest category" },
    bills: { value: `${billsAttached}`, hint: "Verified entries" },
    today: { value: `₹${todayTotal.toLocaleString()}`, hint: `${todayEntries} entries` },
  };

  function handleFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, billUrl: reader.result as string, billName: file.name }));
    reader.readAsDataURL(file);
  }

  function startEdit(expense: Expense) {
    setEditingId(expense.id);
    setForm({
      date: new Date(expense.createdAt).toISOString().slice(0, 10),
      description: expense.description,
      category: expense.category,
      amount: String(expense.amount),
      paymentMode: expense.paymentMode as (typeof paymentModes)[number],
      billUrl: expense.billUrl ?? "",
      billName: expense.hasBill ? "Bill attached" : "",
    });
    setView("add");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const createdAt = form.date ? new Date(`${form.date}T12:00`).toISOString() : undefined;
      const payload = {
        description: form.description,
        category: form.category,
        paymentMode: form.paymentMode,
        amount: Number(form.amount),
        hasBill: !!form.billUrl,
        billUrl: form.billUrl,
        createdAt,
      };

      if (editingId) {
        const res = await updateExpense(editingId, payload);
        setExpenses((prev) => prev.map((e) => (e.id === editingId ? res.expense : e)));
        showToast("success", "Expense updated successfully");
      } else {
        const res = await createExpense(payload);
        setExpenses((prev) => [res.expense, ...prev]);
        showToast("success", "Expense saved successfully");
      }
      setForm(emptyForm);
      setEditingId(null);
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
      <div className="space-y-4">
        <Toast toast={toast} />
        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => { setForm(emptyForm); setEditingId(null); setView("list"); }}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
          >
            All Expenses
          </button>
          <button className="rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-semibold text-white">{editingId ? "Edit Expense" : "Add Expense"}</button>
        </div>

        <button
          onClick={() => { setForm(emptyForm); setEditingId(null); setView("list"); }}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ChevronLeft size={16} />
          Back to list
        </button>

        <div className="w-full max-w-2xl rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Add Daily Expense</h3>
          <p className="mb-5 text-xs text-slate-400">Record an expense and optionally attach a bill image</p>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date">
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className={inputClass}
                />
              </Field>
              <Field label="Category">
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))}
                  className={inputClass}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Description">
              <input
                type="text"
                required
                placeholder="e.g. Vegetables Purchase"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount (₹)">
                <input
                  type="number"
                  required
                  min={0}
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className={inputClass}
                />
              </Field>
              <Field label="Payment Mode">
                <select
                  value={form.paymentMode}
                  onChange={(e) => setForm((f) => ({ ...f, paymentMode: e.target.value as (typeof paymentModes)[number] }))}
                  className={inputClass}
                >
                  {paymentModes.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Attach Bill (Optional)">
              <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
              {form.billUrl ? (
                <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm text-slate-600">
                    <Paperclip size={14} className="text-[#009966]" />
                    {form.billName || "Bill attached"}
                  </span>
                  <button type="button" onClick={() => setForm((f) => ({ ...f, billUrl: "", billName: "" }))} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-8 text-slate-400 hover:border-[#155DFC] hover:text-[#155DFC]"
                >
                  <Upload size={22} />
                  <span className="text-sm">Click to upload bill image or PDF</span>
                </button>
              )}
            </Field>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setForm(emptyForm); setEditingId(null); setView("list"); }} className="h-8 rounded-2xl border border-slate-200 px-5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="h-8 rounded-2xl bg-[#155dfc] px-5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
                {submitting ? "Saving…" : editingId ? "Update Expense" : "Save Expense"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Toast toast={toast} />

      <div className="inline-flex rounded-xl bg-slate-100 p-1">
        <button className="rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-semibold text-white">All Expenses</button>
        <button onClick={() => { setForm(emptyForm); setEditingId(null); setView("add"); }} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700">
          Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_CARDS.map((card) => {
          const Icon = card.icon;
          const label = card.key === "month" ? `${monthName} Total` : card.label;
          const { value, hint } = kpiValues[card.key];
          return (
            <div key={card.key} className="rounded-2xl border border-slate-100 p-5 shadow-sm" style={{ backgroundColor: card.bg }}>
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-slate-600">{label}</p>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80" style={{ color: card.color }}>
                  <Icon size={18} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
              <p className="mt-1 text-xs text-slate-500">{hint}</p>
            </div>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-wrap gap-2 border-b border-slate-100 px-5 py-4">
          {["All", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={clsx(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                activeCategory === cat ? "bg-[#155dfc] text-white" : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50",
              )}
            >
              {cat}
            </button>
          ))}
        </div>

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
                  <th className="px-5 py-3 font-medium">Mode</th>
                  <th className="px-5 py-3 font-medium">Bill</th>
                  <th className="px-5 py-3 font-medium text-right">Amount</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(e.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{e.description}</td>
                    <td className="px-5 py-3.5">
                      <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-semibold", categoryColors[e.category])}>
                        {e.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{e.paymentMode}</td>
                    <td className="px-5 py-3.5">
                      {e.hasBill ? (
                        e.billUrl ? (
                          <a href={e.billUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#009966] hover:underline">
                            <Paperclip size={12} /> Attached
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#009966]">
                            <Paperclip size={12} /> Attached
                          </span>
                        )
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-800">₹{e.amount.toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => startEdit(e)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(e.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
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

const inputClass =
  "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#155DFC] focus:ring-2 focus:ring-[#EFF6FF]";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}
