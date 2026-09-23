import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import clsx from "clsx";
import { fetchSaTenants, type SaTenant, type SaTenantStatus } from "@/lib/api";

const FILTERS: Array<"All" | SaTenantStatus> = ["All", "Active", "Trial", "Inactive"];

function formatInr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function TenantManagement() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") || "");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [page, setPage] = useState(1);
  const [tenants, setTenants] = useState<SaTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const pageSize = 8;

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    fetchSaTenants({ q: query, status: filter })
      .then((res) => setTenants(res.tenants))
      .catch(() => setTenants([]))
      .finally(() => setLoading(false));
  }, [query, filter]);

  const totalPages = Math.max(1, Math.ceil(tenants.length / pageSize));
  const pageItems = useMemo(
    () => tenants.slice((page - 1) * pageSize, page * pageSize),
    [tenants, page],
  );

  return (
    <div className="sa-stack">
      <div className="sa-toolbar">
        <label className="sa-search">
          <Search size={15} />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by restaurant name or city…"
          />
        </label>
        <div className="sa-filters">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={clsx("sa-filter", filter === f && "is-active")}
              onClick={() => {
                setFilter(f);
                setPage(1);
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="sa-card sa-table-card">
        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Restaurant</th>
                <th>City</th>
                <th>Type</th>
                <th>Plan</th>
                <th>Modules</th>
                <th>MRR</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9}>Loading tenants…</td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={9}>No tenants found</td>
                </tr>
              ) : (
                pageItems.map((t) => {
                  const pct = Math.round((t.modulesEnabled / t.modulesTotal) * 100);
                  return (
                    <tr key={t.id}>
                      <td>
                        <div className="sa-tenant-cell">
                          <span className="sa-tenant-avatar">{t.name[0]}</span>
                          <span>
                            <strong>{t.name}</strong>
                            <em>{t.code}</em>
                          </span>
                        </div>
                      </td>
                      <td>{t.city}</td>
                      <td>{t.type}</td>
                      <td>
                        <span className={`sa-plan is-${t.plan.toLowerCase()}`}>{t.plan}</span>
                      </td>
                      <td>
                        <div className="sa-modules">
                          <div className="sa-bar sa-bar-sm">
                            <span style={{ width: `${pct}%` }} />
                          </div>
                          <em>
                            {t.modulesEnabled}/{t.modulesTotal}
                          </em>
                        </div>
                      </td>
                      <td>{t.mrr ? formatInr(t.mrr) : "—"}</td>
                      <td>
                        <span className={`sa-status is-${t.status.toLowerCase()}`}>{t.status}</span>
                      </td>
                      <td>{t.joined}</td>
                      <td>
                        <Link to={`/super-admin/tenants/${t.id}`} className="sa-action">
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="sa-table-foot">
          <p>
            Showing {pageItems.length} of {tenants.length} tenants
          </p>
          <div className="sa-pages">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                className={clsx("sa-page", page === n && "is-active")}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
