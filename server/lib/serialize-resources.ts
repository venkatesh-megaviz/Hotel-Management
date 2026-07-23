import type { MenuItemDoc } from "@/models/MenuItem";
import type { OrderDoc } from "@/models/Order";
import type { InventoryItemDoc } from "@/models/InventoryItem";
import type { StockEntryDoc } from "@/models/StockEntry";
import type { ExpenseDoc } from "@/models/Expense";
import type { CustomerDoc } from "@/models/Customer";
import type { NotificationDoc } from "@/models/Notification";

export function serializeMenuItem(item: MenuItemDoc) {
  return {
    id: item._id.toString(),
    name: item.name,
    category: item.category,
    price: item.price,
    gst: item.gst,
    foodType: item.foodType,
    available: item.available,
  };
}

export function serializeOrder(order: OrderDoc) {
  return {
    id: order._id.toString(),
    billNo: order.billNo,
    tableOrNo: order.tableOrNo,
    customerName: order.customerName,
    items: order.items,
    subtotal: order.subtotal,
    gstAmount: order.gstAmount,
    total: order.total,
    mode: order.mode,
    status: order.status,
    notes: order.notes,
    createdAt: order.createdAt,
  };
}

export function serializeInventoryItem(item: InventoryItemDoc) {
  return {
    id: item._id.toString(),
    name: item.name,
    unit: item.unit,
    quantity: item.quantity,
    reorderLevel: item.reorderLevel,
  };
}

export function serializeStockEntry(entry: StockEntryDoc) {
  return {
    id: entry._id.toString(),
    item: entry.item,
    quantity: entry.quantity,
    unit: entry.unit,
    supplier: entry.supplier,
    cost: entry.cost,
    createdAt: entry.createdAt,
  };
}

export function serializeExpense(expense: ExpenseDoc) {
  return {
    id: expense._id.toString(),
    description: expense.description,
    category: expense.category,
    paymentMode: expense.paymentMode,
    hasBill: expense.hasBill,
    billUrl: expense.billUrl,
    amount: expense.amount,
    createdAt: expense.createdAt,
  };
}

export function serializeCustomer(customer: CustomerDoc) {
  return {
    id: customer._id.toString(),
    name: customer.name,
    phone: customer.phone,
    totalVisits: customer.totalVisits,
    totalSpent: customer.totalSpent,
    createdAt: customer.createdAt,
  };
}

export function serializeNotification(notification: NotificationDoc) {
  return {
    id: notification._id.toString(),
    title: notification.title,
    message: notification.message,
    category: notification.category,
    severity: notification.severity,
    read: notification.read,
    createdAt: notification.createdAt,
  };
}
