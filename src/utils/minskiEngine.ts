import { PerfumeItem, COLLECTION_CATEGORIES } from '../data/perfumes';
import { TOP_11_DATA } from '../data/top11';

// DAFTAR KATA KASAR / UJARAN TIDAK PANTAS
export const MINSKI_PROFANITY_WORDS = [
  'anjing', 'babi', 'bangsat', 'goblok', 'kontol', 'memek', 'bajingan',
  'tai', 'taik', 'penipu', 'asu', 'kampret', 'pantek', 'tolol', 'itil',
  'jancuk', 'pepek', 'bego', 'idiot', 'perek', 'lonte', 'puki', 'ngentot',
  'fuck', 'bitch', 'asshole', 'bastard', 'shit',
];

export function checkMinskiProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  return MINSKI_PROFANITY_WORDS.some((word) => {
    const regex = new RegExp(`(^|\\s|[.,!?;])${word}($|\\s|[.,!?;])`, 'i');
    return regex.test(lower);
  });
}

// DETEKSI PERTANYAAN DI LUAR KONTEKS PARFUM
const OFF_TOPIC_KEYWORDS = [
  'presiden', 'gubernur', 'politik', 'partai', 'pemilu', 'menteri',
  'coding', 'javascript', 'python', 'html', 'program', 'ngoding',
  'matematika', 'fisika', 'kimia', 'rumus', 'hitung', '5+5',
  'resep', 'masak', 'nasi goreng', 'bikin kue', 'makanan', 'restoran',
  'cuaca', 'hujan', 'gempa', 'berita', 'gempa', 'saham', 'crypto',
  'pacar kamu', 'kamu siapa', 'kamu robot', 'apakah kamu ai',
];

const PERFUME_CONTEXT_WORDS = [
  'parfum', 'parfumnya', 'wangi', 'aroma', 'bau', 'segar', 'fresh', 'manis', 'sweet',
  'hangat', 'amber', 'woody', 'kayu', 'oud', 'vanilla', 'vanila', 'citrus', 'jeruk',
  'kencan', 'kantor', 'kerja', 'ngantor', 'semprot', 'botol', 'tahan lama', 'awet',
  'pria', 'cowok', 'wanita', 'cewek', 'unisex', 'rekomendasi', 'bestseller',
];

export function checkMinskiOffTopic(text: string): boolean {
  const lower = text.toLowerCase();
  const hasPerfumeWord = PERFUME_CONTEXT_WORDS.some((w) => lower.includes(w));
  if (hasPerfumeWord) return false;

  const hasOffTopicWord = OFF_TOPIC_KEYWORDS.some((w) => lower.includes(w));
  return hasOffTopicWord;
}

// RESPONS DIPLOMATIS JIKA BERKATA KASAR
export const MINSKI_PROFANITY_RESPONSES = [
  'Waduh, jangan galak-galak dong Kak... MinSKI kan pengen bantu Kakak biar makin wangi dan disayang semua orang. Yuk, ceritain wangi apa yang lagi Kakak cari hari ini dengan santun ya!',
  'Eits, MinSKI kaget dengernya nih Kak... Di Atelier SINKI kita bicaranya yang wangi-wangi dan berkelas aja yuk! Ceritain aroma impian yang pengen bikin Kakak makin percaya diri ya.',
  'Aduh jangan emosi dulu dong Kakak sayang... Sini MinSKI bisikin racikan parfum yang bisa bikin hati Kakak tenang dan adem seharian. Mau aroma yang segar atau manis nih?',
];

// RESPONS DIPLOMATIS JIKA DI LUAR KONTEKS
export const MINSKI_OFF_TOPIC_RESPONSES = [
  'Hehe, aku kan botol parfum Kak, bukan guru les! Tapi kalau soal bikin Kakak wangi seharian dan auranya makin berkarisma, serahin ke MinSKI deh! Kakak lebih suka aroma yang dingin segar atau manis mewah nih?',
  'Wah pertanyaan unik tuh Kak! Tapi keahlian MinSKI yang paling sakti itu meracik wewangian berkelas yang bikin orang lain betah di dekat Kakak. Mau parfum buat ngantor, nongkrong santai, atau kencan malam nih Kak?',
];

