import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search, X } from "lucide-react";
import { fetchSaTenants, type SaTenant } from "@/lib/api";
import { platformDateLabel } from "./data";

export default function SuperAdminTopbar({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SaTenant[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(() => {
      fetchSaTenants({ q })
        .then((res) => {
          setResults(res.tenants.slice(0, 8));
          setOpen(true);
        })
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function goToResults() {
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    navigate(`/admin/tenants?q=${encodeURIComponent(q)}`);
  }

  function goToTenant(id: string) {
    setOpen(false);
    setQuery("");
    navigate(`/admin/tenants/${id}`);
  }

  return (
    <header className="sa-topbar">
      <div>
        <h1>{title}</h1>
        <p>{subtitle ?? `Dinevoro Platform · ${platformDateLabel()}`}</p>
      </div>
      <div className="sa-topbar-actions">
        <div className="sa-quick-search-wrap" ref={wrapRef}>
          <label className="sa-quick-search">
            <Search size={14} />
            <input
              type="search"
              placeholder="Quick search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query.trim() && setOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  goToResults();
                }
                if (e.key === "Escape") setOpen(false);
              }}
            />
            {query && (
              <button
                type="button"
                className="sa-quick-clear"
                aria-label="Clear search"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setOpen(false);
                }}
              >
                <X size={12} />
              </button>
            )}
          </label>
          {open && query.trim() && (
            <div className="sa-quick-dropdown" role="listbox">
              {searching ? (
                <p className="sa-quick-empty">Searching…</p>
              ) : results.length === 0 ? (
                <p className="sa-quick-empty">No tenants match “{query.trim()}”</p>
              ) : (
                <>
                  {results.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="sa-quick-item"
                      onClick={() => goToTenant(t.id)}
                    >
                      <strong>{t.name}</strong>
                      <span>
                        {t.city} · {t.code}
                      </span>
                    </button>
                  ))}
                  <button type="button" className="sa-quick-all" onClick={goToResults}>
                    View all results →
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        <button type="button" className="sa-bell" aria-label="Notifications">
          <Bell size={16} />
          <span className="sa-bell-dot" />
        </button>
      </div>
    </header>
  );
}
