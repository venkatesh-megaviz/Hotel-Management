import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { fetchInventory, fetchStockEntries, createStockEntry, type InventoryItem, type StockEntry } from "@/lib/api";

const emptyForm = { item: "", quantity: "", unit: "", supplier: "", cost: "" };

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([fetchInventory(), fetchStockEntries()])
      .then(([inv, hist]) => {
        setItems(inv.items);
        setEntries(hist.entries);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createStockEntry({
        item: form.item,
        quantity: Number(form.quantity),
        unit: form.unit,
        supplier: form.supplier,
        cost: Number(form.cost || 0),
      });
      setForm(emptyForm);
      load();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="mb-1 text-xl font-bold text-slate-900">Inventory — Stock In</h2>
      <p className="mb-6 text-sm text-slate-500">Record stock received from suppliers</p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-1">
          <h3 className="mb-4 font-semibold text-slate-900">Add Stock Received</h3>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Select Item</label>
              <input
                type="text"
                required
                list="inventory-items"
                placeholder="e.g. Basmati Rice"
                value={form.item}
                onChange={(e) => setForm((f) => ({ ...f, item: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
              <datalist id="inventory-items">
                {items.map((i) => (
                  <option key={i.id} value={i.name} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Quantity</label>
                <input
                  type="number"
                  required
                  min={0}
                  placeholder="0"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Unit</label>
                <input
                  type="text"
                  required
                  placeholder="kg / L"
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Supplier Name</label>
              <input
                type="text"
                placeholder="e.g. Agro Traders"
                value={form.supplier}
                onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Purchase Cost (₹)</label>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={form.cost}
                onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              <Plus size={16} />
              {submitting ? "Adding…" : "Add to Stock"}
            </button>
          </form>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="mb-4 font-semibold text-slate-900">Stock In History</h3>
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
          ) : entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No stock entries yet.</p>
          ) : (
            <div className="max-h-[420px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-3 pr-4 font-medium">Date</th>
                    <th className="pb-3 pr-4 font-medium">Item</th>
                    <th className="pb-3 pr-4 font-medium">Quantity</th>
                    <th className="pb-3 pr-4 font-medium">Supplier</th>
                    <th className="pb-3 font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {entries.map((e) => (
                    <tr key={e.id}>
                      <td className="py-3 pr-4 text-slate-500">
                        {new Date(e.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                      </td>
                      <td className="py-3 pr-4 font-medium text-slate-800">{e.item}</td>
                      <td className="py-3 pr-4 font-semibold text-brand-600">
                        +{e.quantity} {e.unit}
                      </td>
                      <td className="py-3 pr-4 text-slate-500">{e.supplier || "—"}</td>
                      <td className="py-3 font-medium text-slate-800">₹{e.cost.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card mt-4 p-5">
        <h3 className="mb-4 font-semibold text-slate-900">Current Stock Levels</h3>
        {items.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">No items in stock yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {items.map((item) => {
              const low = item.quantity <= item.reorderLevel;
              return (
                <div key={item.id}>
                  <p className="text-sm text-slate-500">{item.name}</p>
                  <p className={low ? "text-lg font-bold text-danger-600" : "text-lg font-bold text-slate-900"}>
                    {item.quantity} <span className="text-sm font-normal text-slate-400">{item.unit}</span>
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
