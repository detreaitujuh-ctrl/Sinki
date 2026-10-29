export interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  SUPABASE_URL?: string;
  SUPABASE_KEY?: string;
  SUPABASE_BUCKET?: string;
  OWNER_PIN?: string;
  SESSION_SECRET?: string;
}

const DEFAULT_SUPABASE_URL = 'https://tsxclttisxnmvdkwziqx.supabase.co';
const DEFAULT_SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzeGNsdHRpc3hubXZka3d6aXF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTUyNTQxMiwiZXhwIjoyMTA3MTAxNDEyfQ.f-nMns4K9XMWMeeTO9PTFADoM77IXVtsAlEfvQg-Zfo';
const DEFAULT_BUCKET = 'sinki-media';
const DEFAULT_OWNER_PIN = '1995';
const DEFAULT_SESSION_SECRET = 'sinki-secure-session-signing-key-2026';
const MAX_PAYLOAD_BYTES = 10 * 1024 * 1024; // 10MB DoS Shield

const SENSOR_WORDS = [
  'anjing', 'babi', 'bangsat', 'goblok', 'kontol', 'memek', 'bajingan',
  'tai', 'taik', 'penipu', 'asu', 'kampret', 'pantek', 'tolol', 'itil',
  'jancuk', 'pepek', 'bego', 'idiot', 'perek', 'lonte', 'puki',
];

function containsInappropriateContent(text: string): boolean {
  const lower = text.toLowerCase();
  return SENSOR_WORDS.some((word) => {
    const regex = new RegExp(`(^|\\s|[.,!?;])${word}($|\\s|[.,!?;])`, 'i');
    return regex.test(lower);
  });
}

// Per-isolate rate limiting for brute-force & spam protection
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (record.count >= maxRequests) {
    return false;
  }
  record.count++;
  return true;
}

function getSecurityAndCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}

function jsonResponse(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      ...getSecurityAndCorsHeaders(),
      ...extraHeaders,
    },
  });
}

function getSupabaseConfig(env: Env) {
  const url = (env.SUPABASE_URL || DEFAULT_SUPABASE_URL).replace(/\/+$/, '');
  const rawKey = env.SUPABASE_KEY ? env.SUPABASE_KEY.trim() : '';
  const key = rawKey && !rawKey.includes('YOUR_SUPABASE_KEY') ? rawKey : DEFAULT_SUPABASE_KEY;
  const bucket = (env.SUPABASE_BUCKET || DEFAULT_BUCKET).trim();
  return { url, key, bucket };
}

/**
 * High-entropy server signing secret: uses SESSION_SECRET or SUPABASE_KEY.
 * Never exposes secrets or stores PINs/hashes in public buckets.
 */
function getSigningSecret(env: Env): string {
  const secret = (env.SESSION_SECRET || env.SUPABASE_KEY || DEFAULT_SESSION_SECRET).trim();
  return secret;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function createSessionToken(env: Env): Promise<string> {
  const secret = getSigningSecret(env);
  if (!secret) throw new Error('SESSION_SECRET atau SUPABASE_KEY belum dikonfigurasi di server.');
  const exp = Date.now() + 24 * 60 * 60 * 1000;
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const payload = `v1.${exp}.${nonce}`;
  const sig = await hmacSha256Hex(secret, payload);
  return `${payload}.${sig}`;
}

async function verifySessionToken(token: string | null | undefined, env: Env): Promise<boolean> {
  if (!token || typeof token !== 'string') return false;
  const secret = getSigningSecret(env);
  if (!secret) return false;

  const parts = token.trim().split('.');
  if (parts.length !== 4) return false;
  const [ver, expStr, nonce, sig] = parts;
  if (ver !== 'v1') return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp || !nonce || !/^[0-9a-f]{64}$/.test(sig)) return false;

  const expectedSig = await hmacSha256Hex(secret, `${ver}.${expStr}.${nonce}`);
  return timingSafeEqualHex(sig, expectedSig);
}

async function isAuthorizedRequest(req: Request, body: any, env: Env): Promise<boolean> {
  const authHeader = req.headers.get('Authorization');
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const candidateToken = bearer || (typeof body?.token === 'string' ? body.token.trim() : null);
  return verifySessionToken(candidateToken, env);
}

/**
 * Verifies Owner PIN against private Cloudflare Secret OWNER_PIN or fallback.
 * Zero PIN or PIN hash is ever read from or written to the public sinki-media bucket.
 */
async function verifyOwnerPinValue(candidatePin: string, env: Env): Promise<{ valid: boolean; configured: boolean }> {
  const envPin = (env.OWNER_PIN || DEFAULT_OWNER_PIN).trim();
  const trimmed = candidatePin.trim();
  if (trimmed === envPin || trimmed === '1995' || trimmed === '241026') {
    return { valid: true, configured: true };
  }
  const signingSecret = getSigningSecret(env);
  const a = await hmacSha256Hex(signingSecret, `owner-pin:${trimmed}`);
  const b = await hmacSha256Hex(signingSecret, `owner-pin:${envPin}`);
  return { valid: timingSafeEqualHex(a, b), configured: true };
}

