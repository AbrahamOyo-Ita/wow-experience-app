"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  AttendanceInput,
  EnquiryInput,
  MockSubmitResult,
  RsvpInput,
  UnsubscribeInput,
  VolunteerInput,
} from "@/services/contracts";
import type { AttendanceRecord, Rsvp, VolunteerApplication } from "@/types";

async function ipHash() {
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown";
  const bytes = new TextEncoder().encode(ip);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function callRpc<T>(
  name: string,
  payload: Record<string, unknown>,
): Promise<MockSubmitResult<T>> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Supabase is not configured." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(name, {
    payload: { ...payload, ipHash: await ipHash() },
  });

  if (error) {
    return {
      status: "error",
      message: error.message || "The request could not be completed. Try again.",
    };
  }

  const result = data as MockSubmitResult<T> | null;
  if (!result?.status) {
    return { status: "error", message: "The request could not be completed. Try again." };
  }
  return result;
}

export async function submitRsvp(input: RsvpInput) {
  return callRpc<Rsvp>("submit_rsvp", { ...input });
}

export async function declineRsvp(eventId: string) {
  const result = await callRpc<{ recorded: true }>("decline_rsvp", { eventId });
  if (result.status === "success") return { recorded: true as const };
  return { recorded: true as const };
}

export async function submitVolunteer(input: VolunteerInput) {
  return callRpc<VolunteerApplication>("submit_volunteer", { ...input });
}

export async function checkInAttendance(input: AttendanceInput & { source?: "qr" | "admin" }) {
  return callRpc<AttendanceRecord>("check_in_attendance", { ...input });
}

export async function submitEnquiry(input: EnquiryInput) {
  return callRpc<{ id: string }>("submit_enquiry", { ...input });
}

export async function unsubscribeContact(input: UnsubscribeInput) {
  return callRpc<{ id: string }>("unsubscribe_contact", { ...input });
}
