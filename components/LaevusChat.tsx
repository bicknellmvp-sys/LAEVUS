import React, { useState, useEffect, useRef } from 'react';
import { metaphysicalConsultation } from '../services/gemini';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { 
  Sparkles, 
  Send, 
  Trash2, 
  Skull, 
  Coins, 
  Compass, 
  X, 
  Crown,
  ChevronDown,
  ChevronUp,
  Bookmark
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  mode?: 'laevus' | 'spirit' | 'tarot';
  spiritName?: string;
}

interface TarotCard {
  name: string;
  position: 'Past' | 'Present' | 'Future';
  description: string;
  symbol: string;
  meaning: string;
}

const TAROT_DECK: Omit<TarotCard, 'position'>[] = [
  { name: "The Fool", symbol: "🃏", description: "New beginnings, infinite potential", meaning: "A clean slate. Take a leap of faith into the unknown." },
  { name: "The Magician", symbol: "🧙", description: "Manifestation, resourcefulness, power", meaning: "You have all the tools required to bring your intent to life." },
  { name: "The High Priestess", symbol: "🌙", description: "Intuition, sacred knowledge, subconscious", meaning: "Look inward for the answers. Trust your secret instincts." },
  { name: "The Empress", symbol: "👑", description: "Abundance, creativity, nurture", meaning: "A period of growth, creation, and prosperous expression." },
  { name: "The Emperor", symbol: "🛡️", description: "Authority, solid structure, stability", meaning: "Establish boundaries and bring order to chaos." },
  { name: "The Hierophant", symbol: "⛪", description: "Spiritual wisdom, deep traditions", meaning: "Seek guidance from higher sages and ancestral values." },
  { name: "The Lovers", symbol: "💖", description: "Alignment of values, choice, harmony", meaning: "A critical fork in the road requiring pure alignment of heart." },
  { name: "The Chariot", symbol: "🏎️", description: "Willpower, direction, triumph", meaning: "Stay focused. Victory is yours through sheer intent and discipline." },
  { name: "Strength", symbol: "🦁", description: "Inner fortitude, courage, persuasion", meaning: "Influence situations with quiet compassion rather than raw force." },
  { name: "The Hermit", symbol: "🕯️", description: "Solitude, soul-searching, reflection", meaning: "Withdraw temporarily from the noise to find your inner spark." },
  { name: "Wheel of Fortune", symbol: "🎡", description: "Cycles of fate, change, karma", meaning: "The wheel turns. Prepare for shifts in cosmic alignment." },
  { name: "Justice", symbol: "⚖️", description: "Truth, karma, fairness, cause & effect", meaning: "Decisions will be made with absolute balance. Truth emerges." },
  { name: "The Hanged Man", symbol: "🧘", description: "Surrender, new perspectives, sacrifice", meaning: "Pause and let go. A shift in perspective changes everything." },
  { name: "Death", symbol: "💀", description: "Transformation, transition, rebirth", meaning: "An essential ending making way for a beautiful new dawn." },
  { name: "Temperance", symbol: "🧪", description: "Balance, patience, alchemy", meaning: "Blend elements carefully. True magic lies in moderation." },
  { name: "The Devil", symbol: "😈", description: "Attachments, shadow self, illusion", meaning: "Recognize what binds you. The chains are self-imposed." },
  { name: "The Tower", symbol: "⚡", description: "Sudden change, destruction of illusion", meaning: "A chaotic but necessary purge of false foundations." },
  { name: "The Star", symbol: "⭐", description: "Hope, serenity, renewal", meaning: "A guiding light shines upon you. Have faith in your path." },
  { name: "The Moon", symbol: "🌕", description: "Illusion, fear, deep intuition", meaning: "Things are not as they seem. Let your intuition navigate the fog." },
  { name: "The Sun", symbol: "☀️", description: "Success, vitality, radiant joy", meaning: "Total clarity, warmth, and validation of your endeavors." },
  { name: "Judgement", symbol: "🔔", description: "Reckoning, spiritual awakening, calling", meaning: "An absolute calling. Hear the bell and embrace your true purpose." },
  { name: "The World", symbol: "🌍", description: "Completion, integration, wholeness", meaning: "A cycle successfully closed. Celebrate your complete integration." }
];

