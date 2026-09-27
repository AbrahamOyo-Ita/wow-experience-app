# OpenWA on Oracle Cloud Always Free

Use this setup to run OpenWA on an Oracle Ubuntu VM while WOW Experience stays on Vercel.

Oracle Always Free currently offers up to 2 ARM OCPUs and 12 GB RAM in the home region. Capacity may be unavailable temporarily, and idle VMs may be reclaimed. See the [official Oracle limits](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm).

OpenWA repository: https://github.com/rmyndharis/OpenWA

## 1. Create the Oracle VM

1. Open https://www.oracle.com/cloud/free/ and create/sign in to your account.
2. Open https://cloud.oracle.com and select your home region.
3. Open **Compute → Instances → Create instance**.
4. Name it `wow-openwa`.
5. Choose Ubuntu marked **Always Free-eligible**.
6. Choose **Ampere → VM.Standard.A1.Flex**.
7. Allocate 2 OCPUs and 12 GB RAM. If capacity is unavailable, try 1 OCPU and 6 GB or another availability domain.
8. Choose a public subnet and enable **Assign a public IPv4 address**.
9. Generate or paste an SSH public key, then click **Create**.
10. Wait for `Running` and copy the public IPv4 address.

## 2. Connect with SSH

From Oracle Cloud Shell, create a key if needed:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
ssh-keygen -t ed25519 -f ~/.ssh/wow-openwa
cat ~/.ssh/wow-openwa.pub
```

Paste the `.pub` value into the VM form. Keep the private key secret. Connect with:

```bash
chmod 600 ~/.ssh/wow-openwa
ssh -i ~/.ssh/wow-openwa ubuntu@PUBLIC_IP
```

## 3. Open network ports

In the instance's **Primary VNIC → Subnet → Default Security List**, add TCP ingress rules for ports `80` and `443` from `0.0.0.0/0`. Do not publicly expose port `2785`; it stays behind HTTPS.

## 4. Install Docker and OpenWA

Run on the VM:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y ca-certificates curl git
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
exit
```

Reconnect with SSH, then deploy OpenWA:

```bash
sudo mkdir -p /opt/openwa
sudo chown "$USER":"$USER" /opt/openwa
cd /opt/openwa
git clone https://github.com/rmyndharis/OpenWA.git .
docker volume create openwa-data
docker compose up -d
docker compose ps
docker compose logs -f --tail=100
```

OpenWA's API/dashboard listens internally on port `2785`. Keep session storage persistent.

## 5. Point a subdomain to the VM

At your domain provider create:

```text
Type: A
Name: whatsapp
Value: PUBLIC_IP
TTL: 300
```

Use `whatsapp.wowexperience.com.ng` after DNS resolves.

## 6. Add HTTPS with Caddy

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
sudo nano /etc/caddy/Caddyfile
```

Set the file to:

```text
whatsapp.wowexperience.com.ng {
    reverse_proxy 127.0.0.1:2785
}
```

Apply it:

```bash
sudo systemctl reload caddy
sudo systemctl enable caddy
```

Open `https://whatsapp.wowexperience.com.ng`. Caddy should obtain HTTPS automatically.

## 7. Connect WhatsApp

1. Open the HTTPS OpenWA dashboard.
2. Open **API Keys / Authentication** and create an operator key.
3. Copy the key securely; it may only be shown once.
4. Open **Sessions → Create session**.
5. Name it `wow-primary`, start it, and display its QR code.
6. On the dedicated phone choose **WhatsApp → Linked devices → Link a device** and scan.
7. Wait for `connected` or `ready`.
8. Copy the actual session ID returned by OpenWA.

## 8. Test OpenWA directly

```bash
curl "https://whatsapp.wowexperience.com.ng/api/sessions/SESSION_ID" \
  -H "X-API-Key: YOUR_OPENWA_API_KEY"
```

```bash
curl -X POST "https://whatsapp.wowexperience.com.ng/api/sessions/SESSION_ID/messages/send-text" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_OPENWA_API_KEY" \
  -d '{"chatId":"2348012345678@c.us","text":"OpenWA test from WOW Experience"}'
```

Do not continue until the direct test arrives. Nigerian numbers use country code format without `+`, followed by `@c.us`.

## 9. Connect Vercel

In Vercel → WOW Experience → **Settings → Environment Variables → Production**, add:

```env
OPENWA_BASE_URL=https://whatsapp.wowexperience.com.ng
OPENWA_API_KEY=YOUR_OPENWA_API_KEY
OPENWA_SESSION_ID=SESSION_ID
```

Save and redeploy the latest production deployment. Never use `NEXT_PUBLIC_` for these secrets.

## 10. Verify the admin dashboard

1. Open production `/admin/settings`.
2. Confirm OpenWA is **Configured**.
3. Confirm the session card says `connected`.
4. Send one small test campaign to your own opted-in number.
5. Confirm the result is `sent` or `delivered`.

## Troubleshooting

- **Out of host capacity:** try another availability domain or 1 OCPU/6 GB.
- **SSH timeout:** verify public IP, port 22 ingress, username `ubuntu`, and private key.
- **HTTPS failure:** verify DNS and ports 80/443.
- **401/403:** recreate the API key or correct its session scope.
- **404:** use `/api/sessions/{sessionId}/messages/send-text`, not the old `/sendText` route.
- **Disconnected session:** restart it and scan a new QR code if requested.
- **Vercel failure:** verify all three variables, especially `OPENWA_SESSION_ID`, then redeploy.
