import { useEffect, useState } from "react";
import { X } from "lucide-react";
import clsx from "clsx";
import { ApiError, fetchSaSupport, updateSaSupportTicket, type SaSupportTicket } from "@/lib/api";

type ReplyDraft = {
  ticket: SaSupportTicket;
  reply: string;
  status: SaSupportTicket["status"];
  assignedTo: string;
};

export default function SupportCenter() {
  const [tickets, setTickets] = useState<SaSupportTicket[]>([]);
  const [stats, setStats] = useState({ open: 0, inProgress: 0, resolved: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<ReplyDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetchSaSupport();
    setTickets(res.tickets);
    setStats(res.stats);
  }

  useEffect(() => {
    load()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!draft) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDraft(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [draft]);

  function openRespond(ticket: SaSupportTicket) {
    setError("");
    setDraft({
      ticket,
      reply: ticket.response || "",
      status: ticket.status === "Resolved" ? "Resolved" : ticket.status === "Open" ? "In Progress" : ticket.status,
      assignedTo: ticket.assignedTo || "Platform Support",
    });
  }

  async function submitReply() {
    if (!draft) return;
    if (!draft.reply.trim()) {
      setError("Enter a reply before sending");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateSaSupportTicket(draft.ticket.dbId, {
        status: draft.status,
        response: draft.reply.trim(),
        assignedTo: draft.assignedTo.trim() || "Platform Support",
      });
      await load();
      setDraft(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send reply");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="sa-card">Loading support center…</div>;

  return (
    <div className="sa-stack">
      <div className="sa-support-stats">
        <div className="sa-card sa-support-stat">
          <p>Open tickets</p>
          <strong className="is-open">{stats.open}</strong>
        </div>
        <div className="sa-card sa-support-stat">
          <p>In Progress tickets</p>
          <strong className="is-progress">{stats.inProgress}</strong>
        </div>
        <div className="sa-card sa-support-stat">
          <p>Resolved tickets</p>
          <strong className="is-resolved">{stats.resolved}</strong>
        </div>
        <div className="sa-card sa-support-stat">
          <p>Total tickets</p>
          <strong className="is-total">{stats.total}</strong>
        </div>
      </div>

      <div className="sa-card">
        <div className="sa-card-head">
          <div>
            <h2>Support Tickets</h2>
          </div>
        </div>
        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Tenant</th>
                <th>Issue</th>
                <th>Status</th>
                <th>Submitted</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.dbId}>
                  <td>
                    <strong>{t.id}</strong>
                  </td>
                  <td>{t.tenant}</td>
                  <td>{t.issue}</td>
                  <td>
                    <span className={`sa-status is-${t.status.toLowerCase().replace(" ", "-")}`}>
                      {t.status}
                    </span>
                  </td>
                  <td>{t.submitted}</td>
                  <td>
                    <button type="button" className="sa-action" onClick={() => openRespond(t)}>
                      Respond
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {draft && (
        <div className="sa-modal-backdrop" onClick={() => setDraft(null)}>
          <div
            className="sa-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sa-respond-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sa-modal-head">
              <div>
                <h2 id="sa-respond-title">Respond to {draft.ticket.id}</h2>
                <p>
                  {draft.ticket.tenant} — {draft.ticket.issue}
                </p>
              </div>
              <button type="button" className="sa-modal-close" onClick={() => setDraft(null)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="sa-modal-body">
              <label className="sa-field">
                <span>Assign to</span>
                <input
                  value={draft.assignedTo}
                  onChange={(e) => setDraft({ ...draft, assignedTo: e.target.value })}
                  placeholder="Support agent"
                />
              </label>
              <div className="sa-field">
                <span>Status</span>
                <div className="sa-status-toggle">
                  {(["Open", "In Progress", "Resolved"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={clsx(draft.status === s && "is-active")}
                      onClick={() => setDraft({ ...draft, status: s })}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <label className="sa-field">
                <span>Reply</span>
                <textarea
                  rows={5}
                  value={draft.reply}
                  onChange={(e) => setDraft({ ...draft, reply: e.target.value })}
                  placeholder="Write your response to the tenant…"
                />
              </label>
              {error && <p className="sa-field-error">{error}</p>}
            </div>
            <div className="sa-modal-foot">
              <button type="button" className="sa-btn is-primary" disabled={saving} onClick={submitReply}>
                {saving ? "Sending…" : "Send Reply"}
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
