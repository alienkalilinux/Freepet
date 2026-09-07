'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { bookingsAPI, Booking, User, mediaUrl } from '@/lib/api';
import { Calendar, Heart, XCircle, Loader2, AlertCircle, MessageSquare } from 'lucide-react';

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
      console.error('Ошибка загрузки бронирований:', err);
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
      setError(err.response?.data?.detail || 'Ошибка при отмене бронирования');
    } finally {
      setCancelingId(null);
    }
  };

  const getSpeciesEmoji = (species: string) => {
    const s = species.toLowerCase();
    if (s.includes('собак') || s.includes('dog')) return '🐕';
    if (s.includes('кош') || s.includes('кот') || s.includes('cat')) return '🐈';
    if (s.includes('хомяк') || s.includes('hamster')) return '🐹';
    if (s.includes('попугай') || s.includes('parrot')) return '🦜';
    if (s.includes('рыбк') || s.includes('fish')) return '🐟';
    if (s.includes('черепах') || s.includes('turtle')) return '🐢';
    if (s.includes('кролик') || s.includes('rabbit')) return '🐇';
    return '🐾';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Мои бронирования</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">У вас пока нет бронирований</p>
            <Link
              href="/"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Найти питомца
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-xl shadow-md overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-48 h-48 sm:h-auto bg-gray-200 flex items-center justify-center text-6xl">
                    {booking.pet?.image_url ? (
                      <img
                        src={mediaUrl(booking.pet.image_url)}
                        alt={booking.pet.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{booking.pet ? getSpeciesEmoji(booking.pet.species) : '🐾'}</span>
                    )}
                  </div>

                  <div className="flex-1 p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {booking.pet?.name || 'Неизвестный питомец'}
                        </h3>
                        <p className="text-gray-500">
                          {booking.pet?.species}
                        </p>
                        {booking.pet?.age !== null && booking.pet?.age !== undefined && (
                          <p className="text-sm text-gray-600 mt-1">
                            <Calendar className="inline h-4 w-4 mr-1" />
                            {booking.pet.age} лет
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleCancel(booking.id)}
                        disabled={cancelingId === booking.id}
                        className="text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        {cancelingId === booking.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Забронировано: {new Date(booking.created_at).toLocaleDateString('ru-RU')}
                      </span>

                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => router.push(`/chat?user=${booking.pet?.user_id}`)}
                          className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center space-x-1"
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span>Написать</span>
                        </button>
                        <Link
                          href={`/pet/${booking.pet_id}`}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Подробнее
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
