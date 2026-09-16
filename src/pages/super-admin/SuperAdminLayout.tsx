import { Outlet, useLocation } from "react-router-dom";
import SuperAdminSidebar from "./SuperAdminSidebar";
import SuperAdminTopbar from "./SuperAdminTopbar";
import "./SuperAdmin.css";

const TITLES: Record<string, { title: string; subtitle?: string }> = {
  "/super-admin": { title: "Platform Overview" },
  "/super-admin/tenants": { title: "Tenant Management" },
  "/super-admin/subscriptions": { title: "Subscriptions & Billing" },
  "/super-admin/analytics": { title: "Analytics" },
  "/super-admin/support": { title: "Support Center" },
  "/super-admin/settings": { title: "Platform Settings" },
};

export default function SuperAdminLayout() {
  const { pathname } = useLocation();
  const isDetail = pathname.startsWith("/super-admin/tenants/") && pathname !== "/super-admin/tenants";
  const meta = isDetail
    ? { title: "Tenant Management", subtitle: undefined }
    : (TITLES[pathname] ?? { title: "Super Admin" });

  return (
    <div className="sa-shell">
      <SuperAdminSidebar />
      <div className="sa-main">
        <SuperAdminTopbar title={meta.title} subtitle={meta.subtitle} />
        <div className="sa-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
