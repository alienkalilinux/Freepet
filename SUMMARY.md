## Objective
- Build pet adoption platform (ФРИПЕТ): pet listings, bookings, AI moderation, email verification, admin panel, messaging, complaints. Recent focus: location/city filtering for listings and guidance for Yandex Maps integration.

## Important Details
- **Backend launch fix:** `main.py` was missing `uvicorn.run()`. Added at end: `if __name__ == "__main__": import uvicorn; uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)`.
- **No venv:** `D:\ФРИПЕТ\backend\venv` does NOT exist — backend is started with `Start-Process "C:\python\python.exe" main.py -WorkingDirectory "D:\ФРИПЕТ\backend"` (Python 3.14.6). reload=True ⇒ 2 python processes (normal).
- **Frontend run warning:** do NOT run `npx next build` while the dev server runs — it overwrites `.next` → CSS 404 and the site loses all styling. Fix: kill node, delete `.next`, restart `npm run dev`.
- **Password strength:** exactly 4 states, +25% each: Плохо (25%, bg-red-500), Слабо (50%, orange), Нормально (75%, yellow), Хорошо (100%, green). Score = 4 requirements: ≥6 chars, upper+lower, digit, special char.
- **Unknown breed concept:** "Неизвестная порода" replaced "Неизвестные животные". API `is_unknown=true` now means breed IS NULL/''/ilike `%неизвестн%` — no longer species=="Неизвестно". AlertTriangle warning on PetCard/detail when species=="Неизвестно" OR breed empty/unknown.
- **Breed lists:** shared `frontend/src/lib/breeds.ts` (BREED_OPTIONS) and duplicated in `backend/routers/pets.py` (BREED_LISTS, ALL_KNOWN_BREEDS) — keep in sync.
- **«Другое» breed:** add-form breed dropdown ends with «Другое» (reveals free-text input); home filter ends with «Другое» (`other_breed=true`). The «Неизвестная порода» option was REMOVED from both dropdowns; unknown breed stays implicit when breed is empty.
- **SQLite lower() gotcha:** `lower()` only handles ASCII, so «Британская» never matches the lowercase list — `other_breed` list-exclusion is done in Python, not SQL.
- **Moderation:** for species "Неизвестно", the animal-context keyword check is skipped (services/moderation.py).
- **Booked pet deletion:** deleting a pet now deletes its Messages and Bookings first (both admin and owner routes) to avoid FK constraint failure.
- **Account switching redesigned:** removed «Сохранить аккаунт» and the count badge. Now «Добавить другой аккаунт» (saves current account to `savedAccounts`, sets `addingAccount=true`, redirects to /login) + «Переключить аккаунт» modal. Login page shows hint/button text when addingAccount=true.
- **City feature (backend done):** `city` columns on pets and users (auto-ALTER in init_db), `POST /api/auth/city`, register accepts city, pets list accepts `city` ilike filter.
- **City feature (frontend done):** add form city field + FormData submit; PetCard & pet detail display city with MapPin; home page «Мой город» button (MapPin) toggles filter by user city; if user has no city → modal to enter & save via `/api/auth/city` (no login → redirect to /login); active-city banner with clear (X) button. `tsc --noEmit` passes.
- **Yandex Maps — JS API (client-side geocoding):** NO server-side HTTP geocoder. Key `NEXT_PUBLIC_YANDEX_MAPS_KEY` in `frontend/.env.local` (e5f75958-11e6-4dbb-8c40-898a3f92626e, valid JS API key) used to load Yandex Maps JS API 2.1 via `@pbe/react-yandex-maps@^1.2.5` (a v2.1 wrapper exposing `useYMaps` → global `ymaps`). Pet detail page shows block «Где находится» → `PetMap` (dynamic, ssr:false) → `YandexMap` uses `ymaps.geocode(city)` client-side, then renders Map+Placemark. CRITICAL: must pass `load:'package.full'` in YMaps `query` AND `useYMaps(['geocode'])`, else `ymaps.geocode is not a function` (lib default load pkg is minimal). The user's provided keys (`888c6bfa-…` too) FAIL for server HTTP geocoder (403) — that route was abandoned and reverted. Backend `.env` contains NO map key.
- **Location auto-detect + map fallback:** `MapPicker.tsx` (inside YMaps provider, `useYMaps(['geocode'])`) auto-runs `navigator.geolocation.getCurrentPosition` → `reverseGeocodeCity` (`lib/ymapsUtils.ts`, ymaps.geocode + Nominatim OSM fallback, Yandex `scriptError` safe) → returns city name. On failure/denied → user clicks/drags Placemark on the map, «Подтвердить» reverse-geocodes the point. `lib/cities.ts` — POPULAR_CITIES preset list. `LocationModal.tsx` (2 modes): pick — preset city buttons («Мой город» now always opens this list) + «Определить местоположение» → map mode: auto-detects, shows «Определён город: X» with «Подтвердить»/«Указать вручную» buttons (map stays open for manual confirm), plus fallback «Выбрать из списка». Wired: home «Мой город» (opens modal, `onSelect` saves via `/api/auth/city` + sets filter; `onAutoSelect` also applies) and add-pet form city field (prefilled from saved user city; «Определить» button opens modal; `onAutoSelect` fills field but KEEPS modal open so user can confirm manually / pick from list). MapPicker uses `state:{center}` (not `defaultState`) so map recentres to chosen point on «Определить автоматически».
- **Leftover DB columns:** migrating earlier added `latitude`/`longitude` on pets table — now unused/removed from model; harmless leftovers.
- **Yandex Maps:** user asked what they must do to enable Yandex Maps integration — answer still pending.
- **Preserved stack facts:** FastAPI + Next.js 14 + Tailwind + SQLite async; Gmail SMTP `fripet.kz@gmail.com` / `wecznhiaczvvbilx`; admin `admin`/`admin123` (id=1, pre-verified); testuser `testuser`/`123456` (id=2); JWT `sub` must be string; bcrypt 5.x direct usage; verification code `XXXX-XXXX`, SHA-256 hashed, 5-min expiry; Mail.ru OAuth clientId `01a0711a7fad7966b137c3b790682ab7`; SMS.ru key `11CF3E19-5915-1F94-82CE-BADFF6033737` (disabled in UI); ADMIN_USER_ID=1; auto-reply «Ожидайте рассмотрения вашего заявления»; layout `<main>` without `min-h-screen`; chat height `h-[calc(100vh-64px)]`.

