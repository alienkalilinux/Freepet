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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary-50 to-white">
      <div className="text-center">
        <Loader2 className="h-12 w-12 text-primary-600 mx-auto mb-4 animate-spin" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Вход через Яндекс...</h2>
        <p className="text-gray-600">Пожалуйста, подождите</p>
      </div>
    </div>
  );
}
