import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Building2, Percent, FileText, Lock, Upload, ShieldCheck, Eye, EyeOff, LogOut } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Toast, useToast } from "@/components/Toast";
import { fetchProfile, updateProfile, changePassword, ApiError, type ApiRestaurant } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const tabs = [
  { key: "business", label: "Business Profile", icon: Building2 },
  { key: "gst", label: "GST Settings", icon: Percent },
  { key: "invoice", label: "Invoice Settings", icon: FileText },
  { key: "password", label: "Password", icon: Lock },
] as const;

type FormState = {
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  gstin: string;
  fssai: string;
  city: string;
  state: string;
  address: string;
  logoUrl: string;
  gstEnabled: boolean;
  cgst: number;
  sgst: number;
  igst: number;
  gstInclusive: boolean;
  invoicePrefix: string;
  invoiceStartNumber: number;
  invoiceFooterText: string;
  invoiceTerms: string;
  showLogoOnInvoice: boolean;
  digitalSignature: boolean;
};

const emptyForm: FormState = {
  name: "",
  ownerName: "",
  phone: "",
  email: "",
  gstin: "",
  fssai: "",
  city: "",
  state: "",
  address: "",
  logoUrl: "",
  gstEnabled: true,
  cgst: 2.5,
  sgst: 2.5,
  igst: 5,
  gstInclusive: false,
  invoicePrefix: "INV",
  invoiceStartNumber: 1001,
  invoiceFooterText: "Thank you for dining with us!",
  invoiceTerms: "",
  showLogoOnInvoice: true,
  digitalSignature: false,
};

function profilePayloadForTab(tab: (typeof tabs)[number]["key"], form: FormState): Partial<ApiRestaurant> {
  switch (tab) {
    case "business":
      return {
        name: form.name.trim(),
        ownerName: form.ownerName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        gstin: form.gstin.trim(),
        fssai: form.fssai.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        address: form.address.trim(),
        logoUrl: form.logoUrl,
      };
    case "gst":
      return {
        gstEnabled: form.gstEnabled,
        cgst: form.cgst,
        sgst: form.sgst,
        igst: form.igst,
        gstInclusive: form.gstInclusive,
        gstin: form.gstin.trim(),
      };
    case "invoice":
      return {
        invoicePrefix: form.invoicePrefix.trim(),
        invoiceStartNumber: form.invoiceStartNumber,
        invoiceFooterText: form.invoiceFooterText.trim(),
        invoiceTerms: form.invoiceTerms.trim(),
        showLogoOnInvoice: form.showLogoOnInvoice,
        digitalSignature: form.digitalSignature,
      };
    default:
      return {};
  }
}

function fromRestaurant(r: ApiRestaurant): FormState {
  return {
    name: r.name ?? "",
    ownerName: r.ownerName ?? "",
    phone: r.phone ?? "",
    email: r.email ?? "",
    gstin: r.gstin ?? "",
    fssai: r.fssai ?? "",
    city: r.city ?? "",
    state: r.state ?? "",
    address: r.address ?? "",
    logoUrl: r.logoUrl ?? "",
    gstEnabled: r.gstEnabled ?? true,
    cgst: r.cgst ?? 2.5,
    sgst: r.sgst ?? 2.5,
    igst: r.igst ?? 5,
    gstInclusive: r.gstInclusive ?? false,
    invoicePrefix: r.invoicePrefix ?? "INV",
    invoiceStartNumber: r.invoiceStartNumber ?? 1001,
    invoiceFooterText: r.invoiceFooterText ?? "Thank you for dining with us!",
    invoiceTerms: r.invoiceTerms ?? "",
    showLogoOnInvoice: r.showLogoOnInvoice ?? true,
    digitalSignature: r.digitalSignature ?? false,
  };
}

