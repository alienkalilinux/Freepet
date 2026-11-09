'use client';

import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { saveConsent } from '@/lib/consent';

export default function MapConsentNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`surface-soft flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line px-5 text-center ${
        compact ? 'py-8' : 'py-12'
      }`}
    >
      <span className="icon-well h-11 w-11 rounded-lg">
        <MapPin className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-semibold text-content-primary">Карта не загружена</p>
        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-content-secondary">
          Яндекс получит IP-адрес и данные о местоположении, только если вы разрешите загрузку
          внешней карты. Город можно выбрать вручную без карты.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => saveConsent(true)}
          className="btn btn-secondary btn-sm"
        >
          Разрешить карту
        </button>
        <Link
          href="/legal/cookies"
          className="text-sm font-medium text-accent-text underline underline-offset-2"
        >
          Что передаётся Яндексу
        </Link>
      </div>
    </div>
  );
}
