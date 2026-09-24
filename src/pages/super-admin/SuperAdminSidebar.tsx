import { NavLink, Link, useNavigate } from "react-router-dom";
import clsx from "clsx";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  BarChart3,
  LifeBuoy,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { to: "/super-admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/super-admin/tenants", label: "Tenant Management", icon: Building2 },
  { to: "/super-admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { to: "/super-admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/super-admin/support", label: "Support Center", icon: LifeBuoy },
  { to: "/super-admin/settings", label: "Platform Settings", icon: Settings },
];

export default function SuperAdminSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/super-admin/login", { replace: true });
  }

  return (
    <aside className="sa-sidebar">
      <div className="sa-brand">
        <Link to="/super-admin" className="sa-logo">
          <img src="/sidebar-logo.png" alt="Dinevoro" />
        </Link>
        <span className="sa-badge">★ Super Admin</span>
      </div>

      <nav className="sa-nav">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => clsx("sa-nav-link", isActive && "is-active")}
          >
            <Icon size={16} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sa-footer">
        <div className="sa-user">
          <div className="sa-avatar">{(user?.fullName || "S").charAt(0)}</div>
          <div>
            <p className="sa-user-name">{user?.fullName || "Super Admin"}</p>
            <p className="sa-user-role">{user?.email || "Platform Manager"}</p>
          </div>
        </div>
        <button type="button" className="sa-back" onClick={handleLogout}>
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </aside>
  );
}