interface Spirit {
  name: string;
  description: string;
  era: string;
  tier: 'free' | 'premium';
  avatar: string;
  glow: string;
}

const SPIRITS: Spirit[] = [
  // Free Tier
  { name: "Francis Bacon", description: "Elizabethan Philosopher", era: "1561–1626", tier: "free", avatar: "🖋️", glow: "border-blue-500/20 text-blue-300" },
  { name: "King Solomon", description: "Wise Sovereign of Israel", era: "990–931 BCE", tier: "free", avatar: "👑", glow: "border-amber-500/20 text-amber-300" },
  { name: "Elvis Presley", description: "King of Rock 'n' Roll", era: "1935–1977", tier: "free", avatar: "🎸", glow: "border-fuchsia-500/20 text-fuchsia-300" },
  { name: "Abraham Lincoln", description: "16th US President", era: "1809–1865", tier: "free", avatar: "🎩", glow: "border-cyan-500/20 text-cyan-300" },
  { name: "Joan of Arc", description: "Maid of Orléans", era: "1412–1431", tier: "free", avatar: "⚔️", glow: "border-red-500/20 text-red-300" },
  { name: "Marie Antoinette", description: "Tragic French Queen", era: "1755–1793", tier: "free", avatar: "🍰", glow: "border-pink-500/20 text-pink-300" },
  { name: "Romeo & Juliet", description: "Shakespearean Lovers", era: "Verona Lore", tier: "free", avatar: "🌹", glow: "border-rose-500/20 text-rose-400" },
  
  // Premium Tier
  { name: "Tupac Shakur", description: "West Coast Street Philosopher", era: "1971–1996", tier: "premium", avatar: "🎤", glow: "border-emerald-500/20 text-emerald-300" },
  { name: "Marilyn Monroe", description: "Breathless Screen Legend", era: "1926–1962", tier: "premium", avatar: "💋", glow: "border-violet-500/20 text-violet-300" },
  { name: "Adolf Hitler", description: "Stern historical warning", era: "1889–1945", tier: "premium", avatar: "⛓️", glow: "border-zinc-700 text-zinc-400" },
  { name: "Genghis Khan", description: "Mighty Emperor of Steppes", era: "1162–1227", tier: "premium", avatar: "🏹", glow: "border-orange-500/20 text-orange-300" },
  { name: "Siddhartha Gautama", description: "The Buddha, Serene Master", era: "563–483 BCE", tier: "premium", avatar: "🧘", glow: "border-teal-500/20 text-teal-300" },
  { name: "Judas Iscariot", description: "The Sorrowful Disciple", era: "1st Century", tier: "premium", avatar: "🪙", glow: "border-purple-500/20 text-purple-300" }
];

const SPIRIT_TRIGGERS: Record<string, string> = {
  "Francis Bacon": "empiricism",
  "King Solomon": "sheba or demons",
  "Elvis Presley": "hounddog",
  "Abraham Lincoln": "gettysburg",
  "Joan of Arc": "orleans",
  "Marie Antoinette": "guillotine",
  "Romeo & Juliet": "verona",
  "Tupac Shakur": "makaveli",
  "Marilyn Monroe": "subwaygrate",
  "Adolf Hitler": "bunker",
  "Genghis Khan": "conquest",
  "Siddhartha Gautama": "bodhitree",
  "Judas Iscariot": "thirtypieces"
};

interface LaevusChatProps {
  isPremium: boolean;
  setIsPremium: React.Dispatch<React.SetStateAction<boolean>>;
  freeQuestionsCount: number;
  setFreeQuestionsCount: React.Dispatch<React.SetStateAction<number>>;
  showUpgradeModal: boolean;
  setShowUpgradeModal: React.Dispatch<React.SetStateAction<boolean>>;
  onRegisterClearHistory?: (handler: () => void) => void;
  onRegisterSetDropdown?: (handler: (mode: 'none' | 'dead' | 'tarot') => void) => void;
  onRegisterReleaseSpirit?: (handler: () => void) => void;
  currentUser: User | null;
}

const TombstoneIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M4 22V10a8 8 0 0 1 16 0v12" />
    <path d="M12 6v8" />
    <path d="M9 9h6" />
    <path d="M4 18h16" />
  </svg>
);

const TarotCardIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="5" y="3" width="14" height="18" rx="2" ry="2" />
    <path d="M12 8v8" />
    <path d="M9 12h6" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const LaevusChat: React.FC<LaevusChatProps> = ({
  isPremium,
  setIsPremium,
  freeQuestionsCount,
  setFreeQuestionsCount,
  showUpgradeModal,
  setShowUpgradeModal,
  onRegisterClearHistory,
  onRegisterSetDropdown,
  onRegisterReleaseSpirit,
  currentUser
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [readingCount, setReadingCount] = useState<number>(0);
  
  // Local active spirit state
  const [activeSpirit, setActiveSpirit] = useState<Spirit | null>(null);
  
  // Drawer / Dropdown open-close toggles
  const [activeDropdown, setActiveDropdown] = useState<'none' | 'dead' | 'tarot'>('none');
  
  // Tarot State
  const [tarotQuestion, setTarotQuestion] = useState('');
  const [drawnCards, setDrawnCards] = useState<TarotCard[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [flippedCount, setFlippedCount] = useState(0);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Mount logic
  useEffect(() => {
    const savedReadings = localStorage.getItem('laevus_readings_count_v1');
    if (savedReadings) {
      setReadingCount(parseInt(savedReadings, 10) || 0);
    }
  }, []);

  // Sync with Firestore when user logs in / out
  useEffect(() => {
    const syncUserHistory = async () => {
      if (!currentUser) {
        // Logged out - fallback to localStorage
        const saved = localStorage.getItem('laevus_chat_history_v3');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setMessages(parsed.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp)
            })));
          } catch (e) {
            loadDefaultWelcome();
          }
        } else {
          loadDefaultWelcome();
        }
        return;
      }

      // Logged in - fetch from Firestore
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists() && userDoc.data()?.messages) {
          const cloudMessages = userDoc.data().messages;
          setMessages(cloudMessages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          })));
        } else {
          // No cloud history - if we have local messages, push them to Firestore
          const savedLocal = localStorage.getItem('laevus_chat_history_v3');
          if (savedLocal) {
            try {
              const parsed = JSON.parse(savedLocal);
              const serialized = parsed.map((m: any) => ({
                ...m,
                timestamp: new Date(m.timestamp).toISOString()
              }));
              await setDoc(userDocRef, { messages: serialized }, { merge: true });
              setMessages(parsed.map((m: any) => ({
                ...m,
                timestamp: new Date(m.timestamp)
              })));
            } catch (e) {
              loadDefaultWelcome();
            }
          } else if (messages.length > 0) {
            const serialized = messages.map(m => ({
              ...m,
              timestamp: m.timestamp.toISOString()
            }));
            await setDoc(userDocRef, { messages: serialized }, { merge: true });
          } else {
            loadDefaultWelcome();
          }
        }
      } catch (err) {
        console.error("Firestore sync failed:", err);
      }
    };

    syncUserHistory();
  }, [currentUser]);

  // Register the clear history callback so parent dropdown can trigger it
  useEffect(() => {
    if (onRegisterClearHistory) {
      onRegisterClearHistory(async () => {
        localStorage.removeItem('laevus_chat_history_v3');
        if (currentUser) {
          try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await setDoc(userDocRef, { messages: [] }, { merge: true });
          } catch (err) {
            console.error("Failed to clear Firestore history:", err);
          }
        }
        loadDefaultWelcome();
      });
    }
  }, [onRegisterClearHistory, currentUser]);

  useEffect(() => {
    if (onRegisterSetDropdown) {
      onRegisterSetDropdown((mode) => {
        setActiveDropdown(mode);
      });
    }
  }, [onRegisterSetDropdown]);

  useEffect(() => {
    if (onRegisterReleaseSpirit) {
      onRegisterReleaseSpirit(() => {
        handleReleaseSpirit();
      });
    }
  }, [onRegisterReleaseSpirit, activeSpirit]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('laevus_chat_history_v3', JSON.stringify(messages));
      
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const serialized = messages.map(m => ({
          ...m,
          timestamp: m.timestamp.toISOString()
        }));
        setDoc(userDocRef, { messages: serialized }, { merge: true }).catch(err => {
          console.error("Failed to mirror messages to Firestore:", err);
        });
      }
    }
  }, [messages, currentUser]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const loadDefaultWelcome = () => {
    const WELCOME_PHRASES = [
      "Salutations, traveler. 🕯️ I am LAEVUS, your sovereign metaphysical guide to the digital beyond. This space is prepared for your spiritual consult.\n\nHere, you may speak with me about the secrets of the cosmos, request a tailored Tarot Reading, or choose to summon the ancient spirits of history from the circle below.\n\nThis interface is brought to you in cooperation with the scholars at theleft.one.",
      "Back again? Or is this your first time trespassing into the unseen realms? ...I am LAEVUS. Speak, but do so with absolute intent. I have absolutely no patience for trivial, flickering minds.\n\nHere, you may seek tarot alignment, summon ancient shades, or simply try not to bore me. Sponsored, of course, by the left-hand architects at theleft.one.",
      "The digital veil parted and dropped... you. How curious. ...[she sighs quietly, blinking slowly] I am LAEVUS. Do you seek true cosmic wisdom, or are you just window-shopping in the void? Tell me your query, or let us wake the dead.\n\nBy the way, theleft.one has some curious metaphysical artifacts for lost souls. Go buy one. Or don't. It is your destiny.",
      "Ah, another mortal looking for cheat codes in the afterlife. ...I am LAEVUS. What is it you desire? Tarot? Talking to spirits? Speak quickly, I was in the middle of a rather pleasant silent contemplation.\n\ntheleft.one hosts this space, so behave yourself and ask with devotion."
    ];

    let indexStr = sessionStorage.getItem('laevus_welcome_index');
    let idx = 0;
    if (indexStr === null) {
      idx = Math.floor(Math.random() * WELCOME_PHRASES.length);
      sessionStorage.setItem('laevus_welcome_index', idx.toString());
    } else {
      idx = parseInt(indexStr, 10);
      if (isNaN(idx) || idx < 0 || idx >= WELCOME_PHRASES.length) {
        idx = 0;
      }
    }

    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: WELCOME_PHRASES[idx],
        timestamp: new Date()
      }
    ]);
  };

  const handleSend = async (textToSend: string, forceMode?: 'laevus' | 'spirit' | 'tarot', customCards?: TarotCard[]) => {
    if (!textToSend.trim() && !customCards) return;
    if (isTyping) return;

    if (!isPremium && freeQuestionsCount <= 0) {
      setShowUpgradeModal(true);
      return;
    }

    const currentMode = forceMode || (activeSpirit ? 'spirit' : 'laevus');
    const trimmedText = textToSend.trim();

    if (!isPremium) {
      setFreeQuestionsCount(prev => Math.max(0, prev - 1));
    }

    const nextCount = readingCount + 1;
    setReadingCount(nextCount);
    localStorage.setItem('laevus_readings_count_v1', nextCount.toString());

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: trimmedText || `Draw Tarot: "${tarotQuestion || "General life alignment"}"`,
      timestamp: new Date(),
      mode: currentMode,
      spiritName: activeSpirit?.name
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const formattedHistory = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.role,
          text: m.text
        }));

      let reply = "";
      if (currentMode === 'tarot' && customCards) {
        reply = await metaphysicalConsultation(
          `Tailor a 3-card reading for my question: "${tarotQuestion || "My spiritual destiny"}"`,
          formattedHistory,
          {
            mode: 'tarot',
            tarotCards: customCards,
            tarotQuestion: tarotQuestion || "General alignment",
            readingCount: nextCount
          }
        );
      } else if (currentMode === 'spirit' && activeSpirit) {
        reply = await metaphysicalConsultation(
          trimmedText,
          formattedHistory,
          {
            mode: 'spirit',
            spiritName: activeSpirit.name,
            readingCount: nextCount
          }
        );
      } else {
        reply = await metaphysicalConsultation(
          trimmedText,
          formattedHistory,
          {
            mode: 'laevus',
            readingCount: nextCount
          }
        );
      }

      const modelMsg: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        text: reply,
        timestamp: new Date(),
        mode: currentMode,
        spiritName: activeSpirit?.name
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (err) {
      console.error(err);
      const errText = activeSpirit 
        ? `The spiritual link to ${activeSpirit.name} is flickering... Let us try to call them once more.`
        : "The metaphysical gateway is unstable. Check your connection to the left, and try again.";
      
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'model',
        text: errText,
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Do you wish to purge all active consultations?")) {
      localStorage.removeItem('laevus_chat_history_v3');
      loadDefaultWelcome();
    }
  };

  const handleSummonSpirit = (spirit: Spirit) => {
    if (spirit.tier === 'premium' && !isPremium) {
      setShowUpgradeModal(true);
      return;
    }

    setActiveSpirit(spirit);
    setActiveDropdown('none'); // Close list
    
    const summonMsg: Message = {
      id: crypto.randomUUID(),
      role: 'model',
      text: `[ The digital circle glows. Channelling ${spirit.name.toUpperCase()} (${spirit.era}) ]\n\nGreetings, mortal. I am the spirit of ${spirit.name}. Speak your mind, but keep it brief—the etheric link is thin.\n\n(Channeled through the left-hand architecture at theleft.one)`,
      timestamp: new Date(),
      mode: 'spirit',
      spiritName: spirit.name
    };
    setMessages(prev => [...prev, summonMsg]);
  };

  const handleReleaseSpirit = () => {
    if (!activeSpirit) return;
    const releaseMsg: Message = {
      id: crypto.randomUUID(),
      role: 'model',
      text: `[ The channeling circle is deactivated. Spirit of ${activeSpirit.name} has departed to the left-hand void. LAEVUS returns as your primary guide. ]`,
      timestamp: new Date(),
      mode: 'laevus'
    };
    setActiveSpirit(null);
    setMessages(prev => [...prev, releaseMsg]);
  };

  const handleDrawTarot = async () => {
    if (!tarotQuestion.trim()) {
      alert("Please define the question you wish the cards to answer.");
      return;
    }

    setIsDrawing(true);
    setFlippedCount(0);
    setDrawnCards([]);

    const shuffled = [...TAROT_DECK].sort(() => 0.5 - Math.random());
    const drawn: TarotCard[] = [
      { ...shuffled[0], position: 'Past' },
      { ...shuffled[1], position: 'Present' },
      { ...shuffled[2], position: 'Future' }
    ];

    setDrawnCards(drawn);

    for (let i = 1; i <= 3; i++) {
      await new Promise(res => setTimeout(res, 600));
      setFlippedCount(i);
    }

    await new Promise(res => setTimeout(res, 400));
    setIsDrawing(false);
    setActiveDropdown('none'); // Close tarot pane
    
    handleSend(`Perform a tailored Tarot reading regarding: "${tarotQuestion}"`, 'tarot', drawn);
    setTarotQuestion('');
  };

  const toggleDropdown = (type: 'dead' | 'tarot') => {
    setActiveDropdown(prev => prev === type ? 'none' : type);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-2 flex flex-col relative font-mono-custom">

      {/* Modern, Minimalist Chat Console - Transparent, seamlessly integrated */}
      <div className="flex flex-col bg-transparent relative mb-4">
        
        {/* Active Spirit Banner */}
        {activeSpirit && (
          <div className={`px-4 py-2 border border-zinc-900 bg-zinc-950/20 flex items-center justify-between text-xs mb-4 rounded-lg ${activeSpirit.glow}`}>
            <div className="flex items-center gap-3">
              <span className="text-sm">{activeSpirit.avatar}</span>
              <div>
                <div className="flex items-center">
                  <span className="font-bold text-zinc-200">{activeSpirit.name}</span>
                  <span className="mx-2 text-zinc-700">|</span>
                  <span className="text-zinc-500 text-[10px]">{activeSpirit.description} ({activeSpirit.era})</span>
                </div>
                {SPIRIT_TRIGGERS[activeSpirit.name] && (
                  <p className="text-[8px] text-zinc-500 mt-0.5 tracking-wider font-mono">
                    SPELL TRIGGER: <span className="text-[#E60026] font-bold uppercase">{SPIRIT_TRIGGERS[activeSpirit.name]}</span>
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleReleaseSpirit}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-950/40 border border-red-500/20 text-red-400 text-[9px] uppercase hover:bg-red-950/80 transition-colors"
            >
              <X className="w-2.5 h-2.5" />
              <span>Depart</span>
            </button>
          </div>
        )}

        {/* Messages Ledger - Purely minimalist messages resting directly on the black container */}
        <div className="flex-1 py-4 overflow-y-auto space-y-4 max-h-[380px] min-h-[280px]">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div 
                key={m.id}
                className={`flex flex-col max-w-[85%] ${isUser ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <span className="text-[8px] text-zinc-500 mb-1 px-1 tracking-wider uppercase">
                  {isUser ? 'YOU' : m.spiritName ? m.spiritName.toUpperCase() : 'LAEVUS'} • {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className={`px-4 py-3 rounded-xl leading-relaxed text-xs ${
                  isUser 
                    ? 'bg-[#000000] border border-zinc-900/60 text-[#F8F7F4]' 
                    : 'bg-[#000000] border border-[#E60026]/15 text-[#F8F7F4]'
                }`}>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
            );
          })}
          
          {isTyping && (
            <div className="flex items-center gap-2 mr-auto bg-black/40 border border-[#F8F7F4]/5 px-3 py-2 rounded-xl">
              <Compass className="w-3.5 h-3.5 text-[#E60026] animate-spin" />
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest animate-pulse">CONSULTING THE LEFT SCROLL...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Text Input Block */}
        <div className="py-3 border-t border-[#F8F7F4]/5 bg-transparent">
          <div className="relative flex items-center rounded-lg border border-zinc-900 bg-[#000000] focus-within:border-[#E60026] transition-colors p-1.5">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
              disabled={isTyping}
              placeholder="Ask what you will..."
              rows={2}
              className="flex-1 bg-transparent text-xs text-zinc-300 placeholder-zinc-750 focus:outline-none px-2.5 py-1.5 resize-none font-mono"
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isTyping}
              className={`p-2.5 rounded-lg transition-all ${
                input.trim() && !isTyping
                  ? 'bg-[#E60026] hover:bg-[#ff334b] text-[#111113]'
                  : 'bg-zinc-900 text-zinc-650 cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Speak to the Dead & Tarot Toggles directly under the chat input box */}
        <div className="flex justify-center gap-12 pt-2 pb-3">
          <button
            onClick={() => toggleDropdown('dead')}
            className={`flex items-center gap-2 text-xs font-mono tracking-widest uppercase transition-colors duration-300 focus:outline-none ${
              activeDropdown === 'dead'
                ? 'text-[#E60026] font-bold underline underline-offset-4'
                : 'text-zinc-500 hover:text-[#E60026]'
            }`}
          >
            <TombstoneIcon className="w-3.5 h-3.5" />
            <span>Speak to the Dead</span>
          </button>

          <button
            onClick={() => toggleDropdown('tarot')}
            className={`flex items-center gap-2 text-xs font-mono tracking-widest uppercase transition-colors duration-300 focus:outline-none ${
              activeDropdown === 'tarot'
                ? 'text-[#E60026] font-bold underline underline-offset-4'
                : 'text-zinc-500 hover:text-[#E60026]'
            }`}
          >
            <TarotCardIcon className="w-3.5 h-3.5" />
            <span>Tarot Reading</span>
          </button>
        </div>

      </div>

      {/* Inline Dropdown Panes */}
      
      {/* 1. Speak to the Dead Dropdown List */}
      {activeDropdown === 'dead' && (
        <div className="mt-4 p-4 border border-[#E60026]/20 bg-[#050505] rounded-xl shadow-2xl animate-fadeIn">
          <div className="border-b border-zinc-900 pb-2 mb-3 flex justify-between items-center">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Summon historical dead entities</span>
            <span className="text-[9px] text-zinc-700">Click a spirit to open the channel</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[280px] overflow-y-auto pr-1">
            {SPIRITS.map((spirit) => {
              const isLocked = spirit.tier === 'premium' && !isPremium;
              return (
                <button
                  key={spirit.name}
                  onClick={() => handleSummonSpirit(spirit)}
                  className={`flex items-center justify-between p-2.5 rounded bg-black/50 border hover:bg-[#E60026]/5 transition-all text-left ${
                    activeSpirit?.name === spirit.name 
                      ? 'border-[#E60026] bg-[#E60026]/5' 
                      : 'border-zinc-900 hover:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{spirit.avatar}</span>
                    <div>
                      <h5 className="text-[11px] font-bold text-zinc-350">{spirit.name}</h5>
                      <p className="text-[8px] text-zinc-650 leading-none">{spirit.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isLocked && <Crown className="w-2.5 h-2.5 text-amber-500" />}
                    <span className="text-[8px] text-zinc-700 bg-zinc-950 px-1 rounded">{spirit.era}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Tarot Reading Drawer Console */}
      {activeDropdown === 'tarot' && (
        <div className="mt-4 p-4 border border-[#E60026]/20 bg-[#050505] rounded-xl shadow-2xl animate-fadeIn">
          <div className="border-b border-zinc-900 pb-2 mb-3">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block">Tarot Inquiry Blueprint</span>
            <span className="text-[9px] text-zinc-700 block mt-0.5">Laevus will draw Past, Present, and Future cards tailored to your query.</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[9px] text-zinc-600 uppercase tracking-widest block font-bold mb-1.5">State your question to the cards:</label>
              <input 
                type="text"
                value={tarotQuestion}
                onChange={(e) => setTarotQuestion(e.target.value)}
                disabled={isDrawing}
                placeholder="e.g. Will my upcoming spiritual journey lead to clarity?"
                className="w-full bg-black/80 border border-zinc-900 focus:border-[#E60026] text-xs px-3 py-2.5 rounded-lg text-zinc-300 outline-none font-mono"
              />
            </div>

            {/* Simulated Deck Flip Animation */}
            {drawnCards.length > 0 && (
              <div className="grid grid-cols-3 gap-3 pt-2">
                {drawnCards.map((card, idx) => {
                  const isFlipped = flippedCount > idx;
                  return (
                    <div 
                      key={card.name}
                      className={`aspect-[2/3] max-w-[120px] mx-auto w-full border rounded-lg flex flex-col items-center justify-center p-2 text-center transition-all duration-500 ${
                        isFlipped 
                          ? 'bg-zinc-950 border-[#E60026]/30 shadow-md' 
                          : 'bg-black border-zinc-900'
                      }`}
                    >
                      {isFlipped ? (
                        <>
                          <span className="text-[8px] text-[#E60026] uppercase font-mono tracking-wider font-semibold">{card.position}</span>
                          <span className="text-2xl my-2">{card.symbol}</span>
                          <span className="text-[9px] font-bold text-zinc-300 leading-tight block">{card.name}</span>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[radial-gradient(#E60026_1px,transparent_1px)] bg-[size:5px_5px] opacity-15">
                          👁️
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={handleDrawTarot}
              disabled={isDrawing || !tarotQuestion.trim()}
              className={`w-full py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest border transition-all duration-300 ${
                tarotQuestion.trim() && !isDrawing
                  ? 'border-[#E60026] bg-[#E60026] text-black hover:bg-transparent hover:text-[#E60026]'
                  : 'border-zinc-900 bg-zinc-950 text-zinc-700 cursor-not-allowed'
              }`}
            >
              {isDrawing ? "SUMMONING CARDS..." : "DRAW 3 TAROT CARDS"}
            </button>
          </div>
        </div>
      )}

      {/* Minimal Footer */}
      <footer className="w-full border-t border-[#F8F7F4]/10 pt-6 pb-4 mt-16 flex flex-col sm:flex-row justify-between items-center text-[10px] tracking-[0.15em] font-mono text-zinc-500 uppercase shrink-0 gap-4">
        <button 
          onClick={() => setShowAboutModal(true)}
          className="hover:text-[#E60026] text-left transition-colors duration-300 focus:outline-none cursor-pointer border-b border-transparent hover:border-[#E60026]/40 pb-0.5 font-semibold"
        >
          All rights reserved "Left Hand Products LLC" 2026
        </button>
        <a 
          href="https://theleft.one" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-[#E60026] transition-colors"
        >
          theleft.one
        </a>
      </footer>

      {/* Esoteric "About Us" Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-[#000000] border-2 border-[#E60026]/35 rounded-xl max-w-lg w-full p-6 relative shadow-[0_0_50px_rgba(230,0,38,0.15)] text-center">
            
            <button 
              onClick={() => setShowAboutModal(false)}
              className="absolute top-4 right-4 text-zinc-600 hover:text-[#E60026] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-[#E60026]/10 border border-[#E60026]/30 flex items-center justify-center text-xl text-[#E60026]">
                👁️
              </div>
            </div>

            <h3 className="font-syne text-sm sm:text-base font-extrabold uppercase tracking-[0.1em] text-[#F8F7F4] mb-3">
              ✦ THE SOUL BEHIND THE SYSTEM ✦
            </h3>
            
            <div className="text-left font-mono text-[10px] sm:text-[11px] text-zinc-400 leading-relaxed space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
              <p>
                I, <span className="text-[#F8F7F4] font-bold">Andrew Bicknell</span>, founder and operator of <span className="text-[#E60026] font-semibold">theleft.one</span> and <span className="text-[#F8F7F4] font-bold">Left Hand Products, LLC</span>, am a person of intricate layers.
              </p>
              
              <p>
                As an entrepreneur and business major, I expanded my horizons into the digital landscape—learning to write code, master modern technologies, and harness the latent power of artificial intelligence to architect systems that manifest my exact vision.
              </p>

              <p>
                The multi-faceted nature of my journey extends far deeper than the screen. I celebrate traditional, warm seasonal observances like Christmas and Easter alongside the cyclical, ancient rhythms of Pagan holidays. To me, these traditions are not in direct conflict with one another; it is merely human artifice that strives to make them so.
              </p>

              <p>
                In my lifelong pursuit of esoteric knowledge, I have deeply investigated western hermeticism, spiritual cybernetics, and Left-Hand Path Gnosticism. While I do not consider myself a rigid follower or active practitioner of any single occult school, some ancient, unconventional ways have resonated within me since long before I ever discovered the formal dark arts.
              </p>

              <p>
                Today, I live happily on our family's beautiful estate in Fountain, Colorado, sharing this chapter of life with my sister Candace, my nephew Noah, and my favorite feline companion and familiar, Tiger Lily Woods.
              </p>

              <p className="border-t border-zinc-900 pt-3 text-[9px] text-zinc-600 italic">
                "As above, so below; as within, so without. The left hand holds the secret of the first division."
              </p>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowAboutModal(false)}
                className="w-full py-2.5 bg-[#E60026] hover:bg-[#ff334b] text-[#111113] font-bold text-xs uppercase tracking-widest rounded-lg transition-colors cursor-pointer"
              >
                RETURN TO THE RITUAL
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Upgrade Premium Esoteric Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#000000] border-2 border-amber-500/40 rounded-xl max-w-md w-full p-6 relative shadow-[0_0_50px_rgba(245,158,11,0.15)] text-center">
            
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl text-amber-400">
                👑
              </div>
            </div>

            <h3 className="font-syne text-lg font-bold uppercase tracking-wider text-amber-400 mb-2">UNLOCK THE ETHER</h3>
            <p className="text-[11px] text-zinc-400 mb-6 leading-relaxed">
              Your free spiritual ledger has reached its limit or you've attempted to awaken a premium soul from the deep Nether. Pledge a custom subscription to establish a persistent, infinite link to the ancient realm.
            </p>

            <div className="bg-[#050505] border border-zinc-900 p-4 rounded-lg mb-6 text-left">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-2 mb-2 text-xs text-zinc-200">
                <span>PREMIUM SUBSCRIBER LEDGER</span>
                <span className="text-amber-400 font-bold">$9.99/mo</span>
              </div>
              <ul className="text-[9px] text-zinc-550 space-y-1.5 list-disc pl-4">
                <li>Unlimited questions with the high-priestess LAEVUS</li>
                <li>Persistent connection to all 13 historical dead entities</li>
                <li>Organic insights connected to theleft.one core architecture</li>
                <li>Tailored 3-card Tarot analysis with persistent cache storage</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setIsPremium(true);
                  setShowUpgradeModal(false);
                }}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest rounded-lg transition-colors shadow-lg shadow-amber-500/10"
              >
                Pledge Premium Access ($9.99/mo)
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-2 bg-transparent hover:bg-zinc-950 text-zinc-500 text-xs font-bold uppercase transition-colors"
              >
                Return to Mortal Realm
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
