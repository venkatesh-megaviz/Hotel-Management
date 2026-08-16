import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  CircleDollarSign,
  Grid3X3,
  ChefHat,
  QrCode,
  Globe,
  Truck,
  Star,
  UserCheck,
  Calculator,
  ChevronRight,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import clsx from "clsx";
import StatusBadge from "@/components/StatusBadge";
import { fetchDashboard, type DashboardData } from "@/lib/api";

function billTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function billSource(bill: DashboardData["recentBills"][number]) {
  if (bill.tableOrNo?.startsWith("T-")) return `Table ${bill.tableOrNo.replace("T-", "")}`;
  return bill.tableOrNo || bill.customerName;
}

const KPI_CARDS = [
  {
    label: "Today's Revenue",
    icon: TrendingUp,
    iconBg: "bg-[#EFF6FF] text-[#155DFC]",
    getValue: (d: DashboardData) => `₹${d.todayRevenue.toLocaleString()}`,
    getChange: (d: DashboardData) =>
      d.revenueChange ? `+${Math.abs(d.revenueChange)}% vs yesterday` : undefined,
    changeColor: "text-[#009966]",
  },
  {
    label: "Today's Orders",
    icon: ShoppingCart,
    iconBg: "bg-[#ECFDF5] text-[#009966]",
    getValue: (d: DashboardData) => `${d.todayOrdersCount}`,
    getChange: (d: DashboardData) => `${d.pendingOrdersCount} pending collection`,
    changeColor: "text-slate-500",
  },
  {
    label: "Stock Alerts",
    icon: AlertTriangle,
    iconBg: "bg-[#FFF7ED] text-[#FE9A00]",
    getValue: (d: DashboardData) => `${d.stockAlerts} items`,
    getChange: () => "Need restocking",
    changeColor: "text-slate-500",
  },
  {
    label: "Today's Expenses",
    icon: CircleDollarSign,
    iconBg: "bg-[#FDF2F8] text-[#DB2777]",
    getValue: (d: DashboardData) => `₹${d.todayExpenseTotal.toLocaleString()}`,
    getChange: (d: DashboardData) => `${d.todayExpensesList.length} entries logged`,
    changeColor: "text-slate-500",
  },
] as const;

const LIVE_STATUS = [
  {
    label: "Active Tables",
    getMain: (d: DashboardData) => (
      <>
        {d.liveStatus.activeTables}{" "}
        <span className="text-base font-normal text-slate-400">/ {d.liveStatus.totalTables}</span>
      </>
    ),
    sub: (d: DashboardData) => `${d.liveStatus.availableTables} available`,
    icon: Grid3X3,
    iconBg: "bg-[#EFF6FF] text-[#155DFC]",
    valueColor: "text-slate-900",
  },
  {
    label: "Kitchen Queue",
    getMain: (d: DashboardData) => `${d.liveStatus.kitchenQueue} orders`,
    sub: (d: DashboardData) => `${d.liveStatus.kitchenNew} new / ${d.liveStatus.kitchenPreparing} preparing`,
    icon: ChefHat,
    iconBg: "bg-[#FFF7ED] text-[#FE9A00]",
    valueColor: "text-slate-900",
  },
  {
    label: "Online Orders",
    getMain: (d: DashboardData) => `${d.liveStatus.onlineOrders} pending`,
    sub: () => "Swiggy - Zomato - Web",
    icon: Globe,
    iconBg: "bg-[#F5F3FF] text-[#7C3AED]",
    valueColor: "text-[#7C3AED]",
  },
  {
    label: "Active Deliveries",
    getMain: (d: DashboardData) => `${d.liveStatus.activeDeliveries} out`,
    sub: (d: DashboardData) => `${d.liveStatus.pendingAssign} pending assign`,
    icon: Truck,
    iconBg: "bg-[#ECFDF5] text-[#009966]",
    valueColor: "text-[#009966]",
  },
] as const;

