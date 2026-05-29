export interface CustomSettings {
  girlfriendName: string;
  boyfriendName: string;
  loveMessage: string;
  loveLevelComments: { [key: number]: string };
  irritationTextsStep1: string[];
  irritationTextsStep3: string[];
  images: string[]; // Base64 or image URL strings
  heartColor: string;
  heartAnimationSpeed: 'slow' | 'medium' | 'fast';
  backgroundTheme?: 'dreamy-pink' | 'starry-night' | 'sunset-glow';
  
  // Custom text phrases added for editability
  step1Question: string;
  step1YesBtn: string;
  step1NoBtn: string;
  
  step3Question: string;
  step3Subtitle: string;
  step3YesBtn: string;
  step3NoBtn: string;
  
  step4Title: string;
  step4Subtitle: string;
  feedbacks?: Array<{
    id: string;
    text: string;
    reaction: string;
    name: string;
    timestamp: string;
  }>;
}
