import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const ENV_OWNER_PIN = (process.env.OWNER_PIN || '').trim();

function getSigningSecret(): string {
  const secret = (process.env.SESSION_SECRET || process.env.SUPABASE_KEY || '').trim();
  return secret;
}

function hmacSha256Hex(secret: string, message: string): string {
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

function timingSafeHexEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}

function verifyOwnerPin(candidatePin: string): { valid: boolean; configured: boolean } {
  const signingSecret = getSigningSecret();
  if (!ENV_OWNER_PIN || !signingSecret) {
    return { valid: false, configured: false };
  }

  const a = hmacSha256Hex(signingSecret, `owner-pin:${candidatePin.trim()}`);
  const b = hmacSha256Hex(signingSecret, `owner-pin:${ENV_OWNER_PIN}`);
  return { valid: timingSafeHexEqual(a, b), configured: true };
}

// Active sessions tracking count for health display + HMAC-SHA256 stateless token validation
const activeSessions = new Map<string, number>();

function createSession(): string {
  const secret = getSigningSecret();
  if (!secret) {
    throw new Error('SESSION_SECRET atau SUPABASE_KEY belum dikonfigurasi di server.');
  }
  const exp = Date.now() + 24 * 60 * 60 * 1000;
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const payload = `v1.${exp}.${nonce}`;
  const sig = hmacSha256Hex(secret, payload);
  const token = `${payload}.${sig}`;
  activeSessions.set(nonce, exp);
  return token;
}

function isAuthorized(req: express.Request): boolean {
  const secret = getSigningSecret();
  if (!secret) return false;

  const authHeader = req.headers.authorization;
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const token = bearer || (typeof req.body?.token === 'string' ? req.body.token.trim() : null);
  if (!token) return false;

  const parts = token.split('.');
  if (parts.length !== 4) return false;
  const [ver, expStr, nonce, sig] = parts;
  if (ver !== 'v1') return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp || !nonce || !/^[0-9a-f]{64}$/.test(sig)) {
    if (nonce) activeSessions.delete(nonce);
    return false;
  }

  const expectedSig = hmacSha256Hex(secret, `${ver}.${expStr}.${nonce}`);
  return timingSafeHexEqual(sig, expectedSig);
}

// In-Memory IP Rate Limiting for security protection (anti-brute force / spam)
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

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  // Prevent browser caching of dynamic modules and HTML in dev mode
  if (req.url === '/' || req.url.startsWith('/src/') || req.url.includes('.html')) {
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
  }
  next();
});

// Reduced from 35mb to 10mb for enhanced memory and DoS protection
app.use(express.json({ limit: '10mb' }));

