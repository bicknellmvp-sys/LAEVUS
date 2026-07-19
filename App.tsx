import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Hero } from './components/Hero';
import { LaevusChat } from './components/LaevusChat';
import { AuthModal } from './components/AuthModal';
import { User } from 'firebase/auth';

// Define the precise types for our minimalist Tarot features
interface ThreeCardSpread {
  past: string;
  present: string;
  future: string;
}

const App: React.FC = () => {
  const [isPremium, setIsPremium] = useState(true); // Default to true as VIP is now active for all
  const [freeQuestionsCount, setFreeQuestionsCount] = useState(999);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [sessionId, setSessionId] = useState('8829-X');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalRegisterMode, setAuthModalRegisterMode] = useState(false);
  
  // Controls which view is active from the menu ('chat' is the default)
  const [activeView, setActiveView] = useState<string>('encyclopedia');
  
  // State for Feature 1 (Encyclopedia Persona Chat)
  const [selectedCard, setSelectedCard] = useState<string>('The High Priestess');
  const [personaQuery, setPersonaQuery] = useState<string>('');
  
  // State for Feature 2 (Physical Reading Synthesis)
  const [spread, setSpread] = useState<ThreeCardSpread>({ past: '', present: '', future: '' });
  const [readingQuery, setReadingQuery] = useState<string>('');

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

  const handleRegisterClearHistory = useCallback((handler: () => void) => {
    clearHistoryFnRef.current = handler;
  }, []);

  const handleRegisterReleaseSpirit = useCallback((handler: () => void) => {
    releaseSpiritFnRef.current = handler;
  }, []);

  const openAuthModal = useCallback((registerMode: boolean) => {
    setAuthModalRegisterMode(registerMode);
    setIsAuthModalOpen(true);
  }, []);

  // Shared theme styles for centered content containers
  const themeStyles = {
    container: {
      maxWidth: '650px',
      width: '100%',
      margin: '0 auto',
      padding: '40px 20px',
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center',
    },
    inputLine: {
      width: '100%',
      background: 'transparent',
      border: 'none',
      borderBottom: '1px solid #2C2C2E',
      color: '#E5E5E7',
      padding: '12px 0',
      fontSize: '1rem',
      outline: 'none',
      fontFamily: "'Inter', sans-serif",
    }
  };

  return (
    <div className="h-screen bg-[#111112] text-[#E5E5E7] selection:bg-[#E60026]/20 selection:text-[#E60026] overflow-x-hidden overflow-y-auto relative flex flex-col pb-2">
      
      {/* Centered Content Container */}
      <div className="flex-1 flex flex-col w-full relative z-10">
        
        {/* Main Workspace Wrapper */}
        <main className="flex-1 flex flex-col justify-start items-center w-full">
          
          {/* 1. Hero Section holding the new integrated THELEFT.ONE menu controls */}
          <div className="w-full flex-shrink-0">
            <Hero 
              activeView={activeView}
              setActiveView={setActiveView}
              currentUser={currentUser}
              onOpenAuth={openAuthModal}
            />
          </div>

          {/* 2. DYNAMIC WORKSPACE COMPONENT LAYER */}
          <div className="w-full flex-1 flex flex-col font-sans px-4">
            
            {/* RENDER THE ENCYCLOPEDIA CHAT PERSONA */}
            {activeView === 'encyclopedia' && (
              <div style={themeStyles.container}>
                <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '2rem', textAlign: 'center', margin: '0 0 8px 0', fontWeight: 400, letterSpacing: '0.05em' }}>
                  {selectedCard}
                </h2>
                <span style={{ color: '#8E8E93', fontSize: '0.75rem', textAlign: 'center', display: 'block', marginBottom: '40px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Interacted 14 times
                </span>

                <div style={{ textAlignment: 'left', margin: '24px 0 48px 0' }}>
                  <blockquote style={{ borderLeft: '2px solid #D4AF37', paddingLeft: '20px', margin: 0, fontStyle: 'italic', color: '#D1D1D6', fontSize: '1.05rem', lineHeight: '1.7' }}>
                    "Greetings, traveler. You seek the secrets hidden behind my veil..."
                  </blockquote>
                </div>

                <div style={{ position: 'relative', marginTop: 'auto' }}>
                  <input 
                    type="text" 
                    value={personaQuery}
                    onChange={(e) => setPersonaQuery(e.target.value)}
                    placeholder={`Ask ${selectedCard} a question...`} 
                    style={themeStyles.inputLine} 
                  />
                  <button style={{ position: 'absolute', right: 0, bottom: '12px', background: 'none', border: 'none', color: '#D4AF37', cursor: 'pointer', fontSize: '1.25rem' }}>
                    ➔
                  </button>
                </div>
              </div>
            )}

            {/* RENDER THE PHYSICAL REALM LOG FORM */}
            {activeView === 'physical-reading' && (
              <div style={themeStyles.container}>
                <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '1.75rem', textAlign: 'center', marginBottom: '48px', fontWeight: 400, letterSpacing: '0.05em' }}>
                  Physical Realm Input
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
                  {(['past', 'present', 'future'] as const).map((position) => (
                    <div key={position}>
                      <label style={{ color: '#8E8E93', fontSize: '0.7rem', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {position}
                      </label>
                      <select 
                        value={spread[position]}
                        onChange={(e) => setSpread({ ...spread, [position]: e.target.value })}
                        style={{ ...themeStyles.inputLine, cursor: 'pointer' }}
                      >
                        <option value="">Select Card</option>
                        <option value="The Fool">The Fool</option>
                        <option value="The Magician">The Magician</option>
                        <option value="The High Priestess">The High Priestess</option>
                      </select>
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: '48px' }}>
                  <label style={{ color: '#8E8E93', fontSize: '0.85rem', display: 'block', marginBottom: '12px' }}>
                    What query did you hold in your heart while shuffling?
                  </label>
                  <input 
                    type="text" 
                    value={readingQuery}
                    onChange={(e) => setReadingQuery(e.target.value)}
                    style={themeStyles.inputLine} 
                    placeholder="Type your context here..." 
                  />
                </div>

                <div style={{ textAlign: 'center' }}>
                  <button style={{ background: 'transparent', border: '1px solid #E5E5E7', color: '#E5E5E7', padding: '10px 36px', fontFamily: "'Cinzel', serif", fontSize: '0.85rem', cursor: 'pointer', letterSpacing: '0.15em', transition: 'all 0.3s ease' }}>
                    Weave Story
                  </button>
                </div>
              </div>
            )}

            {/* ORIGINAL CHAT WORKSPACE (Kept safely for legacy views) */}
            {activeView === 'chat' && (
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
            )}
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