const QUICK_LINKS = [
  { to: "/tables", label: "Tables", icon: Grid3X3, bg: "bg-[#155DFC]" },
  { to: "/kitchen", label: "Kitchen", icon: ChefHat, bg: "bg-[#FE9A00]" },
  { to: "/qr-ordering", label: "QR Order", icon: QrCode, bg: "bg-[#7C3AED]" },
  { to: "/online-ordering", label: "Online", icon: Globe, bg: "bg-[#0D9488]" },
  { to: "/delivery", label: "Delivery", icon: Truck, bg: "bg-[#009966]" },
  { to: "/loyalty", label: "Loyalty", icon: Star, bg: "bg-[#DB2777]" },
  { to: "/attendance", label: "Attendance", icon: UserCheck, bg: "bg-[#4338CA]" },
  { to: "/accounting", label: "Accounting", icon: Calculator, bg: "bg-[#DC2626]" },
] as const;

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

  const maxRevenue = Math.max(...data.weeklyRevenue.map((d) => d.revenue), 30000);

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_CARDS.map((card) => {
          const Icon = card.icon;
          const change = card.getChange(data);
          return (
            <div key={card.label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <div className={clsx("flex h-10 w-10 items-center justify-center rounded-xl", card.iconBg)}>
                  <Icon size={20} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{card.getValue(data)}</p>
              {change && <p className={clsx("mt-1 text-xs font-medium", card.changeColor)}>{change}</p>}
            </div>
          );
        })}
      </div>

      {/* Live status row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {LIVE_STATUS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">{item.label}</p>
                  <p className={clsx("mt-1 text-2xl font-bold", item.valueColor)}>{item.getMain(data)}</p>
                  <p className="text-xs text-slate-400">{item.sub(data)}</p>
                </div>
                <div className={clsx("flex h-10 w-10 items-center justify-center rounded-xl", item.iconBg)}>
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick access */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-semibold text-slate-900">Quick Access</h3>
        <div className="grid grid-cols-4 gap-4 sm:grid-cols-8">
          {QUICK_LINKS.map(({ to, label, icon: Icon, bg }) => (
            <Link key={to} to={to} className="group flex flex-col items-center gap-2">
              <div className={clsx("flex h-12 w-12 items-center justify-center rounded-full text-white transition-transform group-hover:scale-105", bg)}>
                <Icon size={22} />
              </div>
              <span className="text-center text-[11px] font-medium text-slate-600">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Weekly sales + stock alerts */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Weekly Sales</h3>
            <Link to="/reports" className="flex items-center gap-0.5 text-sm font-medium text-[#155DFC] hover:underline">
              Full Report
              <ChevronRight size={16} />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.weeklyRevenue} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f4" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                domain={[0, maxRevenue]}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                formatter={(value) => [`₹${Number(value).toLocaleString()}`, "Revenue"]}
                contentStyle={{ borderRadius: 12, border: "1px solid #eef0f4", fontSize: 13 }}
              />
              <Bar dataKey="revenue" fill="#155DFC" radius={[6, 6, 0, 0]} maxBarSize={48} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Stock Alerts</h3>
            <Link to="/inventory" className="text-sm font-medium text-[#155DFC] hover:underline">
              Add Stock
            </Link>
          </div>
          {data.stockAlertItems.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">All stock levels are healthy.</p>
          ) : (
            <div className="space-y-3">
              {data.stockAlertItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-400">
                      {item.quantity} {item.unit} left
                    </p>
                  </div>
                  <span
                    className={clsx(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      item.severity === "Critical" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700",
                    )}
                  >
                    {item.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent bills + today's expenses */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Recent Bills</h3>
            <Link to="/billing" className="text-sm font-medium text-[#155DFC] hover:underline">
              New Bill
            </Link>
          </div>
          {data.recentBills.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No bills yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.recentBills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-semibold text-slate-800">#{bill.billNo}</p>
                    <p className="text-xs text-slate-400">
                      {billSource(bill)} · {billTime(bill.createdAt)}
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

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Today's Expenses</h3>
            <Link to="/expenses" className="text-sm font-medium text-[#155DFC] hover:underline">
              Add Expense
            </Link>
          </div>
          {data.todayExpensesList.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No expenses recorded today.</p>
          ) : (
            <div>
              <div className="divide-y divide-slate-100">
                {data.todayExpensesList.map((e) => (
                  <div key={e.id} className="flex items-center justify-between py-3">
                    <p className="text-sm text-slate-700">{e.description}</p>
                    <span className="font-medium text-slate-800">₹{e.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3">
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
