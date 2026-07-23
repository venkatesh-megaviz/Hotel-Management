import * as Icons from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import clsx from "clsx";
import type { StatCardData } from "@/types";

const accentStyles = {
  brand: "bg-brand-50 text-brand-600",
  success: "bg-success-50 text-success-600",
  warning: "bg-warning-50 text-warning-600",
  danger: "bg-danger-50 text-danger-600",
};

export default function StatCard({ data }: { data: StatCardData }) {
  const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[data.icon] ?? Icons.Circle;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm text-slate-500">{data.label}</p>
        <div className={clsx("flex h-9 w-9 items-center justify-center rounded-xl", accentStyles[data.accent])}>
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{data.value}</p>
      <div className="mt-1 flex items-center gap-1.5 text-xs">
        {data.change && (
          <span
            className={clsx(
              "flex items-center gap-0.5 font-medium",
              data.changeType === "up" ? "text-success-600" : "text-danger-600",
            )}
          >
            {data.changeType === "up" ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {data.change}
          </span>
        )}
        <span className="text-slate-400">{data.helpText}</span>
      </div>
    </div>
  );
}
