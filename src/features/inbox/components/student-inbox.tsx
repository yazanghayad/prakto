'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  conversationsQueryOptions,
  messagesQueryOptions,
  companyDetailsQueryOptions,
  inboxKeys
} from '../api/queries';
import {
  sendMessage,
  updateConversationStatus,
  toggleConversationStar,
  deleteConversation
} from '../api/service';
import type {
  Conversation,
  Message,
  ConversationStatus,
  ConversationFilter,
  CompanyDetails
} from '../api/types';

// ─── PascalCase icon aliases ───────────────────────────────────

const ChatIcon = Icons.chat;
const UserIcon = Icons.user;
const MailIcon = Icons.mail;
const ExclusiveIcon = Icons.exclusive;
const BriefcaseIcon = Icons.briefcase;
const ChevronDownIcon = Icons.chevronDown;
const ChevronRightIcon = Icons.chevronRight;
const CheckIcon = Icons.check;
const ChecksIcon = Icons.checks;
const PaperclipIcon = Icons.paperclip;
const BookmarkIcon = Icons.bookmark;
const SendIcon = Icons.send;
const InboxIcon = Icons.inbox;
const CloseIcon = Icons.close;
const PhoneIcon = Icons.phone;
const ArchiveIcon = Icons.archive;
const ClockIcon = Icons.clock;
const GlobeIcon = Icons.globe;
const BuildingIcon = Icons.building;

// ─── Helpers ───────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-teal-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-orange-500',
  'bg-rose-500',
  'bg-sky-500',
  'bg-amber-600',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-cyan-500'
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (name.codePointAt(i) ?? 0) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  if (diffDays === 1) return 'Igår';
  if (diffDays < 7) return date.toLocaleDateString('sv-SE', { weekday: 'short' });
  return date.toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'short'
  });
}

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDateSeparator(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Idag';
  if (diffDays === 1) return 'Igår';
  return date.toLocaleDateString('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
}

const STATUS_LABELS: Record<ConversationStatus, string> = {
  open: 'Öppen',
  snoozed: 'Väntande',
  done: 'Avslutad'
};

const TAB_LABELS: Record<ConversationStatus, string> = {
  open: 'Öppna',
  snoozed: 'Väntande',
  done: 'Avslutade'
};

// ─── Sidebar Item Type ─────────────────────────────────────────

interface SidebarItemDef {
  label: string;
  icon: keyof typeof Icons;
  filter?: ConversationFilter;
  status?: ConversationStatus | 'all';
}

const SIDEBAR_ITEMS: SidebarItemDef[] = [
  { label: 'Alla konversationer', icon: 'chat', filter: 'all', status: 'all' }
];

// ─── Skeleton Components ───────────────────────────────────────

function ConversationListSkeleton() {
  return (
    <div className='space-y-3 p-3'>
      {['sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5'].map((key) => (
        <div key={key} className='flex items-start gap-2.5'>
          <Skeleton className='h-9 w-9 rounded-full' />
          <div className='flex-1 space-y-1.5'>
            <Skeleton className='h-3.5 w-28' />
            <Skeleton className='h-3 w-full' />
            <Skeleton className='h-3 w-3/4' />
          </div>
        </div>
      ))}
    </div>
  );
}

function ConversationListError({ message }: Readonly<{ message: string }>) {
  return (
    <div className='flex flex-col items-center justify-center py-12'>
      <InboxIcon className='text-muted-foreground/30 mb-2 h-8 w-8' />
      <p className='text-muted-foreground text-sm'>Kunde inte ladda konversationer</p>
      <p className='text-muted-foreground mt-1 text-xs'>{message}</p>
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div className='space-y-3'>
      {['msg-sk-1', 'msg-sk-2', 'msg-sk-3'].map((key, idx) => (
        <div key={key} className={cn('flex', idx % 2 === 0 ? 'justify-start' : 'justify-end')}>
          <Skeleton className='h-16 w-3/5 rounded-2xl' />
        </div>
      ))}
    </div>
  );
}

// ─── Collapsible Section ───────────────────────────────────────

function CollapsibleSection({
  title,
  count,
  defaultOpen = true,
  children
}: Readonly<{
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}>) {
  const [open, setOpen] = useState(defaultOpen);
  const ChevronIcon = open ? ChevronDownIcon : ChevronRightIcon;
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className='text-muted-foreground hover:text-foreground flex w-full items-center gap-1 px-3 py-2 text-xs font-medium'
      >
        <ChevronIcon className='h-3 w-3' />
        <span>{title}</span>
        {count !== undefined && (
          <span className='text-muted-foreground ml-auto text-[10px]'>{count}</span>
        )}
      </button>
      {open && children}
    </div>
  );
}

