import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, Send, MailOpen, Lock } from 'lucide-react';
import { playSound } from '../utils/audio';

interface SurpriseLetterProps {
  girlfriendName: string;
  boyfriendName: string;
  loveMessage: string;
}

export const SurpriseLetter: React.FC<SurpriseLetterProps> = ({
  girlfriendName,
  boyfriendName,
  loveMessage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showHearts, setShowHearts] = useState(false);
  const [localHearts, setLocalHearts] = useState<{ id: number; left: number; speed: number; scale: number; emoji: string }[]>([]);

  const handleOpenEnvelope = () => {
    playSound('fanfare');
    setIsOpen(true);
    setShowHearts(true);

    // Create a burst of local cute rising hearts when the envelope is opened
    const emojis = ['🎈', '💖', '💝', '🌹', '❤️', '🌸', '✨', '💋'];
    const newHearts = Array.from({ length: 15 }).map((_, i) => ({
      id: Date.now() + i,
      left: Math.random() * 85 + 5, // Keep within the card bounds
      speed: 2 + Math.random() * 2.5,
      scale: 0.5 + Math.random() * 0.8,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));
    setLocalHearts(newHearts);
  };

  return (
    <div className="w-full max-w-lg mx-auto py-5 select-none relative" id="romantic-surprise-envelope-wrapper">
      
      {/* Interactive Local Rising Heart Particles */}
      <AnimatePresence>
        {showHearts && localHearts.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{ y: 150, opacity: 0, scale: 0 }}
            animate={{ 
              y: -220, 
              opacity: [0, 1, 1, 0],
              scale: heart.scale,
              rotate: Math.random() * 90 - 45,
              x: (Math.random() * 60) - 30 
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: heart.speed, ease: "easeOut" }}
            className="absolute pointer-events-none text-2xl z-40 filter drop-shadow-sm select-none"
            style={{ left: `${heart.left}%`, bottom: '40px' }}
          >
            {heart.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="text-center mb-4">
        <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest bg-rose-50 border border-rose-100 px-3 py-1 rounded-full inline-flex items-center gap-1.5 animate-pulse">
          <Sparkles className="w-3 h-3 text-rose-500 fill-rose-100" />
          <span>Surprise Sealed Letter 💌</span>
        </span>
      </div>

      <AnimatePresence mode="wait">
        {!isOpen ? (
          /* CLOSED METALLIC-BLUSH ENVELOPE DESIGN */
          <motion.div
            key="envelope-closed"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            whileHover={{ scale: 1.02 }}
            onClick={handleOpenEnvelope}
            className="w-full aspect-[1.6/1] bg-gradient-to-br from-red-50 to-pink-100/90 rounded-3xl border-2 border-pink-200 p-6 shadow-2xl relative cursor-pointer overflow-hidden flex flex-col justify-between"
            style={{
              boxShadow: '0 20px 40px rgba(244, 63, 94, 0.15), inset 0 2px 8px rgba(255, 255, 255, 0.8)'
            }}
          >
            {/* Elegant double gold hairline layout filigree */}
            <div className="absolute inset-2 border border-pink-300/40 rounded-2xl pointer-events-none" />
            <div className="absolute inset-2.5 border border-dashed border-pink-200/50 rounded-2xl pointer-events-none" />

            {/* Simulated Envelope Flap Line Layout */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-pink-200/80 fill-none" xmlns="http://www.w3.org/2000/svg">
              <path d="M 2 2 L 250 130 C 255 133, 265 133, 270 130 L 518 2" strokeWidth="2" />
              <path d="M 2 320 M 2 318 L 220 150 M 518 318 L 300 150" strokeWidth="1.5" strokeDasharray="3 3" />
            </svg>

            {/* Corner Decorative Ornaments */}
            <div className="absolute top-4 left-4 text-pink-300 pointer-events-none">✨</div>
            <div className="absolute top-4 right-4 text-pink-300 pointer-events-none">✨</div>
            <div className="absolute bottom-4 left-4 text-pink-300 pointer-events-none">🌹</div>
            <div className="absolute bottom-4 right-4 text-pink-300 pointer-events-none">🌹</div>

            {/* Addressed To Text Area */}
            <div className="text-center pt-8 z-10 space-y-1">
              <p className="text-[9px] uppercase tracking-widest text-rose-450 font-bold font-mono">
                Handcrafted with Infinite Love
              </p>
              <h3 className="font-serif text-rose-800 text-xl md:text-2xl font-black italic tracking-wide">
                My Lovely Princess, {girlfriendName} ✨
              </h3>
              <p className="text-[10px] text-gray-400 font-mono italic">
                Coded & signed by your loving boyfriend, {boyfriendName}
              </p>
            </div>

            {/* WAXY HEART SEAL IN CENTER */}
            <div className="flex flex-col items-center justify-center z-20 pb-4 relative">
              {/* Seal glow glow */}
              <div className="absolute w-20 h-20 bg-rose-400/20 rounded-full blur-md animate-ping pointer-events-none" />
              
              <motion.button
                whileHover={{ scale: 1.12, rotate: [0, -5, 5, -5, 5, 0] }}
                whileTap={{ scale: 0.9 }}
                className="w-14 h-14 bg-gradient-to-tr from-rose-600 via-red-500 to-pink-500 rounded-full flex items-center justify-center border-4 border-amber-300 shadow-xl cursor-pointer relative"
              >
                <Heart className="w-6 h-6 text-white fill-white animate-pulse" />
                {/* Simulated ribbon sticking out under the wax seal */}
                <div className="absolute -bottom-4 w-5 h-8 bg-gradient-to-b from-red-600 to-red-800 rotate-12 -z-10 rounded-b shadow-sm" />
                <div className="absolute -bottom-4 w-5 h-8 bg-gradient-to-b from-red-600 to-red-800 -rotate-12 -z-10 rounded-b shadow-sm" />
              </motion.button>

              <span className="text-[10px] font-black tracking-widest text-rose-600 uppercase mt-2.5 animate-pulse flex items-center gap-1 bg-white/70 px-3 py-0.5 rounded-full border border-pink-100 shadow-xs">
                <Lock className="w-2.5 h-2.5" />
                <span>TAP WAX SEAL TO OPEN</span>
              </span>
            </div>
          </motion.div>
        ) : (
          /* GORGEOUS PARCHMENT STYLE UNFOLDED SCROLL/LETTER */
          <motion.div
            key="envelope-opened"
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 15 }}
            className="w-full bg-gradient-to-b from-[#FFFDF5] to-[#FFFAF2] border-4 border-double border-amber-200 rounded-3xl p-6 md:p-8 shadow-2xl relative text-left"
            style={{
              backgroundImage: 'radial-gradient(#FDFBF7 10%, transparent 11%), radial-gradient(#FCFAF4 10%, transparent 11%)',
              backgroundSize: '10px 10px',
              boxShadow: '0 25px 50px -12px rgba(220,110,60,0.18), inset 0 0 40px rgba(254,243,199,0.5)'
            }}
          >
            {/* Soft pink wax stamp accent on upper right corner */}
            <div className="absolute top-4 right-4 md:top-6 md:right-6 pointer-events-none opacity-80 rotate-12">
              <div className="w-12 h-12 rounded-full border-4 border-double border-rose-300/60 bg-rose-100/50 flex items-center justify-center text-xs font-serif font-black text-rose-500/80 p-1">
                LOVE IS REAL
              </div>
            </div>

            {/* Vintage borders & corners */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-amber-300/60 rounded-tl-md" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-amber-300/60 rounded-tr-md" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-amber-300/60 rounded-bl-md" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-amber-300/60 rounded-br-md" />

            {/* Header Quote Decoration */}
            <div className="text-center pb-5 border-b border-dashed border-amber-200/70 mb-5 relative">
              <p className="font-serif text-amber-800 text-xs tracking-wider uppercase font-extrabold italic">
                ✨ A Promise of Eternal devotion ✨
              </p>
              <div className="flex justify-center items-center gap-1 mt-1 text-rose-400">
                <Heart className="w-2.5 h-2.5 fill-current" />
                <span className="w-10 h-0.5 bg-amber-200/60" />
                <Heart className="w-3 h-3 fill-current animate-pulse text-rose-500" />
                <span className="w-10 h-0.5 bg-amber-200/60" />
                <Heart className="w-2.5 h-2.5 fill-current" />
              </div>
            </div>

            {/* Main letter body text with generous leading */}
            <div className="font-serif text-sm md:text-base text-gray-800 italic leading-relaxed space-y-4 max-h-[300px] overflow-y-auto pr-1">
              <span className="text-rose-600 font-extrabold text-base block not-italic font-sans tracking-wide">
                My Precious {girlfriendName},
              </span>
              <p className="whitespace-pre-wrap pl-2 border-l-2 border-pink-100/60">
                {loveMessage}
              </p>
            </div>

            {/* Signature Area */}
            <div className="mt-8 pt-4 border-t border-dashed border-amber-200/70 flex justify-between items-end">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-amber-700/60 font-mono font-bold">
                  Date of Bond
                </p>
                <p className="text-[10px] text-gray-500 italic font-mono">
                  Today & For All Eternity
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-widest text-amber-700/60 font-mono font-bold mb-1">
                  Yours Forever,
                </p>
                
                {/* Highly beautiful cursive-style calligraphy name block */}
                <div className="relative inline-block">
                  {/* Subtle cute decorative heart under signature */}
                  <div className="absolute -left-10 -top-4 text-pink-200 rotate-12 pointer-events-none">
                    <Heart className="w-8 h-8 fill-current" />
                  </div>
                  <p className="font-serif text-rose-600 font-extrabold text-xl md:text-2xl leading-none italic tracking-normal p-1 relative z-10 selection:bg-pink-100 hover:scale-105 transition-transform cursor-default">
                    {boyfriendName} ✍️
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => {
                  playSound('click');
                  setIsOpen(false);
                  setShowHearts(false);
                }}
                className="px-4 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-black uppercase tracking-widest rounded-full transition-all cursor-pointer shadow-xs border border-amber-200/50"
              >
                🔒 RESEAL THE ENVELOPE
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
