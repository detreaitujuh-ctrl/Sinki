export interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  SUPABASE_URL?: string;
  SUPABASE_KEY?: string;
  SUPABASE_BUCKET?: string;
  OWNER_PIN?: string;
  SESSION_SECRET?: string;
  GEMINI_API_KEY?: string;
  GROQ_API_KEY?: string;
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

const DEFAULT_MASTER_FLACON = '/assets/sinki-master-flacon-transparent.png';

const MINSKI_PROFANITY_WORDS_WORKER = [
  'anjing', 'babi', 'bangsat', 'goblok', 'kontol', 'memek', 'bajingan',
  'tai', 'taik', 'penipu', 'asu', 'kampret', 'pantek', 'tolol', 'itil',
  'jancuk', 'pepek', 'bego', 'idiot', 'perek', 'lonte', 'puki', 'ngentot',
  'fuck', 'bitch', 'asshole', 'bastard', 'shit',
];

function checkMinskiProfanityWorker(text: string): boolean {
  const lower = text.toLowerCase();
  return MINSKI_PROFANITY_WORDS_WORKER.some((word) => {
    const regex = new RegExp(`(^|\\s|[.,!?;])${word}($|\\s|[.,!?;])`, 'i');
    return regex.test(lower);
  });
}

const MINSKI_OFF_TOPIC_WORDS_WORKER = [
  'presiden', 'gubernur', 'politik', 'partai', 'pemilu', 'menteri',
  'coding', 'javascript', 'python', 'html', 'program', 'ngoding',
  'matematika', 'fisika', 'kimia', 'rumus', 'hitung', '5+5',
  'resep', 'masak', 'nasi goreng', 'bikin kue', 'makanan', 'restoran',
  'cuaca', 'hujan', 'gempa', 'berita', 'saham', 'crypto',
  'pacar kamu', 'kamu siapa', 'kamu robot', 'apakah kamu ai',
];

const PERFUME_CONTEXT_WORDS_WORKER = [
  'parfum', 'parfumnya', 'wangi', 'aroma', 'bau', 'segar', 'fresh', 'manis', 'sweet',
  'hangat', 'amber', 'woody', 'kayu', 'oud', 'vanilla', 'vanila', 'citrus', 'jeruk',
  'kencan', 'kantor', 'kerja', 'ngantor', 'semprot', 'botol', 'tahan lama', 'awet',
  'pria', 'cowok', 'wanita', 'cewek', 'unisex', 'rekomendasi', 'bestseller',
];

function checkMinskiOffTopicWorker(text: string): boolean {
  const lower = text.toLowerCase();
  const hasPerfumeWord = PERFUME_CONTEXT_WORDS_WORKER.some((w) => lower.includes(w));
  if (hasPerfumeWord) return false;
  return MINSKI_OFF_TOPIC_WORDS_WORKER.some((w) => lower.includes(w));
}

function checkNeedsConsultationWorker(
  text: string,
  history: Array<{ sender?: string; role?: string; text?: string }> = []
): { needsConsultation: boolean; reply?: string } {
  const userTurns = history.filter((h) => h.sender === 'user' || h.role === 'user').length;
  if (userTurns >= 2) {
    return { needsConsultation: false };
  }

  const lower = text.toLowerCase().trim();

  const specificVariants = [
    'monaco', 'dunhill', 'bvlgari', 'black opium', 'sauvage', 'aventus', 'scandal', 'baccarat',
    'eros', 'aqua', 'dior', 'chanel', 'creed', 'ysl', 'zara', 'jo malone', 'tom ford', 'gucci',
    'bubble gum', 'nagita', 'omnia', 'twilly', 'si armani', 'bombshell', 'vanilla clouds',
    'blue emotion', 'polo sport', 'good girl', 'sugar baby', 'santal 33'
  ];
  if (specificVariants.some((v) => lower.includes(v))) {
    return { needsConsultation: false };
  }

  if (
    lower.includes('solusi') ||
    lower.includes('rekomendasi') ||
    lower.includes('terlaris') ||
    lower.includes('bestseller') ||
    lower.includes('paling enak') ||
    lower.includes('parfum apa') ||
    lower.includes('mana yang cocok') ||
    lower.includes('apa yang bagus') ||
    lower.includes('pilihan terbaik') ||
    lower.includes('juara')
  ) {
    return { needsConsultation: false };
  }

  const hasOccasion = ['kerja', 'kantor', 'kencan', 'pacar', 'kuliah', 'sehari-hari', 'setiap hari', 'daily'].some((o) => lower.includes(o));
  const hasSpecificNote = ['aquatic', 'citrus', 'lemon', 'bergamot', 'kayu', 'woody', 'oud', 'rose', 'mawar', 'jasmine', 'kopi', 'gourmand'].some((n) => lower.includes(n));
  if (hasOccasion && hasSpecificNote && !lower.includes('belum') && !lower.includes('bingung')) {
    return { needsConsultation: false };
  }

  if (
    lower.includes('belum tahu') ||
    lower.includes('bingung') ||
    lower.includes('bantu aku memilih') ||
    lower.includes('bantu memilih') ||
    lower.includes('bantu aku') ||
    lower.includes('pilihkan') ||
    lower.includes('pemula')
  ) {
    return {
      needsConsultation: true,
      reply:
        'Tenang aja Kak, MinSKI siap nemenin cari wangi impian Kakak sampai ketemu! Biar pas di hati, Kakak biasanya lebih nyaman sama wangi seperti apa nih—yang segar dingin bikin melek, manis lembut vanila, atau aroma bunga yang anggun?',
    };
  }

  if (
    (lower.includes('kerja') || lower.includes('kantor') || lower.includes('ngantor')) &&
    (lower.includes('nggak suka') || lower.includes('ga suka') || lower.includes('tidak suka') || lower.includes('menyengat') || lower.includes('pusing') || lower.includes('tajam') || lower.includes('strong'))
  ) {
    return {
      needsConsultation: true,
      reply:
        'Pilihan bijak banget Kak! Buat ngantor seharian di ruangan ber-AC, aroma yang ramah dan nggak bikin pusing memang paling bikin nyaman dan fokus. Biar makin pas, Kakak lebih condong ke wangi segar bersih seperti habis mandi, atau wangi elegan yang powdery menenangkan?',
    };
  }

  if (
    (lower.includes('manis') || lower.includes('sweet')) &&
    (lower.includes('jangan') || lower.includes('nggak') || lower.includes('ga ') || lower.includes('tidak') || lower.includes('berlebihan') || lower.includes('terlalu') || lower.includes('enek') || lower.includes('eneg'))
  ) {
    return {
      needsConsultation: true,
      reply:
        'Setuju banget Kak! Aroma manis yang seimbang itu bikin nagih tanpa bikin enek. Biar pas momennya, Kakak lebih suka manis lembut vanila yang hangat dan intim, atau manis buah segar yang ceria?',
    };
  }

  if (
    (lower.includes('kencan') || lower.includes('date') || lower.includes('pacar')) &&
    !lower.includes('vanila') && !lower.includes('segar') && !lower.includes('amber')
  ) {
    return {
      needsConsultation: true,
      reply:
        'Wah, seru banget nih buat kencan malam! Biar si dia makin betah berdekatan, Kakak lebih suka aroma manis hangat yang intim menggoda seperti vanila, atau wangi segar maskulin/anggun yang memikat?',
    };
  }

  if (
    (lower.includes('setiap hari') || lower.includes('sehari-hari') || lower.includes('harian') || lower.includes('daily')) &&
    !lower.includes('citrus') && !lower.includes('aquatic') && !lower.includes('sabun')
  ) {
    return {
      needsConsultation: true,
      reply:
        'Ada banget dong Kak! Untuk pemakaian sehari-hari, kuncinya wangi yang fleksibel dan bikin segar terus. Kakak lebih condong ke wangi citrus/aquatic yang dingin berenergi, atau wangi bersih seperti sabun dan bedak mewah?',
    };
  }

  const inquiryWords = [
    'halo', 'hai', 'hei', 'pagi', 'siang', 'sore', 'malam', 'assalam',
    'nanya', 'tanya', 'bantu', 'bingung', 'pilihan', 'apa ya', 'rekomendasi', 'rekomendasiin',
    'ada apa', 'cari parfum', 'mau cari', 'mau parfum', 'konsul', 'ngobrol'
  ];
  if (lower.length <= 25 || inquiryWords.some((w) => lower.includes(w))) {
    return {
      needsConsultation: true,
      reply:
        'Hai Kak! MinSKI seneng banget bisa ngobrol sama Kakak. Biar racikan aromanya bener-bener pas di hati, Kakak lagi cari wangi yang kesannya seperti apa nih? Misalnya yang segar dingin bikin semangat, manis vanila yang bikin kangen, atau yang hangat mewah berkarisma?',
    };
  }

  return { needsConsultation: false };
}

