import { useEffect, useMemo, useState } from "react";
import { Check, Flame, Plus, RotateCcw, X } from "lucide-react";
import clsx from "clsx";
import {
  ApiError,
  createSaLead,
  deleteSaLead,
  fetchSaLeads,
  updateSaLead,
  type SaLead,
  type SaLeadInterest,
  type SaLeadManager,
} from "@/lib/api";

type InterestFilter = "All" | "Hot" | "Warm" | "Cold" | "Converted" | "Renewal";

type LeadDraft = {
  id: string | null;
  contactName: string;
  businessName: string;
  phone: string;
  software: string;
  renewalDate: string;
  assignedTo: string;
  interest: SaLeadInterest;
  notes: string;
};

const EMPTY_DRAFT: LeadDraft = {
  id: null,
  contactName: "",
  businessName: "",
  phone: "",
  software: "",
  renewalDate: "",
  assignedTo: "",
  interest: "Warm",
  notes: "",
};

const INTEREST_FILTERS: InterestFilter[] = ["All", "Hot", "Warm", "Cold", "Converted", "Renewal"];

function interestIcon(interest: SaLeadInterest | InterestFilter) {
  if (interest === "Hot") return <Flame size={12} />;
  if (interest === "Converted") return <Check size={12} />;
  if (interest === "Renewal") return <RotateCcw size={12} />;
  return null;
}

