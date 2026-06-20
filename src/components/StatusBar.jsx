import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const StatusBar = ({ editor, noteName, noteFilePath, fontSize = 14, noteCreatedAt }) => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    words: 0,
    chars: 0,
    lines: 1,
    cursorLine: 1,
    cursorCol: 1,
    selectedChars: 0,
  });

  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'typing', 'saving'
  const saveTimeoutRef = useRef(null);
  const finishSaveTimeoutRef = useRef(null);

  useEffect(() => {
    if (!editor) return;

    const updateStats = () => {
      // Menggunakan blockSeparator \n agar baris dan karakter akurat seperti editor biasa
      const text = editor.getText({ blockSeparator: '\n' });
      const { selection, doc } = editor.state;
      const { from, to } = selection;

      // Word & char count
      const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).filter(Boolean).length;
      const chars = text.length;
      const lines = text === '' ? 1 : text.split('\n').length;

      // Cursor position: resolve current ProseMirror position
      const resolved = doc.resolve(from);
      
      let cursorCol = 1;
      if (resolved.parent.type.name === 'doc') {
        cursorCol = 1;
      } else {
        const textInBlockBefore = doc.textBetween(
          resolved.start(), 
          from, 
          '\n', 
          node => node.type.name === 'hard_break' ? '\n' : ''
        );
        const lastNewlineIndex = textInBlockBefore.lastIndexOf('\n');
        cursorCol = lastNewlineIndex !== -1 
          ? textInBlockBefore.length - lastNewlineIndex 
          : textInBlockBefore.length + 1;
      }

      // Count lines up to current position accurately based on block nodes
      let cursorLine = 1;
      doc.nodesBetween(0, from, (node, pos, parent, index) => {
        if (pos > from) return false;
        if (node.isText) {
          const textNode = node.text.slice(0, Math.max(0, from - pos));
          cursorLine += (textNode.match(/\n/g) || []).length;
        } else if (node.type.name === 'hard_break') {
          cursorLine++;
        } else if (node.isBlock && parent && index > 0) {
          cursorLine++;
        }
      });

      // Selected chars — use actual text content, not ProseMirror positions
      const selectedText = from !== to ? doc.textBetween(from, to, '\n') : '';
      const selectedChars = selectedText.length;

      setStats({ words, chars, lines, cursorLine, cursorCol, selectedChars });
    };

    const handleUpdate = () => {
      updateStats();
      
      // Auto-save feedback logic
      setSaveStatus('typing');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (finishSaveTimeoutRef.current) clearTimeout(finishSaveTimeoutRef.current);
      
      saveTimeoutRef.current = setTimeout(() => {
        setSaveStatus('saving');
        finishSaveTimeoutRef.current = setTimeout(() => {
          setSaveStatus('saved');
        }, 600); // Tampilkan "Menyimpan..." selama 600ms
      }, 1000); // Mulai menyimpan 1 detik setelah berhenti mengetik
    };

    updateStats();
    editor.on('update', handleUpdate);
    editor.on('selectionUpdate', updateStats);

    return () => {
      editor.off('update', handleUpdate);
      editor.off('selectionUpdate', updateStats);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (finishSaveTimeoutRef.current) clearTimeout(finishSaveTimeoutRef.current);
    };
  }, [editor]);

  const sep = () => (
    <span className="mx-2 opacity-30">|</span>
  );

  return (
    <div
      className="flex items-center justify-between px-4 h-[38px] text-xs select-none shrink-0"
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border)',
      }}
    >
      {/* Left: note name and optional file path */}
      <div className="flex items-center gap-1 min-w-0">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <span className="truncate opacity-80 shrink-0 font-medium">{noteName || '—'}</span>
        
        {noteFilePath && (
          <>
            <span className="mx-2 opacity-30 shrink-0">|</span>
            <span 
              className="truncate opacity-50 hover:opacity-100 hover:text-[var(--accent)] cursor-pointer transition-colors max-w-[300px]"
              title={`${t('openLocation')}: ${noteFilePath}`}
              onClick={() => window.electronAPI?.openFileLocation(noteFilePath)}
            >
              {noteFilePath}
            </span>
          </>
        )}

        <span className="mx-2 opacity-30 shrink-0">|</span>
        
        {/* Auto Save Feedback */}
        <div className="flex items-center w-24">
          {saveStatus === 'typing' && (
            <span className="flex items-center gap-1 opacity-70">
              <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-pulse"></span>
              {t('typing')}
            </span>
          )}
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-[var(--accent)]">
              <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              {t('saving')}
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 opacity-50">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              {t('saved')}
            </span>
          )}
        </div>
      </div>

      {/* Right: stats */}
      <div className="flex items-center whitespace-nowrap">
        {/* Cursor position */}
        <span title="Line : Col">
          Ln {stats.cursorLine}, Col {stats.cursorCol}
        </span>

        {sep()}

        {/* Selection */}
        {stats.selectedChars > 0 ? (
          <>
            <span title={`${stats.selectedChars} ${t('selected')}`} className="text-[var(--accent)]">
              {stats.selectedChars} {t('selected')}
            </span>
            {sep()}
          </>
        ) : null}

        {/* Words */}
        <span title={t('words')}>
          {stats.words.toLocaleString()} {t('words').toLowerCase()}
        </span>

        {sep()}

        {/* Chars */}
        <span title={t('chars')}>
          {stats.chars.toLocaleString()} {t('chars').toLowerCase()}
        </span>

        {sep()}

        {/* Lines */}
        <span title={t('lines')}>
          {stats.lines.toLocaleString()} {t('lines').toLowerCase()}
        </span>

        {sep()}

        {/* Zoom Level */}
        <span title="Tingkat Zoom">
          {Math.round((fontSize / 14) * 100)}%
        </span>

        {sep()}

        {/* Creation Date */}
        {noteCreatedAt && (
          <>
            <span title="Tanggal dibuat">
              {new Date(noteCreatedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
            {sep()}
          </>
        )}

        <span className="opacity-60">UTF-8</span>
      </div>
    </div>
  );
};

export default React.memo(StatusBar);
