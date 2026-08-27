import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, AlertCircle, Wifi } from 'lucide-react';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showOnlineMsg, setShowOnlineMsg] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowOnlineMsg(true);
      setTimeout(() => setShowOnlineMsg(false), 3000);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setShowOnlineMsg(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-md"
          >
            <div className="bg-red-500/10 backdrop-blur-md border border-red-500/50 rounded-2xl p-4 flex items-center gap-4 shadow-2xl shadow-red-500/20">
              <div className="p-2 bg-red-500 rounded-full text-white">
                <WifiOff className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-bold text-sm">Offline Mode</h4>
                <p className="text-red-200/70 text-xs">Using local data. AI features will resume when you reconnect.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOnlineMsg && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-md"
          >
            <div className="bg-primary/10 backdrop-blur-md border border-primary/50 rounded-2xl p-4 flex items-center gap-4 shadow-2xl shadow-primary/20">
              <div className="p-2 bg-primary rounded-full text-black">
                <Wifi className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-bold text-sm">Back Online</h4>
                <p className="text-primary/70 text-xs">AI features are now fully available. Data synced.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function OfflineAlert({ message = "This feature requires an internet connection." }: { message?: string }) {
  return (
    <div className="p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-3xl flex flex-col items-center text-center gap-4">
      <div className="p-4 bg-yellow-500/20 rounded-full text-yellow-500">
        <AlertCircle className="w-8 h-8" />
      </div>
      <div>
        <h3 className="text-white font-bold text-lg mb-2">Internet Required</h3>
        <p className="text-gray-400 text-sm max-w-xs">{message}</p>
      </div>
      <button 
        onClick={() => window.location.reload()}
        className="px-6 py-2 bg-yellow-500 text-black rounded-full font-bold text-sm hover:bg-yellow-400 transition-colors"
      >
        Retry Connection
      </button>
    </div>
  );
}
