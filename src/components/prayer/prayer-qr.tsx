import QRCode from "qrcode";

const LIVE_URL = "https://www.wowexperience.com.ng";

export async function PrayerQr() {
  const base = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || LIVE_URL;
  const target = new URL("/prayer", base).toString();
  const svg = await QRCode.toString(target, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 2,
    color: { dark: "#111111", light: "#ffffff" },
  });

  return (
    <div className="w-full max-w-[210px] rounded-2xl bg-white p-3 shadow-[0_18px_55px_rgba(17,17,17,0.2)]">
      <div
        className="aspect-square w-full [&_svg]:h-full [&_svg]:w-full"
        aria-label="QR code that opens the prayer request form"
        role="img"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}
