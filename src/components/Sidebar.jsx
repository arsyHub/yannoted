import React, { useState, useRef, useEffect } from 'react';
import { stripHtml } from '../utils/stringUtils';
import { Plus, Search, ListFilter, Check, Lock, Pin, Archive, Trash2, RotateCcw, XCircle, Settings, HelpCircle, FileText, FolderOpen, Save } from 'lucide-react';

const Sidebar = ({ notes, activeId, onOpenNote, onTrashNote, onArchiveNote, onRestoreNote, onDeleteNotePermanently, onEmptyTrash, onTogglePin, onReorderNotes, onAdd, onRename, onOpenSettings, onOpenShortcuts, isOpen, sessionUnlockedIds, onOpenFile, onSaveFile }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState('active'); // 'active', 'archived', 'trash'
  const [sortOrder, setSortOrder] = useState('custom'); // 'custom', 'updatedAt', 'createdAt', 'alpha'
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmEmptyTrash, setConfirmEmptyTrash] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleDoubleClick = (note) => {
    setEditingId(note.id);
    setEditValue(note.name);
  };

  const saveRename = () => {
    if (editingId && editValue.trim() !== '') {
      onRename(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') saveRename();
    if (e.key === 'Escape') setEditingId(null);
  };

  const lowerSearch = searchTerm.toLowerCase();

  let processedNotes = notes.filter(note => {
    const status = note.status || 'active';
    return status === currentView;
  });

  if (sortOrder === 'updatedAt') {
    processedNotes.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } else if (sortOrder === 'createdAt') {
    processedNotes.sort((a, b) => b.createdAt - a.createdAt);
  } else if (sortOrder === 'alpha') {
    processedNotes.sort((a, b) => a.name.localeCompare(b.name));
  }

  const filteredNotes = processedNotes.map(note => {
    if (!searchTerm) {
      return { ...note, isMatch: true, matchType: 'title', excerpt: '' };
    }

    const matchTitle = note.name.toLowerCase().includes(lowerSearch);

    // Determine if we can search content
    const canSearchContent = !note.isLocked || (sessionUnlockedIds && sessionUnlockedIds.has(note.id));
    let matchContent = false;
    let excerpt = '';

    if (canSearchContent && !matchTitle && note.content) {
      const plainText = stripHtml(note.content);
      const lowerPlainText = plainText.toLowerCase();
      const matchIndex = lowerPlainText.indexOf(lowerSearch);

      if (matchIndex !== -1) {
        matchContent = true;
        // Create excerpt
        const start = Math.max(0, matchIndex - 15);
        const end = Math.min(plainText.length, matchIndex + lowerSearch.length + 15);
        excerpt = (start > 0 ? '...' : '') +
          plainText.substring(start, end) +
          (end < plainText.length ? '...' : '');
      }
    }

    return {
      ...note,
      isMatch: matchTitle || matchContent,
      matchType: matchTitle ? 'title' : 'content',
      excerpt: excerpt
    };
  }).filter(n => n.isMatch);

  const isDndEnabled = searchTerm.trim() === '' && currentView === 'active' && sortOrder === 'custom';

  const handleDragStart = (e, idx) => {
    if (!isDndEnabled) return;
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    if (!isDndEnabled) return;
    e.preventDefault();
  };

  const handleDrop = (e, idx) => {
    if (!isDndEnabled) return;
    e.preventDefault();
    if (draggedIdx !== null && draggedIdx !== idx) {
      onReorderNotes(draggedIdx, idx);
    }
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  const activeCount = notes.filter(n => (n.status || 'active') === 'active').length;
  const archivedCount = notes.filter(n => n.status === 'archived').length;
  const trashCount = notes.filter(n => n.status === 'trash').length;

  return (
    <aside
      className={`bg-[var(--bg-secondary)]/85 backdrop-blur-xl border-r border-[var(--border)] transition-all duration-300 flex flex-col overflow-hidden ${isOpen ? 'w-72' : 'w-0'
        }`}
    >
      {/* Header Sidebar */}
      <div className="px-3 py-2 flex justify-between items-center whitespace-nowrap min-w-[18rem]">
        <div className="flex items-center gap-2 select-none">
          <img src="./icon.png" alt="Yannoted Logo" className="w-5 h-5 drop-shadow-sm" />
          <h2 className="text-[var(--text-primary)] font-bold text-[13px] tracking-wide">Yannoted</h2>
        </div>
        <div className="flex gap-0.5">
          <button
            onClick={onOpenFile}
            className="text-[var(--text-primary)] hover:text-[var(--accent)] transition-all active:scale-90 p-1 rounded hover:bg-[var(--bg-tertiary)]"
            title="Buka File .txt (Ctrl+O)"
          >
            <FolderOpen size={16} />
          </button>
          <button
            onClick={onSaveFile}
            className="text-[var(--text-primary)] hover:text-[var(--accent)] transition-all active:scale-90 p-1 rounded hover:bg-[var(--bg-tertiary)]"
            title="Simpan File (Ctrl+S)"
          >
            <Save size={16} />
          </button>
        </div>
      </div>

      {/* Primary CTA - New Note */}
      <div className="px-3 pt-1 pb-3 min-w-[18rem]">
        <button
          onClick={onAdd}
          className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] text-white py-1.5 px-4 rounded-lg text-[13px] font-semibold transition-all hover:opacity-90 active:scale-[0.98] shadow-sm shadow-[var(--accent-border)]"
        >
          <Plus size={15} strokeWidth={2.5} />
          Catatan Baru
        </button>
      </div>

      {/* Search Bar & Sorting */}
      <div className="px-2 pt-2 min-w-[18rem] flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2 text-[var(--text-muted)]" size={14} />
            <input
              type="text"
              placeholder="Cari catatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-xs rounded-md pl-8 pr-2 py-1.5 outline-none focus:ring-1 focus:ring-[var(--accent)] border border-transparent focus:border-[var(--accent)] transition-all placeholder-[var(--text-muted)]"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className={`p-1.5 rounded-md transition-colors ${showSortMenu ? 'bg-[var(--border)] text-[var(--text-primary)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'}`}
              title="Urutkan Catatan"
            >
              <ListFilter size={14} />
            </button>

            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)}></div>
                <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg shadow-lg z-50 overflow-hidden flex flex-col py-1">
                  {[
                    { id: 'custom', label: 'Manual (Drag & Drop)' },
                    { id: 'updatedAt', label: 'Terbaru Diubah' },
                    { id: 'createdAt', label: 'Terbaru Dibuat' },
                    { id: 'alpha', label: 'Sesuai Abjad (A-Z)' },
                  ].map(option => (
                    <button
                      key={option.id}
                      onClick={() => { setSortOrder(option.id); setShowSortMenu(false); }}
                      className={`text-left px-4 py-2 text-xs transition-colors flex items-center justify-between ${sortOrder === option.id ? 'text-[var(--accent)] bg-[var(--accent-bg)]' : 'text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'}`}
                    >
                      {option.label}
                      {sortOrder === option.id && (
                        <Check size={14} />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="px-1 pt-1 pb-1 min-w-[18rem] flex flex-col gap-0.5 border-b border-[var(--border)]">
        {[
          { id: 'active', label: 'Semua Catatan', count: activeCount, icon: FileText },
          { id: 'archived', label: 'Arsip', count: archivedCount, icon: Archive },
          { id: 'trash', label: 'Sampah', count: trashCount, icon: Trash2 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id)}
              className={`flex items-center justify-between py-1.5 px-3 mx-2 rounded-lg text-[13px] transition-all duration-200 active:scale-[0.98] ${isActive
                ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-semibold'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]/50 hover:text-[var(--text-primary)]'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon size={15} />
                <span>{tab.label}</span>
              </div>
              {tab.count > 0 && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-[var(--accent)]/20' : 'bg-[var(--bg-tertiary)]'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto min-w-[18rem] custom-scrollbar">
        {filteredNotes.map((note, idx) => (
          <React.Fragment key={note.id}>
            <div
              draggable={isDndEnabled && editingId !== note.id}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
              onClick={() => onOpenNote(note.id)}
              className={`py-1.5 px-2.5 cursor-pointer transition-colors group active:scale-[0.98] ${activeId === note.id
                ? 'bg-[var(--bg-tertiary)]/40 border-l-[3px] border-l-[var(--accent)]'
                : 'hover:bg-[var(--bg-tertiary)]/20 border-l-[3px] border-l-transparent'
                } ${draggedIdx === idx ? 'opacity-50' : ''}`}
            >
              <div className="flex justify-between items-center gap-2">
                {editingId === note.id ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={saveRename}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-[var(--bg-primary)] border border-[var(--accent)] rounded px-1 outline-none text-[13px] text-[var(--text-primary)]"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <h3
                    onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClick(note); }}
                    className={`text-[13px] font-medium truncate flex-1 transition-colors flex items-center gap-1.5 ${activeId === note.id ? 'text-[var(--accent)]' : 'text-[var(--text-primary)] group-hover:text-[var(--accent)]'
                      }`}
                    title="Double click untuk ubah nama"
                  >
                    {note.name}
                    {note.isDirty && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] flex-shrink-0" title="Belum Disimpan"></span>
                    )}
                  </h3>
                )}
                {note.isLocked && (
                  <Lock size={12} color="var(--lock-color)" className="shrink-0" />
                )}
              </div>
              {note.matchType === 'content' && note.excerpt && (
                <div className="text-[11px] text-[var(--text-muted)] italic truncate mt-0.5" title={note.excerpt}>
                  {note.excerpt}
                </div>
              )}
              <div className="flex justify-between items-center mt-1">
                <div className="text-[10px] text-[var(--text-muted)] tracking-wide">
                  {new Date(note.updatedAt || note.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </div>
                <div className="flex gap-1">
                  {currentView === 'active' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTrashNote(note.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-muted)] hover:text-[#ff5f56] hover:bg-[#ff5f56]/10 rounded transition-all"
                        title="Pindahkan ke Sampah"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onArchiveNote(note.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded transition-all"
                        title="Arsipkan Catatan"
                      >
                        <Archive size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePin(note.id);
                        }}
                        className={`p-1 rounded transition-all ${note.isPinned ? 'text-[var(--accent)] opacity-100' : 'opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10'}`}
                        title={note.isPinned ? "Lepas Sematan" : "Sematkan Catatan"}
                      >
                        <Pin size={14} className={note.isPinned ? "fill-current" : ""} />
                      </button>
                    </>
                  )}
                  {currentView === 'archived' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRestoreNote(note.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded transition-all"
                        title="Kembalikan (Unarchive)"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 10 4 15 9 20"></polyline><path d="M20 4v7a4 4 0 0 1-4 4H4"></path></svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTrashNote(note.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-muted)] hover:text-[#ff5f56] hover:bg-[#ff5f56]/10 rounded transition-all"
                        title="Pindahkan ke Sampah"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </>
                  )}
                  {currentView === 'trash' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRestoreNote(note.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded transition-all"
                        title="Kembalikan Catatan"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 10 4 15 9 20"></polyline><path d="M20 4v7a4 4 0 0 1-4 4H4"></path></svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(note.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-muted)] hover:text-[#ff5f56] hover:bg-[#ff5f56]/10 rounded transition-all"
                        title="Hapus Permanen"
                      >
                        <XCircle size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            {confirmDeleteId === note.id && (
              <div className="mx-3 my-2 p-3 rounded-lg bg-[#ff5f56]/10 border border-[#ff5f56]/30 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
                <p className="text-[11px] text-[var(--text-primary)] mb-2">
                  Hapus permanen <strong>&ldquo;{note.name}&rdquo;</strong>?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { onDeleteNotePermanently(confirmDeleteId); setConfirmDeleteId(null); }}
                    className="flex-1 text-[11px] font-medium bg-[#ff5f56] text-white rounded px-2 py-1.5 hover:bg-[#e0544b] transition-colors shadow-sm"
                  >
                    Ya, Hapus
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="flex-1 text-[11px] font-medium bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded px-2 py-1.5 hover:bg-[var(--border)] transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}

        {filteredNotes.length === 0 && (
          <div className="p-4 text-center text-sm text-[var(--text-muted)]">
            Tidak ada catatan yang ditemukan.
          </div>
        )}
      </div>

      {currentView === 'trash' && filteredNotes.length > 0 && (
        <div className="px-3 py-2 border-t border-[var(--border)] bg-[var(--bg-primary)] min-w-[18rem]">
          {confirmEmptyTrash ? (
            <div className="p-3 rounded-lg bg-[#ff5f56]/10 border border-[#ff5f56]/30 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
              <p className="text-[11px] text-[var(--text-primary)] mb-2 text-center">
                Hapus permanen {filteredNotes.length} catatan?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { onEmptyTrash(); setConfirmEmptyTrash(false); }}
                  className="flex-1 text-[11px] font-medium bg-[#ff5f56] text-white rounded px-2 py-1.5 hover:bg-[#e0544b] transition-colors shadow-sm"
                >
                  Kosongkan
                </button>
                <button
                  onClick={() => setConfirmEmptyTrash(false)}
                  className="flex-1 text-[11px] font-medium bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded px-2 py-1.5 hover:bg-[var(--border)] transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-muted)] font-medium">Total: {filteredNotes.length} item</span>
              <button
                onClick={() => setConfirmEmptyTrash(true)}
                className="py-1 px-2 text-[11px] font-medium text-[#ff5f56] hover:bg-[#ff5f56]/10 rounded border border-transparent hover:border-[#ff5f56]/30 transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 size={12} />
                Kosongkan
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer Sidebar */}
      <div className="px-2 py-1.5 flex justify-start gap-1 min-w-[18rem]">
        <button
          onClick={onOpenSettings}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1.5 rounded hover:bg-[var(--bg-tertiary)]"
          title="Pengaturan"
        >
          <Settings size={14} />
        </button>
        <button
          onClick={onOpenShortcuts}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1.5 rounded hover:bg-[var(--bg-tertiary)]"
          title="Bantuan Shortcut Keyboard"
        >
          <HelpCircle size={14} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
