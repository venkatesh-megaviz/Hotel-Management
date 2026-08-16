import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Award, Gift } from "lucide-react";
import clsx from "clsx";
import { fetchCustomers, redeemLoyaltyPoints, ApiError, type Customer } from "@/lib/api";

type Tab = "members" | "tiers" | "redeem";

const TIER_DEFS = [
  { label: "Bronze" as const, minSpend: 0, multiplier: 1, cardBg: "#FFF7ED", iconColor: "#FE9A00", badge: "bg-orange-100 text-orange-700" },
  { label: "Silver" as const, minSpend: 8000, multiplier: 1.5, cardBg: "#F8FAFC", iconColor: "#64748B", badge: "bg-slate-200 text-slate-700" },
  { label: "Gold" as const, minSpend: 15000, multiplier: 2, cardBg: "#FFFBEB", iconColor: "#D97706", badge: "bg-amber-100 text-amber-700" },
  { label: "Platinum" as const, minSpend: 30000, multiplier: 3, cardBg: "#F5F3FF", iconColor: "#7C3AED", badge: "bg-purple-100 text-purple-700" },
];

function tierForSpend(spent: number) {
  if (spent >= 30000) return TIER_DEFS[3];
  if (spent >= 15000) return TIER_DEFS[2];
  if (spent >= 8000) return TIER_DEFS[1];
  return TIER_DEFS[0];
}

function loyaltyPoints(customer: Customer) {
  const tier = tierForSpend(customer.totalSpent);
  const earned = Math.floor((customer.totalSpent / 10) * tier.multiplier);
  return Math.max(0, earned - (customer.loyaltyPointsRedeemed ?? 0));
}

function PillButton({
  children,
  onClick,
  variant = "primary",
  className,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "flex h-8 items-center justify-center gap-1.5 rounded-2xl px-4 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60",
        variant === "primary" ? "bg-[#155dfc] text-white" : "border border-slate-200 bg-white text-slate-600",
        className,
      )}
    >
      {children}
    </button>
  );
}

