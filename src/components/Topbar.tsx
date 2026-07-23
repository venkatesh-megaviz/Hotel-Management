import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, Calendar } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchNotifications } from "@/lib/api";

interface TopbarProps {
  title: string;
  subtitle?: string;
  greeting?: boolean;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Topbar({ title, subtitle, greeting }: TopbarProps) {
  const { user, restaurant } = useAuth();
  const navigate = useNavigate();
  const userName = user?.fullName ?? "Guest";
  const restaurantName = restaurant?.name ?? "Your Restaurant";
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications()
      .then((res) => setUnreadCount(res.notifications.filter((n) => !n.read).length))
      .catch(() => undefined);
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-slate-100 bg-white/80 px-4 backdrop-blur sm:px-8 print:hidden">
      <div>
        {greeting ? (
          <>
            <h1 className="text-lg font-bold text-slate-900">
              {getGreeting()}, {userName.split(" ")[0]}!
            </h1>
            <p className="hidden items-center gap-1.5 text-xs text-slate-400 sm:flex">
              <Calendar size={12} />
              {today} · {restaurantName}
            </p>
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
            {subtitle && <p className="hidden text-xs text-slate-400 sm:block">{subtitle}</p>}
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search orders, items..."
            className="w-64 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <button
          onClick={() => navigate("/notifications")}
          className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-50"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger-600" />}
        </button>

        <div className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-3 hover:bg-slate-50">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
            {userName[0]}
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-semibold text-slate-900">{userName}</p>
            <p className="text-xs text-slate-400">{user?.role ?? ""}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
