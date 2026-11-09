'use client';

import { useEffect, useState } from 'react';

export const CONSENT_STORAGE_KEY = 'fripet-consent-v1';
export const CONSENT_EVENT = 'fripet-consent-changed';
export const OPEN_SETTINGS_EVENT = 'fripet-open-cookie-settings';

export type ConsentState = {
  version: 1;
  necessary: true;
  /** Загрузка внешних сервисов: карты Яндекс. */
  external: boolean;
  updatedAt: string;
};

export function readConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (parsed.version !== 1) return null;
    return {
      version: 1,
      necessary: true,
      external: Boolean(parsed.external),
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    };
  } catch {
    return null;
  }
}

export function saveConsent(external: boolean): ConsentState {
  const state: ConsentState = {
    version: 1,
    necessary: true,
    external,
    updatedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Хранилище может быть недоступно в приватном режиме — не блокируем сайт.
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: state }));
  return state;
}

export function hasConsent(category: 'external'): boolean {
  const state = readConsent();
  return Boolean(state?.[category]);
}

/** Реактивно сообщает, дано ли согласие на категорию. */
export function useConsent(category: 'external'): boolean {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const sync = () => setAllowed(hasConsent(category));
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CONSENT_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [category]);

  return allowed;
}

export function openCookieSettings() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
  }
}
