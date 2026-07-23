import clsx from "clsx";

const styles: Record<string, string> = {
  Preparing: "bg-warning-50 text-warning-600",
  Served: "bg-brand-50 text-brand-600",
  Billed: "bg-success-50 text-success-600",
  Cancelled: "bg-danger-50 text-danger-600",
  Paid: "bg-success-50 text-success-600",
  Pending: "bg-warning-50 text-warning-600",
  Refunded: "bg-danger-50 text-danger-600",
};

export default function StatusBadge({ status }: { status: string }) {
  return <span className={clsx("badge", styles[status] ?? "bg-slate-100 text-slate-600")}>{status}</span>;
}
