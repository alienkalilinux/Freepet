'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, LogOut, Plus, Home, PawPrint, MessageSquare, Repeat, X, Menu, Shield, Sun, Moon } from 'lucide-react';
import { authAPI, User as UserType, messagesAPI } from '@/lib/api';

interface SavedAccount {
  token: string;
  user: UserType;
}

export default function Navbar() {
  const [user, setUser] = useState<UserType | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const router = useRouter();

  useEffect(() => {
    const t = localStorage.getItem('fripet-theme');
    const isLight = t
      ? t === 'light'
      : window.matchMedia?.('(prefers-color-scheme: light)').matches ?? false;
    setTheme(isLight ? 'light' : 'dark');
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('light', next === 'light');
    localStorage.setItem('fripet-theme', next);
    setTheme(next);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    const accounts = localStorage.getItem('savedAccounts');
    if (accounts) setSavedAccounts(JSON.parse(accounts));
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
    <nav className="bg-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 min-h-11">
              <PawPrint className="h-8 w-8 text-green-400" />
              <span className="text-xl font-bold text-white">ФРИПЕТ</span>
            </Link>
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => { setMobileMenuOpen(!mobileMenuOpen); setIsMenuOpen(false); }}
              className="h-11 w-11 rounded-lg flex items-center justify-center text-slate-300 hover:text-primary-400 transition-colors"
              aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-1 text-slate-300 hover:text-primary-400 transition-colors">
              <Home className="h-5 w-5" />
              <span>Главная</span>
            </Link>

            {user ? (
              <>
                <Link href="/add" className="flex items-center space-x-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-500 hover:shadow-neon-violet transition-all">
                  <Plus className="h-5 w-5" />
                  <span>Добавить</span>
                </Link>

                <Link href="/chat" className="relative flex items-center space-x-1 text-slate-300 hover:text-green-400 transition-colors">
                  <MessageSquare className="h-5 w-5" />
                  <span className="hidden sm:inline">Чат</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>

                <div className="relative">
                  <button onClick={() => { setIsMenuOpen(!isMenuOpen); setShowSwitcher(false); }} className="flex items-center space-x-2 text-slate-300 hover:text-primary-400">
                    <User className="h-5 w-5" />
                    <span>{user.username}</span>
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 glass rounded-xl shadow-2xl py-1 z-50 border border-white/10">
                      <Link href="/my-bookings" className="block px-4 py-2 text-slate-300 hover:bg-white/10 transition-colors" onClick={() => setIsMenuOpen(false)}>
                        Мои бронирования
                      </Link>
                      {user.is_admin && (
                        <Link href="/admin" className="block px-4 py-2 text-primary-400 font-medium hover:bg-white/10 transition-colors" onClick={() => setIsMenuOpen(false)}>
                          Админ панель
                        </Link>
                      )}
                      <hr className="my-1 border-white/10" />
                      <button onClick={addAnotherAccount} className="w-full text-left px-4 py-2 text-slate-300 hover:bg-white/10 flex items-center space-x-2 transition-colors">
                        <Plus className="h-4 w-4" />
                        <span>Добавить аккаунт</span>
                      </button>
                      {savedAccounts.length > 0 && (
                        <button onClick={() => setShowSwitcher(true)} className="w-full text-left px-4 py-2 text-slate-300 hover:bg-white/10 flex items-center space-x-2 transition-colors">
                          <Repeat className="h-4 w-4" />
                          <span>Переключить</span>
                        </button>
                      )}
                      <hr className="my-1 border-white/10" />
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 flex items-center space-x-2 transition-colors">
                        <LogOut className="h-4 w-4" />
                        <span>Выйти</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-slate-300 hover:text-primary-400 transition-colors px-4 py-2 font-medium">
                  Войти
                </Link>
                <Link href="/login?mode=register" className="relative group">
                  <div className="absolute -inset-1.5 bg-green-400 rounded-lg opacity-0 group-hover:opacity-40 blur-lg transition-all duration-500" />
                  <div className="relative bg-green-600 group-hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-all font-medium shadow-neon-emerald">
                    Регистрация
                  </div>
                </Link>
              </>
            )}

            <button
              onClick={toggleTheme}
              className="h-11 w-11 rounded-lg flex items-center justify-center text-slate-300 hover:text-primary-400 transition-colors"
              aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
              title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 pb-4 pt-2">
            <div className="flex flex-col gap-1">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-2 px-3 py-3 rounded-lg text-slate-300 hover:bg-white/10 transition-colors">
                <Home className="h-5 w-5 text-primary-400" />
                <span className="font-medium">Главная</span>
              </Link>
              {user ? (
                <>
                  <Link href="/add" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-2 px-3 py-3 rounded-lg text-slate-300 hover:bg-white/10 transition-colors">
                    <Plus className="h-5 w-5 text-primary-400" />
                    <span className="font-medium">Добавить питомца</span>
                  </Link>
                  <Link href="/chat" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-2 px-3 py-3 rounded-lg text-slate-300 hover:bg-white/10 transition-colors">
                    <MessageSquare className="h-5 w-5 text-green-400" />
                    <span className="font-medium">Чат</span>
                    {unreadCount > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 ml-auto">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                  </Link>
                  <Link href="/my-bookings" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-2 px-3 py-3 rounded-lg text-slate-300 hover:bg-white/10 transition-colors">
                    <User className="h-5 w-5 text-slate-400" />
                    <span className="font-medium">Мои бронирования</span>
                  </Link>
                  {user.is_admin && (
                    <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-2 px-3 py-3 rounded-lg text-slate-300 hover:bg-white/10 transition-colors">
                      <Shield className="h-5 w-5 text-primary-400" />
                      <span className="font-medium">Админ панель</span>
                    </Link>
                  )}
                  <hr className="my-1 border-white/10" />
                  <button onClick={addAnotherAccount} className="flex items-center space-x-2 px-3 py-3 rounded-lg text-left text-slate-300 hover:bg-white/10 transition-colors">
                    <Plus className="h-5 w-5 text-slate-400" />
                    <span>Добавить аккаунт</span>
                  </button>
                  {savedAccounts.length > 0 && (
                    <button onClick={() => { setShowSwitcher(true); setMobileMenuOpen(false); }} className="flex items-center space-x-2 px-3 py-3 rounded-lg text-left text-slate-300 hover:bg-white/10 transition-colors">
                      <Repeat className="h-5 w-5 text-slate-400" />
                      <span>Переключить</span>
                    </button>
                  )}
                  <hr className="my-1 border-white/10" />
                  <button onClick={handleLogout} className="flex items-center space-x-2 px-3 py-3 rounded-lg text-left text-red-400 hover:bg-red-500/10 transition-colors">
                    <LogOut className="h-5 w-5" />
                    <span>Выйти</span>
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center px-3 py-3 rounded-lg bg-white/10 text-primary-400 font-medium hover:bg-white/15 transition-colors">
                    Войти
                  </Link>
                  <Link href="/login?mode=register" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center px-3 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-500 transition-colors shadow-neon-emerald">
                    Регистрация
                  </Link>
                </>
              )}

              <button
                onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
                className="flex items-center space-x-2 px-3 py-3 rounded-lg text-left text-slate-300 hover:bg-white/10 transition-colors"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-primary-400" />}
                <span>{theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {showSwitcher && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setShowSwitcher(false)}>
          <div className="glass w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="font-bold text-white">Выберите аккаунт</h3>
              <button onClick={() => setShowSwitcher(false)} className="h-11 w-11 flex items-center justify-center text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-2 max-h-80 overflow-y-auto">
              {user && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary-500/10 border border-primary-500/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{user.username}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                    <span className="text-xs text-primary-400 font-medium">Текущий</span>
                  </div>
                </div>
              )}
              {savedAccounts.filter(a => a.user.id !== user?.id).map((account) => (
                <div key={account.user.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                  <button onClick={() => switchAccount(account)} className="flex items-center space-x-3 flex-1 text-left">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{account.user.username}</p>
                      <p className="text-xs text-slate-400">{account.user.email}</p>
                    </div>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); removeSavedAccount(account.user.id); }} className="text-slate-500 hover:text-red-400 p-1">
                    <X className="h-4 w-4" />
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