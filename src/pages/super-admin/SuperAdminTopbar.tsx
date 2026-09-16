import { Bell, Search } from "lucide-react";
import { platformDateLabel } from "./data";

export default function SuperAdminTopbar({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="sa-topbar">
      <div>
        <h1>{title}</h1>
        <p>{subtitle ?? `Dinevoro Platform · ${platformDateLabel()}`}</p>
      </div>
      <div className="sa-topbar-actions">
        <label className="sa-quick-search">
          <Search size={14} />
          <input type="search" placeholder="Quick search…" />
        </label>
        <button type="button" className="sa-bell" aria-label="Notifications">
          <Bell size={16} />
          <span className="sa-bell-dot" />
        </button>
      </div>
    </header>
  );
}
