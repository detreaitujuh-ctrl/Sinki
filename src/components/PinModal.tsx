import React, { useState, useEffect } from 'react';
import { Lock, X, AlertCircle, Check } from 'lucide-react';
import { verifyOwnerPinOnServer } from '../utils/assetStorage';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onShowToast: (msg: string) => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onShowToast,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const validatePin = async (inputPin: string) => {
    const trimmed = inputPin.trim();
    if (!trimmed || isVerifying) return;
    setIsVerifying(true);
    try {
      const res = await verifyOwnerPinOnServer(trimmed);
      if (res.success) {
        onShowToast('Akses Pemilik Berhasil! Membuka Panel...');
        onSuccess();
        setPin('');
        setError(false);
      } else {
        setError(true);
        onShowToast(res.error || 'PIN Pemilik salah! Silakan coba lagi.');
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 1200);
      }
    } catch {
      setError(true);
      onShowToast('Gagal terhubung ke server verifikasi PIN.');
      setTimeout(() => {
        setPin('');
        setError(false);
      }, 1200);
    } finally {
      setIsVerifying(false);
    }
  };

  // Keyboard support: Allow typing 4-12 character PIN with physical keyboard (PC/laptop)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (pin.length >= 4) {
          validatePin(pin);
        }
      } else if (e.key === 'Backspace') {
        setPin((prev) => prev.slice(0, -1));
        setError(false);
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setPin((prev) => (prev.length < 12 ? prev + e.key : prev));
        setError(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin, isVerifying]);

  if (!isOpen) return null;

  const handleNumberClick = (digit: string) => {
    if (pin.length < 12 && !isVerifying) {
      setPin((prev) => prev + digit);
      setError(false);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const dotCount = Math.max(4, pin.length);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xs rounded-3xl bg-gradient-to-b from-[#1e2235] to-[#141624] border border-white/15 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.85)] space-y-4 text-center">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-[#DFB76C]">
            <Lock size={16} />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#DFB76C]">
            Pintu Rahasia Pemilik
          </span>
          <button
            onClick={() => {
              setPin('');
              setError(false);
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Instructions */}
        <div>
          <h4 className="text-sm font-bold text-white tracking-wide">
            Masukkan PIN Pemilik
          </h4>
          <p className="text-[10px] text-slate-400 mt-1">
            Ketik PIN (4–12 digit) lalu tekan Masuk atau Enter
          </p>
        </div>

        {/* PIN Dots Display */}
        <div className="flex flex-wrap justify-center items-center gap-2 py-2 min-h-[32px]">
          {Array.from({ length: dotCount }).map((_, index) => {
            const isFilled = index < pin.length;
            return (
              <div
                key={index}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  error
                    ? 'bg-red-500 scale-110 shadow-[0_0_8px_rgba(239,68,68,0.7)]'
                    : isFilled
                    ? 'bg-[#DFB76C] scale-110 shadow-[0_0_12px_rgba(223,183,108,0.6)]'
                    : 'bg-white/15 border border-white/20'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-[11px] text-red-400 flex items-center justify-center gap-1 font-medium animate-bounce">
            <AlertCircle size={13} /> PIN Salah! Silakan coba lagi
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleNumberClick(digit)}
              disabled={isVerifying}
              className="py-3 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-[#DFB76C] active:text-slate-950 active:scale-95 border border-white/10 hover:border-[#DFB76C]/40 text-white font-display font-bold text-lg transition-all disabled:opacity-50"
            >
              {digit}
            </button>
          ))}
          <button
            onClick={handleDelete}
            disabled={isVerifying}
            className="py-3 rounded-2xl bg-white/5 hover:bg-red-500/25 active:scale-95 border border-white/10 hover:border-red-500/40 text-slate-300 font-medium text-xs transition-all flex items-center justify-center disabled:opacity-50"
          >
            Hapus
          </button>
          <button
            onClick={() => handleNumberClick('0')}
            disabled={isVerifying}
            className="py-3 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-[#DFB76C] active:text-slate-950 active:scale-95 border border-white/10 hover:border-[#DFB76C]/40 text-white font-display font-bold text-lg transition-all disabled:opacity-50"
          >
            0
          </button>
          <button
            onClick={() => validatePin(pin)}
            disabled={pin.length < 4 || isVerifying}
            className="py-3 rounded-2xl bg-gradient-to-r from-[#DFB76C] to-[#A07C3A] text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1 active:scale-95 disabled:opacity-35"
          >
            <Check size={14} />
            <span>{isVerifying ? '...' : 'Masuk'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
