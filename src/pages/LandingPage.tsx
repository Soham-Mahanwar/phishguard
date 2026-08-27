import React from 'react';
import { motion } from 'motion/react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { Button } from '../components/ui/Button';
import { Leaf, ArrowRight, ShieldCheck, TrendingUp, Zap } from 'lucide-react';
import { AnimatedBackground } from '../components/AnimatedBackground';

export function LandingPage({ onNavigate, user }: { onNavigate: (page: string) => void, user: any }) {
  const handleGetStarted = async () => {
    if (user) {
      onNavigate('mode-select');
      return;
    }

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request') {
        console.log("Sign-in popup was closed by the user.");
      } else {
        console.error("Error signing in:", error);
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-6">
      <AnimatedBackground />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 text-center max-w-4xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-10 shadow-[0_0_20px_rgba(34,197,94,0.1)]"
        >
          <Zap className="w-3 h-3" />
          India's #1 AI Farming Platform
        </motion.div>

        <button onClick={() => onNavigate('landing')} className="text-6xl md:text-9xl font-black text-white mb-8 tracking-tighter leading-[0.9] hover:scale-105 transition-transform">
          KISAN<span className="text-primary">SETU</span>
        </button>
        
        <p className="text-xl md:text-2xl text-gray-400 mb-14 max-w-2xl mx-auto leading-relaxed font-medium">
          Empowering farmers with <span className="text-white">AI-driven insights</span>, real-time market data, and expert crop health diagnostics.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={handleGetStarted} 
              className="text-xl px-12 py-8 rounded-3xl bg-primary hover:bg-primary-light text-black font-black shadow-[0_0_40px_rgba(34,197,94,0.3)] group"
            >
              Get Started
              <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-2 transition-transform" />
            </Button>
          </motion.div>
          
          {!user && (
            <button 
              onClick={handleGetStarted}
              className="text-gray-400 hover:text-white font-bold transition-colors px-6 py-3"
            >
              Sign in with Google
            </button>
          )}
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-white font-bold mb-2">Health Detection</h3>
            <p className="text-gray-500 text-sm">Instant diagnosis of crop diseases and pests using advanced computer vision.</p>
          </div>
          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-white font-bold mb-2">Market Intelligence</h3>
            <p className="text-gray-500 text-sm">Real-time mandi prices and demand analysis to help you sell at the right time.</p>
          </div>
          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Leaf className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-white font-bold mb-2">Smart Support</h3>
            <p className="text-gray-500 text-sm">AI-powered agricultural companion available 24/7 for all your farming queries.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
