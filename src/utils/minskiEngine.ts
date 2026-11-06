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

export function isMinskiOpeningInquiry(text: string): boolean {
  const lower = text.toLowerCase().trim();
  const scentCues = [
    'segar', 'fresh', 'dingin', 'laut', 'pantai', 'citrus', 'lemon', 'bergamot', 'jeruk',
    'manis', 'vanila', 'vanilla', 'sweet', 'kopi', 'coffee', 'cokelat', 'gourmand', 'creamy',
    'hangat', 'amber', 'woody', 'kayu', 'oud', 'gaharu', 'rempah', 'spicy', 'cedar',
    'bunga', 'floral', 'rose', 'mawar', 'jasmine', 'melati', 'powdery', 'bedak', 'sabun', 'clean',
    'kencan', 'pacar', 'malam', 'dinner', 'romantis', 'intim',
    'kantor', 'kerja', 'ngantor', 'harian', 'kuliah', 'ruangan ac', 'meeting',
    'olahraga', 'gym', 'panas', 'siang', 'tahan lama', 'awet', 'proyeksi',
    'pria', 'cowok', 'wanita', 'cewek',
    'monaco', 'dunhill', 'bvlgari', 'sauvage', 'aventus', 'black opium', 'scandal', 'baccarat',
    'eros', 'aqua', 'dior', 'chanel', 'creed', 'ysl', 'zara', 'jo malone', 'tom ford', 'gucci',
    'bubble gum', 'nagita', 'bacarat', 'omnia', 'twilly', 'si armani', 'bombshell'
  ];

  if (scentCues.some((w) => lower.includes(w))) return false;

  const inquiryWords = [
    'halo', 'hai', 'hei', 'pagi', 'siang', 'sore', 'malam', 'assalam',
    'nanya', 'tanya', 'bantu', 'bingung', 'pilihan', 'apa ya', 'rekomendasi', 'rekomendasiin',
    'ada apa', 'cari parfum', 'mau cari', 'mau parfum', 'konsul', 'ngobrol',
    'kamu siapa', 'bisa apa', 'tes', 'test', 'minski'
  ];

  return lower.length <= 25 || inquiryWords.some((w) => lower.includes(w));
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
  hypnoticScript: string;
  shortVoiceSpeech: string;
  accords: string;
  longevity: string;
  sillage: string;
  photoUrl: string;
  pricePerMl: number;
}

