import React from 'react';
import { motion } from 'motion/react';
import { Card } from './ui/Card';
import { Leaf, IndianRupee } from 'lucide-react';

interface ModeSelectorProps {
  onSelect: (mode: 'health' | 'price') => void;
}

export function ModeSelector({ onSelect }: ModeSelectorProps) {
  return (
    <div className="min-h-screen pt-32 pb-20 px-6 flex flex-col items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tighter">
          Choose Your <span className="text-primary">Analysis Mode</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Select how you want KisanSetu to help you today.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
        <motion.div
          whileHover={{ scale: 1.05, y: -10 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect('health')}
          className="cursor-pointer group"
        >
          <Card className="h-full bg-white/5 backdrop-blur-xl border-white/10 p-10 flex flex-col items-center text-center transition-all duration-500 group-hover:border-primary/50 group-hover:shadow-[0_0_50px_rgba(34,197,94,0.2)]">
            <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 group-hover:bg-primary/20 transition-colors">
              <Leaf className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">Check Crop Health 🌱</h3>
            <p className="text-gray-400 leading-relaxed">
              Detect diseases, pests, and nutrient deficiencies. Get instant treatment advice.
            </p>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05, y: -10 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect('price')}
          className="cursor-pointer group"
        >
          <Card className="h-full bg-white/5 backdrop-blur-xl border-white/10 p-10 flex flex-col items-center text-center transition-all duration-500 group-hover:border-primary/50 group-hover:shadow-[0_0_50px_rgba(34,197,94,0.2)]">
            <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 group-hover:bg-primary/20 transition-colors">
              <IndianRupee className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">Check Crop Price 💰</h3>
            <p className="text-gray-400 leading-relaxed">
              Analyze market demand, get real-time mandi prices, and sell at the best time.
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
