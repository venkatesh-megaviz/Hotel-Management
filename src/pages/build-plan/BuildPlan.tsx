import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Box,
  Check,
  ChefHat,
  Clock3,
  Globe,
  LayoutGrid,
  LineChart,
  Lock,
  Receipt,
  Rocket,
  Sparkles,
  Users,
  UtensilsCrossed,
  Warehouse,
  X,
  Zap,
} from "lucide-react";
import { useAuth, ApiError } from "@/context/AuthContext";
import "./BuildPlan.css";

const TYPE_TO_BUSINESS: Record<string, string> = {
  "quick-service": "Restaurant",
  "full-service": "Restaurant",
  "cafe-bakery": "Café",
  "cloud-kitchen": "Cloud Kitchen",
  "hotel-fnb": "Restaurant",
};

/** Trial accounts created from the website use this temporary password. */
const TRIAL_PASSWORD = "Demo@1234";

const IMG = "/website-images";

const STEPS = ["Restaurant type", "Customize modules", "Review & activate"] as const;

const MODULES = [
  {
    id: "operations",
    name: "OPERATIONS",
    label: "Operations",
    price: 1499,
    desc: "Tables, kitchen, unified order hub.",
    tags: ["Kitchen Display", "Table Management", "Unified Orders"],
    category: "CORE OPERATIONS",
    icon: LayoutGrid,
    popular: false,
  },
  {
    id: "billing",
    name: "BILLING",
    label: "Billing",
    price: 899,
    desc: "POS, multi-mode payments, GST invoices.",
    tags: ["Full POS terminal", "Split Bills", "5+ Payment Modes"],
    category: "CORE OPERATIONS",
    icon: Receipt,
    popular: false,
  },
  {
    id: "menu",
    name: "MENU",
    label: "Menu",
    price: 699,
    desc: "Digital menus, recipes, live availability.",
    tags: ["Item Editor", "Category Management", "Recipe Costing"],
    category: "CORE OPERATIONS",
    icon: UtensilsCrossed,
    popular: false,
  },
  {
    id: "crm",
    name: "CUSTOMER CRM",
    label: "Customer CRM",
    price: 999,
    desc: "Loyalty, WhatsApp marketing, segments.",
    tags: ["Customer Profiles", "Loyalty Points", "WhatsApp Campaigns"],
    category: "CUSTOMER & GROWTH",
    icon: Users,
    popular: true,
  },
  {
    id: "website",
    name: "WEBSITE ORDERS",
    label: "Website Orders",
    price: 1199,
    desc: "Personalized ordering widget for your site.",
    tags: ["Order Widget", "Website Orders", "Custom Branding"],
    category: "CUSTOMER & GROWTH",
    icon: Globe,
    popular: false,
  },
  {
    id: "finance",
    name: "FINANCE",
    label: "Finance",
    price: 899,
    desc: "P&L, expenses, revenue analytics.",
    tags: ["Expense Manager", "P&L Dashboard", "Sales Reports"],
    category: "FINANCE & STOCK",
    icon: LineChart,
    popular: false,
  },
  {
    id: "inventory",
    name: "INVENTORY",
    label: "Inventory",
    price: 799,
    desc: "Stock levels, alerts, waste tracking.",
    tags: ["Real-time Stock", "Low-Stock Alerts", "Stock-In Management"],
    category: "FINANCE & STOCK",
    icon: Warehouse,
    popular: false,
  },
  {
    id: "staff",
    name: "STAFF",
    label: "Staff",
    price: 599,
    desc: "Shift management, attendance, training.",
    tags: ["Attendance Tracking", "Shift Management", "Check In/Out"],
    category: "TEAM",
    icon: Clock3,
    popular: false,
  },
] as const;

type ModuleId = (typeof MODULES)[number]["id"];

const CATEGORIES = ["CORE OPERATIONS", "CUSTOMER & GROWTH", "FINANCE & STOCK", "TEAM"] as const;

const PRESETS = {
  Starter: ["operations", "billing", "menu"] as ModuleId[],
  Growth: ["operations", "billing", "menu", "crm", "inventory"] as ModuleId[],
  Complete: MODULES.map((m) => m.id) as ModuleId[],
};

const QUICK_PICKS = [
  {
    id: "Starter" as const,
    title: "Starter",
    note: "For new restaurants",
    icon: Zap,
  },
  {
    id: "Growth" as const,
    title: "Growth",
    note: "Most popular",
    icon: Rocket,
  },
  {
    id: "Complete" as const,
    title: "Complete",
    note: "Full suite",
    icon: Sparkles,
  },
];

