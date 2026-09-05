import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share, PlusSquare, X, CheckCircle2, Smartphone } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'footer' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header',
}) => {
  const { canInstall, isInstallableDirectly, isInstalled, isIOS, installApp } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If already installed as PWA on device, hide button or show installed status
  if (isInstalled) {
    if (variant === 'header') {
      return (
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 border-2 border-black text-emerald-900 text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>APP INSTALLED</span>
        </div>
      );
    }
    return null;
  }

  const handleClick = async () => {
    if (isInstallableDirectly) {
      await installApp();
    } else {
      // Show guided instructions (e.g. for iOS or browser instructions)
      setShowIOSModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-black transition border-3 border-[#1A1A1A] cursor-pointer shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)] active:translate-y-1 active:shadow-none bg-[#06D6A0] text-[#1A1A1A] hover:bg-[#05be8d] ${className}`}
        title="Install this website as an App on your phone"
      >
        <Download className="w-4 h-4 stroke-[2.5]" />
        <span className="hidden sm:inline">GET AS APP</span>
        <span className="sm:hidden">APP</span>
      </button>

      {/* iOS / Browser Guided Install Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative animate-in zoom-in-95">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 border-2 border-black transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-[#FFD166] border-3 border-black flex items-center justify-center mx-auto text-[#1A1A1A] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Smartphone className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-[#FF5A5F]">
                EASY 1-STEP INSTALL
              </span>
              <h3 className="text-2xl font-black text-[#1A1A1A] italic">
                INSTALL TO YOUR HOME SCREEN
              </h3>
              <p className="text-xs font-bold text-neutral-600">
                Play in full-screen without app store downloads or logins!
              </p>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="bg-[#FFF9F2] p-4 rounded-2xl border-2 border-black space-y-3 text-left">
              {isIOS ? (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-[#118AB2] text-white flex items-center justify-center font-black text-xs shrink-0 border border-black">
                      1
                    </div>
                    <p className="text-xs font-bold text-[#1A1A1A]">
                      Tap the <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-200 border border-black"><Share className="w-3 h-3" /> Share</span> button at the bottom of Safari.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-[#118AB2] text-white flex items-center justify-center font-black text-xs shrink-0 border border-black">
                      2
                    </div>
                    <p className="text-xs font-bold text-[#1A1A1A]">
                      Scroll down and tap <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-200 border border-black"><PlusSquare className="w-3 h-3" /> Add to Home Screen</span>.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-[#06D6A0] text-[#1A1A1A] flex items-center justify-center font-black text-xs shrink-0 border border-black">
                      3
                    </div>
                    <p className="text-xs font-bold text-[#1A1A1A]">
                      Tap <strong>Add</strong> in the top corner. Now TablePlay is on your phone!
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-[#118AB2] text-white flex items-center justify-center font-black text-xs shrink-0 border border-black">
                      1
                    </div>
                    <p className="text-xs font-bold text-[#1A1A1A]">
                      Open your browser menu (tap the three dots <span className="font-mono">⋮</span> in top or bottom corner).
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-[#06D6A0] text-[#1A1A1A] flex items-center justify-center font-black text-xs shrink-0 border border-black">
                      2
                    </div>
                    <p className="text-xs font-bold text-[#1A1A1A]">
                      Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                    </p>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-3.5 rounded-2xl bg-[#FF5A5F] hover:bg-[#e04348] text-white font-black text-xs border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition cursor-pointer"
            >
              GOT IT, THANKS!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
