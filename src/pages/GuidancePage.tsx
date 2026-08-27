import React from 'react';
import { motion } from 'motion/react';
import { ChatBox } from '../components/ChatBox';
import { OfflineAlert } from '../components/ui/OfflineIndicator';
import { Sprout, HelpCircle, Lightbulb } from 'lucide-react';

export function GuidancePage() {
  const isOffline = !navigator.onLine;

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid lg:grid-cols-3 gap-12"
      >
        {/* Left Content */}
        <div className="lg:col-span-1 space-y-8">
          <div>
            <h2 className="text-5xl font-bold text-white mb-6 tracking-tighter">
              AI Agricultural <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light">Guidance</span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              Get instant answers to your farming queries. From pest control to fertilizer recommendations, our AI is here to help you grow better.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
              <div className="p-2 bg-primary/20 rounded-lg shrink-0">
                <Sprout className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm mb-1">Crop Health</h4>
                <p className="text-gray-500 text-xs">Identify deficiencies and diseases early.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
              <div className="p-2 bg-blue-500/20 rounded-lg shrink-0">
                <Lightbulb className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm mb-1">Smart Tips</h4>
                <p className="text-gray-500 text-xs">Get seasonal advice for your specific region.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
              <div className="p-2 bg-yellow-500/20 rounded-lg shrink-0">
                <HelpCircle className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm mb-1">Expert Advice</h4>
                <p className="text-gray-500 text-xs">Ask anything about farming techniques.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content - ChatBox */}
        <div className="lg:col-span-2">
          {isOffline ? (
            <div className="h-[600px] flex items-center justify-center bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl p-12">
              <OfflineAlert message="AI Guidance Chat requires an internet connection to process your questions." />
            </div>
          ) : (
            <ChatBox />
          )}
        </div>
      </motion.div>
    </div>
  );
}
