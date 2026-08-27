import React, { useState, useRef, useEffect } from 'react';
import { User, Bell, Check, TrendingUp, TrendingDown, Info, Settings } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';

export function Navbar({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { t } = useLanguage();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-card-border">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <button onClick={() => onNavigate('landing')} className="text-2xl font-bold text-white tracking-tighter">
          Kisan<span className="text-primary">Setu</span>
        </button>
        <div className="flex items-center gap-8 text-sm font-medium text-gray-400">
          <button onClick={() => onNavigate('upload')} className="hover:text-white transition-colors text-primary font-bold">Scan Crop</button>
          <button onClick={() => onNavigate('history')} className="hover:text-white transition-colors">{t('history')}</button>
          <button onClick={() => onNavigate('guidance')} className="hover:text-white transition-colors">Guidance</button>
          <button onClick={() => onNavigate('insights')} className="hover:text-white transition-colors">{t('marketInsights')}</button>
          <button onClick={() => onNavigate('compare')} className="hover:text-white transition-colors">{t('compareCrops')}</button>
          
          {/* Notifications Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)} 
              className="relative hover:text-white transition-colors flex items-center justify-center"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-background">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-4 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
                    <h3 className="text-white font-bold">{t('notifications')}</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-xs text-primary hover:text-primary-light flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Mark all read
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 text-sm">
                        No notifications yet.
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {notifications.map(notif => (
                          <div 
                            key={notif.id} 
                            onClick={() => !notif.read && markAsRead(notif.id)}
                            className={`p-4 border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors cursor-pointer flex gap-3 ${!notif.read ? 'bg-gray-800/20' : 'opacity-70'}`}
                          >
                            <div className={`mt-0.5 shrink-0 ${
                              notif.type === 'success' ? 'text-green-500' : 
                              notif.type === 'alert' ? 'text-red-500' : 'text-blue-500'
                            }`}>
                              {notif.type === 'success' ? <TrendingUp className="w-4 h-4" /> : 
                               notif.type === 'alert' ? <TrendingDown className="w-4 h-4" /> : 
                               <Info className="w-4 h-4" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className={`text-sm font-medium ${!notif.read ? 'text-white' : 'text-gray-300'}`}>
                                  {notif.title}
                                </h4>
                                {!notif.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                              </div>
                              <p className="text-xs text-gray-400 line-clamp-2 mb-2">{notif.message}</p>
                              <p className="text-[10px] text-gray-500">
                                {notif.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={() => onNavigate('settings')} className="hover:text-white transition-colors">
            <Settings className="w-6 h-6" />
          </button>
          <button onClick={() => onNavigate('profile')} className="hover:text-white transition-colors">
            <User className="w-6 h-6" />
          </button>
        </div>
      </div>
    </nav>
  );
}
