import React from 'react';
import { auth } from '../lib/firebase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { User, Calendar, Clock, Settings } from 'lucide-react';

export function ProfilePage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const user = auth.currentUser;
  if (!user) return <div className="min-h-screen pt-32 px-6 text-white text-center">Please sign in.</div>;

  const metadata = [
    { label: 'Account Created', value: user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A', icon: Calendar },
    { label: 'Last Sign-in', value: user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'N/A', icon: Clock },
  ];

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <h2 className="text-4xl font-bold text-white">Profile</h2>
        <button 
          onClick={() => onNavigate('settings')}
          className="p-3 rounded-2xl bg-white/5 text-gray-400 hover:text-primary hover:bg-primary/10 transition-all border border-white/5"
          title="Settings"
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>
      <Card className="p-8">
        <div className="flex flex-col items-center mb-8">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-32 h-32 rounded-full mb-6 border-4 border-primary/20 object-cover" referrerPolicy="no-referrer" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150')} />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center mb-6 border-4 border-primary/20">
              <User className="w-16 h-16 text-gray-400" />
            </div>
          )}
          <h3 className="text-2xl font-bold text-white mb-1">{user.displayName || 'No Name'}</h3>
          <p className="text-primary font-medium">{user.email}</p>
          <Button variant="outline" className="mt-6" onClick={() => onNavigate('edit-profile')}>Edit Profile</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-card-border pt-8">
          {metadata.map((item, index) => (
            <div key={index} className="flex items-center gap-3 bg-card-border/30 p-4 rounded-xl">
              <item.icon className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">{item.label}</p>
                <p className="text-sm text-white font-medium">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
