import { Language } from '../types/game';

export type VoiceSpeaker = 'panda' | 'monkey';
export type VoiceCategory =
  | 'bamboo'
  | 'dodge'
  | 'dash'
  | 'booster'
  | 'monkeyChase'
  | 'gameOver'
  | 'highScore'
  | 'appear'
  | 'taunt';

export interface VoiceLineDef {
  id: string;
  speaker: VoiceSpeaker;
  category: VoiceCategory;
  bn: string;
  en: string;
  spokenBn: string;
  spokenEn: string;
  styleBn: string;
  styleEn: string;
}

const PANDA_STYLE_BN =
  'Cute, playful, energetic, cheeky young cartoon panda speaking natural colloquial Bangladeshi Bengali (Dhaka street-smart comedy vibe like funny Bangladeshi cartoon games), lively pitch swings, cheerful giggles, crisp natural Bengali pronunciation, warm and hilarious, NEVER flat or robotic.';
const PANDA_STYLE_EN =
  'Cute, playful, energetic young cartoon panda with lively comedic pitch swings, joyful enthusiasm, and expressive cartoon acting, never flat or robotic.';

const MONKEY_STYLE_BN =
  'Mischievous, teasing, raspy, dramatic cartoon monkey villain speaking natural colloquial Bangladeshi Bengali (funny Dhaka street-villain comedy vibe), exaggerated playful sneer, cheeky cackle, lively intonation and pauses, NEVER flat or robotic.';
const MONKEY_STYLE_EN =
  'Mischievous, teasing, dramatic cartoon monkey villain with playful cackles, exaggerated comedic sneer, and energetic cartoon acting, never flat or robotic.';

