import { Check } from "lucide-react";
import clsx from "clsx";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/context/AuthContext";

const subscriptionPlans = [
  {
    name: "Basic" as const,
    price: 999,
    period: "month",
    users: "Up to 2 users",
    features: ["Billing (POS)", "Menu Management", "Basic Reports", "WhatsApp Invoice Sharing"],
  },
  {
    name: "Standard" as const,
    price: 1999,
    period: "month",
    users: "Up to 5 users",
    features: ["Everything in Basic", "Inventory Management", "Expense Management", "Customer Management", "Weekly & Monthly Reports"],
  },
  {
    name: "Premium" as const,
    price: 3499,
    period: "month",
    users: "Up to 10 users",
    features: ["Everything in Standard", "Multi-user roles", "Advanced Reports", "Priority Support"],
  },
];

export default function Subscription() {
  const { restaurant } = useAuth();

  return (
    <div>
      <PageHeader title="Subscription" subtitle="Choose the plan that fits your business" />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {subscriptionPlans.map((plan) => {
          const isCurrent = restaurant?.plan === plan.name;
          return (
            <div key={plan.name} className={clsx("card relative flex flex-col p-6", isCurrent && "ring-2 ring-brand-500")}>
              {isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                  Current Plan
                </span>
              )}
              <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
              <p className="text-sm text-slate-400">{plan.users}</p>
              <p className="mt-4">
                <span className="text-3xl font-bold text-slate-900">₹{plan.price.toLocaleString()}</span>
                <span className="text-sm text-slate-400"> / {plan.period}</span>
              </p>

              <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-600">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-success-600" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                disabled={isCurrent}
                className={clsx(
                  "mt-6 w-full rounded-xl py-2.5 text-sm font-semibold transition-colors",
                  isCurrent ? "cursor-not-allowed bg-slate-100 text-slate-400" : "bg-brand-600 text-white hover:bg-brand-700",
                )}
              >
                {isCurrent ? "Current Plan" : "Switch Plan"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
