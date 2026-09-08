"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { Drawer } from "@/components/admin/drawer";
import { PageHeader } from "@/components/admin/page-header";
import { articles } from "@/data/articles";
import { galleryAlbums } from "@/data/content";
import { faqs } from "@/data/faqs";
import { ministers } from "@/data/ministers";
import { SITE } from "@/data/site";
import { formatDateTime } from "@/lib/utils";
import type { Article, FaqItem, GalleryAlbum, Minister } from "@/types";

const TABS = ["Articles", "Ministers", "FAQ", "Gallery", "Reusable"] as const;

export default function AdminContentPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Articles");
  const [article, setArticle] = useState<Article | null>(null);
  const [minister, setMinister] = useState<Minister | null>(null);
  const [faq, setFaq] = useState<FaqItem | null>(null);
  const [album, setAlbum] = useState<GalleryAlbum | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const articleCols: DataTableColumn<Article>[] = useMemo(
    () => [
      {
        key: "title",
        header: "Title",
        sortValue: (row) => row.title,
        render: (row) => (
          <button type="button" className="text-left font-semibold" onClick={() => setArticle(row)}>
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
        render: (row) => formatDateTime(row.publishedAt),
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
        <button type="button" className="text-left font-semibold" onClick={() => setMinister(row)}>
          {row.name}
        </button>
      ),
    },
    { key: "role", header: "Role", render: (row) => row.role },
    { key: "featured", header: "Featured", render: (row) => (row.featured ? "Yes" : "No") },
  ];

  const faqCols: DataTableColumn<FaqItem>[] = [
    {
      key: "question",
      header: "Question",
      sortValue: (row) => row.question,
      render: (row) => (
        <button type="button" className="text-left font-semibold" onClick={() => setFaq(row)}>
          {row.question}
        </button>
      ),
    },
    { key: "category", header: "Category", render: (row) => row.category.replaceAll("_", " ") },
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

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Content"
        description="Public copy, ministers, FAQ and gallery pointers. Saves stay in this session."
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
        open={Boolean(article)}
        onClose={() => setArticle(null)}
        title={article?.title ?? "Article"}
        footer={
          <Button
            type="button"
            className="bg-ink text-white hover:bg-ink/90"
            onClick={() => {
              setSaved("Article saved (mock).");
              setArticle(null);
            }}
          >
            Save
          </Button>
        }
        wide
      >
        {article ? (
          <div className="grid gap-4">
            <Field id="a-title" label="Title">
              <TextInput
                id="a-title"
                value={article.title}
                onChange={(event) => setArticle({ ...article, title: event.target.value })}
              />
            </Field>
            <Field id="a-excerpt" label="Excerpt">
              <TextArea
                id="a-excerpt"
                value={article.excerpt}
                onChange={(event) => setArticle({ ...article, excerpt: event.target.value })}
              />
            </Field>
          </div>
        ) : null}
      </Drawer>

      <Drawer open={Boolean(minister)} onClose={() => setMinister(null)} title={minister?.name ?? "Minister"} wide>
        {minister ? (
          <div className="grid gap-4">
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
            <Button
              type="button"
              className="bg-ink text-white hover:bg-ink/90"
              onClick={() => {
                setSaved("Minister saved (mock).");
                setMinister(null);
              }}
            >
              Save
            </Button>
          </div>
        ) : null}
      </Drawer>

      <Drawer open={Boolean(faq)} onClose={() => setFaq(null)} title="FAQ" wide>
        {faq ? (
          <div className="grid gap-4">
            <Field id="f-q" label="Question">
              <TextInput
                id="f-q"
                value={faq.question}
                onChange={(event) => setFaq({ ...faq, question: event.target.value })}
              />
            </Field>
            <Field id="f-a" label="Answer">
              <TextArea
                id="f-a"
                value={faq.answer}
                onChange={(event) => setFaq({ ...faq, answer: event.target.value })}
              />
            </Field>
            <Button
              type="button"
              className="bg-ink text-white hover:bg-ink/90"
              onClick={() => {
                setSaved("FAQ saved (mock).");
                setFaq(null);
              }}
            >
              Save
            </Button>
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
