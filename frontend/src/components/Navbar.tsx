'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, LogOut, Plus, Home, Heart, MessageSquare, Repeat, X } from 'lucide-react';
import { authAPI, User as UserType, messagesAPI } from '@/lib/api';

interface SavedAccount {
  token: string;
  user: UserType;
}

export default function Navbar() {
  const [user, setUser] = useState<UserType | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    const accounts = localStorage.getItem('savedAccounts');
    if (accounts) {
      setSavedAccounts(JSON.parse(accounts));
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const res = await messagesAPI.getUnreadCount();
        setUnreadCount(res.data.count);
      } catch {}
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
    router.push('/login');
  };

  const switchAccount = (account: SavedAccount) => {
    localStorage.setItem('token', account.token);
    localStorage.setItem('user', JSON.stringify(account.user));
    localStorage.removeItem('addingAccount');
    setUser(account.user);
    setShowSwitcher(false);
    setIsMenuOpen(false);
    window.location.reload();
  };

  const removeSavedAccount = (userId: number) => {
    const updated = savedAccounts.filter(a => a.user.id !== userId);
    setSavedAccounts(updated);
    localStorage.setItem('savedAccounts', JSON.stringify(updated));
  };

  const totalAccounts = savedAccounts.length + (user ? 1 : 0);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">ФРИПЕТ</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors"
            >
              <Home className="h-5 w-5" />
              <span>Главная</span>
            </Link>

            {user ? (
              <>
                <Link
                  href="/add"
                  className="flex items-center space-x-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>Добавить</span>
                </Link>

                <Link
                  href="/chat"
                  className="relative flex items-center space-x-1 text-gray-700 hover:text-green-600 transition-colors"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span className="hidden sm:inline">Чат</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>

                <div className="relative">
                  <button
                    onClick={() => { setIsMenuOpen(!isMenuOpen); setShowSwitcher(false); }}
                    className="flex items-center space-x-2 text-gray-700 hover:text-primary-600"
                  >
                    <User className="h-5 w-5" />
                    <span>{user.username}</span>
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link
                        href="/my-bookings"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Мои бронирования
                      </Link>
                      {user.is_admin && (
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-primary-600 font-medium hover:bg-gray-100"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Админ панель
                        </Link>
                      )}

                      <hr className="my-1 border-gray-200" />

                      <button
                        onClick={addAnotherAccount}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Добавить другой аккаунт</span>
                      </button>

                      {savedAccounts.length > 0 && (
                        <button
                          onClick={() => setShowSwitcher(true)}
                          className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <Repeat className="h-4 w-4" />
                          <span>Переключить аккаунт</span>
                        </button>
                      )}

                      <hr className="my-1 border-gray-200" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Выйти</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-green-600 transition-colors px-4 py-2 font-medium"
                >
                  Войти
                </Link>
                <Link
                  href="/register"
                  className="relative group"
                >
                  <div className="absolute -inset-1.5 bg-green-400 rounded-lg opacity-0 group-hover:opacity-50 blur-lg transition-all duration-500" />
                  <div className="absolute -inset-1 bg-green-500 rounded-lg opacity-0 group-hover:opacity-40 blur-md transition-all duration-500" />
                  <div className="relative bg-green-600 group-hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-colors font-medium">
                    Регистрация
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Модалка переключения аккаунтов */}
      {showSwitcher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" onClick={() => setShowSwitcher(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">Выберите аккаунт</h3>
              <button onClick={() => setShowSwitcher(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-2 max-h-80 overflow-y-auto">
              {user && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{user.username}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                    <span className="text-xs text-green-600 font-medium">Текущий</span>
                  </div>
                </div>
              )}
              {savedAccounts.filter(a => a.user.id !== user?.id).map((account) => (
                <div
                  key={account.user.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <button
                    onClick={() => switchAccount(account)}
                    className="flex items-center space-x-3 flex-1 text-left"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{account.user.username}</p>
                      <p className="text-xs text-gray-400">{account.user.email}</p>
                    </div>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeSavedAccount(account.user.id); }}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
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