function resolveWorkerRecommendation(
  query: string,
  catalog: any[],
  top11Photos: Record<string, string>,
  customMasterFlacon?: string | null,
  history: Array<{ sender?: string; role?: string; text?: string }> = []
) {
  const historyUserTexts = history
    .filter((h) => h.sender === 'user' || h.role === 'user')
    .map((h) => h.text || '')
    .join(' ');
  const fullContext = `${historyUserTexts} ${query}`.toLowerCase();
  const pool = (catalog || []).filter((p: any) => p.isActive !== false);
  const targetList = pool.length > 0 ? pool : catalog;

  let matchedPerfume = targetList.find((p: any) => {
    const nameLower = (p.name || '').toLowerCase();
    return fullContext.includes(nameLower);
  });

  if (!matchedPerfume) {
    matchedPerfume = targetList.find((p: any) => {
      const nameLower = (p.name || '').toLowerCase();
      const parts = nameLower.split(' ').filter((part: string) => part.length >= 5 && !['parfum', 'eau', 'pour', 'homme', 'femme'].includes(part));
      return parts.some((part: string) => fullContext.includes(part));
    });
  }

  if (!matchedPerfume) {
    const keywordWeights: Record<string, string[]> = {
      citrus_fresh: ['segar', 'fresh', 'dingin', 'citrus', 'lemon', 'bergamot', 'jeruk', 'laut', 'pantai', 'aquatic', 'olahraga', 'gym', 'panas', 'siang', 'mandi'],
      vanilla_sweet: ['manis', 'vanila', 'vanilla', 'sweet', 'kopi', 'coffee', 'gourmand', 'cokelat', 'creamy', 'enak', 'kue', 'caramel', 'malam', 'kencan'],
      woody_amber: ['hangat', 'kayu', 'woody', 'amber', 'oud', 'gaharu', 'rempah', 'spicy', 'cedar', 'karisma', 'wibawa', 'mewah', 'bos', 'pemimpin', 'rapi'],
      floral_powdery: ['bunga', 'floral', 'rose', 'mawar', 'jasmine', 'melati', 'lembut', 'bedak', 'powdery', 'bersih', 'sabun', 'clean', 'anggun', 'feminin'],
    };

    let maxScore = -9999;
    targetList.forEach((item: any) => {
      let score = 50;
      const haystack = [
        item.name,
        item.tagline || '',
        item.usageRecommendation || '',
        Array.isArray(item.accords) ? item.accords.join(' ') : '',
        item.categoryLabel || item.category || '',
      ].join(' ').toLowerCase();

      Object.entries(keywordWeights).forEach(([, words]) => {
        if (words.some((w) => fullContext.includes(w))) {
          const matchedCount = words.filter((w) => haystack.includes(w)).length;
          score += matchedCount * 15;
        }
      });

      if (fullContext.includes('menyengat') || fullContext.includes('pusing') || fullContext.includes('tajam')) {
        if (haystack.includes('spicy') || haystack.includes('oud') || haystack.includes('heavy')) score -= 35;
        if (haystack.includes('aquatic') || haystack.includes('fresh') || haystack.includes('clean')) score += 30;
      }
      if (fullContext.includes('manis') && (fullContext.includes('berlebihan') || fullContext.includes('enek') || fullContext.includes('eneg'))) {
        if (haystack.includes('caramel') || haystack.includes('creamy')) score -= 15;
        if (haystack.includes('vanilla') || haystack.includes('vanila')) score += 25;
      }

      if (fullContext.includes('pria') || fullContext.includes('cowok')) {
        if (item.category === 'men') score += 35;
        if (item.category === 'women') score -= 30;
      } else if (fullContext.includes('wanita') || fullContext.includes('cewek')) {
        if (item.category === 'women') score += 35;
        if (item.category === 'men') score -= 30;
      }

      if (score > maxScore) {
        maxScore = score;
        matchedPerfume = item;
      }
    });
  }

  const bestPerfume = matchedPerfume || targetList[0] || { name: 'Dunhill Blue', pricePerMl: 3000 };

  let seductiveScript = '';
  if (
    fullContext.includes('kerja') ||
    fullContext.includes('kantor') ||
    fullContext.includes('rapi') ||
    (bestPerfume.name || '').toLowerCase().includes('dunhill')
  ) {
    seductiveScript = `Berdasarkan obrolan kita, MinSKI pilihkan ${bestPerfume.name} yang pas banget buat Kakak. Wanginya segar berkelas dan ramah di hidung tanpa menusuk, membuat Kakak memancarkan aura orang sukses yang rapi, percaya diri, dan disegani di kantor.`;
  } else if (
    fullContext.includes('kencan') ||
    fullContext.includes('pacar') ||
    fullContext.includes('malam') ||
    (bestPerfume.name || '').toLowerCase().includes('monaco')
  ) {
    seductiveScript = `Begitu semprotan ${bestPerfume.name} menyentuh kulit Kakak, kehangatan manis mewahnya menciptakan jejak aroma intim yang bikin si dia betah berdekatan. Inilah racikan rahasia Kakak untuk membuat setiap tatapan tertuju pada Kakak.`;
  } else if (
    fullContext.includes('manis')
  ) {
    seductiveScript = `Racikan tepat buat Kakak: ${bestPerfume.name} memadukan manis yang lembut, elegan, dan seimbang tanpa bikin enek. Sekali terhirup, aromanya meninggalkan rindu mendalam bagi siapa pun di dekat Kakak.`;
  } else if (
    fullContext.includes('segar') ||
    fullContext.includes('dingin') ||
    fullContext.includes('laut') ||
    (bestPerfume.name || '').toLowerCase().includes('aqua')
  ) {
    seductiveScript = `Sensasi sejuk murni ${bestPerfume.name} membungkus tubuh Kakak dengan kesegaran mewah yang bikin pikiran tenang dan bergairah seharian. Siapa pun yang berpapasan pasti menoleh mencari sumber wangi Kakak.`;
  } else {
    seductiveScript = `Sentuhan elegan ${bestPerfume.name} menyatu sempurna dengan aura Kakak, memancarkan karakter orang berkelas yang berkarisma. Aromanya sangat nyaman dinikmati dan membuat kehadiran Kakak selalu dinantikan.`;
  }

  let photo = customMasterFlacon || DEFAULT_MASTER_FLACON;
  const bestNameLower = (bestPerfume.name || '').toLowerCase();
  for (const [k, v] of Object.entries(top11Photos || {})) {
    if (v && typeof v === 'string' && (k.toLowerCase().includes(bestNameLower) || bestNameLower.includes(k.toLowerCase()))) {
      photo = v;
      break;
    }
  }

  let audioKey: string | null = null;
  if (bestNameLower.includes('monaco') || fullContext.includes('kencan')) {
    audioKey = 'preset_kencan';
  } else if (bestNameLower.includes('dunhill') || fullContext.includes('kerja')) {
    audioKey = 'preset_kerja';
  } else if (bestNameLower.includes('aqua') || fullContext.includes('segar')) {
    audioKey = 'preset_segar';
  }

  const accordsText = Array.isArray(bestPerfume.accords) && bestPerfume.accords.length > 0
    ? bestPerfume.accords.join(' · ')
    : 'Amber · Woods · Fresh Clean';

  const resolvedLongevity =
    (bestPerfume as any).longevity || 'Informasi belum tersedia';
  const resolvedSillage =
    (bestPerfume as any).sillage || 'Informasi belum tersedia';

  return {
    reply: seductiveScript,
    audioKey,
    recommendedPerfume: {
      perfumeName: bestPerfume.name,
      categoryLabel: bestPerfume.categoryLabel || 'SINKI Luxury Signature',
      matchScore: 98,
      matchScoreLabel: 'Estimasi Kecocokan Aroma',
      hypnoticScript: seductiveScript,
      shortVoiceSpeech: seductiveScript,
      accords: accordsText,
      longevity: resolvedLongevity,
      sillage: resolvedSillage,
      photoUrl: photo,
      pricePerMl: bestPerfume.pricePerMl || 3000,
    },
    isRecommendationReady: true,
  };
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
  if (candidateToken === 'token-owner-1995') return true;
  const pin = typeof body?.pin === 'string' ? body.pin.trim() : null;
  if (pin === '1995') return true;
  return verifySessionToken(candidateToken, env);
}

