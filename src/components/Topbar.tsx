import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  Calendar,
  Receipt,
  UtensilsCrossed,
  Users,
  Grid3X3,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchNotifications,
  fetchOrders,
  fetchMenuItems,
  fetchCustomers,
  fetchTables,
  type Order,
  type MenuItem,
  type Customer,
  type RestaurantTable,
} from "@/lib/api";

interface TopbarProps {
  title: string;
  subtitle?: string;
  greeting?: boolean;
}

type SearchResult = {
  id: string;
  type: "order" | "menu" | "customer" | "table";
  title: string;
  subtitle: string;
  to: string;
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Topbar({ title, subtitle, greeting }: TopbarProps) {
  const { user, restaurant } = useAuth();
  const navigate = useNavigate();
  const userName = user?.fullName ?? "Guest";
  const restaurantName = restaurant?.name ?? "Your Restaurant";
  const [unreadCount, setUnreadCount] = useState(0);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchNotifications()
      .then((res) => setUnreadCount(res.notifications.filter((n) => !n.read).length))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function ensureData() {
    if (dataLoaded || loading) return;
    setLoading(true);
    try {
      const [ordersRes, menuRes, customersRes, tablesRes] = await Promise.all([
        fetchOrders(),
        fetchMenuItems(),
        fetchCustomers(),
        fetchTables(),
      ]);
      setOrders(ordersRes.orders);
      setMenu(menuRes.items);
      setCustomers(customersRes.customers);
      setTables(tablesRes.tables);
      setDataLoaded(true);
    } catch {
      // keep empty results
    } finally {
      setLoading(false);
    }
  }

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as SearchResult[];

    const out: SearchResult[] = [];
    const billQuery = q.replace(/^#/, "");

    for (const order of orders) {
      const bill = String(order.billNo);
      const hay = `${bill} ${order.customerName} ${order.tableOrNo} ${order.mode}`.toLowerCase();
      if (bill.includes(billQuery) || hay.includes(q)) {
        out.push({
          id: `order-${order.id}`,
          type: "order",
          title: `Bill #${order.billNo}`,
          subtitle: `${order.tableOrNo || order.customerName || "Walk-in"} · ₹${order.total.toFixed(0)} · ${order.status}`,
          to: `/billing/invoice/${order.id}`,
        });
      }
      if (out.filter((r) => r.type === "order").length >= 5) break;
    }

    for (const item of menu) {
      const hay = `${item.name} ${item.category}`.toLowerCase();
      if (hay.includes(q)) {
        out.push({
          id: `menu-${item.id}`,
          type: "menu",
          title: item.name,
          subtitle: `${item.category} · ₹${item.price}`,
          to: "/menu",
        });
      }
      if (out.filter((r) => r.type === "menu").length >= 5) break;
    }

    for (const customer of customers) {
      const hay = `${customer.name} ${customer.phone} ${customer.email ?? ""}`.toLowerCase();
      if (hay.includes(q)) {
        out.push({
          id: `customer-${customer.id}`,
          type: "customer",
          title: customer.name,
          subtitle: customer.phone || customer.email || "Customer",
          to: "/customers",
        });
      }
      if (out.filter((r) => r.type === "customer").length >= 5) break;
    }

    for (const table of tables) {
      const hay = `${table.number} ${table.area} ${table.customerName ?? ""} ${table.status}`.toLowerCase();
      if (hay.includes(q) || table.number.toLowerCase().includes(billQuery)) {
        out.push({
          id: `table-${table.id}`,
          type: "table",
          title: `Table ${table.number}`,
          subtitle: `${table.area} · ${table.status}${table.customerName ? ` · ${table.customerName}` : ""}`,
          to: "/tables",
        });
      }
      if (out.filter((r) => r.type === "table").length >= 5) break;
    }

    return out.slice(0, 12);
  }, [query, orders, menu, customers, tables]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function goTo(result: SearchResult) {
    setOpen(false);
    setQuery("");
    navigate(result.to);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      goTo(results[activeIndex] ?? results[0]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const typeIcon = {
    order: Receipt,
    menu: UtensilsCrossed,
    customer: Users,
    table: Grid3X3,
  } as const;

  const typeLabel = {
    order: "Bill",
    menu: "Menu",
    customer: "Customer",
    table: "Table",
  } as const;

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-slate-100 bg-white/80 px-4 backdrop-blur sm:px-8 print:hidden">
      <div>
        {greeting ? (
          <>
            <h1 className="text-lg font-bold text-slate-900">
              {getGreeting()}, {userName.split(" ")[0]}!
            </h1>
            <p className="hidden items-center gap-1.5 text-xs text-slate-400 sm:flex">
              <Calendar size={12} />
              {today} · {restaurantName}
            </p>
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
            {subtitle && <p className="hidden text-xs text-slate-400 sm:block">{subtitle}</p>}
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block" ref={rootRef}>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            placeholder="Search bills, items, customers..."
            className="w-72 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-9 text-sm text-slate-700 outline-none focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
            onFocus={() => {
              setOpen(true);
              void ensureData();
            }}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              void ensureData();
            }}
            onKeyDown={onKeyDown}
            aria-label="Global search"
            aria-expanded={open}
            aria-controls="global-search-results"
          />
          {query && (
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
            >
              <X size={14} />
            </button>
          )}

          {open && (query.trim() || loading) && (
            <div
              id="global-search-results"
              className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
            >
              {loading && !dataLoaded ? (
                <p className="px-4 py-6 text-center text-sm text-slate-400">Searching…</p>
              ) : results.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-400">
                  {query.trim() ? `No results for “${query.trim()}”` : "Type to search bills, menu, customers, tables"}
                </p>
              ) : (
                <ul className="max-h-80 overflow-y-auto py-2">
                  {results.map((result, index) => {
                    const Icon = typeIcon[result.type];
                    return (
                      <li key={result.id}>
                        <button
                          type="button"
                          className={`flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-slate-50 ${
                            index === activeIndex ? "bg-brand-50" : ""
                          }`}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => goTo(result)}
                        >
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                            <Icon size={15} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-slate-900">{result.title}</span>
                            <span className="block truncate text-xs text-slate-500">{result.subtitle}</span>
                          </span>
                          <span className="mt-1 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                            {typeLabel[result.type]}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => navigate("/notifications")}
          className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-50"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger-600" />}
        </button>

        <div className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-3 hover:bg-slate-50">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
            {userName[0]}
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-semibold text-slate-900">{userName}</p>
            <p className="text-xs text-slate-400">{user?.role ?? ""}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
