import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import PageHeader from "@/components/PageHeader";
import { fetchOnlineOrders, updateOnlineOrder, type Order } from "@/lib/api";

const PLATFORMS = ["All", "Swiggy", "Zomato", "Website"] as const;

const platformColors: Record<string, string> = {
  Swiggy: "bg-orange-100 text-orange-700",
  Zomato: "bg-red-100 text-red-700",
  Website: "bg-blue-100 text-blue-700",
};

const statusColors: Record<string, string> = {
  New: "text-amber-600 bg-amber-50",
  Accepted: "text-blue-600 bg-blue-50",
  Preparing: "text-purple-600 bg-purple-50",
  OutForDelivery: "text-cyan-600 bg-cyan-50",
  Delivered: "text-emerald-600 bg-emerald-50",
  Rejected: "text-red-600 bg-red-50",
};

const NEXT_STATUS: Record<string, { label: string; status: string }> = {
  New: { label: "Accept", status: "Accepted" },
  Accepted: { label: "Start Preparing", status: "Preparing" },
  Preparing: { label: "Dispatch", status: "OutForDelivery" },
  OutForDelivery: { label: "Mark Delivered", status: "Delivered" },
};

function timeAgo(iso: string) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return `${mins} min ago`;
}

function formatStatus(status?: string) {
  if (status === "OutForDelivery") return "Out for Delivery";
  return status ?? "New";
}

export default function OnlineOrdering() {
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]>("All");
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchOnlineOrders(platform)
      .then((res) => {
        setOrders(res.orders);
        setSummary(res.summary);
      })
      .finally(() => setLoading(false));
  }, [platform]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleAdvance(order: Order) {
    const next = NEXT_STATUS[order.channelStatus ?? "New"];
    if (!next) return;
    await updateOnlineOrder(order.id, { channelStatus: next.status });
    load();
  }

  async function handleReject(id: string) {
    await updateOnlineOrder(id, { channelStatus: "Rejected" });
    load();
  }

  const visibleOrders = orders.filter((o) => o.channelStatus !== "Rejected");

  return (
    <div className="space-y-6">
      <PageHeader title="Online Ordering" subtitle="Manage Swiggy, Zomato and website orders" />

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={clsx(
                "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                platform === p ? "bg-brand-600 text-white" : "text-slate-500 hover:text-slate-700",
              )}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(summary).map(([status, count]) =>
            count > 0 ? (
              <span key={status} className={clsx("rounded-full px-2.5 py-1 font-medium", statusColors[status] ?? "bg-slate-100")}>
                {status}: {count}
              </span>
            ) : null,
          )}
        </div>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-slate-400">Loading orders…</p>
      ) : (
        <div className="space-y-4">
          {visibleOrders.map((order) => {
            const ch = order.channel ?? "Website";
            const next = NEXT_STATUS[order.channelStatus ?? "New"];
            const isTerminal = order.channelStatus === "Delivered";
            return (
              <div key={order.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={clsx("rounded-full px-2 py-0.5 text-xs font-semibold", platformColors[ch])}>{ch}</span>
                      <span className="font-bold text-slate-900">{order.externalId}</span>
                      <span className="text-xs text-slate-400">{timeAgo(order.createdAt)}</span>
                    </div>
                    <p className="mt-1 font-medium text-slate-800">{order.customerName}</p>
                    <p className="text-sm text-slate-500">{order.deliveryAddress}</p>
                  </div>
                  <div className="text-right">
                    <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-semibold", statusColors[order.channelStatus ?? "New"])}>
                      {formatStatus(order.channelStatus)}
                    </span>
                    <p className="mt-1 text-lg font-bold text-slate-900">₹{order.total.toFixed(0)}</p>
                  </div>
                </div>
                <ul className="mt-3 space-y-1">
                  {order.items.map((item, i) => (
                    <li key={i} className="text-sm text-slate-600">
                      • {item.name} ×{item.qty}
                    </li>
                  ))}
                </ul>
                {next && !isTerminal && (
                  <div className="mt-4 space-y-2">
                    <button
                      onClick={() => handleAdvance(order)}
                      className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
                    >
                      {next.label}
                    </button>
                    {order.channelStatus === "New" && (
                      <button onClick={() => handleReject(order.id)} className="w-full text-sm font-medium text-red-500 hover:underline">
                        Reject
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {visibleOrders.length === 0 && <p className="py-12 text-center text-sm text-slate-400">No online orders.</p>}
        </div>
      )}
    </div>
  );
}
