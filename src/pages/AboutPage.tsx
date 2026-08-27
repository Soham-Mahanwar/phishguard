import React from 'react';
import { motion } from 'motion/react';
import { Card } from '../components/ui/Card';
import { Leaf, Users, ShieldCheck } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-4xl font-bold text-white mb-6 text-center">About KisanSetu</h2>
        <p className="text-gray-400 text-lg text-center mb-12 max-w-2xl mx-auto">
          Empowering farmers with AI-driven insights, smart pricing, and real-time market trends to maximize profitability and reduce uncertainty.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="flex flex-col items-center text-center p-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <Leaf className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Smart Farming</h3>
            <p className="text-gray-400 text-sm">Leveraging AI to analyze crop health and predict the best market prices.</p>
          </Card>
          
          <Card className="flex flex-col items-center text-center p-6">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 text-blue-400">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Community</h3>
            <p className="text-gray-400 text-sm">Connecting farmers with experts through live sessions and smart support.</p>
          </Card>

          <Card className="flex flex-col items-center text-center p-6">
            <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 text-purple-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Reliable Data</h3>
            <p className="text-gray-400 text-sm">Providing accurate market trends and comparisons to ensure fair trade.</p>
          </Card>
        </div>

        <Card className="p-8 bg-primary/5 border-primary/20">
          <h3 className="text-2xl font-bold text-white mb-4">Our Mission</h3>
          <p className="text-gray-300 leading-relaxed">
            At KisanSetu, we believe that technology should serve those who feed the world. Our mission is to bridge the gap between traditional farming and modern technology, ensuring that every farmer has access to the tools they need to thrive in today's dynamic market.
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
