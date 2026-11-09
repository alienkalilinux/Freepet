import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Accessibility,
  Baby,
  Cookie,
  FileText,
  Receipt,
  RotateCcw,
  Scale,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { PageShell } from '@/components/ui';
import { LEGAL, legalLinks } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Юридические документы — ФРИПЕТ',
  description:
    'Политика конфиденциальности, публичная оферта, условия возврата, политика cookie, доступность и другие документы платформы ФРИПЕТ.',
};

const icons = {
  '/legal/privacy': ShieldCheck,
  '/legal/offer': FileText,
  '/legal/refund': RotateCcw,
  '/legal/cookies': Cookie,
  '/legal/children': Baby,
  '/legal/data-deletion': Trash2,
  '/legal/accessibility': Accessibility,
  '/legal/licenses': Scale,
  '/legal/requisites': Receipt,
} as const;

const descriptions: Record<string, string> = {
  '/legal/privacy': 'Какие данные мы собираем, зачем, кому передаём и как удалить.',
  '/legal/offer': 'Правила пользования бесплатной платформой и передачи животных.',
  '/legal/refund': 'Платных услуг и комиссии нет. Как вернуть ошибочный платёж.',
  '/legal/cookies': 'Необходимое хранилище, внешние карты и настройки согласия.',
  '/legal/children': 'Возраст пользователей и согласие законных представителей.',
  '/legal/data-deletion': 'Пошаговая инструкция удаления аккаунта и данных.',
  '/legal/accessibility': 'Соответствие WCAG 2.1 AA и ГОСТ Р 52872-2019.',
  '/legal/licenses': 'Лицензии на шрифты, код и пользовательские материалы.',
  '/legal/requisites': 'Сведения об операторе платформы и контакты.',
};

export default function LegalHubPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <nav aria-label="Хлебные крошки" className="text-sm text-content-muted">
          <Link href="/" className="hover:text-content-primary">
            Главная
          </Link>
          <span aria-hidden="true"> / </span>
          <span className="text-content-secondary">Документы</span>
        </nav>

        <header className="mt-6 max-w-3xl">
          <p className="eyebrow">Прозрачные правила</p>
          <h1 className="display-title mt-2 text-3xl sm:text-4xl">Юридические документы</h1>
          <p className="lede mt-4">
            Здесь собраны документы, которые регулируют работу ФРИПЕТ: обработка данных,
            правила платформы, cookie, доступность и удаление аккаунта. Все документы
            действуют в редакции от {LEGAL.updatedAt}.
          </p>
        </header>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {legalLinks.map((link) => {
            const Icon = icons[link.href];
            return (
              <Link
                key={link.href}
                href={link.href}
                className="surface-card hover-lift group flex flex-col rounded-lg p-5 transition-colors hover:border-accent-line"
              >
                <span className="icon-well h-10 w-10 rounded-lg">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="mt-4 font-semibold text-content-primary group-hover:text-accent-text">
                  {link.label}
                </span>
                <span className="mt-1 text-sm leading-6 text-content-secondary">
                  {descriptions[link.href]}
                </span>
              </Link>
            );
          })}
        </div>

        <section className="surface-card mt-10 rounded-lg p-5 sm:p-6" aria-labelledby="legal-contact">
          <h2 id="legal-contact" className="heading-sub text-lg">
            Не нашли ответ?
          </h2>
          <p className="mt-2 text-sm leading-6 text-content-secondary">
            Напишите на{' '}
            <a
              className="font-medium text-accent-text underline underline-offset-2"
              href={`mailto:${LEGAL.email}`}
            >
              {LEGAL.email}
            </a>
            . Мы отвечаем на вопросы о данных, удалении аккаунта и работе платформы в течение
            10 рабочих дней. Если вопрос связан с персональными данными, укажите это в теме письма.
          </p>
          <p className="mt-3 text-sm leading-6 text-content-secondary">
            ФРИПЕТ — бесплатная платформа. Мы не принимаем платежи, не берём комиссию и не
            продаём животных.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
