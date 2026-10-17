import { createAdminClient } from "@/lib/supabase/admin";
import type { TimerDisplayConfig, TimerSegment, TimerSession, TimerTemplate } from "@/lib/timer/types";

const DEFAULT_CONFIG: TimerDisplayConfig = {
  theme: "dark", accent: "#D7A84A", fontSize: "xl", showTitle: true, showSpeaker: true,
  showClock: true, showProgress: true, showNext: true, soundEnabled: false, warningSeconds: 300, redSeconds: 60,
  warningColor: "#f4c95d", redColor: "#f87171", overtimeColor: "#ef4444",
};

function mapSegment(row: Record<string, unknown>): TimerSegment {
  return {
    id: String(row.id), position: Number(row.position), title: String(row.title ?? "Untitled segment"), speaker: String(row.speaker ?? ""),
    durationSeconds: Number(row.duration_seconds ?? 600), segmentType: (row.segment_type ?? "custom") as TimerSegment["segmentType"], notes: String(row.notes ?? ""),
    warningSeconds: Number(row.warning_seconds ?? 300), autoAdvance: Boolean(row.auto_advance), overtimeMode: Boolean(row.overtime_mode),
    elapsedSeconds: Number(row.elapsed_seconds ?? 0), adjustmentSeconds: Number(row.adjustment_seconds ?? 0), startedAt: row.started_at ? String(row.started_at) : null,
  };
}

function mapSession(row: Record<string, unknown>, segments: TimerSegment[], serverNow = new Date().toISOString()): TimerSession {
  return {
    id: String(row.id), publicCode: String(row.public_code), eventName: String(row.event_name ?? ""), status: row.status as TimerSession["status"],
    currentSegmentIndex: Number(row.current_segment_index ?? 0), runningStartedAt: row.running_started_at ? String(row.running_started_at) : null,
    blackout: Boolean(row.blackout), frozen: Boolean(row.frozen), flashMessage: row.flash_message ? String(row.flash_message) : null,
    displayConfig: { ...DEFAULT_CONFIG, ...((row.display_config ?? {}) as Partial<TimerDisplayConfig>) }, updatedAt: String(row.updated_at), serverNow, segments,
  };
}

export async function ensureTimerSession() {
  const supabase = createAdminClient();
  const { data: existing } = await supabase.from("timer_sessions").select("*").order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (existing) return existing as Record<string, unknown>;
  const { data: created, error } = await supabase.from("timer_sessions").insert({ event_name: "Wonders of Worship", display_config: DEFAULT_CONFIG }).select("*").single();
  if (error || !created) throw new Error(error?.message ?? "Could not create timer session.");
  const { error: segmentError } = await supabase.from("timer_segments").insert({ session_id: created.id, position: 0, title: "Opening segment", segment_type: "custom", duration_seconds: 600, warning_seconds: 300 });
  if (segmentError) throw new Error(segmentError.message);
  return created as Record<string, unknown>;
}

export async function getTimerBundle() {
  const supabase = createAdminClient();
  const session = await ensureTimerSession();
  const [{ data: segments, error: segmentError }, { data: templates, error: templateError }, { data: logs, error: logError }] = await Promise.all([
    supabase.from("timer_segments").select("*").eq("session_id", session.id).order("position"),
    supabase.from("timer_templates").select("id, name, event_name, segments, display_config").order("updated_at", { ascending: false }),
    supabase.from("timer_action_log").select("id, action, seconds_delta, metadata, created_at, segment_id, actor_id").eq("session_id", session.id).order("created_at", { ascending: false }).limit(300),
  ]);
  if (segmentError || templateError || logError) throw new Error(segmentError?.message ?? templateError?.message ?? logError?.message ?? "Could not load timer.");
  return {
    session: mapSession(session, ((segments as Record<string, unknown>[] | null) ?? []).map(mapSegment)),
    templates: ((templates as Record<string, unknown>[] | null) ?? []).map((template) => ({ id: String(template.id), name: String(template.name), eventName: String(template.event_name ?? ""), segments: (template.segments ?? []) as TimerTemplate["segments"], displayConfig: (template.display_config ?? {}) as Partial<TimerDisplayConfig> })),
    logs: logs ?? [],
  };
}

