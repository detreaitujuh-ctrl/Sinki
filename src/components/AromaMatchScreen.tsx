import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag,
  ChevronRight,
  ArrowLeft,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  MessageCircle,
  RotateCcw,
} from 'lucide-react';
import { PerfumeItem, COLLECTION_CATEGORIES } from '../data/perfumes';
import { TOP_11_DATA } from '../data/top11';
import { getStoredPerfumes } from '../utils/perfumeStorage';
import masterBottleTransparent from '../assets/images/sinki_master_bottle_transparent.png';
import {
  checkMinskiProfanity,
  checkMinskiOffTopic,
  MINSKI_PROFANITY_RESPONSES,
  MINSKI_OFF_TOPIC_RESPONSES,
  MINSKI_INTRO_SPEECH,
  MINSKI_PRESET_QUERIES,
  resolveMinskiRecommendation,
  speakMinskiVoice,
  stopMinskiVoice,
  MinskiRecommendationResult,
  isMinskiOpeningInquiry,
  evaluateMinskiConsultation,
  MINSKI_INQUIRY_RESPONSES,
} from '../utils/minskiEngine';

interface AromaMatchScreenProps {
  onBackToHome: () => void;
  onNavigateToOrder: (perfume: { name: string; category?: string; pricePerMl?: number }) => void;
  onShowToast: (msg: string) => void;
  perfumes?: PerfumeItem[];
  top11Photos?: Record<string, string>;
  masterFlaconPhoto?: string | null;
}

// 3 Pilihan Bersih & Lapang untuk Persona (Kuis Manual Langkah 1)
const PERSONA_OPTIONS = [
  {
    id: 'pria',
    title: 'Pria (Gentleman)',
    subtitle: 'Karakter maskulin, berkarisma, dan tegas',
    icon: '👔',
    badge: 'Maskulin & Berwibawa',
  },
  {
    id: 'wanita',
    title: 'Wanita (Feminine)',
    subtitle: 'Karakter anggun, mempesona, dan manis',
    icon: '👗',
    badge: 'Anggun & Memikat',
  },
  {
    id: 'unisex',
    title: 'Netral (Unisex)',
    subtitle: 'Karakter segar, bersih, dan fleksibel',
    icon: '🧥',
    badge: 'Universal & Bersih',
  },
];

// 3 Pilihan Bersih & Lapang untuk Suasana Penggunaan (Kuis Manual Langkah 2)
const OCCASION_OPTIONS = [
  {
    id: 'harian',
    title: 'Harian & Kerja Kantor',
    subtitle: 'Ruangan ber-AC, rapi, dan tidak bikin pusing',
    icon: '💼',
    badge: 'Daily & Office Pro',
  },
  {
    id: 'malam',
    title: 'Kencan & Acara Malam',
    subtitle: 'Makan malam romantis, hangat, dan intim',
    icon: '🌙',
    badge: 'Date & Night Out',
  },
  {
    id: 'siang',
    title: 'Santai & Hangout Siang',
    subtitle: 'Siang cerah, luar ruangan, dan udara segar',
    icon: '☀️',
    badge: 'Casual & Outdoor',
  },
];

// 3 Pilihan Bersih & Lapang untuk Kesan Wangi Utama (Kuis Manual Langkah 3)
const SCENT_VIBE_OPTIONS = [
  {
    id: 'segar',
    title: 'Segar Dingin & Bersih',
    subtitle: 'Sensasi semilir laut, citrus segar, dan bersih',
    icon: '🌊',
    badge: 'Aquatic Citrus Fresh',
  },
  {
    id: 'manis',
    title: 'Manis Mewah & Menggoda',
    subtitle: 'Sensasi vanila lembut, creamy, dan bikin rindu',
    icon: '🍦',
    badge: 'Warm Vanilla Gourmand',
  },
  {
    id: 'hangat',
    title: 'Hangat & Berkarisma',
    subtitle: 'Sensasi amber berkelas, rempah, dan kayu cedar',
    icon: '🪵',
    badge: 'Smoky Amber Woody',
  },
];

const DEFAULT_MINSKI_GREETING =
  'Hai Kak! Kenalin, aku MinSKI. Mau aroma segar atau manis mewah yang bikin si dia nempel terus? Ceritain wangi impianmu yuk!';

