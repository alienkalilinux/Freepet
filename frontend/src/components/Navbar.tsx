'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Repeat, Shield, Sun, Moon, PawPrint } from 'lucide-react';
import UserIcon from '@/components/UserIcon';
import { authAPI, User as UserType, messagesAPI, mediaUrl } from '@/lib/api';

interface SavedAccount {
  token: string;
  user: UserType;
}

function UserAvatar({ user, className }: { user: UserType; className?: string }) {
  if (user.avatar_url) {
    return <img src={mediaUrl(user.avatar_url)} alt="" className={`${className ?? ''} rounded-full object-cover flex-shrink-0`} />;
  }
  return <UserIcon name="user" className={className} />;
}

export default function Navbar() {
  const [user, setUser] = useState<UserType | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const router = useRouter();

  useEffect(() => {
    const t = localStorage.getItem('fripet-theme');
    const isDark = t
      ? t === 'dark'
      : window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem('fripet-theme', next);
    setTheme(next);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    const accounts = localStorage.getItem('savedAccounts');
    if (accounts) setSavedAccounts(JSON.parse(accounts));

    const syncUser = () => {
      const fresh = localStorage.getItem('user');
      if (fresh) setUser(JSON.parse(fresh));
    };
    window.addEventListener('user-updated', syncUser);

    // Возвращаем позицию скролла после перезагрузки при смене аккаунта,
    // чтобы список/страница не «уезжали» наверх.
    const restoreY = sessionStorage.getItem('fripet-scroll-restore');
    if (restoreY !== null) {
      sessionStorage.removeItem('fripet-scroll-restore');
      const y = parseInt(restoreY, 10);
      if (!Number.isNaN(y) && y > 0) {
        const restore = () => window.scrollTo(0, y);
        requestAnimationFrame(restore);
        window.setTimeout(restore, 350);
      }
    }

    return () => window.removeEventListener('user-updated', syncUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try { const res = await messagesAPI.getUnreadCount(); setUnreadCount(res.data.count); } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsMenuOpen(false);
    setMobileMenuOpen(false);
    router.push('/login');
  };

  const addAnotherAccount = () => {
    if (!user) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const exists = savedAccounts.find(a => a.user.id === user.id);
    if (!exists) {
      const updated = [...savedAccounts, { token, user }];
      localStorage.setItem('savedAccounts', JSON.stringify(updated));
    }
    localStorage.setItem('addingAccount', 'true');
    setIsMenuOpen(false);
    setMobileMenuOpen(false);
    router.push('/login');
  };

  const switchAccount = (account: SavedAccount) => {
    try {
      sessionStorage.setItem('fripet-scroll-restore', String(window.scrollY));
    } catch {}
    localStorage.setItem('token', account.token);
    localStorage.setItem('user', JSON.stringify(account.user));
    localStorage.removeItem('addingAccount');
    setUser(account.user);
    setShowSwitcher(false);
    setIsMenuOpen(false);
    setMobileMenuOpen(false);
    window.location.reload();
  };

  const removeSavedAccount = (userId: number) => {
    const updated = savedAccounts.filter(a => a.user.id !== userId);
    setSavedAccounts(updated);
    localStorage.setItem('savedAccounts', JSON.stringify(updated));
  };

  return (
    <nav className="surface-nav sticky top-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-[4.5rem]">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3 min-h-11" aria-label="ФРИПЕТ — на главную">
              <span className="brand-mark" aria-hidden="true">
                <PawPrint className="h-6 w-6" strokeWidth={1.6} />
              </span>
              <span className="leading-tight">
                <span className="block font-display text-lg font-semibold tracking-tight">ФРИПЕТ</span>
                <span className="block text-[11px] text-content-muted">Дом для животных</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="h-11 w-11 rounded-full flex items-center justify-center text-content-secondary hover:text-content-primary hover:bg-surface-veil transition-colors"
              aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              onClick={() => { setMobileMenuOpen(!mobileMenuOpen); setIsMenuOpen(false); }}
              className="h-11 w-11 rounded-full flex items-center justify-center text-content-secondary hover:text-content-primary hover:bg-surface-veil transition-colors"
              aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            >
              {mobileMenuOpen ? <UserIcon name="cross" className="h-6 w-6" /> : <UserIcon name="menu" className="h-6 w-6" />}
            </button>
          </div>

          <div className="hidden md:flex items-center gap-1.5">
            <Link href="/" className="nav-pill">
              <UserIcon name="home" className="h-5 w-5" />
              <span>Главная</span>
            </Link>

            {user ? (
              <>
                <Link href="/add" className="btn btn-primary ml-1 px-5 py-2 text-sm">
                  <Plus className="h-5 w-5" />
                  <span>Добавить</span>
                </Link>

                <Link href="/chat" className="nav-pill relative">
                  <UserIcon name="chat" className="h-5 w-5" />
                  <span className="hidden sm:inline">Чат</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-danger text-danger-on text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>

                <div className="relative">
                  <button onClick={() => { setIsMenuOpen(!isMenuOpen); setShowSwitcher(false); }} className="nav-pill" aria-label="Профиль">
                    <span className="rounded-full border border-line-strong p-0.5">
                      <UserAvatar user={user} className="h-7 w-7" />
                    </span>
                    <span className="max-w-36 truncate">{user.username}</span>
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 mt-3 w-64 surface-overlay rounded-2xl shadow-3 py-2 z-50">
                      <Link href="/account" className="block px-5 py-2.5 text-content-secondary hover:bg-surface-veil transition-colors" onClick={() => setIsMenuOpen(false)}>
                        Личный кабинет
                      </Link>
                      <Link href="/my-bookings" className="block px-5 py-2.5 text-content-secondary hover:bg-surface-veil transition-colors" onClick={() => setIsMenuOpen(false)}>
                        Мои бронирования
                      </Link>
                      {user.is_admin && (
                        <Link href="/admin" className="block px-5 py-2.5 text-accent-text font-semibold hover:bg-surface-veil transition-colors" onClick={() => setIsMenuOpen(false)}>
                          Панель админа
                        </Link>
                      )}
                      <hr className="my-2 border-line" />
                      <button onClick={addAnotherAccount} className="w-full text-left px-5 py-2.5 text-content-secondary hover:bg-surface-veil flex items-center space-x-2 transition-colors">
                        <Plus className="h-4 w-4" />
                        <span>Добавить аккаунт</span>
                      </button>
                      {savedAccounts.length > 0 && (
                        <button onClick={() => setShowSwitcher(true)} className="w-full text-left px-5 py-2.5 text-content-secondary hover:bg-surface-veil flex items-center space-x-2 transition-colors">
                          <Repeat className="h-4 w-4" />
                          <span>Переключить</span>
                        </button>
                      )}
                      <hr className="my-2 border-line" />
                      <button onClick={handleLogout} className="w-full text-left px-5 py-2.5 text-danger-text hover:bg-danger-soft flex items-center space-x-2 transition-colors">
                        <UserIcon name="exit" className="h-4 w-4" />
                        <span>Выйти</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="nav-pill px-5 font-semibold">
                  Войти
                </Link>
                <Link href="/login?mode=register" className="btn btn-primary px-5 py-2 text-sm">
                  Регистрация
                </Link>
              </>
            )}

            <button
              onClick={toggleTheme}
              className="h-11 w-11 rounded-full flex items-center justify-center text-content-secondary hover:text-content-primary hover:bg-surface-veil transition-colors"
              aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
              title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pb-4 pt-2">
            <div className="surface-soft flex flex-col gap-1 p-2">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-2 px-3 py-3 rounded-xl text-content-secondary hover:bg-surface-veil transition-colors">
                <UserIcon name="home" className="h-5 w-5 text-accent-text" />
                <span className="font-medium">Главная</span>
              </Link>
              {user ? (
                <>
                  <div className="flex items-center space-x-3 px-3 py-3">
                    <UserAvatar user={user} className="h-11 w-11 border border-line-strong text-accent-text" />
                    <div className="min-w-0">
                      <p className="font-semibold text-content-primary truncate">{user.username}</p>
                      <p className="text-xs text-content-muted truncate">{user.email}</p>
                    </div>
                  </div>
                  <Link href="/add" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-2 px-3 py-3 rounded-xl text-content-secondary hover:bg-surface-veil transition-colors">
                    <Plus className="h-5 w-5 text-accent-text" />
                    <span className="font-medium">Добавить питомца</span>
                  </Link>
                  <Link href="/chat" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-2 px-3 py-3 rounded-xl text-content-secondary hover:bg-surface-veil transition-colors">
                    <UserIcon name="chat" className="h-5 w-5 text-success-text" />
                    <span className="font-medium">Чат</span>
                    {unreadCount > 0 && <span className="bg-danger text-danger-on text-xs rounded-full px-2 py-0.5 ml-auto">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                  </Link>
                  <Link href="/my-bookings" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-2 px-3 py-3 rounded-xl text-content-secondary hover:bg-surface-veil transition-colors">
                    <UserIcon name="user" className="h-5 w-5 text-content-muted" />
                    <span className="font-medium">Мои бронирования</span>
                  </Link>
                  <Link href="/account" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-2 px-3 py-3 rounded-xl text-content-secondary hover:bg-surface-veil transition-colors">
                    <UserIcon name="user" className="h-5 w-5 text-content-muted" />
                    <span className="font-medium">Личный кабинет</span>
                  </Link>
                  {user.is_admin && (
                    <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-2 px-3 py-3 rounded-xl text-accent-text font-semibold hover:bg-surface-veil transition-colors">
                      <Shield className="h-5 w-5" />
                      <span>Панель админа</span>
                    </Link>
                  )}
                  <hr className="my-1 border-line" />
                  <button onClick={addAnotherAccount} className="flex items-center space-x-2 px-3 py-3 rounded-xl text-left text-content-secondary hover:bg-surface-veil transition-colors">
                    <Plus className="h-5 w-5 text-content-muted" />
                    <span>Добавить аккаунт</span>
                  </button>
                  {savedAccounts.length > 0 && (
                    <button onClick={() => { setShowSwitcher(true); setMobileMenuOpen(false); }} className="flex items-center space-x-2 px-3 py-3 rounded-xl text-left text-content-secondary hover:bg-surface-veil transition-colors">
                      <Repeat className="h-5 w-5 text-content-muted" />
                      <span>Переключить</span>
                    </button>
                  )}
                  <hr className="my-1 border-line" />
                  <button onClick={handleLogout} className="flex items-center space-x-2 px-3 py-3 rounded-xl text-left text-danger-text hover:bg-danger-soft transition-colors">
                    <UserIcon name="exit" className="h-5 w-5" />
                    <span>Выйти</span>
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-ghost px-3 py-3 font-semibold">
                    Войти
                  </Link>
                  <Link href="/login?mode=register" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary px-3 py-3 font-semibold">
                    Регистрация
                  </Link>
                </>
              )}

              <button
                onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
                className="flex items-center space-x-2 px-3 py-3 rounded-xl text-left text-content-secondary hover:bg-surface-veil transition-colors"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5 text-warning-text" /> : <Moon className="h-5 w-5 text-accent-text" />}
                <span>{theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {showSwitcher && (
        <div className="modal-mask flex items-center justify-center p-4" onClick={() => setShowSwitcher(false)}>
          <div className="modal-panel w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-line">
              <h3 className="display-title text-lg">Выберите аккаунт</h3>
              <button onClick={() => setShowSwitcher(false)} className="h-11 w-11 flex items-center justify-center rounded-full text-content-muted hover:text-content-primary hover:bg-surface-veil">
                <UserIcon name="cross" className="h-5 w-5" />
              </button>
            </div>
            <div className="p-2 max-h-80 overflow-y-auto">
              {user && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-accent-soft border border-accent-line">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 bg-accent-soft rounded-full flex items-center justify-center">
                      <UserAvatar user={user} className="h-11 w-11 text-accent-text" />
                    </div>
                    <div>
                      <p className="font-semibold text-content-primary text-sm">{user.username}</p>
                      <p className="text-xs text-content-muted">{user.email}</p>
                    </div>
                    <span className="text-xs text-accent-text font-semibold">Текущий</span>
                  </div>
                </div>
              )}
              {savedAccounts.filter(a => a.user.id !== user?.id).map((account) => (
                <div key={account.user.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-surface-veil transition-colors">
                  <button onClick={() => switchAccount(account)} className="flex items-center space-x-3 flex-1 text-left">
                    <div className="w-11 h-11 bg-surface-veil rounded-full flex items-center justify-center">
                      <UserAvatar user={account.user} className="h-11 w-11 text-content-muted" />
                    </div>
                    <div>
                      <p className="font-semibold text-content-primary text-sm">{account.user.username}</p>
                      <p className="text-xs text-content-muted">{account.user.email}</p>
                    </div>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); removeSavedAccount(account.user.id); }} className="text-content-faint hover:text-danger-text p-1">
                    <UserIcon name="cross" className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