// RESPONS RAMAH SAAT PENGGUNA BARU MEMULAI BERTANYA (MULTI-TURN CONVERSATION)
export const MINSKI_INQUIRY_RESPONSES = [
  'Hai Kak! MinSKI seneng banget bisa ngobrol sama Kakak. Biar racikan aromanya bener-bener pas di hati, Kakak lagi cari wangi yang kesannya seperti apa nih? Misalnya yang segar dingin bikin semangat, manis vanila yang bikin kangen, atau yang hangat mewah berkarisma?',
  'Boleh banget dong Kak! MinSKI siap dengerin curhat aroma impian Kakak. Kakak rencananya pakai parfum ini untuk momen apa nih—buat ngantor seharian, santai nongkrong, atau kencan spesial bareng si dia?',
  'Tenang Kak, serahkan urusan wangi ke MinSKI! Biar pas sama karakter Kakak, Kakak lebih suka tipe wangi yang bikin orang langsung segar pas berpapasan, atau wangi manis lembut yang bikin orang betah nempel lama-lama?'
];

export function evaluateMinskiConsultation(
  text: string,
  history: Array<{ sender: string; text: string }> = []
): { isConsultation: boolean; response?: string } {
  // Jika pengguna sudah pernah berinteraksi sebelumnya (menjawab pertanyaan MinSKI), lanjutkan ke rekomendasi
  const userTurns = history.filter((h) => h.sender === 'user').length;
  if (userTurns >= 2) {
    return { isConsultation: false };
  }

  const lower = text.toLowerCase().trim();

  // Jika menyebutkan nama varian spesifik secara langsung, jangan tunda rekomendasi
  const specificVariants = [
    'monaco', 'dunhill', 'bvlgari', 'black opium', 'sauvage', 'aventus', 'scandal', 'baccarat',
    'eros', 'aqua', 'dior', 'chanel', 'creed', 'ysl', 'zara', 'jo malone', 'tom ford', 'gucci',
    'bubble gum', 'nagita', 'omnia', 'twilly', 'si armani', 'bombshell', 'vanilla clouds'
  ];
  if (specificVariants.some((v) => lower.includes(v))) {
    return { isConsultation: false };
  }

  // 1. Belum tahu suka aroma apa / butuh panduan awal
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
      isConsultation: true,
      response:
        'Tenang aja Kak, MinSKI siap nemenin cari wangi impian Kakak sampai ketemu! Biar pas di hati, Kakak biasanya lebih nyaman sama wangi seperti apa nih—yang segar dingin bikin melek, manis lembut vanila, atau aroma bunga yang anggun?',
    };
  }

  // 2. Buat kerja tapi tidak menyengat
  if (
    lower.includes('kerja') &&
    (lower.includes('nggak suka') || lower.includes('tidak suka') || lower.includes('menyengat') || lower.includes('pusing') || lower.includes('tajam') || lower.includes('strong'))
  ) {
    return {
      isConsultation: true,
      response:
        'Pilihan bijak banget Kak! Buat ngantor seharian di ruangan ber-AC, aroma yang ramah dan nggak bikin pusing memang paling bikin nyaman dan fokus. Biar makin pas, Kakak lebih condong ke wangi segar bersih seperti habis mandi, atau wangi elegan yang powdery menenangkan?',
    };
  }

  // 3. Suka aroma manis tapi jangan berlebihan
  if (
    lower.includes('manis') &&
    (lower.includes('jangan') || lower.includes('nggak') || lower.includes('tidak') || lower.includes('berlebihan') || lower.includes('terlalu') || lower.includes('enek') || lower.includes('eneg'))
  ) {
    return {
      isConsultation: true,
      response:
        'Setuju banget Kak! Aroma manis yang seimbang itu bikin nagih tanpa bikin enek. Biar pas momennya, Kakak lebih suka manis lembut vanila yang hangat, atau manis buah segar yang ceria?',
    };
  }

  // 4. Buat kencan malam
  if (
    (lower.includes('kencan') || lower.includes('date') || lower.includes('pacar')) &&
    !lower.includes('vanila') && !lower.includes('segar') && !lower.includes('amber')
  ) {
    return {
      isConsultation: true,
      response:
        'Wah, seru banget nih buat kencan malam! Biar si dia makin betah berdekatan, Kakak lebih suka aroma manis hangat yang intim menggoda seperti vanila, atau wangi segar maskulin/anggun yang memikat?',
    };
  }

  // 5. Buat dipakai setiap hari / harian
  if (
    (lower.includes('setiap hari') || lower.includes('sehari-hari') || lower.includes('harian') || lower.includes('daily')) &&
    !lower.includes('citrus') && !lower.includes('aquatic') && !lower.includes('sabun')
  ) {
    return {
      isConsultation: true,
      response:
        'Ada banget dong Kak! Untuk pemakaian sehari-hari, kuncinya wangi yang fleksibel dan bikin segar terus. Kakak lebih condong ke wangi citrus/aquatic yang dingin berenergi, atau wangi bersih seperti sabun dan bedak mewah?',
    };
  }

  // Sapaan / pertanyaan umum pembuka
  const inquiryWords = [
    'halo', 'hai', 'hei', 'pagi', 'siang', 'sore', 'malam', 'assalam',
    'nanya', 'tanya', 'bantu', 'bingung', 'pilihan', 'apa ya', 'rekomendasi', 'rekomendasiin',
    'ada apa', 'cari parfum', 'mau cari', 'mau parfum', 'konsul', 'ngobrol'
  ];
  if (lower.length <= 25 || inquiryWords.some((w) => lower.includes(w))) {
    return {
      isConsultation: true,
      response: MINSKI_INQUIRY_RESPONSES[Math.floor(Math.random() * MINSKI_INQUIRY_RESPONSES.length)],
    };
  }

  return { isConsultation: false };
}