export default function SalesLeads() {
  const [leads, setLeads] = useState<SaLead[]>([]);
  const [managers, setManagers] = useState<SaLeadManager[]>([]);
  const [stats, setStats] = useState({ total: 0, hot: 0, converted: 0, renewalSoon: 0 });
  const [manager, setManager] = useState("all");
  const [interest, setInterest] = useState<InterestFilter>("All");
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<LeadDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load(nextManager = manager, nextInterest = interest) {
    const res = await fetchSaLeads({
      manager: nextManager,
      interest: nextInterest === "All" ? "all" : nextInterest,
    });
    setLeads(res.leads);
    setManagers(res.managers);
    setStats(res.stats);
  }

  useEffect(() => {
    load()
      .catch(() => undefined)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!draft) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDraft(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [draft]);

  const subtitle = useMemo(() => {
    if (manager === "all") return `All marketing managers · ${stats.total} leads`;
    const m = managers.find((x) => x.name === manager);
    return `${manager} · ${m?.leads ?? leads.length} leads`;
  }, [manager, managers, stats.total, leads.length]);

  async function selectManager(name: string) {
    setManager(name);
    setLoading(true);
    try {
      await load(name, interest);
    } finally {
      setLoading(false);
    }
  }

  async function selectInterest(next: InterestFilter) {
    setInterest(next);
    setLoading(true);
    try {
      await load(manager, next);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setError("");
    setDraft({ ...EMPTY_DRAFT });
  }

  function openEdit(lead: SaLead) {
    setError("");
    setDraft({
      id: lead.id,
      contactName: lead.contactName,
      businessName: lead.businessName,
      phone: lead.phone,
      software: lead.software,
      renewalDate: lead.renewalDate,
      assignedTo: lead.assignedTo,
      interest: lead.interest === "Converted" ? "Warm" : lead.interest,
      notes: lead.notes,
    });
  }

  async function saveDraft() {
    if (!draft) return;
    if (!draft.contactName.trim() || !draft.businessName.trim() || !draft.phone.trim() || !draft.assignedTo.trim()) {
      setError("Fill contact, business, phone, and assigned manager");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        contactName: draft.contactName.trim(),
        businessName: draft.businessName.trim(),
        phone: draft.phone.trim(),
        software: draft.software.trim(),
        renewalDate: draft.renewalDate.trim(),
        assignedTo: draft.assignedTo.trim(),
        interest: draft.interest,
        notes: draft.notes.trim(),
      };
      if (draft.id) await updateSaLead(draft.id, payload);
      else await createSaLead(payload);
      await load();
      setDraft(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save lead");
    } finally {
      setSaving(false);
    }
  }

  async function convertLead(id: string) {
    await updateSaLead(id, { interest: "Converted", touch: true });
    await load();
  }

  async function removeLead(id: string) {
    if (!window.confirm("Remove this lead?")) return;
    await deleteSaLead(id);
    await load();
  }

  return (
    <div className="sa-stack sa-leads">
      <div className="sa-page-head">
        <div>
          <h2 className="sa-page-title">Sales Leads</h2>
          <p>{subtitle}</p>
        </div>
        <button type="button" className="sa-btn is-primary" onClick={openCreate}>
          <Plus size={16} /> Add Lead
        </button>
      </div>

      <div className="sa-manager-row">
        <button
          type="button"
          className={clsx("sa-manager-chip", manager === "all" && "is-active")}
          onClick={() => selectManager("all")}
        >
          <span className="sa-manager-avatar is-all">★</span>
          <span>
            <strong>All Managers</strong>
            <em>
              {managers.reduce((n, m) => n + m.leads, 0)} leads · {managers.reduce((n, m) => n + m.hot, 0)} hot
            </em>
          </span>
        </button>
        {managers.map((m) => (
          <button
            key={m.name}
            type="button"
            className={clsx("sa-manager-chip", manager === m.name && "is-active")}
            onClick={() => selectManager(m.name)}
          >
            <span className="sa-manager-avatar">{m.initials}</span>
            <span>
              <strong>{m.name.split(" ")[0]}</strong>
              <em>
                {m.leads} leads · {m.hot} hot
              </em>
            </span>
          </button>
        ))}
      </div>

      <div className="sa-lead-stats">
        <div className="sa-lead-stat is-total">
          <p>Total Leads</p>
          <strong>{stats.total}</strong>
        </div>
        <div className="sa-lead-stat is-hot">
          <p>Hot</p>
          <strong>{stats.hot}</strong>
        </div>
        <div className="sa-lead-stat is-converted">
          <p>Converted</p>
          <strong>{stats.converted}</strong>
        </div>
        <div className="sa-lead-stat is-renewal">
          <p>Renewal Soon</p>
          <strong>{stats.renewalSoon}</strong>
        </div>
      </div>

      <div className="sa-lead-filters">
        <span>Filter</span>
        {INTEREST_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={clsx("sa-lead-filter", interest === f && "is-active", f === "Hot" && "is-hot", f === "Converted" && "is-converted")}
            onClick={() => selectInterest(f)}
          >
            {interestIcon(f)}
            {f}
          </button>
        ))}
      </div>

      <div className="sa-card sa-table-card">
        <div className="sa-table-wrap">
          <table className="sa-table sa-leads-table">
            <thead>
              <tr>
                <th>Contact</th>
                <th>Business</th>
                <th>Phone</th>
                <th>Software</th>
                <th>Renewal</th>
                <th>Interest</th>
                <th>Assigned To</th>
                <th>Last Contact</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9}>Loading leads…</td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={9}>No leads match this filter.</td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <strong>{lead.contactName}</strong>
                    </td>
                    <td>{lead.businessName}</td>
                    <td>{lead.phone}</td>
                    <td>{lead.software || "—"}</td>
                    <td>
                      <span className={clsx("sa-renewal", lead.renewalSoon && "is-soon")}>
                        {lead.renewalSoon && <span className="sa-renewal-dot" />}
                        {lead.renewalDate || "—"}
                      </span>
                    </td>
                    <td>
                      <span className={clsx("sa-interest", `is-${lead.interest.toLowerCase()}`)}>
                        {interestIcon(lead.interest)}
                        {lead.interest}
                      </span>
                    </td>
                    <td>
                      <span className="sa-assigned">
                        <span className="sa-assigned-avatar">{lead.assignedInitials}</span>
                        {lead.assignedTo}
                      </span>
                    </td>
                    <td>{lead.lastContact}</td>
                    <td>
                      <div className="sa-lead-actions">
                        {lead.interest !== "Converted" && (
                          <button type="button" className="sa-convert-btn" onClick={() => convertLead(lead.id)}>
                            <Check size={13} /> Convert
                          </button>
                        )}
                        <button type="button" className="sa-text-btn" onClick={() => openEdit(lead)}>
                          Edit
                        </button>
                        <button type="button" className="sa-text-btn" onClick={() => removeLead(lead.id)}>
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {draft && (
        <div className="sa-modal-backdrop" onClick={() => setDraft(null)}>
          <div className="sa-modal sa-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-head">
              <div>
                <h2>{draft.id ? "Edit Lead" : "Add Lead"}</h2>
                <p>Track prospect details, current software, and renewal timing.</p>
              </div>
              <button type="button" className="sa-modal-close" onClick={() => setDraft(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="sa-modal-body">
              {error && <p className="sa-form-error">{error}</p>}
              <div className="sa-form-grid">
                <label className="sa-field">
                  <span>Contact Name</span>
                  <input
                    value={draft.contactName}
                    onChange={(e) => setDraft({ ...draft, contactName: e.target.value })}
                    placeholder="Person's full name"
                  />
                </label>
                <label className="sa-field">
                  <span>Business Name</span>
                  <input
                    value={draft.businessName}
                    onChange={(e) => setDraft({ ...draft, businessName: e.target.value })}
                    placeholder="Restaurant or company name"
                  />
                </label>
                <label className="sa-field">
                  <span>Phone Number</span>
                  <input
                    value={draft.phone}
                    onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </label>
                <label className="sa-field">
                  <span>Current Software</span>
                  <input
                    value={draft.software}
                    onChange={(e) => setDraft({ ...draft, software: e.target.value })}
                    placeholder="e.g. Petpooja, GoFrugal"
                  />
                </label>
                <label className="sa-field">
                  <span>Subscription End</span>
                  <input
                    value={draft.renewalDate}
                    onChange={(e) => setDraft({ ...draft, renewalDate: e.target.value })}
                    placeholder="e.g. 15 Oct 2024"
                  />
                </label>
                <label className="sa-field">
                  <span>Assigned To</span>
                  <input
                    value={draft.assignedTo}
                    onChange={(e) => setDraft({ ...draft, assignedTo: e.target.value })}
                    placeholder="Marketing manager name"
                    list="sa-manager-list"
                  />
                  <datalist id="sa-manager-list">
                    {managers.map((m) => (
                      <option key={m.name} value={m.name} />
                    ))}
                  </datalist>
                </label>
              </div>

              <div className="sa-field">
                <span>Interest Level</span>
                <div className="sa-interest-picks">
                  {(["Hot", "Warm", "Cold"] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      className={clsx("sa-interest-pick", draft.interest === level && "is-active", `is-${level.toLowerCase()}`)}
                      onClick={() => setDraft({ ...draft, interest: level })}
                    >
                      {level === "Hot" ? "🔥 Hot" : level}
                    </button>
                  ))}
                </div>
              </div>

              <label className="sa-field">
                <span>Notes</span>
                <textarea
                  rows={4}
                  value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                  placeholder="Additional context, follow-up instructions, or next steps..."
                />
              </label>
            </div>
            <div className="sa-modal-foot">
              <button type="button" className="sa-btn is-primary" disabled={saving} onClick={saveDraft}>
                {saving ? "Saving…" : draft.id ? "Save Lead" : "Add Lead"}
              </button>
              <button type="button" className="sa-btn is-ghost" onClick={() => setDraft(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
