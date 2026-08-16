import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import clsx from "clsx";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { ApiError, fetchGuestQRMenu, submitGuestQROrder, type GuestMenuItem } from "@/lib/api";

type CartLine = GuestMenuItem & { qty: number };

export default function QRGuestOrder() {
  const { tableId = "" } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [menu, setMenu] = useState<GuestMenuItem[]>([]);
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!tableId) return;
    setLoading(true);
    fetchGuestQRMenu(tableId)
      .then((res) => {
        setRestaurantName(res.restaurant.name);
        setTableNumber(res.table.number);
        setMenu(res.menu);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Unable to load menu"))
      .finally(() => setLoading(false));
  }, [tableId]);

  const categories = useMemo(() => ["All", ...new Set(menu.map((m) => m.category))], [menu]);
  const filtered = category === "All" ? menu : menu.filter((m) => m.category === category);
  const total = cart.reduce((s, line) => s + line.price * line.qty * (1 + line.gst / 100), 0);

  function addToCart(item: GuestMenuItem) {
    setCart((prev) => {
      const existing = prev.find((l) => l.id === item.id);
      if (existing) return prev.map((l) => (l.id === item.id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { ...item, qty: 1 }];
    });
  }

  function changeQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    );
  }

  async function handleSubmit() {
    if (cart.length === 0) return;
    setSubmitting(true);
    setError("");
    try {
      await submitGuestQROrder(tableId, {
        customerName: customerName.trim() || "Table Guest",
        items: cart.map((line) => ({
          name: line.name,
          price: line.price,
          qty: line.qty,
          gst: line.gst,
        })),
      });
      setSuccess("Order sent to the kitchen! The staff will confirm shortly.");
      setCart([]);
      setCustomerName("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="py-24 text-center text-sm text-slate-400">Loading menu…</p>;
  }

  if (error && !restaurantName) {
    return <p className="py-24 text-center text-sm text-red-600">{error}</p>;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-[#155DFC]">{restaurantName}</p>
        <h1 className="text-xl font-bold text-slate-900">Table {tableNumber}</h1>
        <p className="text-sm text-slate-500">Scan & order — no app required</p>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 p-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={clsx(
                  "rounded-full px-3 py-1.5 text-xs font-semibold",
                  category === c ? "bg-[#155DFC] text-white" : "bg-white text-slate-600 ring-1 ring-slate-200",
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((item) => (
              <div key={item.id} className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.category} · {item.foodType}</p>
                  </div>
                  <p className="font-bold text-slate-900">₹{item.price}</p>
                </div>
                <button
                  onClick={() => addToCart(item)}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#155DFC] py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  <Plus size={14} />
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="h-fit rounded-2xl bg-white p-4 ring-1 ring-slate-100 lg:sticky lg:top-4">
          <div className="mb-4 flex items-center gap-2">
            <ShoppingBag size={18} className="text-[#155DFC]" />
            <h2 className="font-bold text-slate-900">Your Order</h2>
          </div>

          <input
            type="text"
            placeholder="Your name (optional)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="mb-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#155DFC]"
          />

          {cart.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">Add items from the menu</p>
          ) : (
            <ul className="space-y-3">
              {cart.map((line) => (
                <li key={line.id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-800">{line.name}</p>
                    <p className="text-xs text-slate-400">₹{line.price} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => changeQty(line.id, -1)} className="rounded-lg bg-slate-100 p-1 text-slate-600">
                      <Minus size={14} />
                    </button>
                    <span className="w-4 text-center font-semibold">{line.qty}</span>
                    <button onClick={() => changeQty(line.id, 1)} className="rounded-lg bg-slate-100 p-1 text-slate-600">
                      <Plus size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total (incl. GST)</span>
              <span className="font-bold text-slate-900">₹{total.toFixed(0)}</span>
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {success && <p className="mt-3 text-sm text-[#009966]">{success}</p>}

          <button
            disabled={cart.length === 0 || submitting}
            onClick={handleSubmit}
            className="mt-4 w-full rounded-xl bg-[#009966] py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Sending order…" : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
