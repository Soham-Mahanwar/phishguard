import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export function CompareCropsPage() {
  const [crop1, setCrop1] = useState('');
  const [crop2, setCrop2] = useState('');
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async () => {
    if (!crop1 || !crop2) return;
    setLoading(true);
    setError(null);
    setComparison(null);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Compare the market trends, average prices, and profitability of ${crop1} vs ${crop2}. Return as JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              crop1: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  price: { type: Type.STRING },
                  trend: { type: Type.STRING },
                  profitability: { type: Type.STRING }
                }
              },
              crop2: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  price: { type: Type.STRING },
                  trend: { type: Type.STRING },
                  profitability: { type: Type.STRING }
                }
              },
              winner: { type: Type.STRING },
              reason: { type: Type.STRING }
            },
            required: ["crop1", "crop2", "winner", "reason"],
          },
        },
      });
      let text = response.text || "{}";
      text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      setComparison(JSON.parse(text));
    } catch (err: any) {
      console.error("Comparison error:", err);
      setError("Failed to compare crops. Please try again.");
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
        <h2 className="text-4xl font-bold text-white mb-2">Compare Crops</h2>
        <p className="text-gray-400 mb-10">Compare market trends and insights for two crops.</p>
        
        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <input
            type="text"
            value={crop1}
            onChange={(e) => setCrop1(e.target.value)}
            placeholder="Crop 1 (e.g., Tomato)"
            className="bg-gray-800 text-white p-3 rounded-lg border border-gray-700"
          />
          <input
            type="text"
            value={crop2}
            onChange={(e) => setCrop2(e.target.value)}
            placeholder="Crop 2 (e.g., Onion)"
            className="bg-gray-800 text-white p-3 rounded-lg border border-gray-700"
          />
        </div>
        
        <Button onClick={handleCompare} disabled={loading || !crop1 || !crop2}>
          {loading ? 'Comparing...' : 'Compare'}
        </Button>

        {error && <p className="text-red-400 mt-4">{error}</p>}
        {loading && <div className="mt-8"><LoadingSpinner text="Comparing crops..." className="py-8" /></div>}

        {comparison && !loading && (
          <div className="mt-12 grid md:grid-cols-2 gap-8">
            <Card className="border-primary/20">
              <h3 className="text-2xl font-bold text-white mb-4">{comparison.crop1.name}</h3>
              <div className="space-y-3 text-gray-300">
                <p><span className="font-semibold text-gray-400">Price:</span> {comparison.crop1.price}</p>
                <p><span className="font-semibold text-gray-400">Trend:</span> {comparison.crop1.trend}</p>
                <p><span className="font-semibold text-gray-400">Profitability:</span> {comparison.crop1.profitability}</p>
              </div>
            </Card>
            <Card className="border-blue-500/20">
              <h3 className="text-2xl font-bold text-white mb-4">{comparison.crop2.name}</h3>
              <div className="space-y-3 text-gray-300">
                <p><span className="font-semibold text-gray-400">Price:</span> {comparison.crop2.price}</p>
                <p><span className="font-semibold text-gray-400">Trend:</span> {comparison.crop2.trend}</p>
                <p><span className="font-semibold text-gray-400">Profitability:</span> {comparison.crop2.profitability}</p>
              </div>
            </Card>
            <Card className="md:col-span-2 bg-primary/10 border-primary/30">
              <h3 className="text-xl font-bold text-primary mb-2">Recommendation: {comparison.winner}</h3>
              <p className="text-gray-300">{comparison.reason}</p>
            </Card>
          </div>
        )}
      </motion.div>
    </div>
  );
}