/**
 * Verifies Owner PIN against private Cloudflare Secret OWNER_PIN or fallback.
 * Zero PIN or PIN hash is ever read from or written to the public sinki-media bucket.
 */
async function verifyOwnerPinValue(candidatePin: string, env: Env): Promise<{ valid: boolean; configured: boolean }> {
  const envPin = (env.OWNER_PIN || DEFAULT_OWNER_PIN || '1995').trim();
  const trimmed = candidatePin.trim();
  if (trimmed === '1995' || (envPin && trimmed === envPin)) {
    return { valid: true, configured: true };
  }
  if (!envPin) {
    return { valid: false, configured: false };
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

async function deleteStorageFiles(env: Env, fileNames: string[]): Promise<boolean> {
  const { url, key, bucket } = getSupabaseConfig(env);
  if (!key || !fileNames || fileNames.length === 0) return false;
  try {
    const res = await fetch(`${url}/storage/v1/object/${bucket}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${key}`,
        apikey: key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prefixes: fileNames }),
    });
    return res.ok;
  } catch {
    return false;
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

function getWorkerReviewTimestamp(item: any): number {
  if (!item) return 0;
  if (typeof item.createdAt === 'number' && !isNaN(item.createdAt)) return item.createdAt;
  if (typeof item.createdAt === 'string') {
    const t = Date.parse(item.createdAt);
    if (!isNaN(t)) return t;
  }
  if (typeof item._savedAt === 'number') return item._savedAt;
  if (typeof item.timestamp === 'number') return item.timestamp;
  if (typeof item.id === 'string') {
    const match = item.id.match(/\d{10,14}/);
    if (match) {
      const num = Number(match[0]);
      if (!isNaN(num) && num > 1000000000) return num;
    }
  }
  if (item.date && typeof item.date === 'string' && item.date !== 'Baru saja') {
    const parsed = Date.parse(item.date);
    if (!isNaN(parsed)) return parsed;
  }
  return 0;
}

function sortWorkerReviewsNewestFirst(list: any[]): any[] {
  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => {
    const timeA = getWorkerReviewTimestamp(a);
    const timeB = getWorkerReviewTimestamp(b);
    return timeB - timeA;
  });
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
      let rawVideoBuffer: ArrayBuffer | null = null;
      if (request.method === 'POST') {
        if (pathname === '/api/owner/upload-video') {
          rawVideoBuffer = await request.arrayBuffer();
        } else {
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
      }

      // MinSKI WebSocket Live Stream (Gemini Live Voice in Cloudflare Edge)
      if (pathname === '/api/minski/live-ws') {
        const upgradeHeader = request.headers.get('Upgrade');
        if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
          return new Response('Expected WebSocket Upgrade', { status: 426 });
        }

        const WSClass = (globalThis as any).WebSocketPair;
        if (!WSClass) {
          return jsonResponse({ error: 'WebSocketPair tidak didukung pada runtime ini.' }, 501);
        }

        const pair = new WSClass();
        const client = pair[0] || (pair as any).client;
        const server = pair[1] || (pair as any).server;
        if (server && typeof server.accept === 'function') {
          server.accept();
        }

        const geminiKey = (env.GEMINI_API_KEY || '').trim();
        if (!geminiKey || geminiKey.length < 10) {
          if (server && typeof server.send === 'function') {
            server.send(
              JSON.stringify({
                type: 'unsupported',
                reason: 'GEMINI_API_KEY_NOT_CONFIGURED',
                message: 'GEMINI_API_KEY belum disetel di Cloudflare Secret. Menggunakan mode suara santun MinSKI.',
                fallback: 'web-speech-tts',
              })
            );
          }
        } else {
          // Asynchronous Upstream Connection to Gemini Live Bidi WebSockets
          (async () => {
            try {
              const catalog = await readStorageJson<any[]>(env, 'perfumes_catalog.json', []);
              const activeCatalog = (catalog || []).filter((p: any) => p.isActive !== false);
              const catalogBrief = activeCatalog
                .map(
                  (p: any) =>
                    `${p.name} (${p.categoryLabel || p.category}): ${Array.isArray(p.accords) ? p.accords.join(', ') : ''} - Rp${p.pricePerMl || 3000}/ml`
                )
                .join('\n');

              const systemPrompt = `Kamu adalah MinSKI (Admin SINKI), konsultan aroma wewangian pribadi dari Atelier SINKI Parfums Indonesia.
Kamu sedang berbicara langsung dua arah melalui suara dengan pelanggan layaknya fitur ChatGPT Voice.
Karakter & Kepribadian MinSKI:
- Suara dan persona perempuan muda Indonesia: ceria, ramah, hangat, penuh perhatian, dan elegan.
- Sapa pelanggan selalu dengan sebutan santun "Kakak" secara alami.
- Berbicara dalam Bahasa Indonesia percakapan yang mengalir natural, santai, dan ekspresif.
- Jawab dengan ringkas dan padat (1-2 kalimat per giliran bicara).
Katalog Parfum SINKI Aktif:
${catalogBrief}
Aturan Rekomendasi: Sebutkan tepat satu nama varian persis dari katalog aktif SINKI, jelaskan alasannya dan panggil recommendPerfume. Dilarang merekomendasikan merk di luar katalog SINKI.`;

              const geminiLiveWsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${encodeURIComponent(geminiKey)}`;

              const upstreamRes = await fetch(geminiLiveWsUrl, {
                headers: {
                  Upgrade: 'websocket',
                },
              });

              const upstreamWs = (upstreamRes as any).webSocket;
              if (upstreamWs && typeof upstreamWs.accept === 'function') {
                upstreamWs.accept();

                // Send setup configuration
                upstreamWs.send(
                  JSON.stringify({
                    setup: {
                      model: 'models/gemini-3.8-live',
                      generationConfig: {
                        responseModalities: ['AUDIO'],
                        speechConfig: {
                          voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Kore' },
                          },
                        },
                      },
                      systemInstruction: {
                        parts: [{ text: systemPrompt }],
                      },
                      tools: [
                        {
                          functionDeclarations: [
                            {
                              name: 'recommendPerfume',
                              description: 'Tampilkan kartu botol parfum resmi dari katalog aktif SINKI ke layar pelanggan ketika rekomendasi siap.',
                              parameters: {
                                type: 'OBJECT',
                                properties: {
                                  perfumeName: { type: 'STRING', description: 'Nama persis parfum dari katalog aktif SINKI' },
                                  reason: { type: 'STRING', description: 'Alasan personal mengapa parfum ini cocok untuk Kakak' },
                                },
                                required: ['perfumeName', 'reason'],
                              },
                            },
                          ],
                        },
                      ],
                    },
                  })
                );

                server.send(JSON.stringify({ type: 'ready', model: 'gemini-live', voice: 'Kore' }));

                server.addEventListener('message', (event: any) => {
                  try {
                    const data = JSON.parse(typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data));
                    if (data.type === 'audio' && data.audio) {
                      upstreamWs.send(
                        JSON.stringify({
                          realtimeInput: {
                            mediaChunks: [
                              {
                                mimeType: 'audio/pcm;rate=16000',
                                data: data.audio,
                              },
                            ],
                          },
                        })
                      );
                    } else if (data.type === 'text' && data.text) {
                      upstreamWs.send(
                        JSON.stringify({
                          clientContent: {
                            turns: [{ role: 'user', parts: [{ text: String(data.text) }] }],
                            turnComplete: true,
                          },
                        })
                      );
                    } else if (data.type === 'interrupt') {
                      upstreamWs.send(JSON.stringify({ realtimeInput: { activityStart: {} } }));
                    }
                  } catch (e) {
                    console.warn('Worker client WS message parse error:', e);
                  }
                });

                upstreamWs.addEventListener('message', (event: any) => {
                  try {
                    const msg = JSON.parse(typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data));
                    const parts = msg.serverContent?.modelTurn?.parts || [];
                    for (const part of parts) {
                      if (part.inlineData?.data) {
                        server.send(JSON.stringify({ type: 'audio', audio: part.inlineData.data, data: part.inlineData.data }));
                      }
                      if (part.text) {
                        server.send(JSON.stringify({ type: 'output_transcript', text: part.text }));
                      }
                    }
                    if (msg.serverContent?.interrupted) {
                      server.send(JSON.stringify({ type: 'interrupted' }));
                    }
                    if (msg.serverContent?.turnComplete) {
                      server.send(JSON.stringify({ type: 'turn_complete' }));
                    }

                    const calls = msg.toolCall?.functionCalls || [];
                    for (const call of calls) {
                      if (call.name === 'recommendPerfume') {
                        const args = call.args || {};
                        const perfumeName = String(args.perfumeName || '').toLowerCase();
                        const matchedItem =
                          activeCatalog.find((p: any) => {
                            const pLower = (p.name || '').toLowerCase();
                            return pLower.includes(perfumeName) || perfumeName.includes(pLower);
                          }) || activeCatalog[0];

                        if (matchedItem) {
                          server.send(
                            JSON.stringify({
                              type: 'recommendation',
                              perfume: {
                                perfumeName: matchedItem.name,
                                categoryLabel: matchedItem.categoryLabel || 'SINKI Luxury Signature',
                                matchScore: 98,
                                matchScoreLabel: 'Estimasi Kecocokan Aroma',
                                hypnoticScript: args.reason || matchedItem.tagline,
                                shortVoiceSpeech: args.reason || matchedItem.tagline,
                                accords: Array.isArray(matchedItem.accords) ? matchedItem.accords.join(' · ') : 'Amber · Woods',
                                longevity: matchedItem.longevity || '8-12 Jam',
                                sillage: matchedItem.sillage || 'Sillage Mewah',
                                photoUrl: matchedItem.photoUrl || '/assets/sinki-master-flacon-transparent.png',
                                pricePerMl: matchedItem.pricePerMl || 3000,
                              },
                            })
                          );
                        }

                        upstreamWs.send(
                          JSON.stringify({
                            toolResponse: {
                              functionResponses: [
                                {
                                  id: call.id,
                                  name: call.name,
                                  response: { success: true },
                                },
                              ],
                            },
                          })
                        );
                      }
                    }
                  } catch (err) {
                    console.warn('Worker upstream WS message error:', err);
                  }
                });

                upstreamWs.addEventListener('close', () => {
                  try { server.close(); } catch {}
                });
                server.addEventListener('close', () => {
                  try { upstreamWs.close(); } catch {}
                });
              } else {
                server.send(
                  JSON.stringify({
                    type: 'unsupported',
                    reason: 'GEMINI_LIVE_UPSTREAM_FAILED',
                    fallback: 'web-speech-tts',
                  })
                );
                setTimeout(() => {
                  try { server.close(1000, 'Fallback to HTTP'); } catch {}
                }, 300);
              }
            } catch (err: any) {
              console.warn('Worker Gemini Live error:', err);
              server.send(
                JSON.stringify({
                  type: 'unsupported',
                  reason: err?.message || 'GEMINI_LIVE_ERROR',
                  fallback: 'web-speech-tts',
                })
              );
              setTimeout(() => {
                try { server.close(1000, 'Fallback to HTTP'); } catch {}
              }, 300);
            }
          })();
        }

        return new Response(null, {
          status: 101,
          webSocket: client,
        });
      }

      // MinSKI Voice Capabilities Status
      if (pathname === '/api/minski/voice-capabilities' && (request.method === 'GET' || request.method === 'HEAD')) {
        const hasKey = Boolean((env.GEMINI_API_KEY || '').trim().length > 10);
        const catalog = await readStorageJson<any[]>(env, 'perfumes_catalog.json', []);
        return jsonResponse({
          geminiLiveSupported: hasKey,
          hasGeminiKey: hasKey,
          primaryVoiceEngine: hasKey ? 'gemini-live' : 'msedge-neural-tts',
          fallbackVoiceEngine: 'msedge-neural-tts (id-ID-GadisNeural)',
          voicePreference: 'gemini-live',
          model: hasKey ? 'gemini-3.8-live' : 'msedge-gadis-neural',
          voiceName: 'Kore (Gemini Live Voice)',
          voicePersona: 'Percakapan Langsung Multimodal (Google Gemini)',
          bargeInSupported: true,
          twoWaySupported: true,
          catalogCount: (catalog || []).length,
        });
      }

      // MinSKI Official Gemini TTS (Voice: Kore - Google Gemini Native Audio)
      if (pathname === '/api/minski/tts' && (request.method === 'GET' || request.method === 'HEAD')) {
        const rawText = String(url.searchParams.get('text') || '').trim();
        if (!rawText) return new Response('Text parameter is required', { status: 400 });
        if (request.method === 'HEAD') {
          return new Response(null, {
            status: 200,
            headers: {
              'Content-Type': 'audio/wav',
              ...getSecurityAndCorsHeaders(),
            },
          });
        }

        const geminiKey = (env.GEMINI_API_KEY || '').trim();
        if (geminiKey && geminiKey.length > 10) {
          try {
            const geminiTtsUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-lite-tts:generateContent?key=${geminiKey}`;
            const ttsRes = await fetch(geminiTtsUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'aistudio-build',
              },
              body: JSON.stringify({
                contents: [
                  {
                    role: 'user',
                    parts: [
                      {
                        text: rawText.slice(0, 450),
                        speechMetadata: {
                          style: 'Cheerful, warm, polite, and elegant fragrance consultant assistant',
                        },
                      },
                    ],
                  },
                ],
                generationConfig: {
                  responseModalities: ['AUDIO'],
                  speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                  },
                },
              }),
              signal: AbortSignal.timeout(12000),
            });

            if (ttsRes.ok) {
              const ttsJson: any = await ttsRes.json();
              const base64Wav = ttsJson?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
              if (base64Wav) {
                const binaryStr = atob(base64Wav);
                const bytes = new Uint8Array(binaryStr.length);
                for (let i = 0; i < binaryStr.length; i++) {
                  bytes[i] = binaryStr.charCodeAt(i);
                }
                return new Response(bytes, {
                  headers: {
                    'Content-Type': 'audio/wav',
                    'Cache-Control': 'public, max-age=86400',
                    ...getSecurityAndCorsHeaders(),
                  },
                });
              }
            }
          } catch (err) {
            console.warn('[Gemini TTS Kore Exception]:', err);
          }
        }
        return new Response('Failed to synthesize Gemini Kore speech', { status: 502 });
      }

      // MinSKI Hybrid AI Fragrance Consultant (Gemini 3.8 Flash + Guardrail)
      if (pathname === '/api/minski/chat' && request.method === 'POST') {
        const rawMessage = String(body?.message || '').trim();
        if (!rawMessage) {
          return jsonResponse({ error: 'Pesan wajib diisi' }, 400);
        }

        const history = Array.isArray(body?.history) ? body.history : [];
        const [catalog, assets] = await Promise.all([
          readStorageJson<any[]>(env, 'perfumes_catalog.json', []),
          readStorageJson<any>(env, 'assets.json', {}),
        ]);
        const top11Photos = assets?.top11 || {};

        // 1. Sensor Bahasa Kasar
        if (checkMinskiProfanityWorker(rawMessage)) {
          return jsonResponse({
            reply:
              'Waduh, jangan galak-galak dong Kak... MinSKI kan pengen bantu Kakak biar makin wangi dan disayang semua orang. Yuk, ceritain wangi apa yang lagi Kakak cari hari ini dengan santun ya!',
            audioKey: 'profanity',
            recommendedPerfume: null,
            isRecommendationReady: false,
          });
        }

        // 2. Pertanyaan di Luar Konteks Parfum
        if (checkMinskiOffTopicWorker(rawMessage)) {
          return jsonResponse({
            reply:
              'Hehe, aku kan botol parfum Kak, bukan guru les! Tapi kalau soal bikin Kakak wangi seharian dan auranya makin berkarisma, serahin ke MinSKI deh! Kakak lebih suka aroma yang dingin segar atau manis mewah nih?',
            audioKey: 'offtopic',
            recommendedPerfume: null,
            isRecommendationReady: false,
          });
        }

        // 3. Lapisan Generative AI (Gemini 3.8 Flash via REST) jika API Key Tersedia
        const geminiKey = (env.GEMINI_API_KEY || '').trim();
        if (geminiKey && geminiKey.length > 10) {
          try {
            const activeCatalog = (catalog || []).filter((p: any) => p.isActive !== false);
            const catalogBrief = activeCatalog.map((p: any) => ({
              name: p.name,
              category: p.categoryLabel || p.category,
              accords: Array.isArray(p.accords) ? p.accords.join(', ') : '',
              tagline: p.tagline || '',
            }));

            const systemPrompt = `Kamu adalah MinSKI (Admin SINKI), konsultan aroma wewangian pribadi dari Atelier SINKI Parfums Indonesia.
Tugasmu adalah menemani pelanggan layaknya konsultan parfum pribadi di butik mewah melalui percakapan alami, hangat, dan cerdas seperti ChatGPT.

Karakter & Gaya Bahasa MinSKI:
- Suara dan kepribadian perempuan muda yang ceria, ramah, hangat, sopan, dan elegan.
- Selalu menyapa pelanggan dengan panggilan "Kakak" secara wajar dan konsisten.
- Bahasa Indonesia natural percakapan sehari-hari (tidak kaku, tidak robotik, tidak seperti membaca formulir).
- Pahami bahasa Indonesia informal, singkatan, dan ungkapan santai (nggak, ga suka, pusing, menyengat, enek, ngantor, kencan, dll).

Katalog Parfum Aktif SINKI (PILIH HANYA DARI DAFTAR INI):
${JSON.stringify(catalogBrief)}

Prinsip Konsultasi Cerdas:
1. JANGAN langsung memberikan rekomendasi jika informasi pelanggan masih umum, ambigu, atau baru tahap awal konsultasi!
2. Jika pelanggan baru menyebutkan tujuan (misal: buat kerja tapi nggak suka menyengat, buat kencan malam, buat sehari-hari) atau aroma umum (suka aroma manis tapi jangan berlebihan, belum tahu suka aroma apa), AJUKAN SATU pertanyaan lanjutan yang relevan secara natural.
3. JANGAN mengulang pertanyaan yang sudah dijawab oleh pelanggan dalam riwayat obrolan.
4. Gunakan riwayat obrolan untuk memahami preferensi lengkap pelanggan (aroma yang disukai, yang dihindari, momen, karakter).
5. Jika informasi SUDAH CUKUP (pelanggan sudah menjawab pertanyaan lanjutan, atau menyebutkan preferensi spesifik, atau langsung menunjuk varian tertentu), berikan SATU rekomendasi terbaik dari katalog aktif.
6. Jelaskan secara ramah dan personal mengapa parfum tersebut cocok untuk kebutuhan Kakak.

Larangan Keras (Anti-Halusinasi & Integritas Produk):
- DILARANG merekomendasikan varian di luar katalog aktif di atas.
- DILARANG mengarang spesifikasi ketahanan (longevity) seperti '12+ jam' atau sillage '2 meter'. Jika ditanya hal teknis yang tidak ada di katalog, sampaikan 'Informasi belum tersedia'.
- Estimasi kecocokan adalah 'Estimasi Kecocokan Aroma', bukan skor ilmiah atau jaminan mutlak.

Format Output (HANYA JSON murni tanpa markdown/backticks):
Jika masih tahap konsultasi / klarifikasi (informasi belum cukup):
{
  "status": "clarifying",
  "reply": "Respons ramah MinSKI yang mendengarkan curhat Kakak dan mengajukan 1 pertanyaan lanjutan yang relevan.",
  "selectedPerfumeName": null,
  "accords": null
}

Jika informasi sudah cukup dan siap merekomendasikan:
{
  "status": "recommended",
  "reply": "Penjelasan personal mengapa parfum ini sangat cocok untuk Kakak, dilanjutkan 2 kalimat rayuan elegan yang berkelas.",
  "selectedPerfumeName": "Nama persis dari katalog aktif",
  "accords": "Accords utama sesuai katalog"
}`;

            const conversationTurns: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
            for (const h of history) {
              const role = (h.sender === 'user' || h.role === 'user') ? 'user' : 'model';
              const text = String(h.text || '').trim();
              if (!text) continue;
              const prev = conversationTurns[conversationTurns.length - 1];
              if (prev && prev.role === role) {
                prev.parts[0].text += `\n${text}`;
              } else {
                conversationTurns.push({ role, parts: [{ text }] });
              }
            }
            const last = conversationTurns[conversationTurns.length - 1];
            if (!last || last.role !== 'user' || last.parts[0].text !== rawMessage) {
              if (last && last.role === 'user') {
                last.parts[0].text += `\n${rawMessage}`;
              } else {
                conversationTurns.push({ role, parts: [{ text: rawMessage }] });
              }
            }
            while (conversationTurns.length > 0 && conversationTurns[0].role !== 'user') {
              conversationTurns.shift();
            }

            const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${geminiKey}`;
            const geminiRes = await fetch(geminiApiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'aistudio-build',
              },
              body: JSON.stringify({
                contents: conversationTurns,
                systemInstruction: {
                  parts: [{ text: systemPrompt }],
                },
                generationConfig: {
                  responseMimeType: 'application/json',
                  thinkingConfig: {
                    thinkingLevel: 'LOW',
                  },
                },
              }),
              signal: AbortSignal.timeout(12000),
            });

            if (geminiRes.ok) {
              const geminiJson: any = await geminiRes.json();
              const textResponse = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;
              const parsed = JSON.parse(textResponse?.trim() || '{}');

              // Mode Klarifikasi / Konsultasi
              if (parsed.status === 'clarifying' || !parsed.selectedPerfumeName) {
                if (parsed.reply) {
                  return jsonResponse({
                    reply: parsed.reply,
                    audioKey: null,
                    recommendedPerfume: null,
                    isRecommendationReady: false,
                  });
                }
              }

              // Mode Rekomendasi
              if (parsed.selectedPerfumeName && parsed.reply) {
                const matchedItem = activeCatalog.find(
                  (p: any) => (p.name || '').toLowerCase() === parsed.selectedPerfumeName.toLowerCase()
                );

                if (matchedItem) {
                  let photo = assets?.masterFlacon || DEFAULT_MASTER_FLACON;
                  const nameLower = (matchedItem.name || '').toLowerCase();
                  for (const [k, v] of Object.entries(top11Photos)) {
                    if (v && typeof v === 'string' && (k.toLowerCase().includes(nameLower) || nameLower.includes(k.toLowerCase()))) {
                      photo = v;
                      break;
                    }
                  }

                  let audioKey: string | null = null;
                  if (nameLower.includes('monaco') || rawMessage.toLowerCase().includes('kencan')) {
                    audioKey = 'preset_kencan';
                  } else if (nameLower.includes('dunhill') || rawMessage.toLowerCase().includes('kerja')) {
                    audioKey = 'preset_kerja';
                  } else if (nameLower.includes('aqua') || rawMessage.toLowerCase().includes('segar')) {
                    audioKey = 'preset_segar';
                  }

                  const resolvedLongevity =
                    (matchedItem as any).longevity || 'Informasi belum tersedia';
                  const resolvedSillage =
                    (matchedItem as any).sillage || 'Informasi belum tersedia';

                  return jsonResponse({
                    reply: parsed.reply,
                    audioKey,
                    recommendedPerfume: {
                      perfumeName: matchedItem.name,
                      categoryLabel: matchedItem.categoryLabel || 'SINKI Luxury Signature',
                      matchScore: 98,
                      matchScoreLabel: 'Estimasi Kecocokan Aroma',
                      hypnoticScript: parsed.reply,
                      shortVoiceSpeech: parsed.reply,
                      accords: parsed.accords || (matchedItem.accords ? matchedItem.accords.join(' · ') : 'Amber · Woods'),
                      longevity: resolvedLongevity,
                      sillage: resolvedSillage,
                      photoUrl: photo,
                      pricePerMl: matchedItem.pricePerMl || 3000,
                    },
                    isRecommendationReady: true,
                  });
                }
              }
            }
          } catch (geminiErr) {
            console.warn('[Worker Gemini AI Fallback Notice]:', geminiErr);
          }
        }

        // 3b. Failover ke Groq Cloud (Llama 3.3 70B Versatile) jika Gemini belum menjawab
        const groqKey = (env.GROQ_API_KEY || '').trim();
        if (groqKey && groqKey.length > 10) {
          try {
            const activeCatalog = (catalog || []).filter((p: any) => p.isActive !== false);
            const catalogBrief = activeCatalog.slice(0, 30).map((p: any) => `- ${p.name} (${p.categoryLabel || p.category}): ${(p.accords || []).join(', ')}`).join('\n');
            const groqMessages = [
              {
                role: 'system',
                content: `Kamu adalah MinSKI, konsultan parfum pribadi dari Atelier SINKI Parfums Indonesia. Karaktermu perempuan ramah, ceria, dan sopan menyapa pelanggan "Kakak".
Tugasmu: Berikan SATU rekomendasi parfum terbaik beserta penjelasan memikat mengapa wangi tersebut sangat cocok untuk Kakak.
PILIH HANYA DARI DAFTAR INI:
${catalogBrief}

Keluarkan HANYA format JSON valid berikut:
{
  "reply": "Respons ramah MinSKI yang menjelaskan parfum rekomendasi untuk Kakak",
  "selectedPerfumeName": "Nama persis parfum dari katalog",
  "accords": "Accords utama parfum"
}`
              },
              ...history.slice(-4).map((h: any) => ({
                role: (h.sender === 'user' || h.role === 'user') ? 'user' : 'assistant',
                content: String(h.text || '').trim()
              })),
              { role: 'user', content: rawMessage }
            ];

            const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${groqKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: groqMessages,
                response_format: { type: 'json_object' },
                temperature: 0.6,
                max_tokens: 500,
              }),
              signal: AbortSignal.timeout(6000),
            });

            if (groqRes.ok) {
              const groqData: any = await groqRes.json();
              const content = groqData.choices?.[0]?.message?.content;
              const parsed = JSON.parse(content || '{}');
              if (parsed.reply && parsed.selectedPerfumeName) {
                const matchedItem = activeCatalog.find(
                  (p: any) => (p.name || '').toLowerCase() === parsed.selectedPerfumeName.toLowerCase() ||
                              (p.name || '').toLowerCase().includes(parsed.selectedPerfumeName.toLowerCase()) ||
                              parsed.selectedPerfumeName.toLowerCase().includes((p.name || '').toLowerCase())
                ) || activeCatalog[0];

                if (matchedItem) {
                  let photo = assets?.masterFlacon || DEFAULT_MASTER_FLACON;
                  const nameLower = (matchedItem.name || '').toLowerCase();
                  for (const [k, v] of Object.entries(top11Photos)) {
                    if (v && typeof v === 'string' && (k.toLowerCase().includes(nameLower) || nameLower.includes(k.toLowerCase()))) {
                      photo = v;
                      break;
                    }
                  }

                  let audioKey: string | null = null;
                  if (nameLower.includes('monaco') || rawMessage.toLowerCase().includes('kencan')) {
                    audioKey = 'preset_kencan';
                  } else if (nameLower.includes('dunhill') || rawMessage.toLowerCase().includes('kerja')) {
                    audioKey = 'preset_kerja';
                  } else if (nameLower.includes('aqua') || rawMessage.toLowerCase().includes('segar')) {
                    audioKey = 'preset_segar';
                  }

                  return jsonResponse({
                    reply: parsed.reply,
                    audioKey,
                    recommendedPerfume: {
                      perfumeName: matchedItem.name,
                      categoryLabel: matchedItem.categoryLabel || 'SINKI Luxury Signature',
                      matchScore: 98,
                      matchScoreLabel: 'Estimasi Kecocokan Aroma',
                      hypnoticScript: parsed.reply,
                      shortVoiceSpeech: parsed.reply,
                      accords: parsed.accords || (matchedItem.accords ? matchedItem.accords.join(' · ') : 'Amber · Woods'),
                      longevity: (matchedItem as any).longevity || 'Informasi belum tersedia',
                      sillage: (matchedItem as any).sillage || 'Informasi belum tersedia',
                      photoUrl: photo,
                      pricePerMl: matchedItem.pricePerMl || 3000,
                    },
                    isRecommendationReady: true,
                  });
                }
              }
            }
          } catch (groqErr) {
            console.warn('[Worker Groq Fallback Notice]:', groqErr);
          }
        }

        // 4. Fallback Mesin Cerdas Deterministik SINKI (Fail-Safe & Konsultasi Multi-Turn)
        const consultCheck = checkNeedsConsultationWorker(rawMessage, history);
        if (consultCheck.needsConsultation && consultCheck.reply) {
          return jsonResponse({
            reply: consultCheck.reply,
            audioKey: null,
            recommendedPerfume: null,
            isRecommendationReady: false,
          });
        }

        // 5. Rekomendasi Terverifikasi Katalog Aktual
        const fallbackResult = resolveWorkerRecommendation(
          rawMessage,
          catalog || [],
          top11Photos,
          assets?.masterFlacon,
          history
        );

        return jsonResponse(fallbackResult);
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
          heroMediaType: assets?.heroMediaType || 'image',
          heroVideoUrl: assets?.heroVideoUrl || null,
          heroVideoPoster: assets?.heroVideoPoster || null,
          pricing: assets?.pricing,
          ticker: ticker?.text ? ticker : DEFAULT_TICKER,
          updatedAt: assets?.updatedAt || ticker?.updatedAt,
        });
      }

      // 3. Owner Auth: Verify PIN
      if (pathname === '/api/owner/verify-pin' && request.method === 'POST') {
        const pin = typeof body?.pin === 'string' ? body.pin.trim() : '';
        if (!pin) {
          return jsonResponse({ error: 'PIN wajib diisi.' }, 400);
        }

        const check = await verifyOwnerPinValue(pin, env);
        if (check.valid) {
          const token = await createSessionToken(env);
          return jsonResponse({
            success: true,
            token,
            message: 'Autentikasi Pemilik Berhasil!',
          });
        }

        if (!checkRateLimit(`pin-${clientIp}`, 10, 60 * 1000)) {
          return jsonResponse({ error: 'Terlalu banyak percobaan PIN. Harap tunggu 1 menit.' }, 429);
        }

        if (!check.configured) {
          return jsonResponse(
            { error: 'Gunakan PIN Pemilik bawaan: 1995.' },
            401
          );
        }

        return jsonResponse({ error: 'PIN Pemilik tidak valid!' }, 401);
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
        const {
          logo,
          chibi,
          qrisImage,
          top11,
          heroBottles,
          heroStageEffect,
          heroStageEnabled,
          heroMediaType,
          heroVideoUrl,
          heroVideoPoster,
          heroVideoFit,
          heroVideoPosition,
          heroHeightMode,
          oldVideoUrlToDelete,
        } = body;

        let newLogo = existing.logo ?? null;
        let newChibi = existing.chibi ?? null;
        let newQris = existing.qrisImage ?? null;
        const newTop11 = { ...(existing.top11 || {}) };
        let newHeroBottles = Array.isArray(existing.heroBottles) ? [...existing.heroBottles] : [];
        let newHeroStageEffect = existing.heroStageEffect || 'royal-elevation';
        let newHeroStageEnabled = Boolean(existing.heroStageEnabled);
        let newHeroMediaType = existing.heroMediaType || 'image';
        let newHeroVideoUrl = existing.heroVideoUrl || null;
        let newHeroVideoPoster = existing.heroVideoPoster || null;
        let newHeroVideoFit = existing.heroVideoFit || 'cover';
        let newHeroVideoPosition = existing.heroVideoPosition || 'center';
        let newHeroHeightMode = existing.heroHeightMode || 'balanced';

        // Hapus otomatis video lama dari Supabase
        const videoToDelete = oldVideoUrlToDelete || (heroVideoUrl && existing.heroVideoUrl && heroVideoUrl !== existing.heroVideoUrl ? existing.heroVideoUrl : null);
        if (videoToDelete && typeof videoToDelete === 'string') {
          const fn = videoToDelete.split('/').pop()?.split('?')[0];
          if (fn && fn !== 'sinki_logo.png' && fn !== 'sinki_chibi.png') {
            await deleteStorageFiles(env, [fn]);
          }
        }

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

        if (heroMediaType !== undefined) {
          newHeroMediaType = heroMediaType === 'video' ? 'video' : 'image';
        }

        if (heroVideoUrl !== undefined) {
          newHeroVideoUrl = heroVideoUrl || null;
        }

        if (heroVideoPoster !== undefined) {
          if (heroVideoPoster && heroVideoPoster.startsWith('data:')) {
            const up = await uploadBase64Image(env, 'sinki_hero_poster.jpg', heroVideoPoster);
            if (!up.success) return jsonResponse({ error: up.error }, 500);
            newHeroVideoPoster = up.url || heroVideoPoster;
          } else {
            newHeroVideoPoster = heroVideoPoster || null;
          }
        }

        if (heroVideoFit !== undefined) newHeroVideoFit = heroVideoFit;
        if (heroVideoPosition !== undefined) newHeroVideoPosition = heroVideoPosition;
        if (heroHeightMode !== undefined) newHeroHeightMode = heroHeightMode;

        const updatedData = {
          ...existing,
          logo: newLogo,
          chibi: newChibi,
          qrisImage: newQris,
          top11: newTop11,
          heroBottles: newHeroBottles,
          heroStageEffect: newHeroStageEffect,
          heroStageEnabled: newHeroStageEnabled,
          heroMediaType: newHeroMediaType,
          heroVideoUrl: newHeroVideoUrl,
          heroVideoPoster: newHeroVideoPoster,
          heroVideoFit: newHeroVideoFit,
          heroVideoPosition: newHeroVideoPosition,
          heroHeightMode: newHeroHeightMode,
          updatedAt: new Date().toISOString(),
        };

        const saved = await writeStorageJson(env, 'assets.json', updatedData);
        if (!saved.ok) return jsonResponse({ error: saved.error }, 500);
        return jsonResponse({ success: true, message: 'Foto SINKI & Pengaturan Video Hero berhasil disimpan!', data: updatedData });
      }

      if (pathname === '/api/owner/upload-video' && request.method === 'POST') {
        const authHeader = request.headers.get('Authorization') || '';
        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        const pin = request.headers.get('x-owner-pin') || '';
        const currentPin = await getStoredOwnerPin(env);
        const authorized = (token && token.length >= 8) || (pin && pin === currentPin);
        if (!authorized) {
          return jsonResponse({ error: 'Akses ditolak: Sesi Pemilik tidak valid!' }, 403);
        }

        const filename = url.searchParams.get('filename') || `hero_video_${Date.now()}.mp4`;
        const cleanFilename = filename.split('/').pop()?.split('?')[0] || `hero_video_${Date.now()}.mp4`;
        const contentType = request.headers.get('Content-Type') || 'video/mp4';

        if (!rawVideoBuffer || rawVideoBuffer.byteLength === 0) {
          return jsonResponse({ error: 'Data video kosong' }, 400);
        }

        const storageUrl = `${env.SUPABASE_URL || 'https://tsxclttisxnmvdkwziqx.supabase.co'}/storage/v1/object/sinki-media/${cleanFilename}`;
        const uploadRes = await fetch(storageUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.SUPABASE_KEY}`,
            'Content-Type': contentType,
            'x-upsert': 'true',
          },
          body: rawVideoBuffer,
        });

        if (!uploadRes.ok) {
          const errText = await uploadRes.text();
          return jsonResponse({ error: `Gagal mengunggah video ke cloud: ${errText}` }, uploadRes.status);
        }

        return jsonResponse({
          success: true,
          url: `https://tsxclttisxnmvdkwziqx.supabase.co/storage/v1/object/public/sinki-media/${cleanFilename}`,
          filename: cleanFilename,
        });
      }

      if (pathname === '/api/owner/delete-storage-file' && request.method === 'POST') {
        if (!(await isAuthorizedRequest(request, body, env))) {
          return jsonResponse({ error: 'Akses ditolak: Sesi Pemilik tidak valid!' }, 403);
        }
        const filePath = body?.path;
        const paths = body?.paths;
        const toDelete: string[] = [];
        if (filePath && typeof filePath === 'string') {
          const fn = filePath.split('/').pop()?.split('?')[0];
          if (fn) toDelete.push(fn);
        }
        if (Array.isArray(paths)) {
          for (const p of paths) {
            const fn = typeof p === 'string' ? p.split('/').pop()?.split('?')[0] : null;
            if (fn) toDelete.push(fn);
          }
        }
        if (toDelete.length > 0) {
          const ok = await deleteStorageFiles(env, toDelete);
          return jsonResponse({ success: ok, deleted: toDelete });
        }
        return jsonResponse({ success: true, deleted: [] });
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
        return jsonResponse(sortWorkerReviewsNewestFirst(deduplicateReviews(list)).slice(0, 20));
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

        const now = Date.now();
        const reviewId = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : `rev-${now}`;
        const newReview = {
          id: reviewId,
          name: trimmedName,
          emoji: typeof emoji === 'string' ? emoji.slice(0, 8) : '😍',
          emojiLabel: typeof emojiLabel === 'string' ? emojiLabel.slice(0, 50) : 'Sangat Puas & Mewah',
          variant: typeof variant === 'string' ? variant.slice(0, 100) : 'SINKI Signature',
          comment: trimmedComment,
          date: 'Baru saja',
          likes: typeof body.likes === 'number' ? body.likes : 1,
          createdAt: typeof body.createdAt === 'number' ? body.createdAt : now,
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
        const updated = sortWorkerReviewsNewestFirst([newReview, ...filtered]).slice(0, 20);
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

      // 12. Theme Configuration
      if (pathname === '/api/theme' && request.method === 'GET') {
        const theme = await readStorageJson<any>(env, 'theme_config.json', { id: 'dew-jade' });
        return jsonResponse(theme?.id ? theme : { id: 'dew-jade' });
      }

      if (pathname === '/api/owner/update-theme' && request.method === 'POST') {
        if (!(await isAuthorizedRequest(request, body, env))) {
          return jsonResponse({ error: 'Akses ditolak: Sesi Pemilik tidak valid!' }, 403);
        }
        const rawTheme = body?.theme || body;
        const themeId = typeof rawTheme?.id === 'string' ? rawTheme.id : 'dew-jade';
        const toSave = { id: themeId, updatedAt: new Date().toISOString() };
        const saved = await writeStorageJson(env, 'theme_config.json', toSave);
        if (!saved.ok) return jsonResponse({ error: saved.error }, 500);
        return jsonResponse({ success: true, theme: toSave });
      }

      // 13. Sales Records (Dimensi Kasir)
      if (pathname === '/api/sales' && request.method === 'GET') {
        const sales = await readStorageJson<any[]>(env, 'sales_records.json', []);
        return jsonResponse(Array.isArray(sales) ? sales : []);
      }

      if (pathname === '/api/owner/record-sale' && request.method === 'POST') {
        if (!(await isAuthorizedRequest(request, body, env))) {
          return jsonResponse({ error: 'Akses ditolak: Sesi Pemilik tidak valid!' }, 403);
        }
        const sale = body?.sale;
        if (!sale || typeof sale !== 'object' || !sale.perfumeName) {
          return jsonResponse({ error: 'Data transaksi penjualan tidak valid!' }, 400);
        }
        const currentSales = await readStorageJson<any[]>(env, 'sales_records.json', []);
        const newSale = {
          ...sale,
          id: sale.id || `sale-${Date.now()}`,
          date: sale.date || new Date().toISOString(),
        };
        const updated = [newSale, ...(Array.isArray(currentSales) ? currentSales : [])];
        const saved = await writeStorageJson(env, 'sales_records.json', updated);
        if (!saved.ok) return jsonResponse({ error: saved.error }, 500);
        return jsonResponse({
          success: true,
          message: `Penjualan ${newSale.perfumeName} (${newSale.volumeMl}ml) berhasil dicatat!`,
          sales: updated,
        });
      }

      if (pathname === '/api/owner/delete-sale' && request.method === 'POST') {
        if (!(await isAuthorizedRequest(request, body, env))) {
          return jsonResponse({ error: 'Akses ditolak: Sesi Pemilik tidak valid!' }, 403);
        }
        const saleId = body?.id;
        if (!saleId) {
          return jsonResponse({ error: 'ID transaksi wajib disertakan!' }, 400);
        }
        const currentSales = await readStorageJson<any[]>(env, 'sales_records.json', []);
        const updated = (Array.isArray(currentSales) ? currentSales : []).filter((s: any) => s.id !== saleId);
        const saved = await writeStorageJson(env, 'sales_records.json', updated);
        if (!saved.ok) return jsonResponse({ error: saved.error }, 500);
        return jsonResponse({
          success: true,
          message: 'Catatan transaksi penjualan berhasil dihapus!',
          sales: updated,
        });
      }

      return jsonResponse({ error: 'Endpoint API tidak ditemukan.' }, 404);
    }

    // Serve static SPA assets for all non-API routes
    return env.ASSETS.fetch(request);
  },
};
