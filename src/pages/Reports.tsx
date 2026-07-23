import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import clsx from "clsx";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { fetchReports, type ReportsData } from "@/lib/api";

const ranges = ["Daily", "Weekly", "Monthly"] as const;
const COLORS = ["#3b5bdb", "#10b981", "#ea580c", "#dc2626", "#8b5cf6", "#0891b2", "#64748b"];

export default function Reports() {
  const [range, setRange] = useState<(typeof ranges)[number]>("Weekly");
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchReports(range)
      .then(setData)
      .finally(() => setLoading(false));
  }, [range]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Daily, weekly, monthly — sales, inventory & expenses"
        action={
          <div className="flex items-center gap-3">
            <div className="flex rounded-xl bg-white p-1 ring-1 ring-slate-200">
              {ranges.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={clsx(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    range === r ? "bg-brand-600 text-white" : "text-slate-500 hover:bg-slate-50",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
              <Download size={16} />
              Export
            </button>
          </div>
        }
      />

      {loading || !data ? (
        <p className="py-20 text-center text-sm text-slate-400">Loading reports…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              data={{
                label: "Revenue",
                value: `₹${data.revenue.toLocaleString()}`,
                change: data.revenueChange ? `${data.revenueChange > 0 ? "+" : ""}${data.revenueChange}%` : undefined,
                changeType: data.revenueChange >= 0 ? "up" : "down",
                helpText: "vs last period",
                icon: "TrendingUp",
                accent: "success",
              }}
            />
            <StatCard
              data={{
                label: "Orders",
                value: `${data.orders}`,
                change: data.orderChange ? `${data.orderChange > 0 ? "+" : ""}${data.orderChange}%` : undefined,
                changeType: data.orderChange >= 0 ? "up" : "down",
                icon: "ShoppingCart",
                accent: "brand",
              }}
            />
            <StatCard
              data={{ label: "Expenses", value: `₹${data.expenses.toLocaleString()}`, helpText: `${data.expenseEntries} entries`, icon: "CircleDollarSign", accent: "danger" }}
            />
            <StatCard data={{ label: "Avg. Bill", value: `₹${Math.round(data.avgBill)}`, icon: "Receipt", accent: "warning" }} />
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-slate-900">Sales Report</h3>
            <p className="mb-4 text-xs text-slate-400">{range} revenue breakdown</p>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.salesTrend}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b5bdb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b5bdb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f4" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, "Revenue"]} contentStyle={{ borderRadius: 12, border: "1px solid #eef0f4" }} />
                <Area type="monotone" dataKey="revenue" stroke="#3b5bdb" strokeWidth={2.5} fill="url(#salesFill)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="card p-5">
              <h3 className="mb-4 font-semibold text-slate-900">Inventory Report — Stock In ({range})</h3>
              {data.stockInEntries.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">No stock received in this period.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-slate-400">
                      <th className="pb-3 font-medium">Item</th>
                      <th className="pb-3 font-medium">Qty Received</th>
                      <th className="pb-3 font-medium">Purchase Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.stockInEntries.map((s) => (
                      <tr key={s.id}>
                        <td className="py-3 font-medium text-slate-800">{s.item}</td>
                        <td className="py-3 font-semibold text-brand-600">
                          +{s.quantity} {s.unit}
                        </td>
                        <td className="py-3 text-slate-600">₹{s.cost.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="card p-5">
              <h3 className="mb-4 font-semibold text-slate-900">Expense Report — By Category</h3>
              {data.expenseByCategory.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">No expenses in this period.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={data.expenseByCategory} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3} isAnimationActive={false}>
                      {data.expenseByCategory.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
