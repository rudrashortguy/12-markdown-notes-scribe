import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Folder,
  Tag,
  Share2,
  Settings,
  Plus,
  Search,
  Trash2,
  Eye,
  Edit3,
  Moon,
  Sun,
  Cloud,
  CloudOff,
  GitBranch,
  BookOpen,
  Command,
  Maximize2,
  FolderSync
} from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  folder: string;
  updatedAt: number;
}

const INITIAL_NOTES: Note[] = [
  {
    id: '1',
    title: 'Welcome to ScribeMD',
    content: '# Welcome to ScribeMD\n\nScribeMD is your local-first **Zettelkasten** and Markdown workspace designed for deep thought and interconnected notes.\n\n## Features\n- Bidirectional linking using `[[Note Title]]`\n- Interactive backlink graph\n- Offline-first PWA with local storage\n- Tag management & folder organisation\n\nCheck out [[Zettelkasten Method]] to learn more about atomic notes.',
    tags: ['welcome', 'guide'],
    folder: 'General',
    updatedAt: Date.now() - 3600000
  },
  {
    id: '2',
    title: 'Zettelkasten Method',
    content: '# Zettelkasten Method\n\nThe Zettelkasten (German for "slip box") is a knowledge management and note-taking method used in research and study.\n\n## Core Principles\n1. **Atomicity**: One idea per note.\n2. **Interconnectedness**: Link related notes together using [[Welcome to ScribeMD]].\n3. **Your own words**: Always write notes in your own language.',
    tags: ['zettelkasten', 'productivity'],
    folder: 'Research',
    updatedAt: Date.now() - 7200000
  },
  {
    id: '3',
    title: 'Project Ideas 2026',
    content: '# Project Ideas 2026\n\n- Build 20 portfolio PWA apps\n- Implement local-first CRDT sync\n- Explore advanced graphs in [[Zettelkasten Method]]',
    tags: ['projects', 'ideas'],
    folder: 'Work',
    updatedAt: Date.now() - 14400000
  }
];

