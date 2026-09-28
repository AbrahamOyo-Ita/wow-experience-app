import test from "node:test";
import assert from "node:assert/strict";
import { renderVolunteerStatusUpdateEmail } from "../src/lib/notifications/email-template.ts";

test("renders accepted volunteer status email with brand standards and team details", () => {
  const result = renderVolunteerStatusUpdateEmail({
    status: "accepted",
    firstName: "Abraham",
    eventName: "WOW Experience 2026",
    volunteerTeam: "Media & Broadcast",
    eventDate: "Friday, Nov 20, 2026",
    venueName: "Sanctified Mount Zion Church",
    recipientEmail: "oyoitaabraham@gmail.com",
    onboardingUrl: "https://chat.whatsapp.com/test-group",
  });

  assert.ok(result.subject.includes("Approved to Serve"));
  assert.ok(result.subject.includes("Media & Broadcast"));
  assert.ok(result.html.includes("Welcome to the Workforce, Abraham!"));
  assert.ok(result.html.includes("Media &amp; Broadcast") || result.html.includes("Media & Broadcast"));
  assert.ok(result.html.includes("WORKFORCE • APPLICATION ACCEPTED"));
  assert.ok(result.html.includes("https://chat.whatsapp.com/test-group"));
  assert.ok(result.text.includes("Abraham"));
  assert.ok(result.text.includes("Media & Broadcast"));
});

test("renders waitlisted volunteer status email with graceful standby messaging", () => {
  const result = renderVolunteerStatusUpdateEmail({
    status: "waitlisted",
    firstName: "Sarah",
    eventName: "WOW Experience 2026",
    volunteerTeam: "Hospitality",
    recipientEmail: "sarah@example.com",
  });

  assert.ok(result.subject.includes("Volunteer Application Update"));
  assert.ok(result.html.includes("Application Update, Sarah"));
  assert.ok(result.html.includes("priority waitlist"));
  assert.ok(result.html.includes("STANDBY STATUS"));
});

test("renders declined volunteer status email with encouraging worship invitation", () => {
  const result = renderVolunteerStatusUpdateEmail({
    status: "declined",
    firstName: "David",
    eventName: "WOW Experience 2026",
    volunteerTeam: "Choir",
    recipientEmail: "david@example.com",
  });

  assert.ok(result.subject.includes("Volunteer Application Update"));
  assert.ok(result.html.includes("Thank You for Your Heart to Serve, David"));
  assert.ok(result.html.includes("JOIN US IN WORSHIP"));
});
