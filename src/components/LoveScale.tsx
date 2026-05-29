import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, Flame } from 'lucide-react';
import { playSound } from '../utils/audio';

interface LoveScaleProps {
  girlName: string;
  comments: { [key: number]: string };
  onComplete: (level: number) => void;
}

export const LoveScale: React.FC<LoveScaleProps> = ({ girlName, comments, onComplete }) => {
  const [hoverLevel, setHoverLevel] = useState<number | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number>(10); // Default to maximum 10!
  const [hasChanged, setHasChanged] = useState<boolean>(false);
  const [localParticles, setLocalParticles] = useState<{ id: number; left: number; size: number; emoji: string }[]>([]);
  
  // Custom interactive visual modes
  const [activeVisualMode, setActiveVisualMode] = useState<'potion' | 'rose' | 'cupid'>('potion');

  const currentLevel = hoverLevel !== null ? hoverLevel : selectedLevel;

  const handleSelect = (level: number) => {
    playSound('heart');
    setSelectedLevel(level);
    setHasChanged(true);

    // Pick specific emojis according to the score level for absolute visual storytelling
    let emojis = ['❤️', '✨'];
    if (level <= 3) {
      emojis = ['🤔', '❄️', '💨', '💔'];
    } else if (level <= 6) {
      emojis = ['😏', '🌸', '🧸', '💖'];
    } else if (level <= 9) {
      emojis = ['💖', '🥰', '💋', '✨', '💝'];
    } else {
      emojis = ['🔥', '👑', '💍', '💝', '💋', '🪐', '💞', '✨'];
    }

    // Spawn interactive floating particles inside the container
    const newParticles = Array.from({ length: 8 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      left: 10 + Math.random() * 80, // percentage x-axis
      size: 14 + Math.random() * 20, // size in px
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));
    setLocalParticles((prev) => [...prev, ...newParticles].slice(-24)); // Keep buffer clean
  };

  // Cute interactive dynamic title based on selected score
  const getDynamicHeadline = () => {
    if (currentLevel <= 3) return "Ouch, are you sure? 💔🧐";
    if (currentLevel <= 6) return "Getting warmer... 🧸😏";
    if (currentLevel <= 8) return "Aww, you really love me! 🥰💖";
    if (currentLevel === 9) return "Super hot love! 🔥💋";
    return "HEAVENLY! You're my queen! 💍👑✨";
  };

  // Mathematical height offset mapping for the dynamic liquid-fill heart level (100 is box height)
  // At level=10, y=5 (fills completely to the top curve)
  // At level=1, y=83 (tiny puddle at the bottom peak)
  const liquidHeightY = 92 - (currentLevel / 10) * 87;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-sm mx-auto bg-white/95 backdrop-blur-md p-5 md:p-6 rounded-3xl shadow-2xl border border-pink-100 flex flex-col items-center text-center relative overflow-hidden"
    >
      {/* Decorative Top Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 via-pink-400 to-rose-400" />
      
      {/* Interactive Floating Particles inside the card container */}
      <AnimatePresence>
        {localParticles.map((lp) => (
          <motion.div
            key={lp.id}
            initial={{ opacity: 0.9, scale: 0.2, y: 50, x: `${lp.left}%` }}
            animate={{ 
              opacity: [0.9, 1, 0.8, 0], 
              scale: [1, 1.4, 0.7], 
              y: -150, 
              x: `${lp.left + (Math.random() * 16 - 8)}%` 
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
            className="absolute pointer-events-none z-10 select-none drop-shadow-sm filter saturate-150"
            style={{ fontSize: lp.size, top: '40%' }}
          >
            {lp.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Visualizer Mode Selector Switch */}
      <div className="flex bg-pink-50/70 p-1 rounded-full mb-4 w-full border border-pink-100/80">
        <button
          onClick={() => setActiveVisualMode('potion')}
          className={`flex-1 py-1.5 md:py-2 text-[11px] font-black uppercase tracking-wider rounded-full transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeVisualMode === 'potion'
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md'
              : 'text-rose-700 hover:text-rose-900 hover:bg-pink-100/50'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          Potion Heart
        </button>
        <button
          onClick={() => setActiveVisualMode('rose')}
          className={`flex-1 py-1.5 md:py-2 text-[11px] font-black uppercase tracking-wider rounded-full transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeVisualMode === 'rose'
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md'
              : 'text-rose-700 hover:text-rose-900 hover:bg-pink-100/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Blooming Rose
        </button>
        <button
          onClick={() => setActiveVisualMode('cupid')}
          className={`flex-1 py-1.5 md:py-2 text-[11px] font-black uppercase tracking-wider rounded-full transition-all flex items-center justify-center gap-1 cursor-pointer ${
            activeVisualMode === 'cupid'
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md'
              : 'text-rose-700 hover:text-rose-900 hover:bg-pink-100/50'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          Cupid's Aim
        </button>
      </div>

      {/* Dynamic Love Meter Visual Area */}
      <div className="relative w-full h-44 mb-3 rounded-2xl bg-gradient-to-b from-pink-50/20 to-pink-50/50 border border-pink-100/50 shadow-inner flex items-center justify-center overflow-hidden">
        
        {/* Decorative Grid Lines / Radial Backlight in Visualization stage */}
        <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_center,rgba(255,182,193,0.15)_0%,transparent_70%)] pointer-events-none" />
        
        {/* Ambient sparkling dots inside visual block */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-4 left-6 w-1 h-1 bg-rose-450 rounded-full animate-ping" />
          <div className="absolute top-12 right-8 w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse" />
          <div className="absolute bottom-6 left-1/4 w-1 h-1 bg-pink-300 rounded-full animate-pulse" />
          <div className="absolute bottom-10 right-1/4 w-1.5 h-1.5 bg-red-400 rounded-full animate-ping" />
        </div>

        {/* -------------------- VIEWPORT MODE 1: LIQUID POTION HEART -------------------- */}
        {activeVisualMode === 'potion' && (
          <div className="relative flex flex-col items-center justify-center select-none">
            {/* Pulsing backing aura based on score */}
            <motion.div
              animate={{
                scale: [1, 1.1 + currentLevel * 0.02, 1],
                opacity: [0.12, 0.35 + currentLevel * 0.045, 0.12],
              }}
              transition={{
                duration: Math.max(0.4, 1.6 - currentLevel * 0.1),
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute w-24 h-24 rounded-full blur-xl"
              style={{ backgroundColor: '#f43f5e' }}
            />

            {/* SVG Glass Bottle Liquid Container */}
            <svg viewBox="0 0 100 100" className="w-32 h-32 relative z-10 filter drop-shadow-[0_8px_16px_rgba(244,63,94,0.18)]">
              <defs>
                <clipPath id="inner-heart-clip">
                  <path d="M 50, 90 C 20, 60 5, 45 5, 25 C 5, 10 20, 5 35, 5 C 43, 5 50, 10 50, 10 C 50, 10 57, 5 65, 5 C 80, 5 95, 10 95, 25 C 95, 45 80, 60 50, 90 Z" />
                </clipPath>
                
                {/* Foreground Liquid Gradient */}
                <linearGradient id="liquid-grad-front" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="45%" stopColor="#e11d48" />
                  <stop offset="100%" stopColor="#9f1239" />
                </linearGradient>

                {/* Background 3D Wave Liquid Gradient */}
                <linearGradient id="liquid-grad-back" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fca5a5" />
                  <stop offset="50%" stopColor="#fb7185" />
                  <stop offset="100%" stopColor="#be123c" />
                </linearGradient>
              </defs>

              {/* Glass Heart Container Backing Body */}
              <path 
                d="M 50, 90 C 20, 60 5, 45 5, 25 C 5, 10 20, 5 35, 5 C 43, 5 50, 10 50, 10 C 50, 10 57, 5 65, 5 C 80, 5 95, 10 95, 25 C 95, 45 80, 60 50, 90 Z" 
                fill="#fff1f2" 
                className="opacity-40"
              />

              {/* Inner Clipped Fluid Visualizer */}
              <g clipPath="url(#inner-heart-clip)">
                
                {/* Dry interior container wall shadow */}
                <rect width="100" height="100" fill="#ffe4e6" className="opacity-15" />

                {/* Back Liquid Wave (Layer 1) */}
                <motion.g
                  animate={{ y: liquidHeightY }}
                  transition={{ type: 'spring', stiffness: 50, damping: 14 }}
                  className="origin-bottom"
                >
                  <motion.path
                    d="M 0 0 Q 25 -7, 50 0 T 100 0 T 150 0 T 200 0 L 200 120 L 0 120 Z"
                    fill="url(#liquid-grad-back)"
                    opacity="0.65"
                    animate={{ x: [-100, 0] }}
                    transition={{ ease: 'linear', duration: 3.5, repeat: Infinity }}
                  />
                </motion.g>

                {/* Front Primary Liquid Wave (Layer 2) */}
                <motion.g
                  animate={{ y: liquidHeightY }}
                  transition={{ type: 'spring', stiffness: 45, damping: 11 }}
                  className="origin-bottom"
                >
                  <motion.path
                    d="M 0 0 Q 25 -5, 50 0 T 100 0 T 150 0 T 200 0 L 200 120 L 0 120 Z"
                    fill="url(#liquid-grad-front)"
                    animate={{ x: [0, -100] }}
                    transition={{ ease: 'linear', duration: 2.2, repeat: Infinity }}
                  />
                </motion.g>

                {/* Rising Sparkle Bubbles inside Potion when active */}
                {Array.from({ length: Math.min(12, Math.floor(currentLevel * 1.2)) }).map((_, i) => (
                  <motion.circle
                    key={i}
                    cx={15 + (i * 19) % 70}
                    cy={90}
                    r={1.5 + (i % 3) * 0.5}
                    fill="#ffffff"
                    opacity={0.65}
                    animate={{
                      y: [-10, -82],
                      opacity: [0, 0.8, 0.8, 0],
                      cx: [15 + (i * 19) % 70, 15 + (i * 19) % 70 + Math.sin(i * 1.5) * 6]
                    }}
                    transition={{
                      duration: 1.8 + (i % 3) * 0.4,
                      repeat: Infinity,
                      delay: i * 0.25,
                      ease: 'easeOut'
                    }}
                  />
                ))}

                {/* Level 10 Cosmic Starfall Glow Overlay */}
                {currentLevel === 10 && (
                  <motion.g animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ repeat: Infinity, duration: 2 }}>
                    <path d="M10,10 L90,90 M90,10 L10,90" stroke="#fef08a" strokeWidth="0.5" opacity="0.3" strokeDasharray="2,2" />
                  </motion.g>
                )}
              </g>

              {/* Glass Rim Outline Overlay (Slightly larger with beautiful physical reflection) */}
              <path 
                d="M 50, 90 C 20, 60 5, 45 5, 25 C 5, 10 20, 5 35, 5 C 43, 5 50, 10 50, 10 C 50, 10 57, 5 65, 5 C 80, 5 95, 10 95, 25 C 95, 45 80, 60 50, 90 Z" 
                fill="none" 
                stroke="#fda4af" 
                strokeWidth="2.8"
                className="opacity-70 pointer-events-none"
              />

              {/* Highlight Refraction curve for ultra-polished glass texture */}
              <path
                d="M 12, 18 C 14, 12, 22, 10, 30, 9"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.2"
                strokeLinecap="round"
                className="opacity-75 pointer-events-none"
              />
            </svg>

            {/* Micro Indicator Label overlayed */}
            <div className="absolute font-mono text-[8.5px] font-black text-rose-700 bg-white/95 px-2.5 py-0.5 rounded-full select-none shadow-md border border-rose-100 translate-y-16 z-20 pointer-events-none uppercase tracking-widest animate-pulse">
              {currentLevel < 4 ? '🐧 freezing' : currentLevel < 7 ? '🧸 warm' : currentLevel < 10 ? '🔥 sizzling' : '🪐 cosmic potion!'}
            </div>
          </div>
        )}

        {/* -------------------- VIEWPORT MODE 2: MAGICAL BLOOMING ROSE -------------------- */}
        {activeVisualMode === 'rose' && (
          <div className="relative w-36 h-36 flex items-center justify-center select-none">
            
            {/* Ambient golden particles floating around rose */}
            <AnimatePresence>
              {currentLevel >= 6 && Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-rose-450 z-0 pointer-events-none"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 0.9, 0],
                    scale: [0.3, 1.2, 0.3],
                    y: [-10, -50 - (i * 8)],
                    x: [Math.sin(i) * 15, Math.sin(i) * 35 + Math.cos(i) * 10]
                  }}
                  transition={{
                    duration: 1.8 + i * 0.25,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                  style={{ top: '45%', left: '48%' }}
                />
              ))}
            </AnimatePresence>

            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_6px_14px_rgba(244,63,94,0.15)]">
              {/* Green Growing Flower Stem */}
              <motion.path
                d="M 50 95 C 47 78, 51 60, 50 45"
                fill="none"
                stroke="#22c55e"
                strokeWidth="3.5"
                strokeLinecap="round"
                animate={{
                  d: currentLevel >= 5 
                    ? "M 50 95 C 45 72, 53 58, 50 44" 
                    : "M 50 95 C 48 84, 51 76, 50 65"
                }}
                transition={{ type: 'spring', stiffness: 50, damping: 12 }}
              />

              {/* Green Supporting Sepals under head */}
              <motion.path
                d="M 44, 45 C 46, 48, 54, 48, 56, 45 C 50, 51, 50, 51, 44, 45 Z"
                fill="#15803d"
                animate={{
                  scale: currentLevel >= 3 ? 1 : 0.4,
                  y: currentLevel >= 5 ? 0 : 20
                }}
                style={{ originX: '50%;', originY: '45px' }}
                transition={{ type: 'spring', stiffness: 50 }}
              />

              {/* Growing Green Leaf Left */}
              <motion.g
                animate={{ 
                  scale: currentLevel >= 3 ? 1.1 : 0.2,
                  rotate: [0, 3, -3, 0],
                  y: currentLevel >= 5 ? 0 : 18
                }}
                transition={{ repeat: Infinity, repeatType: 'reverse', duration: 3 }}
                style={{ originX: '48px', originY: '72px' }}
                className="origin-bottom-right"
              >
                {/* Leaf representation */}
                <path d="M 48 72 C 34 68, 28 54, 44 63 Z" fill="#15803d" stroke="#166534" strokeWidth="0.5" />
                <path d="M 48 72 Q 38 66, 36 62" fill="none" stroke="#22c55e" strokeWidth="0.5" />
              </motion.g>

              {/* Growing Green Leaf Right */}
              <motion.g
                animate={{ 
                  scale: currentLevel >= 4 ? 1.05 : 0.15,
                  rotate: [0, -4, 4, 0],
                  y: currentLevel >= 5 ? 0 : 15
                }}
                transition={{ repeat: Infinity, repeatType: 'reverse', duration: 3.5, delay: 0.5 }}
                style={{ originX: '52px', originY: '58px' }}
                className="origin-bottom-left"
              >
                <path d="M 52 58 C 66 54, 72 40, 56 49 Z" fill="#15803d" stroke="#166534" strokeWidth="0.5" />
                <path d="M 52 58 Q 62 52, 64 48" fill="none" stroke="#22c55e" strokeWidth="0.5" />
              </motion.g>

              {/* Layer 1: Base Outer Petals (Deep maroon-red support structure) */}
              <motion.path
                d="M 50 45 C 22 35, 15 15, 45 22 C 50 32, 50 38, 50 45 Z"
                fill="#9f1239"
                animate={{ 
                  scale: currentLevel >= 2 ? 0.35 + (currentLevel * 0.075) : 0,
                  rotate: currentLevel >= 5 ? -18 + (currentLevel - 5) * -3 : -5,
                  y: currentLevel >= 5 ? 0 : 20
                }}
                style={{ originX: '50px', originY: '45px' }}
                transition={{ type: 'spring', stiffness: 60 }}
              />

              <motion.path
                d="M 50 45 C 78 35, 85 15, 55 22 C 50 32, 50 38, 50 45 Z"
                fill="#9f1239"
                animate={{ 
                  scale: currentLevel >= 2 ? 0.35 + (currentLevel * 0.075) : 0,
                  rotate: currentLevel >= 5 ? 18 + (currentLevel - 5) * 3 : 5,
                  y: currentLevel >= 5 ? 0 : 20
                }}
                style={{ originX: '50px', originY: '45px' }}
                transition={{ type: 'spring', stiffness: 60 }}
              />

              {/* Large Bottom Cushion Petal */}
              <motion.path
                d="M 32, 35 C 32, 56, 68, 56, 68, 35 Z"
                fill="#be123c"
                animate={{ 
                  scale: currentLevel >= 3 ? 0.42 + (currentLevel * 0.065) : 0,
                  y: currentLevel >= 5 ? 0 : 20
                }}
                style={{ originX: '50px', originY: '45px' }}
                transition={{ type: 'spring', stiffness: 50, damping: 10 }}
              />

              {/* Layer 2: Middle Vibrant Crimson Petals */}
              <motion.path
                d="M 50 45 C 32 40, 32 23, 48 26 Z"
                fill="#e11d48"
                animate={{ 
                  scale: currentLevel >= 5 ? 0.38 + (currentLevel * 0.07) : 0,
                  rotate: currentLevel >= 6 ? -12 - (currentLevel - 6) * 1.5 : 0,
                  y: currentLevel >= 5 ? 0 : 20
                }}
                style={{ originX: '50px', originY: '45px' }}
                transition={{ type: 'spring', stiffness: 55 }}
              />

              <motion.path
                d="M 50 45 C 68 40, 68 23, 52 26 Z"
                fill="#e11d48"
                animate={{ 
                  scale: currentLevel >= 5 ? 0.38 + (currentLevel * 0.07) : 0,
                  rotate: currentLevel >= 6 ? 12 + (currentLevel - 6) * 1.5 : 0,
                  y: currentLevel >= 5 ? 0 : 20
                }}
                style={{ originX: '50px', originY: '45px' }}
                transition={{ type: 'spring', stiffness: 55 }}
              />

              {/* Center overlapping bell outline */}
              <motion.path
                d="M 38 31 C 38 19, 62 19, 62 31 C 62 43, 38 43, 38 31 Z"
                fill="#fb7185"
                animate={{ 
                  scale: currentLevel >= 6 ? 0.45 + (currentLevel * 0.06) : 0,
                  y: currentLevel >= 5 ? 0 : 20
                }}
                style={{ originX: '50px', originY: '31px' }}
                transition={{ type: 'spring', stiffness: 45 }}
              />

              {/* Layer 3: Central Soft-Glow Heart Petals */}
              <motion.path
                d="M 44, 31 C 44, 25, 50, 23, 50, 26 C 50, 23, 56, 25, 56, 31 C 56, 37, 44, 37, 44, 31 Z"
                fill="#ffe4e6"
                stroke="#f43f5e"
                strokeWidth="0.85"
                animate={{ 
                  scale: currentLevel >= 8 ? 0.55 + (currentLevel * 0.05) : 0,
                  rotate: currentLevel === 10 ? [0, 5, -5, 0] : 0,
                  y: currentLevel >= 5 ? 0 : 20
                }}
                transition={{ duration: 1.2, repeat: Infinity, repeatType: 'reverse' }}
                style={{ originX: '50px', originY: '31px' }}
              />

              {/* Golden pollen ring shown at max love */}
              {currentLevel === 10 && (
                <motion.circle
                  cx="50"
                  cy="29"
                  r="2.5"
                  fill="#fef08a"
                  filter="drop-shadow(0px 0px 4px #eab308)"
                  animate={{ scale: [0.8, 1.4, 0.8] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}
            </svg>

            {/* Micro Badge for blooming level */}
            <div className="absolute top-1 font-sans text-[7.5px] text-pink-700 bg-pink-100/90 border border-pink-200 uppercase tracking-widest px-2 py-0.5 rounded-full z-10 font-bold pointer-events-none">
              {currentLevel < 4 ? '🌱 Seeding Bud' : currentLevel < 7 ? '🌸 Sprouts Open' : currentLevel < 10 ? '🌹 In Beautiful Bloom' : '👑 Glowing Celestial Rose!'}
            </div>
          </div>
        )}

        {/* -------------------- VIEWPORT MODE 3: CUPID'S AIM PROGRESS -------------------- */}
        {activeVisualMode === 'cupid' && (
          <div className="relative w-full h-full flex flex-col items-center justify-center p-4 select-none">
            
            <svg viewBox="0 0 100 60" className="w-full h-32">
              <defs>
                {/* Gold sparkle fill pattern */}
                <radialGradient id="gold-flash" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Cupid's Arrow Dotted Trajectory Trail */}
              <line 
                x1="18" 
                y1="30" 
                x2="78" 
                y2="30" 
                stroke="#fda4af" 
                strokeWidth="1.2" 
                strokeDasharray="4 4" 
                className="opacity-55"
              />

              {/* Small Milestone Hearts Along The Trail */}
              {[28, 42, 56].map((milestoneX, i) => {
                const milestoneVal = (i + 1) * 3; // at levels 3, 6, 9
                const isActivated = currentLevel >= milestoneVal;
                return (
                  <motion.g
                    key={milestoneX}
                    animate={{
                      scale: isActivated ? [1, 1.3, 1] : 0.85,
                    }}
                    transition={{
                      duration: isActivated ? 0.6 : 0.2,
                      repeat: isActivated && currentLevel === 10 ? Infinity : 0,
                      repeatDelay: i * 0.15
                    }}
                  >
                    <Heart
                      x={milestoneX - 4}
                      y={26}
                      width={8}
                      height={8}
                      className={`transition-colors duration-450 ${
                        isActivated ? 'text-rose-500 fill-rose-500' : 'text-gray-300 fill-transparent'
                      }`}
                    />
                  </motion.g>
                );
              })}

              {/* Red-Hot Heart Bullseye Target at the right extreme */}
              <motion.g
                animate={{
                  scale: currentLevel === 10 ? [1, 1.25, 1] : (currentLevel >= 8 ? [1, 1.08, 1] : 1)
                }}
                transition={{ repeat: Infinity, duration: 0.6 }}
                style={{ originX: '80px', originY: '30px' }}
              >
                {/* Concentric targets rings */}
                <circle cx="80" cy="30" r="14" fill="none" stroke="#fecdd3" strokeWidth="1" className="opacity-45" />
                <circle cx="80" cy="30" r="9" fill="none" stroke="#ffe4e6" strokeWidth="0.8" className="opacity-60" />
                
                {/* Exact Bullseye Heart */}
                <Heart
                  x={74}
                  y={24}
                  width={12}
                  height={12}
                  className={`transition-all duration-300 ${
                    currentLevel === 10 
                      ? 'fill-red-650 text-red-700 animate-ping' 
                      : currentLevel >= 7 
                      ? 'fill-rose-500 text-rose-600'
                      : 'fill-pink-200 text-pink-300'
                  }`}
                />
              </motion.g>

              {/* Exact hit starbursts rings */}
              {currentLevel === 10 && (
                <motion.circle
                  cx="80"
                  cy="30"
                  r="18"
                  fill="url(#gold-flash)"
                  initial={{ scale: 0.2, opacity: 0.9 }}
                  animate={{ scale: [0.2, 1.5, 0.2], opacity: [0.9, 0, 0.9] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
              )}

              {/* 🏹 Cupid's Travelling Arrow */}
              {/* Maps currentLevel 1 -> 10 directly into X transition offset */}
              <motion.g
                animate={{
                  x: 14 + (currentLevel / 10) * 52, // Maps x path from 19 to 66
                  y: currentLevel === 10 ? [27, 30, 27] : 27
                }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 85, 
                  damping: 12,
                  y: currentLevel === 10 ? { repeat: Infinity, duration: 0.7 } : {}
                }}
                className="origin-center"
              >
                {/* Feathers tail */}
                <path d="M 0 4 L 4 0 L 8 4 L 4 6 Z" fill="#fda4af" className="opacity-80" />
                <path d="M 0 2 L 6 0 L 10 2 L 5 3 Z" fill="#f43f5e" />
                {/* Arrow shaft */}
                <line x1="8" y1="3" x2="19" y2="3" stroke="#eab308" strokeWidth="1.8" />
                {/* Arrowhead arrowhead tip */}
                <polygon points="19,1 19,5 24,3" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5" />
              </motion.g>

              {/* Sparks flying from Cupid's Arrow */}
              {currentLevel >= 5 && (
                <motion.circle
                  cx={26 + (currentLevel / 10) * 52}
                  cy={30 + Math.sin(currentLevel) * 4}
                  r={1.2}
                  fill="#ffedd5"
                  animate={{ scale: [1, 2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.35 }}
                />
              )}
            </svg>

            {/* Dynamic Cupid status text */}
            <div className="text-[10px] font-extrabold text-pink-800 uppercase tracking-wide">
              {currentLevel === 10 
                ? '🏹💘 BULLSEYE HIT! Direct Strike at Sonu’s Heart!' 
                : `Aiming Cupid's arrow... (${currentLevel * 10}% accuracy)`}
            </div>
          </div>
        )}
      </div>

      <h2 className="text-xl md:text-2xl font-black bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 bg-clip-text text-transparent mb-1 h-8 flex items-center justify-center">
        {getDynamicHeadline()}
      </h2>
      <p className="text-[10px] text-gray-400 mb-3 font-semibold uppercase tracking-wider">
        Let me know on a tiny little scale from 1 to 10... 🥰
      </p>

      {/* Love Level Display Screen with custom comments */}
      <div className="h-20 w-full flex items-center justify-center bg-pink-50/40 border border-pink-100 rounded-2xl p-3 mb-4 relative overflow-hidden shadow-inner">
        <div className="absolute -top-12 -left-12 w-24 h-24 bg-rose-200/10 rounded-full blur-xl" />
        <AnimatePresence mode="wait">
          <motion.div
            key={currentLevel}
            initial={{ opacity: 0, scale: 0.88, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: -10 }}
            transition={{ type: 'spring', stiffness: 280, damping: 16 }}
            className="text-center z-10"
          >
            <div className="text-3xl font-black text-rose-500 mb-0.5 font-sans tracking-tight">
              {currentLevel} / 10
            </div>
            <div className="text-xs font-bold text-rose-850 max-w-xs mx-auto leading-tight italic px-2">
              "{comments[currentLevel] || "I love you to infinity!"}"
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Hearts Interactive Selector */}
      <div className="flex flex-wrap justify-center items-center gap-1.5 mb-5 max-w-sm">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => {
          const isFilled = val <= currentLevel;
          return (
            <motion.button
              key={val}
              whileHover={{ scale: 1.4, type: 'spring', stiffness: 450 }}
              whileTap={{ scale: 0.8 }}
              onMouseEnter={() => setHoverLevel(val)}
              onMouseLeave={() => setHoverLevel(null)}
              onClick={() => handleSelect(val)}
              id={`heart-rating-btn-${val}`}
              className="relative p-0.5 focus:outline-none focus:ring-2 focus:ring-rose-300 rounded-full cursor-pointer transition-colors"
            >
              <Heart
                className={`w-7 h-7 md:w-8 md:h-8 transition-all duration-300 ${
                  isFilled
                    ? 'text-rose-500 fill-rose-500 drop-shadow-xs scale-110 animate-yes-glow'
                    : 'text-gray-300 hover:text-rose-200 hover:scale-105'
                }`}
              />
              {/* Animated aura for the selected one */}
              {selectedLevel === val && (
                <motion.span
                  layoutId="activeHeartAura"
                  className="absolute inset-0 rounded-full border-2 border-rose-400 bg-rose-100/10 pointer-events-none -m-0.5"
                  transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Heart Filled Submit Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        id="submit-love-scale-btn"
        onClick={() => {
          playSound('success');
          onComplete(selectedLevel);
        }}
        className="relative group overflow-hidden px-8 py-3 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 hover:from-red-600 hover:to-rose-600 text-white rounded-full font-extrabold shadow-lg shadow-rose-200/50 hover:shadow-rose-400/60 transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer border-2 border-white ring-4 ring-pink-400/25 animate-yes-glow animate-shining"
      >
        <span className="relative z-10 font-sans uppercase text-xs tracking-wider">
          {selectedLevel === 10
            ? 'Lock in my absolute, infinite love! 🪐💞'
            : `Confirm my love of ${selectedLevel}/10? (Try 10! 😉)`}
        </span>
        <Heart className="w-4 h-4 fill-white text-rose-500 group-hover:scale-125 transition-transform animate-pulse" />
        <div className="absolute inset-x-0 bottom-0 h-0 group-hover:h-full bg-gradient-to-t from-black/10 to-transparent transition-all pointer-events-none" />
      </motion.button>
    </motion.div>
  );
};
