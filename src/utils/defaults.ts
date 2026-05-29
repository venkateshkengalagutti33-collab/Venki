import { CustomSettings } from '../types';
import DEFAULT_COUPLE_IMAGE from '../assets/images/romantic_couple_love_1779710635532.png';
import DEFAULT_PROPOSAL_IMAGE from '../assets/images/romantic_proposal_art_1779710663074.png';

export { DEFAULT_COUPLE_IMAGE, DEFAULT_PROPOSAL_IMAGE };

export const DEFAULT_SETTINGS: CustomSettings = {
  girlfriendName: 'Sonu',
  boyfriendName: 'kummu 🧡',
  loveMessage: `welcome bangari na iduna first time try madidini heng aagaiti gottilla aadru adjust maadko kanda 🥰

Henga idru adaraga nanna love antu baala aiti every line bariyuvagu baala miss maadkondini ninna, ninna presence beku ansataiti nanaga 🥹

Bangari ninna raani tara nodkobeku, eenu kashta annode gotta aagbardu. Nanna paapu tara, nanna mummy tara, nanna cute hendti tara care maadbeku ninna. Maduve aagonu baa jaldi 🤌💗

Jaldi baaro kandamma nanna jote night maatadbaa, ninna cute voice inda kummu anbaro, baala miss maadkolatini nanna sweet muddu... 🥺

Love you muddu so much 🫂💕

Yours Forever & Ever,
kummu 🧡`,
  loveLevelComments: {
    1: 'Ouch! 1 out of 10? Are you testing my tiny heart kanda? 💔',
    2: 'Only 2? That’s below freezing temperature! So cold Sonu! ❄️',
    3: 'Three is a crowd, but we need more love than that kanda! Let’s pump those numbers! 📈',
    4: 'Four? Okay, getting warmer, but my heart is still shivering a little... 🥶',
    5: 'Five? An average response?! I assure you, kummu is a premium tier partner! 😎',
    6: 'Six! Passable, but I know deep down inside you are hiding a 10 Sonu! 😉',
    7: 'Seven! Lucky number! But we can totally do better than okay kanda! ✨',
    8: 'Eight! Now we’re talking. My cheeks are getting pink! 🥰',
    9: 'Nine! Almost perfect! Just one tiny heartbeat away from absolute max! 💓',
    10: 'Ten out of Ten!!! YES! Infinity plus one! I knew Sonu loves kummu to the moon and back! 🚀🌟💖'
  },
  irritationTextsStep1: [
    'Yenu yaaro nii andya? Nan bartaeni riri nanga yaroo andre... 😂',
    'Ayyo sonu... Huu anbeku kanda! No anthidya? Saavu yaake tease maadtiya? 😄',
    'Yaaaak beka kanda? Nim kummung No heltira? Paapa heart damage aagtaiti 🥺💔',
    'Huu anbaramma please... swalpa love madu! Ninna bittu yaru illa nanaga... kanda! 🧸💘',
    'Yaaro nii andre naanu thumba nondu hoode bangari 😭😭',
    'No option select madodu forbidden kanda! Huu anlebeku anthe namma rule-u! 🤫🔥',
    'Hing bejaar madbyad kanda, naanu rathri ella ninne dream madtini loose! 😁',
    'No button jump aagtide nodu! Eeshta bega tease madatya loo raani? 😂',
    'Access denied sonu! Huu anoke matra permission aiti ninga! 🥰🔓'
  ],
  irritationTextsStep3: [
    'Maduve aagalla yaak kanda? Ring ready aiti, nam ammang nene daughter-in-law! 💍👑',
    'Baa kanda jaldi maduve aagu, full life ninna raani thara nodkondtini! 👰‍♀️💓',
    'Hoggoo andya?! Hogalla naanu.. ninna karkondu aagodu kanda! 😁💘',
    'Aaram time kottu think madu maduke, nanne aagti gottu bangari 😎',
    'Mummyge heli complete complain madteeni sonu, download settings crash aagbidthavu! 😂',
    'Who else will get you midnight snack kanda? Nanne beku ninge gottu 🍕🤤',
    'Ninge bere devru maduve aagalla, nangu bere match illa, naave perfect double! 😍',
    'Ha ha, No button tap madoke aagalla raani, yes ishta select madu 😚'
  ],
  images: [
    DEFAULT_COUPLE_IMAGE,
    DEFAULT_PROPOSAL_IMAGE
  ],
  heartColor: '#f43f5e',
  heartAnimationSpeed: 'medium',
  backgroundTheme: 'dreamy-pink',
  step1Question: 'oyee sonu ivella kelu question alla adru kelatini Do you love me ( Huu annati nanga gottu 😎)',
  step1YesBtn: 'haa kummu full love maadtini',
  step1NoBtn: 'yaaro nii 😏',
  step3Question: 'nanna maduve aagti loo kanda ( idaku huu anta na helti nang gottu 😎)',
  step3Subtitle: 'Click YES to start nanna raani life journey with kummu!',
  step3YesBtn: 'haa kummu maduve antu ninne aagodu',
  step3NoBtn: 'aagalla hoggoo 🙂↔️',
  step4Title: 'YAAAY! We are officially together forever! 🎉✨',
  step4Subtitle: 'Love Score: {loveRating}/10 ⭐ Sonu is officially kummu\'s raani! 👑❤️'
};

export const encodeSettings = (settingsObj: CustomSettings): string => {
  try {
    const jsonStr = JSON.stringify(settingsObj);
    return btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
  } catch (e) {
    console.error('Error encoding settings', e);
    return '';
  }
};

export const decodeSettings = (base64Str: string): CustomSettings | null => {
  try {
    const jsonStr = decodeURIComponent(
      Array.prototype.map.call(atob(base64Str), (c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')
    );
    return JSON.parse(jsonStr) as CustomSettings;
  } catch (e) {
    console.error('Error decoding settings', e);
    return null;
  }
};

