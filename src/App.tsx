import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/layouts/DashboardLayout";
import Login from "@/pages/Login";
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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/qr-order/:tableId" element={<QRGuestOrder />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Dashboard />} />
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
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
