import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

const titles: Record<string, { title: string; subtitle?: string }> = {
  "/": { title: "Dashboard" },
  "/tables": { title: "Table Management" },
  "/kitchen": { title: "Kitchen Display System", subtitle: "Real-time order queue for the kitchen" },
  "/qr-ordering": { title: "QR Ordering", subtitle: "Manage table QR code orders" },
  "/online-ordering": { title: "Online Ordering", subtitle: "Swiggy, Zomato and website orders" },
  "/delivery": { title: "Delivery Management", subtitle: "Track agents and live deliveries" },
  "/menu": { title: "Menu Management", subtitle: "Categories, pricing, GST, and availability" },
  "/recipes": { title: "Recipe Management", subtitle: "Manage recipes, ingredients and food cost" },
  "/billing": { title: "Billing / POS", subtitle: "Create bills, collect payment, share invoices" },
  "/payments": { title: "Payment Management", subtitle: "History, pending dues, refunds" },
  "/inventory": { title: "Inventory — Stock In", subtitle: "Record stock received from suppliers" },
  "/expenses": { title: "Expense Management", subtitle: "Daily expenses with bill upload" },
  "/accounting": { title: "Accounting & Finance", subtitle: "P&L, GST filing and integrations" },
  "/customers": { title: "Customer Management", subtitle: "Customer profiles and order history" },
  "/loyalty": { title: "Loyalty Program", subtitle: "Manage customer points and rewards" },
  "/reports": { title: "Reports", subtitle: "Comprehensive analytics across all modules" },
  "/attendance": { title: "Employee Attendance", subtitle: "Daily staff check-in/out tracking" },
  "/subscription": { title: "Subscription" },
  "/settings": { title: "Settings" },
  "/notifications": { title: "Notifications", subtitle: "Payment and customer alerts" },
};

export default function DashboardLayout() {
  const location = useLocation();
  const meta = location.pathname.startsWith("/billing")
    ? titles["/billing"]
    : (titles[location.pathname] ?? { title: "HotelLite" });
  const isDashboard = location.pathname === "/";

  return (
    <div className="flex h-screen overflow-hidden bg-surface print:h-auto print:overflow-visible">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden print:overflow-visible">
        <Topbar title={meta.title} subtitle={meta.subtitle} greeting={isDashboard} />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 print:overflow-visible print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
