import React, { useState, useEffect } from 'react';

const StatusBar = ({ editor, noteName, noteFilePath, fontSize = 14, noteCreatedAt }) => {
  const [stats, setStats] = useState({
    words: 0,
    chars: 0,
    lines: 1,
    cursorLine: 1,
    cursorCol: 1,
    selectedChars: 0,
  });

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

    updateStats();
    editor.on('update', updateStats);
    editor.on('selectionUpdate', updateStats);

    return () => {
      editor.off('update', updateStats);
      editor.off('selectionUpdate', updateStats);
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
              title={`Buka Lokasi: ${noteFilePath}`}
              onClick={() => window.electronAPI?.openFileLocation(noteFilePath)}
            >
              {noteFilePath}
            </span>
          </>
        )}
      </div>

      {/* Right: stats */}
      <div className="flex items-center whitespace-nowrap">
        {/* Cursor position */}
        <span title="Baris : Kolom">
          Ln {stats.cursorLine}, Col {stats.cursorCol}
        </span>

        {sep()}

        {/* Selection */}
        {stats.selectedChars > 0 ? (
          <>
            <span title="Karakter terpilih" className="text-[var(--accent)]">
              {stats.selectedChars} terpilih
            </span>
            {sep()}
          </>
        ) : null}

        {/* Words */}
        <span title="Jumlah kata">
          {stats.words.toLocaleString('id-ID')} kata
        </span>

        {sep()}

        {/* Chars */}
        <span title="Jumlah karakter">
          {stats.chars.toLocaleString('id-ID')} karakter
        </span>

        {sep()}

        {/* Lines */}
        <span title="Jumlah baris">
          {stats.lines.toLocaleString('id-ID')} baris
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

export default StatusBar;