export const VOICE_LINES: VoiceLineDef[] = [
  // Panda - Bamboo
  {
    id: 'panda_bamboo_1',
    speaker: 'panda',
    category: 'bamboo',
    bn: 'ইয়াহু! দারুণ বাঁশ পাইছি!',
    en: 'Yahoo! Got fresh bamboo!',
    spokenBn: '<laugh> ইয়াহু! দারুণ মজার বাঁশ পাইছি রে!',
    spokenEn: '<laugh> Yahoo! Got super crunchy bamboo!',
    styleBn: PANDA_STYLE_BN,
    styleEn: PANDA_STYLE_EN,
  },
  {
    id: 'panda_bamboo_2',
    speaker: 'panda',
    category: 'bamboo',
    bn: 'আহা! কচকচে বাঁশ!',
    en: 'Ooh! Crunchy bamboo!',
    spokenBn: 'আহা... কী কচকচে মজার বাঁশ রে ভাই!',
    spokenEn: 'Ooh! That bamboo is extra crunchy!',
    styleBn: PANDA_STYLE_BN,
    styleEn: PANDA_STYLE_EN,
  },
  {
    id: 'panda_bamboo_3',
    speaker: 'panda',
    category: 'bamboo',
    bn: 'আরও বাঁশ দে!',
    en: 'Bring more bamboo!',
    spokenBn: 'এই তো চাই! আরও বাঁশ দে তো!',
    spokenEn: 'Oh yeah! Bring on more bamboo!',
    styleBn: PANDA_STYLE_BN,
    styleEn: PANDA_STYLE_EN,
  },

  // Panda - Dodge
  {
    id: 'panda_dodge_1',
    speaker: 'panda',
    category: 'dodge',
    bn: 'উফ! একটুর জন্য বাঁচলাম!',
    en: 'Whoa! Saved by an inch!',
    spokenBn: '<gasp> উফ! একটুর লাইগা বাঁইচা গেলাম!',
    spokenEn: '<gasp> Whoa! Saved by just an inch!',
    styleBn: PANDA_STYLE_BN,
    styleEn: PANDA_STYLE_EN,
  },
  {
    id: 'panda_dodge_2',
    speaker: 'panda',
    category: 'dodge',
    bn: 'হেহে! পান্ডাকে থামানো সহজ না!',
    en: 'Hehe! Can’t stop this panda!',
    spokenBn: '<laugh> হেহে! এই পান্ডারে আটকানো এতো সহজ না!',
    spokenEn: '<laugh> Hehe! Nobody stops this speedy panda!',
    styleBn: PANDA_STYLE_BN,
    styleEn: PANDA_STYLE_EN,
  },

  // Panda - Dash & Boosters
  {
    id: 'panda_dash_1',
    speaker: 'panda',
    category: 'dash',
    bn: 'সরে যা! পান্ডা এক্সপ্রেস আসছে!',
    en: 'Move aside! Panda Express!',
    spokenBn: 'এই সরে যা সব! পান্ডা এক্সপ্রেস আইসা পড়ছে! <laugh>',
    spokenEn: 'Move aside everyone! Panda Express coming through! <laugh>',
    styleBn: PANDA_STYLE_BN,
    styleEn: PANDA_STYLE_EN,
  },
  {
    id: 'panda_booster_1',
    speaker: 'panda',
    category: 'booster',
    bn: 'পাওয়ার অন! খেলা জমবে!',
    en: 'Power on! Let’s go!',
    spokenBn: 'হুহু! পাওয়ার অন! এবার আসল খেলা জমবে রে!',
    spokenEn: 'Woohoo! Power on! Now the real fun begins!',
    styleBn: PANDA_STYLE_BN,
    styleEn: PANDA_STYLE_EN,
  },

  // Panda - Monkey Chase
  {
    id: 'panda_chase_1',
    speaker: 'panda',
    category: 'monkeyChase',
    bn: 'এই বাঁদর! আমার বাঁশে হাত দিবি না!',
    en: 'Hey monkey! Hands off my bamboo!',
    spokenBn: 'এই বাঁদর মিয়া! আমার বাঁশে একদম হাত দিবি না কইলাম!',
    spokenEn: 'Hey Banor Mia! Keep your paws off my bamboo!',
    styleBn: PANDA_STYLE_BN,
    styleEn: PANDA_STYLE_EN,
  },
  {
    id: 'panda_chase_2',
    speaker: 'panda',
    category: 'monkeyChase',
    bn: 'পান্ডা ভয় পায় না! টাটা!',
    en: 'Panda never backs down! Bye!',
    spokenBn: '<laugh> পান্ডা ভয় পায় নাকি? টাটা বাঁদর ভাই!',
    spokenEn: '<laugh> This panda never gives up! Bye-bye monkey!',
    styleBn: PANDA_STYLE_BN,
    styleEn: PANDA_STYLE_EN,
  },

  // Panda - Game Over & High Score
  {
    id: 'panda_gameover_1',
    speaker: 'panda',
    category: 'gameOver',
    bn: 'ইশ রে! কী বাঁশটাই না খেলাম!',
    en: 'Ouch! Totally bamboozled!',
    spokenBn: '<gasp> ইশ রে... কী মোটা বাঁশটাই না খাইলাম রে মামা!',
    spokenEn: '<gasp> Ouch... I just got totally bamboozled!',
    styleBn: PANDA_STYLE_BN,
    styleEn: PANDA_STYLE_EN,
  },
  {
    id: 'panda_gameover_2',
    speaker: 'panda',
    category: 'gameOver',
    bn: 'আহ! নাকটা গেল রে!',
    en: 'Bonk! Right on my nose!',
    spokenBn: 'আউচ! ওরে বাবা রে... আমার নাকটা গেল রে!',
    spokenEn: 'Ow! Oh boy... right on my poor little nose!',
    styleBn: PANDA_STYLE_BN,
    styleEn: PANDA_STYLE_EN,
  },
  {
    id: 'panda_highscore_1',
    speaker: 'panda',
    category: 'highScore',
    bn: 'হুররে! আমিই বাঁশবনের চ্যাম্পিয়ন!',
    en: 'Hurray! I am the Champion!',
    spokenBn: '<laugh> হুররে! দেখে যা, আমিই বাঁশবনের আসল চ্যাম্পিয়ন!',
    spokenEn: '<laugh> Hurray! Look at me, I am the Bamboo Champion!',
    styleBn: PANDA_STYLE_BN,
    styleEn: PANDA_STYLE_EN,
  },

  // Banor Mia (Monkey Villain) - Appear
  {
    id: 'monkey_appear_1',
    speaker: 'monkey',
    category: 'appear',
    bn: 'এই পান্ডা! দাঁড়া বলছি!',
    en: 'Hey Panda! Stop right there!',
    spokenBn: 'এই গোলগাল পান্ডা! দাঁড়া কইতাছি, পালাস কই!',
    spokenEn: 'Hey chubby Panda! Stop right there, where are you running!',
    styleBn: MONKEY_STYLE_BN,
    styleEn: MONKEY_STYLE_EN,
  },
  {
    id: 'monkey_appear_2',
    speaker: 'monkey',
    category: 'appear',
    bn: 'বাঁশ নিয়া পালাস কই? ধরলাম বলে!',
    en: 'Running with that bamboo? Caught you!',
    spokenBn: '<laugh> ওরে বাঁশ-চোর! বাঁশ নিয়া পালাস কই? ধরলাম বলে!',
    spokenEn: '<laugh> Hey bamboo thief! Running with my bamboo? Gotcha!',
    styleBn: MONKEY_STYLE_BN,
    styleEn: MONKEY_STYLE_EN,
  },
  {
    id: 'monkey_appear_3',
    speaker: 'monkey',
    category: 'appear',
    bn: 'ধরতে পারলে ধর! হিহিহি!',
    en: 'Catch me if you can! Hehehe!',
    spokenBn: '<laugh> এই যে আমি! পারলে আটকায় দেখা, হিহিহি!',
    spokenEn: '<laugh> Here I come! Catch me if you can, hehehe!',
    styleBn: MONKEY_STYLE_BN,
    styleEn: MONKEY_STYLE_EN,
  },

  // Banor Mia - Taunt
  {
    id: 'monkey_taunt_1',
    speaker: 'monkey',
    category: 'taunt',
    bn: 'সব বাঁশ আমার হবে, বুঝলি!',
    en: 'All that bamboo is mine!',
    spokenBn: 'আজকে সব কয়টা বাঁশ আমার হবে, বুঝলি পান্ডা? <laugh>',
    spokenEn: 'Every single bamboo will be mine today, Panda! <laugh>',
    styleBn: MONKEY_STYLE_BN,
    styleEn: MONKEY_STYLE_EN,
  },
  {
    id: 'monkey_taunt_2',
    speaker: 'monkey',
    category: 'taunt',
    bn: 'এই এলাম বলে! হাত বাড়াচ্ছি!',
    en: 'Right behind you! Almost got you!',
    spokenBn: 'এই যে পিছনে! হাত বাড়াইলেই ধরে ফেলব রে!',
    spokenEn: 'Right behind you! One more step and you are mine!',
    styleBn: MONKEY_STYLE_BN,
    styleEn: MONKEY_STYLE_EN,
  },
];

export const VOICE_LINES_MAP = new Map<string, VoiceLineDef>(
  VOICE_LINES.map((line) => [line.id, line])
);

export function getLinesFor(speaker: VoiceSpeaker, category: VoiceCategory): VoiceLineDef[] {
  return VOICE_LINES.filter((l) => l.speaker === speaker && l.category === category);
}

export function getVoiceScript(line: VoiceLineDef, lang: Language): { text: string; style: string } {
  return lang === 'bn'
    ? { text: line.spokenBn, style: line.styleBn }
    : { text: line.spokenEn, style: line.styleEn };
}