export function isMinskiOpeningInquiry(text: string): boolean {
  return evaluateMinskiConsultation(text).isConsultation;
}

// NASKAH PERKENALAN DIRI RESMI MINSKI (LEMBUT, RAMAH & TIDAK PANJANG)
export const MINSKI_INTRO_SPEECH =
  'Hai Kak! Kenalin, aku MinSKI. Mau aroma segar atau manis mewah yang bikin si dia nempel terus? Ceritain wangi impianmu yuk!';

// 3 TOPIK CEPAT TANPA PERLU IZIN MIC (MENGANALISA VARIAN ASLI KATALOG SINKI)
export const MINSKI_PRESET_QUERIES = [
  {
    id: 'kencan',
    label: 'Kencan & Bikin Nempel',
    icon: '🌙',
    query: 'Cariin parfum kencan malam yang manis mewah bikin dia nempel terus Mykonos Monaco Royale',
  },
  {
    id: 'kerja',
    label: 'Kerja & Kantor Berwibawa',
    icon: '💼',
    query: 'Cariin parfum kerja di ruangan AC yang segar elegan dan tahan seharian Dunhill Blue',
  },
  {
    id: 'segar',
    label: 'Segar Dingin Seharian',
    icon: '🌊',
    query: 'Cariin parfum segar dingin aroma laut dan citrus yang bikin fresh Bvlgari Aqua',
  },
];

export interface MinskiRecommendationResult {
  perfumeName: string;
  categoryLabel: string;
  matchScore: number;
  matchScoreLabel: string;
  hypnoticScript: string;
  shortVoiceSpeech: string;
  accords: string;
  longevity: string;
  sillage: string;
  photoUrl: string;
  pricePerMl?: number;
}