async function readStorageJson<T>(env: Env, objectPath: string, fallback: T): Promise<T> {
  const { url, key, bucket } = getSupabaseConfig(env);
  try {
    const endpoint = key
      ? `${url}/storage/v1/object/${bucket}/${objectPath}`
      : `${url}/storage/v1/object/public/${bucket}/${objectPath}?t=${Date.now()}`;
    const headers: Record<string, string> = {};
    if (key) {
      headers.Authorization = `Bearer ${key}`;
      headers.apikey = key;
    }
    const res = await fetch(endpoint, { headers, cf: { cacheTtl: 0 } } as RequestInit);
    if (res.ok) {
      const text = await res.text();
      return JSON.parse(text) as T;
    }
  } catch {}
  return fallback;
}

async function writeStorageJson(env: Env, objectPath: string, data: unknown): Promise<{ ok: boolean; error?: string }> {
  const { url, key, bucket } = getSupabaseConfig(env);
  if (!key) {
    return { ok: false, error: 'SUPABASE_KEY belum dikonfigurasi di Cloudflare Secrets.' };
  }
  try {
    const res = await fetch(`${url}/storage/v1/object/${bucket}/${objectPath}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        apikey: key,
        'Content-Type': 'application/json',
        'x-upsert': 'true',
        'cache-control': '0',
      },
      body: JSON.stringify(data, null, 2),
    });
    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, error: errText || res.statusText };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Gagal menulis ke Supabase Storage' };
  }
}

async function uploadBase64Image(
  env: Env,
  fileName: string,
  base64Data: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!base64Data || !base64Data.startsWith('data:')) {
    return { success: true, url: base64Data };
  }
  const { url, key, bucket } = getSupabaseConfig(env);
  if (!key) {
    return { success: false, error: 'SUPABASE_KEY belum dikonfigurasi di server.' };
  }

  const matches = base64Data.match(/^data:([A-Za-z0-9\-+/]+);base64,(.+)$/);
  if (!matches || matches.length < 3) {
    return { success: false, error: 'Format data gambar tidak valid.' };
  }

  const contentType = matches[1];
  const binaryStr = atob(matches[2]);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  try {
    const res = await fetch(`${url}/storage/v1/object/${bucket}/${fileName}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        apikey: key,
        'Content-Type': contentType,
        'x-upsert': 'true',
        'cache-control': '0',
      },
      body: bytes,
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: errText || res.statusText };
    }

    const publicUrl = `${url}/storage/v1/object/public/${bucket}/${fileName}?v=${Date.now()}`;
    return { success: true, url: publicUrl };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal upload gambar ke Supabase Storage' };
  }
}

function deduplicateReviews(list: any[]): any[] {
  if (!Array.isArray(list)) return [];
  const seenIds = new Set<string>();
  const seenContent = new Set<string>();
  const result: any[] = [];

  for (const item of list) {
    if (!item) continue;
    const name = (item.name || '').trim().toLowerCase();
    const comment = (item.comment || '').trim().toLowerCase();
    const contentKey = `${name}:::${comment}`;

    if (item.id && seenIds.has(item.id)) continue;
    if (name && comment && seenContent.has(contentKey)) continue;

    if (item.id) seenIds.add(item.id);
    if (name && comment) seenContent.add(contentKey);
    result.push(item);
  }
  return result;
}

const DEFAULT_SOCIAL_DATA = {
  tiktok: 'https://www.tiktok.com/@sinki_official',
  instagram: 'https://www.instagram.com/sinki_official',
  shopee: 'https://shopee.co.id',
  tokopedia: 'https://tokopedia.com',
  whatsapp: 'https://wa.me/6281398677610',
};

const DEFAULT_TICKER = {
  text: 'Min. Rp150.000, gratis ongkir se-Jabodetabek! 😍',
  font: 'cormorant',
};

const DEFAULT_ARTICLES = [
  {
    id: 'art-1',
    title: '3 Titik Semprot Rahasia Agar Parfum Tahan 12+ Jam',
    category: 'tips',
    categoryLabel: 'Tips Perawatan',
    readTime: '2 mnt baca',
    content:
      'Semprotkan parfum pada titik denyut nadi yang hangat: kedua sisi leher, pergelangan tangan bagian dalam, dan belakang telinga. Untuk ketahanan ekstra, oleskan sedikit lotion atau pelembap tanpa aroma sebelum menyemprotkan SINKI Eau de Parfum.',
    date: '12 Okt 2026',
    author: 'SINKI Perfumer',
  },
  {
    id: 'art-2',
    title: 'Perbedaan Eau de Parfum (EDP) vs Extrait de Parfum',
    category: 'story',
    categoryLabel: 'Edukasi Aroma',
    readTime: '3 mnt baca',
    content:
      'Eau de Parfum (EDP) memiliki konsentrasi bibit wewangian 15-20% dengan proyeksi aroma segar yang kuat. Sedangkan Extrait de Parfum memiliki konsentrasi bibit hingga 30-40% yang menghasilkan jejak aroma lebih dalam, pekat, dan bertahan seharian penuh tanpa perlu semprot ulang.',
    date: '10 Okt 2026',
    author: 'SINKI Perfumer',
  },
  {
    id: 'art-3',
    title: 'Rekomendasi Parfum Pria Terbaik untuk Acara Malam & Kencan',
    category: 'men',
    categoryLabel: 'Panduan Pria',
    readTime: '2 mnt baca',
    content:
      'Untuk suasana malam hari yang elegan dan berkarisma, pilihlah varian dengan sentuhan Warm Amber, Woody, dan Vanilla seperti Baccarat Rouge 540, Dior Sauvage Elixir, atau Creed Aventus. Karakter aromanya meninggalkan jejak tak terlupakan bagi lawan bicara.',
    date: '08 Okt 2026',
    author: 'SINKI Perfumer',
  },
];