export default function Loyalty() {
  const [tab, setTab] = useState<Tab>("members");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemCustomerId, setRedeemCustomerId] = useState("");
  const [redeemPoints, setRedeemPoints] = useState("");
  const [redeemMsg, setRedeemMsg] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    fetchCustomers()
      .then((res) => setCustomers(res.customers))
      .finally(() => setLoading(false));
  }, []);

  const members = useMemo(
    () =>
      customers
        .map((c) => {
          const tier = tierForSpend(c.totalSpent);
          return { ...c, points: loyaltyPoints(c), tier };
        })
        .sort((a, b) => b.points - a.points),
    [customers],
  );

  const tierCounts = useMemo(() => {
    const counts = { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0 };
    members.forEach((m) => counts[m.tier.label]++);
    return counts;
  }, [members]);

  async function handleRedeem(customerId?: string) {
    const id = customerId ?? redeemCustomerId;
    const pts = Number(redeemPoints);
    const member = members.find((m) => m.id === id);
    if (!member) {
      setRedeemMsg("Please select a customer.");
      return;
    }
    if (!pts || pts <= 0) {
      setRedeemMsg("Enter valid points to redeem.");
      return;
    }
    if (pts > member.points) {
      setRedeemMsg(`${member.name} only has ${member.points.toLocaleString()} pts available.`);
      return;
    }

    setRedeeming(true);
    try {
      const res = await redeemLoyaltyPoints(id, pts);
      setCustomers((prev) => prev.map((c) => (c.id === id ? res.customer : c)));
      setRedeemMsg(`Redeemed ${pts.toLocaleString()} pts for ${member.name} (₹${pts.toLocaleString()} discount).`);
      setRedeemPoints("");
      setRedeemCustomerId("");
    } catch (err) {
      setRedeemMsg(err instanceof ApiError ? err.message : "Failed to redeem points.");
    } finally {
      setRedeeming(false);
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500 lg:hidden">Manage customer points and rewards</p>

      <div className="inline-flex rounded-xl bg-slate-100 p-1">
        {(
          [
            ["members", "Members"],
            ["tiers", "Tiers & Settings"],
            ["redeem", "Redeem Points"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={clsx(
              "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              tab === key ? "bg-[#155dfc] text-white" : "text-slate-500 hover:text-slate-700",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "members" && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {TIER_DEFS.map((tier) => (
              <div
                key={tier.label}
                className="rounded-2xl border border-slate-100 p-4 text-center shadow-sm"
                style={{ backgroundColor: tier.cardBg }}
              >
                <Award size={22} className="mx-auto" style={{ color: tier.iconColor }} />
                <p className="mt-2 text-2xl font-bold text-slate-900">{tierCounts[tier.label]}</p>
                <p className="text-sm font-semibold text-slate-600">{tier.label}</p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            {loading ? (
              <p className="p-8 text-center text-sm text-slate-400">Loading members…</p>
            ) : members.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">No loyalty members yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-3 font-medium">Customer</th>
                      <th className="px-5 py-3 font-medium">Tier</th>
                      <th className="px-5 py-3 font-medium">Points</th>
                      <th className="px-5 py-3 font-medium">Total Spent</th>
                      <th className="px-5 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {members.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">{m.name}</p>
                          <p className="text-xs text-slate-400">{m.phone}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-semibold", m.tier.badge)}>
                            {m.tier.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-semibold text-[#155DFC]">{m.points.toLocaleString()} pts</td>
                        <td className="px-5 py-4 font-medium text-slate-800">₹{m.totalSpent.toLocaleString()}</td>
                        <td className="px-5 py-4">
                          <PillButton
                            onClick={() => {
                              setRedeemCustomerId(m.id);
                              setRedeemMsg("");
                              setTab("redeem");
                            }}
                            className="min-w-[100px]"
                          >
                            <Gift size={14} />
                            Redeem
                          </PillButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === "tiers" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900">Points Configuration</h3>
            <p className="mt-1 text-sm text-slate-500">1 point earned per ₹10 spent</p>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:max-w-md">
              <div className="rounded-xl bg-[#EFF6FF] px-4 py-3">
                <p className="text-xs text-slate-500">Points per ₹10</p>
                <p className="text-lg font-bold text-[#155DFC]">1 pt</p>
              </div>
              <div className="rounded-xl bg-[#EFF6FF] px-4 py-3">
                <p className="text-xs text-slate-500">1 point value</p>
                <p className="text-lg font-bold text-[#155DFC]">₹1</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {TIER_DEFS.map((tier) => (
              <div
                key={tier.label}
                className="rounded-2xl border border-slate-100 p-5 shadow-sm"
                style={{ backgroundColor: tier.cardBg }}
              >
                <div className="flex items-center gap-2">
                  <Award size={20} style={{ color: tier.iconColor }} />
                  <h4 className="font-bold text-slate-900">{tier.label}</h4>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Min spend</span>
                    <span className="font-semibold text-slate-800">₹{tier.minSpend.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Points multiplier</span>
                    <span className="font-semibold text-slate-800">{tier.multiplier}x</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "redeem" && (
        <div className="w-full max-w-lg rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Redeem Customer Points</h3>
          <p className="mt-1 text-sm text-slate-500">Look up a customer and apply point discount</p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Select Customer</label>
              <select
                value={redeemCustomerId}
                onChange={(e) => setRedeemCustomerId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#155DFC] focus:ring-2 focus:ring-[#EFF6FF]"
              >
                <option value="">— Choose customer —</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.points.toLocaleString()} pts)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Points to Redeem</label>
              <input
                type="number"
                min={1}
                placeholder="Enter points"
                value={redeemPoints}
                onChange={(e) => setRedeemPoints(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#155DFC] focus:ring-2 focus:ring-[#EFF6FF]"
              />
            </div>
            {redeemMsg && (
              <p className={clsx("text-sm", redeemMsg.startsWith("Redeemed") ? "text-[#009966]" : "text-red-600")}>{redeemMsg}</p>
            )}
            <PillButton className="w-full" onClick={() => handleRedeem()} disabled={redeeming}>
              {redeeming ? "Redeeming…" : "Redeem Points"}
            </PillButton>
          </div>
        </div>
      )}
    </div>
  );
}
