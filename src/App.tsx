import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import SuperAdminProtectedRoute from "@/components/SuperAdminProtectedRoute";
import DashboardLayout from "@/layouts/DashboardLayout";
import Website from "@/pages/website/Website";
import BuildPlan from "@/pages/build-plan/BuildPlan";
import Login from "@/pages/Login";
import { PrivacyPage, TermsPage } from "@/pages/Legal";
import Dashboard from "@/pages/Dashboard";
import TableManagement from "@/pages/TableManagement";
import KitchenDisplay from "@/pages/KitchenDisplay";
import QROrdering from "@/pages/QROrdering";
import OnlineOrdering from "@/pages/OnlineOrdering";
import DeliveryManagement from "@/pages/DeliveryManagement";
import RecipeManagement from "@/pages/RecipeManagement";
import MenuManagement from "@/pages/MenuManagement";
import Billing from "@/pages/Billing";
import Payments from "@/pages/Payments";
import Inventory from "@/pages/Inventory";
import Accounting from "@/pages/Accounting";
import Expenses from "@/pages/Expenses";
import Customers from "@/pages/Customers";
import Loyalty from "@/pages/Loyalty";
import Reports from "@/pages/Reports";
import Attendance from "@/pages/Attendance";
import Settings from "@/pages/Settings";
import Subscription from "@/pages/Subscription";
import Notifications from "@/pages/Notifications";
import InvoiceView from "@/pages/InvoiceView";
import QRGuestOrder from "@/pages/QRGuestOrder";
import SuperAdminLayout from "@/pages/super-admin/SuperAdminLayout";
import SuperAdminLogin from "@/pages/super-admin/SuperAdminLogin";
import SuperAdminOverview from "@/pages/super-admin/Overview";
import TenantManagement from "@/pages/super-admin/TenantManagement";
import TenantDetail from "@/pages/super-admin/TenantDetail";
import Subscriptions from "@/pages/super-admin/Subscriptions";
import Analytics from "@/pages/super-admin/Analytics";
import SupportCenter from "@/pages/super-admin/SupportCenter";
import PlatformSettings from "@/pages/super-admin/PlatformSettings";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Website />} />
          <Route path="/build-plan" element={<BuildPlan />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Login />} />
          <Route path="/super-admin/login" element={<SuperAdminLogin />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/qr-order/:tableId" element={<QRGuestOrder />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/app" element={<Dashboard />} />
              <Route path="/tables" element={<TableManagement />} />
              <Route path="/kitchen" element={<KitchenDisplay />} />
              <Route path="/qr-ordering" element={<QROrdering />} />
              <Route path="/online-ordering" element={<OnlineOrdering />} />
              <Route path="/delivery" element={<DeliveryManagement />} />
              <Route path="/menu" element={<MenuManagement />} />
              <Route path="/recipes" element={<RecipeManagement />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/billing/invoice/:id" element={<InvoiceView />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/accounting" element={<Accounting />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/loyalty" element={<Loyalty />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>
          </Route>

          <Route element={<SuperAdminProtectedRoute />}>
            <Route path="/super-admin" element={<SuperAdminLayout />}>
              <Route index element={<SuperAdminOverview />} />
              <Route path="tenants" element={<TenantManagement />} />
              <Route path="tenants/:id" element={<TenantDetail />} />
              <Route path="subscriptions" element={<Subscriptions />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="support" element={<SupportCenter />} />
              <Route path="settings" element={<PlatformSettings />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
