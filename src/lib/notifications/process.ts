import { hasServiceRole, createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, sendWhatsApp } from "@/lib/notifications/providers";

function render(template: string, payload: Record<string, unknown>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(payload[key] ?? ""));
}

export async function processNotificationQueue(limit = 25) {
  if (!hasServiceRole()) {
    return {
      processed: 0,
      error: "SUPABASE_SERVICE_ROLE_KEY is required to process notifications.",
    };
  }

  const supabase = createAdminClient();
  const { data: rows, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("status", "queued")
    .lte("scheduled_for", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    return { processed: 0, error: error.message };
  }

  let processed = 0;
  for (const row of rows ?? []) {
    await supabase.from("notifications").update({ status: "processing" }).eq("id", row.id);
    const payload = (row.payload ?? {}) as Record<string, unknown>;
    const { data: template } = await supabase
      .from("message_templates")
      .select("subject, body")
      .eq("category", row.template_key === "volunteer_receipt" ? "volunteer" : "rsvp")
      .eq("channel", row.channel)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    const body = render(
      template?.body ?? "Thank you {{first_name}} for {{event_name}}.",
      payload,
    );
    const subject = template?.subject ? render(template.subject, payload) : null;
    const to = String(row.to_address ?? "");
    const result =
      row.channel === "email"
        ? await sendEmail({ id: row.id, channel: "email", to, subject, body })
        : await sendWhatsApp({ id: row.id, channel: "whatsapp", to, subject, body });

    await supabase.from("notification_attempts").insert({
      notification_id: row.id,
      channel: row.channel,
      provider: row.channel === "email" ? "resend" : "openwa",
      success: result.status === "sent",
      response_preview: result.preview ?? result.reason ?? null,
    });

    await supabase
      .from("notifications")
      .update({
        status: result.status,
        skip_reason: result.reason ?? null,
        error_message: result.status === "failed" ? result.reason : null,
        sent_at: result.status === "sent" ? new Date().toISOString() : null,
      })
      .eq("id", row.id);
    processed += 1;
  }

  return { processed };
}
