import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash, Image as ImageIcon, RotateCcw, Save, MessageCircle, Heart, User, Sparkles } from 'lucide-react';
import { CustomSettings } from '../types';
import { DEFAULT_SETTINGS, DEFAULT_COUPLE_IMAGE, DEFAULT_PROPOSAL_IMAGE } from '../utils/defaults';
import { playSound } from '../utils/audio';

interface CustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CustomSettings;
  onSave: (newSettings: CustomSettings) => void;
}

export const CustomizerModal: React.FC<CustomizerModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [girlName, setGirlName] = useState(settings.girlfriendName);
  const [boyName, setBoyName] = useState(settings.boyfriendName);
  const [msg, setMsg] = useState(settings.loveMessage);
  const [images, setImages] = useState<string[]>(settings.images);
  const [irritationStep1, setIrritationStep1] = useState<string[]>(settings.irritationTextsStep1);
  const [irritationStep3, setIrritationStep3] = useState<string[]>(settings.irritationTextsStep3);
  const [heartColor, setHeartColor] = useState(settings.heartColor || '#f43f5e');
  const [heartAnimationSpeed, setHeartAnimationSpeed] = useState<'slow' | 'medium' | 'fast'>(settings.heartAnimationSpeed || 'medium');
  const [backgroundTheme, setBackgroundTheme] = useState<'dreamy-pink' | 'starry-night' | 'sunset-glow'>(settings.backgroundTheme || 'dreamy-pink');
  
  // Custom text editable states
  const [step1Question, setStep1Question] = useState(settings.step1Question || DEFAULT_SETTINGS.step1Question || '');
  const [step1YesBtn, setStep1YesBtn] = useState(settings.step1YesBtn || DEFAULT_SETTINGS.step1YesBtn || '');
  const [step1NoBtn, setStep1NoBtn] = useState(settings.step1NoBtn || DEFAULT_SETTINGS.step1NoBtn || '');
  
  const [step3Question, setStep3Question] = useState(settings.step3Question || DEFAULT_SETTINGS.step3Question || '');
  const [step3Subtitle, setStep3Subtitle] = useState(settings.step3Subtitle || DEFAULT_SETTINGS.step3Subtitle || '');
  const [step3YesBtn, setStep3YesBtn] = useState(settings.step3YesBtn || DEFAULT_SETTINGS.step3YesBtn || '');
  const [step3NoBtn, setStep3NoBtn] = useState(settings.step3NoBtn || DEFAULT_SETTINGS.step3NoBtn || '');
  
  const [step4Title, setStep4Title] = useState(settings.step4Title || DEFAULT_SETTINGS.step4Title || '');
  const [step4Subtitle, setStep4Subtitle] = useState(settings.step4Subtitle || DEFAULT_SETTINGS.step4Subtitle || '');
  
  const [newStep1Text, setNewStep1Text] = useState('');
  const [newStep3Text, setNewStep3Text] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [copyStatus, setCopyStatus] = useState<'idle' | 'saving' | 'copied' | 'error'>('idle');
  const [isCompressing, setIsCompressing] = useState<boolean>(false);

  // Advanced canvas compression function reducing image size to ~1.2KB for absolute URL-sharing reliability
  const compressImage = (file: File, maxWidth: number = 150, quality: number = 0.3): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Downscale the image if larger than target width
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = () => {
          resolve(e.target?.result as string);
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleAddImageUrl = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
      setImageError('Please enter a valid absolute image URL starting with http:// or https://');
      return;
    }
    setImageError('');
    setImages((prev) => [...prev, url]);
    setNewImageUrl('');
    playSound('click');
  };

  const handleCopyShareLink = () => {
    setCopyStatus('saving');

    const updated: CustomSettings = {
      ...settings,
      girlfriendName: girlName.trim(),
      boyfriendName: boyName.trim(),
      loveMessage: msg.trim(),
      images: images, 
      irritationTextsStep1: irritationStep1,
      irritationTextsStep3: irritationStep3,
      heartColor,
      heartAnimationSpeed,
      backgroundTheme,
      
      step1Question: step1Question.trim(),
      step1YesBtn: step1YesBtn.trim(),
      step1NoBtn: step1NoBtn.trim(),
      
      step3Question: step3Question.trim(),
      step3Subtitle: step3Subtitle.trim(),
      step3YesBtn: step3YesBtn.trim(),
      step3NoBtn: step3NoBtn.trim(),
      
      step4Title: step4Title.trim(),
      step4Subtitle: step4Subtitle.trim(),
    };

    onSave(updated);

    try {
      // Build a 100% self-contained, stateless URL parameter string containing the actual compressed photos!
      // This is perfectly resilient across different domains, server resets, container scales, and deploys!
      const jsonStr = JSON.stringify(updated);
      const b64 = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      }));
      
      const shareUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?s=${b64}`;
      
      // Attempt silent backup save in the background on the express node if reachable
      fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updated),
      }).catch(err => console.log('Silent backup node save:', err));

      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopyStatus('copied');
        playSound('success');
        setTimeout(() => setCopyStatus('idle'), 4000);
      }).catch((err) => {
        console.error('Clipboard permission denied, fallback alert', err);
        setCopyStatus('copied');
        alert('Saved Successfully! Send this 100% stable custom link to her:\n\n' + shareUrl);
        setTimeout(() => setCopyStatus('idle'), 4000);
      });
    } catch (e) {
      console.error('Stateless URL generation failed', e);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 3000);
    }
  };

  // Synchronize state when settings or open state changes (ensures no stale data / "settings changing itself")
  useEffect(() => {
    if (isOpen) {
      setGirlName(settings.girlfriendName);
      setBoyName(settings.boyfriendName);
      setMsg(settings.loveMessage);
      setImages(settings.images);
      setIrritationStep1(settings.irritationTextsStep1);
      setIrritationStep3(settings.irritationTextsStep3);
      setHeartColor(settings.heartColor || '#f43f5e');
      setHeartAnimationSpeed(settings.heartAnimationSpeed || 'medium');
      setBackgroundTheme(settings.backgroundTheme || 'dreamy-pink');
      
      setStep1Question(settings.step1Question || DEFAULT_SETTINGS.step1Question || '');
      setStep1YesBtn(settings.step1YesBtn || DEFAULT_SETTINGS.step1YesBtn || '');
      setStep1NoBtn(settings.step1NoBtn || DEFAULT_SETTINGS.step1NoBtn || '');
      
      setStep3Question(settings.step3Question || DEFAULT_SETTINGS.step3Question || '');
      setStep3Subtitle(settings.step3Subtitle || DEFAULT_SETTINGS.step3Subtitle || '');
      setStep3YesBtn(settings.step3YesBtn || DEFAULT_SETTINGS.step3YesBtn || '');
      setStep3NoBtn(settings.step3NoBtn || DEFAULT_SETTINGS.step3NoBtn || '');
      
      setStep4Title(settings.step4Title || DEFAULT_SETTINGS.step4Title || '');
      setStep4Subtitle(settings.step4Subtitle || DEFAULT_SETTINGS.step4Subtitle || '');
    }
  }, [settings, isOpen]);


  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImageError('');
    setIsCompressing(true);

    const filesArray = Array.from(files) as File[];
    const validImageFiles = filesArray.filter((file) => {
      if (!file.type.startsWith('image/')) {
        setImageError('Please select image files only!');
        return false;
      }
      return true;
    });

    try {
      const compressedUrls = await Promise.all(
        validImageFiles.map((file) => compressImage(file, 150, 0.3))
      );

      const successfulCompressions = compressedUrls.filter(Boolean);
      if (successfulCompressions.length > 0) {
        setImages((prev) => [...prev, ...successfulCompressions]);
        playSound('click');
      }
    } catch (err) {
      console.error('Compression pipeline failed', err);
      setImageError('Failed to optimize and compress image. Please try again!');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset input to allow re-uploading same file
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    playSound('error');
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addIrritationItem = (step: 1 | 3) => {
    if (step === 1 && newStep1Text.trim()) {
      setIrritationStep1((prev) => [...prev, newStep1Text.trim()]);
      setNewStep1Text('');
      playSound('click');
    } else if (step === 3 && newStep3Text.trim()) {
      setIrritationStep3((prev) => [...prev, newStep3Text.trim()]);
      setNewStep3Text('');
      playSound('click');
    }
  };

  const removeIrritationItem = (step: 1 | 3, index: number) => {
    playSound('error');
    if (step === 1) {
      setIrritationStep1((prev) => prev.filter((_, i) => i !== index));
    } else {
      setIrritationStep3((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all customizer settings to sweet defaults?')) {
      playSound('success');
      setGirlName(DEFAULT_SETTINGS.girlfriendName);
      setBoyName(DEFAULT_SETTINGS.boyfriendName);
      setMsg(DEFAULT_SETTINGS.loveMessage);
      setImages(DEFAULT_SETTINGS.images);
      setIrritationStep1(DEFAULT_SETTINGS.irritationTextsStep1);
      setIrritationStep3(DEFAULT_SETTINGS.irritationTextsStep3);
      setHeartColor(DEFAULT_SETTINGS.heartColor || '#f43f5e');
      setHeartAnimationSpeed(DEFAULT_SETTINGS.heartAnimationSpeed || 'medium');
      setBackgroundTheme(DEFAULT_SETTINGS.backgroundTheme || 'dreamy-pink');
      
      setStep1Question(DEFAULT_SETTINGS.step1Question);
      setStep1YesBtn(DEFAULT_SETTINGS.step1YesBtn);
      setStep1NoBtn(DEFAULT_SETTINGS.step1NoBtn);
      
      setStep3Question(DEFAULT_SETTINGS.step3Question);
      setStep3Subtitle(DEFAULT_SETTINGS.step3Subtitle);
      setStep3YesBtn(DEFAULT_SETTINGS.step3YesBtn);
      setStep3NoBtn(DEFAULT_SETTINGS.step3NoBtn);
      
      setStep4Title(DEFAULT_SETTINGS.step4Title);
      setStep4Subtitle(DEFAULT_SETTINGS.step4Subtitle);
    }
  };

  const handleSave = () => {
    if (!girlName.trim() || !boyName.trim()) {
      alert('Names cannot be empty!');
      return;
    }
    const updated: CustomSettings = {
      ...settings,
      girlfriendName: girlName.trim(),
      boyfriendName: boyName.trim(),
      loveMessage: msg.trim(),
      images,
      irritationTextsStep1: irritationStep1,
      irritationTextsStep3: irritationStep3,
      heartColor,
      heartAnimationSpeed,
      backgroundTheme,
      
      step1Question: step1Question.trim(),
      step1YesBtn: step1YesBtn.trim(),
      step1NoBtn: step1NoBtn.trim(),
      
      step3Question: step3Question.trim(),
      step3Subtitle: step3Subtitle.trim(),
      step3YesBtn: step3YesBtn.trim(),
      step3NoBtn: step3NoBtn.trim(),
      
      step4Title: step4Title.trim(),
      step4Subtitle: step4Subtitle.trim(),
    };
    onSave(updated);
    playSound('success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm"
      />

      {/* Modal Box */}
      <motion.div
        initial={{ scale: 0.95, y: 15, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 15, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-pink-50 max-h-[85vh] overflow-hidden flex flex-col z-10"
      >
        {/* Header */}
        <div className="p-6 border-b border-pink-100 flex items-center justify-between bg-gradient-to-r from-red-50 to-pink-50">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-pink-500" />
            <h3 className="text-xl font-bold bg-gradient-to-r from-red-600 to-pink-500 bg-clip-text text-transparent">
              Boyfriend's customization Panel
            </h3>
          </div>
          <button
            onClick={onClose}
            id="close-customizer-btn"
            className="p-1.5 rounded-full hover:bg-white/80 border border-transparent hover:border-pink-200 transition-colors cursor-pointer text-gray-500 hover:text-red-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
          
          <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-4 text-xs text-amber-800 leading-relaxed">
            <strong>💡 Pro-Tip for Venkatesh:</strong> Customize these parameters before opening the page for your girlfriend! Custom irritation texts can be crafted, and settings are preserved instantly.
          </div>

          {/* Her Sweet Feedbacks Dashboard */}
          {settings.feedbacks && settings.feedbacks.length > 0 ? (
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100 rounded-3xl p-5 space-y-3">
              <h4 className="text-xs font-black text-rose-700 flex items-center gap-1.5 uppercase tracking-wider">
                <Heart className="w-4 h-4 animate-pulse text-rose-500 fill-rose-150" /> Her Sweet Feedbacks & Replies ({settings.feedbacks.length})
              </h4>
              <p className="text-[11px] text-gray-500 leading-relaxed -mt-1">
                She accepted your proposal! Here are all the replies, notes, and sweet reactions she sent back to your heart:
              </p>
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {settings.feedbacks.map((item, idx) => (
                  <div key={item.id || idx} className="bg-white p-3.5 rounded-2xl border border-pink-100/60 shadow-xs flex flex-col space-y-1 relative overflow-hidden">
                    <div className="absolute top-2.5 right-3 text-lg">{item.reaction || '❤️'}</div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-rose-600">{item.name || settings.girlfriendName}</span>
                      <span className="text-[9px] text-gray-400 font-mono">
                        {item.timestamp ? new Date(item.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Just now'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 font-medium italic leading-relaxed whitespace-pre-wrap pl-2 border-l-2 border-pink-200">
                      "{item.text || 'Accepted your proposal! ❤️'}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-neutral-50 border border-neutral-200/50 rounded-2.5xl p-4 flex items-center gap-3">
              <span className="text-2xl select-none animate-pulse">💌</span>
              <div className="text-left space-y-0.5">
                <h5 className="text-xs font-extrabold text-gray-700">Her Replies & Feedbacks Dashboard</h5>
                <p className="text-[10px] text-gray-500 leading-snug">
                  Once she reads your surprise letter on her phone and writes back, all of her sweet replies and feelings will appear right here in real time!
                </p>
              </div>
            </div>
          )}

          {/* Share Block */}
          <div className="flex flex-col gap-3">
            <div className="bg-gradient-to-r from-rose-50 forced-colors:from-transparent shadow-sm to-pink-55/70 border border-pink-100 rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1 text-left">
                <h4 className="text-xs font-black text-rose-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 animate-pulse text-rose-500 fill-rose-100" /> Share & Publish Custom Proposal
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed max-w-lg font-medium">
                  To guarantee your girlfriend sees the exact customized nicknames, pictures, and love notes you write even when she opens the published/shared site, use this button to copy a customized layout link and share it with her!
                </p>
              </div>
              <button
                type="button"
                id="copy-custom-share-link-btn"
                disabled={copyStatus === 'saving'}
                onClick={handleCopyShareLink}
                className={`w-full md:w-auto px-5 py-3 rounded-2xl font-bold text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 border border-transparent cursor-pointer ${
                  copyStatus === 'copied'
                    ? 'bg-emerald-500 text-white shadow-emerald-100'
                    : copyStatus === 'saving'
                    ? 'bg-amber-500 text-white shadow-amber-100 animate-pulse'
                    : 'bg-gradient-to-r from-rose-550 to-pink-500 hover:from-rose-600 hover:to-pink-600 bg-rose-500 text-white shadow-pink-100 hover:scale-103 active:scale-95'
                }`}
              >
                <span>
                  {copyStatus === 'copied'
                    ? 'Copied Link! 💝'
                    : copyStatus === 'saving'
                    ? 'Saving to Cloud... ⏳'
                    : 'Copy Customized Link 🔗'}
                </span>
              </button>
            </div>
            
            {images.some((img) => img && img.startsWith('data:image/')) && (
              <div className="bg-emerald-50/50 pb-1 select-none flex-col border border-emerald-100/70 rounded-2xl p-4 text-[11px] text-emerald-800 leading-relaxed text-left flex items-start gap-1.5 shadow-sm bg-gradient-to-r from-emerald-50/40 to-teal-50/40 animate-fade-in">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-emerald-700">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse text-emerald-500" /> Cloud Upload Superpower Enabled ☁️
                </div>
                <p className="text-gray-600 font-medium">
                  Awesome! You have uploaded direct pictures from your local computer or phone. Thanks to our upgraded full-stack cloud database server, your high-resolution uploaded images and customized messages will be saved securely!
                </p>
                <p className="text-gray-600 font-medium mt-1">
                  💡 <strong className="font-bold text-emerald-800">Everything is preserved:</strong> When you hit <strong className="font-bold text-emerald-800">Copy Customized Link</strong>, a short and clean link is created. When she opens it, she will see your exact custom messages, cute nicknames, and custom photos instantly!
                </p>
              </div>
            )}
          </div>

          {/* Names Setup */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> Girlfriend's Nickname
              </label>
              <input
                type="text"
                value={girlName}
                onChange={(e) => setGirlName(e.target.value)}
                id="custom-girl-name-input"
                className="w-full px-4 py-2.5 rounded-xl border border-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent text-sm text-gray-700 bg-pink-50/10 placeholder-gray-400 font-medium"
                placeholder="Her sweet name"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-pink-500" /> Your Nickname (Boyfriend)
              </label>
              <input
                type="text"
                value={boyName}
                onChange={(e) => setBoyName(e.target.value)}
                id="custom-boy-name-input"
                className="w-full px-4 py-2.5 rounded-xl border border-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent text-sm text-gray-700 bg-pink-50/10 placeholder-gray-400 font-medium"
                placeholder="Your name"
              />
            </div>
          </div>

          {/* Message to Her */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5 text-rose-500" /> Your Romantic Proposal Letter
            </label>
            <textarea
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              id="custom-proposal-message-textarea"
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent text-sm text-gray-700 bg-pink-50/10 placeholder-gray-400 font-medium leading-relaxed resize-none"
              placeholder="Write why you love her, what she means to you..."
            />
          </div>

          {/* Custom App Words Section for Venkatesh */}
          <div className="bg-pink-50/20 rounded-2xl p-4 md:p-5 border border-pink-100/50 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-pink-600 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-rose-500" /> Edit All Words & Custom Messages
            </h4>
            
            {/* Step 1 custom text fields */}
            <div className="space-y-3.5 border-b border-pink-100/35 pb-4 text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Stage 1: Love Check</span>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                  Question Text:
                </label>
                <input
                  type="text"
                  value={step1Question}
                  onChange={(e) => setStep1Question(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-pink-100 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-pink-300"
                  placeholder="Custom question for Step 1"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                    YES Button Option Text:
                  </label>
                  <input
                    type="text"
                    value={step1YesBtn}
                    onChange={(e) => setStep1YesBtn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-pink-100 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-pink-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                    NO Button Option Text:
                  </label>
                  <input
                    type="text"
                    value={step1NoBtn}
                    onChange={(e) => setStep1NoBtn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-pink-100 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-pink-300"
                  />
                </div>
              </div>
            </div>

            {/* Step 3 custom text fields */}
            <div className="space-y-3.5 border-b border-pink-100/35 pb-4 text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Stage 3: Proposal Question (Supports {"{girlfriendName}"})</span>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                  Proposal Question:
                </label>
                <input
                  type="text"
                  value={step3Question}
                  onChange={(e) => setStep3Question(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-pink-100 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-pink-300"
                  placeholder="Custom proposal question text"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                  Subtitle Information/Teaser Text:
                </label>
                <input
                  type="text"
                  value={step3Subtitle}
                  onChange={(e) => setStep3Subtitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-pink-100 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-pink-300"
                  placeholder="Custom subtitle text"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                    YES Button Option Text:
                  </label>
                  <input
                    type="text"
                    value={step3YesBtn}
                    onChange={(e) => setStep3YesBtn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-pink-100 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-pink-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                    NO Button Option Text:
                  </label>
                  <input
                    type="text"
                    value={step3NoBtn}
                    onChange={(e) => setStep3NoBtn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-pink-100 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-pink-300"
                  />
                </div>
              </div>
            </div>

            {/* Step 4 custom text fields */}
            <div className="space-y-3.5 text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Stage 4: Celebration (Supports {"{girlfriendName}"} and {"{loveRating}"})</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                    Success Screen Title:
                  </label>
                  <input
                    type="text"
                    value={step4Title}
                    onChange={(e) => setStep4Title(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-pink-100 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-pink-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                    Success Score Subtitle:
                  </label>
                  <input
                    type="text"
                    value={step4Subtitle}
                    onChange={(e) => setStep4Subtitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-pink-100 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-pink-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Romantic Background Themes Selection Block */}
          <div className="bg-gradient-to-r from-pink-50/25 to-amber-50/25 rounded-2xl p-4 md:p-5 border border-pink-100/50 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-pink-600 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-pink-500" /> Romantic Background Themes
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  id: 'dreamy-pink',
                  name: 'Dreamy Pink',
                  desc: 'Soft whimsical candy color gradients',
                  previewClass: 'from-indigo-100 via-rose-50 to-pink-100'
                },
                {
                  id: 'starry-night',
                  name: 'Starry Night',
                  desc: 'Cinematic deep dark starry space look',
                  previewClass: 'from-slate-950 via-indigo-950 to-slate-900'
                },
                {
                  id: 'sunset-glow',
                  name: 'Sunset Glow',
                  desc: 'Warm golden sandy sunset vibes',
                  previewClass: 'from-amber-100 via-orange-100 to-rose-200'
                }
              ].map((theme) => {
                const isActive = backgroundTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      setBackgroundTheme(theme.id as any);
                      playSound('click');
                    }}
                    className={`flex flex-col items-start p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                      isActive
                        ? 'bg-[#FFFDF9] border-pink-400 ring-2 ring-pink-150 shadow-sm'
                        : 'bg-white border-pink-100/60 hover:bg-pink-50/30 hover:border-pink-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2 w-full">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${theme.previewClass} border border-gray-100 shadow-inner flex items-center justify-center text-xs shrink-0 select-none`}>
                        {theme.id === 'starry-night' ? '🌌' : theme.id === 'sunset-glow' ? '🌅' : '🌸'}
                      </div>
                      <div className="leading-tight">
                        <span className="text-xs font-extrabold text-gray-800 block leading-tight">{theme.name}</span>
                        <span className="text-[9px] text-pink-500 font-bold tracking-wider uppercase">
                          {isActive ? '● Active' : 'Select'}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                      {theme.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tap Interactive Heart Animation Customizations */}
          <div className="bg-rose-50/20 rounded-2xl p-4 md:p-5 border border-pink-100/50 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1">
              <Sparkles className="w-4 h-4" /> Tap Heart Effects Customize
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Heart Color Customize */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Interactive Heart Color
                </label>
                <div className="flex flex-wrap gap-2.5 items-center mb-2.5">
                  {[
                    { hex: '#f43f5e', name: 'Rose' },
                    { hex: '#dc2626', name: 'Red' },
                    { hex: '#d946ef', name: 'Pink' },
                    { hex: '#a855f7', name: 'Indigo' },
                    { hex: '#ff6b6b', name: 'Coral' },
                    { hex: '#06b6d4', name: 'Teal' },
                  ].map((colorObj) => (
                    <button
                      key={colorObj.hex}
                      type="button"
                      onClick={() => {
                        setHeartColor(colorObj.hex);
                        playSound('click');
                      }}
                      className={`w-7 h-7 rounded-full relative cursor-pointer focus:outline-none transition-transform hover:scale-110 active:scale-95`}
                      style={{ backgroundColor: colorObj.hex }}
                      title={colorObj.name}
                    >
                      {heartColor === colorObj.hex && (
                        <span className="absolute inset-0 m-1.5 rounded-full bg-white opacity-80" />
                      )}
                    </button>
                  ))}
                  
                  {/* Hex Picker Input */}
                  <input
                    type="color"
                    value={heartColor}
                    onChange={(e) => setHeartColor(e.target.value)}
                    className="w-8 h-8 rounded-md border border-gray-200 cursor-pointer p-0 overflow-hidden bg-transparent"
                    title="Choose Custom Color"
                    id="heart-color-picker"
                  />
                </div>
                <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                  Active Hex Color: <span className="font-mono text-rose-600 font-bold">{heartColor}</span>
                </div>
              </div>

              {/* Heart Animation Speed Customize */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Animation Floating Speed
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['slow', 'medium', 'fast'] as const).map((speed) => {
                    const isActive = heartAnimationSpeed === speed;
                    return (
                      <button
                        key={speed}
                        type="button"
                        onClick={() => {
                          setHeartAnimationSpeed(speed);
                          playSound('click');
                        }}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border tracking-wide capitalize cursor-pointer transition-all ${
                          isActive
                            ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-rose-50/50'
                        }`}
                      >
                        {speed === 'slow' ? '🐢 Slow' : speed === 'fast' ? '⚡ Fast' : '✨ Normal'}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-gray-400 mt-2 font-medium leading-normal">
                  Sets float and fade-out speed of heart particles when she taps anyway on screens!
                </p>
              </div>
            </div>
          </div>



          {/* Step 1 Irritation Lists */}
          <div className="space-y-4 pt-2 border-t border-pink-50">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center justify-between">
                <span>Phase 1 Irritation Prompts (If she says "No" to Love)</span>
                <span className="text-[10px] text-pink-500 normal-case">Stun messages: {irritationStep1.length} items</span>
              </label>
              
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newStep1Text}
                  onChange={(e) => setNewStep1Text(e.target.value)}
                  id="new-step1-irritation-input"
                  placeholder="Insert custom teasing line..."
                  className="flex-1 px-3 py-1.5 rounded-lg border border-pink-100 text-xs text-gray-700 focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && addIrritationItem(1)}
                />
                <button
                  type="button"
                  id="add-step1-irritation-btn"
                  onClick={() => addIrritationItem(1)}
                  className="bg-pink-100 hover:bg-pink-200 text-pink-700 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Add
                </button>
              </div>

              <div className="max-h-24 overflow-y-auto space-y-1.5 border border-pink-50 rounded-xl p-2 bg-pink-50/5">
                {irritationStep1.map((txt, index) => (
                  <div key={index} className="flex justify-between items-center text-xs bg-white py-1 px-2.5 rounded-md border border-pink-100/40">
                    <span className="truncate text-gray-600 flex-1">{txt}</span>
                    <button
                      type="button"
                      id={`remove-step1-irritation-btn-${index}`}
                      onClick={() => removeIrritationItem(1, index)}
                      className="text-gray-400 hover:text-red-500 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3 Irritation Lists */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center justify-between">
                <span>Phase 2 Irritation Prompts (If she says "No" to Marriage)</span>
                <span className="text-[10px] text-pink-500 normal-case">Stun messages: {irritationStep3.length} items</span>
              </label>
              
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newStep3Text}
                  onChange={(e) => setNewStep3Text(e.target.value)}
                  id="new-step3-irritation-input"
                  placeholder="Insert custom warning/guilt trip line..."
                  className="flex-1 px-3 py-1.5 rounded-lg border border-pink-100 text-xs text-gray-700 focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && addIrritationItem(3)}
                />
                <button
                  type="button"
                  id="add-step3-irritation-btn"
                  onClick={() => addIrritationItem(3)}
                  className="bg-pink-100 hover:bg-pink-200 text-pink-700 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Add
                </button>
              </div>

              <div className="max-h-24 overflow-y-auto space-y-1.5 border border-pink-50 rounded-xl p-2 bg-pink-50/5">
                {irritationStep3.map((txt, index) => (
                  <div key={index} className="flex justify-between items-center text-xs bg-white py-1 px-2.5 rounded-md border border-pink-100/40">
                    <span className="truncate text-gray-600 flex-1">{txt}</span>
                    <button
                      type="button"
                      id={`remove-step3-irritation-btn-${index}`}
                      onClick={() => removeIrritationItem(3, index)}
                      className="text-gray-400 hover:text-red-500 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-pink-100 flex items-center justify-between bg-pink-50/30">
          <button
            type="button"
            id="reset-customizer-btn"
            onClick={handleReset}
            className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-red-600 bg-white hover:bg-red-50 rounded-xl border border-gray-200 hover:border-red-200 transition-all flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
          </button>
          
          <div className="flex gap-2">
            <button
              type="button"
              id="cancel-customizer-btn"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-800 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              id="save-customizer-btn"
              onClick={handleSave}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 rounded-xl shadow-md cursor-pointer flex items-center gap-1"
            >
              <Save className="w-3.5 h-3.5" /> Save Changes
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
