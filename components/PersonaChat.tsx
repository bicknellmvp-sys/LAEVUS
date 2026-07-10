/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef } from 'react';
import { chatWithPersona } from '../services/gemini';
import { Creation } from './CreationHistory';
import { 
  PaperAirplaneIcon, 
  SparklesIcon, 
  ChatBubbleLeftRightIcon, 
  UserIcon,
  ArrowPathIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/solid';
import { CpuChipIcon } from '@heroicons/react/24/outline';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

interface PersonaChatProps {
  creation: Creation;
  isSpookyActive?: boolean;
  onSpookyTrigger?: (active: boolean) => void;
}

export const PersonaChat: React.FC<PersonaChatProps> = ({ 
  creation, 
  isSpookyActive = false, 
  onSpookyTrigger 
}) => {
  const [mode, setMode] = useState<'creator' | 'persona'>('creator');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Generate dynamic persona name based on active creation name
  const getPersonaName = () => {
    if (isSpookyActive) return 'Phantasmal Apparition';
    const name = creation.name.toLowerCase();
    if (name.includes('chess')) return 'Grandmaster Bobby';
    if (name.includes('cassette')) return 'DJ Cassette';
    if (name.includes('blog') || name.includes('vibe')) return 'Creative Blogger';
    
    // Fallback: capitalize creation name or part of it + " Persona"
    const cleanedName = creation.name.replace(/(_|-|\.json)/g, ' ');
    return `${cleanedName.charAt(0).toUpperCase()}${cleanedName.slice(1)} Spirit`;
  };

  const getPersonaSub = () => {
    if (isSpookyActive) return 'Whispering from the ethereal plane';
    const name = creation.name.toLowerCase();
    if (name.includes('chess')) return 'Tactical Chess Companion';
    if (name.includes('cassette')) return '80s Mixtape DJ';
    if (name.includes('blog') || name.includes('vibe')) return 'Curator & Writer';
    return 'Living Soul of the App';
  };

  const getPersonaAvatar = () => {
    if (isSpookyActive) return '💀';
    const name = creation.name.toLowerCase();
    if (name.includes('chess')) return '♟️';
    if (name.includes('cassette')) return '📻';
    if (name.includes('blog') || name.includes('vibe')) return '📝';
    return '👾';
  };

  // Dynamic Suggestion Chips
  const getSuggestions = () => {
    if (isSpookyActive) {
      return [
        "Tell me a spooky ghost story 🕯️",
        "Why are you trapped inside this code?",
        "Release my soul! (Exorcise)"
      ];
    }
    if (mode === 'creator') {
      return [
        "How does the code work?",
        "What design choices did you make?",
        "Suggest some improvements for this app"
      ];
    } else {
      const name = creation.name.toLowerCase();
      if (name.includes('chess')) {
        return [
          "Who are you?",
          "Explain a famous chess opening",
          "What is your favorite chess quote?"
        ];
      }
      if (name.includes('cassette')) {
        return [
          "Who are you?",
          "Give me some retro music recommendations",
          "Tell me why cassettes are awesome!"
        ];
      }
      return [
        "Who are you?",
        "Give me a tip on using this app!",
        "What is your favorite feature?"
      ];
    }
  };

  // Load chat history from localStorage on creation change, mode change or spooky change
  useEffect(() => {
    const key = `gemini_app_chat_${creation.id}_${mode}${isSpookyActive ? '_spooky' : ''}`;
    const saved = localStorage.getItem(key);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })));
      } catch (e) {
        console.error("Failed to load chat history", e);
        loadWelcomeMessage();
      }
    } else {
      loadWelcomeMessage();
    }
  }, [creation.id, mode, isSpookyActive]);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 0) {
      const key = `gemini_app_chat_${creation.id}_${mode}${isSpookyActive ? '_spooky' : ''}`;
      try {
        localStorage.setItem(key, JSON.stringify(messages));
      } catch (e) {
        console.warn("Local storage error saving chat messages", e);
      }
    }
  }, [messages, creation.id, mode, isSpookyActive]);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const loadWelcomeMessage = () => {
    let welcomeText = "";
    if (isSpookyActive) {
      welcomeText = `Greetings, seeker... 💀 I am the Phantasmal Apparition of this digital creation. The binary veil has parted, and you have summoned the ghostly resonance within the code of "**${creation.name}**". Speak softly... or tell me: how shall we dance in the dark? (Type "**exorcise**" or "**I see light**" to banish the spirits...)`;
    } else {
      welcomeText = mode === 'creator'
        ? `Hey there! I'm Gemini, the AI designer who crafted "**${creation.name}**" for you. I built it with customized visual layouts, integrated stylesheets, and complete Javascript interaction based on your intent. Ask me anything about how I coded it, my aesthetic choices, or how to expand its features!`
        : `Greetings! I am **${getPersonaName()}**, the living avatar and spirit of this very screen. I am fully immersed in "**${creation.name}**". How can I assist or entertain you today?`;
    }
    
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: welcomeText,
        timestamp: new Date()
      }
    ]);
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isTyping) return;

    const trimmedText = textToSend.trim();
    const lowerText = trimmedText.toLowerCase();

    // Spooky trigger activate
    if (lowerText === 'i see dead people') {
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        text: trimmedText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setIsTyping(true);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSpookyTrigger?.(true);
      setIsTyping(false);
      return;
    }

    // Spooky trigger deactivate / exorcise
    if (isSpookyActive && (lowerText === 'exorcise' || lowerText === 'i see light' || lowerText.includes('release my soul'))) {
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        text: trimmedText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setIsTyping(true);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSpookyTrigger?.(false);
      setIsTyping(false);
      return;
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: trimmedText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Prepare history formatted for the API (only user/model pairs)
      const formattedHistory = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.role,
          text: m.text
        }));

      const reply = await chatWithPersona(
        trimmedText,
        formattedHistory,
        creation.name,
        creation.html,
        mode,
        isSpookyActive
      );

      const modelMsg: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        text: reply,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        text: isSpookyActive 
          ? "The spiritual frequencies are unstable... Bzzzt... The connection was severed." 
          : "I encountered a transient error connecting to my neural network. Please check your network or try again in a moment!",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Clear this conversation history?")) {
      const key = `gemini_app_chat_${creation.id}_${mode}${isSpookyActive ? '_spooky' : ''}`;
      localStorage.removeItem(key);
      loadWelcomeMessage();
    }
  };

  return (
    <div 
      id="persona_chat_container" 
      className={`flex flex-col h-full overflow-hidden font-sans border-l transition-all duration-500 relative ${
        isSpookyActive 
          ? 'bg-purple-950/20 border-green-500/20 shadow-[inset_0_0_40px_rgba(34,197,94,0.05)]' 
          : 'bg-zinc-950/40 border-zinc-900'
      }`}
    >
      {/* Dynamic Spectral Glow Header for Spooky Mode */}
      {isSpookyActive && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-green-500 via-purple-500 to-green-500 animate-pulse z-20"></div>
      )}

      {/* Dynamic Header */}
      <div 
        id="chat_header" 
        className={`p-4 border-b shrink-0 flex flex-col gap-3 transition-colors duration-500 ${
          isSpookyActive ? 'bg-purple-950/50 border-green-500/10' : 'bg-[#121214] border-zinc-900'
        }`}
      >
        {/* Toggle between modes */}
        <div className={`flex p-1 rounded-lg border transition-colors duration-500 ${
          isSpookyActive ? 'bg-black/40 border-green-500/10' : 'bg-zinc-900/80 border-zinc-800'
        }`}>
          <button
            id="mode_btn_creator"
            onClick={() => setMode('creator')}
            disabled={isSpookyActive}
            className={`flex-1 flex items-center justify-center space-x-2 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
              isSpookyActive 
                ? 'opacity-40 cursor-not-allowed text-zinc-500'
                : mode === 'creator'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>AI Designer</span>
          </button>
          <button
            id="mode_btn_persona"
            onClick={() => setMode('persona')}
            disabled={isSpookyActive}
            className={`flex-1 flex items-center justify-center space-x-2 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
              isSpookyActive 
                ? 'bg-green-600/20 text-green-400 border border-green-500/20 shadow-sm'
                : mode === 'persona'
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />
            <span>{isSpookyActive ? 'App Phantom' : 'App Persona'}</span>
          </button>
        </div>

        {/* Profile Card based on mode */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isSpookyActive ? (
              <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-green-500/10 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)] animate-pulse text-lg">
                💀
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-purple-500 rounded-full border-2 border-zinc-950 animate-ping"></div>
              </div>
            ) : mode === 'creator' ? (
              <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-blue-500/10 border border-blue-500/20 shadow-inner">
                <SparklesIcon className="w-4 h-4 text-blue-400 animate-pulse" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-zinc-950"></div>
              </div>
            ) : (
              <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-inner text-lg">
                {getPersonaAvatar()}
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-zinc-950"></div>
              </div>
            )}
            <div>
              <h4 className={`text-xs font-bold font-mono tracking-wide uppercase transition-colors duration-500 ${
                isSpookyActive ? 'text-green-400 shadow-green-500/10' : 'text-zinc-200'
              }`}>
                {getPersonaName()}
              </h4>
              <p className={`text-[10px] transition-colors duration-500 ${isSpookyActive ? 'text-purple-400' : 'text-zinc-500'}`}>
                {getPersonaSub()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1.5">
            {isSpookyActive && (
              <button
                id="exorcise_quick_btn"
                onClick={() => handleSend('exorcise')}
                className="p-1.5 text-red-400 hover:text-red-300 rounded-md hover:bg-red-500/10 transition-colors border border-red-500/10"
                title="Exorcise Ghost"
              >
                <ShieldExclamationIcon className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              id="clear_chat_btn"
              onClick={handleClearHistory}
              className="p-1.5 text-zinc-600 hover:text-zinc-400 rounded-md hover:bg-zinc-900 transition-colors"
              title="Clear Chat History"
            >
              <ArrowPathIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div id="chat_messages_area" className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 max-w-[85%] ${
                isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Mini Avatar */}
              <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] border transition-colors duration-500 ${
                isUser 
                  ? isSpookyActive 
                    ? 'bg-purple-950/40 border-purple-800 text-purple-300'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300' 
                  : isSpookyActive 
                    ? 'bg-green-500/10 border-green-500/20 text-green-400 shadow-[0_0_5px_rgba(34,197,94,0.2)]'
                    : mode === 'creator' 
                      ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}>
                {isUser ? <UserIcon className="w-3.5 h-3.5" /> : (isSpookyActive ? '💀' : mode === 'creator' ? '🤖' : getPersonaAvatar())}
              </div>

              {/* Message Bubble */}
              <div className="flex flex-col gap-1">
                <div className={`p-3 rounded-2xl text-xs leading-relaxed transition-all duration-500 ${
                  isUser 
                    ? isSpookyActive
                      ? 'bg-purple-950/40 text-zinc-100 border border-purple-800 rounded-tr-none shadow-[0_0_8px_rgba(168,85,247,0.1)]'
                      : 'bg-zinc-800 text-zinc-100 rounded-tr-none' 
                    : isSpookyActive
                      ? 'bg-black/60 border border-green-500/20 text-green-300 rounded-tl-none font-mono tracking-wide leading-relaxed shadow-[0_0_12px_rgba(34,197,94,0.05)]'
                      : 'bg-zinc-900/60 border border-zinc-800/80 text-zinc-200 rounded-tl-none'
                }`}>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
                <span className={`text-[9px] text-zinc-600 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                  {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-start gap-2.5 mr-auto max-w-[85%]">
            <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] border ${
              isSpookyActive 
                ? 'bg-green-500/10 border-green-500/20 animate-bounce' 
                : mode === 'creator' 
                  ? 'bg-blue-500/10 border-blue-500/20' 
                  : 'bg-emerald-500/10 border-emerald-500/20'
            }`}>
              <CpuChipIcon className={`w-3.5 h-3.5 ${
                isSpookyActive ? 'text-green-400' : mode === 'creator' ? 'text-blue-400' : 'text-emerald-400'
              } animate-spin`} />
            </div>
            <div className={`p-3 rounded-2xl rounded-tl-none ${
              isSpookyActive ? 'bg-black/60 border border-green-500/20' : 'bg-zinc-900/60 border border-zinc-800/80'
            }`}>
              <div className="flex space-x-1">
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isSpookyActive ? 'bg-green-500' : 'bg-zinc-600'}`} style={{ animationDelay: '0ms' }}></div>
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isSpookyActive ? 'bg-green-500' : 'bg-zinc-600'}`} style={{ animationDelay: '150ms' }}></div>
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${isSpookyActive ? 'bg-green-500' : 'bg-zinc-600'}`} style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div id="chat_suggestions_area" className="px-4 py-2 shrink-0 border-t border-zinc-900/50 bg-black/10 flex flex-wrap gap-1.5 overflow-x-auto max-h-24 scrollbar-hide">
        {getSuggestions().map((s, idx) => (
          <button
            id={`suggestion_chip_${idx}`}
            key={idx}
            onClick={() => handleSend(s)}
            className={`text-[10px] py-1 px-2.5 rounded-full transition-all shrink-0 border ${
              isSpookyActive
                ? 'bg-purple-950/20 border-green-500/20 text-green-400 hover:border-green-400 hover:bg-green-500/10 hover:text-green-300'
                : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div 
        id="chat_input_container" 
        className={`p-4 border-t shrink-0 transition-colors duration-500 ${
          isSpookyActive ? 'bg-purple-950/40 border-green-500/10' : 'bg-[#0E0E10] border-zinc-900'
        }`}
      >
        <div className={`relative flex items-center rounded-xl px-3 py-1 transition-all duration-200 border ${
          isSpookyActive
            ? 'bg-black/60 border-green-500/30 hover:border-green-400 focus-within:!border-green-500'
            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 focus-within:!border-blue-500/50'
        }`}>
          <input
            id="chat_input_field"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSend(input);
              }
            }}
            disabled={isTyping}
            placeholder={
              isSpookyActive
                ? 'Speak with the apparition...'
                : mode === 'creator' 
                  ? 'Ask Gemini about design or code...' 
                  : `Chat with ${getPersonaName()}...`
            }
            className="flex-1 bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none py-2.5 pr-8"
          />
          <button
            id="chat_send_btn"
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isTyping}
            className={`absolute right-2.5 p-1.5 rounded-lg transition-all ${
              input.trim() && !isTyping
                ? isSpookyActive
                  ? 'bg-green-600 hover:bg-green-500 text-black shadow-md shadow-green-500/10'
                  : mode === 'creator'
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                : 'text-zinc-600 cursor-not-allowed'
            }`}
          >
            <PaperAirplaneIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
