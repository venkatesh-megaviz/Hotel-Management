import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import clsx from "clsx";
import {
  ApiError,
  fetchSaSettings,
  updateSaPassword,
  updateSaSettings,
  type SaPlatformSettings,
} from "@/lib/api";

const NOTIF_KEYS = [
  { id: "newTenantRegistrations", label: "New tenant registrations" },
  { id: "trialExpiryAlerts", label: "Trial expiry alerts" },
  { id: "paymentFailures", label: "Payment failures" },
  { id: "supportTicketAlerts", label: "Support ticket alerts" },
  { id: "monthlyRevenueReport", label: "Monthly revenue report" },
] as const;

type DetailErrors = Partial<Record<"platformName" | "companyName" | "supportEmail" | "billingContact" | "gstNumber", string>>;

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function PlatformSettings() {
  const [settings, setSettings] = useState<SaPlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<DetailErrors>({});
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordErr, setPasswordErr] = useState("");
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });

  useEffect(() => {
    fetchSaSettings()
      .then((res) => setSettings(res.settings))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  function validateDetails(s: SaPlatformSettings): DetailErrors {
    const errors: DetailErrors = {};
    if (!s.platformName.trim()) errors.platformName = "Platform name is required";
    if (!s.companyName.trim()) errors.companyName = "Company name is required";
    if (!s.supportEmail.trim()) errors.supportEmail = "Support email is required";
    else if (!isEmail(s.supportEmail.trim())) errors.supportEmail = "Enter a valid email address";
    if (!s.billingContact.trim()) errors.billingContact = "Billing contact is required";
    else if (!isEmail(s.billingContact.trim())) errors.billingContact = "Enter a valid billing email";
    if (!s.gstNumber.trim()) errors.gstNumber = "GST number is required";
    return errors;
  }

  async function saveDetails() {
    if (!settings) return;
    setSaveMsg("");
    const errors = validateDetails(settings);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const res = await updateSaSettings({
        platformName: settings.platformName.trim(),
        companyName: settings.companyName.trim(),
        supportEmail: settings.supportEmail.trim(),
        billingContact: settings.billingContact.trim(),
        gstNumber: settings.gstNumber.trim(),
      });
      setSettings(res.settings);
      setFieldErrors({});
      setSaveMsg("Platform details saved");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to save settings";
      const next: DetailErrors = {};
      if (/platform name/i.test(message)) next.platformName = message;
      else if (/company name/i.test(message)) next.companyName = message;
      else if (/support email|valid email/i.test(message)) next.supportEmail = message;
      else if (/billing/i.test(message)) next.billingContact = message;
      else if (/gst/i.test(message)) next.gstNumber = message;
      else next.platformName = message;
      setFieldErrors(next);
    } finally {
      setSaving(false);
    }
  }

  async function toggleNotif(key: (typeof NOTIF_KEYS)[number]["id"]) {
    if (!settings) return;
    const notifications = {
      ...settings.notifications,
      [key]: !settings.notifications[key],
    };
    setSettings({ ...settings, notifications });
    const res = await updateSaSettings({ notifications });
    setSettings(res.settings);
  }

  async function savePassword() {
    setPasswordErr("");
    setPasswordMsg("");
    if (passwords.newPassword !== passwords.confirm) {
      setPasswordErr("New passwords do not match");
      return;
    }
    try {
      await updateSaPassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswordMsg("Password updated");
      setPasswords({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      setPasswordErr(err instanceof ApiError ? err.message : "Failed to update password");
    }
  }

  if (loading || !settings) return <div className="sa-card">Loading platform settings…</div>;

  return (
    <div className="sa-settings-layout">
      <div className="sa-card">
        <div className="sa-card-head">
          <div>
            <h2>Platform Details</h2>
          </div>
        </div>
        <div className="sa-form">
          <label className={clsx(fieldErrors.platformName && "is-invalid")}>
            Platform Name
            <input
              value={settings.platformName}
              onChange={(e) => {
                setSettings({ ...settings, platformName: e.target.value });
                setFieldErrors((f) => ({ ...f, platformName: undefined }));
                setSaveMsg("");
              }}
            />
            {fieldErrors.platformName && <em className="sa-field-error">{fieldErrors.platformName}</em>}
          </label>
          <label className={clsx(fieldErrors.companyName && "is-invalid")}>
            Company Name
            <input
              value={settings.companyName}
              onChange={(e) => {
                setSettings({ ...settings, companyName: e.target.value });
                setFieldErrors((f) => ({ ...f, companyName: undefined }));
                setSaveMsg("");
              }}
            />
            {fieldErrors.companyName && <em className="sa-field-error">{fieldErrors.companyName}</em>}
          </label>
          <label className={clsx(fieldErrors.supportEmail && "is-invalid")}>
            Support Email
            <input
              value={settings.supportEmail}
              onChange={(e) => {
                setSettings({ ...settings, supportEmail: e.target.value });
                setFieldErrors((f) => ({ ...f, supportEmail: undefined }));
                setSaveMsg("");
              }}
            />
            {fieldErrors.supportEmail && <em className="sa-field-error">{fieldErrors.supportEmail}</em>}
          </label>
          <label className={clsx(fieldErrors.billingContact && "is-invalid")}>
            Billing Contact
            <input
              value={settings.billingContact}
              onChange={(e) => {
                setSettings({ ...settings, billingContact: e.target.value });
                setFieldErrors((f) => ({ ...f, billingContact: undefined }));
                setSaveMsg("");
              }}
            />
            {fieldErrors.billingContact && <em className="sa-field-error">{fieldErrors.billingContact}</em>}
          </label>
          <label className={clsx(fieldErrors.gstNumber && "is-invalid")}>
            GST Number
            <input
              value={settings.gstNumber}
              onChange={(e) => {
                setSettings({ ...settings, gstNumber: e.target.value });
                setFieldErrors((f) => ({ ...f, gstNumber: undefined }));
                setSaveMsg("");
              }}
            />
            {fieldErrors.gstNumber && <em className="sa-field-error">{fieldErrors.gstNumber}</em>}
          </label>
          {saveMsg && <p className="sa-field-success">{saveMsg}</p>}
          <button type="button" className="sa-btn is-primary is-block" disabled={saving} onClick={saveDetails}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="sa-settings-right">
        <div className="sa-card">
          <div className="sa-card-head">
            <div>
              <h2>Notification Preferences</h2>
            </div>
          </div>
          <div className="sa-toggles">
            {NOTIF_KEYS.map((n) => (
              <div key={n.id} className="sa-toggle-row">
                <span>{n.label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.notifications[n.id]}
                  className={clsx("sa-switch", settings.notifications[n.id] && "is-on")}
                  onClick={() => toggleNotif(n.id)}
                >
                  <span />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="sa-card">
          <div className="sa-card-head">
            <div>
              <h2 className="sa-lock-title">
                <Lock size={14} /> Update Password
              </h2>
              <p>Secure your admin account password</p>
            </div>
          </div>
          <div className="sa-form">
            <label>
              Current Password
              <input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                placeholder="••••••••"
              />
            </label>
            <label>
              New Password
              <input
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                placeholder="••••••••"
              />
            </label>
            <label>
              Confirm New Password
              <input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                placeholder="••••••••"
              />
            </label>
            <ul className="sa-password-rules">
              <li>At least 8 characters</li>
              <li>One uppercase (A-Z)</li>
              <li>One number (0-9)</li>
              <li>One special character (!@#$)</li>
            </ul>
            {passwordErr && <p className="sa-field-error">{passwordErr}</p>}
            {passwordMsg && <p className="sa-field-success">{passwordMsg}</p>}
            <button type="button" className="sa-btn is-primary is-block" onClick={savePassword}>
              Update Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
