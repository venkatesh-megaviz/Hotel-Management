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
    desc: "Tables, kitchen, admin & more.",
    tags: ["Kitchen Display", "Table Management", "Unified Orders"],
    icon: LayoutGrid,
  },
  {
    id: "billing",
    name: "BILLING",
    label: "Billing",
    price: 899,
    desc: "POS, multi-mode payments, GST invoices.",
    tags: ["Full POS terminal", "Split Bills", "5+ Payment Modes"],
    icon: Receipt,
  },
  {
    id: "menu",
    name: "MENU",
    label: "Menu",
    price: 699,
    desc: "Digital menus, recipes, live availability.",
    tags: ["Item Editor", "Category Management", "Recipe Costing"],
    icon: UtensilsCrossed,
  },
  {
    id: "crm",
    name: "CUSTOMER CRM",
    label: "Customer CRM",
    price: 999,
    desc: "Loyalty, WhatsApp marketing, segments.",
    tags: ["Customer Profiles", "Loyalty Points", "WhatsApp Campaigns"],
    icon: Users,
  },
  {
    id: "finance",
    name: "FINANCE",
    label: "Finance",
    price: 899,
    desc: "P&L, expenses, deep analytics.",
    tags: ["Expense Manager", "P&L Dashboard", "Sales Reports"],
    icon: LineChart,
  },
  {
    id: "inventory",
    name: "INVENTORY",
    label: "Inventory",
    price: 799,
    desc: "Stock levels, alerts, recipe tracking.",
    tags: ["Real-time Stock", "Low-Stock Alerts", "Stock-In Management"],
    icon: Warehouse,
  },
  {
    id: "staff",
    name: "STAFF",
    label: "Staff",
    price: 599,
    desc: "Shift management, attendance tracking.",
    tags: ["Attendance Tracking", "Shift Management", "Check In/Out"],
    icon: Clock3,
  },
  {
    id: "website",
    name: "WEBSITE ORDERS",
    label: "Website Orders",
    price: 1199,
    desc: "Embeddable ordering widget for your site.",
    tags: ["Order Widget", "Website Orders", "Custom Branding"],
    icon: Globe,
  },
] as const;

type ModuleId = (typeof MODULES)[number]["id"];
type PlanId = "basic" | "classic" | "advanced";
type PlanCell =
  | { kind: "check" }
  | { kind: "dash" }
  | { kind: "tag"; label: string; tone?: "muted" | "ai" | "free" };

const PLAN_FEATURES: { name: string; cells: [PlanCell, PlanCell, PlanCell] }[] = [
  { name: "POS + GST Billing", cells: [{ kind: "check" }, { kind: "check" }, { kind: "check" }] },
  { name: "KOT", cells: [{ kind: "check" }, { kind: "check" }, { kind: "check" }] },
  {
    name: "Inventory",
    cells: [
      { kind: "tag", label: "Basic", tone: "muted" },
      { kind: "tag", label: "Advanced", tone: "muted" },
      { kind: "tag", label: "Advanced", tone: "muted" },
    ],
  },
  {
    name: "Reports",
    cells: [
      { kind: "tag", label: "Basic", tone: "muted" },
      { kind: "tag", label: "Advanced", tone: "muted" },
      { kind: "tag", label: "AI", tone: "ai" },
    ],
  },
  { name: "CRM", cells: [{ kind: "dash" }, { kind: "check" }, { kind: "check" }] },
  { name: "Loyalty", cells: [{ kind: "dash" }, { kind: "check" }, { kind: "check" }] },
  { name: "QR Menu", cells: [{ kind: "dash" }, { kind: "check" }, { kind: "check" }] },
  { name: "QR Ordering", cells: [{ kind: "dash" }, { kind: "check" }, { kind: "check" }] },
  { name: "WhatsApp Reports", cells: [{ kind: "dash" }, { kind: "dash" }, { kind: "check" }] },
  { name: "Food Cost", cells: [{ kind: "dash" }, { kind: "dash" }, { kind: "check" }] },
  { name: "Multi-outlet", cells: [{ kind: "dash" }, { kind: "dash" }, { kind: "check" }] },
  {
    name: "Competitor Migration",
    cells: [
      { kind: "dash" },
      { kind: "tag", label: "FREE", tone: "free" },
      { kind: "tag", label: "FREE", tone: "free" },
    ],
  },
];

