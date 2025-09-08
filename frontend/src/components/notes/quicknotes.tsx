'use client';

import { useState, useRef, useEffect } from 'react';
import { Josefin_Sans } from 'next/font/google';
import { ArrowLeft, Plus, Search, Hash, Pin, Trash2, Edit3, Save, X, Filter, Grid3X3, List, Clock, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BackgroundAnimation from '@/components/shared/backgroundanimation';
import { useAuth } from '@/contexts/authcontext';
import { useProjects } from '@/contexts/projectcontext';
import { notesAPI } from '@/lib/api';

const josefinSans = Josefin_Sans({ subsets: ['latin'] });

interface QuickNotesProps {
  onBack?: () => void;
}

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  isStarred: boolean;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  projectId?: string;
}

const NOTE_COLORS = [
  { name: 'Default', value: '#1e293b', bg: 'bg-slate-800' },
  { name: 'Green', value: '#059669', bg: 'bg-green-800' },
  { name: 'Lime', value: '#65a30d', bg: 'bg-lime-700' },
  { name: 'Emerald', value: '#059669', bg: 'bg-emerald-600' },
  { name: 'Cyan', value: '#0891b2', bg: 'bg-cyan-600' },
  { name: 'Teal', value: '#0d9488', bg: 'bg-teal-700' },
  { name: 'Cyan', value: '#0891b2', bg: 'bg-cyan-600' }
];

// Mock data removed - new users should see empty state

