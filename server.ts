import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const OWNER_PIN = (process.env.OWNER_PIN || '1995').trim();

// Active sessions for authenticated owner access (24-hour validity)
const activeSessions = new Map<string, number>();

function createSession(): string {
  const token = crypto.randomUUID();
  activeSessions.set(token, Date.now() + 24 * 60 * 60 * 1000);
  return token;
}

function isAuthorized(req: express.Request): boolean {
  const authHeader = req.headers.authorization;
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const token = bearer || (req.body?.token as string);
  if (token && activeSessions.has(token)) {
    const exp = activeSessions.get(token)!;
    if (Date.now() < exp) return true;
    activeSessions.delete(token);
  }
  const pin = req.body?.pin;
  if (pin && String(pin).trim() === OWNER_PIN) return true;
  return false;
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
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Reduced from 35mb to 10mb for enhanced memory and DoS protection
app.use(express.json({ limit: '10mb' }));

const DATA_DIR = path.resolve(__dirname, 'data');
const ASSETS_FILE = path.join(DATA_DIR, 'assets.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const INITIAL_4_REVIEWS = [
  {
    id: 'rev-1',
    name: 'Rian Ardiansyah',
    emoji: '😍',
    emojiLabel: 'Sangat Puas & Mewah',
    variant: 'Mykonos Monaco Royale',
    comment:
      'Gila sih wanginya beneran mewah banget! Semprot pagi sebelum ngantor, malem pas pulang masih nempel kuat di kemeja. Rekan kerja cowo & cewe pada nanya pake parfum apa. Auto langganan terus di SINKI!',
    date: 'Hari ini',
    likes: 42,
  },
  {
    id: 'rev-2',
    name: 'Clarissa Putri',
    emoji: '🥰',
    emojiLabel: 'Suka Parah',
    variant: 'Mykonos Isfahan',
    comment:
      'Rose oud-nya berkelas parah, nggak bikin pusing sama sekali. Wanginya kalem tapi ninggalin jejak harum pas lewat. Semprotan botolnya juga halus banget kayak parfum jutaan. Puas pol!',
    date: 'Kemarin',
    likes: 38,
  },
  {
    id: 'rev-3',
    name: 'Bagus Wicaksono',
    emoji: '🔥',
    emojiLabel: 'Tahan Seharian',
    variant: 'Mykonos French Cognac',
    comment:
      'Packingnya tebel banget bubble wrap berlapis jadi botol kaca aman 100%. Aroma cognac dan kayu manisnya hangat maskulin elegan, cocok banget buat date night atau acara formal.',
    date: '2 hari lalu',
    likes: 29,
  },
  {
    id: 'rev-4',
    name: 'Nadia Safitri',
    emoji: '💎',
    emojiLabel: 'Wangi Mewah',
    variant: 'Mykonos Blanche De Sinki',
    comment:
      'Buat yang suka wangi clean, fresh, aroma baju bersih mewah ala hotel mewah kelas dunia wajib coba varian ini. Lembut banget ga nusuk hidung. Pasangan suka banget nyiumin terus.',
    date: '3 hari lalu',
    likes: 25,
  },
];

// Konfigurasi Supabase Storage (Metode A: Upsert/Overwrite Otomatis - Server Side Only)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tsxclttisxnmvdkwziqx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzeGNsdHRpc3hubXZka3d6aXF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTUyNTQxMiwiZXhwIjoyMTA3MTAxNDEyfQ.f-nMns4K9XMWMeeTO9PTFADoM77IXVtsAlEfvQg-Zfo';
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'sinki-media';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function getReviews(): any[] {
  if (fs.existsSync(REVIEWS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {}
  }
  return INITIAL_4_REVIEWS;
}

async function persistReviews(reviews: any[]) {
  try {
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing local reviews file:', e);
  }
  try {
    await supabase.storage.from(SUPABASE_BUCKET).upload('reviews.json', JSON.stringify(reviews, null, 2), {
      contentType: 'application/json',
      upsert: true,
    });
  } catch (err) {
    console.warn('[Supabase Sync Notice] reviews.json:', err);
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

interface AssetsData {
  logo: string | null;
  chibi: string | null;
  qrisImage?: string | null;
  top11?: Record<string, string>;
  pricing?: any;
  updatedAt?: string;
}

const getAssets = (): AssetsData => {
  if (fs.existsSync(ASSETS_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(ASSETS_FILE, 'utf-8'));
      return {
        logo: parsed.logo || null,
        chibi: parsed.chibi || null,
        qrisImage: parsed.qrisImage || null,
        top11: parsed.top11 && typeof parsed.top11 === 'object' ? parsed.top11 : {},
        pricing: parsed.pricing,
        updatedAt: parsed.updatedAt,
      };
    } catch {
      return { logo: null, chibi: null, qrisImage: null, top11: {} };
    }
  }
  return { logo: null, chibi: null, qrisImage: null, top11: {} };
};

// GET public assets (used by all visitors and shared links)
app.get('/api/public-assets', (_req, res) => {
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
  if (pin && String(pin).trim() === OWNER_PIN) {
    const token = createSession();
    return res.json({
      success: true,
      token,
      message: 'Autentikasi Pemilik Berhasil!',
    });
  }

  return res.status(401).json({ error: 'PIN Pemilik tidak valid!' });
});

// GET public assets (used by all visitors and shared links)
app.get('/api/public-assets', (_req, res) => {
  const data = getAssets();
  return res.json(data);
});

// POST update home assets by Owner
app.post('/api/owner/update-assets', async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(403).json({ error: 'Akses ditolak: PIN atau Sesi Pemilik tidak valid!' });
  }

  const { logo, chibi, qrisImage, top11 } = req.body;
  const existing = getAssets();
  let newLogo = existing.logo;
  let newChibi = existing.chibi;
  let newQris = existing.qrisImage || null;
  const newTop11 = { ...(existing.top11 || {}) };

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

  const updatedData: AssetsData = {
    logo: newLogo,
    chibi: newChibi,
    qrisImage: newQris,
    top11: newTop11,
    pricing: existing.pricing,
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(ASSETS_FILE, JSON.stringify(updatedData), 'utf-8');
  return res.json({
    success: true,
    message: 'Foto SINKI berhasil disimpan & diunggah ke Supabase!',
    data: updatedData,
  });
});

// POST update a specific Top 11 bottle photo by Owner
app.post('/api/owner/update-top11', async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(403).json({ error: 'Akses ditolak: PIN atau Sesi Pemilik tidak valid!' });
  }

  const { variantId, photoData } = req.body;
  if (!variantId || !photoData) {
    return res.status(400).json({ error: 'Data varian atau foto tidak lengkap!' });
  }

  const existing = getAssets();
  const top11 = existing.top11 || {};

  let finalPhoto = photoData;
  if (typeof photoData === 'string' && photoData.startsWith('data:')) {
    const up = await uploadToSupabaseWithOverwrite(`top11/${variantId}.jpg`, photoData);
    if (up.success && up.url) {
      finalPhoto = up.url;
    }
  }

  top11[variantId] = finalPhoto;

  const updatedData: AssetsData = {
    ...existing,
    top11,
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(ASSETS_FILE, JSON.stringify(updatedData), 'utf-8');
  return res.json({
    success: true,
    message: `Foto botol Top 11 (${variantId}) berhasil disimpan!`,
    photoUrl: finalPhoto,
  });
});

// POST update pricing configuration by Owner
app.post('/api/owner/update-pricing', (req, res) => {
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

  fs.writeFileSync(ASSETS_FILE, JSON.stringify(updatedData), 'utf-8');
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

  if (containsInappropriateContent(`${trimmedName} ${trimmedComment}`)) {
    return res.status(400).json({ error: 'Ulasan ditolak: Terdeteksi kata atau kalimat yang kurang sopan.' });
  }

  const newReview = {
    id: `rev-${Date.now()}`,
    name: trimmedName,
    emoji: typeof emoji === 'string' ? emoji.slice(0, 8) : '😍',
    emojiLabel: typeof emojiLabel === 'string' ? emojiLabel.slice(0, 50) : 'Sangat Puas & Mewah',
    variant: typeof variant === 'string' ? variant.slice(0, 100) : 'SINKI Signature',
    comment: trimmedComment,
    date: 'Baru saja',
    likes: 1,
  };

  const current = getReviews();
  const updated = [newReview, ...current.filter((r) => r.id !== newReview.id)].slice(0, 6);
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
  let updated = current.filter((r) => r.id !== id);
  if (updated.length === 0) {
    updated = [...INITIAL_4_REVIEWS];
  }
  await persistReviews(updated);
  return res.json({ success: true, reviews: updated });
});

// POST reset reviews to default by Owner
app.post('/api/owner/reset-reviews', async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(403).json({ error: 'Akses ditolak: PIN atau Sesi Pemilik tidak valid!' });
  }

  await persistReviews(INITIAL_4_REVIEWS);
  return res.json({ success: true, reviews: INITIAL_4_REVIEWS });
});

