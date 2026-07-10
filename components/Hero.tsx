import React from 'react';

export const Hero: React.FC = () => {
  return (
    <div className="text-center relative z-10 max-w-6xl mx-auto px-4 pt-12 pb-6 flex flex-col items-center">
      <span className="font-zeyada text-xl text-zinc-400 mb-4 flex items-center gap-2">
        <span className="inline-block w-1 h-1 bg-zinc-500 rounded-full"></span>
        THE<span className="text-[#E60026]">LEFT</span>.ONE PRESENTS
      </span>
      
      <h1 className="font-syne text-5xl sm:text-7xl md:text-8xl lg:text-[9rem] font-extrabold tracking-[-0.06em] text-[#F8F7F4] uppercase mb-4 leading-[0.85] selection:bg-[#E60026] selection:text-[#111113]">
        LAEVUS
      </h1>
      
      <p className="text-xs sm:text-sm md:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed font-light font-mono italic border-t border-[#F8F7F4]/10 pt-4 mt-2">
        Talk to your very own metaphysical guide. She can answer questions, read your tarot cards and talk to the dead.
      </p>
    </div>
  );
};
