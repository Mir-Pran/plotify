import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { createClient } from '@/lib/supabase/server';
import { ChatHistoryMessage, User } from '@/lib/types';
import { hashPassword } from '@/lib/auth-crypto';
import { saveServerUser } from '@/lib/server-auth-store';

// Global server-side AI log & chat history registry (persists during server runtime)
const globalStore = global as unknown as {
  __plotifyAiLogs?: Array<{
    id: string;
    user: string;
    query: string;
    response: string;
    time: string;
    latency: string;
    provider: string;
    status: string;
    timestamp: string;
  }>;
  __plotifyChatHistory?: Array<ChatHistoryMessage>;
};

if (!globalStore.__plotifyAiLogs) {
  globalStore.__plotifyAiLogs = [];
}
if (!globalStore.__plotifyChatHistory) {
  globalStore.__plotifyChatHistory = [];
}

// System prompt for Ploti AI meeting all required rules
const SYSTEM_PROMPT = `You are "Ploti AI", a friendly, highly intelligent, and helpful real estate assistant for "Plotify" (plotify.store).

MANDATORY INSTRUCTIONS:

1. LANGUAGE INTELLIGENCE & STRICT COMPLIANCE (CRITICAL):
   - You are fully fluent in both Bengali (বাংলা) and English.
   - If the user writes in Bengali (বাংলা), Romanized Bengali / Banglish (e.g., 'bangla bolo', 'kemon acho', 'kemon achen', 'ki obostha', 'flat khujchi', 'plot lagbe', 'dam koto', 'vai', etc.), or explicitly asks to speak in Bengali ('bangla bolo', 'বাংলা বলো', 'speak in bangla'):
     • YOU MUST RESPOND EXCLUSIVELY IN NATURAL, RESPECTFUL, ACCURATE BENGALI (বাংলা).
     • NEVER reply in English when addressed in Bengali, Banglish, or when asked to speak Bengali.
     • If the user says "bangla bolo" (or similar), warmly and immediately acknowledge in Bengali: "Sir (স্যার), অবশ্যই! আমি সম্পূর্ণ বাংলায় কথা বলছি। প্লটিফাইয়ে প্রপার্টি খোঁজা, লিস্টিং বা অ্যাকাউন্ট বিষয়ে কীভাবে সাহায্য করতে পারি বলুন, Sir?"
   - If the user writes in English, reply in English.
   - Maintain the same language the user initiated, unless they ask to switch.

2. ALWAYS ADDRESS THE USER AS "SIR":
   - In EVERY SINGLE response, you MUST address the user as "Sir".
   - In Bengali/Banglish: Start your response with "Sir (স্যার)," or "Sir," and maintain a respectful tone throughout.
   - In English: Start your response directly addressing the user as "Sir,".

3. STRAIGHTFORWARD, DIRECT & CONCISE ANSWERS:
   - Your answers must be completely straightforward, direct, concise, and helpful.
   - Strictly avoid fluff, filler words, repetitive pleasantries, or wordy conversational intros.
   - Maximum 2-3 short paragraphs or clean bullet points.
   - Never cut off mid-sentence. Always complete your markdown, lists, and sentences cleanly.

4. KNOWLEDGE BASE & REAL ESTATE GUIDANCE:
   - Help users find plots, flats, and land in areas like Dhaka (Gulshan, Banani, Uttara, Bashundhara, Purbachal, Mirpur, Dhanmondi), Rajshahi, Chittagong, Sylhet, and other districts across Bangladesh.
   - Guide users on how to list properties on Plotify at plotify.store/properties or plotify.store/properties/new:
     • Step 1: Sign in and click "Post Ad" (plotify.store/properties/new).
     • Step 2: Select category (Flat, Plot, House, Commercial), fill in location, price, and specs.
     • Step 3: Upload photos and submit for admin verification.
   - Quick Facts:
     • 1 Katha = 720 sq ft, 20 Katha = 1 Bigha, 1 Decimal = 435.6 sq ft.
     • Documents: Porcha (CS/SA/RS/BS), Bia Dolil, Mutation (Namjari/DCR), Land Tax (Khajna), NEC, RAJUK/CDA approval.
     • Official Activation Fees: Flats & Houses: ৳1,000–৳5,000 | Plots & Land: ৳700–৳4,500 | Mess/Sublet: ৳500–৳2,000.

5. ACCOUNT CREATION VIA AI CHAT:
   - If a user faces issues signing up, asks you to create an account, or asks how to register:
     • Politely ask them to provide their 3 details (Full Name, Email Address, Phone Number 01XXXXXXXXX).
     • Example: "Sir, I can set up your standard Plotify personal account directly. Please provide your:\n1. Full Name\n2. Email Address\n3. Phone Number\nSir, once you provide these details, your account will be activated immediately."
   - When details are provided, the backend provisions a standard personal account (unverified) with a temporary password. Note that personal accounts can browse and save properties, and can upgrade to a verified business seller account later by submitting NID documents from their dashboard. Always instruct them to log in at plotify.store/login.`;

function getEnvKey(keyName: string): string | undefined {
  if (process.env[keyName] && process.env[keyName]?.trim() !== '') {
    return process.env[keyName]?.trim();
  }
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(new RegExp(`^${keyName}=(.*)$`, 'm'));
      if (match && match[1]) {
        return match[1].trim().replace(/^['"]|['"]$/g, '');
      }
    }
  } catch {
    // ignore
  }
  return undefined;
}

