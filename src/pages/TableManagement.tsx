import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import PageHeader from "@/components/PageHeader";
import { fetchTables, updateTable, type RestaurantTable, type TableStatus } from "@/lib/api";

const AREAS = ["All", "Indoor", "Outdoor", "Private"] as const;

const statusStyles: Record<TableStatus, { card: string; badge: string; label: string }> = {
  Available: { card: "border-emerald-200 bg-emerald-50", badge: "bg-emerald-100 text-emerald-700", label: "Available" },
  Occupied: { card: "border-blue-200 bg-blue-50", badge: "bg-blue-100 text-blue-700", label: "Occupied" },
  Reserved: { card: "border-amber-200 bg-amber-50", badge: "bg-amber-100 text-amber-700", label: "Reserved" },
  Billing: { card: "border-rose-200 bg-rose-50", badge: "bg-rose-100 text-rose-700", label: "Billing" },
};

export default function TableManagement() {
  const navigate = useNavigate();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [summary, setSummary] = useState({ available: 0, occupied: 0, reserved: 0, billing: 0 });
  const [area, setArea] = useState<(typeof AREAS)[number]>("All");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetchTables(area)
      .then((res) => {
        setTables(res.tables);
        setSummary(res.summary);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [area]);

  async function handleTableClick(table: RestaurantTable) {
    if (table.status === "Available") {
      await updateTable(table.id, { status: "Occupied", customerName: "Walk-in" });
      navigate(`/billing?table=${table.id}&number=${table.number}`);
    } else if (table.status === "Occupied") {
      await updateTable(table.id, { status: "Billing" });
      navigate(`/billing?table=${table.id}&number=${table.number}`);
    } else if (table.status === "Billing" && table.currentOrder) {
      navigate(`/billing/invoice/${table.currentOrder}`);
    }
  }

  async function handleReserve(table: RestaurantTable, e: React.MouseEvent) {
    e.stopPropagation();
    const name = window.prompt("Customer name for reservation?");
    const time = window.prompt("Reservation time (e.g. 6:00 PM)?");
    if (!name) return;
    await updateTable(table.id, { status: "Reserved", customerName: name, reservedAt: time ?? "" });
    load();
  }

  async function handleFree(table: RestaurantTable, e: React.MouseEvent) {
    e.stopPropagation();
    await updateTable(table.id, { status: "Available" });
    load();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Table Management" subtitle="Monitor and manage restaurant tables" />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(
          [
            ["Available", summary.available, "text-emerald-700 bg-emerald-50 border-emerald-100"],
            ["Occupied", summary.occupied, "text-blue-700 bg-blue-50 border-blue-100"],
            ["Reserved", summary.reserved, "text-amber-700 bg-amber-50 border-amber-100"],
            ["Billing", summary.billing, "text-rose-700 bg-rose-50 border-rose-100"],
          ] as const
        ).map(([label, count, cls]) => (
          <div key={label} className={clsx("rounded-2xl border p-4 text-center", cls.split(" ").slice(2).join(" "))}>
            <p className={clsx("text-3xl font-bold", cls.split(" ")[0])}>{count}</p>
            <p className={clsx("text-sm font-medium", cls.split(" ")[0])}>{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {AREAS.map((a) => (
          <button
            key={a}
            onClick={() => setArea(a)}
            className={clsx(
              "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              area === a ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
            )}
          >
            {a}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-slate-400">Loading tables…</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {tables.map((table) => {
            const style = statusStyles[table.status];
            return (
              <button
                key={table.id}
                onClick={() => handleTableClick(table)}
                className={clsx("rounded-2xl border-2 p-4 text-left transition-transform hover:scale-[1.02]", style.card)}
              >
                <div className="flex items-start justify-between">
                  <p className="text-lg font-bold text-slate-900">{table.number}</p>
                  <span className={clsx("rounded-full px-2 py-0.5 text-[10px] font-semibold", style.badge)}>{style.label}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{table.seats} seats · {table.area}</p>
                {table.customerName && table.status !== "Available" && (
                  <p className="mt-2 text-sm font-medium text-slate-700">{table.customerName}</p>
                )}
                {table.reservedAt && table.status === "Reserved" && (
                  <p className="text-xs text-slate-500">{table.reservedAt}</p>
                )}
                {table.occupiedAt && table.status === "Occupied" && (
                  <p className="text-xs text-slate-500">
                    {new Date(table.occupiedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </p>
                )}
                <div className="mt-3 flex gap-1">
                  {table.status === "Available" && (
                    <span
                      role="button"
                      onClick={(e) => handleReserve(table, e)}
                      className="rounded-lg bg-white/80 px-2 py-1 text-[10px] font-medium text-slate-600 hover:bg-white"
                    >
                      Reserve
                    </span>
                  )}
                  {table.status !== "Available" && (
                    <span
                      role="button"
                      onClick={(e) => handleFree(table, e)}
                      className="rounded-lg bg-white/80 px-2 py-1 text-[10px] font-medium text-slate-600 hover:bg-white"
                    >
                      Free
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
