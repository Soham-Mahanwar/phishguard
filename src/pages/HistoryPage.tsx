import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { History, Clock, Leaf, Trash2, Download } from 'lucide-react';

export function HistoryPage({ onNavigate }: { onNavigate: (page: string, data?: any) => void }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      const savedHistory = JSON.parse(localStorage.getItem('kisanSetuHistory') || '[]');
      setHistory(savedHistory);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'users', auth.currentUser.uid, 'analyses'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Map Firestore data to the format expected by the UI
        crop: doc.data().cropName,
        date: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString()
      }));
      setHistory(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${auth.currentUser?.uid}/analyses`);
    });

    return unsubscribe;
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    
    if (auth.currentUser && typeof id === 'string') {
      try {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'analyses', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${auth.currentUser.uid}/analyses/${id}`);
      }
    } else {
      const updatedHistory = history.filter(item => item.id !== id);
      setHistory(updatedHistory);
      localStorage.setItem('kisanSetuHistory', JSON.stringify(updatedHistory));
    }
  };

  const handleItemClick = (item: any) => {
    if (item.data && item.image) {
      onNavigate('result', {
        data: item.data,
        image: item.image,
        type: item.type
      });
    }
  };

  const exportToCSV = () => {
    if (history.length === 0) return;

    const headers = ['ID', 'Crop Name', 'Date', 'Grade/Status'];
    const csvRows = [
      headers.join(','),
      ...history.map(item => `${item.id},"${item.crop}",${item.date},"${item.status}"`)
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'kisansetu_history.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-4xl font-bold text-white">Analysis History</h2>
          {history.length > 0 && (
            <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          )}
        </div>
        
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center p-10">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : history.length > 0 ? (
            history.map((item) => (
              <div key={item.id} onClick={() => handleItemClick(item)} className="cursor-pointer">
                <Card className="flex items-center justify-between p-6 bg-gray-900/80 backdrop-blur-sm border-gray-700 hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                      <Leaf className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{item.crop}</h3>
                      <p className="text-sm text-gray-400">{item.type === 'health' ? 'Health Status' : 'Grade'}: {item.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-gray-400">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{item.date}</span>
                    </div>
                    <button 
                      onClick={(e) => handleDelete(e, item.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-full transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </Card>
              </div>
            ))
          ) : (
            <Card className="p-10 text-center text-gray-400 bg-gray-900/80 backdrop-blur-sm border-gray-700">
              <History className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p>No recent analysis found.</p>
            </Card>
          )}
        </div>
      </motion.div>
    </div>
  );
}