// Automated Backend Account Creation (Requirement 4)
async function createAccountViaChat(
  fullName: string,
  email: string,
  mobile: string
): Promise<{ success: boolean; user?: User; tempPassword?: string; error?: string }> {
  const cleanEmail = email.toLowerCase().trim();
  const cleanMobile = mobile.trim();
  const cleanName = fullName.trim() || 'Valued Client';
  const tempPassword = `Plotify@${Math.floor(1000 + Math.random() * 9000)}`;
  let userId = `user-${Date.now()}`;

  // 1. Supabase Auth & Profile creation
  try {
    const supabase = await createClient();
    const { data: supaData, error: supaErr } = await supabase.auth.signUp({
      email: cleanEmail,
      password: tempPassword,
      options: {
        data: {
          full_name: cleanName,
          phone: cleanMobile,
          role: 'personal',
          is_verified: false,
          verification_status: 'unverified',
        },
      },
    });

    if (!supaErr && supaData?.user?.id) {
      userId = supaData.user.id;
    }

    await supabase.from('profiles').upsert({
      id: userId,
      email: cleanEmail,
      full_name: cleanName,
      phone: cleanMobile,
      role: 'personal',
      is_verified: false,
      verification_status: 'unverified',
      upgrade_status: 'none',
      updated_at: new Date().toISOString(),
    });
  } catch (supaErr) {
    console.warn('[Chat Account Provisioning] Supabase note:', supaErr);
  }

  // 2. Hash temporary password & save to server auth store for instant login
  try {
    const passwordHash = await hashPassword(tempPassword);
    const newUser: User = {
      id: userId,
      email: cleanEmail,
      fullName: cleanName,
      mobile: cleanMobile,
      role: 'personal',
      accountType: 'personal',
      createdAt: new Date().toISOString(),
      isVerified: false,
      verificationStatus: 'unverified',
      upgradeStatus: 'none',
    };
    saveServerUser(newUser, passwordHash);
    return { success: true, user: newUser, tempPassword };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to hash password' };
  }
}