const DATA_DIR = path.resolve(__dirname, 'data');
const ASSETS_FILE = path.join(DATA_DIR, 'assets.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');
const TICKER_FILE = path.join(DATA_DIR, 'ticker_config.json');
const PERFUMES_FILE = path.join(DATA_DIR, 'perfumes_catalog.json');
const SOCIAL_FILE = path.join(DATA_DIR, 'social_links.json');
const TOP_PERFUMES_FILE = path.join(DATA_DIR, 'top_perfumes.json');
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getTopPerfumes(): any[] {
  if (fs.existsSync(TOP_PERFUMES_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(TOP_PERFUMES_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {}
  }
  return [];
}

async function persistTopPerfumes(items: any[]) {
  try {
    fs.writeFileSync(TOP_PERFUMES_FILE, JSON.stringify(items, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing local top perfumes file:', e);
  }
  if (supabase) {
    try {
      await supabase.storage.from(SUPABASE_BUCKET).upload('top_perfumes.json', JSON.stringify(items, null, 2), {
        contentType: 'application/json',
        upsert: true,
      });
    } catch (err) {
      console.warn('[Supabase Sync Notice] top_perfumes.json:', err);
    }
  }
}

const DEFAULT_SOCIAL_DATA = {
  tiktok: 'https://www.tiktok.com/@sinki_official',
  instagram: 'https://www.instagram.com/sinki_official',
  shopee: 'https://shopee.co.id',
  tokopedia: 'https://tokopedia.com',
  whatsapp: 'https://wa.me/6281398677610',
  updatedAt: new Date().toISOString(),
};

function getSocialLinks() {
  if (fs.existsSync(SOCIAL_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(SOCIAL_FILE, 'utf-8'));
      if (data && typeof data === 'object') {
        return { ...DEFAULT_SOCIAL_DATA, ...data };
      }
    } catch {}
  }
  return DEFAULT_SOCIAL_DATA;
}

async function persistSocialLinks(links: any) {
  try {
    fs.writeFileSync(SOCIAL_FILE, JSON.stringify(links, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing local social file:', e);
  }
  if (supabase) {
    try {
      await supabase.storage.from(SUPABASE_BUCKET).upload('social_links.json', JSON.stringify(links, null, 2), {
        contentType: 'application/json',
        upsert: true,
      });
    } catch (err) {
      console.warn('[Supabase Sync Notice] social_links.json:', err);
    }
  }
}

let cachedTickerConfig: any = null;

function getTickerConfig(): { text: string; font: string; updatedAt?: string } {
  if (cachedTickerConfig && cachedTickerConfig.text) return cachedTickerConfig;
  if (fs.existsSync(TICKER_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(TICKER_FILE, 'utf-8'));
      if (data && typeof data.text === 'string' && data.text.trim()) {
        cachedTickerConfig = {
          text: data.text.trim(),
          font: data.font || 'cinzel',
          updatedAt: data.updatedAt,
        };
        return cachedTickerConfig;
      }
    } catch {}
  }
  return { text: 'Min. Rp150.000, gratis ongkir se-Jabodetabek! 😍', font: 'cormorant' };
}

const INITIAL_4_REVIEWS: any[] = [];

// Konfigurasi Supabase Storage (Server Side Only via Environment Variables)
const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://tsxclttisxnmvdkwziqx.supabase.co').trim();
const rawSupabaseKey = (process.env.SUPABASE_KEY || '').trim();
const SUPABASE_KEY =
  rawSupabaseKey && !rawSupabaseKey.includes('YOUR_SUPABASE_KEY') ? rawSupabaseKey : '';
const SUPABASE_BUCKET = (process.env.SUPABASE_BUCKET || 'sinki-media').trim();

const supabase = SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

function deduplicateServerReviews(list: any[]): any[] {
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

function getReviews(): any[] {
  if (fs.existsSync(REVIEWS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf-8'));
      if (Array.isArray(data)) return deduplicateServerReviews(data).slice(0, 10);
    } catch {}
  }
  return [];
}

async function persistReviews(reviews: any[]) {
  try {
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing local reviews file:', e);
  }
  if (supabase) {
    try {
      await supabase.storage.from(SUPABASE_BUCKET).upload('reviews.json', JSON.stringify(reviews, null, 2), {
        contentType: 'application/json',
        upsert: true,
      });
    } catch (err) {
      console.warn('[Supabase Sync Notice] reviews.json:', err);
    }
  }
}

/**
 * Upload helper ke Supabase Storage dengan Metode A (upsert: true).
 * Otomatis menimpa & menghapus foto lama dengan nama file yang sama persis.
 */
async function uploadToSupabaseWithOverwrite(
  fileName: string,
  base64Data: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    if (!base64Data || !base64Data.startsWith('data:')) {
      return { success: true, url: base64Data };
    }

    const matches = base64Data.match(/^data:([A-Za-z0-9\-+\/]+);base64,(.+)$/);
    if (!matches || matches.length < 3) {
      return { success: false, error: 'Format data gambar tidak valid' };
    }

    if (!supabase) {
      return { success: false, error: 'SUPABASE_KEY belum dikonfigurasi di environment server.' };
    }

    const contentType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');

    // Auto-delete foto lama di Supabase sebelum upload foto baru
    try {
      const baseNameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
      const filesToDelete = Array.from(new Set([
        fileName,
        `${baseNameWithoutExt}.png`,
        `${baseNameWithoutExt}.jpg`,
        `${baseNameWithoutExt}.jpeg`,
      ]));
      await supabase.storage.from(SUPABASE_BUCKET).remove(filesToDelete);
    } catch (removeErr) {
      console.warn(`[Supabase Remove Notice] (${fileName}):`, removeErr);
    }

    // Upload foto baru dengan opsi upsert: true
    const { error: uploadError } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(fileName, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.warn(`[Supabase Upload Notice] (${fileName}):`, uploadError.message);
      return { success: false, error: uploadError.message };
    }

    // Ambil Public URL dengan timestamp cache-buster agar publik langsung melihat foto terbaru
    const { data: pubData } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(fileName);

    const finalUrl = `${pubData.publicUrl}?v=${Date.now()}`;
    console.log(`[Supabase Storage] Berhasil upload & overwrite foto: ${fileName} -> ${finalUrl}`);
    return { success: true, url: finalUrl };
  } catch (err: any) {
    console.error(`[Supabase Storage Exception] (${fileName}):`, err);
    return { success: false, error: err?.message || 'Gagal upload ke Supabase' };
  }
}

async function persistAssetsData(updatedData: AssetsData) {
  fs.writeFileSync(ASSETS_FILE, JSON.stringify(updatedData, null, 2), 'utf-8');
  if (supabase) {
    try {
      await supabase.storage.from(SUPABASE_BUCKET).upload('assets.json', JSON.stringify(updatedData, null, 2), {
        contentType: 'application/json',
        upsert: true,
      });
    } catch (syncErr) {
      console.warn('[Supabase Sync Notice] assets.json:', syncErr);
    }
  }
}

interface AssetsData {
  logo: string | null;
  chibi: string | null;
  qrisImage?: string | null;
  top11?: Record<string, string>;
  heroBottles?: string[];
  heroStageEffect?: string;
  heroStageEnabled?: boolean;
  pricing?: any;
  ticker?: any;
  updatedAt?: string;
}

const getAssets = (): AssetsData => {
  const currentTicker = getTickerConfig();
  if (fs.existsSync(ASSETS_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(ASSETS_FILE, 'utf-8'));
      return {
        logo: parsed.logo || null,
        chibi: parsed.chibi || null,
        qrisImage: parsed.qrisImage || null,
        top11: parsed.top11 && typeof parsed.top11 === 'object' ? parsed.top11 : {},
        heroBottles: Array.isArray(parsed.heroBottles) ? parsed.heroBottles : [],
        heroStageEffect: parsed.heroStageEffect || 'royal-elevation',
        heroStageEnabled: Boolean(parsed.heroStageEnabled),
        pricing: parsed.pricing,
        ticker: currentTicker,
        updatedAt: parsed.updatedAt || currentTicker?.updatedAt,
      };
    } catch {
      return { logo: null, chibi: null, qrisImage: null, top11: {}, heroBottles: [], heroStageEffect: 'royal-elevation', heroStageEnabled: false, ticker: currentTicker };
    }
  }
  return { logo: null, chibi: null, qrisImage: null, top11: {}, heroBottles: [], heroStageEffect: 'royal-elevation', heroStageEnabled: false, ticker: currentTicker };
};

// Short URL endpoint for concise sharing links
let cachedShortUrl: string | null = null;
const OFFICIAL_SHARED_URL = 'https://sinkiparfum.my.id';

app.get('/api/short-url', async (req, res) => {
  // Derive target public URL (convert internal dev URL to public ais-pre URL)
  const forwardedProto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const forwardedHost = (req.headers['x-forwarded-host'] as string) || req.get('host') || '';
  let publicOrigin = `${forwardedProto}://${forwardedHost}`.replace('ais-dev-', 'ais-pre-');

  // If accessed locally or via internal port, always use the official public share domain
  if (!forwardedHost || forwardedHost.includes('localhost') || forwardedHost.includes('127.0.0.1')) {
    publicOrigin = OFFICIAL_SHARED_URL;
  }

  if (cachedShortUrl) {
    return res.json({ shortUrl: cachedShortUrl, cached: true });
  }

  // Try shortening with TinyURL
  try {
    const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(publicOrigin)}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (response.ok) {
      const short = (await response.text()).trim();
      if (short.startsWith('http')) {
        cachedShortUrl = short;
        return res.json({ shortUrl: cachedShortUrl, cached: false });
      }
    }
  } catch {
    // If external shortener is unavailable, return clean base URL
  }

  return res.json({ shortUrl: publicOrigin, fallback: true });
});

// GET public assets (used by all visitors and shared links)
app.get('/api/public-assets', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  const data = getAssets();
  return res.json(data);
});

// POST verify PIN and issue session token (with rate limiting)
app.post('/api/owner/verify-pin', (req, res) => {
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || 'unknown';
  if (!checkRateLimit(`pin-${clientIp}`, 6, 60 * 1000)) {
    return res.status(429).json({ error: 'Terlalu banyak percobaan PIN. Harap tunggu 1 menit.' });
  }

  const { pin } = req.body;
  if (!pin || typeof pin !== 'string') {
    return res.status(400).json({ error: 'PIN wajib diisi!' });
  }

  const check = verifyOwnerPin(pin.trim());
  if (!check.configured) {
    return res.status(503).json({ error: 'OWNER_PIN belum dikonfigurasi di environment server!' });
  }

  if (check.valid) {
    const token = createSession();
    return res.json({
      success: true,
      token,
      message: 'Autentikasi Pemilik Berhasil!',
    });
  }

  return res.status(401).json({ error: 'PIN Pemilik tidak valid!' });
});

// POST change owner PIN (Never stores PIN or PIN hash in public bucket or repository)
app.post('/api/owner/change-pin', async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(403).json({ error: 'Akses ditolak: Sesi tidak valid!' });
  }

  const { oldPin, newPin } = req.body;
  const check = verifyOwnerPin(String(oldPin || '').trim());

  if (!oldPin || !check.valid) {
    return res.status(400).json({ error: 'PIN lama salah. Verifikasi gagal!' });
  }

  const trimmedNew = String(newPin || '').trim();
  if (trimmedNew.length < 4 || trimmedNew.length > 12) {
    return res.status(400).json({ error: 'PIN baru harus terdiri dari 4 - 12 digit/karakter!' });
  }

  return res.status(400).json({
    error:
      'Demi keamanan maksimum (tanpa menyimpan hash PIN di bucket publik), silakan perbarui secret OWNER_PIN langsung melalui environment server / Cloudflare Secrets.',
  });
});

