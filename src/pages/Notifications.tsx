import { useEffect, useState } from "react";
import { AlertTriangle, Info, CheckCircle2, Trash2, X } from "lucide-react";
import clsx from "clsx";
import PageHeader from "@/components/PageHeader";
import { Toast, useToast } from "@/components/Toast";
import {
  fetchNotifications,
  markNotificationRead,
  dismissNotification,
  clearAllNotifications,
  type AppNotification,
  type NotificationSeverity,
} from "@/lib/api";

const severityConfig: Record<NotificationSeverity, { icon: typeof AlertTriangle; iconBg: string; iconColor: string; rowBg: string; dot: string }> = {
  warning: { icon: AlertTriangle, iconBg: "bg-warning-50", iconColor: "text-warning-600", rowBg: "bg-warning-50/60", dot: "bg-warning-600" },
  info: { icon: Info, iconBg: "bg-brand-50", iconColor: "text-brand-600", rowBg: "bg-brand-50/60", dot: "bg-brand-600" },
  success: { icon: CheckCircle2, iconBg: "bg-success-50", iconColor: "text-success-600", rowBg: "bg-white", dot: "bg-success-600" },
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.round(diffMs / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  if (days === 1) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast, showToast } = useToast();

  function load() {
    setLoading(true);
    fetchNotifications()
      .then((res) => setNotifications(res.notifications))
      .catch(() => showToast("error", "Couldn't load notifications"))
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);

  async function handleRowClick(n: AppNotification) {
    if (n.read) return;
    setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, read: true } : item)));
    try {
      await markNotificationRead(n.id);
    } catch {
      showToast("error", "Failed to mark notification as read");
    }
  }

  async function handleDismiss(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    const prev = notifications;
    setNotifications((current) => current.filter((n) => n.id !== id));
    try {
      await dismissNotification(id);
    } catch {
      setNotifications(prev);
      showToast("error", "Failed to dismiss notification");
    }
  }

  async function handleClearAll() {
    const prev = notifications;
    setNotifications([]);
    try {
      await clearAllNotifications();
      showToast("success", "All notifications cleared");
    } catch {
      setNotifications(prev);
      showToast("error", "Failed to clear notifications");
    }
  }

  return (
    <div>
      <Toast toast={toast} />
      <PageHeader
        title="Notifications"
        action={
          notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <Trash2 size={15} />
              Clear all
            </button>
          )
        }
      />

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-400">Loading notifications…</p>
      ) : notifications.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="text-sm text-slate-400">You're all caught up. No notifications right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const config = severityConfig[n.severity];
            const Icon = config.icon;
            return (
              <button
                key={n.id}
                onClick={() => handleRowClick(n)}
                className={clsx(
                  "flex w-full items-start gap-3 rounded-2xl p-4 text-left transition-colors",
                  n.read ? "bg-white ring-1 ring-slate-100" : clsx(config.rowBg, "ring-1 ring-slate-100"),
                )}
              >
                <span className={clsx("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", config.iconBg, config.iconColor)}>
                  <Icon size={16} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{n.title}</p>
                    <span className="badge bg-slate-100 text-slate-500">{n.category}</span>
                    {!n.read && <span className={clsx("h-1.5 w-1.5 rounded-full", config.dot)} />}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{n.message}</p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <span className="whitespace-nowrap text-xs text-slate-400">{timeAgo(n.createdAt)}</span>
                  <span
                    onClick={(e) => handleDismiss(e, n.id)}
                    className="rounded-lg p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-500"
                  >
                    <X size={15} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
