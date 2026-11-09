import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  History,
  X,
  Zap,
  User,
  RotateCcw,
} from 'lucide-react';
import { PerfumeItem } from '../data/perfumes';
import masterBottleTransparent from '../assets/images/sinki_master_bottle_transparent.png';
import {
  checkMinskiProfanity,
  checkMinskiOffTopic,
  MINSKI_PROFANITY_RESPONSES,
  MINSKI_OFF_TOPIC_RESPONSES,
  resolveMinskiRecommendation,
  speakMinskiVoice,
  stopMinskiVoice,
  MinskiRecommendationResult,
  evaluateMinskiConsultation,
} from '../utils/minskiEngine';

interface AromaMatchScreenProps {
  onBackToHome: () => void;
  onNavigateToOrder: (perfume: { name: string; category?: string; pricePerMl?: number }) => void;
  onShowToast: (msg: string) => void;
  perfumes?: PerfumeItem[];
  top11Photos?: Record<string, string>;
  masterFlaconPhoto?: string | null;
  isActiveTab?: boolean;
}

// 3 Pilihan Bersih & Lapang untuk Persona (Kuis Manual Langkah 1)
const PERSONA_OPTIONS = [
  {
    id: 'pria',
    title: 'Pria (Gentleman)',
    subtitle: 'Karakter maskulin, berkarisma, dan tegas',
    icon: '👔',
  },
  {
    id: 'wanita',
    title: 'Wanita (Feminine)',
    subtitle: 'Karakter anggun, mempesona, dan manis',
    icon: '👗',
  },
  {
    id: 'unisex',
    title: 'Netral (Unisex)',
    subtitle: 'Karakter segar, bersih, dan fleksibel',
    icon: '🧥',
  },
];

// 3 Pilihan Bersih & Lapang untuk Suasana Penggunaan (Kuis Manual Langkah 2)
const OCCASION_OPTIONS = [
  {
    id: 'harian',
    title: 'Harian & Kerja Kantor',
    subtitle: 'Ruangan ber-AC, rapi, dan tidak bikin pusing',
    icon: '💼',
  },
  {
    id: 'malam',
    title: 'Kencan & Acara Malam',
    subtitle: 'Makan malam romantis, hangat, dan intim',
    icon: '🌙',
  },
  {
    id: 'siang',
    title: 'Santai & Hangout Siang',
    subtitle: 'Siang cerah, luar ruangan, dan udara segar',
    icon: '☀️',
  },
];

// 3 Pilihan Bersih & Lapang untuk Kesan Wangi Utama (Kuis Manual Langkah 3)
const SCENT_VIBE_OPTIONS = [
  {
    id: 'segar',
    title: 'Segar Dingin & Bersih',
    subtitle: 'Sensasi semilir laut, citrus segar, dan bersih',
    icon: '🌊',
  },
  {
    id: 'manis',
    title: 'Manis Mewah & Menggoda',
    subtitle: 'Sensasi vanila lembut, creamy, dan bikin rindu',
    icon: '🍦',
  },
  {
    id: 'hangat',
    title: 'Hangat & Berkarisma',
    subtitle: 'Sensasi amber berkelas, rempah, dan kayu cedar',
    icon: '🪵',
  },
];

const DEFAULT_MINSKI_GREETING =
  'Hai Kak! Kenalin, aku MinSKI. Mau aroma segar atau manis mewah yang bikin si dia nempel terus? Ceritain wangi impianmu yuk!';

// Audio Processing Helper: Resample any input rate down to 16kHz
function resampleTo16k(inputData: Float32Array, inputSampleRate: number): Float32Array {
  if (inputSampleRate === 16000) return inputData;
  const ratio = inputSampleRate / 16000;
  const newLength = Math.round(inputData.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.floor((i + 1) * ratio);
    let sum = 0;
    let count = 0;
    for (let j = start; j < end && j < inputData.length; j++) {
      sum += inputData[j];
      count++;
    }
    result[i] = count > 0 ? sum / count : inputData[start] || 0;
  }
  return result;
}

// Convert Float32 [-1, 1] to 16-bit PCM little-endian
function float32ToInt16PCM(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}

// Base64 encoding of Int16Array
function int16ToBase64(int16: Int16Array): string {
  const bytes = new Uint8Array(int16.buffer, int16.byteOffset, int16.byteLength);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 (24kHz 16-bit PCM from Gemini Live) to Float32Array
function base64To24kFloat32(base64: string): Float32Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768.0;
  }
  return float32;
}

