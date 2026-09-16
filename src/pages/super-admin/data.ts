export type TenantStatus = "Active" | "Trial" | "Inactive";
export type TenantPlan = "Basic" | "Classic" | "Advanced";

export type Tenant = {
  id: string;
  name: string;
  city: string;
  type: string;
  plan: TenantPlan;
  modulesEnabled: number;
  modulesTotal: number;
  mrr: number;
  status: TenantStatus;
  joined: string;
  owner: string;
  email: string;
  phone: string;
  address: string;
  nextBilling: string;
  activeModules: string[];
};

export const ALL_MODULES = [
  "Operations",
  "Billing",
  "Menu",
  "Customer CRM",
  "Finance",
  "Inventory",
  "Staff",
  "Website Orders",
] as const;

export const TENANTS: Tenant[] = [
  {
    id: "T-1001",
    name: "Spice Garden",
    city: "Mumbai",
    type: "Full Service",
    plan: "Advanced",
    modulesEnabled: 5,
    modulesTotal: 8,
    mrr: 7190,
    status: "Active",
    joined: "12 Mar 2024",
    owner: "Spice Owner",
    email: "admin@spicegarden.in",
    phone: "+91 98765 43210",
    address: "Mumbai, India",
    nextBilling: "12 Sep 2024",
    activeModules: ["Operations", "Billing", "Menu", "Customer CRM", "Finance"],
  },
  {
    id: "T-1002",
    name: "Punjabi Rasoi",
    city: "Delhi",
    type: "Full Service",
    plan: "Classic",
    modulesEnabled: 6,
    modulesTotal: 8,
    mrr: 4590,
    status: "Active",
    joined: "18 Apr 2024",
    owner: "Harpreet Singh",
    email: "owner@punjabirasoi.in",
    phone: "+91 98111 22334",
    address: "Delhi, India",
    nextBilling: "18 Sep 2024",
    activeModules: ["Operations", "Billing", "Menu", "Customer CRM", "Inventory", "Staff"],
  },
  {
    id: "T-1003",
    name: "Noodle House",
    city: "Bengaluru",
    type: "Quick Service",
    plan: "Classic",
    modulesEnabled: 5,
    modulesTotal: 8,
    mrr: 4590,
    status: "Active",
    joined: "02 May 2024",
    owner: "Mei Lin",
    email: "hello@noodlehouse.in",
    phone: "+91 99001 11223",
    address: "Bengaluru, India",
    nextBilling: "02 Oct 2024",
    activeModules: ["Operations", "Billing", "Menu", "Inventory", "Website Orders"],
  },
  {
    id: "T-1004",
    name: "Cloud Bites",
    city: "Hyderabad",
    type: "Cloud Kitchen",
    plan: "Advanced",
    modulesEnabled: 7,
    modulesTotal: 8,
    mrr: 7190,
    status: "Active",
    joined: "22 May 2024",
    owner: "Ravi Teja",
    email: "ops@cloudbites.in",
    phone: "+91 98480 55667",
    address: "Hyderabad, India",
    nextBilling: "22 Sep 2024",
    activeModules: ["Operations", "Billing", "Menu", "Inventory", "Finance", "Staff", "Website Orders"],
  },
  {
    id: "T-1005",
    name: "Dosa Junction",
    city: "Chennai",
    type: "Quick Service",
    plan: "Basic",
    modulesEnabled: 3,
    modulesTotal: 8,
    mrr: 2099,
    status: "Active",
    joined: "11 Jun 2024",
    owner: "Karthik R",
    email: "karthik@dosajunction.in",
    phone: "+91 94444 77889",
    address: "Chennai, India",
    nextBilling: "11 Oct 2024",
    activeModules: ["Operations", "Billing", "Menu"],
  },
  {
    id: "T-1006",
    name: "The Garden Café",
    city: "Pune",
    type: "Café",
    plan: "Classic",
    modulesEnabled: 4,
    modulesTotal: 8,
    mrr: 0,
    status: "Trial",
    joined: "30 Jun 2024",
    owner: "Ananya Deshmukh",
    email: "ananya@gardencafe.in",
    phone: "+91 98220 33445",
    address: "Pune, India",
    nextBilling: "30 Sep 2024",
    activeModules: ["Billing", "Menu", "Customer CRM", "Staff"],
  },
  {
    id: "T-1007",
    name: "Masala Express",
    city: "Ahmedabad",
    type: "Quick Service",
    plan: "Basic",
    modulesEnabled: 3,
    modulesTotal: 8,
    mrr: 0,
    status: "Trial",
    joined: "03 Jul 2024",
    owner: "Neha Patel",
    email: "neha@masalaexpress.in",
    phone: "+91 98250 66778",
    address: "Ahmedabad, India",
    nextBilling: "03 Oct 2024",
    activeModules: ["Operations", "Billing", "Menu"],
  },
  {
    id: "T-1008",
    name: "Urban Thali",
    city: "Jaipur",
    type: "Full Service",
    plan: "Advanced",
    modulesEnabled: 8,
    modulesTotal: 8,
    mrr: 7190,
    status: "Active",
    joined: "15 Jul 2024",
    owner: "Arvind Mehta",
    email: "arvind@urbanthali.in",
    phone: "+91 94140 11223",
    address: "Jaipur, India",
    nextBilling: "15 Oct 2024",
    activeModules: [...ALL_MODULES],
  },
  {
    id: "T-1009",
    name: "Biryani Box",
    city: "Lucknow",
    type: "Cloud Kitchen",
    plan: "Classic",
    modulesEnabled: 5,
    modulesTotal: 8,
    mrr: 4590,
    status: "Active",
    joined: "28 Jul 2024",
    owner: "Imran Khan",
    email: "imran@biryanibox.in",
    phone: "+91 99350 44556",
    address: "Lucknow, India",
    nextBilling: "28 Oct 2024",
    activeModules: ["Operations", "Billing", "Menu", "Inventory", "Website Orders"],
  },
  {
    id: "T-1010",
    name: "Coastal Catch",
    city: "Kochi",
    type: "Full Service",
    plan: "Basic",
    modulesEnabled: 3,
    modulesTotal: 8,
    mrr: 2099,
    status: "Inactive",
    joined: "05 Aug 2024",
    owner: "Joseph Mathew",
    email: "joseph@coastalcatch.in",
    phone: "+91 98470 88990",
    address: "Kochi, India",
    nextBilling: "—",
    activeModules: ["Billing", "Menu", "Staff"],
  },
  {
    id: "T-1011",
    name: "Tandoor Tales",
    city: "Chandigarh",
    type: "Full Service",
    plan: "Classic",
    modulesEnabled: 6,
    modulesTotal: 8,
    mrr: 4590,
    status: "Active",
    joined: "19 Aug 2024",
    owner: "Simran Kaur",
    email: "simran@tandoortales.in",
    phone: "+91 98760 22334",
    address: "Chandigarh, India",
    nextBilling: "19 Oct 2024",
    activeModules: ["Operations", "Billing", "Menu", "Customer CRM", "Finance", "Inventory"],
  },
  {
    id: "T-1012",
    name: "Brew & Bite",
    city: "Goa",
    type: "Café",
    plan: "Basic",
    modulesEnabled: 3,
    modulesTotal: 8,
    mrr: 2099,
    status: "Active",
    joined: "01 Sep 2024",
    owner: "Lara Fernandes",
    email: "lara@brewandbite.in",
    phone: "+91 98221 55667",
    address: "Goa, India",
    nextBilling: "01 Oct 2024",
    activeModules: ["Operations", "Billing", "Menu"],
  },
];

