import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { PageShell } from '@/components/ui';
import { LEGAL, legalLinks } from '@/lib/legal';

type Section = { id: string; label: string };

export default function LegalPage({
  title,
  description,
  currentHref,
  sections,
  children,
}: {
  title: string;
  description?: string;
  currentHref: string;
  sections?: Section[];
  children: ReactNode;
}) {
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <nav aria-label="Хлебные крошки" className="text-sm text-content-muted">
          <Link href="/" className="hover:text-content-primary">
            Главная
          </Link>
          <span aria-hidden="true"> / </span>
          <Link href="/legal" className="hover:text-content-primary">
            Документы
          </Link>
          <span aria-hidden="true"> / </span>
          <span className="text-content-secondary">{title}</span>
        </nav>

        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="space-y-5 lg:sticky lg:top-[88px]">
            <div className="surface-card rounded-lg p-4">
              <p className="eyebrow">Юридические документы</p>
              <nav aria-label="Юридические документы" className="mt-3">
                <ul className="space-y-1">
                  {legalLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        aria-current={link.href === currentHref ? 'page' : undefined}
                        className="block rounded-lg px-2.5 py-2 text-sm text-content-secondary transition-colors hover:bg-surface-veil hover:text-content-primary aria-[current=page]:bg-accent-soft aria-[current=page]:font-semibold aria-[current=page]:text-accent-text"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {sections && sections.length > 0 && (
              <div className="surface-card rounded-lg p-4">
                <p className="eyebrow">На этой странице</p>
                <ul className="mt-3 space-y-1.5">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="block text-sm text-content-secondary hover:text-accent-text"
                      >
                        {section.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="surface-card rounded-lg p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-content-primary">
                <Mail className="h-4 w-4 text-accent-text" aria-hidden="true" />
                Вопросы по данным
              </p>
              <p className="mt-2 text-sm text-content-secondary">
                Напишите на{' '}
                <a className="font-medium text-accent-text underline underline-offset-2" href={`mailto:${LEGAL.privacyEmail}`}>
                  {LEGAL.privacyEmail}
                </a>
                . Отвечаем в течение 10 рабочих дней.
              </p>
            </div>

            <div className="surface-card rounded-lg p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-content-primary">
                <ShieldCheck className="h-4 w-4 text-success-text" aria-hidden="true" />
                Бесплатная платформа
              </p>
              <p className="mt-2 text-sm text-content-secondary">
                ФРИПЕТ не берёт комиссию и не принимает платежи за передачу животных.
              </p>
            </div>
          </aside>

          <article className="min-w-0">
            <Link href="/legal" className="btn btn-ghost btn-sm -ml-2 mb-5">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Все документы
            </Link>

            <header className="max-w-3xl">
              <h1 className="display-title text-3xl sm:text-4xl">{title}</h1>
              {description && <p className="lede mt-3 text-base">{description}</p>}
              <p className="mt-4 text-sm text-content-muted">
                Редакция от {LEGAL.updatedAt}. Действует для сайта{' '}
                <span className="whitespace-nowrap">{LEGAL.siteUrl}</span>.
              </p>
            </header>

            <div className="legal-prose mt-8 max-w-3xl">{children}</div>
          </article>
        </div>
      </div>
    </PageShell>
  );
}
