/**
 * WOW Experience - Luxury Email Design System
 * Crafted with 20+ years email design principles:
 * - Table-based bulletproof structural layout (Outlook 2007-365, Apple Mail, Gmail, Yahoo, Proton)
 * - MSO conditional VML buttons with retina border rendering
 * - Dark-mode preservation tags & high-contrast WCAG AAA compliance
 * - Zero external CSS dependencies (fully inline CSS)
 * - Anti-clipping preheaders and fail-safe plain link fallbacks
 */

export interface EmailDetailItem {
  label: string;
  value: string;
  badge?: string;
}

export interface EmailRenderOptions {
  title?: string;
  preheader?: string;
  badgeText?: string;
  headline: string;
  leadParagraph?: string;
  bodyHtml?: string;
  bodyMarkdown?: string;
  callout?: {
    type?: "crimson" | "gold" | "slate";
    title?: string;
    text: string;
  };
  detailsGrid?: EmailDetailItem[];
  codeBox?: {
    code: string;
    caption?: string;
  };
  primaryAction?: {
    text: string;
    url: string;
  };
  secondaryAction?: {
    text: string;
    url: string;
  };
  venueCard?: boolean;
  scriptureQuote?: boolean;
  recipientEmail?: string;
  footerNotes?: string;
  unsubscribeUrl?: string;
}

const BRAND = {
  name: "Wonders of Worship Experience",
  editionTheme: "RESOUND",
  scripture: "Revelation 19:6",
  scriptureVerse:
    "And I heard as it were the voice of a great multitude, and as the voice of many waters, and as the voice of mighty thunderings, saying, Alleluia: for the Lord God omnipotent reigneth.",
  venueName: "Sanctified Mount Zion Church",
  venueAddress: "#25 Ibiono Street, Off Barracks Road, Uyo, Akwa Ibom State, Nigeria",
  websiteUrl: "https://www.wowexperience.com.ng",
  logoUrl: "https://www.wowexperience.com.ng/images/wow-logo-white.webp",
  contactEmail: "updates@wowexperience.com.ng",
};

/**
 * Escapes HTML characters safely.
 */
function escapeHtml(str: string): string {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Converts basic markdown formatting into safe, styled HTML paragraphs and lists.
 */
export function formatMarkdownToEmailHtml(markdown: string): string {
  if (!markdown) return "";

  const paragraphs = markdown.split(/\n\s*\n/);

  return paragraphs
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";

      // Headers
      if (trimmed.startsWith("### ")) {
        const text = escapeHtml(trimmed.slice(4));
        return `<h3 style="margin: 24px 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 17px; font-weight: 700; line-height: 1.4; color: #FFFFFF;">${text}</h3>`;
      }
      if (trimmed.startsWith("## ")) {
        const text = escapeHtml(trimmed.slice(3));
        return `<h2 style="margin: 28px 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 20px; font-weight: 700; line-height: 1.35; color: #FFFFFF;">${text}</h2>`;
      }
      if (trimmed.startsWith("# ")) {
        const text = escapeHtml(trimmed.slice(2));
        return `<h1 style="margin: 32px 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 800; line-height: 1.3; color: #FFFFFF;">${text}</h1>`;
      }

      // Unordered lists
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const items = trimmed
          .split("\n")
          .map((line) => line.replace(/^[-*]\s+/, "").trim())
          .filter(Boolean)
          .map((item) => {
            const parsed = formatInlineMarkdown(item);
            return `<li style="margin-bottom: 8px; line-height: 1.6; color: #CBD5E1;">${parsed}</li>`;
          })
          .join("");
        return `<ul style="margin: 16px 0; padding-left: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; color: #CBD5E1;">${items}</ul>`;
      }

      // Regular paragraph
      const parsed = formatInlineMarkdown(trimmed).replaceAll("\n", "<br />");
      return `<p style="margin: 0 0 18px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.65; color: #CBD5E1;">${parsed}</p>`;
    })
    .join("");
}

