import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Box,
  Check,
  ChevronDown,
  Crosshair,
  LayoutGrid,
  LineChart,
  Menu,
  MessageCircle,
  Play,
  Receipt,
  Users,
  UtensilsCrossed,
  Warehouse,
  X,
  Zap,
  Globe,
} from "lucide-react";
import "./Website.css";

const IMG = "/website-images";

const NAV = [
  { label: "Features", href: "#features" },
  { label: "AI", href: "#ai" },
  { label: "Modules", href: "#modules" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const RIBBON = [
  "AI-POWERED DEMAND FORECASTING",
  "SETUP IN UNDER 30 MIN",
  "WHATSAPP AUTO-CAMPAIGNS",
  "UNIFIED ORDERS: DINE-IN · SWIGGY · ZOMATO",
  "4.9 / 5 CUSTOMER RATING",
  "500+ RESTAURANTS ACROSS INDIA",
];

const AI_CARDS = [
  {
    icon: LineChart,
    title: "DEMAND FORECASTING",
    subtitle: "Predicts what you'll sell",
    body: "Analyses 90 days of orders, weather patterns, and local events to tell your kitchen what to prep before the day starts.",
    stat: "+ 23% less food waste",
  },
  {
    icon: Box,
    title: "SMART STOCK ALERTS",
    subtitle: "Never run out mid-service",
    body: "Stock levels are continuously reconciled against predicted demand. You get an alert hours before you'd notice a problem.",
    stat: "+ Zero stockouts reported",
  },
  {
    icon: Activity,
    title: "REVENUE INTELLIGENCE",
    subtitle: "Why revenue changed, not just that it did",
    body: "When sales spike or drop, Dinevoro explains the cause: a dish mix shift, a slower table turn, a delivery delay — pinpointed.",
    stat: "+ Avg 18% revenue lift",
  },
  {
    icon: MessageCircle,
    title: "AUTO-CAMPAIGNS",
    subtitle: "WhatsApp messages that feel personal",
    body: "Customers who haven't visited in 14 days get a personal 'We miss you' offer. Triggered automatically, zero manual work.",
    stat: "+ 40% repeat visit rate",
  },
];

const MODULES = [
  {
    id: "operations",
    label: "Operations",
    icon: LayoutGrid,
    blurb: "Tables, kitchen, unified order hub",
    list: ["Kitchen Display", "Table Management", "Unified Orders", "Online Integration"],
    cards: ["Kitchen Display", "Table Management", "Unified Orders", "QR Ordering", "Online Integration"],
  },
  {
    id: "billing",
    label: "Billing",
    icon: Receipt,
    blurb: "POS, multi-mode payments, GST invoices",
    list: ["Fast POS", "Split Bills", "GST Invoices", "Multi-mode Payments"],
    cards: ["POS Billing", "GST Invoices", "Split Payments", "Tips & Settlements"],
  },
  {
    id: "menu",
    label: "Menu",
    icon: UtensilsCrossed,
    blurb: "Digital menus, recipes, live availability",
    list: ["Digital Menu", "Recipe Costing", "Live Availability", "Modifiers"],
    cards: ["QR Menu", "Recipe Manager", "86 Items Live", "Combo Builder"],
  },
  {
    id: "crm",
    label: "Customer CRM",
    icon: Users,
    blurb: "Loyalty, WhatsApp marketing, segments",
    list: ["Loyalty Points", "Segments", "WhatsApp Campaigns", "Visit History"],
    cards: ["Loyalty Engine", "Customer Segments", "Auto Campaigns", "Feedback Loop"],
  },
  {
    id: "finance",
    label: "Finance",
    icon: LineChart,
    blurb: "P&L, expenses, revenue analytics",
    list: ["P&L Reports", "Expense Tracking", "Revenue Analytics", "Tax Ready"],
    cards: ["Daily P&L", "Expense Log", "Channel Mix", "Tax Exports"],
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: Warehouse,
    blurb: "Stock levels, alerts, waste tracking",
    list: ["Stock Levels", "Smart Alerts", "Waste Tracking", "Vendor Orders"],
    cards: ["Live Stock", "Par Levels", "Waste Log", "Purchase Orders"],
  },
  {
    id: "staff",
    label: "Staff",
    icon: Users,
    blurb: "Shift management, attendance, training",
    list: ["Shifts", "Attendance", "Roles", "Training Notes"],
    cards: ["Shift Planner", "Attendance", "Role Permissions", "Tip Pools"],
  },
  {
    id: "website",
    label: "Website Orders",
    icon: Globe,
    blurb: "Personalized ordering widget for your site",
    list: ["Order Widget", "Brand Theme", "Direct Orders", "No Commission"],
    cards: ["Embed Widget", "Brand Colors", "Direct Checkout", "Order Tracking"],
  },
] as const;

const PRICING_MODULES = [
  { id: "operations", name: "OPERATIONS", label: "Operations", price: 1499, desc: "Tables, kitchen, unified order hub.", popular: false },
  { id: "billing", name: "BILLING", label: "Billing", price: 899, desc: "POS, multi-mode payments, GST invoices.", popular: false },
  { id: "menu", name: "MENU", label: "Menu", price: 699, desc: "Digital menus, recipes, live availability.", popular: false },
  { id: "crm", name: "CUSTOMER CRM", label: "Customer CRM", price: 999, desc: "Loyalty, WhatsApp marketing, segments.", popular: true },
  { id: "finance", name: "FINANCE", label: "Finance", price: 899, desc: "P&L, expenses, revenue analytics.", popular: false },
  { id: "inventory", name: "INVENTORY", label: "Inventory", price: 799, desc: "Stock levels, alerts, waste tracking.", popular: false },
  { id: "staff", name: "STAFF", label: "Staff", price: 599, desc: "Shift management, attendance, training.", popular: false },
  { id: "website", name: "WEBSITE ORDERS", label: "Website Orders", price: 1199, desc: "Personalized ordering widget for your site.", popular: false },
] as const;

const PRESETS = {
  Starter: ["operations", "billing", "menu"],
  Growth: ["operations", "billing", "menu", "crm", "inventory"],
  Complete: ["operations", "billing", "menu", "crm", "finance", "inventory", "staff", "website"],
} as const;

const PRESET_META: Record<keyof typeof PRESETS, string> = {
  Starter: "For new restaurants",
  Growth: "Most popular",
  Complete: "Full suite",
};

const TESTIMONIALS = [
  {
    name: "PRIYA KAPOOR",
    role: "Owner, The Spice Route",
    image: `${IMG}/testimonials1.png`,
    quote:
      "Dinevoro transformed how we run service. The AI insight tool told us our Friday dinner orders were up 22% before we even noticed. We were live in an afternoon.",
  },
  {
    name: "ARVIND MEHTA",
    role: "Group Ops, Urban Thali",
    image: `${IMG}/testimonials2.png`,
    quote:
      "We run 3 properties. Dinevoro scaled effortlessly — one dashboard, three kitchens. The WhatsApp auto-campaign brought back 60+ dormant customers last month.",
  },
  {
    name: "SUNITA RAO",
    role: "Co-founder, Udupi Express",
    image: `${IMG}/testimonials3.png`,
    quote:
      "For a QSR, speed is everything. Dinevoro's POS is the fastest we've used. The AI revenue intelligence tells us exactly which dish mix is driving growth each day.",
  },
];

const FAQS = [
  {
    q: "What happens after the 30-day trial?",
    a: "Your account stays intact. Choose the modules you want to keep, subscribe monthly, and continue without re-setup. If you cancel, you can export your data anytime.",
  },
  {
    q: "Can I add or remove modules later?",
    a: "Yes. Toggle modules on or off anytime. Your bill updates on the next billing cycle — you only pay for what you use.",
  },
  {
    q: "Does Dinevoro work during internet outages?",
    a: "Core POS and kitchen flows queue locally and sync when connectivity returns, so service doesn't stop mid-rush.",
  },
  {
    q: "How does the AI actually work?",
    a: "It learns from your order history, peak patterns, and stock movement. Insights unlock from day 7 and get sharper the longer you use Dinevoro.",
  },
  {
    q: "How long does setup take?",
    a: "Most restaurants import their menu, add staff, and configure tables in under 2 hours with the guided wizard.",
  },
  {
    q: "Is my data secure?",
    a: "Data is encrypted in transit and at rest, with role-based access for your team. We never sell restaurant or customer data.",
  },
];

const BAR_HEIGHTS = [42, 58, 48, 72, 64, 88, 76];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatInr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function Website() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<(typeof MODULES)[number]["id"]>("operations");
  const [selected, setSelected] = useState<string[]>([...PRESETS.Starter]);
  const [preset, setPreset] = useState<keyof typeof PRESETS>("Starter");
  const [openFaq, setOpenFaq] = useState(0);

  const module = MODULES.find((m) => m.id === activeModule) ?? MODULES[0];

  const total = useMemo(
    () => PRICING_MODULES.filter((m) => selected.includes(m.id)).reduce((sum, m) => sum + m.price, 0),
    [selected],
  );

  function applyPreset(name: keyof typeof PRESETS) {
    setPreset(name);
    setSelected([...PRESETS[name]]);
  }

  function toggleModule(id: string) {
    setPreset("Growth");
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className={`dv-site${menuOpen ? " is-open" : ""}`}>
      <div className="dv-announce">
        New — Dinevoro AI demand forecasting is live across all plans.{" "}
        <a href="#pricing">Try free for 30 days →</a>
      </div>

      <header className={`dv-header${menuOpen ? " is-open" : ""}`}>
        <div className="dv-container dv-header-inner">
          <a href="#top" className="dv-logo" onClick={() => setMenuOpen(false)}>
            <img src={`${IMG}/logo.png`} alt="Dinevoro" className="dv-logo-img" />
          </a>

          <nav className="dv-nav" aria-label="Primary">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="dv-header-actions">
            <Link to="/login" className="dv-signin">
              Sign in
            </Link>
            <Link to="/build-plan" className="dv-btn dv-btn-primary">
              Build your plan →
            </Link>
            <button
              type="button"
              className="dv-menu-toggle"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="dv-hero">
          <div className="dv-container dv-hero-grid">
            <div>
              <p className="dv-hero-kicker dv-display">The restaurant OS that</p>
              <h1 className="dv-hero-title dv-display">Thinks ahead.</h1>
              <p className="dv-hero-copy">
                One platform for your tables, kitchen, billing, inventory, staff, and customers —
                while AI surfaces insights and automates campaigns silently in the background.
              </p>
              <div className="dv-hero-ctas">
                <Link to="/build-plan" className="dv-btn dv-btn-primary">
                  Build your plan →
                </Link>
                <a href="#ai" className="dv-watch">
                  <span className="dv-watch-icon">
                    <Play size={12} fill="currentColor" />
                  </span>
                  Watch demo
                </a>
              </div>
            </div>

            <div className="dv-hero-visual">
              <img
                src={`${IMG}/hero-right.png`}
                alt="Restaurant team using Dinevoro with AI engine and unified orders"
              />
            </div>
          </div>
        </section>

        <div className="dv-ribbon" aria-hidden>
          <div className="dv-ribbon-track">
            {[0, 1].map((copy) => (
              <span key={copy}>
                {RIBBON.map((item) => (
                  <span key={`${copy}-${item}`} className="dv-diamond">
                    {item}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>

        {/* AI */}
        <section className="dv-ai" id="ai">
          <div className="dv-container">
            <div className="dv-ai-head">
              <div>
                <span className="dv-pill">
                  <Crosshair size={12} strokeWidth={2.5} />
                  Dinevoro AI
                </span>
                <h2 className="dv-ai-title dv-display">
                  <span className="dv-ai-title-line">Intelligence</span>
                  <span className="dv-ai-title-line is-accent">Built in.</span>
                </h2>
              </div>
              <p className="dv-ai-copy">
                Dinevoro&apos;s AI engine runs silently in the background — analysing patterns,
                predicting demand, automating campaigns, and surfacing revenue opportunities
                you&apos;d otherwise miss entirely. No data science team needed. No setup. It learns
                your restaurant from day one.
              </p>
            </div>

            <div className="dv-ai-grid">
              {AI_CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <article key={card.title} className="dv-ai-card">
                    <div className="dv-ai-card-top">
                      <div className="dv-ai-card-icon">
                        <Icon size={18} strokeWidth={1.75} />
                      </div>
                      <h3 className="dv-display">{card.title}</h3>
                      <p className="dv-sub">{card.subtitle}</p>
                      <p className="dv-ai-card-body">{card.body}</p>
                    </div>
                    <div className="dv-ai-stat">{card.stat}</div>
                  </article>
                );
              })}
            </div>

            <div className="dv-ai-foot">
              <p>
                <em>* AI insights are available from day 7 of usage. The longer you use Dinevoro, the smarter it gets.</em>
              </p>
              <a href="#pricing">AVAILABLE IN ALL PLANS ↗</a>
            </div>
          </div>
        </section>

        {/* Kitchen bento */}
        <section className="dv-kitchen" id="features">
          <div className="dv-container">
            <header className="dv-kitchen-head">
              <p className="dv-section-label">Everything you need</p>
              <h2 className="dv-section-title dv-display">
                <span className="dv-title-line">Built for the</span>
                <span className="dv-title-line is-accent">real kitchen.</span>
              </h2>
            </header>

            <div className="dv-bento">
              <article className="dv-bento-card dv-bento-ops">
                <img src={`${IMG}/operations.png`} alt="Restaurant floor operations" />
                <div className="dv-bento-overlay is-bottom">
                  <h3 className="dv-display">Real-time operations</h3>
                  <p>Every table, order, and alert visible in one glance. Nothing falls through the cracks.</p>
                  <div className="dv-bento-stats">
                    <div className="dv-bento-stat">
                      <strong>167</strong>
                      <span>ORDERS TODAY</span>
                    </div>
                    <div className="dv-bento-stat">
                      <strong>7/12</strong>
                      <span>TABLES ACTIVE</span>
                    </div>
                  </div>
                </div>
              </article>

              <article className="dv-bento-card dv-bento-fast">
                <div className="dv-bento-fast-icon">
                  <Zap size={18} color="rgba(214,163,81,1)" />
                </div>
                <h3 className="dv-display">2x faster service</h3>
                <p>Orders routed to the kitchen instantly. Tables turned faster. Customers never wait.</p>
                <div className="dv-bento-fast-foot">+ Avg table turn improvement</div>
              </article>

              <article className="dv-bento-card dv-bento-menu">
                <img src={`${IMG}/digital-menu.png`} alt="Digital menu dish" />
                <div className="dv-bento-overlay is-top">
                  <h3 className="dv-display">Digital menu</h3>
                  <p>QR scans to live menu. Prices update in seconds.</p>
                </div>
              </article>

              <article className="dv-bento-card dv-bento-kitchen">
                <img src={`${IMG}/kitchen-display.png`} alt="Chef in kitchen" />
                <div className="dv-bento-overlay is-bottom">
                  <h3 className="dv-display">Kitchen display</h3>
                  <p>Orders arrive the moment they&apos;re placed.</p>
                </div>
              </article>

              <article className="dv-bento-card dv-bento-chart">
                <div className="label">Weekly revenue</div>
                <div className="amount dv-display">₹1,85,050</div>
                <div className="dv-bars" aria-hidden>
                  {BAR_HEIGHTS.map((h, i) => (
                    <span key={DAYS[i]} style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="dv-day-labels">
                  {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                    <span key={`${d}-${i}`}>{d}</span>
                  ))}
                </div>
              </article>

              <article className="dv-bento-card dv-bento-customers">
                <img src={`${IMG}/customers.png`} alt="Happy diners" />
                <div className="dv-bento-overlay is-bottom">
                  <h3 className="dv-display">Customers keep coming back</h3>
                  <div className="dv-bento-stats">
                    <div className="dv-bento-stat">
                      <strong>40%</strong>
                      <span>REPEAT VISIT LIFT</span>
                    </div>
                    <div className="dv-bento-stat">
                      <strong>315</strong>
                      <span>AVG LOYALTY PTS</span>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Modules */}
        <section className="dv-modules" id="modules">
          <div className="dv-container">
            <header className="dv-modules-head">
              <p className="dv-section-label">8 Powerful modules</p>
              <h2 className="dv-section-title dv-display">
                <span className="dv-title-line">Every tool your</span>
                <span className="dv-title-line">restaurant needs.</span>
              </h2>
            </header>

            <div className="dv-tabs" role="tablist" aria-label="Modules">
              {MODULES.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="tab"
                    aria-selected={activeModule === m.id}
                    className={`dv-tab${activeModule === m.id ? " is-active" : ""}`}
                    onClick={() => setActiveModule(m.id)}
                  >
                    <Icon size={14} />
                    {m.label}
                  </button>
                );
              })}
            </div>

            <div className="dv-module-panel">
              <div className="dv-module-side">
                {(() => {
                  const ModuleIcon = module.icon;
                  return (
                    <div className="dv-module-icon">
                      <ModuleIcon size={20} color="rgba(214,163,81,1)" strokeWidth={1.75} />
                    </div>
                  );
                })()}
                <h3 className="dv-display">{module.label}</h3>
                <p>{module.blurb}</p>
                <ul className="dv-check-list">
                  {module.list.map((item) => (
                    <li key={item}>
                      <span className="dv-check">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="dv-module-cards">
                {module.cards.map((card) => (
                  <div key={card} className="dv-module-card">
                    <span className="dv-check">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    <span>{card}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Getting started */}
        <section className="dv-started">
          <div className="dv-container dv-started-grid">
            <div className="dv-started-media">
              <img src={`${IMG}/up-and-running-today.png`} alt="POS counter setup" />
              <div className="dv-started-badge">
                <strong>2 HRS</strong>
                <span>FROM SIGNUP TO LIVE</span>
              </div>
            </div>
            <div>
              <p className="dv-section-label">Getting started</p>
              <h2 className="dv-section-title dv-display">
                <span className="dv-title-line">Up and running</span>
                <span className="dv-title-line is-accent">today.</span>
              </h2>
              <ol className="dv-steps">
                <li className="dv-step">
                  <div className="dv-step-num">01</div>
                  <div>
                    <h4>PICK YOUR MODULES</h4>
                    <p>Select only the features your restaurant actually needs. Start small — add more as you grow.</p>
                  </div>
                </li>
                <li className="dv-step">
                  <div className="dv-step-num">02</div>
                  <div>
                    <h4>SET UP IN 2 HOURS</h4>
                    <p>Import your menu, add staff, and configure tables with our guided wizard. Most restaurants are live that afternoon.</p>
                  </div>
                </li>
                <li className="dv-step">
                  <div className="dv-step-num">03</div>
                  <div>
                    <h4>GO LIVE AND LET AI WORK</h4>
                    <p>Your team uses Dinevoro from day one. The AI starts learning immediately and surfaces insights within a week.</p>
                  </div>
                </li>
              </ol>
              <Link to="/build-plan" className="dv-btn dv-btn-primary">
                Start today →
              </Link>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="dv-pricing" id="pricing">
          <div className="dv-container">
            <header className="dv-pricing-head">
              <p className="dv-section-label">Flexible pricing</p>
              <h2 className="dv-section-title dv-display">
                <span className="dv-title-line">Pay only for</span>
                <span className="dv-title-line">what you need.</span>
              </h2>
              <p className="dv-pricing-sub">
                Toggle the modules your restaurant needs. Your monthly total updates in real time.
              </p>
            </header>

            <div className="dv-presets">
              {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((name) => (
                <button
                  key={name}
                  type="button"
                  className={`dv-preset${preset === name ? " is-active" : ""}`}
                  onClick={() => applyPreset(name)}
                >
                  <span className="dv-preset-name">{name}</span>
                  <span className="dv-preset-note">{PRESET_META[name]}</span>
                  {name === "Growth" && <span className="dv-tag">Most popular</span>}
                </button>
              ))}
            </div>

            <div className="dv-pricing-layout">
              <div className="dv-price-grid">
                {PRICING_MODULES.map((m) => {
                  const on = selected.includes(m.id);
                  return (
                    <div key={m.id} className={`dv-price-card${on ? " is-on" : ""}`}>
                      <div className="dv-price-card-copy">
                        <h4 className="dv-display">
                          {m.name}
                          {m.popular && <span className="dv-popular">POPULAR</span>}
                        </h4>
                        <div className="amt">{formatInr(m.price)}/mo</div>
                        <p>{m.desc}</p>
                      </div>
                      <button
                        type="button"
                        className={`dv-toggle${on ? " is-on" : ""}`}
                        aria-pressed={on}
                        aria-label={`Toggle ${m.name}`}
                        onClick={() => toggleModule(m.id)}
                      />
                    </div>
                  );
                })}
              </div>

              <aside className="dv-plan">
                <div className="dv-plan-top">
                  <h3 className="dv-display">Your plan</h3>
                  <p className="sel">{selected.length} modules selected</p>
                  <ul className="dv-plan-lines">
                    {PRICING_MODULES.filter((m) => selected.includes(m.id)).map((m) => (
                      <li key={m.id}>
                        <span>{m.label}</span>
                        <span>{formatInr(m.price)}</span>
                      </li>
                    ))}
                    {selected.length === 0 && <li>Select at least one module</li>}
                  </ul>
                </div>
                <div className="dv-plan-bottom">
                  <div className="dv-plan-total">
                    <span>Monthly total</span>
                    <strong className="dv-display">{formatInr(total)}</strong>
                  </div>
                  <Link to="/build-plan" className="dv-btn dv-btn-primary">
                    Subscribe — {formatInr(total)}/mo →
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="dv-testimonials">
          <div className="dv-container">
            <p className="dv-section-label">Testimonials</p>
            <h2 className="dv-section-title dv-display">
              <span className="dv-title-line">Restaurant owners</span>
              <span className="dv-title-line is-accent">love Dinevoro.</span>
            </h2>
            <div className="dv-test-grid">
              {TESTIMONIALS.map((t) => (
                <article key={t.name} className="dv-test-card">
                  <div className="dv-test-media">
                    <img src={t.image} alt={t.name} />
                    <div className="who">
                      <strong>{t.name}</strong>
                      <span>{t.role}</span>
                    </div>
                  </div>
                  <div className="dv-test-body">
                    <div className="dv-stars" aria-label="5 star rating">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>★</span>
                      ))}
                    </div>
                    <p>“{t.quote}”</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="dv-faq" id="faq">
          <div className="dv-container">
            <p className="dv-section-label">FAQ</p>
            <h2 className="dv-section-title dv-display">Questions answered.</h2>
            <div className="dv-faq-list">
              {FAQS.map((item, i) => {
                const open = openFaq === i;
                return (
                  <div key={item.q} className="dv-faq-item">
                    <button
                      type="button"
                      className="dv-faq-q"
                      aria-expanded={open}
                      onClick={() => setOpenFaq(open ? -1 : i)}
                    >
                      {item.q}
                      <ChevronDown
                        size={18}
                        style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform 0.2s" }}
                      />
                    </button>
                    {open && <div className="dv-faq-a">{item.a}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="dv-cta">
          <div className="dv-cta-bg">
            <img src={`${IMG}/start-today-background.jpg`} alt="" />
          </div>
          <div className="dv-cta-inner">
            <p className="dv-section-label">Start today</p>
            <h2 className="dv-section-title dv-display">
              <span className="dv-title-line">Your restaurant.</span>
              <span className="dv-title-line is-accent">Fully managed.</span>
            </h2>
            <p className="dv-cta-copy">
              30-day free trial. No credit card. Your entire team live in under 2 hours.
            </p>
            <Link to="/build-plan" className="dv-btn dv-btn-primary">
              Build your plan →
            </Link>
            <p className="dv-cta-note">No credit card · Setup in hours · Cancel anytime</p>
          </div>
        </section>
      </main>

      <footer className="dv-footer">
        <div className="dv-container">
          <div className="dv-footer-top">
            <div className="dv-footer-brand">
              <a href="#top" className="dv-logo dv-logo-footer">
                <img src={`${IMG}/footer-logo.png`} alt="Dinevoro" className="dv-logo-img dv-logo-img-footer" />
              </a>
              <p>The AI-powered restaurant OS built for India.</p>
            </div>
            <div>
              <h5>PRODUCT</h5>
              <ul className="dv-footer-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#ai">AI Automation</a></li>
                <li><a href="#modules">Modules</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#pricing">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h5>LEGAL</h5>
              <ul className="dv-footer-links">
                <li><Link to="/privacy">Privacy</Link></li>
                <li><Link to="/terms">Terms</Link></li>
                <li><a href="#faq">Cookies</a></li>
                <li><a href="#faq">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="dv-footer-bottom">
            <div className="dv-footer-partners">
              <span className="dv-footer-by-label">A PRODUCT BY</span>
              <div className="dv-partner-card">
                <img
                  src={`${IMG}/megavizlogo.png`}
                  alt="Megaviz"
                  className="dv-megaviz-logo"
                />
                <div className="dv-partner-copy">
                  <strong>MEGAVIZ TECHNOLOGIES</strong>
                  <span>India · USA</span>
                </div>
              </div>
              <span className="dv-footer-collab">in collaboration with</span>
              <div className="dv-partner-card dv-partner-card-empty" aria-label="Collaboration partner placeholder" />
            </div>
            <span className="dv-footer-copy">© 2025 Dinevoro Pvt. Ltd.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
