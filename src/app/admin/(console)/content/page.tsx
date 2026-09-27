"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { Eye, FileText, HelpCircle, Newspaper, Send, UserPlus } from "lucide-react";
import {
  deleteArticleAction,
  deleteFaqAction,
  deleteMinisterAction,
  saveArticleAction,
  saveFaqAction,
  saveMinisterAction,
  saveNewsletterAction,
} from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Field, SelectInput, TextArea, TextInput } from "@/components/ui/field";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { Drawer } from "@/components/admin/drawer";
import { PageHeader } from "@/components/admin/page-header";
import { useAdminData } from "@/components/admin/admin-data";
import { useEdition } from "@/components/admin/edition-context";
import { galleryAlbums } from "@/data/content";
import { SITE } from "@/data/site";
import { formatDateTime } from "@/lib/utils";
import type { Article, FaqItem, GalleryAlbum, Minister, Newsletter, NewsletterSubscriber } from "@/types";

const TABS = ["Newsletters", "Articles", "Ministers", "FAQ", "Gallery", "Reusable"] as const;

const FAQ_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "venue", label: "Venue" },
  { value: "time", label: "Time" },
  { value: "entry", label: "Entry" },
  { value: "what_to_bring", label: "What to Bring" },
  { value: "children", label: "Children" },
  { value: "accessibility", label: "Accessibility" },
  { value: "parking", label: "Parking" },
  { value: "contact", label: "Contact" },
];

const ARTICLE_CATEGORIES = [
  { value: "Worship", label: "Worship" },
  { value: "Gathering", label: "Gathering" },
  { value: "Service", label: "Service" },
  { value: "Communication", label: "Communication" },
  { value: "General", label: "General" },
];

const emptyNewsletter = (): Partial<Newsletter> => ({
  title: "",
  subject: "",
  excerpt: "",
  body: "",
  status: "draft",
});

const emptyMinister = (editionId: string, order: number): Minister => ({
  id: "",
  editionId,
  name: "",
  role: "",
  bio: "",
  imageSrc: "",
  imageAlt: "",
  featured: true,
  published: false,
  order,
});

const emptyArticle = (): Article => ({
  id: "",
  slug: "",
  title: "",
  excerpt: "",
  body: [],
  coverImageSrc: "",
  coverImageAlt: "",
  author: "Abraham Oyo-Ita",
  authorRole: "Communications lead",
  category: "Worship",
  tags: ["worship", "gathering"],
  status: "published",
  publishedAt: new Date().toISOString(),
  seoTitle: "",
  seoDescription: "",
});

const emptyFaq = (editionId: string, order: number): FaqItem => ({
  id: "",
  editionId,
  category: "general" as FaqItem["category"],
  question: "",
  answer: "",
  order,
});

