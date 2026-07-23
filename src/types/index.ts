export type OrderStatus = "Preparing" | "Served" | "Billed" | "Cancelled";

export type PaymentMode = "Cash" | "UPI" | "Card";

export type PaymentStatus = "Paid" | "Pending" | "Refunded";

export interface StatCardData {
  label: string;
  value: string;
  change?: string;
  changeType?: "up" | "down";
  helpText?: string;
  icon: string;
  accent: "brand" | "success" | "warning" | "danger";
}

export interface RevenuePoint {
  day: string;
  revenue: number;
}

export interface PeakHourPoint {
  hour: string;
  orders: number;
}

export interface RecentOrder {
  id: string;
  table: string;
  items: string;
  amount: number;
  time: string;
  status: OrderStatus;
  waiter: string;
}

export interface TopSellingItem {
  rank: number;
  name: string;
  orders: number;
  revenue: number;
  progress: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  gst: number;
  available: boolean;
  image: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  reorderLevel: number;
  lastStockIn: string;
  supplier: string;
}

export interface ExpenseItem {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  paidVia: PaymentMode;
  hasBill: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastVisit: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  customer: string;
  amount: number;
  mode: PaymentMode;
  status: PaymentStatus;
  date: string;
}

export interface SubscriptionPlan {
  name: string;
  price: number;
  period: "month";
  users: string;
  highlight?: boolean;
  features: string[];
}
