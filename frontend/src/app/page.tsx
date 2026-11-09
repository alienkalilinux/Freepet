'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { petsAPI, authAPI, Pet, User } from '@/lib/api';
import PetCard from '@/components/PetCard';
import FlowField from '@/components/FlowField';
import LocationModal from '@/components/LocationModal';
import { BREED_OPTIONS } from '@/lib/breeds';
import { Search, MessagesSquare, HeartHandshake, MapPin } from 'lucide-react';
import { PageShell, PageContainer, Field, SelectField } from '@/components/ui';

export default function HomePage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('');
  const [breedFilter, setBreedFilter] = useState('');
  const [unknownOnly, setUnknownOnly] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [cityFilter, setCityFilter] = useState('');
  const [cityModalOpen, setCityModalOpen] = useState(false);

  const speciesOptions = [
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speciesFilter, breedFilter, unknownOnly, cityFilter]);

  const fetchPets = async () => {
    setLoading(true);
    try {
      const params: { species?: string; breed?: string; search?: string; city?: string; is_unknown?: boolean; other_breed?: boolean } = {};
      if (speciesFilter) params.species = speciesFilter;
      if (unknownOnly) params.is_unknown = true;
      else if (breedFilter === 'other') params.other_breed = true;
      else if (breedFilter) params.breed = breedFilter;
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
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const resetFilters = () => {
    setSearch('');
    setSpeciesFilter('');
    setBreedFilter('');
    setUnknownOnly(false);
    setCityFilter('');
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
    } catch {
      setCityFilter(city);
    }
  };

  const steps = [
    { icon: Search, title: 'Найдите', text: 'Выберите вид, породу и город.' },
    { icon: MessagesSquare, title: 'Свяжитесь', text: 'Напишите владельцу в чате.' },
    { icon: HeartHandshake, title: 'Передайте', text: 'Договоритесь о заботливом доме.' },
  ];

  return (
    <PageShell>
      <PageContainer wide>
        <section className="relative isolate overflow-hidden rounded-2xl border border-line bg-surface-raised">
          <FlowField
            seed={7}
            className="pointer-events-none absolute inset-0 h-full w-full opacity-80"
          />
          <div className="hero-veil pointer-events-none absolute inset-0" aria-hidden="true" />

          <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-14">
            <h1 className="display-title max-w-2xl">Найди себе друга</h1>
            <p className="lede mt-4 max-w-xl">
              Платформа для тех, кто хочет найти верного друга для себя или своей семьи.
              Проверенные анкеты, живое общение и ответственная передача.
            </p>

            <form onSubmit={handleSearch} className="relative mt-8 max-w-xl" role="search">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-content-muted"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Имя питомца"
                aria-label="Поиск по имени"
                className="field h-14 pl-12 pr-28"
              />
              <button type="submit" className="btn btn-primary absolute right-1.5 top-1/2 h-11 -translate-y-1/2 px-5">
                Найти
              </button>
            </form>

            <div className="mt-10 flex flex-wrap items-baseline gap-x-2 border-t border-line pt-6 text-sm">
              <span className="text-content-muted">Сейчас в приюте</span>
              <span className="tnum text-xl font-bold leading-none text-content-primary">
                {loading ? '…' : pets.length}
              </span>
              <span className="text-content-secondary">{loading ? '' : pluralPets(pets.length)}</span>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {steps.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex items-start gap-3">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-accent-text">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-[15px] font-semibold text-content-primary">{title}</span>
                    <span className="block text-sm leading-5 text-content-secondary">{text}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="catalog" className="grid items-start gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="surface-card rounded-xl p-5 lg:sticky lg:top-[88px]">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-content-primary">Фильтры</h2>
              <button type="button" onClick={resetFilters} className="btn btn-quiet btn-sm">
                Сбросить
              </button>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <p className="field-label">Вид</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="chip"
                    aria-pressed={!speciesFilter}
                    onClick={() => handleSpeciesChange('')}
                  >
                    Все
                  </button>
                  {speciesOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className="chip"
                      aria-pressed={speciesFilter === option.value}
                      onClick={() => handleSpeciesChange(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {speciesFilter && (
                <Field label="Порода">
                  <SelectField value={breedFilter} onChange={(e) => setBreedFilter(e.target.value)}>
                    <option value="">Все породы</option>
                    {breedOptions[speciesFilter]?.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                    <option value="other">Другое</option>
                  </SelectField>
                </Field>
              )}

              <Field label="Город">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    placeholder="Город"
                    className="field min-w-0 flex-1"
                    aria-label="Город"
                  />
                  <button
                    type="button"
                    onClick={() => setCityModalOpen(true)}
                    className="btn btn-secondary btn-sm flex-shrink-0 px-3"
                  >
                    Определить
                  </button>
                </div>
              </Field>

              <label className="flex items-start gap-2.5 text-sm text-content-secondary">
                <input
                  type="checkbox"
                  checked={unknownOnly}
                  onChange={(e) => setUnknownOnly(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
                />
                <span>Неизвестная порода</span>
              </label>
            </div>
          </aside>

          <div className="min-w-0">
            {cityFilter && (
              <div className="alert alert-success mb-4">
                <MapPin className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                <p className="flex-1 text-sm">
                  Показываем анкеты из города: <span className="font-semibold">{cityFilter}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setCityFilter('')}
                  className="text-sm font-semibold text-success-text underline-offset-2 hover:underline"
                  aria-label="Очистить город"
                >
                  Сбросить
                </button>
              </div>
            )}

            {unknownOnly && (
              <div className="alert alert-warning mb-4">
                <p className="text-sm">
                  Порода, состояние здоровья и характер неизвестны или указаны приблизительно —
                  уточняйте детали у владельца.
                </p>
              </div>
            )}

            {!loading && (
              <p className="mb-4 text-sm text-content-muted">
                Найдено: <span className="font-semibold text-content-primary">{pets.length}</span>{' '}
                {pluralPets(pets.length)}
              </p>
            )}

            {loading ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 min-[1200px]:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="surface-card overflow-hidden rounded-xl">
                    <div className="skeleton aspect-[4/3] w-full" />
                    <div className="space-y-2 p-4">
                      <div className="skeleton h-5 w-1/2 rounded" />
                      <div className="skeleton h-4 w-3/4 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : pets.length === 0 ? (
              <div className="px-6 py-20 text-center">
                <h2 className="text-lg font-semibold text-content-primary">Пока нет доступных питомцев</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-content-secondary">
                  Попробуйте изменить фильтры или добавьте первую анкету.
                </p>
                <Link href="/add" className="btn btn-primary mt-6">
                  Добавить питомца
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 min-[1200px]:grid-cols-3">
                {pets.map((pet) => (
                  <PetCard key={pet.id} pet={pet} />
                ))}
              </div>
            )}
          </div>
        </section>

        <LocationModal
          open={cityModalOpen}
          onClose={() => setCityModalOpen(false)}
          onSelect={handleCitySelect}
          onAutoSelect={handleCitySelect}
        />
      </PageContainer>
    </PageShell>
  );
}
