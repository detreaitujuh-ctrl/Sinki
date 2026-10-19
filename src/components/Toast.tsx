import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed top-5 inset-x-0 z-50 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="pointer-events-auto max-w-sm w-full p-3 rounded-2xl bg-[#14161f]/95 backdrop-blur-xl border border-white/15 text-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.85)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-[#DFB76C]/20 text-[#DFB76C] flex items-center justify-center shrink-0">
            <CheckCircle2 size={16} />
          </div>
          <p className="text-xs font-medium text-slate-100">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
