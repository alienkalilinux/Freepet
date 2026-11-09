'use client';

import { Cookie } from 'lucide-react';
import { openCookieSettings } from '@/lib/consent';

export default function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={openCookieSettings}
      className={className ?? 'inline-flex items-center gap-1.5 text-left hover:text-content-primary'}
    >
      <Cookie className="h-3.5 w-3.5" aria-hidden="true" />
      Настройки cookie
    </button>
  );
}
