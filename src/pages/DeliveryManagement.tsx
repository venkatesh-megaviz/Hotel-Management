import { useCallback, useEffect, useState, type ReactNode } from "react";
import clsx from "clsx";
import { Plus, Star } from "lucide-react";
import {
  fetchDeliveries,
  fetchDeliveryAgents,
  updateDelivery,
  type DeliveryOrder,
  type DeliveryAgent,
} from "@/lib/api";

type Tab = "deliveries" | "agents";

const BLUE = "#155DFC";
const ORANGE = "#FE9A00";
const GREEN = "#009966";

const labelColors: Record<string, string> = {
  "Pending Assignment": "bg-[#FFF7ED] text-[#FE9A00]",
  "Picked Up": "bg-[#F5F3FF] text-[#7C3AED]",
  "Out for Delivery": "bg-[#EFF6FF] text-[#155DFC]",
  Delivered: "bg-[#ECFDF5] text-[#009966]",
};

const agentStatusColors: Record<string, string> = {
  Active: "bg-[#ECFDF5] text-[#009966]",
  Idle: "bg-slate-100 text-slate-600",
  "Off Duty": "bg-red-100 text-red-700",
};

const SUMMARY = [
  { key: "active" as const, label: "Active", color: BLUE, bg: "#EFF6FF" },
  { key: "pending" as const, label: "Pending", color: ORANGE, bg: "#FFF7ED" },
  { key: "delivered" as const, label: "Delivered", color: GREEN, bg: "#ECFDF5" },
];

function ActionButton({
  children,
  color,
  onClick,
}: {
  children: ReactNode;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-8 w-full items-center justify-center gap-1.5 rounded-2xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
      style={{ backgroundColor: color }}
    >
      {children}
    </button>
  );
}

export default function DeliveryManagement() {
  const [tab, setTab] = useState<Tab>("deliveries");
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [summary, setSummary] = useState({ active: 0, pending: 0, delivered: 0 });
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDeliveries = useCallback(() => {
    setLoading(true);
    fetchDeliveries()
      .then((res) => {
        setDeliveries(res.deliveries);
        setSummary(res.summary);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === "deliveries") {
      loadDeliveries();
      const interval = setInterval(loadDeliveries, 20000);
      return () => clearInterval(interval);
    }
    fetchDeliveryAgents().then((res) => setAgents(res.agents));
  }, [tab, loadDeliveries]);

  async function assignAgent(deliveryId: string, agentList: DeliveryAgent[]) {
    const active = agentList.filter((a) => a.status === "Active");
    if (active.length === 0) return;
    await updateDelivery(deliveryId, { deliveryAgentId: active[0].id, eta: 25 });
    loadDeliveries();
  }

  async function markDelivered(id: string) {
    await updateDelivery(id, { channelStatus: "Delivered" });
    loadDeliveries();
  }

  const activeDeliveries = deliveries.filter((d) => d.deliveryLabel !== "Delivered");

  return (
    <div className="space-y-5">
      <div className="inline-flex rounded-xl bg-slate-100 p-1">
        {(
          [
            ["deliveries", "Deliveries"],
            ["agents", "Agents"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={clsx(
              "rounded-lg px-5 py-2 text-sm font-semibold transition-colors",
              tab === key ? "bg-[#155dfc] text-white" : "text-slate-500 hover:text-slate-700",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "deliveries" ? (
        <>
          <div className="grid grid-cols-3 gap-4">
            {SUMMARY.map(({ key, label, color, bg }) => (
              <div
                key={key}
                className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm"
                style={{ backgroundColor: bg }}
              >
                <p className="text-3xl font-bold" style={{ color }}>
                  {summary[key]}
                </p>
                <p className="text-sm font-semibold" style={{ color }}>
                  {label}
                </p>
              </div>
            ))}
          </div>

          {loading ? (
            <p className="py-12 text-center text-sm text-slate-400">Loading deliveries…</p>
          ) : activeDeliveries.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">No active deliveries.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              {activeDeliveries.map((d, i) => (
                <div key={d.id} className={clsx("px-5 py-5", i > 0 && "border-t border-slate-100")}>
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-bold text-slate-900">
                      {d.deliveryId} · {d.externalId}
                    </p>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-semibold", labelColors[d.deliveryLabel])}>
                        {d.deliveryLabel}
                      </span>
                      <span className="font-bold text-slate-900">₹{d.total.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <p className="text-xs font-medium text-slate-400">Customer</p>
                      <p className="mt-0.5 text-sm font-medium text-slate-800">{d.customerName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400">Address</p>
                      <p className="mt-0.5 text-sm font-medium text-slate-800">{d.deliveryAddress || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400">ETA</p>
                      <p className="mt-0.5 text-sm font-medium text-slate-800">{d.eta ? `${d.eta} min` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400">Agent</p>
                      <p className="mt-0.5 text-sm font-medium text-slate-800">{d.agentName || "—"}</p>
                    </div>
                  </div>

                  <div className="mt-4 max-w-xs">
                    {d.deliveryLabel === "Pending Assignment" && (
                      <ActionButton color={BLUE} onClick={() => fetchDeliveryAgents().then((res) => assignAgent(d.id, res.agents))}>
                        <Plus size={14} />
                        Assign Agent
                      </ActionButton>
                    )}
                    {(d.deliveryLabel === "Picked Up" || d.deliveryLabel === "Out for Delivery") && (
                      <ActionButton color={GREEN} onClick={() => markDelivered(d.id)}>
                        Mark Delivered
                      </ActionButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {agents.map((agent) => (
            <div key={agent.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EFF6FF] text-base font-bold text-[#155DFC]">
                    {agent.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{agent.name}</p>
                    <p className="text-sm text-slate-500">{agent.phone}</p>
                  </div>
                </div>
                <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-semibold", agentStatusColors[agent.status])}>
                  {agent.status}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <p className="text-xs text-slate-400">Today's Runs</p>
                  <p className="text-xl font-bold text-slate-900">{agent.todayRuns}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Rating</p>
                  <p className="flex items-center gap-1 text-xl font-bold text-slate-900">
                    {agent.rating.toFixed(1)} <Star size={16} className="fill-amber-400 text-amber-400" />
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