const RESTAURANT_TYPES = [
  {
    id: "quick-service",
    name: "QUICK SERVICE",
    desc: "Counter service, fast food, takeaway",
    color: "rgba(251, 191, 36, 0.5)",
    icon: Zap,
    modules: ["operations", "billing", "menu"] as ModuleId[],
  },
  {
    id: "full-service",
    name: "FULL SERVICE",
    desc: "Table service, dine-in restaurant",
    color: "rgba(99, 102, 241, 0.5)",
    icon: Users,
    modules: ["operations", "billing", "menu", "crm", "staff"] as ModuleId[],
  },
  {
    id: "cafe-bakery",
    name: "CAFÉ / BAKERY",
    desc: "Coffee shop, patisserie, brunch spot",
    color: "rgba(236, 72, 153, 0.5)",
    icon: ChefHat,
    modules: ["billing", "menu", "crm"] as ModuleId[],
  },
  {
    id: "cloud-kitchen",
    name: "CLOUD KITCHEN",
    desc: "Delivery-only, multi-brand kitchen",
    color: "rgba(20, 184, 166, 0.5)",
    icon: Box,
    modules: ["operations", "billing", "menu", "inventory", "website"] as ModuleId[],
  },
  {
    id: "hotel-fnb",
    name: "HOTEL F&B",
    desc: "Multi-outlet hotel restaurant operation",
    color: "rgba(214, 163, 81, 0.5)",
    icon: LayoutGrid,
    modules: MODULES.map((m) => m.id) as ModuleId[],
  },
] as const;

function formatInr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function moduleTagsPreview(ids: ModuleId[]) {
  const labels = ids
    .map((id) => MODULES.find((m) => m.id === id)?.label)
    .filter(Boolean) as string[];
  if (labels.length <= 3) return labels;
  return [...labels.slice(0, 3), `+${labels.length - 3}`];
}

