import { useEffect, useState } from "react";
import clsx from "clsx";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Download, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { fetchAccounting, accountingAction, type AccountingData } from "@/lib/api";

type Tab = "pl" | "gst" | "integrations";

export default function Accounting() {
  const [tab, setTab] = useState<Tab>("pl");
  const [data, setData] = useState<AccountingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetchAccounting()
      .then(setData)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleFileGst(period: string) {
    setActing(`gst-${period}`);
    try {
      const res = await accountingAction({ action: "fileGst", period });
      setData(res);
    } finally {
      setActing(null);
    }
  }

  async function handleIntegration(id: string, connected: boolean) {
    setActing(id);
    try {
      const res = connected
        ? await accountingAction({ action: "syncIntegration", integrationId: id as "tally" | "quickbooks" | "zoho" | "bank" })
        : await accountingAction({ action: "toggleIntegration", integrationId: id as "tally" | "quickbooks" | "zoho" | "bank" });
      setData(res);
    } finally {
      setActing(null);
    }
  }

  if (loading || !data) {
    return <p className="py-20 text-center text-sm text-slate-400">Loading accounting…</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Accounting" subtitle="P&L, GST filing and integrations" />

      <div className="inline-flex rounded-xl bg-slate-100 p-1">
        {(
          [
            ["pl", "P&L Summary"],
            ["gst", "GST Filing"],
            ["integrations", "Integrations"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={clsx(
              "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              tab === key ? "bg-brand-600 text-white" : "text-slate-500 hover:text-slate-700",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "pl" && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="card p-5">
              <p className="text-sm text-slate-500">Revenue (Dec)</p>
              <p className="text-2xl font-bold text-slate-900">₹{data.pl.revenue.toLocaleString()}</p>
              <p className={clsx("mt-1 text-xs font-medium", data.pl.revenueChange >= 0 ? "text-emerald-600" : "text-red-600")}>
                {data.pl.revenueChange >= 0 ? "+" : ""}{data.pl.revenueChange}% vs Nov
              </p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-slate-500">Expenses (Dec)</p>
              <p className="text-2xl font-bold text-slate-900">₹{data.pl.expenses.toLocaleString()}</p>
              <p className={clsx("mt-1 text-xs font-medium", data.pl.expenseChange >= 0 ? "text-red-600" : "text-emerald-600")}>
                {data.pl.expenseChange >= 0 ? "+" : ""}{data.pl.expenseChange}% vs Nov
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-600 p-5 text-white">
              <p className="text-sm text-emerald-100">Net Profit (Dec)</p>
              <p className="text-2xl font-bold">₹{data.pl.netProfit.toLocaleString()}</p>
              <p className="mt-1 text-xs text-emerald-100">{data.pl.margin}% margin</p>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-slate-900">6-Month P&L Trend</h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.pl.trend}>
                <defs>
                  <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f4" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />
                <Area type="monotone" dataKey="profit" stroke="#ef4444" strokeWidth={2} fill="url(#profitFill)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Month</th>
                  <th className="px-5 py-3 font-medium">Revenue</th>
                  <th className="px-5 py-3 font-medium">Expenses</th>
                  <th className="px-5 py-3 font-medium">Profit</th>
                  <th className="px-5 py-3 font-medium">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.pl.monthly.map((m) => (
                  <tr key={m.month}>
                    <td className="px-5 py-3 font-medium text-slate-800">{m.month}</td>
                    <td className="px-5 py-3 text-slate-600">₹{m.revenue.toLocaleString()}</td>
                    <td className="px-5 py-3 text-slate-600">₹{m.expenses.toLocaleString()}</td>
                    <td className="px-5 py-3 font-medium text-emerald-600">₹{m.profit.toLocaleString()}</td>
                    <td className="px-5 py-3 text-slate-600">{m.margin}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "gst" && (
        <>
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800">{data.gst.dueMessage}</p>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Period</th>
                  <th className="px-5 py-3 font-medium">Total Sales</th>
                  <th className="px-5 py-3 font-medium">Taxable</th>
                  <th className="px-5 py-3 font-medium">CGST</th>
                  <th className="px-5 py-3 font-medium">SGST</th>
                  <th className="px-5 py-3 font-medium">Total GST</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.gst.periods.map((p) => (
                  <tr key={p.period}>
                    <td className="px-5 py-3 font-medium text-slate-800">{p.period}</td>
                    <td className="px-5 py-3 text-slate-600">₹{p.totalSales.toLocaleString()}</td>
                    <td className="px-5 py-3 text-slate-600">₹{p.taxable.toLocaleString()}</td>
                    <td className="px-5 py-3 text-slate-600">₹{p.cgst.toLocaleString()}</td>
                    <td className="px-5 py-3 text-slate-600">₹{p.sgst.toLocaleString()}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">₹{p.totalGst.toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-semibold", p.status === "Filed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {p.status === "Pending" ? (
                        <button
                          disabled={acting === `gst-${p.period}`}
                          onClick={() => handleFileGst(p.period)}
                          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                        >
                          {acting === `gst-${p.period}` ? "Filing…" : "File Now"}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const csv = `Period,Total Sales,Taxable,CGST,SGST,Total GST,Status\n${p.period},${p.totalSales},${p.taxable},${p.cgst},${p.sgst},${p.totalGst},${p.status}`;
                            const blob = new Blob([csv], { type: "text/csv" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `gst-${p.period.replace(" ", "-")}.csv`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-brand-600"
                        >
                          <Download size={12} /> Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "integrations" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {data.integrations.map((int) => (
            <div key={int.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-lg font-bold text-brand-600">{int.icon}</div>
                  <div>
                    <p className="font-bold text-slate-900">{int.name}</p>
                    <p className="text-xs text-slate-400">{int.connected ? "Connected" : "Not connected"}</p>
                  </div>
                </div>
                <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-semibold", int.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
                  {int.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-500">{int.description}</p>
              <div className="mt-4 flex items-center gap-3">
                <button
                  disabled={acting === int.id}
                  onClick={() => handleIntegration(int.id, int.connected)}
                  className={clsx("flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60", int.connected ? "bg-slate-900 hover:bg-slate-800" : "bg-brand-600 hover:bg-brand-700")}
                >
                  {acting === int.id ? "Working…" : int.connected ? "Sync Now" : "Connect"}
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(int, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${int.id}-export.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
                >
                  <Download size={14} /> Export
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