export const AromaMatchScreen: React.FC<AromaMatchScreenProps> = ({
  onBackToHome,
  onNavigateToOrder,
  onShowToast,
  perfumes = [],
  top11Photos = {},
  masterFlaconPhoto,
}) => {
  // Mode: 'minski' (Konsultasi Suara dengan MinSKI) atau 'manual' (Kuis 3 langkah) atau 'result'
  const [screenMode, setScreenMode] = useState<'minski' | 'manual' | 'result'>('minski');
  const [manualStep, setManualStep] = useState<1 | 2 | 3 | 'calculating'>(1);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null);
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<MinskiRecommendationResult | null>(null);
  const [viewTransitionKey, setViewTransitionKey] = useState<number>(0);

  // State Konsultasi Suara MinSKI
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [userTranscript, setUserTranscript] = useState<string>('');
  const [minskiDialogue, setMinskiDialogue] = useState<string>(DEFAULT_MINSKI_GREETING);
  const [typedMessage, setTypedMessage] = useState<string>('');
  const [isThinking, setIsThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'minski'; text: string }>>([]);

  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const stopSpeechRef = useRef<(() => void) | null>(null);
  const craftingTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const stopActiveStream = () => {
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch {}
      mediaStreamRef.current = null;
    }
  };

  const catalog = perfumes.length > 0 ? perfumes : getStoredPerfumes();

  const clearTimers = () => {
    craftingTimersRef.current.forEach((t) => clearTimeout(t));
    craftingTimersRef.current = [];
  };

  useEffect(() => {
    return () => {
      clearTimers();
      stopMinskiVoice();
      stopActiveStream();
      if (stopSpeechRef.current) stopSpeechRef.current();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  // Fungsi Bicara Suara MinSKI (Menggunakan file MP3 manusia asli / streaming Google Neural TTS)
  const playMinskiSpeech = (text: string, audioKey?: string | null) => {
    if (isMuted) return;
    if (stopSpeechRef.current) stopSpeechRef.current();

    stopSpeechRef.current = speakMinskiVoice(
      text,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      audioKey || undefined
    );
  };

  // Handler Perkenalan Diri MinSKI (Bisa langsung didengar tanpa perlu izin mic)
  const handlePlayIntro = () => {
    if (isSpeaking && stopSpeechRef.current) {
      stopSpeechRef.current();
      setIsSpeaking(false);
      return;
    }
    setMinskiDialogue(MINSKI_INTRO_SPEECH);
    playMinskiSpeech(MINSKI_INTRO_SPEECH, 'intro');
    onShowToast('MinSKI sedang menyapa Kakak... ✨');
  };

  // Handler Proses Percakapan Hybrid Multi-Turn dengan MinSKI (AI + Guardrail)
  const handleProcessUserQuery = async (input: string, presetAudioKey?: string) => {
    const query = input.trim();
    if (!query) return;

    setUserTranscript(query);
    setTypedMessage('');
    setIsThinking(true);

    const updatedHistory = [...chatHistory, { sender: 'user' as const, text: query }];
    setChatHistory(updatedHistory);

    // Panggil Backend Engine Hybrid MinSKI (/api/minski/chat)
    try {
      const res = await fetch('/api/minski/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, history: updatedHistory }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsThinking(false);
        setMinskiDialogue(data.reply);
        setChatHistory((prev) => [...prev, { sender: 'minski' as const, text: data.reply }]);

        if (data.recommendedPerfume) {
          setMatchResult(data.recommendedPerfume);
          if (data.recommendedPerfume.photoUrl && typeof Image !== 'undefined') {
            const preload = new Image();
            preload.src = data.recommendedPerfume.photoUrl;
          }
        } else {
          // Mode interaksi percakapan multi-turn: jangan tampilkan kartu dulu agar user bisa leluasa menjawab
          setMatchResult(null);
        }

        playMinskiSpeech(data.reply, presetAudioKey || data.audioKey);
        return;
      }
    } catch (err) {
      console.warn('Backend /api/minski/chat offline, fallback ke mesin lokal:', err);
    }

    // Fail-Safe: Mesin Lokal SINKI jika Server Tidak Merespon
    setIsThinking(false);

    // 1. Cek Kata Kasar
    if (checkMinskiProfanity(query)) {
      const randomResponse =
        MINSKI_PROFANITY_RESPONSES[Math.floor(Math.random() * MINSKI_PROFANITY_RESPONSES.length)];
      setMinskiDialogue(randomResponse);
      setChatHistory((prev) => [...prev, { sender: 'minski' as const, text: randomResponse }]);
      playMinskiSpeech(randomResponse, 'profanity');
      onShowToast('MinSKI: Harap gunakan bahasa yang santun ya Kak ✨');
      return;
    }

    // 2. Cek Di Luar Konteks Parfum
    if (checkMinskiOffTopic(query)) {
      const randomResponse =
        MINSKI_OFF_TOPIC_RESPONSES[Math.floor(Math.random() * MINSKI_OFF_TOPIC_RESPONSES.length)];
      setMinskiDialogue(randomResponse);
      setChatHistory((prev) => [...prev, { sender: 'minski' as const, text: randomResponse }]);
      playMinskiSpeech(randomResponse, 'offtopic');
      return;
    }

    // 3. Multi-Turn: Jika Pengguna Baru Bertanya & Belum Memberi Preferensi Aroma
    const consultCheck = evaluateMinskiConsultation(query, updatedHistory);
    if (consultCheck.isConsultation && consultCheck.response) {
      setMinskiDialogue(consultCheck.response);
      setChatHistory((prev) => [...prev, { sender: 'minski' as const, text: consultCheck.response! }]);
      setMatchResult(null);
      playMinskiSpeech(consultCheck.response);
      return;
    }

    // 4. Rekomendasikan Parfum Nyata dari Katalog SINKI
    const result = resolveMinskiRecommendation(
      query,
      catalog,
      top11Photos,
      masterFlaconPhoto,
      updatedHistory
    );

    setMatchResult(result);
    setMinskiDialogue(result.hypnoticScript);
    setChatHistory((prev) => [...prev, { sender: 'minski' as const, text: result.hypnoticScript }]);
    playMinskiSpeech(result.shortVoiceSpeech, presetAudioKey);

    if (result.photoUrl && typeof Image !== 'undefined') {
      const preload = new Image();
      preload.src = result.photoUrl;
    }
  };

  // Toggle Perekam Suara Mikrofon (Eksplisit getUserMedia & Real-time Live Recognition)
  const toggleListening = async () => {
    if (typeof window === 'undefined') return;

    // Hentikan suara MinSKI jika sedang bicara
    if (isSpeaking && stopSpeechRef.current) {
      stopSpeechRef.current();
      setIsSpeaking(false);
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      stopActiveStream();
      setIsListening(false);
      return;
    }

    // 1. Cek dukungan SpeechRecognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    // 2. Minta & aktifkan izin mikrofon secara eksplisit via getUserMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
      } catch (err: any) {
        console.warn('getUserMedia error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          onShowToast('Izin mikrofon diblokir oleh browser. Silakan klik ikon gembok/mic di bilah alamat browser untuk mengizinkan!');
          return;
        }
      }
    }

    if (!SpeechRecognition) {
      onShowToast('Browser ini belum mendukung speech recognition langsung. Silakan gunakan opsi cepat atau ketik di bawah ya Kak!');
      stopActiveStream();
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.continuous = false;
      recognition.interimResults = true; // Real-time ucapan terlihat langsung di layar saat berbicara

      recognition.onstart = () => {
        setIsListening(true);
        setMinskiDialogue('MinSKI lagi mendengarkan suara Kakak... Ceritakan aroma impianmu sekarang ya! 🎙️');
        onShowToast('Mikrofon aktif! Silakan berbicara... 🎙️');
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        if (interimTranscript) {
          setUserTranscript(interimTranscript);
          setMinskiDialogue(`Mendengar: "${interimTranscript}..."`);
        }

        if (finalTranscript) {
          setIsListening(false);
          stopActiveStream();
          handleProcessUserQuery(finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        setIsListening(false);
        stopActiveStream();

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          onShowToast('Izin mikrofon belum aktif. Silakan izinkan akses mikrofon di browser atau ketik langsung di bawah ya Kak!');
        } else if (event.error === 'no-speech') {
          onShowToast('Belum terdengar suara. Silakan ketuk tombol mic lagi dan ceritakan aroma impianmu!');
        } else {
          onShowToast('Suara kurang jelas terdengar. Boleh coba lagi atau gunakan opsi cepat di bawah ya Kak!');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        stopActiveStream();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      stopActiveStream();
      onShowToast('Gagal mengaktifkan pendeteksi suara. Silakan ketik atau gunakan tombol cepat di bawah ya Kak!');
    }
  };

  // Reset ke Layar MinSKI Awal
  const handleReset = () => {
    clearTimers();
    stopMinskiVoice();
    stopActiveStream();
    if (stopSpeechRef.current) stopSpeechRef.current();
    setIsSpeaking(false);
    setIsListening(false);
    setScreenMode('minski');
    setManualStep(1);
    setSelectedPersona(null);
    setSelectedOccasion(null);
    setSelectedVibe(null);
    setMatchResult(null);
    setUserTranscript('');
    setMinskiDialogue(DEFAULT_MINSKI_GREETING);
    setChatHistory([]);
    setViewTransitionKey((k) => k + 1);
  };

  // Handler Kuis Manual
  const handleSelectPersona = (id: string) => {
    setSelectedPersona(id);
    setTimeout(() => setManualStep(2), 220);
  };

  const handleSelectOccasion = (id: string) => {
    setSelectedOccasion(id);
    setTimeout(() => setManualStep(3), 220);
  };

  const handleSelectVibe = (id: string) => {
    clearTimers();
    setSelectedVibe(id);
    setManualStep('calculating');

    const query = `${selectedPersona || 'unisex'} ${selectedOccasion || 'harian'} ${id}`;
    const result = resolveMinskiRecommendation(
      query,
      catalog,
      top11Photos,
      masterFlaconPhoto
    );

    const t1 = setTimeout(() => {
      setMatchResult(result);
      setScreenMode('result');
      playMinskiSpeech(result.shortVoiceSpeech);
    }, 2800);

    craftingTimersRef.current = [t1];
  };

  const handleOrderResult = () => {
    if (!matchResult) return;
    onShowToast(`Membuka form pemesanan untuk ${matchResult.perfumeName}... ✨`);
    onNavigateToOrder({
      name: matchResult.perfumeName,
      category: matchResult.categoryLabel,
      pricePerMl: matchResult.pricePerMl,
    });
  };

  // ==========================================
  // 1. TAMPILAN HASIL RACIK AROMA (STRUKTUR NAMA -> BOTOL -> TAGLINE -> TOMBOL KECIL DI BAWAH)
  // ==========================================
  if (screenMode === 'result' && matchResult) {
    return (
      <div
        key={`step-result-${viewTransitionKey}`}
        className="relative w-full h-full flex flex-col overflow-y-auto no-scrollbar text-slate-100 sinki-screen-soft-fade select-none pb-24 sm:pb-28"
      >
        {/* Latar Belakang Panggung Marmer Gelap & Lampu Sorot */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[#08080b] sinki-match-result-base" />
          <div
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-80 h-96 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at 50% 0%, var(--arch-glow-tl) 0%, var(--arch-glow-tl-mid) 45%, transparent 75%)',
            }}
          />
          <div className="absolute top-1/4 right-1/4 w-60 h-60 bg-[#C5A059]/10 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-[#DFB76C]/10 rounded-full blur-[100px] pointer-events-none" />
        </div>

        {/* TOP BAR: TOMBOL RACIK ULANG & TOGGLE SUARA MINSKI */}
        <div className="relative z-20 w-full max-w-md mx-auto px-4 pt-2.5 shrink-0 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="py-1 px-2.5 rounded-[6px] sinki-arch-bar backdrop-blur-md border border-[#DFB76C]/35 text-[11px] font-semibold text-slate-200 hover:text-white flex items-center gap-1 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <ArrowLeft size={12} className="text-[#DFB76C]" />
            <span>Tanya MinSKI Lagi</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (isSpeaking && stopSpeechRef.current) {
                stopSpeechRef.current();
                setIsSpeaking(false);
              }
              setIsMuted((prev) => !prev);
              onShowToast(!isMuted ? 'Suara MinSKI dinonaktifkan' : 'Suara MinSKI aktif 🔊');
            }}
            className="p-1.5 rounded-[6px] sinki-arch-bar border border-[#DFB76C]/30 text-amber-200 hover:text-white transition-all cursor-pointer"
            title={isMuted ? 'Nyalakan Suara MinSKI' : 'Matikan Suara MinSKI'}
          >
            {isMuted ? <VolumeX size={13} className="text-slate-400" /> : <Volume2 size={13} className="text-[#DFB76C]" />}
          </button>
        </div>

        {/* SHOWCASE UTAMA HASIL RACIK AROMA: DIPOSISIKAN DENGAN JARAK HARMONIS */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full px-4 my-auto">
          {/* 1. NAMA VARIAN: DITURUNKAN LEBIH DEKAT KE BOTOL */}
          <div className="text-center mb-3 sm:mb-4 shrink-0">
            <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-white tracking-[-0.02em] leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
              {matchResult.perfumeName}
            </h2>
          </div>

          {/* 2. BOTOL PARFUM SINKI: UKURAN ASLI TETAP DIPERTAHANKAN */}
          <div className="relative flex flex-col items-center justify-center w-full max-w-sm select-none cursor-pointer">
            <img
              src={matchResult.photoUrl}
              alt={matchResult.perfumeName}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="max-h-[250px] sm:max-h-[300px] w-auto max-w-[80%] sm:max-w-[74%] object-contain select-none filter drop-shadow-[0_16px_32px_rgba(0,0,0,0.85)] transition-transform duration-300 hover:scale-[1.02]"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                const fallbackSrc = masterBottleTransparent || '/assets/sinki-master-flacon-transparent.png';
                if (!target.src.includes('sinki-master-flacon-transparent') && !target.src.includes('sinki_master_bottle_transparent')) {
                  target.src = fallbackSrc;
                }
              }}
            />

            {/* Bayangan Halus Elegan di Bawah Botol */}
            <div className="w-[48%] sm:w-[52%] h-[8px] bg-black/80 rounded-full blur-[4px] mt-1 pointer-events-none" />
            <div className="w-[62%] sm:w-[66%] h-[14px] bg-black/45 rounded-full blur-[8px] -mt-1.5 pointer-events-none" />
            <div className="w-[70%] sm:w-[74%] h-[16px] bg-amber-500/15 rounded-full blur-[10px] -mt-2 pointer-events-none mix-blend-screen" />
          </div>

          {/* 3. TAGLINE / KETERANGAN VARIAN: DINAIKKAN LEBIH DEKAT KE BOTOL (DENGAN JARAK AMAN, TIDAK MENEMPEL) */}
          <div className="mt-4 sm:mt-5 max-w-xs mx-auto text-center shrink-0">
            <p className="font-body text-xs sm:text-[13px] text-amber-100/90 font-normal leading-[1.45] italic drop-shadow-sm px-2">
              “{matchResult.hypnoticScript}”
            </p>
          </div>

          {/* 4. TOMBOL AKSI: DIPOSISIKAN LEBIH KE BAWAH DAN UKURAN LEBIH KECIL & RAMPING */}
          <div className="mt-7 sm:mt-9 mb-1 flex justify-center shrink-0 w-full">
            <button
              type="button"
              onClick={handleOrderResult}
              className="py-1.5 px-3.5 rounded-[5px] champagne-gold-btn text-slate-950 font-body text-[10.5px] sm:text-[11px] font-semibold tracking-[0.01em] flex items-center justify-center gap-1.5 shadow-[0_3px_12px_rgba(197,160,89,0.3)] hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
            >
              <ShoppingBag size={12} className="shrink-0" />
              <span>Ambil Racikan Ini Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. TAMPILAN KUIS MANUAL 3 LANGKAH (OPSI KLASIK)
  // ==========================================
  if (screenMode === 'manual') {
    return (
      <div className="relative w-full h-full flex flex-col sinki-arch-canvas text-slate-100 overflow-hidden sinki-screen-soft-fade">
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-[#C5A059]/[0.05] rounded-full blur-[120px] pointer-events-none" />

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-28 flex flex-col justify-center max-w-md mx-auto w-full">
          {manualStep === 1 && (
            <div className="space-y-4">
              <div className="text-center space-y-1 pb-1">
                <span className="font-body text-[11px] font-semibold tracking-[0.06em] text-[#DFB76C] uppercase block">
                  Langkah 1 dari 3
                </span>
                <h3 className="font-heading text-lg font-bold text-white">Racik Aroma Khas Diri Anda</h3>
                <p className="font-body text-xs text-slate-400">Pilih karakter persona Anda:</p>
              </div>

              <div className="space-y-3">
                {PERSONA_OPTIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectPersona(item.id)}
                    className="w-full p-4 rounded-[8px] text-left border flex items-center justify-between gap-3.5 transition-all cursor-pointer sinki-arch-card sinki-arch-card-interactive"
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <h4 className="font-heading text-sm font-bold text-white">{item.title}</h4>
                        <p className="font-body text-xs text-slate-300 mt-0.5">{item.subtitle}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-[#DFB76C]" />
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setScreenMode('minski')}
                className="font-body text-xs text-[#DFB76C] hover:underline block mx-auto pt-2 cursor-pointer"
              >
                ← Kembali ke Konsultasi Suara MinSKI
              </button>
            </div>
          )}

          {manualStep === 2 && (
            <div className="space-y-4">
              <div className="text-center space-y-1 pb-1">
                <span className="font-body text-[11px] font-semibold tracking-[0.06em] text-[#DFB76C] uppercase block">
                  Langkah 2 dari 3
                </span>
                <h3 className="font-heading text-lg font-bold text-white">Momen Penggunaan</h3>
                <p className="font-body text-xs text-slate-400">Pilih suasana wangi yang diinginkan:</p>
              </div>

              <div className="space-y-3">
                {OCCASION_OPTIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectOccasion(item.id)}
                    className="w-full p-4 rounded-[8px] text-left border flex items-center justify-between gap-3.5 transition-all cursor-pointer sinki-arch-card sinki-arch-card-interactive"
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <h4 className="font-heading text-sm font-bold text-white">{item.title}</h4>
                        <p className="font-body text-xs text-slate-300 mt-0.5">{item.subtitle}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-[#DFB76C]" />
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setManualStep(1)}
                className="font-body text-xs text-slate-400 hover:text-white block mx-auto pt-2 cursor-pointer"
              >
                ← Kembali ke Langkah 1
              </button>
            </div>
          )}

          {manualStep === 3 && (
            <div className="space-y-4">
              <div className="text-center space-y-1 pb-1">
                <span className="font-body text-[11px] font-semibold tracking-[0.06em] text-[#DFB76C] uppercase block">
                  Langkah 3 dari 3
                </span>
                <h3 className="font-heading text-lg font-bold text-white">Kesan Aroma Utama</h3>
                <p className="font-body text-xs text-slate-400">Pilih sensasi yang paling nyaman di hidung:</p>
              </div>

              <div className="space-y-3">
                {SCENT_VIBE_OPTIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectVibe(item.id)}
                    className="w-full p-4 rounded-[8px] text-left border flex items-center justify-between gap-3.5 transition-all cursor-pointer sinki-arch-card sinki-arch-card-interactive"
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <h4 className="font-heading text-sm font-bold text-white">{item.title}</h4>
                        <p className="font-body text-xs text-slate-300 mt-0.5">{item.subtitle}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-[#DFB76C]" />
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setManualStep(2)}
                className="font-body text-xs text-slate-400 hover:text-white block mx-auto pt-2 cursor-pointer"
              >
                ← Kembali ke Langkah 2
              </button>
            </div>
          )}

          {manualStep === 'calculating' && (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-2 border-[#DFB76C] border-t-transparent animate-spin" />
              <h4 className="font-heading text-base font-semibold text-white">MinSKI Sedang Meracik Aroma...</h4>
              <p className="font-body text-xs text-slate-300">Menyelaraskan bibit murni dengan karakter Kakak</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // 3. TAMPILAN UTAMA: KONSULTASI SUARA DENGAN "MinSKI (Admin SINKI)"
  // ==========================================
  return (
    <div className="relative w-full h-full flex flex-col sinki-arch-canvas text-slate-100 overflow-hidden sinki-screen-soft-fade">
      {/* Pendaran Cahaya Halo Latar Belakang */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#C5A059]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* HEADER BAR MINSKI */}
      <header className="relative z-20 w-full max-w-md mx-auto px-4 pt-2.5 pb-1 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-heading text-xs font-bold tracking-[0.06em] text-[#DFB76C] uppercase">
            MinSKI · Admin SINKI Live
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            if (isSpeaking && stopSpeechRef.current) {
              stopSpeechRef.current();
              setIsSpeaking(false);
            }
            setIsMuted((prev) => !prev);
            onShowToast(!isMuted ? 'Suara MinSKI dinonaktifkan' : 'Suara MinSKI aktif 🔊');
          }}
          className="p-1.5 rounded-[6px] sinki-arch-bar border border-[#DFB76C]/30 text-amber-200 hover:text-white transition-all cursor-pointer"
          title={isMuted ? 'Nyalakan Suara MinSKI' : 'Matikan Suara MinSKI'}
        >
          {isMuted ? <VolumeX size={14} className="text-slate-400" /> : <Volume2 size={14} className="text-[#DFB76C]" />}
        </button>
      </header>

      {/* KONTEN UTAMA: SHOWCASE MINSKI (BERDIRI DI ATAS KOTAK) & INTERAKSI SUARA */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-1 pb-28 flex flex-col items-center justify-between max-w-md mx-auto w-full">
        {/* A. KARAKTER MINSKI BERDIRI DI ATAS 3D PODIUM BOX (UKURAN KOMPAK & HIDUP) */}
        <div className="relative flex flex-col items-center justify-center pt-0.5 select-none shrink-0">
          <div
            className={`relative flex flex-col items-center cursor-pointer transition-transform duration-300 ${
              isSpeaking ? 'minski-speaking-active' : 'minski-float-anim'
            }`}
            onClick={handlePlayIntro}
            title={isSpeaking ? 'Ketuk untuk berhenti bicara' : 'Ketuk MinSKI untuk dengar sapaannya!'}
          >
            <img
              src="/assets/sinki_minski.png"
              alt="MinSKI - Admin SINKI"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="max-h-[135px] sm:max-h-[148px] w-auto object-contain filter drop-shadow-[0_10px_22px_rgba(0,0,0,0.85)] drop-shadow-[0_0_16px_rgba(223,183,108,0.22)]"
            />

            {/* Bayangan Kontak Sepatu MinSKI di Atas Permukaan Kotak */}
            <div className="w-24 sm:w-28 h-2.5 bg-black/95 rounded-[100%] blur-[2px] -mt-1 pointer-events-none" />
          </div>

          {/* 3D Kotak Podium Mewah Tempat MinSKI Berdiri */}
          <div className="relative -mt-1 w-44 sm:w-48 py-1.5 px-3 rounded-[6px] minski-podium-box flex flex-col items-center justify-center text-center shadow-lg border border-[#DFB76C]/40">
            <div className="absolute -top-[1px] inset-x-3 h-[1px] bg-gradient-to-r from-transparent via-[#DFB76C] to-transparent opacity-80" />
            <div className="flex items-center gap-1.5">
              <span className="font-heading text-[10.5px] sm:text-[11px] font-extrabold tracking-[0.14em] text-[#DFB76C] uppercase drop-shadow-sm">
                ADMIN SINKI
              </span>
              {isSpeaking && (
                <div className="flex items-end gap-[2px] h-3">
                  <span className="w-[2px] bg-amber-400 rounded-full minski-eq-bar-1" />
                  <span className="w-[2px] bg-amber-300 rounded-full minski-eq-bar-2" />
                  <span className="w-[2px] bg-amber-400 rounded-full minski-eq-bar-3" />
                  <span className="w-[2px] bg-amber-200 rounded-full minski-eq-bar-4" />
                </div>
              )}
            </div>
            <span className="font-body text-[8.5px] text-amber-200/70 tracking-wider uppercase">
              Atelier Konsultan
            </span>
          </div>

          {/* Tombol Perkenalan Diri MinSKI (Bisa didengar langsung tanpa mik) */}
          <button
            type="button"
            onClick={handlePlayIntro}
            className="mt-2 py-1 px-3 rounded-full sinki-arch-bar border border-[#DFB76C]/35 text-[10px] sm:text-[10.5px] font-semibold text-amber-200 hover:text-white flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            {isSpeaking ? (
              <>
                <Volume2 size={11} className="text-[#DFB76C] animate-pulse" />
                <span>MinSKI Sedang Bicara... (Ketuk Stop)</span>
              </>
            ) : (
              <>
                <span>👋 Dengar Sapaan MinSKI</span>
                <span className="text-[9px] text-[#DFB76C] font-bold">▶</span>
              </>
            )}
          </button>
        </div>

        {/* B. BALON DIALOG MINSKI DENGAN KEKUATAN HIPNOTIS & INTERAKSI */}
        <div className="w-full my-auto py-2 shrink-0 space-y-2">
          <div className="relative p-3.5 sm:p-4 rounded-[10px] sinki-arch-card border border-[#DFB76C]/35 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.65)] space-y-1.5">
            {/* Header Dialog */}
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <div className="flex items-center gap-1.5">
                <span className="font-heading text-xs font-bold text-[#DFB76C]">MinSKI</span>
                <span className="py-0.5 px-1.5 rounded-[3px] bg-[#DFB76C]/20 text-[9px] font-semibold text-amber-200">
                  Konsultan Aroma
                </span>
              </div>

              {isSpeaking && (
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                  <div className="flex items-end gap-[2px] h-3">
                    <span className="w-[2px] bg-emerald-400 rounded-full minski-eq-bar-1" />
                    <span className="w-[2px] bg-emerald-300 rounded-full minski-eq-bar-2" />
                    <span className="w-[2px] bg-emerald-400 rounded-full minski-eq-bar-3" />
                    <span className="w-[2px] bg-emerald-200 rounded-full minski-eq-bar-4" />
                  </div>
                  <span>Sedang bicara...</span>
                </div>
              )}
            </div>

            {/* Isi Dialog MinSKI */}
            <p className="font-body text-xs sm:text-[13px] text-slate-100 font-normal leading-[1.5] italic">
              “{isThinking ? 'MinSKI sedang menganalisa dan meracik wangi impian Kakak... ✨' : minskiDialogue}”
            </p>

            {/* Cuplikan Suara Pengguna jika ada */}
            {userTranscript && (
              <div className="pt-1 text-[11px] text-amber-200/80 font-medium truncate border-t border-white/5">
                💬 Kakak: <span className="italic text-white">"{userTranscript}"</span>
              </div>
            )}
          </div>

          {/* KARTU INTERAKTIF HASIL KONSULTASI (PENGGUNA MEMILIH KAPAN INGIN MEMBUKA) */}
          {matchResult && (
            <div className="p-2.5 sm:p-3 rounded-[10px] sinki-arch-bar border border-[#DFB76C]/50 flex items-center justify-between gap-3 shadow-[0_6px_20px_rgba(0,0,0,0.6)] animate-fadeIn">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-[6px] bg-black/50 border border-[#DFB76C]/30 flex items-center justify-center p-1 shrink-0">
                  <img
                    src={matchResult.photoUrl}
                    alt={matchResult.perfumeName}
                    className="max-h-full max-w-full object-contain drop-shadow"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-semibold text-[#DFB76C] uppercase tracking-wider block">
                    ✨ Racikan Siap Dibuka
                  </span>
                  <h4 className="font-heading text-xs sm:text-[13px] font-bold text-white truncate">
                    {matchResult.perfumeName}
                  </h4>
                  <p className="text-[9.5px] text-slate-300 truncate">
                    {matchResult.categoryLabel}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (stopSpeechRef.current) stopSpeechRef.current();
                  setIsSpeaking(false);
                  setScreenMode('result');
                }}
                className="py-1.5 px-3 rounded-[6px] champagne-gold-btn text-slate-950 text-[10.5px] font-bold shrink-0 shadow-md active:scale-95 transition-all flex items-center gap-1 cursor-pointer hover:brightness-105"
              >
                <span>Lihat Botol</span>
                <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>

        {/* C. KONTROL SUARA MIKROFON, CHIPS CEPAT & INPUT TEKS */}
        <div className="w-full shrink-0 space-y-2.5 pt-1">
          {/* Pilihan Cepat Tanpa Perlu Izin Mic (Zero-Friction Voice Consultation) */}
          <div className="w-full space-y-1.5">
            <div className="flex items-center justify-between px-0.5">
              <span className="font-body text-[10px] font-semibold text-amber-200/85 tracking-wide">
                ⚡ Tanya MinSKI Langsung (Tanpa Izin Mic):
              </span>
              <span className="font-body text-[9px] text-slate-400">1-Klik Langsung Racik</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {MINSKI_PRESET_QUERIES.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  disabled={isThinking}
                  onClick={() => handleProcessUserQuery(preset.query, preset.id)}
                  className="p-2 rounded-[8px] sinki-arch-card border border-[#DFB76C]/30 hover:border-[#DFB76C] flex flex-col items-center text-center gap-1 transition-all active:scale-95 cursor-pointer group disabled:opacity-50"
                >
                  <span className="text-base group-hover:scale-110 transition-transform">{preset.icon}</span>
                  <span className="font-heading text-[10px] sm:text-[10.5px] font-bold text-white leading-tight">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tombol Mikrofon Emas Utama */}
          <div className="flex flex-col items-center justify-center pt-0.5">
            <button
              type="button"
              onClick={toggleListening}
              className={`relative py-2.5 px-6 rounded-full flex items-center justify-center gap-2.5 text-xs font-bold transition-all duration-300 cursor-pointer shadow-lg active:scale-95 ${
                isListening
                  ? 'bg-rose-600 text-white minski-voice-active border border-rose-400 shadow-[0_0_20px_rgba(225,29,72,0.6)]'
                  : 'champagne-gold-btn text-slate-950 shadow-[0_4px_18px_rgba(197,160,89,0.38)] hover:brightness-105'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff size={16} className="animate-bounce" />
                  <span>Mendengarkan... (Ketuk Selesai)</span>
                </>
              ) : (
                <>
                  <Mic size={16} />
                  <span>Bicara dengan MinSKI</span>
                </>
              )}
            </button>
            <span className="font-body text-[10px] text-slate-400 font-normal mt-1 text-center">
              {isListening ? 'Katakan wangi atau suasana yang Kakak cari...' : 'Ketuk mic untuk berbicara langsung dengan MinSKI'}
            </span>
          </div>

          {/* Kotak Input Teks Cadangan (Jika pengguna di tempat bising) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleProcessUserQuery(typedMessage);
            }}
            className="flex items-center gap-1.5 p-1 rounded-[8px] sinki-arch-input border border-[#DFB76C]/30 backdrop-blur-md"
          >
            <input
              type="text"
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              placeholder="Atau ketik wangi impianmu ke MinSKI..."
              className="flex-1 bg-transparent px-2.5 py-1 text-xs text-white placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!typedMessage.trim() || isThinking}
              className="p-1.5 rounded-[6px] bg-[#DFB76C] text-slate-950 hover:bg-[#F0DFB6] disabled:opacity-40 transition-all cursor-pointer"
              title="Kirim ke MinSKI"
            >
              <Send size={13} />
            </button>
          </form>

          {/* Tombol Opsi Kuis Manual 3 Langkah */}
          <div className="text-center pt-0.5">
            <button
              type="button"
              onClick={() => {
                if (stopSpeechRef.current) stopSpeechRef.current();
                setIsSpeaking(false);
                setScreenMode('manual');
              }}
              className="font-body text-[11px] text-slate-400 hover:text-[#DFB76C] transition-colors cursor-pointer"
            >
              Atau pilih manual lewat kuis 3 langkah →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
