'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Icons } from '@/components/icons';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useBubbleChatStore, type BubbleChatMessage } from '@/features/ai/utils/bubble-chat-store';

// ─── Tab type ───────────────────────────────────────────────────

type TabId = 'hem' | 'meddelanden' | 'hjalp' | 'nyheter';
type ViewId = TabId | 'chat';

// ─── Persistence helpers ────────────────────────────────────────

async function saveSession(
  sessionId: string | null,
  messages: BubbleChatMessage[]
): Promise<string | null> {
  if (messages.length === 0) return null;
  try {
    const payload = {
      action: sessionId ? 'update' : 'create',
      sessionId,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      }))
    };
    const res = await fetch('/api/ai/chat/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) return sessionId;
    const data = await res.json();
    return data.session?.id || sessionId;
  } catch {
    return sessionId;
  }
}

async function loadLatestSession(): Promise<{
  id: string;
  messages: BubbleChatMessage[];
} | null> {
  try {
    const res = await fetch('/api/ai/chat/sessions');
    if (!res.ok) return null;
    const data = await res.json();
    const sessions = data.sessions as { id: string }[];
    if (!sessions || sessions.length === 0) return null;

    const latest = sessions[0];
    const detailRes = await fetch(`/api/ai/chat/sessions?id=${latest.id}`);
    if (!detailRes.ok) return null;
    const detail = await detailRes.json();
    const rawMessages = detail.session?.messages as {
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
    }[];
    if (!rawMessages || rawMessages.length === 0) return null;

    return {
      id: latest.id,
      messages: rawMessages.map((m, i) => ({
        id: `loaded-${i}`,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      }))
    };
  } catch {
    return null;
  }
}

async function deleteSession(sessionId: string): Promise<void> {
  try {
    await fetch(`/api/ai/chat/sessions?id=${sessionId}`, { method: 'DELETE' });
  } catch {
    // silent
  }
}

// ─── Send message + stream response ────────────────────────────

async function sendAndStream(
  messages: { role: 'user' | 'assistant'; content: string }[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void
) {
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Något gick fel.' }));
      onError(err.error || 'Något gick fel.');
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      onError('Kunde inte läsa svar.');
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const payload = trimmed.slice(6);
        if (payload === '[DONE]') {
          onDone();
          return;
        }
        try {
          const parsed = JSON.parse(payload) as { text: string };
          onChunk(parsed.text);
        } catch {
          // skip unparseable chunks
        }
      }
    }
    onDone();
  } catch {
    onError('Nätverksfel. Försök igen.');
  }
}

// ─── Bot logo (theme-aware) ─────────────────────────────────────

