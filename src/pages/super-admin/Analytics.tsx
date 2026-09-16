import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchSaAnalytics } from "@/lib/api";

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [mrrSeries, setMrrSeries] = useState<{ month: string; value: number }[]>([]);
  const [tenantGrowth, setTenantGrowth] = useState<{ month: string; value: number }[]>([]);
  const [planDistribution, setPlanDistribution] = useState<
    { name: string; tenants: number; pct: number; color: string }[]
  >([]);
  const [keyMetrics, setKeyMetrics] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    fetchSaAnalytics()
      .then((res) => {
        setMrrSeries(res.mrrSeries);
        setTenantGrowth(res.tenantGrowth);
        setPlanDistribution(res.planDistribution);
        setKeyMetrics(res.keyMetrics);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="sa-card">Loading analytics…</div>;

  return (
    <div className="sa-analytics-grid">
      <div className="sa-card sa-chart-card">
        <div className="sa-card-head">
          <div>
            <h2>Revenue Trend</h2>
            <p>Monthly recurring revenue · INR</p>
          </div>
        </div>
        <div className="sa-chart">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={mrrSeries} barSize={34}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(10,8,7,0.08)" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                domain={[0, 16]}
                ticks={[0, 4, 8, 12, 16]}
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

      <div className="sa-card sa-chart-card">
        <div className="sa-card-head">
          <div>
            <h2>Tenant Growth</h2>
            <p>Active tenants per month</p>
          </div>
        </div>
        <div className="sa-chart">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={tenantGrowth} barSize={34}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(10,8,7,0.08)" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                domain={[0, "auto"]}
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
              <Tooltip cursor={{ fill: "rgba(139,131,242,0.08)" }} formatter={(value) => [value, "Tenants"]} />
              <Bar dataKey="value" fill="#8b83f2" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="sa-card">
        <div className="sa-card-head">
          <div>
            <h2>Plan Distribution</h2>
          </div>
        </div>
        <ul className="sa-plan-dist">
          {planDistribution.map((p) => (
            <li key={p.name}>
              <div className="sa-plan-dist-row">
                <strong>{p.name}</strong>
                <span>
                  {p.tenants} tenants ({p.pct}%)
                </span>
              </div>
              <div className="sa-bar">
                <span style={{ width: `${p.pct}%`, background: p.color }} />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="sa-card">
        <div className="sa-card-head">
          <div>
            <h2>Key Metrics</h2>
          </div>
        </div>
        <ul className="sa-key-metrics">
          {keyMetrics.map((m) => (
            <li key={m.label}>
              <span>{m.label}</span>
              <strong>{m.value}</strong>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
