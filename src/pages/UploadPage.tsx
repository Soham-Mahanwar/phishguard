import React, { useRef, useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Upload, Camera, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function UploadPage({ mode, onAnalyze }: { mode: 'health' | 'price', onAnalyze: (image: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please allow camera permissions.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        stopCamera();
        onAnalyze(dataUrl);
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);
    
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError("Please upload a valid image file.");
        return;
      }
      
      // 5MB limit
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        onAnalyze(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 flex flex-col items-center justify-center">
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tighter">
          {mode === 'price' ? 'Smart AI Pricing for' : 'Smart AI Health for'} <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light">Your Harvest</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          {mode === 'price' 
            ? 'Upload a photo of your crop, and let KisanSetu analyze market demand and suggest the best time to sell.'
            : 'Upload a photo of your crop leaves or produce, and let KisanSetu detect diseases and suggest treatments.'}
        </p>
      </div>

      <Card className="w-full max-w-xl border-dashed border-2 border-card-border hover:border-primary/50 transition-colors duration-300">
        <div className="flex flex-col items-center justify-center py-16 gap-6">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-white font-medium text-lg">Drag & drop your crop image</p>
            <p className="text-gray-500 text-sm">or click to browse</p>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
            <Button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" /> Upload Image
            </Button>
            <Button onClick={startCamera} variant="outline" className="flex-1 flex items-center justify-center gap-2">
              <Camera className="w-4 h-4" /> Take Photo
            </Button>
          </div>
        </div>
      </Card>

      {/* Camera Modal */}
      <AnimatePresence>
        {isCameraOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          >
            <div className="relative w-full max-w-2xl bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={stopCamera}
                  className="p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="relative aspect-video bg-black flex items-center justify-center">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Camera overlay guides */}
                <div className="absolute inset-0 pointer-events-none border-[1px] border-white/20 m-8 rounded-xl">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary -mt-1 -ml-1 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary -mt-1 -mr-1 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary -mb-1 -ml-1 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary -mb-1 -mr-1 rounded-br-xl" />
                </div>
              </div>

              <div className="p-6 flex justify-center bg-gray-900">
                <button 
                  onClick={capturePhoto}
                  className="w-16 h-16 rounded-full border-4 border-gray-400 flex items-center justify-center hover:border-primary transition-colors group"
                >
                  <div className="w-12 h-12 bg-white rounded-full group-hover:bg-primary transition-colors" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
