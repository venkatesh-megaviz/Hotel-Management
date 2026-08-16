import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  Grid3X3,
  ChefHat,
  Receipt,
  CreditCard,
  BookOpen,
  ClipboardList,
  Box,
  TrendingUp,
  Users,
  Star,
  UserCheck,
  Calculator,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  QrCode,
  Globe,
  Truck,
} from "lucide-react";
import clsx from "clsx";
import { fetchNotifications } from "@/lib/api";

const navSections = [
  {
    title: "Operations",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/tables", label: "Table Management", icon: Grid3X3 },
      { to: "/kitchen", label: "Kitchen Display", icon: ChefHat },
      { to: "/billing", label: "Billing", icon: Receipt },
      { to: "/payments", label: "Payments", icon: CreditCard },
    ],
  },
  {
    title: "Ordering",
    items: [
      { to: "/qr-ordering", label: "QR Ordering", icon: QrCode },
      { to: "/online-ordering", label: "Online Ordering", icon: Globe },
      { to: "/delivery", label: "Delivery", icon: Truck },
    ],
  },
  {
    title: "Menu & Stock",
    items: [
      { to: "/menu", label: "Menu Management", icon: BookOpen },
      { to: "/recipes", label: "Recipes", icon: ClipboardList },
      { to: "/inventory", label: "Inventory", icon: Box },
    ],
  },
  {
    title: "Customers",
    items: [
      { to: "/customers", label: "Customers", icon: Users, end: true },
      { to: "/loyalty", label: "Loyalty", icon: Star, end: true },
    ],
  },
  {
    title: "Staff",
    items: [{ to: "/attendance", label: "Attendance", icon: UserCheck }],
  },
  {
    title: "Finance",
    items: [
      { to: "/expenses", label: "Expenses", icon: TrendingUp },
      { to: "/accounting", label: "Accounting", icon: Calculator },
      { to: "/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    title: "Other",
    items: [
      { to: "/notifications", label: "Notifications", icon: Bell, badge: true },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const { user, restaurant, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications()
      .then((res) => setUnreadCount(res.notifications.filter((n) => !n.read).length))
      .catch(() => undefined);
  }, []);

  async function handleSignOut() {
    await logout();
    navigate("/login");
  }

  return (
    <aside className="hidden w-56 shrink-0 flex-col bg-[#101828] lg:flex print:hidden">
      <div className="border-b border-[#1e2939] px-5 py-5">
        <span className="text-sm font-bold text-white">HotelLite</span>
        <p className="mt-0.5 truncate text-[10px] text-[#6a7282]">{restaurant?.name ?? "Your Restaurant"}</p>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-2 pt-3">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-[#6a7282]">{section.title}</p>
            <div className="space-y-0.5">
              {section.items.map(({ to, label, icon: Icon, ...rest }) => (
                <NavLink
                  key={`${to}-${label}`}
                  to={to}
                  end={"end" in rest ? rest.end : false}
                  className={({ isActive }) =>
                    clsx(
                      "flex items-center gap-3 rounded-none px-5 py-3 text-sm font-medium transition-colors",
                      isActive ? "bg-[#155dfc] font-semibold text-white" : "text-[#99a1af] hover:bg-[#1e2939] hover:text-white",
                    )
                  }
                >
                  <Icon size={15} strokeWidth={2} />
                  <span className="flex-1">{label}</span>
                  {"badge" in rest && rest.badge && unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[#1e2939] p-3">
        <div className="flex items-center gap-2.5 rounded-xl px-3 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#155dfc] text-xs font-semibold text-white">
            {user?.fullName?.[0] ?? "A"}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium text-white">{user?.fullName ?? "Guest"}</p>
            <p className="text-xs text-[#6a7282]">{user?.role ?? ""}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#99a1af] transition-colors hover:bg-[#1e2939] hover:text-white"
        >
          <LogOut size={18} strokeWidth={2} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
