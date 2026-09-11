'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { petsAPI, authAPI, Pet, User } from '@/lib/api';
import PetCard from '@/components/PetCard';
import LocationModal from '@/components/LocationModal';
import { BREED_OPTIONS } from '@/lib/breeds';
import { Search, Filter, PawPrint, Loader2, HelpCircle, MapPin, X } from 'lucide-react';

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

  const pluralPets = (n: number) => {
    const s = n % 10;
    const t = n % 100;
    if (t >= 11 && t <= 14) return 'питомцев';
    if (s === 1) return 'питомец';
    if (s >= 2 && s <= 4) return 'питомца';
    return 'питомцев';
  };

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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-gray-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600/20 via-green-600/10 to-transparent border border-white/10 mb-8">
          <div className="absolute -right-8 -top-8 text-[11rem] leading-none opacity-10 select-none pointer-events-none" aria-hidden="true">
            🐾
          </div>
          <div className="relative px-5 py-8 sm:px-10 sm:py-12">
            <div className="flex items-center justify-center sm:justify-start mb-3">
              <PawPrint className="h-9 w-9 sm:h-10 sm:w-10 text-green-400" fill="currentColor" aria-hidden="true" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-green-400">
              Найди себе друга
            </h1>
            <p className="text-slate-300 text-base sm:text-lg max-w-xl text-center sm:text-left">
              Платформа для тех, кто хочет найти верного друга для себя или своей семьи
            </p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="text"
                placeholder="Поиск по имени..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-primary-400 focus:shadow-neon-violet focus:outline-none transition-all duration-300"
              />
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto">
              <Filter className="h-5 w-5 text-slate-500 flex-shrink-0" />
              <select
                value={speciesFilter}
                onChange={(e) => handleSpeciesChange(e.target.value)}
                className="w-full md:w-auto flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-primary-400 focus:shadow-neon-violet focus:outline-none transition-all duration-300"
              >
                {speciesOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {speciesFilter && (
              <div className="flex items-center space-x-2 w-full md:w-auto">
                <Filter className="h-5 w-5 text-slate-500 flex-shrink-0" />
                <select
                  value={breedFilter}
                  onChange={(e) => setBreedFilter(e.target.value)}
                  className="w-full md:w-auto flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-primary-400 focus:shadow-neon-violet focus:outline-none transition-all duration-300"
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
              className={`flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg border transition-colors w-full md:w-auto ${
                unknownOnly
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                  : 'bg-white/5 text-amber-400 border-white/10 hover:bg-white/10'
              }`}
            >
              <HelpCircle className="h-5 w-5" />
              <span>Неизвестная порода</span>
            </button>

            <button
              type="button"
              onClick={handleMyCity}
              className={`flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg border transition-colors w-full md:w-auto ${
                cityFilter
                  ? 'bg-primary-500/20 text-primary-300 border-primary-500/30 hover:shadow-neon-violet'
                  : 'bg-white/5 text-primary-400 border-white/10 hover:bg-white/10'
              }`}
            >
              <MapPin className="h-5 w-5" />
              <span className="truncate">{cityFilter ? user?.city || cityFilter : 'Мой город'}</span>
            </button>

            <button
              type="submit"
              className="bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-500 hover:shadow-neon-violet transition-all duration-300 w-full md:w-auto"
            >
              Найти
            </button>
          </form>
        </div>

        {cityFilter && (
          <div className="mb-6 p-4 bg-primary-500/10 border border-primary-500/30 rounded-xl flex items-center space-x-3">
            <MapPin className="h-6 w-6 text-primary-400 flex-shrink-0" />
            <p className="text-sm text-slate-300 flex-1">
              Показываем анкеты из города: <span className="font-semibold text-white">{cityFilter}</span>
            </p>
            <button
              type="button"
              onClick={() => setCityFilter('')}
              className="text-primary-400 hover:text-primary-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {unknownOnly && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start space-x-3">
            <HelpCircle className="h-6 w-6 text-amber-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-400">ВНИМАНИЕ: неизвестная порода</p>
              <p className="text-sm text-amber-400/80 mt-1">
                Порода, состояние здоровья и характер неизвестны или указаны приблизительно и могут быть неточными. Перед принятием решения уточняйте детали у владельца.
              </p>
            </div>
          </div>
        )}

        {!loading && pets.length > 0 && (
          <div className="mb-4 px-1 text-sm text-slate-400">
            Найдено: <span className="font-semibold text-primary-300">{pets.length}</span> {pluralPets(pets.length)}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-10 w-10 text-primary-400 animate-spin" />
          </div>
        ) : pets.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 text-lg">
              Пока нет доступных питомцев
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
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
