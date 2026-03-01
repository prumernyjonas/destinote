/**
 * Jednoduchý in-memory rate limiter (podle IP).
 * Pro produkci s více instancemi použijte Redis (např. @upstash/ratelimit).
 */

const windowMs = 60 * 1000; // 1 minuta
const maxRequests = 15; // max požadavků na IP za okno

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

function getIP(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xri = request.headers.get("x-real-ip");
  if (xri) return xri.trim();
  return "127.0.0.1";
}

export function isRateLimited(request: Request): boolean {
  const ip = getIP(request);
  const now = Date.now();
  let entry = store.get(ip);
  if (!entry) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(ip, entry);
    return false;
  }
  if (now >= entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + windowMs;
    return false;
  }
  entry.count++;
  return entry.count > maxRequests;
}
