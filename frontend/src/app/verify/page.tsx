'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, User } from '@/lib/api';
import {
  Mail, CheckCircle, AlertCircle, Loader2, RefreshCw,
  Edit3, Clock,
} from 'lucide-react';

const CODE_TTL_SECONDS = 5 * 60;

export default function VerifyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [code, setCode] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [showEmailEdit, setShowEmailEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [alreadyVerified, setAlreadyVerified] = useState(false);
  const [ttl, setTtl] = useState(CODE_TTL_SECONDS);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!savedUser || !token) {
      router.push('/login');
      return;
    }
    const userData = JSON.parse(savedUser);
    setUser(userData);
    if (userData.is_verified) {
      setAlreadyVerified(true);
      setTimeout(() => { window.location.href = '/'; }, 2000);
    }
  }, [router]);

  useEffect(() => {
    if (ttl <= 0) {
      setCanResend(true);
      return;
    }
    setCanResend(false);
    const timer = setInterval(() => {
      setTtl((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [ttl]);

  const resetTtl = useCallback(() => {
    setTtl(CODE_TTL_SECONDS);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (code.length !== 9) {
      setError('Код должен содержать 9 символов (формат: XXXX-XXXX)');
      return;
    }

    setLoading(true);
    try {
      await authAPI.verifyEmail(code);
      setSuccess('Аккаунт успешно верифицирован!');
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        userData.is_verified = true;
        localStorage.setItem('user', JSON.stringify(userData));
      }
      setTimeout(() => { window.location.href = '/'; }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка верификации');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newEmail) {
      setError('Введите новый email');
      return;
    }

    setLoading(true);
    try {
      await authAPI.changeEmail(newEmail);
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        userData.email = newEmail;
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      }
      setShowEmailEdit(false);
      setSuccess(`Новый код отправлен на ${newEmail}`);
      setCode('');
      resetTtl();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка смены email');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');
    try {
      await authAPI.resendCode();
      setSuccess('Новый код отправлен на ваш email');
      resetTtl();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка отправки кода');
    } finally {
      setResendLoading(false);
    }
  };

  if (alreadyVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 to-white">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Аккаунт уже верифицирован</h2>
          <p className="text-gray-600">Перенаправление на главную...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 to-white py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <Mail className="h-14 w-14 text-primary-600 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Верификация по email</h1>
          <p className="text-gray-600 mt-2 text-sm">
            Код отправлен на <span className="font-medium">{user?.email}</span>
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700 text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2 text-green-700 text-sm">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleVerifyEmail} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Код верификации
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  if (val.length > 4) val = val.slice(0, 4) + '-' + val.slice(4, 8);
                  setCode(val.slice(0, 9));
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-2xl tracking-widest font-mono"
                placeholder="XXXX-XXXX"
                maxLength={9}
                autoFocus
                required
              />
              <p className="text-xs text-gray-400 mt-1 text-center">Формат: XXXX-XXXX (буквы и цифры)</p>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 9}
              className="w-full relative group rounded-lg"
            >
              <div className="absolute -inset-1.5 bg-green-400 rounded-xl opacity-0 group-hover:opacity-50 blur-lg transition-all duration-500" />
              <div className="absolute -inset-1 bg-green-500 rounded-xl opacity-0 group-hover:opacity-40 blur-md transition-all duration-500" />
              <div className="relative bg-green-600 group-hover:bg-green-500 text-white py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                {loading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /><span>Проверка...</span></>
                ) : (
                  <span>Верифицировать</span>
                )}
              </div>
            </button>
          </form>

          <div className="mt-5 space-y-2">
            {ttl > 0 && (
              <div className="flex items-center justify-center space-x-1 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                <span>Код действителен ещё {formatTime(ttl)}</span>
              </div>
            )}

            <button
              onClick={handleResend}
              disabled={resendLoading || !canResend}
              className="w-full text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center justify-center space-x-1 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {resendLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>{canResend ? 'Отправить код повторно' : `Повторить через ${formatTime(ttl)}`}</span>
            </button>

            {!showEmailEdit ? (
              <button
                onClick={() => setShowEmailEdit(true)}
                className="w-full text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center justify-center space-x-1 py-2"
              >
                <Edit3 className="h-4 w-4" />
                <span>Указать другой email</span>
              </button>
            ) : (
              <form onSubmit={handleChangeEmail} className="space-y-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  placeholder="Новый email"
                  required
                />
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 text-sm"
                  >
                    {loading ? 'Отправка...' : 'Отправить код'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowEmailEdit(false); setNewEmail(''); }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
