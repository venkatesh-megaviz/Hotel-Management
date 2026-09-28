import { useEffect, useState } from "react";
import { fetchSaOverview } from "@/lib/api";

export default function ModuleUsage() {
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<{ name: string; pct: number; color: string }[]>([]);
  const [totalTenants, setTotalTenants] = useState(0);

  useEffect(() => {
    fetchSaOverview()
      .then((res) => {
        setModules(res.moduleAdoption);
        setTotalTenants(res.stats.totalTenants);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="sa-card">Loading module usage…</div>;

  return (
    <div className="sa-stack">
      <div className="sa-page-head">
        <div>
          <h2 className="sa-page-title">Module Usage</h2>
          <p>Adoption across {totalTenants} tenants</p>
        </div>
      </div>

      <div className="sa-card">
        <div className="sa-card-head">
          <div>
            <h2>Module Adoption</h2>
            <p>Share of tenants with each module enabled</p>
          </div>
        </div>
        <ul className="sa-adoption">
          {modules.map((m) => (
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
  );
}
