'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI, User as UserType, Pet, Complaint } from '@/lib/api';
import {
  Calendar, Clock,
  Loader2, Flag, Ban
} from 'lucide-react';
import UserIcon from '@/components/UserIcon';
import { PageShell, SurfaceCard, StatTile, ToneBadge, EmptyState } from '@/components/ui';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'pets' | 'users' | 'complaints'>('stats');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!savedUser || !token) {
      router.push('/login');
      return;
    }
    const userData = JSON.parse(savedUser);
    if (!userData.is_admin) {
      router.push('/');
      return;
    }
    setUser(userData);
    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, petsRes, usersRes, complaintsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getAllPets(),
        adminAPI.getAllUsers(),
        adminAPI.getComplaints(),
      ]);
      setStats(statsRes.data);
      setPets(petsRes.data);
      setUsers(usersRes.data);
      setComplaints(complaintsRes.data);
    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (petId: number) => {
    setActionLoading(petId);
    try {
      await adminAPI.approvePet(petId);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (petId: number) => {
    setActionLoading(petId);
    try {
      await adminAPI.rejectPet(petId);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlock = async (userId: number) => {
    try {
      await adminAPI.blockUser(userId);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnblock = async (userId: number) => {
    try {
      await adminAPI.unblockUser(userId);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePet = async (petId: number) => {
    if (!confirm('Удалить эту анкету?')) return;
    try {
      await adminAPI.deletePet(petId);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveComplaint = async (type: string, id: number) => {
    setActionLoading(id);
    try {
      await adminAPI.resolveComplaint(type, id);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBanFromComplaint = async (type: string, id: number) => {
    if (!confirm('Заблокировать пользователя?')) return;
    setActionLoading(id);
    try {
      await adminAPI.banFromComplaint(type, id);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex min-h-screen items-center justify-center px-4">
          <SurfaceCard className="flex items-center gap-3 px-7 py-5">
            <Loader2 className="h-8 w-8 animate-spin text-accent-text" />
            <span className="font-semibold text-content-primary">Загружаем панель…</span>
          </SurfaceCard>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8">
          <h1 className="heading-title">Админ-панель</h1>
          <p className="mt-1 text-sm text-content-secondary">Управление платформой</p>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[240px_1fr]">
          <nav className="surface-card p-2 lg:sticky lg:top-[88px]" aria-label="Разделы админ-панели">
            <button
              onClick={() => setActiveTab('stats')}
              aria-pressed={activeTab === 'stats'}
              className={`flex min-h-[40px] w-full items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors ${activeTab === 'stats' ? 'bg-surface-sunken text-content-primary' : 'text-content-secondary hover:bg-surface-sunken hover:text-content-primary'}`}
            >
              <UserIcon name="stats" className="h-4 w-4" /> Статистика
            </button>
            <button
              onClick={() => setActiveTab('pets')}
              aria-pressed={activeTab === 'pets'}
              className={`flex min-h-[40px] w-full items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors ${activeTab === 'pets' ? 'bg-surface-sunken text-content-primary' : 'text-content-secondary hover:bg-surface-sunken hover:text-content-primary'}`}
            >
              <UserIcon name="paw" className="h-4 w-4" /> Анкеты
              <span className="ml-auto text-xs text-content-faint">{pets.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              aria-pressed={activeTab === 'users'}
              className={`flex min-h-[40px] w-full items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-surface-sunken text-content-primary' : 'text-content-secondary hover:bg-surface-sunken hover:text-content-primary'}`}
            >
              <UserIcon name="user" className="h-4 w-4" /> Пользователи
              <span className="ml-auto text-xs text-content-faint">{users.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('complaints')}
              aria-pressed={activeTab === 'complaints'}
              className={`flex min-h-[40px] w-full items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors ${activeTab === 'complaints' ? 'bg-danger-soft text-danger-text' : 'text-content-secondary hover:bg-surface-sunken hover:text-content-primary'}`}
            >
              <Flag className="h-4 w-4" /> Жалобы
              {complaints.length > 0 && (
                <span className="ml-auto min-w-[20px] rounded-full bg-danger px-1.5 py-0.5 text-center text-[11px] font-medium text-danger-on">
                  {complaints.length}
                </span>
              )}
            </button>
          </nav>

          <div className="min-w-0">

        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatTile icon={<UserIcon name="user" className="h-6 w-6" />} value={stats.users} label="Пользователей" />
            <StatTile icon={<UserIcon name="paw" className="h-6 w-6" />} value={stats.pets} label="Анкет" />
            <StatTile icon={<Calendar className="h-6 w-6" />} value={stats.bookings} label="Бронирований" />
            <StatTile icon={<Clock className="h-6 w-6" />} value={stats.pending_moderation} label="На модерации" />
          </div>
        )}

        {activeTab === 'pets' && (
          <SurfaceCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-surface-veil">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-bold text-content-muted">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-content-muted">Имя</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-content-muted">Вид</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-content-muted">Владелец</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-content-muted">Статус</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-content-muted">Модерация</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-content-muted">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {pets.map((pet) => (
                    <tr key={pet.id} className="transition-colors hover:bg-surface-veil">
                      <td className="px-4 py-3 text-sm text-content-secondary">{pet.id}</td>
                      <td className="px-4 py-3 text-sm font-bold text-content-primary">{pet.name}</td>
                      <td className="px-4 py-3 text-sm text-content-secondary">{pet.species}</td>
                      <td className="px-4 py-3 text-sm text-content-secondary">{pet.owner?.username || '—'}</td>
                      <td className="px-4 py-3 text-sm">
                        <ToneBadge tone={pet.status === 'available' ? 'leaf' : pet.status === 'booked' ? 'amber' : 'neutral'}>
                          {pet.status}
                        </ToneBadge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <ToneBadge tone={pet.moderation_status === 'approved' ? 'leaf' : pet.moderation_status === 'pending' ? 'amber' : 'rose'}>
                          {pet.moderation_status}
                        </ToneBadge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-wrap items-center gap-3">
                          {pet.moderation_status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(pet.id)}
                                disabled={actionLoading === pet.id}
                                className="inline-flex items-center gap-1 font-semibold text-success-text transition-colors hover:text-success-text disabled:opacity-50"
                              >
                                <UserIcon name="check" className="h-4 w-4" /> Одобрить
                              </button>
                              <button
                                onClick={() => handleReject(pet.id)}
                                disabled={actionLoading === pet.id}
                                className="inline-flex items-center gap-1 font-semibold text-danger-text transition-colors hover:text-danger-text disabled:opacity-50"
                              >
                                <UserIcon name="cross" className="h-4 w-4" /> Отклонить
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeletePet(pet.id)}
                            className="inline-flex items-center gap-1 font-semibold text-danger-text transition-colors hover:text-danger-text"
                            aria-label={`Удалить анкету ${pet.name}`}
                          >
                            <UserIcon name="trash" className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SurfaceCard>
        )}

        {activeTab === 'users' && (
          <SurfaceCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-surface-veil">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-bold text-content-muted">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-content-muted">Имя</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-content-muted">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-content-muted">Верифицирован</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-content-muted">Статус</th>
                    <th className="px-4 py-3 text-left text-sm font-bold text-content-muted">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {users.map((u) => (
                    <tr key={u.id} className="transition-colors hover:bg-surface-veil">
                      <td className="px-4 py-3 text-sm text-content-secondary">{u.id}</td>
                      <td className="px-4 py-3 text-sm font-bold text-content-primary">{u.username}</td>
                      <td className="px-4 py-3 text-sm text-content-secondary">{u.email}</td>
                      <td className="px-4 py-3 text-sm">
                        {u.is_verified ? (
                          <UserIcon name="check" className="h-4 w-4 text-success-text" />
                        ) : (
                          <UserIcon name="cross" className="h-4 w-4 text-danger-text" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <ToneBadge tone={u.is_blocked ? 'rose' : 'leaf'}>
                          {u.is_blocked ? 'Заблокирован' : 'Активен'}
                        </ToneBadge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {!u.is_admin && (
                          u.is_blocked ? (
                            <button onClick={() => handleUnblock(u.id)} className="font-semibold text-success-text transition-colors hover:text-success-text">
                              Разблокировать
                            </button>
                          ) : (
                            <button onClick={() => handleBlock(u.id)} className="font-semibold text-danger-text transition-colors hover:text-danger-text">
                              Заблокировать
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SurfaceCard>
        )}

        {activeTab === 'complaints' && (
          <div className="space-y-4">
            {complaints.length === 0 ? (
              <EmptyState
                icon={<Flag className="h-8 w-8" aria-hidden="true" />}
                title="Нет активных жалоб"
                description="Все обращения пользователей рассмотрены."
              />
            ) : (
              complaints.map((c) => (
                <SurfaceCard key={`${c.type}-${c.id}`} className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <ToneBadge tone={c.type === 'message' ? 'amber' : 'rose'}>
                          {c.type === 'message' ? 'На сообщение' : 'На пользователя'}
                        </ToneBadge>
                        <span className="text-xs text-content-muted">
                          {new Date(c.created_at).toLocaleString('ru-RU')}
                        </span>
                      </div>
                      <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <span className="text-content-muted">От:</span>
                        <span className="font-bold text-content-primary">{c.reporter_username}</span>
                        <span className="text-content-muted">→</span>
                        <span className="text-content-muted">На:</span>
                        <span className="font-bold text-danger-text">{c.target_username}</span>
                      </div>
                      <div className="mb-1 flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-content-muted">Причина:</span>
                        <span className="font-bold text-content-primary">{c.reason}</span>
                      </div>
                      {c.comment && (
                        <p className="mt-1 break-words text-sm italic text-content-muted">“{c.comment}”</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:ml-4">
                      <button
                        onClick={() => handleResolveComplaint(c.type, c.id)}
                        disabled={actionLoading === c.id}
                        className="btn btn-secondary disabled:opacity-50"
                      >
                        <UserIcon name="check" className="h-4 w-4" />
                        <span>Рассмотрена</span>
                      </button>
                      <button
                        onClick={() => handleBanFromComplaint(c.type, c.id)}
                        disabled={actionLoading === c.id}
                        className="btn btn-danger disabled:opacity-50"
                      >
                        <Ban className="h-4 w-4" />
                        <span>Забанить</span>
                      </button>
                    </div>
                  </div>
                </SurfaceCard>
              ))
            )}
          </div>
        )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
