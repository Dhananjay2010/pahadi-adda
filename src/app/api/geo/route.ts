import { headers } from "next/headers";

export const dynamic = "force-dynamic";

/**
 * Coarse "where is this visitor" lookup for the join toast — city/region
 * only, nothing precise, nothing stored.
 *
 * On Vercel, the edge network stamps every request with x-vercel-ip-* geo
 * headers for free, so no third-party IP-lookup service (and no sharing of
 * the visitor's IP with one) is needed once this is deployed there. Locally,
 * or on any host that doesn't set those headers, we fall back to a generic
 * label — there's no meaningful location to report from localhost anyway.
 */
export async function GET() {
  const h = await headers();

  const city = h.get("x-vercel-ip-city");
  const region = h.get("x-vercel-ip-country-region");
  const country = h.get("x-vercel-ip-country");

  if (!city && !country) {
    return Response.json({ city: null, region: null, country: null });
  }

  return Response.json({
    city: city ? decodeURIComponent(city) : null,
    region: region ? decodeURIComponent(region) : null,
    country: country ? decodeURIComponent(country) : null,
  });
}
