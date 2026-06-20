import React, { useState, useRef, useEffect } from 'react';
import { stripHtml } from '../utils/stringUtils';
import { Plus, Search, ListFilter, Check, Lock, Pin, Archive, Trash2, RotateCcw, XCircle, Settings, HelpCircle, FileText, FolderOpen, Save } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Sidebar = ({ notes, folders, activeId, onOpenNote, onTrashNote, onArchiveNote, onRestoreNote, onDeleteNotePermanently, onEmptyTrash, onTogglePin, onReorderNotes, onAdd, onRename, onOpenSettings, onOpenShortcuts, isOpen, sessionUnlockedIds, onOpenFile, onSaveFile, onAddFolder, onRenameFolder, onDeleteFolder, onMoveNoteToFolder }) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState('active'); // 'active', 'archived', 'trash', 'folder:id'
  const [sortOrder, setSortOrder] = useState('custom'); // 'custom', 'updatedAt', 'createdAt', 'alpha'
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmEmptyTrash, setConfirmEmptyTrash] = useState(false);

  // Folder states
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [editFolderName, setEditFolderName] = useState('');
  const inputRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

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
    if (currentView === 'active') return status === 'active' && !note.folderId;
    if (currentView === 'archived') return status === 'archived';
    if (currentView === 'trash') return status === 'trash';
    if (currentView.startsWith('folder:')) {
      const folderId = currentView.split(':')[1];
      return status === 'active' && note.folderId === folderId;
    }
    return false;
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

  const handleDragStart = (e, idx, noteId) => {
    e.dataTransfer.setData("text/plain", noteId);
    if (isDndEnabled) {
      setDraggedIdx(idx);
      e.dataTransfer.effectAllowed = "move";
    } else {
      e.dataTransfer.effectAllowed = "copyMove";
    }
  };

  const handleDragOver = (e) => {
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

  const handleAddNote = () => {
    if (currentView.startsWith('folder:')) {
      onAdd(currentView.split(':')[1]);
    } else {
      onAdd();
    }
  };

  const activeCount = notes.filter(n => (n.status || 'active') === 'active' && !n.folderId).length;
  const archivedCount = notes.filter(n => n.status === 'archived').length;
  const trashCount = notes.filter(n => n.status === 'trash').length;

  return (
    <aside
      className={`bg-[var(--bg-secondary)] border-r border-[var(--border)] transition-all duration-300 flex flex-col overflow-hidden z-10 ${isOpen ? 'w-[260px]' : 'w-0'
        }`}
    >
      {/* Header Sidebar */}
      <div className="px-5 pt-5 pb-4 flex justify-between items-center whitespace-nowrap min-w-[260px]">
        <div className="flex items-center gap-2 select-none">
          <img src="./icon.png" alt="Yannoted Logo" className="w-5 h-5 drop-shadow-sm" />
          <h2 className="text-[var(--text-primary)] font-bold text-[14px] tracking-tight">Yannoted</h2>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onOpenFile}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded hover:bg-[var(--bg-tertiary)]"
            title={t('openTxtFile')}
          >
            <FolderOpen size={16} strokeWidth={2} />
          </button>
          <button
            onClick={onSaveFile}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded hover:bg-[var(--bg-tertiary)]"
            title={t('saveFile')}
          >
            <Save size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-5 pb-5 min-w-[260px]">
        <div className="relative group flex items-center">
          <Search className="absolute left-3 text-[var(--text-muted)]" size={14} strokeWidth={2} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t('searchNotes')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-[32px] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[13px] rounded-md pl-9 pr-14 outline-none border border-[var(--border)] focus:border-[var(--text-muted)] transition-colors placeholder-[var(--text-muted)]"
          />
          <div className="absolute right-3 text-[11px] text-[var(--text-muted)] font-medium pointer-events-none">
            Ctrl + K
          </div>
        </div>
      </div>

      {/* Primary CTA - New Note */}
      <div className="px-5 pb-5 min-w-[260px]">
        <div className="flex rounded-md overflow-hidden bg-[var(--accent)] text-white h-[36px]">
          <button
            onClick={handleAddNote}
            className="flex-1 flex items-center justify-center gap-2 text-[13px] font-medium transition-colors hover:brightness-110"
          >
            <Plus size={15} strokeWidth={2.5} />
            {t('newNote')}
          </button>
          <div className="w-[1px] bg-white/20 my-1.5"></div>
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="px-2.5 flex items-center justify-center transition-colors hover:brightness-110"
            title={t('sortNotes')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
        </div>
        {/* Sort Menu Dropdown */}
        {showSortMenu && (
          <div className="relative">
            <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)}></div>
            <div className="absolute right-0 top-1 w-48 bg-[var(--bg-primary)] border border-[var(--border)] rounded-md shadow-lg z-50 overflow-hidden flex flex-col py-1">
              {[
                { id: 'custom', label: t('sortManual') },
                { id: 'updatedAt', label: t('sortUpdated') },
                { id: 'createdAt', label: t('sortCreated') },
                { id: 'alpha', label: t('sortAlpha') },
              ].map(option => (
                <button
                  key={option.id}
                  onClick={() => { setSortOrder(option.id); setShowSortMenu(false); }}
                  className={`text-left px-3 py-2 text-[12px] transition-colors flex items-center justify-between ${sortOrder === option.id ? 'text-[var(--text-primary)] bg-[var(--bg-tertiary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'}`}
                >
                  {option.label}
                  {sortOrder === option.id && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* View Tabs */}
      <div className="px-3 min-w-[260px] flex flex-col gap-0.5 pb-2">
        {[
          { id: 'active', label: t('allNotes'), count: activeCount, icon: FileText },
          { id: 'archived', label: t('archivedNotes'), count: archivedCount, icon: Archive },
          { id: 'trash', label: t('trash'), count: trashCount, icon: Trash2 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id)}
              onDragOver={tab.id === 'active' ? handleDragOver : undefined}
              onDrop={(e) => {
                if (tab.id === 'active') {
                  e.preventDefault();
                  const noteId = e.dataTransfer.getData("text/plain");
                  if (noteId) onMoveNoteToFolder(noteId, null);
                }
              }}
              className={`group flex items-center justify-between py-1.5 px-3 rounded-md text-[13px] transition-colors ${isActive
                ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-medium'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]/50 hover:text-[var(--text-primary)]'
                }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={16} strokeWidth={2} className={isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'} />
                <span>{tab.label}</span>
              </div>
              <span className="text-[12px] text-[var(--text-muted)] transition-colors">
                {tab.count > 0 ? tab.count : ''}
              </span>
            </button>
          );
        })}
      </div>

      {/* Folders Section */}
      <div className="px-5 mt-2 mb-2 min-w-[260px] flex justify-between items-center text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
        <span>Folders</span>
        <button onClick={() => setIsAddingFolder(true)} className="hover:text-[var(--text-primary)] transition-colors"><Plus size={14}/></button>
      </div>
      <div className="px-3 min-w-[260px] flex flex-col gap-0.5 pb-2">
        {isAddingFolder && (
           <div className="flex items-center px-3 py-1.5 bg-[var(--bg-tertiary)] rounded-md border border-[var(--accent)]">
             <FolderOpen size={16} className="text-[var(--text-muted)] mr-3 shrink-0" />
             <input
               autoFocus
               type="text"
               value={newFolderName}
               onChange={e => setNewFolderName(e.target.value)}
               onKeyDown={e => {
                 if (e.key === 'Enter') {
                   if (newFolderName.trim()) onAddFolder(newFolderName.trim());
                   setIsAddingFolder(false);
                   setNewFolderName('');
                 }
                 if (e.key === 'Escape') {
                   setIsAddingFolder(false);
                   setNewFolderName('');
                 }
               }}
               onBlur={() => {
                 setIsAddingFolder(false);
                 setNewFolderName('');
               }}
               className="bg-transparent outline-none text-[13px] text-[var(--text-primary)] w-full"
               placeholder="Nama folder..."
             />
           </div>
        )}
        {folders?.map(folder => {
          const isActive = currentView === `folder:${folder.id}`;
          const folderNoteCount = notes.filter(n => (n.status || 'active') === 'active' && n.folderId === folder.id).length;
          return (
            <div 
              key={folder.id} 
              className={`group relative flex items-center py-1.5 px-3 rounded-md text-[13px] transition-colors cursor-pointer ${isActive ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-medium' : 'text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]/50 hover:text-[var(--text-primary)]'}`}
              onClick={() => {
                if (currentView === `folder:${folder.id}`) {
                  setCurrentView('active');
                } else {
                  setCurrentView(`folder:${folder.id}`);
                }
              }}
              onDragOver={handleDragOver}
              onDrop={(e) => {
                 e.preventDefault();
                 const noteId = e.dataTransfer.getData("text/plain");
                 if (noteId) onMoveNoteToFolder(noteId, folder.id);
              }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FolderOpen size={16} strokeWidth={2} className={isActive ? 'text-[var(--text-primary)] shrink-0' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)] shrink-0'} />
                {editingFolderId === folder.id ? (
                  <input
                    autoFocus
                    type="text"
                    value={editFolderName}
                    onChange={e => setEditFolderName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        if (editFolderName.trim()) onRenameFolder(folder.id, editFolderName.trim());
                        setEditingFolderId(null);
                      }
                      if (e.key === 'Escape') setEditingFolderId(null);
                    }}
                    onBlur={() => setEditingFolderId(null)}
                    className="bg-[var(--bg-primary)] border border-[var(--border)] rounded px-1 outline-none text-[13px] text-[var(--text-primary)] w-full"
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span className="truncate" onDoubleClick={(e) => { e.stopPropagation(); setEditingFolderId(folder.id); setEditFolderName(folder.name); }}>{folder.name}</span>
                )}
              </div>
              {!editingFolderId && (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[12px] text-[var(--text-muted)] transition-colors">
                    {folderNoteCount > 0 ? folderNoteCount : ''}
                  </span>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1 items-center">
                    <button onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); if(currentView === `folder:${folder.id}`) setCurrentView('active'); }} className="p-1 text-[var(--text-muted)] hover:text-[#ff5f56] rounded transition-colors" title="Hapus Folder"><Trash2 size={13}/></button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Notes List Header */}
      <div className="px-5 py-3 mt-4 min-w-[260px] flex justify-between items-center text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
        <span>{t('notes')}</span>
        <button onClick={handleAddNote} className="hover:text-[var(--text-primary)] transition-colors"><Plus size={14}/></button>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto min-w-[260px] custom-scrollbar px-3 pb-4 space-y-0.5">
        {filteredNotes.map((note, idx) => (
          <React.Fragment key={note.id}>
            <div
              draggable={editingId !== note.id}
              onDragStart={(e) => handleDragStart(e, idx, note.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
              onClick={() => onOpenNote(note.id)}
              className={`group flex items-center justify-between py-1.5 px-3 cursor-pointer rounded-md transition-colors ${activeId === note.id
                ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]/50 hover:text-[var(--text-primary)]'
                } ${draggedIdx === idx ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <FileText size={15} strokeWidth={2} className={activeId === note.id ? 'text-[var(--text-primary)] shrink-0' : 'text-[var(--text-muted)] shrink-0'} />
                {editingId === note.id ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={saveRename}
                    onKeyDown={handleKeyDown}
                    className="flex-1 min-w-0 bg-[var(--bg-primary)] border border-[var(--border)] rounded px-1 outline-none text-[13px] text-[var(--text-primary)]"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      onDoubleClick={(e) => { e.stopPropagation(); handleDoubleClick(note); }}
                      className={`text-[13px] truncate ${activeId === note.id ? 'font-medium' : ''}`}
                      title={t('doubleClickRename')}
                    >
                      {note.name}
                    </span>
                    {note.isDirty && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] flex-shrink-0" title="Unsaved changes"></span>
                    )}
                    {note.isLocked && (
                      <Lock size={12} color="var(--lock-color)" className="shrink-0" />
                    )}
                  </div>
                )}
              </div>
              
              {/* Note Actions */}
              <div className="flex items-center gap-1">
                {(currentView === 'active' || currentView.startsWith('folder:')) && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); onTrashNote(note.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-muted)] hover:text-[#ff5f56] rounded transition-colors"
                      title={t('moveToTrash')}
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onArchiveNote(note.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded transition-colors"
                      title={t('archiveNote')}
                    >
                      <Archive size={13} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onTogglePin(note.id); }}
                      className={`p-1 rounded transition-colors ${note.isPinned ? 'text-[var(--text-primary)] opacity-100' : 'opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                      title={note.isPinned ? t('unpinNote') : t('pinNote')}
                    >
                      <Pin size={13} className={note.isPinned ? "fill-current" : ""} />
                    </button>
                    {currentView.startsWith('folder:') && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onMoveNoteToFolder(note.id, null); }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-muted)] hover:text-orange-400 rounded transition-colors"
                        title="Keluarkan dari folder"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3H6a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h4M16 17l5-5-5-5M21 12H9"/></svg>
                      </button>
                    )}
                  </>
                )}
                {currentView === 'archived' && (
                  <div className="flex opacity-0 group-hover:opacity-100 gap-1">
                    <button onClick={(e) => { e.stopPropagation(); onRestoreNote(note.id); }} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded transition-colors" title={t('restore')}>
                      <RotateCcw size={13} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onTrashNote(note.id); }} className="p-1 text-[var(--text-muted)] hover:text-[#ff5f56] rounded transition-colors" title={t('moveToTrash')}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
                {currentView === 'trash' && (
                  <div className="flex opacity-0 group-hover:opacity-100 gap-1">
                    <button onClick={(e) => { e.stopPropagation(); onRestoreNote(note.id); }} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded transition-colors" title={t('restore')}>
                      <RotateCcw size={13} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(note.id); }} className="p-1 text-[var(--text-muted)] hover:text-[#ff5f56] rounded transition-colors" title={t('deletePermanently')}>
                      <XCircle size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Delete Confirmation */}
            {confirmDeleteId === note.id && (
              <div className="mx-3 my-1 p-2.5 rounded-md bg-[#ff5f56]/10 border border-[#ff5f56]/20">
                <p className="text-[11px] text-[var(--text-primary)] mb-2">{t('confirmDelete')}</p>
                <div className="flex gap-2">
                  <button onClick={() => { onDeleteNotePermanently(confirmDeleteId); setConfirmDeleteId(null); }} className="flex-1 text-[11px] bg-[#ff5f56] text-white rounded py-1">{t('yes')}</button>
                  <button onClick={() => setConfirmDeleteId(null)} className="flex-1 text-[11px] bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded py-1">{t('cancel')}</button>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
        {filteredNotes.length === 0 && (
          <div className="py-4 text-center text-xs text-[var(--text-muted)]">{t('noNotesFound')}</div>
        )}
      </div>

      {/* Empty Trash CTA */}
      {currentView === 'trash' && filteredNotes.length > 0 && (
        <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--bg-secondary)] min-w-[260px]">
          {confirmEmptyTrash ? (
            <div className="flex gap-2">
              <button onClick={() => { onEmptyTrash(); setConfirmEmptyTrash(false); }} className="flex-1 text-[11px] font-medium bg-[#ff5f56] text-white rounded py-1.5">{t('emptyTrashAll')}</button>
              <button onClick={() => setConfirmEmptyTrash(false)} className="flex-1 text-[11px] font-medium bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded py-1.5">{t('cancel')}</button>
            </div>
          ) : (
            <button onClick={() => setConfirmEmptyTrash(true)} className="w-full py-1.5 text-[11px] font-medium text-[#ff5f56] hover:bg-[#ff5f56]/10 rounded border border-transparent transition-colors flex items-center justify-center gap-1.5">
              <Trash2 size={12} /> {t('emptyTrash')}
            </button>
          )}
        </div>
      )}

      {/* Footer Sidebar */}
      <div className="px-5 h-[38px] shrink-0 border-t border-[var(--border)] flex justify-between items-center min-w-[260px]">
        <div className="flex gap-2">
          <button onClick={onOpenSettings} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" title={t('settings')}>
            <Settings size={15} strokeWidth={2} />
          </button>
          <button onClick={onOpenShortcuts} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" title="Shortcuts">
            <HelpCircle size={15} strokeWidth={2} />
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
          <span>{t('syncActive')}</span>
        </div>
      </div>
    </aside>
  );
};

export default React.memo(Sidebar);
