import Link from "next/link";
import { Wordmark } from "@/components/site/wordmark";
import { SITE } from "@/data/editions";
import { footerNav } from "@/lib/nav";

export function SiteFooter() {
  return (
    <footer className="bg-red-deep text-white">
      <div className="container-site grid gap-12 py-16 md:grid-cols-[1.2fr_2fr]">
        <div>
          <Wordmark inverted />
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/75">
            A gathering for worship, the word and response. Wonders of Worship
            Experience is planned as an annual edition, not a disposable event
            website.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          <FooterCol title="Visit" links={footerNav.visit} />
          <FooterCol title="Serve" links={footerNav.serve} />
          <FooterCol title="Contact" links={footerNav.legal} />
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="container-site flex flex-col gap-4 py-6 text-sm text-white/70 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {SITE.organizationName}</p>
          <div className="flex gap-5">
            <a href={SITE.social.instagram}>Instagram</a>
            <a href={SITE.social.youtube}>YouTube</a>
            <a href={SITE.social.x}>X</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-4 grid gap-2 text-sm text-white/75">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
