import React, { useState, useEffect, useRef } from 'react';
import { Hero } from './components/Hero';
import { LaevusChat } from './components/LaevusChat';
import { AuthModal } from './components/AuthModal';
import { User } from 'firebase/auth';

const App: React.FC = () => {
  const [isPremium, setIsPremium] = useState(true); // Default to true as VIP is now active for all
  const [freeQuestionsCount, setFreeQuestionsCount] = useState(999);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [sessionId, setSessionId] = useState('8829-X');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalRegisterMode, setAuthModalRegisterMode] = useState(false);
  const [activeView, setActiveView] = useState<string>('chat');
  
  // Reference to call clear history in LaevusChat
  const clearHistoryFnRef = useRef<() => void>(() => {});
  const releaseSpiritFnRef = useRef<() => void>(() => {});

  useEffect(() => {
    // Dynamic but persistent session ID per tab session
    let savedSession = sessionStorage.getItem('laevus_session_id');
    if (!savedSession) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const char = chars[Math.floor(Math.random() * chars.length)];
      savedSession = `${rand}-${char}`;
      sessionStorage.setItem('laevus_session_id', savedSession);
    }
    setSessionId(savedSession);
  }, []);

  const handleRegisterClearHistory = (handler: () => void) => {
    clearHistoryFnRef.current = handler;
  };

  const handleRegisterReleaseSpirit = (handler: () => void) => {
    releaseSpiritFnRef.current = handler;
  };

  const openAuthModal = (registerMode: boolean) => {
    setAuthModalRegisterMode(registerMode);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="h-screen bg-transparent text-[#F8F7F4] selection:bg-[#E60026]/20 selection:text-[#E60026] overflow-hidden relative flex flex-col pb-2">
      
      {/* Centered Content Container - max-w-none to let custom width grids behave beautifully */}
      <div className="flex-1 flex flex-col w-full relative z-10 overflow-hidden">
        
        {/* Main Workspace Wrapper */}
        <main className="flex-1 flex flex-col justify-start items-center w-full overflow-hidden">
          
          {/* 1. Hero Section holding the new integrated THELEFT.ONE dropdown */}
          <div className="w-full flex-shrink-0">
            <Hero 
              activeView={activeView}
              setActiveView={setActiveView}
              currentUser={currentUser}
              onOpenAuth={openAuthModal}
            />
          </div>

          {/* 2. Interactive Metaphysical Chat Area */}
          <div className="w-full flex-1 min-h-0 overflow-hidden flex flex-col font-google-sans">
            <LaevusChat 
              activeView={activeView}
              setActiveView={setActiveView}
              isPremium={isPremium}
              setIsPremium={setIsPremium}
              freeQuestionsCount={freeQuestionsCount}
              setFreeQuestionsCount={setFreeQuestionsCount}
              showUpgradeModal={showUpgradeModal}
              setShowUpgradeModal={setShowUpgradeModal}
              onRegisterClearHistory={handleRegisterClearHistory}
              onRegisterReleaseSpirit={handleRegisterReleaseSpirit}
              currentUser={currentUser}
              onOpenAuth={openAuthModal}
            />
          </div>

        </main>

        {/* Identity Authorization Overlay */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onUserChanged={setCurrentUser}
          initialRegisterMode={authModalRegisterMode}
        />

      </div>
    </div>
  );
};

export default App;
