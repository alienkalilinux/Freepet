type Ymaps = any;

function tryYandexExtraction(geo: any): string | null {
  if (!geo) return null;

  const properties = geo.properties || {};
  let meta: any = null;
  let formatted: string | undefined;
  let name: string | undefined;

  try {
    meta = properties.get?.('metaDataProperty')?.GeocoderMetaData;
    formatted = meta?.Address?.formatted;
    name = properties.get?.('text') || properties.get?.('name');
  } catch {
    const all = properties.getAll ? properties.getAll() : {};
    meta = (all.metaDataProperty as any)?.GeocoderMetaData;
    formatted = meta?.Address?.formatted || all.text || all.name;
    name = all.text || all.name;
  }

  const components: Array<{ kind: string; name: string }> =
    meta?.Address?.Components || [];

  for (const kind of ['locality', 'district', 'province', 'area']) {
    const c = components.find((x) => x.kind === kind);
    if (c && c.name) {
      return c.name;
    }
  }

  const candidate = formatted || name;
  if (candidate) {
    const parts = String(candidate)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      return parts[parts.length - 1];
    }
    return parts[0] || null;
  }

  return null;
}

async function reverseGeocodeNominatim(coords: [number, number]): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=ru&lat=${coords[0]}&lon=${coords[1]}`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const a = data?.address || {};
    return (
      a.city ||
      a.town ||
      a.village ||
      a.municipality ||
      a.county ||
      a.state_district ||
      a.state ||
      null
    );
  } catch {
    return null;
  }
}

async function forwardGeocodeNominatim(city: string): Promise<[number, number] | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&accept-language=ru&limit=1&q=${encodeURIComponent(city)}`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const item = Array.isArray(data) && data[0];
    if (item?.lat && item?.lon) {
      return [parseFloat(item.lat), parseFloat(item.lon)];
    }
    return null;
  } catch {
    return null;
  }
}

export async function forwardGeocodeCity(
  ymaps: Ymaps,
  city: string
): Promise<[number, number] | null> {
  if (ymaps) {
    try {
      const result = await ymaps.geocode(city, { results: 1 });
      const geo = result?.geoObjects?.get(0);
      const coords = geo?.geometry?.getCoordinates?.();
      if (coords && coords.length === 2) {
        return [coords[0], coords[1]];
      }
    } catch (e) {
      console.warn('[forwardGeocode] yandex geocoder failed:', e);
    }
  }

  return forwardGeocodeNominatim(city);
}

export async function reverseGeocodeCity(
  ymaps: Ymaps,
  query: string | [number, number]
): Promise<string | null> {
  const coords: [number, number] | null =
    Array.isArray(query) && query.length === 2 ? [query[0], query[1]] : null;

  if (ymaps) {
    try {
      const result = await ymaps.geocode(query, { results: 1 });
      const geo = result?.geoObjects?.get(0);
      const city = tryYandexExtraction(geo);
      if (city) return city;
    } catch (e) {
      console.warn('[reverseGeocode] yandex geocoder failed:', e);
    }
  }

  if (coords) {
    const osmCity = await reverseGeocodeNominatim(coords);
    if (osmCity) return osmCity;
  }

  return null;
}