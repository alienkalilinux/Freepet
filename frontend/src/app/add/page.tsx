'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { petsAPI, User } from '@/lib/api';
import { BREED_OPTIONS } from '@/lib/breeds';
import LocationModal from '@/components/LocationModal';
import { Upload, X, AlertCircle, CheckCircle, Loader2, AlertTriangle, MapPin } from 'lucide-react';

export default function AddPetPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    character: '',
    city: '',
    age: '',
    description: '',
    vaccination_info: '',
    health_issues: '',
  });
  const [customBreed, setCustomBreed] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [locationOpen, setLocationOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!savedUser || !token) {
      router.push('/login');
      return;
    }
    const u = JSON.parse(savedUser) as User;
    setUser(u);
    if (u.city) {
      setFormData((prev) => (prev.city ? prev : { ...prev, city: u.city! }));
    }
  }, [router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Размер файла не должен превышать 5 МБ');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Допустимые форматы: JPG, PNG, GIF, WebP');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name || !formData.species || !formData.description) {
      setError('Заполните обязательные поля');
      return;
    }

    if (formData.description.length < 10) {
      setError('Описание должно содержать минимум 10 символов');
      return;
    }

    setLoading(true);

    let breedValue = '';
    if (formData.breed === 'Другое') {
      breedValue = customBreed.trim();
    } else if (formData.species !== 'Неизвестно') {
      breedValue = formData.breed;
    }

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('species', formData.species);
      if (breedValue) submitData.append('breed', breedValue);
      if (formData.character) submitData.append('character', formData.character);
      if (formData.city) submitData.append('city', formData.city);
      if (formData.age) submitData.append('age', formData.age);
      submitData.append('description', formData.description);
      if (formData.vaccination_info) submitData.append('vaccination_info', formData.vaccination_info);
      if (formData.health_issues) submitData.append('health_issues', formData.health_issues);
      if (imageFile) submitData.append('image', imageFile);

      const response = await petsAPI.create(submitData);

      if (response.data.moderation_status === 'rejected') {
        setError(
          `Анкета отклонена модерацией: ${response.data.rejection_reason || 'Нарушение правил'}`
        );
      } else {
        setSuccess('Питомец успешно добавлен! Ожидает модерации...');
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка при добавлении питомца');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-gray-900 to-slate-950 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h1 className="text-2xl font-bold text-white mb-6">
            Добавить питомца
          </h1>

          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center space-x-2 text-red-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center space-x-2 text-green-400">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Изображение питомца
              </label>
              <div className="flex items-center justify-center w-full">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-52 sm:h-64 object-cover rounded-lg border border-white/10"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-52 sm:h-64 border-2 border-white/20 border-dashed rounded-lg cursor-pointer hover:border-primary-400/50 hover:bg-white/5 transition-all duration-300">
                    <Upload className="h-12 w-12 text-slate-500 mb-2" />
                    <p className="text-sm text-slate-400">
                      Нажмите для загрузки изображения
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      JPG, PNG, GIF, WebP (макс. 5 МБ)
                    </p>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Имя питомца *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 min-h-11 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-primary-400 focus:shadow-neon-violet focus:outline-none transition-all duration-300"
                placeholder="Например: Барсик"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Вид животного *
              </label>
              <select
                name="species"
                value={formData.species}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 min-h-11 bg-slate-900 border border-white/10 rounded-lg text-white focus:border-primary-400 focus:shadow-neon-violet focus:outline-none transition-all duration-300"
                required
              >
                <option className="bg-slate-900 text-white" value="">Выберите вид</option>
                <option className="bg-slate-900 text-white" value="Собака">Собака</option>
                <option className="bg-slate-900 text-white" value="Кошка">Кошка</option>
                <option className="bg-slate-900 text-white" value="Хомяк">Хомяк</option>
                <option className="bg-slate-900 text-white" value="Попугай">Попугай</option>
                <option className="bg-slate-900 text-white" value="Рыбка">Рыбка</option>
                <option className="bg-slate-900 text-white" value="Черепаха">Черепаха</option>
                <option className="bg-slate-900 text-white" value="Кролик">Кролик</option>
                <option className="bg-slate-900 text-white" value="Другое">Другое</option>
                <option className="bg-slate-900 text-white" value="Неизвестно">Неизвестно</option>
              </select>
              {formData.species === 'Неизвестно' && (
                <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0" />
                  <p className="text-xs text-amber-400">
                    Это неизвестная порода или животное. Вид, порода, здоровье и характер неизвестны или указаны приблизительно. Указывайте только приблизительную информацию.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Порода {formData.species === 'Неизвестно' && <span className="text-amber-400">(приблизительно)</span>}
              </label>
              {formData.species === 'Неизвестно' ? (
                <input
                  type="text"
                  value="Неизвестна"
                  disabled
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-500"
                />
              ) : (
                <>
                  <select
                    name="breed"
                    value={formData.breed}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, breed: e.target.value }));
                      setCustomBreed('');
                    }}
                    className="w-full px-4 py-2.5 min-h-11 bg-slate-900 border border-white/10 rounded-lg text-white focus:border-primary-400 focus:shadow-neon-violet focus:outline-none transition-all duration-300"
                  >
                    <option className="bg-slate-900 text-white" value="">Выберите породу</option>
                    {formData.species === 'Другое' ? null : (BREED_OPTIONS[formData.species] || []).map((b) => (
                      <option className="bg-slate-900 text-white" key={b} value={b}>{b}</option>
                    ))}
                    <option className="bg-slate-900 text-white" value="Другое">Другое</option>
                  </select>
                  {formData.breed === 'Другое' && (
                    <input
                      type="text"
                      value={customBreed}
                      onChange={(e) => setCustomBreed(e.target.value)}
                      className="w-full mt-2 px-4 py-2.5 min-h-11 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-primary-400 focus:shadow-neon-violet focus:outline-none transition-all duration-300"
                      placeholder="Укажите породу вручную"
                    />
                  )}
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Характер {formData.species === 'Неизвестно' && <span className="text-amber-400">(приблизительно)</span>}
              </label>
