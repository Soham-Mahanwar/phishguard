import React, { useState, useEffect, lazy, Suspense, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDocFromServer } from 'firebase/firestore';
import { auth, db, OperationType, handleFirestoreError } from './lib/firebase';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { OfflineIndicator } from './components/ui/OfflineIndicator';
import { NotificationProvider } from './contexts/NotificationContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Button } from './components/ui/Button';
import { Leaf, AlertCircle } from 'lucide-react';

// Lazy load pages
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ModeSelector = lazy(() => import('./components/ModeSelector').then(m => ({ default: m.ModeSelector })));
const UploadPage = lazy(() => import('./pages/UploadPage').then(m => ({ default: m.UploadPage })));
const ResultPage = lazy(() => import('./pages/ResultPage').then(m => ({ default: m.ResultPage })));
const ChatPage = lazy(() => import('./pages/ChatPage').then(m => ({ default: m.ChatPage })));
const SessionsPage = lazy(() => import('./pages/SessionsPage').then(m => ({ default: m.SessionsPage })));
const LiveSessionPage = lazy(() => import('./pages/LiveSessionPage').then(m => ({ default: m.LiveSessionPage })));
const MarketInsights = lazy(() => import('./pages/MarketInsights').then(m => ({ default: m.MarketInsights })));
const CompareCropsPage = lazy(() => import('./pages/CompareCropsPage').then(m => ({ default: m.CompareCropsPage })));
const HistoryPage = lazy(() => import('./pages/HistoryPage').then(m => ({ default: m.HistoryPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const EditProfilePage = lazy(() => import('./pages/EditProfilePage').then(m => ({ default: m.EditProfilePage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage').then(m => ({ default: m.FeedbackPage })));
const UserGuidePage = lazy(() => import('./pages/UserGuidePage').then(m => ({ default: m.UserGuidePage })));
const GuidancePage = lazy(() => import('./pages/GuidancePage').then(m => ({ default: m.GuidancePage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));

const FeedbackModal = lazy(() => import('./components/FeedbackModal').then(m => ({ default: m.FeedbackModal })));
const VoiceCompanion = lazy(() => import('./components/VoiceCompanion').then(m => ({ default: m.VoiceCompanion })));

const FirebaseContext = createContext<{ user: User | null; loading: boolean; error: string | null }>({ user: null, loading: true, error: null });

export const useFirebase = () => useContext(FirebaseContext);

const PageLoader = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent"
    />
  </div>
);

function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
          setError("Firebase configuration error. Please check your connection.");
        }
      }
    }
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Sync user profile to Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            lastLogin: new Date().toISOString()
          }, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
        }
      }
    });

    return unsubscribe;
  }, []);

  return (
    <FirebaseContext.Provider value={{ user, loading, error }}>
      {children}
    </FirebaseContext.Provider>
  );
}

function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      try {
        const errorData = JSON.parse(event.error.message);
        if (errorData.error && errorData.operationType) {
          setErrorMessage(`A database error occurred during ${errorData.operationType}. Please try again.`);
          setHasError(true);
        }
      } catch (e) {
        // Not a Firestore error
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0f0d] p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Oops! Something went wrong</h2>
        <p className="text-gray-400 mb-6">{errorMessage || "An unexpected error occurred."}</p>
        <Button onClick={() => window.location.reload()}>Reload Application</Button>
      </div>
    );
  }

  return <>{children}</>;
}

import { Onboarding } from './components/Onboarding';
import { MessageCircle } from 'lucide-react';

