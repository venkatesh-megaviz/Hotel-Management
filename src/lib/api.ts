/** Empty string = same-origin `/api/*` (Vercel proxy in prod, Vite proxy in dev). */
const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") ?? "";

export interface ApiUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export interface ApiRestaurant {
  id: string;
  name: string;
  businessType: string;
  city: string;
  phone: string;
  gstin: string;
  plan: "Basic" | "Standard" | "Premium";
  billingCycle: "Monthly" | "Annual";
  trialEndsAt: string;
  ownerName?: string;
  email?: string;
  fssai?: string;
  state?: string;
  address?: string;
  logoUrl?: string;
  gstEnabled?: boolean;
  cgst?: number;
  sgst?: number;
  igst?: number;
  gstInclusive?: boolean;
  invoicePrefix?: string;
  invoiceStartNumber?: number;
  invoiceFooterText?: string;
  invoiceTerms?: string;
  showLogoOnInvoice?: boolean;
  digitalSignature?: boolean;
}

export interface AuthResponse {
  user: ApiUser;
  restaurant: ApiRestaurant | null;
}

export class ApiError extends Error {}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(data?.error || "Something went wrong. Please try again.");
  }

  return data as T;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  restaurantName: string;
  businessType: string;
  city: string;
  phone: string;
  gstin?: string;
  plan: "Basic" | "Standard" | "Premium";
  billingCycle: "Monthly" | "Annual";
}

