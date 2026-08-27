import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { languageOptions, useLanguage, Language } from '../contexts/LanguageContext';
import { Button } from './ui/Button';
import { Leaf, ChevronRight, Globe } from 'lucide-react';

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<'hello' | 'intro'>('hello');
  const [helloIndex, setHelloIndex] = useState(0);
  const { setLanguage, t } = useLanguage();

  useEffect(() => {
    if (step === 'hello') {
      const interval = setInterval(() => {
        setHelloIndex((prev) => (prev + 1) % languageOptions.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [step]);

  const currentHello = languageOptions[helloIndex];

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0f0d] flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        {step === 'hello' ? (
          <motion.div
            key="hello"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center p-6"
          >
            <motion.div
              key={currentHello.code}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="mb-12"
            >
              <h1 className="text-6xl md:text-8xl font-black text-white mb-4">
                {currentHello.greeting}
              </h1>
              <p className="text-primary text-xl font-medium tracking-widest uppercase">
                {currentHello.nativeName}
              </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl w-full mb-12">
              {languageOptions.slice(0, 8).map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code as Language);
                    setStep('intro');
                  }}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-primary hover:text-black transition-all font-bold"
                >
                  {lang.nativeName}
                </button>
              ))}
              <button
                onClick={() => setStep('intro')}
                className="p-4 rounded-2xl bg-primary text-black font-bold flex items-center justify-center gap-2"
              >
                <Globe className="w-4 h-4" />
                More
              </button>
            </div>

            <p className="text-gray-500 text-sm animate-pulse">
              Select your language to get started
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl w-full p-8 text-center"
          >
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-8 border border-primary/20">
              <Leaf className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-4xl font-black text-white mb-4">
              {t('welcome')}
            </h2>
            <p className="text-gray-400 text-lg mb-12 leading-relaxed">
              Your AI-powered companion for smarter farming. Get real-time market insights, crop health diagnostics, and expert guidance in your language.
            </p>
            
            <div className="space-y-4">
              <Button 
                onClick={onComplete}
                className="w-full py-6 text-xl rounded-2xl flex items-center justify-center gap-3"
              >
                {t('getStarted')}
                <ChevronRight className="w-6 h-6" />
              </Button>
              <button 
                onClick={() => setStep('hello')}
                className="text-gray-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
              >
                Change Language
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