function formatInlineMarkdown(text: string): string {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #FFFFFF; font-weight: 700;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="color: #E2E8F0;">$1</em>')
    .replace(/_(.*?)_/g, '<em style="color: #E2E8F0;">$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background-color: #1E232F; color: #F87171; padding: 2px 6px; border-radius: 4px; font-size: 13px; font-family: Consolas, Monaco, monospace;">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #F87171; text-decoration: underline;">$1</a>');
}

/**
 * Builds the bulletproof Master Email HTML
 */
export function renderRichEmailHtml(options: EmailRenderOptions): string {
  const preheader = options.preheader || options.headline;
  const badge = options.badgeText || `${BRAND.editionTheme} • ${BRAND.scripture}`;
  const headline = options.headline;
  const leadParagraph = options.leadParagraph;
  const bodyContent = options.bodyHtml || (options.bodyMarkdown ? formatMarkdownToEmailHtml(options.bodyMarkdown) : "");

  // Build Details Grid HTML (Airline boarding pass / luxury ticket format)
  let detailsGridHtml = "";
  if (options.detailsGrid && options.detailsGrid.length > 0) {
    const items = options.detailsGrid
      .map(
        (item) => `
        <td class="stack-col" style="padding: 12px 14px; border: 1px solid #262B37; background-color: #11141B; border-radius: 8px; vertical-align: top;">
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #7E8B9F; margin-bottom: 4px;">
            ${escapeHtml(item.label)}
          </div>
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; color: #FFFFFF; line-height: 1.4;">
            ${escapeHtml(item.value)}
          </div>
          ${
            item.badge
              ? `<span style="display: inline-block; margin-top: 6px; padding: 2px 8px; background-color: rgba(220, 38, 38, 0.15); border: 1px solid rgba(220, 38, 38, 0.4); border-radius: 12px; font-size: 10px; font-weight: 700; color: #FCA5A5; text-transform: uppercase;">${escapeHtml(item.badge)}</span>`
              : ""
          }
        </td>
      `,
      )
      .join("");

    detailsGridHtml = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0 28px 0; border-collapse: separate; border-spacing: 8px 0;">
        <tr>
          ${items}
        </tr>
      </table>
    `;
  }

  // Build Callout Box HTML
  let calloutHtml = "";
  if (options.callout) {
    const borderCol = options.callout.type === "gold" ? "#F59E0B" : options.callout.type === "slate" ? "#4B5563" : "#DC2626";
    const bgCol = options.callout.type === "gold" ? "#1A1710" : options.callout.type === "slate" ? "#13161C" : "#1A1214";
    calloutHtml = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 22px 0 26px 0; background-color: ${bgCol}; border: 1px solid #2B2F3D; border-left: 4px solid ${borderCol}; border-radius: 8px;">
        <tr>
          <td style="padding: 18px 20px;">
            ${
              options.callout.title
                ? `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: ${borderCol}; margin-bottom: 6px;">${escapeHtml(options.callout.title)}</div>`
                : ""
            }
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #E2E8F0;">
              ${options.callout.text}
            </div>
          </td>
        </tr>
      </table>
    `;
  }

  // Build Verification Code Box HTML
  let codeBoxHtml = "";
  if (options.codeBox) {
    codeBoxHtml = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0 28px 0; text-align: center;">
        <tr>
          <td align="center">
            <div style="display: inline-block; padding: 18px 36px; background-color: #0E1015; border: 2px dashed #DC2626; border-radius: 12px; text-align: center;">
              <span style="font-family: Consolas, 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #FFFFFF;">
                ${escapeHtml(options.codeBox.code)}
              </span>
              ${
                options.codeBox.caption
                  ? `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #94A3B8; margin-top: 8px; letter-spacing: 0.5px;">${escapeHtml(options.codeBox.caption)}</div>`
                  : ""
              }
            </div>
          </td>
        </tr>
      </table>
    `;
  }

  // Build Primary Action CTA (Bulletproof with Outlook VML fallback)
  let actionHtml = "";
  if (options.primaryAction) {
    const act = options.primaryAction;
    actionHtml = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0 32px 0; text-align: center;">
        <tr>
          <td align="center">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${act.url}" style="height:50px;v-text-anchor:middle;width:280px;" arcsize="16%" stroke="f" fillcolor="#DC2626">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:bold;">${escapeHtml(act.text)} &rarr;</center>
            </v:roundrect>
            <![endif]-->
            <a href="${act.url}" style="mso-hide:all; display: inline-block; background-color: #DC2626; background-image: linear-gradient(135deg, #EF4444 0%, #DC2626 50%, #991B1B 100%); color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 700; line-height: 50px; text-align: center; text-decoration: none; padding: 0 36px; border-radius: 8px; box-shadow: 0 4px 18px rgba(220, 38, 38, 0.4); border: 1px solid #F87171;">
              ${escapeHtml(act.text)} &rarr;
            </a>
            ${
              options.secondaryAction
                ? `<div style="margin-top: 14px;"><a href="${options.secondaryAction.url}" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; color: #94A3B8; text-decoration: underline;">${escapeHtml(options.secondaryAction.text)}</a></div>`
                : ""
            }
          </td>
        </tr>
      </table>
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.5; color: #64748B; word-break: break-all; margin-bottom: 24px;">
        Button not opening? Copy and paste this URL into your browser:<br />
        <a href="${act.url}" style="color: #94A3B8; text-decoration: underline;">${escapeHtml(act.url)}</a>
      </div>
    `;
  }

  // Venue Card HTML
  let venueCardHtml = "";
  if (options.venueCard !== false) {
    venueCardHtml = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0 20px 0; background-color: #0E1015; border: 1px solid #1E232E; border-radius: 10px;">
        <tr>
          <td style="padding: 20px 22px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align: top; width: 36px; padding-right: 14px;">
                  <div style="width: 36px; height: 36px; border-radius: 8px; background-color: #1F242F; text-align: center; line-height: 36px; font-size: 16px;">
                    📍
                  </div>
                </td>
                <td style="vertical-align: top;">
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #EF4444; margin-bottom: 4px;">
                    GATHERING SANCTUARY
                  </div>
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 700; color: #FFFFFF; margin-bottom: 4px;">
                    ${BRAND.venueName}
                  </div>
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.5; color: #94A3B8;">
                    ${BRAND.venueAddress}
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
  }

  // Scripture Anchor Quote HTML
  let scriptureQuoteHtml = "";
  if (options.scriptureQuote !== false) {
    scriptureQuoteHtml = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0 10px 0; border-top: 1px solid #1E232E; padding-top: 24px;">
        <tr>
          <td style="text-align: center; padding: 0 12px;">
            <div style="font-family: Georgia, Cambria, 'Times New Roman', Times, serif; font-size: 15px; font-style: italic; line-height: 1.6; color: #94A3B8; max-width: 480px; margin: 0 auto;">
              &ldquo;${BRAND.scriptureVerse}&rdquo;
            </div>
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #DC2626; margin-top: 8px;">
              ${BRAND.scripture}
            </div>
          </td>
        </tr>
      </table>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${escapeHtml(options.title || headline)}</title>
  <!--[if mso]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; }
      .email-body-cell { padding: 24px 20px !important; }
      .email-header-cell { padding: 28px 20px !important; }
      .stack-col { display: block !important; width: 100% !important; margin-bottom: 8px !important; box-sizing: border-box !important; }
      .hero-title { font-size: 24px !important; line-height: 1.25 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; width: 100% !important; background-color: #07080A; -webkit-font-smoothing: antialiased;">
  <!-- Hidden Preheader Spacing -->
  <div style="display: none; font-size: 1px; color: #07080A; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${escapeHtml(preheader)} &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #07080A; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 32px 12px 48px 12px;">
        <!-- Container Card (Max Width 600px) -->
        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: #12141A; border: 1px solid #222733; border-radius: 14px; overflow: hidden; box-shadow: 0 16px 48px rgba(0,0,0,0.6);">
          
          <!-- Top Accent Ribbon (Crimson to Rose Gradient) -->
          <tr>
            <td style="height: 4px; background-color: #DC2626; background-image: linear-gradient(90deg, #991B1B 0%, #DC2626 40%, #EF4444 70%, #991B1B 100%); font-size: 1px; line-height: 1px;">&nbsp;</td>
          </tr>

          <!-- Header Section -->
          <tr>
            <td class="email-header-cell" style="padding: 36px 36px 20px 36px; text-align: center; border-bottom: 1px solid #1C202A;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <!-- Brand Pill Badge -->
                    <div style="display: inline-block; padding: 4px 14px; background-color: #191D26; border: 1px solid #2D3342; border-radius: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #F87171; margin-bottom: 16px;">
                      ${escapeHtml(badge)}
                    </div>

                    <!-- Brand Title -->
                    <div>
                      <a href="${BRAND.websiteUrl}" target="_blank" style="text-decoration: none; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; display: inline-block;">
                        WONDERS OF WORSHIP
                      </a>
                    </div>
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: #7E8B9F; margin-top: 4px;">
                      THE ANNUAL GATHERING
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td class="email-body-cell" style="padding: 36px 36px 28px 36px;">
              <!-- Hero Headline -->
              <h1 class="hero-title" style="margin: 0 0 14px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 26px; font-weight: 800; line-height: 1.3; color: #FFFFFF; letter-spacing: -0.5px;">
                ${escapeHtml(headline)}
              </h1>

              ${
                leadParagraph
                  ? `<p style="margin: 0 0 22px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #94A3B8;">${escapeHtml(leadParagraph)}</p>`
                  : ""
              }

              <!-- Callout Box if present -->
              ${calloutHtml}

              <!-- Verification Code Box if present -->
              ${codeBoxHtml}

              <!-- Details Grid if present -->
              ${detailsGridHtml}

              <!-- Primary Action CTA Button -->
              ${actionHtml}

              <!-- Dynamic Body Markdown / HTML -->
              ${bodyContent}

              <!-- Venue Anchor Card -->
              ${venueCardHtml}

              <!-- Scripture Anchor -->
              ${scriptureQuoteHtml}
            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td style="padding: 24px 36px 36px 36px; background-color: #0B0D12; border-top: 1px solid #1A1E27; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 600; color: #CBD5E1; margin-bottom: 6px;">
                      ${BRAND.name}
                    </div>
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #64748B; max-width: 440px; margin: 0 auto 14px auto;">
                      ${BRAND.venueAddress}
                    </div>

                    ${
                      options.recipientEmail
                        ? `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; color: #4B5563; margin-bottom: 12px;">This communication was sent to <strong style="color: #64748B;">${escapeHtml(options.recipientEmail)}</strong>.</div>`
                        : ""
                    }

                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; color: #4B5563;">
                      &copy; 2026 ${BRAND.name}. All rights reserved.
                      ${
                        options.unsubscribeUrl
                          ? ` &bull; <a href="${options.unsubscribeUrl}" style="color: #64748B; text-decoration: underline;">Manage Preferences / Unsubscribe</a>`
                          : ""
                      }
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * --------------------------------------------------------------------------------
 * SUPABASE AUTH TEMPLATES (Go template syntax: {{ .ConfirmationURL }}, {{ .Token }})
 * Ready to paste into Supabase Dashboard -> Authentication -> Email Templates
 * --------------------------------------------------------------------------------
 */

