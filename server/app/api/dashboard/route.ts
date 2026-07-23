import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthContext, unauthorized } from "@/lib/auth-context";
import { withCors, corsPreflight } from "@/lib/cors";
import { startOfDay, endOfDay, daysAgo, DAY_LABELS } from "@/lib/dates";
import Order from "@/models/Order";
import Expense from "@/models/Expense";
import InventoryItem from "@/models/InventoryItem";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  const auth = getAuthContext(request);
  if (!auth) return unauthorized(request);

  await connectToDatabase();
  const restaurant = auth.restaurantId;

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [todayOrders, todayExpenses, stockAlerts, weekOrders, recentOrders] = await Promise.all([
    Order.find({ restaurant, createdAt: { $gte: todayStart, $lte: todayEnd }, status: { $ne: "Refunded" } }),
    Expense.find({ restaurant, createdAt: { $gte: todayStart, $lte: todayEnd } }),
    InventoryItem.countDocuments({ restaurant, $expr: { $lte: ["$quantity", "$reorderLevel"] } }),
    Order.find({ restaurant, createdAt: { $gte: startOfDay(daysAgo(6)) }, status: { $ne: "Refunded" } }),
    Order.find({ restaurant }).sort({ createdAt: -1 }).limit(6),
  ]);

  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const todayExpenseTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  const weeklyRevenue = Array.from({ length: 7 }, (_, i) => {
    const day = daysAgo(6 - i);
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    const revenue = weekOrders
      .filter((o) => o.createdAt >= dayStart && o.createdAt <= dayEnd)
      .reduce((sum, o) => sum + o.total, 0);
    return { day: DAY_LABELS[day.getDay()], revenue };
  });

  return withCors(
    request,
    NextResponse.json({
      todayRevenue,
      todayOrdersCount: todayOrders.length,
      stockAlerts,
      todayExpenseTotal,
      weeklyRevenue,
      recentBills: recentOrders.map((o) => ({
        id: o._id.toString(),
        billNo: o.billNo,
        customerName: o.customerName,
        tableOrNo: o.tableOrNo,
        total: o.total,
        status: o.status,
        createdAt: o.createdAt,
      })),
      todayExpensesList: todayExpenses.map((e) => ({
        id: e._id.toString(),
        description: e.description,
        amount: e.amount,
      })),
    }),
  );
}
