'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { accountAPI, User, Booking, mediaUrl } from '@/lib/api';
import {
  MapPin, Mail, CalendarDays, BadgeCheck, Loader2,
  AlertCircle, Inbox, Send, Download, Trash2, ShieldCheck, Save,
} from 'lucide-react';
import UserIcon from '@/components/UserIcon';
import { PageShell, SurfaceCard, Field, TextInput, TextArea, ActionButton, AlertBox, ToneBadge, SegmentedTabs } from '@/components/ui';
import PetPlaceholder from '@/components/PetPlaceholder';
import DeleteAccountDialog from '@/components/DeleteAccountDialog';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('ru-RU');
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ username: '', city: '', bio: '' });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [tab, setTab] = useState<'requests' | 'incoming'>('requests');
  const [purchases, setPurchases] = useState<Booking[]>([]);
  const [deals, setDeals] = useState<Booking[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [marketing, setMarketing] = useState(false);
  const [consentSaving, setConsentSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!savedUser || !token) {
      router.push('/login');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await accountAPI.getProfile();
        if (cancelled) return;
        setUser(res.data);
        setMarketing(Boolean(res.data.marketing_consent));
        setForm({
          username: res.data.username,
          city: res.data.city || '',
          bio: res.data.bio || '',
        });
      } catch {
        router.push('/login');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setHistoryLoading(true);
      try {
        const [p, d] = await Promise.all([
          accountAPI.getBookings(),
          accountAPI.getDeals(),
        ]);
        if (cancelled) return;
        setPurchases(p.data);
        setDeals(d.data);
      } catch (err: any) {
        if (!cancelled) setError(err.response?.data?.detail || 'Не удалось загрузить историю');
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const res = await accountAPI.updateProfile({
        username: form.username.trim(),
        city: form.city.trim(),
        bio: form.bio.trim(),
      });
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      window.dispatchEvent(new Event('user-updated'));
      setSuccess('Профиль сохранён');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setSuccess('');

    if (file.size > MAX_AVATAR_SIZE) {
      setError('Размер файла не должен превышать 5 МБ');
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Допустимые форматы: JPG, PNG, GIF, WebP');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);

    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await accountAPI.uploadAvatar(fd);
      setUser(res.data);
      setAvatarPreview(null);
      localStorage.setItem('user', JSON.stringify(res.data));
      window.dispatchEvent(new Event('user-updated'));
      setSuccess('Аватар обновлён');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка загрузки аватара');
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const avatarSrc = avatarPreview || mediaUrl(user?.avatar_url);

  const handleMarketingToggle = async () => {
    const next = !marketing;
    setConsentSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await accountAPI.updateConsents({ marketing_consent: next });
      setUser(res.data);
      setMarketing(Boolean(res.data.marketing_consent));
      localStorage.setItem('user', JSON.stringify(res.data));
      window.dispatchEvent(new Event('user-updated'));
      setSuccess(
        next
          ? 'Информационные письма включены'
          : 'Вы отписались от информационных писем'
      );
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не удалось изменить настройку рассылки');
    } finally {
      setConsentSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setError('');
    setSuccess('');
    try {
      const res = await accountAPI.exportData();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: 'application/json;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fripet-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setSuccess('Файл с вашими данными скачан');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не удалось подготовить экспорт данных');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async (password: string) => {
    setDeleting(true);
    setDeleteError('');
    try {
      await accountAPI.deleteAccount(password);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('demoCode');
      window.location.href = '/';
    } catch (err: any) {
      setDeleteError(err.response?.data?.detail || 'Не удалось удалить аккаунт');
      setDeleting(false);
    }
  };

  const currentTabBookings = tab === 'requests' ? purchases : deals;
  const emptyText = tab === 'requests'
    ? 'Вы пока не отправляли заявки на передачу животных'
    : 'На ваших питомцев пока нет заявок';

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-screen items-center justify-center px-4">
          <SurfaceCard className="flex items-center gap-3 px-7 py-5">
            <Loader2 className="h-8 w-8 animate-spin text-accent-text" />
            <span className="font-semibold text-content-primary">Загружаем профиль…</span>
          </SurfaceCard>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-[880px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="space-y-6">
          {error && (
            <AlertBox tone="danger">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </AlertBox>
          )}
          {success && (
            <AlertBox tone="success">
              <UserIcon name="check" className="h-5 w-5 flex-shrink-0" />
              <span>{success}</span>
            </AlertBox>
          )}

          <SurfaceCard className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="relative flex-shrink-0">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-line bg-surface-sunken">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={`Аватар пользователя ${user?.username ?? ''}`.trim()}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserIcon name="user" className="h-10 w-10 text-content-faint" />
                  )}
                </div>
                {avatarUploading ? (
                  <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                    <Loader2 className="h-4 w-4 animate-spin text-accent-on" />
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface-raised text-content-secondary shadow-1 transition-colors hover:text-content-primary"
                    title="Сменить аватар"
                    aria-label="Сменить аватар"
                  >
                    <UserIcon name="picture" className="h-4 w-4" />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="heading-title break-words text-2xl">{user?.username}</h1>
                  {user?.is_verified && (
                    <ToneBadge tone="leaf">
                      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      Email подтверждён
                    </ToneBadge>
                  )}
                </div>
                <p className="mt-1 break-words text-sm text-content-secondary">{user?.bio || 'Пока нет описания'}</p>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-content-muted">
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" /> <span>{user?.email}</span>
                  </span>
                  {user?.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> <span>{user.city}</span>
                    </span>
                  )}
                  {user?.created_at && (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" /> <span>С {formatDate(user.created_at)}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSave} className="mt-8 space-y-5 border-t border-line pt-6">
              <h2 className="heading-sub text-lg">Редактировать профиль</h2>

              <Field label="Имя пользователя" hint="Имя используется для входа и отображается в чате">
                <TextInput
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                  minLength={3}
                  maxLength={50}
                />
              </Field>

              <Field label="Город">
                <TextInput
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  maxLength={100}
                  placeholder="Например: Москва"
                />
              </Field>

              <Field label="О себе">
                <TextArea
                  value={form.bio}
                  onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                  maxLength={1000}
                  rows={4}
                  placeholder="Расскажите о себе потенциальным собеседникам"
                />
              </Field>

              <ActionButton type="submit" variant="primary" disabled={saving} className="px-7">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>{saving ? 'Сохранение…' : 'Сохранить'}</span>
              </ActionButton>
            </form>
          </SurfaceCard>

          <SurfaceCard className="p-6 sm:p-8" >
            <div className="flex items-start gap-3">
              <span className="icon-well h-10 w-10 rounded-lg">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="heading-sub text-lg">Мои данные и согласия</h2>
                <p className="mt-1 text-sm text-content-secondary">
                  Скачайте копию данных, управляйте информационными письмами или удалите аккаунт.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <div className="surface-soft flex flex-col gap-3 rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-content-primary">
                    Информационные письма
                  </p>
                  <p className="mt-1 text-sm text-content-secondary">
                    Необязательные новости о функциях сайта. Служебные письма о входе,
                    безопасности и заявках приходят всегда.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleMarketingToggle}
                  disabled={consentSaving}
                  aria-pressed={marketing}
                  className={`btn flex-shrink-0 ${marketing ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {consentSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : null}
                  {marketing ? 'Отписаться' : 'Подписаться'}
                </button>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-content-primary">Копия данных</p>
                  <p className="mt-1 text-sm text-content-secondary">
                    JSON-файл с профилем, анкетами, заявками и сообщениями.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={exporting}
                  className="btn btn-secondary flex-shrink-0"
                >
                  {exporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Download className="h-4 w-4" aria-hidden="true" />
                  )}
                  Скачать данные
                </button>
              </div>

              <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-content-primary">Удаление аккаунта</p>
                  <p className="mt-1 text-sm text-content-secondary">
                    Необратимо удалит профиль, анкеты, фотографии, заявки и сообщения. Подробнее —{' '}
                    <a
                      href="/legal/data-deletion"
                      className="font-medium text-accent-text underline underline-offset-2"
                    >
                      в инструкции
                    </a>
                    .
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError('');
                    setDeleteOpen(true);
                  }}
                  className="btn btn-danger flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Удалить аккаунт
                </button>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard className="overflow-hidden">
            <div className="border-b border-line p-4 sm:p-5">
              <SegmentedTabs<'requests' | 'incoming'>
                value={tab}
                onChange={setTab}
                options={[
                  { value: 'requests', label: 'Мои заявки', icon: <Send className="h-5 w-5" aria-hidden="true" /> },
                  { value: 'incoming', label: 'Заявки мне', icon: <Inbox className="h-5 w-5" aria-hidden="true" /> },
                ]}
              />
            </div>

            <div className="p-4 sm:p-6">
              {historyLoading ? (
                <div className="flex items-center justify-center gap-3 py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-accent-text" />
                  <span className="font-semibold text-content-primary">Загружаем историю…</span>
                </div>
              ) : currentTabBookings.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-content-muted">{emptyText}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentTabBookings.map((b) => {
                    const counterpart = tab === 'requests'
                      ? { label: 'Владелец', name: b.pet?.owner?.username }
                      : { label: 'Кандидат', name: b.buyer?.username };
                    return (
                      <div
                        key={b.id}
                        className="surface-soft flex flex-col overflow-hidden sm:flex-row"
                      >
                        <div className="flex h-40 items-center justify-center bg-surface-veil sm:h-auto sm:w-44">
                          {b.pet?.image_url ? (
                            <img
                              src={mediaUrl(b.pet.image_url)}
                              alt={`Фотография питомца ${b.pet.name}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <PetPlaceholder species={b.pet?.species} alt={`Фотография питомца ${b.pet?.name ?? ''}`.trim()} className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 p-4 sm:p-5">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="break-words text-base font-semibold text-content-primary">
                                {b.pet?.name || 'Питомец удалён'}
                              </h3>
                              <p className="text-sm text-content-muted">{b.pet?.species || ''}</p>
                            </div>
                            <ToneBadge tone={b.status === 'active' ? 'leaf' : 'rose'}>
                              {b.status === 'active' ? 'Активна' : 'Отменена'}
                            </ToneBadge>
                          </div>

                          <div className="mt-3 space-y-1 text-sm text-content-muted">
                            <p>
                              {counterpart.label}: <span className="font-semibold text-content-primary">{counterpart.name || '—'}</span>
                            </p>
                            {b.pet?.city && (
                              <p className="inline-flex items-center">
                                <MapPin className="mr-1 h-4 w-4 text-success-text" />
                                {b.pet.city}
                              </p>
                            )}
                            <p>Дата: {formatDate(b.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </SurfaceCard>
        </div>
      </div>
      <DeleteAccountDialog
        open={deleteOpen}
        onClose={() => {
          if (!deleting) setDeleteOpen(false);
        }}
        onConfirm={handleDeleteAccount}
        loading={deleting}
        error={deleteError}
      />
    </PageShell>
  );
}
