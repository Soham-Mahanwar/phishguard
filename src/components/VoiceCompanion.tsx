import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, X, Volume2, VolumeX, Loader2, Bot, Sparkles, Zap } from 'lucide-react';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { Card } from './ui/Card';
import { useLanguage, languageOptions } from '../contexts/LanguageContext';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export function VoiceCompanion() {
  const { language } = useLanguage();
  const currentLang = languageOptions.find(l => l.code === language);
  
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);

  const startSession = async () => {
    try {
      setError(null);
      setIsListening(true);
      setResponse('');
      
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      }

      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      
      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are KisanSetu AI, a helpful agricultural companion. The user's preferred language is ${currentLang?.name || 'English'} (${currentLang?.nativeName || 'English'}). 
          ALWAYS respond in ${currentLang?.name || 'English'}. 
          Speak in a warm, professional, and encouraging tone. Keep responses concise and practical for farmers. Focus on Indian agriculture.`,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } }
          }
        },
        callbacks: {
          onopen: () => {
            console.log("Live session opened");
            // Setup audio processor to send chunks
            const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              // Convert Float32 to Int16 PCM
              const pcmData = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
              }
              // Convert to Base64
              const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
              session.sendRealtimeInput({
                audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
              });
            };
            source.connect(processor);
            processor.connect(audioContextRef.current!.destination);
            workletNodeRef.current = processor as any;
          },
          onmessage: (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
              playAudio(base64Audio);
            }
            if (message.serverContent?.modelTurn?.parts[0]?.text) {
              setResponse(prev => prev + message.serverContent!.modelTurn!.parts[0].text);
            }
            if (message.serverContent?.interrupted) {
              stopPlayback();
            }
          },
          onerror: (err) => {
            console.error("Live session error:", err);
            setError("Voice connection failed. Please try again.");
          },
          onclose: () => {
            setIsListening(false);
            if (workletNodeRef.current) {
              workletNodeRef.current.disconnect();
              workletNodeRef.current = null;
            }
          }
        }
      });
      
      sessionRef.current = session;
      
    } catch (err) {
      console.error(err);
      setError("Microphone access denied or connection failed.");
      setIsListening(false);
    }
  };

  const playAudio = async (base64Data: string) => {
    if (!audioContextRef.current) return;
    setIsSpeaking(true);
    
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Convert PCM16 to Float32
    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768;
    }
    
    const buffer = audioContextRef.current.createBuffer(1, float32.length, 16000);
    buffer.copyToChannel(float32, 0);
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => setIsSpeaking(false);
    source.start();
  };

  const stopPlayback = () => {
    setIsSpeaking(false);
    // Logic to stop current buffer source
  };

  const closeSession = () => {
    sessionRef.current?.close();
    streamRef.current?.getTracks().forEach(t => t.stop());
    setIsListening(false);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Trigger */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="w-16 h-16 rounded-full bg-primary text-black shadow-[0_0_30px_rgba(34,197,94,0.5)] flex items-center justify-center relative group"
      >
        <Mic className="w-7 h-7 group-hover:animate-pulse" />
        <div className="absolute -top-2 -right-2 bg-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">LIVE</div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <Card className="w-full max-w-md bg-zinc-900 border-white/10 p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
              
              <button 
                onClick={closeSession}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center space-y-8 relative z-10">
                <div className="relative">
                  <motion.div
                    animate={isListening || isSpeaking ? {
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.6, 0.3]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-primary rounded-full blur-2xl"
                  />
                  <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center relative">
                    {isListening ? (
                      <Mic className="w-10 h-10 text-primary animate-bounce" />
                    ) : isSpeaking ? (
                      <Volume2 className="w-10 h-10 text-primary" />
                    ) : (
                      <Bot className="w-10 h-10 text-primary" />
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white mb-2">Kisan Companion</h3>
                  <p className="text-sm text-gray-500">Your hands-free AI farming expert</p>
                </div>

                <div className="w-full min-h-[100px] bg-black/40 rounded-2xl p-6 border border-white/5 flex items-center justify-center text-center">
                  {error ? (
                    <p className="text-red-400 text-sm font-medium">{error}</p>
                  ) : response ? (
                    <p className="text-white text-lg font-medium italic">"{response}"</p>
                  ) : isListening ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <motion.div
                            key={i}
                            animate={{ height: [10, 30, 10] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                            className="w-1 bg-primary rounded-full"
                          />
                        ))}
                      </div>
                      <p className="text-primary text-xs font-bold uppercase tracking-widest">Listening...</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-gray-400 text-sm">Tap the button to start talking</p>
                      <p className="text-gray-600 text-xs italic">
                        {language === 'hi' ? 'आप हिंदी में बात कर सकते हैं' : `Speaking in ${currentLang?.nativeName || 'your language'}`}
                      </p>
                    </div>
                  )}
                </div>

                {!isListening ? (
                  <button
                    onClick={startSession}
                    className="w-full py-4 bg-primary text-black font-black rounded-2xl shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-3"
                  >
                    <Sparkles className="w-5 h-5" />
                    Start Conversation
                  </button>
                ) : (
                  <button
                    onClick={() => sessionRef.current?.close()}
                    className="w-full py-4 bg-red-500/20 border border-red-500/50 text-red-400 font-black rounded-2xl hover:bg-red-500/30 transition-all"
                  >
                    Stop Listening
                  </button>
                )}

                <div className="flex items-center gap-2 text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                  <Zap className="w-3 h-3" />
                  Powered by Gemini 3.1 Live
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
