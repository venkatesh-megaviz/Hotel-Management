import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { ChevronLeft } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import {
  fetchAttendance,
  createStaffMember,
  updateStaffAttendance,
  type StaffMember,
  type AttendanceDay,
} from "@/lib/api";

type Tab = "today" | "history" | "add";

const statusColors: Record<string, string> = {
  Present: "bg-emerald-50 text-emerald-700",
  Late: "bg-amber-50 text-amber-700",
  Absent: "bg-red-50 text-red-700",
  "Off Duty": "bg-slate-100 text-slate-500",
};

export default function Attendance() {
  const [tab, setTab] = useState<Tab>("today");
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [history, setHistory] = useState<AttendanceDay[]>([]);
  const [summary, setSummary] = useState({ total: 0, present: 0, late: 0, absent: 0 });
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", role: "", phone: "", shift: "Morning" as "Morning" | "Evening" });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchAttendance()
      .then((res) => {
        setStaff(res.staff);
        setHistory(res.history);
        setSummary(res.summary);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab !== "add") load();
  }, [tab, load]);

  async function handleAction(member: StaffMember, action: "check-in" | "check-out") {
    await updateStaffAttendance(member.id, { action });
    load();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createStaffMember(form);
      setForm({ name: "", role: "", phone: "", shift: "Morning" });
      setTab("today");
      load();
    } finally {
      setSubmitting(false);
    }
  }

  if (tab === "add") {
    return (
      <div className="space-y-6">
        <PageHeader title="Employee Attendance" subtitle="Daily staff check-in/out tracking" />
        <button onClick={() => setTab("today")} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft size={16} />
          Back to today
        </button>
        <div className="card max-w-xl p-6">
          <h3 className="text-base font-semibold text-slate-900">Add New Staff Member</h3>
          <p className="mb-5 text-xs text-slate-400">Register a new employee</p>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Field label="Full Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Employee name" />
            <Field label="Role / Designation" value={form.role} onChange={(v) => setForm((f) => ({ ...f, role: v }))} placeholder="e.g. Waiter, Chef" />
            <Field label="Phone" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="Mobile number" required={false} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Shift</label>
              <select
                value={form.shift}
                onChange={(e) => setForm((f) => ({ ...f, shift: e.target.value as "Morning" | "Evening" }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              >
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
              </select>
            </div>
            <button type="submit" disabled={submitting} className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
              {submitting ? "Adding…" : "Add Staff"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Employee Attendance" subtitle="Daily staff check-in/out tracking" />

      <div className="inline-flex rounded-xl bg-slate-100 p-1">
        {(
          [
            ["today", "Today"],
            ["history", "History"],
            ["add", "Add Staff"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={clsx(
              "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              tab === key ? "bg-brand-600 text-white" : "text-slate-500 hover:text-slate-700",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "today" && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(
              [
                ["Present", summary.present, "text-emerald-700 bg-emerald-50"],
                ["Late", summary.late, "text-amber-700 bg-amber-50"],
                ["Absent", summary.absent, "text-red-700 bg-red-50"],
                ["Total", summary.total, "text-blue-700 bg-blue-50"],
              ] as const
            ).map(([label, count, cls]) => (
              <div key={label} className={clsx("rounded-2xl p-4 text-center", cls.split(" ").slice(2).join(" "))}>
                <p className={clsx("text-3xl font-bold", cls.split(" ")[0])}>{count}</p>
                <p className={clsx("text-sm font-medium", cls.split(" ")[0])}>{label}</p>
              </div>
            ))}
          </div>

          <div className="card overflow-hidden">
            {loading ? (
              <p className="p-8 text-center text-sm text-slate-400">Loading…</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-3 font-medium">Employee</th>
                      <th className="px-5 py-3 font-medium">Role</th>
                      <th className="px-5 py-3 font-medium">Shift</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Check In</th>
                      <th className="px-5 py-3 font-medium">Check Out</th>
                      <th className="px-5 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {staff.map((s) => (
                      <tr key={s.id}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">{s.name[0]}</div>
                            <span className="font-medium text-slate-800">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-500">{s.role}</td>
                        <td className="px-5 py-3 text-slate-500">{s.shift}</td>
                        <td className="px-5 py-3">
                          <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-semibold", statusColors[s.status])}>{s.status}</span>
                        </td>
                        <td className="px-5 py-3 text-slate-600">{s.checkIn || "—"}</td>
                        <td className="px-5 py-3 text-slate-600">{s.checkOut || "—"}</td>
                        <td className="px-5 py-3">
                          {s.status === "Off Duty" ? null : s.checkIn && !s.checkOut ? (
                            <button onClick={() => handleAction(s, "check-out")} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800">
                              Check Out
                            </button>
                          ) : s.status === "Absent" ? (
                            <button onClick={() => handleAction(s, "check-in")} className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700">
                              Check In
                            </button>
                          ) : s.checkOut ? null : (
                            <button onClick={() => handleAction(s, "check-out")} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800">
                              Check Out
                            </button>
                          )}
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

      {tab === "history" && (
        <div className="card overflow-hidden">
          {loading ? (
            <p className="p-8 text-center text-sm text-slate-400">Loading…</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Present</th>
                  <th className="px-5 py-3 font-medium">Late</th>
                  <th className="px-5 py-3 font-medium">Absent</th>
                  <th className="px-5 py-3 font-medium">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {history.map((h) => (
                  <tr key={h.id}>
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {new Date(h.date).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-5 py-3 font-medium text-emerald-600">{h.present}</td>
                    <td className="px-5 py-3 font-medium text-amber-600">{h.late}</td>
                    <td className="px-5 py-3 font-medium text-red-600">{h.absent}</td>
                    <td className="px-5 py-3 text-slate-700">{h.attendancePct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required = true }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; required?: boolean }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <input
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );
}
