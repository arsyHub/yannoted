import React, { useState, useEffect } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import TabBar from './components/TabBar';
import Toolbar from './components/Toolbar';
import Editor from './components/Editor';
import PasswordModal from './components/PasswordModal';
import LockTabModal from './components/LockTabModal';
import SettingsModal from './components/SettingsModal';
import ShortcutsModal from './components/ShortcutsModal';
import FindReplacePanel from './components/FindReplacePanel';
import StatusBar from './components/StatusBar';
import ContextMenu from './components/ContextMenu';

import { useNotes } from './hooks/useNotes';
import { useTheme } from './hooks/useTheme';
import { useFontSize } from './hooks/useFontSize';
import { storage } from './utils/storage';
import { hashPassword, verifyPassword } from './utils/crypto';

function App() {
  const {
    notes,
    openTabIds,
    activeId,
    setActiveId,
    addNote,
    openNote,
    closeTab,
    deleteNotePermanently,
    emptyTrash,
    archiveNote,
    trashNote,
    restoreNote,
    updateContent,
    renameNote,
    togglePin,
    reorderTabs,
    reorderNotes,
    lockNote,
    unlockForSession,
    removeLock,
    sessionUnlockedIds,
    openExternalFile,
    saveNoteToFile
  } = useNotes();

  const { toggleTheme } = useTheme();
  useFontSize(); // Initialize font size listener

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // App Password State
  const [appUnlocked, setAppUnlocked] = useState(false);
  const [appPasswordExists, setAppPasswordExists] = useState(false);
  const [appHint, setAppHint] = useState('');

  // Tab Lock Modal State
  const [showLockModal, setShowLockModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // { x, y }

  // Default Note Password State
  const [defaultNotePasswordHash, setDefaultNotePasswordHash] = useState(null);
  const [defaultNotePassword, setDefaultNotePassword] = useState(null); // In-memory only, for encryption
  const [defaultNoteHint, setDefaultNoteHint] = useState('');

  const handleSetDefaultPassword = async (pw, hint) => {
    const hash = hashPassword(pw);
    await storage.set('defaultNotePasswordHash', hash);
    await storage.set('defaultNoteHint', hint);
    setDefaultNotePasswordHash(hash);
    setDefaultNotePassword(pw); // Keep plaintext in memory for encryption
    setDefaultNoteHint(hint);
  };

  const handleRemoveDefaultPassword = async () => {
    await storage.delete('defaultNotePasswordHash');
    await storage.delete('defaultNoteHint');
    setDefaultNotePasswordHash(null);
    setDefaultNotePassword(null);
    setDefaultNoteHint('');
  };

  // TipTap Editor instance
  const [editor, setEditor] = useState(null);

  useEffect(() => {
    const checkAppPassword = async () => {
      const hash = await storage.get('appPasswordHash');
      const hint = await storage.get('appPasswordHint');
      if (hash) {
        setAppPasswordExists(true);
        setAppHint(hint || '');
      } else {
        setAppUnlocked(true);
      }
    };

    const loadDefaultNotePassword = async () => {
      const hash = await storage.get('defaultNotePasswordHash');
      const hint = await storage.get('defaultNoteHint');
      if (hash) {
        setDefaultNotePasswordHash(hash);
        setDefaultNoteHint(hint || '');
      }
    };

    checkAppPassword();
    loadDefaultNotePassword();
  }, []);

  // Ref for activeId to avoid re-registering keyboard handler on every tab switch
  const activeIdRef = React.useRef(activeId);
  React.useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  const editorRef = React.useRef(editor);
  React.useEffect(() => { editorRef.current = editor; }, [editor]);

  // Shortcuts — stable deps since openExternalFile/saveNoteToFile are useCallback'd
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowFindReplace(p => !p);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        openExternalFile();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const ed = editorRef.current;
        if (ed) {
          saveNoteToFile(activeIdRef.current, ed.getText());
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openExternalFile, saveNoteToFile]);

  // Warn before closing window if there are unsaved file-linked notes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const hasDirtyFileNotes = notes.some(n => n.isDirty && n.filePath);
      if (hasDirtyFileNotes) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [notes]);

  const activeNote = notes.find(n => n.id === activeId);
  const openTabs = openTabIds.map(id => notes.find(n => n.id === id)).filter(Boolean);

  // Automatically prompt for password if we switch to a locked note
  useEffect(() => {
    if (activeNote && activeNote.isLocked && !sessionUnlockedIds.has(activeId)) {
      setShowUnlockModal(true);
    } else {
      setShowUnlockModal(false);
    }
  }, [activeId, activeNote?.isLocked, sessionUnlockedIds]);

  const handleAppLogin = async (password) => {
    const hash = await storage.get('appPasswordHash');
    if (verifyPassword(password, hash)) {
      setAppUnlocked(true);
      return true;
    }
    return false;
  };

  const handleTabUnlock = async (password) => {
    const success = unlockForSession(activeId, password);
    if (success) {
      setShowUnlockModal(false);
      return true;
    }
    return false;
  };

  const handleToggleLock = () => {
    if (!activeNote) return;
    if (activeNote.isLocked) {
      if (sessionUnlockedIds.has(activeId)) {
        // If it's already unlocked for viewing, completely remove the lock
        removeLock(activeId);
      } else {
        setShowUnlockModal(true);
      }
    } else {
      // Show lock setup modal
      setShowLockModal(true);
    }
  };

  const handleExportTXT = () => {
    if (!editor || !activeNote) return;
    const text = editor.getText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeNote.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (appPasswordExists && !appUnlocked) {
    return <PasswordModal onSubmit={handleAppLogin} hint={appHint} title="Buka Aplikasi Notepad" isAppLevel={true} />;
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-primary)] overflow-hidden">
      <TitleBar />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          isOpen={sidebarOpen}
          notes={notes}
          activeId={activeId}
          onOpenNote={openNote}
          onTrashNote={trashNote}
          onArchiveNote={archiveNote}
          onRestoreNote={restoreNote}
          onDeleteNotePermanently={deleteNotePermanently}
          onEmptyTrash={emptyTrash}
          onTogglePin={togglePin}
          onReorderNotes={reorderNotes}
          onAdd={addNote}
          onRename={renameNote}
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenShortcuts={() => setShowShortcutsModal(true)}
          sessionUnlockedIds={sessionUnlockedIds}
          onOpenFile={openExternalFile}
          onSaveFile={() => {
            if (editor) saveNoteToFile(activeId, editor.getText());
          }}
        />

        <main className="flex-1 flex flex-col min-w-0">
          <TabBar
            tabs={openTabs}
            activeId={activeId}
            onSelect={setActiveId}
            onClose={closeTab}
            onAdd={addNote}
            onRename={renameNote}
            onReorderTabs={reorderTabs}
          />

          <Toolbar
            editor={editor}
            onToggleSidebar={() => setSidebarOpen(p => !p)}
            onToggleDark={toggleTheme}
            onToggleLock={handleToggleLock}
            onExportTXT={handleExportTXT}
            isLocked={activeNote?.isLocked}
          />

          <div
            className="flex-1 relative flex flex-col min-h-0"
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({ x: e.clientX, y: e.clientY });
            }}
          >
            {showFindReplace && (
              <FindReplacePanel
                editor={editor}
                onClose={() => setShowFindReplace(false)}
              />
            )}
            <Editor
              key={activeId ?? 'no-note'}
              note={activeNote}
              onContentChange={(html) => updateContent(activeId, html)}
              onEditorReady={setEditor}
              isSessionUnlocked={sessionUnlockedIds.has(activeId)}
            />
          </div>
          <StatusBar 
            editor={editor} 
            noteName={activeNote?.name} 
            noteFilePath={activeNote?.filePath}
          />
        </main>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          editor={editor}
          onClose={() => setContextMenu(null)}
        />
      )}

      {showLockModal && (
        <LockTabModal
          hasDefaultPassword={!!defaultNotePassword}
          onSave={async (pw, hint, saveAsDefault) => {
            lockNote(activeId, pw, hint);
            if (saveAsDefault) {
              const hash = hashPassword(pw);
              await storage.set('defaultNotePasswordHash', hash);
              await storage.set('defaultNoteHint', hint);
              setDefaultNotePasswordHash(hash);
              setDefaultNotePassword(pw);
              setDefaultNoteHint(hint);
            }
            setShowLockModal(false);
          }}
          onSaveDefault={() => {
            lockNote(activeId, defaultNotePassword, defaultNoteHint);
            setShowLockModal(false);
          }}
          onCancel={() => setShowLockModal(false)}
        />
      )}

      {showUnlockModal && activeNote && !sessionUnlockedIds.has(activeId) && (
        <PasswordModal
          onSubmit={handleTabUnlock}
          hint={activeNote.lockHint}
          onCancel={() => setShowUnlockModal(false)}
          title={`Buka Kunci: ${activeNote.name}`}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          hasDefaultPassword={!!defaultNotePasswordHash}
          onSetDefault={handleSetDefaultPassword}
          onRemoveDefault={handleRemoveDefaultPassword}
        />
      )}

      {showShortcutsModal && (
        <ShortcutsModal onClose={() => setShowShortcutsModal(false)} />
      )}
    </div>
  );
}

export default App;
