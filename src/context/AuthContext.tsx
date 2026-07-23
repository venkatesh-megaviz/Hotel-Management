import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  ApiError,
  fetchCurrentUser,
  loginAccount,
  logoutAccount,
  registerAccount,
  type ApiRestaurant,
  type ApiUser,
  type RegisterPayload,
} from "@/lib/api";

interface AuthContextValue {
  user: ApiUser | null;
  restaurant: ApiRestaurant | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  register: (payload: RegisterPayload) => Promise<{ user: ApiUser; restaurant: ApiRestaurant | null }>;
  login: (email: string, password: string) => Promise<{ user: ApiUser; restaurant: ApiRestaurant | null }>;
  logout: () => Promise<void>;
  setRestaurant: (restaurant: ApiRestaurant) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [restaurant, setRestaurant] = useState<ApiRestaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser()
      .then((res) => {
        setUser(res.user);
        setRestaurant(res.restaurant);
      })
      .catch(() => {
        setUser(null);
        setRestaurant(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await registerAccount(payload);
    setUser(res.user);
    setRestaurant(res.restaurant);
    return res;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await loginAccount(email, password);
    setUser(res.user);
    setRestaurant(res.restaurant);
    return res;
  }, []);

  const logout = useCallback(async () => {
    await logoutAccount().catch(() => undefined);
    setUser(null);
    setRestaurant(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, restaurant, isLoading, isAuthenticated: !!user, register, login, logout, setRestaurant }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ApiError };
