"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectInput } from "@/components/ui/field";
import { VolunteerStatusBadge } from "@/components/ui/status-badge";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { Drawer } from "@/components/admin/drawer";
import { Metric, PageHeader, Surface } from "@/components/admin/page-header";
import { useEdition } from "@/components/admin/edition-context";
import { useAdminData } from "@/components/admin/admin-data";
import { WHATSAPP_GROUP_ONBOARDING } from "@/data/admin";
import { volunteerTeams } from "@/data/content";
import {
  contactEmail,
  contactName,
  contactPhone,
  inEdition,
  maskGroupLink,
  teamLabel,
} from "@/lib/admin";
import { volunteerService } from "@/services";
import { cn, formatDateTime } from "@/lib/utils";
import type { VolunteerApplication, VolunteerStatus } from "@/types";

const STATUS_CONFIG: Record<
  VolunteerStatus,
  { label: string; bg: string; text: string; icon: typeof CheckCircle2 }
> = {
  submitted: { label: "Submitted", bg: "bg-neutral-100", text: "text-neutral-700", icon: Clock },
  under_review: { label: "Under Review", bg: "bg-blue-500", text: "text-white", icon: Clock },
  accepted: { label: "Accepted", bg: "bg-emerald-600", text: "text-white", icon: CheckCircle2 },
  waitlisted: { label: "Waitlisted", bg: "bg-amber-600", text: "text-white", icon: AlertCircle },
  declined: { label: "Declined", bg: "bg-rose-600", text: "text-white", icon: XCircle },
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return "V";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function AdminVolunteersPage() {
  const { edition } = useEdition();
  const { volunteers, contacts, refresh } = useAdminData();
  const [team, setTeam] = useState("all");
  const [statusFilter, setStatusFilter] = useState<VolunteerStatus | "all">("all");
  const [rows, setRows] = useState(volunteers);
  const [selected, setSelected] = useState<VolunteerApplication | null>(null);
  const [updating, setUpdating] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setRows(volunteers), 0);
    return () => window.clearTimeout(id);
  }, [volunteers]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        if (!inEdition(row.eventId, edition)) return false;
        if (team !== "all" && row.teamId !== team) return false;
        if (statusFilter !== "all" && row.status !== statusFilter) return false;
        return true;
      }),
    [edition, rows, team, statusFilter],
  );

  const pipeline = useMemo(() => {
    const base = rows.filter((row) => inEdition(row.eventId, edition));
    return {
      total: base.length,
      submitted: base.filter((row) => row.status === "submitted").length,
      under_review: base.filter((row) => row.status === "under_review").length,
      accepted: base.filter((row) => row.status === "accepted").length,
      waitlisted: base.filter((row) => row.status === "waitlisted").length,
      declined: base.filter((row) => row.status === "declined").length,
    };
  }, [edition, rows]);

  const setStatus = async (id: string, status: VolunteerStatus, applicantName?: string) => {
    setUpdating(true);
    try {
      const result = await volunteerService.updateStatus(id, status);
      if (result.status === "success") {
        setRows((list) => list.map((row) => (row.id === id ? result.data : row)));
        setSelected((row) => (row && row.id === id ? result.data : row));
        const toastMsg =
          ("message" in result && result.message) ||
          `${applicantName ?? "Volunteer"} application updated to ${STATUS_CONFIG[status].label}`;
        showToast(toastMsg);
        await refresh();
      } else {
        showToast(`Failed to update status: ${'message' in result ? result.message : "Validation error"}`);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error updating status");
    } finally {
      setUpdating(false);
    }
  };

  const handleBatchStatus = async (
    ids: string[],
    status: VolunteerStatus,
    clearSelection: () => void,
  ) => {
    if (!ids.length) return;
    setUpdating(true);
    try {
      if (volunteerService.batchUpdateStatus) {
        const result = await volunteerService.batchUpdateStatus(ids, status);
        if (result.status === "success") {
          setRows((list) =>
            list.map((row) => (ids.includes(row.id) ? { ...row, status } : row)),
          );
          if (selected && ids.includes(selected.id)) {
            setSelected((cur) => (cur ? { ...cur, status } : null));
          }
          const toastMsg =
            ("message" in result && result.message) ||
            `Updated ${ids.length} volunteer applications to ${STATUS_CONFIG[status].label}`;
          showToast(toastMsg);
          clearSelection();
          await refresh();
        } else {
          showToast(`Batch update error: ${'message' in result ? result.message : "Failed"}`);
        }
      } else {
        await Promise.all(ids.map((id) => volunteerService.updateStatus(id, status)));
        setRows((list) =>
          list.map((row) => (ids.includes(row.id) ? { ...row, status } : row)),
        );
        showToast(`Updated ${ids.length} volunteer applications to ${STATUS_CONFIG[status].label}`);
        clearSelection();
        await refresh();
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Batch update failed");
    } finally {
      setUpdating(false);
    }
  };

  const copyNoteToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedNote(true);
      showToast("WhatsApp onboarding invitation copied to clipboard!");
      setTimeout(() => setCopiedNote(false), 2500);
    } catch {
      showToast("Could not copy to clipboard. Select text manually.");
    }
  };

  const copyEmailToClipboard = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(true);
      showToast("Email address copied to clipboard!");
      setTimeout(() => setCopiedEmail(false), 2500);
    } catch {
      showToast("Could not copy to clipboard.");
    }
  };

  const selectedContact = selected
    ? contacts.find((c) => c.id === selected.contactId)
    : null;

  const rawPhone = selected ? contactPhone(selected.contactId) : "";
  const phoneDigits = rawPhone.replace(/[^0-9]/g, "");

  const preview = selected
    ? maskGroupLink(WHATSAPP_GROUP_ONBOARDING)
        .replaceAll("{{first_name}}", contactName(selected.contactId).split(" ")[0] ?? "friend")
        .replaceAll("{{volunteer_team}}", teamLabel(selected.teamId))
        .replaceAll("{{event_name}}", edition.name)
    : "";

  const whatsappDirectUrl =
    phoneDigits.length >= 8
      ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(preview)}`
      : null;

  const columns: DataTableColumn<VolunteerApplication>[] = [
    {
      key: "name",
      header: "Applicant",
      sortValue: (row) => contactName(row.contactId),
      render: (row) => {
        const name = contactName(row.contactId);
        const email = contactEmail(row.contactId);
        const phone = contactPhone(row.contactId);
        const initials = getInitials(name);
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-soft font-bold text-xs text-red-deep">
              {initials}
            </div>
            <div className="min-w-0">
              <button
                type="button"
                className="text-left font-bold text-ink hover:text-red hover:underline transition-colors block truncate"
                onClick={() => setSelected(row)}
              >
                {name}
              </button>
              <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                {email && email !== "No email" && <span className="truncate">{email}</span>}
                {phone && <span>• {phone}</span>}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "team",
      header: "Team",
      sortValue: (row) => teamLabel(row.teamId),
      render: (row) => (
        <span className="inline-flex items-center rounded-md bg-paper border border-border px-2.5 py-1 text-xs font-semibold text-ink">
          {teamLabel(row.teamId)}
        </span>
      ),
    },
    {
      key: "details",
      header: "Profile & Availability",
      render: (row) => {
        const contact = contacts.find((c) => c.id === row.contactId);
        const occ = row.occupation || contact?.occupation;
        const loc = row.location || contact?.location;
        return (
          <div className="max-w-xs space-y-0.5 text-xs">
            {(occ || loc) && (
              <p className="font-semibold text-ink">
                {[occ, loc].filter(Boolean).join(" • ")}
              </p>
            )}
            <p className="text-muted line-clamp-1" title={row.availability}>
              {row.availability || row.experience || "No details provided"}
            </p>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      sortValue: (row) => row.status,
      render: (row) => <VolunteerStatusBadge status={row.status} />,
    },
    {
      key: "created",
      header: "Submitted",
      sortValue: (row) => row.createdAt,
      render: (row) => (
        <span className="text-xs text-muted whitespace-nowrap">
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (row) => {
        const name = contactName(row.contactId);
        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            <Button
              type="button"
              variant="outlineDark"
              size="sm"
              className="h-8 gap-1.5 px-2.5 text-xs font-semibold"
              onClick={() => setSelected(row)}
            >
              <Eye className="h-3.5 w-3.5" />
              Review
            </Button>
            {row.status !== "accepted" && (
              <button
                type="button"
                disabled={updating}
                title="Quick Accept Application"
                onClick={() => setStatus(row.id, "accepted", name)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
              </button>
            )}
            {row.status !== "declined" && (
              <button
                type="button"
                disabled={updating}
                title="Quick Decline Application"
                onClick={() => setStatus(row.id, "declined", name)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white transition-colors disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Volunteers"
        description="Review volunteer applications, approve onboarding, and share private team WhatsApp invites directly."
      />

      {/* Interactive Metric Pipeline Cards */}
      <div className="grid gap-3 sm:grid-cols-5">
        <button
          type="button"
          onClick={() => setStatusFilter((cur) => (cur === "submitted" ? "all" : "submitted"))}
          className={cn(
            "text-left transition-all rounded-xl focus:outline-none",
            statusFilter === "submitted" ? "ring-2 ring-red ring-offset-2" : "hover:opacity-95"
          )}
        >
          <Metric label="Submitted" value={pipeline.submitted} />
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter((cur) => (cur === "under_review" ? "all" : "under_review"))}
          className={cn(
            "text-left transition-all rounded-xl focus:outline-none",
            statusFilter === "under_review" ? "ring-2 ring-blue-500 ring-offset-2" : "hover:opacity-95"
          )}
        >
          <Metric label="Under review" value={pipeline.under_review} />
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter((cur) => (cur === "accepted" ? "all" : "accepted"))}
          className={cn(
            "text-left transition-all rounded-xl focus:outline-none",
            statusFilter === "accepted" ? "ring-2 ring-emerald-600 ring-offset-2" : "hover:opacity-95"
          )}
        >
          <Metric label="Accepted" value={pipeline.accepted} />
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter((cur) => (cur === "waitlisted" ? "all" : "waitlisted"))}
          className={cn(
            "text-left transition-all rounded-xl focus:outline-none",
            statusFilter === "waitlisted" ? "ring-2 ring-amber-600 ring-offset-2" : "hover:opacity-95"
          )}
        >
          <Metric label="Waitlisted" value={pipeline.waitlisted} />
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter((cur) => (cur === "declined" ? "all" : "declined"))}
          className={cn(
            "text-left transition-all rounded-xl focus:outline-none",
            statusFilter === "declined" ? "ring-2 ring-rose-600 ring-offset-2" : "hover:opacity-95"
          )}
        >
          <Metric label="Declined" value={pipeline.declined} />
        </button>
      </div>

      {/* Status Filter Active Pill */}
      {statusFilter !== "all" && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted uppercase tracking-wider">Filtered:</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-soft px-3 py-1 text-xs font-bold text-red-deep">
            {STATUS_CONFIG[statusFilter].label}
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className="ml-1 rounded-full p-0.5 hover:bg-red-deep/10 text-red-deep"
              aria-label="Clear status filter"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className="text-xs text-muted hover:text-ink underline"
          >
            Show all ({pipeline.total})
          </button>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 shadow-sm animate-in fade-in"
        >
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        rows={filtered}
        onRowClick={(row) => setSelected(row)}
        searchPlaceholder="Search applicant, email, phone, or team..."
        searchFilter={(row, q) => {
          const name = contactName(row.contactId);
          const email = contactEmail(row.contactId);
          const phone = contactPhone(row.contactId);
          const team = teamLabel(row.teamId);
          const exp = row.experience || "";
          const occ = row.occupation || "";
          const loc = row.location || "";
          return `${name} ${email} ${phone} ${team} ${row.status} ${exp} ${occ} ${loc}`
            .toLowerCase()
            .includes(q);
        }}
        filters={
          <div className="flex flex-wrap items-center gap-2">
            <SelectInput
              id="volunteer-team-filter"
              className="w-44"
              buttonClassName="h-10 rounded-sm px-3 text-sm"
              value={team}
              onValueChange={setTeam}
              aria-label="Team filter"
              options={[
                { value: "all", label: "All teams" },
                ...volunteerTeams.map((item) => ({ value: item.id, label: item.name })),
              ]}
            />
            <SelectInput
              id="volunteer-status-filter"
              className="w-44"
              buttonClassName="h-10 rounded-sm px-3 text-sm"
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val as VolunteerStatus | "all")}
              aria-label="Status filter"
              options={[
                { value: "all", label: "All statuses" },
                { value: "submitted", label: "Submitted" },
                { value: "under_review", label: "Under review" },
                { value: "accepted", label: "Accepted" },
                { value: "waitlisted", label: "Waitlisted" },
                { value: "declined", label: "Declined" },
              ]}
            />
          </div>
        }
        batchActions={(selectedRows, clearSelection) => (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              disabled={updating}
              onClick={() => handleBatchStatus(selectedRows.map((r) => r.id), "accepted", clearSelection)}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Accept ({selectedRows.length})
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
              disabled={updating}
              onClick={() => handleBatchStatus(selectedRows.map((r) => r.id), "under_review", clearSelection)}
            >
              <Clock className="h-3.5 w-3.5" />
              Review ({selectedRows.length})
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
              disabled={updating}
              onClick={() => handleBatchStatus(selectedRows.map((r) => r.id), "waitlisted", clearSelection)}
            >
              <AlertCircle className="h-3.5 w-3.5" />
              Waitlist ({selectedRows.length})
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outlineDark"
              className="h-8 gap-1.5 text-rose-700 border-rose-300 hover:bg-rose-50 text-xs font-bold"
              disabled={updating}
              onClick={() => handleBatchStatus(selectedRows.map((r) => r.id), "declined", clearSelection)}
            >
              <XCircle className="h-3.5 w-3.5" />
              Decline ({selectedRows.length})
            </Button>
          </div>
        )}
        emptyTitle="No applications found"
        emptyBody="No volunteer applications match the selected team, status, or search filters."
      />

      {/* Dynamic Review & Approval Drawer */}
      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? contactName(selected.contactId) : "Application"}
        description={selected ? `Applied for ${teamLabel(selected.teamId)}` : undefined}
        wide
      >
        {selected ? (
          <div className="grid gap-6 text-sm">
            {/* Applicant Profile Card */}
            <div className="rounded-2xl border border-border bg-paper p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red text-base font-bold text-white shadow-sm">
                    {getInitials(contactName(selected.contactId))}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-ink">
                      {contactName(selected.contactId)}
                    </h3>
                    <p className="text-xs text-muted">
                      Applied for <strong className="text-ink">{teamLabel(selected.teamId)}</strong> • Submitted {formatDateTime(selected.createdAt)}
                    </p>
                  </div>
                </div>
                <VolunteerStatusBadge status={selected.status} />
              </div>

              {/* Quick Contact & Profile Badges */}
              <div className="mt-4 grid gap-2.5 pt-4 border-t border-border sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="h-3.5 w-3.5 text-muted shrink-0" />
                    <a
                      href={`mailto:${contactEmail(selected.contactId)}`}
                      className="truncate font-semibold text-ink hover:underline"
                    >
                      {contactEmail(selected.contactId)}
                    </a>
                  </div>
                  <button
                    type="button"
                    title="Copy Email"
                    onClick={() => copyEmailToClipboard(contactEmail(selected.contactId))}
                    className="ml-2 text-muted hover:text-ink shrink-0"
                  >
                    {copiedEmail ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <Phone className="h-3.5 w-3.5 text-muted shrink-0" />
                    <a
                      href={`tel:${contactPhone(selected.contactId)}`}
                      className="font-semibold text-ink hover:underline"
                    >
                      {contactPhone(selected.contactId) || "No phone"}
                    </a>
                  </div>
                  {phoneDigits && (
                    <a
                      href={`https://wa.me/${phoneDigits}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100"
                    >
                      <MessageSquare className="h-3 w-3" />
                      Chat
                    </a>
                  )}
                </div>

                {(selected.occupation || selectedContact?.occupation) && (
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span className="font-semibold text-ink">Occupation:</span>
                    <span>{selected.occupation || selectedContact?.occupation}</span>
                  </div>
                )}
                {(selected.location || selectedContact?.location) && (
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span className="font-semibold text-ink">Location:</span>
                    <span>{selected.location || selectedContact?.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Application Responses */}
            <div className="grid gap-4">
              <Surface title="Team Preference">
                <p className="font-semibold text-ink">{teamLabel(selected.teamId)}</p>
              </Surface>

              <Surface title="Availability">
                <p className="text-ink leading-relaxed whitespace-pre-wrap">{selected.availability}</p>
              </Surface>

              <Surface title="Relevant Experience">
                <p className="text-ink leading-relaxed whitespace-pre-wrap">{selected.experience}</p>
              </Surface>

              <Surface title="Motivation & Heart for Service">
                <p className="text-ink leading-relaxed whitespace-pre-wrap">{selected.motivation}</p>
              </Surface>
            </div>

            {/* Application Decision & Status Workflow */}
            <div className="rounded-2xl border-2 border-border bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-ink">Application Decision</h4>
                  <p className="text-xs text-muted">
                    Approving automatically dispatches an official workforce acceptance email to the applicant.
                  </p>
                </div>
                {updating && (
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Saving…
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {/* Accept Button */}
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => setStatus(selected.id, "accepted", contactName(selected.contactId))}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-bold transition-all focus:outline-none",
                    selected.status === "accepted"
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-md ring-2 ring-emerald-600/30"
                      : "border-border bg-white text-ink hover:border-emerald-500 hover:bg-emerald-50/50"
                  )}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Accept
                  {selected.status === "accepted" && <span className="text-[10px] font-normal opacity-90">(Current)</span>}
                </button>

                {/* Under Review Button */}
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => setStatus(selected.id, "under_review", contactName(selected.contactId))}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-bold transition-all focus:outline-none",
                    selected.status === "under_review"
                      ? "border-blue-600 bg-blue-600 text-white shadow-md ring-2 ring-blue-600/30"
                      : "border-border bg-white text-ink hover:border-blue-500 hover:bg-blue-50/50"
                  )}
                >
                  <Clock className="h-4 w-4" />
                  Under Review
                  {selected.status === "under_review" && <span className="text-[10px] font-normal opacity-90">(Current)</span>}
                </button>

                {/* Waitlist Button */}
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => setStatus(selected.id, "waitlisted", contactName(selected.contactId))}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-bold transition-all focus:outline-none",
                    selected.status === "waitlisted"
                      ? "border-amber-600 bg-amber-600 text-white shadow-md ring-2 ring-amber-600/30"
                      : "border-border bg-white text-ink hover:border-amber-500 hover:bg-amber-50/50"
                  )}
                >
                  <AlertCircle className="h-4 w-4" />
                  Waitlist
                  {selected.status === "waitlisted" && <span className="text-[10px] font-normal opacity-90">(Current)</span>}
                </button>

                {/* Decline Button */}
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => setStatus(selected.id, "declined", contactName(selected.contactId))}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-bold transition-all focus:outline-none",
                    selected.status === "declined"
                      ? "border-rose-600 bg-rose-600 text-white shadow-md ring-2 ring-rose-600/30"
                      : "border-border bg-white text-ink hover:border-rose-500 hover:bg-rose-50/50"
                  )}
                >
                  <XCircle className="h-4 w-4" />
                  Decline
                  {selected.status === "declined" && <span className="text-[10px] font-normal opacity-90">(Current)</span>}
                </button>
              </div>

              {selected.reviewedAt && (
                <p className="mt-3 text-right text-[11px] text-muted">
                  Last updated {formatDateTime(selected.reviewedAt)}
                </p>
              )}
            </div>

            {/* Email Notification & WhatsApp Group Onboarding Workflow when Accepted */}
            {selected.status === "accepted" && (
              <>
                <div className="rounded-2xl border border-emerald-300 bg-emerald-50/70 p-5 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-emerald-900">
                      <Mail className="h-5 w-5 text-emerald-700" />
                      <h4 className="font-bold">Workforce Acceptance Email</h4>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                      Automated Email Active
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-emerald-900">
                    Official acceptance notice with team role (<strong>{teamLabel(selected.teamId)}</strong>), event date, and orientation guidelines is sent to{" "}
                    <strong>{contactEmail(selected.contactId)}</strong> upon approval.
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-300 bg-emerald-50/50 p-5 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-emerald-900">
                      <MessageSquare className="h-5 w-5 text-emerald-700" />
                      <h4 className="font-bold">WhatsApp Group Onboarding Note</h4>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                      Ready to send
                    </span>
                  </div>

                <p className="mt-1 text-xs text-emerald-800">
                  This note is customized for {contactName(selected.contactId).split(" ")[0]} with team details.
                </p>

                <div className="mt-3 rounded-xl border border-emerald-200 bg-white p-4">
                  <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-ink">
                    {preview}
                  </pre>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <Button
                    type="button"
                    variant="outlineDark"
                    size="sm"
                    className="gap-1.5 bg-white text-xs font-bold"
                    onClick={() => copyNoteToClipboard(preview)}
                  >
                    {copiedNote ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedNote ? "Copied Note!" : "Copy Invitation Note"}
                  </Button>

                  {whatsappDirectUrl && (
                    <a
                      href={whatsappDirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open in WhatsApp With Note
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
