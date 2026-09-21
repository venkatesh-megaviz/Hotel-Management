import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, CheckCircle2, XCircle, ChevronLeft } from "lucide-react";
import clsx from "clsx";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import {
  fetchMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  type MenuItem,
  type MenuItemInput,
} from "@/lib/api";

const MENU_CATEGORIES = ["Starters", "Main Course", "Breads", "Biryani", "Beverages", "Desserts", "Accompaniments"];

const emptyForm: MenuItemInput = { name: "", category: "Main Course", price: 0, gst: 5, foodType: "Veg", available: true };

type View = "list" | "form";

export default function MenuManagement() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<View>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MenuItemInput>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetchMenuItems()
      .then((res) => setItems(res.items))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set([...MENU_CATEGORIES, ...items.map((i) => i.category)]))],
    [items],
  );

  const filtered = items.filter(
    (i) =>
      (activeCategory === "All" || i.category === activeCategory) &&
      i.name.toLowerCase().includes(search.toLowerCase()),
  );

  async function toggleAvailability(item: MenuItem) {
    const updated = await updateMenuItem(item.id, { available: !item.available });
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated.item : i)));
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this menu item?")) return;
    await deleteMenuItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function handleCancel() {
    setView("list");
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setView("form");
  }

  function openEdit(item: MenuItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      price: item.price,
      gst: item.gst,
      foodType: item.foodType,
      available: item.available,
    });
    setError(null);
    setView("form");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Enter an item name");
      return;
    }
    if (!form.price || form.price <= 0) {
      setError("Price must be greater than 0");
      return;
    }
    if (form.gst < 0 || form.gst > 28) {
      setError("GST must be between 0% and 28%");
      return;
    }
    const duplicate = items.find(
      (i) => i.id !== editingId && i.name.trim().toLowerCase() === form.name.trim().toLowerCase(),
    );
    if (duplicate) {
      setError("A menu item with this name already exists");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        const res = await updateMenuItem(editingId, form);
        setItems((prev) => prev.map((i) => (i.id === editingId ? res.item : i)));
      } else {
        const res = await createMenuItem(form);
        setItems((prev) => [res.item, ...prev]);
      }
      setView("list");
      setEditingId(null);
      setForm(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save menu item");
    } finally {
      setSubmitting(false);
    }
  }

  const availableCount = items.filter((i) => i.available).length;
  const offCount = items.length - availableCount;
  const isEditing = Boolean(editingId);
  const hasActiveSearch = Boolean(search.trim()) || activeCategory !== "All";

  if (view === "form") {
    return (
      <div>
        <PageHeader title="Menu Management" subtitle="Categories, pricing, GST, and availability" />
        <button
          onClick={handleCancel}
          className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ChevronLeft size={16} />
          Back to list
        </button>

        <div className="card max-w-xl p-6">
          <h3 className="text-base font-semibold text-slate-900">
            {isEditing ? "Edit Menu Item" : "Add New Menu Item"}
          </h3>
          <p className="mb-5 text-xs text-slate-400">
            {isEditing ? "Update the details below" : "Fill in the details below"}
          </p>

          {error && (
            <p className="mb-4 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Field label="Item Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="e.g. Butter Chicken" />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                >
                  {MENU_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Item Type</label>
                <select
                  value={form.foodType}
                  onChange={(e) => setForm((f) => ({ ...f, foodType: e.target.value as MenuItemInput["foodType"] }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                >
                  <option value="Veg">Veg</option>
                  <option value="Non-Veg">Non-Veg</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Price (₹)"
                type="number"
                value={form.price ? String(form.price) : ""}
                onChange={(v) => setForm((f) => ({ ...f, price: Number(v) || 0 }))}
                placeholder="0.00"
              />
              <Field
                label="GST Rate (%)"
                type="number"
                value={String(form.gst)}
                onChange={(v) => setForm((f) => ({ ...f, gst: Math.min(28, Math.max(0, Number(v) || 0)) }))}
                placeholder="5"
              />
            </div>
            <p className="-mt-2 text-xs text-slate-400">Allowed GST slabs: 0–28%</p>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.available}
                onChange={(e) => setForm((f) => ({ ...f, available: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-100"
              />
              Available on menu
            </label>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {submitting ? "Saving…" : isEditing ? "Save Changes" : "Add to Menu"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          <>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="card h-24 animate-pulse bg-slate-100" />
            ))}
          </>
        ) : (
          <>
            <StatCard data={{ label: "Total Items", value: `${items.length}`, helpText: "in menu", icon: "BookOpen", accent: "brand" }} />
            <StatCard data={{ label: "Available", value: `${availableCount}`, helpText: "Active now", icon: "CheckCircle2", accent: "success" }} />
            <StatCard data={{ label: "Off Menu", value: `${offCount}`, helpText: "Hidden from billing", icon: "XCircle", accent: "danger" }} />
            <StatCard data={{ label: "Categories", value: `${categories.length - 1}`, helpText: "Menu sections", icon: "Hash", accent: "warning" }} />
          </>
        )}
      </div>

      <PageHeader
        title="Menu Management"
        subtitle="Categories, pricing, GST, and availability"
        action={
          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus size={16} />
            Add Item
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={clsx(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                activeCategory === cat ? "bg-brand-600 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-sm text-slate-400">Loading menu…</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">
            {hasActiveSearch ? "No items match your search." : "No menu items yet. Add your first item."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="bg-slate-50">
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="w-[28%] px-5 py-3 font-medium">Item</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Price</th>
                  <th className="px-5 py-3 font-medium">GST</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Availability</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td className="max-w-0 truncate px-5 py-3 font-medium text-slate-800" title={item.name}>
                      {item.name}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{item.category}</td>
                    <td className="px-5 py-3 text-slate-700">₹{item.price}</td>
                    <td className="px-5 py-3 text-slate-500">{item.gst}%</td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span className={clsx("h-2 w-2 rounded-full", item.foodType === "Veg" ? "bg-success-600" : "bg-danger-600")} />
                        {item.foodType}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggleAvailability(item)}
                        className={clsx(
                          "flex items-center gap-1 text-xs font-medium",
                          item.available ? "text-success-600" : "text-slate-400",
                        )}
                      >
                        {item.available ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        {item.available ? "Available" : "Off"}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                          title="Edit item"
                          aria-label={`Edit ${item.name}`}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-danger-50 hover:text-danger-600"
                        >
                          <Trash2 size={14} />
                        </button>
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

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        required
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );
}
