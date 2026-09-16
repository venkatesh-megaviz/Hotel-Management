import { useEffect, useState } from "react";
import { fetchSaSupport, updateSaSupportTicket, type SaSupportTicket } from "@/lib/api";

export default function SupportCenter() {
  const [tickets, setTickets] = useState<SaSupportTicket[]>([]);
  const [stats, setStats] = useState({ open: 0, inProgress: 0, resolved: 0, total: 0 });
  const [loading, setLoading] = useState(true);

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

  async function respond(ticket: SaSupportTicket) {
    if (ticket.status === "Resolved") return;
    const next = ticket.status === "Open" ? "In Progress" : "Resolved";
    await updateSaSupportTicket(ticket.dbId, { status: next });
    await load();
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
                    <button type="button" className="sa-action" onClick={() => respond(t)}>
                      Respond
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