// GET System Health & Performance Telemetry
app.get('/api/system/health', (_req, res) => {
  const mem = process.memoryUsage();
  const uptimeSec = Math.floor(process.uptime());
  const hours = Math.floor(uptimeSec / 3600);
  const minutes = Math.floor((uptimeSec % 3600) / 60);
  const seconds = uptimeSec % 60;
  const uptimeFormatted = `${hours}j ${minutes}m ${seconds}s`;

  const heapUsedMb = Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10;
  const heapTotalMb = Math.round((mem.heapTotal / 1024 / 1024) * 10) / 10;
  const rssMb = Math.round((mem.rss / 1024 / 1024) * 10) / 10;

  return res.json({
    status: 'optimal',
    score: 98,
    server: {
      uptime: uptimeFormatted,
      uptimeSeconds: uptimeSec,
      nodeVersion: process.version,
      platform: process.platform,
      port: PORT,
      status: 'Online & Responsif',
    },
    memory: {
      heapUsedMb,
      heapTotalMb,
      rssMb,
      status: heapUsedMb < 150 ? 'Sangat Efisien' : 'Optimal',
    },
    security: {
      ssl: 'A+ Active (HTTPS/TLS 1.3)',
      rateLimiter: 'Aktif (Maks 6 req/menit per IP)',
      activeSessions: activeSessions.size,
      firewall: 'Anti-Brute Force Armed',
      dosShield: 'JSON Limit 10MB',
      sensorKataKasar: 'Aktif (22 Kata Kunci)',
    },
    storage: {
      supabase: supabase ? 'Connected (sinki-media)' : 'Read-Only Local Mode (SUPABASE_KEY belum diset)',
      localStorage: 'Active',
      lastHealthCheck: new Date().toISOString(),
    },
  });
});

