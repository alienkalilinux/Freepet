'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';
import { TextInput } from '@/components/ui';

export default function DeleteAccountDialog({
  open,
  onClose,
  onConfirm,
  loading,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void | Promise<void>;
  loading: boolean;
  error: string;
}) {
  const [password, setPassword] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  const loadingRef = useRef(loading);
  onCloseRef.current = onClose;
  loadingRef.current = loading;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    setPassword('');
    inputRef.current?.focus();

    const focusables = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loadingRef.current) {
        event.preventDefault();
        onCloseRef.current();
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
  }, [open]);

  if (!open) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!password) return;
    void onConfirm(password);
  };

  return (
    <div className="modal-mask flex items-end justify-center p-3 sm:items-center sm:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        aria-describedby="delete-account-description"
        className="modal-panel modal-scroll w-full max-w-lg p-5 sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-danger-soft text-danger-text">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="delete-account-title" className="heading-sub text-lg">
                Удалить аккаунт?
              </h2>
              <p id="delete-account-description" className="mt-1 text-sm text-content-secondary">
                Действие необратимо. Вместе с аккаунтом будут удалены анкеты, фотографии,
                заявки и сообщения. Отдельные записи могут временно храниться по закону.
              </p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-content-muted transition-colors hover:bg-surface-veil hover:text-content-primary disabled:opacity-45"
            aria-label="Закрыть диалог удаления аккаунта"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5">
          <label htmlFor="delete-account-password" className="field-label">
            Подтвердите пароль
          </label>
          <TextInput
            ref={inputRef}
            id="delete-account-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={loading}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? 'delete-account-error' : undefined}
          />
          {error && (
            <p id="delete-account-error" role="alert" className="mt-2 text-sm text-danger-text">
              {error}
            </p>
          )}
          <p className="mt-3 text-xs leading-5 text-content-muted">
            Если вы входили через Mail.ru и не задавали пароль, закройте окно и отправьте запрос
            на удаление по инструкции в{' '}
            <a
              href="/legal/data-deletion"
              target="_blank"
              className="font-medium text-accent-text underline underline-offset-2"
            >
              разделе «Удаление данных»
            </a>
            .
          </p>

          <div className="mt-5 flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={loading} className="btn btn-ghost">
              Отмена
            </button>
            <button type="submit" disabled={loading || !password} className="btn btn-danger">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Удаляем…
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Удалить навсегда
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
