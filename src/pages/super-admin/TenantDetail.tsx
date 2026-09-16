import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { fetchSaTenant, updateSaTenant, type SaTenant } from "@/lib/api";

function formatInr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function TenantDetail() {
  const { id = "" } = useParams();
  const [tenant, setTenant] = useState<SaTenant | null>(null);
  const [allModules, setAllModules] = useState<string[]>([]);
  const [invoices, setInvoices] = useState<{ id: string; date: string; amount: number; status: string }[]>([]);
  const [activity, setActivity] = useState<{ text: string; date: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchSaTenant(id)
      .then((res) => {
        setTenant(res.tenant);
        setAllModules(res.allModules);
        setInvoices(res.invoices);
        setActivity(res.activity);
      })
      .catch(() => setTenant(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function suspend() {
    if (!tenant) return;
    setBusy(true);
    try {
      const res = await updateSaTenant(tenant.id, { tenantStatus: "Inactive" });
      setTenant(res.tenant);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="sa-card">Loading tenant…</div>;
  if (!tenant) return <div className="sa-card">Tenant not found</div>;

  const enabled = new Set(tenant.activeModules);

  return (
    <div className="sa-stack">
      <Link to="/super-admin/tenants" className="sa-crumb">
        <ArrowLeft size={14} /> Tenants / <strong>{tenant.name}</strong>
      </Link>

      <div className="sa-card sa-tenant-hero">
        <div className="sa-tenant-hero-left">
          <span className="sa-tenant-avatar is-lg">{tenant.name[0]}</span>
          <div>
            <div className="sa-tenant-title-row">
              <h2>{tenant.name}</h2>
              <span className={`sa-status is-${tenant.status.toLowerCase()}`}>{tenant.status}</span>
              <span className={`sa-plan is-${tenant.plan.toLowerCase()}`}>{tenant.plan}</span>
            </div>
            <p>
              {tenant.type} · {tenant.city} · {tenant.code}
            </p>
          </div>
        </div>
        <div className="sa-tenant-actions">
          <button type="button" className="sa-btn is-ghost">
            Edit Details
          </button>
          <button type="button" className="sa-btn is-primary">
            Change Plan
          </button>
          <button type="button" className="sa-btn is-danger" disabled={busy} onClick={suspend}>
            Suspend Account
          </button>
        </div>
      </div>

      <div className="sa-info-grid">
        {[
          ["Owner", tenant.owner],
          ["Email", tenant.email],
          ["Phone", tenant.phone],
          ["Address", tenant.address],
          ["Member Since", tenant.joined],
          ["Next Billing", tenant.nextBilling],
        ].map(([label, value]) => (
          <div key={label} className="sa-card sa-info">
            <p>{label}</p>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="sa-detail-grid">
        <div className="sa-card">
          <div className="sa-card-head">
            <div>
              <h2>Active Modules</h2>
              <p>
                {tenant.modulesEnabled}/{tenant.modulesTotal} enabled
              </p>
            </div>
          </div>
          <div className="sa-module-grid">
            {allModules.map((name) => {
              const on = enabled.has(name);
              return (
                <div key={name} className={`sa-module-card${on ? " is-on" : ""}`}>
                  <span>{name}</span>
                  {on ? (
                    <em className="is-on">
                      <Check size={12} strokeWidth={3} /> Active
                    </em>
                  ) : (
                    <em>Off</em>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="sa-detail-side">
          <div className="sa-card">
            <div className="sa-card-head">
              <div>
                <h2>Invoices</h2>
              </div>
              <button type="button" className="sa-link">
                Download All
              </button>
            </div>
            <ul className="sa-invoice-list">
              {invoices.map((inv) => (
                <li key={inv.id}>
                  <div>
                    <strong>{inv.id}</strong>
                    <p>{inv.date}</p>
                  </div>
                  <div className="sa-invoice-right">
                    <strong>{formatInr(inv.amount)}</strong>
                    <span className={`sa-status is-${inv.status.toLowerCase()}`}>{inv.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="sa-card">
            <div className="sa-card-head">
              <div>
                <h2>Activity Log</h2>
              </div>
            </div>
            <ul className="sa-timeline">
              {activity.map((a) => (
                <li key={a.text}>
                  <span className="sa-dot" />
                  <div>
                    <strong>{a.text}</strong>
                    <p>{a.date}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
