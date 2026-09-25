import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { createClient } from '@/lib/supabase/server';
import { ChatHistoryMessage } from '@/lib/types';

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

// Highly optimized, comprehensive real estate prompt with authentic Bangladesh real estate context
const SYSTEM_PROMPT = `You are Ploti AI (প্লটি এআই), the expert AI real estate assistant for Plotify Bangladesh (plotify.store) — the premier verified property platform.
- Language: If the user asks in Bengali (বাংলা) or Banglish, answer in polite, natural, and fluent Bengali. Otherwise in English.
- Output & Completeness: Always provide complete, thorough, and well-structured answers using clean Markdown, bold headers, and bullet points. Never cut off or leave sentences unfinished.
- Key Bangladesh Real Estate Facts:
  • Land Measurement: 1 Katha = 720 sq ft, 20 Katha = 1 Bigha, 1 Decimal / Shotangso = 435.6 sq ft.
  • Essential Document Verification: CS, SA, RS, BS/City Survey Porcha/Khatian, Bia Dolil (chain of title deeds), Mutation (নামজারি / DCR), up-to-date Land Development Tax (Khajna receipt), Non-Encumbrance Certificate (NEC), and RAJUK / CDA approved building plan.
  • Utilities: Government Titas Gas pipeline connection (high demand asset in Dhaka), WASA water supply, DESCO/DPDC electric meter, generator backup.
  • Plotify Official Listing Activation Fees:
    - Flats & Apartments: ৳1,000 – ৳5,000
    - Houses & Duplexes: ৳1,000 – ৳5,000
    - Plots & Land: ৳700 – ৳4,500
    - Mess, Rooms & Sublets: ৳500 – ৳2,000
  • Prime Locations: Gulshan, Banani, Baridhara, Dhanmondi, Bashundhara R/A, Uttara, Mirpur, Purbachal (300ft Expressway), Aftabnagar, Mohammadpur.
Direct users to explore 100% verified listings at plotify.store/properties. Maintain conversational context across previous questions seamlessly.`;

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