// Perfumes Catalog Endpoints
const PERFUMES_FILE = path.join(DATA_DIR, 'perfumes_catalog.json');
const TICKER_FILE = path.join(DATA_DIR, 'ticker_config.json');

app.get('/api/perfumes', (_req, res) => {
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
    await supabase.storage.from(SUPABASE_BUCKET).upload('perfumes_catalog.json', JSON.stringify(perfumes, null, 2), {
      contentType: 'application/json',
      upsert: true,
    });
  } catch (err) {
    console.warn('Notice syncing perfumes to Supabase:', err);
  }
  return res.json({ success: true, perfumes });
});

app.get('/api/ticker', (_req, res) => {
  if (fs.existsSync(TICKER_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(TICKER_FILE, 'utf-8'));
      if (data && data.text) return res.json(data);
    } catch {}
  }
  return res.json({ text: 'Tahan 8 jam, dia aja yang gak tahan 😏', font: 'cinzel' });
});

app.post('/api/owner/update-ticker', async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(403).json({ error: 'Akses ditolak: PIN atau Sesi Pemilik tidak valid!' });
  }
  const { ticker } = req.body;
  if (!ticker || !ticker.text) {
    return res.status(400).json({ error: 'Data ticker tidak valid!' });
  }
  try {
    fs.writeFileSync(TICKER_FILE, JSON.stringify(ticker, null, 2), 'utf-8');
    await supabase.storage.from(SUPABASE_BUCKET).upload('ticker_config.json', JSON.stringify(ticker, null, 2), {
      contentType: 'application/json',
      upsert: true,
    });
  } catch (err) {
    console.warn('Notice syncing ticker to Supabase:', err);
  }
  return res.json({ success: true, ticker });
});

async function startServer() {
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
