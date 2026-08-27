import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { TrendGraphic } from './TrendGraphic';

interface MarketCardProps {
  crop: string;
  trend: 'rising' | 'falling' | 'stable';
  insight: string;
  recommendation: string;
  volatility?: string;
  confidence?: number;
  key?: number;
}

export function MarketCard({ crop, trend, insight, recommendation, volatility, confidence }: MarketCardProps) {
  const trendIcons = {
    rising: <TrendingUp className="w-6 h-6 text-green-400" />,
    falling: <TrendingDown className="w-6 h-6 text-red-400" />,
    stable: <Minus className="w-6 h-6 text-yellow-400" />,
  };

  const trendColors = {
    rising: 'border-green-500/30 shadow-green-500/10',
    falling: 'border-red-500/30 shadow-red-500/10',
    stable: 'border-yellow-500/30 shadow-yellow-500/10',
  };

  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
      className="h-full"
    >
      <Card className={`bg-gray-900/50 backdrop-blur-xl border ${trendColors[trend]} p-6 h-full flex flex-col`}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col">
            <h3 className="text-2xl font-bold text-white leading-tight">{crop}</h3>
            <div className="flex items-center gap-2 mt-1">
              {trendIcons[trend]}
              <span className={`text-xs font-medium uppercase tracking-wider ${trend === 'rising' ? 'text-green-400' : trend === 'falling' ? 'text-red-400' : 'text-yellow-400'}`}>
                {trend}
              </span>
            </div>
          </div>
          <TrendGraphic trend={trend} className="border border-gray-800/50 p-1 bg-black/20" />
        </div>
        <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed">{insight}</p>
        
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-black/30 rounded-lg p-2 text-center border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Volatility</p>
            <p className="font-bold text-xs text-white">{volatility || 'Low'}</p>
          </div>
          <div className="bg-black/30 rounded-lg p-2 text-center border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Confidence</p>
            <p className="font-bold text-xs text-primary">{confidence ? `${confidence}%` : '85%'}</p>
          </div>
        </div>

        <div className="bg-black/30 rounded-lg p-3 text-center border border-white/5">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Recommendation</p>
          <p className={`font-bold text-lg ${recommendation === 'Sell Now' ? 'text-green-400' : recommendation === 'Wait' ? 'text-red-400' : 'text-yellow-400'}`}>
            {recommendation}
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
