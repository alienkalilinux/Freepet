'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { petsAPI, authAPI, Pet, User } from '@/lib/api';
import PetCard from '@/components/PetCard';
import LocationModal from '@/components/LocationModal';
import { BREED_OPTIONS } from '@/lib/breeds';
import { Search, Filter, Heart, Loader2, HelpCircle, MapPin, X } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('');
  const [breedFilter, setBreedFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [unknownOnly, setUnknownOnly] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [cityFilter, setCityFilter] = useState('');
  const [cityModalOpen, setCityModalOpen] = useState(false);

  const speciesOptions = [
    { value: '', label: 'Все виды' },
    { value: 'Собака', label: 'Собаки' },
    { value: 'Кошка', label: 'Кошки' },
    { value: 'Хомяк', label: 'Хомяки' },
    { value: 'Попугай', label: 'Попугаи' },
    { value: 'Рыбка', label: 'Рыбки' },
    { value: 'Черепаха', label: 'Черепахи' },
    { value: 'Кролик', label: 'Кролики' },
  ];

  const breedOptions = BREED_OPTIONS;

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      setUser(u);
      if (u.city) setCityFilter(u.city);
    }
  }, []);

  useEffect(() => {
    fetchPets();
  }, [speciesFilter, breedFilter, statusFilter, unknownOnly, cityFilter]);

  const fetchPets = async () => {
    setLoading(true);
    try {
      const params: { species?: string; breed?: string; status?: string; search?: string; city?: string; is_unknown?: boolean; other_breed?: boolean } = {};
      if (speciesFilter) params.species = speciesFilter;
      if (unknownOnly) params.is_unknown = true;
      else if (breedFilter === 'other') params.other_breed = true;
      else if (breedFilter) params.breed = breedFilter;
      if (statusFilter) params.status = statusFilter;
      if (cityFilter) params.city = cityFilter;
      if (search) params.search = search;

      const response = await petsAPI.list(params);
      setPets(response.data);
    } catch (error) {
      console.error('Ошибка загрузки питомцев:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeciesChange = (value: string) => {
    setSpeciesFilter(value);
    setBreedFilter('');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPets();
  };

  const handleMyCity = () => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/login');
      return;
    }
    const u = JSON.parse(savedUser);
    setUser(u);
    setCityModalOpen(true);
  };

  const handleCitySelect = async (city: string) => {
    setCityModalOpen(false);
    try {
      const res = await authAPI.updateCity(city);
      if (res.data && res.data.city) {
        localStorage.setItem('user', JSON.stringify(res.data));
        setUser(res.data);
        setCityFilter(res.data.city);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/login');
        return;
      }
      setCityFilter(city);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-4">
            <Heart className="h-12 w-12 text-primary-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Найди себе друга
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Платформа для тех, кто хочет найти верного друга для себя или своей семьи
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по имени..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <select
                value={speciesFilter}
                onChange={(e) => handleSpeciesChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {speciesOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {speciesFilter && (
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <select
                  value={breedFilter}
                  onChange={(e) => setBreedFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Все породы</option>
                  {breedOptions[speciesFilter]?.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                  <option value="other">Другое</option>
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={() => setUnknownOnly(!unknownOnly)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                unknownOnly
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
              }`}
            >
              <HelpCircle className="h-5 w-5" />
              <span>Неизвестная порода</span>
            </button>

            <button
              type="button"
              onClick={handleMyCity}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                cityFilter
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-primary-50 text-primary-700 border-primary-300 hover:bg-primary-100'
              }`}
            >
              <MapPin className="h-5 w-5" />
              <span>{cityFilter ? user?.city || cityFilter : 'Мой город'}</span>
            </button>

            <button
              type="submit"
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Найти
            </button>
          </form>
        </div>

        {cityFilter && (
          <div className="mb-6 p-4 bg-primary-50 border border-primary-300 rounded-xl flex items-center space-x-3">
            <MapPin className="h-6 w-6 text-primary-500 flex-shrink-0" />
            <p className="text-sm text-primary-800 flex-1">
              Показываем анкеты из города: <span className="font-semibold">{cityFilter}</span>
            </p>
            <button
              type="button"
              onClick={() => setCityFilter('')}
              className="text-primary-600 hover:text-primary-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {unknownOnly && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start space-x-3">
            <HelpCircle className="h-6 w-6 text-amber-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-800">ВНИМАНИЕ: неизвестная порода</p>
              <p className="text-sm text-amber-700 mt-1">
                Порода, состояние здоровья и характер неизвестны или указаны приблизительно и могут быть неточными. Перед принятием решения уточняйте детали у владельца.
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-10 w-10 text-primary-600 animate-spin" />
          </div>
        ) : pets.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              Пока нет доступных питомцев
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pets.map((pet) => (
              <PetCard key={pet.id} pet={pet} />
            ))}
          </div>
        )}
      <LocationModal
        open={cityModalOpen}
        onClose={() => setCityModalOpen(false)}
        onSelect={handleCitySelect}
        onAutoSelect={handleCitySelect}
      />
      </div>
    </div>
  );
}