<input
              type="text"
              name="character"
              value={formData.character}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 min-h-11 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-primary-400 focus:shadow-neon-violet focus:outline-none transition-all duration-300"
              placeholder="Например: добрый, активный, спокойный (или неизвестно)"
            />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Город / местоположение
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="flex-1 px-4 py-2.5 min-h-11 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-primary-400 focus:shadow-neon-violet focus:outline-none transition-all duration-300"
                  placeholder="Например: Алматы, Астана, Шымкент"
                />
                <button
                  type="button"
                  onClick={() => setLocationOpen(true)}
                  className="flex items-center justify-center px-4 py-2.5 rounded-lg bg-primary-600 text-white border border-primary-500/50 hover:bg-primary-500 transition-colors hover:shadow-neon-violet whitespace-nowrap"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Определить
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Возраст (лет)
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 min-h-11 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-primary-400 focus:shadow-neon-violet focus:outline-none transition-all duration-300"
                placeholder="0"
                min="0"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Описание *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2.5 min-h-11 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-primary-400 focus:shadow-neon-violet focus:outline-none transition-all duration-300"
                placeholder="Расскажите о характере, привычках, особенностях питомца (минимум 10 символов)"
                required
                minLength={10}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Информация о прививках
              </label>
              <textarea
                name="vaccination_info"
                value={formData.vaccination_info}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2.5 min-h-11 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-primary-400 focus:shadow-neon-violet focus:outline-none transition-all duration-300"
                placeholder="Какие прививки сделаны, когда последняя вакцинация"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Проблемы со здоровьем
              </label>
              <textarea
                name="health_issues"
                value={formData.health_issues}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2.5 min-h-11 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-primary-400 focus:shadow-neon-violet focus:outline-none transition-all duration-300"
                placeholder="Хронические заболевания, аллергии, особенности ухода"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group rounded-lg"
            >
              <div className="absolute -inset-1.5 bg-primary-400 rounded-xl opacity-0 group-hover:opacity-50 blur-lg transition-all duration-500" />
              <div className="absolute -inset-1 bg-primary-500 rounded-xl opacity-0 group-hover:opacity-40 blur-md transition-all duration-500" />
              <div className="relative bg-primary-600 group-hover:bg-primary-500 text-white py-3 rounded-lg transition-colors hover:shadow-neon-violet disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Добавление...</span>
                  </>
                ) : (
                  <span>Добавить питомца</span>
                )}
              </div>
            </button>
          </form>
        </div>
      </div>
      <LocationModal
        open={locationOpen}
        onClose={() => setLocationOpen(false)}
        onSelect={(city) => {
          setLocationOpen(false);
          if (city) setFormData((prev) => ({ ...prev, city }));
        }}
        onAutoSelect={(city) => {
          if (city) setFormData((prev) => ({ ...prev, city }));
        }}
      />
    </div>
  );
}