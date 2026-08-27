import React from 'react';
import { motion } from 'motion/react';
import { Card } from '../components/ui/Card';
import { Mail, Phone, MapPin } from 'lucide-react';

export function ContactPage() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-4xl font-bold text-white mb-6 text-center">Contact Us</h2>
        <p className="text-gray-400 text-lg text-center mb-12">
          Have questions or need support? We're here to help. Reach out to the KisanSetu team.
        </p>

        <div className="grid gap-6">
          <Card className="flex items-center gap-6 p-6">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Email Support</h3>
              <p className="text-gray-400">support@kisansetu.com</p>
              <p className="text-sm text-gray-500 mt-1">We aim to reply within 24 hours.</p>
            </div>
          </Card>

          <Card className="flex items-center gap-6 p-6">
            <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Phone Support</h3>
              <p className="text-gray-400">+91 1800-123-4567</p>
              <p className="text-sm text-gray-500 mt-1">Mon-Fri from 9am to 6pm IST.</p>
            </div>
          </Card>

          <Card className="flex items-center gap-6 p-6">
            <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Office Address</h3>
              <p className="text-gray-400">KisanSetu Tech Hub, Agritech Park</p>
              <p className="text-gray-400">Bangalore, Karnataka 560001, India</p>
            </div>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