export const MRR_SERIES = [
  { month: "Mar", value: 8.4 },
  { month: "Apr", value: 9.6 },
  { month: "May", value: 10.8 },
  { month: "Jun", value: 11.5 },
  { month: "Jul", value: 12.7 },
  { month: "Aug", value: 14.2 },
];

export const MODULE_ADOPTION = [
  { name: "Billing", pct: 97, color: "#d6a351" },
  { name: "Menu", pct: 94, color: "#009966" },
  { name: "Operations", pct: 89, color: "#155dfc" },
  { name: "Inventory", pct: 76, color: "#fe9a00" },
  { name: "Customer CRM", pct: 71, color: "#7c3aed" },
  { name: "Finance", pct: 63, color: "#dc2626" },
  { name: "Website Orders", pct: 55, color: "#0891b2" },
  { name: "Staff", pct: 48, color: "#64748b" },
];

export const SUBSCRIPTION_EVENTS = [
  { restaurant: "Punjabi Rasoi", event: "New Subscription", plan: "Advanced", amount: "₹7,190/mo", date: "8 Aug 2024", tone: "success" as const },
  { restaurant: "Noodle House", event: "Upgrade", plan: "Classic", amount: "₹4,590/mo", date: "22 Aug 2024", tone: "info" as const },
  { restaurant: "Cloud Bites", event: "Renewal", plan: "Advanced", amount: "₹7,190/mo", date: "29 Jul 2024", tone: "info" as const },
  { restaurant: "Dosa Junction", event: "Downgrade", plan: "Basic", amount: "₹2,099/mo", date: "11 Jul 2024", tone: "danger" as const },
  { restaurant: "The Garden Café", event: "Trial Started", plan: "Classic", amount: "—", date: "30 Jun 2024", tone: "warning" as const },
  { restaurant: "Masala Express", event: "Trial Started", plan: "Basic", amount: "—", date: "3 Jan 2024", tone: "warning" as const },
];

