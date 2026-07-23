import { useEffect, useMemo, useState } from "react";
import { Plus, Search, ChevronRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import Modal from "@/components/Modal";
import { fetchCustomers, createCustomer, type Customer } from "@/lib/api";

const emptyForm = { name: "", phone: "" };

function isThisMonth(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
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
      setShowForm(false);
      setForm(emptyForm);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard data={{ label: "Total Customers", value: `${customers.length}`, icon: "Users", accent: "brand" }} />
        <StatCard data={{ label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: "TrendingUp", accent: "success" }} />
        <StatCard data={{ label: "Avg. Visits", value: `${avgVisits}`, icon: "RotateCcw", accent: "warning" }} />
        <StatCard data={{ label: "New This Month", value: `${newThisMonth}`, icon: "UserPlus", accent: "danger" }} />
      </div>

      <PageHeader
        title="Customer Management"
        subtitle="Customer profiles and order history"
        action={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus size={16} />
            Add Customer
          </button>
        }
      />

      <div className="relative mb-4 max-w-sm">
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
                  <th className="px-5 py-3 font-medium">Total Visits</th>
                  <th className="px-5 py-3 font-medium">Total Spent</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((c) => (
                  <tr key={c.id}>
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

      {showForm && (
        <Modal title="Add Customer" onClose={() => setShowForm(false)}>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Name</label>
              <input
                type="text"
                required
                placeholder="Customer name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone</label>
              <input
                type="text"
                required
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {submitting ? "Adding…" : "Add Customer"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
