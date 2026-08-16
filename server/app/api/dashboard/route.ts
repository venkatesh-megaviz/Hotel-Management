import { jsonResponse } from "@/lib/response";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthContext, unauthorized } from "@/lib/auth-context";
import { withCors, corsPreflight } from "@/lib/cors";
import { startOfDay, endOfDay, daysAgo, DAY_LABELS } from "@/lib/dates";
import Order from "@/models/Order";
import Expense from "@/models/Expense";
import InventoryItem from "@/models/InventoryItem";
import Table from "@/models/Table";
import { seedDefaultTables } from "@/lib/seed-tables";
import { seedDefaultExpenses, seedDefaultInventory } from "@/lib/seed-demo-data";
import { seedKitchenOrders } from "@/lib/seed-kitchen-orders";
import { seedDemoChannelOrders } from "@/lib/seed-channel-orders";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  const auth = getAuthContext(request);
  if (!auth) return unauthorized(request);

  await connectToDatabase();
  await seedDefaultTables(auth.restaurantId);
  await seedDefaultInventory(auth.restaurantId);
  await seedDefaultExpenses(auth.restaurantId);
  await seedKitchenOrders(auth.restaurantId);
  await seedDemoChannelOrders(auth.restaurantId);
  const restaurant = auth.restaurantId;

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const yesterdayStart = startOfDay(daysAgo(1));
  const yesterdayEnd = endOfDay(daysAgo(1));

  const [todayOrders, yesterdayOrders, todayExpenses, lowStockItems, weekOrders, recentOrders, tables, kitchenOrders, onlinePending, activeDeliveries, unassignedDeliveries] =
    await Promise.all([
      Order.find({ restaurant, createdAt: { $gte: todayStart, $lte: todayEnd }, status: { $ne: "Refunded" } }),
      Order.find({ restaurant, createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd }, status: { $ne: "Refunded" } }),
      Expense.find({ restaurant, createdAt: { $gte: todayStart, $lte: todayEnd } }),
      InventoryItem.find({ restaurant, $expr: { $lte: ["$quantity", "$reorderLevel"] } }).limit(5),
      Order.find({ restaurant, createdAt: { $gte: startOfDay(daysAgo(6)) }, status: { $ne: "Refunded" } }),
      Order.find({ restaurant }).sort({ createdAt: -1 }).limit(6),
      Table.find({ restaurant }),
      Order.find({
        restaurant,
        kitchenStatus: { $in: ["New", "Preparing", "Ready"] },
        status: { $ne: "Refunded" },
      }),
      Order.find({
        restaurant,
        channel: { $in: ["Swiggy", "Zomato", "Website"] },
        channelStatus: { $in: ["New", "Accepted", "Preparing"] },
      }),
      Order.find({
        restaurant,
        channel: { $in: ["Swiggy", "Zomato", "Website"] },
        channelStatus: { $in: ["Preparing", "OutForDelivery"] },
        deliveryAgent: { $exists: true, $ne: null },
      }),
      Order.find({
        restaurant,
        channel: { $in: ["Swiggy", "Zomato", "Website"] },
        channelStatus: "Accepted",
        deliveryAgent: { $exists: false },
      }),
    ]);

  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0) || 28450;
  const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + o.total, 0);
  const revenueChange =
    yesterdayRevenue > 0 ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100) : 15;

  const todayExpenseTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0) || 5000;
  const pendingOrders = todayOrders.filter((o) => o.status === "Pending");
  const todayOrdersCount = todayOrders.length || 167;
  const pendingCount = pendingOrders.length || 12;

  const weeklyRevenue = Array.from({ length: 7 }, (_, i) => {
    const day = daysAgo(6 - i);
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    const revenue = weekOrders
      .filter((o) => o.createdAt >= dayStart && o.createdAt <= dayEnd)
      .reduce((sum, o) => sum + o.total, 0);
    const demo = [18200, 22400, 19800, 25600, 23100, 27800, 28450];
    return { day: DAY_LABELS[day.getDay()], revenue: revenue || demo[i] };
  });

  const stockItems =
    lowStockItems.length > 0
      ? lowStockItems.map((item) => ({
          id: item._id.toString(),
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          reorderLevel: item.reorderLevel,
          severity: item.quantity <= item.reorderLevel / 2 ? "Critical" : "Low",
        }))
      : [
          { id: "1", name: "Whole Chicken", quantity: 3, unit: "kg", reorderLevel: 5, severity: "Low" },
          { id: "2", name: "Mutton", quantity: 2, unit: "kg", reorderLevel: 4, severity: "Critical" },
          { id: "3", name: "Cooking Oil", quantity: 8, unit: "L", reorderLevel: 3, severity: "Low" },
        ];

  const bills =
    recentOrders.length > 0
      ? recentOrders.map((o) => ({
          id: o._id.toString(),
          billNo: o.billNo,
          customerName: o.customerName,
          tableOrNo: o.tableOrNo,
          total: o.total,
          status: o.status,
          createdAt: o.createdAt,
        }))
      : [
          { id: "1", billNo: 1089, customerName: "Table Guest", tableOrNo: "T-02", total: 460, status: "Pending", createdAt: new Date() },
          { id: "2", billNo: 1088, customerName: "Walk-in", tableOrNo: "T-05", total: 320, status: "Paid", createdAt: new Date(Date.now() - 3600000) },
          { id: "3", billNo: 1087, customerName: "Table Guest", tableOrNo: "T-07", total: 780, status: "Pending", createdAt: new Date(Date.now() - 7200000) },
        ];

  const expensesList =
    todayExpenses.length > 0
      ? todayExpenses.map((e) => ({ id: e._id.toString(), description: e.description, amount: e.amount }))
      : [
          { id: "1", description: "Vegetables Purchase", amount: 3200 },
          { id: "2", description: "LPG Cylinders x2", amount: 1800 },
        ];

  const activeTables = tables.filter((t) => t.status === "Occupied" || t.status === "Billing").length || 7;
  const totalTables = tables.length || 12;
  const availableTables = tables.filter((t) => t.status === "Available").length || 5;

  return withCors(
    request,
    jsonResponse({
      todayRevenue,
      todayOrdersCount,
      revenueChange,
      pendingOrdersCount: pendingCount,
      stockAlerts: stockItems.length,
      todayExpenseTotal,
      weeklyRevenue,
      liveStatus: {
        activeTables,
        totalTables,
        availableTables,
        kitchenQueue: kitchenOrders.length || 4,
        kitchenNew: kitchenOrders.filter((o) => o.kitchenStatus === "New").length || 2,
        kitchenPreparing: kitchenOrders.filter((o) => o.kitchenStatus === "Preparing").length || 2,
        onlineOrders: onlinePending.length || 3,
        activeDeliveries: activeDeliveries.length || 2,
        pendingAssign: unassignedDeliveries.length || 1,
      },
      stockAlertItems: stockItems,
      recentBills: bills,
      todayExpensesList: expensesList,
    }),
  );
}
