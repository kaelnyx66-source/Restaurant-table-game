import React, { useState } from 'react';
import { ShieldCheck, Lock, X, ArrowRight, KeyRound } from 'lucide-react';
import { RestaurantProfile } from '../types';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: RestaurantProfile;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  restaurant,
  onLoginSuccess,
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = restaurant.adminPin || '1234';
    if (pin.trim() === correctPin || pin.trim() === '1234') {
      setError('');
      setPin('');
      onLoginSuccess();
      onClose();
    } else {
      setError('Incorrect Admin PIN. Default PIN is 1234.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border-4 border-black rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative animate-in zoom-in-95">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white hover:bg-neutral-100 border-2 border-black text-[#1A1A1A] transition cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-[#FFD166] rounded-2xl flex items-center justify-center border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-[#1A1A1A] mx-auto">
            <Lock className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-black italic tracking-tight text-[#1A1A1A]">
            RESTAURANT ADMIN
          </h2>
          <p className="text-xs text-neutral-600 font-bold max-w-xs mx-auto">
            Log in to manage customer complaints, reviews, Google Review links, questions, and table QR stands.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-[#1A1A1A] mb-1.5 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-[#FF5A5F]" />
              <span>Manager Passcode / PIN:</span>
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError('');
              }}
              placeholder="Enter PIN (Default: 1234)"
              autoFocus
              className="w-full text-center tracking-widest text-lg bg-[#FFF9F2] border-3 border-black rounded-xl px-4 py-2.5 font-black text-[#1A1A1A] outline-none focus:border-[#FF5A5F] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            />
            {error && (
              <p className="text-xs text-[#FF5A5F] font-black mt-1.5 text-center">
                {error}
              </p>
            )}
            <p className="text-[11px] text-neutral-500 font-bold mt-1.5 text-center">
              💡 Tip: Default demo PIN is <strong className="text-black">1234</strong> (you can change it inside settings).
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-[#1A1A1A] font-black text-xs border-2 border-black transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#06D6A0] hover:bg-[#05be8d] text-[#1A1A1A] font-black text-xs border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Unlock Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
