"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Mail,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextArea, TextInput } from "@/components/ui/field";
import { Drawer } from "@/components/admin/drawer";
import { PageHeader } from "@/components/admin/page-header";
import { useAdminData } from "@/components/admin/admin-data";
import {
  deleteTeamMemberAction,
  inviteTeamMemberAction,
  loadTeamMembersAction,
  resendTeamInviteAction,
  updateTeamMemberRoleAction,
} from "@/actions/admin";
import { ROLE_DEFINITIONS, initials, labelRole } from "@/lib/admin";
import type { AdminRole, AdminUser } from "@/types";

const DEPARTMENTS = [
  "Executive Leadership",
  "Media & Sound Engineering",
  "Ushering & Protocol",
  "Choir & Consecrated Worship",
  "Intercessory & Prayer Altar",
  "Security & Logistics",
  "Content, Media & Creative Direction",
  "Public Communications & PR",
  "Medical & Welfare",
  "Children's & Teens' Ministry",
];

export default function AdminTeamPage() {
  const { adminUsers: initialAdminUsers, profile, refresh: refreshAdminData } = useAdminData();
  const [members, setMembers] = useState<AdminUser[]>(initialAdminUsers);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  // Modals & Drawers
  const [inviteOpen, setInviteOpen] = useState(false);
  const [rbacMatrixOpen, setRbacMatrixOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<AdminUser | null>(null);

  // Invite Form State
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminRole>("content_editor");
  const [inviteDepartment, setInviteDepartment] = useState("Media & Sound Engineering");
  const [inviteNotes, setInviteNotes] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccessLink, setInviteSuccessLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Edit Form State
  const [editRole, setEditRole] = useState<AdminRole>("content_editor");
  const [editDepartment, setEditDepartment] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "invited" | "disabled">("active");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Quick Action Feedback
  const [actionFeedback, setActionFeedback] = useState<{ id: string; message: string; type: "success" | "error" } | null>(null);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await loadTeamMembersAction();
      if (res.members && res.members.length > 0) {
        setMembers(res.members);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialAdminUsers && initialAdminUsers.length > 0) {
      setMembers(initialAdminUsers);
    }
  }, [initialAdminUsers]);

  useEffect(() => {
    void fetchTeam();
  }, []);

  // Filtered members
  const filtered = useMemo(() => {
    return members.filter((m) => {
      const q = search.trim().toLowerCase();
      if (
        q &&
        !m.name.toLowerCase().includes(q) &&
        !m.email.toLowerCase().includes(q) &&
        !(m.department ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
      if (roleFilter !== "all" && m.role !== roleFilter) return false;
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (departmentFilter !== "all" && (m.department ?? "General") !== departmentFilter) return false;
      return true;
    });
  }, [members, search, roleFilter, statusFilter, departmentFilter]);

  // Metrics
  const stats = useMemo(() => {
    const total = members.length;
    const superAdmins = members.filter((m) => m.role === "super_admin" || m.role === "event_admin").length;
    const leads = members.filter(
      (m) =>
        m.role === "communications_manager" ||
        m.role === "content_editor" ||
        m.role === "workforce_coordinator",
    ).length;
    const pending = members.filter((m) => m.status === "invited").length;
    return { total, superAdmins, leads, pending };
  }, [members]);

  const handleCopyLink = async (link: string) => {
    await navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteError(null);
    setInviteSuccessLink(null);

    try {
      const res = await inviteTeamMemberAction({
        email: inviteEmail,
        fullName: inviteName,
        role: inviteRole,
        department: inviteDepartment,
        notes: inviteNotes,
      });

      if (res.inviteLink) {
        setInviteSuccessLink(res.inviteLink);
      }

      if (res.status === "error") {
        setInviteError(res.message || "Failed to invite member.");
      } else {
        if (res.member) {
          setMembers((prev) => [res.member!, ...prev.filter((m) => m.email !== res.member!.email)]);
        }
        setInviteName("");
        setInviteEmail("");
        setInviteNotes("");
        void refreshAdminData();
      }
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setInviting(false);
    }
  };

  const handleOpenEdit = (member: AdminUser) => {
    setEditingMember(member);
    setEditRole(member.role);
    setEditDepartment(member.department || "Executive Leadership");
    setEditStatus(member.status);
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setSavingEdit(true);
    setEditError(null);

    try {
      const res = await updateTeamMemberRoleAction({
        userId: editingMember.id,
        role: editRole,
        department: editDepartment,
        status: editStatus,
      });

      if (res.status === "error") {
        setEditError(res.message || "Failed to update role.");
      } else {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === editingMember.id
              ? { ...m, role: editRole, department: editDepartment, status: editStatus }
              : m,
          ),
        );
        setEditingMember(null);
        void refreshAdminData();
      }
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleResendInvite = async (member: AdminUser) => {
    setActionFeedback({ id: member.id, message: "Sending invitation...", type: "success" });
    try {
      const res = await resendTeamInviteAction({ userId: member.id, email: member.email });
      if (res.status === "error") {
        setActionFeedback({ id: member.id, message: res.message || "Failed to resend", type: "error" });
      } else {
        setActionFeedback({
          id: member.id,
          message: "Invitation resent! Link refreshed.",
          type: "success",
        });
      }
    } catch {
      setActionFeedback({ id: member.id, message: "Failed to resend invite", type: "error" });
    }
  };

  const handleDeleteMember = async (member: AdminUser) => {
    if (!confirm(`Are you sure you want to remove ${member.name} (${member.email}) from the WOW Experience team?`)) {
      return;
    }

    try {
      const res = await deleteTeamMemberAction({ userId: member.id });
      if (res.status === "error") {
        alert(res.message || "Failed to delete team member");
      } else {
        setMembers((prev) => prev.filter((m) => m.id !== member.id));
        void refreshAdminData();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error deleting member");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Team & Role-Based Access Control"
        description="Manage leadership appointments, department assignments, granular access tiers, and active staff invitations."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outlineDark"
              size="sm"
              onClick={() => setRbacMatrixOpen(true)}
              className="gap-1.5"
            >
              <Shield className="h-3.5 w-3.5 text-muted" />
              RBAC Matrix
            </Button>
            <Button
              variant="outlineDark"
              size="sm"
              onClick={fetchTeam}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setInviteSuccessLink(null);
                setInviteError(null);
                setInviteOpen(true);
              }}
              className="gap-1.5 shadow-sm"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Invite Team Member
            </Button>
          </div>
        }
      />

      {/* Metric Cards - Sleek Light SaaS Aesthetic */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Total Workforce */}
        <div className="rounded-xl border border-border bg-white p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Total Workforce
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-ink">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-display text-2xl sm:text-3xl font-bold tabular-nums text-ink">
            {stats.total}
          </div>
          <p className="mt-1 text-xs text-muted">Active accounts & staff</p>
        </div>

        {/* Executive Directorship */}
        <div className="rounded-xl border border-border bg-white p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Executive Directorship
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-display text-2xl sm:text-3xl font-bold tabular-nums text-ink">
            {stats.superAdmins}
          </div>
          <p className="mt-1 text-xs text-muted">Super Admins & Event Directors</p>
        </div>

        {/* Department Leads */}
        <div className="rounded-xl border border-border bg-white p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Department Leads
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-display text-2xl sm:text-3xl font-bold tabular-nums text-ink">
            {stats.leads}
          </div>
          <p className="mt-1 text-xs text-muted">Comms, Content & Workforce</p>
        </div>

        {/* Pending Invites */}
        <div className="rounded-xl border border-border bg-white p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Pending Invites
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <Mail className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-display text-2xl sm:text-3xl font-bold tabular-nums text-ink">
            {stats.pending}
          </div>
          <p className="mt-1 text-xs text-muted">Awaiting initial sign in</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <TextInput
            placeholder="Search by name, email, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 rounded-lg border border-border bg-white px-3 text-xs text-ink shadow-2xs focus:border-red focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="event_admin">Event Director</option>
            <option value="communications_manager">Comms Lead</option>
            <option value="content_editor">Content Editor</option>
            <option value="workforce_coordinator">Workforce Lead</option>
            <option value="scanner_usher">Check-in Usher</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-border bg-white px-3 text-xs text-ink shadow-2xs focus:border-red focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="invited">Pending Invite</option>
            <option value="disabled">Suspended</option>
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="h-9 rounded-lg border border-border bg-white px-3 text-xs text-ink shadow-2xs focus:border-red focus:outline-none"
          >
            <option value="all">All Departments</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Team Roster Card - Pristine SaaS Table */}
      <div className="rounded-xl border border-border bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-neutral-50/80 text-[11px] font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3.5">Team Member</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Assigned Role & Tier</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted">
                    <UserX className="mx-auto h-8 w-8 text-neutral-400 mb-2" />
                    No team members found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((member) => {
                  const roleDef = ROLE_DEFINITIONS[member.role] || ROLE_DEFINITIONS.content_editor;
                  const isPrimaryAdmin = member.email.toLowerCase() === "oyoitaabraham@gmail.com";

                  return (
                    <tr key={member.id} className="transition-colors hover:bg-neutral-50/70">
                      {/* Member Info with Avatar */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-ink text-xs font-bold text-white shadow-xs">
                            {member.avatarUrl ? (
                              <img
                                src={member.avatarUrl}
                                alt={member.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span>{initials(member.name)}</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-ink">{member.name}</span>
                              {isPrimaryAdmin && (
                                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200 ring-1 ring-rose-500/10">
                                  Primary
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted block mt-0.5">{member.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center rounded-md bg-neutral-100/90 px-2.5 py-1 text-xs font-medium text-ink border border-neutral-200/80">
                          {member.department || "Executive Leadership"}
                        </span>
                      </td>

                      {/* Role & Tier */}
                      <td className="px-5 py-4">
                        <div>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${roleDef.badgeClass}`}
                          >
                            {roleDef.label}
                          </span>
                          <span className="block mt-1 text-[11px] text-muted font-medium">
                            {roleDef.tierLabel}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {member.status === "active" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : member.status === "invited" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 border border-amber-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pending Invite
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 border border-rose-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            Suspended
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {member.status === "invited" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResendInvite(member)}
                              title="Resend Invitation Email"
                              className="h-8 px-2 text-muted hover:text-ink hover:bg-neutral-100"
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          <Button
                            variant="outlineDark"
                            size="sm"
                            onClick={() => handleOpenEdit(member)}
                            className="h-8 text-xs font-medium"
                          >
                            Edit Role
                          </Button>

                          {!isPrimaryAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMember(member)}
                              title="Remove Team Member"
                              className="h-8 px-2 text-muted hover:text-red hover:bg-red/5"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>

                        {actionFeedback?.id === member.id && (
                          <div
                            className={`mt-1.5 text-xs font-medium ${
                              actionFeedback.type === "error" ? "text-red" : "text-emerald-600"
                            }`}
                          >
                            {actionFeedback.message}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* DRAWER: INVITE NEW TEAM MEMBER                                */}
      {/* ------------------------------------------------------------- */}
      <Drawer
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Appoint & Invite Team Member"
        description="Issue official workforce credentials with custom role-based permissions and instant luxury email notification."
      >
        <form onSubmit={handleInviteSubmit} className="space-y-5">
          {inviteSuccessLink ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <Check className="h-4 w-4 text-emerald-600" />
                Invitation Generated & Delivered via Resend!
              </div>
              <p className="text-emerald-950 text-xs leading-relaxed">
                The official designer invitation email has been sent to the recipient. You can also copy the direct single-click credential link below to share over WhatsApp or SMS:
              </p>
              <div className="flex items-center gap-2">
                <TextInput
                  readOnly
                  value={inviteSuccessLink}
                  className="bg-white font-mono text-[11px] text-ink"
                />
                <Button
                  type="button"
                  variant="outlineDark"
                  size="sm"
                  onClick={() => handleCopyLink(inviteSuccessLink)}
                  className="shrink-0 text-xs"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setInviteSuccessLink(null);
                    setInviteOpen(false);
                  }}
                  className="w-full text-xs"
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <>
              {inviteError && (
                <div className="rounded-lg border border-red/20 bg-rose-50 p-3 text-xs text-red font-medium">
                  {inviteError}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-ink block mb-1.5">
                  Full Legal or Ministry Name *
                </label>
                <TextInput
                  required
                  placeholder="e.g. Pastor Evelyn Isua-ikoh"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="text-xs bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-ink block mb-1.5">
                  Official Email Address *
                </label>
                <TextInput
                  required
                  type="email"
                  placeholder="e.g. pastor.evelyn@wowexperience.com.ng"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="text-xs bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-ink block mb-1.5">
                  Assigned Department *
                </label>
                <select
                  value={inviteDepartment}
                  onChange={(e) => setInviteDepartment(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-xs text-ink focus:border-red focus:outline-none"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink block mb-2">
                  Role-Based Access Control (RBAC) Tier *
                </label>
                <div className="space-y-2">
                  {(Object.keys(ROLE_DEFINITIONS) as AdminRole[])
                    .filter((r) => profile?.role === "super_admin" || (r !== "super_admin" && r !== "event_admin"))
                    .map((r) => {
                    const def = ROLE_DEFINITIONS[r];
                    const isSelected = inviteRole === r;

                    return (
                      <div
                        key={r}
                        onClick={() => setInviteRole(r)}
                        className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                          isSelected
                            ? "border-red bg-rose-50/50 ring-1 ring-red/20 shadow-xs"
                            : "border-border bg-white hover:border-neutral-400"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-ink">{def.label}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${def.badgeClass}`}>
                            {def.tierLabel}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-muted leading-relaxed">
                          {def.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink block mb-1.5">
                  Personal Welcome Note (Optional)
                </label>
                <TextArea
                  rows={2}
                  placeholder="Add a consecrated word of blessing or specific instructions for this appointee..."
                  value={inviteNotes}
                  onChange={(e) => setInviteNotes(e.target.value)}
                  className="text-xs bg-white"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={inviting}
                  className="w-full text-xs font-semibold py-2.5 shadow-sm"
                >
                  {inviting ? "Issuing Official Appointment..." : "Dispatch Official Invitation & Link"}
                </Button>
              </div>
            </>
          )}
        </form>
      </Drawer>

      {/* ------------------------------------------------------------- */}
      {/* DRAWER: EDIT TEAM MEMBER ROLE                                 */}
      {/* ------------------------------------------------------------- */}
      <Drawer
        open={Boolean(editingMember)}
        onClose={() => setEditingMember(null)}
        title="Edit Team Member Role & Department"
        description={`Modify role assignments, department alignment, and account access for ${editingMember?.name || "Member"}.`}
      >
        {editingMember && (
          <form onSubmit={handleEditSubmit} className="space-y-5">
            {editError && (
              <div className="rounded-lg border border-red/20 bg-rose-50 p-3 text-xs text-red font-medium">
                {editError}
              </div>
            )}

            <div className="rounded-xl bg-neutral-50 border border-border p-3.5 text-xs">
              <span className="text-muted block text-[11px] font-semibold uppercase tracking-wider">
                Selected Account
              </span>
              <span className="font-display font-bold text-ink text-sm mt-0.5 block">
                {editingMember.name}
              </span>
              <span className="text-muted block text-xs mt-0.5">{editingMember.email}</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-ink block mb-1.5">
                Department
              </label>
              <select
                value={editDepartment}
                onChange={(e) => setEditDepartment(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-xs text-ink focus:border-red focus:outline-none"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-ink block mb-1.5">
                Assigned RBAC Role
              </label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as AdminRole)}
                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-xs text-ink focus:border-red focus:outline-none"
              >
                <option value="super_admin">Super Admin (Tier 1 • Full Authority)</option>
                <option value="event_admin">Event Director (Tier 2 • Operations)</option>
                <option value="communications_manager">Communications Lead (Tier 3 • Public Outreach)</option>
                <option value="content_editor">Content & Media Editor (Tier 3 • Editorial)</option>
                <option value="workforce_coordinator">Workforce Coordinator (Tier 4 • Departments)</option>
                <option value="scanner_usher">Check-in Usher / Scanner (Tier 5 • Field Access)</option>
              </select>
              <p className="mt-1.5 text-xs text-muted leading-relaxed">
                {ROLE_DEFINITIONS[editRole]?.description}
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-ink block mb-1.5">
                Account Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as "active" | "invited" | "disabled")}
                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-xs text-ink focus:border-red focus:outline-none"
              >
                <option value="active">Active (Full Console Access)</option>
                <option value="invited">Pending (Awaiting Initial Sign In)</option>
                <option value="disabled">Suspended (Access Revoked)</option>
              </select>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={savingEdit}
                className="w-full text-xs font-semibold py-2.5 shadow-sm"
              >
                {savingEdit ? "Updating Role..." : "Save Role Assignment"}
              </Button>
            </div>
          </form>
        )}
      </Drawer>

      {/* ------------------------------------------------------------- */}
      {/* DRAWER: RBAC PERMISSIONS MATRIX                               */}
      {/* ------------------------------------------------------------- */}
      <Drawer
        open={rbacMatrixOpen}
        onClose={() => setRbacMatrixOpen(false)}
        title="Super Senior RBAC Architecture"
        description="Comprehensive reference matrix of all 6 access tiers and system privileges for WOW Experience."
      >
        <div className="space-y-4 text-xs">
          {(Object.keys(ROLE_DEFINITIONS) as AdminRole[]).map((r) => {
            const def = ROLE_DEFINITIONS[r];
            return (
              <div key={r} className="rounded-xl border border-border bg-white p-4 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-sm text-ink">{def.label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${def.badgeClass}`}>
                    {def.tierLabel}
                  </span>
                </div>
                <p className="text-muted text-xs leading-relaxed">
                  {def.description}
                </p>
                <div className="pt-2.5 border-t border-border">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted block mb-2">
                    Authorized Capabilities:
                  </span>
                  <ul className="grid gap-1.5 text-xs text-ink">
                    {def.permissions.map((p, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </Drawer>
    </div>
  );
}