function EditNoteModal({ isOpen, note, onClose, onUpdateNote }: {
  isOpen: boolean;
  note: Note;
  onClose: () => void;
  onUpdateNote: (noteData: { title: string; content: string; tags: string[]; color: string }) => Promise<Note>;
}) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tags, setTags] = useState<string[]>(note.tags);
  const [tagInput, setTagInput] = useState('');
  const [selectedColor, setSelectedColor] = useState(note.color);
  const [loading, setLoading] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    if (!title.trim() && !content.trim()) return;
    
    setLoading(true);
    try {
      await onUpdateNote({
        title: title || 'Untitled',
        content,
        tags,
        color: selectedColor
      });
      onClose();
    } catch (error) {
      console.error('Failed to update note:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addTag();
    }
  };

  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden"
      >
        <div className="ultra-glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-light text-white mb-1">Edit Note</h2>
              <p className="text-slate-400 text-sm">Update your thoughts</p>
            </div>
            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-full bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-transparent border-0 text-white placeholder-slate-400 text-lg font-light focus:outline-none"
                placeholder="Note title (optional)"
              />
            </div>

            <div className="border-t border-slate-600/30 pt-4">
              <textarea
                ref={contentRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 bg-slate-800/30 border border-slate-600/40 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 resize-none transition-all"
                placeholder="Start writing your note..."
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="flex items-center space-x-2 flex-1">
                <Hash className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/60 text-sm"
                  placeholder="Add tags"
                />
                <button
                  onClick={addTag}
                  className="px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg transition-all text-sm"
                >
                  Add
                </button>
              </div>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <motion.span
                    key={tag}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center space-x-1 px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded-md text-xs border border-cyan-500/30"
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                ))}
              </div>
            )}

            <div>
              <label className="block text-sm font-light text-slate-300 mb-3">Color</label>
              <div className="flex space-x-2">
                {NOTE_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor === color.value 
                        ? 'border-white scale-110' 
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-600/30">
              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || (!title.trim() && !content.trim())}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg transition-all font-light flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Update Note</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CreateNoteModal({ isOpen, onClose, onCreateNote, availableProjects, initialProjectId }: {
  isOpen: boolean;
  onClose: () => void;
  onCreateNote: (noteData: { title: string; content: string; tags: string[]; color: string }, projectId?: string) => Promise<Note>;
  availableProjects: { id: string; name: string }[];
  initialProjectId?: string;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0].value);
  const [loading, setLoading] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [shareWithTeam, setShareWithTeam] = useState(!!initialProjectId);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(initialProjectId);

  const handleSubmit = async () => {
    if (!title.trim() && !content.trim()) return;
    
    setLoading(true);
    try {
      await onCreateNote({
        title: title || 'Untitled',
        content,
        tags,
        color: selectedColor
      }, shareWithTeam ? selectedProjectId : undefined);
      
      // Reset form
      setTitle('');
      setContent('');
      setTags([]);
      setTagInput('');
      setSelectedColor(NOTE_COLORS[0].value);
      setShareWithTeam(!!initialProjectId);
      setSelectedProjectId(initialProjectId);
      onClose();
    } catch (error) {
      console.error('Failed to create note:', error);
      // Handle error - could show toast notification
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addTag();
    }
  };

  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden"
      >
        <div className="ultra-glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-light text-white mb-1">Create Note</h2>
              <p className="text-slate-400 text-sm">Capture your thoughts instantly</p>
            </div>
            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-full bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {availableProjects.length > 0 && (
              <div className="flex items-center justify-between bg-slate-800/30 border border-slate-600/40 rounded-xl p-3">
                <label className="flex items-center gap-2 text-slate-300 text-sm">
                  <input
                    type="checkbox"
                    checked={shareWithTeam}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setShareWithTeam(checked);
                      if (checked && !selectedProjectId && availableProjects.length > 0) {
                        setSelectedProjectId(availableProjects[0].id);
                      }
                    }}
                    className="accent-cyan-500"
                  />
                  Share with team
                </label>
                {shareWithTeam && (
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="px-3 py-2 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400/60"
                  >
                    {availableProjects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>
            )}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-transparent border-0 text-white placeholder-slate-400 text-lg font-light focus:outline-none"
                placeholder="Note title (optional)"
              />
            </div>

            <div className="border-t border-slate-600/30 pt-4">
              <textarea
                ref={contentRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 bg-slate-800/30 border border-slate-600/40 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 resize-none transition-all"
                placeholder="Start writing your note..."
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="flex items-center space-x-2 flex-1">
                <Hash className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/60 text-sm"
                  placeholder="Add tags"
                />
                <button
                  onClick={addTag}
                  className="px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg transition-all text-sm"
                >
                  Add
                </button>
              </div>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <motion.span
                    key={tag}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center space-x-1 px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded-md text-xs border border-cyan-500/30"
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                ))}
              </div>
            )}

            <div>
              <label className="block text-sm font-light text-slate-300 mb-3">Color</label>
              <div className="flex space-x-2">
                {NOTE_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor === color.value 
                        ? 'border-white scale-110' 
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-600/30">
              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || (!title.trim() && !content.trim())}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-cyan-600 hover:from-green-400 hover:to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg transition-all font-light flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Note</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function NoteCard({ note, onEdit, onDelete, onTogglePin, onToggleStar, canEdit }: {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleStar: (id: string) => void;
  canEdit: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={`premium-note-card group cursor-pointer transition-all duration-300 relative overflow-hidden ${
        note.isPinned ? 'ring-1 ring-yellow-400/30' : ''
      }`}
      style={{ 
        backgroundColor: `${note.color}40`,
        borderColor: `${note.color}60`
      }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {note.isPinned && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
      )}

      {/* Actions */}
      <AnimatePresence>
        {showActions && canEdit && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-3 right-3 flex items-center space-x-1 bg-black/80 backdrop-blur-sm rounded-lg p-1 z-50"
            style={{ pointerEvents: 'auto' }}
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
            onToggleStar(note.id);
              }}
              className={`p-1.5 rounded-md transition-all cursor-pointer z-10 ${
                note.isStarred 
                  ? 'text-yellow-400 hover:text-yellow-300 bg-yellow-400/20' 
                  : 'text-slate-400 hover:text-yellow-400 hover:bg-yellow-400/10'
              }`}
            >
              <Star className={`w-3 h-3 ${note.isStarred ? 'fill-current' : ''}`} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onTogglePin(note.id);
              }}
              className={`p-1.5 rounded-md transition-all cursor-pointer z-10 ${
                note.isPinned 
                  ? 'text-yellow-400 hover:text-yellow-300 bg-yellow-400/20' 
                  : 'text-slate-400 hover:text-yellow-400 hover:bg-yellow-400/10'
              }`}
            >
              <Pin className={`w-3 h-3 ${note.isPinned ? 'fill-current' : ''}`} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log('Edit clicked for note:', note.id);
                onEdit(note);
              }}
              className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-md transition-all cursor-pointer z-10"
            >
              <Edit3 className="w-3 h-3" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log('Delete clicked for note:', note.id);
                onDelete(note.id);
              }}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all cursor-pointer z-10"
            >
              <Trash2 className="w-3 h-3" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-5">
        <div className="flex items-center justify-between mb-1">
          {note.title && (
          <h3 className="font-light text-white text-sm mb-2 pr-8 leading-tight">
            {note.title}
          </h3>
          )}
          {note.projectId && (
            <span className="ml-2 px-2 py-0.5 text-[10px] rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Shared</span>
          )}
        </div>
        
        <div className={`text-slate-300 text-xs leading-relaxed transition-all duration-300 ${
          isExpanded ? '' : 'line-clamp-4'
        }`}>
          {note.content.split('\n').map((line, index) => (
            <div key={index} className="mb-1">
              {line || '\u00A0'}
            </div>
          ))}
        </div>

        {note.content.length > 150 && (
          <button
            className="text-cyan-400 hover:text-cyan-300 text-xs mt-2 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? 'Show less' : 'Read more...'}
          </button>
        )}

        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-4 mb-3">
            {note.tags.slice(0, 3).map((tag) => (
              <span 
                key={tag}
                className="text-xs px-2 py-1 bg-white/10 text-white/80 rounded-md"
              >
                #{tag}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="text-xs px-2 py-1 bg-white/10 text-white/80 rounded-md">
                +{note.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="flex items-center space-x-1 text-slate-400">
            <Clock className="w-3 h-3" />
            <span className="text-xs">{formatRelativeTime(note.updatedAt)}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {note.isStarred && (
              <Star className="w-3 h-3 text-yellow-400 fill-current" />
            )}
            {note.isPinned && (
              <Pin className="w-3 h-3 text-yellow-400 fill-current" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function QuickNotes({ onBack }: QuickNotesProps) {
  const { user } = useAuth();
  const { projects, currentProject } = useProjects();
  const [notes, setNotes] = useState<Note[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated');
  const [showFilters, setShowFilters] = useState(false);
  const [, setLoading] = useState(true);

  // Load notes from backend
  useEffect(() => {
    const loadNotes = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await notesAPI.getNotes(searchQuery);
        const notesData = response.notes || [];
        
        // Transform backend notes to frontend format
        const transformedNotes = notesData.map((note: { id: string; title: string; content: string; tags: string[]; isPinned: boolean; isStarred: boolean; color: string; createdAt: string; updatedAt: string; userId?: string; projectId?: string }) => ({
          id: note.id,
          title: note.title,
          content: note.content,
          tags: note.tags || [],
          isPinned: note.isPinned || false,
          isStarred: note.isStarred || false,
          color: note.color || '#1e293b',
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
          userId: note.userId,
          projectId: note.projectId
        }));
        
        setNotes(transformedNotes);
      } catch (error) {
        console.error('Failed to load notes:', error);
        // For new accounts, show empty state instead of mock data
        setNotes([]);
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, [user, searchQuery]);

  const handleCreateNote = async (noteData: {
    title: string;
    content: string;
    tags: string[];
    color: string;
  }, projectId?: string) => {
    try {
      // If a projectId is provided, attach it so the note is shared with the team
      const response = await notesAPI.createNote({
        ...noteData,
        projectId,
      });
      const newNote = {
        id: response.note.id,
        title: response.note.title,
        content: response.note.content,
        tags: response.note.tags || [],
        isPinned: response.note.isPinned || false,
        isStarred: response.note.isStarred || false,
        color: response.note.color,
        createdAt: new Date(response.note.createdAt),
        updatedAt: new Date(response.note.updatedAt),
        userId: response.note.userId,
        projectId: response.note.projectId
      };
      setNotes([newNote, ...notes]);
      return newNote;
    } catch (error) {
      console.error('Failed to create note:', error);
      throw error;
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await notesAPI.deleteNote(id);
      setNotes(notes.filter(note => note.id !== id));
    } catch (error) {
      console.error('Failed to delete note:', error);
      // Optimistically remove from UI even if backend fails
      setNotes(notes.filter(note => note.id !== id));
    }
  };

  const handleTogglePin = async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    const updatedNote = { ...note, isPinned: !note.isPinned };
    
    // Optimistically update UI
    setNotes(notes.map(n => n.id === id ? updatedNote : n));
    
    try {
      await notesAPI.updateNote(id, {
        title: note.title,
        content: note.content,
        tags: note.tags,
        color: note.color,
        isPinned: !note.isPinned
      });
    } catch (error) {
      console.error('Failed to toggle pin:', error);
      // Revert on failure
      setNotes(notes.map(n => n.id === id ? note : n));
    }
  };

  const handleToggleStar = async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    const updatedNote = { ...note, isStarred: !note.isStarred };
    
    // Optimistically update UI
    setNotes(notes.map(n => n.id === id ? updatedNote : n));
    
    try {
      await notesAPI.updateNote(id, {
        title: note.title,
        content: note.content,
        tags: note.tags,
        color: note.color,
        isStarred: !note.isStarred
      });
    } catch (error) {
      console.error('Failed to toggle star:', error);
      // Revert on failure
      setNotes(notes.map(n => n.id === id ? note : n));
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setShowEditModal(true);
  };

  const handleUpdateNote = async (noteData: {
    title: string;
    content: string;
    tags: string[];
    color: string;
  }) => {
    if (!editingNote) return;

    try {
      await notesAPI.updateNote(editingNote.id, {
        ...noteData,
        isPinned: editingNote.isPinned,
        isStarred: editingNote.isStarred
      });
      
      const updatedNote = {
        ...editingNote,
        ...noteData,
        updatedAt: new Date()
      };
      
      setNotes(notes.map(n => n.id === editingNote.id ? updatedNote : n));
      setShowEditModal(false);
      setEditingNote(null);
      return updatedNote;
    } catch (error) {
      console.error('Failed to update note:', error);
      throw error;
    }
  };

  const filteredNotes = notes
    .filter(note => {
      const matchesSearch = searchQuery === '' || 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.every(tag => note.tags.includes(tag));
      
      return matchesSearch && matchesTags;
    })
    .sort((a, b) => {
      // Pinned notes always come first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      switch (sortBy) {
        case 'updated':
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        case 'created':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const allTags = Array.from(new Set(notes.flatMap(note => note.tags))).sort();

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 relative ${josefinSans.className}`}>
        <BackgroundAnimation />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between p-6">
            <h1 className="text-2xl font-light text-white">Quick Notes</h1>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 text-white px-4 py-2 rounded-lg hover:bg-slate-700/50"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
          </div>
          
          <div className="max-w-md mx-auto mt-20 p-6">
            <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50 text-center">
              <Edit3 className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
              <h2 className="text-xl font-light text-white mb-4">Quick Notes</h2>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Sign in to capture ideas instantly, organize with tags, and never lose important thoughts again.
              </p>
              <button
                onClick={() => {
                  if (onBack) onBack();
                  setTimeout(() => {
                    // Navigate to login by simulating the navigation
                    if (typeof window !== 'undefined') {
                      const event = new CustomEvent('navigate', { detail: 'login' });
                      window.dispatchEvent(event);
                    }
                  }, 100);
                }}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-lg font-light hover:from-cyan-600 hover:to-blue-700 transition-all duration-200"
              >
                Sign In to Take Notes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-900 relative overflow-hidden ${josefinSans.className}`}>
      <BackgroundAnimation />
      
      {/* Header */}
      <div className="relative z-10 border-b border-slate-700/30 bg-black/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {onBack && (
                <motion.button 
                  whileHover={{ x: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onBack}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-all text-xs font-light group"
                >
                  <ArrowLeft className="w-3.5 h-3.5 group-hover:text-cyan-400 transition-colors" />
                  <span>Back</span>
                </motion.button>
              )}
              
              <div className="h-4 w-px bg-slate-600/50" />
              
              <div className="flex items-center space-x-3">
                <div>
                  <h1 className="text-lg font-light text-white">Quick Notes</h1>
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="text-slate-400 font-light">Capture & Organize</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                    <span className="text-cyan-400 font-light">{notes.length} Notes</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-800/50 border border-slate-600/40 rounded-md text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20 text-xs w-48 font-light"
                  placeholder="Search notes..."
                />
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-800/40 rounded-md p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-sm transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-cyan-500/20 text-cyan-300' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-sm transition-all ${
                    viewMode === 'list' 
                      ? 'bg-cyan-500/20 text-cyan-300' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
              
              {/* Filters */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2.5 rounded-xl transition-all ${
                  showFilters || selectedTags.length > 0
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                    : 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white'
                }`}
              >
                <Filter className="w-4 h-4" />
              </motion.button>
              
              {/* Create Note */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-cyan-600 hover:from-green-400 hover:to-cyan-500 text-white rounded-xl transition-all font-light flex items-center space-x-2 shadow-lg hover:shadow-green-500/25"
              >
                <Plus className="w-4 h-4" />
                <span>New Note</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative z-10 border-b border-slate-700/30 bg-black/85 backdrop-blur-xl overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-slate-400 font-light">Tags:</span>
                  <div className="flex items-center flex-wrap gap-2">
                    {allTags.slice(0, 8).map((tag) => (
                      <motion.button
                        key={tag}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedTags(
                          selectedTags.includes(tag) 
                            ? selectedTags.filter(t => t !== tag)
                            : [...selectedTags, tag]
                        )}
                        className={`px-3 py-1.5 text-xs font-light rounded-lg border transition-all ${
                          selectedTags.includes(tag)
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                            : 'bg-slate-700/30 hover:bg-slate-600/40 text-slate-300 hover:text-white border-slate-600/30'
                        }`}
                      >
                        #{tag}
                      </motion.button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-slate-400">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-1.5 bg-slate-700/50 border border-slate-600/40 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20">
                    <option value="updated">Last Updated</option>
                    <option value="created">Date Created</option>
                    <option value="title">Title</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes Grid/List */}
      <div className="relative z-10 p-6">
        <AnimatePresence>
          {filteredNotes.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="text-6xl mb-4 opacity-30">📝</div>
              <h3 className="text-xl font-light text-white mb-2">No notes found</h3>
              <p className="text-slate-400 mb-6">
                {searchQuery || selectedTags.length > 0
                  ? 'Try adjusting your search or filters'
                  : 'Create your first note to get started'
                }
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-cyan-600 hover:from-green-400 hover:to-cyan-500 text-white rounded-xl transition-all font-light inline-flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Note</span>
              </motion.button>
            </motion.div>
          ) : (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1 max-w-4xl mx-auto'
            }`}>
              <AnimatePresence>
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={handleEditNote}
                    onDelete={handleDeleteNote}
                    onTogglePin={handleTogglePin}
                    onToggleStar={handleToggleStar}
                    canEdit={note.userId === user?.id}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Note Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateNoteModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreateNote={handleCreateNote}
            availableProjects={(projects || []).map(p => ({ id: p.id, name: p.name }))}
            initialProjectId={currentProject?.id}
          />
        )}
      </AnimatePresence>

      {/* Edit Note Modal */}
      <AnimatePresence>
        {showEditModal && editingNote && (
          <EditNoteModal
            isOpen={showEditModal}
            note={editingNote}
            onClose={() => {
              setShowEditModal(false);
              setEditingNote(null);
            }}
            onUpdateNote={handleUpdateNote}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
