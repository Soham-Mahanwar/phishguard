import React from 'react';
import { motion } from 'motion/react';
import { Card } from '../components/ui/Card';
import { Camera, TrendingUp, MessageSquare, BookOpen, Video, History } from 'lucide-react';

export function UserGuidePage() {
  const sections = [
    {
      title: "Crop Analysis",
      icon: Camera,
      color: "text-green-400",
      bgColor: "bg-green-400/10",
      description: "Upload a photo of your crop to get instant AI-powered analysis.",
      steps: [
        "Navigate to the 'Analyze New Crop' section from the Dashboard.",
        "Click to browse or drag & drop an image of your crop.",
        "Wait for the AI to scan and analyze the image.",
        "View the detailed report including crop name, grade, current market price, demand, and sell recommendations."
      ]
    },
    {
      title: "Market Insights",
      icon: TrendingUp,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
      description: "Stay updated with the latest market trends and prices.",
      steps: [
        "Go to 'Market Insights' from the navigation menu or dashboard.",
        "Enter the name of the crop you want to research.",
        "Click 'Get Insights' to receive real-time AI predictions on market trends (Rising/Falling/Stable).",
        "Use the 'Compare Crops' feature to evaluate two different crops side-by-side for better profitability."
      ]
    },
    {
      title: "Smart Chat Support",
      icon: MessageSquare,
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
      description: "Get 24/7 agricultural advice from our AI assistant.",
      steps: [
        "Click on 'Support' in the navigation bar.",
        "Type your questions about farming techniques, weather protection, or pricing strategies.",
        "The AI assistant will provide tailored, expert-level advice instantly."
      ]
    },
    {
      title: "Live Sessions",
      icon: Video,
      color: "text-red-400",
      bgColor: "bg-red-400/10",
      description: "Join live webinars and training sessions with agricultural experts.",
      steps: [
        "Visit the 'Sessions' page to view upcoming expert talks.",
        "Click 'Start Session' to join a live video room.",
        "Toggle your microphone and camera using the on-screen controls."
      ]
    },
    {
      title: "History & Export",
      icon: History,
      color: "text-yellow-400",
      bgColor: "bg-yellow-400/10",
      description: "Keep track of all your past crop analyses.",
      steps: [
        "Access 'History' from the navigation bar.",
        "Review all previously analyzed crops, their grades, and dates.",
        "Click 'Export CSV' to download your records for offline viewing or bookkeeping.",
        "Use the trash icon to delete any unwanted records."
      ]
    }
  ];

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-16">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary mx-auto mb-6">
            <BookOpen className="w-10 h-10" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">KisanSetu User Guide</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Welcome to KisanSetu! This guide will help you navigate the app and make the most out of our AI-powered agricultural tools.
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((section, index) => (
            <div key={index}>
              <Card className="p-8 border-gray-800 hover:border-gray-700 transition-colors">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className={`p-4 rounded-2xl ${section.bgColor} ${section.color} shrink-0`}>
                    <section.icon className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-3">{section.title}</h3>
                    <p className="text-gray-400 mb-6">{section.description}</p>
                    
                    <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                      <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">How to use:</h4>
                      <ul className="space-y-3">
                        {section.steps.map((step, stepIndex) => (
                          <li key={stepIndex} className="flex items-start gap-3 text-gray-300">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-800 text-xs font-bold text-primary shrink-0 mt-0.5">
                              {stepIndex + 1}
                            </span>
                            <span className="leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