export function resolveMinskiRecommendation(
  userInput: string,
  catalog: PerfumeItem[],
  photos: Record<string, string>,
  customMasterFlacon?: string | null,
  history: Array<{ sender?: string; role?: string; text?: string }> = []
): MinskiRecommendationResult {
  const historyUserTexts = history
    .filter((h) => h.sender === 'user' || h.role === 'user')
    .map((h) => h.text || '')
    .join(' ');
  const fullContext = `${historyUserTexts} ${userInput}`.toLowerCase();
  const activeCatalog = catalog.filter((p) => p.isActive !== false);
  const pool = activeCatalog.length > 0 ? activeCatalog : catalog;

  // 1. Prioritaskan nama lengkap varian persis terlebih dahulu
  let directMatch = pool.find((p) => {
    const nameLower = p.name.toLowerCase();
    return fullContext.includes(nameLower);
  });

  // 1b. Jika belum cocok, cari kecocokan kata spesifik unik (panjang >= 5 huruf)
  if (!directMatch) {
    directMatch = pool.find((p) => {
      const nameLower = p.name.toLowerCase();
      const parts = nameLower.split(' ').filter((part) => part.length >= 5 && !['parfum', 'eau', 'pour', 'homme', 'femme'].includes(part));
      return parts.some((part) => fullContext.includes(part));
    });
  }

  // 2. Kamus Sensorik Pencocokan Suara
  const keywordWeights: Record<string, string[]> = {
    citrus_fresh: ['segar', 'fresh', 'dingin', 'citrus', 'lemon', 'bergamot', 'jeruk', 'laut', 'pantai', 'aquatic', 'olahraga', 'gym', 'panas', 'siang', 'mandi'],
    vanilla_sweet: ['manis', 'vanila', 'vanilla', 'sweet', 'kopi', 'coffee', 'gourmand', 'cokelat', 'creamy', 'enak', 'kue', 'caramel', 'malam', 'kencan'],
    woody_amber: ['hangat', 'kayu', 'woody', 'amber', 'oud', 'gaharu', 'rempah', 'spicy', 'cedar', 'karisma', 'wibawa', 'mewah', 'bos', 'pemimpin', 'rapi'],
    floral_powdery: ['bunga', 'floral', 'rose', 'mawar', 'jasmine', 'melati', 'lembut', 'bedak', 'powdery', 'bersih', 'sabun', 'clean', 'anggun', 'feminin'],
    men: ['pria', 'cowok', 'cowo', 'laki', 'gentleman', 'maskulin', 'mas-mas', 'suami', 'pacar cowok'],
    women: ['wanita', 'cewek', 'cewe', 'perempuan', 'feminin', 'anggun', 'istri', 'pacar cewek', 'cantik'],
    daily: ['kantor', 'kerja', 'ngantor', 'harian', 'kuliah', 'sekolah', 'ac', 'ruangan', 'meeting'],
    night: ['kencan', 'date', 'malam', 'dinner', 'pesta', 'intim', 'romantis', 'spesial'],
  };

  let bestPerfume = directMatch || pool[0];
  let maxScore = -9999;

  if (!directMatch) {
    pool.forEach((item) => {
      let score = 50;
      const haystack = [
        item.name,
        item.tagline || '',
        item.usageRecommendation || '',
        (item.accords || []).join(' '),
        item.categoryLabel || '',
        (item.collectionCategories || []).join(' '),
      ].join(' ').toLowerCase();

      // Skor kesesuaian kata kunci
      Object.entries(keywordWeights).forEach(([, words]) => {
        if (words.some((w) => fullContext.includes(w))) {
          const matchedCount = words.filter((w) => haystack.includes(w)).length;
          score += matchedCount * 15;
        }
      });

      // Filter preferensi negatif: jika tidak suka menyengat / pusing / tajam
      if (fullContext.includes('menyengat') || fullContext.includes('pusing') || fullContext.includes('tajam')) {
        if (haystack.includes('spicy') || haystack.includes('oud') || haystack.includes('heavy')) score -= 35;
        if (haystack.includes('aquatic') || haystack.includes('fresh') || haystack.includes('clean')) score += 30;
      }
      // Jika suka manis tapi tidak berlebihan / tidak enek
      if (fullContext.includes('manis') && (fullContext.includes('berlebihan') || fullContext.includes('enek') || fullContext.includes('eneg'))) {
        if (haystack.includes('caramel') || haystack.includes('creamy')) score -= 15;
        if (haystack.includes('vanilla') || haystack.includes('vanila')) score += 25;
      }

      // Preferensi Gender
      if (fullContext.includes('pria') || fullContext.includes('cowok') || fullContext.includes('cowo')) {
        if (item.category === 'men') score += 35;
        if (item.category === 'women') score -= 30;
      } else if (fullContext.includes('wanita') || fullContext.includes('cewek') || fullContext.includes('cewe')) {
        if (item.category === 'women') score += 35;
        if (item.category === 'men') score -= 30;
      }

      if (score > maxScore) {
        maxScore = score;
        bestPerfume = item;
      }
    });
  }

  // 3. Menghubungkan ke Foto Botol Transparan
  const top11Match = TOP_11_DATA.find(
    (t) =>
      t.name.toLowerCase().includes(bestPerfume.name.toLowerCase()) ||
      bestPerfume.name.toLowerCase().includes(t.name.toLowerCase())
  );
  const variantPhoto = top11Match ? (photos[top11Match.id] || photos[String(top11Match.rank)]) : null;
  const isVariantTransparent = Boolean(
    variantPhoto && (
      variantPhoto.includes('.png') ||
      variantPhoto.startsWith('data:image/png') ||
      variantPhoto.includes('.webp') ||
      variantPhoto.includes('transparent')
    )
  );
  const defaultMaster = '/assets/sinki-master-flacon-transparent.png';
  const photo = (isVariantTransparent ? variantPhoto : null) || customMasterFlacon || defaultMaster;

  // 4. Kategori Koleksi SINKI
  let categoryLabel = 'SINKI Luxury Signature';
  if (Array.isArray(bestPerfume.collectionCategories) && bestPerfume.collectionCategories.length > 0) {
    const matchedCategory = COLLECTION_CATEGORIES.find(
      (c) => c.id === bestPerfume.collectionCategories![0]
    );
    if (matchedCategory) {
      categoryLabel = `Koleksi ${matchedCategory.title}`;
    }
  }

  const accordsText =
    Array.isArray(bestPerfume.accords) && bestPerfume.accords.length > 0
      ? bestPerfume.accords.join(' · ')
      : 'Amber · Woods · Fresh Clean';

  // 5. PENYUSUNAN TAGLINE HIPNOTIS MERAYU & PENJELASAN PERSONAL
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

  const resolvedLongevity =
    bestPerfume.longevity || top11Match?.longevity || 'Informasi belum tersedia';
  const resolvedSillage =
    bestPerfume.sillage || top11Match?.sillage || 'Informasi belum tersedia';

  const cats = bestPerfume.collectionCategories || [];
  const resolvedPricePerMl = cats.includes('new_trending')
    ? 4000
    : cats.includes('viral_hits')
    ? 3000
    : undefined;

  return {
    perfumeName: bestPerfume.name,
    categoryLabel,
    matchScore: 98,
    matchScoreLabel: 'Estimasi Kecocokan Aroma',
    hypnoticScript: seductiveScript, // Ditampilkan di kartu hasil
    shortVoiceSpeech: seductiveScript, // Dibaca PERSIS 100% sama oleh MinSKI!
    accords: accordsText,
    longevity: resolvedLongevity,
    sillage: resolvedSillage,
    photoUrl: photo,
    pricePerMl: resolvedPricePerMl,
  };
}

