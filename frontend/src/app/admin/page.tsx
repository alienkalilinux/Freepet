'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI, User as UserType, Pet, Complaint } from '@/lib/api';
import {
  Users, PawPrint, Calendar, Clock, CheckCircle, XCircle,
  Shield, Trash2, Loader2, AlertCircle, BarChart3, Flag, Ban
} from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center space-x-3 mb-8">
          <Shield className="h-8 w-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900">Админ панель</h1>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'stats' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 shadow'}`}
          >
            <BarChart3 className="inline h-4 w-4 mr-1" /> Статистика
          </button>
          <button
            onClick={() => setActiveTab('pets')}
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'pets' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 shadow'}`}
          >
            <PawPrint className="inline h-4 w-4 mr-1" /> Анкеты ({pets.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'users' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 shadow'}`}
          >
            <Users className="inline h-4 w-4 mr-1" /> Пользователи ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-4 py-2 rounded-lg font-medium relative ${activeTab === 'complaints' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 shadow'}`}
          >
            <Flag className="inline h-4 w-4 mr-1" /> Жалобы
            {complaints.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                {complaints.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow p-6">
              <Users className="h-8 w-8 text-blue-500 mb-2" />
              <p className="text-3xl font-bold">{stats.users}</p>
              <p className="text-gray-500">Пользователей</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <PawPrint className="h-8 w-8 text-green-500 mb-2" />
              <p className="text-3xl font-bold">{stats.pets}</p>
              <p className="text-gray-500">Анкет</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <Calendar className="h-8 w-8 text-purple-500 mb-2" />
              <p className="text-3xl font-bold">{stats.bookings}</p>
              <p className="text-gray-500">Бронирований</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <Clock className="h-8 w-8 text-yellow-500 mb-2" />
              <p className="text-3xl font-bold">{stats.pending_moderation}</p>
              <p className="text-gray-500">На модерации</p>
            </div>
          </div>
        )}

        {activeTab === 'pets' && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Имя</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Вид</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Владелец</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Статус</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Модерация</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pets.map((pet) => (
                  <tr key={pet.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{pet.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{pet.name}</td>
                    <td className="px-4 py-3 text-sm">{pet.species}</td>
                    <td className="px-4 py-3 text-sm">{pet.owner?.username || '—'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        pet.status === 'available' ? 'bg-green-100 text-green-800' :
                        pet.status === 'booked' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>{pet.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        pet.moderation_status === 'approved' ? 'bg-green-100 text-green-800' :
                        pet.moderation_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>{pet.moderation_status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm space-x-2">
                      {pet.moderation_status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(pet.id)}
                            disabled={actionLoading === pet.id}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4 inline" /> Одобрить
                          </button>
                          <button
                            onClick={() => handleReject(pet.id)}
                            disabled={actionLoading === pet.id}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4 inline" /> Отклонить
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeletePet(pet.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Имя</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Верифицирован</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Статус</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{u.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{u.username}</td>
                    <td className="px-4 py-3 text-sm">{u.email}</td>
                    <td className="px-4 py-3 text-sm">
                      {u.is_verified ? (
                        <CheckCircle className="h-4 w-4 text-green-500 inline" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 inline" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        u.is_blocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {u.is_blocked ? 'Заблокирован' : 'Активен'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {!u.is_admin && (
                        u.is_blocked ? (
                          <button onClick={() => handleUnblock(u.id)} className="text-green-600 hover:text-green-700">
                            Разблокировать
                          </button>
                        ) : (
                          <button onClick={() => handleBlock(u.id)} className="text-red-600 hover:text-red-700">
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
          </div>
        )}

        {activeTab === 'complaints' && (
          <div className="space-y-4">
            {complaints.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-12 text-center text-gray-400">
                <Flag className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Нет активных жалоб</p>
              </div>
            ) : (
              complaints.map((c) => (
                <div key={`${c.type}-${c.id}`} className="bg-white rounded-xl shadow p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center space-x-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          c.type === 'message' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {c.type === 'message' ? 'На сообщение' : 'На пользователя'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(c.created_at).toLocaleString('ru-RU')}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center space-x-2 text-sm mb-1">
                        <span className="text-gray-500">От:</span>
                        <span className="font-medium text-gray-900">{c.reporter_username}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-gray-500">На:</span>
                        <span className="font-medium text-red-600">{c.target_username}</span>
                      </div>
                      <div className="flex flex-wrap items-center space-x-2 text-sm mb-1">
                        <span className="text-gray-500">Причина:</span>
                        <span className="font-medium text-gray-900">{c.reason}</span>
                      </div>
                      {c.comment && (
                        <p className="text-sm text-gray-600 mt-1 italic break-words">"{c.comment}"</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:ml-4">
                      <button
                        onClick={() => handleResolveComplaint(c.type, c.id)}
                        disabled={actionLoading === c.id}
                        className="flex items-center space-x-1 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Рассмотрена</span>
                      </button>
                      <button
                        onClick={() => handleBanFromComplaint(c.type, c.id)}
                        disabled={actionLoading === c.id}
                        className="flex items-center space-x-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Ban className="h-4 w-4" />
                        <span>Забанить</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