function currentSegment(session: Record<string, unknown>, segments: Record<string, unknown>[]) {
  return segments.find((segment) => Number(segment.position) === Number(session.current_segment_index)) ?? segments[0];
}

export async function applyTimerCommand(command: Record<string, unknown>, actorId: string) {
  const supabase = createAdminClient();
  const session = await ensureTimerSession();
  const { data: segmentRows } = await supabase.from("timer_segments").select("*").eq("session_id", session.id).order("position");
  const segments = (segmentRows as Record<string, unknown>[] | null) ?? [];
  const action = String(command.action ?? "");
  const now = new Date();
  const current = currentSegment(session, segments);
  if (!current && action !== "save-segments" && action !== "save-template") throw new Error("Timer has no segments.");

  const updateCurrentElapsed = async () => {
    if (session.status !== "running" || !session.running_started_at || !current) return;
    const elapsed = Number(current.elapsed_seconds ?? 0) + Math.max(0, now.getTime() - Date.parse(String(session.running_started_at))) / 1000;
    await supabase.from("timer_segments").update({ elapsed_seconds: Math.floor(elapsed) }).eq("id", current.id);
  };

  let secondsDelta = 0;
  if (action === "start" || action === "resume") {
    await supabase.from("timer_sessions").update({ status: "running", running_started_at: now.toISOString() }).eq("id", session.id);
    if (!current.started_at) await supabase.from("timer_segments").update({ started_at: now.toISOString() }).eq("id", current.id);
  } else if (action === "pause") {
    await updateCurrentElapsed();
    await supabase.from("timer_sessions").update({ status: "paused", running_started_at: null }).eq("id", session.id);
  } else if (action === "reset") {
    await supabase.from("timer_segments").update({ elapsed_seconds: 0, adjustment_seconds: 0, started_at: null, completed_at: null }).eq("id", current.id);
    await supabase.from("timer_sessions").update({ status: "idle", running_started_at: null }).eq("id", session.id);
  } else if (action === "next" || action === "previous" || action === "select") {
    await updateCurrentElapsed();
    const requested = action === "select" ? Number(command.position) : Number(session.current_segment_index) + (action === "next" ? 1 : -1);
    const nextPosition = Math.min(Math.max(0, requested), Math.max(0, segments.length - 1));
    await supabase.from("timer_sessions").update({ current_segment_index: nextPosition, status: "idle", running_started_at: null }).eq("id", session.id);
    if (action === "next" && current && nextPosition !== Number(current.position)) await supabase.from("timer_segments").update({ completed_at: now.toISOString() }).eq("id", current.id);
  } else if (action === "adjust" || action === "set-exact") {
    await updateCurrentElapsed();
    const elapsed = Number(current.elapsed_seconds ?? 0) + (session.status === "running" && session.running_started_at ? Math.max(0, now.getTime() - Date.parse(String(session.running_started_at))) / 1000 : 0);
    const delta = action === "adjust" ? Number(command.seconds ?? 0) : Math.ceil(elapsed + Number(command.remainingSeconds ?? 0)) - Number(current.duration_seconds);
    secondsDelta = Number.isFinite(delta) ? Math.trunc(delta) : 0;
    await supabase.from("timer_segments").update({ duration_seconds: Math.max(1, Number(current.duration_seconds) + secondsDelta), adjustment_seconds: Number(current.adjustment_seconds ?? 0) + secondsDelta }).eq("id", current.id);
  } else if (action === "toggle-blackout" || action === "toggle-freeze") {
    const field = action === "toggle-blackout" ? "blackout" : "frozen";
    await supabase.from("timer_sessions").update({ [field]: !Boolean(session[field]) }).eq("id", session.id);
  } else if (action === "message") {
    await supabase.from("timer_sessions").update({ flash_message: String(command.message ?? "").trim() || null }).eq("id", session.id);
  } else if (action === "save-session") {
    const config = { ...((session.display_config ?? {}) as Record<string, unknown>), ...((command.displayConfig ?? {}) as Record<string, unknown>) };
    await supabase.from("timer_sessions").update({ event_name: String(command.eventName ?? session.event_name ?? ""), display_config: config }).eq("id", session.id);
  } else if (action === "save-segments") {
    const incoming = (Array.isArray(command.segments) ? command.segments : []) as Record<string, unknown>[];
    const currentRows = (segmentRows as Record<string, unknown>[] | null) ?? [];
    for (const row of currentRows) await supabase.from("timer_segments").update({ position: 1000 + Number(row.position) }).eq("id", row.id);
    for (const [position, item] of incoming.entries()) {
      const values = { session_id: session.id, position, title: String(item.title ?? "Untitled segment"), speaker: String(item.speaker ?? ""), duration_seconds: Math.max(1, Number(item.durationSeconds ?? 600)), segment_type: String(item.segmentType ?? "custom"), notes: String(item.notes ?? ""), warning_seconds: Math.max(0, Number(item.warningSeconds ?? 300)), auto_advance: Boolean(item.autoAdvance), overtime_mode: Boolean(item.overtimeMode), elapsed_seconds: Number(item.elapsedSeconds ?? 0), adjustment_seconds: Number(item.adjustmentSeconds ?? 0), started_at: item.startedAt ?? null };
      if (item.id) {
        const { data: updated } = await supabase.from("timer_segments").update(values).eq("id", item.id).eq("session_id", session.id).select("id").maybeSingle();
        if (!updated) await supabase.from("timer_segments").insert(values);
      } else await supabase.from("timer_segments").insert(values);
    }
    const keepIds = incoming.map((item) => item.id).filter(Boolean);
    for (const row of currentRows) if (!keepIds.includes(row.id)) await supabase.from("timer_segments").delete().eq("id", row.id);
  } else if (action === "save-template") {
    const { error } = await supabase.from("timer_templates").insert({ name: String(command.name ?? "Untitled template"), event_name: String(command.eventName ?? ""), segments: command.segments ?? [], display_config: command.displayConfig ?? {}, created_by: actorId });
    if (error) throw new Error(error.message);
  } else if (action === "load-template") {
    const template = command.template as Record<string, unknown>;
    await supabase.from("timer_sessions").update({ event_name: template.eventName ?? "", display_config: template.displayConfig ?? DEFAULT_CONFIG, status: "idle", current_segment_index: 0, running_started_at: null }).eq("id", session.id);
    await supabase.from("timer_segments").delete().eq("session_id", session.id);
    const templateSegments = Array.isArray(template.segments) ? template.segments as Record<string, unknown>[] : [];
    if (templateSegments.length) await supabase.from("timer_segments").insert(templateSegments.map((item, position) => ({ session_id: session.id, position, title: item.title ?? "Untitled segment", speaker: item.speaker ?? "", duration_seconds: item.durationSeconds ?? 600, segment_type: item.segmentType ?? "custom", notes: item.notes ?? "", warning_seconds: item.warningSeconds ?? 300, auto_advance: item.autoAdvance ?? false, overtime_mode: item.overtimeMode ?? true })));
  } else {
    throw new Error(`Unknown timer action: ${action}`);
  }

  await supabase.from("timer_action_log").insert({ session_id: session.id, segment_id: current?.id ?? null, actor_id: actorId, action, seconds_delta: secondsDelta, metadata: { command } });
  return getTimerBundle();
}

export function defaultTimerConfig() { return DEFAULT_CONFIG; }