export function registerAccount(payload: RegisterPayload) {
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginAccount(email: string, password: string) {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function fetchCurrentUser() {
  return request<AuthResponse>("/api/auth/me");
}

export function logoutAccount() {
  return request<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
}

// ---------- Menu ----------

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  gst: number;
  foodType: "Veg" | "Non-Veg";
  available: boolean;
}

export interface MenuItemInput {
  name: string;
  category: string;
  price: number;
  gst: number;
  foodType: "Veg" | "Non-Veg";
  available?: boolean;
}

export function fetchMenuItems() {
  return request<{ items: MenuItem[] }>("/api/menu");
}

export function createMenuItem(payload: MenuItemInput) {
  return request<{ item: MenuItem }>("/api/menu", { method: "POST", body: JSON.stringify(payload) });
}

export function updateMenuItem(id: string, payload: Partial<MenuItemInput>) {
  return request<{ item: MenuItem }>(`/api/menu/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function deleteMenuItem(id: string) {
  return request<{ ok: boolean }>(`/api/menu/${id}`, { method: "DELETE" });
}

// ---------- Orders (Billing + Payments) ----------

export interface OrderLine {
  menuItemId?: string;
  name: string;
  price: number;
  gst: number;
  qty: number;
}

export interface Order {
  id: string;
  billNo: number;
  tableId?: string | null;
  tableOrNo: string;
  customerName: string;
  items: OrderLine[];
  subtotal: number;
  gstAmount: number;
  total: number;
  mode: "Cash" | "UPI" | "Card";
  status: "Paid" | "Pending" | "Refunded";
  kitchenStatus?: "New" | "Preparing" | "Ready" | "Served";
  orderType?: "Dine-in" | "Takeaway" | "Online" | "Parcel";
  channel?: "POS" | "QR" | "Swiggy" | "Zomato" | "Website";
  channelStatus?: string;
  deliveryAddress?: string;
  deliveryAgentId?: string | null;
  eta?: number | null;
  externalId?: string;
  priority?: boolean;
  notes?: string;
  createdAt: string;
}

export interface OrderInput {
  tableId?: string;
  tableOrNo?: string;
  customerName?: string;
  items: OrderLine[];
  mode: "Cash" | "UPI" | "Card";
  status?: "Paid" | "Pending" | "Refunded";
  kitchenStatus?: "New" | "Preparing" | "Ready" | "Served";
  orderType?: "Dine-in" | "Takeaway" | "Online" | "Parcel";
  priority?: boolean;
  notes?: string;
  createdAt?: string;
}

export function fetchOrders(status?: string) {
  const qs = status && status !== "All" ? `?status=${encodeURIComponent(status)}` : "";
  return request<{ orders: Order[] }>(`/api/orders${qs}`);
}

export function createOrder(payload: OrderInput) {
  return request<{ order: Order }>("/api/orders", { method: "POST", body: JSON.stringify(payload) });
}

export function updateOrderStatus(id: string, status: Order["status"]) {
  return request<{ order: Order }>(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
}

export function updateOrder(
  id: string,
  payload: Partial<{ status: Order["status"]; kitchenStatus: Order["kitchenStatus"]; mode: Order["mode"] }>,
) {
  return request<{ order: Order }>(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function fetchOrder(id: string) {
  return request<{ order: Order }>(`/api/orders/${id}`);
}

// ---------- Inventory ----------

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  reorderLevel: number;
}

export interface StockEntry {
  id: string;
  item: string;
  quantity: number;
  unit: string;
  supplier: string;
  cost: number;
  createdAt: string;
}

export interface StockEntryInput {
  item: string;
  quantity: number;
  unit: string;
  supplier?: string;
  cost?: number;
}

export function fetchInventory() {
  return request<{ items: InventoryItem[] }>("/api/inventory");
}

export function fetchStockEntries() {
  return request<{ entries: StockEntry[] }>("/api/inventory/stock-in");
}

export function createStockEntry(payload: StockEntryInput) {
  return request<{ entry: StockEntry }>("/api/inventory/stock-in", { method: "POST", body: JSON.stringify(payload) });
}

export function updateInventoryItem(id: string, payload: Partial<Pick<InventoryItem, "name" | "unit" | "quantity" | "reorderLevel">>) {
  return request<{ item: InventoryItem }>(`/api/inventory/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

// ---------- Expenses ----------

export type ExpenseCategory = "Raw Materials" | "Fuel" | "Payroll" | "Utilities" | "Operations" | "Maintenance" | "Other";

export interface Expense {
  id: string;
  description: string;
  category: ExpenseCategory;
  paymentMode: "Cash" | "UPI" | "Card" | "Online" | "Bank Transfer";
  hasBill: boolean;
  billUrl?: string;
  amount: number;
  createdAt: string;
}

export interface ExpenseInput {
  description: string;
  category: ExpenseCategory;
  paymentMode: Expense["paymentMode"];
  hasBill?: boolean;
  billUrl?: string;
  amount: number;
  createdAt?: string;
}

export function fetchExpenses(category?: string) {
  const qs = category && category !== "All" ? `?category=${encodeURIComponent(category)}` : "";
  return request<{ expenses: Expense[] }>(`/api/expenses${qs}`);
}

export function createExpense(payload: ExpenseInput) {
  return request<{ expense: Expense }>("/api/expenses", { method: "POST", body: JSON.stringify(payload) });
}

export function updateExpense(id: string, payload: Partial<ExpenseInput>) {
  return request<{ expense: Expense }>(`/api/expenses/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function deleteExpense(id: string) {
  return request<{ ok: boolean }>(`/api/expenses/${id}`, { method: "DELETE" });
}

// ---------- Customers ----------

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  totalVisits: number;
  totalSpent: number;
  loyaltyPointsRedeemed?: number;
  createdAt: string;
}

export interface CustomerInput {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
}

export function fetchCustomers() {
  return request<{ customers: Customer[] }>("/api/customers");
}

export function createCustomer(payload: CustomerInput) {
  return request<{ customer: Customer }>("/api/customers", { method: "POST", body: JSON.stringify(payload) });
}

export function updateCustomer(id: string, payload: Partial<CustomerInput>) {
  return request<{ customer: Customer }>(`/api/customers/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function deleteCustomer(id: string) {
  return request<{ ok: boolean }>(`/api/customers/${id}`, { method: "DELETE" });
}

export function redeemLoyaltyPoints(id: string, points: number) {
  return request<{ customer: Customer; redeemed: number; discountAmount: number }>(`/api/customers/${id}/redeem`, {
    method: "POST",
    body: JSON.stringify({ points }),
  });
}

// ---------- Recipes ----------

export interface RecipeIngredient {
  name: string;
  qty: string;
  cost: number;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  salePrice: number;
  ingredients: RecipeIngredient[];
  costPrice: number;
  grossProfit: number;
  margin: number;
  ingredientCount: number;
}

export interface RecipeInput {
  name: string;
  category: string;
  salePrice: number;
  ingredients: RecipeIngredient[];
}

export function fetchRecipes() {
  return request<{
    recipes: Recipe[];
    summary: { total: number; avgMargin: number; avgCost: number; avgPrice: number };
  }>("/api/recipes");
}

export function createRecipe(payload: RecipeInput) {
  return request<{ recipe: Recipe }>("/api/recipes", { method: "POST", body: JSON.stringify(payload) });
}

export function deleteRecipe(id: string) {
  return request<{ ok: boolean }>(`/api/recipes/${id}`, { method: "DELETE" });
}

export function updateRecipe(id: string, payload: Partial<RecipeInput>) {
  return request<{ recipe: Recipe }>(`/api/recipes/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

// ---------- Dashboard ----------

export interface DashboardData {
  todayRevenue: number;
  todayOrdersCount: number;
  revenueChange: number;
  pendingOrdersCount: number;
  stockAlerts: number;
  todayExpenseTotal: number;
  weeklyRevenue: { day: string; revenue: number }[];
  liveStatus: {
    activeTables: number;
    totalTables: number;
    availableTables: number;
    kitchenQueue: number;
    kitchenNew: number;
    kitchenPreparing: number;
    onlineOrders: number;
    activeDeliveries: number;
    pendingAssign: number;
  };
  stockAlertItems: {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    reorderLevel: number;
    severity: "Low" | "Critical";
  }[];
  recentBills: {
    id: string;
    billNo: number;
    customerName: string;
    tableOrNo: string;
    total: number;
    status: Order["status"];
    createdAt: string;
  }[];
  todayExpensesList: { id: string; description: string; amount: number }[];
}

export function fetchDashboard() {
  return request<DashboardData>("/api/dashboard");
}

// ---------- Reports ----------

export interface ReportsData {
  range: string;
  tab?: string;
  revenue: number;
  revenueChange: number;
  orders: number;
  orderChange: number;
  expenses: number;
  expenseEntries: number;
  avgBill: number;
  salesTrend: { label: string; revenue: number }[];
  expenseByCategory: { name: string; value: number }[];
  stockInEntries: { id: string; item: string; quantity: number; unit: string; cost: number; createdAt?: string }[];
  topItems?: { name: string; category: string; orders: number; revenue: number; popularity: number }[];
  topItemsSummary?: { totalSold: number; topCategory: string; bestSeller: string; bestSellerOrders: number; topRevenueItem: string; topRevenue: number };
  customersReport?: { id: string; name: string; phone: string; visits: number; totalSpent: number; avgOrder: number; lastOrder: string }[];
  customersSummary?: { total: number; repeat: number; avgSpend: number; totalRevenue: number };
  inventoryReport?: { name: string; stock: number; unit: string; status: string }[];
  inventorySummary?: { totalItems: number; lowStock: number; critical: number; criticalItem: string; criticalQty: number; criticalUnit: string; stockValue: number };
  gstReport?: { period: string; totalSales: number; taxableValue: number; cgst: number; sgst: number; totalGst: number; status: string }[];
  gstSummary?: { decLiability: number; cgst: number; sgst: number; filedMonths: number; dueMessage: string };
  staffReport?: { name: string; role: string; shift: string; status: string; checkIn: string; dutyStatus: string }[];
  staffSummary?: { totalStaff: number; presentToday: number; presentDetail: string; avgAttendance: number; lateThisWeek: number };
  weeklyTrend?: { label: string; absent: number; attendancePct: number }[];
}

export function fetchReports(range: "Daily" | "Weekly" | "Monthly", tab = "sales") {
  return request<ReportsData>(`/api/reports?range=${range}&tab=${tab}`);
}

export interface AccountingData {
  pl: {
    revenue: number;
    expenses: number;
    netProfit: number;
    margin: number;
    revenueChange: number;
    expenseChange: number;
    trend: { label: string; revenue: number; expenses: number; profit: number }[];
    monthly: { month: string; revenue: number; expenses: number; profit: number; margin: number }[];
  };
  gst: {
    dueMessage: string;
    periods: { period: string; totalSales: number; taxable: number; cgst: number; sgst: number; totalGst: number; status: string }[];
  };
  integrations: { id: string; name: string; description: string; status: string; connected: boolean; icon: string; lastSyncAt?: string | null }[];
}

export function fetchAccounting() {
  return request<AccountingData>("/api/accounting");
}

export function accountingAction(payload: {
  action: "fileGst" | "toggleIntegration" | "syncIntegration";
  period?: string;
  integrationId?: "tally" | "quickbooks" | "zoho" | "bank";
}) {
  return request<AccountingData>("/api/accounting", { method: "PATCH", body: JSON.stringify(payload) });
}

export function changeSubscriptionPlan(plan: "Basic" | "Standard" | "Premium") {
  return request<{ restaurant: ApiRestaurant }>("/api/subscription", { method: "POST", body: JSON.stringify({ plan }) });
}

export interface GuestMenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  gst: number;
  foodType: string;
}

export interface GuestQRSession {
  table: { id: string; number: string; seats: number; area: string };
  restaurant: { name: string };
  menu: GuestMenuItem[];
}

async function publicRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data?.error || "Something went wrong. Please try again.");
  return data as T;
}

export function fetchGuestQRMenu(tableId: string) {
  return publicRequest<GuestQRSession>(`/api/ordering/qr/guest/${tableId}`);
}

export function submitGuestQROrder(
  tableId: string,
  payload: { customerName?: string; items: { name: string; price: number; qty: number; gst: number }[] },
) {
  return publicRequest<{ order: Order }>(`/api/ordering/qr/guest/${tableId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------- Settings ----------

export function fetchProfile() {
  return request<{ restaurant: ApiRestaurant }>("/api/settings/profile");
}

export function updateProfile(payload: Partial<ApiRestaurant>) {
  return request<{ restaurant: ApiRestaurant }>("/api/settings/profile", { method: "PATCH", body: JSON.stringify(payload) });
}

export function changePassword(currentPassword: string, newPassword: string) {
  return request<{ ok: boolean }>("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

// ---------- Notifications ----------

export type NotificationCategory = "Payments" | "Customers" | "Inventory" | "System";
export type NotificationSeverity = "warning" | "info" | "success";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  read: boolean;
  createdAt: string;
}

export function fetchNotifications() {
  return request<{ notifications: AppNotification[] }>("/api/notifications");
}

export function markNotificationRead(id: string) {
  return request<{ notification: AppNotification }>(`/api/notifications/${id}`, { method: "PATCH" });
}

export function dismissNotification(id: string) {
  return request<{ ok: boolean }>(`/api/notifications/${id}`, { method: "DELETE" });
}

export function clearAllNotifications() {
  return request<{ ok: boolean }>("/api/notifications", { method: "DELETE" });
}

export function markAllNotificationsRead() {
  return request<{ ok: boolean }>("/api/notifications", { method: "PATCH" });
}

// ---------- Attendance ----------

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  shift: "Morning" | "Evening";
  status: "Present" | "Late" | "Absent" | "Off Duty";
  checkIn: string;
  checkOut: string;
  active: boolean;
}

export interface AttendanceDay {
  id: string;
  date: string;
  present: number;
  late: number;
  absent: number;
  attendancePct: number;
}

export interface StaffInput {
  name: string;
  role: string;
  phone?: string;
  shift?: "Morning" | "Evening";
}

export function fetchAttendance() {
  return request<{
    staff: StaffMember[];
    summary: { total: number; present: number; late: number; absent: number };
    history: AttendanceDay[];
  }>("/api/attendance");
}

export function createStaffMember(payload: StaffInput) {
  return request<{ staff: StaffMember }>("/api/attendance", { method: "POST", body: JSON.stringify(payload) });
}

export function updateStaffAttendance(id: string, payload: { action?: "check-in" | "check-out"; status?: string }) {
  return request<{ staff: StaffMember }>(`/api/attendance/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

// ---------- Tables ----------

export type TableStatus = "Available" | "Occupied" | "Reserved" | "Billing";
export type TableArea = "Indoor" | "Outdoor" | "Private";

export interface RestaurantTable {
  id: string;
  number: string;
  seats: number;
  area: TableArea;
  status: TableStatus;
  customerName: string;
  reservedAt: string;
  occupiedAt: string | null;
  currentOrder: string | null;
}

export interface TableSummary {
  available: number;
  occupied: number;
  reserved: number;
  billing: number;
}

export function fetchTables(area?: string) {
  const qs = area && area !== "All" ? `?area=${encodeURIComponent(area)}` : "";
  return request<{ tables: RestaurantTable[]; summary: TableSummary }>(`/api/tables${qs}`);
}

export function createTable(payload: { number: string; seats: number; area: TableArea }) {
  return request<{ table: RestaurantTable }>("/api/tables", { method: "POST", body: JSON.stringify(payload) });
}

export function updateTable(
  id: string,
  payload: Partial<{ status: TableStatus; customerName: string; reservedAt: string; seats: number; area: TableArea }>,
) {
  return request<{ table: RestaurantTable }>(`/api/tables/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function deleteTable(id: string) {
  return request<{ ok: boolean }>(`/api/tables/${id}`, { method: "DELETE" });
}

// ---------- Kitchen ----------

export function fetchKitchenOrders(status?: string) {
  const qs = status && status !== "All" ? `?status=${encodeURIComponent(status)}` : "";
  return request<{ orders: Order[]; summary: { new: number; preparing: number; ready: number } }>(`/api/kitchen${qs}`);
}

// ---------- QR Ordering ----------

export function fetchQROrders() {
  return request<{ orders: Order[]; summary: { pending: number; accepted: number; completed: number } }>("/api/ordering/qr");
}

export function updateQROrder(id: string, channelStatus: string) {
  return request<{ order: Order }>(`/api/ordering/qr/${id}`, { method: "PATCH", body: JSON.stringify({ channelStatus }) });
}

export interface QRCodeEntry {
  id: string;
  number: string;
  seats: number;
  area: string;
  status: string;
  orderUrl: string;
  qrImageUrl: string;
}

export function fetchQRCodes() {
  return request<{ codes: QRCodeEntry[] }>("/api/ordering/qr-codes");
}

// ---------- Online Ordering ----------

export function fetchOnlineOrders(platform?: string) {
  const qs = platform && platform !== "All" ? `?platform=${encodeURIComponent(platform)}` : "";
  return request<{ orders: Order[]; summary: Record<string, number> }>(`/api/ordering/online${qs}`);
}

export function updateOnlineOrder(id: string, payload: { channelStatus?: string; deliveryAgentId?: string; eta?: number }) {
  return request<{ order: Order }>(`/api/ordering/online/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

// ---------- Delivery ----------

export interface DeliveryOrder extends Order {
  agentName: string;
  deliveryLabel: string;
  deliveryId: string;
}

export interface DeliveryAgent {
  id: string;
  name: string;
  phone: string;
  status: "Active" | "Idle" | "Off Duty";
  todayRuns: number;
  rating: number;
}

export function fetchDeliveries() {
  return request<{ deliveries: DeliveryOrder[]; summary: { active: number; pending: number; delivered: number } }>(
    "/api/delivery/deliveries",
  );
}

export function updateDelivery(id: string, payload: { channelStatus?: string; deliveryAgentId?: string; eta?: number }) {
  return request<{ delivery: DeliveryOrder }>(`/api/delivery/deliveries/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function fetchDeliveryAgents() {
  return request<{ agents: DeliveryAgent[] }>("/api/delivery/agents");
}

export function updateDeliveryAgent(id: string, payload: Partial<DeliveryAgent>) {
  return request<{ agent: DeliveryAgent }>(`/api/delivery/agents/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}