// ─── Contact Detail Row ────────────────────────────────────────

function AttributeRow({
  icon: IconComp,
  label,
  value
}: Readonly<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}>) {
  return (
    <div className='flex items-start gap-3 px-4 py-1.5'>
      <IconComp className='text-muted-foreground mt-0.5 h-3.5 w-3.5 shrink-0' />
      <div className='min-w-0 flex-1'>
        <p className='text-muted-foreground text-[11px]'>{label}</p>
        <p className='truncate text-sm'>{value}</p>
      </div>
    </div>
  );
}

// ─── Message Bubble (student perspective) ──────────────────────

function MessageBubble({ msg, showDateSep }: Readonly<{ msg: Message; showDateSep: boolean }>) {
  const isOutgoing = msg.senderRole === 'student';
  return (
    <div>
      {showDateSep && (
        <div className='flex items-center justify-center py-2'>
          <span className='bg-muted text-muted-foreground rounded-full px-3 py-0.5 text-[11px]'>
            {formatDateSeparator(msg.createdAt)}
          </span>
        </div>
      )}
      <div className={cn('flex', isOutgoing ? 'justify-end' : 'justify-start')}>
        <div
          className={cn(
            'max-w-[75%] rounded-2xl px-4 py-2.5',
            isOutgoing
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted rounded-bl-md'
          )}
        >
          <p className='whitespace-pre-wrap text-sm leading-relaxed'>{msg.text}</p>
          <div
            className={cn(
              'mt-1 flex items-center justify-end gap-1 text-[10px]',
              isOutgoing ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}
          >
            <span>{formatMessageTime(msg.createdAt)}</span>
            {isOutgoing && msg.isRead && <ChecksIcon className='h-3 w-3' />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Chat Panel ────────────────────────────────────────────────

function ChatPanel({
  selected,
  messages,
  msgLoading,
  composerText,
  onComposerChange,
  onSend,
  onKeyDown,
  sendPending,
  onStar,
  onMarkDone,
  onToggleContact,
  showContact,
  onDelete
}: Readonly<{
  selected: Conversation;
  messages: Message[];
  msgLoading: boolean;
  composerText: string;
  onComposerChange: (v: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  sendPending: boolean;
  onStar: () => void;
  onMarkDone: () => void;
  onToggleContact: () => void;
  showContact: boolean;
  onDelete: () => void;
}>) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const displayName = selected.companyName || selected.internshipTitle || 'Företag';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  let lastDateKey = '';

  return (
    <>
      {/* Chat header */}
      <div className='flex shrink-0 items-center justify-between border-b px-4 py-2.5'>
        <div className='flex min-w-0 flex-1 items-center gap-2'>
          <span
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white',
              getAvatarColor(displayName)
            )}
          >
            {displayName.charAt(0)}
          </span>
          <span className='shrink-0 text-sm font-semibold'>{displayName}</span>
          {selected.internshipTitle && selected.companyName && (
            <Badge variant='secondary' className='max-w-[200px] truncate text-[10px]'>
              {selected.internshipTitle}
            </Badge>
          )}
        </div>
        <div className='flex shrink-0 items-center gap-0.5'>
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7'
            onClick={onStar}
            title={selected.isStarred ? 'Ta bort stjärna' : 'Stjärnmärk'}
          >
            <ExclusiveIcon
              className={cn('h-4 w-4', selected.isStarred && 'fill-amber-500 text-amber-500')}
            />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7'
            onClick={onMarkDone}
            title='Markera som avslutad'
          >
            <CheckIcon className='h-4 w-4' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7'
            onClick={onToggleContact}
            title={showContact ? 'Dölj företagsinfo' : 'Visa företagsinfo'}
          >
            <BuildingIcon className='h-4 w-4' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7'
            onClick={onDelete}
            title='Arkivera konversation'
          >
            <ArchiveIcon className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Channel info */}
      <div className='text-muted-foreground flex shrink-0 items-center justify-center gap-1.5 border-b py-1.5 text-xs'>
        <MailIcon className='h-3 w-3' />
        <span>via Prakto</span>
      </div>

      {/* Messages area */}
      <ScrollArea className='min-h-0 flex-1'>
        <div className='mx-auto max-w-2xl space-y-3 px-4 py-4'>
          {msgLoading && <MessagesSkeleton />}
          {!msgLoading && messages.length === 0 && (
            <div className='flex flex-col items-center justify-center py-12'>
              <ChatIcon className='text-muted-foreground/30 mb-2 h-8 w-8' />
              <p className='text-muted-foreground text-sm'>Inga meddelanden ännu</p>
              <p className='text-muted-foreground text-xs'>Skriv ett meddelande nedan</p>
            </div>
          )}
          {!msgLoading &&
            messages.map((msg) => {
              const dateKey = new Date(msg.createdAt).toDateString();
              const showSep = dateKey !== lastDateKey;
              lastDateKey = dateKey;
              return <MessageBubble key={msg.$id} msg={msg} showDateSep={showSep} />;
            })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Composer */}
      <div className='shrink-0 border-t'>
        <div className='px-4 py-3'>
          <textarea
            placeholder={`Skriv till ${displayName}...`}
            className='placeholder:text-muted-foreground block w-full resize-none border-0 bg-transparent text-sm outline-none'
            rows={2}
            value={composerText}
            onChange={(e) => onComposerChange(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>
        <div className='flex items-center justify-between border-t px-3 py-2'>
          <div className='flex items-center gap-0.5'>
            <Button variant='ghost' size='icon' className='h-7 w-7'>
              <PaperclipIcon className='h-4 w-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              className='h-7 w-7'
              onClick={onStar}
              title='Stjärnmärk'
            >
              <BookmarkIcon className='h-4 w-4' />
            </Button>
          </div>
          <Button
            size='sm'
            className='h-7 gap-1 px-3 text-xs'
            onClick={onSend}
            disabled={!composerText.trim() || sendPending}
            isLoading={sendPending}
          >
            Skicka
            <SendIcon className='h-3 w-3' />
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── Company Contact Panel ─────────────────────────────────────

function CompanyContactPanel({
  selected,
  companyData,
  onClose,
  onStatusToggle,
  onMarkDone
}: Readonly<{
  selected: Conversation;
  companyData: CompanyDetails | undefined;
  onClose: () => void;
  onStatusToggle: () => void;
  onMarkDone: () => void;
}>) {
  const displayName = selected.companyName || selected.internshipTitle || 'Företag';
  return (
    <div className='hidden w-[260px] shrink-0 flex-col overflow-hidden border-l xl:flex'>
      <div className='flex items-center justify-between border-b px-4 py-2.5'>
        <span className='text-sm font-semibold'>Företagsinfo</span>
        <Button variant='ghost' size='icon' className='h-6 w-6' onClick={onClose}>
          <CloseIcon className='h-3 w-3' />
        </Button>
      </div>

      <ScrollArea className='flex-1 [&>[data-slot=scroll-area-viewport]>div]:!block'>
        {/* Tags */}
        <div className='overflow-hidden border-b px-4 py-2.5'>
          <div className='flex flex-wrap items-center gap-1.5 text-xs'>
            <span className='text-muted-foreground'>Taggar:</span>
            {selected.internshipTitle && (
              <Badge variant='outline' className='h-5 max-w-full truncate text-[10px]'>
                {selected.internshipTitle}
              </Badge>
            )}
            <Badge
              variant={selected.status === 'open' ? 'secondary' : 'outline'}
              className='h-5 text-[10px]'
            >
              {STATUS_LABELS[selected.status]}
            </Badge>
          </div>
        </div>

        {/* Company info */}
        <CollapsibleSection title='Uppgifter'>
          <div className='space-y-0.5 pb-2'>
            {companyData?.company ? (
              <>
                <AttributeRow
                  icon={BuildingIcon}
                  label='Företag'
                  value={companyData.company.name}
                />
                {companyData.company.industry && (
                  <AttributeRow
                    icon={BriefcaseIcon}
                    label='Bransch'
                    value={companyData.company.industry}
                  />
                )}
                {companyData.company.city && (
                  <AttributeRow icon={UserIcon} label='Stad' value={companyData.company.city} />
                )}
                {companyData.company.contactEmail && (
                  <AttributeRow
                    icon={MailIcon}
                    label='E-post'
                    value={companyData.company.contactEmail}
                  />
                )}
                {companyData.company.contactPhone && (
                  <AttributeRow
                    icon={PhoneIcon}
                    label='Telefon'
                    value={companyData.company.contactPhone}
                  />
                )}
              </>
            ) : (
              <>
                <AttributeRow icon={BuildingIcon} label='Företag' value={displayName} />
              </>
            )}
          </div>
        </CollapsibleSection>

        <Separator />

        {/* Description */}
        {companyData?.company?.description && (
          <>
            <CollapsibleSection title='Om företaget'>
              <p className='text-muted-foreground px-4 pb-2 text-xs leading-relaxed'>
                {companyData.company.description}
              </p>
            </CollapsibleSection>
            <Separator />
          </>
        )}

        {/* Action buttons */}
        <div className='space-y-1 p-3'>
          <Button
            variant='outline'
            size='sm'
            className='w-full justify-start gap-2 text-xs'
            onClick={onStatusToggle}
          >
            <ClockIcon className='h-3.5 w-3.5' />
            {selected.status === 'snoozed' ? 'Ta bort vänteläge' : 'Lägg i vänteläge'}
          </Button>
          <Button
            variant='outline'
            size='sm'
            className='w-full justify-start gap-2 text-xs'
            onClick={onMarkDone}
          >
            <CheckIcon className='h-3.5 w-3.5' />
            Markera som avslutad
          </Button>
          {companyData?.company?.website && (
            <Button
              variant='outline'
              size='sm'
              className='w-full justify-start gap-2 text-xs'
              onClick={() => window.open(companyData.company!.website!, '_blank')}
            >
              <GlobeIcon className='h-3.5 w-3.5' />
              Webbplats
            </Button>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────

export default function StudentInbox() {
  const queryClient = useQueryClient();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterTab] = useState<ConversationStatus | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<ConversationFilter>('all');
  const [showContact, setShowContact] = useState(true);
  const [composerText, setComposerText] = useState('');
  const [activeSidebarItem, setActiveSidebarItem] = useState('Alla konversationer');

  // ─── Debounce search ─────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // ─── Queries ─────────────────────────────────────────────────
  const {
    data: convData,
    isLoading: convLoading,
    error: convError
  } = useQuery(
    conversationsQueryOptions({
      status: filterTab,
      search: debouncedSearch || undefined,
      filter: activeFilter
    })
  );

  const conversations = convData?.conversations ?? [];
  const unreadTotal = convData?.unreadTotal ?? 0;
  const selected = conversations.find((c) => c.$id === selectedId) ?? null;

  const { data: msgData, isLoading: msgLoading } = useQuery({
    ...messagesQueryOptions(selectedId ?? ''),
    enabled: !!selectedId
  });
  const messages = msgData?.messages ?? [];

  const { data: companyData } = useQuery({
    ...companyDetailsQueryOptions(selected?.companyId ?? ''),
    enabled: !!selected?.companyId && showContact
  });

  // ─── Mutations ───────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: (p: { conversationId: string; text: string }) =>
      sendMessage(p.conversationId, p.text),
    onSuccess: () => {
      setComposerText('');
      if (selectedId) {
        queryClient.invalidateQueries({
          queryKey: inboxKeys.messages(selectedId)
        });
      }
      queryClient.invalidateQueries({ queryKey: inboxKeys.all });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Kunde inte skicka meddelandet.');
    }
  });

  const statusMutation = useMutation({
    mutationFn: (p: { conversationId: string; status: ConversationStatus }) =>
      updateConversationStatus(p.conversationId, p.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inboxKeys.all });
      toast.success('Status uppdaterad.');
    }
  });

  const starMutation = useMutation({
    mutationFn: (id: string) => toggleConversationStar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inboxKeys.all });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteConversation(id),
    onSuccess: () => {
      setSelectedId(null);
      queryClient.invalidateQueries({ queryKey: inboxKeys.all });
      toast.success('Konversation arkiverad.');
    }
  });

  // ─── Handlers ────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    if (!selectedId || !composerText.trim()) return;
    sendMutation.mutate({
      conversationId: selectedId,
      text: composerText.trim()
    });
  }, [selectedId, composerText, sendMutation]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleSidebarClick = (item: SidebarItemDef) => {
    setActiveSidebarItem(item.label);
    if (item.filter) setActiveFilter(item.filter);
    if (item.status === 'all') {
      setActiveFilter('all');
    }
  };

  const handleMarkDone = () => {
    if (!selectedId) return;
    statusMutation.mutate({
      conversationId: selectedId,
      status: 'done'
    });
  };

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className='flex h-[calc(100vh-4rem)] min-h-0 overflow-hidden'>
      {/* ═══ PANEL 1 — Sidebar ═══ */}
      <div className='hidden w-[220px] shrink-0 flex-col overflow-hidden border-r lg:flex'>
        <div className='flex items-center justify-between px-3 py-3'>
          <span className='text-sm font-semibold'>Inkorg</span>
          {unreadTotal > 0 && (
            <Badge variant='secondary' className='h-5 px-1.5 text-[10px]'>
              {unreadTotal}
            </Badge>
          )}
        </div>

        <ScrollArea className='flex-1'>
          <div className='space-y-0.5 px-1'>
            {SIDEBAR_ITEMS.map((item) => {
              const SideIcon = Icons[item.icon];
              const isActive = activeSidebarItem === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => handleSidebarClick(item)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                    isActive ? 'bg-accent font-medium' : 'hover:bg-accent/50'
                  )}
                >
                  <SideIcon className='h-4 w-4 shrink-0' />
                  <span className='flex-1 truncate text-left'>{item.label}</span>
                  {item.filter === 'unread' && unreadTotal > 0 && (
                    <span className='bg-primary text-primary-foreground rounded-full px-1.5 text-[10px] font-medium'>
                      {unreadTotal}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* ═══ PANEL 2 — Conversation List ═══ */}
      <div className='flex w-full min-w-0 flex-col overflow-hidden border-r md:w-[300px] md:shrink-0'>
        <div className='flex items-center justify-between px-3 py-3'>
          <h2 className='text-sm font-semibold'>{activeSidebarItem}</h2>
        </div>

        {/* Search */}
        <div className='border-b px-3 py-1.5'>
          <Input
            placeholder='Sök konversationer...'
            className='h-7 text-xs'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Conversations */}
        <ScrollArea className='flex-1 [&>[data-slot=scroll-area-viewport]>div]:!block'>
          {convLoading && <ConversationListSkeleton />}
          {!convLoading && convError && <ConversationListError message={convError.message} />}
          {!convLoading && !convError && conversations.length === 0 && (
            <div className='flex flex-col items-center justify-center py-12'>
              <InboxIcon className='text-muted-foreground/30 mb-2 h-8 w-8' />
              <p className='text-muted-foreground text-sm'>Inga konversationer</p>
            </div>
          )}
          {!convLoading &&
            !convError &&
            conversations.map((conv: Conversation) => {
              const displayName = conv.companyName || conv.internshipTitle || 'Företag';
              const initial = displayName.charAt(0);
              const isSelected = conv.$id === selectedId;
              const isUnread = !conv.isReadByStudent;
              const color = getAvatarColor(displayName);

              return (
                <button
                  key={conv.$id}
                  onClick={() => setSelectedId(conv.$id)}
                  className={cn(
                    'flex w-full items-start gap-2.5 overflow-hidden border-b px-3 py-3 text-left transition-colors',
                    isSelected ? 'bg-accent' : 'hover:bg-accent/40',
                    isUnread && 'bg-primary/[0.03]'
                  )}
                >
                  {/* Unread dot */}
                  <div className='flex w-2 shrink-0 items-center pt-3'>
                    {isUnread && <span className='bg-primary h-2 w-2 rounded-full' />}
                  </div>

                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white',
                      color
                    )}
                  >
                    {initial}
                  </span>

                  <div className='min-w-0 flex-1 overflow-hidden'>
                    <div className='flex items-center justify-between gap-1'>
                      <span className={cn('truncate text-sm', isUnread && 'font-semibold')}>
                        {displayName}
                      </span>
                      <div className='flex shrink-0 items-center gap-1'>
                        {conv.isStarred && <ExclusiveIcon className='h-3 w-3 text-amber-500' />}
                        <span
                          className={cn(
                            'text-[11px]',
                            isUnread ? 'text-foreground font-medium' : 'text-muted-foreground'
                          )}
                        >
                          {formatTimestamp(conv.lastMessageAt)}
                        </span>
                      </div>
                    </div>

                    {conv.internshipTitle && conv.companyName && (
                      <div className='text-muted-foreground mt-0.5 flex items-center gap-1 text-[11px]'>
                        <BriefcaseIcon className='h-3 w-3 shrink-0' />
                        <span className='truncate'>{conv.internshipTitle}</span>
                      </div>
                    )}

                    {conv.lastMessage && (
                      <p
                        className={cn(
                          'mt-0.5 truncate text-xs',
                          isUnread ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {conv.lastMessage}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
        </ScrollArea>
      </div>

      {/* ═══ PANEL 3 — Chat / Message View ═══ */}
      <div className='hidden min-w-0 flex-1 flex-col overflow-hidden md:flex'>
        {selected ? (
          <ChatPanel
            selected={selected}
            messages={messages}
            msgLoading={msgLoading}
            composerText={composerText}
            onComposerChange={setComposerText}
            onSend={handleSend}
            onKeyDown={handleKeyDown}
            sendPending={sendMutation.isPending}
            onStar={() => starMutation.mutate(selected.$id)}
            onMarkDone={handleMarkDone}
            onToggleContact={() => setShowContact(!showContact)}
            showContact={showContact}
            onDelete={() => deleteMutation.mutate(selected.$id)}
          />
        ) : (
          <div className='flex flex-1 flex-col items-center justify-center'>
            <InboxIcon className='text-muted-foreground/30 mb-3 h-12 w-12' />
            <p className='text-muted-foreground text-sm'>Välj en konversation</p>
          </div>
        )}
      </div>

      {/* ═══ PANEL 4 — Company Details ═══ */}
      {selected && showContact && (
        <CompanyContactPanel
          selected={selected}
          companyData={companyData}
          onClose={() => setShowContact(false)}
          onStatusToggle={() =>
            statusMutation.mutate({
              conversationId: selected.$id,
              status: selected.status === 'snoozed' ? 'open' : 'snoozed'
            })
          }
          onMarkDone={handleMarkDone}
        />
      )}
    </div>
  );
}
