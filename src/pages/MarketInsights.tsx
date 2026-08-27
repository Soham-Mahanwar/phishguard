import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GoogleGenAI, Type } from '@google/genai';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MarketCard } from '../components/MarketCard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export function MarketInsights({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [crop, setCrop] = useState('');
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    if (!crop) return;
    setLoading(true);
    setInsight(null);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide comprehensive market insights for ${crop} in India. 
        Include:
        1. Current trend (rising/falling/stable).
        2. A short insight based on current Indian Mandi trends (Agmarknet).
        3. A recommendation (Sell Now/Wait/Hold).
        4. Historical price volatility data (e.g., "High", "Moderate", "Low" with a brief reason).
        5. A confidence level (0-100) for the market trend prediction based on current data availability.
        6. A 6-month price history/projection in INR (month name and price per quintal).
        Return as JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              crop: { type: Type.STRING },
              trend: { type: Type.STRING, enum: ['rising', 'falling', 'stable'] },
              insight: { type: Type.STRING },
              recommendation: { type: Type.STRING },
              volatility: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              priceHistory: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    month: { type: Type.STRING },
                    price: { type: Type.NUMBER }
                  },
                  required: ["month", "price"]
                }
              }
            },
            required: ["crop", "trend", "insight", "recommendation", "volatility", "confidence", "priceHistory"],
          },
        },
      });
      let text = response.text || "{}";
      text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      setInsight(JSON.parse(text));
    } catch (error) {
      console.error("Error fetching insights:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-4xl font-bold text-white mb-2">Market Insights</h2>
        <p className="text-gray-400 mb-10">AI-powered trends and price insights</p>
        
        <div className="flex gap-4 mb-10">
          <input
            type="text"
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
            placeholder="Enter crop name (e.g., Tomato)"
            className="flex-grow bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:border-primary focus:outline-none"
          />
          <Button onClick={fetchInsights} disabled={loading}>
            {loading ? 'Analyzing...' : 'Get Insights'}
          </Button>
        </div>

        {loading && <LoadingSpinner text="Analyzing market trends..." className="py-10" />}
        
        {insight && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <MarketCard {...insight} />
            </div>
            
            {insight.priceHistory && insight.priceHistory.length > 0 && (
              <Card className="md:col-span-2 p-6 flex flex-col">
                <h3 className="text-xl font-bold text-white mb-6">Price Trend (per quintal)</h3>
                <div className="flex-1 min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={insight.priceHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                      <XAxis 
                        dataKey="month" 
                        stroke="#9CA3AF" 
                        tick={{ fill: '#9CA3AF' }} 
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis 
                        stroke="#9CA3AF" 
                        tick={{ fill: '#9CA3AF' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `₹${value}`}
                        dx={-10}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem', color: '#fff' }}
                        itemStyle={{ color: '#22C55E' }}
                        formatter={(value: number) => [`₹${value}`, 'Price']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#22C55E" 
                        strokeWidth={3}
                        dot={{ fill: '#22C55E', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: '#22C55E', stroke: '#fff' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
