'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { LogIn, UserPlus, AlertCircle, Loader2 } from 'lucide-react';
import PasswordStrength from '@/components/PasswordStrength';

const PRIMITIVES = [
  '123456', 'password', 'qwerty', 'abc123', 'letmein', 'admin',
  'welcome', 'monkey', 'master', 'dragon', 'login', 'princess',
  'football', 'shadow', 'sunshine', 'trustno1', 'iloveyou',
  '1234567', '12345678', '123456789', '12345', '1234',
  'passw0rd', 'password1', 'qwerty123', '1q2w3e4r', 'azerty',
];

function validatePassword(password: string): string | null {
  if (password.length < 6) return 'Пароль должен содержать минимум 6 символов';
  if (!/[A-Z]/.test(password)) return 'Пароль должен содержать хотя бы одну заглавную букву';
  if (!/[a-z]/.test(password)) return 'Пароль должен содержать хотя бы одну строчную букву';
  if (!/[0-9]/.test(password)) return 'Пароль должен содержать хотя бы одну цифру';
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) return 'Пароль должен содержать хотя бы один спецсимвол (!@#$%^&*...)';
  const lower = password.toLowerCase();
  if (PRIMITIVES.some(p => lower.includes(p))) return 'Пароль слишком простой. Используйте более сложный пароль';
  return null;
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [regForm, setRegForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [mailruDemo, setMailruDemo] = useState(false);

  useEffect(() => {
    setIsAdding(localStorage.getItem('addingAccount') === 'true');
    if (searchParams.get('mode') === 'register') {
      setMode('register');
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegForm((prev) => ({ ...prev, [name]: value }));
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regForm.username || !regForm.email || !regForm.password) {
      setError('Заполните все обязательные поля');
      return;
    }

    if (regForm.username.length < 3) {
      setError('Имя пользователя должно содержать минимум 3 символа');
      return;
    }

    const passwordError = validatePassword(regForm.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (regForm.password !== regForm.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.register({
        username: regForm.username,
        email: regForm.email,
        password: regForm.password,
      });
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      if (response.data.demo_code) {
        localStorage.setItem('demoCode', response.data.demo_code);
      }
      window.location.href = '/verify';
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };

  const handleMailruLogin = async () => {
    try {
      const response = await authAPI.getMailruAuth();
      if (response.data.mode === 'demo') setMailruDemo(true);
      window.location.href = response.data.auth_url;
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Ошибка авторизации через Mail.ru');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-gray-900 to-slate-950 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">{
            isAdding ? 'Добавить аккаунт' : mode === 'register' ? 'Регистрация' : 'Вход в аккаунт'
          }</h1>
          <p className="text-slate-400 mt-2">
            {!isAdding && mode === 'login' && (
              <span>
                Нет аккаунта?{' '}
                <button onClick={() => { setMode('register'); setError(''); }} className="text-primary-400 hover:text-primary-300">
                  Зарегистрируйтесь
                </button>
              </span>
            )}
            {!isAdding && mode === 'register' && (
              <span>
                Уже есть аккаунт?{' '}
                <button onClick={() => { setMode('login'); setError(''); }} className="text-primary-400 hover:text-primary-300">
                  Войдите
                </button>
              </span>
            )}
            {isAdding && (
              <span>Войдите в другой аккаунт для добавления</span>
            )}
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          {!isAdding && (
            <div className="flex mb-6 bg-white/5 rounded-lg p-1">
              <button
                onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === 'login'
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Вход
              </button>
              <button
                onClick={() => { setMode('register'); setError(''); }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === 'register'
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Регистрация
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center space-x-2 text-red-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'register' && !isAdding ? (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Имя пользователя *
                </label>
                <input
                  type="text"
                  name="username"
                  value={regForm.username}
                  onChange={handleRegChange}
                  className="w-full px-4 py-2.5 min-h-11 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-primary-400 focus:shadow-neon-violet focus:outline-none transition-all duration-300"
                  placeholder="Минимум 3 символа"
                  required
                  minLength={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={regForm.email}
                  onChange={handleRegChange}
                  className="w-full px-4 py-2.5 min-h-11 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-primary-400 focus:shadow-neon-violet focus:outline-none transition-all duration-300"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Пароль *
                </label>
                <input
                  type="password"
                  name="password"
                  value={regForm.password}
                  onChange={handleRegChange}
                  className="w-full px-4 py-2.5 min-h-11 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-primary-400 focus:shadow-neon-violet focus:outline-none transition-all duration-300"
                  placeholder="Минимум 6 символов"
                  required
                />
                <PasswordStrength password={regForm.password} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Подтвердите пароль *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={regForm.confirmPassword}
                  onChange={handleRegChange}
                  className="w-full px-4 py-2.5 min-h-11 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-primary-400 focus:shadow-neon-violet focus:outline-none transition-all duration-300"
                  placeholder="Повторите пароль"
                  required
                />
                {regForm.confirmPassword && regForm.password !== regForm.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">Пароли не совпадают</p>
                )}
                {regForm.confirmPassword && regForm.password === regForm.confirmPassword && (
                  <p className="text-green-400 text-xs mt-1">Пароли совпадают</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full relative group rounded-lg"
              >
                <div className="absolute -inset-1.5 bg-green-400 rounded-xl opacity-0 group-hover:opacity-50 blur-lg transition-all duration-500" />
                <div className="absolute -inset-1 bg-green-500 rounded-xl opacity-0 group-hover:opacity-40 blur-md transition-all duration-500" />
                <div className="relative bg-green-600 group-hover:bg-green-500 text-white py-3 rounded-lg transition-colors hover:shadow-neon-emerald disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Регистрация...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5" />
                      <span>Зарегистрироваться</span>
                    </>
                  )}
                </div>
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Имя пользователя</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 min-h-11 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-primary-400 focus:shadow-neon-violet focus:outline-none transition-all duration-300"
                  placeholder="Ваш логин"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Пароль</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 min-h-11 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-primary-400 focus:shadow-neon-violet focus:outline-none transition-all duration-300"
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
                <div className="relative bg-green-600 group-hover:bg-green-500 text-white py-3 rounded-lg transition-colors hover:shadow-neon-emerald disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                  {loading ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /><span>Вход...</span></>
                  ) : (
                    <><LogIn className="h-5 w-5" /><span>{isAdding ? 'Добавить аккаунт' : 'Войти'}</span></>
                  )}
                </div>
              </button>
            </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-transparent text-slate-500 text-xs uppercase tracking-wider">или войдите через</span>
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
              {mailruDemo && (
                <p className="mt-2 text-center text-xs text-slate-500">
                  Демо-режим: вход выполняется локально, без интернета
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