/**
 * 1. Supabase Auth: Magic Link / Sign In Template
 */
export function getSupabaseMagicLinkTemplate(): { subject: string; html: string } {
  return {
    subject: "Sign in to WOW Experience Console",
    html: renderRichEmailHtml({
      title: "Sign in to WOW Experience",
      preheader: "Your secure one-click sign in link to the WOW Experience console.",
      badgeText: "SECURITY • ONE-CLICK ACCESS",
      headline: "Your Secure Sign-In Link",
      leadParagraph: "A sign-in request was initiated for your WOW Experience account. Click the button below to enter your console securely without entering your password.",
      callout: {
        type: "crimson",
        title: "SECURITY NOTICE",
        text: "This authentication link is single-use and will automatically expire in <strong>15 minutes</strong>. If you did not request this email, you can safely ignore it.",
      },
      codeBox: {
        code: "{{ .Token }}",
        caption: "Or enter this numeric confirmation code if prompted on your screen",
      },
      primaryAction: {
        text: "Sign In to WOW Console",
        url: "{{ .ConfirmationURL }}",
      },
      venueCard: false,
      scriptureQuote: true,
      recipientEmail: "{{ .Email }}",
    }),
  };
}

/**
 * 2. Supabase Auth: Password Reset Template
 */
export function getSupabasePasswordResetTemplate(): { subject: string; html: string } {
  return {
    subject: "Reset your WOW Experience Password",
    html: renderRichEmailHtml({
      title: "Reset Your Password",
      preheader: "Choose a new secure password for your WOW Experience account.",
      badgeText: "SECURITY • PASSWORD RECOVERY",
      headline: "Reset Your Password",
      leadParagraph: "We received a request to reset the password associated with your WOW Experience account. Click the button below to choose a new password.",
      callout: {
        type: "crimson",
        title: "EXPIRING LINK",
        text: "For your security, this password reset link is valid for <strong>15 minutes</strong>. If you did not initiate this request, your credentials remain secure and no action is required.",
      },
      codeBox: {
        code: "{{ .Token }}",
        caption: "Alternative verification code",
      },
      primaryAction: {
        text: "Choose New Password",
        url: "{{ .ConfirmationURL }}",
      },
      venueCard: false,
      scriptureQuote: true,
      recipientEmail: "{{ .Email }}",
    }),
  };
}