export default function AdminContentPage() {
  const { edition } = useEdition();
  const { newsletters, newsletterSubscribers, ministers, articles, faqs, refresh } = useAdminData();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Newsletters");
  const [article, setArticle] = useState<Article | null>(null);
  const [articleImage, setArticleImage] = useState<File | null>(null);
  const [articleBodyText, setArticleBodyText] = useState("");
  const [minister, setMinister] = useState<Minister | null>(null);
  const [ministerImage, setMinisterImage] = useState<File | null>(null);
  const [faq, setFaq] = useState<FaqItem | null>(null);
  const [album, setAlbum] = useState<GalleryAlbum | null>(null);
  const [newsletter, setNewsletter] = useState<Partial<Newsletter> | null>(null);
  const [preview, setPreview] = useState<Partial<Newsletter> | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const articleCols: DataTableColumn<Article>[] = useMemo(
    () => [
      {
        key: "title",
        header: "Title",
        sortValue: (row) => row.title,
        render: (row) => (
          <button
            type="button"
            className="text-left font-semibold hover:underline"
            onClick={() => {
              setErrors({});
              setArticleImage(null);
              setArticle(row);
              setArticleBodyText(Array.isArray(row.body) ? row.body.join("\n\n") : String(row.body ?? ""));
            }}
          >
            {row.title}
          </button>
        ),
      },
      { key: "category", header: "Category", render: (row) => row.category },
      { key: "status", header: "Status", render: (row) => row.status },
      {
        key: "published",
        header: "Published",
        sortValue: (row) => row.publishedAt,
        render: (row) => (row.publishedAt ? formatDateTime(row.publishedAt) : "Draft"),
      },
    ],
    [],
  );

  const ministerCols: DataTableColumn<Minister>[] = [
    {
      key: "name",
      header: "Name",
      sortValue: (row) => row.name,
      render: (row) => (
        <button
          type="button"
          className="text-left font-semibold"
          onClick={() => {
            setErrors({});
            setMinisterImage(null);
            setMinister(row);
          }}
        >
          {row.name}
        </button>
      ),
    },
    { key: "role", header: "Role", render: (row) => row.role },
    { key: "published", header: "Published", render: (row) => (row.published ? "Yes" : "Draft") },
    { key: "featured", header: "Homepage", render: (row) => (row.featured ? "Yes" : "No") },
  ];

  const faqCols: DataTableColumn<FaqItem>[] = [
    {
      key: "question",
      header: "Question",
      sortValue: (row) => row.question,
      render: (row) => (
        <button
          type="button"
          className="text-left font-semibold hover:underline"
          onClick={() => {
            setErrors({});
            setFaq(row);
          }}
        >
          {row.question}
        </button>
      ),
    },
    { key: "category", header: "Category", render: (row) => row.category.replaceAll("_", " ") },
    { key: "order", header: "Order", sortValue: (row) => row.order, render: (row) => row.order },
  ];

  const albumCols: DataTableColumn<GalleryAlbum>[] = [
    {
      key: "title",
      header: "Album",
      sortValue: (row) => row.title,
      render: (row) => (
        <button type="button" className="text-left font-semibold" onClick={() => setAlbum(row)}>
          {row.title}
        </button>
      ),
    },
    {
      key: "photos",
      header: "Photos",
      sortValue: (row) => row.photoCount,
      render: (row) => row.photoCount,
    },
    { key: "aspect", header: "Aspect", render: (row) => row.aspect },
  ];

  const newsletterCols: DataTableColumn<Newsletter>[] = [
    {
      key: "title",
      header: "Newsletter",
      sortValue: (row) => row.title,
      render: (row) => (
        <button type="button" className="text-left font-semibold" onClick={() => setNewsletter(row)}>
          {row.title}
        </button>
      ),
    },
    { key: "status", header: "Status", render: (row) => row.status },
    { key: "subject", header: "Subject", render: (row) => row.subject },
    {
      key: "published",
      header: "Published",
      sortValue: (row) => row.publishedAt ?? "",
      render: (row) => (row.publishedAt ? formatDateTime(row.publishedAt) : "Not published"),
    },
  ];

  const subscriberCols: DataTableColumn<NewsletterSubscriber>[] = [
    { key: "email", header: "Subscriber", render: (row) => row.email },
    { key: "status", header: "Status", render: (row) => row.status },
    { key: "source", header: "Source", render: (row) => row.source },
    {
      key: "subscribed",
      header: "Subscribed",
      sortValue: (row) => row.subscribedAt,
      render: (row) => formatDateTime(row.subscribedAt),
    },
  ];

  const saveNewsletter = (publish: boolean) => {
    if (!newsletter) return;
    setErrors({});
    setSaved(null);
    startTransition(async () => {
      const result = await saveNewsletterAction({ ...newsletter, publish });
      if (result.status === "success") {
        setSaved(publish ? "Newsletter published and broadcast queued." : "Newsletter saved.");
        setNewsletter(null);
        await refresh();
        return;
      }
      if ("errors" in result && Array.isArray(result.errors)) {
        setErrors(Object.fromEntries(result.errors.map((error) => [error.field, error.message])));
        return;
      }
      setSaved(result.message ?? "Newsletter could not be saved.");
    });
  };

  const saveMinister = () => {
    if (!minister) return;
    setErrors({});
    setSaved(null);
    const formData = new FormData();
    if (minister.id) formData.set("id", minister.id);
    formData.set("editionId", minister.editionId);
    formData.set("name", minister.name);
    formData.set("role", minister.role);
    formData.set("bio", minister.bio);
    formData.set("imageSrc", minister.imageSrc);
    formData.set("imageAlt", minister.imageAlt);
    formData.set("featured", String(minister.featured));
    formData.set("published", String(Boolean(minister.published)));
    formData.set("order", String(minister.order));
    if (ministerImage) formData.set("image", ministerImage);

    startTransition(async () => {
      const result = await saveMinisterAction(formData);
      if (result.status === "success") {
        setSaved(
          result.data.published
            ? "Minister saved and published."
            : "Minister saved as a draft.",
        );
        setMinister(null);
        setMinisterImage(null);
        await refresh();
        return;
      }
      if ("errors" in result && Array.isArray(result.errors)) {
        setErrors(Object.fromEntries(result.errors.map((error) => [error.field, error.message])));
        return;
      }
      setSaved(result.message ?? "Minister could not be saved.");
    });
  };

  const deleteMinister = (id: string) => {
    if (!id) return;
    setErrors({});
    setSaved(null);
    startTransition(async () => {
      const result = await deleteMinisterAction(id);
      if (result.status === "success") {
        setSaved("Minister removed.");
        setMinister(null);
        setMinisterImage(null);
        await refresh();
      } else {
        setSaved(result.message ?? "Could not delete minister.");
      }
    });
  };

  const saveArticle = () => {
    if (!article) return;
    setErrors({});
    setSaved(null);
    const formData = new FormData();
    if (article.id) formData.set("id", article.id);
    formData.set("slug", article.slug);
    formData.set("title", article.title);
    formData.set("excerpt", article.excerpt);
    formData.set("body", articleBodyText);
    formData.set("author", article.author);
    formData.set("authorRole", article.authorRole);
    formData.set("category", article.category);
    formData.set("tags", Array.isArray(article.tags) ? article.tags.join(",") : "");
    formData.set("status", article.status);
    formData.set("publishedAt", article.publishedAt || new Date().toISOString());
    formData.set("seoTitle", article.seoTitle);
    formData.set("seoDescription", article.seoDescription);
    formData.set("coverImageSrc", article.coverImageSrc);
    formData.set("coverImageAlt", article.coverImageAlt);
    if (articleImage) formData.set("image", articleImage);

    startTransition(async () => {
      const result = await saveArticleAction(formData);
      if (result.status === "success") {
        setSaved(
          result.data.status === "published"
            ? "Article saved and published to Insights."
            : "Article saved as draft.",
        );
        setArticle(null);
        setArticleImage(null);
        setArticleBodyText("");
        await refresh();
        return;
      }
      if ("errors" in result && Array.isArray(result.errors)) {
        setErrors(Object.fromEntries(result.errors.map((error) => [error.field, error.message])));
        return;
      }
      setSaved(result.message ?? "Article could not be saved.");
    });
  };

  const deleteArticle = (id: string) => {
    if (!id) return;
    setErrors({});
    setSaved(null);
    startTransition(async () => {
      const result = await deleteArticleAction(id);
      if (result.status === "success") {
        setSaved("Article deleted.");
        setArticle(null);
        setArticleImage(null);
        setArticleBodyText("");
        await refresh();
      } else {
        setSaved(result.message ?? "Could not delete article.");
      }
    });
  };

  const saveFaq = () => {
    if (!faq) return;
    setErrors({});
    setSaved(null);
    const formData = new FormData();
    if (faq.id) formData.set("id", faq.id);
    if (faq.editionId) formData.set("editionId", faq.editionId);
    formData.set("category", faq.category);
    formData.set("question", faq.question);
    formData.set("answer", faq.answer);
    formData.set("order", String(faq.order));

    startTransition(async () => {
      const result = await saveFaqAction(formData);
      if (result.status === "success") {
        setSaved("FAQ saved.");
        setFaq(null);
        await refresh();
        return;
      }
      if ("errors" in result && Array.isArray(result.errors)) {
        setErrors(Object.fromEntries(result.errors.map((error) => [error.field, error.message])));
        return;
      }
      setSaved(result.message ?? "FAQ could not be saved.");
    });
  };

  const deleteFaq = (id: string) => {
    if (!id) return;
    setErrors({});
    setSaved(null);
    startTransition(async () => {
      const result = await deleteFaqAction(id);
      if (result.status === "success") {
        setSaved("FAQ deleted.");
        setFaq(null);
        await refresh();
      } else {
        setSaved(result.message ?? "Could not delete FAQ.");
      }
    });
  };

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Content"
        description="Newsletters, public copy, ministers, FAQ and gallery pointers."
        actions={
          tab === "Ministers" ? (
            <Button
              type="button"
              className="bg-red text-white hover:bg-red-deep"
              onClick={() => {
                setErrors({});
                setMinisterImage(null);
                setMinister(emptyMinister(edition.id, ministers.length + 1));
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
              New minister
            </Button>
          ) : tab === "Articles" ? (
            <Button
              type="button"
              className="bg-red text-white hover:bg-red-deep"
              onClick={() => {
                setErrors({});
                setArticleImage(null);
                setArticle(emptyArticle());
                setArticleBodyText("");
              }}
            >
              <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
              New article
            </Button>
          ) : tab === "FAQ" ? (
            <Button
              type="button"
              className="bg-red text-white hover:bg-red-deep"
              onClick={() => {
                setErrors({});
                setFaq(emptyFaq(edition.id, faqs.length + 1));
              }}
            >
              <HelpCircle className="mr-2 h-4 w-4" aria-hidden="true" />
              New FAQ
            </Button>
          ) : (
            <Button
              type="button"
              className="bg-red text-white hover:bg-red-deep"
              onClick={() => setNewsletter(emptyNewsletter())}
            >
              <Newspaper className="mr-2 h-4 w-4" aria-hidden="true" />
              New newsletter
            </Button>
          )
        }
      />
      {saved ? (
        <p className="border border-border bg-white px-4 py-3 text-sm" role="status">
          {saved}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            className={`px-3 py-2 text-sm ${
              tab === item ? "border-b-2 border-red font-semibold text-ink" : "text-muted"
            }`}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Newsletters" ? (
        <div className="grid gap-6">
          <DataTable columns={newsletterCols} rows={newsletters} searchPlaceholder="Search newsletters" />
          <div className="grid gap-3">
            <h2 className="text-base font-semibold text-ink">Subscribers</h2>
            <DataTable
              columns={subscriberCols}
              rows={newsletterSubscribers}
              searchPlaceholder="Search subscribers"
              searchFilter={(row, q) => `${row.email} ${row.name ?? ""}`.toLowerCase().includes(q)}
            />
          </div>
        </div>
      ) : null}
      {tab === "Articles" ? (
        <DataTable columns={articleCols} rows={articles} searchPlaceholder="Search articles" />
      ) : null}
      {tab === "Ministers" ? (
        <DataTable columns={ministerCols} rows={ministers} searchPlaceholder="Search ministers" />
      ) : null}
      {tab === "FAQ" ? (
        <DataTable columns={faqCols} rows={faqs} searchPlaceholder="Search questions" />
      ) : null}
      {tab === "Gallery" ? (
        <DataTable columns={albumCols} rows={galleryAlbums} searchPlaceholder="Search albums" />
      ) : null}
      {tab === "Reusable" ? (
        <dl className="grid gap-3 border border-border bg-white p-4 text-sm">
          <div>
            <dt className="text-muted">Organization</dt>
            <dd className="font-semibold">{SITE.organizationName}</dd>
          </div>
          <div>
            <dt className="text-muted">Contact email</dt>
            <dd>{SITE.contactEmail}</dd>
          </div>
          <div>
            <dt className="text-muted">Display WhatsApp</dt>
            <dd>{SITE.whatsappDisplay}</dd>
          </div>
          <div>
            <dt className="text-muted">Policy version</dt>
            <dd>{SITE.policyVersion}</dd>
          </div>
        </dl>
      ) : null}

      <Drawer
        open={Boolean(newsletter)}
        onClose={() => setNewsletter(null)}
        title={newsletter?.id ? "Edit newsletter" : "Create newsletter"}
        footer={
          <div className="flex flex-wrap justify-between gap-2">
            <Button type="button" variant="ghost" onClick={() => setPreview(newsletter)}>
              <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
              Preview
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outlineDark" disabled={isPending} onClick={() => saveNewsletter(false)}>
                Save draft
              </Button>
              <Button type="button" className="bg-red text-white hover:bg-red-deep" disabled={isPending} onClick={() => saveNewsletter(true)}>
                <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                Publish
              </Button>
            </div>
          </div>
        }
        wide
      >
        {newsletter ? (
          <div className="grid gap-4">
            <Field id="n-title" label="Title" error={errors.title}>
              <TextInput
                id="n-title"
                value={newsletter.title ?? ""}
                error={errors.title}
                onChange={(event) => setNewsletter({ ...newsletter, title: event.target.value })}
              />
            </Field>
            <Field id="n-subject" label="Subject" error={errors.subject}>
              <TextInput
                id="n-subject"
                value={newsletter.subject ?? ""}
                error={errors.subject}
                onChange={(event) => setNewsletter({ ...newsletter, subject: event.target.value })}
              />
            </Field>
            <Field id="n-excerpt" label="Excerpt" optional>
              <TextArea
                id="n-excerpt"
                value={newsletter.excerpt ?? ""}
                onChange={(event) => setNewsletter({ ...newsletter, excerpt: event.target.value })}
              />
            </Field>
            <Field id="n-body" label="Body" error={errors.body}>
              <TextArea
                id="n-body"
                className="min-h-64"
                value={newsletter.body ?? ""}
                error={errors.body}
                onChange={(event) => setNewsletter({ ...newsletter, body: event.target.value })}
              />
            </Field>
          </div>
        ) : null}
      </Drawer>

      <Drawer open={Boolean(preview)} onClose={() => setPreview(null)} title={preview?.title ?? "Preview"} wide>
        {preview ? (
          <article className="prose prose-sm max-w-none">
            <p className="text-sm font-semibold text-muted">{preview.subject}</p>
            <h1 className="font-display text-3xl font-bold">{preview.title}</h1>
            {preview.excerpt ? <p className="text-muted">{preview.excerpt}</p> : null}
            <div className="whitespace-pre-wrap text-sm leading-7 text-ink">{preview.body}</div>
          </article>
        ) : null}
      </Drawer>

      {/* Article Drawer */}
      <Drawer
        open={Boolean(article)}
        onClose={() => {
          setArticle(null);
          setArticleImage(null);
          setArticleBodyText("");
        }}
        title={article?.id ? "Edit article" : "New article"}
        wide
      >
        {article ? (
          <div className="grid gap-4">
            <Field id="a-title" label="Title" error={errors.title}>
              <TextInput
                id="a-title"
                value={article.title}
                error={errors.title}
                onChange={(event) => setArticle({ ...article, title: event.target.value })}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="a-slug" label="URL Slug" hint="Leave blank to auto-generate from title.">
                <TextInput
                  id="a-slug"
                  value={article.slug}
                  placeholder="e.g. why-we-gather"
                  onChange={(event) => setArticle({ ...article, slug: event.target.value })}
                />
              </Field>
              <Field id="a-category" label="Category">
                <SelectInput
                  id="a-category"
                  value={article.category}
                  options={ARTICLE_CATEGORIES}
                  onValueChange={(val) => setArticle({ ...article, category: val })}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="a-author" label="Author">
                <TextInput
                  id="a-author"
                  value={article.author}
                  onChange={(event) => setArticle({ ...article, author: event.target.value })}
                />
              </Field>
              <Field id="a-role" label="Author role">
                <TextInput
                  id="a-role"
                  value={article.authorRole}
                  onChange={(event) => setArticle({ ...article, authorRole: event.target.value })}
                />
              </Field>
            </div>
            <Field id="a-excerpt" label="Excerpt" hint="One or two sentences summarizing the article.">
              <TextArea
                id="a-excerpt"
                value={article.excerpt}
                className="min-h-20"
                onChange={(event) => setArticle({ ...article, excerpt: event.target.value })}
              />
            </Field>
            <Field id="a-body" label="Article Body" hint="Separate paragraphs with a blank line.">
              <TextArea
                id="a-body"
                className="min-h-56 font-mono text-sm leading-relaxed"
                value={articleBodyText}
                onChange={(event) => setArticleBodyText(event.target.value)}
              />
            </Field>
            {article.coverImageSrc ? (
              <div className="relative aspect-[16/10] w-full max-w-sm overflow-hidden rounded-md border border-border bg-paper">
                <Image
                  src={article.coverImageSrc}
                  alt={article.coverImageAlt || article.title}
                  fill
                  sizes="384px"
                  className="object-cover"
                />
              </div>
            ) : null}
            <Field
              id="a-image"
              label="Cover Image"
              hint={articleImage ? `Selected: ${articleImage.name}` : "Upload JPG, PNG, or WebP. Up to 5 MB."}
              error={errors.image}
            >
              <input
                id="a-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-invalid={Boolean(errors.image)}
                aria-describedby={errors.image ? "a-image-error" : "a-image-hint"}
                className="w-full rounded-md border border-border bg-white px-3 py-3 text-sm text-ink file:mr-3 file:rounded-sm file:border-0 file:bg-paper file:px-3 file:py-2 file:font-semibold"
                onChange={(event) => setArticleImage(event.target.files?.[0] ?? null)}
              />
            </Field>
            <Field id="a-alt" label="Image Alt Description">
              <TextInput
                id="a-alt"
                value={article.coverImageAlt}
                placeholder="A description for screen readers"
                onChange={(event) => setArticle({ ...article, coverImageAlt: event.target.value })}
              />
            </Field>
            <Field id="a-tags" label="Tags" hint="Comma-separated (e.g. worship, wonder, gathering)">
              <TextInput
                id="a-tags"
                value={Array.isArray(article.tags) ? article.tags.join(", ") : ""}
                onChange={(event) =>
                  setArticle({
                    ...article,
                    tags: event.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
              />
            </Field>
            <label className="flex items-start gap-3 rounded-md border border-border bg-white p-4 text-sm text-ink">
              <input
                type="checkbox"
                checked={article.status === "published"}
                onChange={(event) =>
                  setArticle({
                    ...article,
                    status: event.target.checked ? "published" : "draft",
                  })
                }
                className="mt-0.5 h-4 w-4 accent-red"
              />
              <span>
                <span className="block font-semibold">Published on Insights</span>
                <span className="mt-1 block text-muted">When checked, the article is publicly visible to all visitors.</span>
              </span>
            </label>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              {article.id ? (
                <Button
                  type="button"
                  variant="outlineDark"
                  disabled={isPending}
                  onClick={() => deleteArticle(article.id)}
                  className="text-red border-red/30 hover:bg-red/10"
                >
                  Delete article
                </Button>
              ) : <div />}
              <Button
                type="button"
                className="bg-ink text-white hover:bg-ink/90"
                disabled={isPending}
                onClick={saveArticle}
              >
                {isPending ? "Saving..." : "Save article"}
              </Button>
            </div>
          </div>
        ) : null}
      </Drawer>

      {/* Minister Drawer */}
      <Drawer
        open={Boolean(minister)}
        onClose={() => {
          setMinister(null);
          setMinisterImage(null);
        }}
        title={minister?.name || "New minister"}
        wide
      >
        {minister ? (
          <div className="grid gap-4">
            <Field id="mn-name" label="Name" error={errors.name}>
              <TextInput
                id="mn-name"
                value={minister.name}
                error={errors.name}
                onChange={(event) => setMinister({ ...minister, name: event.target.value })}
              />
            </Field>
            <Field id="mn-role" label="Role">
              <TextInput
                id="mn-role"
                value={minister.role}
                onChange={(event) => setMinister({ ...minister, role: event.target.value })}
              />
            </Field>
            <Field id="mn-bio" label="Bio">
              <TextArea
                id="mn-bio"
                value={minister.bio}
                onChange={(event) => setMinister({ ...minister, bio: event.target.value })}
              />
            </Field>
            {minister.imageSrc ? (
              <div className="relative aspect-[3/4] w-full max-w-64 overflow-hidden rounded-md border border-border bg-paper">
                <Image
                  src={minister.imageSrc}
                  alt={minister.imageAlt || `Portrait of ${minister.name}`}
                  fill
                  sizes="256px"
                  className="object-cover"
                />
              </div>
            ) : null}
            <Field
              id="mn-image"
              label="Portrait"
              hint={ministerImage ? `Selected: ${ministerImage.name}` : "JPG, PNG, or WebP. Maximum 5 MB."}
              error={errors.image}
            >
              <input
                id="mn-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-invalid={Boolean(errors.image)}
                aria-describedby={errors.image ? "mn-image-error" : "mn-image-hint"}
                className="w-full rounded-md border border-border bg-white px-3 py-3 text-sm text-ink file:mr-3 file:rounded-sm file:border-0 file:bg-paper file:px-3 file:py-2 file:font-semibold"
                onChange={(event) => setMinisterImage(event.target.files?.[0] ?? null)}
              />
            </Field>
            <Field id="mn-alt" label="Image description" hint="Used by screen readers.">
              <TextInput
                id="mn-alt"
                value={minister.imageAlt}
                placeholder={minister.name ? `Portrait of ${minister.name}` : "Portrait description"}
                onChange={(event) => setMinister({ ...minister, imageAlt: event.target.value })}
              />
            </Field>
            <Field id="mn-order" label="Display order" error={errors.order}>
              <TextInput
                id="mn-order"
                type="number"
                min={1}
                max={1000}
                value={minister.order}
                error={errors.order}
                onChange={(event) => setMinister({ ...minister, order: Number(event.target.value) })}
              />
            </Field>
            <label className="flex items-start gap-3 rounded-md border border-border bg-white p-4 text-sm text-ink">
              <input
                type="checkbox"
                checked={minister.featured}
                onChange={(event) => setMinister({ ...minister, featured: event.target.checked })}
                className="mt-0.5 h-4 w-4 accent-red"
              />
              <span>
                <span className="block font-semibold">Show on homepage</span>
                <span className="mt-1 block text-muted">The profile appears in the homepage section after it is published.</span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-md border border-border bg-white p-4 text-sm text-ink">
              <input
                type="checkbox"
                checked={Boolean(minister.published)}
                onChange={(event) => setMinister({ ...minister, published: event.target.checked })}
                className="mt-0.5 h-4 w-4 accent-red"
              />
              <span>
                <span className="block font-semibold">Published and confirmed</span>
                <span className="mt-1 block text-muted">Leave this off until the minister is confirmed.</span>
              </span>
            </label>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              {minister.id ? (
                <Button
                  type="button"
                  variant="outlineDark"
                  disabled={isPending}
                  onClick={() => deleteMinister(minister.id)}
                  className="text-red border-red/30 hover:bg-red/10"
                >
                  Delete minister
                </Button>
              ) : <div />}
              <Button
                type="button"
                className="bg-ink text-white hover:bg-ink/90"
                disabled={isPending}
                onClick={saveMinister}
              >
                {isPending ? "Saving..." : "Save minister"}
              </Button>
            </div>
          </div>
        ) : null}
      </Drawer>

      {/* FAQ Drawer */}
      <Drawer
        open={Boolean(faq)}
        onClose={() => setFaq(null)}
        title={faq?.id ? "Edit FAQ" : "New FAQ"}
        wide
      >
        {faq ? (
          <div className="grid gap-4">
            <Field id="f-category" label="Category">
              <SelectInput
                id="f-category"
                value={faq.category}
                options={FAQ_CATEGORIES}
                onValueChange={(val) => setFaq({ ...faq, category: val as FaqItem["category"] })}
              />
            </Field>
            <Field id="f-q" label="Question" error={errors.question}>
              <TextInput
                id="f-q"
                value={faq.question}
                error={errors.question}
                onChange={(event) => setFaq({ ...faq, question: event.target.value })}
              />
            </Field>
            <Field id="f-a" label="Answer" error={errors.answer}>
              <TextArea
                id="f-a"
                className="min-h-36"
                value={faq.answer}
                error={errors.answer}
                onChange={(event) => setFaq({ ...faq, answer: event.target.value })}
              />
            </Field>
            <Field id="f-order" label="Display order">
              <TextInput
                id="f-order"
                type="number"
                min={1}
                max={100}
                value={faq.order}
                onChange={(event) => setFaq({ ...faq, order: Number(event.target.value) })}
              />
            </Field>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              {faq.id ? (
                <Button
                  type="button"
                  variant="outlineDark"
                  disabled={isPending}
                  onClick={() => deleteFaq(faq.id)}
                  className="text-red border-red/30 hover:bg-red/10"
                >
                  Delete FAQ
                </Button>
              ) : <div />}
              <Button
                type="button"
                className="bg-ink text-white hover:bg-ink/90"
                disabled={isPending}
                onClick={saveFaq}
              >
                {isPending ? "Saving..." : "Save FAQ"}
              </Button>
            </div>
          </div>
        ) : null}
      </Drawer>

      <Drawer open={Boolean(album)} onClose={() => setAlbum(null)} title={album?.title ?? "Album"}>
        {album ? (
          <div className="grid gap-4">
            <p className="text-sm text-muted">{album.description}</p>
            <Button
              type="button"
              variant="outlineDark"
              onClick={() => {
                setSaved("Album note saved (mock).");
                setAlbum(null);
              }}
            >
              Save
            </Button>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