## Work State
### Completed
- Backend: `breed`, `character`, `city` on Pet; `city` on User; auto-ALTER migrations in `database.py::init_db`.
- Backend: pets list filters (species, breed, character, city, is_unknown, other_breed, status_filter, search); create_pet accepts breed/character/city Form fields.
- Backend: `other_breed` filter excludes known breeds via Python filter (SQLite lower() fix); verified returns only unlisted breeds.
- Backend: pet deletion cascades Messages+Bookings first (`routers/admin.py`, `routers/pets.py`; Booking imported in pets.py).
- Backend: `GET /api/auth/me`, `POST /api/auth/city`; register stores optional city.
- Backend: HTTP-geocoder attempt fully reverted (no geocoder.py, no key in config/.env, no lat/lng in schemas/models/pets router).
- Frontend: PasswordStrength rewritten with 4-level bar.
- Frontend: add form breed dropdown with «Другое» custom-text input; species options include «Другое»/«Неизвестно»; «Неизвестная порода» option removed from breed dropdowns.
- Frontend: home page species dropdown + conditional breed dropdown («Все породы» + breeds + «Другое»), amber toggle «Неизвестная порода» + banner.
- Frontend: PetCard and pet detail show breed/character and AlertTriangle for unknown breed.
- Frontend: api.ts updated (User.city, Pet.breed/character/city, list params is_unknown/other_breed); `lib/breeds.ts` created.
- Frontend: city feature — add form city field, PetCard/pet detail MapPin city display, «Мой город» toggle button, city-save modal + banner, all wired to `/api/auth/city` and `city` filter.
- Frontend: Yandex Maps JS API map with client-side geocoding (`@pbe/react-yandex-maps` installed, `PetMap`/`YandexMap` components, `ymaps.geocode(city)`), block «Где находится» on pet detail page.
- Frontend: location detection — `MapPicker` (GPS auto-detect + clickable map with reverse geocode via `lib/ymapsUtils.ts` incl. Nominatim fallback), `LocationModal` (preset-city list + auto-detect map with confirm, manual entry option); wired into home «Мой город» modal and add-pet city field («Определить» button); add form prefills city from saved user profile and keeps map open for manual confirm. TypeScript check passes.
- Servers running: frontend `http://localhost:3000`, backend `http://localhost:8000` (+ `/docs`).

