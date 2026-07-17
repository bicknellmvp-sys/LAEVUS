import React, { useState } from 'react';
import { ChevronDown, Sparkles, Skull, Compass, BookOpen, Activity, User as UserIcon } from 'lucide-react';

interface HeroProps {
  activeView: string;
  setActiveView: (view: string) => void;
  currentUser: any;
  onOpenAuth: (registerMode: boolean) => void;
}

export const Hero: React.FC<HeroProps> = ({
  activeView,
  setActiveView,
  currentUser,
  onOpenAuth
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (view: string) => {
    setActiveView(view);
    setIsOpen(false);
  };

  const getActiveViewLabel = () => {
    switch (activeView) {
      case 'chat': return 'LAEVUS';
      case 'tarot': return 'Tarot Draw';
      case 'afterlife': return 'Speak to the Dead';
      case 'transcripts': return 'Transcripts';
      case 'inner-work': return 'The Inner Work';
      case 'account': return 'Account';
      default: return 'LAEVUS';
    }
  };

  return (
    <div className="text-center relative z-40 max-w-6xl mx-auto px-4 pt-3 pb-2 flex flex-col items-center">
      <div className="relative inline-block">
        <h1 className="font-syne text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-[-0.06em] text-[#F8F7F4] uppercase leading-[0.85] selection:bg-[#E60026] selection:text-[#111113] relative select-none">
          <button 
            onClick={() => setActiveView('chat')} 
            className="hover:text-[#E60026] hover:drop-shadow-[0_0_15px_rgba(230,0,38,0.6)] transition-all uppercase font-syne text-center tracking-[-0.06em] leading-none font-extrabold focus:outline-none cursor-pointer bg-transparent border-none p-0 outline-none"
          >
            LAEVUS
          </button>
          
          {/* THELEFT.ONE trigger dropped almost on top of the "US", specifically underneath on the right side */}
          <div className="absolute right-0 bottom-[-18px] sm:bottom-[-22px] md:bottom-[-26px] translate-y-[20%] z-50 flex flex-col items-end">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1.5 px-3 py-0.5 bg-black border border-zinc-900 rounded hover:border-[#E60026]/40 transition-colors cursor-pointer text-base sm:text-lg md:text-xl font-ruthie tracking-normal normal-case"
              id="theleftone-dropdown-trigger"
            >
              <span className="font-ruthie">the<span className="text-[#E60026]">left</span>.one</span>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu Categories */}
            {isOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                <div className="absolute right-0 mt-2.5 w-64 bg-black border border-zinc-900 rounded-lg shadow-[0_0_50px_rgba(230,0,38,0.15)] p-2.5 z-50 normal-case tracking-normal text-zinc-300 animate-fadeIn border-t-2 border-t-[#E60026]">

                  <div className="space-y-0.5 font-mono">
                    
                    {/* 1. Sign Up */}
                    {!currentUser && (
                      <button
                        onClick={() => {
                          onOpenAuth(true);
                          setIsOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-2 hover:bg-zinc-950 hover:text-white rounded text-xs flex items-center gap-2.5 transition-colors uppercase font-google-sans"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-[#E60026]" />
                        <div className="flex flex-col font-google-sans">
                          <span className="font-bold text-[10px] tracking-wider font-google-sans">Sign Up</span>
                        </div>
                      </button>
                    )}

                    {/* 2. Tarot Card Draw */}
                    <button
                      onClick={() => handleSelect('tarot')}
                      className={`w-full text-left px-2.5 py-2 hover:bg-zinc-950 rounded text-xs flex items-center gap-2.5 transition-colors uppercase font-google-sans ${
                        activeView === 'tarot' ? 'bg-zinc-950 text-[#E60026]' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="font-bold text-[10px] tracking-wider font-google-sans">Tarot Card Draw</span>
                    </button>

                    {/* 3. Speak to the Dead */}
                    <button
                      onClick={() => handleSelect('afterlife')}
                      className={`w-full text-left px-2.5 py-2 hover:bg-zinc-950 rounded text-xs flex items-center gap-2.5 transition-colors uppercase font-google-sans ${
                        activeView === 'afterlife' ? 'bg-zinc-950 text-[#E60026]' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Skull className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="font-bold text-[10px] tracking-wider font-google-sans">Speak to the Dead</span>
                    </button>

                    {/* 4. Transcripts */}
                    <button
                      onClick={() => handleSelect('transcripts')}
                      className={`w-full text-left px-2.5 py-2 hover:bg-zinc-950 rounded text-xs flex items-center gap-2.5 transition-colors uppercase font-google-sans ${
                        activeView === 'transcripts' ? 'bg-zinc-950 text-[#E60026]' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="font-bold text-[10px] tracking-wider font-google-sans">Transcripts</span>
                    </button>

                    {/* 5. The Inner Work */}
                    <button
                      onClick={() => handleSelect('inner-work')}
                      className={`w-full text-left px-2.5 py-2 hover:bg-zinc-950 rounded text-xs flex items-center gap-2.5 transition-colors uppercase font-google-sans ${
                        activeView === 'inner-work' ? 'bg-zinc-950 text-[#E60026]' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="font-bold text-[10px] tracking-wider font-google-sans">The Inner Work</span>
                    </button>

                    {/* 6. Account */}
                    <button
                      onClick={() => handleSelect('account')}
                      className={`w-full text-left px-2.5 py-2 hover:bg-zinc-950 rounded text-xs flex items-center gap-2.5 transition-colors uppercase font-google-sans ${
                        activeView === 'account' ? 'bg-zinc-950 text-[#E60026]' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="font-bold text-[10px] tracking-wider font-google-sans">Account</span>
                    </button>

                    {/* Divider */}
                    <div className="h-px bg-zinc-900 my-1" />

                    {/* 8. external link to theleft.one */}
                    <a
                      href="https://theleft.one"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-left px-2.5 py-1.5 hover:bg-zinc-950 rounded flex items-center gap-2.5 transition-colors text-lg text-zinc-300 hover:text-white"
                    >
                      <Compass className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="font-ruthie">the<span className="text-[#E60026]">left</span>.one</span>
                    </a>

                  </div>
                </div>
              </>
            )}
          </div>
        </h1>
      </div>
    </div>
  );
};
