export type Geo = { city: string | null; region: string | null; country: string | null };

export function placeLabel(geo: Geo): string {
  if (geo.city) return geo.city;
  if (geo.region) return geo.region;
  if (geo.country) return geo.country;
  return "पहाड़ों से";
}

/** Coarse city/region for this visitor — see src/app/api/geo/route.ts. */
export async function fetchGeo(): Promise<Geo> {
  try {
    const res = await fetch("/api/geo");
    if (!res.ok) throw new Error("geo lookup failed");
    return await res.json();
  } catch {
    return { city: null, region: null, country: null };
  }
}
