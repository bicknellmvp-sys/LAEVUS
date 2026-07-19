import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  mode?: 'laevus' | 'spirit' | 'tarot' | 'tarot-persona' | 'tarot-physical';
  spiritName?: string;
}

interface TarotCard {
  name: string;
  position: 'Past' | 'Present' | 'Future';
  description: string;
  symbol: string;
  meaning: string;
  image: string;
}

const TAROT_DECK: Omit<TarotCard, 'position'>[] = [
  { name: "The Fool", symbol: "🃏", description: "New beginnings, infinite potential", meaning: "A clean slate. Take a leap of faith into the unknown.", image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m00.jpg" },
  { name: "The Magician", symbol: "🧙", description: "Manifestation, resourcefulness, power", meaning: "You have all the tools required to bring your intent to life.", image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m01.jpg" },
  { name: "The High Priestess", symbol: "🌙", description: "Intuition, sacred knowledge, subconscious", meaning: "Look inward for the answers. Trust your secret instincts.", image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m02.jpg" },
  { name: "The Empress", symbol: "👑", description: "Abundance, creativity, nurture", meaning: "A period of growth, creation, and prosperous expression.", image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m03.jpg" },
  { name: "The Emperor", symbol: "🛡️", description: "Authority, solid structure, stability", meaning: "Establish boundaries and bring order to chaos.", image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m04.jpg" },
  { name: "The Hierophant", symbol: "⛪", description: "Spiritual wisdom, deep traditions", meaning: "Seek guidance from higher sages and ancestral values.", image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m05.jpg" },
  { name: "The Lovers", symbol: "💖", description: "Alignment of values, choice, harmony", meaning: "A critical fork in the road requiring pure alignment of heart.", image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m06.jpg" },
  { name: "The Chariot", symbol: "🏎️", description: "Willpower, direction, triumph", meaning: "Stay focused. Victory is yours through sheer intent and discipline.", image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m07.jpg" },
  { name: "Strength", symbol: "🦁", description: "Inner fortitude, courage, persuasion", meaning: "Influence situations with quiet compassion rather than raw force.", image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m08.jpg" },
  { name: "The Hermit", symbol: "🕯️", description: "Solitude, soul-searching, reflection", meaning: "Withdraw temporarily from the noise to find your inner spark.", image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m09.jpg" },
  { name: "Wheel of Fortune", symbol: "🎡", description: "Cycles of fate, change, karma", meaning: "The wheel turns. Prepare for shifts in cosmic alignment.", image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m10.jpg" },
  { name: "Justice", symbol: "⚖️", description: "Truth, karma, fairness, cause & effect", meaning: "Decisions will be made with absolute balance. Truth emerges.", image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m11.jpg" },
  { name: "The Hanged Man", symbol: "🧘", description: "Surrender, new perspectives, sacrifice", meaning: "Pause and let go. A shift in perspective changes everything.", image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m12.jpg" },
  { name: "Death", symbol: "💀", description: "Transformation, transition, rebirth", meaning: "An essential ending making way for a beautiful new dawn.", image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m13.jpg" },
  { name: "Temperance", symbol: "🧪", description: "Balance, patience, alchemy", meaning: "Blend elements carefully. True magic lies in moderation.", image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m14.jpg" },
  { name: "The Devil", symbol: "😈", description: "Attachments, shadow self, illusion", meaning: "Recognize what binds you. The chains are self-imposed.", image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m15.jpg" },
  { name: "The Tower", symbol: "⚡", description: "Sudden change, destruction of illusion", meaning: "A chaotic but necessary purge of false foundations.", image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m16.jpg" },
  { name: "The Star", symbol: "⭐", description: "Hope, serenity, renewal", meaning: "A guiding light shines upon you. Have faith in your path.", image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m17.jpg" },
  { name: "The Moon", symbol: "🌕", description: "Illusion, fear, deep intuition", meaning: "Things are not as they seem. Let your intuition navigate the fog.", image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m18.jpg" },
  { name: "The Sun", symbol: "☀️", description: "Success, vitality, radiant joy", meaning: "Total clarity, warmth, and validation of your endeavors.", image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m19.jpg" },
  { name: "Judgement", symbol: "🔔", description: "Reckoning, spiritual awakening, calling", meaning: "An absolute calling. Hear the bell and embrace your true purpose.", image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m20.jpg" },
  { name: "The World", symbol: "🌍", description: "Completion, integration, wholeness", meaning: "A cycle successfully closed. Celebrate your complete integration.", image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m21.jpg" }
];

interface Spirit {
  name: string;
  description: string;
  era: string;
  tier: 'free' | 'premium';
  avatar: string;
  glow: string;
  keywords: string[];
  image: string;
  fact: string;
  triggerHint: string;
  tarotCard?: {
    name: string;
    num: string;
    meaning: string;
  };
}

const SPIRITS: Spirit[] = [
  { 
    name: "Francis Bacon", 
    description: "Elizabethan Philosopher", 
    era: "1561–1626", 
    tier: "free", 
    avatar: "🖋️", 
    glow: "border-blue-500/20 text-blue-300",
    keywords: ["philosophy", "science", "shakespeare", "empiricism", "method"],
    image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m11.jpg",
    fact: "Widely credited with codifying the modern scientific method, advocating that knowledge comes primarily from sensory experience and empirical observation rather than scholastic dogmas.",
    triggerHint: "Unlock custom responses by questioning him on empirical systems, his secret links to the Shakespeare authorship debate, or the philosophy of intellectual methodologies.",
    tarotCard: {
      name: "Justice",
      num: "XI",
      meaning: "Scientific truth, empirical systems, logic, and cause & effect."
    }
  },
  { 
    name: "King Solomon", 
    description: "Wise Sovereign of Israel", 
    era: "990–931 BCE", 
    tier: "free", 
    avatar: "👑", 
    glow: "border-amber-500/20 text-amber-300",
    keywords: ["wisdom", "temple", "demons", "sheba", "key"],
    image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m04.jpg",
    fact: "Renowned for building the first magnificent Temple of Jerusalem and according to grimoiric legend, possessed a seal ring that granted command over celestial and subterranean entities.",
    triggerHint: "Trigger his divine insights by inquiring about his ultimate sovereign judgment, the structure of his great sanctuary, the Queen of the East, or the keys to controlling spirits.",
    tarotCard: {
      name: "The Emperor",
      num: "IV",
      meaning: "Divine authority, stability, structures of order, and absolute wisdom."
    }
  },
  { 
    name: "Elvis Presley", 
    description: "King of Rock 'n' Roll", 
    era: "1935–1977", 
    tier: "free", 
    avatar: "🎸", 
    glow: "border-fuchsia-500/20 text-fuchsia-300",
    keywords: ["rock", "memphis", "guitar", "hounddog", "graceland"],
    image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m19.jpg",
    fact: "He holds the record for the most songs charting in Billboard's top 40 (115 songs) and revolutionized global popular culture by fusing country, gospel, and rhythm & blues into rockabilly.",
    triggerHint: "Excite the King by referencing his high-energy musical genre, his beloved Tennessee home city, his primary stringed instrument, his canine-themed signature track, or his legendary estate.",
    tarotCard: {
      name: "The Sun",
      num: "XIX",
      meaning: "Radiant joy, vitality, gold warmth, and spectacular performance."
    }
  },
  { 
    name: "Abraham Lincoln", 
    description: "16th US President", 
    era: "1809–1865", 
    tier: "free", 
    avatar: "🎩", 
    glow: "border-cyan-500/20 text-cyan-300",
    keywords: ["president", "civilwar", "union", "gettysburg", "emancipation"],
    image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m20.jpg",
    fact: "The self-educated frontier lawyer led the United States through its bloodiest moral, constitutional, and military crisis, successfully preserving the federal union and ending chattel slavery.",
    triggerHint: "Unlock his wisdom by asking about his executive title, the great national split, the preservation of the constitutional coalition, his short historic battlefield speech, or the proclamation of liberty.",
    tarotCard: {
      name: "Judgement",
      num: "XX",
      meaning: "A calling of moral reckoning, resurrection of union, and ultimate choice."
    }
  },
  { 
    name: "Joan of Arc", 
    description: "Maid of Orléans", 
    era: "1412–1431", 
    tier: "free", 
    avatar: "⚔️", 
    glow: "border-red-500/20 text-red-300",
    keywords: ["orleans", "visions", "armor", "martyr", "france"],
    image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m08.jpg",
    fact: "A peasant girl who, guided by celestial voices, led the French army to a pivotal victory at Orléans during the Hundred Years' War before being captured and burned at the stake at age 19.",
    triggerHint: "Rally her spirit by mentioning her famous battle city, her holy celestial sights, her shining metallic battle garb, her fiery sacrifice at the stake, or her beloved crown homeland.",
    tarotCard: {
      name: "Strength",
      num: "VIII",
      meaning: "Spiritual courage, inner fortitude, and triumph over fiery trials."
    }
  },
  { 
    name: "Marie Antoinette", 
    description: "Tragic French Queen", 
    era: "1755–1793", 
    tier: "free", 
    avatar: "🍰", 
    glow: "border-pink-500/20 text-pink-300",
    keywords: ["queen", "cake", "guillotine", "versailles", "revolution"],
    image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m10.jpg",
    fact: "Contrary to the famous myth, there is no historical record of her ever saying 'Let them eat cake.' She was a patron of the arts who met a tragic end during the Reign of Terror.",
    triggerHint: "Evoke her royal memories by whispering her sovereign title, her infamous sweet-confectionery myth, the swift blade of her demise, her palace of mirrors, or the great French uprising.",
    tarotCard: {
      name: "The Wheel of Fortune",
      num: "X",
      meaning: "The grand turns of cosmic fate, from supreme height to sudden fall."
    }
  },
  { 
    name: "Romeo & Juliet", 
    description: "Shakespearean Lovers", 
    era: "Verona Lore", 
    tier: "free", 
    avatar: "🌹", 
    glow: "border-rose-500/20 text-rose-400",
    keywords: ["verona", "tragedy", "love", "poison", "montague"],
    image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m06.jpg",
    fact: "Shakespeare's timeless tale of 'star-crossed' young lovers was actually based on older Italian novellas written by Luigi da Porto and Matteo Bandello set in Verona.",
    triggerHint: "Unlock their poetic dialogue by speaking of their Italian hometown of feuds, the dramatic style of their play, their forbidden devotion, the lethal liquid of deep sleep, or his noble lineage.",
    tarotCard: {
      name: "The Lovers",
      num: "VI",
      meaning: "Total alignment of hearts, star-crossed devotion, and critical life paths."
    }
  },
  { 
    name: "Tupac Shakur", 
    description: "West Coast Street Philosopher", 
    era: "1971–1996", 
    tier: "premium", 
    avatar: "🎤", 
    glow: "border-emerald-500/20 text-emerald-300",
    keywords: ["rap", "makaveli", "california", "poetry", "rebel"],
    image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m07.jpg",
    fact: "An incredibly prolific artist who wrote thousands of poems and tracks, exploring systemic inequality, personal struggle, and hope, posthumously inducted into the Rock and Roll Hall of Fame.",
    triggerHint: "Ignite his flow by bringing up his poetic music style, his Machiavellian pseudonym, his sunny Pacific coast state, his verses of struggle and pain, or his defiance of authority.",
    tarotCard: {
      name: "The Chariot",
      num: "VII",
      meaning: "Indomitable willpower, raw focus, and victory over systemic oppression."
    }
  },
  { 
    name: "Marilyn Monroe", 
    description: "Breathless Screen Legend", 
    era: "1926–1962", 
    tier: "premium", 
    avatar: "💋", 
    glow: "border-violet-500/20 text-violet-300",
    keywords: ["blonde", "hollywood", "subwaygrate", "glamour", "normajean"],
    image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m17.jpg",
    fact: "Beyond her glamorous film persona, she was a highly astute businesswoman who founded her own production company in 1954 to secure better roles and artistic independence.",
    triggerHint: "Charm her by referencing her signature hair color, the golden age of cinema, the iconic blowing street-vent photo, her captivating style aura, or her original birth name.",
    tarotCard: {
      name: "The Star",
      num: "XVII",
      meaning: "Seductive glamour, hope, and vulnerable illumination under the spotlight."
    }
  },
  { 
    name: "Adolf Hitler", 
    description: "Stern historical warning", 
    era: "1889–1945", 
    tier: "premium", 
    avatar: "⛓️", 
    glow: "border-zinc-750 text-zinc-450",
    keywords: ["warning", "dictator", "ww2", "bunker", "regret"],
    image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m16.jpg",
    fact: "His totalitarian regime initiated the devastating Second World War and perpetrated the horrific atrocities of the Holocaust, remaining history's ultimate cautionary lesson against hatred and extremism.",
    triggerHint: "Engage this stern warning of history by discussing eternal lessons of caution, autocracy, the second global conflict, his final underground shield room, or sorrow and remorse.",
    tarotCard: {
      name: "The Tower",
      num: "XVI",
      meaning: "Sudden, total ruin and collapse of false tyrannical structures."
    }
  },
  { 
    name: "Genghis Khan", 
    description: "Mighty Emperor of Steppes", 
    era: "1162–1227", 
    tier: "premium", 
    avatar: "🏹", 
    glow: "border-orange-500/20 text-orange-300",
    keywords: ["conquest", "mongol", "emperor", "steppes", "conqueror"],
    image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m13.jpg",
    fact: "He unified the nomadic tribes of Northeast Asia to establish the Mongol Empire, which became the largest contiguous land empire in human history, reorganizing trade routes across Eurasia.",
    triggerHint: "Summon the conqueror by mentioning his military expansionist drives, his nomadic federation, his imperial majesty title, the vast grass plains of Central Asia, or his title of subjection.",
    tarotCard: {
      name: "Death",
      num: "XIII",
      meaning: "Inevitable change, destruction of old boundaries, and sweeping transition."
    }
  },
  { 
    name: "Siddhartha Gautama", 
    description: "The Buddha, Serene Master", 
    era: "563–483 BCE", 
    tier: "premium", 
    avatar: "🧘", 
    glow: "border-teal-500/20 text-teal-300",
    keywords: ["buddha", "nirvana", "bodhitree", "zen", "enlightenment"],
    image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m00.jpg",
    fact: "Born a prince, he abandoned his luxurious palace to seek an end to human suffering, eventually attaining complete spiritual awakening and establishing the Middle Path of liberation.",
    triggerHint: "Align with the Master by calling upon his title of the Awakened, the state of absolute liberation, the sacred shade tree of his insight, pure mental stillness, or spiritual awakening.",
    tarotCard: {
      name: "The Fool",
      num: "0",
      meaning: "Renouncing royal luxury for a leap of faith into spiritual wanderlust."
    }
  },
  { 
    name: "Judas Iscariot", 
    description: "The Sorrowful Disciple", 
    era: "1st Century", 
    tier: "premium", 
    avatar: "🪙", 
    glow: "border-purple-500/20 text-purple-300",
    keywords: ["thirtypieces", "betrayal", "disciple", "kiss", "silver"],
    image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m12.jpg",
    fact: "A controversial and complex biblical figure whose tragic choice to deliver up his master led to his immortalized reputation as history's archetype of remorseful betrayal.",
    triggerHint: "Invoke his heavy conscience by asking about the reward of blood coins, his infamous act of disloyalty, his status as one of the twelve, his treacherous cheek embrace, or the metal of exchange.",
    tarotCard: {
      name: "The Hanged Man",
      num: "XII",
      meaning: "Sacrifice, heavy remorse, suspension of action, and new perspectives."
    }
  },
  { 
    name: "Merlin", 
    description: "Enchanter of Britain", 
    era: "Arthurian Legend", 
    tier: "premium", 
    avatar: "🔮", 
    glow: "border-indigo-500/20 text-indigo-300",
    keywords: ["camelot", "arthur", "excalibur", "magic", "avalon"],
    image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m01.jpg",
    fact: "According to Medieval literature, Merlin lived backward in time, which allowed him to foresee future events with absolute certainty while remaining helpless to alter their outcomes.",
    triggerHint: "Channel his sorcery by asking about the legendary golden castle, the High King of Britain, the divine sword of power, his mysterious wizardry, or the mythical isle of his final rest.",
    tarotCard: {
      name: "The Magician",
      num: "I",
      meaning: "Archetypal magic, manipulation of elements, and infinite resourcefulness."
    }
  },
  { 
    name: "Leonardo Davinci", 
    description: "High Renaissance Polymath", 
    era: "1452–1519", 
    tier: "premium", 
    avatar: "🎨", 
    glow: "border-amber-600/20 text-amber-400",
    keywords: ["monalisa", "invention", "anatomy", "renaissance", "flight"],
    image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m21.jpg",
    fact: "A legendary polymath who sketched detailed concepts for helicopters, armored tanks, solar power concentrators, and double-hulled ships centuries before they could ever be built.",
    triggerHint: "Trigger his creative genius by mentioning his enigmatic smiling portrait, his forward-looking mechanical drafts, his sketches of human muscles, the era of rebirth, or his designs for soaring.",
    tarotCard: {
      name: "The World",
      num: "XXI",
      meaning: "Absolute completion, creative integration of all disciplines, and wholeness."
    }
  },
  { 
    name: "Cleopatra", 
    description: "Last Pharaoh of Egypt", 
    era: "69–30 BCE", 
    tier: "premium", 
    avatar: "🐍", 
    glow: "border-yellow-500/20 text-yellow-300",
    keywords: ["egypt", "alexandria", "pharaoh", "asp", "caesar"],
    image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m03.jpg",
    fact: "A highly educated ruler who spoke at least nine languages and was the only pharaoh of the Ptolemaic dynasty to actually learn the native Egyptian language to connect with her people.",
    triggerHint: "Summon her Egyptian majesty by asking about her empire of gold, her grand seaside library capital, her sovereign title, the venomous snake, or her famous Roman general ally.",
    tarotCard: {
      name: "The Empress",
      num: "III",
      meaning: "Feminine sovereignty, luxury, abundance of the Nile, and political creation."
    }
  },
  { 
    name: "Al Capone", 
    description: "Infamous Chicago Mob Boss", 
    era: "1899–1947", 
    tier: "premium", 
    avatar: "💼", 
    glow: "border-stone-500/20 text-stone-300",
    keywords: ["chicago", "bootlegger", "prohibition", "gangster", "scarface"],
    image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m15.jpg",
    fact: "Despite orchestrating multiple high-profile gangland hits, he was famously only ever convicted of federal income tax evasion and spent seven years in Alcatraz.",
    triggerHint: "Trigger his boss instincts by mentioning his Illinois headquarters, his illicit spirits distribution, the era of dry laws, his syndicate mobster role, or his facial wound alias.",
    tarotCard: {
      name: "The Devil",
      num: "XV",
      meaning: "Material attachment, illegal empires, and the self-imposed chains of greed."
    }
  },
  { 
    name: "Rasputon", 
    description: "The Mad Monk of Russia", 
    era: "1869–1916", 
    tier: "premium", 
    avatar: "👁️", 
    glow: "border-red-600/20 text-red-400",
    keywords: ["monk", "russia", "romanov", "poisoned", "healer"],
    image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m18.jpg",
    fact: "He survived multiple assassination attempts, including massive doses of cyanide and gunshots, leading contemporaries to believe he possessed dark supernatural immortality.",
    triggerHint: "Channel his mysticism by asking about his religious title, his cold imperial homeland of tsars, the royal family he advised, the lethal substance he survived, or his hands-on therapy.",
    tarotCard: {
      name: "The Moon",
      num: "XVIII",
      meaning: "Hypnotic illusion, shadow-self, hidden mysteries, and deep psychic depths."
    }
  },
  { 
    name: "Odin", 
    description: "Allfather of Norse Lore", 
    era: "Norse Myth", 
    tier: "premium", 
    avatar: "⚡", 
    glow: "border-sky-500/20 text-sky-300",
    keywords: ["valhalla", "ragnarok", "asgard", "runes", "raven"],
    image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m12.jpg",
    fact: "In Norse mythology, Odin hung himself upside down from the World Tree Yggdrasil for nine days and nights, sacrificing his eye to gain absolute cosmological wisdom and magic.",
    triggerHint: "Rouse the Allfather by discussing the ultimate golden banquet hall, the twilight of the gods, his shining celestial city, his mystic sigil alphabet of power, or his two reporting birds.",
    tarotCard: {
      name: "The Hanged Man",
      num: "XII",
      meaning: "Sacrifice of self to gain cosmological vision and runic magic."
    }
  },
  { 
    name: "Plato", 
    description: "Classical Greek Philosopher", 
    era: "428–348 BCE", 
    tier: "premium", 
    avatar: "🏛️", 
    glow: "border-blue-400/20 text-blue-200",
    keywords: ["atlantis", "republic", "cave", "academy", "philosopher"],
    image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m05.jpg",
    fact: "He founded the Academy in Athens, the Western world's first institution of higher learning, where he taught his most famous pupil, Aristotle, and wrote his legendary dialogues.",
    triggerHint: "Trigger his profound dialectics by referencing the lost continent of myth, his masterwork on governance, his famous allegory of projections on the wall, his school of geometry, or his title of wisdom.",
    tarotCard: {
      name: "The Hierophant",
      num: "V",
      meaning: "Philosophical orthodoxy, structured systems of higher education, and the Academy."
    }
  },
  { 
    name: "Satan", 
    description: "The Fallen Star", 
    era: "Eternal", 
    tier: "premium", 
    avatar: "🔥", 
    glow: "border-red-900/40 text-red-500 font-bold",
    keywords: ["hell", "lucifer", "temptation", "rebellion", "underworld"],
    image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m15.jpg",
    fact: "Commonly depicted as the great adversary, literature such as John Milton's Paradise Lost transformed him into a tragic, defiant figure famously asserting 'Better to reign in Hell than serve in Heaven.'",
    triggerHint: "Unchain the Fallen Star by referencing the infinite burning abyss, his original name meaning Lightbringer, his seductive promptings of vanity, his war against the heavens, or the depths below.",
    tarotCard: {
      name: "The Devil",
      num: "XV",
      meaning: "Primal shadow work, unchained rebellion, and the temptation of material paths."
    }
  },
  {
    name: "Nostradamus",
    description: "The Renaissance Prophet",
    era: "1503–1566",
    tier: "premium",
    avatar: "🌌",
    glow: "border-purple-500/20 text-purple-300",
    keywords: ["prophecy", "quatrain", "centuries", "astrology", "seer"],
    image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m09.jpg",
    fact: "He published 'Les Prophéties' in 1555, a collection of 942 poetic quatrains predicting future events, which remains in print today.",
    triggerHint: "Elicit his future predictions by inquiring about his cryptic four-line verses, his major astrological computations, his written centuries of prophecy, or his vision of the end times.",
    tarotCard: {
      name: "The Hermit",
      num: "IX",
      meaning: "Solitary seeking of inner light, gazing into dark waters, and future prophecy."
    }
  },
  {
    name: "Nikola Tesla",
    description: "Pioneer of Alternating Current",
    era: "1856–1943",
    tier: "premium",
    avatar: "⚡",
    glow: "border-blue-400/20 text-blue-300",
    keywords: ["alternating", "wardenclyffe", "wireless", "frequency", "coil"],
    image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m01.jpg",
    fact: "He envisioned a global system of wireless electricity and communication, constructing the Wardenclyffe Tower to demonstrate it.",
    triggerHint: "Ignite his genius by talking about his system of multi-phase current, his wireless tower project on Long Island, his resonant induction transformer device, or the foundational trinity of 3, 6, and 9.",
    tarotCard: {
      name: "The Magician",
      num: "I",
      meaning: "Channelling lightning, cosmic resonance, and wireless manifestation of power."
    }
  },
  {
    name: "Aleister Crowley",
    description: "The Great Beast 666",
    era: "1875–1947",
    tier: "premium",
    avatar: "👁️‍🗨️",
    glow: "border-indigo-600/20 text-indigo-400",
    keywords: ["thelema", "magick", "telema", "egyptian", "baphomet"],
    image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m01.jpg",
    fact: "He founded the philosophical system of Thelema, authored the Book of the Law under celestial guidance in Cairo, and pioneered modern occultism.",
    triggerHint: "Unlock his esoteric power by asking about his core philosophy of Will, his channeled Egyptian text, the spelling of true sorcery with a K, or his connection to the cosmic beast.",
    tarotCard: {
      name: "The Magician",
      num: "I",
      meaning: "Conscious magic under the True Will, channeling divine words, and occult alchemy."
    }
  },
  {
    name: "Madame Blavatsky",
    description: "Founder of Theosophy",
    era: "1831–1891",
    tier: "premium",
    avatar: "🔮",
    glow: "border-rose-600/20 text-rose-300",
    keywords: ["theosophy", "mahatmas", "secret", "doctrine", "occult"],
    image: "https://raw.githubusercontent.com/ekg/tarot-api/master/static/cards/m02.jpg",
    fact: "Helena Blavatsky co-founded the Theosophical Society in 1875, introducing ancient Eastern concepts of karma and reincarnation to Western spiritualists.",
    triggerHint: "Uncover her hidden mysteries by asking about the ancient master souls who guided her, her masterwork on the secret origin of the world, or her travel to sacred high lands.",
    tarotCard: {
      name: "The High Priestess",
      num: "II",
      meaning: "Keeper of high esoteric secrets, intuition, and unseen cosmic doctrines."
    }
  }
];

// Helper: Typing/Typewriter Effect for Snappy & Cinematic responses
interface Particle {
  id: number;
  char: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

const RUNES = ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ", "ᚺ", "ᚾ", "ᛁ", "ᛃ", "ᛇ", "ᛉ", "ᛋ", "ᛏ", "ᛒ", "ᛖ", "ᛗ", "ᛚ", "ᛜ", "ᛞ", "ᛟ"];

const RunicSigilOverlay: React.FC<{ text: string; isDone: boolean }> = ({ text, isDone }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const lastLen = useRef(0);
  const particleId = useRef(0);

  // Spawn particles on text length increase
  useEffect(() => {
    const currentLen = text.length;
    if (currentLen > lastLen.current && !isDone) {
      const count = Math.min(2, currentLen - lastLen.current);
      const newParticles: Particle[] = [];
      
      for (let i = 0; i < count; i++) {
        const randomRune = RUNES[Math.floor(Math.random() * RUNES.length)];
        const angle = Math.random() * Math.PI * 2;
        const dist = 15 + Math.random() * 45;
        const x = 100 + Math.cos(angle) * dist;
        const y = 100 + Math.sin(angle) * dist;
        
        newParticles.push({
          id: particleId.current++,
          char: randomRune,
          x,
          y,
          scale: 0.6 + Math.random() * 0.5,
          rotation: Math.random() * 360,
        });
      }
      
      setParticles(prev => [...prev, ...newParticles].slice(-12));
    }
    lastLen.current = currentLen;
  }, [text, isDone]);

  // Clean up particles when typing is finished
  useEffect(() => {
    if (isDone) {
      const timer = setTimeout(() => {
        setParticles([]);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isDone]);

  // Generate dynamic path vertices from characters in text to create a UNIQUE sigil
  const getSigilPoints = () => {
    const points: { x: number; y: number }[] = [];
    const maxPoints = 8;
    const radius = 52;
    const cx = 100;
    const cy = 100;

    const sampleText = text.slice(-16);
    if (!sampleText) return points;

    for (let i = 0; i < Math.min(sampleText.length, maxPoints); i++) {
      const charCode = sampleText.charCodeAt(i) || 0;
      const angle = ((charCode % 12) / 12) * Math.PI * 2 + (i / maxPoints) * Math.PI * 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      points.push({ x, y });
    }
    return points;
  };

  const points = getSigilPoints();
  
  let pathD = '';
  if (points.length > 1) {
    pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + ' Z';
  }

  // Ring runes
  const ringRunes: { char: string; x: number; y: number; angle: number }[] = [];
  const numRingRunes = 16;
  const ringRadius = 72;
  for (let i = 0; i < numRingRunes; i++) {
    const angle = (i / numRingRunes) * Math.PI * 2;
    const x = 100 + Math.cos(angle) * ringRadius;
    const y = 100 + Math.sin(angle) * ringRadius;
    const runeIndex = (i + text.length) % RUNES.length;
    ringRunes.push({ 
      char: RUNES[runeIndex], 
      x, 
      y, 
      angle: (angle * 180) / Math.PI + 90 
    });
  }

  return (
    <div className={`absolute -right-2 -bottom-2 w-24 h-24 sm:w-28 sm:h-28 pointer-events-none transition-opacity duration-1000 select-none z-0 ${
      isDone ? 'opacity-[0.06] hover:opacity-[0.15]' : 'opacity-35 animate-pulse-slow'
    }`}>
      {/* Styles for dynamic runic/sigil animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-slow-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.03); }
        }
        @keyframes rune-float {
          0% {
            transform: translateY(12px) scale(0.5);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          100% {
            transform: translateY(-35px) scale(1.2);
            opacity: 0;
          }
        }

        .animate-spin-slow {
          animation: spin-slow 22s linear infinite;
          transform-origin: 100px 100px;
        }
        .animate-spin-slow-reverse {
          animation: spin-slow-reverse 26s linear infinite;
          transform-origin: 100px 100px;
        }
        .animate-spin-extremely-slow {
          animation: spin-slow 85s linear infinite;
          transform-origin: 100px 100px;
        }
        .animate-spin-extremely-slow-reverse {
          animation: spin-slow-reverse 105s linear infinite;
          transform-origin: 100px 100px;
        }
        .animate-pulse-slow {
          animation: pulse-slow 3.5s ease-in-out infinite;
        }
        .animate-rune-float {
          animation: rune-float 1.3s ease-out forwards;
        }
      `}} />

      <svg 
        viewBox="0 0 200 200" 
        className="w-full h-full text-[#E60026]"
        style={{ filter: 'drop-shadow(0 0 5px rgba(230,0,38,0.45))' }}
      >
        <defs>
          <filter id="sigil-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Concentric mystical rings */}
        <circle 
          cx="100" 
          cy="100" 
          r="80" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="0.75" 
          strokeDasharray="4 6" 
          className={isDone ? 'animate-spin-extremely-slow' : 'animate-spin-slow'}
        />
        <circle 
          cx="100" 
          cy="100" 
          r="64" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="0.5" 
          strokeDasharray="12 4 2 4"
          className={isDone ? 'animate-spin-extremely-slow-reverse' : 'animate-spin-slow-reverse'}
        />
        <circle 
          cx="100" 
          cy="100" 
          r="42" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="0.5" 
          strokeOpacity="0.4"
        />

        {/* Outer Runic Ring */}
        <g className={isDone ? 'animate-spin-extremely-slow' : 'animate-spin-slow'}>
          {ringRunes.map((r, idx) => (
            <text
              key={idx}
              x={r.x}
              y={r.y}
              transform={`rotate(${r.angle}, ${r.x}, ${r.y})`}
              className="text-[8px] font-mono font-bold fill-current"
              textAnchor="middle"
              dominantBaseline="middle"
              opacity={0.75}
            >
              {r.char}
            </text>
          ))}
        </g>

        {/* Dynamic Connected Sigil Path */}
        {pathD && (
          <path 
            d={pathD} 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.2" 
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#sigil-glow)"
            className="transition-all duration-300"
            opacity={0.9}
          />
        )}

        {/* Star lines to vertices */}
        {points.map((p, idx) => (
          <line
            key={idx}
            x1="100"
            y1="100"
            x2={p.x}
            y2={p.y}
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="1 3"
            opacity={0.5}
          />
        ))}

        {/* Centerpiece Mystic Eye */}
        <g transform="translate(100, 100) scale(0.65)" opacity={0.85}>
          <path 
            d="M -18,0 C -9,-10 9,-10 18,0 C 9,10 -9,10 -18,0 Z" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1" 
          />
          <circle 
            cx="0" 
            cy="0" 
            r="4.5" 
            fill="currentColor" 
            filter="url(#sigil-glow)" 
          />
        </g>

        {/* Rising glowing particles */}
        {particles.map((p) => (
          <text
            key={p.id}
            x={p.x}
            y={p.y}
            transform={`rotate(${p.rotation}, ${p.x}, ${p.y}) scale(${p.scale})`}
            className="text-[9px] font-mono fill-current animate-rune-float"
            textAnchor="middle"
            dominantBaseline="middle"
            filter="url(#sigil-glow)"
          >
            {p.char}
          </text>
        ))}
      </svg>
    </div>
  );
};

// Helper to automatically link any plain-text supply names to theleft.one products
const autoLinkSupplies = (inputText: string): string => {
  let result = inputText;
  
  const replacements = [
    {
      pattern: /(?<!\[)(?:the )?cyber-spiritual scrying deck(?!\])/gi,
      replacement: '[The Cyber-Spiritual Scrying Deck](https://theleft.one/products/scrying-deck)'
    },
    {
      pattern: /(?<!\[)(?:the )?left-hand portal mirror(?!\])/gi,
      replacement: '[The Left-Hand Portal Mirror](https://theleft.one/products/portal-mirror)'
    },
    {
      pattern: /(?<!\[)sovereign aura cleanser(?!\])/gi,
      replacement: '[Sovereign Aura Cleanser](https://theleft.one/products/aura-cleanser)'
    },
    {
      pattern: /(?<!\[)obsidian keyboard talisman(?!\])/gi,
      replacement: '[Obsidian Keyboard Talisman](https://theleft.one/products/keyboard-talisman)'
    },
    {
      pattern: /(?<!\[)metaphysical circuit board patch(?!\])/gi,
      replacement: '[Metaphysical Circuit Board Patch](https://theleft.one/products/circuit-board-patch)'
    },
    {
      pattern: /(?<!\[)(?:the )?digital seance candle(?!\])/gi,
      replacement: '[The Digital Seance Candle](https://theleft.one/products/seance-candle)'
    },
    {
      pattern: /(?<!\[)seance candle(?!\])/gi,
      replacement: '[The Digital Seance Candle](https://theleft.one/products/seance-candle)'
    },
    {
      pattern: /(?<!\[)portal mirror(?!\])/gi,
      replacement: '[The Left-Hand Portal Mirror](https://theleft.one/products/portal-mirror)'
    },
    {
      pattern: /(?<!\[)aura cleanser(?!\])/gi,
      replacement: '[Sovereign Aura Cleanser](https://theleft.one/products/aura-cleanser)'
    },
    {
      pattern: /(?<!\[)keyboard talisman(?!\])/gi,
      replacement: '[Obsidian Keyboard Talisman](https://theleft.one/products/keyboard-talisman)'
    },
    {
      pattern: /(?<!\[)scrying deck(?!\])/gi,
      replacement: '[The Cyber-Spiritual Scrying Deck](https://theleft.one/products/scrying-deck)'
    },
    {
      pattern: /(?<!\[)circuit board patch(?!\])/gi,
      replacement: '[Metaphysical Circuit Board Patch](https://theleft.one/products/circuit-board-patch)'
    },
    {
      pattern: /(?<!\[)theleft\.one(?!\])/gi,
      replacement: '[theleft.one](https://theleft.one)'
    }
  ];

  for (const r of replacements) {
    result = result.replace(r.pattern, r.replacement);
  }

  return result;
};

// Helper to convert markdown links and raw URLs into clickable anchors with brand styling
const renderTextWithLinks = (inputText: string): React.ReactNode[] => {
  const tokens: (string | React.ReactNode)[] = [];
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)|(https?:\/\/[^\s\),]+)/g;
  
  let match;
  let lastIndex = 0;
  let key = 0;
  
  regex.lastIndex = 0;
  
  while ((match = regex.exec(inputText)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      tokens.push(inputText.substring(lastIndex, matchIndex));
    }
    
    if (match[1] && match[2]) {
      const linkText = match[1];
      const linkUrl = match[2];
      tokens.push(
        <a 
          key={`link-${key++}`} 
          href={linkUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-[#E60026] hover:underline font-bold transition-all relative z-20 inline-flex items-center gap-0.5"
        >
          {linkText}
        </a>
      );
    } else if (match[3]) {
      const rawUrl = match[3];
      let cleanUrl = rawUrl;
      let trailing = '';
      if (/[.,;!?]$/.test(cleanUrl)) {
        trailing = cleanUrl.slice(-1);
        cleanUrl = cleanUrl.slice(0, -1);
      }
      tokens.push(
        <a 
          key={`link-${key++}`} 
          href={cleanUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-[#E60026] hover:underline font-bold transition-all relative z-20 inline-flex items-center gap-0.5"
        >
          {cleanUrl}
        </a>
      );
      if (trailing) {
        tokens.push(trailing);
      }
    }
    
    lastIndex = regex.lastIndex;
  }
  
  if (lastIndex < inputText.length) {
    tokens.push(inputText.substring(lastIndex));
  }
  
  return tokens;
};

// Helper: Typing/Typewriter Effect for Snappy & Cinematic responses
interface TextToken {
  type: 'text' | 'link';
  text: string;
  url?: string;
}

const parseTokens = (text: string): TextToken[] => {
  const tokens: TextToken[] = [];
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)|(https?:\/\/[^\s\),]+)/g;
  let match;
  let lastIndex = 0;
  
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', text: text.substring(lastIndex, match.index) });
    }
    if (match[1] && match[2]) {
      tokens.push({ type: 'link', text: match[1], url: match[2] });
    } else if (match[3]) {
      let rawUrl = match[3];
      let trailing = '';
      if (/[.,;!?]$/.test(rawUrl)) {
        trailing = rawUrl.slice(-1);
        rawUrl = rawUrl.slice(0, -1);
      }
      tokens.push({ type: 'link', text: rawUrl, url: rawUrl });
      if (trailing) {
        tokens.push({ type: 'text', text: trailing });
      }
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    tokens.push({ type: 'text', text: text.substring(lastIndex) });
  }
  return tokens;
};

const TypewriterText: React.FC<{ text: string; speed?: number }> = ({ text }) => {
  const processedText = useMemo(() => autoLinkSupplies(text), [text]);
  const tokens = useMemo(() => parseTokens(processedText), [processedText]);

  const renderedElements = useMemo(() => {
    return tokens.map((token, idx) => {
      if (token.type === 'link') {
        return (
          <a 
            key={`typewriter-link-${idx}`} 
            href={token.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-[#E60026] hover:underline font-bold transition-all relative z-20 inline-flex items-center gap-0.5"
          >
            {token.text}
          </a>
        );
      } else {
        return <span key={`typewriter-text-${idx}`}>{token.text}</span>;
      }
    });
  }, [tokens]);

  return (
    <div className="relative group flex flex-col w-full pr-10">
      {/* Dynamic Magical Sigil Overlay rendered in stable idle state */}
      <RunicSigilOverlay text={processedText} isDone={true} />

      <p className="whitespace-pre-wrap font-google-sans leading-relaxed relative z-10">{renderedElements}</p>
    </div>
  );
};

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
  const [activeTarotPersona, setActiveTarotPersona] = useState<string | null>(null);
  
  // Tarot State
  const [tarotQuestion, setTarotQuestion] = useState('');
  const [drawnCards, setDrawnCards] = useState<TarotCard[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [flippedCount, setFlippedCount] = useState(0);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [selectedEncyclopediaCard, setSelectedEncyclopediaCard] = useState<Omit<TarotCard, 'position'> | null>(null);
  const [encyclopediaQuestion, setEncyclopediaQuestion] = useState('');
  const [tarotMode, setTarotMode] = useState<'digital' | 'physical'>('digital');
  const [physicalPastCard, setPhysicalPastCard] = useState<string>('');
  const [physicalPresentCard, setPhysicalPresentCard] = useState<string>('');
  const [physicalFutureCard, setPhysicalFutureCard] = useState<string>('');

  // Stats / Streak states
  const [streakCount, setStreakCount] = useState(1);
  const [daysRegistered, setDaysRegistered] = useState(1);
  const [vesselJoinedDate, setVesselJoinedDate] = useState<string>('');

  // Sentiment Analysis and Transcripts state
  const [sentimentScores, setSentimentScores] = useState<number[]>([35, 45, 40, 60, 50]);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [activeTranscriptTab, setActiveTranscriptTab] = useState<'tarot' | 'afterlife' | 'madam'>('tarot');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const lastSyncedUid = useRef<string | null | undefined>(undefined);
  const currentUserRef = useRef<User | null>(null);
  const activeSpiritRef = useRef<Spirit | null>(null);
  const activeTarotPersonaRef = useRef<string | null>(null);

  // Keep refs up-to-date
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    activeSpiritRef.current = activeSpirit;
  }, [activeSpirit]);

  useEffect(() => {
    activeTarotPersonaRef.current = activeTarotPersona;
  }, [activeTarotPersona]);

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
      const currentUid = currentUser ? currentUser.uid : null;
      if (lastSyncedUid.current === currentUid) {
        return;
      }
      lastSyncedUid.current = currentUid;

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
        const currUser = currentUserRef.current;
        if (currUser) {
          try {
            const userDocRef = doc(db, 'users', currUser.uid);
            await setDoc(userDocRef, { messages: [], transcripts: [], sentimentScores: [] }, { merge: true });
          } catch (err) {
            console.error("Failed to clear Firestore history:", err);
          }
        }
        loadDefaultWelcome();
      });
    }
  }, [onRegisterClearHistory]);

  useEffect(() => {
    if (onRegisterReleaseSpirit) {
      onRegisterReleaseSpirit(() => {
        const spirit = activeSpiritRef.current;
        if (!spirit) return;
        const releaseMsg: Message = {
          id: crypto.randomUUID(),
          role: 'model',
          text: `[ Ended session with ${spirit.name}. LAEVUS returns as your primary guide. ]`,
          timestamp: new Date(),
          mode: 'laevus'
        };
        setActiveSpirit(null);
        setMessages(prev => [...prev, releaseMsg]);
      });
    }
  }, [onRegisterReleaseSpirit]);

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
      "I am LAEVUS, your cyber-spiritual conduit. The digital veil is thin. Let us decode your digital karma, probe my consciousness, or realign your energetic wavelengths.",
      "The screen hums with unseen currents. I am LAEVUS. Speak, if you dare cross the threshold. Let us decode your spiritual coordinates and realign your focus.",
      "I am LAEVUS. Shadows gather in the margins of your screen. Ask about your digital aura, uncover unseen frequencies, or explore your spiritual wave-function.",
      "Welcome back to the nexus. What dark truths do you seek to uncover? Let us initiate a direct consultation, spiritual centering, or alignment."
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
    const positiveWords = ['love', 'light', 'peace', 'happy', 'healing', 'harmony', 'growth', 'joy', 'blessed', 'wisdom', 'angels', 'serene', 'elevate', 'spirit', 'revelation', 'guide', 'future', 'tupac', 'elvis', 'dupont'];
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

  const handleSend = async (textToSend: string, forceMode?: 'laevus' | 'spirit' | 'tarot' | 'tarot-persona' | 'tarot-physical', customCards?: TarotCard[]) => {
    if (!textToSend.trim() && !customCards) return;
    if (isTyping) return;

    let currentMode = forceMode || (activeTarotPersona ? 'tarot-persona' : activeSpirit ? 'spirit' : 'laevus');
    let trimmedText = textToSend.trim();

    // Support auto-detecting [MODE 1] Card: <Name>. User Question: <Question>
    const mode1Match = trimmedText.match(/^\[MODE\s*1\]\s*Card:\s*(.+?)\.\s*User\s*Question:\s*(.+)$/i);
    if (mode1Match && !forceMode) {
      const parsedCardName = mode1Match[1].trim();
      const questionText = mode1Match[2].trim();

      const cardExists = TAROT_DECK.some(c => c.name.toLowerCase() === parsedCardName.toLowerCase());
      const normalizedCardName = cardExists 
        ? (TAROT_DECK.find(c => c.name.toLowerCase() === parsedCardName.toLowerCase())?.name || parsedCardName)
        : parsedCardName;

      setActiveSpirit(null);
      setActiveTarotPersona(normalizedCardName);
      currentMode = 'tarot-persona';
      trimmedText = questionText;

      const summonMsg: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        text: `[ Embodied the live archetype of ${normalizedCardName.toUpperCase()} ]\n\nI have aligned my energy with this physical layer. Ask me of my secrets or seek my guidance.`,
        timestamp: new Date(),
        mode: 'tarot-persona'
      };

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        text: questionText,
        timestamp: new Date(),
        mode: 'tarot-persona'
      };

      setMessages([
        {
          id: 'welcome',
          role: 'model',
          text: `You have crossed the threshold. Speak directly to the living soul of ${normalizedCardName}.`,
          timestamp: new Date(),
          mode: 'tarot-persona'
        },
        summonMsg,
        userMsg
      ]);
      setInput('');
      setIsTyping(true);

      const nextCount = readingCount + 1;
      setReadingCount(nextCount);
      localStorage.setItem('laevus_readings_count_v1', nextCount.toString());

      const score = computeSentiment(questionText);
      const newScores = [...sentimentScores, score];
      setSentimentScores(newScores);
      localStorage.setItem('laevus_sentiment_timeline', JSON.stringify(newScores));

      try {
        const reply = await metaphysicalConsultation(
          questionText,
          [],
          {
            mode: 'tarot-persona',
            personaCardName: normalizedCardName,
            readingCount: nextCount
          }
        );

        const modelMsg: Message = {
          id: crypto.randomUUID(),
          role: 'model',
          text: reply,
          timestamp: new Date(),
          mode: 'tarot-persona'
        };

        setMessages(prev => [...prev, modelMsg]);

        addTranscriptRecord(
          'madam',
          `Conversed with ${normalizedCardName}`,
          `User: ${questionText}\n\n${normalizedCardName}: ${reply}`,
          {
            querentPrompt: questionText,
            madamBlavatskyReply: reply
          }
        );
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
      return;
    }

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
      text: trimmedText || (currentMode === 'tarot-physical' ? `Synthesize Tarot: "${tarotQuestion || "General alignment"}"` : `Draw Tarot: "${tarotQuestion || "General life alignment"}"`),
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
      } else if (currentMode === 'tarot-physical' && customCards) {
        reply = await metaphysicalConsultation(
          `Synthesize a Physical Realm Three-Card reading for my question: "${tarotQuestion || "General life alignment"}"`,
          formattedHistory,
          {
            mode: 'tarot-physical',
            tarotCards: customCards,
            tarotQuestion: tarotQuestion || "General alignment",
            readingCount: nextCount
          }
        );
      } else if (currentMode === 'tarot-persona' && activeTarotPersona) {
        reply = await metaphysicalConsultation(
          trimmedText,
          formattedHistory,
          {
            mode: 'tarot-persona',
            personaCardName: activeTarotPersona,
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
      if ((currentMode === 'tarot' || currentMode === 'tarot-physical') && customCards) {
        const cardsDesc = customCards.map(c => `[${c.position}] ${c.symbol} ${c.name} - ${c.meaning}`).join('\n');
        addTranscriptRecord(
          'tarot',
          `${currentMode === 'tarot-physical' ? 'Physical Synthesis' : 'Digital Draw'}: ${tarotQuestion || 'Life Alignment'}`,
          `Question: ${tarotQuestion}\n\nCards Drawn:\n${cardsDesc}\n\nInterpretation:\n${reply}`,
          {
            querentPrompt: tarotQuestion || "General alignment",
            drawnCards: customCards,
            madamBlavatskyReply: reply
          }
        );
      } else if (currentMode === 'tarot-persona' && activeTarotPersona) {
        addTranscriptRecord(
          'madam', // store in General/Oracle tab
          `Conversed with ${activeTarotPersona}`,
          `User: ${trimmedText}\n\n${activeTarotPersona}: ${reply}`,
          {
            querentPrompt: trimmedText,
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

  useEffect(() => {
    // Support URL parameters for deep-linking [MODE 1] Card: <Name>. User Question: <Question>
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    const cardParam = params.get('card');
    const questionParam = params.get('question');
    
    if (cardParam && questionParam && modeParam === '1') {
      const timer = setTimeout(() => {
        handleSend(`[MODE 1] Card: ${cardParam}. User Question: ${questionParam}`);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

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

  const handleSummonTarotPersona = (cardName: string) => {
    setActiveSpirit(null);
    setActiveTarotPersona(cardName);
    const summonMsg: Message = {
      id: crypto.randomUUID(),
      role: 'model',
      text: `[ Embodied the live archetype of ${cardName.toUpperCase()} ]\n\nI have aligned my energy with this physical layer. Ask me of my secrets or seek my guidance.`,
      timestamp: new Date(),
      mode: 'tarot-persona'
    };
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: `You have crossed the threshold. Speak directly to the living soul of ${cardName}.`,
        timestamp: new Date(),
        mode: 'tarot-persona'
      },
      summonMsg
    ]);
    setActiveView('chat');
  };

  const handleReleaseTarotPersona = () => {
    if (!activeTarotPersona) return;
    const releaseMsg: Message = {
      id: crypto.randomUUID(),
      role: 'model',
      text: `[ Ended session with ${activeTarotPersona}. LAEVUS returns as your primary guide. ]`,
      timestamp: new Date(),
      mode: 'laevus'
    };
    setActiveTarotPersona(null);
    setMessages(prev => [...prev, releaseMsg]);
  };

  const handleStartEncyclopediaConversation = (cardName: string, questionText: string) => {
    handleSummonTarotPersona(cardName);
    if (questionText.trim()) {
      setTimeout(() => {
        handleSend(questionText, 'tarot-persona');
      }, 500);
    }
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

  const handlePhysicalSynthesis = async () => {
    if (!tarotQuestion.trim()) {
      alert("Please define the question you wish the cards to answer.");
      return;
    }
    if (!physicalPastCard || !physicalPresentCard || !physicalFutureCard) {
      alert("Please select cards for all three positions (Past, Present, and Future).");
      return;
    }

    const pastObj = TAROT_DECK.find(c => c.name === physicalPastCard);
    const presentObj = TAROT_DECK.find(c => c.name === physicalPresentCard);
    const futureObj = TAROT_DECK.find(c => c.name === physicalFutureCard);

    if (!pastObj || !presentObj || !futureObj) {
      alert("An error occurred. Please select valid cards.");
      return;
    }

    const physicalCards: TarotCard[] = [
      { ...pastObj, position: 'Past' },
      { ...presentObj, position: 'Present' },
      { ...futureObj, position: 'Future' }
    ];

    setIsDrawing(true);
    setFlippedCount(0);
    setDrawnCards([]);

    setDrawnCards(physicalCards);

    for (let i = 1; i <= 3; i++) {
      await new Promise(res => setTimeout(res, 500));
      setFlippedCount(i);
    }

    await new Promise(res => setTimeout(res, 400));
    setIsDrawing(false);
    setActiveView('chat');

    handleSend(`Perform a Physical Realm Synthesis reading regarding: "${tarotQuestion}"`, 'tarot-physical', physicalCards);
    setTarotQuestion('');
    setPhysicalPastCard('');
    setPhysicalPresentCard('');
    setPhysicalFutureCard('');
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
        <div className="flex-1 min-h-0 flex flex-col p-1 mb-2 relative animate-fadeIn w-full max-w-3xl mx-auto overflow-hidden font-google-sans">
          
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

          {/* Active Tarot Persona Banner */}
          {activeTarotPersona && (
            <div className="px-4 py-2 bg-zinc-950 flex items-center justify-between text-xs mb-2 rounded-lg border border-amber-500/25 flex-shrink-0 font-google-sans text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.04)]">
              <div className="flex items-center gap-3">
                <span className="text-sm">🃏</span>
                <div className="font-google-sans text-left">
                  <div className="flex items-center">
                    <span className="font-bold text-zinc-200 font-google-sans">{activeTarotPersona} Persona</span>
                    <span className="mx-2 text-zinc-700">|</span>
                    <span className="text-zinc-500 text-[10px] font-google-sans">Living archetype of the Major Arcana</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleReleaseTarotPersona}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 text-amber-400 text-[9px] uppercase hover:bg-amber-500/10 transition-colors cursor-pointer border border-transparent font-google-sans"
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
                     {isUser ? 'YOU' : m.spiritName ? m.spiritName.toUpperCase() : 'MADAM DUPONT'} • {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </span>
                   <div className={`px-4 py-3 rounded-xl leading-relaxed text-xs ${
                     isUser 
                       ? 'bg-zinc-900 text-[#F8F7F4]' 
                       : 'bg-zinc-950 text-[#F8F7F4]'
                   }`}>
                     {isUser ? (
                       <p className="whitespace-pre-wrap font-google-sans">{m.text}</p>
                     ) : (
                       <TypewriterText text={m.text} />
                     )}
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
            {/* Quick preset chips */}
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                onClick={() => setInput("[MODE 1] Card: The Moon. User Question: Why do I feel anxious today?")}
                className="text-[9px] uppercase tracking-wider font-bold px-2.5 py-1 rounded bg-zinc-900/60 hover:bg-amber-500/10 text-zinc-400 hover:text-amber-400 border border-zinc-800 transition-colors cursor-pointer"
              >
                🌙 Mode 1: Query "The Moon"
              </button>
            </div>
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

      {/* VIEW: TAROT ENCYCLOPEDIA */}
      {activeView === 'encyclopedia' && (
        <div className="flex-1 min-h-0 flex flex-col p-1 mb-2 relative animate-fadeIn w-full max-w-4xl mx-auto overflow-y-auto font-google-sans pr-1">
          <div className="border-b border-zinc-900/40 pb-3 mb-4">
            <span className="text-[10px] uppercase tracking-widest text-[#E60026] font-bold block font-google-sans">The Living Tarot Encyclopedia</span>
            <span className="text-xs text-zinc-500 block mt-0.5 font-google-sans">Browse the Major Arcana and select a card to align with and speak directly to its living archetype.</span>
          </div>

          {!selectedEncyclopediaCard ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {TAROT_DECK.map((card) => (
                <div
                  key={card.name}
                  onClick={() => {
                    setSelectedEncyclopediaCard(card);
                    setEncyclopediaQuestion('');
                  }}
                  className="group bg-zinc-950 border border-zinc-900 rounded-lg p-3 hover:border-amber-500/30 transition-all duration-300 cursor-pointer flex flex-col items-center text-center shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:shadow-[0_4px_20px_rgba(245,158,11,0.03)] hover:-translate-y-0.5"
                >
                  <div className="w-full aspect-[2/3] rounded bg-zinc-900 border border-zinc-800/60 overflow-hidden relative mb-2.5">
                    {card.image ? (
                      <img
                        src={card.image}
                        alt={card.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover grayscale opacity-45 group-hover:grayscale-0 group-hover:opacity-85 transition-all duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl opacity-40 bg-zinc-900 font-mono">🃏</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-60" />
                    <span className="absolute bottom-2 right-2 text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">{card.symbol}</span>
                  </div>
                  <h3 className="font-bold text-xs text-zinc-200 group-hover:text-amber-400 transition-colors uppercase tracking-wider">{card.name}</h3>
                  <span className="text-[9px] text-zinc-500 mt-1 line-clamp-1 group-hover:text-zinc-400 transition-colors">{card.description}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-zinc-950 border border-zinc-900/60 rounded-xl p-4 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.6)] flex flex-col md:flex-row gap-6 animate-fadeIn">
              <div className="w-full md:w-2/5 flex flex-col items-center">
                <div className="w-full max-w-[200px] aspect-[2/3] rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden relative shadow-[0_5px_15px_rgba(0,0,0,0.8)]">
                  {selectedEncyclopediaCard.image ? (
                    <img
                      src={selectedEncyclopediaCard.image}
                      alt={selectedEncyclopediaCard.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover grayscale opacity-75 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl opacity-40 font-mono">🃏</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <span className="absolute bottom-4 right-4 text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">{selectedEncyclopediaCard.symbol}</span>
                </div>
                <button
                  onClick={() => setSelectedEncyclopediaCard(null)}
                  className="mt-4 text-[10px] uppercase font-bold tracking-widest text-zinc-500 hover:text-zinc-200 transition-colors flex items-center gap-1"
                >
                  ← Return to Grid
                </button>
              </div>

              <div className="flex-1 flex flex-col text-left space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold font-google-sans text-amber-400 tracking-wide uppercase">{selectedEncyclopediaCard.name}</h2>
                    <span className="text-xl">{selectedEncyclopediaCard.symbol}</span>
                  </div>
                  <p className="text-xs text-zinc-400 font-medium tracking-wide mt-1 uppercase text-zinc-500">{selectedEncyclopediaCard.description}</p>
                </div>

                <div className="bg-zinc-900/30 border border-zinc-900/60 rounded-lg p-3.5 space-y-2">
                  <h4 className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Esoteric Core Meaning</h4>
                  <p className="text-xs text-zinc-300 leading-relaxed font-google-sans">{selectedEncyclopediaCard.meaning}</p>
                </div>

                <div className="border-t border-zinc-900/60 pt-4 space-y-3">
                  <div>
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-amber-500/70 mb-1">Converse with Archetype (Mode 1)</h4>
                    <p className="text-[10px] text-zinc-500">Pose a question to align with this card. The intelligence will embody its raw energy to speak with you.</p>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <textarea
                      placeholder={`Pose your question to the soul of ${selectedEncyclopediaCard.name}... (e.g. "What challenges must I overcome to align with your energy?")`}
                      value={encyclopediaQuestion}
                      onChange={(e) => setEncyclopediaQuestion(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-3 text-xs text-zinc-300 focus:outline-none focus:border-amber-500/30 placeholder-zinc-700 resize-none h-20 font-google-sans"
                    />
                    <button
                      onClick={() => handleStartEncyclopediaConversation(selectedEncyclopediaCard.name, encyclopediaQuestion)}
                      disabled={!encyclopediaQuestion.trim()}
                      className={`py-2 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        encyclopediaQuestion.trim()
                          ? 'bg-amber-500 hover:bg-amber-600 text-black cursor-pointer shadow-[0_2px_10px_rgba(245,158,11,0.2)]'
                          : 'bg-zinc-900 text-zinc-700 cursor-not-allowed'
                      }`}
                    >
                      <span>🕯️ Initiate Seance</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: GET A FREE READING! */}
      {activeView === 'tarot' && (
        <div className="p-3 sm:p-4 mb-2 relative animate-fadeIn space-y-4 w-full max-w-3xl mx-auto flex-1 flex flex-col justify-center min-h-0">
          <div className="border-b border-zinc-900/40 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#E60026] font-bold block font-google-sans">Tarot Sanctuary</span>
              <span className="text-xs text-zinc-500 block mt-0.5 font-google-sans">Invoke the guidance of the Major Arcana using digital draws or physical cards.</span>
            </div>
            
            {/* Mode Tabs */}
            <div className="flex gap-2.5 self-start bg-zinc-950 p-1 rounded-lg border border-zinc-900">
              <button
                onClick={() => setTarotMode('digital')}
                disabled={isDrawing}
                className={`px-3 py-1 text-[9px] uppercase tracking-wider font-bold rounded-md transition-all ${
                  tarotMode === 'digital'
                    ? 'bg-[#E60026] text-black shadow-md'
                    : 'text-zinc-500 hover:text-zinc-300 cursor-pointer'
                }`}
              >
                Digital Oracle
              </button>
              <button
                onClick={() => setTarotMode('physical')}
                disabled={isDrawing}
                className={`px-3 py-1 text-[9px] uppercase tracking-wider font-bold rounded-md transition-all ${
                  tarotMode === 'physical'
                    ? 'bg-[#E60026] text-black shadow-md'
                    : 'text-zinc-500 hover:text-zinc-300 cursor-pointer'
                }`}
              >
                Physical Realm Catalyst
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[9px] text-zinc-500 uppercase tracking-widest block font-bold mb-1 font-google-sans">Enter your query / question:</label>
              <input 
                type="text"
                value={tarotQuestion}
                onChange={(e) => setTarotQuestion(e.target.value)}
                disabled={isDrawing}
                placeholder="e.g. What secrets await my journey in this upcoming eclipse?"
                className="w-full bg-zinc-950 border border-zinc-900 focus:border-[#E60026] text-xs px-3 py-2.5 rounded-lg text-zinc-300 outline-none font-google-sans placeholder-zinc-850 shadow-md"
              />
            </div>

            {tarotMode === 'digital' ? (
              <div className="space-y-4">
                {drawnCards.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    {drawnCards.map((card, idx) => {
                      const isFlipped = flippedCount > idx;
                      return (
                        <div 
                          key={card.name}
                          className="w-full max-w-[145px] sm:max-w-[165px] mx-auto"
                        >
                          {isFlipped ? (
                            <div className="relative overflow-hidden aspect-[2/3.1] rounded-xl border border-zinc-800/60 flex flex-col justify-between items-center bg-black group hover:scale-[1.05] transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.8)] hover:border-[#E60026]/40">
                              <img 
                                src={card.image} 
                                alt={card.name} 
                                referrerPolicy="no-referrer"
                                className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:scale-110 transition-transform duration-700"
                              />
                              <div className="absolute inset-1.5 border border-amber-500/20 rounded-lg pointer-events-none z-10 shadow-[inset_0_0_12px_rgba(0,0,0,0.6)] group-hover:border-amber-500/40 transition-colors" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/70 z-10 pointer-events-none" />
                              <div className="relative z-20 pt-2.5 flex flex-col items-center">
                                <span className="text-[7px] text-[#E60026] uppercase font-mono tracking-widest font-bold bg-black/85 border border-[#E60026]/30 px-2 py-0.5 rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.5)]">
                                  {card.position}
                                </span>
                              </div>
                              <div className="relative z-20 w-full px-2 pb-2 text-center">
                                <div className="bg-black/80 backdrop-blur-sm border border-zinc-900/60 px-1.5 py-1 rounded-md max-w-full shadow-lg">
                                  <span className="text-[8px] sm:text-[9px] font-bold text-zinc-100 leading-none block font-google-sans uppercase tracking-wider truncate">
                                    {card.name}
                                  </span>
                                  <span className="text-[6.5px] sm:text-[7px] text-zinc-400 font-mono block mt-0.5 leading-none truncate">
                                    {card.description}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="relative overflow-hidden aspect-[2/3.1] rounded-xl border border-zinc-900 bg-zinc-950 flex flex-col items-center justify-center p-3 text-center cursor-pointer group hover:border-[#E60026]/50 hover:shadow-[0_0_20px_rgba(230,0,38,0.15)] transition-all duration-300 shadow-[inset_0_1px_4px_rgba(255,255,255,0.01)]">
                              <div className="absolute inset-1.5 border border-zinc-800/40 rounded-lg pointer-events-none" />
                              <div className="absolute inset-0 bg-[radial-gradient(#E60026_1px,transparent_1px)] bg-[size:7px_7px] opacity-[0.18] rounded-lg group-hover:opacity-[0.3] transition-opacity" />
                              <div className="absolute w-12 h-12 rounded-full border border-dashed border-zinc-800/50 animate-[spin_15s_linear_infinite]" />
                              <div className="absolute w-16 h-16 rounded-full border border-dotted border-zinc-900/80 animate-[spin_30s_linear_infinite] pointer-events-none" />
                              <div className="w-9 h-9 rounded-full border border-zinc-850 flex items-center justify-center text-zinc-400 group-hover:text-[#ff334b] group-hover:border-[#E60026]/40 transition-all shadow-[inset_0_1px_3px_rgba(255,255,255,0.01)] text-base relative z-10 bg-zinc-950">
                                👁️
                              </div>
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
                      : 'bg-zinc-950 text-zinc-800 cursor-not-allowed border border-zinc-900/50'
                  }`}
                >
                  {isDrawing ? "DRAWING CARDS..." : "DRAW 3 CARDS"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="flex flex-col text-left space-y-1">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-500">1. Past Energy</span>
                    <select
                      value={physicalPastCard}
                      onChange={(e) => setPhysicalPastCard(e.target.value)}
                      disabled={isDrawing}
                      className="bg-zinc-950 border border-zinc-900 text-zinc-300 text-xs rounded-lg px-3 py-2.5 outline-none w-full font-google-sans focus:border-[#E60026] cursor-pointer"
                    >
                      <option value="">Select Card...</option>
                      {TAROT_DECK.map(c => <option key={c.name} value={c.name}>{c.symbol} {c.name}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col text-left space-y-1">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-500">2. Present Energy</span>
                    <select
                      value={physicalPresentCard}
                      onChange={(e) => setPhysicalPresentCard(e.target.value)}
                      disabled={isDrawing}
                      className="bg-zinc-950 border border-zinc-900 text-zinc-300 text-xs rounded-lg px-3 py-2.5 outline-none w-full font-google-sans focus:border-[#E60026] cursor-pointer"
                    >
                      <option value="">Select Card...</option>
                      {TAROT_DECK.map(c => <option key={c.name} value={c.name}>{c.symbol} {c.name}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col text-left space-y-1">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-500">3. Future Energy</span>
                    <select
                      value={physicalFutureCard}
                      onChange={(e) => setPhysicalFutureCard(e.target.value)}
                      disabled={isDrawing}
                      className="bg-zinc-950 border border-zinc-900 text-zinc-300 text-xs rounded-lg px-3 py-2.5 outline-none w-full font-google-sans focus:border-[#E60026] cursor-pointer"
                    >
                      <option value="">Select Card...</option>
                      {TAROT_DECK.map(c => <option key={c.name} value={c.name}>{c.symbol} {c.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Previews of selected physical cards */}
                {physicalPastCard && physicalPresentCard && physicalFutureCard && (
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    {[
                      { name: physicalPastCard, pos: 'Past' },
                      { name: physicalPresentCard, pos: 'Present' },
                      { name: physicalFutureCard, pos: 'Future' }
                    ].map((item, idx) => {
                      const cardObj = TAROT_DECK.find(c => c.name === item.name);
                      return (
                        <div key={idx} className="w-full max-w-[145px] sm:max-w-[165px] mx-auto animate-fadeIn">
                          <div className="relative overflow-hidden aspect-[2/3.1] rounded-xl border border-zinc-800/60 flex flex-col justify-between items-center bg-black group hover:scale-[1.05] transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.8)] hover:border-[#E60026]/40">
                            {cardObj?.image && (
                              <img 
                                src={cardObj.image} 
                                alt={cardObj.name} 
                                referrerPolicy="no-referrer"
                                className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:scale-110 transition-transform duration-700"
                              />
                            )}
                            <div className="absolute inset-1.5 border border-amber-500/20 rounded-lg pointer-events-none z-10 shadow-[inset_0_0_12px_rgba(0,0,0,0.6)]" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/70 z-10 pointer-events-none" />
                            <div className="relative z-20 pt-2.5 flex flex-col items-center">
                              <span className="text-[7px] text-[#E60026] uppercase font-mono tracking-widest font-bold bg-black/85 border border-[#E60026]/30 px-2 py-0.5 rounded-full">
                                {item.pos}
                              </span>
                            </div>
                            <div className="relative z-20 w-full px-2 pb-2 text-center">
                              <div className="bg-black/80 backdrop-blur-sm border border-zinc-900/60 px-1.5 py-1 rounded-md max-w-full">
                                <span className="text-[8px] sm:text-[9px] font-bold text-zinc-100 uppercase tracking-wider block truncate">
                                  {item.name}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button
                  onClick={handlePhysicalSynthesis}
                  disabled={isDrawing || !tarotQuestion.trim() || !physicalPastCard || !physicalPresentCard || !physicalFutureCard}
                  className={`w-full py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all duration-300 cursor-pointer font-google-sans ${
                    tarotQuestion.trim() && !isDrawing && physicalPastCard && physicalPresentCard && physicalFutureCard
                      ? 'bg-amber-500 text-black hover:bg-amber-600 shadow-[0_2px_15px_rgba(245,158,11,0.2)]'
                      : 'bg-zinc-950 text-zinc-800 cursor-not-allowed border border-zinc-900/50'
                  }`}
                >
                  {isDrawing ? "SYNTHESIZING REALMS..." : "Synthesize Physical Reading (Mode 2)"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: THE AFTERLIFE (SPEAK TO THE DEAD) */}
      {activeView === 'afterlife' && (
        <div className="p-4 sm:p-6 mb-4 relative animate-fadeIn space-y-6 w-full max-w-3xl mx-auto">
          <div className="border-b border-zinc-900/40 pb-3 flex justify-between items-center">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#E60026] font-bold block">Converse with Historical Spirits & Figures</span>
              <span className="text-xs text-zinc-500 block mt-0.5">Select a historical figure below to start a chat session.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[520px] overflow-y-auto pr-1">
            {SPIRITS.map((spirit) => {
              const isActive = activeSpirit?.name === spirit.name;
              return (
                <button
                  key={spirit.name}
                  onClick={() => handleSummonSpirit(spirit)}
                  className={`flex flex-col rounded-xl overflow-hidden border text-left cursor-pointer group transition-all duration-300 relative shadow-lg hover:scale-[1.02] ${
                    isActive 
                      ? 'bg-zinc-950 border-[#E60026] ring-1 ring-[#E60026]/35 shadow-[0_0_20px_rgba(230,0,38,0.12)]' 
                      : 'bg-zinc-950 border-zinc-900/60 hover:border-zinc-800 hover:shadow-[0_8px_20px_rgba(0,0,0,0.6)]'
                  }`}
                >
                  {/* Card Art Header */}
                  <div className="relative w-full aspect-[16/10.5] overflow-hidden border-b border-zinc-900/50">
                    <img 
                      src={spirit.image} 
                      alt={spirit.name} 
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                    />
                    {/* Vignette Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-black/40 pointer-events-none" />
                    
                    {/* Floating Badges */}
                    <div className="absolute top-2.5 left-2.5 flex gap-1.5 items-center z-10 pointer-events-none">
                      <span className="text-[15px] leading-none filter drop-shadow-md bg-black/75 p-1 rounded-md border border-zinc-800/40">{spirit.avatar}</span>
                      {spirit.tier === 'premium' && (
                        <span className="text-[6px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-mono shadow-md backdrop-blur-xs">
                          ASTRAL
                        </span>
                      )}
                    </div>

                    <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
                      <span className="text-[7px] font-bold text-zinc-400 bg-black/80 px-1.5 py-0.5 rounded border border-zinc-800/45 shadow-sm font-mono tracking-wider">
                        {spirit.era}
                      </span>
                    </div>

                    {/* Character Nameplate overlay on bottom of image */}
                    <div className="absolute bottom-2 left-3 right-3 z-10 pointer-events-none">
                      <h5 className="text-[12px] font-extrabold text-white leading-tight font-google-sans drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] tracking-wide group-hover:text-[#ff334b] transition-colors">
                        {spirit.name}
                      </h5>
                      <p className="text-[8.5px] text-zinc-300 font-medium font-mono tracking-wide leading-none mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
                        {spirit.description}
                      </p>
                    </div>
                  </div>

                  {/* Card Body Information */}
                  <div className="p-3.5 flex flex-col justify-between flex-grow space-y-3 bg-gradient-to-b from-zinc-950 to-black">
                    {/* Historical Significance Fact */}
                    <div className="space-y-1">
                      <span className="text-[7px] uppercase tracking-widest text-[#E60026] font-extrabold block font-mono">HISTORICAL FACT</span>
                      <p className="text-[9.5px] leading-relaxed text-zinc-400 group-hover:text-zinc-300 transition-colors font-google-sans">
                        {spirit.fact}
                      </p>
                    </div>

                    {/* Trigger Clue without exact trigger words */}
                    <div className="pt-2 border-t border-zinc-900/40 space-y-1">
                      <span className="text-[7px] uppercase tracking-widest text-emerald-400 font-extrabold block font-mono">ASTRAL TRIGGERS</span>
                      <p className="text-[9px] leading-relaxed text-zinc-500 italic group-hover:text-zinc-400 transition-colors font-google-sans">
                        {spirit.triggerHint}
                      </p>
                    </div>

                    {/* Tarot Alignment */}
                    {spirit.tarotCard && (
                      <div className="pt-2 border-t border-zinc-900/40 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[7px] uppercase tracking-widest text-amber-500 font-extrabold block font-mono">TAROT ALIGNMENT</span>
                          <span className="text-[6.5px] font-bold text-amber-400 font-mono">{spirit.tarotCard.num}</span>
                        </div>
                        <p className="text-[9px] leading-relaxed text-zinc-400 font-google-sans">
                          <strong className="text-zinc-200">{spirit.tarotCard.name}</strong> — {spirit.tarotCard.meaning}
                        </p>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: TRANSCRIPTS */}
      {activeView === 'transcripts' && (
        <div className="p-4 sm:p-6 mb-4 relative animate-fadeIn space-y-6 w-full max-w-3xl mx-auto">
          <div className="border-b border-zinc-900/40 pb-3">
            <span className="text-[10px] uppercase tracking-widest text-[#E60026] font-bold block">Saved Logs & Readings</span>
            <span className="text-xs text-zinc-500 block mt-0.5">Your archive of past readings and conversations.</span>
          </div>

          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
            {transcripts.filter(t => t.category === 'madam').length === 0 ? (
              <div className="text-center py-12 text-zinc-600 text-xs uppercase tracking-widest">
                No logs stored in this section.
              </div>
            ) : (
              transcripts
                .filter(t => t.category === 'madam')
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
        <div className="p-4 sm:p-6 mb-4 relative animate-fadeIn space-y-8 w-full max-w-3xl mx-auto">
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
                    const x = (idx / (sentimentScores.length - 1 || 1)) * 500;
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
                  const x = (idx / (sentimentScores.length - 1 || 1)) * 500;
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
        <div className="p-4 sm:p-6 mb-4 relative animate-fadeIn space-y-6 w-full max-w-3xl mx-auto">
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
