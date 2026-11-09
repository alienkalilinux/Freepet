'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Cookie, ShieldCheck, X } from 'lucide-react';
import {
  CONSENT_EVENT,
  ConsentState,
  OPEN_SETTINGS_EVENT,
  readConsent,
  saveConsent,
} from '@/lib/consent';

export default function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [external, setExternal] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    setConsent(readConsent());
    const openSettings = () => {
      const current = readConsent();
      setExternal(Boolean(current?.external));
      setSettingsOpen(true);
    };
    const syncConsent = () => setConsent(readConsent());
    window.addEventListener(OPEN_SETTINGS_EVENT, openSettings);
    window.addEventListener(CONSENT_EVENT, syncConsent);
    window.addEventListener('storage', syncConsent);
    return () => {
      window.removeEventListener(OPEN_SETTINGS_EVENT, openSettings);
      window.removeEventListener(CONSENT_EVENT, syncConsent);
      window.removeEventListener('storage', syncConsent);
    };
  }, []);

  useEffect(() => {
    if (!settingsOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = dialogRef.current;
    const focusables = () =>
      Array.from(
        node?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setSettingsOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      previous?.focus();
    };
  }, [settingsOpen]);

  if (!mounted) return null;

  const save = (allowExternal: boolean) => {
    const next = saveConsent(allowExternal);
    setConsent(next);
    setExternal(allowExternal);
    setSettingsOpen(false);
  };

  const bannerVisible = !consent && !settingsOpen;

  return (
    <>
      {bannerVisible && (
        <section
          aria-label="Согласие на использование cookie"
          className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4"
        >
          <div className="surface-overlay mx-auto max-w-4xl rounded-lg p-4 shadow-3 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-text">
                <Cookie className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-content-primary">
                  Мы используем cookie и локальное хранилище
                </h2>
                <p className="mt-1 text-sm leading-6 text-content-secondary">
                  Необходимые данные нужны для входа, безопасности и сохранения настроек.
                  Карты Яндекс загружаются только с вашего согласия. Аналитики и рекламных
                  cookie на сайте нет.{' '}
                  <Link href="/legal/cookies" className="font-medium text-accent-text underline underline-offset-2">
                    Политика cookie
                  </Link>
                  {' · '}
                  <Link href="/legal/privacy" className="font-medium text-accent-text underline underline-offset-2">
                    Политика конфиденциальности
                  </Link>
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="btn btn-quiet"
              >
                Настроить
              </button>
              <button
                type="button"
                onClick={() => save(false)}
                className="btn btn-secondary"
              >
                Только необходимые
              </button>
              <button
                type="button"
                onClick={() => save(true)}
                className="btn btn-primary"
              >
                Принять все
              </button>
            </div>
          </div>
        </section>
      )}

      {settingsOpen && (
        <div className="modal-mask flex items-end justify-center p-3 sm:items-center sm:p-4">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-settings-title"
            className="modal-panel modal-scroll w-full max-w-lg p-5 sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="cookie-settings-title" className="heading-sub flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5 text-accent-text" aria-hidden="true" />
                  Настройки cookie
                </h2>
                <p className="mt-1 text-sm text-content-secondary">
                  Выберите, какие внешние сервисы можно загружать.
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-content-muted transition-colors hover:bg-surface-veil hover:text-content-primary"
                aria-label="Закрыть настройки cookie"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <div className="surface-soft flex items-start gap-3 rounded-lg p-4">
                <input
                  type="checkbox"
                  checked
                  disabled
                  readOnly
                  className="mt-1 h-4 w-4 accent-[var(--accent)]"
                  aria-label="Необходимые cookie включены всегда"
                />
                <div>
                  <p className="text-sm font-semibold text-content-primary">Необходимые</p>
                  <p className="mt-1 text-sm text-content-secondary">
                    Вход, защита аккаунта, сохранение темы и выбранного города. Без них сайт
                    не сможет работать, поэтому они включены всегда.
                  </p>
                </div>
              </div>

              <label className="surface-soft flex cursor-pointer items-start gap-3 rounded-lg p-4">
                <input
                  type="checkbox"
                  checked={external}
                  onChange={(event) => setExternal(event.target.checked)}
                  className="mt-1 h-4 w-4 accent-[var(--accent)]"
                />
                <span>
                  <span className="block text-sm font-semibold text-content-primary">
                    Внешние сервисы: карты Яндекс
                  </span>
                  <span className="mt-1 block text-sm text-content-secondary">
                    Загружают карту и определяют координаты. При этом Яндекс получает IP-адрес
                    и данные о местоположении. Без согласия карта не загружается — город можно
                    выбрать вручную.
                  </span>
                </span>
              </label>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setSettingsOpen(false)} className="btn btn-ghost">
                Отмена
              </button>
              <button type="button" onClick={() => save(external)} className="btn btn-primary">
                Сохранить выбор
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
