import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRole) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding.");

const sourcePath = resolve("public/images/WOW EXPERIENCE ATTENDING.png");
const storagePath = "seed/wow-experience-attending-2026.png";
const file = await readFile(sourcePath);
const supabase = createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
const { error: uploadError } = await supabase.storage.from("flyer-templates").upload(storagePath, file, { contentType: "image/png", cacheControl: "31536000", upsert: true });
if (uploadError) throw uploadError;
const imageUrl = supabase.storage.from("flyer-templates").getPublicUrl(storagePath).data.publicUrl;
const config = {
  version: 1,
  baseWidth: 2000,
  baseHeight: 2500,
  photoArea: { shape: "circle", cx: 0.5035, cy: 0.484, r: 0.278 },
  textArea: { x: 0.18, y: 0.72, w: 0.64, h: 0.055, align: "center", fontFamily: "Manrope, Arial, sans-serif", fontWeight: 800, maxFontSize: 74, minFontSize: 28, color: "#ffffff", transform: "uppercase", maxChars: 40, placeholder: "Put your name here" },
};
const { error: rowError } = await supabase.from("flyer_templates").upsert({
  id: "active-attending-flyer",
  name: "WOW Experience 2026 Attending Flyer",
  file_name: basename(sourcePath),
  mime_type: "image/png",
  image_url: imageUrl,
  storage_path: storagePath,
  is_published: true,
  base_width: config.baseWidth,
  base_height: config.baseHeight,
  config_version: config.version,
  config,
  updated_at: new Date().toISOString(),
});
if (rowError) throw rowError;
console.log(`Seeded ${basename(sourcePath)} as the active attending flyer.`);
