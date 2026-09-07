'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });

  useEffect(() => {
    setIsAdding(localStorage.getItem('addingAccount') === 'true');
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.username || !formData.password) {
      setError('Заполните все поля');
      return;
    }
    setLoading(true);
    try {
      const response = await authAPI.login(formData);
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      const addingAccount = localStorage.getItem('addingAccount') === 'true';
      if (addingAccount) {
        const saved = localStorage.getItem('savedAccounts');
        const accounts: any[] = saved ? JSON.parse(saved) : [];
        const alreadyExists = accounts.find((a: any) => a.user.id === response.data.user.id);
        if (!alreadyExists) {
          accounts.push({ token: response.data.access_token, user: response.data.user });
        }
        localStorage.setItem('savedAccounts', JSON.stringify(accounts));
        localStorage.removeItem('addingAccount');
      }

      window.location.href = '/';
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при входе');
    } finally {
      setLoading(false);
    }
  };

  const handleMailruLogin = async () => {
    try {
      const response = await authAPI.getMailruAuth();
      window.location.href = response.data.auth_url;
    } catch {
      setError('Ошибка авторизации через Mail.ru');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 to-white py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Вход в аккаунт</h1>
          <p className="text-gray-600 mt-2">
            {isAdding ? (
              <span>Войдите в другой аккаунт для добавления</span>
            ) : (
              <>Нет аккаунта?{' '}
              <Link href="/register" className="text-primary-600 hover:text-primary-700">
                Зарегистрируйтесь
              </Link></>
            )}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Имя пользователя</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:border-green-400 focus:shadow-[0_0_15px_rgba(74,222,128,0.25)] transition-all duration-300"
                placeholder="Ваш логин"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Пароль</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:border-green-400 focus:shadow-[0_0_15px_rgba(74,222,128,0.25)] transition-all duration-300"
                placeholder="Ваш пароль"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group rounded-lg"
            >
              <div className="absolute -inset-1.5 bg-green-400 rounded-xl opacity-0 group-hover:opacity-50 blur-lg transition-all duration-500" />
              <div className="absolute -inset-1 bg-green-500 rounded-xl opacity-0 group-hover:opacity-40 blur-md transition-all duration-500" />
              <div className="relative bg-green-600 group-hover:bg-green-500 text-white py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                {loading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /><span>Вход...</span></>
                ) : (
                  <><LogIn className="h-5 w-5" /><span>{isAdding ? 'Добавить аккаунт' : 'Войти'}</span></>
                )}
              </div>
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-400 text-xs uppercase tracking-wider">или войдите через</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleMailruLogin}
                className="w-full relative group rounded-xl"
              >
                <div className="absolute -inset-1.5 bg-blue-400 rounded-2xl opacity-0 group-hover:opacity-50 blur-lg transition-all duration-500" />
                <div className="absolute -inset-1 bg-blue-500 rounded-2xl opacity-0 group-hover:opacity-40 blur-md transition-all duration-500" />
                <div className="relative bg-blue-600 rounded-xl group-hover:bg-blue-500 transition-all duration-300">
                  <div className="flex items-center justify-center space-x-3 px-4 py-3.5">
                    <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 48 48" fill="none">
                      <text x="8" y="34" fontFamily="Arial" fontWeight="bold" fontSize="32" fill="#FBBF24">@</text>
                    </svg>
                    <span className="text-white font-bold text-base tracking-wide">Mail.ru</span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
