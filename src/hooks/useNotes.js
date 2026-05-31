import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { storage } from '../utils/storage';
import { generateNoteName } from '../utils/dateFormat';
import { hashPassword, verifyPassword, encryptContent, decryptContent } from '../utils/crypto';

export function useNotes() {
  const [notes, setNotes] = useState([]);
  const [openTabIds, setOpenTabIds] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [sessionUnlockedIds, setSessionUnlockedIds] = useState(new Set());

  // Stores plaintext passwords per-note for re-encryption during persist
  const sessionPasswordsRef = useRef(new Map());

  // Ref to always have fresh notes for async functions (fixes stale closure)
  const notesRef = useRef(notes);
  useEffect(() => { notesRef.current = notes; }, [notes]);

  // Track watched file paths for cleanup
  const watchedPathsRef = useRef(new Set());

  useEffect(() => {
    const loadNotes = async () => {
      const storedNotes = await storage.get('notes');
      const lastActiveId = await storage.get('activeId');
      const storedOpenTabIds = await storage.get('openTabIds');

      if (storedNotes && storedNotes.length > 0) {
        const initialNotes = storedNotes.map(n => ({
          ...n,
          isLocked: n.lockPasswordHash ? true : n.isLocked,
          status: n.status || 'active',
          updatedAt: n.updatedAt || n.createdAt,
          filePath: n.filePath || null,
          isDirty: n.isDirty || false,
          encryptedContent: n.encryptedContent || null,
        }));
        setNotes(initialNotes);

        // Load open tabs
        if (storedOpenTabIds && storedOpenTabIds.length > 0) {
          setOpenTabIds(storedOpenTabIds);
        } else if (lastActiveId) {
          setOpenTabIds([lastActiveId]);
        } else {
          setOpenTabIds([initialNotes[0].id]);
        }

        if (lastActiveId && initialNotes.some(n => n.id === lastActiveId)) {
          setActiveId(lastActiveId);
        } else if (storedOpenTabIds && storedOpenTabIds.length > 0) {
          setActiveId(storedOpenTabIds[0]);
        } else {
          setActiveId(initialNotes[0].id);
        }
      } else {
        const newNote = createNewNote();
        setNotes([newNote]);
        setOpenTabIds([newNote.id]);
        setActiveId(newNote.id);
      }
      setIsLoaded(true);
    };
    loadNotes();
  }, []);

  // Effect 1: Persist state to storage — encrypt locked notes before saving
  useEffect(() => {
    if (isLoaded) {
      const notesForStorage = notes.map(note => {
        if (note.isLocked) {
          if (sessionPasswordsRef.current.has(note.id)) {
            // Session-unlocked: re-encrypt current content before saving
            const pw = sessionPasswordsRef.current.get(note.id);
            return {
              ...note,
              encryptedContent: encryptContent(note.content, pw),
              content: '', // Never persist plaintext for locked notes
            };
          }
          if (note.encryptedContent) {
            // Locked, not session-unlocked: save encrypted, clear any leftover plaintext
            return { ...note, content: '' };
          }
          // Legacy locked note without encryption: leave as-is for backward compat
        }
        return note;
      });
      storage.set('notes', notesForStorage);
      storage.set('openTabIds', openTabIds);
      if (activeId) {
        storage.set('activeId', activeId);
      }
    }
  }, [notes, activeId, openTabIds, isLoaded]);

  // Effect 2: File watching — only re-run when the set of filePaths changes
  const filePathsKey = notes
    .filter(n => n.filePath)
    .map(n => n.filePath)
    .sort()
    .join('|');

  useEffect(() => {
    if (!isLoaded || !window.electronAPI || !window.electronAPI.watchFile) return;

    const currentPaths = new Set(
      notes.filter(n => n.filePath).map(n => n.filePath)
    );

    // Unwatch paths that are no longer needed
    for (const oldPath of watchedPathsRef.current) {
      if (!currentPaths.has(oldPath)) {
        window.electronAPI.unwatchFile(oldPath);
        watchedPathsRef.current.delete(oldPath);
      }
    }

    // Watch new paths
    for (const newPath of currentPaths) {
      if (!watchedPathsRef.current.has(newPath)) {
        window.electronAPI.watchFile(newPath);
        watchedPathsRef.current.add(newPath);
      }
    }

    // Cleanup on unmount: unwatch all
    return () => {
      for (const p of watchedPathsRef.current) {
        window.electronAPI.unwatchFile(p);
      }
      watchedPathsRef.current.clear();
    };
  }, [filePathsKey, isLoaded]);

  useEffect(() => {
    if (!window.electronAPI || !window.electronAPI.onFileChanged) return;

    const unsubscribe = window.electronAPI.onFileChanged(({ filePath, content }) => {
      setNotes(prev => {
        const noteToUpdate = prev.find(n => n.filePath === filePath);
        if (!noteToUpdate) return prev;

        const htmlContent = content.split('\n').map(line => {
          let parsedLine = line.replace(/\t/g, '    ');
          parsedLine = parsedLine.replace(/^( +)/, match => '&nbsp;'.repeat(match.length));
          parsedLine = parsedLine.replace(/  /g, ' &nbsp;');
          return `<p>${parsedLine || '<br>'}</p>`;
        }).join('');

        // If content is same, do not trigger an update to avoid cursor jumping
        if (noteToUpdate.content === htmlContent) return prev;

        return prev.map(n => n.id === noteToUpdate.id ? { ...n, content: htmlContent, updatedAt: Date.now() } : n);
      });
    });

    return () => unsubscribe();
  }, []);

  const createNewNote = (existingNotes = []) => {
    const now = Date.now();
    return {
      id: uuid(),
      name: generateNoteName(existingNotes),
      content: "",
      createdAt: now,
      updatedAt: now,
      isLocked: false,
      lockPasswordHash: null,
      lockHint: null,
      encryptedContent: null,
      isPinned: false,
      status: 'active', // 'active', 'archived', 'trash'
      filePath: null,
      isDirty: false,
    };
  };

  // Fix 1.1: No more nested setState — compute new state, then set all at once
  const addNote = () => {
    const newNote = createNewNote(notes);
    const lastPinnedIdx = notes.findLastIndex(n => n.isPinned);
    const next = [...notes];
    next.splice(lastPinnedIdx + 1, 0, newNote);

    setNotes(next);
    setOpenTabIds(prev => [...prev, newNote.id]);
    setActiveId(newNote.id);
  };

  const openNote = (id) => {
    setOpenTabIds(prev => {
      if (!prev.includes(id)) return [...prev, id];
      return prev;
    });
    setActiveId(id);
  };

  const closeTab = (id) => {
    setOpenTabIds(prev => {
      const updated = prev.filter(tabId => tabId !== id);
      if (activeId === id) {
        if (updated.length > 0) {
          const openNotes = notes.filter(n => updated.includes(n.id));
          if (openNotes.length > 0) {
            const newest = openNotes.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
            setActiveId(newest.id);
          } else {
            setActiveId(null);
          }
        } else {
          setActiveId(null);
        }
      }
      return updated;
    });
  };

  // Fix 1.2: Completely refactored — no nested setState
  const deleteNotePermanently = (id) => {
    const remainingNotes = notes.filter(n => n.id !== id);
    const remainingTabs = openTabIds.filter(tabId => tabId !== id);

    if (remainingNotes.length === 0) {
      // No notes left — create a fresh one
      const newNote = createNewNote();
      setNotes([newNote]);
      setOpenTabIds([newNote.id]);
      setActiveId(newNote.id);
      return;
    }

    setNotes(remainingNotes);

    if (activeId === id) {
      if (remainingTabs.length > 0) {
        const openNotes = remainingNotes.filter(n => remainingTabs.includes(n.id));
        if (openNotes.length > 0) {
          const newest = openNotes.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
          setActiveId(newest.id);
        } else {
          setActiveId(remainingNotes[0].id);
        }
        setOpenTabIds(remainingTabs);
      } else {
        // No open tabs left — open the newest remaining note
        const newest = remainingNotes.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
        setOpenTabIds([newest.id]);
        setActiveId(newest.id);
      }
    } else {
      setOpenTabIds(remainingTabs);
    }
  };

  // Fix 3.5: Handle emptyTrash when all notes are trashed
  const emptyTrash = () => {
    const trashIds = new Set(notes.filter(n => n.status === 'trash').map(n => n.id));
    const remainingNotes = notes.filter(n => n.status !== 'trash');
    const remainingTabs = openTabIds.filter(tabId => !trashIds.has(tabId));

    if (remainingNotes.length === 0) {
      // All notes were in trash — create a fresh one
      const newNote = createNewNote();
      setNotes([newNote]);
      setOpenTabIds([newNote.id]);
      setActiveId(newNote.id);
      return;
    }

    setNotes(remainingNotes);

    if (trashIds.has(activeId)) {
      if (remainingTabs.length > 0) {
        const openNotes = remainingNotes.filter(n => remainingTabs.includes(n.id));
        if (openNotes.length > 0) {
          const newest = openNotes.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
          setActiveId(newest.id);
        } else {
          setActiveId(remainingNotes[0].id);
        }
      } else {
        setActiveId(null);
      }
    }
    setOpenTabIds(remainingTabs);
  };

  const updateContent = (id, html) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, content: html, updatedAt: Date.now(), isDirty: true } : n));
  };

  const renameNote = (id, name) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, name, updatedAt: Date.now() } : n));
  };

  const archiveNote = (id) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, status: 'archived', isPinned: false, updatedAt: Date.now() } : n));
    closeTab(id); // Optional: close it if it's archived
  };

  const trashNote = (id) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, status: 'trash', isPinned: false, updatedAt: Date.now() } : n));
    closeTab(id);
  };

  const restoreNote = (id) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, status: 'active', updatedAt: Date.now() } : n));
  };

  const togglePin = (id) => {
    setNotes(prev => {
      const idx = prev.findIndex(n => n.id === id);
      if (idx === -1) return prev;
      const note = prev[idx];
      const isNowPinned = !note.isPinned;
      const otherNotes = prev.filter(n => n.id !== id);

      if (isNowPinned) {
        return [{ ...note, isPinned: true }, ...otherNotes];
      } else {
        const lastPinnedIdx = otherNotes.findLastIndex(n => n.isPinned);
        otherNotes.splice(lastPinnedIdx + 1, 0, { ...note, isPinned: false });
        return otherNotes;
      }
    });
  };

  const reorderTabs = (startIdx, endIdx) => {
    setOpenTabIds(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIdx, 1);
      result.splice(endIdx, 0, removed);
      return result;
    });
  };

  const reorderNotes = (startIdx, endIdx) => {
    setNotes(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIdx, 1);
      result.splice(endIdx, 0, removed);
      return result;
    });
  };

  const lockNote = (id, pw, hint) => {
    const hash = hashPassword(pw);
    const note = notesRef.current.find(n => n.id === id);
    const encrypted = note ? encryptContent(note.content, pw) : '';

    setNotes(prev => prev.map(n =>
      n.id === id ? { ...n, isLocked: true, lockPasswordHash: hash, lockHint: hint, encryptedContent: encrypted } : n
    ));
    // Store password in session for re-encryption on persist
    sessionPasswordsRef.current.set(id, pw);
    setSessionUnlockedIds(prev => new Set(prev).add(id));
  };

  const unlockForSession = (id, pw) => {
    const note = notes.find(n => n.id === id);
    if (!note || !verifyPassword(pw, note.lockPasswordHash)) return false;

    // Decrypt content if encrypted
    if (note.encryptedContent) {
      const decrypted = decryptContent(note.encryptedContent, pw);
      setNotes(prev => prev.map(n =>
        n.id === id ? { ...n, content: decrypted } : n
      ));
    }
    // Store password in session for re-encryption on persist
    sessionPasswordsRef.current.set(id, pw);
    setSessionUnlockedIds(prev => new Set(prev).add(id));
    return true;
  };

  const removeLock = (id) => {
    setNotes(prev => prev.map(n =>
      n.id === id ? { ...n, isLocked: false, lockPasswordHash: null, lockHint: null, encryptedContent: null } : n
    ));
    sessionPasswordsRef.current.delete(id);
    setSessionUnlockedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // Fix 1.1: No nested setState in openExternalFile
  const openExternalFile = useCallback(async () => {
    if (!window.electronAPI) return;
    const filePath = await window.electronAPI.openFileDialog();
    if (!filePath) return;

    // Use ref for fresh notes
    const currentNotes = notesRef.current;
    const existingNote = currentNotes.find(n => n.filePath === filePath);
    if (existingNote) {
      openNote(existingNote.id);
      return;
    }

    const content = await window.electronAPI.readFile(filePath);
    if (content === null) {
      alert("Gagal membaca file!");
      return;
    }

    let name = filePath.split(/[\\/]/).pop();
    if (name.endsWith('.txt')) name = name.slice(0, -4);

    // Split content by newline to create basic HTML for tiptap (wrap in <p>)
    const htmlContent = content.split('\n').map(line => {
      // Replace tabs with 4 spaces
      let parsedLine = line.replace(/\t/g, '    ');
      // Replace leading spaces with &nbsp;
      parsedLine = parsedLine.replace(/^( +)/, match => '&nbsp;'.repeat(match.length));
      // Replace consecutive spaces inside text with alternating space and &nbsp;
      parsedLine = parsedLine.replace(/  /g, ' &nbsp;');
      // Ensure empty lines render correctly
      return `<p>${parsedLine || '<br>'}</p>`;
    }).join('');

    const newNote = {
      ...createNewNote(currentNotes),
      name: name,
      content: htmlContent,
      filePath: filePath,
      isDirty: false,
    };

    const lastPinnedIdx = currentNotes.findLastIndex(n => n.isPinned);
    const next = [...currentNotes];
    next.splice(lastPinnedIdx + 1, 0, newNote);

    setNotes(next);
    setOpenTabIds(prev => [...prev, newNote.id]);
    setActiveId(newNote.id);
  }, []);

  // Fix 3.2: Use notesRef to avoid stale closure
  const saveNoteToFile = useCallback(async (idToSave, plainText) => {
    if (!window.electronAPI || !idToSave) return;
    const note = notesRef.current.find(n => n.id === idToSave);
    if (!note) return;

    let targetPath = note.filePath;

    if (!targetPath) {
      targetPath = await window.electronAPI.saveFileDialog(`${note.name}.txt`);
      if (!targetPath) return;
    } else {
      const response = await window.electronAPI.showMessage({
        type: 'question',
        buttons: ['Ya, Simpan', 'Batal'],
        defaultId: 0,
        cancelId: 1,
        title: 'Konfirmasi Simpan',
        message: `Apakah Anda yakin ingin menyimpan dan menimpa file ini?\n\n${targetPath}`
      });
      if (response !== 0) return;
    }

    const success = await window.electronAPI.writeFile(targetPath, plainText);
    if (success) {
      let name = targetPath.split(/[\\/]/).pop();
      if (name.endsWith('.txt')) name = name.slice(0, -4);
      setNotes(prev => prev.map(n =>
        n.id === idToSave
          ? { ...n, filePath: targetPath, name: name, isDirty: false }
          : n
      ));
    } else {
      alert("Gagal menyimpan file!");
    }
  }, []);

  return {
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
    saveNoteToFile,
  };
}