export default function App() {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('scribemd_notes');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_NOTES;
  });

  const [activeNoteId, setActiveNoteId] = useState<string>(notes[0]?.id || '1');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [activeTab, setActiveTab] = useState<'editor' | 'graph' | 'settings'>('editor');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    localStorage.setItem('scribemd_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const activeNote = notes.find(n => n.id === activeNoteId) || notes[0];

  const folders = useMemo(() => {
    const set = new Set<string>();
    notes.forEach(n => set.add(n.folder || 'General'));
    return Array.from(set);
  }, [notes]);

  const tags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach(n => n.tags.forEach(t => set.add(t)));
    return Array.from(set);
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const matchesSearch = searchQuery === '' ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !selectedTag || n.tags.includes(selectedTag);
      const matchesFolder = !selectedFolder || n.folder === selectedFolder;
      return matchesSearch && matchesTag && matchesFolder;
    });
  }, [notes, searchQuery, selectedTag, selectedFolder]);

  // Compute backlinks: which notes reference activeNote.title
  const backlinks = useMemo(() => {
    if (!activeNote) return [];
    const titleToken = `[[${activeNote.title}]]`;
    return notes.filter(n => n.id !== activeNote.id && n.content.includes(titleToken));
  }, [notes, activeNote]);

  // Compute forward links inside activeNote
  const forwardLinks = useMemo(() => {
    if (!activeNote) return [];
    const matches = activeNote.content.match(/\[\[(.*?)\]\]/g) || [];
    return matches.map(m => m.slice(2, -2));
  }, [activeNote]);

  const createNewNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Untitled Note',
      content: '# Untitled Note\n\nStart writing your thoughts here...',
      tags: ['draft'],
      folder: selectedFolder || 'General',
      updatedAt: Date.now()
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    setIsEditing(true);
    setActiveTab('editor');
  };

  const updateActiveNote = (fields: Partial<Note>) => {
    setNotes(notes.map(n => n.id === activeNoteId ? { ...n, ...fields, updatedAt: Date.now() } : n));
  };

  const deleteActiveNote = () => {
    if (notes.length <= 1) return;
    const remaining = notes.filter(n => n.id !== activeNoteId);
    setNotes(remaining);
    setActiveNoteId(remaining[0].id);
  };

  // Simple Markdown renderer
  const renderMarkdown = (text: string) => {
    // Replace [[Link]] with styled badge
    let html = text
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-indigo-400 mt-4 mb-2">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold text-slate-200 mt-3 mb-2">$2</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium text-slate-300 mt-2 mb-1">$3</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-indigo-200">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-slate-300">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc text-slate-300">$1</li>')
      .replace(/\[\[(.*?)\]\]/g, '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-950 text-indigo-300 border border-indigo-800 cursor-pointer hover:bg-indigo-900">🔗 $1</span>');

    return { __html: html.replace(/\n/g, '<br />') };
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-slate-900 border-r border-slate-800 flex flex-col shrink-0`}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">ScribeMD</h1>
          </div>
          <button onClick={createNewNote} className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white shadow-sm transition flex items-center space-x-1 text-sm font-medium">
            <Plus className="w-4 h-4" />
            <span>New</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search notes, tags, links..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Navigation / Folders / Tags */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">Folders</div>
            <div className="space-y-0.5">
              <button
                onClick={() => setSelectedFolder(null)}
                className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-sm ${selectedFolder === null ? 'bg-indigo-950 text-indigo-300 font-medium' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <Folder className="w-4 h-4 text-indigo-400" />
                <span>All Notes ({notes.length})</span>
              </button>
              {folders.map(folder => (
                <button
                  key={folder}
                  onClick={() => setSelectedFolder(folder)}
                  className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-sm ${selectedFolder === folder ? 'bg-indigo-950 text-indigo-300 font-medium' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                >
                  <Folder className="w-4 h-4 text-slate-500" />
                  <span>{folder}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">Tags</div>
            <div className="flex flex-wrap gap-1 px-2">
              {tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${selectedTag === tag ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                  <Tag className="w-3 h-3" />
                  <span>{tag}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">Notes</div>
            <div className="space-y-1">
              {filteredNotes.map(note => (
                <button
                  key={note.id}
                  onClick={() => { setActiveNoteId(note.id); setActiveTab('editor'); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex flex-col space-y-0.5 ${note.id === activeNoteId ? 'bg-indigo-950 border border-indigo-800 text-indigo-200' : 'hover:bg-slate-800 text-slate-300'}`}
                >
                  <div className="font-medium truncate">{note.title}</div>
                  <div className="text-xs text-slate-500 flex items-center justify-between">
                    <span>{note.folder}</span>
                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer status */}
        <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-900/50">
          <div className="flex items-center space-x-1.5">
            {isOnline ? (
              <>
                <Cloud className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Sync Active</span>
              </>
            ) : (
              <>
                <CloudOff className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400">Offline Mode</span>
              </>
            )}
          </div>
          <button onClick={() => setActiveTab('settings')} className="p-1 hover:text-slate-200">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {/* Top Header bar */}
        <header className="h-14 border-b border-slate-800 px-4 flex items-center justify-between bg-slate-900/50 backdrop-blur">
          <div className="flex items-center space-x-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-medium">{activeNote?.folder}</span>
              <span className="text-slate-600">/</span>
              <span className="font-semibold text-slate-200 truncate max-w-xs">{activeNote?.title}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === 'editor' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              Editor
            </button>
            <button
              onClick={() => setActiveTab('graph')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center space-x-1.5 ${activeTab === 'graph' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <GitBranch className="w-4 h-4" />
              <span>Graph View</span>
            </button>
            <button
              onClick={deleteActiveNote}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
              title="Delete Note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Tab Content */}
        {activeTab === 'editor' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Editor Pane */}
            <div className="flex-1 flex flex-col border-r border-slate-800">
              <div className="p-4 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
                <input
                  type="text"
                  value={activeNote?.title || ''}
                  onChange={e => updateActiveNote({ title: e.target.value })}
                  className="bg-transparent text-xl font-bold text-slate-100 focus:outline-none w-full"
                  placeholder="Note Title..."
                />
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center space-x-1 text-xs px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition"
                  >
                    {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                    <span>{isEditing ? 'Preview' : 'Edit'}</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {isEditing ? (
                  <textarea
                    value={activeNote?.content || ''}
                    onChange={e => updateActiveNote({ content: e.target.value })}
                    className="w-full h-full p-4 bg-slate-950 text-slate-200 font-mono text-sm resize-none focus:outline-none leading-relaxed"
                    placeholder="Write markdown here... Use [[Note Title]] for backlinks."
                  />
                ) : (
                  <div
                    className="w-full h-full p-6 overflow-y-auto prose prose-invert max-w-none bg-slate-950 text-slate-200"
                    dangerouslySetInnerHTML={renderMarkdown(activeNote?.content || '')}
                  />
                )}
              </div>
            </div>

            {/* Right Inspector / Backlinks Sidebar */}
            <div className="w-full md:w-80 bg-slate-900/50 flex flex-col border-t md:border-t-0 border-slate-800 overflow-y-auto p-4 space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Note Metadata</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Folder</label>
                    <input
                      type="text"
                      value={activeNote?.folder || ''}
                      onChange={e => updateActiveNote({ folder: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Tags (comma separated)</label>
                    <input
                      type="text"
                      value={activeNote?.tags.join(', ') || ''}
                      onChange={e => updateActiveNote({ tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Backlinks ({backlinks.length})</h3>
                {backlinks.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No notes link to this note yet. Mention `[[{activeNote?.title}]]` in another note to create a backlink.</p>
                ) : (
                  <div className="space-y-1.5">
                    {backlinks.map(b => (
                      <button
                        key={b.id}
                        onClick={() => setActiveNoteId(b.id)}
                        className="w-full text-left p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs transition"
                      >
                        <div className="font-medium text-indigo-300">{b.title}</div>
                        <div className="text-slate-500 truncate mt-0.5">{b.content.slice(0, 60)}...</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Forward Links ({forwardLinks.length})</h3>
                {forwardLinks.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No forward links.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {forwardLinks.map((link, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-indigo-300">
                        🔗 {link}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'graph' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#312e81_1px,transparent_1px)] [background-size:24px_24px] opacity-30"></div>
            <div className="z-10 max-w-lg space-y-4">
              <div className="w-16 h-16 bg-indigo-950 border border-indigo-800 rounded-2xl flex items-center justify-center mx-auto text-indigo-400 shadow-lg shadow-indigo-950">
                <GitBranch className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-100">Interactive Zettelkasten Graph</h2>
              <p className="text-sm text-slate-400">
                Visualizing {notes.length} notes and their bidirectional link network. Click nodes to jump directly between connected thoughts.
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-4">
                {notes.map(n => (
                  <button
                    key={n.id}
                    onClick={() => { setActiveNoteId(n.id); setActiveTab('editor'); }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-sm font-medium text-indigo-300 shadow-md transition flex items-center space-x-2"
                  >
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span>{n.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex-1 p-8 max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-slate-100">ScribeMD Settings</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-slate-200">Local Storage & PWA Status</h3>
                <p className="text-sm text-slate-400 mt-1">Your notes are stored locally in your browser with offline-first Workbox caching.</p>
              </div>
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-sm text-slate-300">Total Notes Saved</span>
                <span className="font-mono text-indigo-400 font-bold">{notes.length}</span>
              </div>
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-sm text-slate-300">Export All Notes (JSON)</span>
                <button
                  onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notes, null, 2));
                    const dlAnchor = document.createElement('a');
                    dlAnchor.setAttribute("href", dataStr);
                    dlAnchor.setAttribute("download", "scribemd_backup.json");
                    dlAnchor.click();
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-sm font-medium"
                >
                  Export Backup
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
