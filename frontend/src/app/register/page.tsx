'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { UserPlus, AlertCircle, Loader2 } from 'lucide-react';
import PasswordStrength from '@/components/PasswordStrength';
import { PageShell, SurfaceCard, Field, TextInput, ActionButton, AlertBox } from '@/components/ui';

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
  const [consent, setConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

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

    if (!consent) {
      setError('Подтвердите согласие с офертой и политикой конфиденциальности');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        consent,
        marketing_consent: marketingConsent,
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

  return (
    <PageShell>
      <div className="mx-auto flex min-h-[calc(100vh-72px)] max-w-[420px] flex-col justify-center px-4 py-12">
        <SurfaceCard className="p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="heading-title text-2xl">Регистрация</h1>
            <p className="mt-2 text-sm text-content-secondary">
              Уже есть аккаунт?{' '}
              <Link href="/login" className="font-medium text-accent-text hover:text-accent-text-hover">
                Войдите
              </Link>
            </p>
          </div>
            {error && (
              <div className="mb-5">
                <AlertBox tone="danger">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{error}</span>
                </AlertBox>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Field label="Имя пользователя *">
                <TextInput
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Минимум 3 символа"
                  required
                  minLength={3}
                />
              </Field>

              <Field label="Email *">
                <TextInput
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  required
                />
              </Field>

              <Field label="Пароль *">
                <TextInput
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Минимум 6 символов"
                  required
                />
                <PasswordStrength password={formData.password} />
              </Field>

              <Field label="Подтвердите пароль *">
                <TextInput
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Повторите пароль"
                  required
                />
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="mt-1 text-xs text-danger-text">Пароли не совпадают</p>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className="mt-1 text-xs text-success-text">Пароли совпадают</p>
                )}
              </Field>

              <div className="space-y-3 rounded-lg border border-line bg-surface-sunken p-4">
                <label className="flex cursor-pointer items-start gap-3 text-sm text-content-secondary">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                    required
                    className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[var(--accent)]"
                  />
                  <span>
                    Я принимаю{' '}
                    <Link
                      href="/legal/offer"
                      className="font-medium text-accent-text underline underline-offset-2"
                      target="_blank"
                    >
                      публичную оферту
                    </Link>{' '}
                    и даю согласие на обработку персональных данных согласно{' '}
                    <Link
                      href="/legal/privacy"
                      className="font-medium text-accent-text underline underline-offset-2"
                      target="_blank"
                    >
                      политике конфиденциальности
                    </Link>
                    . <span aria-hidden="true">*</span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 text-sm text-content-secondary">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(event) => setMarketingConsent(event.target.checked)}
                    className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[var(--accent)]"
                  />
                  <span>
                    Хочу получать редкие информационные письма о новых функциях. Необязательно,
                    можно отписаться в один клик в личном кабинете.
                  </span>
                </label>
              </div>

              <ActionButton type="submit" variant="primary" disabled={loading} className="btn-lg w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Регистрация…</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    <span>Зарегистрироваться</span>
                  </>
                )}
              </ActionButton>
            </form>
        </SurfaceCard>
      </div>
    </PageShell>
  );
}