export const PLATFORM_PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: 2099,
    tenants: 84,
    mrrLabel: "₹1.8L",
    modules: "3/8",
    status: "ACTIVE" as const,
    features: ["POS + GST Billing", "KOT", "Basic Inventory", "Basic Reports"],
    modulesList: ["Billing", "Menu", "Operations"],
  },
  {
    id: "classic",
    name: "Classic",
    price: 4590,
    tenants: 112,
    mrrLabel: "₹5.9L",
    modules: "6/8",
    status: "ACTIVE" as const,
    features: ["Everything in Basic", "Advanced Inventory", "CRM + Loyalty", "QR Menu & Ordering"],
    modulesList: ["Billing", "Menu", "Operations", "Customer CRM", "Inventory", "Staff"],
  },
  {
    id: "advanced",
    name: "Advanced",
    price: 7190,
    tenants: 51,
    mrrLabel: "₹3.7L",
    modules: "8/8",
    status: "COMING SOON" as const,
    features: [
      "Everything in Classic",
      "AI-powered Reports",
      "Multi-outlet",
      "Priority Support",
      "Dedicated CSM",
      "FREE Migration",
      "Beta Features",
    ],
    modulesList: [...ALL_MODULES],
  },
];

export const TENANT_GROWTH = [
  { month: "Mar", value: 168 },
  { month: "Apr", value: 186 },
  { month: "May", value: 204 },
  { month: "Jun", value: 218 },
  { month: "Jul", value: 231 },
  { month: "Aug", value: 247 },
];

export const PLAN_DISTRIBUTION = [
  { name: "Basic", tenants: 84, pct: 34, color: "#2f2a27" },
  { name: "Classic", tenants: 112, pct: 45, color: "#d6a351" },
  { name: "Advanced", tenants: 51, pct: 21, color: "#8b83f2" },
];

export const KEY_METRICS = [
  { label: "Avg. Revenue Per Tenant", value: "₹4,939/mo" },
  { label: "Avg. Modules Per Tenant", value: "5.4 / 8" },
  { label: "Trial Conversion Rate", value: "72.4%" },
  { label: "Avg. Onboarding Time", value: "2.3 days" },
  { label: "Churn Rate (30d)", value: "0.82%" },
  { label: "Net Promoter Score", value: "68" },
];

export const SUPPORT_TICKETS = [
  { id: "#1042", tenant: "Spice Garden", issue: "POS not printing receipts", status: "Open" as const, submitted: "2h ago" },
  { id: "#1041", tenant: "Biryani Blues", issue: "KOT display going blank", status: "Open" as const, submitted: "3h ago" },
  { id: "#1040", tenant: "Chai & Co.", issue: "Loyalty points not syncing", status: "Resolved" as const, submitted: "4h ago" },
  { id: "#1039", tenant: "Masala Express", issue: "GST flat rate format question", status: "Open" as const, submitted: "1d ago" },
  { id: "#1038", tenant: "Urban Dhaba", issue: "WhatsApp campaign not sending", status: "In Progress" as const, submitted: "1d ago" },
  { id: "#1037", tenant: "Hotel Royal P&B", issue: "Multi outlet sync delay", status: "Resolved" as const, submitted: "2d ago" },
  { id: "#1036", tenant: "Cloud Bites", issue: "Delivery zone not updating", status: "Resolved" as const, submitted: "2d ago" },
  { id: "#1035", tenant: "Noodle House", issue: "Report export failing on Excel", status: "Open" as const, submitted: "3d ago" },
];

export const TENANT_INVOICES = [
  { id: "INV-2408", date: "12 Aug 2024", amount: 7190, status: "Paid" as const },
  { id: "INV-2407", date: "12 Jul 2024", amount: 7190, status: "Paid" as const },
  { id: "INV-2406", date: "12 Jun 2024", amount: 7190, status: "Overdue" as const },
];

export const TENANT_ACTIVITY = [
  { text: "Advanced plan activated", date: "12 Mar 2024" },
  { text: "First POS billing session started", date: "13 Mar 2024" },
  { text: "Loyalty module enabled", date: "20 Mar 2024" },
  { text: "WhatsApp campaigns launched", date: "02 Apr 2024" },
];

export function formatInr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function platformDateLabel(d = new Date()) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function getTenant(id: string) {
  return TENANTS.find((t) => t.id === id) ?? TENANTS[0];
}