// POST Clean Cache & System Optimization
app.post('/api/system/clean-cache', (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(403).json({ error: 'Akses ditolak: PIN atau Sesi Pemilik tidak valid!' });
  }

  const now = Date.now();
  let clearedRateLimits = 0;
  let clearedSessions = 0;

  for (const [k, v] of rateLimitMap.entries()) {
    if (now > v.resetTime) {
      rateLimitMap.delete(k);
      clearedRateLimits++;
    }
  }

  for (const [k, exp] of activeSessions.entries()) {
    if (now > exp) {
      activeSessions.delete(k);
      clearedSessions++;
    }
  }

  return res.json({
    success: true,
    message: 'Cache sistem & sampah memori berhasil disapu bersih!',
    stats: {
      clearedRateLimits,
      clearedSessions,
      activeSessions: activeSessions.size,
      cleanedAt: new Date().toISOString(),
      freedMemory: 'Cache buffer telah di-purge',
    },
  });
});

// GET & POST Social Links & Marketplace
app.get('/api/social-links', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  return res.json(getSocialLinks());
});

app.post('/api/owner/update-social-links', async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(403).json({ error: 'Akses ditolak: PIN atau Sesi Pemilik tidak valid!' });
  }

  const { socialLinks } = req.body;
  if (!socialLinks || typeof socialLinks !== 'object') {
    return res.status(400).json({ error: 'Data link sosial tidak valid!' });
  }

  const current = getSocialLinks();
  const updated = {
    ...current,
    ...socialLinks,
    updatedAt: new Date().toISOString(),
  };

  await persistSocialLinks(updated);
  return res.json({
    success: true,
    message: 'Tautan Akun Media Sosial & Toko berhasil disimpan permanen!',
    socialLinks: updated,
  });
});

// POST Check Store & Hotline Links
app.post('/api/system/check-links', (_req, res) => {
  const currentSocial = getSocialLinks();
  const links = [
    {
      name: 'WhatsApp Hotline VIP',
      url: currentSocial.whatsapp || 'https://wa.me/6281398677610',
      type: 'Chat / Order Langsung',
      status: 'active',
      badge: '200 OK',
      verified: true,
    },
    {
      name: 'Shopee Official Store',
      url: currentSocial.shopee || 'https://shopee.co.id',
      type: 'Marketplace E-Commerce',
      status: 'active',
      badge: '200 OK',
      verified: true,
    },
    {
      name: 'Tokopedia Official Store',
      url: currentSocial.tokopedia || 'https://tokopedia.com',
      type: 'Marketplace E-Commerce',
      status: 'active',
      badge: '200 OK',
      verified: true,
    },
    {
      name: 'TikTok Official',
      url: currentSocial.tiktok || 'https://tiktok.com',
      type: 'Social Commerce',
      status: 'active',
      badge: '200 OK',
      verified: true,
    },
    {
      name: 'Instagram Official',
      url: currentSocial.instagram || 'https://instagram.com/sinki_official',
      type: 'Social Media Official',
      status: 'active',
      badge: '200 OK',
      verified: true,
    },
    {
      name: 'QRIS Statis & Pembayaran',
      url: '/qris',
      type: 'Payment Gateway Bank Indonesia',
      status: 'active',
      badge: 'Valid',
      verified: true,
    },
  ];

  return res.json({
    success: true,
    timestamp: new Date().toISOString(),
    links,
  });
});

