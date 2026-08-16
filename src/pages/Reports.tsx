import { useEffect, useState } from "react";
import { Download, AlertTriangle } from "lucide-react";
import clsx from "clsx";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend, BarChart, Bar } from "recharts";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { fetchReports, type ReportsData } from "@/lib/api";

const ranges = ["Daily", "Weekly", "Monthly"] as const;
const tabs = ["sales", "top-items", "customers", "inventory", "gst", "staff"] as const;
type Tab = (typeof tabs)[number];
const TAB_LABELS: Record<Tab, string> = {
  sales: "Sales",
  "top-items": "Top Items",
  customers: "Customers",
  inventory: "Inventory",
  gst: "GST Report",
  staff: "Staff",
};
const COLORS = ["#3b5bdb", "#10b981", "#ea580c", "#dc2626", "#8b5cf6", "#0891b2"];

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportReportsCsv(data: ReportsData, tab: Tab, range: string) {
  const filename = `hotellite-${tab}-${range.toLowerCase()}.csv`;
  if (tab === "sales") {
    downloadCsv(filename, [
      ["Metric", "Value"],
      ["Range", range],
      ["Revenue", data.revenue],
      ["Orders", data.orders],
      ["Expenses", data.expenses],
      ["Avg Bill", data.avgBill],
      ...data.salesTrend.map((d) => [d.label, d.revenue]),
    ]);
    return;
  }
  if (tab === "top-items" && data.topItems) {
    downloadCsv(filename, [["Item", "Category", "Orders", "Revenue", "Popularity"], ...data.topItems.map((i) => [i.name, i.category, i.orders, i.revenue, i.popularity ?? ""])]);
    return;
  }
  if (tab === "customers" && data.customersReport) {
    downloadCsv(filename, [["Name", "Phone", "Visits", "Total Spent", "Avg Order", "Last Order"], ...data.customersReport.map((c) => [c.name, c.phone, c.visits, c.totalSpent, c.avgOrder, c.lastOrder])]);
    return;
  }
  if (tab === "inventory" && data.inventoryReport) {
    downloadCsv(filename, [["Item", "Stock", "Unit", "Status"], ...data.inventoryReport.map((i) => [i.name, i.stock, i.unit, i.status])]);
    return;
  }
  if (tab === "gst" && data.gstReport) {
    downloadCsv(filename, [["Period", "Total Sales", "Taxable", "CGST", "SGST", "Total GST", "Status"], ...data.gstReport.map((g) => [g.period, g.totalSales, g.taxableValue, g.cgst, g.sgst, g.totalGst, g.status])]);
    return;
  }
  if (tab === "staff" && data.staffReport) {
    downloadCsv(filename, [["Name", "Role", "Shift", "Status", "Check In", "Duty"], ...data.staffReport.map((s) => [s.name, s.role, s.shift, s.status, s.checkIn, s.dutyStatus])]);
  }
}

const statusColors: Record<string, string> = {
  OK: "bg-emerald-50 text-emerald-700",
  Low: "bg-amber-50 text-amber-700",
  Critical: "bg-red-50 text-red-700",
};

export default function Reports() {
  const [range, setRange] = useState<(typeof ranges)[number]>("Weekly");
  const [tab, setTab] = useState<Tab>("sales");
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchReports(range, tab)
      .then(setData)
      .finally(() => setLoading(false));
  }, [range, tab]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Comprehensive analytics across all modules"
        action={
          <div className="flex items-center gap-3">
            {tab === "sales" && (
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
            )}
            <button
              disabled={!data}
              onClick={() => data && exportReportsCsv(data, tab, range)}
              className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              tab === t ? "bg-brand-600 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50",
            )}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {loading || !data ? (
        <p className="py-20 text-center text-sm text-slate-400">Loading reports…</p>
      ) : (
        <>
          {tab === "sales" && <SalesTab data={data} />}
          {tab === "top-items" && data.topItemsSummary && data.topItems && <TopItemsTab data={data} />}
          {tab === "customers" && data.customersSummary && data.customersReport && <CustomersTab data={data} />}
          {tab === "inventory" && data.inventorySummary && data.inventoryReport && <InventoryTab data={data} />}
          {tab === "gst" && data.gstSummary && data.gstReport && <GstTab data={data} />}
          {tab === "staff" && data.staffSummary && data.staffReport && <StaffTab data={data} />}
        </>
      )}
    </div>
  );
}