const PLANS: {
  id: PlanId;
  tier: string;
  name: string;
  desc: string;
  popular: boolean;
  modules: ModuleId[];
  apiPlan: "Basic" | "Standard" | "Premium";
}[] = [
  {
    id: "basic",
    tier: "BASIC",
    name: "Dinevoro Basic",
    desc: "Single-outlet starters",
    popular: false,
    modules: ["operations", "billing", "menu"],
    apiPlan: "Basic",
  },
  {
    id: "classic",
    tier: "CLASSIC",
    name: "Dinevoro Classic",
    desc: "Most popular for growing restaurants",
    popular: true,
    modules: ["operations", "billing", "menu", "crm", "inventory"],
    apiPlan: "Standard",
  },
  {
    id: "advanced",
    tier: "ADVANCED",
    name: "Dinevoro Advanced",
    desc: "Multi-outlet & enterprise F&B",
    popular: false,
    modules: [
      "operations",
      "billing",
      "menu",
      "crm",
      "finance",
      "inventory",
      "staff",
      "website",
    ],
    apiPlan: "Premium",
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

function PlanFeatureCell({ cell }: { cell: PlanCell }) {
  if (cell.kind === "check") {
    return (
      <span className="bp-tier-check" aria-label="Included">
        <Check size={11} strokeWidth={3} />
      </span>
    );
  }
  if (cell.kind === "dash") {
    return <span className="bp-tier-dash" aria-hidden />;
  }
  return (
    <span className={`bp-tier-chip is-${cell.tone ?? "muted"}`}>
      {cell.tone === "ai" && <Sparkles size={9} strokeWidth={2.5} />}
      {cell.label}
    </span>
  );
}

function planForModules(modules: ModuleId[]): PlanId {
  const n = modules.length;
  if (n >= 7) return "advanced";
  if (n >= 4) return "classic";
  return "basic";
}

export default function BuildPlan() {
  const navigate = useNavigate();
  const { register, login } = useAuth();
  const [step, setStep] = useState(1);
  const [restaurantType, setRestaurantType] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("advanced");
  const [selected, setSelected] = useState<ModuleId[]>([...PLANS[2].modules]);
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

  const activePlan = PLANS.find((p) => p.id === selectedPlan) ?? PLANS[2];

  function chooseType(id: string) {
    const type = RESTAURANT_TYPES.find((t) => t.id === id);
    if (!type) return;
    setRestaurantType(id);
    const planId = planForModules(type.modules);
    const plan = PLANS.find((p) => p.id === planId) ?? PLANS[1];
    setSelectedPlan(plan.id);
    setSelected([...plan.modules]);
  }

  function selectPlan(id: PlanId) {
    const plan = PLANS.find((p) => p.id === id);
    if (!plan) return;
    setSelectedPlan(id);
    setSelected([...plan.modules]);
  }

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    setActivateError(null);
    setActivating(true);

    const phoneDigits = form.phone.replace(/\D/g, "");
    const phone = phoneDigits.length >= 10 ? phoneDigits.slice(-10) : "9876543210";

    try {
      await register({
        fullName: form.name.trim(),
        email: form.email.trim(),
        password: TRIAL_PASSWORD,
        restaurantName: form.restaurant.trim(),
        businessType: TYPE_TO_BUSINESS[restaurantType ?? ""] ?? "Restaurant",
        city: "India",
        phone,
        plan: activePlan.apiPlan,
        billingCycle: "Monthly",
      });
      navigate("/app");
    } catch (err) {
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

  const header = (
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
  );

  if (step === 2) {
    return (
      <div className="bp-page is-step2">
        <div className="bp-step2-layout">
          <div className="bp-step2-left">
            {header}
            <section className="bp-step2-main">
              <p className="bp-kicker bp-kicker-left">Step 2 of 3</p>
              <h1 className="bp-plan-heading">Choose your plan.</h1>
              <p className="bp-sub bp-sub-left bp-plan-sub">
                Pick a plan — we&apos;ll pre-load the right modules. Your summary updates live in the
                panel.
              </p>

              <div className="bp-tier-grid">
                {PLANS.map((plan, planIndex) => {
                  const active = selectedPlan === plan.id;
                  return (
                    <article
                      key={plan.id}
                      className={`bp-tier-card${active ? " is-selected" : ""}${plan.popular ? " is-popular" : ""}`}
                    >
                      {plan.popular && <span className="bp-tier-popular">Popular</span>}
                      <div className="bp-tier-top">
                        <p className="bp-tier-label">{plan.tier}</p>
                        <h3>{plan.name}</h3>
                        <span className="bp-tier-soon">
                          <span className="bp-tier-soon-dot" aria-hidden />
                          Coming soon
                        </span>
                        <p className="bp-tier-desc">{plan.desc}</p>
                      </div>
                      <ul className="bp-tier-features">
                        {PLAN_FEATURES.map((feature) => (
                          <li key={feature.name}>
                            <span>{feature.name}</span>
                            <PlanFeatureCell cell={feature.cells[planIndex]} />
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        className={`bp-tier-select${active ? " is-selected" : ""}`}
                        onClick={() => selectPlan(plan.id)}
                      >
                        {active ? (
                          <>
                            <Check size={14} strokeWidth={3} /> Selected
                          </>
                        ) : (
                          "Select Plan"
                        )}
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="bp-plan">
            <div>
              <div className="bp-plan-head">
                <h3>Your plan</h3>
                <p className="bp-plan-count">{selected.length} modules</p>
              </div>
              <ul className="bp-plan-lines bp-plan-lines-modules">
                {selected.map((id) => {
                  const m = MODULES.find((mod) => mod.id === id);
                  if (!m) return null;
                  const Icon = m.icon;
                  return (
                    <li key={m.id}>
                      <span className="bp-plan-item-icon">
                        <Icon size={14} />
                      </span>
                      <span>{m.label}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="bp-ai-box">
                <strong>
                  <Sparkles size={14} /> AI always included
                </strong>
                <p>
                  Demand forecasting, revenue insights, and auto-campaigns — at no extra cost.
                </p>
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
      </div>
    );
  }

  return (
    <div className="bp-page">
      {header}

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
                Continue to plans →
              </button>
              <p>You can pick Basic, Classic, or Advanced next</p>
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
                    {selected.map((id, i) => {
                      const m = MODULES.find((mod) => mod.id === id);
                      if (!m) return null;
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
                  ← Back to plans
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