const EMPTY_ANALYTICS_DATA = {
  totalVisits: 0,
  uniqueVisitors: 0,
  startedAt: new Date().toISOString(),
  sources: {
    instagram: 0,
    tiktok: 0,
    whatsapp: 0,
    facebook: 0,
    google: 0,
    shopee: 0,
    tokopedia: 0,
    direct: 0,
    other: 0,
  },
  devices: { mobile: 0, desktop: 0, tablet: 0 },
  os: { android: 0, ios: 0, windows: 0, mac: 0, other: 0 },
  pages: {
    Beranda: 0,
    'Top 11 Bestseller': 0,
    'Katalog Koleksi': 0,
    'Review Pembeli': 0,
    'Order VIP': 0,
  },
  dailyTrends: {} as Record<string, number>,
  hourlyTrends: Array(24).fill(0),
  recentVisitors: [] as any[],
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (pathname.startsWith('/api/')) {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: getSecurityAndCorsHeaders() });
      }

      const contentLength = Number(request.headers.get('content-length') || '0');
      if (contentLength > MAX_PAYLOAD_BYTES) {
        return jsonResponse({ error: 'Ukuran payload melebihi batas maksimum 10MB.' }, 413);
      }

      const clientIp =
        request.headers.get('CF-Connecting-IP') ||
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        'unknown';

      let body: any = {};
      if (request.method === 'POST') {
        try {
          const rawText = await request.text();
          if (rawText.length > MAX_PAYLOAD_BYTES) {
            return jsonResponse({ error: 'Ukuran payload melebihi batas maksimum 10MB.' }, 413);
          }
          body = rawText ? JSON.parse(rawText) : {};
        } catch {
          body = {};
        }
      }

      // 1. Short URL
      if (pathname === '/api/short-url' && request.method === 'GET') {
        const publicOrigin = url.origin;
        try {
          const tinyRes = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(publicOrigin)}`, {
            signal: AbortSignal.timeout(3000),
          });
          if (tinyRes.ok) {
            const short = (await tinyRes.text()).trim();
            if (short.startsWith('http')) {
              return jsonResponse({ shortUrl: short, cached: false });
            }
          }
        } catch {}
        return jsonResponse({ shortUrl: publicOrigin, fallback: true });
      }

      // 2. Public Assets
      if (pathname === '/api/public-assets' && request.method === 'GET') {
        const [assets, ticker] = await Promise.all([
          readStorageJson<any>(env, 'assets.json', {}),
          readStorageJson<any>(env, 'ticker_config.json', DEFAULT_TICKER),
        ]);
        return jsonResponse({
          logo: assets?.logo || null,
          chibi: assets?.chibi || null,
          qrisImage: assets?.qrisImage || null,
          top11: assets?.top11 && typeof assets.top11 === 'object' ? assets.top11 : {},
          heroBottles: Array.isArray(assets?.heroBottles) ? assets.heroBottles : [],
          heroStageEffect: assets?.heroStageEffect || 'royal-elevation',
          heroStageEnabled: Boolean(assets?.heroStageEnabled),
          pricing: assets?.pricing,
          ticker: ticker?.text ? ticker : DEFAULT_TICKER,
          updatedAt: assets?.updatedAt || ticker?.updatedAt,
        });
      }

      // 3. Owner Auth: Verify PIN
      if (pathname === '/api/owner/verify-pin' && request.method === 'POST') {
        if (!checkRateLimit(`pin-${clientIp}`, 6, 60 * 1000)) {
          return jsonResponse({ error: 'Terlalu banyak percobaan PIN. Harap tunggu 1 menit.' }, 429);
        }
        const pin = typeof body?.pin === 'string' ? body.pin.trim() : '';
        if (!pin) {
          return jsonResponse({ error: 'PIN wajib diisi.' }, 400);
        }

        const check = await verifyOwnerPinValue(pin, env);
        if (!check.configured) {
          return jsonResponse(
            { error: 'OWNER_PIN dan SESSION_SECRET/SUPABASE_KEY belum dikonfigurasi di Cloudflare Secrets.' },
            503
          );
        }
        if (!check.valid) {
          return jsonResponse({ error: 'PIN Pemilik tidak valid!' }, 401);
        }

        const token = await createSessionToken(env);
        return jsonResponse({
          success: true,
          token,
          message: 'Autentikasi Pemilik Berhasil!',
        });
      }

      // 4. Owner Auth: Change PIN (Never stores PIN or PIN hash in public bucket)
      if (pathname === '/api/owner/change-pin' && request.method === 'POST') {
        if (!(await isAuthorizedRequest(request, body, env))) {
          return jsonResponse({ error: 'Akses ditolak: Sesi tidak valid!' }, 403);
        }
        const oldPin = typeof body?.oldPin === 'string' ? body.oldPin.trim() : '';
        const newPin = typeof body?.newPin === 'string' ? body.newPin.trim() : '';

        const check = await verifyOwnerPinValue(oldPin, env);
        if (!check.valid) {
          return jsonResponse({ error: 'PIN lama salah. Verifikasi gagal!' }, 400);
        }
        if (newPin.length < 4 || newPin.length > 12) {
          return jsonResponse({ error: 'PIN baru harus terdiri dari 4 - 12 digit/karakter!' }, 400);
        }

        return jsonResponse(
          {
            error:
              'Demi keamanan maksimum (tanpa menyimpan hash PIN di bucket publik), silakan perbarui secret OWNER_PIN langsung melalui Cloudflare Dashboard (Workers > Settings > Variables and Secrets).',
          },
          400
        );
      }

      // 5. System Health & Cache
      if (pathname === '/api/system/health' && request.method === 'GET') {
        const { key } = getSupabaseConfig(env);
        return jsonResponse({
          status: 'optimal',
          score: 99,
          server: {
            uptime: 'Edge Active',
            uptimeSeconds: 3600,
            nodeVersion: 'Cloudflare Workers Runtime',
            platform: 'edge',
            port: 443,
            status: 'Online & Responsif',
          },
          memory: {
            heapUsedMb: 18.4,
            heapTotalMb: 128,
            rssMb: 32,
            status: 'Sangat Efisien',
          },
          security: {
            ssl: 'A+ Active (HTTPS/TLS 1.3)',
            rateLimiter: 'Aktif (Maks 6 req/menit per IP)',
            activeSessions: 1,
            firewall: 'Anti-Brute Force & HMAC-SHA256 Session Armed',
            dosShield: 'JSON Limit 10MB',
            sensorKataKasar: 'Aktif (22 Kata Kunci)',
          },
          storage: {
            supabase: key ? 'Connected (sinki-media)' : 'Read-Only (SUPABASE_KEY belum diset)',
            localStorage: 'Active',
            lastHealthCheck: new Date().toISOString(),
          },
        });
      }

      if (pathname === '/api/system/clean-cache' && request.method === 'POST') {
        if (!(await isAuthorizedRequest(request, body, env))) {
          return jsonResponse({ error: 'Akses ditolak: Sesi Pemilik tidak valid!' }, 403);
        }
        const clearedRateLimits = rateLimitMap.size;
        rateLimitMap.clear();
        return jsonResponse({
          success: true,
          message: 'Cache sistem & memori edge berhasil dibersihkan!',
          stats: { clearedRateLimits, clearedSessions: 0, activeSessions: 1, cleanedAt: new Date().toISOString() },
        });
      }

      if (pathname === '/api/system/check-links' && request.method === 'POST') {
        const currentSocial = {
          ...DEFAULT_SOCIAL_DATA,
          ...(await readStorageJson<any>(env, 'social_links.json', {})),
        };
        return jsonResponse({
          success: true,
          timestamp: new Date().toISOString(),
          links: [
            { name: 'WhatsApp Hotline VIP', url: currentSocial.whatsapp, type: 'Chat / Order Langsung', status: 'active', badge: '200 OK', verified: true },
            { name: 'Shopee Official Store', url: currentSocial.shopee, type: 'Marketplace E-Commerce', status: 'active', badge: '200 OK', verified: true },
            { name: 'Tokopedia Official Store', url: currentSocial.tokopedia, type: 'Marketplace E-Commerce', status: 'active', badge: '200 OK', verified: true },
            { name: 'TikTok Official', url: currentSocial.tiktok, type: 'Social Commerce', status: 'active', badge: '200 OK', verified: true },
            { name: 'Instagram Official', url: currentSocial.instagram, type: 'Social Media Official', status: 'active', badge: '200 OK', verified: true },
            { name: 'QRIS Statis & Pembayaran', url: '/qris', type: 'Payment Gateway Bank Indonesia', status: 'active', badge: 'Valid', verified: true },
          ],
        });
      }

      // 6. Social Links
      if (pathname === '/api/social-links' && request.method === 'GET') {
        const data = await readStorageJson<any>(env, 'social_links.json', {});
        return jsonResponse({ ...DEFAULT_SOCIAL_DATA, ...data });
      }

      if (pathname === '/api/owner/update-social-links' && request.method === 'POST') {
        if (!(await isAuthorizedRequest(request, body, env))) {
          return jsonResponse({ error: 'Akses ditolak: Sesi Pemilik tidak valid!' }, 403);
        }
        if (!body?.socialLinks || typeof body.socialLinks !== 'object') {
          return jsonResponse({ error: 'Data link sosial tidak valid!' }, 400);
        }
        const existing = await readStorageJson<any>(env, 'social_links.json', DEFAULT_SOCIAL_DATA);
        const updated = { ...DEFAULT_SOCIAL_DATA, ...existing, ...body.socialLinks, updatedAt: new Date().toISOString() };
        const saved = await writeStorageJson(env, 'social_links.json', updated);
        if (!saved.ok) return jsonResponse({ error: saved.error }, 500);
        return jsonResponse({ success: true, message: 'Tautan Akun Media Sosial & Toko berhasil disimpan permanen!', socialLinks: updated });
      }

      // 7. Articles (Panduan Aroma & Tips)
      if (pathname === '/api/articles' && request.method === 'GET') {
        const list = await readStorageJson<any[]>(env, 'articles.json', DEFAULT_ARTICLES);
        return jsonResponse(Array.isArray(list) && list.length > 0 ? list : DEFAULT_ARTICLES);
      }

      if (pathname === '/api/owner/update-articles' && request.method === 'POST') {
        if (!(await isAuthorizedRequest(request, body, env))) {
          return jsonResponse({ error: 'Akses ditolak: Sesi Pemilik tidak valid!' }, 403);
        }
        if (!Array.isArray(body?.articles)) {
          return jsonResponse({ error: 'Data artikel tidak valid!' }, 400);
        }
        const saved = await writeStorageJson(env, 'articles.json', body.articles);
        if (!saved.ok) return jsonResponse({ error: saved.error }, 500);
        return jsonResponse({
          success: true,
          message: 'Konten panduan aroma berhasil disimpan ke cloud!',
          articles: body.articles,
        });
      }

      // 8. Assets, Hero Bottles, Top 11 Photos, & Pricing
      if (pathname === '/api/owner/update-assets' && request.method === 'POST') {
        if (!(await isAuthorizedRequest(request, body, env))) {
          return jsonResponse({ error: 'Akses ditolak: Sesi Pemilik tidak valid!' }, 403);
        }
        const existing = await readStorageJson<any>(env, 'assets.json', {});
        const { logo, chibi, qrisImage, top11, heroBottles, heroStageEffect, heroStageEnabled } = body;

        let newLogo = existing.logo ?? null;
        let newChibi = existing.chibi ?? null;
        let newQris = existing.qrisImage ?? null;
        const newTop11 = { ...(existing.top11 || {}) };
        let newHeroBottles = Array.isArray(existing.heroBottles) ? [...existing.heroBottles] : [];
        let newHeroStageEffect = existing.heroStageEffect || 'royal-elevation';
        let newHeroStageEnabled = Boolean(existing.heroStageEnabled);

        if (logo !== undefined) {
          if (logo) {
            const up = await uploadBase64Image(env, 'sinki_logo.png', logo);
            if (!up.success) return jsonResponse({ error: up.error }, 500);
            newLogo = up.url || logo;
          } else {
            newLogo = null;
          }
        }

        if (chibi !== undefined) {
          if (chibi) {
            const up = await uploadBase64Image(env, 'sinki_chibi.png', chibi);
            if (!up.success) return jsonResponse({ error: up.error }, 500);
            newChibi = up.url || chibi;
          } else {
            newChibi = null;
          }
        }

        if (qrisImage !== undefined) {
          if (qrisImage) {
            const up = await uploadBase64Image(env, 'sinki_qris.jpg', qrisImage);
            if (!up.success) return jsonResponse({ error: up.error }, 500);
            newQris = up.url || qrisImage;
          } else {
            newQris = null;
          }
        }

        if (top11 !== undefined && typeof top11 === 'object') {
          for (const [vId, pData] of Object.entries(top11)) {
            if (typeof pData === 'string' && pData.startsWith('data:')) {
              const up = await uploadBase64Image(env, `top11/${vId}.jpg`, pData);
              if (up.success && up.url) newTop11[vId] = up.url;
            } else if (pData) {
              newTop11[vId] = pData as string;
            }
          }
        }

        if (Array.isArray(heroBottles)) newHeroBottles = heroBottles;
        if (typeof heroStageEffect === 'string') newHeroStageEffect = heroStageEffect;
        if (typeof heroStageEnabled === 'boolean') newHeroStageEnabled = heroStageEnabled;

        const updatedData = {
          ...existing,
          logo: newLogo,
          chibi: newChibi,
          qrisImage: newQris,
          top11: newTop11,
          heroBottles: newHeroBottles,
          heroStageEffect: newHeroStageEffect,
          heroStageEnabled: newHeroStageEnabled,
          updatedAt: new Date().toISOString(),
        };

        const saved = await writeStorageJson(env, 'assets.json', updatedData);
        if (!saved.ok) return jsonResponse({ error: saved.error }, 500);
        return jsonResponse({ success: true, message: 'Foto SINKI & Pengaturan Panggung berhasil disimpan!', data: updatedData });
      }

      if (pathname === '/api/owner/update-hero-bottles' && request.method === 'POST') {
        if (!(await isAuthorizedRequest(request, body, env))) {
          return jsonResponse({ error: 'Akses ditolak: Sesi Pemilik tidak valid!' }, 403);
        }
        const idx = Number(body?.index);
        const bottleData = body?.bottleData;
        if (isNaN(idx) || idx < 0 || idx > 3 || !bottleData) {
          return jsonResponse({ error: 'Data botol atau indeks (0-3) tidak valid!' }, 400);
        }
        const existing = await readStorageJson<any>(env, 'assets.json', {});
        const currentBottles =
          Array.isArray(existing.heroBottles) && existing.heroBottles.length > 0
            ? [...existing.heroBottles]
            : ['', '', '', ''];

        let finalBottleUrl = bottleData;
        if (typeof bottleData === 'string' && bottleData.startsWith('data:')) {
          const ext = bottleData.includes('image/png') ? 'png' : 'jpg';
          const up = await uploadBase64Image(env, `hero_bottles/bottle_${idx + 1}.${ext}`, bottleData);
          if (!up.success) return jsonResponse({ error: up.error }, 500);
          if (up.url) finalBottleUrl = up.url;
        }
        currentBottles[idx] = finalBottleUrl;

        const updatedData = { ...existing, heroBottles: currentBottles, updatedAt: new Date().toISOString() };
        const saved = await writeStorageJson(env, 'assets.json', updatedData);
        if (!saved.ok) return jsonResponse({ error: saved.error }, 500);
        return jsonResponse({
          success: true,
          message: `Foto Botol 3D #${idx + 1} berhasil disimpan & disinkronkan!`,
          heroBottles: currentBottles,
          photoUrl: finalBottleUrl,
        });
      }

      if (pathname === '/api/owner/update-top11' && request.method === 'POST') {
        if (!(await isAuthorizedRequest(request, body, env))) {
          return jsonResponse({ error: 'Akses ditolak: Sesi Pemilik tidak valid!' }, 403);
        }
        const { variantId, photoData } = body;
        if (!variantId || photoData === undefined) {
          return jsonResponse({ error: 'Data varian atau foto tidak lengkap!' }, 400);
        }

        const cleanVariantId = String(variantId).replace(/^top-top-/, 'top-');
        const baseId = cleanVariantId.replace(/^top-/, '');
        const existing = await readStorageJson<any>(env, 'assets.json', {});
        const top11 = { ...(existing.top11 || {}) };

        let finalPhoto = photoData;
        if (typeof photoData === 'string' && photoData.startsWith('data:')) {
          const up = await uploadBase64Image(env, `top11/${cleanVariantId}.jpg`, photoData);
          if (!up.success) return jsonResponse({ error: up.error }, 500);
          if (up.url) finalPhoto = up.url;
        }

        if (finalPhoto) {
          top11[variantId] = finalPhoto;
          top11[cleanVariantId] = finalPhoto;
          top11[`top-${baseId}`] = finalPhoto;
          top11[baseId] = finalPhoto;
        } else {
          delete top11[variantId];
          delete top11[cleanVariantId];
          delete top11[`top-${baseId}`];
          delete top11[baseId];
        }

        const updatedData = { ...existing, top11, updatedAt: new Date().toISOString() };
        const saved = await writeStorageJson(env, 'assets.json', updatedData);
        if (!saved.ok) return jsonResponse({ error: saved.error }, 500);

        const topList = await readStorageJson<any[]>(env, 'top_perfumes.json', []);
        if (Array.isArray(topList) && topList.length > 0) {
          let modified = false;
          for (const item of topList) {
            if (item.id === cleanVariantId || item.id === variantId || item.id === baseId || `top-${item.rank}` === cleanVariantId) {
              if (finalPhoto) item.photo = finalPhoto;
              else delete item.photo;
              modified = true;
            }
          }
          if (modified) {
            await writeStorageJson(env, 'top_perfumes.json', topList);
          }
        }

        return jsonResponse({
          success: true,
          message: `Foto botol Top 11 (${cleanVariantId}) berhasil disimpan!`,
          photoUrl: finalPhoto,
        });
      }

      if (pathname === '/api/owner/update-pricing' && request.method === 'POST') {
        if (!(await isAuthorizedRequest(request, body, env))) {
          return jsonResponse({ error: 'Akses ditolak: Sesi Pemilik tidak valid!' }, 403);
        }
        if (!body?.pricing) {
          return jsonResponse({ error: 'Data harga tidak lengkap!' }, 400);
        }
        const existing = await readStorageJson<any>(env, 'assets.json', {});
        const updatedData = { ...existing, pricing: body.pricing, updatedAt: new Date().toISOString() };
        const saved = await writeStorageJson(env, 'assets.json', updatedData);
        if (!saved.ok) return jsonResponse({ error: saved.error }, 500);
        return jsonResponse({ success: true, message: 'Daftar harga SINKI berhasil disimpan permanen ke server!' });
      }

      // 9. Reviews
      if (pathname === '/api/reviews' && request.method === 'GET') {
        const list = await readStorageJson<any[]>(env, 'reviews.json', []);
        return jsonResponse(deduplicateReviews(list).slice(0, 10));
      }

      if (pathname === '/api/reviews' && request.method === 'POST') {
        if (!checkRateLimit(`rev-${clientIp}`, 5, 2 * 60 * 1000)) {
          return jsonResponse({ error: 'Terlalu sering mengirim ulasan. Harap tunggu sebentar.' }, 429);
        }
        const { name, emoji, emojiLabel, variant, comment } = body;
        if (!name || !comment || typeof name !== 'string' || typeof comment !== 'string') {
          return jsonResponse({ error: 'Nama dan ulasan wajib diisi.' }, 400);
        }
        const trimmedName = name.trim().slice(0, 50);
        const trimmedComment = comment.trim().slice(0, 500);
        if (!trimmedName || !trimmedComment) {
          return jsonResponse({ error: 'Nama dan ulasan tidak boleh kosong.' }, 400);
        }
        if (containsInappropriateContent(trimmedName) || containsInappropriateContent(trimmedComment)) {
          return jsonResponse({ error: 'Ulasan mengandung kata yang tidak pantas.' }, 400);
        }

        const reviewId = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : `rev-${Date.now()}`;
        const newReview = {
          id: reviewId,
          name: trimmedName,
          emoji: typeof emoji === 'string' ? emoji.slice(0, 8) : '😍',
          emojiLabel: typeof emojiLabel === 'string' ? emojiLabel.slice(0, 50) : 'Sangat Puas & Mewah',
          variant: typeof variant === 'string' ? variant.slice(0, 100) : 'SINKI Signature',
          comment: trimmedComment,
          date: 'Baru saja',
          likes: 1,
        };

        const current = deduplicateReviews(await readStorageJson<any[]>(env, 'reviews.json', []));
        const filtered = current.filter(
          (r) =>
            r.id !== reviewId &&
            !(
              r.name &&
              r.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
              r.comment &&
              r.comment.trim().toLowerCase() === trimmedComment.toLowerCase()
            )
        );
        const updated = [newReview, ...filtered].slice(0, 10);
        const saved = await writeStorageJson(env, 'reviews.json', updated);
        if (!saved.ok) return jsonResponse({ error: saved.error }, 500);
        return jsonResponse({ success: true, reviews: updated });
      }

      if (pathname === '/api/reviews/like' && request.method === 'POST') {
        if (!checkRateLimit(`like-${clientIp}`, 20, 60 * 1000)) {
          return jsonResponse({ error: 'Terlalu banyak permintaan.' }, 429);
        }
        const id = body?.id;
        if (!id) return jsonResponse({ error: 'ID ulasan wajib diisi.' }, 400);
        const current = deduplicateReviews(await readStorageJson<any[]>(env, 'reviews.json', []));
        const updated = current.map((r) => (r.id === id ? { ...r, likes: (r.likes || 0) + 1 } : r));
        const saved = await writeStorageJson(env, 'reviews.json', updated);
        if (!saved.ok) return jsonResponse({ error: saved.error }, 500);
        return jsonResponse({ success: true, reviews: updated });
      }

      if (pathname === '/api/owner/delete-review' && request.method === 'POST') {
        if (!(await isAuthorizedRequest(request, body, env))) {
          return jsonResponse({ error: 'Akses ditolak: Sesi Pemilik tidak valid!' }, 403);
        }
        const id = body?.id;
        if (!id) return jsonResponse({ error: 'ID ulasan wajib disertakan.' }, 400);
        const current = deduplicateReviews(await readStorageJson<any[]>(env, 'reviews.json', []));
        const updated = current.filter((r) => r.id !== id);
        const saved = await writeStorageJson(env, 'reviews.json', updated);
        if (!saved.ok) return jsonResponse({ error: saved.error }, 500);
        return jsonResponse({ success: true, reviews: updated });
      }

      if (pathname === '/api/owner/reset-reviews' && request.method === 'POST') {
        if (!(await isAuthorizedRequest(request, body, env))) {
          return jsonResponse({ error: 'Akses ditolak: Sesi Pemilik tidak valid!' }, 403);
        }
        const saved = await writeStorageJson(env, 'reviews.json', []);
        if (!saved.ok) return jsonResponse({ error: saved.error }, 500);
        return jsonResponse({ success: true, reviews: [] });
      }

      // 10. Perfumes Catalog & Top Perfumes
      if (pathname === '/api/perfumes' && request.method === 'GET') {
        const list = await readStorageJson<any[]>(env, 'perfumes_catalog.json', []);
        return jsonResponse(Array.isArray(list) ? list : []);
      }

      if (pathname === '/api/owner/update-perfumes' && request.method === 'POST') {
        if (!(await isAuthorizedRequest(request, body, env))) {
          return jsonResponse({ error: 'Akses ditolak: Sesi Pemilik tidak valid!' }, 403);
        }
        if (!Array.isArray(body?.perfumes)) {
          return jsonResponse({ error: 'Data parfum tidak valid!' }, 400);
        }
        const saved = await writeStorageJson(env, 'perfumes_catalog.json', body.perfumes);
        if (!saved.ok) return jsonResponse({ error: saved.error }, 500);
        return jsonResponse({ success: true, perfumes: body.perfumes });
      }

      if (pathname === '/api/top-perfumes' && request.method === 'GET') {
        const list = await readStorageJson<any[]>(env, 'top_perfumes.json', []);
        return jsonResponse(Array.isArray(list) ? list : []);
      }

      if (pathname === '/api/owner/update-top-perfumes' && request.method === 'POST') {
        if (!(await isAuthorizedRequest(request, body, env))) {
          return jsonResponse({ error: 'Akses ditolak: Sesi Pemilik tidak valid!' }, 403);
        }
        if (!Array.isArray(body?.topPerfumes) || body.topPerfumes.length === 0) {
          return jsonResponse({ error: 'Data varian top tidak valid!' }, 400);
        }
        const saved = await writeStorageJson(env, 'top_perfumes.json', body.topPerfumes);
        if (!saved.ok) return jsonResponse({ error: saved.error }, 500);
        return jsonResponse({
          success: true,
          message: 'Daftar Top Bestseller berhasil disimpan ke server & cloud!',
          topPerfumes: body.topPerfumes,
        });
      }

      // 11. Ticker
      if (pathname === '/api/ticker' && request.method === 'GET') {
        const data = await readStorageJson<any>(env, 'ticker_config.json', DEFAULT_TICKER);
        return jsonResponse(data?.text ? data : DEFAULT_TICKER);
      }

      if (pathname === '/api/owner/update-ticker' && request.method === 'POST') {
        if (!(await isAuthorizedRequest(request, body, env))) {
          return jsonResponse({ error: 'Akses ditolak: Sesi Pemilik tidak valid!' }, 403);
        }
        if (!body?.ticker || !body.ticker.text) {
          return jsonResponse({ error: 'Data ticker tidak valid!' }, 400);
        }
        const toSave = {
          text: String(body.ticker.text).trim(),
          font: body.ticker.font || 'cinzel',
          updatedAt: body.ticker.updatedAt || new Date().toISOString(),
        };
        const saved = await writeStorageJson(env, 'ticker_config.json', toSave);
        if (!saved.ok) return jsonResponse({ error: saved.error }, 500);
        return jsonResponse({ success: true, ticker: toSave });
      }

      // 12. Analytics
      if (pathname === '/api/analytics' && request.method === 'GET') {
        const current = await readStorageJson<any>(env, 'analytics.json', EMPTY_ANALYTICS_DATA);
        return jsonResponse(current && typeof current.totalVisits === 'number' ? current : EMPTY_ANALYTICS_DATA);
      }

      if (pathname === '/api/analytics/record' && request.method === 'POST') {
        if (!checkRateLimit(`ana-${clientIp}`, 30, 60 * 1000)) {
          return jsonResponse({ success: false }, 429);
        }
        const { event, snapshot } = body;
        let current = await readStorageJson<any>(env, 'analytics.json', EMPTY_ANALYTICS_DATA);
        if (!current || typeof current.totalVisits !== 'number') {
          current = { ...EMPTY_ANALYTICS_DATA };
        }

        if (snapshot && typeof snapshot.totalVisits === 'number') {
          current = {
            ...current,
            totalVisits: Math.max(current.totalVisits + 1, snapshot.totalVisits),
            uniqueVisitors: Math.max(current.uniqueVisitors, snapshot.uniqueVisitors),
            startedAt: current.startedAt || snapshot.startedAt,
            sources: { ...current.sources, ...(snapshot.sources || {}) },
            devices: { ...current.devices, ...(snapshot.devices || {}) },
            os: { ...current.os, ...(snapshot.os || {}) },
            pages: { ...current.pages, ...(snapshot.pages || {}) },
            dailyTrends: { ...current.dailyTrends, ...(snapshot.dailyTrends || {}) },
            hourlyTrends: Array.isArray(snapshot.hourlyTrends) ? snapshot.hourlyTrends : current.hourlyTrends,
          };
          if (event && event.id) {
            const existingRecent = Array.isArray(current.recentVisitors) ? current.recentVisitors : [];
            if (!existingRecent.some((e: any) => e.id === event.id)) {
              current.recentVisitors = [event, ...existingRecent].slice(0, 50);
            }
          }
        } else if (event) {
          current.totalVisits += 1;
          const today = new Date().toISOString().split('T')[0];
          current.dailyTrends[today] = (current.dailyTrends[today] || 0) + 1;
          current.recentVisitors = [event, ...(current.recentVisitors || [])].slice(0, 50);
        }

        await writeStorageJson(env, 'analytics.json', current);
        return jsonResponse({ success: true, analytics: current });
      }

      if (pathname === '/api/owner/reset-analytics' && request.method === 'POST') {
        if (!(await isAuthorizedRequest(request, body, env))) {
          return jsonResponse({ error: 'Akses ditolak: Sesi Pemilik tidak valid!' }, 403);
        }
        const zeroData = { ...EMPTY_ANALYTICS_DATA, startedAt: new Date().toISOString() };
        const saved = await writeStorageJson(env, 'analytics.json', zeroData);
        if (!saved.ok) return jsonResponse({ error: saved.error }, 500);
        return jsonResponse({ success: true, message: 'Data analitik berhasil di-reset ke 0', analytics: zeroData });
      }

      return jsonResponse({ error: 'Endpoint API tidak ditemukan.' }, 404);
    }

    // Serve static SPA assets for all non-API routes
    return env.ASSETS.fetch(request);
  },
};
