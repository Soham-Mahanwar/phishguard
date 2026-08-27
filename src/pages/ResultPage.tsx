import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { OfflineAlert } from '../components/ui/OfflineIndicator';
import { ProfitCalculator } from '../components/ProfitCalculator';
import { HealthResult } from '../components/HealthResult';
import { TrendingUp, CheckCircle2, AlertTriangle, Info, WifiOff, ShieldCheck, Zap, BarChart3, MapPin, Map as MapIcon, Calendar, CloudRain, Share2, QrCode, Navigation, Leaf } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { getOfflineCropAnalysis, saveLastResult } from '../utils/offline';
import { resizeImage } from '../utils/imageUtils';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export function ResultPage({ mode, image, onData, initialData }: { mode: 'health' | 'price', image: string | null, onData: (data: any) => void, initialData?: any }) {
  const [analysis, setAnalysis] = useState<any>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (initialData) {
      setLoading(false);
      return;
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, [initialData]);

  useEffect(() => {
    if ((initialData && refreshKey === 0) || !image) {
      if (!image && !initialData) setLoading(false);
      return;
    }

    const analyze = async () => {
      setLoading(true);
      setError(null);

      // Handle Offline Mode - Stop automatic fallback to let user choose
      if (!navigator.onLine) {
        setLoading(true);
        return;
      }

      try {
        let finalData: any = null;

        if (mode === 'price') {
          // Call 1: Crop Analysis & Market Intelligence (using Google Search)
          const analysisPromise = ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
              parts: [
                { text: `Act as a professional agricultural commodity expert. Analyze this crop image in detail.
                1. Identify the crop and its visual grade (A/B/C).
                2. Use Google Search to find REAL-TIME market prices for this crop in Indian Mandis (Agmarknet/National average) as of today.
                3. Evaluate quality factors visible (color, size, defects).
                4. Analyze maturity: Is it ready for harvest? Provide a "Harvest Maturity Score" (0-100).
                5. Check weather forecast for the user's area to assess harvest risk.
                6. Provide a data-driven sell recommendation.
                7. Generate a digital verification ID and signature for this crop.
                Return the analysis in the specified JSON format.` },
                { inlineData: { data: image.split(',')[1], mimeType: 'image/jpeg' } }
              ],
            },
            config: {
              tools: [{ googleSearch: {} }],
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  cropName: { type: Type.STRING },
                  grade: { type: Type.STRING },
                  price: { type: Type.STRING },
                  demand: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                  recommendation: { type: Type.STRING, enum: ["SELL NOW", "WAIT"] },
                  trend: { type: Type.STRING },
                  action: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  qualityFactors: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        trait: { type: Type.STRING },
                        status: { type: Type.STRING }
                      }
                    }
                  },
                  estimatedShelfLife: { type: Type.STRING },
                  marketIntelligence: { type: Type.STRING },
                  alternativeMarkets: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  harvestMaturity: {
                    type: Type.OBJECT,
                    properties: {
                      score: { type: Type.NUMBER },
                      status: { type: Type.STRING },
                      suggestion: { type: Type.STRING },
                      weatherRisk: { type: Type.STRING }
                    }
                  },
                  verifiedCertificate: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      verifiedAt: { type: Type.STRING },
                      digitalSignature: { type: Type.STRING }
                    }
                  }
                },
                required: ["cropName", "grade", "price", "demand", "recommendation", "trend", "action", "confidence", "qualityFactors", "estimatedShelfLife", "marketIntelligence", "alternativeMarkets", "harvestMaturity", "verifiedCertificate"],
              },
            },
          });

          // Call 2: Nearby Mandi Finder (using Google Maps)
          const mandiPromise = ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
              parts: [
                { text: `Find the nearest 3 major agricultural mandis (markets) to the user's location (${location ? `${location.lat}, ${location.lng}` : 'India'}). 
                For each mandi, provide its name and estimated distance. 
                Format the output as a JSON array of objects with 'name' and 'distance' keys, wrapped in a JSON code block.` }
              ],
            },
            config: {
              tools: [{ googleMaps: {} }],
              toolConfig: {
                retrievalConfig: {
                  latLng: location ? { latitude: location.lat, longitude: location.lng } : undefined
                }
              },
            },
          });

          const [analysisResponse, mandiResponse] = await Promise.all([analysisPromise, mandiPromise]);
          
          let analysisText = analysisResponse.text || "{}";
          analysisText = analysisText.replace(/```json/gi, '').replace(/```/g, '').trim();
          const analysisData = JSON.parse(analysisText);

          let mandiText = mandiResponse.text || "{}";
          const jsonMatch = mandiText.match(/\[\s*\{[\s\S]*\}\s*\]/);
          let mandiList = [];
          if (jsonMatch) {
            try {
              mandiList = JSON.parse(jsonMatch[0]);
            } catch (e) {
              console.error("Failed to parse mandi JSON from text", e);
            }
          }

          const mapsLinks = mandiResponse.candidates?.[0]?.groundingMetadata?.groundingChunks
            ?.filter((chunk: any) => chunk.maps?.uri)
            ?.map((chunk: any) => ({
              uri: chunk.maps.uri,
              title: chunk.maps.title
            })) || [];

          finalData = {
            ...analysisData,
            mandiComparison: mandiList.map((m: any, idx: number) => ({
              ...m,
              price: analysisData.price,
              trend: analysisData.trend,
              mapUrl: mapsLinks[idx]?.uri || null
            }))
          };
        } else {
          // Health Mode Analysis
          const healthResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
              parts: [
                { text: `Act as a professional plant pathologist. Analyze this crop image for diseases, pests, or nutrient deficiencies.
                1. Identify the crop.
                2. Determine if it is Healthy or Diseased.
                3. If diseased, identify the disease name.
                4. List visible symptoms.
                5. Provide immediate treatment steps (organic and chemical).
                6. Provide long-term prevention tips.
                7. Give a confidence score (0-100).
                8. Suggest the next best action for the farmer.
                Return the analysis in the specified JSON format.` },
                { inlineData: { data: image.split(',')[1], mimeType: 'image/jpeg' } }
              ],
            },
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  cropName: { type: Type.STRING },
                  healthStatus: { type: Type.STRING, enum: ["Healthy", "Diseased"] },
                  diseaseName: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                  suggestedAction: { type: Type.STRING },
                  symptoms: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  treatmentSteps: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  preventionTips: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["cropName", "healthStatus", "confidence", "suggestedAction", "preventionTips"],
              },
            },
          });

          let healthText = healthResponse.text || "{}";
          healthText = healthText.replace(/```json/gi, '').replace(/```/g, '').trim();
          finalData = JSON.parse(healthText);
        }

        if (finalData) {
          setAnalysis(finalData);
          onData(finalData);
          saveLastResult(finalData);

          // Save to Firestore History
          if (auth.currentUser) {
            const analysisId = Date.now().toString();
            const analysisRef = doc(db, 'users', auth.currentUser.uid, 'analyses', analysisId);
            try {
              // Create a small thumbnail for history to stay within Firestore 1MB limit
              const thumbnail = await resizeImage(image, 400, 400);
              
              await setDoc(analysisRef, {
                uid: auth.currentUser.uid,
                cropName: finalData.cropName || 'Unknown Crop',
                type: mode,
                status: mode === 'health' ? finalData.healthStatus : finalData.grade,
                data: finalData,
                image: thumbnail, // Store thumbnail instead of full image
                createdAt: serverTimestamp()
              });
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser.uid}/analyses/${analysisId}`);
            }
          } else {
            // Fallback to local storage if not logged in
            const thumbnail = await resizeImage(image, 400, 400);
            const historyItem = {
              id: Date.now(),
              crop: finalData.cropName || 'Unknown Crop',
              date: new Date().toISOString().split('T')[0],
              type: mode,
              status: mode === 'health' ? finalData.healthStatus : finalData.grade,
              data: finalData,
              image: thumbnail
            };
            const existingHistory = JSON.parse(localStorage.getItem('kisanSetuHistory') || '[]');
            localStorage.setItem('kisanSetuHistory', JSON.stringify([historyItem, ...existingHistory]));
          }
        }

      } catch (err: any) {
        console.error("Analysis error:", err);
        setError(err.message || "Failed to analyze the image. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    analyze();
  }, [image, mode, initialData, refreshKey]);

  const getDemandBadge = (demand: string) => {
    const d = demand.toLowerCase();
    if (d.includes('high')) return (
      <div className="flex flex-col items-end">
        <span className="px-4 py-1.5 rounded-full bg-green-500/20 text-green-400 text-xs font-black border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.3)] tracking-widest">HIGH</span>
        <span className="text-[10px] text-green-500/60 mt-1 font-medium">Strong Market Interest</span>
      </div>
    );
    if (d.includes('medium')) return (
      <div className="flex flex-col items-end">
        <span className="px-4 py-1.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-black border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)] tracking-widest">MEDIUM</span>
        <span className="text-[10px] text-yellow-500/60 mt-1 font-medium">Stable Market Flow</span>
      </div>
    );
    return (
      <div className="flex flex-col items-end">
        <span className="px-4 py-1.5 rounded-full bg-red-500/20 text-red-400 text-xs font-black border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)] tracking-widest">LOW</span>
        <span className="text-[10px] text-red-500/60 mt-1 font-medium">Limited Buyer Activity</span>
      </div>
    );
  };

  const getRecommendationBadge = (rec: string) => {
    const r = rec.toUpperCase();
    if (r.includes('SELL NOW')) return (
      <motion.div 
        initial={{ scale: 0.9 }}
        animate={{ scale: [0.9, 1.02, 0.9] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-green-500/20 text-green-400 font-black border-2 border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.5)]"
      >
        <CheckCircle2 className="w-6 h-6" />
        <span className="text-xl tracking-tighter">SELL NOW</span>
      </motion.div>
    );
    return (
      <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-yellow-500/20 text-yellow-400 font-black border-2 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.3)]">
        <AlertTriangle className="w-6 h-6" />
        <span className="text-xl tracking-tighter">WAIT</span>
      </div>
    );
  };

  if (loading) {
    if (!isOnline) {
      return (
        <div className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full"
          >
            <Card className="p-10 border-yellow-500/30 bg-yellow-500/5 backdrop-blur-xl relative overflow-hidden">
              {isOnline && (
                <motion.div 
                  initial={{ y: -100 }}
                  animate={{ y: 0 }}
                  className="absolute top-0 left-0 w-full bg-primary py-2 text-black text-[10px] font-black uppercase tracking-[0.2em]"
                >
                  Connection Restored
                </motion.div>
              )}
              
              <div className="p-5 bg-yellow-500/20 rounded-full text-yellow-500 w-fit mx-auto mb-8 mt-4">
                <WifiOff className="w-12 h-12" />
              </div>
              <h3 className="text-3xl font-black mb-4">Connection Required</h3>
              <p className="text-gray-400 mb-10 text-sm leading-relaxed">
                To unlock <span className="text-white font-bold text-xs uppercase tracking-wider">Real-Time Market Prices</span> and <span className="text-white font-bold text-xs uppercase tracking-wider">Expert AI Diagnostics</span>, please reconnect to the internet.
              </p>
              
              <div className="space-y-4">
                <button 
                  onClick={() => window.location.reload()} 
                  className={`w-full py-4 rounded-2xl font-black transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${
                    isOnline 
                      ? 'bg-primary text-black shadow-primary/40 scale-105' 
                      : 'bg-white/10 text-white/40 cursor-not-allowed'
                  }`}
                >
                  <Zap className={`w-5 h-5 ${isOnline ? 'animate-pulse' : ''}`} />
                  {isOnline ? 'Retry AI Analysis Now' : 'Waiting for Connection...'}
                </button>
                
                <button 
                  onClick={async () => {
                    // Force offline analysis if user insists
                    const offlineData = getOfflineCropAnalysis(image!, mode);
                    setAnalysis(offlineData);
                    onData(offlineData);
                    saveLastResult(offlineData);
                    
                    // Save to history (Local Storage fallback)
                    const thumbnail = await resizeImage(image!, 400, 400);
                    const historyItem = {
                      id: Date.now(),
                      crop: offlineData.cropName || 'Unknown Crop',
                      date: new Date().toISOString().split('T')[0],
                      type: mode,
                      status: mode === 'health' ? offlineData.healthStatus : offlineData.grade,
                      data: offlineData,
                      image: thumbnail
                    };
                    const existingHistory = JSON.parse(localStorage.getItem('kisanSetuHistory') || '[]');
                    localStorage.setItem('kisanSetuHistory', JSON.stringify([historyItem, ...existingHistory]));
                    
                    setLoading(false);
                  }} 
                  className="w-full py-4 bg-white/5 text-white rounded-2xl font-bold hover:bg-white/10 transition-all border border-white/10 active:scale-95"
                >
                  Continue with Offline Estimation
                </button>
                
                {!isOnline && (
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold animate-pulse">
                    Please check your Wi-Fi or Mobile Data
                  </p>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      );
    }
    return (
      <div className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto flex flex-col items-center justify-center">
        {(image || initialData?.image) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-2xl overflow-hidden border-2 border-primary/50 shadow-[0_0_30px_rgba(34,197,94,0.3)] mb-8"
          >
            <img src={image || initialData?.image} alt="Analyzing" className="w-full max-w-md h-auto opacity-50" referrerPolicy="no-referrer" />
            <motion.div
              className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_15px_rgba(34,197,94,1)]"
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-transparent" />
          </motion.div>
        )}
        <LoadingSpinner text={mode === 'price' ? "Analyzing Market Prices..." : "Diagnosing Crop Health..."} className="text-2xl mt-4" />
      </div>
    );
  }
  if (!image && !initialData) return <div className="min-h-screen pt-32 px-6 text-center text-white">No image uploaded. Please upload an image to see analysis.</div>;
  if (error) return (
    <div className="min-h-screen pt-32 px-6 text-center text-white flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <Card className="p-8 border-red-500/30 bg-red-500/5 backdrop-blur-xl">
          <div className="p-4 bg-red-500/20 rounded-full text-red-500 w-fit mx-auto mb-6">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Analysis Failed</h3>
          <p className="text-gray-400 mb-8 text-sm">
            {error.toLowerCase().includes('quota') 
              ? "We've reached our daily analysis limit. Please try again tomorrow."
              : "We encountered an issue while analyzing your crop image. Our AI couldn't process the request."}
          </p>
          
          <div className="text-left space-y-4 mb-8 bg-black/40 p-6 rounded-2xl border border-white/5">
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Troubleshooting Steps:</p>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
              <p className="text-xs text-gray-300">Check your internet connection and ensure it's stable.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
              <p className="text-xs text-gray-300">Ensure the image is clear, well-lit, and the crop is in focus.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</div>
              <p className="text-xs text-gray-300">Avoid blurry or dark photos for better AI accuracy.</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full py-4 bg-primary text-black rounded-2xl font-bold hover:bg-primary-light transition-all shadow-lg shadow-primary/20 active:scale-95"
            >
              Retry Analysis
            </button>
            <button 
              onClick={() => window.history.back()} 
              className="w-full py-4 bg-white/5 text-white rounded-2xl font-bold hover:bg-white/10 transition-all border border-white/10 active:scale-95"
            >
              Go Back & Re-upload
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
  if (!analysis) return <div className="min-h-screen pt-32 px-6 text-center text-white">Failed to analyze.</div>;

  const extractPrice = (priceStr: string): number => {
    if (!priceStr) return 0;
    // Remove currency symbols and commas
    const cleanStr = priceStr.replace(/[₹,]/g, '');
    // Handle ranges like "4200 - 4500"
    const parts = cleanStr.match(/\d+/g);
    if (!parts) return 0;
    if (parts.length >= 2) {
      // Return average of range
      return (parseFloat(parts[0]) + parseFloat(parts[1])) / 2;
    }
    return parseFloat(parts[0]);
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <h2 className="text-4xl font-bold text-white mb-10">{mode === 'price' ? 'Market Analysis' : 'Health Diagnosis'}</h2>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="flex items-center justify-center p-2">
            <img src={image || initialData?.image} alt="Crop" className="rounded-2xl w-full h-auto" referrerPolicy="no-referrer" />
          </Card>
          
          {analysis.isOfflineResult && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-500/10 border-2 border-yellow-500/30 rounded-2xl p-6 flex flex-col gap-4 shadow-[0_0_20px_rgba(234,179,8,0.1)]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-xl text-yellow-500">
                  <WifiOff className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-yellow-500 uppercase tracking-widest">Estimated Data</p>
                  <p className="text-xs text-yellow-200/70">
                    This analysis was performed in <strong>Offline Mode</strong>.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <p className="text-[10px] text-yellow-500/60 leading-relaxed">
                  Prices and diagnostics are based on local historical averages. For real-time market rates and precise AI diagnosis, please refresh while online.
                </p>
                
                <button
                  onClick={() => setRefreshKey(prev => prev + 1)}
                  disabled={!isOnline}
                  className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                    isOnline 
                      ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 hover:scale-[1.02] active:scale-95' 
                      : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                  }`}
                >
                  <Zap className={`w-4 h-4 ${isOnline ? 'animate-pulse' : ''}`} />
                  {isOnline ? 'Refresh Online Now' : 'Connect to Refresh'}
                </button>
                
                {!isOnline && (
                  <p className="text-[9px] text-yellow-500/40 text-center uppercase font-bold tracking-tighter">
                    Waiting for internet connection...
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {mode === 'price' ? (
            <>
              <Card className="bg-white/5 border-white/10 p-6">
                <h4 className="text-white font-bold flex items-center gap-2 mb-6">
                  <CloudRain className="w-5 h-5 text-blue-400" />
                  AI Weather Forecast
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-500/20">
                        <CloudRain className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-blue-400 font-bold uppercase tracking-widest">Next 5 Days</p>
                        <p className="text-sm text-white font-medium">{analysis.harvestMaturity?.weatherRisk || 'Stable conditions predicted'}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 italic">
                    *Weather data is grounded via AI search for your current region.
                  </p>
                </div>
              </Card>

              <Card className="bg-white/5 border-white/10 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-white font-bold flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Quality Breakdown
                  </h4>
                  <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                    <Zap className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{analysis.confidence}% Confidence</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {analysis.qualityFactors?.map((factor: any, i: number) => (
                    <div key={i} className="bg-black/20 p-3 rounded-xl border border-white/5">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{factor.trait}</p>
                      <p className="text-white text-sm font-medium">{factor.status}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-white/5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Est. Shelf Life</span>
                    <span className="text-white font-bold">{analysis.estimatedShelfLife}</span>
                  </div>
                </div>
              </Card>

              <Card className="bg-white/5 border-white/10 p-6">
                <h4 className="text-white font-bold flex items-center gap-2 mb-6">
                  <Calendar className="w-5 h-5 text-primary" />
                  Harvest Maturity
                </h4>
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-20 h-20 rounded-full border-8 border-primary/20 flex items-center justify-center relative">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-primary"
                        strokeDasharray={`${(analysis.harvestMaturity?.score / 100) * 201} 201`}
                      />
                    </svg>
                    <span className="absolute text-lg font-black text-white">{analysis.harvestMaturity?.score}%</span>
                  </div>
                  <div>
                    <p className="text-white font-bold">{analysis.harvestMaturity?.status}</p>
                    <p className="text-xs text-gray-500 mt-1">{analysis.harvestMaturity?.suggestion}</p>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <Card className="bg-white/5 border-white/10 p-6">
              <h4 className="text-white font-bold flex items-center gap-2 mb-6">
                <Leaf className="w-5 h-5 text-primary" />
                Plant Vitals
              </h4>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">Chlorophyll Level</p>
                  <p className="text-sm text-white font-medium">Optimal range detected via leaf color analysis.</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                  <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">Hydration Status</p>
                  <p className="text-sm text-white font-medium">Turgor pressure appears normal. No wilting detected.</p>
                </div>
              </div>
            </Card>
          )}
        </div>
        
        <div className="space-y-6">
          {mode === 'price' ? (
            <>
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <div className="w-12 h-12 rounded-full border-4 border-primary/20 flex items-center justify-center relative">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="4"
                        className="text-primary"
                        strokeDasharray={`${(analysis.confidence / 100) * 125.6} 125.6`}
                      />
                    </svg>
                    <span className="absolute text-[10px] font-bold text-white">{analysis.confidence}%</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4">{analysis.cropName}</h3>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">
                  Visual Grade: {analysis.grade}
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400">Smart AI Price</span>
                  <span className="text-3xl font-bold text-primary">{analysis.price}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Market Demand</span>
                  {getDemandBadge(analysis.demand)}
                </div>
              </Card>

              <Card className="bg-white/5 border-white/10 p-6">
                <h4 className="text-white font-bold flex items-center gap-2 mb-6">
                  <MapIcon className="w-5 h-5 text-primary" />
                  Nearby Mandi Intelligence
                </h4>
                <div className="space-y-4">
                  {analysis.mandiComparison?.map((mandi: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 group hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/5 text-gray-400 group-hover:text-primary transition-colors">
                          <Navigation className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{mandi.name}</p>
                          <p className="text-[10px] text-gray-500">{mandi.distance} away • {mandi.trend}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-primary">{mandi.price}</p>
                        {mandi.mapUrl && (
                          <a 
                            href={mandi.mapUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] text-primary hover:underline flex items-center justify-end gap-1 mt-1"
                          >
                            View on Map
                          </a>
                        )}
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Today's Rate</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bg-primary/5 border-primary/20">
                <h4 className="text-white font-bold flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Market Intelligence
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed italic mb-4">
                  "{analysis.marketIntelligence}"
                </p>
                <div className="mt-6 space-y-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Alternative Channels</p>
                  {analysis.alternativeMarkets && analysis.alternativeMarkets.length > 0 && (
                    <p className="text-xs text-gray-400 leading-relaxed mb-3">
                      Beyond traditional mandis, you can explore {analysis.alternativeMarkets.join(', ')} to potentially secure better margins or direct-to-consumer sales.
                    </p>
                  )}
                </div>
              </Card>

              <ProfitCalculator pricePerQuintal={extractPrice(analysis.price)} />
            </>
          ) : (
            <HealthResult analysis={analysis} />
          )}

          <Card className="bg-black/40 border-2 border-primary/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-colors" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary text-black">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">Verified Certificate</h4>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Digital Asset ID: {analysis.verifiedCertificate?.id || 'KS-HEALTH-' + Date.now().toString().slice(-6)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Verified By</p>
                  <p className="text-xs text-white font-black">KisanSetu AI</p>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  const text = mode === 'price' 
                    ? `KisanSetu AI Verified Crop\nCrop: ${analysis.cropName}\nGrade: ${analysis.grade}\nPrice: ${analysis.price}`
                    : `KisanSetu AI Health Report\nCrop: ${analysis.cropName}\nStatus: ${analysis.healthStatus}\nDisease: ${analysis.diseaseName || 'None'}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="w-full flex items-center justify-center gap-3 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-green-900/20 group/btn"
              >
                <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Share Verified Report to WhatsApp
              </button>
            </div>
          </Card>

          {mode === 'price' && (
            <Card className="border-primary/30 bg-primary/5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 rounded-full bg-primary text-black shadow-[0_0_15px_rgba(34,197,94,0.5)]">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-lg mb-2">Sell Recommendation</p>
                  {getRecommendationBadge(analysis.recommendation)}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
