import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenLine, Send, AlertTriangle, Info, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';
import { notesApi, type Note, type MessageType } from '../../api/notesApi';

const EMPLOYEE_ID = 1; // Hardcoded for now

const CATEGORIES: {
  value: MessageType;
  label: string;
  description: string;
  icon: React.ElementType;
  activeClasses: string;
}[] = [
  {
    value: 'general',
    label: 'General',
    description: 'Just a standard note',
    icon: Info,
    activeClasses: 'bg-blue-50 border-blue-300 text-blue-700',
  },
  {
    value: 'concern',
    label: 'Concern',
    description: 'Something needs addressing',
    icon: MessageSquare,
    activeClasses: 'bg-amber-50 border-amber-300 text-amber-700',
  },
  {
    value: 'urgent',
    label: 'Urgent',
    description: 'Needs immediate attention',
    icon: AlertTriangle,
    activeClasses: 'bg-red-50 border-red-300 text-red-700',
  },
];

function getCategoryMeta(type: MessageType) {
  return CATEGORIES.find(c => c.value === type) ?? CATEGORIES[0]!;
}


function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotesManager() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [subject, setSubject] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('general');

  useEffect(() => { loadNotes(); }, []);

  const loadNotes = async () => {
    try {
      setIsLoading(true);
      setNotes(await notesApi.getNotesByEmployee(EMPLOYEE_ID));
    } catch {
      // fail silently, show empty state
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    try {
      setIsSending(true);
      setError(null);
      const newNote = await notesApi.createNote({ employeeId: EMPLOYEE_ID, messageType, subject, messageText });
      setNotes(prev => [newNote, ...prev]);
      setSubject('');
      setMessageText('');
      setMessageType('general');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSending(false);
    }
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

      {/* ── Left: Compose ── */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-6">
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">New note</p>
          <h2 className="text-2xl font-bold font-poppins text-gray-900">Leave a note</h2>
          <p className="text-sm text-gray-500 mt-1">The owner will see this when they check in.</p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-sm"
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
              <div>
                <p className="font-semibold text-red-700 mb-0.5">Could not send note</p>
                <p className="text-red-600">{error}</p>
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
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#4a6741] focus:ring-2 focus:ring-[#4a6741]/20 outline-none transition-all text-sm placeholder:text-gray-400"
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
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#4a6741] focus:ring-2 focus:ring-[#4a6741]/20 outline-none transition-all text-sm resize-none placeholder:text-gray-400"
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

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-6 h-6 border-[3px] border-[#4a6741] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-400">Loading your notes...</p>
            </div>
          )}

          {!isLoading && notes.length === 0 && (
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
                    key={note.noteId}
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
                        {note.messageStatus === 'new' && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                        <span className="text-[11px] opacity-70">{timeAgo(note.createdAt)}</span>
                      </div>
                    </div>
                    {/* Subject (if present) */}
                    {note.subject && (
                      <p className="text-sm font-semibold text-gray-900 mb-0.5">{note.subject}</p>
                    )}
                    {/* Message */}
                    <p className="text-sm text-gray-700 leading-relaxed">{note.messageText}</p>
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
