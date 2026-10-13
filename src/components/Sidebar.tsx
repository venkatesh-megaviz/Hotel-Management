import { useEffect, useState } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
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
  X,
} from "lucide-react";
import clsx from "clsx";
import { fetchNotifications } from "@/lib/api";

const navSections = [
  {
    title: "Operations",
    items: [
      { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/tables", label: "Table Management", icon: Grid3X3 },
      { to: "/kitchen", label: "Kitchen Display", icon: ChefHat },
      { to: "/billing", label: "Billing", icon: Receipt },
      { to: "/payments", label: "Payments", icon: CreditCard },
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

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const { user, restaurant, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications()
      .then((res) => setUnreadCount(res.notifications.filter((n) => !n.read).length))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  async function handleSignOut() {
    onClose?.();
    await logout();
    navigate("/login", { replace: true });
  }

  const panel = (
    <aside
      className={clsx(
        "flex h-full w-56 shrink-0 flex-col overflow-hidden bg-[rgba(10,8,7,1)]",
        "fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-out lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        "print:hidden",
      )}
    >
      <div className="flex items-start justify-between border-b border-white/10 px-4 py-4">
        <div className="min-w-0">
          <Link to="/app" className="inline-flex items-center px-1" onClick={onClose}>
            <img src="/sidebar-logo.png" alt="Dinevoro" className="h-7 w-auto max-w-[160px] object-contain" />
          </Link>
          <p className="mt-2 truncate px-0.5 text-[10px] text-white/45">{restaurant?.name ?? "Your Restaurant"}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-white/55 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-2 pt-3">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/35">{section.title}</p>
            <div className="space-y-0.5">
              {section.items.map(({ to, label, icon: Icon, ...rest }) => (
                <NavLink
                  key={`${to}-${label}`}
                  to={to}
                  end={"end" in rest ? rest.end : false}
                  onClick={onClose}
                  className={({ isActive }) =>
                    clsx(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[rgba(214,163,81,1)] font-semibold text-[rgba(10,8,7,1)]"
                        : "text-white/55 hover:bg-white/5 hover:text-white",
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

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2.5 rounded-xl px-3 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgba(214,163,81,1)] text-xs font-semibold text-[rgba(10,8,7,1)]">
            {user?.fullName?.[0] ?? "A"}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium text-white">{user?.fullName ?? "Guest"}</p>
            <p className="text-xs text-white/45">{user?.role ?? ""}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/55 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut size={18} strokeWidth={2} />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu overlay"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden print:hidden"
          onClick={onClose}
        />
      )}
      {panel}
    </>
  );
}
