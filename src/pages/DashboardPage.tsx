import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CloudSun, TrendingUp, History, MessageSquare, Leaf } from 'lucide-react';

export function DashboardPage({ onNavigate }: { onNavigate: (page: string, data?: any) => void }) {
  const [recentHistory, setRecentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      const savedHistory = JSON.parse(localStorage.getItem('kisanSetuHistory') || '[]');
      setRecentHistory(savedHistory.slice(0, 3));
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'users', auth.currentUser.uid, 'analyses'),
      orderBy('createdAt', 'desc'),
      limit(3)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        crop: doc.data().cropName,
        date: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString()
      }));
      setRecentHistory(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${auth.currentUser?.uid}/analyses`);
    });

    return unsubscribe;
  }, []);

  const handleItemClick = (item: any) => {
    if (item.data && item.image) {
      onNavigate('result', {
        data: item.data,
        image: item.image,
        type: item.type
      });
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-white mb-10">Welcome back, Farmer!</h1>
      
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-blue-500/10 text-blue-400">
            <CloudSun className="w-8 h-8" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Weather</p>
            <p className="text-xl font-bold">28°C, Sunny</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-primary/10 text-primary">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Indian Market Trend</p>
            <p className="text-xl font-bold">Up by 5% (INR)</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-purple-500/10 text-purple-400">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Support</p>
            <p className="text-xl font-bold">Active</p>
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
          <div className="flex flex-col gap-4">
            <Button onClick={() => onNavigate('upload')}>Analyze New Crop</Button>
            <Button variant="outline" onClick={() => onNavigate('insights')}>Market Insights</Button>
            <Button variant="outline" onClick={() => onNavigate('compare')}>Compare Crops</Button>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recent History</h2>
            <button onClick={() => onNavigate('history')} className="text-sm text-primary hover:underline">View All</button>
          </div>
          
          {loading ? (
            <div className="flex justify-center p-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : recentHistory.length > 0 ? (
            <div className="flex flex-col gap-4">
              {recentHistory.map(item => (
                <div key={item.id} onClick={() => handleItemClick(item)} className="flex items-center justify-between p-3 rounded-xl bg-gray-900/50 border border-gray-800 hover:border-primary/30 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                      <Leaf className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{item.crop}</p>
                      <p className="text-xs text-gray-400">{item.date}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-primary">{item.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-4 text-gray-400">
              <History className="w-6 h-6" />
              <p>No recent analysis found.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
