import React, { useState, useEffect, useRef } from 'react';
import { metaphysicalConsultation } from '../services/gemini';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { 
  Sparkles, 
  Send, 
  Skull, 
  Compass, 
  X, 
  BookOpen,
  Activity,
  User as UserIcon,
  ChevronRight,
  ChevronLeft
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
  { name: "Francis Bacon", description: "Elizabethan Philosopher", era: "1561–1626", tier: "free", avatar: "🖋️", glow: "border-blue-500/20 text-blue-300" },
  { name: "King Solomon", description: "Wise Sovereign of Israel", era: "990–931 BCE", tier: "free", avatar: "👑", glow: "border-amber-500/20 text-amber-300" },
  { name: "Elvis Presley", description: "King of Rock 'n' Roll", era: "1935–1977", tier: "free", avatar: "🎸", glow: "border-fuchsia-500/20 text-fuchsia-300" },
  { name: "Abraham Lincoln", description: "16th US President", era: "1809–1865", tier: "free", avatar: "🎩", glow: "border-cyan-500/20 text-cyan-300" },
  { name: "Joan of Arc", description: "Maid of Orléans", era: "1412–1431", tier: "free", avatar: "⚔️", glow: "border-red-500/20 text-red-300" },
  { name: "Marie Antoinette", description: "Tragic French Queen", era: "1755–1793", tier: "free", avatar: "🍰", glow: "border-pink-500/20 text-pink-300" },
  { name: "Romeo & Juliet", description: "Shakespearean Lovers", era: "Verona Lore", tier: "free", avatar: "🌹", glow: "border-rose-500/20 text-rose-400" },
  { name: "Tupac Shakur", description: "West Coast Street Philosopher", era: "1971–1996", tier: "premium", avatar: "🎤", glow: "border-emerald-500/20 text-emerald-300" },
  { name: "Marilyn Monroe", description: "Breathless Screen Legend", era: "1926–1962", tier: "premium", avatar: "💋", glow: "border-violet-500/20 text-violet-300" },
  { name: "Adolf Hitler", description: "Stern historical warning", era: "1889–1945", tier: "premium", avatar: "⛓️", glow: "border-zinc-700 text-zinc-400" },
  { name: "Genghis Khan", description: "Mighty Emperor of Steppes", era: "1162–1227", tier: "premium", avatar: "🏹", glow: "border-orange-500/20 text-orange-300" },
  { name: "Siddhartha Gautama", description: "The Buddha, Serene Master", era: "563–483 BCE", tier: "premium", avatar: "🧘", glow: "border-teal-500/20 text-teal-300" },
  { name: "Judas Iscariot", description: "The Sorrowful Disciple", era: "1st Century", tier: "premium", avatar: "🪙", glow: "border-purple-500/20 text-purple-300" }
];

interface Transcript {
  id: string;
  category: 'tarot' | 'afterlife' | 'madam';
  title: string;
  date: string;
  content: string;
  querentPrompt?: string;
  drawnCards?: TarotCard[];
  madamBlavatskyReply?: string;
}

interface LaevusChatProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isPremium: boolean;
  setIsPremium: React.Dispatch<React.SetStateAction<boolean>>;
  freeQuestionsCount: number;
  setFreeQuestionsCount: React.Dispatch<React.SetStateAction<number>>;
  showUpgradeModal: boolean;
  setShowUpgradeModal: React.Dispatch<React.SetStateAction<boolean>>;
  onRegisterClearHistory?: (handler: () => void) => void;
  onRegisterReleaseSpirit?: (handler: () => void) => void;
  currentUser: User | null;
  onOpenAuth: (registerMode: boolean) => void;
}

