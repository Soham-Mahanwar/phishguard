import React, { useState } from 'react';
import { motion } from 'motion/react';
import { updateProfile } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { User } from 'lucide-react';

export function EditProfilePage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const user = auth.currentUser;
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      await updateProfile(user, { displayName, photoURL });
      onNavigate('profile');
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setError(error.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-4xl font-bold text-white mb-10">Edit Profile</h2>
        <Card className="p-8">
          {error && <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg">{error}</div>}
          
          <div className="flex flex-col items-center mb-8">
            {photoURL ? (
              <img src={photoURL} alt="Profile Preview" className="w-32 h-32 rounded-full mb-4 border-4 border-primary/20 object-cover" referrerPolicy="no-referrer" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150')} />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center mb-4 border-4 border-primary/20">
                <User className="w-16 h-16 text-gray-400" />
              </div>
            )}
            <p className="text-sm text-gray-400">Profile Picture Preview</p>
          </div>

          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:border-primary focus:outline-none transition-colors"
                placeholder="Enter your name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Profile Picture URL</label>
              <input
                type="url"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:border-primary focus:outline-none transition-colors"
                placeholder="https://example.com/your-image.jpg"
              />
              <p className="text-xs text-gray-500 mt-2">Provide a direct link to an image (JPEG, PNG).</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button onClick={handleUpdate} disabled={loading} className="flex-1">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button variant="outline" onClick={() => onNavigate('profile')} disabled={loading} className="flex-1">
              Cancel
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
