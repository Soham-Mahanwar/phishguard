import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, TrendingUp, TrendingDown, Info } from 'lucide-react';

export type NotificationType = 'alert' | 'info' | 'success';

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: Date;
  read: boolean;
  type: NotificationType;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (n: Omit<Notification, 'id' | 'time' | 'read'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Market Alert: Wheat',
      message: 'Wheat prices have surged by 5% in your region.',
      time: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
      read: false,
      type: 'success'
    },
    {
      id: '2',
      title: 'Weather Warning',
      message: 'Heavy rainfall expected in the next 48 hours. Protect harvested crops.',
      time: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
      read: true,
      type: 'alert'
    }
  ]);

  const [activeToasts, setActiveToasts] = useState<Notification[]>([]);

  // Simulate incoming real-time notifications
  useEffect(() => {
    const timer = setInterval(() => {
      const crops = ['Tomato', 'Onion', 'Potato', 'Cotton', 'Soybean', 'Rice'];
      const randomCrop = crops[Math.floor(Math.random() * crops.length)];
      const isUp = Math.random() > 0.5;
      const percentage = (Math.random() * 8 + 1).toFixed(1);

      const newNotif: Notification = {
        id: Date.now().toString(),
        title: `Price Update: ${randomCrop}`,
        message: `${randomCrop} prices have ${isUp ? 'increased' : 'dropped'} by ${percentage}% in the last hour.`,
        time: new Date(),
        read: false,
        type: isUp ? 'success' : 'alert'
      };

      setNotifications(prev => [newNotif, ...prev]);
      
      // Add to toasts
      setActiveToasts(prev => [...prev, newNotif]);
      
      // Auto-remove toast after 5 seconds
      setTimeout(() => {
        setActiveToasts(prev => prev.filter(t => t.id !== newNotif.id));
      }, 5000);

    }, 45000); // Trigger a new notification every 45 seconds

    return () => clearInterval(timer);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'time' | 'read'>) => {
    const newNotif: Notification = {
      ...n,
      id: Date.now().toString(),
      time: new Date(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
    
    setActiveToasts(prev => [...prev, newNotif]);
    setTimeout(() => {
      setActiveToasts(prev => prev.filter(t => t.id !== newNotif.id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setActiveToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, addNotification }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-24 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {activeToasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="pointer-events-auto w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4 flex gap-3 relative overflow-hidden"
            >
              <div className={`w-1 absolute left-0 top-0 bottom-0 ${
                toast.type === 'success' ? 'bg-green-500' : 
                toast.type === 'alert' ? 'bg-red-500' : 'bg-blue-500'
              }`} />
              
              <div className={`mt-0.5 shrink-0 ${
                toast.type === 'success' ? 'text-green-500' : 
                toast.type === 'alert' ? 'text-red-500' : 'text-blue-500'
              }`}>
                {toast.type === 'success' ? <TrendingUp className="w-5 h-5" /> : 
                 toast.type === 'alert' ? <TrendingDown className="w-5 h-5" /> : 
                 <Info className="w-5 h-5" />}
              </div>
              
              <div className="flex-1 pr-4">
                <h4 className="text-white font-bold text-sm mb-1">{toast.title}</h4>
                <p className="text-gray-400 text-xs leading-relaxed">{toast.message}</p>
              </div>
              
              <button 
                onClick={() => removeToast(toast.id)}
                className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};
