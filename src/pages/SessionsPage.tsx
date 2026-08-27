import React from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Calendar, Video } from 'lucide-react';

export function SessionsPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const sessions = [
    { title: 'Advanced Irrigation Techniques', time: 'Today, 10:00 AM' },
    { title: 'Organic Pest Control', time: 'Tomorrow, 2:00 PM' },
  ];

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <h2 className="text-4xl font-bold text-white mb-10">Live Sessions</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {sessions.map((s, i) => (
          <div key={i}>
            <Card className="hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-full bg-primary/10 text-primary">
                  <Video className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{s.title}</h3>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Calendar className="w-4 h-4" />
                    {s.time}
                  </div>
                </div>
              </div>
              <Button className="w-full" onClick={() => onNavigate('live')}>Start Session</Button>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
