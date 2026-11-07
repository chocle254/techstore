import { z } from "zod";

/**
 * Turns a map pin into a short place description ("Moi Avenue, Nairobi Central, Nairobi") using
 * OpenStreetMap's free Nominatim service. Done on the server so we can send the identifying
 * User-Agent their usage policy asks for, and cache answers for a day.
 */
const coord = z.coerce.number().finite();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = coord.min(-90).max(90).safeParse(url.searchParams.get("lat"));
  const lng = coord.min(-180).max(180).safeParse(url.searchParams.get("lng"));
  if (!lat.success || !lng.success) return Response.json({ place: null }, { status: 400 });

  // ~10 m precision is plenty and makes neighbouring taps share a cache entry.
  const q = new URLSearchParams({ format: "jsonv2", lat: lat.data.toFixed(4), lon: lng.data.toFixed(4), zoom: "18", addressdetails: "1", "accept-language": "en" });
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${q}`, {
      headers: { "User-Agent": "JonWinClean-shop/1.0 (https://techstore-amber.vercel.app)" },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return Response.json({ place: null });
    const data = (await res.json()) as { address?: Record<string, string> };
    const a = data.address ?? {};
    const parts = [
      a.amenity || a.building || a.shop,
      a.road,
      a.neighbourhood || a.suburb || a.quarter || a.village,
      a.city_district || a.town || a.city || a.county,
    ].filter((p, i, all): p is string => !!p && all.indexOf(p) === i);
    return Response.json({ place: parts.length ? parts.join(", ") : null }, { headers: { "Cache-Control": "public, max-age=86400" } });
  } catch {
    return Response.json({ place: null });
  }
}
