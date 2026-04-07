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
  studentDetailsQueryOptions,
  applicantsQueryOptions,
  inboxKeys
} from '../api/queries';
import {
  sendMessage,
  updateConversationStatus,
  toggleConversationStar,
  deleteConversation,
  createConversation
} from '../api/service';
import type {
  Conversation,
  Message,
  ConversationStatus,
  ConversationFilter,
  StudentDetails,
  Applicant
} from '../api/types';

// ─── PascalCase icon aliases (ESLint: jsx-pascal-case) ────────

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
const SchoolIcon = Icons.school;
const ArchiveIcon = Icons.archive;
const ClockIcon = Icons.clock;
const GlobeIcon = Icons.globe;
const ApplicationsIcon = Icons.applications;

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
  return date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
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

// ─── Message Bubble ────────────────────────────────────────────

function MessageBubble({ msg, showDateSep }: Readonly<{ msg: Message; showDateSep: boolean }>) {
  const isOutgoing = msg.senderRole === 'company';
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
              getAvatarColor(selected.studentName)
            )}
          >
            {selected.studentName.charAt(0)}
          </span>
          <span className='shrink-0 text-sm font-semibold'>{selected.studentName}</span>
          {selected.internshipTitle && (
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
            title={showContact ? 'Dölj kontaktinfo' : 'Visa kontaktinfo'}
          >
            <UserIcon className='h-4 w-4' />
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
            placeholder={`Hej ${selected.studentName.split(' ')[0]},`}
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

// ─── Contact Panel ─────────────────────────────────────────────

function ContactPanel({
  selected,
  studentData,
  onClose,
  onStatusToggle,
  onMarkDone
}: Readonly<{
  selected: Conversation;
  studentData: StudentDetails | undefined;
  onClose: () => void;
  onStatusToggle: () => void;
  onMarkDone: () => void;
}>) {
  return (
    <div className='hidden w-[260px] shrink-0 flex-col overflow-hidden border-l xl:flex'>
      <div className='flex items-center justify-between border-b px-4 py-2.5'>
        <span className='text-sm font-semibold'>Kontakt</span>
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

        {/* Student info */}
        <CollapsibleSection title='Uppgifter'>
          <ContactInfo selected={selected} studentData={studentData} />
        </CollapsibleSection>

        <Separator />

        {/* Skills */}
        {studentData?.student?.skills && studentData.student.skills.length > 0 && (
          <>
            <CollapsibleSection title='Kompetenser'>
              <div className='flex flex-wrap gap-1 px-4 pb-2'>
                {studentData.student.skills.map((skill: string) => (
                  <Badge key={skill} variant='outline' className='text-[10px]'>
                    {skill}
                  </Badge>
                ))}
              </div>
            </CollapsibleSection>
            <Separator />
          </>
        )}

        {/* Bio */}
        {studentData?.student?.bio && (
          <>
            <CollapsibleSection title='Om studenten'>
              <p className='text-muted-foreground px-4 pb-2 text-xs leading-relaxed'>
                {studentData.student.bio}
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
          {studentData?.student?.cvFileId && (
            <Button
              variant='outline'
              size='sm'
              className='w-full justify-start gap-2 text-xs'
              onClick={() => {
                const cvId = studentData?.student?.cvFileId;
                if (cvId) {
                  window.open(
                    `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/cvs/files/${cvId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`,
                    '_blank'
                  );
                }
              }}
            >
              <PaperclipIcon className='h-3.5 w-3.5' />
              Visa CV
            </Button>
          )}
          {studentData?.student?.linkedinUrl && (
            <Button
              variant='outline'
              size='sm'
              className='w-full justify-start gap-2 text-xs'
              onClick={() => {
                const url = studentData?.student?.linkedinUrl;
                if (url) window.open(url, '_blank');
              }}
            >
              <GlobeIcon className='h-3.5 w-3.5' />
              LinkedIn
            </Button>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Contact Info Sub-component ────────────────────────────────

function ContactInfo({
  selected,
  studentData
}: Readonly<{
  selected: Conversation;
  studentData: StudentDetails | undefined;
}>) {
  return (
    <div className='space-y-0.5 pb-2'>
      {studentData?.user ? (
        <>
          <AttributeRow icon={UserIcon} label='Namn' value={studentData.user.displayName} />
          <AttributeRow icon={MailIcon} label='E-post' value={studentData.user.email} />
          {studentData.user.phone && (
            <AttributeRow icon={PhoneIcon} label='Telefon' value={studentData.user.phone} />
          )}
        </>
      ) : (
        <>
          <AttributeRow icon={UserIcon} label='Namn' value={selected.studentName} />
          {selected.studentEmail && (
            <AttributeRow icon={MailIcon} label='E-post' value={selected.studentEmail} />
          )}
        </>
      )}

      {studentData?.student && (
        <>
          <AttributeRow icon={SchoolIcon} label='Skola' value={studentData.student.school} />
          <AttributeRow icon={BriefcaseIcon} label='Program' value={studentData.student.program} />
          {studentData.student.city && (
            <AttributeRow icon={UserIcon} label='Stad' value={studentData.student.city} />
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────

export default function CompanyInbox() {
  const queryClient = useQueryClient();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterTab] = useState<ConversationStatus | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<ConversationFilter>('all');
  const [showContact, setShowContact] = useState(true);
  const [composerText, setComposerText] = useState('');
  const [activeSidebarItem, setActiveSidebarItem] = useState('Alla konversationer');
  const [selectedInternshipId, setSelectedInternshipId] = useState('');
  const [pendingConversation, setPendingConversation] = useState<Conversation | null>(null);

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
      internshipId: selectedInternshipId || undefined,
      filter: activeFilter
    })
  );

  const conversations = convData?.conversations ?? [];
  const internships = convData?.internships ?? [];
  const unreadTotal = convData?.unreadTotal ?? 0;

  // Use message query's conversation as fallback when conversation isn't in filtered list
  const { data: msgData, isLoading: msgLoading } = useQuery({
    ...messagesQueryOptions(selectedId ?? ''),
    enabled: !!selectedId
  });
  const messages = msgData?.messages ?? [];

  const selected =
    conversations.find((c) => c.$id === selectedId) ??
    pendingConversation ??
    (msgData?.conversation as Conversation | undefined) ??
    null;

  // Clear pendingConversation once the real data has the conversation
  useEffect(() => {
    if (pendingConversation && conversations.some((c) => c.$id === pendingConversation.$id)) {
      setPendingConversation(null);
    }
  }, [conversations, pendingConversation]);

  const { data: studentData } = useQuery({
    ...studentDetailsQueryOptions(selected?.studentId ?? ''),
    enabled: !!selected?.studentId && showContact
  });

  const { data: applicantsData } = useQuery(applicantsQueryOptions());
  const applicants = applicantsData?.applicants ?? [];

  // ─── Mutations ───────────────────────────────────────────────
  const createConvMutation = useMutation({
    mutationFn: (p: { studentId: string; internshipId?: string; applicationId?: string }) =>
      createConversation(p),
    onSuccess: (data) => {
      const conv = data.conversation as Conversation;
      if (conv?.$id) {
        // Store as pending so chat panel renders immediately
        setPendingConversation(conv);
        setActiveFilter('all');
        setActiveSidebarItem('Alla konversationer');
        setSelectedInternshipId('');
        setSelectedId(conv.$id);
      }
      queryClient.invalidateQueries({ queryKey: inboxKeys.all });
      toast.success('Konversation skapad — skriv ditt första meddelande.');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Kunde inte skapa konversation.');
    }
  });

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
    setSelectedInternshipId('');
  };

  const handleMarkDone = () => {
    if (!selectedId) return;
    statusMutation.mutate({ conversationId: selectedId, status: 'done' });
  };

  const handleContactApplicant = (applicant: Applicant) => {
    if (applicant.conversationId) {
      // Already has a conversation — switch to "all" filter and navigate
      setActiveFilter('all');
      setActiveSidebarItem('Alla konversationer');
      setSelectedInternshipId('');
      setSelectedId(applicant.conversationId);
    } else {
      // Create new conversation
      createConvMutation.mutate({
        studentId: applicant.studentId,
        internshipId: applicant.internshipId,
        applicationId: applicant.$id
      });
    }
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

          <Separator className='my-2' />

          <CollapsibleSection title='Praktikplatser' count={internships.length}>
            <div className='space-y-0.5 px-1'>
              {internships.map((int) => (
                <button
                  key={int.$id}
                  onClick={() =>
                    setSelectedInternshipId(int.$id === selectedInternshipId ? '' : int.$id)
                  }
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm',
                    selectedInternshipId === int.$id
                      ? 'bg-accent font-medium'
                      : 'hover:bg-accent/50'
                  )}
                >
                  <BriefcaseIcon className='text-muted-foreground h-3.5 w-3.5 shrink-0' />
                  <span className='flex-1 truncate text-left'>{int.title}</span>
                </button>
              ))}
              {internships.length === 0 && (
                <p className='text-muted-foreground px-2 py-1 text-xs'>Inga praktikplatser</p>
              )}
            </div>
          </CollapsibleSection>

          <Separator className='my-2' />

          <CollapsibleSection title='Ansökande' count={applicants.length} defaultOpen={false}>
            <div className='space-y-0.5 px-1'>
              {applicants.map((app) => {
                const color = getAvatarColor(app.studentName);
                const hasConv = !!app.conversationId;
                return (
                  <button
                    key={app.$id}
                    onClick={() => handleContactApplicant(app)}
                    disabled={createConvMutation.isPending}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                      'hover:bg-accent/50 active:bg-accent',
                      createConvMutation.isPending && 'opacity-50 cursor-not-allowed'
                    )}
                    title={hasConv ? 'Öppna konversation' : 'Starta ny konversation'}
                  >
                    <span
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white',
                        color
                      )}
                    >
                      {app.studentName.charAt(0)}
                    </span>
                    <div className='min-w-0 flex-1'>
                      <span className='block truncate text-xs font-medium'>{app.studentName}</span>
                      {app.internshipTitle && (
                        <span className='text-muted-foreground block truncate text-[10px]'>
                          {app.internshipTitle}
                        </span>
                      )}
                    </div>
                    {hasConv ? (
                      <Badge variant='outline' className='h-4 shrink-0 px-1 text-[9px]'>
                        Chatt
                      </Badge>
                    ) : (
                      <Badge variant='default' className='h-4 shrink-0 px-1 text-[9px]'>
                        Kontakta
                      </Badge>
                    )}
                  </button>
                );
              })}
              {applicants.length === 0 && (
                <p className='text-muted-foreground px-2 py-1 text-xs'>Inga ansökande</p>
              )}
            </div>
          </CollapsibleSection>
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
              const initial = conv.studentName.charAt(0);
              const isSelected = conv.$id === selectedId;
              const isUnread = !conv.isReadByCompany;
              const color = getAvatarColor(conv.studentName);

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
                        {conv.studentName}
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

                    {conv.internshipTitle && (
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

      {/* ═══ PANEL 4 — Contact / Student Details ═══ */}
      {selected && showContact && (
        <ContactPanel
          selected={selected}
          studentData={studentData}
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
