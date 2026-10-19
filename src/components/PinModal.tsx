import React, { useState, useEffect } from 'react';
import { Lock, X, KeyRound, AlertCircle } from 'lucide-react';
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

  // Keyboard support: Allow typing 1995 with physical keyboard (PC/laptop)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        setPin((prev) => {
          if (prev.length < 4) {
            const next = prev + e.key;
            if (next.length === 4) {
              validatePin(next);
            }
            return next;
          }
          return prev;
        });
        setError(false);
      } else if (e.key === 'Backspace') {
        setPin((prev) => prev.slice(0, -1));
        setError(false);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNumberClick = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);
      if (nextPin.length === 4) {
        validatePin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const validatePin = async (inputPin: string) => {
    try {
      const res = await verifyOwnerPinOnServer(inputPin);
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
      if (inputPin === '1995') {
        onShowToast('Akses Pemilik Berhasil! Membuka Panel...');
        onSuccess();
        setPin('');
        setError(false);
      } else {
        setError(true);
        onShowToast('PIN Pemilik salah! Silakan coba lagi.');
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 1200);
      }
    }
  };

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
            Gunakan tombol angka di bawah atau ketik di keyboard
          </p>
        </div>

        {/* PIN Dots Display */}
        <div className="flex justify-center items-center gap-3 py-2">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = index < pin.length;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
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
              className="py-3 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-[#DFB76C] active:text-slate-950 active:scale-95 border border-white/10 hover:border-[#DFB76C]/40 text-white font-display font-bold text-lg transition-all"
            >
              {digit}
            </button>
          ))}
          <div className="flex items-center justify-center text-slate-500">
            <KeyRound size={18} />
          </div>
          <button
            onClick={() => handleNumberClick('0')}
            className="py-3 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-[#DFB76C] active:text-slate-950 active:scale-95 border border-white/10 hover:border-[#DFB76C]/40 text-white font-display font-bold text-lg transition-all"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="py-3 rounded-2xl bg-white/5 hover:bg-red-500/25 active:scale-95 border border-white/10 hover:border-red-500/40 text-slate-300 font-medium text-xs transition-all flex items-center justify-center"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
};
