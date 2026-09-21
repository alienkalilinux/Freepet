'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { accountAPI, User, Booking, mediaUrl } from '@/lib/api';
import {
  Camera, MapPin, Mail, CalendarDays, BadgeCheck, Loader2,
  AlertCircle, CheckCircle, ShoppingBag, ArrowRightLeft, Save,
} from 'lucide-react';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

function getSpeciesEmoji(species: string) {
  const s = species.toLowerCase();
  if (s.includes('собак') || s.includes('dog')) return '🐕';
  if (s.includes('кош') || s.includes('кот') || s.includes('cat')) return '🐈';
  if (s.includes('хомяк') || s.includes('hamster')) return '🐹';
  if (s.includes('попугай') || s.includes('parrot')) return '🦜';
  if (s.includes('рыбк') || s.includes('fish')) return '🐟';
  if (s.includes('черепах') || s.includes('turtle')) return '🐢';
  if (s.includes('кролик') || s.includes('rabbit')) return '🐇';
  return '🐾';
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('ru-RU');
}

const statusLabel = (status: string) =>
  status === 'active' ? { text: 'Активно', cls: 'bg-green-500/15 text-green-400 border-green-500/30' }
    : { text: 'Отменено', cls: 'bg-red-500/15 text-red-400 border-red-500/30' };

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

  const [tab, setTab] = useState<'purchases' | 'deals'>('purchases');
  const [purchases, setPurchases] = useState<Booking[]>([]);
  const [deals, setDeals] = useState<Booking[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

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

  const currentTabBookings = tab === 'purchases' ? purchases : deals;
  const emptyText = tab === 'purchases'
    ? 'Вы пока не участвовали в сделках как покупатель'
    : 'На ваших питомцев пока не было бронирований';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-gray-900 to-slate-950">
        <Loader2 className="h-10 w-10 text-primary-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-gray-900 to-slate-950 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center space-x-2 text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center space-x-2 text-green-400">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-white/10 border-2 border-primary-500/40 flex items-center justify-center">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Аватар" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">🐾</span>
                )}
              </div>
              {avatarUploading ? (
                <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-primary-600 hover:bg-primary-500 text-white flex items-center justify-center shadow-neon-violet transition-colors"
                  title="Сменить аватар"
                >
                  <Camera className="h-5 w-5" />
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
                <h1 className="text-2xl sm:text-3xl font-bold text-white break-words">{user?.username}</h1>
                {user?.is_verified && (
                  <span className="inline-flex items-center space-x-1 text-xs bg-green-500/15 text-green-400 border border-green-500/30 rounded-full px-2.5 py-1">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    <span>Верифицирован</span>
                  </span>
                )}
              </div>
              <p className="text-slate-300 mt-1 break-words">{user?.bio || 'Пока нет описания'}</p>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
                <span className="flex items-center space-x-1">
                  <Mail className="h-4 w-4" /> <span>{user?.email}</span>
                </span>
                {user?.city && (
                  <span className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" /> <span>{user.city}</span>
                  </span>
                )}
                {user?.created_at && (
                  <span className="flex items-center space-x-1">
                    <CalendarDays className="h-4 w-4" /> <span>С {formatDate(user.created_at)}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="mt-8 border-t border-white/10 pt-6 space-y-5">
            <h2 className="text-lg font-semibold text-white">Редактировать профиль</h2>

            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Имя пользователя</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                minLength={3}
                maxLength={50}
                className="w-full px-4 py-2.5 min-h-[44px] bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-400 focus:shadow-neon-violet transition-all duration-300"
              />
              <p className="text-xs text-slate-500 mt-1">Имя используется для входа и отображается в чате</p>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Город</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                maxLength={100}
                className="w-full px-4 py-2.5 min-h-[44px] bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-400 focus:shadow-neon-violet transition-all duration-300"
                placeholder="Например: Москва"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1.5">О себе</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                maxLength={1000}
                rows={4}
                className="w-full px-4 py-2.5 min-h-[88px] bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-400 focus:shadow-neon-violet transition-all duration-300 resize-y"
                placeholder="Расскажите о себе потенциальным собеседникам"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white px-6 py-2.5 min-h-[44px] rounded-lg font-medium transition-all"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{saving ? 'Сохранение…' : 'Сохранить'}</span>
            </button>
          </form>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setTab('purchases')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm sm:text-base font-medium transition-colors ${
                tab === 'purchases'
                  ? 'text-white bg-white/5 border-b-2 border-primary-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="h-5 w-5" />
              <span>История покупок</span>
            </button>
            <button
              onClick={() => setTab('deals')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm sm:text-base font-medium transition-colors ${
                tab === 'deals'
                  ? 'text-white bg-white/5 border-b-2 border-primary-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowRightLeft className="h-5 w-5" />
              <span>Проведённые сделки</span>
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {historyLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 text-primary-400 animate-spin" />
              </div>
            ) : currentTabBookings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400">{emptyText}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentTabBookings.map((b) => {
                  const st = statusLabel(b.status);
                  const counterpart = tab === 'purchases'
                    ? { label: 'Продавец', name: b.pet?.owner?.username }
                    : { label: 'Покупатель', name: b.buyer?.username };
                  return (
                    <div
                      key={b.id}
                      className="flex flex-col sm:flex-row bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
                    >
                      <div className="sm:w-40 h-40 sm:h-auto bg-white/5 flex items-center justify-center text-5xl">
                        {b.pet?.image_url ? (
                          <img
                            src={mediaUrl(b.pet.image_url)}
                            alt={b.pet.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{b.pet ? getSpeciesEmoji(b.pet.species) : '🐾'}</span>
                        )}
                      </div>
                      <div className="flex-1 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="text-lg font-semibold text-white break-words">
                              {b.pet?.name || 'Питомец удалён'}
                            </h3>
                            <p className="text-sm text-slate-400">{b.pet?.species || ''}</p>
                          </div>
                          <span className={`text-xs font-medium border rounded-full px-3 py-1 ${st.cls}`}>
                            {st.text}
                          </span>
                        </div>

                        <div className="mt-3 space-y-1 text-sm text-slate-400">
                          <p>
                            {counterpart.label}: <span className="text-slate-300 font-medium">{counterpart.name || '—'}</span>
                          </p>
                          <p>Дата: {formatDate(b.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}