import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  TrendingUp,
  Users,
  ArrowUpRight,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchSaOverview, type SaTenant } from "@/lib/api";

export default function SuperAdminOverview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeSubscriptions: 0,
    activeRate: 0,
    monthlyRevenueLabel: "₹0L",
    retentionRate: 0,
  });
  const [mrrSeries, setMrrSeries] = useState<{ month: string; value: number }[]>([]);
  const [moduleAdoption, setModuleAdoption] = useState<{ name: string; pct: number; color: string }[]>([]);
  const [recent, setRecent] = useState<SaTenant[]>([]);

  useEffect(() => {
    fetchSaOverview()
      .then((res) => {
        setStats({
          totalTenants: res.stats.totalTenants,
          activeSubscriptions: res.stats.activeSubscriptions,
          activeRate: res.stats.activeRate,
          monthlyRevenueLabel: res.stats.monthlyRevenueLabel,
          retentionRate: res.stats.retentionRate,
        });
        setMrrSeries(res.mrrSeries);
        setModuleAdoption(res.moduleAdoption);
        setRecent(res.recentTenants);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      label: "Total Tenants",
      value: String(stats.totalTenants),
      help: "+18 this month",
      tone: "up" as const,
      icon: Building2,
      iconBg: "sa-icon-gold",
    },
    {
      label: "Active Subscriptions",
      value: String(stats.activeSubscriptions),
      help: `${stats.activeRate}% of tenants`,
      tone: "muted" as const,
      icon: CheckCircle2,
      iconBg: "sa-icon-green",
    },
    {
      label: "Monthly Revenue",
      value: stats.monthlyRevenueLabel,
      help: "+₹1.5L vs July",
      tone: "up" as const,
      icon: TrendingUp,
      iconBg: "sa-icon-blue",
    },
    {
      label: "Retention Rate",
      value: `${stats.retentionRate}%`,
      help: "-0.2% vs last mo",
      tone: "down" as const,
      icon: Users,
      iconBg: "sa-icon-pink",
    },
  ];

  if (loading) {
    return <div className="sa-card">Loading platform overview…</div>;
  }

  return (
    <div className="sa-stack">
      <div className="sa-stat-grid">
        {cards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="sa-card sa-stat">
              <div className="sa-stat-top">
                <p>{s.label}</p>
                <span className={`sa-stat-icon ${s.iconBg}`}>
                  <Icon size={16} />
                </span>
              </div>
              <strong>{s.value}</strong>
              <span className={`sa-stat-help is-${s.tone}`}>{s.help}</span>
            </div>
          );
        })}
      </div>

      <div className="sa-overview-grid">
        <div className="sa-card sa-chart-card">
          <div className="sa-card-head">
            <div>
              <h2>Monthly Recurring Revenue</h2>
              <p>Last 6 months · INR</p>
            </div>
            <span className="sa-chip is-success">+69.0% YoY</span>
          </div>
          <div className="sa-chart">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={mrrSeries} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(10,8,7,0.08)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  tickFormatter={(v) => `₹${v}L`}
                />
                <Tooltip
                  cursor={{ fill: "rgba(214,163,81,0.08)" }}
                  formatter={(value) => [`₹${value}L`, "MRR"]}
                />
                <Bar dataKey="value" fill="#d6a351" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="sa-card">
          <div className="sa-card-head">
            <div>
              <h2>Module Adoption</h2>
              <p>Across {stats.totalTenants} active tenants</p>
            </div>
          </div>
          <ul className="sa-adoption">
            {moduleAdoption.map((m) => (
              <li key={m.name}>
                <div className="sa-adoption-row">
                  <span>{m.name}</span>
                  <strong>{m.pct}%</strong>
                </div>
                <div className="sa-bar">
                  <span style={{ width: `${m.pct}%`, background: m.color }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="sa-card">
        <div className="sa-card-head">
          <div>
            <h2>Recent Tenants</h2>
            <p>Latest restaurants onboarded</p>
          </div>
          <Link to="/super-admin/tenants" className="sa-link">
            View all <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Restaurant</th>
                <th>City</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link to={`/super-admin/tenants/${t.id}`} className="sa-tenant-cell">
                      <span className="sa-tenant-avatar">{t.name[0]}</span>
                      <span>
                        <strong>{t.name}</strong>
                        <em>{t.code}</em>
                      </span>
                    </Link>
                  </td>
                  <td>{t.city}</td>
                  <td>
                    <span className={`sa-plan is-${t.plan.toLowerCase()}`}>{t.plan}</span>
                  </td>
                  <td>
                    <span className={`sa-status is-${t.status.toLowerCase()}`}>{t.status}</span>
                  </td>
                  <td>{t.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
