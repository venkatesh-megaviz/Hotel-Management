import { useEffect, useState } from "react";
import clsx from "clsx";
import { AlertTriangle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { Toast, useToast } from "@/components/Toast";
import { fetchOrders, updateOrderStatus, createOrder, ApiError, type Order } from "@/lib/api";

const historyFilters = ["All", "Paid", "Pending", "Refunded"] as const;
const tabs = ["History", "Record Payment", "Pending"] as const;

const modeColor: Record<string, string> = {
  Cash: "text-success-600",
  UPI: "text-purple-600",
  Card: "text-pink-600",
};

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

const emptyForm = {
  billNumber: "",
  date: new Date().toISOString().slice(0, 10),
  customerTable: "",
  time: "",
  amount: "",
  mode: "Cash" as Order["mode"],
  notes: "",
};

export default function Payments() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("History");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyFilter, setHistoryFilter] = useState<(typeof historyFilters)[number]>("All");
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const { toast, showToast } = useToast();

  function load() {
    setLoading(true);
    fetchOrders()
      .then((res) => setOrders(res.orders))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const filtered = historyFilter === "All" ? orders : orders.filter((o) => o.status === historyFilter);

  const collectedToday = orders.filter((o) => o.status === "Paid" && isToday(o.createdAt)).reduce((s, o) => s + o.total, 0);
  const collectedTodayCount = orders.filter((o) => o.status === "Paid" && isToday(o.createdAt)).length;
  const pendingOrders = orders.filter((o) => o.status === "Pending");
  const pendingTotal = pendingOrders.reduce((s, o) => s + o.total, 0);
  const refundedToday = orders.filter((o) => o.status === "Refunded" && isToday(o.createdAt)).reduce((s, o) => s + o.total, 0);
  const totalTransactionsToday = orders.filter((o) => isToday(o.createdAt)).length;

  async function setStatus(id: string, status: Order["status"]) {
    const res = await updateOrderStatus(id, status);
    setOrders((prev) => prev.map((o) => (o.id === id ? res.order : o)));
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const amount = Number(form.amount) || 0;
      const createdAt = form.date ? new Date(`${form.date}T${form.time || "12:00"}`).toISOString() : undefined;
      const res = await createOrder({
        tableOrNo: form.billNumber,
        customerName: form.customerTable || "Walk-in",
        items: [{ name: form.notes || "Manual Entry", price: amount, gst: 0, qty: 1 }],
        mode: form.mode,
        status: "Paid",
        notes: form.notes,
        createdAt,
      });
      setOrders((prev) => [res.order, ...prev]);
      showToast("success", "Payment recorded successfully");
      setForm(emptyForm);
      setTab("History");
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.message : "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Toast toast={toast} />
      <PageHeader title="Payment Management" subtitle="History, pending dues, refunds" />

      <div className="mb-6 inline-flex rounded-xl bg-slate-100 p-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              tab === t ? "bg-brand-600 text-white" : "text-slate-500 hover:text-slate-700",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "History" && (
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            data={{ label: "Collected Today", value: `₹${collectedToday.toLocaleString()}`, helpText: `${collectedTodayCount} transactions`, icon: "Landmark", accent: "success" }}
          />
          <StatCard data={{ label: "Pending", value: `₹${pendingTotal.toLocaleString()}`, helpText: `${pendingOrders.length} bills`, icon: "AlertTriangle", accent: "warning" }} />
          <StatCard data={{ label: "Refunded", value: `₹${refundedToday.toLocaleString()}`, helpText: "Today", icon: "RotateCcw", accent: "danger" }} />
          <StatCard data={{ label: "Total Transactions", value: `${totalTransactionsToday}`, helpText: "Today", icon: "Hash", accent: "brand" }} />
        </div>
      )}

      {tab === "History" && (
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Payment History</h3>
            <div className="flex items-center gap-2">
              {historyFilters.map((f) => (
                <button
                  key={f}
                  onClick={() => setHistoryFilter(f)}
                  className={clsx(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    historyFilter === f ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-slate-400">Loading payments…</p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No transactions found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-3 pr-4 font-medium">Bill</th>
                    <th className="pb-3 pr-4 font-medium">Date &amp; Time</th>
                    <th className="pb-3 pr-4 font-medium">Customer</th>
                    <th className="pb-3 pr-4 font-medium">Amount</th>
                    <th className="pb-3 pr-4 font-medium">Mode</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((o) => (
                    <tr key={o.id}>
                      <td className="py-3 pr-4 font-medium text-slate-800">#{o.billNo}</td>
                      <td className="py-3 pr-4 text-slate-500">
                        {new Date(o.createdAt).toLocaleString("en-US", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{o.tableOrNo || o.customerName}</td>
                      <td className="py-3 pr-4 font-medium text-slate-800">₹{o.total.toLocaleString()}</td>
                      <td className={clsx("py-3 pr-4 font-medium", modeColor[o.mode])}>{o.mode}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="py-3 text-right">
                        {o.status === "Paid" && (
                          <button onClick={() => setStatus(o.id, "Refunded")} className="text-xs font-medium text-danger-600 hover:underline">
                            Refund
                          </button>
                        )}
                        {o.status === "Pending" && (
                          <button onClick={() => setStatus(o.id, "Paid")} className="text-xs font-medium text-brand-600 hover:underline">
                            Mark Paid
                          </button>
                        )}
                        {o.status === "Refunded" && <span className="text-xs text-slate-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "Record Payment" && (
        <div className="card max-w-xl p-6">
          <h3 className="text-base font-semibold text-slate-900">Record a Payment</h3>
          <p className="mb-5 text-xs text-slate-400">Manually record a cash, UPI, or card payment</p>

          <form className="space-y-4" onSubmit={handleRecordPayment}>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Bill Number" placeholder="e.g. #1094" value={form.billNumber} onChange={(v) => setForm((f) => ({ ...f, billNumber: v }))} required={false} />
              <Field label="Date" type="date" value={form.date} onChange={(v) => setForm((f) => ({ ...f, date: v }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Customer / Table"
                placeholder="Name or table number"
                value={form.customerTable}
                onChange={(v) => setForm((f) => ({ ...f, customerTable: v }))}
                required={false}
              />
              <Field label="Time (optional)" type="time" value={form.time} onChange={(v) => setForm((f) => ({ ...f, time: v }))} required={false} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount (₹)" type="number" placeholder="0" value={form.amount} onChange={(v) => setForm((f) => ({ ...f, amount: v }))} />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Payment Mode</label>
                <select
                  value={form.mode}
                  onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value as Order["mode"] }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                </select>
              </div>
            </div>
            <Field
              label="Notes (optional)"
              placeholder="Any additional notes..."
              value={form.notes}
              onChange={(v) => setForm((f) => ({ ...f, notes: v }))}
              required={false}
            />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setForm(emptyForm)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {submitting ? "Recording…" : "Record Payment"}
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === "Pending" && (
        <div>
          <div className="mb-4 flex items-start gap-3 rounded-xl bg-warning-50 p-4">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning-600" />
            <div>
              <p className="text-sm font-semibold text-warning-700">Outstanding Payments</p>
              <p className="text-xs text-warning-600/80">Collect payment for these open bills.</p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 p-5">
              <h3 className="font-semibold text-slate-900">Pending Bills — ₹{pendingTotal.toLocaleString()}</h3>
            </div>
            {loading ? (
              <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
            ) : pendingOrders.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No pending payments. You're all caught up!</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {pendingOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between p-5">
                    <div>
                      <p className="flex items-center gap-2 font-medium text-slate-800">
                        #{o.billNo}
                        <span className={clsx("badge bg-slate-100", modeColor[o.mode])}>{o.mode}</span>
                      </p>
                      <p className="text-xs text-slate-400">
                        {o.tableOrNo || o.customerName} ·{" "}
                        {new Date(o.createdAt).toLocaleString("en-US", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-800">₹{o.total.toLocaleString()}</span>
                      <button
                        onClick={() => setStatus(o.id, "Paid")}
                        className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                      >
                        Collect Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
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
  placeholder?: string;
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
