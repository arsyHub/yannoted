import React, { useState, useEffect } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import TabBar from './components/TabBar';
import Toolbar from './components/Toolbar';
import Editor from './components/Editor';
import PasswordModal from './components/PasswordModal';
import MasterPasswordSetupModal from './components/MasterPasswordSetupModal';
import SettingsModal from './components/SettingsModal';
import ShortcutsModal from './components/ShortcutsModal';
import FindReplacePanel from './components/FindReplacePanel';
import StatusBar from './components/StatusBar';
import ContextMenu from './components/ContextMenu';
import RestoreModal from './components/RestoreModal';

import { useNotes } from './hooks/useNotes';
import { useTheme } from './hooks/useTheme';
import { useFontSize } from './hooks/useFontSize';
import { storage } from './utils/storage';
import { hashPassword, verifyPassword } from './utils/crypto';
import { LanguageProvider } from './contexts/LanguageContext';

function App() {
  const {
    notes,
    folders,
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
    changeMasterPassword,
    removeAllLocks,
    sessionUnlockedIds,
    openExternalFile,
    saveNoteToFile,
    closeAllTabs,
    addFolder,
    renameFolder,
    deleteFolder,
    moveNoteToFolder,
    exportBackup,
    importBackup
  } = useNotes();

  const { toggleTheme } = useTheme();
  const { fontSize } = useFontSize(); // Initialize font size listener

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
  const [focusMode, setFocusMode] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // { x, y }
  const [showMasterPasswordPrompt, setShowMasterPasswordPrompt] = useState(false);
  const [pendingBackupData, setPendingBackupData] = useState(null);

  // Master Password State
  const [masterPasswordHash, setMasterPasswordHash] = useState(null);
  const [masterPassword, setMasterPassword] = useState(null); // In-memory only, for encryption
  const [masterPasswordHint, setMasterPasswordHint] = useState('');

  const handleSetMasterPassword = async (pw, hint) => {
    const hash = hashPassword(pw);
    await storage.set('masterPasswordHash', hash);
    await storage.set('masterPasswordHint', hint);
    setMasterPasswordHash(hash);
    setMasterPassword(pw);
    setMasterPasswordHint(hint);
  };

  const handleRemoveMasterPassword = async (pw) => {
    if (verifyPassword(pw, masterPasswordHash)) {
      removeAllLocks(pw);
      await storage.delete('masterPasswordHash');
      await storage.delete('masterPasswordHint');
      setMasterPasswordHash(null);
      setMasterPassword(null);
      setMasterPasswordHint('');
      return true;
    }
    return false;
  };

  const handleChangeMasterPassword = async (oldPw, newPw, hint) => {
    if (verifyPassword(oldPw, masterPasswordHash)) {
      changeMasterPassword(oldPw, newPw);
      const hash = hashPassword(newPw);
      await storage.set('masterPasswordHash', hash);
      await storage.set('masterPasswordHint', hint);
      setMasterPasswordHash(hash);
      setMasterPassword(newPw);
      setMasterPasswordHint(hint);
      return true;
    }
    return false;
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

    const loadMasterPassword = async () => {
      const hash = await storage.get('masterPasswordHash');
      const hint = await storage.get('masterPasswordHint');
      if (hash) {
        setMasterPasswordHash(hash);
        setMasterPasswordHint(hint || '');
      }
    };

    checkAppPassword();
    loadMasterPassword();
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
      if (e.key === 'F11') {
        e.preventDefault();
        setFocusMode(p => !p);
      }
      if (e.key === 'Escape') {
        setFocusMode(false);
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
    if (!verifyPassword(password, masterPasswordHash)) {
      return false;
    }
    const success = unlockForSession(activeId, password);
    if (success) {
      setShowUnlockModal(false);
      return true;
    }
    return false;
  };

  const handleToggleLock = () => {
    if (!activeNote || activeNote.filePath) return;
    if (activeNote.isLocked) {
      if (sessionUnlockedIds.has(activeId)) {
        // If it's already unlocked for viewing, completely remove the lock
        removeLock(activeId);
      } else {
        setShowUnlockModal(true);
      }
    } else {
      if (!masterPasswordHash) {
        // Show lock setup modal
        setShowLockModal(true);
      } else if (!masterPassword) {
        // Need to ask for master password to encrypt
        setShowMasterPasswordPrompt(true);
      } else {
        // Lock immediately
        lockNote(activeId, masterPassword);
      }
    }
  };

  const handleMasterPasswordPromptSubmit = async (password) => {
    if (verifyPassword(password, masterPasswordHash)) {
      setMasterPassword(password);
      lockNote(activeId, password);
      setShowMasterPasswordPrompt(false);
      return true;
    }
    return false;
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
      {!focusMode && <TitleBar />}

      <div className="flex flex-1 overflow-hidden relative">
        {!focusMode && (
          <Sidebar
            isOpen={sidebarOpen}
            notes={notes}
            folders={folders}
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
            onAddFolder={addFolder}
            onRenameFolder={renameFolder}
            onDeleteFolder={deleteFolder}
            onMoveNoteToFolder={moveNoteToFolder}
          />
        )}

        <main className="flex-1 flex flex-col min-w-0 relative">
          {/* Drag Handle for Focus Mode */}
          {focusMode && (
            <div 
              className="absolute top-0 left-0 w-full h-6 z-40 flex items-start justify-center group" 
              style={{ WebkitAppRegion: 'drag' }}
            >
              <div className="w-12 h-1 mt-1.5 bg-[var(--text-muted)] rounded-full opacity-20 group-hover:opacity-60 transition-opacity"></div>
            </div>
          )}

          <button
            onClick={() => setFocusMode(p => !p)}
            className={`absolute ${focusMode ? 'top-4' : 'top-[100px]'} right-4 z-50 p-2 bg-[var(--bg-tertiary)] hover:bg-[var(--accent)] text-[var(--text-muted)] hover:text-white rounded-full shadow-lg opacity-30 hover:opacity-100 transition-all focus:outline-none border border-[var(--border)]`}
            title={focusMode ? "Keluar dari Focus Mode (Esc atau F11)" : "Masuk Focus Mode (F11)"}
            style={{ WebkitAppRegion: 'no-drag' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {focusMode ? (
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
              ) : (
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
              )}
            </svg>
          </button>

          {!focusMode && (
            <TabBar
              tabs={openTabs}
              activeId={activeId}
              onSelect={setActiveId}
              onClose={closeTab}
              onCloseAll={closeAllTabs}
              onAdd={addNote}
              onRename={renameNote}
              onReorderTabs={reorderTabs}
            />
          )}

          {!focusMode && (
            <Toolbar
              editor={editor}
              onToggleSidebar={() => setSidebarOpen(p => !p)}
              onToggleDark={toggleTheme}
              onToggleLock={handleToggleLock}
              onExportTXT={handleExportTXT}
              isLocked={activeNote?.isLocked}
              isExternal={!!activeNote?.filePath}
            />
          )}

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
          {!focusMode && (
            <StatusBar 
              editor={editor} 
              noteName={activeNote?.name} 
              noteFilePath={activeNote?.filePath}
              fontSize={fontSize}
              noteCreatedAt={activeNote?.createdAt}
            />
          )}
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
        <MasterPasswordSetupModal
          onSave={async (pw, hint) => {
            await handleSetMasterPassword(pw, hint);
            lockNote(activeId, pw);
            setShowLockModal(false);
          }}
          onCancel={() => setShowLockModal(false)}
        />
      )}

      {showMasterPasswordPrompt && (
        <PasswordModal
          onSubmit={handleMasterPasswordPromptSubmit}
          hint={masterPasswordHint}
          onCancel={() => setShowMasterPasswordPrompt(false)}
          title="Masukkan Master Password"
          submitText="Kunci Catatan"
        />
      )}

      {showUnlockModal && activeNote && !sessionUnlockedIds.has(activeId) && (
        <PasswordModal
          onSubmit={handleTabUnlock}
          hint={masterPasswordHint}
          onCancel={() => setShowUnlockModal(false)}
          title={`Buka Kunci: ${activeNote.name}`}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          hasMasterPassword={!!masterPasswordHash}
          masterPasswordHint={masterPasswordHint}
          onSetMasterPassword={handleSetMasterPassword}
          onRemoveMasterPassword={handleRemoveMasterPassword}
          onChangeMasterPassword={handleChangeMasterPassword}
          onExportBackup={exportBackup}
          onInitRestore={(data) => setPendingBackupData(data)}
        />
      )}

      {pendingBackupData && (
        <RestoreModal
          backupData={pendingBackupData}
          currentHash={masterPasswordHash}
          onConfirm={(result) => {
             const { folderName, backupPassword } = result;
             const newFolderId = importBackup(pendingBackupData, folderName, backupPassword, masterPassword);
             setPendingBackupData(null);
             window.electronAPI?.showMessage({
                type: 'info',
                title: 'Restore Berhasil',
                message: `Berhasil merestore ${pendingBackupData.notes?.length || 0} catatan ke dalam folder "${folderName}".`
             });
          }}
          onCancel={() => setPendingBackupData(null)}
        />
      )}

      {showShortcutsModal && (
        <ShortcutsModal onClose={() => setShowShortcutsModal(false)} />
      )}
    </div>
  );
}

export default function AppWithProviders() {
  return (
    <LanguageProvider>
      <App />
    </LanguageProvider>
  );
}