export const AromaMatchScreen: React.FC<AromaMatchScreenProps> = ({
  onBackToHome,
  onNavigateToOrder,
  onShowToast,
  perfumes = [],
  top11Photos = {},
  masterFlaconPhoto,
  isActiveTab = true,
}) => {
  // Screen mode: 'minski' (AI Voice) | 'manual' (3-step quiz) | 'result'
  const [screenMode, setScreenMode] = useState<'minski' | 'manual' | 'result'>('minski');
  const [manualStep, setManualStep] = useState<1 | 2 | 3 | 'calculating'>(1);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null);
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<MinskiRecommendationResult | null>(null);
  const [viewTransitionKey, setViewTransitionKey] = useState<number>(0);

  // Voice Interaction State
  const [isVoiceMode, setIsVoiceMode] = useState<boolean>(false);
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [interruptedNotice, setInterruptedNotice] = useState<boolean>(false);
  const [liveUserTranscript, setLiveUserTranscript] = useState<string>('');
  const [minskiDialogue, setMinskiDialogue] = useState<string>(DEFAULT_MINSKI_GREETING);
  const [typedMessage, setTypedMessage] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'minski'; text: string; time: string }>>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [micDenied, setMicDenied] = useState<boolean>(false);

  // Engine Status
  const [activeEngine, setActiveEngine] = useState<'gemini-live' | 'fallback-speech'>('gemini-live');
  const [engineTitle, setEngineTitle] = useState<string>('Gemini 3.8 Live (Native Audio)');

  // Audio & WebSocket Refs
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextPlaybackTimeRef = useRef<number>(0);
  const isSpeakingRef = useRef<boolean>(false);
  const isVoiceModeRef = useRef<boolean>(false);
  const isMutedRef = useRef<boolean>(false);
  const fallbackSpeechRef = useRef<(() => void) | null>(null);
  const currentOutputTranscriptRef = useRef<string>('');
  const craftingTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastActivityTimeRef = useRef<number>(Date.now());
  const hasDeliveredRecommendationRef = useRef<boolean>(false);
  const speakingStartTimeRef = useRef<number>(0);
  const consecutiveSpeechFramesRef = useRef<number>(0);
  const speakingEndDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onShowToastRef = useRef(onShowToast);
  useEffect(() => {
    onShowToastRef.current = onShowToast;
  }, [onShowToast]);

  const isMountedRef = useRef<boolean>(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  isSpeakingRef.current = isSpeaking;
  isVoiceModeRef.current = isVoiceMode;
  isMutedRef.current = isMuted;

  const catalog = perfumes.length > 0 ? perfumes : [];

  // Stop all running audio buffers immediately (Instant Barge-in)
  const stopAllPlaybackSources = useCallback(() => {
    if (speakingEndDebounceRef.current) {
      clearTimeout(speakingEndDebounceRef.current);
      speakingEndDebounceRef.current = null;
    }
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch {}
    });
    activeSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextPlaybackTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
    setIsSpeaking(false);
    isSpeakingRef.current = false;
  }, []);

  // Stop fallback audio
  const stopFallbackSpeech = useCallback(() => {
    if (fallbackSpeechRef.current) {
      fallbackSpeechRef.current();
      fallbackSpeechRef.current = null;
    }
    stopMinskiVoice();
    setIsSpeaking(false);
  }, []);

  // User interupsi (Barge-In)
  const handleBargeIn = useCallback(() => {
    stopAllPlaybackSources();
    stopFallbackSpeech();

    // Kirim sinyal interrupt ke Gemini Live
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'interrupt' }));
      } catch {}
    }

    setInterruptedNotice(true);
    setTimeout(() => setInterruptedNotice(false), 1200);
  }, [stopAllPlaybackSources, stopFallbackSpeech]);

  // Clean up mic & audio contexts
  const cleanupAudio = useCallback(() => {
    stopAllPlaybackSources();
    stopFallbackSpeech();

    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
      } catch {}
      scriptProcessorRef.current = null;
    }

    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch {}
      mediaStreamRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      try {
        inputAudioCtxRef.current.close();
      } catch {}
      inputAudioCtxRef.current = null;
    }

    if (outputAudioCtxRef.current) {
      try {
        outputAudioCtxRef.current.close();
      } catch {}
      outputAudioCtxRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }

    if (isMountedRef.current) {
      setIsListening(false);
      setIsSpeaking(false);
    }
    isSpeakingRef.current = false;
  }, [stopAllPlaybackSources, stopFallbackSpeech]);

  // Play audio chunk from Gemini Live (24kHz PCM)
  const schedule24kPcmChunk = useCallback((base64Audio: string) => {
    if (isMutedRef.current) return;

    if (!outputAudioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      outputAudioCtxRef.current = new AudioCtx({ sampleRate: 24000 });
    }

    const ctx = outputAudioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const float32Data = base64To24kFloat32(base64Audio);
    if (!float32Data || float32Data.length === 0) return;

    const audioBuffer = ctx.createBuffer(1, float32Data.length, 24000);
    audioBuffer.getChannelData(0).set(float32Data);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const currentTime = ctx.currentTime;
    // Jitter buffer lead-time (85ms):
    // Menghilangkan jeda di awal & patah-patah suku kata pertama saat suara mulai diputar
    const JITTER_BUFFER_LEAD = 0.085;
    if (nextPlaybackTimeRef.current < currentTime) {
      nextPlaybackTimeRef.current = currentTime + JITTER_BUFFER_LEAD;
      speakingStartTimeRef.current = Date.now();
    }

    source.start(nextPlaybackTimeRef.current);
    nextPlaybackTimeRef.current += audioBuffer.duration;

    activeSourcesRef.current.push(source);
    setIsSpeaking(true);
    isSpeakingRef.current = true;

    source.onended = () => {
      const idx = activeSourcesRef.current.indexOf(source);
      if (idx !== -1) activeSourcesRef.current.splice(idx, 1);
      if (activeSourcesRef.current.length === 0 && ctx.currentTime >= nextPlaybackTimeRef.current - 0.04) {
        if (speakingEndDebounceRef.current) clearTimeout(speakingEndDebounceRef.current);
        speakingEndDebounceRef.current = setTimeout(() => {
          if (activeSourcesRef.current.length === 0 && ctx.currentTime >= nextPlaybackTimeRef.current - 0.04) {
            setIsSpeaking(false);
            isSpeakingRef.current = false;
          }
        }, 120);
      }
    };
  }, []);

  // Connect to Gemini Live WebSocket Server
  const connectGeminiLive = useCallback(() => {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}/api/minski/live-ws`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        // Connected to server
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'ready') {
            setActiveEngine('gemini-live');
            setEngineTitle('Gemini 3.8 Live (Native Audio)');
            lastActivityTimeRef.current = Date.now();
          } else if (msg.type === 'audio' && msg.audio) {
            lastActivityTimeRef.current = Date.now();
            schedule24kPcmChunk(msg.audio);
          } else if (msg.type === 'input_transcript') {
            lastActivityTimeRef.current = Date.now();
            setLiveUserTranscript((prev) => (prev ? `${prev} ${msg.text}` : msg.text));
          } else if (msg.type === 'output_transcript') {
            lastActivityTimeRef.current = Date.now();
            currentOutputTranscriptRef.current += msg.text;
            setMinskiDialogue(currentOutputTranscriptRef.current);
          } else if (msg.type === 'interrupted') {
            lastActivityTimeRef.current = Date.now();
            handleBargeIn();
          } else if (msg.type === 'turn_complete') {
            lastActivityTimeRef.current = Date.now();
            const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            if (currentOutputTranscriptRef.current) {
              setChatHistory((prev) => [
                ...prev,
                { sender: 'minski', text: currentOutputTranscriptRef.current, time: nowTime },
              ]);
              currentOutputTranscriptRef.current = '';
            }
          } else if (msg.type === 'recommendation' && msg.perfume) {
            lastActivityTimeRef.current = Date.now();
            hasDeliveredRecommendationRef.current = true;
            setMatchResult(msg.perfume);
            if (msg.perfume.photoUrl && typeof Image !== 'undefined') {
              const p = new Image();
              p.src = msg.perfume.photoUrl;
            }
          } else if (msg.type === 'unsupported' || msg.type === 'error') {
            console.warn('[Gemini Live Notice]:', msg.message || msg.reason);
            setActiveEngine('fallback-speech');
            setEngineTitle('Natural Voice Assistant (Web Speech + AI)');
          }
        } catch (e) {
          console.warn('WS message parsing error:', e);
        }
      };

      ws.onclose = () => {
        if (isVoiceModeRef.current) {
          // Reconnect once if disconnected unexpectedly
          setTimeout(() => {
            if (isVoiceModeRef.current && (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED)) {
              connectGeminiLive();
            }
          }, 1500);
        }
      };

      ws.onerror = () => {
        setActiveEngine('fallback-speech');
        setEngineTitle('Natural Voice Assistant (Web Speech + AI)');
      };

      wsRef.current = ws;
    } catch (e) {
      setActiveEngine('fallback-speech');
      setEngineTitle('Natural Voice Assistant (Web Speech + AI)');
    }
  }, [handleBargeIn, schedule24kPcmChunk]);

  // Start Real-Time Microphone Streaming (Native 16kHz PCM to Gemini Live)
  const startNativeMicStream = useCallback(async () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioCtx();
      inputAudioCtxRef.current = inputCtx;
      if (inputCtx.state === 'suspended') {
        await inputCtx.resume();
      }

      if (!outputAudioCtxRef.current) {
        outputAudioCtxRef.current = new AudioCtx({ sampleRate: 24000 });
      }
      if (outputAudioCtxRef.current.state === 'suspended') {
        await outputAudioCtxRef.current.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;
      setMicDenied(false);

      const source = inputCtx.createMediaStreamSource(stream);
      // Use bufferSize 2048 (~42ms audio chunk for low latency)
      const processor = inputCtx.createScriptProcessor(2048, 1, 1);
      scriptProcessorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!isVoiceModeRef.current) return;
        const channelData = e.inputBuffer.getChannelData(0);

        // 1. Voice Activity Detection (VAD) Energy Calculation
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
          sum += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sum / channelData.length);

        // Update timestamp aktivitas saat suara terdeteksi
        if (rms > 0.02) {
          lastActivityTimeRef.current = Date.now();
        }

        // 2. Perlindungan Cerdas Interupsi (Anti-Patah & Anti-Feedback):
        // Jangan potong suara MinSKI karena bunyi AC, ketukan meja, desahan nafas, atau gema speaker HP!
        if (isSpeakingRef.current) {
          const speakingDuration = Date.now() - speakingStartTimeRef.current;
          // Inhibit interupsi pada 800ms pertama kalimat agar audio speaker stabil
          if (speakingDuration > 800 && rms > 0.085) {
            consecutiveSpeechFramesRef.current++;
            // Wajib konsisten minimal 6 frame berturut-turut (~250ms suara bicara jelas)
            if (consecutiveSpeechFramesRef.current >= 6) {
              consecutiveSpeechFramesRef.current = 0;
              handleBargeIn();
            }
          } else {
            consecutiveSpeechFramesRef.current = 0;
          }

          // Supresi kebocoran suara speaker: jangan kirim audio volume rendah kembali ke Gemini Live
          if (rms < 0.065) {
            return;
          }
        } else {
          consecutiveSpeechFramesRef.current = 0;
        }

        // 3. Resample to 16kHz and convert to 16-bit PCM little-endian
        const resampled = resampleTo16k(channelData, inputCtx.sampleRate);
        const pcm16 = float32ToInt16PCM(resampled);
        const base64Audio = int16ToBase64(pcm16);

        // 4. Stream to Gemini Live WebSocket
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'audio',
              audio: base64Audio,
            })
          );
        }
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);
      setIsListening(true);
    } catch (err: any) {
      console.warn('Gagal mengakses mikrofon:', err);
      if (isMountedRef.current) {
        setMicDenied(true);
        setIsListening(false);
        setIsVoiceMode(false);
      }
      isVoiceModeRef.current = false;
      setTimeout(() => {
        onShowToastRef.current?.('Izin mikrofon tidak aktif. Kakak tetap bisa berkonsultasi via teks atau opsi cepat di bawah!');
      }, 0);
    }
  }, [handleBargeIn]);

  // Start Voice Mode (ChatGPT Voice Style Hands-Free)
  const toggleVoiceMode = useCallback(() => {
    if (isVoiceMode) {
      // Matikan sesi suara
      setIsVoiceMode(false);
      isVoiceModeRef.current = false;
      cleanupAudio();
      stopFallbackSpeech();
      setSessionSeconds(0);
      onShowToastRef.current?.('Sesi suara MinSKI selesai (Standby)');
    } else {
      // Aktifkan sesi suara dua arah real-time via Gemini Live
      lastActivityTimeRef.current = Date.now();
      hasDeliveredRecommendationRef.current = false;
      setSessionSeconds(0);
      setIsVoiceMode(true);
      isVoiceModeRef.current = true;
      connectGeminiLive();
      startNativeMicStream();
      onShowToastRef.current?.('🎙️ Percakapan Suara Real-Time Aktif (Bicara langsung)');
    }
  }, [cleanupAudio, connectGeminiLive, isVoiceMode, startNativeMicStream, stopFallbackSpeech]);

  // Handler Kirim Pesan Teks (Jika mic ditolak / ingin mengetik)
  const handleSendTextMessage = useCallback(
    async (textToSend: string) => {
      const q = textToSend.trim();
      if (!q) return;

      setTypedMessage('');
      setLiveUserTranscript(q);
      setIsThinking(true);

      const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      setChatHistory((prev) => [...prev, { sender: 'user', text: q, time: nowTime }]);

      // Jika WebSocket Gemini Live aktif, kirim via WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        currentOutputTranscriptRef.current = '';
        wsRef.current.send(JSON.stringify({ type: 'text', text: q }));
        setIsThinking(false);
        return;
      }

      // Fallback HTTP endpoint /api/minski/chat
      try {
        const res = await fetch('/api/minski/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: q, history: chatHistory }),
        });
        if (res.ok) {
          const data = await res.json();
          setIsThinking(false);
          setMinskiDialogue(data.reply);
          setChatHistory((prev) => [...prev, { sender: 'minski', text: data.reply, time: nowTime }]);

          if (data.recommendedPerfume) {
            setMatchResult(data.recommendedPerfume);
          } else {
            setMatchResult(null);
          }

          stopFallbackSpeech();
          if (!isMutedRef.current) {
            fallbackSpeechRef.current = speakMinskiVoice(
              data.reply,
              () => {
                setIsSpeaking(true);
                isSpeakingRef.current = true;
              },
              () => {
                setIsSpeaking(false);
                isSpeakingRef.current = false;
              },
              data.audioKey
            );
          }
          return;
        }
      } catch (err) {
        console.warn('Error calling /api/minski/chat:', err);
      }

      setIsThinking(false);
    },
    [chatHistory, stopFallbackSpeech]
  );


  // Reset sesi
  const handleReset = useCallback(() => {
    cleanupAudio();
    setIsVoiceMode(false);
    isVoiceModeRef.current = false;
    setScreenMode('minski');
    setManualStep(1);
    setSelectedPersona(null);
    setSelectedOccasion(null);
    setSelectedVibe(null);
    setMatchResult(null);
    setLiveUserTranscript('');
    setMinskiDialogue(DEFAULT_MINSKI_GREETING);
    setChatHistory([]);
    setViewTransitionKey((k) => k + 1);
  }, [cleanupAudio]);

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
      stopFallbackSpeech();
      if (!isMutedRef.current) {
        fallbackSpeechRef.current = speakMinskiVoice(result.shortVoiceSpeech);
      }
    }, 2800);

    craftingTimersRef.current = [t1];
  };

  const handleOrderResult = () => {
    if (!matchResult) return;
    onShowToastRef.current?.(`Membuka form pemesanan untuk ${matchResult.perfumeName}... ✨`);
    onNavigateToOrder({
      name: matchResult.perfumeName,
      category: matchResult.categoryLabel,
      pricePerMl: matchResult.pricePerMl,
    });
  };

  // Format durasi sesi suara MM:SS
  const formatSessionTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 1. Auto-cleanup saat berganti tab di menu utama website (Tips 1 Sesi Otomatis)
  useEffect(() => {
    if (!isActiveTab && isVoiceModeRef.current) {
      setIsVoiceMode(false);
      isVoiceModeRef.current = false;
      cleanupAudio();
      setSessionSeconds(0);
      setTimeout(() => {
        onShowToastRef.current?.('Sesi suara MinSKI dijeda otomatis saat berpindah menu (Hemat Kuota)');
      }, 0);
    }
  }, [isActiveTab, cleanupAudio]);

  // 2. Auto-pause saat layar HP terkunci atau browser diminimalkan (Page Visibility)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isVoiceModeRef.current) {
        setIsVoiceMode(false);
        isVoiceModeRef.current = false;
        cleanupAudio();
        setSessionSeconds(0);
        setTimeout(() => {
          onShowToastRef.current?.('Sesi suara MinSKI dijeda otomatis di latar belakang (Hemat Baterai & Kuota)');
        }, 0);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [cleanupAudio]);

  // 3. Auto-standby timer saat hening / inaktif atau batas durasi konsultasi
  useEffect(() => {
    if (!isVoiceMode) return;

    const interval = setInterval(() => {
      setSessionSeconds((prev) => {
        const next = prev + 1;
        const now = Date.now();
        const idleElapsedMs = now - lastActivityTimeRef.current;

        // Aturan A: Jika sudah ada rekomendasi resmi dan hening selama 40 detik
        if (hasDeliveredRecommendationRef.current && !isSpeakingRef.current && idleElapsedMs > 40000) {
          setIsVoiceMode(false);
          isVoiceModeRef.current = false;
          cleanupAudio();
          setTimeout(() => {
            onShowToastRef.current?.('Rekomendasi siap! Sesi suara dialihkan otomatis ke mode siap pesan ✨');
          }, 0);
          return next;
        }

        // Aturan B: Inactivity timeout (Hening / tidak ada interaksi selama 75 detik)
        if (!isSpeakingRef.current && idleElapsedMs > 75000) {
          setIsVoiceMode(false);
          isVoiceModeRef.current = false;
          cleanupAudio();
          setMinskiDialogue(
            'Sesi suara dijeda otomatis untuk menghemat kuota Kakak. Ketuk mikrofon kapan pun untuk mengobrol lagi ya!'
          );
          setTimeout(() => {
            onShowToastRef.current?.('Sesi suara MinSKI dijeda otomatis (Mode Hemat Kuota Aktif) ✨');
          }, 0);
          return next;
        }

        // Aturan C: Batas maksimal sesi berkelanjutan (300 detik = 5 menit)
        if (next >= 300) {
          setIsVoiceMode(false);
          isVoiceModeRef.current = false;
          cleanupAudio();
          setMinskiDialogue(
            'Sesi konsultasi 5 menit selesai Kak! MinSKI sudah menyimpan wangi pilihan Kakak. Ketuk mikrofon jika ingin konsultasi baru ya.'
          );
          setTimeout(() => {
            onShowToastRef.current?.('Sesi konsultasi 5 menit selesai (Mode Standby Aktif)');
          }, 0);
          return 300;
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cleanupAudio, isVoiceMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  // ==========================================
  // 1. TAMPILAN HASIL RACIK AROMA
  // ==========================================
  if (screenMode === 'result' && matchResult) {
    return (
      <div
        key={`step-result-${viewTransitionKey}`}
        className="relative w-full h-full flex flex-col overflow-y-auto no-scrollbar text-slate-100 sinki-screen-soft-fade select-none pb-24 sm:pb-28"
      >
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[#08080b] sinki-match-result-base" />
          <div
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-80 h-96 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at 50% 0%, var(--arch-glow-tl) 0%, var(--arch-glow-tl-mid) 45%, transparent 75%)',
            }}
          />
        </div>

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
              if (isSpeaking) handleBargeIn();
              setIsMuted((prev) => !prev);
              onShowToastRef.current?.(!isMuted ? 'Suara dinonaktifkan' : 'Suara aktif 🔊');
            }}
            className="p-1.5 rounded-[6px] sinki-arch-bar border border-[#DFB76C]/30 text-amber-200 hover:text-white transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX size={13} className="text-slate-400" /> : <Volume2 size={13} className="text-[#DFB76C]" />}
          </button>
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full px-4 my-auto">
          <div className="text-center mb-3 sm:mb-4 shrink-0">
            <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-white tracking-[-0.02em] leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
              {matchResult.perfumeName}
            </h2>
          </div>

          <div className="relative flex flex-col items-center justify-center w-full max-w-sm select-none cursor-pointer">
            <img
              src={matchResult.photoUrl}
              alt={matchResult.perfumeName}
              loading="eager"
              className="max-h-[250px] sm:max-h-[300px] w-auto max-w-[80%] sm:max-w-[74%] object-contain select-none filter drop-shadow-[0_16px_32px_rgba(0,0,0,0.85)] transition-transform duration-300 hover:scale-[1.02]"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = masterBottleTransparent || '/assets/sinki-master-flacon-transparent.png';
              }}
            />
            <div className="w-[48%] sm:w-[52%] h-[8px] bg-black/80 rounded-full blur-[4px] mt-1 pointer-events-none" />
            <div className="w-[62%] sm:w-[66%] h-[14px] bg-black/45 rounded-full blur-[8px] -mt-1.5 pointer-events-none" />
          </div>

          <div className="mt-4 sm:mt-5 max-w-xs mx-auto text-center shrink-0">
            <p className="font-body text-xs sm:text-[13px] text-amber-100/90 font-normal leading-[1.45] italic drop-shadow-sm px-2">
              “{matchResult.hypnoticScript}”
            </p>
          </div>

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
  // 2. TAMPILAN KUIS MANUAL 3 LANGKAH
  // ==========================================
  if (screenMode === 'manual') {
    return (
      <div className="relative w-full h-full flex flex-col sinki-arch-canvas text-slate-100 overflow-hidden sinki-screen-soft-fade">
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
  // 3. TAMPILAN UTAMA: REAL-TIME VOICE DUA ARAH (CHATGPT VOICE EXPERIENCE)
  // ==========================================
  return (
    <div className="relative w-full h-full flex flex-col sinki-arch-canvas text-slate-100 overflow-hidden sinki-screen-soft-fade">
      {/* Halo Background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#C5A059]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Bar */}
      <header className="relative z-20 w-full max-w-md mx-auto px-4 pt-3 pb-1 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isVoiceMode ? 'bg-emerald-400 animate-pulse' : 'bg-[#DFB76C]'}`} />
          <span className="font-heading text-xs font-bold tracking-[0.08em] text-[#DFB76C] uppercase">
            Racik Aroma · MinSKI
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {chatHistory.length > 0 && (
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="py-1 px-2 rounded-[5px] sinki-arch-bar border border-[#DFB76C]/30 text-[10px] text-amber-200 hover:text-white flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              title="Lihat Riwayat Konsultasi"
            >
              <History size={12} className="text-[#DFB76C]" />
              <span>{chatHistory.length}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (isSpeaking) handleBargeIn();
              setIsMuted((prev) => !prev);
              onShowToastRef.current?.(!isMuted ? 'Suara dinonaktifkan' : 'Suara aktif 🔊');
            }}
            className="p-1.5 rounded-[6px] sinki-arch-bar border border-[#DFB76C]/30 text-amber-200 hover:text-white transition-all cursor-pointer"
            title={isMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
          >
            {isMuted ? <VolumeX size={13} className="text-slate-400" /> : <Volume2 size={13} className="text-[#DFB76C]" />}
          </button>
        </div>
      </header>

      {/* Main Content: Avatar, Transkripsi, Kontrol Voice */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-2 pb-24 flex flex-col items-center justify-between max-w-md mx-auto w-full">
        {/* A. MinSKI Avatar (Bergerak Hidup, Ekspresif, Elegan dengan Efek Aura Suara) */}
        <div className="relative flex flex-col items-center justify-center pt-1 select-none shrink-0 w-full">
          {/* Animated Voice Halo di Belakang MinSKI saat bersuara */}
          {isSpeaking && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-56 sm:w-64 h-56 sm:h-64 rounded-full minski-voice-halo" />
          )}

          {/* Partikel Aroma Emas & Giok saat aktif konsultasi */}
          {(isSpeaking || isThinking) && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <span className="absolute top-6 left-[22%] w-1.5 h-1.5 rounded-full bg-amber-300 minski-particle minski-particle-1" />
              <span className="absolute top-12 right-[24%] w-2 h-2 rounded-full bg-emerald-300 minski-particle minski-particle-2" />
              <span className="absolute top-20 left-[26%] w-1.5 h-1.5 rounded-full bg-amber-200 minski-particle minski-particle-3" />
              <span className="absolute top-14 right-[28%] w-1.5 h-1.5 rounded-full bg-amber-400 minski-particle minski-particle-4" />
            </div>
          )}

          {/* Karakter MinSKI Bergerak Alami & Responsif */}
          <div
            className={`relative flex flex-col items-center transition-all duration-300 ${
              isSpeaking
                ? 'minski-speaking-active'
                : isThinking
                ? 'minski-thinking-active'
                : isListening
                ? 'minski-listening-active'
                : 'minski-float-anim'
            }`}
          >
            <img
              src="/assets/sinki_minski.png"
              alt="MinSKI"
              loading="eager"
              className={`h-[210px] sm:h-[235px] w-auto object-contain transition-all duration-300 ${
                isSpeaking
                  ? 'brightness-105'
                  : isThinking
                  ? 'brightness-100'
                  : 'brightness-95'
              }`}
            />
          </div>

          {/* Podium Elegan dengan Efek Interaktif */}
          <div
            className={`relative -mt-1 w-48 sm:w-52 py-1.5 px-3 rounded-[6px] minski-podium-box flex flex-col items-center justify-center text-center shadow-lg transition-all duration-300 ${
              isSpeaking
                ? 'border-[#DFB76C] shadow-[0_0_20px_rgba(223,183,108,0.35)]'
                : isListening
                ? 'border-emerald-400/60 shadow-[0_0_16px_rgba(16,185,129,0.25)]'
                : 'border-[#DFB76C]/40'
            }`}
          >
            <div className="absolute -top-[1px] inset-x-3 h-[1px] bg-gradient-to-r from-transparent via-[#DFB76C] to-transparent opacity-80" />
            <div className="flex items-center gap-1.5">
              <span className="font-heading text-[12px] sm:text-[13px] font-extrabold tracking-[0.16em] text-[#DFB76C] uppercase drop-shadow-sm">
                MINSKI
              </span>
              {isSpeaking && (
                <div className="flex items-end gap-[2px] h-3 ml-0.5">
                  <span className="w-[2px] bg-amber-400 rounded-full minski-eq-bar-1" />
                  <span className="w-[2px] bg-amber-300 rounded-full minski-eq-bar-2" />
                  <span className="w-[2px] bg-amber-400 rounded-full minski-eq-bar-3" />
                  <span className="w-[2px] bg-amber-200 rounded-full minski-eq-bar-4" />
                  <span className="w-[2px] bg-amber-300 rounded-full minski-eq-bar-5" />
                </div>
              )}
            </div>
            <span className="font-body text-[9px] text-amber-200/80 tracking-wider uppercase font-medium">
              {isSpeaking
                ? 'Sedang Menjelaskan Aroma'
                : isThinking
                ? 'Meracik Rekomendasi'
                : isListening
                ? 'Mendengarkan Ceritamu'
                : 'Konsultan Aroma Pribadi'}
            </span>
          </div>

          {/* Bubble Dialog / Transkripsi Penjelasan MinSKI (Tampil Elegan & Jelas) */}
          {minskiDialogue && (
            <div className="relative mt-2.5 w-full max-w-sm px-3.5 py-2 rounded-[10px] sinki-arch-bar border border-[#DFB76C]/35 backdrop-blur-md shadow-md text-center animate-fadeIn">
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-[#141920] border-t border-l border-[#DFB76C]/40" />
              <p className="font-body text-[11px] sm:text-xs leading-relaxed text-slate-200/95 italic">
                "{minskiDialogue}"
              </p>
            </div>
          )}

          {/* Notifikasi Barge-In */}
          {interruptedNotice && (
            <div className="mt-2 py-0.5 px-2.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-[10px] font-semibold text-amber-200 flex items-center gap-1.5 animate-pulse minski-bargein-flash">
              <Zap size={11} className="text-amber-300" />
              <span>MinSKI dipotong · Mendengarkan ucapan Kakak...</span>
            </div>
          )}

          {/* Indikator Status Suara Mengambang (Floating Live Audio Status) */}
          <div className="mt-2.5 flex flex-col items-center gap-1.5 min-h-[30px]">
            {isSpeaking ? (
              <div className="inline-flex items-center gap-2 py-1 px-3.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs font-semibold shadow-sm">
                <div className="flex items-end gap-[2px] h-3">
                  <span className="w-[2px] bg-emerald-400 rounded-full minski-eq-bar-1" />
                  <span className="w-[2px] bg-emerald-300 rounded-full minski-eq-bar-2" />
                  <span className="w-[2px] bg-emerald-400 rounded-full minski-eq-bar-3" />
                  <span className="w-[2px] bg-emerald-200 rounded-full minski-eq-bar-4" />
                </div>
                <span>MinSKI sedang berbicara</span>
                <button
                  type="button"
                  onClick={handleBargeIn}
                  className="ml-1 text-[10px] text-amber-300 hover:text-white underline font-bold cursor-pointer"
                >
                  Potong
                </button>
              </div>
            ) : isListening ? (
              <div className="inline-flex items-center gap-1.5 py-1 px-3.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs font-semibold animate-pulse shadow-sm">
                <Mic size={13} className="text-emerald-400" />
                <span>{liveUserTranscript ? `"${liveUserTranscript}"` : 'Mendengarkan ucapanmu...'}</span>
              </div>
            ) : isThinking ? (
              <div className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-medium">
                <Sparkles size={12} className="animate-spin text-amber-300" />
                <span>Meracik aroma karaktermu...</span>
              </div>
            ) : isVoiceMode ? (
              <div className="inline-flex items-center gap-1.5 py-0.5 px-3 rounded-full bg-emerald-500/10 border border-emerald-400/25 text-[10px] text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Sesi Suara Aktif · {formatSessionTime(sessionSeconds)}</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* B. Area Rekomendasi (Muncul Elegan Saat Siap) & Kontrol Bawah */}
        <div className="w-full shrink-0 space-y-3 pt-2">
          {/* Kartu Rekomendasi Parfum SINKI */}
          {matchResult && (
            <div className="p-2.5 sm:p-3 rounded-[10px] sinki-arch-bar border border-[#DFB76C]/60 flex items-center justify-between gap-3 shadow-[0_8px_24px_rgba(0,0,0,0.7)] animate-fadeIn">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-11 h-11 rounded-[8px] bg-black/60 border border-[#DFB76C]/40 flex items-center justify-center p-1 shrink-0">
                  <img
                    src={matchResult.photoUrl}
                    alt={matchResult.perfumeName}
                    className="max-h-full max-w-full object-contain drop-shadow"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-[#DFB76C] uppercase tracking-wider block">
                    ✨ Racikan Rekomendasi
                  </span>
                  <h4 className="font-heading text-xs sm:text-[13px] font-bold text-white truncate">
                    {matchResult.perfumeName}
                  </h4>
                  <p className="text-[10px] text-slate-300 truncate">
                    {matchResult.categoryLabel}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleBargeIn();
                  setScreenMode('result');
                }}
                className="py-1.5 px-3.5 rounded-[8px] champagne-gold-btn text-slate-950 text-[11px] font-bold shrink-0 shadow-md active:scale-95 transition-all flex items-center gap-1 cursor-pointer hover:brightness-105"
              >
                <span>Lihat Botol</span>
                <ChevronRight size={13} />
              </button>
            </div>
          )}

          {/* Tombol Utama Suara (Ganti Kotak Kapsul) */}
          <div className="w-full">
            <button
              type="button"
              onClick={toggleVoiceMode}
              className={`w-full py-3 px-5 rounded-[12px] flex items-center justify-center gap-2 text-xs sm:text-[13px] font-bold tracking-wide transition-all duration-300 cursor-pointer shadow-lg active:scale-98 ${
                isVoiceMode
                  ? 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-400/80 shadow-[0_0_22px_rgba(225,29,72,0.45)]'
                  : 'champagne-gold-btn text-slate-950 shadow-[0_4px_18px_rgba(197,160,89,0.35)] hover:brightness-105'
              }`}
            >
              {isVoiceMode ? (
                <>
                  <MicOff size={16} className="text-white" />
                  <span>Akhiri Konsultasi Suara</span>
                </>
              ) : (
                <>
                  <Mic size={16} className="text-slate-950" />
                  <span>Bicara Langsung dengan MinSKI</span>
                </>
              )}
            </button>
          </div>

          {/* Bar Teks Input (Dipertahankan & Ditata Rapi) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendTextMessage(typedMessage);
            }}
            className={`w-full flex items-center gap-2 p-1.5 rounded-[10px] sinki-arch-input border ${
              micDenied ? 'border-amber-400/80 shadow-[0_0_12px_rgba(223,183,108,0.25)]' : 'border-[#DFB76C]/30'
            } backdrop-blur-md`}
          >
            <input
              type="text"
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              placeholder="Ketik wangi impianmu ke MinSKI..."
              className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!typedMessage.trim() || isThinking}
              className="p-2 rounded-[8px] bg-[#DFB76C] text-slate-950 hover:bg-[#F0DFB6] disabled:opacity-40 transition-all cursor-pointer shrink-0"
              title="Kirim ke MinSKI"
            >
              <Send size={14} />
            </button>
          </form>

          {/* Opsi Kuis Manual 3 Langkah */}
          <div className="text-center pt-0.5">
            <button
              type="button"
              onClick={() => {
                cleanupAudio();
                setScreenMode('manual');
                setManualStep(1);
              }}
              className="font-body text-[11px] text-slate-400 hover:text-[#DFB76C] transition-colors cursor-pointer"
            >
              Atau racik manual lewat kuis 3 langkah →
            </button>
          </div>
        </div>
      </div>

      {/* Modal Riwayat Konsultasi */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md h-[80vh] max-h-[560px] rounded-[14px] sinki-arch-modal border border-[#DFB76C]/40 flex flex-col overflow-hidden shadow-2xl">
            <div className="p-3.5 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#0d1015]">
              <div className="flex items-center gap-2">
                <History size={16} className="text-[#DFB76C]" />
                <h3 className="font-heading text-sm font-bold text-white">
                  Riwayat Konsultasi MinSKI
                </h3>
                <span className="text-[10px] py-0.5 px-2 rounded-full bg-[#DFB76C]/20 text-amber-200 font-semibold">
                  {chatHistory.length} pesan
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="p-1.5 rounded-[6px] text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 space-y-3">
              {chatHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Belum ada percakapan. Mulai bicara atau ketik pesan sekarang!
                </div>
              ) : (
                chatHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${item.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[10px] font-bold text-[#DFB76C]">
                        {item.sender === 'user' ? 'Kakak' : 'MinSKI'}
                      </span>
                      {item.time && (
                        <span className="text-[9px] text-slate-500 font-mono">{item.time}</span>
                      )}
                    </div>
                    <div
                      className={`max-w-[85%] p-2.5 rounded-[10px] text-xs leading-relaxed ${
                        item.sender === 'user'
                          ? 'bg-[#DFB76C]/20 border border-[#DFB76C]/40 text-slate-100 rounded-br-none'
                          : 'sinki-arch-card border border-white/10 text-slate-200 rounded-bl-none italic'
                      }`}
                    >
                      {item.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-2.5 border-t border-white/10 bg-[#0d1015] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="py-1.5 px-4 rounded-[6px] champagne-gold-btn text-slate-950 text-xs font-bold shadow-md cursor-pointer"
              >
                Tutup Riwayat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
