import React, { useState, useRef, useEffect } from 'react';

const TabBar = ({ tabs, activeId, onSelect, onClose, onAdd, onRename, onReorderTabs }) => {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [draggedIdx, setDraggedIdx] = useState(null);
  const inputRef = useRef(null);
  const activeTabRef = useRef(null);
  const containerRef = useRef(null);

  // Scroll active tab into view whenever it changes
  useEffect(() => {
    if (activeTabRef.current && containerRef.current) {
      activeTabRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [activeId]);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleDoubleClick = (tab) => {
    setEditingId(tab.id);
    setEditValue(tab.name);
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

  const handleDragStart = (e, idx) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e, idx) => {
    e.preventDefault();
    if (draggedIdx !== null && draggedIdx !== idx) {
      onReorderTabs(draggedIdx, idx);
    }
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  return (
    <div ref={containerRef} className="flex bg-[var(--bg-secondary)] border-b border-[var(--border)] overflow-x-auto overflow-y-hidden select-none h-9 custom-scrollbar">
      {tabs.map((tab, idx) => {
        const isActive = activeId === tab.id;
        const isEditing = editingId === tab.id;
        const isDragged = draggedIdx === idx;

        return (
          <div
            key={tab.id}
            ref={isActive ? activeTabRef : null}
            draggable={!isEditing}
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
            onClick={() => !isEditing && onSelect(tab.id)}
            onDoubleClick={() => handleDoubleClick(tab)}
            className={`group flex items-center min-w-[120px] max-w-[200px] px-3 border-r border-[var(--border)] rounded-t-lg cursor-pointer transition-colors ${isActive
              ? 'bg-[var(--bg-primary)] border-b-2 border-b-[var(--accent)] text-[var(--text-primary)]'
              : 'bg-transparent border-b-2 border-b-transparent text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
              } ${isDragged ? 'opacity-50 scale-95' : ''}`}
          >
            {tab.isLocked && (
              <svg className="w-3.5 h-3.5 mr-2 shrink-0" style={{ color: 'var(--lock-color)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0110 0v4"></path>
              </svg>
            )}

            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={saveRename}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--accent)] rounded px-1 outline-none text-sm text-[var(--text-primary)] min-w-[60px]"
              />
            ) : (
              <span className="text-sm truncate flex-1 flex items-center gap-1.5">
                {tab.name}
                {tab.isDirty && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] flex-shrink-0" title="Belum Disimpan"></span>
                )}
              </span>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); onClose(tab.id); }}
              className={`ml-2 p-1 rounded-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              title="Tutup Tab"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        );
      })}

      <button
        onClick={onAdd}
        className="flex shrink-0 items-center justify-center w-9 h-9 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors rounded-t-lg"
        title="Catatan Baru"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>
  );
};

export default TabBar;
