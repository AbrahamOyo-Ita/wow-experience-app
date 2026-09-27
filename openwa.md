# OpenWA on Railway: exact setup for WOW Experience

This guide deploys the current OpenWA repository and connects it to the production Vercel app.

**Repository:** https://github.com/rmyndharis/OpenWA  
**Railway API port:** `2785`  
**Send route:** `/api/sessions/{sessionId}/messages/send-text`

OpenWA is an unofficial WhatsApp Web gateway. Use a dedicated number, send only to opted-in contacts, and understand that WhatsApp can restrict unofficial automation accounts.

Railway may provide trial credits or limited usage rather than a permanently free unlimited tier. Check Railway billing before deploying. OpenWA is open source; hosting and persistent storage are separate costs.

## 1. Create accounts

1. Create or sign in to a GitHub account at https://github.com.
2. Sign in to https://railway.app using GitHub.
3. Confirm that Railway shows available trial/free credits before deploying.

## 2. Deploy OpenWA from GitHub

1. In Railway, click **New Project**.
2. Select **Deploy from GitHub repo**.
3. Choose the repository `rm myndharis/OpenWA` as displayed by GitHub. The exact URL is:

   ```text
   https://github.com/rmyndharis/OpenWA
   ```

4. Approve Railway's GitHub access request.
5. Select the repository and create the service.
6. Let Railway build the included `Dockerfile`.

If Railway does not detect the Dockerfile, open the service's **Settings → Build** section and select **Dockerfile**. Do not use the local development command for production.

## 3. Add OpenWA variables in Railway

Open the Railway service → **Variables**, then add:

```env
NODE_ENV=production
PORT=2785
DATABASE_TYPE=sqlite
STORAGE_TYPE=local
ENGINE_TYPE=whatsapp-web.js
```

The current OpenWA image serves the API and dashboard on port `2785`. Railway supplies the public HTTPS routing.

## 4. Generate the Railway URL

1. Open Railway service **Settings → Networking**.
2. Click **Generate Domain**.
3. Copy the generated URL, for example:

   ```text
   https://openwa-production-xxxx.up.railway.app
   ```

4. Open that URL in a browser and confirm the OpenWA dashboard loads.

If it does not load, open **Deployments → View Logs** and fix the first startup error before continuing.

## 5. Create an OpenWA API key

1. In the OpenWA dashboard, open **API Keys** or **Authentication**.
2. Create a key for WOW Experience.
3. Use an operator key scoped only to the intended WhatsApp session when possible.
4. Copy the secret immediately; OpenWA may show it only once.

Do not put this key in GitHub or a `NEXT_PUBLIC_*` variable.

## 6. Create and connect the WhatsApp session

1. Open **Sessions** in the OpenWA dashboard.
2. Click **Create session**.
3. Name it `wow-primary`.
4. Start the session and open its QR-code screen.
5. On the dedicated WhatsApp phone, open **WhatsApp → Linked devices → Link a device**.
6. Scan the QR code.
7. Wait until the session reports `connected` or `ready`.
8. Copy the actual session ID returned by OpenWA. If it differs from `wow-primary`, use the returned ID later.

Keep the Railway service and its storage running. Deleting session storage can require another QR scan.

## 7. Test OpenWA directly

Replace the placeholders below. Nigerian numbers use country code format without `+`, followed by `@c.us`.

Check the session:

```bash
curl "https://YOUR-RAILWAY-DOMAIN/api/sessions/SESSION_ID" \
  -H "X-API-Key: YOUR_OPENWA_API_KEY"
```

Send a test message:

```bash
curl -X POST "https://YOUR-RAILWAY-DOMAIN/api/sessions/SESSION_ID/messages/send-text" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_OPENWA_API_KEY" \
  -d '{"chatId":"2348012345678@c.us","text":"OpenWA test from WOW Experience"}'
```

Do not continue until this direct test delivers. It proves Railway, OpenWA, the API key, the session, and WhatsApp are working independently of Vercel.

## 8. Add variables to Vercel

Open Vercel → WOW Experience project → **Settings → Environment Variables**. Add each variable to **Production**:

```env
OPENWA_BASE_URL=https://YOUR-RAILWAY-DOMAIN
OPENWA_API_KEY=YOUR_OPENWA_API_KEY
OPENWA_SESSION_ID=SESSION_ID
```

Use the real OpenWA session ID, not necessarily the display name. Never use `NEXT_PUBLIC_` for these values.

Save the variables, then open **Deployments** and click **Redeploy** on the latest production deployment. Vercel environment changes require a rebuild.

## 9. Verify WOW Experience

1. Open the production admin dashboard.
2. Go to `/admin/settings`.
3. Confirm **OpenWA WhatsApp** says **Configured**.
4. Confirm the WhatsApp session card says `connected`.
5. Send one small test campaign to your own opted-in number.
6. Check the notification result for `sent` or `delivered`.

## 10. Keep it production-ready

- Keep the Railway service running continuously.
- Persist OpenWA session storage; do not rely on disposable storage.
- Enable automatic restarts where Railway provides them.
- Watch Railway logs after restarts and deployments.
- Use a dedicated WhatsApp number.
- Send slowly and only to opted-in contacts.
- Keep email available as a fallback.
- Rotate the OpenWA API key immediately if exposed.

## Troubleshooting

### Railway service does not start

Check **Deployments → Logs**. Confirm Dockerfile deployment and port `2785`.

### 401 or 403

The API key is wrong or not allowed to use the session. Create a new operator key scoped to the session and update Vercel.

### 404

Use the current route:

```text
/api/sessions/{sessionId}/messages/send-text
```

Do not use the older `/sendText` route with the current repository.

### Session disconnected

Open the session in OpenWA, restart it, and scan a new QR code if requested. Confirm `OPENWA_SESSION_ID` matches the connected session.

### Direct curl works but the app fails

Check all three Vercel variables, redeploy, and inspect the notification failure reason in the admin dashboard.

### Railway sleeps or runs out of credits

That is a hosting-plan limitation. A WhatsApp Web session needs an always-on process and persistent storage. Move to a paid Railway plan or a low-cost VPS if the free allowance cannot keep it running.

## Final checklist

- [ ] OpenWA repository deployed from GitHub
- [ ] Railway HTTPS domain generated
- [ ] OpenWA dashboard loads
- [ ] API key created
- [ ] `wow-primary` session created
- [ ] QR code scanned and session is connected
- [ ] Direct curl test delivered
- [ ] `OPENWA_BASE_URL` set in Vercel Production
- [ ] `OPENWA_API_KEY` set in Vercel Production
- [ ] `OPENWA_SESSION_ID` set in Vercel Production
- [ ] Vercel redeployed
- [ ] `/admin/settings` reports OpenWA configured
- [ ] Dashboard test message delivered
