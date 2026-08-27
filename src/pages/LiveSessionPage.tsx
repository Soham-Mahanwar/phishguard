import React from 'react';
import { motion } from 'motion/react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Video, Mic, MicOff, VideoOff, PhoneOff } from 'lucide-react';

export function LiveSessionPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [micOn, setMicOn] = React.useState(true);
  const [videoOn, setVideoOn] = React.useState(true);

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-5xl mx-auto flex flex-col h-screen">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-white">Live Session</h2>
          <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-bold animate-pulse">
            ● LIVE
          </span>
        </div>
        
        <Card className="flex-1 flex flex-col items-center justify-center bg-gray-900/80 border-gray-700 relative overflow-hidden">
          {videoOn ? (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <Video className="w-24 h-24 text-gray-600" />
              <p className="absolute bottom-10 text-gray-400">Waiting for host to start video...</p>
            </div>
          ) : (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-gray-800 flex items-center justify-center">
                <span className="text-4xl text-gray-500">You</span>
              </div>
            </div>
          )}
        </Card>

        <div className="mt-8 flex items-center justify-center gap-6">
          <button 
            onClick={() => setMicOn(!micOn)}
            className={`p-4 rounded-full transition-colors ${micOn ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-red-500 text-white hover:bg-red-600'}`}
          >
            {micOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>
          
          <button 
            onClick={() => setVideoOn(!videoOn)}
            className={`p-4 rounded-full transition-colors ${videoOn ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-red-500 text-white hover:bg-red-600'}`}
          >
            {videoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>

          <button 
            onClick={() => onNavigate('sessions')}
            className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
