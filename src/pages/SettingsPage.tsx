import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Shield, Bell, Globe, Lock, Info, FileText, Check, LogOut, User, Eye, EyeOff } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useLanguage, languageOptions, Language } from '../contexts/LanguageContext';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '../components/ui/Button';

type SettingsTab = 'main' | 'language' | 'notifications' | 'security' | 'privacy' | 'about';

export function SettingsPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<SettingsTab>('main');
  const [showPassword, setShowPassword] = useState(false);

  const currentLanguageName = languageOptions.find(l => l.code === language)?.nativeName || 'English';

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onNavigate('landing');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    // Simulate refresh and redirect
    setTimeout(() => {
      setActiveTab('main');
      window.location.reload();
    }, 500);
  };

  const renderSubPage = () => {
    switch (activeTab) {
      case 'language':
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setActiveTab('main')} className="p-2 rounded-full bg-white/5 text-gray-400 hover:text-white">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black text-white">{t('language')}</h2>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {languageOptions.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code as Language)}
                  className={`flex items-center justify-between p-5 rounded-2xl transition-all border ${
                    language === lang.code 
                      ? 'bg-primary/10 border-primary/30 text-primary' 
                      : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/10'
                  }`}
                >
                  <div className="flex flex-col items-start">
                    <span className="text-lg font-bold">{lang.nativeName}</span>
                    <span className="text-[10px] uppercase tracking-widest opacity-60">{lang.name}</span>
                  </div>
                  {language === lang.code && <Check className="w-6 h-6" />}
                </button>
              ))}
            </div>
          </motion.div>
        );

      case 'notifications':
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setActiveTab('main')} className="p-2 rounded-full bg-white/5 text-gray-400 hover:text-white">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black text-white">{t('notifications')}</h2>
            </div>
            <Card className="p-6 bg-zinc-900/50 border-white/5 space-y-6">
              {[
                { label: "Price Alerts", desc: "Get notified when crop prices change significantly" },
                { label: "Disease Outbreaks", desc: "Alerts for known diseases in your region" },
                { label: "Weather Warnings", desc: "Extreme weather alerts for your farm location" },
                { label: "App Updates", desc: "New features and improvements" }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-bold text-sm">{item.label}</h4>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <div className="w-12 h-6 bg-primary/20 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-primary rounded-full" />
                  </div>
                </div>
              ))}
            </Card>
          </motion.div>
        );

      case 'security':
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setActiveTab('main')} className="p-2 rounded-full bg-white/5 text-gray-400 hover:text-white">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black text-white">{t('security')}</h2>
            </div>
            <Card className="p-6 bg-zinc-900/50 border-white/5 space-y-8">
              <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">Login Credentials</h4>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Email Address</p>
                      <p className="text-white font-medium">{auth.currentUser?.email}</p>
                    </div>
                    <Button variant="outline" className="text-[10px] h-8">Change</Button>
                  </div>
                  <div className="p-4 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Password</p>
                      <p className="text-white font-medium">••••••••••••</p>
                    </div>
                    <Button variant="outline" className="text-[10px] h-8">Reset</Button>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">Two-Factor Authentication</h4>
                <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-sm text-white font-medium">Enable 2FA for extra security</p>
                  <div className="w-12 h-6 bg-white/10 rounded-full relative cursor-pointer">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-gray-500 rounded-full" />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        );

      case 'privacy':
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setActiveTab('main')} className="p-2 rounded-full bg-white/5 text-gray-400 hover:text-white">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black text-white">{t('privacy')}</h2>
            </div>
            <Card className="p-6 bg-zinc-900/50 border-white/5 space-y-6">
              {[
                { label: "Data Sharing", desc: "Allow sharing anonymized data for research" },
                { label: "Location Services", desc: "Use GPS for precise market and weather data" },
                { label: "Profile Visibility", desc: "Make your profile visible to other farmers" },
                { label: "AI Training", desc: "Allow your feedback to improve our AI models" }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-bold text-sm">{item.label}</h4>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <div className="w-12 h-6 bg-primary/20 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-primary rounded-full" />
                  </div>
                </div>
              ))}
              <div className="pt-6 border-t border-white/5">
                <Button variant="outline" className="w-full text-red-400 border-red-500/30 hover:bg-red-500/10">
                  Delete Account & Data
                </Button>
              </div>
            </Card>
          </motion.div>
        );

      case 'about':
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setActiveTab('main')} className="p-2 rounded-full bg-white/5 text-gray-400 hover:text-white">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black text-white">{t('about')}</h2>
            </div>
            <Card className="p-8 bg-zinc-900/50 border-white/5 text-center">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6 border border-primary/20">
                <Leaf className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-3xl font-black text-white mb-2">KisanSetu</h3>
              <p className="text-primary font-bold text-xs uppercase tracking-widest mb-6">Version 1.2.0</p>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                KisanSetu is India's premier AI-powered agricultural companion. Our mission is to empower farmers with real-time intelligence, deep diagnostics, and data-driven insights to ensure a prosperous and sustainable future for Indian agriculture.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Farmers Served</p>
                  <p className="text-xl font-black text-white">50,000+</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">AI Accuracy</p>
                  <p className="text-xl font-black text-white">94.8%</p>
                </div>
              </div>
            </Card>
          </motion.div>
        );

      default:
        return (
          <div className="space-y-10">
            {[
              {
                title: "Account & Security",
                items: [
                  { icon: Lock, label: t('privacy'), description: "Manage your data and visibility", action: () => setActiveTab('privacy') },
                  { icon: Shield, label: t('security'), description: "Two-factor authentication & login history", action: () => setActiveTab('security') }
                ]
              },
              {
                title: "Preferences",
                items: [
                  { icon: Bell, label: t('notifications'), description: "Alerts for price drops & disease outbreaks", action: () => setActiveTab('notifications') },
                  { 
                    icon: Globe, 
                    label: t('language'), 
                    description: `Current: ${currentLanguageName}`,
                    action: () => setActiveTab('language')
                  }
                ]
              },
              {
                title: "Legal & About",
                items: [
                  { icon: FileText, label: "Terms & Conditions", description: "Read our usage terms", action: () => onNavigate('terms') },
                  { icon: Info, label: t('about'), description: "Version 1.2.0 - Made with ❤️ in India", action: () => setActiveTab('about') }
                ]
              }
            ].map((group, i) => (
              <div key={i} className="space-y-4">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">
                  {group.title}
                </h3>
                <div className="space-y-3">
                  {group.items.map((item, j) => (
                    <Card 
                      key={j} 
                      className="p-4 bg-zinc-900/50 border-white/5 hover:border-primary/30 transition-all cursor-pointer group"
                      onClick={item.action}
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-white/5 text-gray-400 group-hover:text-primary transition-colors">
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-bold text-sm">{item.label}</h4>
                          <p className="text-xs text-gray-500">{item.description}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}

            <div className="pt-6">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold hover:bg-red-500/20 transition-all group"
              >
                <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                {t('signOut')}
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {activeTab === 'main' && (
          <>
            <button
              onClick={() => onNavigate('profile')}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Profile
            </button>
            <h1 className="text-4xl font-bold text-white mb-10">{t('settings')}</h1>
          </>
        )}

        {renderSubPage()}

        <div className="mt-12 pt-8 border-t border-white/5 text-center">
          <p className="text-xs text-gray-600 font-medium">
            © 2026 KisanSetu Agricultural Solutions Pvt. Ltd.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

const Leaf = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8a7 7 0 0 1-7 7c-1.18 0-2.31-.3-3.3-.83" />
    <path d="M11 20c0-2.5 2-5 5-5" />
    <path d="M11 20c-2.5 0-5-2-5-5" />
    <path d="M11 20l-5-5" />
    <path d="M11 20l5-5" />
  </svg>
);