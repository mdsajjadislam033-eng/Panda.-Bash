import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Language } from '../types/game';

export const PWAInstallButton: React.FC<{ lang: Language }> = ({ lang }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-bold text-slate-900 shadow-md hover:bg-amber-300 active:scale-95 transition whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="w-4 h-4" />
        {lang === 'bn' ? 'অ্যাপ ইনস্টল' : 'Install App'}
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-xs font-bold text-emerald-900 shadow-sm hover:bg-white transition whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          {lang === 'bn' ? 'আইফোনে ইনস্টল' : 'Install iOS'}
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-slate-900">
              <h3 className="text-lg font-bold">
                {lang === 'bn' ? 'আইফোন / আইপ্যাডে ইনস্টল' : 'Install on iPhone / iPad'}
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {lang === 'bn' ? (
                  <>
                    ১. সাফারি ব্রাউজারে <strong>Share</strong> বাটনে ট্যাপ করুন।<br />
                    ২. নিচে গিয়ে <strong>Add to Home Screen</strong> সিলেক্ট করুন।
                  </>
                ) : (
                  <>
                    1. Tap the <strong>Share</strong> button in Safari toolbar.<br />
                    2. Scroll down and tap <strong>Add to Home Screen</strong>.
                  </>
                )}
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 cursor-pointer"
              >
                {lang === 'bn' ? 'ঠিক আছে' : 'Got it'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC<{ lang: Language }> = ({ lang }) => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-3 left-3 z-50 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-lg">
      {lang === 'bn' ? 'অফলাইন মোড — ক্যাশ করা ডেটা চলছে' : 'Offline Mode — Cached game active'}
    </div>
  );
};
