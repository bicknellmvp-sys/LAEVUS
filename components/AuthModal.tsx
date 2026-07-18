import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendEmailVerification, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserChanged: (user: User | null) => void;
  initialRegisterMode?: boolean;
}

// Escoteric/mystical captcha items
interface CaptchaItem {
  icon: string;
  name: string;
  id: string;
}

const CAPTCHA_POOL: CaptchaItem[] = [
  { icon: '👁️', name: 'Third Eye', id: 'eye' },
  { icon: '🌙', name: 'Lunar Crescent', id: 'moon' },
  { icon: '🕯️', name: 'Seance Candle', id: 'candle' },
  { icon: '💎', name: 'Obsidian Stone', id: 'obsidian' },
  { icon: '💀', name: 'Mortal Skull', id: 'skull' },
  { icon: '🔮', name: 'Scrying Orb', id: 'orb' },
  { icon: '📜', name: 'Mystic Scroll', id: 'scroll' },
  { icon: '🪐', name: 'Saturnian Ring', id: 'saturn' },
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onUserChanged, initialRegisterMode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Captcha State
  const [captchaChallenge, setCaptchaChallenge] = useState<CaptchaItem | null>(null);
  const [captchaOptions, setCaptchaOptions] = useState<CaptchaItem[]>([]);
  const [selectedCaptchaId, setSelectedCaptchaId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      onUserChanged(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (initialRegisterMode !== undefined) {
        setIsRegister(initialRegisterMode);
      }
      setIsForgotPassword(false);
      resetCaptcha();
      setError('');
      setSuccess('');
    }
  }, [isOpen, initialRegisterMode]);

  useEffect(() => {
    if (isOpen) {
      resetCaptcha();
      setIsForgotPassword(false);
    }
  }, [isRegister]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please provide your email coordinates.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('Spiritual recovery link dispatched. Check your email inbox to restore your alignment.');
      setIsForgotPassword(false);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('No vessel registered under these coordinates.');
      } else {
        setError(err.message || 'The reset channel could not be opened.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetCaptcha = () => {
    // Shuffle and pick 4 unique items
    const shuffled = [...CAPTCHA_POOL].sort(() => 0.5 - Math.random());
    const options = shuffled.slice(0, 4);
    const challenge = options[Math.floor(Math.random() * options.length)];
    setCaptchaOptions(options);
    setCaptchaChallenge(challenge);
    setSelectedCaptchaId(null);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Please fill in both coordinates (email & password).');
      return;
    }

    if (isRegister) {
      // Validate Captcha
      if (!selectedCaptchaId) {
        setError('Please complete the Mystic Rune Captcha.');
        return;
      }
      if (selectedCaptchaId !== captchaChallenge?.id) {
        setError('Incorrect Rune choice. The spiritual barrier rejected your inputs.');
        resetCaptcha();
        return;
      }
    }

    setLoading(true);

    try {
      if (isRegister) {
        // Register flow
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        setSuccess('Account summoned successfully! Welcome.');
        
        // Save initial login/register information
        const user = userCredential.user;
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          email: user.email,
          uid: user.uid,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          loginHistory: [{
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            action: 'register'
          }]
        }, { merge: true });

        setEmail('');
        setPassword('');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        // Login flow
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        setSuccess('Vessel authenticated. Welcome back.');

        // Save login history
        const user = userCredential.user;
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        let existingHistory = [];
        if (userDocSnap.exists()) {
          existingHistory = userDocSnap.data().loginHistory || [];
        }
        const newHistory = [
          {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            action: 'login_email'
          },
          ...existingHistory
        ].slice(0, 50);

        await setDoc(userDocRef, {
          email: user.email,
          uid: user.uid,
          lastLoginAt: new Date().toISOString(),
          loginHistory: newHistory
        }, { merge: true });

        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already tied to a pre-existing aura.');
      } else if (err.code === 'auth/weak-password') {
        setError('Your password is too fragile. Cast a stronger one (at least 6 characters).');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid credentials. The vault remains sealed.');
      } else {
        setError(err.message || 'An error occurred during spiritual registration.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setSuccess('Vessel disconnected.');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError('Failed to close the channel.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md bg-[#111113] border border-zinc-850 rounded-2xl overflow-hidden shadow-2xl relative"
      >
        {/* Header decoration */}
        <div className="h-1 bg-gradient-to-r from-zinc-800 via-[#E60026] to-zinc-800 w-full" />

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-zinc-500 block mb-1">
              THELEFT.ONE INTERFACE
            </span>
            <h2 className="text-xl font-medium tracking-tight text-[#F8F7F4]">
              {currentUser ? 'Metaphysical Identity' : isForgotPassword ? 'Restore Astral Access' : isRegister ? 'Summon New Vessel' : 'Authorize Cosmic Identity'}
            </h2>
          </div>

          {error && (
            <div className="mb-4 p-3.5 bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded-xl flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3.5 bg-green-950/20 border border-green-900/30 text-green-400 text-xs rounded-xl flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {currentUser ? (
            <div className="space-y-6 text-center py-4">
              <div className="bg-zinc-950/40 p-4 border border-zinc-900 rounded-xl space-y-2">
                <p className="text-xs text-zinc-500 font-mono">AUTHORIZED AS</p>
                <p className="text-sm text-zinc-200 font-medium break-all">{currentUser.email}</p>
                <div className="flex justify-center items-center gap-1.5 pt-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${currentUser.emailVerified ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                  <span className="text-[9px] text-zinc-500 font-mono tracking-wider uppercase">
                    {currentUser.emailVerified ? 'Verified Aura' : 'Unverified Vessel'}
                  </span>
                </div>
                {!currentUser.emailVerified && (
                  <button
                    onClick={async () => {
                      try {
                        await sendEmailVerification(currentUser);
                        setSuccess('New verification link dispatched to your email coordinates.');
                      } catch (err: any) {
                        setError('Verification frequency limit hit. Try later.');
                      }
                    }}
                    className="mt-2 text-[10px] text-[#E60026] hover:underline"
                  >
                    Resend Verification Email
                  </button>
                )}
              </div>

              <button
                onClick={handleSignOut}
                className="w-full py-2.5 bg-red-950/20 hover:bg-red-900/15 border border-red-900/20 hover:border-red-900/40 text-red-400 text-xs font-mono font-bold tracking-wider rounded-xl transition-colors uppercase"
              >
                Sever Connection
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {isForgotPassword ? (
                <>
                  {/* Forgot Password Recovery Form */}
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono tracking-wider uppercase text-zinc-400 mb-1.5">
                        Email Coordinates
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                          <Mail className="w-4 h-4" />
                        </span>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="vessel@theleft.one"
                          disabled={loading}
                          required
                          className="w-full bg-black/40 border border-zinc-850 focus:border-[#E60026]/50 hover:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-[#F8F7F4] placeholder-zinc-600 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-[#E60026] hover:bg-[#ff334b] text-black font-extrabold font-mono tracking-wider rounded-xl transition-all duration-250 uppercase flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        'Send Recovery Link'
                      )}
                    </button>
                  </form>

                  <div className="text-center pt-2">
                    <button
                      onClick={() => setIsForgotPassword(false)}
                      className="text-[10px] font-mono tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors uppercase focus:outline-none"
                    >
                      Return to Sign In
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Standard Email Auth Form */}
                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono tracking-wider uppercase text-zinc-400 mb-1.5">
                        Email Coordinates
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                          <Mail className="w-4 h-4" />
                        </span>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="vessel@theleft.one"
                          disabled={loading}
                          required
                          className="w-full bg-black/40 border border-zinc-850 focus:border-[#E60026]/50 hover:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-[#F8F7F4] placeholder-zinc-600 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[10px] font-mono tracking-wider uppercase text-zinc-400">
                          Security Passkey
                        </label>
                        {!isRegister && (
                          <button
                            type="button"
                            onClick={() => setIsForgotPassword(true)}
                            className="text-[9px] font-mono text-zinc-500 hover:text-[#E60026] transition-colors uppercase focus:outline-none"
                          >
                            Forgot Passkey?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                          <Lock className="w-4 h-4" />
                        </span>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          disabled={loading}
                          required
                          className="w-full bg-black/40 border border-zinc-850 focus:border-[#E60026]/50 hover:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-[#F8F7F4] placeholder-zinc-600 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    {/* Esoteric Captcha Section during Registration */}
                    {isRegister && captchaChallenge && (
                      <div className="p-3.5 bg-zinc-950 border border-zinc-850 rounded-xl space-y-2.5 animate-fadeIn">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-mono tracking-wider text-zinc-400 uppercase">
                            SOVEREIGN CAPTCHA
                          </span>
                          <button
                            type="button"
                            onClick={resetCaptcha}
                            className="text-[9px] font-mono text-[#E60026] hover:text-white flex items-center gap-1 transition-colors"
                          >
                            <RefreshCw className="w-2.5 h-2.5" /> Reset
                          </button>
                        </div>
                        <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
                          Select the <span className="text-[#E60026] font-bold underline font-mono uppercase">{captchaChallenge.name}</span> rune to prove you are a physical entity:
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                          {captchaOptions.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setSelectedCaptchaId(opt.id)}
                              className={`py-3 text-xl bg-black hover:bg-[#E60026]/10 border rounded-lg transition-all duration-200 cursor-pointer ${
                                selectedCaptchaId === opt.id 
                                  ? 'border-[#E60026] bg-[#E60026]/5 text-[#E60026]' 
                                  : 'border-zinc-850 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {opt.icon}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-[#E60026] hover:bg-[#ff334b] text-black font-extrabold font-mono tracking-wider rounded-xl transition-all duration-250 uppercase flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : isRegister ? (
                        'Initiate Registration'
                      ) : (
                        'Authenticate Session'
                      )}
                    </button>
                  </form>

                  <div className="text-center pt-2">
                    <button
                      onClick={() => setIsRegister(!isRegister)}
                      className="text-[10px] font-mono tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors uppercase focus:outline-none"
                    >
                      {isRegister 
                        ? 'Already aligned? Return to Sign In' 
                        : 'New presence? Summon account'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
