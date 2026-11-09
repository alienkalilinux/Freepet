import Link from 'next/link';
import { HeartHandshake, MapPin, PawPrint, ShieldCheck } from 'lucide-react';

const links = [
  { href: '/', label: 'Каталог питомцев' },
  { href: '/add', label: 'Добавить питомца' },
  { href: '/my-bookings', label: 'Мои бронирования' },
  { href: '/account', label: 'Личный кабинет' },
  { href: '/chat', label: 'Сообщения и поддержка' },
];

const promises = [
  { icon: ShieldCheck, label: 'Модерация каждой анкеты' },
  { icon: HeartHandshake, label: 'Ответственная передача' },
  { icon: MapPin, label: 'Поиск по городу и карте' },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface-sunken">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.25fr_1fr_1fr] lg:px-8">
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
            Помогаем ответственным владельцам находить проверенных людей и передавать животных в заботливые руки.
          </p>
        </div>

        <nav aria-label="Разделы сайта">
          <h2 className="eyebrow">Навигация</h2>
          <ul className="mt-4 space-y-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-content-secondary transition-colors hover:text-content-primary">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="eyebrow">Наши принципы</h2>
          <ul className="mt-4 space-y-3">
            {promises.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm text-content-secondary">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent-text">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-content-faint sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} ФРИПЕТ. Забота о животных — прежде всего.</span>
          <span>Проверяйте детали передачи напрямую с владельцем.</span>
        </div>
      </div>
    </footer>
  );
}