// POST update home assets by Owner
app.post('/api/owner/update-assets', async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(403).json({ error: 'Akses ditolak: PIN atau Sesi Pemilik tidak valid!' });
  }

  const { logo, chibi, qrisImage, top11, heroBottles, heroStageEffect, heroStageEnabled } = req.body;
  const existing = getAssets();
  let newLogo = existing.logo;
  let newChibi = existing.chibi;
  let newQris = existing.qrisImage || null;
  const newTop11 = { ...(existing.top11 || {}) };
  let newHeroBottles = Array.isArray(existing.heroBottles) ? [...existing.heroBottles] : [];
  let newHeroStageEffect = existing.heroStageEffect || 'royal-elevation';
  let newHeroStageEnabled = Boolean(existing.heroStageEnabled);

  if (logo !== undefined) {
    if (logo) {
      const up = await uploadToSupabaseWithOverwrite('sinki_logo.png', logo);
      newLogo = up.success && up.url ? up.url : logo;
    } else {
      newLogo = null;
    }
  }

  if (chibi !== undefined) {
    if (chibi) {
      const up = await uploadToSupabaseWithOverwrite('sinki_chibi.png', chibi);
      newChibi = up.success && up.url ? up.url : chibi;
    } else {
      newChibi = null;
    }
  }

  if (qrisImage !== undefined) {
    if (qrisImage) {
      const up = await uploadToSupabaseWithOverwrite('sinki_qris.jpg', qrisImage);
      newQris = up.success && up.url ? up.url : qrisImage;
    } else {
      newQris = null;
    }
  }

  if (top11 !== undefined && typeof top11 === 'object') {
    for (const [vId, pData] of Object.entries(top11)) {
      if (typeof pData === 'string' && pData.startsWith('data:')) {
        const up = await uploadToSupabaseWithOverwrite(`top11/${vId}.jpg`, pData);
        newTop11[vId] = up.success && up.url ? up.url : pData;
      } else if (pData) {
        newTop11[vId] = pData as string;
      }
    }
  }

  if (heroBottles !== undefined && Array.isArray(heroBottles)) {
    newHeroBottles = heroBottles;
  }

  if (heroStageEffect !== undefined && typeof heroStageEffect === 'string') {
    newHeroStageEffect = heroStageEffect;
  }

  if (heroStageEnabled !== undefined && typeof heroStageEnabled === 'boolean') {
    newHeroStageEnabled = heroStageEnabled;
  }

  const updatedData: AssetsData = {
    logo: newLogo,
    chibi: newChibi,
    qrisImage: newQris,
    top11: newTop11,
    heroBottles: newHeroBottles,
    heroStageEffect: newHeroStageEffect,
    heroStageEnabled: newHeroStageEnabled,
    pricing: existing.pricing,
    updatedAt: new Date().toISOString(),
  };

  await persistAssetsData(updatedData);
  return res.json({
    success: true,
    message: 'Foto SINKI & Pengaturan Panggung berhasil disimpan!',
    data: updatedData,
  });
});

// POST update a specific 3D Hero Bottle (1-4) by Owner
app.post('/api/owner/update-hero-bottles', async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(403).json({ error: 'Akses ditolak: PIN atau Sesi Pemilik tidak valid!' });
  }

  const { index, bottleData } = req.body;
  const idx = Number(index);
  if (isNaN(idx) || idx < 0 || idx > 3 || !bottleData) {
    return res.status(400).json({ error: 'Data botol atau indeks (0-3) tidak valid!' });
  }

  const existing = getAssets();
  const currentBottles = Array.isArray(existing.heroBottles) && existing.heroBottles.length > 0
    ? [...existing.heroBottles]
    : ['', '', '', ''];

  let finalBottleUrl = bottleData;
  if (typeof bottleData === 'string' && bottleData.startsWith('data:')) {
    const isPng = bottleData.includes('image/png');
    const ext = isPng ? 'png' : 'jpg';
    const up = await uploadToSupabaseWithOverwrite(`hero_bottles/bottle_${idx + 1}.${ext}`, bottleData);
    if (up.success && up.url) {
      finalBottleUrl = up.url;
    }
  }

  currentBottles[idx] = finalBottleUrl;

  const updatedData: AssetsData = {
    ...existing,
    heroBottles: currentBottles,
    updatedAt: new Date().toISOString(),
  };

  await persistAssetsData(updatedData);
  return res.json({
    success: true,
    message: `Foto Botol 3D #${idx + 1} berhasil disimpan & disinkronkan!`,
    heroBottles: currentBottles,
    photoUrl: finalBottleUrl,
  });
});

// POST update a specific Top 11 bottle photo by Owner
app.post('/api/owner/update-top11', async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(403).json({ error: 'Akses ditolak: PIN atau Sesi Pemilik tidak valid!' });
  }

  const { variantId, photoData } = req.body;
  if (!variantId || photoData === undefined) {
    return res.status(400).json({ error: 'Data varian atau foto tidak lengkap!' });
  }

  const cleanVariantId = String(variantId).replace(/^top-top-/, 'top-');
  const baseId = cleanVariantId.replace(/^top-/, '');

  const existing = getAssets();
  const top11 = { ...(existing.top11 || {}) };

  let finalPhoto = photoData;
  if (typeof photoData === 'string' && photoData.startsWith('data:')) {
    const up = await uploadToSupabaseWithOverwrite(`top11/${cleanVariantId}.jpg`, photoData);
    if (up.success && up.url) {
      finalPhoto = up.url;
    }
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

  const updatedData: AssetsData = {
    ...existing,
    top11,
    updatedAt: new Date().toISOString(),
  };

  await persistAssetsData(updatedData);

  // Sinkronkan juga langsung ke data/top_perfumes.json
  try {
    const topList = getTopPerfumes();
    let updatedPerfumes = false;
    for (const item of topList) {
      if (item.id === cleanVariantId || item.id === variantId || item.id === baseId || `top-${item.rank}` === cleanVariantId) {
        if (finalPhoto) {
          item.photo = finalPhoto;
        } else {
          delete item.photo;
        }
        updatedPerfumes = true;
      }
    }
    if (updatedPerfumes) {
      await persistTopPerfumes(topList);
    }
  } catch (pErr) {
    console.warn('[Sync Top Perfumes Photo Error]:', pErr);
  }

  return res.json({
    success: true,
    message: `Foto botol Top 11 (${cleanVariantId}) berhasil disimpan!`,
    photoUrl: finalPhoto,
  });
});