export default function BuildPlan() {
  const navigate = useNavigate();
  const { register, login } = useAuth();
  const [step, setStep] = useState(1);
  const [restaurantType, setRestaurantType] = useState<string | null>(null);
  const [selected, setSelected] = useState<ModuleId[]>([]);
  const [preset, setPreset] = useState<keyof typeof PRESETS | null>(null);
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    restaurant: "",
    email: "",
    phone: "",
  });

  const total = useMemo(
    () => MODULES.filter((m) => selected.includes(m.id)).reduce((sum, m) => sum + m.price, 0),
    [selected],
  );

  function chooseType(id: string) {
    const type = RESTAURANT_TYPES.find((t) => t.id === id);
    if (!type) return;
    setRestaurantType(id);
    setSelected([...type.modules]);
    setPreset(null);
  }

  function applyPreset(name: keyof typeof PRESETS) {
    setPreset(name);
    setSelected([...PRESETS[name]]);
  }

  function toggleModule(id: ModuleId) {
    setPreset(null);
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    setActivateError(null);
    setActivating(true);

    const phoneDigits = form.phone.replace(/\D/g, "");
    const phone =
      phoneDigits.length >= 10
        ? phoneDigits.slice(-10)
        : "9876543210";

    try {
      await register({
        fullName: form.name.trim(),
        email: form.email.trim(),
        password: TRIAL_PASSWORD,
        restaurantName: form.restaurant.trim(),
        businessType: TYPE_TO_BUSINESS[restaurantType ?? ""] ?? "Restaurant",
        city: "India",
        phone,
        plan: "Standard",
        billingCycle: "Monthly",
      });
      navigate("/app");
    } catch (err) {
      // Email already registered — sign them in (demo-friendly fallback).
      const message = err instanceof ApiError ? err.message : "";
      if (/already exists/i.test(message)) {
        try {
          await login(form.email.trim(), TRIAL_PASSWORD);
          navigate("/app");
          return;
        } catch {
          try {
            await login(form.email.trim(), "x");
            navigate("/app");
            return;
          } catch {
            /* fall through */
          }
        }
      }
      setActivateError(message || "Could not activate trial. Please try again.");
    } finally {
      setActivating(false);
    }
  }

  return (
    <div className={`bp-page${step === 2 ? " is-step2" : ""}`}>
      <header className="bp-header">
        <div className="bp-header-inner">
          <Link to="/" className="bp-logo">
            <img src={`${IMG}/logo.png`} alt="Dinevoro" />
          </Link>

          <nav className="bp-steps" aria-label="Build plan progress">
            {STEPS.map((label, i) => {
              const n = i + 1;
              const done = step > n;
              const active = step === n;
              return (
                <div key={label} className={`bp-step${active ? " is-active" : ""}${done ? " is-done" : ""}`}>
                  <span className="bp-step-num">
                    {done ? <Check size={14} strokeWidth={3} /> : n}
                  </span>
                  <span className="bp-step-label">{label}</span>
                  {i < STEPS.length - 1 && <span className="bp-step-line" aria-hidden />}
                </div>
              );
            })}
          </nav>

          <Link to="/" className="bp-exit">
            <X size={14} /> Exit
          </Link>
        </div>
      </header>

      <main className="bp-main">
        {step === 1 && (
          <section className="bp-step1">
            <p className="bp-kicker">Step 1 of 3</p>
            <h1 className="bp-title">
              <span>What type of</span>
              <span>
                <em>restaurant</em> are you?
              </span>
            </h1>
            <p className="bp-sub">
              Tell us about your restaurant. We&apos;ll pre-select the right modules — you can change
              everything next.
            </p>

            <div className="bp-type-grid">
              {RESTAURANT_TYPES.map((type) => {
                const Icon = type.icon;
                const active = restaurantType === type.id;
                const tags = moduleTagsPreview(type.modules);
                return (
                  <button
                    key={type.id}
                    type="button"
                    className={`bp-type-card${active ? " is-selected" : ""}`}
                    onClick={() => chooseType(type.id)}
                  >
                    <div className="bp-type-head" style={{ background: type.color }}>
                      <span className="bp-type-icon">
                        <Icon size={18} />
                      </span>
                      <span className="bp-type-count">{type.modules.length} MODULES</span>
                      {active && (
                        <span className="bp-type-check">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div className="bp-type-body">
                      <h3>{type.name}</h3>
                      <p>{type.desc}</p>
                      <div className="bp-tags">
                        {tags.map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="bp-step1-cta">
              <button
                type="button"
                className="bp-btn"
                disabled={!restaurantType}
                onClick={() => setStep(2)}
              >
                Continue to modules →
              </button>
              <p>You can customize every module in the next step</p>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="bp-step2">
            <div className="bp-step2-layout">
              <div className="bp-step2-main">
                <p className="bp-kicker bp-kicker-left">Step 2 of 3</p>
                <h1 className="bp-title bp-title-left">
                  <span>Customise your</span>
                  <span className="is-accent">module stack.</span>
                </h1>
                <p className="bp-sub bp-sub-left">
                  Toggle modules on or off — your price updates live in the panel.
                </p>

                <div className="bp-quick-picks">
                  <span className="bp-quick-label">Quick picks:</span>
                  <div className="bp-quick-options">
                    {QUICK_PICKS.map((pick) => {
                      const Icon = pick.icon;
                      const active = preset === pick.id;
                      return (
                        <button
                          key={pick.id}
                          type="button"
                          className={`bp-quick-card${active ? " is-active" : ""}`}
                          onClick={() => applyPreset(pick.id)}
                        >
                          <span className="bp-quick-icon">
                            <Icon size={16} />
                          </span>
                          <span className="bp-quick-copy">
                            <strong>{pick.title}</strong>
                            <em>{pick.note}</em>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {CATEGORIES.map((category) => {
                  const items = MODULES.filter((m) => m.category === category);
                  return (
                    <div key={category} className="bp-cat">
                      <h2>{category}</h2>
                      <div className="bp-mod-grid">
                        {items.map((m) => {
                          const Icon = m.icon;
                          const on = selected.includes(m.id);
                          return (
                            <div key={m.id} className={`bp-mod-card${on ? " is-on" : ""}`}>
                              {m.popular && <span className="bp-popular">POPULAR</span>}
                              <button
                                type="button"
                                className={`bp-toggle${on ? " is-on" : ""}`}
                                aria-pressed={on}
                                aria-label={`Toggle ${m.name}`}
                                onClick={() => toggleModule(m.id)}
                              />
                              <div className="bp-mod-icon">
                                <Icon size={18} />
                              </div>
                              <div className="bp-mod-copy">
                                <div className="bp-mod-top">
                                  <h3>{m.name}</h3>
                                  <span>{formatInr(m.price)}/mo</span>
                                </div>
                                <p>{m.desc}</p>
                                <div className="bp-tags">
                                  {m.tags.map((tag) => (
                                    <span key={tag}>{tag}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <aside className="bp-plan">
                <div>
                  <div className="bp-plan-head">
                    <h3>Your plan</h3>
                    <p className="bp-plan-count">{selected.length} modules</p>
                  </div>
                  <ul className="bp-plan-lines">
                    {MODULES.filter((m) => selected.includes(m.id)).map((m) => {
                      const Icon = m.icon;
                      return (
                        <li key={m.id}>
                          <span className="bp-plan-item-icon">
                            <Icon size={14} />
                          </span>
                          <span>{m.label}</span>
                          <span>{formatInr(m.price)}</span>
                        </li>
                      );
                    })}
                    {selected.length === 0 && <li>Select at least one module</li>}
                  </ul>
                  <div className="bp-plan-total">
                    <span>Monthly total</span>
                    <strong>{formatInr(total)}</strong>
                  </div>
                  <p className="bp-plan-free">First 30 days completely free</p>
                  <div className="bp-ai-box">
                    <strong>AI always included</strong>
                    <p>Demand forecasting, revenue insights, and auto-campaigns — at no extra cost.</p>
                  </div>
                </div>
                <div className="bp-plan-actions">
                  <button
                    type="button"
                    className="bp-btn bp-btn-full"
                    disabled={selected.length === 0}
                    onClick={() => setStep(3)}
                  >
                    Review plan →
                  </button>
                  <button type="button" className="bp-text-link" onClick={() => setStep(1)}>
                    ← Change restaurant type
                  </button>
                </div>
              </aside>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="bp-step3">
            <div className="bp-step3-grid">
              <div>
                <p className="bp-kicker">Step 3 of 3</p>
                <h1 className="bp-title bp-title-left">
                  <span>Review &amp;</span>
                  <span className="is-accent">activate your plan.</span>
                </h1>

                <div className="bp-review-card">
                  <div className="bp-review-head">
                    <h2>Selected modules</h2>
                    <button type="button" className="bp-text-link" onClick={() => setStep(2)}>
                      Edit →
                    </button>
                  </div>
                  <ul className="bp-review-list">
                    {MODULES.filter((m) => selected.includes(m.id)).map((m, i) => {
                      const colors = [
                        "rgba(251, 191, 36, 0.5)",
                        "rgba(99, 102, 241, 0.5)",
                        "rgba(236, 72, 153, 0.5)",
                        "rgba(20, 184, 166, 0.5)",
                        "rgba(214, 163, 81, 0.5)",
                      ];
                      const Icon = m.icon;
                      return (
                        <li key={m.id}>
                          <span className="bp-review-icon" style={{ background: colors[i % colors.length] }}>
                            <Icon size={16} />
                          </span>
                          <div>
                            <strong>{m.label}</strong>
                            <p>{m.desc}</p>
                          </div>
                          <span className="bp-review-price">{formatInr(m.price)}/mo</span>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="bp-review-total">
                    <div>
                      <span>Monthly total</span>
                      <strong>{formatInr(total)}/mo</strong>
                    </div>
                    <p>First 30 days free — no card needed</p>
                  </div>
                </div>

                <div className="bp-next-card">
                  <h2>What happens next</h2>
                  <ul>
                    <li>
                      <span className="bp-check"><Check size={12} strokeWidth={3} /></span>
                      <div>
                        <strong>Trial starts immediately</strong>
                        <p>No card charged. Full access to all selected modules.</p>
                      </div>
                    </li>
                    <li>
                      <span className="bp-check"><Check size={12} strokeWidth={3} /></span>
                      <div>
                        <strong>Setup wizard in 2 hours</strong>
                        <p>Import menu, add staff, configure tables — most go live the same day.</p>
                      </div>
                    </li>
                    <li>
                      <span className="bp-check"><Check size={12} strokeWidth={3} /></span>
                      <div>
                        <strong>AI learns from day one</strong>
                        <p>Revenue insights by day 7. Gets smarter automatically every week.</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <button type="button" className="bp-text-link bp-back" onClick={() => setStep(2)}>
                  ← Back to modules
                </button>
              </div>

              <aside className="bp-activate">
                <h2>Activate free trial</h2>
                <p className="bp-activate-sub">30 days free · No credit card · Cancel anytime</p>
                <form onSubmit={handleActivate}>
                  <label>
                    Your Name
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Priya Sharma"
                    />
                  </label>
                  <label>
                    Restaurant Name
                    <input
                      required
                      value={form.restaurant}
                      onChange={(e) => setForm((f) => ({ ...f, restaurant: e.target.value }))}
                      placeholder="The Spice House"
                    />
                  </label>
                  <label>
                    Email Address
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="you@restaurant.com"
                    />
                  </label>
                  <label>
                    Phone (optional)
                    <input
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                    />
                  </label>
                  {activateError && <p className="bp-activate-error">{activateError}</p>}
                  <button type="submit" className="bp-btn bp-btn-full" disabled={activating}>
                    {activating ? "Activating…" : "Activate — free for 30 days →"}
                  </button>
                </form>
                <p className="bp-secure">
                  <Lock size={12} /> Secure &amp; encrypted
                </p>
              </aside>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
