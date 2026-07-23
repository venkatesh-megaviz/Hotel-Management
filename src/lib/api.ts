const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/+$/, "");

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
  tableOrNo: string;
  customerName: string;
  items: OrderLine[];
  subtotal: number;
  gstAmount: number;
  total: number;
  mode: "Cash" | "UPI" | "Card";
  status: "Paid" | "Pending" | "Refunded";
  notes?: string;
  createdAt: string;
}

export interface OrderInput {
  tableOrNo?: string;
  customerName?: string;
  items: OrderLine[];
  mode: "Cash" | "UPI" | "Card";
  status?: "Paid" | "Pending" | "Refunded";
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

export function deleteExpense(id: string) {
  return request<{ ok: boolean }>(`/api/expenses/${id}`, { method: "DELETE" });
}

// ---------- Customers ----------

export interface Customer {
  id: string;
  name: string;
  phone: string;
  totalVisits: number;
  totalSpent: number;
  createdAt: string;
}

export interface CustomerInput {
  name: string;
  phone: string;
  totalVisits?: number;
  totalSpent?: number;
}

export function fetchCustomers() {
  return request<{ customers: Customer[] }>("/api/customers");
}

export function createCustomer(payload: CustomerInput) {
  return request<{ customer: Customer }>("/api/customers", { method: "POST", body: JSON.stringify(payload) });
}

// ---------- Dashboard ----------

export interface DashboardData {
  todayRevenue: number;
  todayOrdersCount: number;
  stockAlerts: number;
  todayExpenseTotal: number;
  weeklyRevenue: { day: string; revenue: number }[];
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
  revenue: number;
  revenueChange: number;
  orders: number;
  orderChange: number;
  expenses: number;
  expenseEntries: number;
  avgBill: number;
  salesTrend: { label: string; revenue: number }[];
  expenseByCategory: { name: string; value: number }[];
  stockInEntries: { id: string; item: string; quantity: number; unit: string; cost: number }[];
}

export function fetchReports(range: "Daily" | "Weekly" | "Monthly") {
  return request<ReportsData>(`/api/reports?range=${range}`);
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
