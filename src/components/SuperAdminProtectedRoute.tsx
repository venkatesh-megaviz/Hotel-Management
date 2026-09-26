import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/** Protects Super Admin console routes. */
export default function SuperAdminProtectedRoute() {
  const { isAuthenticated, isLoading, isSuperAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "#f7f3ec" }}>
        <div
          className="h-8 w-8 animate-spin rounded-full border-2"
          style={{ borderColor: "rgba(214,163,81,0.25)", borderTopColor: "#d6a351" }}
        />
      </div>
    );
  }

  if (!isAuthenticated || !isSuperAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
