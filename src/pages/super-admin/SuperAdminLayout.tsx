import { Outlet, useLocation } from "react-router-dom";
import SuperAdminSidebar from "./SuperAdminSidebar";
import SuperAdminTopbar from "./SuperAdminTopbar";
import "./SuperAdmin.css";

const TITLES: Record<string, { title: string; subtitle?: string }> = {
  "/admin": { title: "Platform Overview" },
  "/admin/tenants": { title: "Tenant Management" },
  "/admin/subscriptions": { title: "Subscriptions & Billing" },
  "/admin/analytics": { title: "Analytics" },
  "/admin/support": { title: "Support Center" },
  "/admin/settings": { title: "Platform Settings" },
};

export default function SuperAdminLayout() {
  const { pathname } = useLocation();
  const isDetail = pathname.startsWith("/admin/tenants/") && pathname !== "/admin/tenants";
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
