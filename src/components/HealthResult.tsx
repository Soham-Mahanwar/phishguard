import React from 'react';
import { motion } from 'motion/react';
import { Card } from './ui/Card';
import { ShieldCheck, AlertTriangle, Zap, Info, ShieldAlert, Thermometer, Droplets, Sprout } from 'lucide-react';

interface HealthResultProps {
  analysis: {
    cropName: string;
    healthStatus: 'Healthy' | 'Diseased';
    diseaseName?: string;
    confidence: number;
    suggestedAction: string;
    symptoms?: string[];
    treatmentSteps?: string[];
    preventionTips?: string[];
  };
}

export function HealthResult({ analysis }: HealthResultProps) {
  const isHealthy = analysis.healthStatus === 'Healthy';

  return (
    <div className="space-y-6">
      <Card className={`relative overflow-hidden border-2 ${isHealthy ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-3xl font-bold text-white mb-2">{analysis.cropName}</h3>
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase border ${isHealthy ? 'bg-green-500/20 text-green-400 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.3)]'}`}>
              {isHealthy ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {analysis.healthStatus}
            </div>
          </div>
          <div className="text-right">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 flex items-center justify-center relative">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-primary"
                  strokeDasharray={`${(analysis.confidence / 100) * 175.8} 175.8`}
                />
              </svg>
              <span className="absolute text-[10px] font-bold text-white">{analysis.confidence}%</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-widest">Confidence</p>
          </div>
        </div>

        {!isHealthy && (
          <div className="mb-8 p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
            <h4 className="text-red-400 font-bold flex items-center gap-2 mb-2">
              <ShieldAlert className="w-5 h-5" />
              Detected Disease: {analysis.diseaseName}
            </h4>
            <p className="text-sm text-gray-300 leading-relaxed">
              Our AI has identified symptoms of {analysis.diseaseName} in your crop. Immediate action is recommended to prevent further spread.
            </p>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <h4 className="text-white font-bold flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-primary" />
              Suggested Action
            </h4>
            <p className="text-sm text-gray-300 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10 italic">
              "{analysis.suggestedAction}"
            </p>
          </div>

          {analysis.symptoms && analysis.symptoms.length > 0 && (
            <div>
              <h4 className="text-white font-bold flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-blue-400" />
                Observed Symptoms
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analysis.symptoms.map((symptom, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span className="text-xs text-gray-300">{symptom}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 gap-6">
        <Card className="bg-white/5 border-white/10 p-6">
          <h4 className="text-white font-bold flex items-center gap-2 mb-6">
            <Sprout className="w-5 h-5 text-primary" />
            Treatment Steps
          </h4>
          <div className="space-y-4">
            {analysis.treatmentSteps?.map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                  {i + 1}
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{step}</p>
              </div>
            )) || (
              <p className="text-xs text-gray-500 italic">No specific treatment steps required for healthy crops.</p>
            )}
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10 p-6">
          <h4 className="text-white font-bold flex items-center gap-2 mb-6">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            Prevention Tips
          </h4>
          <div className="space-y-4">
            {analysis.preventionTips?.map((tip, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-400/20 text-blue-400 flex items-center justify-center text-[10px] font-bold">
                  <Info className="w-3 h-3" />
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