/**
 * 3. Supabase Auth: Invite User / Team Member
 */
export function getSupabaseInviteUserTemplate(): { subject: string; html: string } {
  return {
    subject: "You have been invited to the WOW Experience Team",
    html: renderRichEmailHtml({
      title: "Staff & Workforce Invitation",
      preheader: "You have been invited to collaborate on the WOW Experience platform.",
      badgeText: "TEAM • LEADERSHIP ACCESS",
      headline: "Join the WOW Experience Team",
      leadParagraph: "You have been granted access to join the workforce and administrative team for Wonders of Worship Experience. Click below to accept your invitation and set up your password.",
      callout: {
        type: "gold",
        title: "ACCESS LEVEL GRANTED",
        text: "Your account is authorized to access privileged management consoles, attendee rosters, and worship production tools.",
      },
      primaryAction: {
        text: "Accept Invitation & Join Team",
        url: "{{ .ConfirmationURL }}",
      },
      venueCard: true,
      scriptureQuote: true,
      recipientEmail: "{{ .Email }}",
    }),
  };
}

/**
 * 4. Supabase Auth: Confirm Signup / Email Verification
 */
export function getSupabaseConfirmSignupTemplate(): { subject: string; html: string } {
  return {
    subject: "Confirm your WOW Experience Account",
    html: renderRichEmailHtml({
      title: "Confirm Your Email",
      preheader: "Please verify your email address to complete your account setup.",
      badgeText: "WELCOME • ACCOUNT CONFIRMATION",
      headline: "Verify Your Email Address",
      leadParagraph: "Thank you for creating an account with Wonders of Worship Experience. Please confirm your email address to complete your setup and receive event passes.",
      codeBox: {
        code: "{{ .Token }}",
        caption: "Verification code if requested",
      },
      primaryAction: {
        text: "Confirm My Email Address",
        url: "{{ .ConfirmationURL }}",
      },
      venueCard: true,
      scriptureQuote: true,
      recipientEmail: "{{ .Email }}",
    }),
  };
}

