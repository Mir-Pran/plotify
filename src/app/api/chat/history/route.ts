import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ChatHistoryMessage, ChatSessionSummary } from '@/lib/types';

// Global server-side chat history registry (resilient fallback during runtime)
const globalStore = global as unknown as {
  __plotifyChatHistory?: ChatHistoryMessage[];
};

if (!globalStore.__plotifyChatHistory) {
  globalStore.__plotifyChatHistory = [];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const sessionId = searchParams.get('sessionId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    // 1. Try querying Supabase
    const supabase = await createClient();
    
    if (sessionId) {
      const { data, error } = await supabase
        .from('ai_chat_history')
        .select('*')
        .eq('user_id', userId)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return NextResponse.json({
          messages: data.map(d => ({
            id: d.id,
            userId: d.user_id,
            sessionId: d.session_id,
            role: d.role,
            content: d.content,
            createdAt: d.created_at,
          })),
        });
      }
    } else {
      // Fetch all messages to construct session summaries
      const { data, error } = await supabase
        .from('ai_chat_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        const sessionMap = new Map<string, ChatHistoryMessage[]>();
        data.forEach(d => {
          const sid = d.session_id;
          if (!sessionMap.has(sid)) sessionMap.set(sid, []);
          sessionMap.get(sid)!.push({
            id: d.id,
            userId: d.user_id,
            sessionId: d.session_id,
            role: d.role,
            content: d.content,
            createdAt: d.created_at,
          });
        });

        const summaries: ChatSessionSummary[] = Array.from(sessionMap.entries()).map(
          ([sid, msgs]) => {
            const firstUserMsg = msgs.find(m => m.role === 'user')?.content || 'Conversation';
            const lastMsg = msgs[msgs.length - 1];
            return {
              sessionId: sid,
              title: firstUserMsg.slice(0, 36) + (firstUserMsg.length > 36 ? '...' : ''),
              lastMessage: lastMsg?.content || '',
              messageCount: msgs.length,
              updatedAt: lastMsg?.createdAt || new Date().toISOString(),
            };
          }
        );

        summaries.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        return NextResponse.json({ sessions: summaries });
      }
    }
  } catch (err) {
    console.warn('[Chat History API] Supabase query fallback:', err);
  }

  // 2. Resilient Fallback to Server Runtime Store
  const userMessages = (globalStore.__plotifyChatHistory || []).filter(m => m.userId === userId);

  if (sessionId) {
    const sessionMsgs = userMessages.filter(m => m.sessionId === sessionId);
    return NextResponse.json({ messages: sessionMsgs });
  }

  // Group into sessions
  const sessionMap = new Map<string, ChatHistoryMessage[]>();
  userMessages.forEach(m => {
    if (!sessionMap.has(m.sessionId)) sessionMap.set(m.sessionId, []);
    sessionMap.get(m.sessionId)!.push(m);
  });

  const summaries: ChatSessionSummary[] = Array.from(sessionMap.entries()).map(([sid, msgs]) => {
    const firstUserMsg = msgs.find(m => m.role === 'user')?.content || 'Real Estate Chat';
    const lastMsg = msgs[msgs.length - 1];
    return {
      sessionId: sid,
      title: firstUserMsg.slice(0, 36) + (firstUserMsg.length > 36 ? '...' : ''),
      lastMessage: lastMsg?.content || '',
      messageCount: msgs.length,
      updatedAt: lastMsg?.createdAt || new Date().toISOString(),
    };
  });

  summaries.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return NextResponse.json({ sessions: summaries });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, sessionId, role, content } = body;

    if (!userId || !sessionId || !role || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const message: ChatHistoryMessage = {
      id: String(Date.now()) + '-' + Math.random().toString(36).slice(2, 6),
      userId,
      sessionId,
      role,
      content,
      createdAt: new Date().toISOString(),
    };

    // Save to runtime store
    globalStore.__plotifyChatHistory?.push(message);

    // Save to Supabase if available
    try {
      const supabase = await createClient();
      await supabase.from('ai_chat_history').insert([
        {
          user_id: userId,
          session_id: sessionId,
          role,
          content,
          created_at: message.createdAt,
        },
      ]);
    } catch (err) {
      console.warn('[Chat History API] Supabase insert note:', err);
    }

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    const clearAll = searchParams.get('clearAll') === 'true';

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // 1. Clean from Supabase
    try {
      const supabase = await createClient();
      if (clearAll || !sessionId) {
        await supabase.from('ai_chat_history').delete().eq('user_id', userId);
      } else {
        await supabase.from('ai_chat_history').delete().eq('user_id', userId).eq('session_id', sessionId);
      }
    } catch (err) {
      console.warn('[Chat History API] Supabase delete note:', err);
    }

    // 2. Clean from runtime store
    if (globalStore.__plotifyChatHistory) {
      if (clearAll || !sessionId) {
        globalStore.__plotifyChatHistory = globalStore.__plotifyChatHistory.filter(m => m.userId !== userId);
      } else {
        globalStore.__plotifyChatHistory = globalStore.__plotifyChatHistory.filter(
          m => !(m.userId === userId && m.sessionId === sessionId)
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
