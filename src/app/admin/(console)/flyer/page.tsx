"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { CheckCircle2, Eye, Upload, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { PageHeader, Surface } from "@/components/admin/page-header";
import {
  getAdminFlyerTemplate,
  savePublishedFlyerTemplate,
  unpublishFlyerTemplate,
  type PublishedFlyerTemplate,
} from "@/lib/flyer-template-store";
import { formatDateTime } from "@/lib/utils";

export default function AdminFlyerPage() {
  const [asset, setAsset] = useState<PublishedFlyerTemplate | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState("WOW 2026 Main Attending Flyer");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const previewUrl = useMemo(() => {
    if (selectedFile) return URL.createObjectURL(selectedFile);
    if (asset?.imageUrl) return asset.imageUrl;
    if (asset?.blob) return URL.createObjectURL(asset.blob);
    return null;
  }, [asset?.blob, asset?.imageUrl, selectedFile]);

  useEffect(() => {
    void getAdminFlyerTemplate().then((item) => {
      if (!item) return;
      setAsset(item);
      setTemplateName(item.name);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const publish = async () => {
    if (!selectedFile) {
      setMessage("Upload the main attending flyer first.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const next = await savePublishedFlyerTemplate({
        name: templateName,
        file: selectedFile,
      });
      setAsset(next);
      setSelectedFile(null);
      setMessage("Main attending flyer uploaded to Supabase Storage and published to the flyer studio.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not publish the flyer. Try a smaller PNG or JPG file.");
    } finally {
      setSaving(false);
    }
  };

  const unpublish = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await unpublishFlyerTemplate();
      setAsset((prev) => (prev ? { ...prev, published: false } : null));
      setSelectedFile(null);
      setMessage("Main attending flyer unpublished.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not unpublish the flyer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Attending Flyer"
        description="Upload and publish the main attending flyer template used by the public flyer generator."
        actions={
          <Button href="/flyer" variant="outlineDark">
            <Eye className="mr-2 h-4 w-4" aria-hidden />
            View public flyer
          </Button>
        }
      />

      {message ? (
        <p className="border border-border bg-white px-4 py-3 text-sm" role="status">
          {message}
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Surface title="Template status">
          <div className="grid gap-4">
            <div className="flex items-center gap-3">
              {asset?.published ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden />
              ) : (
                <XCircle className="h-5 w-5 text-muted" aria-hidden />
              )}
              <div>
                <p className="font-semibold text-ink">
                  {asset?.published ? "Published to Cloud Storage" : "No flyer published yet"}
                </p>
                <p className="text-sm text-muted">
                  {asset?.published
                    ? `${asset.fileName} / ${formatDateTime(asset.updatedAt)}`
                    : "Upload the final design when it is ready."}
                </p>
              </div>
            </div>

            <Field id="flyer-template-name" label="Template name">
              <TextInput
                id="flyer-template-name"
                value={templateName}
                onChange={(event) => setTemplateName(event.target.value)}
              />
            </Field>

            <Field
              id="main-attending-flyer"
              label="Main attending flyer file"
              hint="Best format: transparent PNG frame at 1080 x 1350. A JPG/PNG full design can also be previewed."
            >
              <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-red/40 bg-red-soft px-4 py-5 text-center text-sm font-semibold text-red-deep transition hover:bg-white">
                <Upload className="h-5 w-5" aria-hidden />
                <span>{selectedFile ? selectedFile.name : "Upload main attending flyer"}</span>
                <input
                  id="main-attending-flyer"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setSelectedFile(file);
                    if (file) setMessage("Preview ready. Publish when you are satisfied.");
                  }}
                />
              </label>
            </Field>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="bg-red text-white hover:bg-red-deep"
                disabled={saving}
                onClick={() => void publish()}
              >
                Publish flyer
              </Button>
              <Button
                type="button"
                variant="outlineDark"
                disabled={saving || !asset?.published}
                onClick={() => void unpublish()}
              >
                Unpublish
              </Button>
            </div>

            <p className="text-xs leading-relaxed text-muted">
              Flyer templates are securely uploaded to Supabase Storage and served to all public visitors on the flyer studio.
            </p>
          </div>
        </Surface>

        <Surface title="Preview">
          {previewUrl ? (
            <div className="flex justify-center bg-ink p-4">
              <Image
                src={previewUrl}
                alt="Main attending flyer preview"
                width={432}
                height={540}
                unoptimized
                className="h-auto max-h-[640px] w-auto max-w-full bg-white object-contain"
              />
            </div>
          ) : (
            <div className="flex min-h-96 items-center justify-center border border-dashed border-border bg-paper p-6 text-center text-sm text-muted">
              The flyer preview will appear here after upload.
            </div>
          )}
        </Surface>
      </div>
    </div>
  );
}