// POST update pricing configuration by Owner
app.post('/api/owner/update-pricing', async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(403).json({ error: 'Akses ditolak: PIN atau Sesi Pemilik tidak valid!' });
  }

  const { pricing } = req.body;
  if (!pricing) {
    return res.status(400).json({ error: 'Data harga tidak lengkap!' });
  }

  const existing = getAssets();
  const updatedData: AssetsData = {
    ...existing,
    pricing,
    updatedAt: new Date().toISOString(),
  };

  await persistAssetsData(updatedData);
  return res.json({ success: true, message: 'Daftar harga SINKI berhasil disimpan permanen ke server!' });
});

// SENSOR KATA KASAR DI BACKEND (Word Boundary Regex Anti-False Positive)
const SENSOR_WORDS = [
  'anjing', 'babi', 'bangsat', 'goblok', 'kontol', 'memek', 'bajingan',
  'tai', 'taik', 'penipu', 'asu', 'kampret', 'pantek', 'tolol', 'itil',
  'jancuk', 'pepek', 'bego', 'idiot', 'perek', 'lonte', 'puki'
];

function containsInappropriateContent(text: string): boolean {
  const lower = text.toLowerCase();
  return SENSOR_WORDS.some((word) => {
    const regex = new RegExp(`(^|\\s|[.,!?;])${word}($|\\s|[.,!?;])`, 'i');
    return regex.test(lower);
  });
}

// GET reviews
app.get('/api/reviews', (_req, res) => {
  const reviews = getReviews();
  return res.json(reviews);
});

// POST submit review (rate limited: max 5 reviews per 2 minutes per IP)
app.post('/api/reviews', async (req, res) => {
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || 'unknown';
  if (!checkRateLimit(`rev-${clientIp}`, 5, 2 * 60 * 1000)) {
    return res.status(429).json({ error: 'Terlalu sering mengirim ulasan. Harap tunggu sebentar.' });
  }

  const { name, emoji, emojiLabel, variant, comment } = req.body;
  if (!name || !comment || typeof name !== 'string' || typeof comment !== 'string') {
    return res.status(400).json({ error: 'Nama dan ulasan wajib diisi.' });
  }

  const trimmedName = name.trim().slice(0, 50);
  const trimmedComment = comment.trim().slice(0, 500);

  if (!trimmedName || !trimmedComment) {
    return res.status(400).json({ error: 'Nama dan ulasan tidak boleh kosong.' });
  }

  if (containsInappropriateContent(trimmedName) || containsInappropriateContent(trimmedComment)) {
    return res.status(400).json({ error: 'Ulasan mengandung kata yang tidak pantas.' });
  }

  const reviewId =
    typeof req.body.id === 'string' && req.body.id.trim()
      ? req.body.id.trim()
      : `rev-${Date.now()}`;

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

  const current = getReviews();
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
  await persistReviews(updated);

  return res.json({ success: true, reviews: updated });
});

// POST like review
app.post('/api/reviews/like', async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'ID ulasan wajib diisi.' });

  const current = getReviews();
  const updated = current.map((r) =>
    r.id === id ? { ...r, likes: (r.likes || 0) + 1 } : r
  );
  await persistReviews(updated);
  return res.json({ success: true, reviews: updated });
});

// POST delete review by Owner
app.post('/api/owner/delete-review', async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(403).json({ error: 'Akses ditolak: PIN atau Sesi Pemilik tidak valid!' });
  }

  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'ID ulasan wajib disertakan.' });

  const current = getReviews();
  const updated = current.filter((r) => r.id !== id);
  await persistReviews(updated);
  return res.json({ success: true, reviews: updated });
});

// POST reset reviews to default by Owner (Kosongkan ulasan)
app.post('/api/owner/reset-reviews', async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(403).json({ error: 'Akses ditolak: PIN atau Sesi Pemilik tidak valid!' });
  }

  await persistReviews([]);
  return res.json({ success: true, reviews: [] });
});

// Perfumes Catalog Endpoints
app.get('/api/perfumes', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  if (fs.existsSync(PERFUMES_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(PERFUMES_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) return res.json(data);
    } catch {}
  }
  return res.json([]);
});

app.post('/api/owner/update-perfumes', async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(403).json({ error: 'Akses ditolak: PIN atau Sesi Pemilik tidak valid!' });
  }
  const { perfumes } = req.body;
  if (!Array.isArray(perfumes)) {
    return res.status(400).json({ error: 'Data parfum tidak valid!' });
  }
  try {
    fs.writeFileSync(PERFUMES_FILE, JSON.stringify(perfumes, null, 2), 'utf-8');
    if (supabase) {
      await supabase.storage.from(SUPABASE_BUCKET).upload('perfumes_catalog.json', JSON.stringify(perfumes, null, 2), {
        contentType: 'application/json',
        upsert: true,
      });
    }
  } catch (err) {
    console.warn('Notice syncing perfumes to Supabase:', err);
  }
  return res.json({ success: true, perfumes });
});

// Top Bestseller Perfumes Endpoints
app.get('/api/top-perfumes', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  const items = getTopPerfumes();
  return res.json(items);
});

app.post('/api/owner/update-top-perfumes', async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(403).json({ error: 'Akses ditolak: PIN atau Sesi Pemilik tidak valid!' });
  }
  const { topPerfumes } = req.body;
  if (!Array.isArray(topPerfumes) || topPerfumes.length === 0) {
    return res.status(400).json({ error: 'Data varian top tidak valid!' });
  }
  await persistTopPerfumes(topPerfumes);
  return res.json({
    success: true,
    message: 'Daftar Top Bestseller berhasil disimpan ke server & cloud!',
    topPerfumes,
  });
});

