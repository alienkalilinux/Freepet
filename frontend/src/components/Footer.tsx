import Link from 'next/link';
import { HeartHandshake, MapPin, PawPrint, ShieldCheck } from 'lucide-react';
import CookieSettingsButton from '@/components/CookieSettingsButton';
import { LEGAL, legalLinks } from '@/lib/legal';

const links = [
  { href: '/', label: 'Каталог питомцев' },
  { href: '/add', label: 'Добавить питомца' },
  { href: '/my-bookings', label: 'Мои заявки' },
  { href: '/account', label: 'Личный кабинет' },
  { href: '/chat', label: 'Сообщения и поддержка' },
];

const facts = [
  { icon: ShieldCheck, label: 'Модерация анкет и жалоб' },
  { icon: HeartHandshake, label: 'Бесплатно, без комиссии' },
  { icon: MapPin, label: 'Карта — только по согласию' },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface-sunken">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.25fr_1fr_1fr_1.1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="brand-mark" aria-hidden="true">
              <PawPrint className="h-6 w-6" strokeWidth={1.6} />
            </span>
            <div>
              <p className="display-title text-xl leading-none">ФРИПЕТ</p>
              <p className="mt-1 text-sm text-content-muted">Каждому питомцу — свой дом</p>
            </div>
          </div>
          <p className="lede mt-4 max-w-sm text-sm">
            Бесплатная платформа, где владельцы животных публикуют анкеты, а будущие хозяева
            находят питомца и договариваются о передаче напрямую.
          </p>
        </div>

        <nav aria-label="Разделы сайта">
          <h2 className="eyebrow">Навигация</h2>
          <ul className="mt-4 space-y-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-content-secondary transition-colors hover:text-content-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Юридические документы">
          <h2 className="eyebrow">Документы</h2>
          <ul className="mt-4 space-y-2">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-content-secondary transition-colors hover:text-content-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="eyebrow">Как работает сайт</h2>
          <ul className="mt-4 space-y-3">
            {facts.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm text-content-secondary">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-text">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                {label}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-5 text-content-muted">
            ФРИПЕТ не является стороной сделки между пользователями, не продаёт животных и не
            принимает платежи.
          </p>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-xs text-content-faint sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>
              © {new Date().getFullYear()} ФРИПЕТ. Оператор: {LEGAL.operatorName}.
            </span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Link href="/legal/privacy" className="hover:text-content-primary">
                Конфиденциальность
              </Link>
              <Link href="/legal/offer" className="hover:text-content-primary">
                Оферта
              </Link>
              <CookieSettingsButton />
            </div>
          </div>
          <p>
            Проверяйте детали передачи напрямую с владельцем. Не переводите деньги незнакомым
            людям до личной встречи и проверки животного.
          </p>
        </div>
      </div>
    </footer>
  );
}