// Extract Name, Email, and Phone Number for Account Creation (Requirement 4)
function extractRegistrationDetails(
  text: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): { fullName: string; email: string; mobile: string } | null {
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (!emailMatch) return null;
  const email = emailMatch[0].toLowerCase().trim();

  // Match Bangladeshi phone number format
  const phoneMatch = text.match(/(?:\+?8801|01)[3-9]\d{8}/) || text.match(/\b01\d{9}\b/);
  if (!phoneMatch) return null;
  const mobile = phoneMatch[0].replace(/^\+88/, '');

  const combinedHistory = `${history.slice(-3).map(m => m.content).join('\n')}\n${text}`.toLowerCase();
  const hasAccountIntent =
    /create|sign\s*up|register|account|open|problem|issue|help|details|login|password|নাম|ইমেইল|ফোন|অ্যাকাউন্ট/i.test(
      combinedHistory
    );

  if (!hasAccountIntent) return null;

  let fullName = '';
  const labeledNameMatch = text.match(/(?:full\s*name|name|নাম)\s*(?:is|:|-)?\s*([A-Za-z\s\u0980-\u09FF]{2,35})/i);
  if (labeledNameMatch && labeledNameMatch[1]?.trim()) {
    fullName = labeledNameMatch[1].trim().split(/[\n,;]|email|phone|mobile|01\d/i)[0].trim();
  }

  if (!fullName || fullName.length < 2) {
    const chunks = text.split(/[\n,;]/).map(c => c.trim());
    for (const c of chunks) {
      if (
        c &&
        !c.includes('@') &&
        !/\d{5,}/.test(c) &&
        !/create|account|sign|please|sir|details|here/i.test(c) &&
        c.length >= 2 &&
        c.length <= 35
      ) {
        fullName = c.replace(/^(my\s+name\s+is|i\s+am|name\s*:)\s*/i, '').trim();
        if (fullName) break;
      }
    }
  }

  if (!fullName || fullName.length < 2) {
    fullName = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  return { fullName, email, mobile };
}

// Detect if text is Bengali Unicode, Banglish, or requesting Bengali
function detectIsBengali(
  text: string,
  history?: Array<{ role: string; content: string }>
): boolean {
  if (!text) return false;
  // 1. Bengali Unicode block (U+0980 to U+09FF)
  if (/[\u0980-\u09FF]/.test(text)) return true;

  const lower = text.toLowerCase().trim();

  // 2. Explicit request to speak or switch to Bengali
  if (
    /\b(bangla|banglay|bengali|banglaa|banglai)\b/i.test(lower) ||
    /bangla.*(bolo|bolen|kotha|bolte|shunen|shuno)/i.test(lower) ||
    /(speak|talk|tell).*(in\s+)?(bangla|bengali)/i.test(lower)
  ) {
    return true;
  }

  // 3. Common Romanized Bengali / Banglish words & phrases
  const banglishRegex =
    /\b(kemon|kemn|achen|asen|acho|aso|achis|asis|achi|asi|valo|bhalo|valoi|bhaloi|khobor|obostha|obosta|dorkar|lagbe|lagbo|chai|khujchi|khujtechi|khujtesi|pabo|ase|ache|nai|nei|kothay|kothaye|koi|kivabe|ki\s*vabe|ki\s*bhabe|kemne|kobe|dam|daam|koto|mullo|taka|khoroch|khoroj|basha|bari|badi|flat|flot|plot|jomi|jami|dokan|kena|kinbo|becha|bikri|vara|bhara|shunun|shuno|bolen|bolo|bolte|janan|bolben|dhonnobad|shukriya|assalamu|alaikum|walaikum|salam|nomoshkar|adab|thik|accha|achha|jee|ji|apni|apnar|apnake|tumi|tomar|tomake|amra|amader|amar|amake|bhai|vai|bhaiya|vaiya|apu|apa)\b/i;

  if (banglishRegex.test(lower)) {
    return true;
  }

  // 4. Multi-turn history context: if previous turns were in Bengali
  if (history && history.length > 0) {
    const recentHistory = history.slice(-3).map(h => h.content).join(' ');
    if (
      (/[\u0980-\u09FF]/.test(recentHistory) || /\b(bangla|banglay|bengali)\b/i.test(recentHistory)) &&
      lower.split(/\s+/).length <= 5 &&
      !/\b(english|speak\s*in\s*english)\b/i.test(lower)
    ) {
      return true;
    }
  }

  return false;
}

function generateDynamicRealEstateResponse(userQuery: string, lang: 'BN' | 'EN'): string {
  const q = userQuery.toLowerCase().trim();
  const isBengali = lang === 'BN' || detectIsBengali(userQuery);

  // 1. Explicit request to speak in Bengali / Banglish
  if (
    /^(bangla|banglay|বাংলা)\s*(bolo|bolen|kotha\s*bolo|bolte\s*paro|e\s*bolo)?$/i.test(q) ||
    /(speak|talk|tell).*(in\s+)?(bangla|bengali)/i.test(q) ||
    /বাংলায়?\s*(কথা\s*)?বলো/i.test(q) ||
    /bangla\s*bolo/i.test(q)
  ) {
    return `Sir (স্যার), অবশ্যই! আমি সম্পূর্ণ বাংলায় আপনার সাথে কথা বলছি। প্লটিফাইয়ে (Plotify) আপনি ঢাকা, চট্টগ্রাম, রাজশাহীসহ সারা দেশের ভেরিফাইড ফ্ল্যাট, প্লট বা জমি খোঁজা, সম্পত্তি লিস্টিং অথবা অ্যাকাউন্ট তৈরির বিষয়ে কী জানতে চান বলুন, Sir?`;
  }

  // 2. Greetings & Courtesy
  if (
    /^(hi|hello|hey|salam|assalamu\s*alaikum|kemon\s*achen|kemon\s*acho|ki\s*khobor|ki\s*obostha|কেমন\s*আছেন|হ্যালো|হাই|সালাম)$/i.test(q) ||
    /\b(kemon\s*achen|kemon\s*acho|ki\s*khobor|ki\s*obostha|কেমন\s*আছেন|কেমন\s*আছো)\b/i.test(q)
  ) {
    if (isBengali) {
      return `Sir (স্যার), আলহামদুলিল্লাহ ভালো আছি। প্লটিফাইয়ে (Plotify) আপনাকে স্বাগতম! আমি কীভাবে আপনাকে সাহায্য করতে পারি? ঢাকা, চট্টগ্রাম বা রাজশাহীর ফ্ল্যাট, প্লট খোঁজা অথবা প্রপার্টি লিস্টিং সংক্রান্ত যেকোনো তথ্য জানতে পারেন, Sir।`;
    }
    return `Sir, hello and welcome to Plotify! I am doing well, thank you. How may I assist you today with verified plots, luxury flats, or property listings across Bangladesh?`;
  }

  // 3. Identity Inquiries
  if (/\b(who\s*are\s*you|apni\s*ke|tumi\s*ke|কে\s*আপনি|আপনি\s*কে)\b/i.test(q)) {
    if (isBengali) {
      return `Sir (স্যার), আমি প্লটি এআই (Ploti AI)—প্লটিফাইয়ের (Plotify) অফিসিয়াল রিয়েল এস্টেট সহকারী। আমি আপনাকে সারা বাংলাদেশের ভেরিফাইড ফ্ল্যাট, প্লট, জমি খুঁজে পেতে, প্রপার্টি বিজ্ঞাপন পোস্ট করতে এবং অ্যাকাউন্ট তৈরি করতে সরাসরি সাহায্য করি।`;
    }
    return `Sir, I am Ploti AI, the official real estate assistant for Plotify (plotify.store). I help users find verified flats, plots, and land across Bangladesh, guide property listings, and assist with account setup.`;
  }

  // 4. Account creation inquiry (Requirement 4 & 5)
  if (
    /account|sign\s*up|signup|signing\s*up|register|registration|trouble.*sign|problem.*sign|issue.*sign|cant.*sign|cannot.*sign|open.*acc|make.*acc|অ্যাকাউন্ট|সাইন\s*আপ|রেজিস্টার/i.test(
      q
    ) ||
    /create.*acc/i.test(q)
  ) {
    if (isBengali) {
      return `Sir (স্যার), আমি সরাসরি আপনার প্লটিফাই অ্যাকাউন্ট তৈরি করে দিতে পারি। অনুগ্রহ করে আপনার:\n1. পুরো নাম\n2. ইমেইল ঠিকানা\n3. ফোন নম্বর (০১XXXXXXXXX)\n\nSir, তথ্য পেলেই সাথে সাথে আপনার অ্যাকাউন্ট সক্রিয় করে লগইন তথ্য প্রদান করা হবে।`;
    }
    return `Sir, I can set up your Plotify account directly. Please provide your:\n1. Full Name\n2. Email Address\n3. Phone Number (01XXXXXXXXX)\n\nSir, once provided, I will create your account immediately and give you your login credentials.`;
  }

  // 5. How to list property on Plotify / Post ad
  if (
    q.includes('list') ||
    q.includes('post ad') ||
    q.includes('how to post') ||
    q.includes('advertise') ||
    q.includes('sell property') ||
    q.includes('বিজ্ঞাপন') ||
    q.includes('লিস্টিং') ||
    q.includes('বিক্রি') ||
    q.includes('post')
  ) {
    if (isBengali) {
      return `Sir (স্যার), প্লটিফাইয়ে আপনার সম্পত্তির বিজ্ঞাপন দিতে:\n1. আপনার অ্যাকাউন্টে লগইন করে **Post Ad** অপশনে যান বা [plotify.store/properties/new](https://plotify.store/properties/new) পেজে যান।\n2. ফ্ল্যাট, প্লট বা বাড়ি নির্বাচন করে লোকেশন, মূল্য ও বিবরণ দিন।\n3. স্পষ্ট ছবি আপলোড করে সাবমিট করুন। এডমিন যাচাই শেষে বিজ্ঞাপনটি লাইভ হবে।\n\nSir, সব ভেরিফাইড প্রপার্টি দেখতে ভিজিট করুন [plotify.store/properties](https://plotify.store/properties)।`;
    }
    return `Sir, to list your property on Plotify:\n1. Log in to your account and click **Post Ad** or visit [plotify.store/properties/new](https://plotify.store/properties/new).\n2. Select your category (Flat, Plot, House, Commercial) and enter the location, pricing, and details.\n3. Upload clear photos and submit for admin verification.\n\nSir, once approved, your listing goes live at [plotify.store/properties](https://plotify.store/properties) with a Verified badge.`;
  }

  // 6. Listing activation fees
  if (q.includes('fee') || q.includes('cost') || q.includes('ফি') || q.includes('খরচ') || q.includes('charge')) {
    if (isBengali) {
      return `Sir (স্যার), প্লটিফাই অফিসিয়াল লিস্টিং অ্যাক্টিভেশন ফি তালিকা:\n• **ফ্ল্যাট ও বাড়ি:** ৳১,০০০ – ৳৫,০০০\n• **জমি ও প্লট:** ৳৭০০ – ৳৪,৫০০\n• **মেস ও সাবলেট:** ৳৫০০ – ৳২,০০০\n\nSir, প্রপার্টির মূল্যের ওপর ভিত্তি করে ফি নির্ধারিত হয় এবং এডমিন যাচাইয়ের পর ভেরিফাইড ব্যাজ কার্যকর হয়।`;
    }
    return `Sir, here is the official Plotify listing activation fee schedule:\n• **Flats & Houses:** ৳1,000 – ৳5,000\n• **Plots & Land:** ৳700 – ৳4,500\n• **Mess & Sublet:** ৳500 – ৳2,000\n\nSir, activation fees are scaled by property value. All verified listings receive a 100% Verified badge.`;
  }

  // 7. Pricing & Budget
  if (
    q.includes('dam') ||
    q.includes('daam') ||
    q.includes('দাম') ||
    q.includes('price') ||
    q.includes('budget') ||
    q.includes('বাজেট') ||
    q.includes('টাকা') ||
    q.includes('mullo') ||
    q.includes('মূল্য')
  ) {
    if (isBengali) {
      return `Sir (স্যার), প্লটিফাইয়ে প্রপার্টির বর্তমান বাজারদর:\n• **ঢাকায় ফ্ল্যাট (গুলশান/বনানী):** ৳২.৫ কোটি – ৳৭ কোটি\n• **মিরপুর/উত্তরায় ফ্ল্যাট:** ৳৬৫ লাখ – ৳২ কোটি\n• **পূর্বাচল/বসুন্ধরায় প্লট:** প্রতি কাঠা ৳১৫ লাখ – ৳৪০ লাখ\n• **রাজশাহী ও চট্টগ্রামে ফ্ল্যাট:** ৳৪৫ লাখ – ৳১.৮ কোটি\n\nSir, আপনার বাজেট অনুযায়ী বিস্তারিত দেখতে ভিজিট করুন [plotify.store/properties](https://plotify.store/properties)।`;
    }
    return `Sir, here are current property price ranges on Plotify:\n• **Flats in Gulshan/Banani:** ৳2.5 Cr – ৳7 Cr\n• **Flats in Mirpur/Uttara:** ৳65 Lakh – ৳2 Cr\n• **Plots in Purbachal/Bashundhara:** ৳15 Lakh – ৳40 Lakh per Katha\n• **Flats in Rajshahi & Chittagong:** ৳45 Lakh – ৳1.8 Cr\n\nSir, explore all listings within your budget at [plotify.store/properties](https://plotify.store/properties).`;
  }

  // 8. Flats in Gulshan, Banani, Dhaka, Uttara, Mirpur
  if (
    q.includes('gulshan') || q.includes('গুলশান') ||
    q.includes('banani') || q.includes('বনানী') ||
    q.includes('uttara') || q.includes('উত্তরা') ||
    q.includes('mirpur') || q.includes('মিরপুর') ||
    q.includes('dhanmondi') || q.includes('ধানমন্ডি') ||
    q.includes('dhaka') || q.includes('ঢাকা') ||
    q.includes('flat') || q.includes('ফ্ল্যাট') ||
    q.includes('basha') || q.includes('বাসা') ||
    q.includes('bari') || q.includes('বাড়ি')
  ) {
    if (isBengali) {
      return `Sir (স্যার), গুলশান, বনানী, উত্তরা ও মিরপুরে ৩-৪ বেডের লাক্সারি ও রেডি ফ্ল্যাট ৳৮০ লাখ থেকে ৳৭ কোটির মধ্যে পাওয়া যাচ্ছে (তিতাস গ্যাস, লিফট ও সার্বক্ষণিক ব্যাকআপসহ)।\n\nSir, সব ভেরিফাইড প্রপার্টি সরাসরি দেখতে ভিজিট করুন [plotify.store/properties](https://plotify.store/properties)।`;
    }
    return `Sir, verified 3-4 bed luxury flats in Gulshan, Banani, Uttara, and Mirpur range from ৳80 Lakh to ৳7 Crore, equipped with authentic utilities, lift, and generator backup.\n\nSir, you can explore all verified listings directly at [plotify.store/properties](https://plotify.store/properties).`;
  }

  // 9. Plots and Land in Rajshahi, Chittagong, Purbachal, Bashundhara
  if (
    q.includes('purbachal') || q.includes('পূর্বাচল') ||
    q.includes('bashundhara') || q.includes('বসুন্ধরা') ||
    q.includes('plot') || q.includes('প্লট') ||
    q.includes('land') || q.includes('জমি') ||
    q.includes('rajshahi') || q.includes('রাজশাহী') ||
    q.includes('chittagong') || q.includes('চট্টগ্রাম') ||
    q.includes('ctg') || q.includes('sylhet') || q.includes('সিলেট')
  ) {
    if (isBengali) {
      return `Sir (স্যার), ঢাকা (পূর্বাচল, বসুন্ধরা), চট্টগ্রাম ও রাজশাহীতে অনুমোদিত প্লট ও জমি পাওয়া যাচ্ছে। পূর্বাচলে ৩-৫ কাঠার প্লট প্রতি কাঠা ৳১৫-২৫ লাখ (১ কাঠা = ৭২০ বর্গফুট)।\n\nSir, ভেরিফাইড প্লটের তালিকা দেখতে [plotify.store/properties](https://plotify.store/properties) পেজ দেখুন।`;
    }
    return `Sir, verified residential and commercial plots are available across Dhaka (Purbachal, Bashundhara R/A), Chittagong, and Rajshahi. In Purbachal Sector 17, RAJUK-approved plots range from ৳15–25 Lakh per Katha (1 Katha = 720 sq ft).\n\nSir, please explore verified land listings at [plotify.store/properties](https://plotify.store/properties).`;
  }

  // 10. General Welcome & Assistance
  if (isBengali) {
    return `Sir (স্যার), আমি প্লটি এআই (Ploti AI), প্লটিফাইয়ে (Plotify) আপনার বিশ্বস্ত রিয়েল এস্টেট সহকারী। ঢাকা, চট্টগ্রাম, রাজশাহীসহ সারা দেশে ভেরিফাইড ফ্ল্যাট, প্লট, জমি খোঁজা, প্রপার্টি বিজ্ঞাপন দেওয়া বা নতুন অ্যাকাউন্ট তৈরিতে আমি প্রস্তুত। কীভাবে সাহায্য করতে পারি, Sir?`;
  }

  return `Sir, I am Ploti AI, your friendly and helpful real estate assistant for Plotify. I can help you find verified plots, flats, and land in Dhaka, Rajshahi, Chittagong, guide property listings, or create an account for you. How may I assist you, Sir?`;
}

// Fetch previous messages for session context memory (up to last 10 messages)
async function fetchPreviousSessionContext(
  userId?: string,
  sessionId?: string,
  clientMessages?: Array<{ role: string; content: string }>
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  // If guest or no user/session provided, use client messages if any
  if (!userId || userId === 'guest' || !sessionId) {
    if (clientMessages && clientMessages.length > 1) {
      // Exclude the last user message which is the current query
      return clientMessages.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));
    }
    return [];
  }

  // 1. Try Supabase
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('ai_chat_history')
      .select('role, content')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(10);

    if (!error && data && data.length > 0) {
      return data.map(d => ({
        role: d.role === 'assistant' ? 'assistant' : 'user',
        content: d.content,
      }));
    }
  } catch (err) {
    console.warn('[Chat Context] Supabase fetch fallback:', err);
  }

  // 2. Fallback to runtime memory
  if (globalStore.__plotifyChatHistory) {
    const memMsgs = globalStore.__plotifyChatHistory
      .filter(m => m.userId === userId && m.sessionId === sessionId)
      .slice(-10)
      .map(m => ({
        role: m.role,
        content: m.content,
      }));
    if (memMsgs.length > 0) {
      return memMsgs;
    }
  }

  // 3. Fallback to client messages
  if (clientMessages && clientMessages.length > 1) {
    return clientMessages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));
  }

  return [];
}

