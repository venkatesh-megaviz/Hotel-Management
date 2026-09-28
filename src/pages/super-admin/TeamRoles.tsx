import { useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import clsx from "clsx";
import {
  ApiError,
  createSaRole,
  deleteSaRole,
  fetchSaRoles,
  fetchSaTeamUsers,
  updateSaRole,
  updateSaTeamUser,
  type SaPlatformRole,
  type SaTeamUser,
} from "@/lib/api";

type RoleDraft = {
  id: string | null;
  name: string;
  description: string;
  permissions: string[];
};

const EMPTY_ROLE: RoleDraft = {
  id: null,
  name: "",
  description: "",
  permissions: [],
};

function permissionLabel(p: string) {
  if (p === "Leads & CRM") return "Sales and leads";
  return p;
}

export default function TeamRoles() {
  const [tab, setTab] = useState<"roles" | "users">("roles");
  const [roles, setRoles] = useState<SaPlatformRole[]>([]);
  const [users, setUsers] = useState<SaTeamUser[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<RoleDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [credsMsg, setCredsMsg] = useState("");
  const [addMemberRoleId, setAddMemberRoleId] = useState<string | null>(null);

  async function load() {
    const [rolesRes, usersRes] = await Promise.all([fetchSaRoles(), fetchSaTeamUsers()]);
    setRoles(rolesRes.roles);
    setPermissions(rolesRes.permissions);
    setUsers(usersRes.users);
  }

  useEffect(() => {
    load()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!draft) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDraft(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [draft]);

  const unassignedForRole = useMemo(() => {
    if (!addMemberRoleId) return [];
    const role = roles.find((r) => r.id === addMemberRoleId);
    if (!role) return [];
    const memberIds = new Set(role.members.map((m) => m.id));
    return users.filter((u) => !memberIds.has(u.id));
  }, [addMemberRoleId, roles, users]);

  function openCreateRole() {
    setError("");
    setDraft({ ...EMPTY_ROLE });
  }

  function openEditRole(role: SaPlatformRole) {
    setError("");
    setDraft({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: [...role.permissions],
    });
  }

  function togglePermission(p: string) {
    if (!draft) return;
    setDraft({
      ...draft,
      permissions: draft.permissions.includes(p)
        ? draft.permissions.filter((x) => x !== p)
        : [...draft.permissions, p],
    });
  }

  async function saveRole() {
    if (!draft) return;
    if (!draft.name.trim()) {
      setError("Role name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (draft.id) {
        await updateSaRole(draft.id, {
          name: draft.name.trim(),
          description: draft.description.trim(),
          permissions: draft.permissions,
        });
      } else {
        await createSaRole({
          name: draft.name.trim(),
          description: draft.description.trim(),
          permissions: draft.permissions,
        });
      }
      await load();
      setDraft(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save role");
    } finally {
      setSaving(false);
    }
  }

  async function removeRole(id: string) {
    if (!window.confirm("Delete this role?")) return;
    await deleteSaRole(id);
    await load();
  }

  async function addMember(roleId: string, memberId: string) {
    await updateSaRole(roleId, { addMemberId: memberId });
    setAddMemberRoleId(null);
    await load();
  }

  async function toggleUserStatus(user: SaTeamUser) {
    await updateSaTeamUser(user.id, {
      status: user.status === "Active" ? "Inactive" : "Active",
    });
    await load();
  }

  async function resetCredentials(user: SaTeamUser) {
    const res = await updateSaTeamUser(user.id, { resetCredentials: true });
    if (res.credentials) {
      setCredsMsg(
        `${res.credentials.email} → temporary password: ${res.credentials.temporaryPassword}`,
      );
    }
  }

  if (loading) return <div className="sa-card">Loading team & roles…</div>;

  return (
    <div className="sa-stack sa-team">
      <div className="sa-page-head">
        <div>
          <h2 className="sa-page-title">Team & Roles</h2>
          <p>Manage platform roles, permissions, and team access</p>
        </div>
        {tab === "roles" && (
          <button type="button" className="sa-btn is-primary" onClick={openCreateRole}>
            <Plus size={16} /> New Role
          </button>
        )}
      </div>

      <div className="sa-team-tabs">
        <button type="button" className={clsx("sa-team-tab", tab === "roles" && "is-active")} onClick={() => setTab("roles")}>
          Roles
        </button>
        <button type="button" className={clsx("sa-team-tab", tab === "users" && "is-active")} onClick={() => setTab("users")}>
          Users
        </button>
      </div>

      {credsMsg && (
        <div className="sa-creds-banner">
          <span>{credsMsg}</span>
          <button type="button" onClick={() => setCredsMsg("")}>
            <X size={14} />
          </button>
        </div>
      )}

      {tab === "roles" ? (
        <div className="sa-role-list">
          {roles.map((role) => (
            <div key={role.id} className="sa-card sa-role-card">
              <div className="sa-role-card-head">
                <h3>{role.name}</h3>
                <span className="sa-role-count">{role.memberCount} members</span>
              </div>
              <div className="sa-role-perms">
                {role.permissions.map((p) => (
                  <span key={p} className="sa-role-perm">
                    {permissionLabel(p)}
                  </span>
                ))}
              </div>
              <div className="sa-role-members">
                {role.members.map((m) => (
                  <span key={m.id} className="sa-role-member">
                    <span className="sa-assigned-avatar">{m.initials}</span>
                    {m.fullName}
                  </span>
                ))}
                <button
                  type="button"
                  className="sa-role-add"
                  onClick={() => setAddMemberRoleId(addMemberRoleId === role.id ? null : role.id)}
                >
                  + Add
                </button>
              </div>
              {addMemberRoleId === role.id && (
                <div className="sa-role-add-menu">
                  {unassignedForRole.length === 0 ? (
                    <p>No more users to add</p>
                  ) : (
                    unassignedForRole.map((u) => (
                      <button key={u.id} type="button" onClick={() => addMember(role.id, u.id)}>
                        {u.fullName}
                      </button>
                    ))
                  )}
                </div>
              )}
              <div className="sa-role-actions">
                <button type="button" className="sa-text-btn is-gold" onClick={() => openEditRole(role)}>
                  Edit Role
                </button>
                <button type="button" className="sa-text-btn" onClick={() => removeRole(role.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
          {roles.length === 0 && <div className="sa-card">No roles yet. Create one to get started.</div>}
        </div>
      ) : (
        <div className="sa-card sa-table-card">
          <div className="sa-table-wrap">
            <table className="sa-table sa-team-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <span className="sa-assigned">
                        <span className="sa-assigned-avatar">{user.initials.charAt(0)}</span>
                        <strong>{user.fullName}</strong>
                      </span>
                    </td>
                    <td>
                      <span className="sa-role-badge">{user.roleName}</span>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={clsx("sa-user-status", user.status === "Active" ? "is-active" : "is-inactive")}>
                        {user.status}
                      </span>
                    </td>
                    <td>{user.lastLogin}</td>
                    <td>
                      <div className="sa-lead-actions">
                        <button type="button" className="sa-text-btn is-gold" onClick={() => resetCredentials(user)}>
                          Credentials
                        </button>
                        <button type="button" className="sa-text-btn" onClick={() => toggleUserStatus(user)}>
                          {user.status === "Active" ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {draft && (
        <div className="sa-modal-backdrop" onClick={() => setDraft(null)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-head">
              <div>
                <h2>{draft.id ? "Edit Role" : "Create Role"}</h2>
                <p>Define role name, description, and access permissions</p>
              </div>
              <button type="button" className="sa-modal-close" onClick={() => setDraft(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="sa-modal-body">
              {error && <p className="sa-form-error">{error}</p>}
              <label className="sa-field">
                <span>Role Name</span>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="e.g. Marketing Manager"
                />
              </label>
              <label className="sa-field">
                <span>Description</span>
                <textarea
                  rows={3}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Brief description of this role's responsibilities"
                />
              </label>
              <div className="sa-field">
                <span>Permissions</span>
                <div className="sa-perm-list">
                  {permissions.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={clsx("sa-perm-item", draft.permissions.includes(p) && "is-checked")}
                      onClick={() => togglePermission(p)}
                    >
                      <span className="sa-perm-check" />
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="sa-modal-foot">
              <button type="button" className="sa-btn is-primary" disabled={saving} onClick={saveRole}>
                {saving ? "Saving…" : draft.id ? "Save Role" : "Create Role"}
              </button>
              <button type="button" className="sa-btn is-ghost" onClick={() => setDraft(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
