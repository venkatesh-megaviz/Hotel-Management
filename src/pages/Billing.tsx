import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Minus,
  Plus,
  Trash2,
  Search,
  ShoppingCart,
  RefreshCcw,
  CheckCircle2,
  Download,
  MessageCircle,
  FileText,
  MessageSquare,
} from "lucide-react";
import clsx from "clsx";
import StatCard from "@/components/StatCard";
import { useAuth } from "@/context/AuthContext";
import { fetchMenuItems, fetchOrders, createOrder, type MenuItem, type Order, type OrderLine } from "@/lib/api";

function buildWhatsAppText(order: Order, restaurantName: string) {
  const lines = order.items.map((line) => `${line.name} ×${line.qty} - ₹${(line.price * line.qty).toFixed(0)}`).join("\n");
  return `Invoice from ${restaurantName}\nBill #${order.billNo}\n\n${lines}\nGST: ₹${order.gstAmount.toFixed(0)}\nTotal Paid: ₹${order.total.toFixed(0)} (${order.mode})\n\nThank you for dining with us!`;
}

interface CartLine extends OrderLine {
  id: string;
}

type View = "new" | "history";

export default function Billing() {
  const { restaurant } = useAuth();
  const [view, setView] = useState<View>("new");
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"Cash" | "UPI" | "Card">("Cash");
  const [tableOrNo, setTableOrNo] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [nextBillNo, setNextBillNo] = useState(1001);
  const [submitting, setSubmitting] = useState(false);
  const [paidOrder, setPaidOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchMenuItems().then((res) => setMenu(res.items.filter((i) => i.available)));
    loadOrders();
  }, []);

  function loadOrders() {
    setOrdersLoading(true);
    fetchOrders()
      .then((res) => {
        setOrders(res.orders);
        const max = res.orders.reduce((m, o) => Math.max(m, o.billNo), 1000);
        setNextBillNo(max + 1);
      })
      .finally(() => setOrdersLoading(false));
  }

  const categories = useMemo(() => ["All", ...Array.from(new Set(menu.map((i) => i.category)))], [menu]);

  const filtered = menu.filter(
    (i) => (activeCategory === "All" || i.category === activeCategory) && i.name.toLowerCase().includes(search.toLowerCase()),
  );

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((l) => l.id === item.id);
      if (existing) return prev.map((l) => (l.id === item.id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { id: item.id, menuItemId: item.id, name: item.name, price: item.price, gst: item.gst, qty: 1 }];
    });
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) => prev.map((l) => (l.id === id ? { ...l, qty: l.qty + delta } : l)).filter((l) => l.qty > 0));
  }

  function removeLine(id: string) {
    setCart((prev) => prev.filter((l) => l.id !== id));
  }

  function resetBill() {
    setCart([]);
    setTableOrNo("");
    setCustomerName("");
    setMode("Cash");
  }

  const subtotal = cart.reduce((sum, l) => sum + l.price * l.qty, 0);
  const gst = cart.reduce((sum, l) => sum + (l.price * l.qty * l.gst) / 100, 0);
  const total = subtotal + gst;

  async function handleCollect() {
    setSubmitting(true);
    try {
      const res = await createOrder({
        tableOrNo,
        customerName: customerName || "Walk-in",
        items: cart.map(({ menuItemId, name, price, gst, qty }) => ({ menuItemId, name, price, gst, qty })),
        mode,
        status: "Paid",
      });
      setPaidOrder(res.order);
      setNextBillNo((n) => n + 1);
      loadOrders();
    } finally {
      setSubmitting(false);
    }
  }

  function handleNewBillFromModal() {
    setPaidOrder(null);
    resetBill();
  }

  return (
    <div>
      <h2 className="mb-1 text-xl font-bold text-slate-900">Billing / POS</h2>
      <p className="mb-4 text-sm text-slate-500">Create bills, collect payment, share invoices</p>

      <div className="mb-6 inline-flex rounded-xl bg-slate-100 p-1">
        <button
          onClick={() => setView("new")}
          className={clsx(
            "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
            view === "new" ? "bg-brand-600 text-white" : "text-slate-500 hover:text-slate-700",
          )}
        >
          New Bill
        </button>
        <button
          onClick={() => setView("history")}
          className={clsx(
            "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
            view === "history" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700",
          )}
        >
          Bill History
        </button>
      </div>

      {view === "new" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="card p-5 lg:col-span-2">
            <div className="relative mb-4">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={clsx(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    activeCategory === cat ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {menu.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">No available menu items. Add items in Menu Management first.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {filtered.map((item) => {
                  const cartQty = cart.find((l) => l.id === item.id)?.qty ?? 0;
                  const selected = cartQty > 0;
                  return (
                    <button
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className={clsx(
                        "flex flex-col items-start rounded-xl border p-4 text-left transition",
                        selected ? "border-[#8EC5FF] bg-brand-50/60 ring-1 ring-[#8EC5FF]" : "border-slate-200 hover:border-brand-200",
                      )}
                    >
                      <span className="flex w-full items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <span className={clsx("h-1.5 w-1.5 rounded-full", item.foodType === "Veg" ? "bg-success-600" : "bg-danger-600")} />
                          {item.category}
                        </span>
                        {selected && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
                            {cartQty}
                          </span>
                        )}
                      </span>
                      <span className="mt-1 text-sm font-semibold text-slate-900">{item.name}</span>
                      <span className="mt-2 text-sm font-bold text-brand-600">₹{item.price}</span>
                      <span className="text-xs text-slate-400">GST {item.gst}%</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card flex h-fit flex-col overflow-hidden">
            <div className="bg-slate-900 px-5 py-4 text-white">
              <p className="font-bold">Current Bill #{nextBillNo}</p>
              <p className="text-xs text-slate-300">{new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-4">
              <input
                type="text"
                placeholder="Table / No."
                value={tableOrNo}
                onChange={(e) => setTableOrNo(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
              <input
                type="text"
                placeholder="Customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div className="px-4 pb-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-slate-300">
                  <ShoppingCart size={28} />
                  <p className="text-sm text-slate-400">Tap items to add</p>
                </div>
              ) : (
                <div className="max-h-64 space-y-3 overflow-y-auto">
                  {cart.map((line) => (
                    <div key={line.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">{line.name}</p>
                        <p className="text-xs text-slate-400">
                          ₹{line.price} + {line.gst}% GST
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(line.id, -1)} className="rounded-md bg-slate-100 p-1 text-slate-600 hover:bg-slate-200">
                          <Minus size={12} />
                        </button>
                        <span className="w-4 text-center text-sm font-medium">{line.qty}</span>
                        <button onClick={() => updateQty(line.id, 1)} className="rounded-md bg-slate-100 p-1 text-slate-600 hover:bg-slate-200">
                          <Plus size={12} />
                        </button>
                        <span className="w-14 text-right text-sm font-semibold text-slate-800">₹{(line.price * line.qty).toFixed(0)}</span>
                        <button onClick={() => removeLine(line.id)} className="rounded-md p-1 text-danger-600 hover:bg-danger-50">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>GST</span>
                  <span>₹{gst.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900">
                  <span>Total</span>
                  <span>₹{total.toFixed(0)}</span>
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-slate-500">Payment Mode</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["Cash", "UPI", "Card"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={clsx(
                        "rounded-lg py-2 text-xs font-medium transition-colors",
                        mode === m ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleCollect}
                  disabled={cart.length === 0 || submitting}
                  className="flex-1 rounded-xl bg-success-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                >
                  {submitting ? "Collecting…" : `Collect ₹${total.toFixed(0)}`}
                </button>
                <button
                  onClick={resetBill}
                  title="Reset bill"
                  className="flex items-center justify-center rounded-xl bg-slate-100 px-3 text-slate-500 hover:bg-slate-200"
                >
                  <RefreshCcw size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <BillHistory orders={orders} loading={ordersLoading} />
      )}

      {paidOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-50">
              <CheckCircle2 size={28} className="text-success-600" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">Payment Collected!</h2>
            <p className="mt-1 text-sm text-slate-400">
              #{paidOrder.billNo} · {paidOrder.mode}
            </p>

            <div className="mt-5 rounded-xl border border-slate-200 p-4 text-left">
              <p className="font-bold text-slate-900">{restaurant?.name ?? "Your Restaurant"}</p>
              <p className="text-xs text-slate-400">
                {restaurant?.address || "Address not set"} · GSTIN: {restaurant?.gstin || "—"}
              </p>

              <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
                {paidOrder.items.map((line, i) => (
                  <div key={i} className="flex justify-between text-slate-700">
                    <span>
                      {line.name} ×{line.qty}
                    </span>
                    <span>₹{(line.price * line.qty).toFixed(0)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-slate-400">
                  <span>GST</span>
                  <span>₹{paidOrder.gstAmount.toFixed(0)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-1.5 text-base font-bold text-slate-900">
                  <span>Total Paid</span>
                  <span>₹{paidOrder.total.toFixed(0)}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Link
                to={`/billing/invoice/${paidOrder.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Download size={15} />
                View Invoice
              </Link>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(buildWhatsAppText(paidOrder, restaurant?.name ?? "Your Restaurant"))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-success-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
              >
                <MessageCircle size={15} />
                WhatsApp
              </a>
            </div>

            <button
              onClick={handleNewBillFromModal}
              className="mt-3 w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            >
              New Bill
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const modeColor: Record<string, string> = {
  Cash: "text-success-600",
  UPI: "text-purple-600",
  Card: "text-pink-600",
};

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function BillHistory({ orders, loading }: { orders: Order[]; loading: boolean }) {
  const { restaurant } = useAuth();

  const todaysOrders = useMemo(() => orders.filter((o) => isToday(o.createdAt) && o.status !== "Refunded"), [orders]);
  const todaysRevenue = todaysOrders.reduce((sum, o) => sum + o.total, 0);
  const nonRefunded = orders.filter((o) => o.status !== "Refunded");
  const avgBill = nonRefunded.length ? nonRefunded.reduce((sum, o) => sum + o.total, 0) / nonRefunded.length : 0;
  const pendingOrders = orders.filter((o) => o.status === "Pending");
  const pendingTotal = pendingOrders.reduce((sum, o) => sum + o.total, 0);

  function handleExportCsv() {
    const header = ["Bill No", "Date & Time", "Customer", "Items", "Amount", "Mode", "Status"];
    const rows = orders.map((o) => [
      o.billNo,
      new Date(o.createdAt).toLocaleString("en-US"),
      o.tableOrNo || o.customerName,
      o.items.length,
      o.total.toFixed(0),
      o.mode,
      o.status,
    ]);
    const csv = [header, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "bill-history.csv";
    link.click();
  }

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard data={{ label: "Today's Bills", value: `${todaysOrders.length}`, helpText: "Completed", icon: "FileText", accent: "brand" }} />
        <StatCard data={{ label: "Revenue", value: `₹${todaysRevenue.toLocaleString()}`, helpText: "Today", icon: "TrendingUp", accent: "success" }} />
        <StatCard data={{ label: "Avg. Bill", value: `₹${avgBill.toFixed(0)}`, helpText: "Per order", icon: "Hash", accent: "brand" }} />
        <StatCard
          data={{ label: "Pending", value: `₹${pendingTotal.toLocaleString()}`, helpText: `${pendingOrders.length} bills`, icon: "AlertTriangle", accent: "warning" }}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900">Recent Bills</h3>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-600"
          >
            <Download size={14} />
            Export
          </button>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-slate-400">Loading bill history…</p>
        ) : orders.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">No bills created yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Bill No</th>
                  <th className="px-5 py-3 font-medium">Date &amp; Time</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Items</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Mode</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="px-5 py-3 font-medium text-slate-800">#{o.billNo}</td>
                    <td className="px-5 py-3 text-slate-500">
                      {new Date(o.createdAt).toLocaleString("en-US", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{o.tableOrNo || o.customerName}</td>
                    <td className="px-5 py-3 text-slate-500">{o.items.length} items</td>
                    <td className="px-5 py-3 font-semibold text-slate-800">₹{o.total.toFixed(0)}</td>
                    <td className={clsx("px-5 py-3 font-medium", modeColor[o.mode])}>{o.mode}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/billing/invoice/${o.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                          title="View invoice"
                        >
                          <FileText size={14} />
                        </Link>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(buildWhatsAppText(o, restaurant?.name ?? "Your Restaurant"))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-success-50 hover:text-success-600"
                          title="Share via WhatsApp"
                        >
                          <MessageSquare size={14} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