const MAX_LOGO_BYTES = 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function Settings() {
  const { setRestaurant: setAuthRestaurant } = useAuth();
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("business");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { toast, showToast } = useToast();

  useEffect(() => {
    fetchProfile()
      .then((res) => setForm(fromRestaurant(res.restaurant)))
      .catch(() => showToast("error", "Couldn't load settings. Please refresh the page."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("error", "Please select an image file");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      showToast("error", "Logo must be smaller than 1MB");
      return;
    }

    setUploadingLogo(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const res = await updateProfile({ logoUrl: dataUrl });
      setAuthRestaurant(res.restaurant);
      setForm(fromRestaurant(res.restaurant));
      showToast("success", "Logo uploaded successfully");
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.message : "Failed to upload logo. Please try again.");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (tab === "business" && !form.name.trim()) {
      showToast("error", "Restaurant name is required");
      return;
    }

    if (tab === "invoice" && form.invoiceStartNumber < 1) {
      showToast("error", "Starting number must be at least 1");
      return;
    }

    setSaving(true);
    try {
      const res = await updateProfile(profilePayloadForTab(tab, form));
      setAuthRestaurant(res.restaurant);
      setForm(fromRestaurant(res.restaurant));
      showToast("success", "Settings saved successfully");
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.message : "Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Business profile, GST, invoice, printers, WhatsApp" />
      <Toast toast={toast} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="card p-3 lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={clsx(
                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  tab === key ? "bg-brand-600 text-white" : "text-slate-500 hover:bg-slate-50",
                )}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="card p-6 lg:col-span-3">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-400">Loading settings…</p>
          ) : (
            <>
              {tab === "business" && (
                <form className="space-y-4" onSubmit={handleSave}>
                  <div>
                    <h3 className="font-semibold text-slate-900">Business Profile</h3>
                    <p className="text-xs text-slate-400">Manage business profile</p>
                  </div>

                  <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-600 text-lg font-bold text-white">
                      {form.logoUrl ? (
                        <img src={form.logoUrl} alt="Restaurant logo" className="h-full w-full object-cover" />
                      ) : (
                        form.name.slice(0, 2).toUpperCase() || "HL"
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">Restaurant Logo</p>
                      <p className="mb-2 text-xs text-slate-400">Shown on invoices and receipts</p>
                      <input ref={logoInputRef} type="file" accept="image/*" hidden onChange={handleLogoChange} />
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Upload size={13} />
                        {uploadingLogo ? "Uploading…" : "Upload Logo"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Restaurant Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
                    <Field label="Owner Name" value={form.ownerName} onChange={(v) => setForm((f) => ({ ...f, ownerName: v }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Phone" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
                    <Field label="Email" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="GSTIN" value={form.gstin} onChange={(v) => setForm((f) => ({ ...f, gstin: v }))} />
                    <Field label="FSSAI No." value={form.fssai} onChange={(v) => setForm((f) => ({ ...f, fssai: v }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="City" value={form.city} onChange={(v) => setForm((f) => ({ ...f, city: v }))} />
                    <Field label="State" value={form.state} onChange={(v) => setForm((f) => ({ ...f, state: v }))} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Full Address</label>
                    <textarea
                      rows={2}
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                    />
                  </div>

                  <SaveRow saving={saving} label="Save Changes" />
                </form>
              )}

              {tab === "gst" && (
                <form className="space-y-5" onSubmit={handleSave}>
                  <div>
                    <h3 className="font-semibold text-slate-900">GST Settings</h3>
                    <p className="text-xs text-slate-400">Manage gst settings</p>
                  </div>

                  <ToggleRow
                    title="Enable GST on Bills"
                    description="Auto-apply GST to all bills"
                    checked={form.gstEnabled}
                    onChange={(v) => setForm((f) => ({ ...f, gstEnabled: v }))}
                  />

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Field label="CGST %" type="number" value={String(form.cgst)} onChange={(v) => setForm((f) => ({ ...f, cgst: Number(v) || 0 }))} />
                    <Field label="SGST %" type="number" value={String(form.sgst)} onChange={(v) => setForm((f) => ({ ...f, sgst: Number(v) || 0 }))} />
                    <Field label="IGST %" type="number" value={String(form.igst)} onChange={(v) => setForm((f) => ({ ...f, igst: Number(v) || 0 }))} />
                    <Field label="GSTIN" value={form.gstin} onChange={(v) => setForm((f) => ({ ...f, gstin: v }))} />
                  </div>

                  <ToggleRow
                    title="GST Inclusive Pricing"
                    description="Menu prices include GST already"
                    checked={form.gstInclusive}
                    onChange={(v) => setForm((f) => ({ ...f, gstInclusive: v }))}
                  />

                  <SaveRow saving={saving} label="Save GST Settings" />
                </form>
              )}

              {tab === "invoice" && (
                <form className="space-y-5" onSubmit={handleSave}>
                  <div>
                    <h3 className="font-semibold text-slate-900">Invoice Settings</h3>
                    <p className="text-xs text-slate-400">Manage invoice settings</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Invoice Prefix" value={form.invoicePrefix} onChange={(v) => setForm((f) => ({ ...f, invoicePrefix: v }))} />
                    <Field
                      label="Starting Number"
                      type="number"
                      min={1}
                      value={String(form.invoiceStartNumber)}
                      onChange={(v) => setForm((f) => ({ ...f, invoiceStartNumber: Math.max(1, Number(v) || 1) }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Footer Text" value={form.invoiceFooterText} onChange={(v) => setForm((f) => ({ ...f, invoiceFooterText: v }))} />
                    <Field label="Terms & Conditions" value={form.invoiceTerms} onChange={(v) => setForm((f) => ({ ...f, invoiceTerms: v }))} />
                  </div>

                  <ToggleRow
                    title="Show Logo on Invoice"
                    description="Print logo on bills"
                    checked={form.showLogoOnInvoice}
                    onChange={(v) => setForm((f) => ({ ...f, showLogoOnInvoice: v }))}
                  />
                  <ToggleRow
                    title="Digital Signature"
                    description="Show authorized signatory"
                    checked={form.digitalSignature}
                    onChange={(v) => setForm((f) => ({ ...f, digitalSignature: v }))}
                  />

                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">Invoice Preview</p>
                    <div className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center gap-2">
                        {form.showLogoOnInvoice && (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-600 text-xs font-bold text-white">
                            {form.logoUrl ? (
                              <img src={form.logoUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              form.name.slice(0, 2).toUpperCase() || "HL"
                            )}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-slate-900">{form.name || "Your Restaurant"}</p>
                          <p className="text-xs text-slate-400">
                            {form.address || "Address"} · GSTIN: {form.gstin || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
                        <div className="flex justify-between text-slate-600">
                          <span>Butter Chicken ×1</span>
                          <span>₹320</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>GST ({form.cgst + form.sgst}%)</span>
                          <span>₹{Math.round((320 * (form.cgst + form.sgst)) / 100)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>Total</span>
                          <span>₹{320 + Math.round((320 * (form.cgst + form.sgst)) / 100)}</span>
                        </div>
                      </div>
                      {form.invoiceFooterText && <p className="mt-3 text-xs italic text-slate-400">{form.invoiceFooterText}</p>}
                      {form.digitalSignature && <p className="mt-2 text-xs text-slate-400">Authorized Signatory</p>}
                    </div>
                  </div>

                  <SaveRow saving={saving} label="Save Invoice Settings" />
                </form>
              )}

              {tab === "password" && <PasswordTab showToast={showToast} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  min,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  min?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-0 p-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2",
          checked ? "bg-brand-600" : "bg-slate-200",
        )}
      >
        <span
          aria-hidden
          className={clsx(
            "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}

function SaveRow({ saving, label }: { saving: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {saving ? "Saving…" : label}
      </button>
    </div>
  );
}

function PasswordTab({ showToast }: { showToast: (type: "success" | "error", message: string) => void }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showToast("error", "New password and confirmation do not match");
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      showToast("success", "Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-slate-900">Password</h3>
        <p className="text-xs text-slate-400">Manage password</p>
      </div>

      <div className="flex items-start gap-2 rounded-xl bg-brand-50 p-3 text-sm text-brand-700">
        <ShieldCheck size={16} className="mt-0.5 shrink-0" />
        Use a strong password with letters, numbers, and symbols (min. 8 characters).
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <PasswordField
          label="Current Password"
          placeholder="Enter current password"
          value={currentPassword}
          onChange={setCurrentPassword}
          show={showCurrent}
          onToggleShow={() => setShowCurrent((v) => !v)}
        />
        <PasswordField
          label="New Password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={setNewPassword}
          show={showNew}
          onToggleShow={() => setShowNew((v) => !v)}
          minLength={8}
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Confirm New Password</label>
          <input
            type="password"
            required
            minLength={8}
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? "Updating…" : "Update Password"}
        </button>
      </form>

      <button
        onClick={handleSignOut}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-danger-600 hover:bg-danger-50"
      >
        <LogOut size={15} />
        Sign Out
      </button>
    </div>
  );
}

function PasswordField({
  label,
  placeholder,
  value,
  onChange,
  show,
  onToggleShow,
  minLength,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  minLength?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          required
          minLength={minLength}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-9 text-sm outline-none focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}