/**
 * 5. Supabase Auth: Change Email Address
 */
export function getSupabaseChangeEmailTemplate(): { subject: string; html: string } {
  return {
    subject: "Confirm your new email address",
    html: renderRichEmailHtml({
      title: "Update Email Address",
      preheader: "Confirm your new email address for WOW Experience.",
      badgeText: "SECURITY • EMAIL UPDATE",
      headline: "Confirm Your New Email Address",
      leadParagraph: "A request was made to update your email address on the WOW Experience platform. Click below to confirm this change.",
      callout: {
        type: "crimson",
        title: "SECURITY CONFIRMATION",
        text: "If you did not request this email change, please contact platform administrators immediately.",
      },
      primaryAction: {
        text: "Confirm New Email Address",
        url: "{{ .ConfirmationURL }}",
      },
      venueCard: false,
      recipientEmail: "{{ .Email }}",
    }),
  };
}

/**
 * --------------------------------------------------------------------------------
 * TRANSACTIONAL IN-APP EMAIL BUILDERS
 * --------------------------------------------------------------------------------
 */

export function renderRsvpEmail(params: {
  firstName: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  venue?: string;
  directionsUrl?: string;
  recipientEmail?: string;
}): string {
  return renderRichEmailHtml({
    title: `You are confirmed for ${params.eventName}`,
    preheader: `Your access pass and gathering details for ${params.eventName}.`,
    badgeText: "CONFIRMED • ATTENDEE PASS",
    headline: `You're Counted In, ${params.firstName}!`,
    leadParagraph: `Your reservation for ${params.eventName} is confirmed. Prepare your heart for an unforgettable atmosphere of consecrated worship.`,
    detailsGrid: [
      { label: "Date", value: params.eventDate },
      { label: "Time", value: params.eventTime },
      { label: "Pass Type", value: "Standard Access", badge: "Confirmed" },
    ],
    callout: {
      type: "crimson",
      title: "ARRIVAL GUIDELINE",
      text: "Doors open 45 minutes prior to commencement. We recommend early arrival for seamless check-in and prayerful preparation.",
    },
    primaryAction: params.directionsUrl
      ? {
          text: "Get Driving Directions",
          url: params.directionsUrl,
        }
      : undefined,
    venueCard: true,
    scriptureQuote: true,
    recipientEmail: params.recipientEmail,
  });
}

