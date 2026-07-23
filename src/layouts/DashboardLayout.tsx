import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

const titles: Record<string, { title: string; subtitle?: string }> = {
  "/": { title: "Dashboard" },
  "/menu": { title: "Menu Management" },
  "/billing": { title: "Billing / POS" },
  "/payments": { title: "Payment Management" },
  "/inventory": { title: "Inventory — Stock In" },
  "/expenses": { title: "Expense Management" },
  "/customers": { title: "Customer Management" },
  "/reports": { title: "Reports" },
  "/subscription": { title: "Subscription" },
  "/settings": { title: "Settings" },
  "/notifications": { title: "Notifications" },
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
