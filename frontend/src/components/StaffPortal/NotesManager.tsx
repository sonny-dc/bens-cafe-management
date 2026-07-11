import { useState, useEffect, type ElementType, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenLine, Send, AlertTriangle, Info, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';
import { notesApi, type Note, type MessageType } from '../../api/notesApi';
import { formatIsoDateTimeToShortDateTime } from '../../utils/datetime.utils';

import { MESSAGE_TYPES, MESSAGE_STATUS } from 'shared/constants';

const CATEGORIES: {
  value: MessageType;
  label: string;
  description: string;
  example: string;
  icon: ElementType;
  activeClasses: string;
}[] = [
  {
    value: MESSAGE_TYPES.GENERAL,
    label: 'General',
    description:
      'Use for routine updates, reminders, or information that does not require immediate attention.',
    example:
      'The coffee grinder was cleaned before the afternoon shift.',
    icon: Info,
    activeClasses: 'bg-blue-50 border-blue-300 text-blue-700',
  },
  {
    value: MESSAGE_TYPES.CONCERN,
    label: 'Concern',
    description:
      'Use for an issue that should be reviewed but does not currently require immediate action.',
    example:
      'The espresso machine is taking longer than usual to heat up.',
    icon: MessageSquare,
    activeClasses: 'bg-amber-50 border-amber-300 text-amber-700',
  },
  {
    value: MESSAGE_TYPES.URGENT,
    label: 'Urgent',
    description:
      'Use when immediate attention is required because the issue may affect staff, customers, or store operations.',
    example:
      'The espresso machine is leaking and cannot be used safely.',
    icon: AlertTriangle,
    activeClasses: 'bg-red-50 border-red-300 text-red-700',
  },
];

function getCategoryMeta(type: MessageType) {
  return CATEGORIES.find(c => c.value === type) ?? CATEGORIES[0]!;
}

export function NotesManager() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [subject, setSubject] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messageType, setMessageType] = useState<MessageType>(MESSAGE_TYPES.GENERAL);
  const [expandedNoteIds, setExpandedNoteIds] = useState<number[]>([]);
  const [isNoteGuideOpen, setIsNoteGuideOpen] = useState(false);

  useEffect(() => { loadNotes(); }, []);

  const loadNotes = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const data = await notesApi.getMyNotes();

      setNotes(
        data.sort((a, b) => {
          const dateA = String(a.postedAt || a.createdAt);
          const dateB = String(b.postedAt || b.createdAt);

          return dateB.localeCompare(dateA);
        })
      );
    } catch (error) {
      if (error instanceof Error) {
        setLoadError(error.message);
      } else {
        setLoadError('Could not load your notes.');
      }

      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!messageText.trim()) return;

    try {
      setIsSending(true);
      setSubmitError(null);

      const newNote = await notesApi.createNote({
        messageType,
        subject: subject.trim() ? subject.trim() : null,
        messageText: messageText.trim()
      });

      setNotes(prev => [newNote, ...prev]);
      setSubject('');
      setMessageText('');
      setMessageType(MESSAGE_TYPES.GENERAL);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (error) {
      if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSending(false);
    }
  };

  const toggleExpandedNote = (messageId: number) => {
    setExpandedNoteIds(prev =>
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const shouldShowViewMore = (text?: string | null, maxLength = 140) => {
    if (!text) return false;

    return text.includes('\n') || text.length > maxLength;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

      {/* ── Left: Compose ── */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-6">
        <div className="relative mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
                New note
              </p>

              <h2 className="text-2xl font-bold text-gray-900 font-poppins">
                Leave a note
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                The owner will see this when they check in.
              </p>
            </div>

            <motion.button
              type="button"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.92 }}
              onClick={() =>
                setIsNoteGuideOpen(current => !current)
              }
              aria-expanded={isNoteGuideOpen}
              aria-label={
                isNoteGuideOpen
                  ? 'Close note type guide'
                  : 'View note type guide'
              }
              title="About note types"
              className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border transition-colors ${
                isNoteGuideOpen
                  ? 'border-[#4a6741] bg-[#4a6741] text-white shadow-sm'
                  : 'border-gray-200 bg-white text-gray-400 hover:border-[#4a6741]/30 hover:bg-[#4a6741]/5 hover:text-[#4a6741]'
              }`}
            >
              <motion.span
                animate={{
                  rotate: isNoteGuideOpen ? 180 : 0
                }}
                transition={{
                  duration: 0.3,
                  ease: [0.22, 1, 0.36, 1]
                }}
                className="flex items-center justify-center"
              >
                <Info size={17} />
              </motion.span>
            </motion.button>
          </div>

          <AnimatePresence initial={false}>
            {isNoteGuideOpen && (
              <motion.div
                initial={{
                  opacity: 0,
                  height: 0,
                  y: -8
                }}
                animate={{
                  opacity: 1,
                  height: 'auto',
                  y: 0
                }}
                exit={{
                  opacity: 0,
                  height: 0,
                  y: -8
                }}
                transition={{
                  duration: 0.32,
                  ease: [0.22, 1, 0.36, 1]
                }}
                className="overflow-hidden"
              >
                <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
                  <div className="mb-4">
                    <p className="text-sm font-bold text-gray-900 font-poppins">
                      Choosing the right note type
                    </p>

                    <p className="mt-1 text-xs leading-relaxed text-gray-500">
                      Select the category that best represents how quickly the
                      owner should review your message.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {CATEGORIES.map((category, index) => {
                      const CategoryIcon = category.icon;

                      const categoryStyle =
                        category.value === MESSAGE_TYPES.URGENT
                          ? {
                              container:
                                'border-red-100 bg-red-50/70',
                              icon: 'bg-red-100 text-red-700',
                              title: 'text-red-700'
                            }
                          : category.value === MESSAGE_TYPES.CONCERN
                            ? {
                                container:
                                  'border-amber-100 bg-amber-50/70',
                                icon: 'bg-amber-100 text-amber-700',
                                title: 'text-amber-700'
                              }
                            : {
                                container:
                                  'border-blue-100 bg-blue-50/70',
                                icon: 'bg-blue-100 text-blue-700',
                                title: 'text-blue-700'
                              };

                      return (
                        <motion.div
                          key={category.value}
                          initial={{
                            opacity: 0,
                            y: 8
                          }}
                          animate={{
                            opacity: 1,
                            y: 0
                          }}
                          transition={{
                            duration: 0.28,
                            delay: index * 0.06,
                            ease: [0.22, 1, 0.36, 1]
                          }}
                          className={`rounded-xl border p-3 ${categoryStyle.container}`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${categoryStyle.icon}`}
                            >
                              <CategoryIcon size={15} />
                            </div>

                            <div className="min-w-0">
                              <p
                                className={`text-xs font-bold ${categoryStyle.title}`}
                              >
                                {category.label}
                              </p>

                              <p className="mt-1 text-[11px] leading-relaxed text-gray-600">
                                {category.description}
                              </p>

                              <div className="mt-2 rounded-lg bg-white/80 px-3 py-2">
                                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                                  Example
                                </p>

                                <p className="mt-1 text-[11px] italic leading-relaxed text-gray-600">
                                  “{category.example}”
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <p className="mt-4 text-[10px] leading-relaxed text-gray-400">
                    Urgent notes should only be used when immediate attention is
                    genuinely required.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error */}
        <AnimatePresence>
          {submitError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-sm"
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
              <div>
                <p className="font-semibold text-red-700 mb-0.5">Could not send note</p>
                <p className="text-red-600">{submitError}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5 text-sm text-emerald-700 font-semibold"
            >
              <CheckCircle2 size={16} />
              Note sent! The owner will be notified.
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Category pills */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Type</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const active = messageType === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setMessageType(cat.value)}
                    title={cat.description}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all
                      ${active
                        ? cat.activeClasses
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                      }`}
                  >
                    <Icon size={14} />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Subject (optional)</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Running low on oat milk"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#4a6741] focus:ring-2 focus:ring-[#4a6741]/20 outline-none transition-all text-sm text-black placeholder:text-gray-400"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
            <textarea
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              placeholder="Describe what happened or what the owner needs to know..."
              required
              rows={5}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#4a6741] focus:ring-2 focus:ring-[#4a6741]/20 outline-none transition-all text-sm text-black resize-none placeholder:text-gray-400"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSending || !messageText.trim()}
            className="flex items-center justify-center gap-2 w-full bg-[#4a6741] hover:bg-[#3d5836] disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-sm"
          >
            {isSending
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><Send size={16} /> Send Note</>
            }
          </motion.button>
        </form>
      </div>

      {/* ── Right: Notes list ── */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <PenLine size={15} className="text-[#4a6741]" />
              Your notes
            </p>
            {notes.length > 0 && (
              <span className="text-xs bg-gray-100 text-gray-500 font-medium px-2 py-0.5 rounded-full">{notes.length}</span>
            )}
          </div>

          <AnimatePresence>
            {loadError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm"
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
                <div>
                  <p className="font-semibold text-red-700 mb-0.5">Could not load notes</p>
                  <p className="text-red-600">{loadError}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-6 h-6 border-[3px] border-[#4a6741] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-400">Loading your notes...</p>
            </div>
          )}

          {!isLoading && !loadError && notes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                <MessageSquare size={20} className="text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-600">No notes yet</p>
              <p className="text-xs text-gray-400 mt-1 max-w-[160px]">Use the form to leave a message for the owner.</p>
            </div>
          )}

          <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-0.5">
            <AnimatePresence>
              {notes.map(note => {
                const meta = getCategoryMeta(note.messageType);
                const Icon = meta.icon;
                return (
                  <motion.div
                    key={note.messageId}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl border p-4 ${meta.activeClasses.split(' ').filter(c => !c.includes('text-')).join(' ')}`}
                  >
                    {/* Header row */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Icon size={13} className="shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-wide truncate">{meta.label}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {note.messageStatus === MESSAGE_STATUS.NEW && (
                          <span
                            title="New"
                            className="w-1.5 h-1.5 rounded-full bg-red-500"
                          />
                        )}

                        {note.messageStatus === MESSAGE_STATUS.ACKNOWLEDGED && (
                          <span
                            title="Acknowledged"
                            className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                          />
                        )}
                        <span className="text-[10px] text-gray-500 font-medium">
                          {formatIsoDateTimeToShortDateTime(String(note.postedAt))}
                        </span>
                      </div>
                    </div>
                    {/* Subject (if present) */}
                    {note.subject && (
                      <p className="mb-0.5 break-words text-sm font-semibold text-gray-900 [overflow-wrap:anywhere]">
                        {note.subject}
                      </p>
                    )}

                    {/* Message */}
                    <p
                      className={`whitespace-pre-line break-words text-sm leading-relaxed text-gray-700 [overflow-wrap:anywhere] ${
                        expandedNoteIds.includes(note.messageId)
                          ? ''
                          : 'line-clamp-3'
                      }`}
                    >
                      {note.messageText}
                    </p>

                    {shouldShowViewMore(note.messageText) && (
                      <button
                        type="button"
                        onClick={() => toggleExpandedNote(note.messageId)}
                        className="mt-2 text-[11px] font-bold text-[#4a6741] transition-colors hover:text-[#3a5233]"
                      >
                        {expandedNoteIds.includes(note.messageId) ? 'View less' : 'View more'}
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
