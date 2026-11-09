'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { petsAPI, bookingsAPI, messagesAPI, Pet, User, mediaUrl } from '@/lib/api';
import PetMap from '@/components/PetMap';
import PetPlaceholder from '@/components/PetPlaceholder';
import {
  MapPin,
  Shield,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Clock,
  Flag,
} from 'lucide-react';
import UserIcon from '@/components/UserIcon';
import { PageShell, SurfaceCard, AlertBox, ToneBadge } from '@/components/ui';
import Modal from '@/components/Modal';

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
      setSuccess('Заявка отправлена. Владелец увидит её в личном кабинете.');
      fetchPet();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при отправке заявки');
    } finally {
      setBookingLoading(false);
    }
  };

  const closeReport = () => {
    setReportUserModal(null);
    setReportReason('');
    setReportComment('');
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
          <ToneBadge tone="leaf">
            <UserIcon name="check" className="h-4 w-4" />
            Ищет дом
          </ToneBadge>
        );
      case 'booked':
        return (
          <ToneBadge tone="amber">
            <Clock className="h-4 w-4" />
            Есть заявка
          </ToneBadge>
        );
      case 'transferred':
        return (
          <ToneBadge tone="neutral">
            <UserIcon name="check" className="h-4 w-4" />
            Передан
          </ToneBadge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[7fr_5fr] lg:gap-12">
            <div className="skeleton aspect-[4/3] rounded-lg" />
            <div className="space-y-4">
              <div className="skeleton h-6 w-28 rounded-lg" />
              <div className="skeleton h-10 w-2/3 rounded-lg" />
              <div className="skeleton h-5 w-1/2 rounded-lg" />
              <div className="skeleton h-32 w-full rounded-lg" />
              <div className="skeleton h-12 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!pet) {
    return (
      <PageShell>
        <div className="mx-auto flex max-w-[1200px] flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
          <h1 className="heading-title">Питомец не найден</h1>
          <p className="mt-2 text-content-secondary">Возможно, анкета была удалена.</p>
          <button onClick={() => router.push('/')} className="btn btn-primary mt-6">
            Вернуться на главную
          </button>
        </div>
      </PageShell>
    );
  }

  const isPending = pet.moderation_status === 'pending';
  const isRejected = pet.moderation_status === 'rejected';
  const canBook = pet.status === 'available' && pet.moderation_status === 'approved';

  return (
    <PageShell>
      <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <button
          onClick={() => router.back()}
          className="btn btn-ghost btn-sm -ml-2 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад
        </button>

        <div className="grid gap-8 lg:grid-cols-[7fr_5fr] lg:gap-12">
          <div className="min-w-0 space-y-6">
            <div className="overflow-hidden rounded-lg border border-line bg-surface-sunken">
              <div className="relative aspect-[4/3]">
                {pet.image_url ? (
                  <img
                    src={mediaUrl(pet.image_url)}
                    alt={`Фотография питомца ${pet.name}`}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <PetPlaceholder
                    species={pet.species}
                    alt={`Фотография питомца ${pet.name}`}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
              </div>
            </div>

            {pet.city && (
              <section aria-labelledby="location-heading" className="surface-card rounded-lg p-5 sm:p-6">
                <h2 id="location-heading" className="heading-sub text-lg">
                  Где находится
                </h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-content-secondary">
                  <MapPin className="h-4 w-4 text-content-faint" />
                  {pet.city}
                </p>
                {process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY && (
                  <div className="mt-4">
                    <PetMap pet={pet} />
                  </div>
                )}
              </section>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {getStatusBadge()}
              {isPending && <ToneBadge tone="amber">На проверке</ToneBadge>}
              {isRejected && <ToneBadge tone="rose">Анкета отклонена</ToneBadge>}
              {isUnknown && <ToneBadge tone="amber">Порода неизвестна</ToneBadge>}
            </div>

            <h1 className="display-title mt-3 break-words">{pet.name}</h1>
            <p className="mt-2 text-content-secondary">
              {[pet.species, !isUnknown ? pet.breed : null, pet.city].filter(Boolean).join(' · ')}
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-line py-5">
              {!isUnknown && pet.age !== null && (
                <div>
                  <dt className="text-xs font-medium text-content-faint">Возраст</dt>
                  <dd className="mt-0.5 font-semibold text-content-primary">
                    {pet.age} {pet.age === 1 ? 'год' : pet.age < 5 ? 'года' : 'лет'}
                  </dd>
                </div>
              )}
              {pet.breed && !isUnknown && (
                <div>
                  <dt className="text-xs font-medium text-content-faint">Порода</dt>
                  <dd className="mt-0.5 font-semibold text-content-primary">{pet.breed}</dd>
                </div>
              )}
              {pet.city && (
                <div>
                  <dt className="text-xs font-medium text-content-faint">Город</dt>
                  <dd className="mt-0.5 font-semibold text-content-primary">{pet.city}</dd>
                </div>
              )}
              {pet.character && (
                <div>
                  <dt className="text-xs font-medium text-content-faint">Характер</dt>
                  <dd className="mt-0.5 font-semibold text-content-primary">{pet.character}</dd>
                </div>
              )}
            </dl>

            {isUnknown && (
              <div className="mt-5">
                <AlertBox tone="warning">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Неизвестная порода</p>
                    <p className="mt-1 text-sm opacity-90">
                      Порода, состояние здоровья и характер неизвестны или указаны приблизительно. Уточняйте детали у владельца.
                    </p>
                  </div>
                </AlertBox>
              </div>
            )}

            <section className="mt-6">
              <h2 className="text-sm font-semibold text-content-muted">Описание</h2>
              <p className="mt-2 whitespace-pre-wrap leading-relaxed text-content-primary">
                {pet.description}
              </p>
            </section>

            {pet.vaccination_info && (
              <div className="alert alert-success mt-5">
                <Shield className="h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Прививки</p>
                  <p className="mt-1 text-sm opacity-90">{pet.vaccination_info}</p>
                </div>
              </div>
            )}

            {pet.health_issues && (
              <div className="alert alert-warning mt-4">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Здоровье{isUnknown ? ' (приблизительно)' : ''}</p>
                  <p className="mt-1 text-sm opacity-90">{pet.health_issues}</p>
                </div>
              </div>
            )}

            {isRejected && pet.rejection_reason && (
              <div className="alert alert-danger mt-4">
                <div>
                  <p className="font-semibold">Причина отклонения</p>
                  <p className="mt-1 text-sm opacity-90">{pet.rejection_reason}</p>
                </div>
              </div>
            )}

            {pet.owner && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-sm text-content-secondary">
                <span className="flex min-w-0 items-center">
                  <UserIcon name="user" className="mr-2 h-4 w-4 flex-shrink-0 text-content-faint" />
                  <span className="truncate">Добавил: {pet.owner.username}</span>
                </span>
                {user && user.id !== pet.owner.id && (
                  <button
                    onClick={() => setReportUserModal(pet.owner!.id)}
                    className="inline-flex items-center gap-1 whitespace-nowrap text-[13px] text-content-faint transition-colors hover:text-danger-text"
                  >
                    <Flag className="h-3.5 w-3.5" />
                    Пожаловаться
                  </button>
                )}
              </div>
            )}

            {error && (
              <div className="mt-4">
                <AlertBox tone="danger"><span className="text-sm">{error}</span></AlertBox>
              </div>
            )}

            {success && (
              <div className="mt-4">
                <AlertBox tone="success"><span className="text-sm">{success}</span></AlertBox>
              </div>
            )}

            {!isPending && !isRejected && (
              <div className="mt-6 space-y-3">
                {canBook && (
                  <button
                    onClick={handleBooking}
                    disabled={bookingLoading || user?.id === pet.user_id}
                    className="btn btn-primary btn-lg w-full"
                  >
                    {bookingLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                        <span>Отправляем…</span>
                      </>
                    ) : user?.id === pet.user_id ? (
                      <span>Это ваш питомец</span>
                    ) : (
                      <span>Отправить заявку</span>
                    )}
                  </button>
                )}

                {user && user.id !== pet.user_id && (
                  <button
                    onClick={() => router.push(`/chat?user=${pet.user_id}`)}
                    className="btn btn-secondary btn-lg w-full"
                  >
                    <UserIcon name="chat" className="h-5 w-5" />
                    <span>Написать владельцу</span>
                  </button>
                )}

                {pet.status === 'booked' && (
                  <p className="pt-1 text-center text-sm text-content-muted">
                    На питомца уже есть заявка. Можно написать владельцу и уточнить детали.
                  </p>
                )}
                {pet.status === 'transferred' && (
                  <p className="pt-1 text-center text-sm text-content-muted">
                    Питомец уже передан новому владельцу
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {reportUserModal && (
        <Modal
          open={Boolean(reportUserModal)}
          onClose={closeReport}
          labelledBy="report-user-title"
          className="max-w-sm"
        >
            <div className="flex items-center justify-between border-b border-line p-5">
              <h3 id="report-user-title" className="heading-sub text-lg">Пожаловаться</h3>
              <button
                onClick={closeReport}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-content-muted transition-colors hover:bg-surface-veil hover:text-content-primary"
                aria-label="Закрыть жалобу"
              >
                <UserIcon name="cross" className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 p-5">
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-content-primary">
                  Причина жалобы
                </legend>
                <div className="space-y-1">
                  {['Спам', 'Оскорбления', 'Мошенничество', 'Неприемлемое поведение', 'Другое'].map((r) => (
                    <label key={r} className="flex cursor-pointer items-center space-x-2 rounded-lg px-2 py-2 transition-colors hover:bg-surface-veil">
                      <input
                        type="radio"
                        name="report_reason"
                        value={r}
                        checked={reportReason === r}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="h-4 w-4 accent-[var(--accent)]"
                      />
                      <span className="text-sm text-content-secondary">{r}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div>
                <label htmlFor="report-comment" className="field-label">
                  Комментарий (необязательно)
                </label>
                <textarea
                  id="report-comment"
                  value={reportComment}
                  onChange={(e) => setReportComment(e.target.value)}
                  className="field resize-none text-sm"
                  rows={2}
                  placeholder="Что произошло?"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-line p-5">
              <button
                onClick={closeReport}
                className="btn btn-ghost"
              >
                Отмена
              </button>
              <button
                onClick={handleReportUser}
                disabled={!reportReason}
                className="btn btn-danger"
              >
                Отправить
              </button>
            </div>
        </Modal>
      )}
    </PageShell>
  );
}
