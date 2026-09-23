import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { AlertTriangle, ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import {
  fetchMenuItems,
  fetchRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  type MenuItem,
  type Recipe,
  type RecipeInput,
  type RecipeIngredient,
} from "@/lib/api";

type Tab = "recipes" | "cost" | "add";

const emptyIngredient: RecipeIngredient = { name: "", qty: "", cost: 0 };
const emptyForm: RecipeInput = {
  name: "",
  category: "Starters",
  salePrice: 0,
  ingredients: [{ ...emptyIngredient }, { ...emptyIngredient }, { ...emptyIngredient }],
  menuItemId: "",
};

export default function RecipeManagement() {
  const [tab, setTab] = useState<Tab>("recipes");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [summary, setSummary] = useState({ total: 0, avgMargin: 0, avgCost: 0, avgPrice: 0 });
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState<RecipeInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([fetchRecipes(), fetchMenuItems()])
      .then(([recipeRes, menuRes]) => {
        setRecipes(recipeRes.recipes);
        setSummary(recipeRes.summary);
        setMenuItems(menuRes.items);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab !== "add") load();
    else {
      fetchMenuItems().then((res) => setMenuItems(res.items));
    }
  }, [tab, load]);

  const linkedIds = useMemo(
    () => new Set(recipes.map((r) => r.menuItemId).filter(Boolean) as string[]),
    [recipes],
  );

  const selectableMenu = useMemo(
    () =>
      menuItems.filter(
        (m) => !linkedIds.has(m.id) || (editingId && recipes.find((r) => r.id === editingId)?.menuItemId === m.id),
      ),
    [menuItems, linkedIds, editingId, recipes],
  );

  const ingredientCost = form.ingredients.reduce((s, i) => s + (Number(i.cost) || 0), 0);
  const previewMargin =
    form.salePrice > 0 ? Math.round(((form.salePrice - ingredientCost) / form.salePrice) * 1000) / 10 : 0;
  const negativeMargin = form.salePrice > 0 && previewMargin < 0;

  function selectMenuItem(id: string) {
    const item = menuItems.find((m) => m.id === id);
    if (!item) {
      setForm((f) => ({ ...f, menuItemId: "" }));
      return;
    }
    setForm((f) => ({
      ...f,
      menuItemId: item.id,
      name: item.name,
      category: item.category,
      salePrice: item.price,
    }));
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.menuItemId) {
      setFormError("Select a menu item for this recipe");
      return;
    }
    if (negativeMargin) {
      const ok = confirm(
        `Warning: this recipe has a negative margin (${previewMargin}%). Cost is higher than the menu sale price. Save anyway?`,
      );
      if (!ok) return;
    }

    setSubmitting(true);
    try {
      const ingredients = form.ingredients.filter((i) => i.name.trim());
      const payload = {
        menuItemId: form.menuItemId,
        name: form.name,
        category: form.category,
        salePrice: form.salePrice,
        ingredients,
      };
      if (editingId) {
        await updateRecipe(editingId, payload);
      } else {
        await createRecipe(payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      setTab("recipes");
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save recipe");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(recipe: Recipe) {
    setEditingId(recipe.id);
    setForm({
      name: recipe.name,
      category: recipe.category,
      salePrice: recipe.salePrice,
      ingredients: recipe.ingredients.length ? recipe.ingredients : [{ ...emptyIngredient }],
      menuItemId: recipe.menuItemId || "",
    });
    setFormError(null);
    setTab("add");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this recipe?")) return;
    await deleteRecipe(id);
    load();
  }

  function updateIngredient(index: number, field: keyof RecipeIngredient, value: string | number) {
    setForm((f) => ({
      ...f,
      ingredients: f.ingredients.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing)),
    }));
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Recipe Management" subtitle="Manage recipes, ingredients and food cost" />

      <div className="inline-flex rounded-xl bg-slate-100 p-1">
        {(
          [
            ["recipes", "Recipes"],
            ["cost", "Cost Analysis"],
            ["add", editingId ? "Edit Recipe" : "Add Recipe"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              if (key === "add" && !editingId) {
                setForm(emptyForm);
                setEditingId(null);
                setFormError(null);
              }
              setTab(key);
            }}
            className={clsx(
              "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              tab === key ? "bg-brand-600 text-white" : "text-slate-500 hover:text-slate-700",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "recipes" && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(
              [
                ["Total Recipes", summary.total, "text-brand-700 bg-brand-50"],
                ["Avg Margin", `${summary.avgMargin}%`, "text-emerald-700 bg-emerald-50"],
                ["Avg Cost", `₹${summary.avgCost}`, "text-orange-700 bg-orange-50"],
                ["Avg Price", `₹${summary.avgPrice}`, "text-purple-700 bg-purple-50"],
              ] as const
            ).map(([label, value, cls]) => (
              <div key={label} className={clsx("rounded-2xl p-4 text-center", cls.split(" ").slice(2).join(" "))}>
                <p className={clsx("text-2xl font-bold", cls.split(" ")[0])}>{value}</p>
                <p className={clsx("text-sm font-medium", cls.split(" ")[0])}>{label}</p>
              </div>
            ))}
          </div>

          {loading ? (
            <p className="py-12 text-center text-sm text-slate-400">Loading recipes…</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {recipes.map((recipe) => (
                <div key={recipe.id} className="card p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{recipe.name}</p>
                      <p className="text-sm text-slate-500">{recipe.category}</p>
                    </div>
                    <span
                      className={clsx(
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        recipe.margin < 0 ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700",
                      )}
                    >
                      {recipe.margin}% margin
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400">Cost Price</p>
                      <p className="text-lg font-bold text-slate-900">₹{recipe.costPrice}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Sale Price</p>
                      <p className="text-lg font-bold text-slate-900">₹{recipe.salePrice}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => startEdit(recipe)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      onClick={() => setExpanded(expanded === recipe.id ? null : recipe.id)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-slate-50 py-2 text-xs font-medium text-slate-500 hover:text-slate-700"
                    >
                      {expanded === recipe.id ? "Hide" : "Details"}
                      {expanded === recipe.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                  {expanded === recipe.id && (
                    <ul className="mt-2 space-y-1 border-t border-slate-100 pt-3">
                      {recipe.ingredients.map((ing, i) => (
                        <li key={i} className="flex justify-between text-sm text-slate-600">
                          <span>
                            {ing.name} ({ing.qty})
                          </span>
                          <span>₹{ing.cost}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "cost" && (
        <div className="card overflow-hidden">
          {loading ? (
            <p className="p-8 text-center text-sm text-slate-400">Loading…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-3 font-medium">Dish</th>
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium">Cost</th>
                    <th className="px-5 py-3 font-medium">Sale Price</th>
                    <th className="px-5 py-3 font-medium">Gross Profit</th>
                    <th className="px-5 py-3 font-medium">Margin</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recipes.map((r) => (
                    <tr key={r.id}>
                      <td className="px-5 py-3 font-medium text-slate-800">{r.name}</td>
                      <td className="px-5 py-3 text-slate-500">{r.category}</td>
                      <td className="px-5 py-3 text-slate-700">₹{r.costPrice}</td>
                      <td className="px-5 py-3 text-slate-700">₹{r.salePrice}</td>
                      <td className={clsx("px-5 py-3 font-medium", r.grossProfit < 0 ? "text-red-600" : "text-emerald-600")}>
                        ₹{r.grossProfit}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={clsx(
                            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            r.margin < 0 ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700",
                          )}
                        >
                          {r.margin}%
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => startEdit(r)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-600"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
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
      )}

      {tab === "add" && (
        <div className="card max-w-2xl p-6">
          <h3 className="text-base font-semibold text-slate-900">{editingId ? "Edit Recipe" : "Add New Recipe"}</h3>
          <p className="mb-5 text-xs text-slate-400">Link a menu item and define ingredients</p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Menu Item</label>
              <select
                required
                value={form.menuItemId || ""}
                onChange={(e) => selectMenuItem(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              >
                <option value="">Select from menu…</option>
                {selectableMenu.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} · {m.category} · ₹{m.price}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400">Name, category and sale price sync from the menu item.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Category</label>
                <input
                  readOnly
                  value={form.category}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Sale Price (₹)</label>
                <input
                  readOnly
                  value={form.salePrice || ""}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600"
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Ingredients</p>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-xs font-medium uppercase text-slate-400">
                  <span>Name</span>
                  <span>Qty</span>
                  <span>Cost (₹)</span>
                </div>
                {form.ingredients.map((ing, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2">
                    <input
                      placeholder="Ingredient"
                      value={ing.name}
                      onChange={(e) => updateIngredient(i, "name", e.target.value)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
                    />
                    <input
                      placeholder="100g"
                      value={ing.qty}
                      onChange={(e) => updateIngredient(i, "qty", e.target.value)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
                    />
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={ing.cost || ""}
                      onChange={(e) => updateIngredient(i, "cost", Number(e.target.value) || 0)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, ingredients: [...f.ingredients, { ...emptyIngredient }] }))}
                className="mt-2 flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
              >
                <Plus size={14} />
                Add Ingredient
              </button>
            </div>

            {form.salePrice > 0 && (
              <div
                className={clsx(
                  "flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm",
                  negativeMargin ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700",
                )}
              >
                {negativeMargin && <AlertTriangle size={16} className="mt-0.5 shrink-0" />}
                <span>
                  Estimated margin: <strong>{previewMargin}%</strong> (cost ₹{ingredientCost} / sale ₹{form.salePrice})
                  {negativeMargin ? " — cost exceeds sale price." : ""}
                </span>
              </div>
            )}

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Save Recipe"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
