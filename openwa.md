# OpenWA Setup and Operations Guide

This application connects to an external OpenWA-compatible WhatsApp service. OpenWA must run continuously on a separate server; the Vercel application does not host the WhatsApp session itself.

## 1. Choose an always-on host

Deploy OpenWA on a persistent VPS or container host such as:

- A VPS with Docker or PM2
- Railway
- Render
- Fly.io
- Another server that supports long-running processes

Do not run OpenWA only on a personal laptop. If the laptop sleeps, loses internet, or shuts down, WhatsApp sending stops.

The OpenWA service should be reachable over HTTPS, for example:

```text
https://whatsapp-api.example.com
```

Use a reverse proxy such as Nginx, Caddy, or the hosting provider's HTTPS proxy. Do not expose an unprotected OpenWA server publicly.

## 2. Configure the OpenWA service

The OpenWA service used by this application must provide:

```text
POST /sendText
```

It must accept JSON similar to:

```json
{
  "to": "2348012345678",
  "content": "Test message from WOW Experience"
}
```

The application sends the API key in these headers:

```text
X-Api-Key: your-secret-api-key
api_key: your-secret-api-key
```

Configure the OpenWA server to accept one of those headers. Keep the API key private and use a long random value.

## 3. Connect the WhatsApp account

1. Start the OpenWA service.
2. Open its session or QR-code page.
3. Scan the QR code using the dedicated WhatsApp account.
4. Wait until the session reports `connected` or `ready`.
5. Confirm that the session data is stored persistently.

Use a dedicated business WhatsApp number where possible. Do not connect the same account to multiple automation services at the same time.

## 4. Configure the WOW Experience application

Add these variables to the Vercel Production environment:

```env
OPENWA_BASE_URL=https://whatsapp-api.example.com
OPENWA_API_KEY=replace-with-the-openwa-secret
```

Both variables are required. Set them in Vercel under:

```text
Project Settings → Environment Variables → Production
```

After saving them, redeploy the application. Environment variables are not reliably applied to an already-running deployment until it is rebuilt.

Never add these values to `NEXT_PUBLIC_*` variables, browser code, Git, or a public README.

## 5. Test OpenWA directly

Run this from a machine that can reach the OpenWA server:

```bash
curl -X POST "https://whatsapp-api.example.com/sendText" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: replace-with-the-openwa-secret" \
  -d '{"to":"2348012345678","content":"OpenWA test from WOW Experience"}'
```

Expected result:

- HTTP `200` or the success status documented by the OpenWA service
- A response confirming that the message was accepted
- The message arriving on the destination phone

For Nigerian numbers, use international format without the leading plus sign:

```text
2348012345678
```

If the direct test fails, fix OpenWA before testing the admin dashboard.

## 6. Verify from the admin dashboard

After deployment:

1. Open `/admin/settings`.
2. Confirm **OpenWA WhatsApp** is marked **Configured**.
3. Open the WhatsApp session card.
4. Confirm the session status is `connected`.
5. Confirm the last activity and health note are current.
6. Send a small test campaign to one consenting recipient.

The application intentionally reports OpenWA as incomplete when only one of `OPENWA_BASE_URL` or `OPENWA_API_KEY` is present.

## 7. Keep OpenWA reliable

- Enable automatic process restarts with Docker restart policies, PM2, or the host's process manager.
- Persist the OpenWA session directory or volume so a server restart does not require scanning a new QR code.
- Monitor CPU, memory, disk, and network availability.
- Use a health check for the OpenWA service and alert when it is unavailable.
- Keep the OpenWA host and the Vercel application on HTTPS.
- Rotate the API key if it is exposed, and update Vercel immediately afterward.
- Keep WhatsApp consent records intact and send only to opted-in recipients.
- Respect WhatsApp messaging limits and avoid bulk bursts that may trigger account restrictions.

## 8. Common failures

### “Action required” in `/admin/settings`

Check that both production variables exist exactly as named:

```text
OPENWA_BASE_URL
OPENWA_API_KEY
```

Redeploy after changing them.

### HTTP 401 or 403 from OpenWA

The API key is missing, incorrect, expired, or the server expects a different header. Confirm that OpenWA accepts `X-Api-Key` or `api_key`.

### HTTP 404 from `/sendText`

The OpenWA implementation uses a different route. Configure a compatible `/sendText` endpoint or update the provider adapter in `src/lib/notifications/providers.ts`.

### HTTP 5xx, timeout, or connection refused

The host is down, asleep, blocked by a firewall, using the wrong port, or missing HTTPS. Test the base URL from outside the OpenWA server.

### Session disconnected or QR required

Open the OpenWA session manager, reconnect the WhatsApp account, and confirm that session storage is persistent. Do not delete the session volume unless you intentionally want to pair again.

### Message rejected

Check the recipient format, WhatsApp consent, provider logs, and whether the destination number is registered on WhatsApp. Test with a known valid number first.

### Dashboard says configured but messages still fail

“Configured” only confirms that both environment variables exist. It does not prove that the external OpenWA host is reachable or that the WhatsApp session is connected. Use the direct `curl` test and inspect the OpenWA logs.

## 9. Production checklist

- [ ] OpenWA is deployed on an always-on host.
- [ ] The host has a public HTTPS URL.
- [ ] The `/sendText` endpoint works.
- [ ] API-key authentication works.
- [ ] The WhatsApp account is connected.
- [ ] Session data survives a restart.
- [ ] `OPENWA_BASE_URL` is set in Vercel Production.
- [ ] `OPENWA_API_KEY` is set in Vercel Production.
- [ ] The application was redeployed after setting variables.
- [ ] `/admin/settings` reports OpenWA as configured.
- [ ] A one-recipient test message was delivered.
- [ ] Monitoring and automatic restarts are enabled.
