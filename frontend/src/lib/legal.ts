/**
 * Единая точка настройки юридических реквизитов и версии документов.
 *
 * Заполните переменные окружения (см. frontend/.env.example), чтобы на сайте
 * отображались реальные данные оператора. Пока переменные не заданы, в
 * реквизитах честно показывается «не указано» — не выдумывайте данные.
 */
export const CONSENT_VERSION = '2026-11-09';
export const LEGAL_UPDATED_AT = '09.11.2026';

const env = (value: string | undefined, fallback = '') =>
  (value && value.trim()) || fallback;

export const LEGAL = {
  brand: 'ФРИПЕТ',
  siteUrl: env(process.env.NEXT_PUBLIC_SITE_URL, 'https://fripet.kz'),
  operatorName: env(
    process.env.NEXT_PUBLIC_LEGAL_OPERATOR,
    'Оператор платформы «ФРИПЕТ»'
  ),
  legalForm: env(process.env.NEXT_PUBLIC_LEGAL_FORM),
  bin: env(process.env.NEXT_PUBLIC_LEGAL_BIN),
  address: env(process.env.NEXT_PUBLIC_LEGAL_ADDRESS),
  email: env(process.env.NEXT_PUBLIC_LEGAL_EMAIL, 'fripet.kz@gmail.com'),
  privacyEmail: env(process.env.NEXT_PUBLIC_PRIVACY_EMAIL, 'fripet.kz@gmail.com'),
  supportEmail: env(process.env.NEXT_PUBLIC_SUPPORT_EMAIL, 'fripet.kz@gmail.com'),
  phone: env(process.env.NEXT_PUBLIC_LEGAL_PHONE),
  jurisdiction: env(process.env.NEXT_PUBLIC_LEGAL_JURISDICTION, 'Республика Казахстан'),
  updatedAt: LEGAL_UPDATED_AT,
  consentVersion: CONSENT_VERSION,
} as const;

export const isRequisitesComplete = Boolean(
  LEGAL.legalForm && LEGAL.bin && LEGAL.address
);

export const legalLinks = [
  { href: '/legal/privacy', label: 'Политика конфиденциальности' },
  { href: '/legal/offer', label: 'Публичная оферта' },
  { href: '/legal/refund', label: 'Условия возврата' },
  { href: '/legal/cookies', label: 'Политика cookie' },
  { href: '/legal/children', label: 'Данные детей' },
  { href: '/legal/data-deletion', label: 'Удаление данных' },
  { href: '/legal/accessibility', label: 'Доступность' },
  { href: '/legal/licenses', label: 'Лицензии' },
  { href: '/legal/requisites', label: 'Реквизиты' },
] as const;