export const LaevusChat: React.FC<LaevusChatProps> = ({
  activeView,
  setActiveView,
  isPremium,
  setIsPremium,
  freeQuestionsCount,
  setFreeQuestionsCount,
  showUpgradeModal,
  setShowUpgradeModal,
  onRegisterClearHistory,
  onRegisterReleaseSpirit,
  currentUser,
  onOpenAuth
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [readingCount, setReadingCount] = useState<number>(0);
  
  // Local active spirit state
  const [activeSpirit, setActiveSpirit] = useState<Spirit | null>(null);
  
  // Tarot State
  const [tarotQuestion, setTarotQuestion] = useState('');
  const [drawnCards, setDrawnCards] = useState<TarotCard[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [flippedCount, setFlippedCount] = useState(0);
  const [showAboutModal, setShowAboutModal] = useState(false);

  // Stats / Streak states
  const [streakCount, setStreakCount] = useState(1);
  const [daysRegistered, setDaysRegistered] = useState(1);
  const [vesselJoinedDate, setVesselJoinedDate] = useState<string>('');

  // Sentiment Analysis and Transcripts state
  const [sentimentScores, setSentimentScores] = useState<number[]>([35, 45, 40, 60, 50]);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [activeTranscriptTab, setActiveTranscriptTab] = useState<'tarot' | 'afterlife' | 'madam'>('tarot');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Mount logic: Load statistics, seed sentiment and load welcome phrases
  useEffect(() => {
    const savedReadings = localStorage.getItem('laevus_readings_count_v1');
    if (savedReadings) {
      setReadingCount(parseInt(savedReadings, 10) || 0);
    }

    // Load / calculate streak & register duration
    const todayStr = new Date().toISOString().split('T')[0];
    let joinedDateStr = localStorage.getItem('laevus_vessel_joined_date');
    if (!joinedDateStr) {
      joinedDateStr = new Date().toISOString();
      localStorage.setItem('laevus_vessel_joined_date', joinedDateStr);
    }
    setVesselJoinedDate(joinedDateStr);

    const joinedDate = new Date(joinedDateStr);
    const todayDate = new Date(todayStr);
    const diffTime = Math.abs(todayDate.getTime() - joinedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    setDaysRegistered(diffDays);

    const lastActive = localStorage.getItem('laevus_vessel_last_active_date');
    let currentStreak = parseInt(localStorage.getItem('laevus_vessel_streak_count') || '1', 10);

    if (lastActive) {
      const lastActiveDate = new Date(lastActive);
      const activeDiffTime = todayDate.getTime() - lastActiveDate.getTime();
      const activeDiffDays = Math.floor(activeDiffTime / (1000 * 60 * 60 * 24));

      if (activeDiffDays === 1) {
        currentStreak += 1;
      } else if (activeDiffDays > 1) {
        currentStreak = 1; // broken streak
      }
    } else {
      currentStreak = 1;
    }
    setStreakCount(currentStreak);
    localStorage.setItem('laevus_vessel_last_active_date', todayStr);
    localStorage.setItem('laevus_vessel_streak_count', currentStreak.toString());

    // Load sentiment timeline
    const savedSentiment = localStorage.getItem('laevus_sentiment_timeline');
    if (savedSentiment) {
      try {
        setSentimentScores(JSON.parse(savedSentiment));
      } catch (e) {
        // default seeded values
      }
    }

    // Load transcripts
    const savedTranscripts = localStorage.getItem('laevus_transcripts_v1');
    if (savedTranscripts) {
      try {
        setTranscripts(JSON.parse(savedTranscripts));
      } catch (e) {
        // empty list
      }
    }
  }, []);

  // Sync with Firestore when user logs in / out
  useEffect(() => {
    const syncUserHistory = async () => {
      if (!currentUser) {
        // Load messages from local storage
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

        // Load transcripts from local storage
        const savedTranscripts = localStorage.getItem('laevus_transcripts_v1');
        if (savedTranscripts) {
          try {
            setTranscripts(JSON.parse(savedTranscripts));
          } catch (e) {}
        }

        // Load sentiment from local storage
        const savedSentiment = localStorage.getItem('laevus_sentiment_timeline');
        if (savedSentiment) {
          try {
            setSentimentScores(JSON.parse(savedSentiment));
          } catch (e) {}
        }
        return;
      }

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const cloudData = userDoc.data();
          
          // 1. Load Messages
          if (cloudData.messages && cloudData.messages.length > 0) {
            const cloudMessages = cloudData.messages;
            setMessages(cloudMessages.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp)
            })));
            localStorage.setItem('laevus_chat_history_v3', JSON.stringify(cloudMessages));
          } else {
            // Push local messages to cloud if local exists but cloud doesn't
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
            } else {
              loadDefaultWelcome();
            }
          }

          // 2. Load Transcripts
          if (cloudData.transcripts && cloudData.transcripts.length > 0) {
            setTranscripts(cloudData.transcripts);
            localStorage.setItem('laevus_transcripts_v1', JSON.stringify(cloudData.transcripts));
          } else {
            const savedTransLocal = localStorage.getItem('laevus_transcripts_v1');
            if (savedTransLocal) {
              try {
                const parsed = JSON.parse(savedTransLocal);
                await setDoc(userDocRef, { transcripts: parsed }, { merge: true });
                setTranscripts(parsed);
              } catch (e) {}
            }
          }

          // 3. Load Sentiment
          if (cloudData.sentimentScores && cloudData.sentimentScores.length > 0) {
            setSentimentScores(cloudData.sentimentScores);
            localStorage.setItem('laevus_sentiment_timeline', JSON.stringify(cloudData.sentimentScores));
          } else {
            const savedSentimentLocal = localStorage.getItem('laevus_sentiment_timeline');
            if (savedSentimentLocal) {
              try {
                const parsed = JSON.parse(savedSentimentLocal);
                await setDoc(userDocRef, { sentimentScores: parsed }, { merge: true });
                setSentimentScores(parsed);
              } catch (e) {}
            }
          }
        } else {
          // If doc doesn't exist, create it and push whatever local history we have
          const savedLocal = localStorage.getItem('laevus_chat_history_v3');
          const savedTransLocal = localStorage.getItem('laevus_transcripts_v1');
          const savedSentimentLocal = localStorage.getItem('laevus_sentiment_timeline');

          let initialMessages: any[] = [];
          let initialTranscripts: any[] = [];
          let initialSentiment: number[] = [35, 45, 40, 60, 50];

          if (savedLocal) {
            try {
              const parsed = JSON.parse(savedLocal);
              initialMessages = parsed.map((m: any) => ({
                ...m,
                timestamp: new Date(m.timestamp).toISOString()
              }));
              setMessages(parsed.map((m: any) => ({
                ...m,
                timestamp: new Date(m.timestamp)
              })));
            } catch (e) {}
          } else {
            loadDefaultWelcome();
          }

          if (savedTransLocal) {
            try {
              initialTranscripts = JSON.parse(savedTransLocal);
              setTranscripts(initialTranscripts);
            } catch (e) {}
          }

          if (savedSentimentLocal) {
            try {
              initialSentiment = JSON.parse(savedSentimentLocal);
              setSentimentScores(initialSentiment);
            } catch (e) {}
          }

          await setDoc(userDocRef, {
            email: currentUser.email,
            uid: currentUser.uid,
            messages: initialMessages,
            transcripts: initialTranscripts,
            sentimentScores: initialSentiment,
            lastLoginAt: new Date().toISOString()
          }, { merge: true });
        }
      } catch (err) {
        console.error("Firestore sync failed:", err);
      }
    };

    syncUserHistory();
  }, [currentUser]);

  // Sync transcripts with Firestore when active
  useEffect(() => {
    if (currentUser && transcripts.length > 0) {
      const userDocRef = doc(db, 'users', currentUser.uid);
      setDoc(userDocRef, { transcripts }, { merge: true }).catch(err => {
        console.error("Failed to mirror transcripts to cloud:", err);
      });
    }
  }, [transcripts, currentUser]);

  // Sync sentiment scores with Firestore when active
  useEffect(() => {
    if (currentUser && sentimentScores.length > 0) {
      const userDocRef = doc(db, 'users', currentUser.uid);
      setDoc(userDocRef, { sentimentScores }, { merge: true }).catch(err => {
        console.error("Failed to mirror sentiment scores to cloud:", err);
      });
    }
  }, [sentimentScores, currentUser]);

  // Register the clear history callback so parent dropdown can trigger it
  useEffect(() => {
    if (onRegisterClearHistory) {
      onRegisterClearHistory(async () => {
        localStorage.removeItem('laevus_chat_history_v3');
        localStorage.removeItem('laevus_transcripts_v1');
        localStorage.removeItem('laevus_sentiment_timeline');
        setTranscripts([]);
        setSentimentScores([35, 45, 40, 60, 50]);
        if (currentUser) {
          try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await setDoc(userDocRef, { messages: [], transcripts: [], sentimentScores: [] }, { merge: true });
          } catch (err) {
            console.error("Failed to clear Firestore history:", err);
          }
        }
        loadDefaultWelcome();
      });
    }
  }, [onRegisterClearHistory, currentUser]);

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
    if (activeView === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, activeView]);

  const loadDefaultWelcome = () => {
    const WELCOME_PHRASES = [
      "Welcome. I am LAEVUS. This space is prepared for your inquiry.\n\nHere, you can start a conversation, request a personal Tarot reading, or select a historical figure to talk with from the menu above.",
      "Welcome back. What would you like to explore today? We can do a Tarot reading, connect with historical figures, or discuss your topics directly.",
      "Hello. I am LAEVUS, your guide for reflection and inquiry. Feel free to seek a Tarot reading, summon a historical figure, or start a general chat.",
      "Welcome. What can I help you explore today? You can choose a Tarot card draw, talk with historical figures, or start a discussion here."
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

  const computeSentiment = (text: string): number => {
    const positiveWords = ['love', 'light', 'peace', 'happy', 'healing', 'harmony', 'growth', 'joy', 'blessed', 'wisdom', 'angels', 'serene', 'elevate', 'spirit', 'revelation', 'guide', 'future', 'tupac', 'elvis', 'blavatsky'];
    const negativeWords = ['sad', 'dark', 'pain', 'anger', 'hate', 'death', 'fear', 'broken', 'lost', 'shadow', 'trapped', 'bound', 'chaos', 'tower', 'devil', 'hell', 'suffering'];
    
    let score = 50;
    const words = text.toLowerCase().split(/\s+/);
    words.forEach(w => {
      const cleanWord = w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
      if (positiveWords.includes(cleanWord)) score += 12;
      if (negativeWords.includes(cleanWord)) score -= 12;
    });
    return Math.max(15, Math.min(85, score));
  };

  const addTranscriptRecord = (
    category: 'tarot' | 'afterlife' | 'madam',
    title: string,
    content: string,
    extraFields?: {
      querentPrompt?: string;
      drawnCards?: TarotCard[];
      madamBlavatskyReply?: string;
    }
  ) => {
    const newRecord: Transcript = {
      id: crypto.randomUUID(),
      category,
      title,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      content,
      ...extraFields
    };
    const updated = [newRecord, ...transcripts];
    setTranscripts(updated);
    localStorage.setItem('laevus_transcripts_v1', JSON.stringify(updated));
  };

  const handleSend = async (textToSend: string, forceMode?: 'laevus' | 'spirit' | 'tarot', customCards?: TarotCard[]) => {
    if (!textToSend.trim() && !customCards) return;
    if (isTyping) return;

    const currentMode = forceMode || (activeSpirit ? 'spirit' : 'laevus');
    const trimmedText = textToSend.trim();

    const nextCount = readingCount + 1;
    setReadingCount(nextCount);
    localStorage.setItem('laevus_readings_count_v1', nextCount.toString());

    // Parse sentiment from input
    const score = computeSentiment(trimmedText);
    const newScores = [...sentimentScores, score];
    setSentimentScores(newScores);
    localStorage.setItem('laevus_sentiment_timeline', JSON.stringify(newScores));

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

      await new Promise(resolve => setTimeout(resolve, 800));

      const modelMsg: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        text: reply,
        timestamp: new Date(),
        mode: currentMode,
        spiritName: activeSpirit?.name
      };

      setMessages(prev => [...prev, modelMsg]);

      // Save to transcripts
      if (currentMode === 'tarot' && customCards) {
        const cardsDesc = customCards.map(c => `[${c.position}] ${c.symbol} ${c.name} - ${c.meaning}`).join('\n');
        addTranscriptRecord(
          'tarot',
          `Spread: ${tarotQuestion || 'Life Alignment'}`,
          `Question: ${tarotQuestion}\n\nCards Drawn:\n${cardsDesc}\n\nInterpretation:\n${reply}`,
          {
            querentPrompt: tarotQuestion || "General alignment",
            drawnCards: customCards,
            madamBlavatskyReply: reply
          }
        );
      } else if (currentMode === 'spirit' && activeSpirit) {
        addTranscriptRecord(
          'afterlife',
          `Seance with ${activeSpirit.name}`,
          `User: ${trimmedText}\n\nSpirit: ${reply}`,
          {
            querentPrompt: trimmedText,
            madamBlavatskyReply: reply
          }
        );
      } else {
        addTranscriptRecord(
          'madam',
          `Consultation with Madam Blavatsky`,
          `User: ${trimmedText}\n\nBlavatsky: ${reply}`,
          {
            querentPrompt: trimmedText,
            madamBlavatskyReply: reply
          }
        );
      }

    } catch (err) {
      console.error(err);
      const errText = "An error occurred with the AI service. Please verify that your GEMINI_API_KEY environment variable is configured correctly.";
      
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

  const handleSummonSpirit = (spirit: Spirit) => {
    setActiveSpirit(spirit);
    setActiveView('chat');
    
    const summonMsg: Message = {
      id: crypto.randomUUID(),
      role: 'model',
      text: `[ Connected with ${spirit.name.toUpperCase()} (${spirit.era}) ]\n\nHello. I am ${spirit.name}. What would you like to discuss today?`,
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
      text: `[ Ended session with ${activeSpirit.name}. LAEVUS returns as your primary guide. ]`,
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
    setActiveView('chat');
    
    handleSend(`Perform a tailored Tarot reading regarding: "${tarotQuestion}"`, 'tarot', drawn);
    setTarotQuestion('');
  };

  // Compute metrics for The Inner Work
  const averageSentiment = sentimentScores.length > 0 
    ? Math.round(sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length)
    : 50;

  const getPastAdvice = () => {
    if (averageSentiment > 52) {
      return "Your communication history shows navigating trials with resilient grace, focusing on positive energy and alignment.";
    } else if (averageSentiment < 48) {
      return "Your logs indicate heavy pressure or complex challenges in previous seasons, requiring deep reflection.";
    } else {
      return "You have walked a path of quiet contemplation, balancing different perspectives and integrating internal thoughts.";
    }
  };

  const getFutureAdvice = () => {
    if (averageSentiment > 52) {
      return "A widening horizon suggests positive outcomes and opportunities for personal self-realization.";
    } else if (averageSentiment < 48) {
      return "A productive transition is approaching. Focus on stability and positive restoration.";
    } else {
      return "A blank canvas awaits. Trust your focus and prepare to establish fresh goals.";
    }
  };

  return (
    <div className="w-full px-2 sm:px-4 md:px-6 py-1 flex-1 min-h-0 h-full flex flex-col relative font-google-sans text-zinc-300 overflow-hidden">

      {/* RENDER THE ACTIVE OPTION */}
      
      {/* VIEW: CHAT WITH MADAM BLAVATSKY */}
      {activeView === 'chat' && (
        <div className="flex-1 min-h-0 flex flex-col p-1 mb-2 relative animate-fadeIn w-full max-w-[98%] mx-auto overflow-hidden font-google-sans">
          
          {/* Active Spirit Banner */}
          {activeSpirit && (
            <div className={`px-4 py-2 bg-zinc-950 flex items-center justify-between text-xs mb-2 rounded-lg border border-zinc-900/50 flex-shrink-0 font-google-sans ${activeSpirit.glow}`}>
              <div className="flex items-center gap-3">
                <span className="text-sm">{activeSpirit.avatar}</span>
                <div className="font-google-sans">
                  <div className="flex items-center">
                    <span className="font-bold text-zinc-200 font-google-sans">{activeSpirit.name}</span>
                    <span className="mx-2 text-zinc-700">|</span>
                    <span className="text-zinc-500 text-[10px] font-google-sans">{activeSpirit.description} ({activeSpirit.era})</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleReleaseSpirit}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 text-red-400 text-[9px] uppercase hover:bg-[#E60026]/10 transition-colors cursor-pointer border border-transparent font-google-sans"
              >
                <X className="w-2.5 h-2.5" />
                <span className="font-google-sans">Depart</span>
              </button>
            </div>
          )}

          {/* Messages Ledger (standard size) */}
          <div className="flex-1 py-2 overflow-y-auto space-y-3 border-b border-zinc-900/40 pr-2 min-h-0">
            {messages.map((m) => {
               const isUser = m.role === 'user';
               return (
                 <div 
                   key={m.id}
                   className={`flex flex-col max-w-[85%] ${isUser ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                 >
                   <span className="text-[8px] text-zinc-500 mb-1 px-1 tracking-wider uppercase font-google-sans">
                     {isUser ? 'YOU' : m.spiritName ? m.spiritName.toUpperCase() : 'LAEVUS'} • {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </span>
                   <div className={`px-4 py-3 rounded-xl leading-relaxed text-xs ${
                     isUser 
                       ? 'bg-zinc-900 text-[#F8F7F4]' 
                       : 'bg-zinc-950 text-[#F8F7F4]'
                   }`}>
                     <p className="whitespace-pre-wrap font-google-sans">{m.text}</p>
                   </div>
                 </div>
               );
            })}
            
            {isTyping && (
              <div className="flex items-center gap-2 mr-auto bg-zinc-950 px-3 py-2 rounded-xl">
                <Compass className="w-3.5 h-3.5 text-[#E60026] animate-spin" />
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest animate-pulse font-google-sans">Thinking...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input block */}
          <div className="pt-4 bg-transparent">
            <div className="relative flex items-center rounded-lg bg-zinc-950 focus-within:ring-1 focus-within:ring-[#E60026]/40 transition-all p-1.5">
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
                placeholder="Type your message here..."
                rows={2}
                className="flex-1 bg-transparent text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none px-2.5 py-1.5 resize-none font-google-sans"
              />
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isTyping}
                className={`p-2.5 rounded-lg transition-all ${
                  input.trim() && !isTyping
                    ? 'bg-[#E60026] hover:bg-[#ff334b] text-black cursor-pointer'
                    : 'bg-zinc-900 text-zinc-700 cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: GET A FREE READING! */}
      {activeView === 'tarot' && (
        <div className="p-3 sm:p-4 mb-2 relative animate-fadeIn space-y-4 w-full max-w-[98%] mx-auto flex-1 flex flex-col justify-center min-h-0">
          <div className="border-b border-zinc-900/40 pb-2">
            <span className="text-[10px] uppercase tracking-widest text-[#E60026] font-bold block font-google-sans">Tarot Card Draw</span>
            <span className="text-xs text-zinc-500 block mt-0.5 font-google-sans">Receive a Past, Present, and Future three-card Tarot reading.</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[9px] text-zinc-500 uppercase tracking-widest block font-bold mb-1 font-google-sans">Enter your question below:</label>
              <input 
                type="text"
                value={tarotQuestion}
                onChange={(e) => setTarotQuestion(e.target.value)}
                disabled={isDrawing}
                placeholder="e.g. Will my current project succeed?"
                className="w-full bg-zinc-950 border border-zinc-900 focus:border-[#E60026] text-xs px-3 py-2 rounded-lg text-zinc-300 outline-none font-google-sans placeholder-zinc-850"
              />
            </div>

            {drawnCards.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-2">
                {drawnCards.map((card, idx) => {
                  const isFlipped = flippedCount > idx;
                  return (
                    <div 
                      key={card.name}
                      className={`aspect-[2/3] max-w-[130px] mx-auto w-full rounded-lg flex flex-col items-center justify-center p-2.5 text-center transition-all duration-500 ${
                        isFlipped 
                          ? 'bg-zinc-950 shadow-sm' 
                          : 'bg-zinc-900/50'
                      }`}
                    >
                      {isFlipped ? (
                        <>
                          <span className="text-[8px] text-[#E60026] uppercase font-mono tracking-wider font-semibold">{card.position}</span>
                          <span className="text-2xl my-2">{card.symbol}</span>
                          <span className="text-[9px] font-bold text-zinc-200 leading-tight block font-google-sans">{card.name}</span>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[radial-gradient(#E60026_1px,transparent_1px)] bg-[size:5px_5px] opacity-25">
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
              className={`w-full py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all duration-300 cursor-pointer font-google-sans ${
                tarotQuestion.trim() && !isDrawing
                  ? 'bg-[#E60026] text-black hover:bg-[#ff334b]'
                  : 'bg-zinc-950 text-zinc-800 cursor-not-allowed'
              }`}
            >
              {isDrawing ? "DRAWING CARDS..." : "DRAW 3 CARDS"}
            </button>
          </div>
        </div>
      )}

      {/* VIEW: THE AFTERLIFE (SPEAK TO THE DEAD) */}
      {activeView === 'afterlife' && (
        <div className="p-4 sm:p-6 mb-4 relative animate-fadeIn space-y-6 w-full max-w-[98%] mx-auto">
          <div className="border-b border-zinc-900/40 pb-3 flex justify-between items-center">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#E60026] font-bold block">Converse with Historical Spirits & Figures</span>
              <span className="text-xs text-zinc-500 block mt-0.5">Select a historical figure below to start a chat session.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[480px] overflow-y-auto pr-1">
            {SPIRITS.map((spirit) => {
              return (
                <button
                  key={spirit.name}
                  onClick={() => handleSummonSpirit(spirit)}
                  className={`flex items-center justify-between p-3 rounded transition-all text-left cursor-pointer ${
                    activeSpirit?.name === spirit.name 
                      ? 'bg-[#E60026]/10 text-white font-bold' 
                      : 'bg-zinc-950 hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{spirit.avatar}</span>
                    <div>
                      <h5 className="text-xs font-bold text-zinc-200">{spirit.name}</h5>
                      <p className="text-[9px] text-zinc-500 leading-none mt-0.5">{spirit.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded">{spirit.era}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: TRANSCRIPTS */}
      {activeView === 'transcripts' && (
        <div className="p-4 sm:p-6 mb-4 relative animate-fadeIn space-y-6 w-full max-w-[98%] mx-auto">
          <div className="border-b border-zinc-900/40 pb-3">
            <span className="text-[10px] uppercase tracking-widest text-[#E60026] font-bold block">Saved Logs & Readings</span>
            <span className="text-xs text-zinc-500 block mt-0.5">Your archive of past readings and conversations.</span>
          </div>

          {/* Sub tabs */}
          <div className="flex gap-2 border-b border-zinc-900/40 pb-2">
            {(['tarot', 'afterlife', 'madam'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTranscriptTab(tab)}
                className={`px-4 py-1.5 text-[10px] uppercase tracking-widest font-bold border transition-colors cursor-pointer rounded ${
                  activeTranscriptTab === tab
                    ? 'border-[#E60026] bg-zinc-950 text-[#E60026]'
                    : 'border-zinc-900 bg-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab === 'tarot' ? 'Tarot Readings' : tab === 'afterlife' ? 'Historical Chats' : 'Madam Blavatsky'}
              </button>
            ))}
          </div>

          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
            {transcripts.filter(t => t.category === activeTranscriptTab).length === 0 ? (
              <div className="text-center py-12 text-zinc-600 text-xs uppercase tracking-widest">
                No logs stored in this section.
              </div>
            ) : (
              transcripts
                .filter(t => t.category === activeTranscriptTab)
                .map((record) => (
                  <div key={record.id} className="p-4 bg-zinc-950 rounded-lg space-y-2">
                    <div className="flex justify-between items-center text-[10px] border-b border-zinc-900/20 pb-1.5">
                      <span className="text-[#E60026] font-bold uppercase tracking-wider">{record.title}</span>
                      <span className="text-zinc-600">{record.date}</span>
                    </div>
                    <p className="text-xs leading-relaxed text-zinc-400 whitespace-pre-wrap">{record.content}</p>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* VIEW: THE INNER WORK (GRAPH & ARROWS) */}
      {activeView === 'inner-work' && (
        <div className="p-4 sm:p-6 mb-4 relative animate-fadeIn space-y-8 w-full max-w-[98%] mx-auto">
          <div className="border-b border-zinc-900/40 pb-3">
            <span className="text-[10px] uppercase tracking-widest text-[#E60026] font-bold block">Conversational Trajectory</span>
            <span className="text-xs text-zinc-500 block mt-0.5">View analysis of your previous chats and sentiment tracking over time.</span>
          </div>

          {/* Sentiment Trend Graph (gorgeous custom SVG) */}
          <div className="space-y-3">
            <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">Sentiment Analysis Plot</span>
            <div className="w-full h-72 bg-zinc-950 rounded-xl relative overflow-hidden flex flex-col justify-between p-4">
              
              {/* Dynamic Coordinate Grid Plot */}
              <div className="absolute inset-0 z-0 p-4 opacity-10 pointer-events-none">
                <div className="w-full h-full border-t border-b border-zinc-800 flex flex-col justify-between">
                  <div className="w-full border-b border-dashed border-zinc-700 h-1/2"></div>
                </div>
              </div>

              {/* Real SVG plot line and nodes */}
              <svg className="w-full h-full absolute inset-0 z-10 p-6" viewBox="0 0 500 200" preserveAspectRatio="none">
                {/* Horizontal Baseline (Neutral) */}
                <line x1="0" y1="100" x2="500" y2="100" stroke="#E60026" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
                
                {/* Plot line connecting nodes */}
                <path
                  d={sentimentScores.map((score, idx) => {
                    const x = (idx / (sentimentScores.length - 1)) * 500;
                    const y = 200 - ((score / 100) * 200);
                    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#333"
                  strokeWidth="2"
                  opacity="0.8"
                />

                {/* Markers with green and red highlighting */}
                {sentimentScores.map((score, idx) => {
                  const x = (idx / (sentimentScores.length - 1)) * 500;
                  const y = 200 - ((score / 100) * 200);
                  const isPositive = score > 50;
                  const isNegative = score < 50;
                  const color = isPositive ? '#22c55e' : isNegative ? '#ef4444' : '#a1a1aa';
                  const glowColor = isPositive ? 'rgba(34, 197, 94, 0.4)' : isNegative ? 'rgba(239, 68, 68, 0.4)' : 'rgba(161, 161, 170, 0.2)';

                  return (
                    <g key={idx}>
                      <circle cx={x} cy={y} r="10" fill={glowColor} />
                      <circle cx={x} cy={y} r="5" fill={color} />
                    </g>
                  );
                })}
              </svg>

              {/* Visual Labels inside the Graph */}
              <div className="z-20 w-full flex justify-between text-[8px] text-zinc-600 font-bold uppercase tracking-widest">
                <span>POSITIVE SENTIMENT</span>
                <span>NEUTRAL ZONE</span>
                <span>REFLECTIVE STATE</span>
              </div>
              
              <div className="z-20 w-full flex justify-between text-[8px] text-zinc-600 font-bold uppercase tracking-widest mt-auto">
                <span>EARLIER</span>
                <span>TIMELINE</span>
                <span>LATEST</span>
              </div>
            </div>
          </div>

          {/* TWO LARGE UNLABELED ARROWS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            
            {/* Arrow Pointing Left (The Past) */}
            <div className="relative bg-zinc-950 p-5 rounded-xl transition-colors group flex flex-col justify-between space-y-4 border border-zinc-900/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-[#E60026] group-hover:border-[#E60026]/30 transition-colors">
                  <ChevronLeft className="w-6 h-6" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">PAST SENTIMENT</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans italic">
                "{getPastAdvice()}"
              </p>
            </div>

            {/* Arrow Pointing Right (The Future) */}
            <div className="relative bg-zinc-950 p-5 rounded-xl transition-colors group flex flex-col justify-between space-y-4 border border-zinc-900/40">
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">FUTURE OUTLOOK</span>
                <div className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-[#E60026] group-hover:border-[#E60026]/30 transition-colors ml-auto">
                  <ChevronRight className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans italic">
                "{getFutureAdvice()}"
              </p>
            </div>

          </div>
        </div>
      )}

      {/* VIEW: MORTAL VESSEL (ACCOUNT DETAILS & STREAKS) */}
      {activeView === 'account' && (
        <div className="p-4 sm:p-6 mb-4 relative animate-fadeIn space-y-6 w-full max-w-[98%] mx-auto">
          <div className="border-b border-zinc-900/40 pb-3">
            <span className="text-[10px] uppercase tracking-widest text-[#E60026] font-bold block">Account Details</span>
            <span className="text-xs text-zinc-500 block mt-0.5">Your account details and statistics.</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Telemetry Item: Streak */}
            <div className="p-4 bg-zinc-950 rounded-xl space-y-1 text-center">
              <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">CONSECUTIVE DAYS ACTIVE</span>
              <span className="text-4xl font-extrabold text-[#E60026] block font-syne">{streakCount}</span>
              <span className="text-[10px] text-zinc-400">Your current login streak</span>
            </div>

            {/* Telemetry Item: Sign-up Days */}
            <div className="p-4 bg-zinc-950 rounded-xl space-y-1 text-center">
              <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">TOTAL TIME REGISTERED</span>
              <span className="text-4xl font-extrabold text-zinc-200 block font-syne">{daysRegistered}</span>
              <span className="text-[10px] text-zinc-400">Total days since your account was created</span>
            </div>

          </div>

          {/* Account Profile Box */}
          <div className="p-4 bg-zinc-950 rounded-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sm">
                👤
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">USER STATUS</span>
                <span className="text-xs text-zinc-300 font-bold">{currentUser ? currentUser.email : 'GUEST USER'}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              {!currentUser ? (
                <button
                  onClick={() => onOpenAuth(false)}
                  className="px-4 py-2 bg-zinc-900 hover:text-white rounded text-xs font-bold transition-colors uppercase cursor-pointer"
                >
                  Sign In
                </button>
              ) : (
                <button
                  onClick={() => onOpenAuth(false)}
                  className="px-4 py-2 bg-zinc-900 hover:text-white rounded text-xs font-bold transition-colors uppercase cursor-pointer"
                >
                  Manage Profile
                </button>
              )}

              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to reset your local data?")) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="px-4 py-2 bg-zinc-900/40 text-red-400 hover:bg-[#E60026]/15 hover:text-[#E60026] rounded text-xs font-bold transition-colors uppercase cursor-pointer ml-auto"
              >
                Purge Local Storage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MINIMAL FOOTER */}
      <footer className="w-full border-t border-[#F8F7F4]/5 pt-2 pb-1 mt-3 flex flex-col justify-between items-center text-[9px] tracking-[0.15em] font-mono text-zinc-600 uppercase shrink-0 gap-2">
        <div className="flex flex-col sm:flex-row justify-center items-center w-full gap-2">
          <button 
            onClick={() => setShowAboutModal(true)}
            className="hover:text-[#E60026] text-center transition-colors duration-300 focus:outline-none cursor-pointer border-b border-transparent hover:border-[#E60026]/40 pb-0.5 font-bold bg-zinc-950 px-3 py-1.5 rounded font-google-sans"
          >
            All rights reserved "Left Hand Products LLC" 2026
          </button>
        </div>
      </footer>

      {/* ESOTERIC ABOUT US MODAL */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-zinc-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full p-6 relative shadow-2xl text-center font-google-sans">
            
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

            <h3 className="font-google-sans text-sm sm:text-base font-extrabold uppercase tracking-[0.1em] text-[#F8F7F4] mb-3">
              ✦ THE SYSTEM ✦
            </h3>
            
            <div className="text-left font-google-sans text-[10px] sm:text-[11px] text-zinc-400 leading-relaxed space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
              <p>
                I, <span className="text-[#F8F7F4] font-bold">Andrew Bicknell</span>, founder and operator of <a href="https://theleft.one" target="_blank" rel="noopener noreferrer" className="font-ruthie text-base sm:text-lg text-zinc-300 hover:text-white inline-flex items-center gap-1 transition-colors mx-1">the<span className="text-[#E60026]">left</span>.one</a> and <span className="text-[#F8F7F4] font-bold">Left Hand Products, LLC</span>, am a person of intricate layers.
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

              <p className="border-t border-zinc-800/50 pt-3 text-[9px] text-zinc-600 italic">
                "As above, so below; as within, so without. The left hand holds the secret of the first division."
              </p>
            </div>

            <div className="mt-6 font-google-sans">
              <button
                onClick={() => setShowAboutModal(false)}
                className="w-full py-2.5 bg-[#E60026] hover:bg-[#ff334b] text-[#111113] font-bold text-xs uppercase tracking-widest rounded-lg transition-colors cursor-pointer font-google-sans"
              >
                RETURN TO CHAT
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
