import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, FileText, Shield, UserCheck, AlertCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';

export function TermsPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const sections = [
    {
      icon: UserCheck,
      title: "User Responsibilities",
      content: "As a user of KisanSetu, you agree to provide accurate information regarding your crops and location. The AI analysis is a tool to assist, but final agricultural decisions should be made in consultation with local experts."
    },
    {
      icon: Shield,
      title: "Data Privacy",
      content: "We value your privacy. Your crop images and location data are used solely for providing accurate analysis and improving our AI models. We do not sell your personal data to third parties."
    },
    {
      icon: AlertCircle,
      title: "Disclaimer",
      content: "KisanSetu provides AI-driven insights. While we strive for high accuracy, we are not liable for any crop loss or financial decisions made based on the app's output. Always verify critical information."
    },
    {
      icon: FileText,
      title: "Updates to Terms",
      content: "We may update these terms from time to time. Continued use of the app after updates constitutes acceptance of the new terms."
    }
  ];

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={() => onNavigate('settings')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Settings
        </button>

        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">Terms & Conditions</h1>
            <p className="text-gray-500 text-sm">Last updated: April 6, 2026</p>
          </div>
        </div>

        <div className="space-y-6">
          {sections.map((section, i) => (
            <Card key={i} className="p-6 bg-zinc-900/50 border-white/5">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-xl bg-white/5 text-primary mt-1">
                  <section.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">{section.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {section.content}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-12 p-6 rounded-2xl bg-primary/5 border border-primary/20 text-center">
          <p className="text-sm text-gray-300">
            By using KisanSetu, you acknowledge that you have read and understood these terms.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
