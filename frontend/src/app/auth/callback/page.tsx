'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '@/lib/api';
import { PageShell, SurfaceCard } from '@/components/ui';

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
    <PageShell>
      <div className="flex min-h-screen items-center justify-center px-4">
        <SurfaceCard className="max-w-md px-8 py-12 text-center">
          <span className="mx-auto mb-4 block h-12 w-12 animate-spin rounded-full border-[3px] border-accent-line border-t-transparent" aria-hidden="true" />
          <h2 className="display-title text-xl">Вход через Mail.ru...</h2>
          <p className="lede mt-2 text-sm">Пожалуйста, подождите</p>
        </SurfaceCard>
      </div>
    </PageShell>
  );
}