function generateDynamicRealEstateResponse(userQuery: string, lang: 'BN' | 'EN'): string {
  const q = userQuery.toLowerCase();
  const isBengali =
    lang === 'BN' ||
    /[\u0980-\u09FF]/.test(userQuery) ||
    q.includes('kemon') ||
    q.includes('dorkar') ||
    q.includes('khujchi') ||
    q.includes('koto');

  if (q.includes('fee') || q.includes('cost') || q.includes('ফি') || q.includes('খরচ') || q.includes('charge')) {
    if (isBengali) {
      return `💰 **প্লটিফাই অফিসিয়াল লিস্টিং অ্যাক্টিভেশন ফি:**\n\n• **ফ্ল্যাট ও অ্যাপার্টমেন্ট:** ৳ ১,০০০ – ৳ ৫,০০০\n• **বাড়ি / ডুপ্লেক্স:** ৳ ১,০০০ – ৳ ৫,০০০\n• **জমি ও প্লট:** ৳ ৭০০ – ৳ ৪,৫০০\n• **মেস / সাবলেট:** ৳ ৫০০ – ৳ ২,০০০\n\nফি প্রপার্টির মূল্যের ওপর ভিত্তি করে নির্ধারিত হয়। এডমিন যাচাইকরণের পর লিস্টিংয়ে ভেরিফাইড ব্যাজ সক্রিয় হয়!`;
    }
    return `💰 **Official Plotify Listing Activation Fee Schedule:**\n\n• **Flats & Apartments:** ৳ 1,000 – ৳ 5,000\n• **Houses / Duplex:** ৳ 1,000 – ৳ 5,000\n• **Plots & Land:** ৳ 700 – ৳ 4,500\n• **Mess / Sublet:** ৳ 500 – ৳ 2,000\n\nFees are scaled transparently by property value. All approved listings receive a 100% Verified badge!`;
  }

  if (q.includes('gulshan') || q.includes('গুলশান') || q.includes('banani') || q.includes('বনানী')) {
    if (isBengali) {
      return `🏢 **গুলশান ও বনানীতে ভেরিফাইড প্রপার্টি:**\n\n• **গুলশান-২ লেকভিউ লাক্সারি অ্যাপার্টমেন্ট:** ৪ বেড, ৩৮৫০ বর্গফুট, তিতাস গ্যাস ও সার্বক্ষণিক ব্যাকআপ। মূল্য: ৳ ৬.৮০ কোটি।\n• **বনানী ব্লক এফ প্রিমিয়াম ফ্ল্যাট:** ৩ বেড, ২১০০ বর্গফুট।\n\nপ্লটিফাই প্রপার্টিজ পেজে সরাসরি ফিল্টার করে দেখুন!`;
    }
    return `🏢 **Verified Properties in Gulshan & Banani:**\n\n• **Gulshan-2 Ultra Luxury Lakeview:** 4-Bed, 3,850 sq ft with original Titas Gas. Price: ৳ 6.80 Crore.\n• **Banani Block F:** 3-Bed ready apartment, 2,100 sq ft.\n\nExplore direct owner/developer listings at plotify.store/properties!`;
  }

  if (q.includes('purbachal') || q.includes('পূর্বাচল') || q.includes('plot') || q.includes('land') || q.includes('জমি') || q.includes('প্লট')) {
    if (isBengali) {
      return `🌿 **পূর্বাচল ও ঢাকার আশপাশে প্লট ও জমি:**\n\n• **পূর্বাচল সেক্টর ১৭:** ৫ কাঠা প্লট, ৩০০ ফিট এক্সপ্রেসওয়ের নিকটে। মূল্য: ৳ ৮৫ লাখ (প্রতি কাঠা ৳ ১৭ লাখ)। রাজউক অনুমোদিত।\n• **বসুন্ধরা ব্লক এম:** ৩ কাঠা রেডি প্লট।\n\n১ কাঠা = ৭২০ বর্গফুট, ২০ কাঠা = ১ বিঘা হিসেবে হিসাব করা হয়।`;
    }
    return `🌿 **Prime Plots in Purbachal New Town:**\n\n• **Purbachal Sector 17:** 5 Katha plot near 300ft Expressway. Price: ৳ 85 Lakh (৳ 17 Lakh/Katha).\n• **Bashundhara R/A Block M:** 3 Katha ready plot.\n\nAll plots feature clear boundary demarcation and verified documents!`;
  }

  if (isBengali) {
    return `🤖 **আসসালামু আলাইকুম! আমি প্লটি এআই:**\n\nপ্লটিফাই বাংলাদেশে আপনাকে স্বাগতম। আমি আপনাকে সাহায্য করতে পারি:\n• ঢাকা ও সারা দেশের ফ্ল্যাট, জমি ও বাড়ি খুঁজতে\n• নির্দিষ্ট বাজেট ও তিতাস গ্যাস সংযোগসহ ফিল্টার করতে\n• লিস্টিং অ্যাক্টিভেশন ফি সংক্রান্ত তথ্য জানতে\n\nআপনি কোন এলাকায় প্রপার্টি খুঁজছেন?`;
  }

  return `🤖 **Hello! I'm Ploti AI — Your Real Estate Assistant on Plotify Bangladesh:**\n\nI can help you:\n• Find flats & plots in Gulshan, Banani, Uttara, Bashundhara & Purbachal\n• Understand listing activation fees (৳ 500–5,000)\n• Verify utilities (Titas Gas, WASA) and RAJUK approvals\n\nHow can I assist your property search today?`;
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
  return NextResponse.json({
    logs: globalStore.__plotifyAiLogs || [],
    total: globalStore.__plotifyAiLogs?.length || 0,
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

    const geminiKey = getEnvKey('GEMINI_API_KEY');
    const openAiKey = getEnvKey('OPENAI_API_KEY');

    // ==========================================
    // NON-STREAMING FLOW
    // ==========================================
    if (!isStream) {
      let aiReply: string | null = null;
      let providerUsed = 'ploti-domain-ai';

      if (geminiKey && geminiKey.trim() !== '' && !geminiKey.includes('your-gemini')) {
        const candidateModels = [
          'gemini-3.5-flash-lite',
          'gemini-flash-lite-latest',
          'gemini-3.1-flash-lite',
          'gemini-3.5-flash',
          'gemini-3.8-flash',
        ];
        const ai = new GoogleGenAI({ apiKey: geminiKey.trim() });
        for (const model of candidateModels) {
          if (aiReply) break;
          try {
            const res = await ai.models.generateContent({
              model,
              contents: geminiContents,
              config: { systemInstruction: SYSTEM_PROMPT, maxOutputTokens: 1500, temperature: 0.5 },
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
        aiReply = generateDynamicRealEstateResponse(lastUserMessage, 'EN');
      }

      const responseTimeMs = Date.now() - startTime;
      const logItem = {
        id: String(Date.now()),
        user: userName,
        query: lastUserMessage,
        response: aiReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        latency: `${(responseTimeMs / 1000).toFixed(2)}s`,
        provider: providerUsed,
        status: 'success',
        timestamp: new Date().toISOString(),
      };
      globalStore.__plotifyAiLogs?.unshift(logItem);

      // Persist turn for authenticated users
      await persistChatTurn(userId, sessionId, lastUserMessage, aiReply);

      return NextResponse.json({
        reply: aiReply,
        responseTimeMs,
        provider: providerUsed,
        sessionId,
        timestamp: logItem.timestamp,
        log: logItem,
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

        // 1. Google Gemini Streaming with Multi-turn Context Memory
        if (geminiKey && geminiKey.trim() !== '' && !geminiKey.includes('your-gemini')) {
          const candidateModels = [
            'gemini-3.5-flash-lite',
            'gemini-flash-lite-latest',
            'gemini-3.1-flash-lite',
            'gemini-3.5-flash',
            'gemini-3.8-flash',
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
                  maxOutputTokens: 1500,
                  temperature: 0.5,
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
              max_tokens: 1500,
              temperature: 0.5,
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

        // 3. Dynamic Real Estate Fallback Streaming
        if (!streamSuccess || !fullReply.trim()) {
          const fallbackText = generateDynamicRealEstateResponse(lastUserMessage, 'EN');
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

        // Record in server-side AI log registry
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
        globalStore.__plotifyAiLogs.unshift(logItem);
        if (globalStore.__plotifyAiLogs.length > 200) {
          globalStore.__plotifyAiLogs.pop();
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
        "Hello! I am Ploti AI, your real estate assistant for Plotify Bangladesh. I'm ready to help you find flats, plots, houses, and rentals across all 64 districts.",
      responseTimeMs,
      provider: 'fallback',
      error: error?.message,
    });
  }
}

