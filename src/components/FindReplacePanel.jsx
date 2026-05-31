import React, { useState, useRef, useEffect, useCallback } from 'react';
import { searchHighlightKey } from '../extensions/SearchHighlight';

const FindReplacePanel = ({ editor, onClose }) => {
  const [findTerm, setFindTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [matches, setMatches] = useState([]);
  const [showReplace, setShowReplace] = useState(false);
  const findInputRef = useRef(null);

  // Shared close handler — always clears highlights
  const handleClose = useCallback(() => {
    if (editor) {
      editor.view.dispatch(
        editor.state.tr.setMeta(searchHighlightKey, { searchTerm: '', currentIdx: -1, matches: [] })
      );
    }
    onClose();
  }, [editor, onClose]);

  // Focus input when panel opens
  useEffect(() => {
    findInputRef.current?.focus();
  }, []);

  // Handle Escape to close
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleClose]);

  // Dispatch highlights to ProseMirror decoration plugin
  const dispatchHighlights = useCallback((results, activeIdx) => {
    if (!editor) return;
    editor.view.dispatch(
      editor.state.tr.setMeta(searchHighlightKey, {
        searchTerm: findTerm,
        currentIdx: activeIdx,
        matches: results,
      })
    );
  }, [editor, findTerm]);

  // Find all text positions in ProseMirror doc
  const findMatches = useCallback((term) => {
    if (!editor || !term) {
      setMatches([]);
      setCurrentIdx(-1);
      return [];
    }

    const results = [];
    const searchText = caseSensitive ? term : term.toLowerCase();

    editor.state.doc.descendants((node, pos) => {
      if (!node.isText) return;
      const text = caseSensitive ? node.text : node.text.toLowerCase();
      let offset = 0;
      while (true) {
        const idx = text.indexOf(searchText, offset);
        if (idx === -1) break;
        results.push({ from: pos + idx, to: pos + idx + term.length });
        offset = idx + 1;
      }
    });

    setMatches(results);
    dispatchHighlights(results, currentIdx);
    return results;
  }, [editor, caseSensitive]);

  // Update matches when findTerm or caseSensitive changes
  useEffect(() => {
    const results = findMatches(findTerm);
    const newIdx = results.length > 0 ? 0 : -1;
    setCurrentIdx(newIdx);
    if (results.length > 0) {
      dispatchHighlights(results, newIdx);
      editor?.commands.setTextSelection({ from: results[0].from, to: results[0].to });
    } else {
      dispatchHighlights([], -1);
    }
  }, [findTerm, caseSensitive]);

  const selectMatch = (match) => {
    if (!editor || !match) return;
    editor.commands.setTextSelection({ from: match.from, to: match.to });
  };

  const goNext = () => {
    if (!matches.length) return;
    const next = (currentIdx + 1) % matches.length;
    setCurrentIdx(next);
    dispatchHighlights(matches, next);
    editor?.commands.setTextSelection({ from: matches[next].from, to: matches[next].to });
  };

  const goPrev = () => {
    if (!matches.length) return;
    const prev = (currentIdx - 1 + matches.length) % matches.length;
    setCurrentIdx(prev);
    dispatchHighlights(matches, prev);
    editor?.commands.setTextSelection({ from: matches[prev].from, to: matches[prev].to });
  };

  const replaceOne = () => {
    if (!editor || currentIdx === -1 || !matches[currentIdx]) return;
    const match = matches[currentIdx];
    editor.chain()
      .setTextSelection({ from: match.from, to: match.to })
      .insertContent(replaceTerm)
      .run();
    // Refresh matches after replacement
    setTimeout(() => {
      const results = findMatches(findTerm);
      const next = Math.min(currentIdx, results.length - 1);
      setCurrentIdx(next);
      if (results[next]) selectMatch(results[next]);
    }, 50);
  };

  const replaceAll = () => {
    if (!editor || !findTerm) return;
    const results = findMatches(findTerm);
    if (!results.length) return;
    const chain = editor.chain();
    [...results].reverse().forEach(match => {
      chain.setTextSelection({ from: match.from, to: match.to }).insertContent(replaceTerm);
    });
    chain.run();
    setMatches([]);
    setCurrentIdx(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) goPrev();
      else goNext();
    }
  };

  const btnClass = "px-3 py-1 text-xs rounded transition-colors";
  const primaryBtn = `${btnClass} bg-[var(--accent)] text-white hover:opacity-80`;
  const secondaryBtn = `${btnClass} bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--border)]`;
  const iconBtn = "p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40";

  return (
    <div
      className="absolute top-0 right-0 z-50 shadow-xl border border-[var(--border)] rounded-bl-lg overflow-hidden"
      style={{ backgroundColor: 'var(--bg-secondary)', minWidth: '340px' }}
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
        <div className="flex gap-3 text-xs font-medium">
          <button
            onClick={() => setShowReplace(false)}
            className={`pb-0.5 transition-colors ${!showReplace ? 'text-[var(--accent)] border-b border-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
          >
            Temukan
          </button>
          <button
            onClick={() => setShowReplace(true)}
            className={`pb-0.5 transition-colors ${showReplace ? 'text-[var(--accent)] border-b border-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
          >
            Temukan & Ganti
          </button>
        </div>
        <button onClick={handleClose} className={iconBtn} title="Tutup (Esc)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Find Row */}
      <div className="px-3 pt-3 pb-2 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={findInputRef}
              type="text"
              placeholder="Cari teks..."
              value={findTerm}
              onChange={e => setFindTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded px-3 py-1.5 outline-none focus:border-[var(--accent)] pr-20 transition-colors"
            />
            {/* Match counter */}
            {findTerm && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">
                {matches.length > 0 ? `${currentIdx + 1}/${matches.length}` : 'Tidak ditemukan'}
              </span>
            )}
          </div>
          {/* Case sensitive toggle */}
          <button
            onClick={() => setCaseSensitive(p => !p)}
            className={`px-2 py-1.5 text-xs rounded border transition-colors ${caseSensitive ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'}`}
            title="Huruf besar/kecil"
          >
            Aa
          </button>
        </div>

        {/* Find navigation buttons */}
        <div className="flex gap-2">
          <button onClick={goPrev} disabled={matches.length === 0} className={`${secondaryBtn} flex items-center gap-1`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            Sebelumnya
          </button>
          <button onClick={goNext} disabled={matches.length === 0} className={`${secondaryBtn} flex items-center gap-1`}>
            Berikutnya
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        {/* Replace Row */}
        {showReplace && (
          <>
            <input
              type="text"
              placeholder="Ganti dengan..."
              value={replaceTerm}
              onChange={e => setReplaceTerm(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') replaceOne(); }}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded px-3 py-1.5 outline-none focus:border-[var(--accent)] transition-colors"
            />
            <div className="flex gap-2">
              <button onClick={replaceOne} disabled={currentIdx === -1} className={primaryBtn}>
                Ganti
              </button>
              <button onClick={replaceAll} disabled={!matches.length} className={`${secondaryBtn}`}>
                Ganti Semua
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FindReplacePanel;