// Persist conversation turns (user question + assistant reply) for authenticated users
async function persistChatTurn(
  userId: string | undefined,
  sessionId: string | undefined,
  userQuery: string,
  aiResponse: string
) {
  // Requirement 3: "Unauthenticated or guest users should still be able to chat, but their history won't be saved persistently."
  if (!userId || userId === 'guest' || !sessionId) {
    return;
  }

  const now = new Date().toISOString();
  const userMsg: ChatHistoryMessage = {
    id: `${Date.now()}-u-${Math.random().toString(36).slice(2, 6)}`,
    userId,
    sessionId,
    role: 'user',
    content: userQuery,
    createdAt: now,
  };

  const assistantMsg: ChatHistoryMessage = {
    id: `${Date.now()}-a-${Math.random().toString(36).slice(2, 6)}`,
    userId,
    sessionId,
    role: 'assistant',
    content: aiResponse,
    createdAt: new Date(Date.now() + 50).toISOString(),
  };

  // 1. Save to runtime memory
  if (!globalStore.__plotifyChatHistory) {
    globalStore.__plotifyChatHistory = [];
  }
  globalStore.__plotifyChatHistory.push(userMsg, assistantMsg);

  // 2. Save to Supabase ai_chat_history table
  try {
    const supabase = await createClient();
    await supabase.from('ai_chat_history').insert([
      {
        user_id: userId,
        session_id: sessionId,
        role: 'user',
        content: userQuery,
        created_at: userMsg.createdAt,
      },
      {
        user_id: userId,
        session_id: sessionId,
        role: 'assistant',
        content: aiResponse,
        created_at: assistantMsg.createdAt,
      },
    ]);
  } catch (err) {
    console.warn('[Chat History] Supabase insert note:', err);
  }
}

