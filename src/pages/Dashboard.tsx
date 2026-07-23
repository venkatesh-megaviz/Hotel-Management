import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { fetchDashboard, type DashboardData } from "@/lib/api";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.round(diffMs / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-sm text-slate-400">Loading dashboard…</div>;
  }

  if (!data) {
    return <div className="py-20 text-center text-sm text-slate-400">Couldn't load dashboard data.</div>;
  }

  const weekStart = data.weeklyRevenue.length ? new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard data={{ label: "Today's Revenue", value: `₹${data.todayRevenue.toLocaleString()}`, icon: "TrendingUp", accent: "success" }} />
        <StatCard data={{ label: "Today's Orders", value: `${data.todayOrdersCount}`, icon: "ShoppingCart", accent: "brand" }} />
        <StatCard data={{ label: "Stock Alerts", value: `${data.stockAlerts} items`, icon: "AlertTriangle", accent: "warning" }} />
        <StatCard data={{ label: "Today's Expenses", value: `₹${data.todayExpenseTotal.toLocaleString()}`, icon: "CircleDollarSign", accent: "danger" }} />
      </div>

      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Weekly Revenue</h3>
            <p className="text-xs text-slate-400">
              {weekStart ? weekStart.toLocaleDateString("en-US", { day: "numeric", month: "short" }) : ""} –{" "}
              {new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2 w-2 rounded-full bg-brand-600" /> Revenue
            </span>
            <button className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-600">
              <Download size={14} />
              Export
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.weeklyRevenue}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f4" />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(1)}k`} />
            <Tooltip
              cursor={{ fill: "#f8fafc" }}
              formatter={(value) => [`₹${Number(value).toLocaleString()}`, "Revenue"]}
              contentStyle={{ borderRadius: 12, border: "1px solid #eef0f4", fontSize: 13 }}
            />
            <Bar dataKey="revenue" fill="#3b5bdb" radius={[6, 6, 0, 0]} maxBarSize={44} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Recent Bills</h3>
            <Link to="/billing" className="text-sm font-medium text-brand-600 hover:underline">
              New Bill
            </Link>
          </div>
          {data.recentBills.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No bills yet today.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {data.recentBills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-slate-800">#{bill.billNo}</p>
                    <p className="text-xs text-slate-400">
                      {bill.tableOrNo || bill.customerName} · {timeAgo(bill.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-800">₹{bill.total.toLocaleString()}</span>
                    <StatusBadge status={bill.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Today's Expenses</h3>
            <Link to="/expenses" className="text-sm font-medium text-brand-600 hover:underline">
              Add Expense
            </Link>
          </div>
          {data.todayExpensesList.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No expenses recorded today.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {data.todayExpensesList.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-3">
                  <p className="text-sm text-slate-700">{e.description}</p>
                  <span className="font-medium text-danger-600">₹{e.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-3">
                <p className="font-semibold text-slate-900">Total Today</p>
                <span className="font-bold text-slate-900">₹{data.todayExpenseTotal.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
