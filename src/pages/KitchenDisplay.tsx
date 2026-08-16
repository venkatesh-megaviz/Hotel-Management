import { useEffect, useState, useCallback } from "react";
import clsx from "clsx";
import { RefreshCw } from "lucide-react";
import { fetchKitchenOrders, updateOrder, type Order } from "@/lib/api";

const TABS = ["All", "New", "Preparing", "Ready"] as const;

const KDS_ORANGE = "#FE9A00";
const KDS_BLUE = "#155DFC";
const KDS_GREEN = "#009966";

const COLUMNS = [
  {
    key: "New" as const,
    label: "New",
    color: KDS_ORANGE,
    bgLight: "bg-[#FFF7ED]",
    action: "Start Cooking",
    next: "Preparing" as const,
  },
  {
    key: "Preparing" as const,
    label: "Preparing",
    color: KDS_BLUE,
    bgLight: "bg-[#EFF6FF]",
    action: "Mark Ready",
    next: "Ready" as const,
  },
  {
    key: "Ready" as const,
    label: "Ready",
    color: KDS_GREEN,
    bgLight: "bg-[#ECFDF5]",
    action: "Mark Served",
    next: "Served" as const,
  },
];

function elapsedMins(iso: string) {
  return Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

function orderLabel(order: Order) {
  if (order.tableOrNo === "Online" || order.orderType === "Online") return "Online";
  if (order.tableOrNo === "Parcel" || order.orderType === "Parcel") return "Parcel";
  if (order.tableOrNo?.startsWith("T-")) return `Table ${order.tableOrNo.replace("T-", "")}`;
  return order.tableOrNo || "Order";
}

function OrderCard({
  order,
  column,
  onAdvance,
}: {
  order: Order;
  column: (typeof COLUMNS)[number];
  onAdvance: (order: Order) => void;
}) {
  const mins = elapsedMins(order.createdAt);
  const isStale = column.key === "Ready" && mins >= 15;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between px-4 py-3" style={{ borderLeft: `4px solid ${column.color}` }}>
        <div>
          <p className="font-bold text-slate-900">KD-{String(order.billNo).slice(-3).padStart(3, "0")}</p>
          <p className="text-xs text-slate-500">{orderLabel(order)}</p>
        </div>
        <div className="text-right">
          <p className={clsx("text-sm font-semibold", isStale ? "text-red-600" : "text-slate-600")}>{mins} min</p>
          {order.priority && (
            <span className="mt-0.5 inline-block rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-700">
              Priority
            </span>
          )}
        </div>
      </div>
      <ul className="space-y-1.5 px-4 pb-3">
        {order.items.map((item, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
            {item.name} ×{item.qty}
          </li>
        ))}
      </ul>
      <div className="px-4 pb-4">
        <button
          onClick={() => onAdvance(order)}
          className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: column.color }}
        >
          {column.action}
        </button>
      </div>
    </div>
  );
}

export default function KitchenDisplay() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState({ new: 0, preparing: 0, ready: 0 });
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchKitchenOrders()
      .then((res) => {
        setOrders(res.orders);
        setSummary(res.summary);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  async function advanceOrder(order: Order) {
    const column = COLUMNS.find((c) => c.key === order.kitchenStatus);
    if (!column) return;
    await updateOrder(order.id, { kitchenStatus: column.next });
    load();
  }

  const visibleColumns = tab === "All" ? COLUMNS : COLUMNS.filter((c) => c.key === tab);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const count = summary[col.key.toLowerCase() as keyof typeof summary];
          return (
            <div
              key={col.key}
              className="rounded-2xl p-4 text-center"
              style={{ backgroundColor: `${col.color}14` }}
            >
              <p className="text-3xl font-bold" style={{ color: col.color }}>
                {count}
              </p>
              <p className="text-sm font-semibold" style={{ color: col.color }}>
                {col.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          {TABS.map((t) => {
            const count = t === "All" ? summary.new + summary.preparing + summary.ready : summary[t.toLowerCase() as keyof typeof summary];
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={clsx(
                  "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                  tab === t ? "bg-[#155dfc] text-white" : "text-slate-600 hover:text-slate-900",
                )}
              >
                {t}
                {t !== "All" && count > 0 && <span className="ml-1 opacity-80">({count})</span>}
              </button>
            );
          })}
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {loading && orders.length === 0 ? (
        <p className="py-16 text-center text-sm text-slate-400">Loading kitchen queue…</p>
      ) : orders.length === 0 ? (
        <p className="py-16 text-center text-sm text-slate-400">No orders in queue.</p>
      ) : (
        <div className={clsx("grid gap-4", visibleColumns.length === 1 ? "grid-cols-1 max-w-md" : "grid-cols-1 lg:grid-cols-3")}>
          {visibleColumns.map((col) => {
            const colOrders = orders.filter((o) => o.kitchenStatus === col.key);
            return (
              <div key={col.key} className={clsx("rounded-2xl p-3", col.bgLight)}>
                <div className="mb-3 flex items-center gap-2 px-1">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: col.color }} />
                  <h3 className="font-bold text-slate-900">{col.label}</h3>
                  <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600">
                    {colOrders.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {colOrders.length === 0 ? (
                    <p className="py-8 text-center text-xs text-slate-400">No orders</p>
                  ) : (
                    colOrders.map((order) => (
                      <OrderCard key={order.id} order={order} column={col} onAdvance={advanceOrder} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