function BotLogo({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const src =
    resolvedTheme === 'dark' ? '/meny-closed-logo-dark.png' : '/meny-closed-logo-light.png';
  return <img src={src} alt='Prakto' className={cn('object-contain', className)} />;
}

// ─── Typing indicator ───────────────────────────────────────────

function TypingDots() {
  return (
    <div className='flex items-start gap-2.5'>
      <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted'>
        <BotLogo className='h-5 w-5' />
      </div>
      <div className='flex gap-1 rounded-2xl rounded-bl-md bg-muted px-4 py-3'>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className='inline-block h-1.5 w-1.5 rounded-full bg-primary/60'
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Help categories ────────────────────────────────────────────

const HELP_CATEGORIES = [
  {
    title: 'Kom igång',
    description: 'Skapa konto, konfigurera din profil och hitta din första praktik.',
    count: 6
  },
  {
    title: 'Knowledge Base',
    description: 'Kunskapskällor, guider och tips för att lyckas med din LIA.',
    count: 4
  },
  {
    title: 'AI & Automation',
    description: 'Konfigurera AI-assistenten, matchning och automatiserade rekommendationer.',
    count: 7
  },
  {
    title: 'Ansökningar & CV',
    description: 'Hur du söker, följer upp och bygger ett starkt CV.',
    count: 6
  },
  {
    title: 'LIA-dagbok & Mål',
    description: 'Journal, tidsrapportering, mål och handledarmöten.',
    count: 5
  },
  {
    title: 'Integrationer & Profil',
    description: 'Anslut LinkedIn, ladda upp dokument och hantera ditt konto.',
    count: 3
  }
];

// ─── News items ─────────────────────────────────────────────────

const NEWS_ITEMS = [
  {
    tag: 'Integration',
    tagClass: 'border border-teal-600/50 text-teal-600 dark:text-teal-300',
    date: '14 feb',
    title: 'Koppla AI-plattformen till din utbildning',
    description:
      'Synka uppgifter, schema och kontakter direkt — automatisera workflows och ge assistenten full kontext.',
    hasImage: true
  },
  {
    tag: 'Nytt',
    tagClass: 'border border-primary/50 text-primary',
    date: '5 feb',
    title: 'Multichannel-support tillgängligt',
    description: 'Hantera konversationer från chatt, e-post och mer — allt från samma inkorg.',
    hasImage: false
  },
  {
    tag: 'Förbättring',
    tagClass: 'border border-violet-500/50 text-violet-600 dark:text-violet-300',
    date: '28 jan',
    title: 'Kunskapsbas med AI-förslag',
    description: 'AI analyserar dina frågor och föreslår relevanta artiklar automatiskt.',
    hasImage: false
  }
];

// ─── Tab: Hem ───────────────────────────────────────────────────

function HomeTab({ onStartChat }: { onStartChat: () => void }) {
  return (
    <div className='flex flex-1 flex-col'>
      {/* Hero with real photo background */}
      <div className='relative h-[220px] overflow-hidden'>
        {/* Photo */}
        <img
          src='/praktik-unsplash.jpg'
          alt=''
          className='absolute inset-0 h-full w-full object-cover'
        />
        {/* Dark gradient overlay so text is readable */}
        <div className='absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent' />
        {/* Text */}
        <div className='absolute bottom-6 left-5'>
          <h2 className='text-[1.65rem] font-bold leading-tight text-foreground'>Hej</h2>
          <p className='text-[1.65rem] font-bold leading-tight text-foreground/80'>
            Hur kan vi hjälpa till?
          </p>
        </div>
      </div>

      {/* White "Ställ en fråga" card — matches SWEO exactly */}
      <div className='px-4 pt-4'>
        <button
          type='button'
          onClick={onStartChat}
          className='group flex w-full items-center gap-4 rounded-2xl bg-card p-4 text-left shadow-sm transition hover:bg-accent'
        >
          <div className='flex flex-1 flex-col gap-0.5'>
            <span className='text-sm font-bold text-card-foreground'>Ställ en fråga</span>
            <span className='text-xs text-muted-foreground'>
              Vår bot och vårt team kan hjälpa dig
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='flex h-9 w-9 items-center justify-center rounded-full bg-primary/10'>
              <BotLogo className='h-6 w-6' />
            </div>
            <Icons.chevronRight className='h-4 w-4 text-muted-foreground transition group-hover:text-foreground' />
          </div>
        </button>
      </div>
    </div>
  );
}

// ─── Tab: Meddelanden ───────────────────────────────────────────

function MessagesTab({ onStartChat }: { onStartChat: () => void }) {
  return (
    <div className='flex flex-1 flex-col px-5 pt-5'>
      <h2 className='text-lg font-bold text-foreground'>Meddelanden</h2>
      <p className='mt-3 text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground'>
        Ny konversation
      </p>

      <div className='mt-4 flex flex-col'>
        {/* AI-assistent */}
        <button
          type='button'
          onClick={onStartChat}
          className='group flex items-center gap-3.5 py-3.5 text-left'
        >
          {/* Circular gradient avatar */}
          <div className='flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-muted to-muted-foreground/30'>
            <Icons.mentorChat className='h-5 w-5 text-foreground/90' />
          </div>
          <div className='min-w-0 flex-1'>
            <span className='text-sm font-bold text-foreground'>AI-assistent</span>
            <p className='mt-0.5 text-xs leading-relaxed text-muted-foreground'>
              Fråga om praktik, CV, ansökningar och mer
            </p>
          </div>
          <Icons.chevronRight className='h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-foreground' />
        </button>

        {/* Karriärrådgivning */}
        <button
          type='button'
          onClick={onStartChat}
          className='group flex items-center gap-3.5 py-3.5 text-left'
        >
          <div className='flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-muted-foreground/20 to-muted'>
            <Icons.school className='h-5 w-5 text-foreground/90' />
          </div>
          <div className='min-w-0 flex-1'>
            <span className='text-sm font-bold text-foreground'>Support</span>
            <p className='mt-0.5 text-xs leading-relaxed text-muted-foreground'>
              Få hjälp med tekniska frågor, felsökning och kontofrågor
            </p>
          </div>
          <Icons.chevronRight className='h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-foreground' />
        </button>
      </div>

      {/* Ställ en fråga pill button — white outline like SWEO */}
      <div className='mt-auto flex justify-center pb-4 pt-6'>
        <button
          type='button'
          onClick={onStartChat}
          className='flex items-center gap-2 rounded-full border border-border bg-transparent px-5 py-2.5 text-sm font-medium text-foreground transition hover:border-foreground/60'
        >
          Ställ en fråga
          <Icons.help className='h-4 w-4' />
        </button>
      </div>
    </div>
  );
}

// ─── Tab: Hjälp ─────────────────────────────────────────────────

function HelpTab({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  const handleOpenSupport = useCallback(() => {
    onClose();
    router.push('/dashboard/support');
  }, [onClose, router]);

  return (
    <div className='flex flex-1 flex-col px-5 pt-5'>
      <h2 className='text-lg font-bold text-foreground'>Hjälp</h2>

      {/* Search — navigates to support page */}
      <button
        type='button'
        onClick={handleOpenSupport}
        className='mt-3 flex items-center gap-2.5 rounded-lg border border-border bg-transparent px-3.5 py-2.5 text-left transition hover:border-foreground/40'
      >
        <Icons.search className='h-4 w-4 text-muted-foreground' />
        <span className='text-sm text-muted-foreground'>Sök efter hjälp</span>
      </button>

      <p className='mt-4 text-xs text-muted-foreground'>{HELP_CATEGORIES.length} samlingar</p>

      {/* Categories — clicking navigates to support page */}
      <div className='mt-1 flex flex-col divide-y divide-border'>
        {HELP_CATEGORIES.map((cat) => (
          <button
            type='button'
            key={cat.title}
            onClick={handleOpenSupport}
            className='group flex items-center gap-3 py-3.5 text-left'
          >
            <div className='min-w-0 flex-1'>
              <p className='text-sm font-bold text-foreground'>{cat.title}</p>
              <p className='mt-0.5 text-xs leading-relaxed text-muted-foreground'>
                {cat.description}
              </p>
              <p className='mt-0.5 text-[0.65rem] text-muted-foreground/60'>{cat.count} artiklar</p>
            </div>
            <Icons.chevronRight className='h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-foreground' />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Nyheter ───────────────────────────────────────────────

function NewsTab() {
  return (
    <div className='flex flex-1 flex-col px-5 pt-5'>
      <h2 className='text-lg font-bold text-foreground'>Nyheter</h2>

      {/* Senaste + overlapping team avatars like SWEO */}
      <div className='mt-1 flex items-center justify-between'>
        <div>
          <span className='text-sm font-semibold text-foreground'>Senaste</span>
          <p className='text-xs text-muted-foreground'>Från teamet Prakto</p>
        </div>
        {/* Overlapping avatar circles */}
        <div className='flex -space-x-2'>
          <div className='h-8 w-8 rounded-full border-2 border-background bg-gradient-to-br from-muted-foreground/40 to-muted-foreground/60' />
          <div className='h-8 w-8 rounded-full border-2 border-background bg-gradient-to-br from-muted-foreground/50 to-muted-foreground/70' />
          <div className='h-8 w-8 rounded-full border-2 border-background bg-gradient-to-br from-muted-foreground/60 to-muted-foreground/80' />
        </div>
      </div>

      <div className='mt-4 flex flex-col gap-4'>
        {NEWS_ITEMS.map((item, idx) => (
          <div key={item.title} className='group cursor-default'>
            {/* Image placeholder for first item — matches SWEO screenshot */}
            {item.hasImage && (
              <div className='mb-3 h-[140px] w-full overflow-hidden rounded-xl bg-gradient-to-br from-muted to-accent'>
                <div className='flex h-full w-full items-center justify-center'>
                  {/* Simulated app screenshot */}
                  <div className='flex w-[90%] gap-2 rounded-lg bg-background p-2'>
                    <div className='w-1/3 space-y-1.5'>
                      <div className='h-2 w-full rounded bg-muted-foreground/20' />
                      <div className='h-2 w-3/4 rounded bg-muted-foreground/15' />
                      <div className='h-2 w-5/6 rounded bg-muted-foreground/10' />
                      <div className='h-2 w-2/3 rounded bg-muted-foreground/15' />
                    </div>
                    <div className='flex-1 space-y-1.5'>
                      <div className='h-2 w-full rounded bg-muted-foreground/20' />
                      <div className='h-8 w-full rounded bg-muted-foreground/10' />
                      <div className='h-2 w-3/4 rounded bg-muted-foreground/15' />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tag + date row */}
            <div className='flex items-center gap-2.5'>
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-[0.65rem] font-medium',
                  item.tagClass
                )}
              >
                {item.tag}
              </span>
              <span className='text-[0.65rem] text-muted-foreground/60'>{item.date}</span>
            </div>

            {/* Title + description + chevron */}
            <div className='mt-1.5 flex items-start gap-2'>
              <div className='min-w-0 flex-1'>
                <p className='text-sm font-bold text-foreground'>{item.title}</p>
                <p className='mt-1 text-xs leading-relaxed text-muted-foreground'>
                  {item.description}
                </p>
              </div>
              <Icons.chevronRight className='mt-0.5 h-4 w-4 shrink-0 text-muted-foreground' />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Chat View ──────────────────────────────────────────────────

function ChatView({
  messages,
  isStreaming,
  error,
  onSend,
  onBack,
  onNewChat,
  onClose
}: {
  messages: BubbleChatMessage[];
  isStreaming: boolean;
  error: string | null;
  onSend: (text: string) => void;
  onBack: () => void;
  onNewChat: () => void;
  onClose: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const draftRef = useRef('');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, isStreaming]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const val = draftRef.current;
      if (!val.trim() || isStreaming) return;
      onSend(val);
      draftRef.current = '';
      if (inputRef.current) inputRef.current.value = '';
    },
    [onSend, isStreaming]
  );

  return (
    <div className='flex h-full flex-col'>
      {/* Chat header — matches SWEO: ← logo Title/subtitle ↻ × */}
      <div className='flex shrink-0 items-center gap-2 border-b border-border px-3 py-2.5'>
        <button
          type='button'
          onClick={onBack}
          className='flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground'
          aria-label='Tillbaka'
        >
          <Icons.arrowLeft className='h-4 w-4' />
        </button>
        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-muted'>
          <BotLogo className='h-5 w-5' />
        </div>
        <div className='min-w-0 flex-1'>
          <p className='text-sm font-bold text-foreground'>Support</p>
          <p className='text-[0.65rem] text-muted-foreground'>Teamet kan också hjälpa dig</p>
        </div>
        {/* Refresh button — like SWEO ↻ */}
        <button
          type='button'
          onClick={onNewChat}
          className='flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground'
          aria-label='Ladda om'
        >
          <Icons.refresh className='h-4 w-4' />
        </button>
        {/* Close button — like SWEO × */}
        <button
          type='button'
          onClick={onClose}
          className='flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground'
          aria-label='Stäng'
        >
          <Icons.close className='h-4 w-4' />
        </button>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className='min-h-0 flex-1'>
        <div className='flex flex-col gap-3 px-4 py-3'>
          {/* Greeting */}
          {messages.length === 0 && !isStreaming && (
            <div className='flex items-start gap-2.5'>
              <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted'>
                <BotLogo className='h-5 w-5' />
              </div>
              <div>
                <div className='rounded-2xl rounded-bl-md bg-muted px-3.5 py-2.5'>
                  <p className='text-sm text-foreground'>Hej! Hur kan jag hjälpa dig?</p>
                </div>
                <p className='mt-1 text-[0.6rem] text-muted-foreground'>
                  Prakto · AI Agent ·{' '}
                  {new Date().toLocaleTimeString('sv-SE', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            // Skip empty assistant messages — TypingDots handles that state
            if (!isUser && msg.content === '') return null;
            if (isUser) {
              return (
                <div key={msg.id} className='flex justify-end'>
                  <div className='max-w-[80%]'>
                    <div className='rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5'>
                      <p className='whitespace-pre-wrap break-words text-sm text-primary-foreground'>
                        {msg.content}
                      </p>
                    </div>
                    <p className='mt-1 text-right text-[0.6rem] text-muted-foreground'>
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              );
            }
            return (
              <div key={msg.id} className='flex items-start gap-2.5'>
                <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted'>
                  <BotLogo className='h-5 w-5' />
                </div>
                <div className='max-w-[85%]'>
                  <div className='rounded-2xl rounded-bl-md bg-muted px-3.5 py-2.5'>
                    <p className='whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground'>
                      {msg.content}
                    </p>
                  </div>
                  <p className='mt-1 text-[0.6rem] text-muted-foreground'>
                    Prakto · AI Agent · {msg.timestamp}
                  </p>
                </div>
              </div>
            );
          })}

          {isStreaming && messages.length > 0 && messages[messages.length - 1].content === '' && (
            <TypingDots />
          )}

          {error && (
            <div className='rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400'>{error}</div>
          )}
        </div>
      </ScrollArea>

      {/* Input — rounded field with send button inside, matching SWEO */}
      <div className='shrink-0 px-4 pb-2 pt-3'>
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className='flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2'
        >
          <input
            ref={inputRef}
            type='text'
            defaultValue=''
            onChange={(e) => {
              draftRef.current = e.target.value;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
            placeholder='Ställ en fråga ...'
            disabled={isStreaming}
            className='min-h-[2rem] flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50'
            aria-label='Skriv ett meddelande till Prakto AI'
          />
          <button
            type='submit'
            disabled={isStreaming}
            className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50'
            aria-label='Skicka meddelande'
          >
            <Icons.send className='h-4 w-4' />
          </button>
        </form>
      </div>

      {/* Powered by */}
      <div className='flex shrink-0 items-center justify-center gap-1.5 py-2'>
        <Icons.sparkles className='h-3 w-3 text-muted-foreground' />
        <span className='text-[0.6rem] text-muted-foreground'>Powered by Prakto</span>
      </div>
    </div>
  );
}

// ─── Bottom Nav Tab ─────────────────────────────────────────────

function BottomTab({
  icon: IconComp,
  label,
  isActive,
  onClick
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'flex flex-1 flex-col items-center gap-1.5 py-3 text-xs transition',
        isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-full transition',
          isActive && 'bg-primary/20'
        )}
      >
        <IconComp className={cn('h-5 w-5', isActive && 'text-primary')} />
      </div>
      <span className={cn('font-medium', isActive && 'font-bold')}>{label}</span>
    </button>
  );
}

// ─── Main Bubble Chat ───────────────────────────────────────────

export function BubbleChat() {
  const shouldReduceMotion = useReducedMotion();
  const [currentView, setCurrentView] = useState<ViewId>('hem');

  const {
    isOpen,
    messages,
    isStreaming,
    error,
    sessionId,
    isLoaded,
    toggle,
    addUserMessage,
    startStreaming,
    appendToStream,
    finishStreaming,
    setError,
    clearMessages,
    setSessionId,
    setMessages,
    setIsLoaded
  } = useBubbleChatStore();

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Load latest session on first open
  useEffect(() => {
    if (isOpen && !isLoaded) {
      setIsLoaded(true);
      loadLatestSession().then((session) => {
        if (session) {
          setMessages(session.messages);
          setSessionId(session.id);
        }
      });
    }
  }, [isOpen, isLoaded, setIsLoaded, setMessages, setSessionId]);

  // Auto-save after streaming finishes
  const prevStreamingRef = useRef(isStreaming);
  useEffect(() => {
    if (prevStreamingRef.current && !isStreaming && messages.length > 0) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        const store = useBubbleChatStore.getState();
        saveSession(store.sessionId, store.messages).then((newId) => {
          if (newId && newId !== store.sessionId) {
            setSessionId(newId);
          }
        });
      }, 1000);
    }
    prevStreamingRef.current = isStreaming;
  }, [isStreaming, messages.length, setSessionId]);

  const handleSend = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      addUserMessage(trimmed);

      const history = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: trimmed }
      ];

      startStreaming();
      sendAndStream(
        history,
        (chunk) => appendToStream(chunk),
        () => finishStreaming(),
        (err) => setError(err)
      );
    },
    [
      messages,
      isStreaming,
      addUserMessage,
      startStreaming,
      appendToStream,
      finishStreaming,
      setError
    ]
  );

  const handleStartChat = useCallback(() => {
    setCurrentView('chat');
  }, []);

  const handleBack = useCallback(() => {
    setCurrentView('meddelanden');
  }, []);

  const handleNewChat = useCallback(() => {
    if (sessionId) {
      deleteSession(sessionId);
    }
    clearMessages();
  }, [sessionId, clearMessages]);

  // Reset view when closing
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => setCurrentView('hem'), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const showTabs = currentView !== 'chat';

  return (
    <>
      {/* ── Widget Panel ───────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className='fixed right-4 bottom-20 z-50 flex h-[min(620px,90vh)] w-[min(440px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:right-6 sm:bottom-24'
          >
            {/* Close button — only for tab views (chat view has inline close) */}
            <button
              type='button'
              onClick={toggle}
              className={cn(
                'absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground',
                !showTabs && 'hidden'
              )}
              aria-label='Stäng'
            >
              <Icons.close className='h-4 w-4' />
            </button>

            {/* ── Content area ─────────────────────────────── */}
            <div className='flex min-h-0 flex-1 flex-col'>
              {currentView === 'hem' && (
                <ScrollArea className='min-h-0 flex-1'>
                  <HomeTab onStartChat={handleStartChat} />
                </ScrollArea>
              )}
              {currentView === 'meddelanden' && (
                <ScrollArea className='min-h-0 flex-1'>
                  <MessagesTab onStartChat={handleStartChat} />
                </ScrollArea>
              )}
              {currentView === 'hjalp' && (
                <ScrollArea className='min-h-0 flex-1'>
                  <HelpTab onClose={toggle} />
                </ScrollArea>
              )}
              {currentView === 'nyheter' && (
                <ScrollArea className='min-h-0 flex-1'>
                  <NewsTab />
                </ScrollArea>
              )}
              {currentView === 'chat' && (
                <ChatView
                  messages={messages}
                  isStreaming={isStreaming}
                  error={error}
                  onSend={handleSend}
                  onBack={handleBack}
                  onNewChat={handleNewChat}
                  onClose={toggle}
                />
              )}
            </div>

            {/* ── Bottom navigation ────────────────────────── */}
            {showTabs && (
              <div className='flex border-t border-border bg-background'>
                <BottomTab
                  icon={Icons.dashboard}
                  label='Hem'
                  isActive={currentView === 'hem'}
                  onClick={() => setCurrentView('hem')}
                />
                <BottomTab
                  icon={Icons.chat}
                  label='Meddelanden'
                  isActive={currentView === 'meddelanden'}
                  onClick={() => setCurrentView('meddelanden')}
                />
                <BottomTab
                  icon={Icons.help}
                  label='Hjälp'
                  isActive={currentView === 'hjalp'}
                  onClick={() => setCurrentView('hjalp')}
                />
                <BottomTab
                  icon={Icons.notification}
                  label='Nyheter'
                  isActive={currentView === 'nyheter'}
                  onClick={() => setCurrentView('nyheter')}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Button ────────────────────────────────── */}
      <motion.div
        className='fixed right-4 bottom-4 z-50 sm:right-6 sm:bottom-6'
        initial={shouldReduceMotion ? false : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.5 }}
      >
        <button
          type='button'
          onClick={toggle}
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-105 hover:bg-primary/90',
            isOpen && 'pointer-events-none scale-0 opacity-0'
          )}
          aria-label={isOpen ? 'Stäng AI-chatt' : 'Öppna AI-chatt'}
        >
          <Icons.chat className='h-6 w-6' />
        </button>
      </motion.div>
    </>
  );
}