### Active
- (city + maps feature complete; JS API key works for map, geocoding happens in browser)

### Blocked
- (none)

## Next Move
1. Verify in browser (Ctrl+F5): home «Мой город» opens modal → auto-detects city via GPS (browser permission prompt) → saves & filters; if GPS denied → click map → «Подтвердить» → city set. Add-pet form: city prefilled from profile, «Определить» button works, pet detail «Где находится» map works with marker.
2. Note: browser geolocation requires secure context (localhost is OK) and user permission.

## Relevant Files
- `D:\ФРИПЕТ\backend\main.py` — added uvicorn.run() block at the end
- `D:\ФРИПЕТ\backend\database.py` — init_db auto-ALTER migrations (breed/character/city on pets, city on users); NOTE: unrelated leftover `latitude`/`longitude` columns remain in DB
- `D:\ФРИПЕТ\backend\models.py` — Pet(breed, character, city), User(city)
- `D:\ФРИПЕТ\backend\schemas.py` — PetCreate/PetResponse city, UpdateCity, UserCreate.city, UserResponse.city
- `D:\ФРИПЕТ\backend\routers\pets.py` — BREED_LISTS/ALL_KNOWN_BREEDS, list filters incl. is_unknown/other_breed/city, create_pet with breed/character/city, cascade delete
- `D:\ФРИПЕТ\backend\routers\admin.py` — delete_pet_admin cascades messages+bookings
- `D:\ФРИПЕТ\backend\routers\auth.py` — /me, /city, register city
- `D:\ФРИПЕТ\backend\services\moderation.py` — skips animal check for species "Неизвестно"
- `D:\ФРИПЕТ\frontend\.env.local` — NEW: NEXT_PUBLIC_YANDEX_MAPS_KEY (JS API key)
- `D:\ФРИПЕТ\frontend\src\lib\breeds.ts` — BREED_OPTIONS per species
- `D:\ФРИПЕТ\frontend\src\lib\ymapsUtils.ts` — reverseGeocodeCity (Yandex + Nominatim fallback) + forwardGeocodeCity (city→coords, same fallback)
- `D:\ФРИПЕТ\frontend\src\lib\cities.ts` — NEW: POPULAR_CITIES preset list (16 KZ cities)
- `D:\ФРИПЕТ\frontend\src\lib\api.ts` — User.city, Pet.breed/character/city, list params is_unknown/other_breed
- `D:\ФРИПЕТ\frontend\src\components\PetMap.tsx` — dynamic (ssr:false) wrapper, renders map when pet.city present
- `D:\ФРИПЕТ\frontend\src\components\YandexMap.tsx` — YMaps provider (load:'package.full') + ymaps.geocode(city) + Map/Placemark
- `D:\ФРИПЕТ\frontend\src\components\MapPicker.tsx` — GPS auto-detect + clickable/draggable marker map + «Подтвердить» reverse geocode; uses `state:{center}` for recentring
- `D:\ФРИПЕТ\frontend\src\components\LocationModal.tsx` — REBUILT: preset-city list mode + map/detect mode with confirm & manual-entry options
- `D:\ФРИПЕТ\frontend\src\components\PasswordStrength.tsx` — 4-state bar (25/50/75/100%)
- `D:\ФРИПЕТ\frontend\src\components\Navbar.tsx` — «Добавить другой аккаунт» / «Переключить аккаунт», no count badge
- `D:\ФРИПЕТ\frontend\src\app\login\page.tsx` — addingAccount hint and «Добавить аккаунт» button
- `D:\ФРИПЕТ\frontend\src\app\add\page.tsx` — species «Неизвестно»/«Другое», breed dropdown with «Другое» custom input, city field prefilled from profile + «Определить» button + LocationModal
- `D:\ФРИПЕТ\frontend\src\app\page.tsx` — species + conditional breed dropdown («Другое»), toggle «Неизвестная порода», amber banner, «Мой город» button + city banner + LocationModal
- `D:\ФРИПЕТ\frontend\src\components\PetCard.tsx` — unknown-breed AlertTriangle, breed/character/city display
- `D:\ФРИПЕТ\frontend\src\app\pet\[id]\page.tsx` — unknown-breed warning, breed/character/city display, «Где находится» map block