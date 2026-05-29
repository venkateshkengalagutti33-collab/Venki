import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Settings, Sparkles, Volume2, VolumeX, MailOpen, Mail, RefreshCw, Star, Image as ImageIcon, Gift, Award, Send } from 'lucide-react';
import { CustomSettings } from './types';
import { DEFAULT_SETTINGS, decodeSettings } from './utils/defaults';
import { playSound } from './utils/audio';
import { LoveScale } from './components/LoveScale';
import { CustomizerModal } from './components/CustomizerModal';
import { SurpriseLetter } from './components/SurpriseLetter';

export default function App() {
  // Page Flow State: 1 = Yes/No Love, 2 = 1 to 10 scale, 3 = Yes/No Marry, 4 = Celebrations!
  const [step, setStep] = useState<number>(1);
  const [settings, setSettings] = useState<CustomSettings>(DEFAULT_SETTINGS);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isWelcome, setIsWelcome] = useState<boolean>(true);
  
  // Guard timestamp to prevent accidental overlap click triggers
  const lastNoEvasionTime = useRef<number>(0);
  
  // Yes Button Scale parameters to irritate her
  const [yesScaleStep1, setYesScaleStep1] = useState<number>(1.0);
  const [yesScaleStep3, setYesScaleStep3] = useState<number>(1.0);
  
  // No Button Evasive Translation Offset parameters
  const [noOffsetStep1, setNoOffsetStep1] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [noOffsetStep3, setNoOffsetStep3] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Active toast notification / irritation alert of the step
  const [irritationToast, setIrritationToast] = useState<string | null>(null);
  const [toastKey, setToastKey] = useState<number>(0);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  // Custom YES click animation triggers for immediate feedback
  const [isYesClickedStep1, setIsYesClickedStep1] = useState<boolean>(false);
  const [isYesClickedStep3, setIsYesClickedStep3] = useState<boolean>(false);

  // Love scale rating achieved
  const [loveRating, setLoveRating] = useState<number>(10);

  // Envelope Status (Step 4)
  const [isLetterOpen, setIsLetterOpen] = useState<boolean>(false);

  // Gift box state
  const [isGiftOpened, setIsGiftOpened] = useState<boolean>(false);
  const [redeemedCoupons, setRedeemedCoupons] = useState<Record<number, boolean>>({});

  // Flying kisses active states
  const [kissParticles, setKissParticles] = useState<{
    id: number;
    left: number;
    rotate: number;
    scale: number;
    delay: number;
    duration: number;
    emoji: string;
    startX?: number;
    startY?: number;
    driftX?: number;
    driftY?: number;
  }[]>([]);

  // Stubbornness / Irritation Counters for No tries to irritate her continuously
  const [noCountStep1, setNoCountStep1] = useState<number>(0);
  const [noCountStep3, setNoCountStep3] = useState<number>(0);

  // Developer Mode visibility system (locks settings dashboard for girlfriend / regular user)
  const [isDeveloperMode, setIsDeveloperMode] = useState<boolean>(false);
  const [logoClickCount, setLogoClickCount] = useState<number>(0);

  // Interceptor system state to trigger delightful warning popups at major thresholds
  const [interceptorTitle, setInterceptorTitle] = useState<string>('');
  const [interceptorMessage, setInterceptorMessage] = useState<string | null>(null);

  // Floating Hearts Pool (Step 4)
  const [floatingHearts, setFloatingHearts] = useState<{
    id: number;
    left: number;
    size: number;
    delay: number;
    duration: number;
    rotate: number;
  }[]>([]);

  // Ambient falling/floating faint background particles for all other steps
  const [ambientParticles, setAmbientParticles] = useState<{
    id: number;
    left: number;
    size: number;
    delay: number;
    duration: number;
    rotate: number;
    type: 'heart' | 'sparkle' | 'bubble';
  }[]>([]);

  // Interactive Global Tap Hearts State
  const [clickHearts, setClickHearts] = useState<{
    id: number;
    x: number;
    y: number;
    color: string;
    scale: number;
    angle: number;
    drift: number;
  }[]>([]);

  // Is this app loaded from a shared URL or hash query?
  const [isSharedView, setIsSharedView] = useState<boolean>(false);
  const [isSharedLink, setIsSharedLink] = useState<boolean>(false);

  // Feedback System States
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [q1, setQ1] = useState<string>('');
  const [q2, setQ2] = useState<string>('');
  const [q3, setQ3] = useState<string>('');
  const [q4, setQ4] = useState<string>('');
  const [q5, setQ5] = useState<string>('');
  const [feedbackReaction, setFeedbackReaction] = useState<string>('❤️');
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'submitting' | 'submitted' | 'error'>('idle');

  // Custom Personal Lock State for shared/viewer mode
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [lockInput, setLockInput] = useState<string>('');
  const [lockError, setLockError] = useState<string>('');
  const [unlockCelebrating, setUnlockCelebrating] = useState<boolean>(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(false);
  const [showCopiedToast, setShowCopiedToast] = useState<boolean>(false);

  // Dynamic Text Formatter Helper for all custom words/lines
  const formatStepText = (text: string) => {
    if (!text) return '';
    return text
      .replace(/{girlfriendName}/g, settings.girlfriendName)
      .replace(/{boyfriendName}/g, settings.boyfriendName)
      .replace(/{loveRating}/g, String(loveRating));
  };

  // Load customized settings from URL query param or local storage
  useEffect(() => {
    let sParam: string | null = null;
    let idParam: string | null = null;
    try {
      const params = new URLSearchParams(window.location.search);
      idParam = params.get('id');
      sParam = params.get('s') || params.get('code');
      
      // Fallback for hash query parsing e.g. #/?s=abc or #s=abc introduced by redirects or iframe limitations
      if (!idParam && !sParam && window.location.hash) {
        const hashSearch = window.location.hash.split('?')[1];
        if (hashSearch) {
          const hashParams = new URLSearchParams(hashSearch);
          idParam = hashParams.get('id');
          sParam = hashParams.get('s') || hashParams.get('code');
        } else {
          const idMatch = window.location.hash.match(/[#&?]id=([^&]+)/);
          if (idMatch) {
            idParam = decodeURIComponent(idMatch[1]);
          }
          const match = window.location.hash.match(/[#&?]s=([^&]+)/);
          if (match) {
            sParam = decodeURIComponent(match[1]);
          }
        }
      }

      const isShared = !!(idParam || sParam);
      setIsSharedLink(isShared);

      if (idParam) {
        setIsSharedView(true);
        setIsLocked(true);
        setProposalId(idParam);
        fetch(`/api/settings/${idParam}`)
          .then((res) => res.json())
          .then((data) => {
            if (data && !data.error) {
              setSettings(data);
              localStorage.setItem('girlfriend_proposal_settings', JSON.stringify(data));
            }
          })
          .catch((err) => {
            console.warn('Error fetching dynamic cloud proposal settings', err);
          });
      } else if (sParam) {
        setIsSharedView(true);
        setIsLocked(true);
        const decoded = decodeSettings(sParam);
        if (decoded) {
          setSettings(decoded);
          localStorage.setItem('girlfriend_proposal_settings', JSON.stringify(decoded));
        }
      } else {
        const stored = localStorage.getItem('girlfriend_proposal_settings');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (
              !parsed.step1Question ||
              parsed.step1Question.includes("Oyee Sonu, do you love me?") ||
              parsed.step1Question === "Oyee Sonu, do you love me? 🥺✨"
            ) {
              setSettings(DEFAULT_SETTINGS);
              localStorage.setItem('girlfriend_proposal_settings', JSON.stringify(DEFAULT_SETTINGS));
            } else {
              setSettings(parsed);
            }
          } catch (e) {
            setSettings(DEFAULT_SETTINGS);
          }
        }
        // Default to beautiful full-app views on initial load so it looks like an eye-catching app out of the box
        setIsSharedView(true);
        setIsLocked(true);
      }
    } catch (e) {
      console.warn('Error loading settings', e);
    }

    // Determine if developer environment or mode is enabled
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isDevSubdomain = window.location.hostname.includes('-dev-');
    const isDevQuery = window.location.search.includes('dev=true');
    const isDevStored = localStorage.getItem('developer_mode') === 'true';
    
    // Only a non-shared view (meaning the direct developer interface/dev sandbox) can activate developer privileges!
    const paramsOuter = new URLSearchParams(window.location.search);
    const hasSharedParams = !!(paramsOuter.get('id') || paramsOuter.get('s') || paramsOuter.get('code') || window.location.hash.includes('id=') || window.location.hash.includes('s='));
    
    const isDev = !hasSharedParams && (isLocal || isDevSubdomain || isDevQuery || isDevStored);

    // Set developer privileges if computed, but keep the beautiful smartphone view active by default
    setIsDeveloperMode(isDev);
    
    // Set active layout states based on whether we are in local Developer Mode or Shared Viewer Mode
    if (isDev) {
      setIsSharedView(false);
      setIsLocked(true); // Default to locked even in local dev environment so developer can test/interact with the lock system!
    } else {
      setIsSharedView(true);
      setIsLocked(true);
    }

    // Initialize dreamy background particles with scattered status (negative delay so they spread instantly)
    const particles = Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 12 + 6, // 6px to 18px
      delay: Math.random() * -18, // scattered negative start
      duration: Math.random() * 14 + 10, // slow 10s to 24s travel time
      rotate: Math.random() * 360,
      type: ['heart', 'sparkle', 'bubble'][i % 3] as 'heart' | 'sparkle' | 'bubble',
    }));
    setAmbientParticles(particles);
  }, []);

  // Sync settings with local storage
  const handleSaveSettings = (newSettings: CustomSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('girlfriend_proposal_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.error('Error block saving settings to local storage', e);
    }
  };

  // Generate background floating hearts once proposal accepted (Step 4)
  useEffect(() => {
    if (step === 4) {
      const hearts = Array.from({ length: 48 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100, // percentages
        size: Math.random() * 26 + 10, // 10px to 36px
        delay: Math.random() * 8, // 0 to 8s
        duration: Math.random() * 5 + 5, // 5s to 10s travel speed
        rotate: Math.random() * 360,
      }));
      setFloatingHearts(hearts);
    } else {
      setFloatingHearts([]);
    }
  }, [step]);

  // Global listener for touch/click events to generate rising hearts on inputs, cards, or messages
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Skip spawning interactive heart bubbles when clicking settings inputs or color options to prevent noise
      if (
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('select') ||
        target.closest('#open-customizer-modal-btn') ||
        target.closest('#close-customizer-btn') ||
        target.closest('#save-customizer-btn') ||
        target.closest('#cancel-customizer-btn')
      ) {
        return;
      }

      const activeColor = settings.heartColor || '#f43f5e';
      
      // Spawn 3-4 delicate floating hearts surrounding the cursor position
      const count = 4;
      const newHearts = Array.from({ length: count }).map((_, index) => ({
        id: Date.now() + Math.random() + index,
        x: e.pageX,
        y: e.pageY,
        color: activeColor,
        scale: Math.random() * 0.4 + 0.6, // scale 0.6 to 1.0
        angle: Math.random() * 40 - 20, // -20deg to 20deg
        drift: Math.random() * 100 - 50, // lateral wind drift -50px to 50px
      }));

      setClickHearts((prev) => [...prev, ...newHearts].slice(-45)); // limit total DOM pool size
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [settings.heartColor]);

  // General audio player helper that respects user volume toggle
  const playInteractiveSound = (type: 'click' | 'error' | 'success' | 'fanfare' | 'heart') => {
    if (soundEnabled) {
      playSound(type);
    }
  };

  // Trigger brief shaking vibration on card
  const triggerCardShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400);
  };

  const handleSubmitFeedback = () => {
    if (feedbackStatus === 'submitting') return;
    
    // Check if at least one response was provided
    if (!q1.trim() && !q2.trim() && !q3.trim() && !q4.trim() && !q5.trim()) {
      alert("Please fill in at least one question sweetie!");
      return;
    }

    setFeedbackStatus('submitting');
    playInteractiveSound('click');

    // Compile the 5 beautiful custom answers structured perfectly for Venkatesh's Dev dashboard
    const formattedFeedbackText = [
      `1. Bangari heng anastu ? First try nanga swalpu idea illa:\n👉 ${q1.trim() || 'N/A'}`,
      `2. muddu naa ninga correct partner anastini loo:\n👉 ${q2.trim() || 'N/A'}`,
      `3. muddu nanna yaav yaav character ishta aagalla ninga open aagi helu:\n👉 ${q3.trim() || 'N/A'}`,
      `4. bangari naa andra eshta ishta ninga nanna eshta hachondi ?:\n👉 ${q4.trim() || 'N/A'}`,
      `5. finally nanna bagge een een helbeku ella feedback tara helu:\n👉 ${q5.trim() || 'N/A'}`
    ].join('\n\n');

    // Instantly copy answers to her phone clipboard
    try {
      navigator.clipboard.writeText(formattedFeedbackText)
        .then(() => console.log("Success: Feedback responses copied to clipboard."))
        .catch(err => console.warn("Clipboard access rejected or blocked by browser:", err));
    } catch (e) {
      console.warn("Navigator clipboard write execution failed:", e);
    }

    // Set submitted status immediately to let her paste to WhatsApp!
    setTimeout(() => {
      setFeedbackStatus('submitted');
      playInteractiveSound('success');
    }, 450);
  };

  // Secret trigger to toggle developer mode when clicking proposal title header 5 times
  const handleLogoClick = () => {
    if (isSharedView || isSharedLink) return; // Guard: Block developer control activation completely on shared/viewer links!
    const nextClickCount = logoClickCount + 1;
    setLogoClickCount(nextClickCount);

    if (nextClickCount >= 5) {
      const targetMode = !isDeveloperMode;
      setIsDeveloperMode(targetMode);
      localStorage.setItem('developer_mode', targetMode ? 'true' : 'false');
      setLogoClickCount(0);
      playInteractiveSound('success');

      if (targetMode) {
        setInterceptorTitle("🛠️ Developer Mode Enabled");
        setInterceptorMessage("Superb work, Venkatesh! You have unlocked the customizer dashboard and editing panels. Click the Settings gear icon in the top right header to update custom proposal texts, songs, and backgrounds.");
      } else {
        setInterceptorTitle("🔒 Developer Mode Locked");
        setInterceptorMessage("The customizer controls have been safely locked! Normal users will no longer see any editor or settings options in the header.");
      }
    }
  };

  // Common Interceptor helper function - warning popups disabled as requested to keep flow sweet!
  const triggerInterceptor = (count: number, currentStep: number) => {
    // Statically disabled overlays to avoid interrupting the romantic experience
  };

  // Step 1: No Button Hover/Click Evasion Action
  const handleNoHoverStep1 = (e?: any) => {
    if (e) {
      try {
        e.preventDefault?.();
        e.stopPropagation?.();
      } catch (err) {
        // Safe catch
      }
    }
    
    // Set timestamp of evasion
    lastNoEvasionTime.current = Date.now();

    playInteractiveSound('error');
    triggerCardShake();
    
    // Increment irritation counter and trigger custom popups
    const nextCount = noCountStep1 + 1;
    setNoCountStep1(nextCount);
    setYesScaleStep1(1 + nextCount * 0.15);
    triggerInterceptor(nextCount, 1);
    
    // Choose a sequential tease statement exactly in the order entered
    const rawList1 = settings.irritationTextsStep1 || [];
    const list1 = rawList1.length > 0 ? rawList1 : (DEFAULT_SETTINGS.irritationTextsStep1 || []);
    const orderedTease = list1.length > 0 ? list1[(nextCount - 1) % list1.length] : "";
    setIrritationToast(orderedTease);
    setToastKey((prev) => prev + 1);

    // Compute random translation offset (bound to avoid excessive offscreen drift, but enough to move)
    const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;
    const newX = randomRange(-140, 140);
    const newY = randomRange(-90, 90);
    setNoOffsetStep1({ x: newX, y: newY });
  };

  // Step 3: No Button Hover/Click Evasion Action
  const handleNoHoverStep3 = (e?: any) => {
    if (e) {
      try {
        e.preventDefault?.();
        e.stopPropagation?.();
      } catch (err) {
        // Safe catch
      }
    }

    // Set timestamp of evasion
    lastNoEvasionTime.current = Date.now();

    playInteractiveSound('error');
    triggerCardShake();

    // Increment irritation counter and trigger custom popups
    const nextCount = noCountStep3 + 1;
    setNoCountStep3(nextCount);
    setYesScaleStep3(1 + nextCount * 0.15);
    triggerInterceptor(nextCount, 3);

    const rawList3 = settings.irritationTextsStep3 || [];
    const list3 = rawList3.length > 0 ? rawList3 : (DEFAULT_SETTINGS.irritationTextsStep3 || []);
    const orderedTease = list3.length > 0 ? list3[(nextCount - 1) % list3.length] : "";
    setIrritationToast(orderedTease);
    setToastKey((prev) => prev + 1);

    const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;
    const newX = randomRange(-140, 140);
    const newY = randomRange(-90, 90);
    setNoOffsetStep3({ x: newX, y: newY });
  };

  // Move back to beginning
  const handleResetAppFlow = () => {
    playInteractiveSound('click');
    setStep(1);
    setYesScaleStep1(1.0);
    setYesScaleStep3(1.0);
    setNoOffsetStep1({ x: 0, y: 0 });
    setNoOffsetStep3({ x: 0, y: 0 });
    setNoCountStep1(0);
    setNoCountStep3(0);
    setIsYesClickedStep1(false);
    setIsYesClickedStep3(false);
    setIrritationToast(null);
    setIsLetterOpen(false);
    setIsGiftOpened(false);
    setRedeemedCoupons({});
    setKissParticles([]);
    setQ1('');
    setQ2('');
    setQ3('');
    setQ4('');
    setQ5('');
    setFeedbackStatus('idle');
  };

  // Unlock proposal app via personal nickname checking with sweet emojis
  const handleUnlockProposal = () => {
    // Normalization
    const inputTrimmed = lockInput.trim();
    const inputCleaned = inputTrimmed.toLowerCase();
    
    // Simple validation
    if (!inputTrimmed) {
      setLockError(`ishta jaldi marati muddu 😭`);
      playInteractiveSound('error');
      return;
    }

    const hasNickname = inputCleaned.includes('kummu');
    const hasRequiredEmoji = inputTrimmed.includes('🧡');

    if (!hasNickname || !hasRequiredEmoji) {
      setLockError(`ishta jaldi marati muddu 😭`);
      playInteractiveSound('error');
      return;
    }

    // Lock verified!
    setLockError('');
    setUnlockCelebrating(true);
    playInteractiveSound('success');

    // Fire 45 beautiful flying kisses from center screen up/outward!
    const kissEmojis = ['💋', '😘', '❤️', '💋', '💝', '💖', '🥰', '😘', '💋', 'rose', '💗'];
    const startX = typeof window !== 'undefined' ? window.innerWidth / 2 : 250;
    const startY = typeof window !== 'undefined' ? window.innerHeight * 0.6 : 400;

    const bursts = Array.from({ length: 45 }).map((_, i) => {
      const angle = -75 + Math.random() * 150; // scatter across a broad arc
      const speed = 2.0 + Math.random() * 2.5;
      return {
        id: Date.now() + i + Math.random(),
        left: 50,
        rotate: -30 + Math.random() * 60,
        scale: 0.8 + Math.random() * 1.0,
        delay: Math.random() * 0.5,
        duration: 2.2 + Math.random() * 2.0,
        emoji: kissEmojis[i % kissEmojis.length],
        startX: startX,
        startY: startY,
        driftX: Math.sin(angle * Math.PI / 180) * 180 * speed,
        driftY: -Math.cos(angle * Math.PI / 180) * 280 * speed,
      };
    });

    setKissParticles((prev) => [...prev, ...bursts]);

    // Give some space for her to gaze upon the beautiful shower of kisses, then unlock transition!
    setTimeout(() => {
      setIsLocked(false);
      setUnlockCelebrating(false);
      setShowWelcomeModal(true);
    }, 2400);
  };

  // Open gift box with a burst of flying kisses
  const handleOpenGift = () => {
    playInteractiveSound('fanfare');
    setIsGiftOpened(true);
    
    const emojis = ['🎈', '💋', '😘', '❤️', '💋', '💝', '😘', '🌹', '✨', '💐'];
    const bursts = Array.from({ length: 40 }).map((_, i) => ({
      id: Date.now() + i,
      left: 10 + Math.random() * 80, // spread nicely across viewport
      rotate: -45 + Math.random() * 90,
      scale: 0.5 + Math.random() * 1.0,
      delay: Math.random() * 1.5,
      duration: 3 + Math.random() * 3.5,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));
    setKissParticles(bursts);
  };

  const theme = settings.backgroundTheme || 'dreamy-pink';
  const bgClasses = theme === 'starry-night'
    ? 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white'
    : theme === 'sunset-glow'
      ? 'bg-gradient-to-br from-amber-100 via-orange-100 to-rose-200 text-neutral-800'
      : 'bg-gradient-to-br from-indigo-100 via-rose-50 to-pink-100 text-neutral-800';

  return (
    <div className={`min-h-screen ${bgClasses} flex flex-col items-center ${isSharedView ? 'p-0 sm:p-4 justify-center' : 'p-4 justify-between'} selection:bg-rose-200 selection:text-rose-900 overflow-x-hidden relative font-sans animate-fluid-gradient`}>
      
      {/* Celebration / Flying Kisses Particle Overlay - Rendered Globally across all steps */}
      <AnimatePresence>
        {kissParticles.map((k) => (
          <motion.div
            key={k.id}
            style={k.startX !== undefined ? { left: '0px', top: '0px' } : undefined}
            initial={k.startX !== undefined ? {
              x: k.startX,
              y: k.startY,
              opacity: 0,
              scale: 0
            } : {
              y: '100vh',
              x: `${k.left - 50}vw`,
              opacity: 0,
              scale: 0
            }}
            animate={k.startX !== undefined ? {
              x: [k.startX, k.startX + (k.driftX || 0) * 0.4, k.startX + (k.driftX || 0)],
              y: [k.startY, k.startY + (k.driftY || 0) * 0.5, k.startY + (k.driftY || 0)],
              opacity: [0, 1, 1, 0],
              scale: [0, k.scale * 1.5, k.scale, 0],
              rotate: k.rotate
            } : {
              y: '-105vh',
              opacity: [0, 1, 1, 0],
              scale: k.scale,
              rotate: k.rotate + 360,
              x: [
                `${k.left - 50}vw`, 
                `${k.left - 50 + (Math.random() * 20 - 10)}vw`, 
                `${k.left - 50 + (Math.random() * 30 - 15)}vw`
              ]
            }}
            transition={{
              duration: k.duration,
              delay: k.delay,
              ease: 'easeOut'
            }}
            className={k.startX !== undefined ? "fixed text-2xl md:text-3xl pointer-events-none z-50 select-none drop-shadow-md filter saturate-150" : "fixed text-5xl pointer-events-none z-50 select-none drop-shadow-md filter saturate-150"}
          >
            {k.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Dynamic CSS styles injected to handle the Floating Hearts animation */}
      <style>{`
        @keyframes customFloatUp {
          0% {
            transform: translateY(105vh) rotate(0deg) scale(0.4);
            opacity: 0;
          }
          10% {
            opacity: 0.7;
          }
          90% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(-15vh) rotate(320deg) scale(1.1);
            opacity: 0;
          }
        }
        .animate-float-heart {
          animation: customFloatUp linear infinite;
        }
        
        @keyframes customFloatAmbient {
          0% {
            transform: translateY(110vh) rotate(0deg) scale(0.6);
            opacity: 0;
          }
          15% {
            opacity: 0.35;
          }
          85% {
            opacity: 0.35;
          }
          100% {
            transform: translateY(-10vh) rotate(220deg) scale(1.1);
            opacity: 0;
          }
        }
        .animate-ambient-particle {
          animation: customFloatAmbient linear infinite;
        }

        @keyframes fluidGradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-fluid-gradient {
          background-size: 200% 200%;
          animation: fluidGradientMove 15s ease-in-out infinite;
        }

        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 10px 0px rgba(244, 63, 94, 0.3), 0 4px 12px rgba(244, 63, 94, 0.1);
          }
          50% {
            box-shadow: 0 0 25px 8px rgba(244, 63, 94, 0.7), 0 8px 24px rgba(244, 63, 94, 0.25);
          }
        }
        .animate-yes-glow {
          animation: pulseGlow 2.5s infinite ease-in-out;
        }

        .text-glow {
          text-shadow: 0 0 10px rgba(244, 63, 94, 0.25);
        }
        .custom-shaker {
          animation: wiggle 0.35s ease-in-out;
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(-3deg) translateX(-4px); }
          30% { transform: rotate(2.5deg) translateX(3px); }
          45% { transform: rotate(-2deg) translateX(-3px); }
          60% { transform: rotate(1.5deg) translateX(2px); }
          75% { transform: rotate(-1deg) translateX(-1px); }
        }
        @keyframes customClickHeart {
          0% {
            transform: translate(-50%, -50%) scale(0.2) translateY(0);
            opacity: 1;
            filter: drop-shadow(0 1px 3px rgba(0,0,0,0.1));
          }
          100% {
            transform: translate(calc(-50% + var(--drift)), calc(-50% - 110px)) scale(var(--scale)) rotate(var(--angle));
            opacity: 0;
          }
        }
        .animate-click-heart {
          animation: customClickHeart var(--duration) cubic-bezier(0.15, 0.85, 0.45, 1) forwards;
        }

        @keyframes buttonShining {
          0% { left: -100%; }
          40%, 100% { left: 100%; }
        }
        .animate-shining {
          position: relative;
          overflow: hidden;
        }
        .animate-shining::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.4) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: skewX(-25deg);
          animation: buttonShining 3.5s infinite ease-in-out;
          pointer-events: none;
        }
      `}</style>

      {/* Dreamy Ambient Particles Canvas (Always active for atmospheric backdrop depth) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {ambientParticles.map((pt) => {
          const particleColor = settings.heartColor || '#f43f5e';
          return (
            <div
              key={pt.id}
              className="absolute animate-ambient-particle"
              style={{
                left: `${pt.left}%`,
                width: `${pt.size}px`,
                height: `${pt.size}px`,
                animationDelay: `${pt.delay}s`,
                animationDuration: `${pt.duration}s`,
              }}
            >
              {pt.type === 'heart' ? (
                <svg 
                  viewBox="0 0 24 24" 
                  className="w-full h-full fill-current" 
                  style={{ color: `${particleColor}`, opacity: 0.16 }}
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              ) : pt.type === 'sparkle' ? (
                <span className="text-yellow-400 font-extrabold select-none rotate-12 inline-block" style={{ fontSize: `${pt.size}px`, opacity: 0.22 }}>✨</span>
              ) : (
                <div 
                  className="rounded-full border" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    borderColor: `${particleColor}`, 
                    backgroundColor: `${particleColor}1a`, 
                    opacity: 0.12 
                  }} 
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Hearts Particle Canvas (Full Screen overlay for celebrations) */}
      {step === 4 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {floatingHearts.map((heart) => (
            <div
              key={heart.id}
              className="absolute animate-float-heart text-pink-400 fill-pink-400"
              style={{
                left: `${heart.left}%`,
                width: `${heart.size}px`,
                height: `${heart.size}px`,
                animationDelay: `${heart.delay}s`,
                animationDuration: `${heart.duration}s`,
                filter: 'drop-shadow(0 2px 4px rgba(244,63,94,0.15))',
              }}
            >
              <svg viewBox="0 0 24 24" className="w-full h-full fill-current">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Global Tap Hearts */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
        {clickHearts.map((heart) => {
          const speedVal = settings.heartAnimationSpeed || 'medium';
          const duration =
            speedVal === 'slow'
              ? '1.8s'
              : speedVal === 'fast'
              ? '0.6s'
              : '1.1s';
          return (
            <div
              key={heart.id}
              className="absolute animate-click-heart pointer-events-none"
              style={{
                left: `${heart.x}px`,
                top: `${heart.y}px`,
                color: heart.color,
                // Pass custom CSS values directly to the properties
                ['--drift' as any]: `${heart.drift}px`,
                ['--scale' as any]: heart.scale,
                ['--angle' as any]: `${heart.angle}deg`,
                ['--duration' as any]: duration,
              }}
              onAnimationEnd={() => {
                setClickHearts((prev) => prev.filter((h) => h.id !== heart.id));
              }}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          );
        })}
      </div>

      {/* Persistent Audio & Editor Controls (Top Bar) */}
      {!isLocked && (
        !isSharedView ? (
          <header className="w-full max-w-5xl mx-auto flex justify-between items-center gap-3 z-30 mb-4 pt-2">
            <div 
              onClick={handleLogoClick}
              className={`flex items-center space-x-2 bg-white/70 backdrop-blur-md py-1.5 px-3.5 rounded-full shadow-sm cursor-pointer select-none transition-all active:scale-95 ${
                isDeveloperMode 
                  ? 'border-2 border-dashed border-rose-400 bg-rose-50/50 hover:bg-rose-100/50' 
                  : 'border border-pink-100 hover:bg-pink-50/50'
              }`}
              title="Sonu 💗 — Tap 5 times for Developer Controls"
            >
              <Heart className={`w-4.5 h-4.5 text-rose-500 fill-rose-500 ${isDeveloperMode ? 'animate-bounce' : 'animate-pulse'}`} />
              <span className="text-xs md:text-sm font-bold text-gray-700 tracking-tight flex items-center gap-1">
                <span>Sonu 💗</span>
                {isDeveloperMode && (
                  <span className="text-[9px] bg-rose-500 text-white font-extrabold px-1.5 py-0.5 rounded-full tracking-widest uppercase scale-90">
                    Dev
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Sounds Toggle */}
              <button
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  playSound('click');
                }}
                id="toggle-sound-settings-btn"
                className="p-2.5 bg-white/85 hover:bg-pink-50 border border-pink-100/50 hover:border-pink-300 rounded-full text-gray-500 hover:text-rose-500 shadow-sm transition-all cursor-pointer"
                title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Boyfriend Settings customizer toggle button */}
              {isDeveloperMode && (
                <button
                  onClick={() => {
                    playInteractiveSound('click');
                    setIsCustomizerOpen(true);
                  }}
                  id="open-customizer-modal-btn"
                  className="p-2.5 bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-full shadow-md transition-all font-bold text-xs flex items-center space-x-1 hover:scale-105 cursor-pointer animate-pulse"
                  title="Boyfriend's Configuration Dashboard"
                >
                  <Settings className="w-4.5 h-4.5 animate-spin-slow text-white" />
                  <span className="hidden sm:inline text-white pr-1">Customize App</span>
                </button>
              )}
            </div>
          </header>
        ) : (
          /* Floating minimal sound controls in shared mode for a clean, distraction-free app feel */
          <div className="fixed top-4 right-4 flex items-center gap-2 z-50">
            {isDeveloperMode && !isSharedLink && (
              <button
                onClick={() => {
                  playInteractiveSound('click');
                  setIsCustomizerOpen(true);
                }}
                id="open-customizer-modal-btn-shared"
                className="p-3 bg-gradient-to-r from-rose-550 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-full shadow-md border border-pink-100/20 transition-all cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95"
                title="Boyfriend's Configuration Dashboard"
              >
                <Settings className="w-4 h-4 animate-spin-slow text-white mr-1" />
                <span className="text-[10px] font-black uppercase tracking-wider text-white px-0.5">Customize</span>
              </button>
            )}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                playSound('click');
              }}
              id="toggle-sound-settings-btn-shared"
              className="p-3 bg-white/80 backdrop-blur-md hover:bg-white border border-pink-100/50 text-rose-500 rounded-full shadow-md hover:shadow-pink-100 transition-all cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95"
              title={soundEnabled ? 'Mute Music' : 'Unmute Music'}
            >
              {soundEnabled ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
            </button>
          </div>
        )
      )}



      {/* Visually appealing Proposal Progress Stepper Tracker */}
      {!isSharedView && (
        <div id="proposal-progress-stepper" className="w-full max-w-lg mx-auto mb-2 md:mb-5 px-4 z-30">
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-pink-100 py-3.5 px-4 md:px-6 shadow-sm flex flex-col space-y-2.5 relative overflow-hidden">
            <div className="flex items-center justify-between relative">
              {/* Horizontal line background */}
              <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-pink-100/70 rounded-full z-0" />
              
              {/* Animated active progress fill */}
              <div 
                className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-pink-400 via-rose-500 to-amber-400 rounded-full z-0 transition-all duration-500 ease-out" 
                style={{ width: `${Math.max(0, Math.min(100, ((step - 1) / 3) * 100))}%` }}
              />

              {[
                { num: 1, label: 'Love Check', icon: '❤️' },
                { num: 2, label: 'Love Meter', icon: '📈' },
                { num: 3, label: 'The Question', icon: '💍' },
                { num: 4, label: 'Celebration', icon: '🎉' }
              ].map((s) => {
                const isActive = step === s.num;
                const isCompleted = step > s.num;
                return (
                  <div key={s.num} className="flex flex-col items-center relative z-10">
                    <button
                      onClick={() => {
                        if (isCompleted || s.num <= step) {
                          playInteractiveSound('click');
                          setStep(s.num);
                        }
                      }}
                      disabled={s.num > step}
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-md transition-all duration-300 transform ${
                        isActive
                          ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white ring-4 ring-pink-100 scale-110'
                          : isCompleted
                          ? 'bg-gradient-to-br from-red-500 to-amber-500 text-white'
                          : 'bg-white text-gray-400 border border-pink-100 hover:border-pink-300'
                      } disabled:cursor-not-allowed`}
                      title={`Go to ${s.label}`}
                    >
                      {isCompleted ? '✓' : s.icon}
                    </button>
                    <span 
                      className={`text-[9px] md:text-[10px] mt-1.5 font-bold tracking-wider uppercase transition-colors duration-300 ${
                        isActive 
                          ? 'text-rose-600 font-extrabold' 
                          : isCompleted 
                          ? 'text-pink-500' 
                          : 'text-gray-400'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Interactive Stage */}
      <main
        className={isSharedView
          ? "w-screen h-screen min-h-screen sm:w-full sm:max-w-[420px] bg-white/90 backdrop-blur-3xl border-0 sm:border-4 sm:border-pink-200/80 rounded-none sm:rounded-[44px] shadow-none sm:shadow-[0_24px_60px_-15px_rgba(244,63,94,0.25)] flex flex-col justify-start items-center z-10 mx-auto relative overflow-hidden my-0 sm:my-8 sm:min-h-[820px] sm:max-h-[855px]"
          : "w-full flex-1 flex flex-col justify-center items-center py-6 md:py-10 z-10 max-w-4xl mx-auto"
        }
      >
        {isSharedView && (
          <>
            {/* Top Smartphone notch */}
            <div className="hidden sm:flex absolute top-0 left-1/2 -translate-x-1/2 w-32 h-5.5 bg-neutral-950 rounded-b-xl z-40 items-center justify-center">
              <div className="w-10 h-0.75 bg-neutral-800 rounded-full mb-1" />
              <div className="w-2 h-2 bg-neutral-900 rounded-full ml-3 mb-1" />
            </div>

            {/* A clean, minimal app branding header rather than busy battery/network lines */}
            <div className="w-full text-center px-4 pt-5 pb-2.5 z-30 select-none bg-transparent">
              <span className="text-[10px] font-black tracking-widest text-rose-500/80 uppercase">✨ Sonu App 💗</span>
            </div>
          </>
        )}

        <div className={isSharedView ? "w-full flex-1 overflow-y-auto px-4 pb-6 pt-5 flex flex-col justify-start items-center min-h-0 relative z-20" : "w-full flex-1 flex flex-col justify-center items-center"}>
          <AnimatePresence mode="wait">
            {isWelcome ? (
              <motion.div
                key="welcome-page"
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -10 }}
                transition={{ duration: 0.45 }}
                className="w-full max-w-md bg-white/90 backdrop-blur-md border border-pink-100 rounded-3xl p-6 md:p-8 shadow-xl text-center flex flex-col items-center justify-between relative overflow-visible"
              >
                {/* Cute visual element */}
                <div className="w-18 h-18 bg-rose-50 rounded-full flex items-center justify-center mb-4 shadow-inner border border-rose-100/30 relative">
                  <span className="text-3xl animate-pulse">👑</span>
                  <span className="absolute text-lg bottom-0.5 right-1">💖</span>
                </div>

                {/* Greeting Content */}
                <div className="space-y-4 mb-6 text-left w-full">
                  <h2 className="text-xl md:text-2xl font-black text-rose-600 tracking-tight leading-tight text-center flex items-center justify-center gap-2 select-none mb-4">
                    ✨ Welcome, My Bangari! 💗
                  </h2>
                  
                  <div className="space-y-3 pb-2 text-[13px] font-bold text-gray-700 leading-relaxed max-h-[380px] overflow-y-auto pr-1 select-text scrollbar-thin">
                    <motion.p 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-pink-50/50 p-3.5 rounded-2xl border border-pink-100/40"
                    >
                      welcome bangari naa idana first time try maadini heng aagaiti gottilla aadru adjust maadko kanda 🥰
                    </motion.p>
                    
                    <motion.p 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="bg-rose-50/50 p-3.5 rounded-2xl border border-rose-100/40"
                    >
                      Henga idru adaraga nanna love antu baala aiti every line bariyuvagu baala miss maadkondini ninna ninna presence beku ansataiti nanaga 🥹
                    </motion.p>
                    
                    <motion.p 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="bg-amber-50/30 p-3.5 rounded-2xl border border-amber-100/40"
                    >
                      Jaldi baaro kandamma nanna jote night maatadbaa ninna cute voice inda kummu anbaro baala miss maadkolatini 🥺
                    </motion.p>
                    
                    <motion.p 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      className="bg-pink-100/40 p-3.5 rounded-2xl border border-pink-200/50 text-center font-extrabold text-rose-600 text-sm italic"
                    >
                      Love you muddu 🫂💕
                    </motion.p>
                    
                    <motion.p 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 }}
                      className="bg-rose-50/70 p-3.5 rounded-2xl border border-rose-100/40"
                    >
                      Bangari ninna raani tara nodkobeku eenu kashta annode gotta aagbardu nanna paapu tara nanna mummy tara nanna cute hendti tara care maadbeku ninna maduve aagunu baa jaldi 🤌💗
                    </motion.p>
                    
                    <motion.p 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.55 }}
                      className="bg-amber-50/45 p-3.5 rounded-2xl border border-amber-100/45"
                    >
                      Aaram time Kottu correct line to line observe maadu kanda questions adavu yes and no ella try maadu 😚
                    </motion.p>
                    
                    <motion.p 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.65 }}
                      className="p-3.5 bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-pink-500/10 rounded-2xl border border-pink-200 text-center text-rose-700 font-extrabold"
                    >
                      Onda try ashte henge idru adjust maadko please bangari 🤗💗
                    </motion.p>
                  </div>
                </div>

                {/* Let's Go / Proceed button */}
                <button
                  type="button"
                  onClick={() => {
                    playInteractiveSound('success');
                    setIsWelcome(false);
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Open App Lock screen 🔐</span>
                </button>
              </motion.div>
            ) : isLocked ? (
              <motion.div
                key="love-lockscreen"
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -15 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md bg-white/92 backdrop-blur-md border-2 border-pink-100 rounded-3xl p-6 md:p-8 shadow-xl text-center flex flex-col items-center justify-between relative overflow-visible"
              >
                {/* Pulsing visual lock icon */}
                <div className="w-18 h-18 bg-rose-50 rounded-full flex items-center justify-center mb-4 shadow-inner border border-pink-200/50 relative">
                  <Heart className="w-9 h-9 text-rose-500 fill-rose-500 animate-pulse" />
                  <span className="absolute text-lg bottom-1 right-2">🔒</span>
                </div>

                {/* Cover Header */}
                <div className="space-y-2 mb-4 w-full">
                  <h2 className="text-xl font-black text-rose-600 tracking-tight leading-tight flex items-center justify-center gap-2">
                    🔑 Open App Lock Screen 💗
                  </h2>
                  <div className="bg-rose-50/80 border border-pink-100 rounded-2xl p-3.5 my-2.5 shadow-inner select-none">
                    <p className="text-xs font-black text-rose-600 leading-normal tracking-wide">
                      "Oyee bangari app open maadbeku andra nanna nick name jote nanna fv heart emoji enter maadu muddu 😚"
                    </p>
                  </div>
                  <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    🔒 PRIVACY SECURED FOR SONU 👑
                  </p>
                  <div className="w-12 h-0.75 bg-gradient-to-r from-pink-400 via-rose-500 to-amber-400 mx-auto rounded-full mt-2" />
                </div>

                {/* Password form field */}
                <div className="w-full space-y-4 mb-6">
                  <div className="text-left">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-rose-500/90 mb-1 px-1">
                      Enter boyfriend nickname + his favorite heart emoji:
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none">💭</span>
                      <input
                        type="text"
                        value={lockInput}
                        onChange={(e) => setLockInput(e.target.value)}
                        placeholder="🔒 Password hint is secret..."
                        className="w-full pl-10 pr-3 py-3.5 bg-rose-50/30 hover:bg-rose-50/60 border-2 border-pink-100 rounded-2xl text-sm font-black text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent text-center tracking-wide transition-all shadow-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleUnlockProposal();
                          }
                        }}
                        disabled={unlockCelebrating}
                      />
                    </div>
                  </div>

                  {/* Interactive Heart Picker Tray helper */}
                  <div className="bg-pink-50/40 p-3 rounded-2xl border border-pink-100/60 space-y-1.5">
                    <span className="block text-[10px] font-black text-rose-400 uppercase tracking-widest text-center">
                      💖 Tap to insert nickname's favorite heart emoji:
                    </span>
                    <div className="flex items-center justify-center gap-2">
                      {['🧡', '❤️', '💖', '💗', '💕', '💛', '💙', '💜'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            playInteractiveSound('click');
                            // If lockInput doesn't end with a space, add one first
                            const current = lockInput;
                            if (current && !current.endsWith(' ') && !current.endsWith(emoji)) {
                              setLockInput(current + ' ' + emoji);
                            } else {
                              setLockInput(current + emoji);
                            }
                          }}
                          className="w-8 h-8 rounded-full bg-white border border-pink-100 shadow-xs hover:scale-110 active:scale-90 transition-all flex items-center justify-center text-sm cursor-pointer hover:bg-rose-50"
                          title={`Insert ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {lockError && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-lg md:text-xl font-extrabold text-rose-600 bg-rose-50/90 border-2 border-dashed border-rose-200 rounded-2xl py-4.5 px-4 leading-normal text-center shadow-inner relative"
                    >
                      <div className="absolute top-1.5 right-2 text-rose-300 pointer-events-none select-none text-[11px] animate-pulse">💔</div>
                      {lockError}
                    </motion.div>
                  )}
                </div>

                {/* Trigger unlock button */}
                <button
                  type="button"
                  onClick={handleUnlockProposal}
                  disabled={unlockCelebrating}
                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-md flex items-center justify-center gap-2 border border-transparent cursor-pointer ${
                    unlockCelebrating
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white animate-pulse'
                      : 'bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white hover:shadow-lg active:scale-95'
                  }`}
                >
                  <span>{unlockCelebrating ? 'Access Granted! 💋💋💋' : 'Unlock App 💍'}</span>
                </button>
              </motion.div>
          ) : (
            <>
              {/* STEP 1: Does she love him? Yes/No */}
              {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md bg-white/85 backdrop-blur-md border border-pink-100 rounded-3xl p-6 md:p-8 shadow-xl text-center flex flex-col items-center justify-between relative overflow-visible ${
                isShaking ? 'custom-shaker' : ''
              }`}
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-pink-100/30 rounded-bl-full pointer-events-none" />
              
              {/* Floating sparkles background */}
              <div className="absolute -top-3 -left-3 text-pink-300 animate-ping">✨</div>

              {/* Decorative Pulsing Central Heart */}
              <div className="my-6 flex items-center justify-center">
                <div className="relative w-28 h-28 bg-pink-50 rounded-full flex items-center justify-center shadow-inner border border-pink-100">
                  <Heart className="w-16 h-16 text-rose-500 fill-rose-500 animate-pulse" />
                  <div className="absolute inset-0 bg-rose-400 rounded-full animate-ping opacity-15 pointer-events-none" />
                </div>
              </div>

              {/* Live Love Resistance / Stubbornness meter of girlfriend */}
              {noCountStep1 > 0 && (
                <div className="w-full bg-rose-50/70 border border-rose-100 rounded-2xl p-3 mb-5 flex flex-col space-y-1 animate-bounce-subtle">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-rose-600 flex items-center gap-1">
                      <span>🤨 Stubbornness Level:</span> 
                      <span className="px-1.5 py-0.5 bg-rose-500 text-white font-extrabold rounded text-[9px]">
                        Lv.{noCountStep1}
                      </span>
                    </span>
                    <span className="font-extrabold text-rose-700">
                      {Math.min(100, noCountStep1 * 10)}%
                    </span>
                  </div>
                  <div className="w-full bg-rose-100 h-2 rounded-full overflow-hidden relative">
                    <div 
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-pink-500 via-rose-500 to-red-600 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, noCountStep1 * 10)}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-gray-500 italic text-left">
                    Status: <span className="font-bold text-rose-600">
                      {noCountStep1 < 3 ? 'Cute Attempt 😇' :
                       noCountStep1 < 6 ? 'Sneaky Tease 😈' :
                       noCountStep1 < 10 ? 'Resistance is Futile! 😂' :
                       noCountStep1 < 14 ? 'Heart Rate Danger 🚨' :
                       'YES is Your Only Destiny! 💍🔥'}
                    </span>
                  </p>
                </div>
              )}

              {/* Heading */}
              <div className="space-y-2 mb-6">
                <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-800 tracking-tight leading-tight">
                  Hi {settings.girlfriendName}! 💕
                </h1>
                <p className="text-base md:text-lg font-semibold text-rose-600 leading-snug">
                  {formatStepText(settings.step1Question || DEFAULT_SETTINGS.step1Question)}
                </p>
              </div>

              {/* Action Buttons Space */}
              <div className="w-full flex flex-col items-center justify-center min-h-[140px] relative">
                
                {/* Custom speech bubble showing the boyfriend's message clearly right above buttons */}
                {noCountStep1 > 0 && irritationToast && (
                  <motion.div
                    key={`step1-msg-${toastKey}`}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="w-full bg-rose-50 border border-rose-200/50 rounded-2xl p-4 mb-5 text-center relative shadow-md shadow-rose-100/30"
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-500 to-rose-500 text-white px-3 py-0.5 rounded-full text-[9px] font-black shadow flex items-center gap-1 uppercase tracking-wider animate-pulse">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Message from {settings.boyfriendName} 💬</span>
                    </div>
                    <p className="text-sm text-rose-700 font-extrabold italic pt-1 leading-relaxed">
                      "{irritationToast}"
                    </p>
                  </motion.div>
                )}

                {/* YES option - grows dynamically representing love's gravity */}
                <div className="mb-4 flex justify-center items-center w-full z-20">
                  <motion.button
                    style={{ scale: yesScaleStep1 }}
                    whileHover={{ scale: yesScaleStep1 * 1.08 }}
                    whileTap={{ scale: yesScaleStep1 * 0.95 }}
                    animate={isYesClickedStep1 ? {
                      scale: [yesScaleStep1, yesScaleStep1 * 1.05, yesScaleStep1],
                    } : {}}
                    transition={isYesClickedStep1 ? { duration: 0.35, ease: "easeInOut" } : undefined}
                    onClick={() => {
                      if (isYesClickedStep1) return;
                      // Prevent accidental overlapping mouse-up triggers when clicking NO
                      if (Date.now() - lastNoEvasionTime.current < 800) {
                        return;
                      }
                      playInteractiveSound('success');
                      setIsYesClickedStep1(true);

                      // Spark a miniature sweet particle explosion on step 1 acceptance!
                      const miniEmojis = ['💖', '❤️', '💝'];
                      const bursts = Array.from({ length: 5 }).map((_, i) => ({
                        id: Date.now() + i,
                        left: 40 + Math.random() * 20, // center-ish burst
                        rotate: -20 + Math.random() * 40,
                        scale: 0.8 + Math.random() * 0.4,
                        delay: Math.random() * 50 / 1000,
                        duration: 1.2 + Math.random() * 0.5,
                        emoji: miniEmojis[Math.floor(Math.random() * miniEmojis.length)],
                      }));
                      setKissParticles((prev) => [...prev, ...bursts]);

                      setTimeout(() => {
                        setYesScaleStep1(1.0);
                        setIsYesClickedStep1(false);
                        setStep(2);
                      }, 750);
                    }}
                    id="love-yes-btn"
                    className="px-10 py-3.5 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 text-white font-extrabold rounded-full shadow-lg shadow-rose-200/50 hover:shadow-rose-400 transition-all flex items-center justify-center space-x-3 text-base md:text-lg cursor-pointer animate-yes-glow animate-shining border-2 border-white ring-4 ring-pink-400/25"
                  >
                    <Heart className="w-5 h-5 fill-white text-rose-500 animate-pulse" />
                    <span className="tracking-wide">{settings.step1YesBtn || DEFAULT_SETTINGS.step1YesBtn}</span>
                  </motion.button>
                </div>
 
                {/* NO option - leaps away and teases */}
                <div className="relative w-full h-10 flex justify-center items-center z-30">
                  <motion.button
                    animate={{
                      x: noOffsetStep1.x,
                      y: noOffsetStep1.y,
                    }}
                    transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                    onMouseEnter={(e) => handleNoHoverStep1(e)}
                    onTouchStart={(e) => {
                      handleNoHoverStep1(e);
                    }}
                    onClick={(e) => handleNoHoverStep1(e)}
                    id="love-no-btn"
                    className="px-6 py-2.5 bg-gradient-to-r from-neutral-100 to-gray-50 hover:from-white hover:to-neutral-100 text-rose-400 hover:text-rose-600 font-extrabold rounded-full text-sm border-2 border-rose-100/80 hover:border-rose-400 transition-all cursor-pointer shadow-md shadow-rose-100/30 flex items-center space-x-1.5 select-none font-sans"
                    style={{ position: 'relative', scale: Math.max(0.15, 1 - noCountStep1 * 0.14) }}
                  >
                    <span>{settings.step1NoBtn || DEFAULT_SETTINGS.step1NoBtn}</span>
                    <span>💔</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Love scale 1 to 10 */}
          {step === 2 && (
            <LoveScale
              key="step2"
              girlName={settings.girlfriendName}
              comments={settings.loveLevelComments}
              onComplete={(level) => {
                setLoveRating(level);
                setStep(3);
              }}
            />
          )}

          {/* STEP 3: Will you marry me? */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md bg-white/85 backdrop-blur-md border border-pink-100 rounded-3xl p-6 md:p-8 shadow-xl text-center flex flex-col items-center justify-between relative overflow-visible ${
                isShaking ? 'custom-shaker' : ''
              }`}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-yellow-400 via-rose-400 to-pink-500 rounded-t-3xl" />
              
              {/* Ring / Sparkle badges */}
              <div className="absolute top-2 right-2 flex space-x-1 text-yellow-500">
                <Star className="w-5 h-5 fill-yellow-400 animate-spin-slow" />
              </div>

              {/* Decorative Pulsing Proposal Ring icon */}
              <div className="my-6 flex items-center justify-center">
                <div className="relative w-28 h-28 bg-yellow-50 rounded-full flex items-center justify-center shadow-inner border border-yellow-100">
                  <span className="text-5xl select-none animate-bounce">💍</span>
                  <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-15 pointer-events-none" />
                </div>
              </div>

              {/* Live Love Resistance / Stubbornness meter of girlfriend for Marriage */}
              {noCountStep3 > 0 && (
                <div className="w-full bg-rose-50/70 border border-rose-100 rounded-2xl p-3 mb-5 flex flex-col space-y-1 animate-bounce-subtle">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-rose-600 flex items-center gap-1">
                      <span>🤨 Proposal Resistance:</span> 
                      <span className="px-1.5 py-0.5 bg-rose-500 text-white font-extrabold rounded text-[9px]">
                        Lv.{noCountStep3}
                      </span>
                    </span>
                    <span className="font-extrabold text-rose-700">
                      {Math.min(100, noCountStep3 * 10)}%
                    </span>
                  </div>
                  <div className="w-full bg-rose-100 h-2 rounded-full overflow-hidden relative">
                    <div 
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-pink-500 via-rose-500 to-red-600 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, noCountStep3 * 10)}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-gray-500 italic text-left">
                    Status: <span className="font-bold text-rose-600">
                      {noCountStep3 < 3 ? 'Comical Hesitation 🤔' :
                       noCountStep3 < 6 ? 'Wife-to-be Teasing 💍🌸' :
                       noCountStep3 < 10 ? 'Resistance Level Overheated ☄️' :
                       noCountStep3 < 14 ? 'Heart rate at max capacity! ❤️‍🔥' :
                       'ACCEPT YOUR DESTINY ALREADY! 🧸👰'}
                    </span>
                  </p>
                </div>
              )}

              {/* Ring Headings */}
              <div className="space-y-1 mb-6">
                <div className="text-rose-500 text-xs font-bold tracking-widest uppercase mb-1 font-sans">
                  You rated your Love: {loveRating}/10 ⭐
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-800 leading-snug">
                  {formatStepText(settings.step3Question || DEFAULT_SETTINGS.step3Question)}
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  {formatStepText(settings.step3Subtitle || DEFAULT_SETTINGS.step3Subtitle)}
                </p>
              </div>

              {/* Interactive Evasion Action Space */}
              <div className="w-full flex flex-col items-center justify-center min-h-[140px] relative">
                
                {/* Custom speech bubble showing the boyfriend's marriage message clearly inside the card */}
                {noCountStep3 > 0 && irritationToast && (
                  <motion.div
                    key={`step3-msg-${toastKey}`}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="w-full bg-rose-50 border border-rose-200/50 rounded-2xl p-4 mb-5 text-center relative shadow-md shadow-rose-100/30"
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-500 to-rose-500 text-white px-3 py-0.5 rounded-full text-[9px] font-black shadow flex items-center gap-1 uppercase tracking-wider animate-pulse">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Message from {settings.boyfriendName} 💬</span>
                    </div>
                    <p className="text-sm text-rose-700 font-extrabold italic pt-1 leading-relaxed">
                      "{irritationToast}"
                    </p>
                  </motion.div>
                )}

                {/* YES Option */}
                <div className="mb-4 flex justify-center items-center w-full z-20">
                  <motion.button
                    style={{ scale: yesScaleStep3 }}
                    whileHover={{ scale: yesScaleStep3 * 1.08 }}
                    whileTap={{ scale: yesScaleStep3 * 0.95 }}
                    animate={isYesClickedStep3 ? {
                      scale: [yesScaleStep3, yesScaleStep3 * 1.05, yesScaleStep3],
                    } : {}}
                    transition={isYesClickedStep3 ? { duration: 0.35, ease: "easeInOut" } : undefined}
                    onClick={(e) => {
                      if (isYesClickedStep3) return;
                      // Prevent accidental overlapping mouse-up triggers when clicking NO
                      if (Date.now() - lastNoEvasionTime.current < 800) {
                        return;
                      }
                      playInteractiveSound('fanfare');
                      setIsYesClickedStep3(true);

                      const clickX = e.clientX;
                      const clickY = e.clientY;

                      // Celebrate Marriage Acceptance with an absolute fireworks particle explosion!
                      const celebrationEmojis = ['💍', '❤️', '💖', '✨', '🌹', '🎉', '🥂', '💕', '🥰'];
                      const bursts = Array.from({ length: 12 }).map((_, i) => ({
                        id: Date.now() + i,
                        left: 20 + Math.random() * 60, // spread nicely across viewport
                        rotate: -30 + Math.random() * 60,
                        scale: 0.8 + Math.random() * 0.4,
                        delay: Math.random() * 0.2, // fast subtle staging
                        duration: 1.8 + Math.random() * 1.2, // float up gently
                        emoji: celebrationEmojis[Math.floor(Math.random() * celebrationEmojis.length)],
                      }));

                      // Add tiny floating hearts bursting directly from the click/button location that persist for a few seconds!
                      const loveEmojis = ['❤️', '💖', '💝', '💕', '💓'];
                      const buttonHearts = Array.from({ length: 10 }).map((_, i) => {
                        const angle = Math.random() * Math.PI * 2;
                        const velocity = 30 + Math.random() * 70;
                        return {
                          id: Date.now() + 100 + i,
                          left: 0,
                          rotate: -40 + Math.random() * 80,
                          scale: 0.6 + Math.random() * 0.4,
                          delay: Math.random() * 0.1,
                          duration: 1.5 + Math.random() * 1.0, 
                          emoji: loveEmojis[Math.floor(Math.random() * loveEmojis.length)],
                          startX: clickX,
                          startY: clickY,
                          driftX: Math.cos(angle) * velocity,
                          driftY: -150 - Math.random() * 100, // drift upwards gently & shorter
                        };
                      });

                      setKissParticles((prev) => [...prev, ...bursts, ...buttonHearts]);

                      // Automatically copy proposal success confirmation message to the clipboard
                      const titleText = formatStepText(settings.step4Title || DEFAULT_SETTINGS.step4Title);
                      const subtitleText = formatStepText(settings.step4Subtitle || DEFAULT_SETTINGS.step4Subtitle);
                      const customMessage = settings.step3YesBtn || "haa kummu maduve antu ninne aagodu";
                      const shareMsg = [
                        `💍 OMG! It\'s official! I said YES! 🧡👑`,
                        ``,
                        `💖 "${customMessage}" 💖`,
                        ``,
                        `✨ ${titleText}`,
                        `⭐ ${subtitleText}`,
                        ``,
                        `Share the happiness! Built with ❤️ by ${settings.boyfriendName || "kummu 🧡"}`
                      ].join('\n');

                      try {
                        navigator.clipboard.writeText(shareMsg)
                          .then(() => {
                            console.log("Success: Proposal message copied to clipboard.");
                            setShowCopiedToast(true);
                            setTimeout(() => setShowCopiedToast(false), 5000);
                          })
                          .catch(err => {
                            console.warn("Clipboard access rejected or blocked by browser:", err);
                          });
                      } catch (err) {
                        console.warn("Navigator clipboard write execution failed:", err);
                      }

                      setTimeout(() => {
                        setYesScaleStep3(1.0);
                        setIsYesClickedStep3(false);
                        setStep(4);
                      }, 750);
                    }}
                    id="marry-yes-btn"
                    className="px-10 py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:scale-105 text-white font-black rounded-full shadow-lg hover:shadow-rose-400 transition-all text-sm flex items-center justify-center space-x-2 cursor-pointer border-2 border-white ring-4 ring-pink-400/25 animate-yes-glow animate-shining"
                  >
                    <Heart className="w-5 h-5 fill-white text-rose-500 animate-pulse" />
                    <span>{formatStepText(settings.step3YesBtn || DEFAULT_SETTINGS.step3YesBtn)}</span>
                  </motion.button>
                </div>

                {/* NO Option – evades Touch or Cursor */}
                <div className="relative w-full h-10 flex justify-center items-center z-30">
                  <motion.button
                    animate={{
                      x: noOffsetStep3.x,
                      y: noOffsetStep3.y,
                    }}
                    transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                    onMouseEnter={(e) => handleNoHoverStep3(e)}
                    onTouchStart={(e) => {
                      handleNoHoverStep3(e);
                    }}
                    onClick={(e) => handleNoHoverStep3(e)}
                    id="marry-no-btn"
                    className="px-6 py-2 bg-gradient-to-r from-neutral-100 to-gray-50 hover:from-white hover:to-neutral-100 text-rose-400 hover:text-rose-600 font-extrabold rounded-full text-xs border-2 border-rose-100/80 hover:border-rose-400 transition-all cursor-pointer shadow-md shadow-rose-100/30 flex items-center space-x-1.5 select-none font-sans"
                    style={{ position: 'relative', scale: Math.max(0.15, 1 - noCountStep3 * 0.14) }}
                  >
                    <span>{formatStepText(settings.step3NoBtn || DEFAULT_SETTINGS.step3NoBtn)}</span>
                    <span>💔</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Celebration Success / Special Gift box */}
          {step === 4 && !isGiftOpened && (
            <motion.div
              key="step4-gift-closed"
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: -20 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl border-2 border-pink-100 p-8 shadow-2xl relative text-center flex flex-col items-center space-y-6"
            >
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 text-white px-5 py-1 rounded-full text-[11px] font-black shadow-lg uppercase tracking-wider animate-bounce flex items-center gap-1.5">
                <span>🎁 SPECIAL GIFT UNLOCKED!</span>
              </div>

              <div className="pt-4 space-y-2">
                <h1 className="text-2xl font-black text-gray-800 tracking-tight">
                  For My Sweetheart ✨
                </h1>
                <p className="text-xs text-gray-500 px-2 leading-relaxed">
                  Congratulations **{settings.girlfriendName}**! You successfully answered all questions. 
                  Now, your sweet developer boyfriend **{settings.boyfriendName}** has constructed a magical **Special Gift** for you.
                </p>
              </div>

              {/* Pulsing luxurious gift box */}
              <div className="py-8 flex justify-center items-center relative w-full">
                {/* Visual ripple glowing rings */}
                <div className="absolute w-44 h-44 bg-pink-100 rounded-full animate-ping opacity-25" />
                <div className="absolute w-36 h-36 bg-rose-100 rounded-full animate-pulse opacity-40" />

                <motion.button
                  onClick={() => {
                    playInteractiveSound('fanfare');
                    setIsGiftOpened(true);
                  }}
                  whileHover={{ 
                    scale: 1.15,
                    rotate: [0, -4, 4, -4, 4, 0],
                    transition: { duration: 0.4 } 
                  }}
                  whileTap={{ scale: 0.9 }}
                  className="cursor-pointer z-10 w-28 h-28 bg-gradient-to-tr from-pink-500 via-rose-500 to-red-500 rounded-3xl text-white shadow-xl flex items-center justify-center border-4 border-white"
                >
                  <Gift className="w-14 h-14 text-white drop-shadow-sm animate-wiggle" />
                </motion.button>
              </div>

              <div className="space-y-3 w-full">
                <button
                  onClick={() => {
                    playInteractiveSound('fanfare');
                    setIsGiftOpened(true);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 hover:scale-102 text-white font-black rounded-full shadow-lg hover:shadow-rose-300 transition-all text-xs flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 fill-white" />
                  <span>TAP TO OPEN GIFT 💖</span>
                </button>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Includes: Scratch Card & Retro Musical Tape Surprise ⭐
                </p>
              </div>
            </motion.div>
          )}

          {step === 4 && isGiftOpened && (
            <motion.div
              key="step4-gift-opened"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.6 }}
              className="w-full max-w-2xl bg-white/90 backdrop-blur-md rounded-3xl border border-pink-100 p-6 md:p-8 shadow-2xl relative text-center flex flex-col items-center space-y-6"
            >
              {/* Sparkle badge */}
              <div className="absolute top-4 left-4 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-bold shadow-sm border border-yellow-200 flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-500 animate-spin-slow" />
                OFFICIAL PROPOSAL SUCCESS! 💍
              </div>

              {/* Big Success Cheer */}
              <div className="space-y-1 pt-4">
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                  className="inline-block p-3 bg-pink-100 rounded-full border border-pink-200 mb-2 shadow-inner"
                >
                  <Heart className="w-10 h-10 text-rose-500 fill-rose-500 animate-pulse" />
                </motion.div>
                <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 bg-clip-text text-transparent leading-none drop-shadow-sm font-sans tracking-tight">
                  {formatStepText(settings.step4Title || DEFAULT_SETTINGS.step4Title)}
                </h1>
                <p className="text-xs text-rose-600 font-bold tracking-tight">
                  {formatStepText(settings.step4Subtitle || DEFAULT_SETTINGS.step4Subtitle)}
                </p>
              </div>

              {/* Particles rendered globally */}

              {/* THE MAGICAL UNCOVERED SURPRISE */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: 'spring' }}
                className="w-full flex flex-col items-center space-y-6"
              >


                {/* THE SURPRISE LETTER ENVELOPE */}
                <SurpriseLetter
                  girlfriendName={settings.girlfriendName}
                  boyfriendName={settings.boyfriendName}
                  loveMessage={settings.loveMessage}
                />

                {/* GF FEEDBACK REPLY SECTION */}
                <div className="w-full max-w-lg mx-auto bg-gradient-to-br from-[#FFFDF9] to-[#FFF9F2] p-6 rounded-3xl border border-pink-100 shadow-xl space-y-4 text-left relative overflow-hidden mt-4">
                  <div className="absolute top-2 right-2 text-pink-300 pointer-events-none">✨</div>
                  <h3 className="text-base font-extrabold text-rose-700 flex items-center gap-1.5 leading-none">
                    <MailOpen className="w-4 h-4 text-rose-500 animate-pulse" /> Write back to {settings.boyfriendName || "kummu 🧡"}
                  </h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed -mt-1 font-medium">
                    Send a sweet love note, reaction, or reply back to his heart! He will see your message instantly when he opens his customization settings panel in Dev Mode.
                  </p>

                  {feedbackStatus === 'submitted' ? (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }} 
                      animate={{ scale: 1, opacity: 1 }} 
                      className="bg-emerald-50 border border-emerald-100 p-5 rounded-3xl text-center space-y-3.5 shadow-md"
                    >
                      <div className="text-4xl animate-bounce">💌🎉</div>
                      <h4 className="text-sm font-black text-emerald-850 uppercase tracking-widest">Answers Copied! 📋</h4>
                      <p className="text-[12px] text-emerald-700 font-bold leading-relaxed">
                        “Thank you, my raani {settings.girlfriendName}! We have automatically copied your beautiful answers to your clipboard! 💖 Kindly paste them and send to your love {settings.boyfriendName || "kummu 🧡"}!”
                      </p>
                      
                      <div className="bg-white/95 border border-pink-100 p-3.5 rounded-2xl text-left mt-2 shadow-xs space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-500 block flex items-center gap-1">
                          📱 WhatsApp sharing advice:
                        </span>
                        <p className="text-[11.5px] text-gray-700 leading-relaxed font-semibold">
                          Go to WhatsApp, open chat with <strong className="text-rose-600 font-black">{settings.boyfriendName || "kummu 🧡"}</strong>, tap and hold the message field, click <strong className="text-pink-600 font-black">Paste</strong>, and send it to let him celebrate! 🎉
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      {/* Emoji reaction buttons */}
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Pick your feeling:</span>
                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                          {[
                            { emoji: '❤️', label: 'Love' },
                            { emoji: '💍', label: 'Yes I Do!' },
                            { emoji: '🥰', label: 'Happy' },
                            { emoji: '🥺', label: 'Touched' },
                            { emoji: '💋', label: 'Kiss' }
                          ].map((item) => (
                            <button
                              key={item.emoji}
                              type="button"
                              onClick={() => setFeedbackReaction(item.emoji)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                                feedbackReaction === item.emoji
                                  ? 'bg-rose-500 text-white shadow-md scale-105 border border-rose-500'
                                  : 'bg-white hover:bg-pink-50 text-gray-600 border border-pink-10 border-dashed hover:border-pink-300'
                              }`}
                            >
                              <span className="text-sm">{item.emoji}</span>
                              <span>{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Text note fields for 5 custom questions */}
                      <div className="space-y-4 pt-2">
                        {/* Question 1 */}
                        <div className="space-y-1.5 bg-rose-50/30 p-3 rounded-2xl border border-pink-100/50">
                          <label className="block text-xs font-extrabold text-pink-700 flex items-center gap-1">
                            <span className="bg-pink-500 text-white w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px]">1</span>
                            Bangari heng anastu ? First try nanga swalpu idea illa
                          </label>
                          <textarea
                            rows={2}
                            value={q1}
                            onChange={(e) => setQ1(e.target.value)}
                            placeholder="Type your response here..."
                            className="w-full px-3.5 py-2 rounded-xl border border-pink-100 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-pink-300 bg-white placeholder-gray-400 leading-relaxed resize-none shadow-inner"
                          />
                        </div>

                        {/* Question 2 */}
                        <div className="space-y-1.5 bg-rose-50/30 p-3 rounded-2xl border border-pink-100/50">
                          <label className="block text-xs font-extrabold text-pink-700 flex items-center gap-1">
                            <span className="bg-pink-500 text-white w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px]">2</span>
                            muddu naa ninga correct partner anastini loo
                          </label>
                          <textarea
                            rows={2}
                            value={q2}
                            onChange={(e) => setQ2(e.target.value)}
                            placeholder="Is there any doubt? Speak your heart..."
                            className="w-full px-3.5 py-2 rounded-xl border border-pink-100 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-pink-300 bg-white placeholder-gray-400 leading-relaxed resize-none shadow-inner"
                          />
                        </div>

                        {/* Question 3 */}
                        <div className="space-y-1.5 bg-rose-50/30 p-3 rounded-2xl border border-pink-100/50">
                          <label className="block text-xs font-extrabold text-pink-700 flex items-center gap-1">
                            <span className="bg-pink-500 text-white w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px]">3</span>
                            muddu nanna yaav yaav character ishta aagalla ninga open aagi helu
                          </label>
                          <textarea
                            rows={2}
                            value={q3}
                            onChange={(e) => setQ3(e.target.value)}
                            placeholder="Open up, tell me honestly what bugs you..."
                            className="w-full px-3.5 py-2 rounded-xl border border-pink-100 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-pink-300 bg-white placeholder-gray-400 leading-relaxed resize-none shadow-inner"
                          />
                        </div>

                        {/* Question 4 */}
                        <div className="space-y-1.5 bg-rose-50/30 p-3 rounded-2xl border border-pink-100/50">
                          <label className="block text-xs font-extrabold text-pink-700 flex items-center gap-1">
                            <span className="bg-pink-500 text-white w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px]">4</span>
                            bangari naa andra eshta ishta ninga nanna eshta hachondi ?
                          </label>
                          <textarea
                            rows={2}
                            value={q4}
                            onChange={(e) => setQ4(e.target.value)}
                            placeholder="How much do you love/miss me? Tell me detail aagi..."
                            className="w-full px-3.5 py-2 rounded-xl border border-pink-100 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-pink-300 bg-white placeholder-gray-400 leading-relaxed resize-none shadow-inner"
                          />
                        </div>

                        {/* Question 5 */}
                        <div className="space-y-1.5 bg-rose-50/30 p-3 rounded-2xl border border-pink-100/50">
                          <label className="block text-xs font-extrabold text-pink-700 flex items-center gap-1">
                            <span className="bg-pink-500 text-white w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px]">5</span>
                            finally nanna bagge een een helbeku ella feedback tara helu
                          </label>
                          <textarea
                            rows={3}
                            value={q5}
                            onChange={(e) => setQ5(e.target.value)}
                            placeholder="Anything else, sweet memories, promises, feedback... write down anything custom here 💕"
                            className="w-full px-3.5 py-3 rounded-xl border border-pink-100 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-pink-300 bg-white placeholder-gray-400 leading-relaxed resize-none shadow-inner"
                          />
                        </div>
                      </div>

                      {feedbackStatus === 'error' && (
                        <div className="text-rose-600 text-[10px] font-bold bg-rose-50 p-2 rounded-xl border border-rose-100 mb-1.5 text-center">
                          Failed to send to backend server, but we saved it locally! 🧸
                        </div>
                      )}

                      {/* Submit action */}
                      <button
                        type="button"
                        disabled={feedbackStatus === 'submitting'}
                        onClick={handleSubmitFeedback}
                        className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white hover:scale-[1.01] active:scale-95 transition-all text-xs font-black uppercase tracking-widest rounded-2xl shadow-md cursor-pointer flex items-center justify-center gap-2 select-none disabled:opacity-50"
                      >
                        {feedbackStatus === 'submitting' ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Sending note...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5 text-white animate-pulse" />
                            <span>Send Sweet Reply to {settings.boyfriendName} 💘</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Start Over Button layout */}
              <div className="pt-2">
                <button
                  onClick={handleResetAppFlow}
                  id="app-flow-reset-btn"
                  className="px-5 py-2 bg-gray-50 hover:bg-rose-50 border border-gray-200 hover:border-pink-200 text-gray-500 hover:text-rose-600 text-xs font-bold rounded-full shadow-xs transition-all flex items-center justify-center space-x-1 mx-auto cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                  <span>Start Again (Let her tap YES again!)</span>
                </button>
              </div>
            </motion.div>
          )}
          </>)}

        </AnimatePresence>
        </div>
      </main>

      {/* Love Applet footer */}
      {!isSharedView && (
        <footer className="w-full text-center z-10 py-4 border-t border-pink-100/10 text-[11px] text-gray-400 tracking-wide font-medium mt-4">
          Special App for {settings.girlfriendName} • Built with ❤️ by {settings.boyfriendName}
        </footer>
      )}

          {/* Escalating Interceptor Alert Modal for multiple NO clicks */}
      <AnimatePresence>
        {interceptorMessage && (
          <div key="interceptor-overlay" className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-3xl border border-pink-100 p-6 shadow-2xl relative text-center flex flex-col items-center space-y-4"
            >
              <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center text-2xl animate-bounce">
                💔
              </div>
              
              <h3 className="text-base font-black text-rose-600 tracking-tight leading-snug font-sans">
                {interceptorTitle}
              </h3>
              
              <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                {interceptorMessage}
              </p>
              
              <button
                onClick={() => {
                  playInteractiveSound('success');
                  setInterceptorMessage(null);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold rounded-full shadow-md text-xs tracking-wide uppercase transition-all cursor-pointer hover:shadow-lg hover:scale-102"
              >
                Okay, I'll be good 😇
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Welcome Modal for muddu kandamma after unlocking */}
      <AnimatePresence>
        {showWelcomeModal && (
          <div key="welcome-overlay" className="fixed inset-0 bg-neutral-950/70 backdrop-blur-md flex items-center justify-center p-4 z-55">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-gradient-to-br from-[#FFFDF9] via-[#FFFDF9] to-[#FFF5ED] rounded-3xl border border-pink-100 p-6 md:p-8 shadow-2xl relative text-center flex flex-col items-center space-y-5"
            >
              <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center text-3xl animate-pulse shadow-md border border-pink-100">
                👑🌸
              </div>
              
              <h3 className="text-lg font-black text-rose-700 tracking-tight leading-snug font-sans">
                Welcome to the App, Muddu Kandamma! 🥰❤️
              </h3>
              
              <p className="text-xs text-gray-700 leading-relaxed font-semibold bg-white/70 p-4.5 rounded-2xl border border-pink-100/55 shadow-inner text-center whitespace-pre-line">
                welcome to the app muddu kandamma swalpa questions ka answer maadu swalpa time Kottu ella oodu matta nanna ella question ku full long aagi matta aaram free heart inda reply maadu 
                <span className="block mt-2 text-rose-600 font-extrabold">Matta ella question ella option try maadu 😚</span>
              </p>
              
              <button
                onClick={() => {
                  playInteractiveSound('success');
                  setShowWelcomeModal(false);
                }}
                className="w-full py-3 bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-black rounded-xl shadow-md hover:shadow-rose-300 text-xs tracking-wider uppercase transition-all cursor-pointer hover:scale-102 flex items-center justify-center gap-1.5"
              >
                <span>Chalo, Let's Start 😚💖</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Gear Dashboard Customizer Dialog Panel */}
      <CustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      {/* Dynamic Copied Toast notification */}
      <AnimatePresence>
        {showCopiedToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-55 flex items-center gap-3 bg-[#FFFDF9] border-2 border-pink-100 rounded-2xl px-5 py-3.5 shadow-2xl max-w-sm w-[90%]"
          >
            <div className="bg-pink-100/75 w-10 h-10 rounded-xl flex items-center justify-center text-xl select-none shrink-0 border border-pink-200">
              📋💖
            </div>
            <div className="text-left">
              <p className="text-xs font-black text-rose-700 tracking-tight">Proposal Copied to Clipboard!</p>
              <p className="text-[10.5px] text-gray-500 font-bold leading-tight mt-0.5">Paste & share this sweet news with your friends! 🥰✨</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
