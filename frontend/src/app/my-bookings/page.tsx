'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { bookingsAPI, Booking, mediaUrl } from '@/lib/api';
import { Calendar, Loader2, AlertCircle } from 'lucide-react';
import UserIcon from '@/components/UserIcon';
import { PageShell, SurfaceCard, AlertBox, ActionButton, EmptyState } from '@/components/ui';
import PetPlaceholder from '@/components/PetPlaceholder';

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelingId, setCancelingId] = useState<number | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!savedUser || !token) {
      router.push('/login');
      return;
    }
    fetchBookings();
  }, [router]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await bookingsAPI.getMy();
      setBookings(response.data);
    } catch (err) {
      console.error('Ошибка загрузки заявок:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId: number) => {
    setCancelingId(bookingId);
    setError('');

    try {
      await bookingsAPI.cancel(bookingId);
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при отмене заявки');
    } finally {
      setCancelingId(null);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-screen items-center justify-center px-4">
          <SurfaceCard className="flex items-center gap-3 px-7 py-5">
            <Loader2 className="h-8 w-8 animate-spin text-accent-text" aria-hidden="true" />
            <span className="font-semibold text-content-primary">Загружаем заявки…</span>
          </SurfaceCard>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8 max-w-2xl">
          <h1 className="heading-title">Мои заявки</h1>
          <p className="lede mt-2">
            Питомцы, которых вы выбрали. Напишите владельцу и договоритесь о встрече.
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

        {bookings.length === 0 ? (
          <EmptyState
            title="У вас пока нет заявок"
            description="Выберите питомца в каталоге — заявка появится здесь, и вы сможете написать владельцу в чате."
            action={
              <Link href="/" className="btn btn-primary">
                Найти питомца
              </Link>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {bookings.map((booking) => (
              <SurfaceCard key={booking.id} className="overflow-hidden">
                <div className="relative aspect-[16/9] bg-surface-sunken">
                  {booking.pet?.image_url ? (
                    <img
                      src={mediaUrl(booking.pet.image_url)}
                      alt={`Фотография питомца ${booking.pet.name}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <PetPlaceholder
                      species={booking.pet?.species}
                      alt={`Фотография питомца ${booking.pet?.name ?? ''}`.trim()}
                      className="h-full w-full object-cover"
                    />
                  )}
                  <button
                    onClick={() => handleCancel(booking.id)}
                    disabled={cancelingId === booking.id}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-surface-raised text-content-secondary shadow-1 transition-colors hover:text-danger-text disabled:opacity-50"
                    aria-label={`Отменить заявку на питомца ${booking.pet?.name ?? ''}`.trim()}
                  >
                    {cancelingId === booking.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <UserIcon name="cross" className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <div className="p-5">
                  <h3 className="break-words text-lg font-semibold text-content-primary">
                    {booking.pet?.name || 'Неизвестный питомец'}
                  </h3>
                  <p className="mt-1 text-sm text-content-secondary">
                    {[booking.pet?.species, booking.pet?.city].filter(Boolean).join(' · ')}
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-content-muted">
                    <Calendar className="h-4 w-4" aria-hidden="true" />
                    Заявка от {new Date(booking.created_at).toLocaleDateString('ru-RU')}
                  </p>

                  <div className="mt-5 flex items-center gap-2 border-t border-line pt-4">
                    <ActionButton
                      variant="secondary"
                      onClick={() => router.push(`/chat?user=${booking.pet?.user_id}`)}
                    >
                      <UserIcon name="chat" className="h-4 w-4" />
                      <span>Написать</span>
                    </ActionButton>
                    <Link
                      href={`/pet/${booking.pet_id}`}
                      className="btn btn-ghost"
                    >
                      Подробнее
                    </Link>
                  </div>
                </div>
              </SurfaceCard>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
