import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Send, Mic, MicOff, Image as ImageIcon, X } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useLanguage, languageOptions } from '../contexts/LanguageContext';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export function ChatPage() {
  const { language } = useLanguage();
  const currentLang = languageOptions.find(l => l.code === language);
  
  const [messages, setMessages] = useState([
    { 
      role: 'ai', 
      text: language === 'hi' 
        ? 'नमस्ते! मैं आपका किसानसेतु सहायक हूँ। मैं आज आपकी कैसे मदद कर सकता हूँ?' 
        : language === 'en'
        ? 'Namaste! I am your KisanSetu assistant. How can I help you today?'
        : `Namaste! I am your KisanSetu assistant. I will respond to you in ${currentLang?.nativeName || 'your language'}. How can I help you today?`,
      image: null 
    }
  ]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();

    // Initialize Speech Recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('');
          setInput(transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            setMicError("Microphone access denied. Please allow microphone permissions in your browser.");
          } else {
            setMicError(`Voice input error: ${event.error}`);
          }
          setTimeout(() => setMicError(null), 5000);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }

    // Initialize chat session on mount
    chatRef.current = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: `You are a helpful agricultural assistant for farmers. The user's preferred language is ${currentLang?.name || 'English'} (${currentLang?.nativeName || 'English'}). 
        ALWAYS respond in ${currentLang?.name || 'English'}. 
        Provide advice on crop pricing, farming techniques, and market trends. You can also analyze images of crops, pests, or soil to provide specific guidance.`,
      },
    });
  }, [language]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        setMicError(null);
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        setMicError("Speech recognition is not supported in this browser.");
        setTimeout(() => setMicError(null), 5000);
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !selectedImage) return;
    
    const userMessage = { role: 'farmer', text: input, image: selectedImage };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    const currentImage = selectedImage;
    
    setInput('');
    setSelectedImage(null);
    setLoading(true);

    try {
      let responseText = '';
      
      if (currentImage) {
        // For multimodal, we use generateContent directly
        // We can include history if we want, but for simplicity let's do a direct call
        // or we can use the chat session if it supported multimodal, but it doesn't in this SDK version for sendMessage
        
        const base64Data = currentImage.split(',')[1];
        const mimeType = currentImage.split(';')[0].split(':')[1];

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: {
            parts: [
              { inlineData: { data: base64Data, mimeType } },
              { text: currentInput || "Please analyze this agricultural image." }
            ]
          },
          config: {
            systemInstruction: `You are a helpful agricultural assistant. The user's preferred language is ${currentLang?.name || 'English'} (${currentLang?.nativeName || 'English'}). 
            ALWAYS respond in ${currentLang?.name || 'English'}. 
            Analyze the provided image and answer the user's question or provide relevant farming advice.`
          }
        });
        responseText = response.text || 'I analyzed the image but couldn\'t generate a specific response.';
      } else {
        if (!chatRef.current) return;
        const response = await chatRef.current.sendMessage({ message: currentInput });
        responseText = response.text || 'Sorry, I could not understand that.';
      }

      setMessages(prev => [...prev, { role: 'ai', text: responseText, image: null }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, something went wrong while processing your request.', image: null }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-3xl mx-auto flex flex-col h-screen">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-white">Smart Support</h2>
        <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
          Powered by Gemini 3 Flash Preview
        </span>
      </div>
      
      <Card className="flex-1 flex flex-col mb-6 overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'farmer' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl ${m.role === 'farmer' ? 'bg-primary text-black' : 'bg-card-border text-white'}`}>
                {m.image && (
                  <img 
                    src={m.image} 
                    alt="Uploaded" 
                    className="max-w-full h-auto rounded-lg mb-2 border border-black/10"
                    referrerPolicy="no-referrer"
                  />
                )}
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] p-4 rounded-2xl bg-card-border text-white">
                <LoadingSpinner text="AI is thinking..." />
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-card-border flex flex-col gap-2">
          {micError && (
            <div className="text-red-400 text-sm px-2 mb-1">
              {micError}
            </div>
          )}
          
          {selectedImage && (
            <div className="relative inline-block w-20 h-20 mb-2 ml-2">
              <img 
                src={selectedImage} 
                alt="Preview" 
                className="w-full h-full object-cover rounded-lg border border-primary/50"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              className="!p-3 bg-background border border-card-border hover:border-primary text-white"
              title="Upload image"
              type="button"
            >
              <ImageIcon className="w-5 h-5" />
            </Button>
            
            <input 
              ref={inputRef}
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about pricing, weather, or techniques..." 
              className="flex-1 bg-background border border-card-border rounded-full px-6 py-3 text-white focus:outline-none focus:border-primary"
            />
            <Button 
              onClick={toggleListening} 
              className={`!p-3 transition-colors ${isListening ? 'bg-red-500 hover:bg-red-600 text-white' : ''}`}
              title={isListening ? "Stop listening" : "Start voice input"}
              type="button"
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
            <Button onClick={handleSend} className="!p-3" type="button"><Send className="w-5 h-5" /></Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
