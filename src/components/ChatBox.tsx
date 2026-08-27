import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Mic, WifiOff } from 'lucide-react';
import { getOfflineChatResponse } from '../utils/offline';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I am your KisanSetu Guide. Ask me anything about crop health, fertilizers, or farming techniques.',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getAIResponse = (userInput: string) => {
    const query = userInput.toLowerCase();
    
    if (query.includes('yellow leaves')) {
      return "Yellow leaves often indicate a nutrient deficiency, most commonly Nitrogen. It could also be due to overwatering or pests. Check the soil moisture and consider a balanced fertilizer.";
    }
    if (query.includes('fertilizer')) {
      return "For most crops, a balanced NPK (Nitrogen, Phosphorus, Potassium) fertilizer is a good start. However, the specific ratio depends on your crop type and soil health. Have you done a soil test recently?";
    }
    if (query.includes('water') || query.includes('irrigation')) {
      return "Proper irrigation is key. Most crops prefer deep, infrequent watering rather than shallow, frequent watering. This encourages deep root growth.";
    }
    if (query.includes('pest') || query.includes('insect')) {
      return "Identifying the specific pest is the first step. Look for bite marks, webs, or the insects themselves. Neem oil is a great organic solution for many common garden pests.";
    }
    if (query.includes('price') || query.includes('market')) {
      return "You can check the latest market trends in our 'Insights' section. Prices vary by region and demand.";
    }
    
    return "That's an interesting question! While I'm still learning, I recommend checking with a local agricultural expert for specific regional advice. Is there anything else about fertilizers or crop health I can help with?";
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Simulate AI thinking
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: navigator.onLine ? getAIResponse(input) : getOfflineChatResponse(input),
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 600);
  };

  return (
    <div className="flex flex-col h-[600px] bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-white/10 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-white font-bold">KisanSetu AI Guide</h3>
            <p className={`text-xs ${navigator.onLine ? 'text-primary' : 'text-yellow-500'}`}>
              {navigator.onLine ? 'Online & Ready to help' : 'Offline Mode'}
            </p>
          </div>
        </div>
        {!navigator.onLine && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-[10px] font-bold uppercase tracking-wider">
            <WifiOff className="w-3 h-3" />
            Local Logic
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${msg.sender === 'user' ? 'bg-primary/20' : 'bg-white/10'}`}>
                  {msg.sender === 'user' ? <User className="w-4 h-4 text-primary" /> : <Bot className="w-4 h-4 text-white" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-primary text-black font-medium rounded-tr-none shadow-[0_4px_15px_rgba(34,197,94,0.2)]' 
                    : 'bg-white/5 text-gray-200 border border-white/10 rounded-tl-none'
                }`}>
                  {msg.text}
                  <div className={`text-[10px] mt-2 ${msg.sender === 'user' ? 'text-black/50' : 'text-gray-500'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-white/10 bg-white/5">
        <div className="relative flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your question here..."
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-6 pr-12 text-white focus:outline-none focus:border-primary transition-all placeholder:text-gray-600"
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary transition-colors">
              <Mic className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-14 h-14 rounded-2xl bg-primary text-black flex items-center justify-center hover:bg-primary-light disabled:opacity-50 disabled:hover:bg-primary transition-all shadow-[0_4px_20px_rgba(34,197,94,0.3)] active:scale-95"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