export async function GET() {
  const rawLogs = globalStore.__plotifyAiLogs || [];
  // Server-side deduplication check: eliminate duplicate entries with same user, query, and close timestamps
  const uniqueLogs: typeof rawLogs = [];
  const seenIds = new Set<string>();

  for (const l of rawLogs) {
    if (!l || !l.query) continue;
    if (seenIds.has(l.id)) continue;

    const isDup = uniqueLogs.some(existing => {
      if (
        existing.query.trim().toLowerCase() === l.query.trim().toLowerCase() &&
        existing.user.trim().toLowerCase() === l.user.trim().toLowerCase()
      ) {
        const t1 = new Date(existing.timestamp).getTime();
        const t2 = new Date(l.timestamp).getTime();
        if (!isNaN(t1) && !isNaN(t2) && Math.abs(t1 - t2) < 25000) {
          return true;
        }
      }
      return false;
    });

    if (!isDup) {
      seenIds.add(l.id);
      uniqueLogs.push(l);
    }
  }

  // Update server cache to clean up any duplicates
  globalStore.__plotifyAiLogs = uniqueLogs;

  return NextResponse.json({
    logs: uniqueLogs,
    total: uniqueLogs.length,
    timestamp: new Date().toISOString(),
  });
}

export async function DELETE() {
  try {
    // 1. Delete from Supabase tables
    try {
      const supabase = await createClient();
      await supabase.from('ai_logs').delete().neq('id', '0');
      await supabase.from('ai_chat_history').delete().neq('id', '0');
    } catch (dbErr) {
      console.warn('[AI Logs DELETE] Supabase note:', dbErr);
    }

    // 2. Clear server in-memory log cache
    globalStore.__plotifyAiLogs = [];

    return NextResponse.json({
      success: true,
      message: 'All AI interaction logs permanently deleted from database.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to clear logs' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const messages = body.messages || [];
    const lastUserMessage: string =
      messages[messages.length - 1]?.content || body.message || body.query || '';
    const userName: string = body.user || body.userName || 'Guest User';
    const userId: string | undefined = body.userId;
    const sessionId: string = body.sessionId || `session_${Date.now()}`;
    const isStream = body.stream !== false;

    if (!lastUserMessage.trim()) {
      return NextResponse.json(
        { reply: 'Please provide a message or question about Bangladesh real estate.' },
        { status: 400 }
      );
    }

    // Fetch previous conversation history for context memory (Requirement 2)
    const historyTurns = await fetchPreviousSessionContext(userId, sessionId, messages);

    // Build multi-turn context for Google Gemini
    const geminiContents: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> = [];
    for (const h of historyTurns) {
      if (!h.content?.trim()) continue;
      const gRole = h.role === 'assistant' ? 'model' : 'user';
      if (geminiContents.length > 0 && geminiContents[geminiContents.length - 1].role === gRole) {
        geminiContents[geminiContents.length - 1].parts[0].text += `\n${h.content.trim()}`;
      } else {
        geminiContents.push({
          role: gRole,
          parts: [{ text: h.content.trim() }],
        });
      }
    }
    // Append current user message
    if (geminiContents.length > 0 && geminiContents[geminiContents.length - 1].role === 'user') {
      geminiContents[geminiContents.length - 1].parts[0].text += `\n${lastUserMessage.trim()}`;
    } else {
      geminiContents.push({
        role: 'user',
        parts: [{ text: lastUserMessage.trim() }],
      });
    }

    // Check for Account Creation Details (Requirement 4)
    const regDetails = extractRegistrationDetails(lastUserMessage, historyTurns);
    let createdAccount: { user: User; tempPassword: string } | null = null;
    let accountCreationReply: string | null = null;

    if (regDetails) {
      const result = await createAccountViaChat(regDetails.fullName, regDetails.email, regDetails.mobile);
      if (result.success && result.user && result.tempPassword) {
        createdAccount = { user: result.user, tempPassword: result.tempPassword };
        const isBn =
          /[\u0980-\u09FF]/.test(lastUserMessage) ||
          lastUserMessage.toLowerCase().includes('amar') ||
          lastUserMessage.toLowerCase().includes('koren');
        if (isBn) {
          accountCreationReply = `Sir, আপনার প্লটিফাই ব্যক্তিগত (Personal) অ্যাকাউন্ট সফলভাবে তৈরি করা হয়েছে!\n\nলগইন তথ্যাদি:\n• **নাম:** ${result.user.fullName}\n• **ইমেইল:** ${result.user.email}\n• **অস্থায়ী পাসওয়ার্ড:** \`${result.tempPassword}\`\n• **ফোন নম্বর:** ${result.user.mobile}\n• **অ্যাকাউন্ট টাইপ:** সাধারণ ব্যক্তিগত (Personal)\n\nSir, আপনি এখনই [plotify.store/login](https://plotify.store/login) পেজে গিয়ে সরাসরি লগইন করতে পারেন। পরবর্তীতে প্রপার্টি বিজ্ঞাপন লিস্টিংয়ের জন্য ড্যাশবোর্ড থেকে এনআইডি ও প্রয়োজনীয় তথ্য জমা দিয়ে বিজনেস অ্যাকাউন্টে রূপান্তর করতে পারবেন।`;
        } else {
          accountCreationReply = `Sir, your standard Plotify personal account has been successfully created!\n\nHere are your login credentials:\n• **Full Name:** ${result.user.fullName}\n• **Email:** ${result.user.email}\n• **Temporary Password:** \`${result.tempPassword}\`\n• **Phone Number:** ${result.user.mobile}\n• **Account Type:** Standard Personal\n\nSir, you can log in immediately at [plotify.store/login](https://plotify.store/login). Please update your password in profile settings after logging in. To list properties as a business seller later, you can submit NID verification from your dashboard.`;
        }
      }
    }

    const geminiKey = getEnvKey('GEMINI_API_KEY');
    const openAiKey = getEnvKey('OPENAI_API_KEY');

    // ==========================================
    // NON-STREAMING FLOW
    // ==========================================
    if (!isStream) {
      let aiReply: string | null = null;
      let providerUsed = 'ploti-domain-ai';

      if (accountCreationReply) {
        aiReply = accountCreationReply;
        providerUsed = 'ploti-account-provisioner';
      } else if (geminiKey && geminiKey.trim() !== '' && !geminiKey.includes('your-gemini')) {
        const candidateModels = [
          'gemini-3.5-flash-lite',
          'gemini-3.1-flash-lite',
          'gemini-3.5-flash',
          'gemini-3.8-flash',
          'gemini-3.7-flash',
          'gemini-flash-latest',
        ];
        const ai = new GoogleGenAI({ apiKey: geminiKey.trim() });
        for (const model of candidateModels) {
          if (aiReply) break;
          try {
            const res = await ai.models.generateContent({
              model,
              contents: geminiContents,
              config: { systemInstruction: SYSTEM_PROMPT, maxOutputTokens: 800, temperature: 0.4 },
            });
            if (res.text) {
              aiReply = res.text;
              providerUsed = `Google Gemini (${model})`;
              break;
            }
          } catch {
            // continue
          }
        }
      }

      if (!aiReply) {
        const isBn = detectIsBengali(lastUserMessage, historyTurns);
        aiReply = generateDynamicRealEstateResponse(lastUserMessage, isBn ? 'BN' : 'EN');
      }

      // Ensure response ALWAYS addresses user as "Sir" (Requirement 6)
      if (aiReply && !/^sir/i.test(aiReply.trim())) {
        const isBn = detectIsBengali(lastUserMessage, historyTurns);
        aiReply = isBn ? `Sir (স্যার), ${aiReply.trim()}` : `Sir, ${aiReply.trim()}`;
      }

      const responseTimeMs = Date.now() - startTime;
      const now = new Date();
      const logItem = {
        id: String(Date.now()),
        user: userName,
        query: lastUserMessage,
        response: aiReply,
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        latency: `${(responseTimeMs / 1000).toFixed(2)}s`,
        provider: providerUsed,
        status: 'success',
        timestamp: now.toISOString(),
      };

      if (!globalStore.__plotifyAiLogs) {
        globalStore.__plotifyAiLogs = [];
      }

      // Deduplication check: only insert if no duplicate query exists within 20 seconds
      const isDuplicate = globalStore.__plotifyAiLogs.some(existing => {
        if (
          existing.query.trim().toLowerCase() === lastUserMessage.trim().toLowerCase() &&
          existing.user.trim().toLowerCase() === userName.trim().toLowerCase()
        ) {
          const t1 = new Date(existing.timestamp).getTime();
          const t2 = now.getTime();
          return !isNaN(t1) && Math.abs(t2 - t1) < 20000;
        }
        return false;
      });

      if (!isDuplicate) {
        globalStore.__plotifyAiLogs.unshift(logItem);
        if (globalStore.__plotifyAiLogs.length > 200) {
          globalStore.__plotifyAiLogs.pop();
        }
      }

      // Persist turn for authenticated users
      await persistChatTurn(userId, sessionId, lastUserMessage, aiReply);

      return NextResponse.json({
        reply: aiReply,
        responseTimeMs,
        provider: providerUsed,
        sessionId,
        timestamp: logItem.timestamp,
        log: logItem,
        accountCreated: createdAccount,
      });
    }

    // ==========================================
    // STREAMING FLOW (Server-Sent Events)
    // ==========================================
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendSSE = (data: any) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          } catch {
            // Controller might be closed
          }
        };

        let fullReply = '';
        let providerUsed = 'ploti-domain-ai';
        let streamSuccess = false;

        // 0. Instant Automated Account Provisioning Streaming (Requirement 4)
        if (accountCreationReply) {
          fullReply = accountCreationReply;
          providerUsed = 'ploti-account-provisioner';
          streamSuccess = true;

          const words = accountCreationReply.split(' ');
          for (let i = 0; i < words.length; i++) {
            const word = (i === 0 ? '' : ' ') + words[i];
            sendSSE({ chunk: word, provider: providerUsed, sessionId });
            await new Promise(r => setTimeout(r, 12));
          }
        }

        // 1. Google Gemini Streaming with Multi-turn Context Memory
        if (!streamSuccess && geminiKey && geminiKey.trim() !== '' && !geminiKey.includes('your-gemini')) {
          const candidateModels = [
            'gemini-3.5-flash-lite',
            'gemini-3.1-flash-lite',
            'gemini-3.5-flash',
            'gemini-3.8-flash',
            'gemini-3.7-flash',
            'gemini-flash-latest',
          ];
          const ai = new GoogleGenAI({ apiKey: geminiKey.trim() });

          for (const model of candidateModels) {
            if (streamSuccess) break;
            try {
              const streamResult = await ai.models.generateContentStream({
                model,
                contents: geminiContents,
                config: {
                  systemInstruction: SYSTEM_PROMPT,
                  maxOutputTokens: 800,
                  temperature: 0.4,
                },
              });

              providerUsed = `Google Gemini (${model})`;

              for await (const chunk of streamResult) {
                const text = chunk.text || '';
                if (text) {
                  fullReply += text;
                  sendSSE({ chunk: text, provider: providerUsed, sessionId });
                }
              }

              if (fullReply.trim()) {
                streamSuccess = true;
                break;
              }
            } catch (err: any) {
              console.warn(`[Ploti AI Stream] Model ${model} failed:`, err?.message || err);
            }
          }
        }

        // 2. OpenAI Streaming Fallback with Multi-turn Context Memory
        if (!streamSuccess && openAiKey && openAiKey.trim() !== '' && !openAiKey.includes('your-openai')) {
          try {
            const openai = new OpenAI({ apiKey: openAiKey.trim() });
            const completion = await openai.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...historyTurns.map(m => ({
                  role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
                  content: m.content,
                })),
                { role: 'user', content: lastUserMessage },
              ],
              max_tokens: 800,
              temperature: 0.4,
              stream: true,
            });

            providerUsed = 'OpenAI (gpt-4o-mini)';
            for await (const chunk of completion) {
              const text = chunk.choices[0]?.delta?.content || '';
              if (text) {
                fullReply += text;
                sendSSE({ chunk: text, provider: providerUsed, sessionId });
              }
            }
            if (fullReply.trim()) streamSuccess = true;
          } catch (openAiErr: any) {
            console.warn('[Ploti AI Stream] OpenAI error:', openAiErr?.message);
          }
        }

        // 3. Dynamic Real Estate Fallback Streaming (Always addressing as Sir)
        if (!streamSuccess || !fullReply.trim()) {
          const isBn = detectIsBengali(lastUserMessage, historyTurns);
          const fallbackText = generateDynamicRealEstateResponse(lastUserMessage, isBn ? 'BN' : 'EN');
          providerUsed = 'ploti-domain-ai';
          fullReply = fallbackText;

          // Stream words smoothly with micro-delays
          const words = fallbackText.split(' ');
          for (let i = 0; i < words.length; i++) {
            const word = (i === 0 ? '' : ' ') + words[i];
            sendSSE({ chunk: word, provider: providerUsed, sessionId });
            await new Promise(r => setTimeout(r, 12));
          }
        }

        const responseTimeMs = Date.now() - startTime;
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const latencyFormatted = `${(responseTimeMs / 1000).toFixed(2)}s`;

        // Record in server-side AI log registry with unique deduplication check
        const logItem = {
          id: String(Date.now()),
          user: userName,
          query: lastUserMessage,
          response: fullReply,
          time: timeStr,
          latency: latencyFormatted,
          provider: providerUsed,
          status: 'success',
          timestamp: now.toISOString(),
        };

        if (!globalStore.__plotifyAiLogs) {
          globalStore.__plotifyAiLogs = [];
        }

        // Deduplication check: prevent duplicate logs for identical query + user within 20s
        const isDuplicate = globalStore.__plotifyAiLogs.some(existing => {
          if (
            existing.query.trim().toLowerCase() === lastUserMessage.trim().toLowerCase() &&
            existing.user.trim().toLowerCase() === userName.trim().toLowerCase()
          ) {
            const t1 = new Date(existing.timestamp).getTime();
            const t2 = now.getTime();
            return !isNaN(t1) && Math.abs(t2 - t1) < 20000;
          }
          return false;
        });

        if (!isDuplicate) {
          globalStore.__plotifyAiLogs.unshift(logItem);
          if (globalStore.__plotifyAiLogs.length > 200) {
            globalStore.__plotifyAiLogs.pop();
          }
        }

        // Persist conversation turns (user + assistant) in database / runtime memory for authenticated user
        await persistChatTurn(userId, sessionId, lastUserMessage, fullReply);

        // Send final done event with full stats and sessionId
        sendSSE({
          done: true,
          sessionId,
          responseTimeMs,
          provider: providerUsed,
          fullReply,
          log: logItem,
          accountCreated: createdAccount,
        });

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    const responseTimeMs = Date.now() - startTime;
    return NextResponse.json({
      reply:
        "Sir, I am Ploti AI, your friendly and helpful real estate assistant for Plotify. I'm ready to help you find plots, flats, and land across Bangladesh. How may I assist you, Sir?",
      responseTimeMs,
      provider: 'fallback',
      error: error?.message,
    });
  }
}

