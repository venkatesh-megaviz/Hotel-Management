import { useEffect, useMemo, useState } from "react";
import { Search, ChevronRight, ChevronLeft } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { fetchCustomers, createCustomer, type Customer } from "@/lib/api";

type View = "list" | "add";

const emptyForm = { name: "", phone: "", email: "", address: "", notes: "" };

function isThisMonth(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<View>("list");
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    fetchCustomers()
      .then((res) => setCustomers(res.customers))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const filtered = customers.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search),
  );

  const totalRevenue = useMemo(() => customers.reduce((s, c) => s + c.totalSpent, 0), [customers]);
  const avgVisits = useMemo(
    () => (customers.length ? Math.round(customers.reduce((s, c) => s + c.totalVisits, 0) / customers.length) : 0),
    [customers],
  );
  const newThisMonth = useMemo(() => customers.filter((c) => isThisMonth(c.createdAt)).length, [customers]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await createCustomer(form);
      setCustomers((prev) => [res.customer, ...prev]);
      setView("list");
      setForm(emptyForm);
    } finally {
      setSubmitting(false);
    }
  }

  if (view === "add") {
    return (
      <div className="space-y-6">
        <PageHeader title="Customer Management" subtitle="Customer profiles and order history" />
        <button
          onClick={() => setView("list")}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ChevronLeft size={16} />
          Back to list
        </button>

        <div className="card max-w-xl p-6">
          <h3 className="text-base font-semibold text-slate-900">Add New Customer</h3>
          <p className="mb-5 text-xs text-slate-400">Create a customer profile to track visits and orders</p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Full Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="e.g. Aryan Kapoor" />
              <Field label="Phone Number" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="10-digit mobile number" />
            </div>
            <Field label="Email Address (optional)" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="customer@email.com" type="email" required={false} />
            <Field label="Address (optional)" value={form.address} onChange={(v) => setForm((f) => ({ ...f, address: v }))} placeholder="Home or office address" required={false} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Notes (optional)</label>
              <textarea
                placeholder="Any preferences or special notes..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setView("list")} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
                {submitting ? "Adding…" : "Add Customer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard data={{ label: "Total Customers", value: `${customers.length}`, helpText: "All time", icon: "Users", accent: "brand" }} />
        <StatCard data={{ label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, helpText: "All customers", icon: "TrendingUp", accent: "success" }} />
        <StatCard data={{ label: "Avg. Visits", value: `${avgVisits}`, helpText: "Per customer", icon: "RotateCcw", accent: "warning" }} />
        <StatCard data={{ label: "New This Month", value: `${newThisMonth}`, helpText: "Since 1st", icon: "UserPlus", accent: "danger" }} />
      </div>

      <PageHeader title="Customer Management" subtitle="Customer profiles and order history" />

      <div className="inline-flex rounded-xl bg-slate-100 p-1">
        <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white">All Customers</button>
        <button
          onClick={() => setView("add")}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
        >
          Add Customer
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-sm text-slate-400">Loading customers…</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">No customers yet. Add your first customer.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Phone</th>
                  <th className="px-5 py-3 font-medium">Visits</th>
                  <th className="px-5 py-3 font-medium">Total Spent</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                          {c.name[0]}
                        </div>
                        <span className="font-medium text-slate-800">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{c.phone}</td>
                    <td className="px-5 py-3 text-slate-600">{c.totalVisits}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">₹{c.totalSpent.toLocaleString()}</td>
                    <td className="px-5 py-3 text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-300">
                      <ChevronRight size={16} />
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

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );
}
