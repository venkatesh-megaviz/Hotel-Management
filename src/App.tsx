import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/layouts/DashboardLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import MenuManagement from "@/pages/MenuManagement";
import Billing from "@/pages/Billing";
import Payments from "@/pages/Payments";
import Inventory from "@/pages/Inventory";
import Expenses from "@/pages/Expenses";
import Customers from "@/pages/Customers";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Subscription from "@/pages/Subscription";
import Notifications from "@/pages/Notifications";
import InvoiceView from "@/pages/InvoiceView";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/menu" element={<MenuManagement />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/billing/invoice/:id" element={<InvoiceView />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
