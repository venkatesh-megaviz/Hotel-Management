import clsx from "clsx";

const styles: Record<string, string> = {
  Preparing: "bg-[#EFF6FF] text-[#155DFC]",
  Served: "bg-[#ECFDF5] text-[#009966]",
  Billed: "bg-[#ECFDF5] text-[#009966]",
  Cancelled: "bg-danger-50 text-danger-600",
  Paid: "bg-[#ECFDF5] text-[#009966]",
  Pending: "bg-[#FFF7ED] text-[#FE9A00]",
  Refunded: "bg-danger-50 text-danger-600",
};

export default function StatusBadge({ status }: { status: string }) {
  return <span className={clsx("badge", styles[status] ?? "bg-slate-100 text-slate-600")}>{status}</span>;
}
