import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  BookOpen,
  Receipt,
  CreditCard,
  Box,
  TrendingUp,
  Users,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import clsx from "clsx";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/menu", label: "Menu Management", icon: BookOpen },
  { to: "/billing", label: "Billing", icon: Receipt },
  { to: "/payments", label: "Payments", icon: CreditCard },
  { to: "/inventory", label: "Inventory", icon: Box },
  { to: "/expenses", label: "Expenses", icon: TrendingUp },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const { user, restaurant, logout } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await logout();
    navigate("/login");
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-slate-900 lg:flex print:hidden">
      <div className="px-6 py-5">
        <span className="text-lg font-bold text-white">HotelLite</span>
        <p className="mt-0.5 truncate text-xs text-slate-400">{restaurant?.name ?? "Your Restaurant"}</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 pt-2">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-brand-600 font-semibold text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white",
              )
            }
          >
            <Icon size={18} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <div className="flex items-center gap-2.5 rounded-xl px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
            {user?.fullName?.[0] ?? "A"}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium text-white">{user?.fullName ?? "Guest"}</p>
            <p className="text-xs text-slate-400">{user?.role ?? ""}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <LogOut size={18} strokeWidth={2} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