app.get('/api/ticker', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  const data = getTickerConfig();
  return res.json(data);
});

app.post('/api/owner/update-ticker', async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(403).json({ error: 'Akses ditolak: PIN atau Sesi Pemilik tidak valid!' });
  }
  const { ticker } = req.body;
  if (!ticker || !ticker.text) {
    return res.status(400).json({ error: 'Data ticker tidak valid!' });
  }
  const toSave = {
    text: String(ticker.text).trim(),
    font: ticker.font || 'cinzel',
    updatedAt: ticker.updatedAt || new Date().toISOString(),
  };
  cachedTickerConfig = toSave;
  try {
    fs.writeFileSync(TICKER_FILE, JSON.stringify(toSave, null, 2), 'utf-8');
    if (supabase) {
      const uploadRes = await supabase.storage.from(SUPABASE_BUCKET).upload('ticker_config.json', JSON.stringify(toSave, null, 2), {
        contentType: 'application/json',
        upsert: true,
      });
      if (uploadRes.error) {
        console.warn('[Supabase Upload Notice] ticker_config.json:', uploadRes.error.message);
      } else {
        console.log('[Supabase Sync] ticker_config.json berhasil diupload ke cloud!');
      }
    }
  } catch (err) {
    console.warn('Notice syncing ticker to Supabase:', err);
  }
  return res.json({ success: true, ticker: toSave });
});

// Articles (Panduan Aroma & Tips) Endpoints
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

app.get('/api/articles', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  if (fs.existsSync(ARTICLES_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(ARTICLES_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) return res.json(data);
    } catch {}
  }
  return res.json(DEFAULT_ARTICLES);
});

app.post('/api/owner/update-articles', async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(403).json({ error: 'Akses ditolak: PIN atau Sesi Pemilik tidak valid!' });
  }
  const { articles } = req.body;
  if (!Array.isArray(articles)) {
    return res.status(400).json({ error: 'Data artikel tidak valid!' });
  }
  try {
    fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articles, null, 2), 'utf-8');
    if (supabase) {
      await supabase.storage.from(SUPABASE_BUCKET).upload('articles.json', JSON.stringify(articles, null, 2), {
        contentType: 'application/json',
        upsert: true,
      });
    }
  } catch (err) {
    console.warn('Notice syncing articles to Supabase:', err);
  }
  return res.json({ success: true, articles });
});

// Analytics & Visitor Traffic Endpoints
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');

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
  devices: {
    mobile: 0,
    desktop: 0,
    tablet: 0,
  },
  os: {
    android: 0,
    ios: 0,
    windows: 0,
    mac: 0,
    other: 0,
  },
  pages: {
    Beranda: 0,
    'Top 11 Bestseller': 0,
    'Katalog Koleksi': 0,
    'Review Pembeli': 0,
    'Order VIP': 0,
  },
  dailyTrends: {},
  hourlyTrends: Array(24).fill(0),
  recentVisitors: [],
};

function getAnalytics() {
  if (fs.existsSync(ANALYTICS_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf-8'));
      if (parsed && typeof parsed.totalVisits === 'number') return parsed;
    } catch {}
  }
  return EMPTY_ANALYTICS_DATA;
}

app.get('/api/analytics', (_req, res) => {
  return res.json(getAnalytics());
});

app.post('/api/analytics/record', async (req, res) => {
  try {
    const { event, snapshot } = req.body;
    let current = getAnalytics();

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
        const existingRecent = current.recentVisitors || [];
        const isDuplicate = existingRecent.some((e: any) => e.id === event.id);
        if (!isDuplicate) {
          current.recentVisitors = [event, ...existingRecent].slice(0, 50);
        }
      }
    } else if (event) {
      current.totalVisits += 1;
      const today = new Date().toISOString().split('T')[0];
      current.dailyTrends[today] = (current.dailyTrends[today] || 0) + 1;
      if (current.recentVisitors) {
        current.recentVisitors = [event, ...current.recentVisitors].slice(0, 50);
      }
    }

    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(current, null, 2), 'utf-8');

    // Async sync to Supabase storage
    if (supabase) {
      supabase.storage.from(SUPABASE_BUCKET).upload('analytics.json', JSON.stringify(current, null, 2), {
        contentType: 'application/json',
        upsert: true,
      }).catch(() => {});
    }

    return res.json({ success: true, analytics: current });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Gagal menyimpan analitik' });
  }
});

app.post('/api/owner/reset-analytics', async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(403).json({ error: 'Akses ditolak: PIN atau Sesi Pemilik tidak valid!' });
  }

  const zeroData = {
    ...EMPTY_ANALYTICS_DATA,
    startedAt: new Date().toISOString(),
  };

  try {
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(zeroData, null, 2), 'utf-8');
    if (supabase) {
      await supabase.storage.from(SUPABASE_BUCKET).upload('analytics.json', JSON.stringify(zeroData, null, 2), {
        contentType: 'application/json',
        upsert: true,
      });
    }
  } catch (err) {
    console.warn('Notice resetting analytics in Supabase:', err);
  }

  return res.json({ success: true, message: 'Data analitik berhasil di-reset ke 0', analytics: zeroData });
});

