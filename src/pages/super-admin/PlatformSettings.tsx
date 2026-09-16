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

export default function PlatformSettings() {
  const [settings, setSettings] = useState<SaPlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  async function saveDetails() {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await updateSaSettings({
        platformName: settings.platformName,
        companyName: settings.companyName,
        supportEmail: settings.supportEmail,
        billingContact: settings.billingContact,
        gstNumber: settings.gstNumber,
      });
      setSettings(res.settings);
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
          <label>
            Platform Name
            <input
              value={settings.platformName}
              onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
            />
          </label>
          <label>
            Company Name
            <input
              value={settings.companyName}
              onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
            />
          </label>
          <label>
            Support Email
            <input
              value={settings.supportEmail}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
            />
          </label>
          <label>
            Billing Contact
            <input
              value={settings.billingContact}
              onChange={(e) => setSettings({ ...settings, billingContact: e.target.value })}
            />
          </label>
          <label>
            GST Number
            <input
              value={settings.gstNumber}
              onChange={(e) => setSettings({ ...settings, gstNumber: e.target.value })}
            />
          </label>
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
            {passwordErr && <p style={{ color: "#dc2626", fontSize: 12, margin: 0 }}>{passwordErr}</p>}
            {passwordMsg && <p style={{ color: "#009966", fontSize: 12, margin: 0 }}>{passwordMsg}</p>}
            <button type="button" className="sa-btn is-primary is-block" onClick={savePassword}>
              Update Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