export function resolveMinskiRecommendation(
  userInput: string,
  catalog: PerfumeItem[],
  photos: Record<string, string>,
  customMasterFlacon?: string | null
): MinskiRecommendationResult {
  const text = userInput.toLowerCase();
  const activeCatalog = catalog.filter((p) => p.isActive !== false);
  const pool = activeCatalog.length > 0 ? activeCatalog : catalog;

  // 1. Prioritaskan nama lengkap varian persis terlebih dahulu
  let directMatch = pool.find((p) => {
    const nameLower = p.name.toLowerCase();
    return text.includes(nameLower);
  });

  // 1b. Jika belum cocok, cari kecocokan kata spesifik unik (panjang >= 5 huruf)
  if (!directMatch) {
    directMatch = pool.find((p) => {
      const nameLower = p.name.toLowerCase();
      const parts = nameLower.split(' ').filter((part) => part.length >= 5 && !['parfum', 'eau', 'pour', 'homme', 'femme'].includes(part));
      return parts.some((part) => text.includes(part));
    });
  }

  // 2. Kamus Sensorik Pencocokan Suara
  const keywordWeights: Record<string, string[]> = {
    citrus_fresh: ['segar', 'fresh', 'dingin', 'citrus', 'lemon', 'bergamot', 'jeruk', 'laut', 'pantai', 'aquatic', 'olahraga', 'gym', 'panas', 'siang'],
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
      Object.entries(keywordWeights).forEach(([group, words]) => {
        const userMatched = words.some((w) => text.includes(w));
        if (userMatched) {
          const itemMatched = words.filter((w) => haystack.includes(w)).length;
          score += itemMatched * 15;
        }
      });

      // Preferensi Gender
      if (text.includes('pria') || text.includes('cowok') || text.includes('cowo')) {
        if (item.category === 'men') score += 35;
        if (item.category === 'women') score -= 30;
      } else if (text.includes('wanita') || text.includes('cewek') || text.includes('cewe')) {
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

  // 5. PENYUSUNAN TAGLINE HIPNOTIS MERAYU (2 KALIMAT EMAS, PADAT, MERAYU & SINKRON 100%)
  let seductiveScript = '';

  if (
    text.includes('kencan') ||
    text.includes('pacar') ||
    text.includes('malam') ||
    text.includes('manis') ||
    text.includes('vanila') ||
    text.includes('monaco')
  ) {
    seductiveScript = `Begitu semprotan ${bestPerfume.name} menyentuh kulitmu, kehangatan manis mewahnya menciptakan jejak aroma intim yang bikin si dia betah berdekatan. Inilah racikan rahasiamu untuk membuat setiap tatapan tertuju padamu.`;
  } else if (
    text.includes('kantor') ||
    text.includes('kerja') ||
    text.includes('rapi') ||
    text.includes('wibawa') ||
    text.includes('dunhill')
  ) {
    seductiveScript = `Semprotan berkelas ${bestPerfume.name} seketika memancarkan aura orang sukses yang rapi, percaya diri, dan disegani. Seharian di ruangan ber-AC, aromanya membuat semua orang menaruh hormat pada kehadiranmu.`;
  } else if (
    text.includes('segar') ||
    text.includes('dingin') ||
    text.includes('laut') ||
    text.includes('bvlgari') ||
    text.includes('fresh')
  ) {
    seductiveScript = `Sensasi sejuk murni ${bestPerfume.name} membungkus tubuhmu dengan kesegaran mewah yang bikin pikiran tenang dan bergairah seharian. Siapa pun yang berpapasan pasti menoleh mencari sumber wangimu.`;
  } else {
    seductiveScript = `Sentuhan elegan ${bestPerfume.name} menyatu sempurna dengan auramu, memancarkan karakter orang berkelas yang sulit dilupakan. Sekali terhirup, aromanya meninggalkan rindu mendalam bagi siapa pun di dekatmu.`;
  }

  return {
    perfumeName: bestPerfume.name,
    categoryLabel,
    matchScore: 98,
    hypnoticScript: seductiveScript, // Ditampilkan di kartu hasil
    shortVoiceSpeech: seductiveScript, // Dibaca PERSIS 100% sama oleh MinSKI!
    accords: accordsText,
    longevity: '12+ Jam',
    sillage: 'Proyeksi 2 Meter',
    photoUrl: photo,
    pricePerMl: bestPerfume.pricePerMl || 3000,
  };
}

// FUNGSI PENCARIAN SUARA PALING LEMBUT & NATURAL (MENGHINDARI SUARA KAKU / ROBOTIK)
export function getBestMinskiVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. Suara Bahasa Indonesia dengan prioritas suara lembut / natural
  const idVoices = voices.filter(
    (v) =>
      v.lang.toLowerCase().startsWith('id') ||
      v.lang.toLowerCase().includes('indonesia') ||
      v.name.toLowerCase().includes('indonesia')
  );

  if (idVoices.length > 0) {
    // Prioritas 1: Google Bahasa Indonesia (sangat lembut, bersahabat & natural)
    const googleId = idVoices.find((v) => v.name.toLowerCase().includes('google'));
    if (googleId) return googleId;

    // Prioritas 2: Microsoft Natural / Online / Gadis (halus dan ekspresif)
    const naturalId = idVoices.find(
      (v) =>
        v.name.toLowerCase().includes('natural') ||
        v.name.toLowerCase().includes('online') ||
        v.name.toLowerCase().includes('gadis') ||
        v.name.toLowerCase().includes('female')
    );
    if (naturalId) return naturalId;

    // Prioritas 3: Suara Indonesia pertama
    return idVoices[0];
  }

  // 2. Fallback jika sistem belum mengunduh suara ID: cari suara lembut lainnya
  const softVoice = voices.find(
    (v) =>
      v.name.toLowerCase().includes('natural') ||
      v.name.toLowerCase().includes('google') ||
      v.name.toLowerCase().includes('samantha')
  );
  return softVoice || voices[0] || null;
}

// MAP FILE AUDIO SUARA MANUSIA ASLI (ZERO LATENCY, SANGAT LEMBUT & ALAMI)
export const MINSKI_STATIC_AUDIO_MAP: Record<string, string> = {
  intro: '/assets/audio/minski_intro.mp3',
  kencan: '/assets/audio/minski_preset_kencan.mp3',
  kerja: '/assets/audio/minski_preset_kerja.mp3',
  segar: '/assets/audio/minski_preset_segar.mp3',
  profanity: '/assets/audio/minski_profanity.mp3',
  offtopic: '/assets/audio/minski_offtopic.mp3',
};

// Global reference untuk audio yang sedang berputar
let activeMinskiAudio: HTMLAudioElement | null = null;

export function stopMinskiVoice() {
  if (activeMinskiAudio) {
    try {
      activeMinskiAudio.pause();
      activeMinskiAudio.currentTime = 0;
    } catch {}
    activeMinskiAudio = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

// SUARA AUDIO MINSKI SEPERTI SUARA MANUSIA ASLI (LEMBUT, INTERAKTIF & TIDAK ROBOTIK)
export function speakMinskiVoice(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  preferredAudioKey?: string
): () => void {
  if (typeof window === 'undefined') return () => {};

  // Hentikan audio sebelumnya agar tidak tumpang tindih
  stopMinskiVoice();

  // 1. Cek apakah ada file MP3 suara manusia asli (kualitas studio, natural 100%)
  let audioSrc: string | null = null;
  if (preferredAudioKey && MINSKI_STATIC_AUDIO_MAP[preferredAudioKey]) {
    audioSrc = MINSKI_STATIC_AUDIO_MAP[preferredAudioKey];
  } else {
    const lower = text.toLowerCase();
    if (lower.includes('kenalin, aku minski') || lower.includes('wangi impianmu yuk')) {
      audioSrc = MINSKI_STATIC_AUDIO_MAP.intro;
    } else if (lower.includes('mykonos monaco royale') || (lower.includes('kencan') && lower.includes('nempel'))) {
      audioSrc = MINSKI_STATIC_AUDIO_MAP.kencan;
    } else if (lower.includes('dunhill blue') || (lower.includes('kerja') && lower.includes('wibawa'))) {
      audioSrc = MINSKI_STATIC_AUDIO_MAP.kerja;
    } else if (lower.includes('bvlgari aqua') || lower.includes('segar banget') || lower.includes('sejuk murni')) {
      audioSrc = MINSKI_STATIC_AUDIO_MAP.segar;
    } else if (lower.includes('jangan galak-galak') || lower.includes('santun')) {
      audioSrc = MINSKI_STATIC_AUDIO_MAP.profanity;
    } else if (lower.includes('botol parfum kak, bukan guru les')) {
      audioSrc = MINSKI_STATIC_AUDIO_MAP.offtopic;
    }
  }

  // Jika tidak cocok dengan statis, gunakan endpoint audio MP3 manusia dari proxy server
  if (!audioSrc && text.trim().length > 0) {
    audioSrc = `/api/minski/tts?text=${encodeURIComponent(text.trim())}`;
  }

  // Fallback ke browser SpeechSynthesis jika HTML5 Audio tidak dapat diputar
  const fallbackSpeechSynthesis = () => {
    if (!window.speechSynthesis) {
      if (onEnd) onEnd();
      return;
    }
    const softenedText = text
      .replace(/!+/g, ', ')
      .replace(/\.\.\.+/g, ', ')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(softenedText);
    utterance.lang = 'id-ID';
    utterance.pitch = 1.12;
    utterance.rate = 0.92;

    const bestVoice = getBestMinskiVoice();
    if (bestVoice) utterance.voice = bestVoice;

    if (onStart) utterance.onstart = onStart;
    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  };

  if (audioSrc) {
    const audio = new Audio(audioSrc);
    activeMinskiAudio = audio;

    audio.onplay = () => {
      if (onStart) onStart();
    };

    audio.onended = () => {
      activeMinskiAudio = null;
      if (onEnd) onEnd();
    };

    audio.onerror = () => {
      activeMinskiAudio = null;
      fallbackSpeechSynthesis();
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('HTML5 Audio playback interrupted or blocked, fallback to SpeechSynthesis:', err);
        fallbackSpeechSynthesis();
      });
    }
  } else {
    fallbackSpeechSynthesis();
  }

  return () => {
    stopMinskiVoice();
    if (onEnd) onEnd();
  };
}
