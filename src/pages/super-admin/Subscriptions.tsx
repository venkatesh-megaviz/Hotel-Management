import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Plus, X } from "lucide-react";
import clsx from "clsx";
import { ApiError, createSaPlan, fetchSaPlans, updateSaPlan, type SaPlan } from "@/lib/api";

type PlanDraft = {
  id: string | null;
  name: string;
  price: string;
  status: "ACTIVE" | "COMING SOON";
  featuresText: string;
  modules: string[];
};

function formatInr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

const MODULE_ORDER = [
  "Billing",
  "Menu",
  "Operations",
  "Customer CRM",
  "Finance",
  "Inventory",
  "Staff",
  "Website Orders",
] as const;

const PLAN_ACCENT: Record<string, string> = {
  basic: "is-basic",
  classic: "is-classic",
  advanced: "is-advanced",
};

const FEATURE_PREVIEW = 5;

const EMPTY_PLAN: PlanDraft = {
  id: null,
  name: "",
  price: "",
  status: "ACTIVE",
  featuresText: "",
  modules: ["Billing", "Menu"],
};

export default function Subscriptions() {
  const [plans, setPlans] = useState<SaPlan[]>([]);
  const [events, setEvents] = useState<
    { restaurant: string; event: string; plan: string; amount: string; date: string; tone: string }[]
  >([]);
  const [editing, setEditing] = useState<PlanDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    fetchSaPlans()
      .then((res) => {
        setPlans(res.plans);
        setEvents(res.events);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEditing(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing]);

  function openEdit(plan: SaPlan) {
    setSaveError("");
    setEditing({
      id: plan.id,
      name: plan.name,
      price: String(plan.price),
      status: plan.status,
      featuresText: plan.features.join("\n"),
      modules: [...plan.modulesList],
    });
  }

  function openNew() {
    setSaveError("");
    setEditing({ ...EMPTY_PLAN });
  }

  function toggleModule(name: string) {
    if (!editing) return;
    setEditing({
      ...editing,
      modules: editing.modules.includes(name)
        ? editing.modules.filter((m) => m !== name)
        : [...editing.modules, name],
    });
  }

  async function savePlan() {
    if (!editing) return;
    if (!editing.name.trim()) {
      setSaveError("Plan name is required");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const features = editing.featuresText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const payload = {
        name: editing.name.trim(),
        price: Number(editing.price) || 0,
        status: editing.status,
        features,
        modules: editing.modules,
      };
      if (editing.id) {
        const res = await updateSaPlan(editing.id, payload);
        setPlans((prev) => prev.map((p) => (p.id === res.plan.id ? res.plan : p)));
      } else {
        const res = await createSaPlan(payload);
        setPlans((prev) => [...prev, res.plan]);
      }
      setEditing(null);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Failed to save plan");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="sa-card">Loading subscriptions…</div>;

  const isNew = editing && !editing.id;

  return (
    <div className="sa-stack">
      <div className="sa-section-head sa-section-head-plans">
        <div>
          <h2>Plan Management</h2>
          <p>{plans.length} active plans · Edit pricing, features, and module access per plan.</p>
        </div>
        <button type="button" className="sa-btn is-primary is-new-plan" onClick={openNew}>
          <Plus size={15} strokeWidth={2.5} /> New Plan
        </button>
      </div>

      <div className="sa-plan-grid">
        {plans.map((plan) => {
          const accent = PLAN_ACCENT[plan.slug] || PLAN_ACCENT[plan.name.toLowerCase()] || "is-basic";
          const visible = plan.features.slice(0, FEATURE_PREVIEW);
          const extra = Math.max(0, plan.features.length - FEATURE_PREVIEW);

          return (
            <article key={plan.id} className={clsx("sa-plan-card", accent)}>
              <div className="sa-plan-card-body">
                <div className="sa-plan-card-top">
                  <div>
                    <p className="sa-plan-name">{plan.name}</p>
                    <strong className="sa-plan-price">{formatInr(plan.price)}/mo</strong>
                  </div>
                  <span
                    className={clsx(
                      "sa-plan-flag",
                      plan.status === "ACTIVE" ? "is-active" : "is-soon",
                    )}
                  >
                    {plan.status}
                  </span>
                </div>

                <div className="sa-plan-stats">
                  <div>
                    <em>{plan.tenants}</em>
                    <span>tenants</span>
                  </div>
                  <div>
                    <em>{plan.mrrLabel}</em>
                    <span>MRR</span>
                  </div>
                  <div>
                    <em>{plan.modules}</em>
                    <span>modules</span>
                  </div>
                </div>

                <ul className="sa-plan-features">
                  {visible.map((f) => (
                    <li key={f}>
                      <span className="sa-plan-check">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                  {extra > 0 && <li className="sa-plan-more">+ {extra} more features</li>}
                </ul>
              </div>

              <div className="sa-plan-actions">
                <button type="button" className="sa-plan-btn is-edit" onClick={() => openEdit(plan)}>
                  Edit Plan
                </button>
                <Link to="/admin/tenants" className="sa-plan-btn is-view">
                  View Tenants
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <div className="sa-card sa-events-card">
        <div className="sa-card-head">
          <div>
            <h2>Recent Subscription Events</h2>
            <p>Latest billing activity across tenants</p>
          </div>
          <button type="button" className="sa-btn is-ghost">
            Export CSV
          </button>
        </div>
        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Restaurant</th>
                <th>Event</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={`${e.restaurant}-${e.date}-${e.event}`}>
                  <td>
                    <strong>{e.restaurant}</strong>
                  </td>
                  <td>
                    <span className={`sa-event is-${e.tone}`}>{e.event}</span>
                  </td>
                  <td>
                    <span className={`sa-plan is-${e.plan.toLowerCase()}`}>{e.plan}</span>
                  </td>
                  <td>{e.amount}</td>
                  <td>{e.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="sa-modal-backdrop" onClick={() => setEditing(null)}>
          <div
            className="sa-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sa-edit-plan-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sa-modal-head">
              <div>
                <h2 id="sa-edit-plan-title">{isNew ? "New Plan" : "Edit Plan"}</h2>
                <p>
                  {isNew
                    ? "Create a plan with pricing, features, and module access"
                    : `Editing ${editing.name} plan — changes apply immediately`}
                </p>
              </div>
              <button type="button" className="sa-modal-close" onClick={() => setEditing(null)} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="sa-modal-body">
              <label className="sa-field">
                <span>Plan Name</span>
                <input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </label>

              <label className="sa-field">
                <span>Price Per Month (₹)</span>
                <input
                  value={editing.price}
                  onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                />
              </label>

              <div className="sa-field">
                <span>Status</span>
                <div className="sa-status-toggle">
                  <button
                    type="button"
                    className={clsx(editing.status === "ACTIVE" && "is-active")}
                    onClick={() => setEditing({ ...editing, status: "ACTIVE" })}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    className={clsx(editing.status === "COMING SOON" && "is-active")}
                    onClick={() => setEditing({ ...editing, status: "COMING SOON" })}
                  >
                    Coming Soon
                  </button>
                </div>
              </div>

              <label className="sa-field">
                <span>Features (one per line)</span>
                <textarea
                  rows={7}
                  value={editing.featuresText}
                  onChange={(e) => setEditing({ ...editing, featuresText: e.target.value })}
                />
              </label>

              <div className="sa-field">
                <span>Module Access</span>
                <div className="sa-module-access">
                  {MODULE_ORDER.map((name) => {
                    const on = editing.modules.includes(name);
                    return (
                      <button
                        key={name}
                        type="button"
                        className={clsx("sa-module-chip", on && "is-on")}
                        onClick={() => toggleModule(name)}
                      >
                        {on && <Check size={13} strokeWidth={3} />}
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
              {saveError && <p className="sa-field-error">{saveError}</p>}
            </div>

            <div className="sa-modal-foot">
              <button type="button" className="sa-btn is-primary" disabled={saving} onClick={savePlan}>
                {saving ? "Saving…" : isNew ? "Create Plan" : "Save Changes"}
              </button>
              <button type="button" className="sa-btn is-ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
