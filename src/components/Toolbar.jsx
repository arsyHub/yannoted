import React from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../contexts/LanguageContext';

const Toolbar = ({ editor, onToggleSidebar, onToggleDark, onToggleLock, onExportTXT, onToggleFocus, isLocked, isExternal }) => {
  const { t } = useLanguage();
  const fileInputRef = React.useRef(null);
  const tableButtonRef = React.useRef(null);
  const pickerRef = React.useRef(null);
  const [showTablePicker, setShowTablePicker] = React.useState(false);
  const [tableGridSize, setTableGridSize] = React.useState({ rows: 0, cols: 0 });
  const [pickerPos, setPickerPos] = React.useState({ top: 0, left: 0 });

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        tableButtonRef.current && !tableButtonRef.current.contains(e.target) &&
        pickerRef.current && !pickerRef.current.contains(e.target)
      ) {
        setShowTablePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) {
    return <div className="h-[42px] bg-[var(--bg-primary)] border-b border-[var(--border)]"></div>;
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        editor.chain().focus().setImage({ src: event.target.result }).run();
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const ToolbarButton = ({ onClick, isActive, disabled, children, title }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-colors flex items-center justify-center shrink-0 ${isActive
        ? 'bg-[var(--accent)] text-white'
        : 'text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-5 bg-[var(--border)] mx-1 shrink-0" />;

  return (
    <div className="flex items-center px-2 py-1.5 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border)] overflow-x-auto slim-scrollbar gap-0.5 z-10 sticky top-0">
      {/* Undo / Redo */}
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title={`${t('undo')} (Ctrl+Z)`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"></path><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"></path></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title={`${t('redo')} (Ctrl+Y)`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"></path><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7"></path></svg>
      </ToolbarButton>

      <Divider />

      {/* Headings */}
      <select
        className="bg-transparent text-[var(--text-primary)] text-sm border-none outline-none cursor-pointer p-1 rounded hover:bg-[var(--bg-tertiary)] appearance-none shrink-0"
        onChange={(e) => {
          const val = e.target.value;
          if (val === 'p') editor.chain().focus().setParagraph().run();
          else editor.chain().focus().toggleHeading({ level: parseInt(val) }).run();
        }}
        value={
          editor.isActive('heading', { level: 1 }) ? '1' :
            editor.isActive('heading', { level: 2 }) ? '2' :
              editor.isActive('heading', { level: 3 }) ? '3' : 'p'
        }
      >
        <option value="p">{t('paragraph')}</option>
        <option value="1">{t('heading1')}</option>
        <option value="2">{t('heading2')}</option>
        <option value="3">{t('heading3')}</option>
      </select>

      <Divider />

      {/* Formatting */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title={`${t('bold')} (Ctrl+B)`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"></path><path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"></path></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title={`${t('italic')} (Ctrl+I)`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title={`${t('underline')} (Ctrl+U)`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3"></path><line x1="4" y1="21" x2="20" y2="21"></line></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title={`${t('strikethrough')} (Ctrl+Shift+X)`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><path d="M16 6C16 6 14.5 4 12 4C9.5 4 8 6 8 8C8 10 9.5 12 12 12C14.5 12 16 14 16 16C16 18 14.5 20 12 20C9.5 20 8 18 8 18"></path></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')} title={`${t('highlight')} (Ctrl+Shift+H)`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3 7h7l-5 5 2 8-7-4-7 4 2-8-5-5h7z"></path></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleSpoiler().run()} isActive={editor.isActive('spoiler')} title={t('spoiler')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
      </ToolbarButton>

      <Divider />

      {/* Alignment */}
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title={`${t('alignLeft')} (Ctrl+Shift+L)`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="17" y1="18" x2="3" y2="18"></line></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title={`${t('alignCenter')} (Ctrl+Shift+E)`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="10" x2="6" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="18" y1="18" x2="6" y2="18"></line></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title={`${t('alignRight')} (Ctrl+Shift+R)`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="10" x2="7" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="7" y2="18"></line></svg>
      </ToolbarButton>

      <Divider />

      {/* Lists */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title={`${t('bulletList')} (Ctrl+Shift+8)`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title={`${t('orderedList')} (Ctrl+Shift+7)`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path></svg>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} title={`${t('taskList')} (Ctrl+Shift+9)`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
      </ToolbarButton>

      <Divider />

      {/* Code */}
      <ToolbarButton
        onClick={() => {
          const { state } = editor;
          const { selection } = state;

          if (!selection.empty && !editor.isActive('codeBlock')) {
            const text = state.doc.textBetween(selection.from, selection.to, '\n');
            const startNode = state.doc.resolve(selection.from).parent;
            const endNode = state.doc.resolve(selection.to).parent;

            if (startNode !== endNode || text.includes('\n')) {
              editor.chain()
                .focus()
                .deleteSelection()
                .insertContent({
                  type: 'codeBlock',
                  content: text ? [{ type: 'text', text }] : undefined
                })
                .run();
              return;
            }
          }

          editor.chain().focus().toggleCodeBlock().run();
        }}
        isActive={editor.isActive('codeBlock')}
        title={`${t('codeBlock')} (Ctrl+Alt+C)`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
      </ToolbarButton>

      <Divider />

      {/* Image */}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        style={{ display: 'none' }} 
      />
      <ToolbarButton
        onClick={() => fileInputRef.current?.click()}
        title={t('insertImage')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
      </ToolbarButton>

      <Divider />

      {/* Table */}
      <div className="relative flex items-center" ref={tableButtonRef}>
        <ToolbarButton
          onClick={(e) => {
            if (!showTablePicker) {
              const rect = e.currentTarget.getBoundingClientRect();
              setPickerPos({ top: rect.bottom + 4, left: rect.left });
            }
            setShowTablePicker(!showTablePicker);
          }}
          title={t('insertTable')}
          isActive={showTablePicker}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>
        </ToolbarButton>

        {showTablePicker && document.body && createPortal(
          <div 
            ref={pickerRef}
            className="fixed bg-[var(--bg-primary)] border border-[var(--border)] rounded-md shadow-xl p-2.5 z-[9999] min-w-max"
            style={{ top: pickerPos.top, left: pickerPos.left }}
          >
            <div className="text-xs text-[var(--text-primary)] text-center mb-2 font-medium">
              {tableGridSize.cols > 0 && tableGridSize.rows > 0 
                ? `${tableGridSize.cols} x ${tableGridSize.rows}` 
                : t('chooseTableSize')}
            </div>
            <div 
              className="grid gap-1" 
              style={{ gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' }}
              onMouseLeave={() => setTableGridSize({ rows: 0, cols: 0 })}
            >
              {Array.from({ length: 6 }).map((_, rowIndex) => (
                Array.from({ length: 6 }).map((_, colIndex) => {
                  const isHovered = rowIndex < tableGridSize.rows && colIndex < tableGridSize.cols;
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`w-4 h-4 border cursor-pointer rounded-[2px] transition-colors ${
                        isHovered
                          ? 'bg-[var(--accent)] border-[var(--accent)]'
                          : 'bg-transparent border-[var(--border)] hover:border-[var(--accent)]'
                      }`}
                      onMouseEnter={() => setTableGridSize({ rows: rowIndex + 1, cols: colIndex + 1 })}
                      onClick={() => {
                        editor.chain().focus().insertTable({ rows: rowIndex + 1, cols: colIndex + 1, withHeaderRow: true }).run();
                        setShowTablePicker(false);
                        setTableGridSize({ rows: 0, cols: 0 });
                      }}
                    />
                  );
                })
              ))}
            </div>
          </div>,
          document.body
        )}
      </div>

      <div className="flex-1"></div>

      {/* Utility Buttons on the Right */}
      <ToolbarButton onClick={onExportTXT} title={t('exportTxt')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
      </ToolbarButton>

      <ToolbarButton onClick={onToggleLock} disabled={isExternal} title={isExternal ? t('lockUnavailable') : (isLocked ? t('unlockNote') : t('lockNote'))}>
        {isLocked ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--lock-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0110 0v4"></path></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 019.9-1"></path></svg>
        )}
      </ToolbarButton>

      <ToolbarButton onClick={onToggleDark} title={`${t('toggleTheme')} (Ctrl+T)`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path></svg>
      </ToolbarButton>

      <ToolbarButton onClick={onToggleSidebar} title={`${t('toggleSidebar')} (Ctrl+B)`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
      </ToolbarButton>
    </div>
  );
};

export default React.memo(Toolbar);
