import { getPublishedFlyerAction } from "@/actions/public";
import { getAdminFlyerTemplateAction, prepareFlyerTemplateUploadAction, publishFlyerTemplateAction, unpublishFlyerTemplateAction } from "@/actions/admin";
import { createClient } from "@/lib/supabase/client";
import { parseFlyerTemplateConfig, type FlyerTemplateConfig } from "@/lib/flyer-template";

export type PublishedFlyerTemplate = {
  id: string;
  name: string;
  fileName: string;
  mimeType: string;
  imageUrl: string;
  storagePath?: string | null;
  published: boolean;
  updatedAt: string;
  config: FlyerTemplateConfig;
};

function parseTemplate(value: Awaited<ReturnType<typeof getPublishedFlyerAction>>): PublishedFlyerTemplate | null {
  if (!value) return null;
  return { ...value, config: parseFlyerTemplateConfig(value.config) };
}

export async function getPublishedFlyerTemplate() {
  return parseTemplate(await getPublishedFlyerAction());
}

export async function getAdminFlyerTemplate() {
  return parseTemplate(await getAdminFlyerTemplateAction());
}

export async function savePublishedFlyerTemplate(input: { name: string; file?: File; storagePath?: string; fileName?: string; mimeType?: string; config: FlyerTemplateConfig }) {
  let storagePath = input.storagePath;
  let fileName = input.fileName;
  let mimeType = input.mimeType;
  if (input.file) {
    const prepared = await prepareFlyerTemplateUploadAction({ fileName: input.file.name, mimeType: input.file.type, size: input.file.size });
    if (prepared.status !== "success") throw new Error(prepared.message);
    const supabase = createClient();
    const { error } = await supabase.storage.from("flyer-templates").uploadToSignedUrl(prepared.path, prepared.token, input.file, { contentType: input.file.type });
    if (error) throw new Error(`Storage error: ${error.message}`);
    storagePath = prepared.path;
    fileName = input.file.name;
    mimeType = input.file.type;
  }
  if (!storagePath || !fileName || !mimeType) throw new Error("Upload a flyer design before saving.");
  const result = await publishFlyerTemplateAction({ name: input.name, fileName, mimeType, storagePath, config: input.config });
  if (result.status !== "success") throw new Error(result.message);
  return { ...result.data, config: parseFlyerTemplateConfig(result.data.config) };
}

export async function unpublishFlyerTemplate() {
  const result = await unpublishFlyerTemplateAction();
  if (result.status !== "success") throw new Error(result.message);
}