function AppContent() {
  const { user, loading, error: firebaseError } = useFirebase();
  const [currentPage, setCurrentPage] = useState('landing');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [image, setImage] = useState<string | null>(null);
  const [mode, setMode] = useState<'health' | 'price'>('price');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (user) {
      const hasSeenOnboarding = localStorage.getItem(`onboarding_seen_${user.uid}`);
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }

      const hasSeenFeedback = localStorage.getItem('kisanSetuFeedbackShown');
      if (!hasSeenFeedback) {
        const timer = setTimeout(() => setShowFeedback(true), 30000); // Show after 30s
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const handleOnboardingComplete = () => {
    if (user) {
      localStorage.setItem(`onboarding_seen_${user.uid}`, 'true');
    }
    setShowOnboarding(false);
    setCurrentPage('dashboard');
  };

  const navigate = (page: string, data?: any) => {
    if (page === 'result' && data) {
      setAnalysisData(data.data);
      setImage(data.image);
      setMode(data.type);
    } else if (page !== 'result') {
      setImage(null);
      setAnalysisData(null);
    }
    setCurrentPage(page);
  };

  const getBackgroundImage = () => {
    switch (currentPage) {
      case 'dashboard': return 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=2000'; // Farm field
      case 'insights': return 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=2000'; // Market
      case 'upload':
      case 'result': return 'https://images.unsplash.com/photo-1530836361253-efad5d6ff9eb?auto=format&fit=crop&q=80&w=2000'; // Close up leaves
      case 'mode-select': return 'https://images.unsplash.com/photo-1495107333309-f0675883775b?auto=format&fit=crop&q=80&w=2000'; // Farmer in field
      case 'chat': return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=2000'; // Digital communication
      case 'live': return 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2000'; // Tech/AI
      case 'compare': return 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=2000'; // Vegetables
      case 'history':
      case 'sessions': return 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=2000'; // Harvest/History
      case 'profile':
      case 'edit-profile':
      case 'settings': return 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=2000'; // Forest/Nature
      case 'guidance':
      case 'guide': return 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=2000'; // Learning
      case 'about':
      case 'contact':
      case 'feedback':
      case 'terms': return 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=2000'; // Landscape
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0f0d]">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center mb-8 border border-primary/20 shadow-[0_0_30px_rgba(34,197,94,0.15)]"
        >
          <Leaf className="w-14 h-14 text-primary" />
        </motion.div>
        <motion.h2
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-3xl font-bold text-white tracking-widest mb-3"
        >
          KISAN<span className="text-primary">SETU</span>
        </motion.h2>
        <p className="text-gray-400 font-medium tracking-wide">Preparing your agricultural workspace...</p>
      </div>
    );
  }

  if (firebaseError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0f0d] p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Connection Error</h2>
        <p className="text-gray-400 mb-6">{firebaseError}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const renderPage = () => {
    const page = (() => {
      switch (currentPage) {
        case 'landing': return <LandingPage onNavigate={navigate} user={user} />;
        case 'dashboard': return <DashboardPage onNavigate={navigate} />;
        case 'mode-select': return <ModeSelector onSelect={(selectedMode) => {
          setMode(selectedMode);
          setCurrentPage('upload');
        }} />;
        case 'upload': return <UploadPage mode={mode} onAnalyze={(img) => {
          setImage(img);
          setCurrentPage('result');
        }} />;
        case 'result': return <ResultPage mode={mode} image={image} onData={(data) => setAnalysisData(data)} initialData={analysisData} />;
        case 'chat': return <ChatPage />;
        case 'sessions': return <SessionsPage onNavigate={navigate} />;
        case 'live': return <LiveSessionPage onNavigate={navigate} />;
        case 'insights': return <MarketInsights onNavigate={navigate} />;
        case 'compare': return <CompareCropsPage />;
        case 'history': return <HistoryPage onNavigate={navigate} />;
        case 'profile': return <ProfilePage onNavigate={navigate} />;
        case 'edit-profile': return <EditProfilePage onNavigate={navigate} />;
        case 'about': return <AboutPage />;
        case 'contact': return <ContactPage />;
        case 'feedback': return <FeedbackPage />;
        case 'guide': return <UserGuidePage />;
        case 'guidance': return <GuidancePage />;
        case 'settings': return <SettingsPage onNavigate={navigate} />;
        case 'terms': return <TermsPage onNavigate={navigate} />;
        default: return <LandingPage onNavigate={navigate} user={user} />;
      }
    })();

    return (
      <Suspense fallback={<PageLoader />}>
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {page}
        </motion.div>
      </Suspense>
    );
  };

  const bgImage = getBackgroundImage();

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <AnimatePresence>
        {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      </AnimatePresence>

      {/* Dynamic Background */}
      {bgImage && (
        <div className="fixed inset-0 z-[-1]">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
            style={{ backgroundImage: `url(${bgImage})` }}
          />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80" />
        </div>
      )}

      <OfflineIndicator />
      {currentPage !== 'landing' && <Navbar onNavigate={navigate} />}
      
      <div className="flex-1">
        <AnimatePresence mode="wait">
          {renderPage()}
        </AnimatePresence>
      </div>

      <Footer onNavigate={navigate} />

      {/* Floating Action Buttons */}
      {currentPage !== 'landing' && (
        <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-4">
          <Suspense fallback={null}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('chat')}
              className="w-14 h-14 rounded-full bg-primary text-black flex items-center justify-center shadow-2xl border-4 border-black/20 hover:bg-primary-light transition-colors"
            >
              <MessageCircle className="w-7 h-7" />
            </motion.button>
            <VoiceCompanion />
            <FeedbackModal isVisible={showFeedback} onClose={() => setShowFeedback(false)} />
          </Suspense>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <LanguageProvider>
        <NotificationProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </NotificationProvider>
      </LanguageProvider>
    </FirebaseProvider>
  );
}
