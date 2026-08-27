import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star } from 'lucide-react';
import { Button } from './ui/Button';

export function FeedbackModal({ isVisible, onClose }: { isVisible: boolean; onClose: () => void }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    // In a real app, send this feedback to a backend or Firebase
    setSubmitted(true);
    localStorage.setItem('kisanSetuFeedbackShown', 'true');
    
    // Auto-close after showing thank you message
    setTimeout(() => {
      onClose();
    }, 3000);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl p-8 relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 text-gray-500 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {submitted ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 fill-current" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Thank You!</h3>
                <p className="text-gray-400">Your feedback helps us improve KisanSetu for everyone.</p>
              </motion.div>
            ) : (
              <>
                <h3 className="text-3xl font-black text-white mb-2">Enjoying KisanSetu?</h3>
                <p className="text-gray-400 mb-8">We'd love to hear your thoughts on how we can improve.</p>
                
                <div className="flex gap-3 mb-8 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => setRating(star)}
                      className="focus:outline-none transition-transform hover:scale-125"
                    >
                      <Star
                        className={`w-10 h-10 transition-colors ${
                          star <= (hoveredRating || rating)
                            ? 'text-yellow-400 fill-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.3)]'
                            : 'text-gray-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <AnimatePresence>
                  {rating > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-col gap-4 overflow-hidden"
                    >
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Tell us more about your experience..."
                        className="w-full bg-black/40 text-white text-sm p-4 rounded-2xl border border-white/5 focus:border-primary focus:outline-none resize-none"
                        rows={4}
                      />
                      <Button onClick={handleSubmit} className="w-full py-4 text-lg font-bold rounded-2xl">
                        Submit Feedback
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