export function renderVolunteerEmail(params: {
  firstName: string;
  eventName: string;
  volunteerTeam: string;
  recipientEmail?: string;
}): string {
  return renderRichEmailHtml({
    title: `Volunteer Application Received: ${params.eventName}`,
    preheader: `Thank you for offering your heart and hands to serve at ${params.eventName}.`,
    badgeText: "WORKFORCE • APPLICATION RECEIVED",
    headline: `Thank You for Offering to Serve, ${params.firstName}!`,
    leadParagraph: `We have received your application to serve on the ${params.volunteerTeam} team for ${params.eventName}. Every act of service ministers directly to the Lord and His people.`,
    detailsGrid: [
      { label: "Team Selected", value: params.volunteerTeam },
      { label: "Status", value: "Under Review", badge: "Workforce" },
      { label: "Next Step", value: "Team Lead Contact" },
    ],
    callout: {
      type: "gold",
      title: "WHAT HAPPENS NEXT?",
      text: "Our workforce coordinators are reviewing applications by department. You will receive team briefing schedules and rehearsal timelines shortly.",
    },
    venueCard: true,
    scriptureQuote: true,
    recipientEmail: params.recipientEmail,
  });
}

export function renderCampaignEmail(params: {
  title: string;
  preheader?: string;
  bodyMarkdown: string;
  actionText?: string;
  actionUrl?: string;
  recipientEmail?: string;
}): string {
  return renderRichEmailHtml({
    title: params.title,
    preheader: params.preheader,
    headline: params.title,
    bodyMarkdown: params.bodyMarkdown,
    primaryAction:
      params.actionUrl && params.actionText
        ? {
            text: params.actionText,
            url: params.actionUrl,
          }
        : undefined,
    venueCard: true,
    scriptureQuote: true,
    recipientEmail: params.recipientEmail,
  });
}

