import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import express from "express";
import cookieParser from "cookie-parser";
import { mountRoute } from "@/lib/express-adapter";

import * as health from "@/app/api/health/route";
import * as register from "@/app/api/auth/register/route";
import * as login from "@/app/api/auth/login/route";
import * as me from "@/app/api/auth/me/route";
import * as logout from "@/app/api/auth/logout/route";
import * as changePassword from "@/app/api/auth/change-password/route";
import * as menu from "@/app/api/menu/route";
import * as menuId from "@/app/api/menu/[id]/route";
import * as orders from "@/app/api/orders/route";
import * as orderId from "@/app/api/orders/[id]/route";
import * as inventory from "@/app/api/inventory/route";
import * as stockIn from "@/app/api/inventory/stock-in/route";
import * as expenses from "@/app/api/expenses/route";
import * as expenseId from "@/app/api/expenses/[id]/route";
import * as customers from "@/app/api/customers/route";
import * as dashboard from "@/app/api/dashboard/route";
import * as reports from "@/app/api/reports/route";
import * as profile from "@/app/api/settings/profile/route";
import * as notifications from "@/app/api/notifications/route";
import * as notificationId from "@/app/api/notifications/[id]/route";

const app = express();
const port = Number(process.env.PORT) || 4000;

app.set("trust proxy", 1);
app.use(cookieParser());
app.use(express.json());

app.get("/", (_req, res) => {
  res.type("html").send("<h1>HotelLite API</h1><p>Backend is running.</p>");
});

mountRoute(app, "options", "/api/health", health.OPTIONS);
mountRoute(app, "get", "/api/health", health.GET);

mountRoute(app, "options", "/api/auth/register", register.OPTIONS);
mountRoute(app, "post", "/api/auth/register", register.POST);

mountRoute(app, "options", "/api/auth/login", login.OPTIONS);
mountRoute(app, "post", "/api/auth/login", login.POST);

mountRoute(app, "options", "/api/auth/me", me.OPTIONS);
mountRoute(app, "get", "/api/auth/me", me.GET);

mountRoute(app, "options", "/api/auth/logout", logout.OPTIONS);
mountRoute(app, "post", "/api/auth/logout", logout.POST);

mountRoute(app, "options", "/api/auth/change-password", changePassword.OPTIONS);
mountRoute(app, "post", "/api/auth/change-password", changePassword.POST);

mountRoute(app, "options", "/api/menu", menu.OPTIONS);
mountRoute(app, "get", "/api/menu", menu.GET);
mountRoute(app, "post", "/api/menu", menu.POST);

mountRoute(app, "options", "/api/menu/:id", menuId.OPTIONS);
mountRoute(app, "patch", "/api/menu/:id", menuId.PATCH, true);
mountRoute(app, "delete", "/api/menu/:id", menuId.DELETE, true);

mountRoute(app, "options", "/api/orders", orders.OPTIONS);
mountRoute(app, "get", "/api/orders", orders.GET);
mountRoute(app, "post", "/api/orders", orders.POST);

mountRoute(app, "options", "/api/orders/:id", orderId.OPTIONS);
mountRoute(app, "get", "/api/orders/:id", orderId.GET, true);
mountRoute(app, "patch", "/api/orders/:id", orderId.PATCH, true);

mountRoute(app, "options", "/api/inventory", inventory.OPTIONS);
mountRoute(app, "get", "/api/inventory", inventory.GET);

mountRoute(app, "options", "/api/inventory/stock-in", stockIn.OPTIONS);
mountRoute(app, "get", "/api/inventory/stock-in", stockIn.GET);
mountRoute(app, "post", "/api/inventory/stock-in", stockIn.POST);

mountRoute(app, "options", "/api/expenses", expenses.OPTIONS);
mountRoute(app, "get", "/api/expenses", expenses.GET);
mountRoute(app, "post", "/api/expenses", expenses.POST);

mountRoute(app, "options", "/api/expenses/:id", expenseId.OPTIONS);
mountRoute(app, "delete", "/api/expenses/:id", expenseId.DELETE, true);

mountRoute(app, "options", "/api/customers", customers.OPTIONS);
mountRoute(app, "get", "/api/customers", customers.GET);
mountRoute(app, "post", "/api/customers", customers.POST);

mountRoute(app, "options", "/api/dashboard", dashboard.OPTIONS);
mountRoute(app, "get", "/api/dashboard", dashboard.GET);

mountRoute(app, "options", "/api/reports", reports.OPTIONS);
mountRoute(app, "get", "/api/reports", reports.GET);

mountRoute(app, "options", "/api/settings/profile", profile.OPTIONS);
mountRoute(app, "get", "/api/settings/profile", profile.GET);
mountRoute(app, "patch", "/api/settings/profile", profile.PATCH);

mountRoute(app, "options", "/api/notifications", notifications.OPTIONS);
mountRoute(app, "get", "/api/notifications", notifications.GET);
mountRoute(app, "delete", "/api/notifications", notifications.DELETE);

mountRoute(app, "options", "/api/notifications/:id", notificationId.OPTIONS);
mountRoute(app, "patch", "/api/notifications/:id", notificationId.PATCH, true);
mountRoute(app, "delete", "/api/notifications/:id", notificationId.DELETE, true);

app.listen(port, () => {
  console.log(`HotelLite API listening on port ${port}`);
});
