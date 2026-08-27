import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './ui/Card';
import { Calculator, IndianRupee, Truck, Percent, Info, ChevronDown, ChevronUp } from 'lucide-react';

interface ProfitCalculatorProps {
  pricePerQuintal: number;
}

export function ProfitCalculator({ pricePerQuintal }: ProfitCalculatorProps) {
  const [cost, setCost] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [transport, setTransport] = useState<number>(0);
  const [marketFee, setMarketFee] = useState<number>(2); // Default 2%
  const [profit, setProfit] = useState<number>(0);
  const [revenue, setRevenue] = useState<number>(0);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    const totalRevenue = pricePerQuintal * quantity;
    const totalTransport = transport * quantity;
    const totalMarketFee = (totalRevenue * marketFee) / 100;
    
    setRevenue(totalRevenue);
    setProfit(totalRevenue - cost - totalTransport - totalMarketFee);
  }, [cost, quantity, pricePerQuintal, transport, marketFee]);

  return (
    <Card className="bg-white/5 backdrop-blur-2xl border-white/10 shadow-2xl overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ rotate: 15 }}
              className="p-2 bg-primary/20 rounded-lg"
            >
              <Calculator className="w-5 h-5 text-primary" />
            </motion.div>
            <h3 className="text-xl font-bold text-white tracking-tight">Profit Estimator</h3>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-bold">Cost of Production</label>
              <div className="relative group/input">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 group-focus-within/input:text-primary transition-colors" />
                <input
                  type="number"
                  value={cost || ''}
                  onChange={(e) => setCost(Number(e.target.value))}
                  placeholder="Total cost"
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-gray-700"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-bold">Quantity (Quintals)</label>
              <input
                type="number"
                value={quantity || ''}
                onChange={(e) => setQuantity(Number(e.target.value))}
                placeholder="Qty"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-gray-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-bold">Transport Cost / Qtl</label>
              <div className="relative group/input">
                <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 group-focus-within/input:text-primary transition-colors" />
                <input
                  type="number"
                  value={transport || ''}
                  onChange={(e) => setTransport(Number(e.target.value))}
                  placeholder="Per quintal"
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-gray-700"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-bold">Market Fee (%)</label>
              <div className="relative group/input">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 group-focus-within/input:text-primary transition-colors" />
                <input
                  type="number"
                  value={marketFee || ''}
                  onChange={(e) => setMarketFee(Number(e.target.value))}
                  placeholder="Fee %"
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-gray-700"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10">
            <button 
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="w-full flex items-center justify-between text-[11px] text-gray-500 hover:text-gray-300 transition-colors mb-4"
            >
              <span className="flex items-center gap-2">
                <Info className="w-3 h-3" />
                View Calculation Breakdown
              </span>
              {showBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <AnimatePresence>
              {showBreakdown && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2 mb-4 overflow-hidden"
                >
                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>Gross Revenue (₹{pricePerQuintal} × {quantity})</span>
                    <span className="text-gray-300">₹{revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>Production Cost</span>
                    <span className="text-red-400/60">-₹{cost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>Total Transport (₹{transport} × {quantity})</span>
                    <span className="text-red-400/60">-₹{(transport * quantity).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>Market Fee ({marketFee}%)</span>
                    <span className="text-red-400/60">-₹{((revenue * marketFee) / 100).toLocaleString()}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <span className="text-white font-bold text-sm uppercase tracking-tighter">Net Profit</span>
              <div className="text-right">
                <motion.span 
                  key={profit}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`text-4xl font-black transition-all duration-300 ${profit >= 0 ? 'text-primary drop-shadow-[0_0_20px_rgba(34,197,94,0.7)]' : 'text-red-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]'}`}
                >
                  ₹{Math.round(profit).toLocaleString()}
                </motion.span>
                {profit > 0 && (
                  <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1">Profitable Harvest</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
