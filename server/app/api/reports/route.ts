import { jsonResponse } from "@/lib/response";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthContext, unauthorized } from "@/lib/auth-context";
import { withCors, corsPreflight } from "@/lib/cors";
import { startOfDay, endOfDay, daysAgo } from "@/lib/dates";
import Order from "@/models/Order";
import Expense from "@/models/Expense";
import StockEntry from "@/models/StockEntry";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

const RANGE_DAYS: Record<string, number> = { Daily: 1, Weekly: 7, Monthly: 30 };

export async function GET(request: Request) {
  const auth = getAuthContext(request);
  if (!auth) return unauthorized(request);

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") ?? "Weekly";
  const days = RANGE_DAYS[range] ?? 7;

  await connectToDatabase();
  const restaurant = auth.restaurantId;

  const rangeStart = startOfDay(daysAgo(days - 1));
  const rangeEnd = endOfDay(new Date());
  const prevStart = startOfDay(daysAgo(days * 2 - 1));
  const prevEnd = endOfDay(daysAgo(days));

  const [orders, expenses, prevOrders, stockEntries] = await Promise.all([
    Order.find({ restaurant, createdAt: { $gte: rangeStart, $lte: rangeEnd }, status: { $ne: "Refunded" } }),
    Expense.find({ restaurant, createdAt: { $gte: rangeStart, $lte: rangeEnd } }),
    Order.find({ restaurant, createdAt: { $gte: prevStart, $lte: prevEnd }, status: { $ne: "Refunded" } }),
    StockEntry.find({ restaurant, createdAt: { $gte: rangeStart, $lte: rangeEnd } }).sort({ createdAt: -1 }),
  ]);

  const revenue = orders.reduce((sum, o) => sum + o.total, 0);
  const expenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const avgBill = orders.length ? revenue / orders.length : 0;
  const prevRevenue = prevOrders.reduce((sum, o) => sum + o.total, 0);
  const revenueChange = prevRevenue ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : 0;
  const orderChange = prevOrders.length ? Math.round(((orders.length - prevOrders.length) / prevOrders.length) * 100) : 0;

  const salesTrend = Array.from({ length: days }, (_, i) => {
    const day = daysAgo(days - 1 - i);
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    const dayRevenue = orders
      .filter((o) => o.createdAt >= dayStart && o.createdAt <= dayEnd)
      .reduce((sum, o) => sum + o.total, 0);
    return {
      label: days <= 7 ? day.toLocaleDateString("en-US", { weekday: "short" }) : day.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
      revenue: dayRevenue,
    };
  });

  const expenseByCategory = Object.values(
    expenses.reduce<Record<string, { name: string; value: number }>>((acc, e) => {
      acc[e.category] = acc[e.category] ?? { name: e.category, value: 0 };
      acc[e.category].value += e.amount;
      return acc;
    }, {}),
  );

  return withCors(
    request,
    jsonResponse({
      range,
      revenue,
      revenueChange,
      orders: orders.length,
      orderChange,
      expenses: expenseTotal,
      expenseEntries: expenses.length,
      avgBill,
      salesTrend,
      expenseByCategory,
      stockInEntries: stockEntries.slice(0, 10).map((s) => ({
        id: s._id.toString(),
        item: s.item,
        quantity: s.quantity,
        unit: s.unit,
        cost: s.cost,
      })),
    }),
  );
}
