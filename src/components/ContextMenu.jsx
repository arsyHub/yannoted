import React, { useEffect, useRef } from 'react';

const ContextMenu = ({ x, y, editor, onClose }) => {
  const menuRef = useRef(null);

  // Close on click outside or Escape
  useEffect(() => {
    const handleClick = () => onClose();
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleKey);
    }, 0);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  // Adjust position so menu doesn't go off screen
  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const el = menuRef.current;
    if (rect.right > window.innerWidth) el.style.left = `${x - rect.width}px`;
    if (rect.bottom > window.innerHeight) el.style.top = `${y - rect.height}px`;
  }, [x, y]);

  const hasSelection = editor && !editor.state.selection.empty;

  const run = (fn) => {
    fn();
    onClose();
  };

  const Item = ({ label, shortcut, onClick, disabled = false, danger = false }) => (
    <button
      onMouseDown={(e) => { e.preventDefault(); if (!disabled) onClick(); }}
      disabled={disabled}
      className={`w-full flex items-center justify-between gap-6 px-3 py-1.5 text-sm text-left rounded transition-colors
        ${disabled ? 'opacity-40 cursor-default' : danger
          ? 'text-red-400 hover:bg-red-500/10'
          : 'text-[var(--text-primary)] hover:bg-[var(--accent)]/15 hover:text-[var(--accent)]'
        }`}
    >
      <span>{label}</span>
      {shortcut && <span className="text-xs text-[var(--text-muted)] ml-4">{shortcut}</span>}
    </button>
  );

  const Sep = () => <div className="my-1 border-t border-[var(--border)]" />;

  return (
    <div
      ref={menuRef}
      onMouseDown={(e) => e.stopPropagation()}
      className="fixed z-[9999] py-1 px-1 min-w-[180px] rounded-lg shadow-2xl border border-[var(--border)] text-sm"
      style={{ left: x, top: y, backgroundColor: 'var(--bg-secondary)' }}
    >
      {/* Clipboard */}
      <Item
        label="Potong"
        shortcut="Ctrl+X"
        disabled={!hasSelection}
        onClick={() => run(() => document.execCommand('cut'))}
      />
      <Item
        label="Salin"
        shortcut="Ctrl+C"
        disabled={!hasSelection}
        onClick={() => run(() => document.execCommand('copy'))}
      />
      <Item
        label="Tempel"
        shortcut="Ctrl+V"
        onClick={() => run(() => {
          editor.chain().focus().run();
          document.execCommand('paste');
        })}
      />
      <Item
        label="Pilih Semua"
        shortcut="Ctrl+A"
        onClick={() => run(() => editor.chain().focus().selectAll().run())}
      />

      <Sep />

      {/* Formatting */}
      <Item
        label="Tebal"
        shortcut="Ctrl+B"
        onClick={() => run(() => editor.chain().focus().toggleBold().run())}
      />
      <Item
        label="Miring"
        shortcut="Ctrl+I"
        onClick={() => run(() => editor.chain().focus().toggleItalic().run())}
      />
      <Item
        label="Garis Bawah"
        shortcut="Ctrl+U"
        onClick={() => run(() => editor.chain().focus().toggleUnderline().run())}
      />
      <Item
        label="Coret"
        onClick={() => run(() => editor.chain().focus().toggleStrike().run())}
      />

      <Sep />

      {/* Blocks */}
      <Item
        label="Inline Code"
        onClick={() => run(() => editor.chain().focus().toggleCode().run())}
      />
      <Item
        label="Code Block"
        onClick={() => run(() => editor.chain().focus().toggleCodeBlock().run())}
      />
      <Item
        label="Bullet List"
        onClick={() => run(() => editor.chain().focus().toggleBulletList().run())}
      />
      <Item
        label="Numbered List"
        onClick={() => run(() => editor.chain().focus().toggleOrderedList().run())}
      />
    </div>
  );
};

export default ContextMenu;
