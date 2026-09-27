"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Mail,
  MoreVertical,
  Plus,
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
  const { adminUsers: initialAdminUsers, refresh: refreshAdminData } = useAdminData();
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
    void fetchTeam();
  }, []);

  // Filtered members
  const filtered = useMemo(() => {
    return members.filter((m) => {
      const q = search.trim().toLowerCase();
      if (q && !m.name.toLowerCase().includes(q) && !m.email.toLowerCase().includes(q) && !(m.department ?? "").toLowerCase().includes(q)) {
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
    const leads = members.filter((m) => m.role === "communications_manager" || m.role === "content_editor" || m.role === "workforce_coordinator").length;
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

      if (res.status === "error") {
        setInviteError(res.message || "Failed to invite member.");
      } else {
        if (res.inviteLink) {
          setInviteSuccessLink(res.inviteLink);
        }
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
    setActionFeedback({ id: member.id, message: "Sending fresh invitation...", type: "success" });
    try {
      const res = await resendTeamInviteAction({ userId: member.id, email: member.email });
      if (res.status === "error") {
        setActionFeedback({ id: member.id, message: res.message || "Failed to resend", type: "error" });
      } else {
        setActionFeedback({
          id: member.id,
          message: "Invitation resent! Direct link updated.",
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
        title="Team & Role-Based Access Control (RBAC)"
        description="Manage leadership appointments, department assignments, granular access tiers, and active staff invitations."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRbacMatrixOpen(true)}
              className="border-neutral-800 bg-neutral-900/60 text-xs text-neutral-300 hover:bg-neutral-800"
            >
              <Shield className="mr-1.5 h-3.5 w-3.5 text-neutral-400" />
              RBAC Matrix
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTeam}
              disabled={loading}
              className="border-neutral-800 bg-neutral-900/60 text-xs text-neutral-300 hover:bg-neutral-800"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setInviteSuccessLink(null);
                setInviteError(null);
                setInviteOpen(true);
              }}
              className="bg-red-600 text-xs font-semibold text-white shadow-lg shadow-red-900/20 hover:bg-red-500"
            >
              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
              Invite Team Member
            </Button>
          </div>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Workforce</span>
            <Users className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{stats.total}</div>
          <p className="mt-1 text-[11px] text-neutral-400">Active accounts & staff</p>
        </div>

        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Executive Directorship</span>
            <ShieldCheck className="h-4 w-4 text-red-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-red-400">{stats.superAdmins}</div>
          <p className="mt-1 text-[11px] text-neutral-400">Super Admins & Event Directors</p>
        </div>

        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Department Leads</span>
            <UserCheck className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400">{stats.leads}</div>
          <p className="mt-1 text-[11px] text-neutral-400">Comms, Content & Workforce</p>
        </div>

        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium uppercase tracking-wider">Pending Invites</span>
            <Mail className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-sky-400">{stats.pending}</div>
          <p className="mt-1 text-[11px] text-neutral-400">Awaiting password creation</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <TextInput
            placeholder="Search by name, email, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 w-36 rounded-md border border-neutral-700 bg-neutral-900 px-3 text-xs text-neutral-200 focus:border-red-500 focus:outline-none"
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
            className="h-9 w-32 rounded-md border border-neutral-700 bg-neutral-900 px-3 text-xs text-neutral-200 focus:border-red-500 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="invited">Pending Invite</option>
            <option value="disabled">Suspended</option>
          </select>
        </div>
      </div>

      {/* Team Roster Card */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-800 bg-neutral-950/60 text-neutral-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Team Member</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Assigned Role & Tier</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-400">
                    <UserX className="mx-auto h-8 w-8 text-neutral-400 mb-2" />
                    No team members found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((member) => {
                  const roleDef = ROLE_DEFINITIONS[member.role] || ROLE_DEFINITIONS.content_editor;
                  const isPrimaryAdmin = member.email.toLowerCase() === "oyoitaabraham@gmail.com";

                  return (
                    <tr key={member.id} className="transition-colors hover:bg-neutral-800/30">
                      {/* Member Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${roleDef.badgeClass}`}>
                            {initials(member.name)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">{member.name}</span>
                              {isPrimaryAdmin && (
                                <span className="rounded bg-red-950 px-1.5 py-0.5 text-[10px] font-bold text-red-400 border border-red-800/50">
                                  Primary
                                </span>
                              )}
                            </div>
                            <span className="text-neutral-400 text-[11px] block">{member.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-5 py-4">
                        <span className="inline-block rounded-md bg-neutral-800/80 px-2.5 py-1 text-[11px] font-medium text-neutral-200 border border-neutral-700/50">
                          {member.department || "Executive Leadership"}
                        </span>
                      </td>

                      {/* Role & Tier */}
                      <td className="px-5 py-4">
                        <div>
                          <span className={`inline-block rounded-md px-2.5 py-1 text-[11px] font-semibold border ${roleDef.badgeClass}`}>
                            {roleDef.label}
                          </span>
                          <span className="block mt-1 text-[10px] text-neutral-400">
                            {roleDef.tierLabel}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              member.status === "active"
                                ? "bg-emerald-400"
                                : member.status === "invited"
                                ? "bg-amber-400 animate-pulse"
                                : "bg-red-400"
                            }`}
                          />
                          <span className="capitalize text-neutral-300 text-[11px]">
                            {member.status === "invited" ? "Pending Invite" : member.status}
                          </span>
                        </div>
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
                              className="h-8 px-2 text-neutral-300 hover:text-white hover:bg-neutral-800"
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(member)}
                            className="h-8 border-neutral-700/80 bg-neutral-800/50 text-[11px] text-neutral-200 hover:bg-neutral-700"
                          >
                            Edit Role
                          </Button>

                          {!isPrimaryAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMember(member)}
                              title="Remove Team Member"
                              className="h-8 px-2 text-red-400 hover:text-red-300 hover:bg-red-950/40"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>

                        {actionFeedback?.id === member.id && (
                          <div className={`mt-1 text-[10px] ${actionFeedback.type === "error" ? "text-red-400" : "text-emerald-400"}`}>
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
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Check className="h-4 w-4" />
                Invitation Generated & Delivered via Resend!
              </div>
              <p className="text-neutral-300 text-[11px] leading-relaxed">
                The official designer invitation email has been sent to the recipient. You can also copy the direct single-click credential link below to share over WhatsApp or SMS:
              </p>
              <div className="flex items-center gap-2">
                <TextInput
                  readOnly
                  value={inviteSuccessLink}
                  className="bg-black/50 font-mono text-[11px] text-neutral-300"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleCopyLink(inviteSuccessLink)}
                  className="shrink-0 bg-neutral-800 hover:bg-neutral-700 text-xs"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setInviteSuccessLink(null);
                    setInviteOpen(false);
                  }}
                  className="w-full text-xs border-neutral-700"
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <>
              {inviteError && (
                <div className="rounded-lg border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-300">
                  {inviteError}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                  Full Legal or Ministry Name *
                </label>
                <TextInput
                  required
                  placeholder="e.g. Pastor Evelyn Isua-ikoh"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                  Official Email Address *
                </label>
                <TextInput
                  required
                  type="email"
                  placeholder="e.g. pastor.evelyn@wowexperience.com.ng"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                  Assigned Department *
                </label>
                <select
                  value={inviteDepartment}
                  onChange={(e) => setInviteDepartment(e.target.value)}
                  className="h-9 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 text-xs text-neutral-200 focus:border-red-500 focus:outline-none"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-2">
                  Role-Based Access Control (RBAC) Tier *
                </label>
                <div className="space-y-2">
                  {(Object.keys(ROLE_DEFINITIONS) as AdminRole[]).map((r) => {
                    const def = ROLE_DEFINITIONS[r];
                    const isSelected = inviteRole === r;

                    return (
                      <div
                        key={r}
                        onClick={() => setInviteRole(r)}
                        className={`cursor-pointer rounded-lg border p-3 transition-all ${
                          isSelected
                            ? "border-red-500 bg-red-950/20 shadow-md shadow-red-950/30"
                            : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-white">{def.label}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${def.badgeClass}`}>
                            {def.tierLabel}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-neutral-400 leading-snug">
                          {def.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                  Personal Welcome Note (Optional)
                </label>
                <TextArea
                  rows={2}
                  placeholder="Add a consecrated word of blessing or specific instructions for this appointee..."
                  value={inviteNotes}
                  onChange={(e) => setInviteNotes(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={inviting}
                  className="w-full bg-red-600 hover:bg-red-500 text-xs font-semibold text-white py-2.5 shadow-lg shadow-red-900/30"
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
              <div className="rounded-lg border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-300">
                {editError}
              </div>
            )}

            <div className="rounded-lg bg-neutral-900/80 border border-neutral-800 p-3 text-xs">
              <span className="text-neutral-400 block text-[11px]">Selected Account</span>
              <span className="font-semibold text-white text-sm">{editingMember.name}</span>
              <span className="text-neutral-400 block text-[11px] mt-0.5">{editingMember.email}</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                Department
              </label>
              <select
                value={editDepartment}
                onChange={(e) => setEditDepartment(e.target.value)}
                className="h-9 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 text-xs text-neutral-200 focus:border-red-500 focus:outline-none"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                Assigned RBAC Role
              </label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as AdminRole)}
                className="h-9 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 text-xs text-neutral-200 focus:border-red-500 focus:outline-none"
              >
                <option value="super_admin">Super Admin (Tier 1 • Full Authority)</option>
                <option value="event_admin">Event Director (Tier 2 • Operations)</option>
                <option value="communications_manager">Communications Lead (Tier 3 • Public Outreach)</option>
                <option value="content_editor">Content & Media Editor (Tier 3 • Editorial)</option>
                <option value="workforce_coordinator">Workforce Coordinator (Tier 4 • Departments)</option>
                <option value="scanner_usher">Check-in Usher / Scanner (Tier 5 • Field Access)</option>
              </select>
              <p className="mt-1 text-[11px] text-neutral-400">
                {ROLE_DEFINITIONS[editRole]?.description}
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                Account Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as "active" | "invited" | "disabled")}
                className="h-9 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 text-xs text-neutral-200 focus:border-red-500 focus:outline-none"
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
                className="w-full bg-red-600 hover:bg-red-500 text-xs font-semibold text-white py-2.5"
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
              <div key={r} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">{def.label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${def.badgeClass}`}>
                    {def.tierLabel}
                  </span>
                </div>
                <p className="text-neutral-400 text-[11px] leading-relaxed">
                  {def.description}
                </p>
                <div className="pt-2 border-t border-neutral-800/80">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block mb-1.5">
                    Authorized Capabilities:
                  </span>
                  <ul className="space-y-1 text-[11px] text-neutral-300">
                    {def.permissions.map((p, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-emerald-400 shrink-0" />
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
