import React, { useState, useEffect, useRef } from 'react';
import { Hero } from './components/Hero';
import { LaevusChat } from './components/LaevusChat';
import { ChevronDown } from 'lucide-react';
import { AuthModal } from './components/AuthModal';
import { User } from 'firebase/auth';

const App: React.FC = () => {
  const [isPremium, setIsPremium] = useState(false);
  const [freeQuestionsCount, setFreeQuestionsCount] = useState(3);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isInterfaceDropdownOpen, setIsInterfaceDropdownOpen] = useState(false);
  const [sessionId, setSessionId] = useState('8829-X');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalRegisterMode, setAuthModalRegisterMode] = useState(false);
  
  // Reference to call clear history in LaevusChat
  const clearHistoryFnRef = useRef<() => void>(() => {});
  const setDropdownFnRef = useRef<(mode: 'none' | 'dead' | 'tarot') => void>(() => {});
  const releaseSpiritFnRef = useRef<() => void>(() => {});

  useEffect(() => {
    const savedPremium = localStorage.getItem('laevus_premium');
    if (savedPremium === 'true') {
      setIsPremium(true);
    }

    const savedCount = localStorage.getItem('laevus_free_count');
    if (savedCount !== null) {
      setFreeQuestionsCount(parseInt(savedCount, 10));
    }

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

  useEffect(() => {
    if (currentUser) {
      // If user is verified, auto-grant premium status
      if (currentUser.emailVerified) {
        setIsPremium(true);
      }
    } else {
      const savedPremium = localStorage.getItem('laevus_premium');
      setIsPremium(savedPremium === 'true');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('laevus_premium', isPremium.toString());
  }, [isPremium]);

  useEffect(() => {
    localStorage.setItem('laevus_free_count', freeQuestionsCount.toString());
  }, [freeQuestionsCount]);

  const handleRegisterClearHistory = (handler: () => void) => {
    clearHistoryFnRef.current = handler;
  };

  const handleRegisterSetDropdown = (handler: (mode: 'none' | 'dead' | 'tarot') => void) => {
    setDropdownFnRef.current = handler;
  };

  const handleRegisterReleaseSpirit = (handler: () => void) => {
    releaseSpiritFnRef.current = handler;
  };

  return (
    <div className="min-h-screen bg-[#121214] text-[#F8F7F4] selection:bg-[#E60026]/20 selection:text-[#E60026] overflow-y-auto overflow-x-hidden relative flex flex-col pb-8">
      
      {/* Centered Content Container */}
      <div className="flex-1 flex flex-col w-full max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Move Metaphysical Interface and upgrade to the very top above "Theleft.one presents" */}
        <header className="w-full pt-6 pb-4 border-b border-[#F8F7F4]/10 flex justify-between items-center text-[10px] tracking-[0.25em] font-mono text-zinc-500 uppercase shrink-0 relative z-35">
          <div className="relative flex flex-col items-start">
            <button 
              onClick={() => setIsInterfaceDropdownOpen(!isInterfaceDropdownOpen)}
              className="flex items-center gap-1 hover:text-[#E60026] transition-colors focus:outline-none font-bold"
            >
              <span>Metaphysical Interface</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isInterfaceDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Metaphysical Interface Dropdown Panel */}
            {isInterfaceDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsInterfaceDropdownOpen(false)}
                ></div>
                <div className="absolute left-0 mt-2 w-64 bg-[#111113] border border-zinc-850 rounded-lg shadow-2xl p-4.5 z-20 normal-case tracking-normal space-y-4 text-zinc-300">
                  <div className="border-b border-zinc-800/40 pb-2 flex items-center justify-between text-[9px] tracking-widest uppercase text-zinc-500 font-bold font-mono">
                    <span>Session: {sessionId}</span>
                    <span className="w-1.5 h-1.5 bg-[#E60026] rounded-full animate-ping"></span>
                  </div>

                  {/* Authentication Portal Section inside Dropdown */}
                  {!currentUser ? (
                    <div className="text-center py-1 space-y-2 border-b border-zinc-800/20 pb-3">
                      <p className="text-[8px] text-zinc-500 font-mono uppercase tracking-wider leading-none">Identity Portal</p>
                      <div className="flex justify-center items-center gap-3 text-xs font-mono">
                        <button
                          onClick={() => {
                            setAuthModalRegisterMode(false);
                            setIsAuthModalOpen(true);
                            setIsInterfaceDropdownOpen(false);
                          }}
                          className="text-[#E60026] hover:text-[#F8F7F4] font-bold uppercase cursor-pointer transition-colors duration-200"
                        >
                          Sign In
                        </button>
                        <span className="text-zinc-800">|</span>
                        <button
                          onClick={() => {
                            setAuthModalRegisterMode(true);
                            setIsAuthModalOpen(true);
                            setIsInterfaceDropdownOpen(false);
                          }}
                          className="text-[#E60026] hover:text-[#F8F7F4] font-bold uppercase cursor-pointer transition-colors duration-200"
                        >
                          Register
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-1 space-y-2 border-b border-zinc-800/20 pb-3">
                      <p className="text-[8px] text-zinc-500 font-mono uppercase tracking-wider leading-none">Aligned Aura</p>
                      <p className="text-[10px] text-zinc-400 font-medium truncate font-mono">{currentUser.email}</p>
                      <button
                        onClick={() => {
                          setIsAuthModalOpen(true);
                          setIsInterfaceDropdownOpen(false);
                        }}
                        className="text-[9px] font-mono text-[#E60026] hover:text-[#F8F7F4] uppercase tracking-wider cursor-pointer font-bold block mx-auto transition-colors duration-200"
                      >
                        Manage Identity
                      </button>
                    </div>
                  )}
                  
                  {/* Minimal links list - no borders or boxes */}
                  <div className="flex flex-col space-y-3 pl-0.5">
                    <button
                      onClick={() => {
                        if (setDropdownFnRef.current) setDropdownFnRef.current('none');
                        if (releaseSpiritFnRef.current) releaseSpiritFnRef.current();
                        setIsInterfaceDropdownOpen(false);
                      }}
                      className="text-left text-xs font-mono uppercase tracking-widest text-zinc-400 hover:text-[#E60026] transition-colors"
                    >
                      Chats
                    </button>
                    
                    <button
                      onClick={() => {
                        if (setDropdownFnRef.current) setDropdownFnRef.current('dead');
                        setIsInterfaceDropdownOpen(false);
                      }}
                      className="text-left text-xs font-mono uppercase tracking-widest text-zinc-400 hover:text-[#E60026] transition-colors"
                    >
                      The Afterlife
                    </button>
                    
                    <button
                      onClick={() => {
                        if (setDropdownFnRef.current) setDropdownFnRef.current('tarot');
                        setIsInterfaceDropdownOpen(false);
                      }}
                      className="text-left text-xs font-mono uppercase tracking-widest text-zinc-400 hover:text-[#E60026] transition-colors"
                    >
                      Your spreads
                    </button>
                    
                    <a
                      href="https://theleft.one"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-left text-xs font-mono uppercase tracking-widest text-zinc-400 hover:text-[#E60026] transition-colors flex items-center justify-between"
                    >
                      <span>theleft.one</span>
                      <span className="text-[9px] text-zinc-600">↗</span>
                    </a>
                    
                    <button
                      onClick={() => {
                        setShowUpgradeModal(true);
                        setIsInterfaceDropdownOpen(false);
                      }}
                      className="text-left text-xs font-mono uppercase tracking-widest text-[#E60026] hover:text-[#ff334b] transition-colors"
                    >
                      Pledge Premium
                    </button>
                  </div>

                  {/* Purge chats button box */}
                  <div className="pt-3 border-t border-zinc-800/40">
                    <button 
                      onClick={() => {
                        if (clearHistoryFnRef.current) {
                          clearHistoryFnRef.current();
                        }
                        setIsInterfaceDropdownOpen(false);
                      }}
                      className="w-full py-2 bg-black hover:bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-red-400 text-[10px] tracking-wider font-bold rounded text-center transition-colors uppercase font-mono"
                    >
                      Purge Chats
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Upgrade / status on top-right */}
          <div className="flex items-center gap-3">
            {/* Account Portal Button */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 px-2.5 py-1 rounded text-[9px] tracking-[0.2em] uppercase font-mono transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{currentUser ? (currentUser.email?.split('@')[0] || 'VESSEL') : 'SIGN IN'}</span>
            </button>

            {isPremium ? (
              <span className="text-amber-400 font-extrabold bg-amber-400/5 border border-amber-400/20 px-2.5 py-1 rounded text-[9px] tracking-[0.2em] uppercase">
                VIP ACTIVE
              </span>
            ) : (
              <button 
                onClick={() => setShowUpgradeModal(true)}
                className="text-[#E60026] hover:text-[#ff334b] font-extrabold border border-[#E60026]/20 hover:border-[#E60026] px-2.5 py-1 rounded text-[9px] tracking-[0.2em] uppercase transition-all duration-300 animate-pulse hover:animate-none"
              >
                UPGRADE
              </button>
            )}
          </div>
        </header>

        {/* Main Workspace Wrapper */}
        <main className="flex-1 flex flex-col justify-start items-center w-full">
          
          {/* 1. Hero Section */}
          <div className="w-full">
            <Hero />
          </div>

          {/* 2. Interactive Metaphysical Chat Area */}
          <div className="w-full">
            <LaevusChat 
              isPremium={isPremium}
              setIsPremium={setIsPremium}
              freeQuestionsCount={freeQuestionsCount}
              setFreeQuestionsCount={setFreeQuestionsCount}
              showUpgradeModal={showUpgradeModal}
              setShowUpgradeModal={setShowUpgradeModal}
              onRegisterClearHistory={handleRegisterClearHistory}
              onRegisterSetDropdown={handleRegisterSetDropdown}
              onRegisterReleaseSpirit={handleRegisterReleaseSpirit}
              currentUser={currentUser}
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
