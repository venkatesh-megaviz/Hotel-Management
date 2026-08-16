import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { Download } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { fetchQROrders, fetchQRCodes, updateQROrder, type Order, type QRCodeEntry } from "@/lib/api";

type Tab = "orders" | "codes";

const statusColors: Record<string, string> = {
  Pending: "text-orange-600 bg-orange-50",
  Accepted: "text-blue-600 bg-blue-50",
  Completed: "text-emerald-600 bg-emerald-50",
  Rejected: "text-red-600 bg-red-50",
};

function timeAgo(iso: string) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return `${mins} min ago`;
}

export default function QROrdering() {
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState({ pending: 0, accepted: 0, completed: 0 });
  const [codes, setCodes] = useState<QRCodeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(() => {
    setLoading(true);
    fetchQROrders()
      .then((res) => {
        setOrders(res.orders);
        setSummary(res.summary);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === "orders") {
      loadOrders();
      const interval = setInterval(loadOrders, 20000);
      return () => clearInterval(interval);
    }
    fetchQRCodes().then((res) => setCodes(res.codes));
  }, [tab, loadOrders]);

  async function handleAction(id: string, channelStatus: string) {
    await updateQROrder(id, channelStatus);
    loadOrders();
  }

  const liveOrders = orders.filter((o) => o.channelStatus !== "Rejected");

  return (
    <div className="space-y-6">
      <PageHeader title="QR Ordering" subtitle="Manage table QR code orders" />

      <div className="inline-flex rounded-xl bg-slate-100 p-1">
        {(
          [
            ["orders", "Live Orders"],
            ["codes", "QR Codes"],
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

      {tab === "orders" ? (
        <>
          <div className="grid grid-cols-3 gap-4">
            {(
              [
                ["Pending", summary.pending, "text-orange-700 bg-orange-50"],
                ["Accepted", summary.accepted, "text-blue-700 bg-blue-50"],
                ["Completed", summary.completed, "text-emerald-700 bg-emerald-50"],
              ] as const
            ).map(([label, count, cls]) => (
              <div key={label} className={clsx("rounded-2xl p-4 text-center", cls.split(" ").slice(2).join(" "))}>
                <p className={clsx("text-3xl font-bold", cls.split(" ")[0])}>{count}</p>
                <p className={clsx("text-sm font-medium", cls.split(" ")[0])}>{label}</p>
              </div>
            ))}
          </div>

          {loading ? (
            <p className="py-12 text-center text-sm text-slate-400">Loading orders…</p>
          ) : liveOrders.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">No live QR orders.</p>
          ) : (
            <div className="space-y-4">
              {liveOrders.map((order) => (
                <div key={order.id} className="card p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{order.externalId || `#${order.billNo}`}</p>
                      <p className="text-sm text-slate-500">
                        {order.tableOrNo} · {timeAgo(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-semibold", statusColors[order.channelStatus ?? "Pending"])}>
                        {order.channelStatus}
                      </span>
                      <p className="mt-1 font-bold text-slate-900">₹{order.total.toFixed(0)}</p>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1">
                    {order.items.map((item, i) => (
                      <li key={i} className="text-sm text-slate-600">
                        • {item.name} ×{item.qty}
                      </li>
                    ))}
                  </ul>
                  {order.channelStatus === "Pending" && (
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => handleAction(order.id, "Accepted")}
                        className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
                      >
                        Accept Order
                      </button>
                      <button
                        onClick={() => handleAction(order.id, "Rejected")}
                        className="flex-1 rounded-xl bg-red-50 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {order.channelStatus === "Accepted" && (
                    <button
                      onClick={() => handleAction(order.id, "Completed")}
                      className="mt-4 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Mark Completed
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {codes.map((code) => (
            <div key={code.id} className="card flex flex-col items-center p-5 text-center">
              <img src={code.qrImageUrl} alt={`QR ${code.number}`} className="h-32 w-32 rounded-lg" />
              <p className="mt-3 font-bold text-slate-900">{code.number}</p>
              <p className="text-xs text-slate-400">
                {code.seats} seats · {code.area}
              </p>
              <a
                href={code.qrImageUrl}
                download={`qr-${code.number}.png`}
                className="mt-3 flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
              >
                <Download size={14} />
                Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
