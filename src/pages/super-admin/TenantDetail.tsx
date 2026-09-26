import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, X } from "lucide-react";
import { ApiError, fetchSaTenant, updateSaTenant, type SaTenant } from "@/lib/api";

function formatInr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

type EditDraft = {
  ownerName: string;
  email: string;
  phone: string;
  address: string;
};

export default function TenantDetail() {
  const { id = "" } = useParams();
  const [tenant, setTenant] = useState<SaTenant | null>(null);
  const [allModules, setAllModules] = useState<string[]>([]);
  const [invoices, setInvoices] = useState<{ id: string; date: string; amount: number; status: string }[]>([]);
  const [activity, setActivity] = useState<{ text: string; date: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<EditDraft | null>(null);
  const [editError, setEditError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

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

  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEditing(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing]);

  function openEdit() {
    if (!tenant) return;
    setEditError("");
    setEditing({
      ownerName: tenant.owner,
      email: tenant.email,
      phone: tenant.phone,
      address: tenant.address,
    });
  }

  async function saveEdit() {
    if (!tenant || !editing) return;
    if (!editing.ownerName.trim()) {
      setEditError("Owner name is required");
      return;
    }
    if (!editing.email.trim()) {
      setEditError("Email is required");
      return;
    }
    setSavingEdit(true);
    setEditError("");
    try {
      const res = await updateSaTenant(tenant.id, {
        ownerName: editing.ownerName.trim(),
        email: editing.email.trim(),
        phone: editing.phone.trim(),
        address: editing.address.trim(),
      });
      setTenant(res.tenant);
      setEditing(null);
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : "Failed to save details");
    } finally {
      setSavingEdit(false);
    }
  }

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
      <Link to="/admin/tenants" className="sa-crumb">
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
          <button type="button" className="sa-btn is-ghost" onClick={openEdit}>
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

      {editing && (
        <div className="sa-modal-backdrop" onClick={() => setEditing(null)}>
          <div
            className="sa-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sa-edit-tenant-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sa-modal-head">
              <div>
                <h2 id="sa-edit-tenant-title">Edit Details</h2>
                <p>Update owner contact info for {tenant.name}</p>
              </div>
              <button type="button" className="sa-modal-close" onClick={() => setEditing(null)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="sa-modal-body">
              <label className="sa-field">
                <span>Owner</span>
                <input
                  value={editing.ownerName}
                  onChange={(e) => setEditing({ ...editing, ownerName: e.target.value })}
                />
              </label>
              <label className="sa-field">
                <span>Email</span>
                <input
                  type="email"
                  value={editing.email}
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                />
              </label>
              <label className="sa-field">
                <span>Phone</span>
                <input
                  value={editing.phone}
                  onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                />
              </label>
              <label className="sa-field">
                <span>Address</span>
                <textarea
                  rows={3}
                  value={editing.address}
                  onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                />
              </label>
              {editError && <p className="sa-field-error">{editError}</p>}
            </div>
            <div className="sa-modal-foot">
              <button type="button" className="sa-btn is-primary" disabled={savingEdit} onClick={saveEdit}>
                {savingEdit ? "Saving…" : "Save Changes"}
              </button>
              <button type="button" className="sa-btn is-ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