function SalesTab({ data }: { data: ReportsData }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard data={{ label: "Revenue", value: `₹${data.revenue.toLocaleString()}`, change: `${data.revenueChange > 0 ? "+" : ""}${data.revenueChange}%`, changeType: data.revenueChange >= 0 ? "up" : "down", helpText: "vs last week", icon: "TrendingUp", accent: "brand" }} />
        <StatCard data={{ label: "Orders", value: `${data.orders}`, change: `${data.orderChange > 0 ? "+" : ""}${data.orderChange}%`, changeType: data.orderChange >= 0 ? "up" : "down", icon: "ShoppingCart", accent: "success" }} />
        <StatCard data={{ label: "Expenses", value: `₹${data.expenses.toLocaleString()}`, helpText: `${data.expenseEntries} entries`, icon: "CircleDollarSign", accent: "danger" }} />
        <StatCard data={{ label: "Avg. Bill", value: `₹${Math.round(data.avgBill)}`, icon: "Receipt", accent: "warning" }} />
      </div>
      <div className="card p-5">
        <h3 className="font-semibold text-slate-900">Revenue Trend</h3>
        <p className="mb-4 text-xs text-slate-400">Weekly revenue</p>
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
            <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString()}`, "Revenue"]} />
            <Area type="monotone" dataKey="revenue" stroke="#3b5bdb" strokeWidth={2.5} fill="url(#salesFill)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="card p-5">
        <h3 className="mb-4 font-semibold text-slate-900">Expense Breakdown</h3>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={data.expenseByCategory} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3} isAnimationActive={false}>
              {data.expenseByCategory.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

function TopItemsTab({ data }: { data: ReportsData }) {
  const s = data.topItemsSummary!;
  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(
          [
            ["Total Items Sold", s.totalSold, "This month"],
            ["Top Category", s.topCategory, "By orders"],
            ["Best Seller", s.bestSeller, `${s.bestSellerOrders} orders`],
            ["Top Revenue", s.topRevenueItem, `₹${s.topRevenue.toLocaleString()}`],
          ] as const
        ).map(([label, value, sub]) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-slate-400">{label}</p>
            <p className="text-lg font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500">{sub}</p>
          </div>
        ))}
      </div>
      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="font-semibold text-slate-900">Item Performance — December 2024</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr className="text-xs uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3 font-medium">#</th>
              <th className="px-5 py-3 font-medium">Item</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Orders</th>
              <th className="px-5 py-3 font-medium">Revenue</th>
              <th className="px-5 py-3 font-medium">Popularity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.topItems!.map((item, i) => (
              <tr key={item.name}>
                <td className="px-5 py-3 text-slate-400">{i + 1}</td>
                <td className="px-5 py-3 font-medium text-slate-800">{item.name}</td>
                <td className="px-5 py-3 text-slate-500">{item.category}</td>
                <td className="px-5 py-3 text-slate-700">{item.orders}</td>
                <td className="px-5 py-3 font-medium text-slate-800">₹{item.revenue.toLocaleString()}</td>
                <td className="px-5 py-3">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-600" style={{ width: `${item.popularity}%` }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function CustomersTab({ data }: { data: ReportsData }) {
  const s = data.customersSummary!;
  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard data={{ label: "Total Customers", value: `${s.total}`, helpText: "All time", icon: "Users", accent: "brand" }} />
        <StatCard data={{ label: "Repeat Customers", value: `${s.repeat}`, helpText: "2+ visits", icon: "RotateCcw", accent: "success" }} />
        <StatCard data={{ label: "Avg. Spend", value: `₹${s.avgSpend.toLocaleString()}`, helpText: "Per customer", icon: "TrendingUp", accent: "warning" }} />
        <StatCard data={{ label: "Total Revenue", value: `₹${s.totalRevenue.toLocaleString()}`, helpText: "All customers", icon: "CircleDollarSign", accent: "danger" }} />
      </div>
      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="font-semibold text-slate-900">Top Customers by Spend</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr className="text-xs uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Visits</th>
              <th className="px-5 py-3 font-medium">Total Spent</th>
              <th className="px-5 py-3 font-medium">Avg Order</th>
              <th className="px-5 py-3 font-medium">Last Order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.customersReport!.map((c) => (
              <tr key={c.id}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">{c.name[0]}</div>
                    <span className="font-medium text-slate-800">{c.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-slate-500">{c.phone}</td>
                <td className="px-5 py-3 text-slate-600">{c.visits}</td>
                <td className="px-5 py-3 font-medium text-emerald-600">₹{c.totalSpent.toLocaleString()}</td>
                <td className="px-5 py-3 text-slate-600">₹{c.avgOrder}</td>
                <td className="px-5 py-3 text-slate-500">{c.lastOrder}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function InventoryTab({ data }: { data: ReportsData }) {
  const s = data.inventorySummary!;
  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard data={{ label: "Total Items", value: `${s.totalItems}`, helpText: "In stock", icon: "Box", accent: "brand" }} />
        <StatCard data={{ label: "Low Stock", value: `${s.lowStock}`, helpText: "Needs attention", icon: "AlertTriangle", accent: "warning" }} />
        <StatCard data={{ label: "Critical", value: `${s.critical}`, helpText: `${s.criticalItem} — ${s.criticalQty} ${s.criticalUnit}`, icon: "AlertTriangle", accent: "danger" }} />
        <StatCard data={{ label: "Stock Value", value: `₹${s.stockValue.toLocaleString()}`, helpText: "Purchase cost", icon: "CircleDollarSign", accent: "success" }} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-3">
            <h3 className="font-semibold text-slate-900">Current Stock Levels</h3>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr className="text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Item</th>
                <th className="px-5 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 font-medium">Unit</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.inventoryReport!.map((i) => (
                <tr key={i.name}>
                  <td className="px-5 py-3 font-medium text-slate-800">{i.name}</td>
                  <td className="px-5 py-3 text-slate-700">{i.stock}</td>
                  <td className="px-5 py-3 text-slate-500">{i.unit}</td>
                  <td className="px-5 py-3">
                    <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-semibold", statusColors[i.status])}>{i.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-3">
            <h3 className="font-semibold text-slate-900">Recent Stock In</h3>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr className="text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Item</th>
                <th className="px-5 py-3 font-medium">Qty</th>
                <th className="px-5 py-3 font-medium">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.stockInEntries.map((e) => (
                <tr key={e.id}>
                  <td className="px-5 py-3 text-slate-500">
                    {e.createdAt ? new Date(e.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short" }) : "—"}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-800">{e.item}</td>
                  <td className="px-5 py-3 font-semibold text-brand-600">+{e.quantity} {e.unit}</td>
                  <td className="px-5 py-3 text-slate-700">₹{e.cost.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function GstTab({ data }: { data: ReportsData }) {
  const s = data.gstSummary!;
  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard data={{ label: "Dec GST Liability", value: `₹${s.decLiability.toLocaleString()}`, helpText: "CGST + SGST", icon: "Receipt", accent: "danger" }} />
        <StatCard data={{ label: "CGST (Dec)", value: `₹${s.cgst.toLocaleString()}`, helpText: "2.5% rate", icon: "CircleDollarSign", accent: "warning" }} />
        <StatCard data={{ label: "SGST (Dec)", value: `₹${s.sgst.toLocaleString()}`, helpText: "2.5% rate", icon: "CircleDollarSign", accent: "brand" }} />
        <StatCard data={{ label: "Filed Status", value: `${s.filedMonths} months`, helpText: "Oct–Nov–Dec", icon: "CheckCircle2", accent: "success" }} />
      </div>
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
        <p className="text-sm text-amber-800">{s.dueMessage}</p>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr className="text-xs uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3 font-medium">Period</th>
              <th className="px-5 py-3 font-medium">Total Sales</th>
              <th className="px-5 py-3 font-medium">Taxable Value</th>
              <th className="px-5 py-3 font-medium">CGST</th>
              <th className="px-5 py-3 font-medium">SGST</th>
              <th className="px-5 py-3 font-medium">Total GST</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.gstReport!.map((g) => (
              <tr key={g.period}>
                <td className="px-5 py-3 font-medium text-slate-800">{g.period}</td>
                <td className="px-5 py-3 text-slate-600">₹{g.totalSales.toLocaleString()}</td>
                <td className="px-5 py-3 text-slate-600">₹{g.taxableValue.toLocaleString()}</td>
                <td className="px-5 py-3 text-slate-600">₹{g.cgst.toLocaleString()}</td>
                <td className="px-5 py-3 text-slate-600">₹{g.sgst.toLocaleString()}</td>
                <td className="px-5 py-3 font-medium text-slate-800">₹{g.totalGst.toLocaleString()}</td>
                <td className="px-5 py-3">
                  <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-semibold", g.status === "Filed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                    {g.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function StaffTab({ data }: { data: ReportsData }) {
  const s = data.staffSummary!;
  const statusColors: Record<string, string> = {
    Present: "bg-emerald-50 text-emerald-700",
    Late: "bg-amber-50 text-amber-700",
    Absent: "bg-red-50 text-red-700",
    "Off Duty": "bg-slate-100 text-slate-500",
  };
  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard data={{ label: "Total Staff", value: `${s.totalStaff}`, helpText: "Active employees", icon: "Users", accent: "brand" }} />
        <StatCard data={{ label: "Present Today", value: `${s.presentToday}`, helpText: s.presentDetail, icon: "CheckCircle2", accent: "success" }} />
        <StatCard data={{ label: "Avg Attendance", value: `${s.avgAttendance}%`, helpText: "Last 7 days", icon: "TrendingUp", accent: "warning" }} />
        <StatCard data={{ label: "Late This Week", value: `${s.lateThisWeek}`, helpText: "Check in after 8:15", icon: "Clock", accent: "danger" }} />
      </div>

      {data.weeklyTrend && data.weeklyTrend.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900">Weekly Attendance — 15–21 Dec</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f4" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="font-semibold text-slate-900">Staff Attendance Summary</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr className="text-xs uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3 font-medium">Employee</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Shift</th>
              <th className="px-5 py-3 font-medium">Today</th>
              <th className="px-5 py-3 font-medium">Check In</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.staffReport!.map((st) => (
              <tr key={st.name}>
                <td className="px-5 py-3 font-medium text-slate-800">{st.name}</td>
                <td className="px-5 py-3 text-slate-500">{st.role}</td>
                <td className="px-5 py-3 text-slate-500">{st.shift}</td>
                <td className="px-5 py-3">
                  <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-semibold", statusColors[st.status])}>{st.status}</span>
                </td>
                <td className="px-5 py-3 text-slate-600">{st.checkIn}</td>
                <td className="px-5 py-3 text-slate-500">{st.dutyStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
