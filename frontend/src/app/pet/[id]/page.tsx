'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { petsAPI, bookingsAPI, messagesAPI, Pet, User, mediaUrl } from '@/lib/api';
import PetMap from '@/components/PetMap';
import {
  Calendar,
  MapPin,
  Heart,
  Shield,
  AlertTriangle,
  User as UserIcon,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Flag,
  X,
} from 'lucide-react';

export default function PetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const petId = Number(params.id);

  const [pet, setPet] = useState<Pet | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reportUserModal, setReportUserModal] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportComment, setReportComment] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    fetchPet();
  }, [petId]);

  const fetchPet = async () => {
    setLoading(true);
    try {
      const response = await petsAPI.get(petId);
      setPet(response.data);
    } catch (err) {
      console.error('Ошибка загрузки питомца:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setBookingLoading(true);
    setError('');
    setSuccess('');

    try {
      await bookingsAPI.create(petId);
      setSuccess('Питомец успешно забронирован!');
      fetchPet();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при бронировании');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReportUser = async () => {
    if (!reportReason || !reportUserModal) return;
    try {
      await messagesAPI.reportUser({
        reported_user_id: reportUserModal,
        reason: reportReason,
        comment: reportComment || undefined,
      });
      setReportUserModal(null);
      setReportReason('');
      setReportComment('');
      setSuccess('Жалоба отправлена');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при отправке жалобы');
    }
  };

  const isUnknown =
    pet?.species === 'Неизвестно' ||
    !pet?.breed ||
    pet.breed.trim() === '' ||
    pet.breed.toLowerCase().includes('неизвестн');

  const getStatusBadge = () => {
    if (!pet) return null;

    switch (pet.status) {
      case 'available':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-300 border border-green-500/30">
            <CheckCircle className="h-4 w-4 mr-1" />
            Доступен
          </span>
        );
      case 'booked':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Clock className="h-4 w-4 mr-1" />
            Забронирован
          </span>
        );
      case 'transferred':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-500/20 text-primary-300 border border-primary-500/30">
            <CheckCircle className="h-4 w-4 mr-1" />
            Передан
          </span>
        );
      default:
        return null;
    }
  };

  const getSpeciesEmoji = () => {
    if (!pet) return '🐾';
    const species = pet.species.toLowerCase();
    if (species.includes('собак') || species.includes('dog')) return '🐕';
    if (species.includes('кош') || species.includes('кот') || species.includes('cat')) return '🐈';
    if (species.includes('хомяк') || species.includes('hamster')) return '🐹';
    if (species.includes('попугай') || species.includes('parrot')) return '🦜';
    if (species.includes('рыбк') || species.includes('fish')) return '🐟';
    if (species.includes('черепах') || species.includes('turtle')) return '🐢';
    if (species.includes('кролик') || species.includes('rabbit')) return '🐇';
    return '🐾';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-gray-900 to-slate-950">
        <Loader2 className="h-10 w-10 text-primary-400 animate-spin" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-gray-900 to-slate-950">
        <XCircle className="h-16 w-16 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Питомец не найден</h2>
        <button
          onClick={() => router.push('/')}
          className="text-primary-400 hover:text-primary-300"
        >
          Вернуться на главную
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-gray-900 to-slate-950 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => router.back()}
          className="flex items-center -ml-2 h-11 px-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Назад
        </button>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/2">
              {pet.image_url ? (
                <img
                  src={mediaUrl(pet.image_url)}
                  alt={pet.name}
                  className="w-full h-56 sm:h-64 md:h-full object-cover"
                />
              ) : (
                <div className="w-full h-56 sm:h-64 md:h-full bg-white/5 flex items-center justify-center text-8xl">
                  {getSpeciesEmoji()}
                </div>
              )}
            </div>

            <div className="md:w-1/2 p-6">
              <div className="flex items-start justify-between mb-4 gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-white break-words">{pet.name}</h1>
                {getStatusBadge()}
              </div>

              {isUnknown && (
                <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start space-x-3">
                  <AlertTriangle className="h-6 w-6 text-amber-400 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-300">Неизвестная порода</p>
                    <p className="text-sm text-amber-400/80 mt-1">
                      Порода, состояние здоровья и характер неизвестны или указаны приблизительно и могут быть неточными. Перед принятием решения уточняйте детали у владельца.
                    </p>
                  </div>
                </div>
              )}

              <p className="text-lg text-slate-300 mb-4">{pet.species}</p>

              {pet.breed && (
                <div className="flex items-center text-slate-300 mb-3">
                  <span className="text-slate-400 w-24">Порода:</span>
                  <span>{pet.breed}</span>
                </div>
              )}

              {pet.character && (
                <div className="flex items-center text-slate-300 mb-3">
                  <span className="text-slate-400 w-24">Характер:</span>
                  <span>{pet.character}</span>
                </div>
              )}

              {pet.city && (
                <div className="flex items-center text-slate-300 mb-3">
                  <MapPin className="h-5 w-5 mr-2 text-primary-400" />
                  <span>{pet.city}</span>
                </div>
              )}

              {!isUnknown && pet.age !== null && (
                <div className="flex items-center text-slate-300 mb-3">
                  <Calendar className="h-5 w-5 mr-2 text-slate-400" />
                  <span>
                    {pet.age} {pet.age === 1 ? 'год' : pet.age < 5 ? 'года' : 'лет'}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Описание</h3>
                <p className="text-slate-300 whitespace-pre-wrap">{pet.description}</p>
              </div>

              {pet.vaccination_info && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center text-green-400 mb-2">
                    <Shield className="h-5 w-5 mr-2" />
                    <span className="font-medium">Прививки</span>
                  </div>
                  <p className="text-green-400/80 text-sm">{pet.vaccination_info}</p>
                </div>
              )}

              {pet.health_issues && (
                <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <div className="flex items-center text-amber-400 mb-2">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    <span className="font-medium">Здоровье{isUnknown ? ' (приблизительно)' : ''}</span>
                  </div>
                  <p className="text-amber-400/80 text-sm">{pet.health_issues}</p>
                </div>
              )}

              {pet.city && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-slate-400 mb-2">
                    <MapPin className="h-4 w-4 inline mr-1 text-primary-400" />
                    Где находится
                  </h3>
                  <PetMap pet={pet} />
                </div>
              )}

              {pet.owner && user && user.id !== pet.owner.id && (
                <div className="flex flex-wrap items-center justify-between gap-2 text-slate-300 mb-6 pt-4 border-t border-white/10">
                  <div className="flex items-center min-w-0">
                    <UserIcon className="h-5 w-5 mr-2 flex-shrink-0 text-slate-400" />
                    <span className="truncate">Добавил: {pet.owner.username}</span>
                  </div>
                  <button
                    onClick={() => setReportUserModal(pet.owner!.id)}
                    className="flex items-center space-x-1 text-sm text-slate-400 hover:text-red-400 transition-colors whitespace-nowrap"
                  >
                    <Flag className="h-4 w-4" />
                    <span>Пожаловаться</span>
                  </button>
                </div>
              )}
              {pet.owner && user && user.id === pet.owner.id && (
                <div className="flex items-center text-slate-300 mb-6 pt-4 border-t border-white/10">
                  <UserIcon className="h-5 w-5 mr-2 text-slate-400" />
                  <span>Добавил: {pet.owner.username}</span>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                  {success}
                </div>
              )}

              {pet.status === 'available' && pet.moderation_status === 'approved' && (
                <button
                  onClick={handleBooking}
                  disabled={bookingLoading || (user?.id === pet.user_id)}
                  className="w-full bg-primary-600 hover:bg-primary-500 text-white py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                >
                  {bookingLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Бронирование...</span>
                    </>
                  ) : user?.id === pet.user_id ? (
                    <span>Это ваш питомец</span>
                  ) : (
                    <>
                      <Heart className="h-5 w-5" />
                      <span>Забронировать</span>
                    </>
                  )}
                </button>
              )}

              {user && user.id !== pet.user_id && (
                <button
                  onClick={() => router.push(`/chat?user=${pet.user_id}`)}
                  className="w-full mt-3 border-2 border-green-600 text-green-400 py-3 rounded-lg hover:bg-green-500/10 transition-colors flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>Написать владельцу</span>
                </button>
              )}

              {pet.status === 'booked' && (
                <div className="text-center py-3 text-slate-400">
                  Питомец уже забронирован
                </div>
              )}

              {pet.moderation_status === 'pending' && (
                <div className="text-center py-3 text-amber-400">
                  Ожидает модерации
                </div>
              )}

              {pet.moderation_status === 'rejected' && (
                <div className="text-center py-3 text-red-400">
                  Анкета отклонена модерацией
                  {pet.rejection_reason && (
                    <p className="text-sm mt-1 text-red-400/80">{pet.rejection_reason}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Модалка жалобы на пользователя */}
      {reportUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="font-bold text-white">Пожаловаться на пользователя</h3>
              <button
                onClick={() => { setReportUserModal(null); setReportReason(''); setReportComment(''); }}
                className="h-11 w-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="space-y-2">
                {['Спам', 'Оскорбления', 'Мошенничество', 'Неприемлемое поведение', 'Другое'].map((r) => (
                  <label key={r} className="flex items-center space-x-2 cursor-pointer py-2">
                    <input
                      type="radio"
                      name="report_reason"
                      value={r}
                      checked={reportReason === r}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="h-4 w-4 text-primary-400 focus:ring-primary-400"
                    />
                    <span className="text-sm text-slate-300">{r}</span>
                  </label>
                ))}
              </div>
              <textarea
                value={reportComment}
                onChange={(e) => setReportComment(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-primary-400 focus:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all"
                rows={2}
                placeholder="Комментарий (необязательно)"
              />
            </div>
            <div className="flex justify-end space-x-2 p-4 border-t border-white/10">
              <button
                onClick={() => { setReportUserModal(null); setReportReason(''); setReportComment(''); }}
                className="px-4 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg text-sm transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleReportUser}
                disabled={!reportReason}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
