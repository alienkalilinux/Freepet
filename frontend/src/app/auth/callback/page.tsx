'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { API_BASE } from '@/lib/api';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userId = params.get('user_id');

    if (token && userId) {
      localStorage.setItem('token', token);
      fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((user) => {
          localStorage.setItem('user', JSON.stringify(user));
          window.location.href = '/';
        })
        .catch(() => {
          window.location.href = '/login';
        });
    } else {
      window.location.href = '/login';
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-gray-900 to-slate-950">
      <div className="text-center">
        <Loader2 className="h-12 w-12 text-primary-400 mx-auto mb-4 animate-spin drop-shadow-[0_0_20px_rgba(139,92,246,0.4)]" />
        <h2 className="text-xl font-bold text-white mb-2">Вход через Mail.ru...</h2>
        <p className="text-slate-400">Пожалуйста, подождите</p>
      </div>
    </div>
  );
}