// Global reference untuk audio MinSKI yang sedang berputar
let activeMinskiAudio: HTMLAudioElement | null = null;
export function stopMinskiVoice() {
  if (activeMinskiAudio) {
    try {
      activeMinskiAudio.pause();
      activeMinskiAudio.currentTime = 0;
      activeMinskiAudio.src = '';
    } catch {}
    activeMinskiAudio = null;
  }
}

// SUARA RESMI MINSKI:
// Google Kore TTS (High-Fidelity Neural Audio 24kHz)
export function speakMinskiVoice(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (errorMessage: string) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  // Hentikan audio sebelumnya
  stopMinskiVoice();

  const trimmedText = text.trim();
  if (!trimmedText) {
    if (onEnd) onEnd();
    return () => {};
  }

  // Putar suara resmi Google Kore via endpoint server
  const audioSrc = `/api/minski/tts?text=${encodeURIComponent(trimmedText)}`;
  const audio = new Audio(audioSrc);
  activeMinskiAudio = audio;

  let hasEnded = false;
  const safeEnd = () => {
    if (!hasEnded) {
      hasEnded = true;
      if (onEnd) onEnd();
    }
  };

  audio.onplay = () => {
    if (onStart) onStart();
  };

  audio.onended = () => {
    activeMinskiAudio = null;
    safeEnd();
  };

  audio.onerror = (err) => {
    console.warn('[Google Kore TTS Notice]: Suara Kore sedang standby', err);
    activeMinskiAudio = null;
    safeEnd();
    if (onError) onError('Pita suara Kore sedang standby');
  };

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch((err) => {
      console.warn('[Google Kore Playback Notice]:', err);
      activeMinskiAudio = null;
      safeEnd();
      if (onError) onError('Gagal memutar audio Kore');
    });
  }

  return () => {
    stopMinskiVoice();
    safeEnd();
  };
}