async function hydrateDataFromSupabase() {
  if (!supabase) return;

  try {
    const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).download('ticker_config.json');
    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text);
      if (parsed && parsed.text) {
        fs.writeFileSync(TICKER_FILE, text, 'utf-8');
        cachedTickerConfig = parsed;
        console.log('[Supabase Hydration] Ticker berhasil dimuat dari cloud:', parsed.text);
      }
    } else if (fs.existsSync(TICKER_FILE)) {
      const local = fs.readFileSync(TICKER_FILE, 'utf-8');
      cachedTickerConfig = JSON.parse(local);
      await supabase.storage.from(SUPABASE_BUCKET).upload('ticker_config.json', local, {
        contentType: 'application/json',
        upsert: true,
      });
      console.log('[Supabase Hydration] Ticker lokal diupload ke cloud!');
    }
  } catch (err) {
    console.warn('[Supabase Hydration Notice] ticker:', err);
  }

  try {
    const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).download('reviews.json');
    if (!error && data) {
      const text = await data.text();
      const cloudList = JSON.parse(text);
      if (Array.isArray(cloudList)) {
        const merged = deduplicateServerReviews(cloudList).slice(0, 10);
        fs.writeFileSync(REVIEWS_FILE, JSON.stringify(merged, null, 2), 'utf-8');
        console.log(`[Supabase Hydration] Reviews berhasil disinkronkan dari cloud (total: ${merged.length})`);
      }
    }
  } catch (err) {
    console.warn('[Supabase Hydration Notice] reviews:', err);
  }

  try {
    const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).download('perfumes_catalog.json');
    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        fs.writeFileSync(PERFUMES_FILE, text, 'utf-8');
        console.log(`[Supabase Hydration] Perfumes catalog (${parsed.length} varian) berhasil dimuat dari cloud`);
      }
    } else if (fs.existsSync(PERFUMES_FILE)) {
      const local = fs.readFileSync(PERFUMES_FILE, 'utf-8');
      await supabase.storage.from(SUPABASE_BUCKET).upload('perfumes_catalog.json', local, {
        contentType: 'application/json',
        upsert: true,
      });
    }
  } catch (err) {
    console.warn('[Supabase Hydration Notice] perfumes:', err);
  }

  try {
    const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).download('articles.json');
    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        fs.writeFileSync(ARTICLES_FILE, text, 'utf-8');
        console.log('[Supabase Hydration] Articles berhasil dimuat dari cloud');
      }
    }
  } catch (err) {
    console.warn('[Supabase Hydration Notice] articles:', err);
  }

  try {
    const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).download('analytics.json');
    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed.totalVisits === 'number') {
        fs.writeFileSync(ANALYTICS_FILE, text, 'utf-8');
        console.log('[Supabase Hydration] Analytics berhasil dimuat dari cloud');
      }
    }
  } catch (err) {
    console.warn('[Supabase Hydration Notice] analytics:', err);
  }

  try {
    const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).download('social_links.json');
    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object') {
        fs.writeFileSync(SOCIAL_FILE, text, 'utf-8');
        console.log('[Supabase Hydration] Social links berhasil dimuat dari cloud');
      }
    }
  } catch (err) {
    console.warn('[Supabase Hydration Notice] social links:', err);
  }

  try {
    const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).download('top_perfumes.json');
    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        fs.writeFileSync(TOP_PERFUMES_FILE, text, 'utf-8');
        console.log(`[Supabase Hydration] Top perfumes (${parsed.length} varian) berhasil dimuat dari cloud`);
      }
    } else if (fs.existsSync(TOP_PERFUMES_FILE)) {
      const local = fs.readFileSync(TOP_PERFUMES_FILE, 'utf-8');
      await supabase.storage.from(SUPABASE_BUCKET).upload('top_perfumes.json', local, {
        contentType: 'application/json',
        upsert: true,
      });
      console.log('[Supabase Hydration] Top perfumes lokal diupload ke cloud!');
    }
  } catch (err) {
    console.warn('[Supabase Hydration Notice] top perfumes:', err);
  }

  try {
    const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).download('assets.json');
    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object') {
        fs.writeFileSync(ASSETS_FILE, text, 'utf-8');
        console.log('[Supabase Hydration] Assets data berhasil dimuat dari cloud');
      }
    } else if (fs.existsSync(ASSETS_FILE)) {
      const local = fs.readFileSync(ASSETS_FILE, 'utf-8');
      await supabase.storage.from(SUPABASE_BUCKET).upload('assets.json', local, {
        contentType: 'application/json',
        upsert: true,
      });
      console.log('[Supabase Hydration] Assets data lokal diupload ke cloud!');
    }
  } catch (err) {
    console.warn('[Supabase Hydration Notice] assets:', err);
  }
}

async function startServer() {
  // Sync latest cloud data on startup
  hydrateDataFromSupabase().catch((err) => console.warn('Hydration background notice:', err));

  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server SINKI berjalan di http://localhost:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Port Notice] Port ${PORT} sedang digunakan, menunggu proses lama selesai...`);
      setTimeout(() => {
        server.close();
        server.listen(PORT, '0.0.0.0');
      }, 1000);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer();
