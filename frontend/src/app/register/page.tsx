'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { UserPlus, AlertCircle, Loader2 } from 'lucide-react';
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

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.email || !formData.password) {
      setError('Заполните все обязательные поля');
      return;
    }

    if (formData.username.length < 3) {
      setError('Имя пользователя должно содержать минимум 3 символа');
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      window.location.href = '/verify';
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 to-white py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Регистрация</h1>
          <p className="text-gray-600 mt-2">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-primary-600 hover:text-primary-700">
              Войдите
            </Link>
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Имя пользователя *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:border-green-400 focus:shadow-[0_0_15px_rgba(74,222,128,0.25)] transition-all duration-300"
                placeholder="Минимум 3 символа"
                required
                minLength={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:border-green-400 focus:shadow-[0_0_15px_rgba(74,222,128,0.25)] transition-all duration-300"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Пароль *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:border-green-400 focus:shadow-[0_0_15px_rgba(74,222,128,0.25)] transition-all duration-300"
                placeholder="Минимум 6 символов"
                required
              />
              <PasswordStrength password={formData.password} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Подтвердите пароль *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:border-green-400 focus:shadow-[0_0_15px_rgba(74,222,128,0.25)] transition-all duration-300"
                placeholder="Повторите пароль"
                required
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">Пароли не совпадают</p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="text-green-500 text-xs mt-1">Пароли совпадают</p>
              )}
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
        </div>
      </div>
    </div>
  );
}
