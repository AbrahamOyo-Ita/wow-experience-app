import { isSupabaseConfigured } from "@/lib/supabase/env";
import * as live from "@/services/live";
import * as mock from "@/services/mock";

const useLive = isSupabaseConfigured();

export const rsvpService = useLive ? live.rsvpService : mock.rsvpService;
export const volunteerService = useLive ? live.volunteerService : mock.volunteerService;
export const attendanceService = useLive ? live.attendanceService : mock.attendanceService;
export const contactService = useLive ? live.contactService : mock.contactService;
export const editionService = useLive ? live.editionService : mock.editionService;
export const campaignService = useLive ? live.campaignService : mock.campaignService;
export const sessionService = useLive ? live.sessionService : mock.sessionService;
export const enquiryService = useLive ? live.enquiryService : mock.enquiryService;
export const unsubscribeService = useLive ? live.unsubscribeService : mock.unsubscribeService;
export const services = useLive ? live.services : mock.services;

export type { PublicServices, MockSubmitResult } from "@/services/contracts";
