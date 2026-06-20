import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockComponent from './CodeBlockComponent';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import ImageResize from 'tiptap-extension-resize-image';
import { createLowlight } from 'lowlight';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import python from 'highlight.js/lib/languages/python';
import html from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import bash from 'highlight.js/lib/languages/bash';
import sql from 'highlight.js/lib/languages/sql';
import { Spoiler } from '../extensions/Spoiler';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { SearchHighlight } from '../extensions/SearchHighlight';
import { SelectionMatchHighlight } from '../extensions/SelectionMatchHighlight';
import { BracketMatch } from '../extensions/BracketMatch';
import SlashCommand from '../extensions/SlashCommand';
import { MoveLine } from '../extensions/MoveLine';
import { CutEmptyLine } from '../extensions/CutEmptyLine';
import { useLanguage } from '../contexts/LanguageContext';

const lowlight = createLowlight();
lowlight.register('javascript', javascript);
lowlight.register('js', javascript);
lowlight.register('typescript', typescript);
lowlight.register('ts', typescript);
lowlight.register('json', json);
lowlight.register('python', python);
lowlight.register('py', python);
lowlight.register('html', html);
lowlight.register('xml', html);
lowlight.register('css', css);
lowlight.register('bash', bash);
lowlight.register('sh', bash);
lowlight.register('sql', sql);

const savedCursorPositions = new Map();
const savedScrollPositions = new Map();

const MenuButton = ({ onClick, isActive, title, children }) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded transition-colors flex items-center justify-center shrink-0 ${isActive
      ? 'bg-[var(--accent)] text-white'
      : 'text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
    }`}
  >
    {children}
  </button>
);

const Editor = ({ note, onContentChange, onEditorReady, isSessionUnlocked }) => {
  const { t } = useLanguage();
  const tRef = useRef(t);
  const scrollRef = useRef(null);

  const updateTimeoutRef = useRef(null);
  const pendingHtmlRef = useRef(null);
  const onContentChangeRef = useRef(onContentChange);

  useEffect(() => {
    onContentChangeRef.current = onContentChange;
  }, [onContentChange]);

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        if (onContentChangeRef.current && pendingHtmlRef.current !== null) {
          onContentChangeRef.current(pendingHtmlRef.current);
        }
      }
    };
  }, []);

  const handleScroll = (e) => {
    if (note) {
      savedScrollPositions.set(note.id, e.target.scrollTop);
    }
  };

  const scrollToTop = () => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  };

  const scrollToCursor = () => {
    if (editor) {
      editor.commands.focus();
      // Menggunakan API ProseMirror untuk scroll ke posisi kursor/seleksi saat ini
      editor.view.dispatch(editor.state.tr.scrollIntoView());
    }
  };



  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, code: false }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight,
      TextStyle,
      CodeBlockLowlight.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            highlightedLines: {
              default: [],
              parseHTML: element => JSON.parse(element.getAttribute('data-highlighted-lines') || '[]'),
              renderHTML: attributes => {
                return {
                  'data-highlighted-lines': JSON.stringify(attributes.highlightedLines),
                };
              },
            },
          };
        },
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockComponent);
        }
      }).configure({ lowlight, defaultLanguage: 'javascript' }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({ placeholder: () => tRef.current('startTyping') }),
      ImageResize.configure({
        inline: true,
        allowBase64: true,
      }),
      Spoiler,
      SearchHighlight,
      SelectionMatchHighlight,
      BracketMatch,
      SlashCommand,
      MoveLine,
      CutEmptyLine,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    editorProps: {
      handlePaste: (view, event) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        // Helper: masukkan gambar ke editor dari File object
        const insertImage = (file) => {
          const reader = new FileReader();
          reader.onload = (readerEvent) => {
            const src = readerEvent.target.result;
            const nodeType = view.state.schema.nodes.imageResize || view.state.schema.nodes.image;
            if (!nodeType) return;
            view.dispatch(
              view.state.tr.replaceSelectionWith(
                nodeType.create({ src })
              )
            );
          };
          reader.readAsDataURL(file);
        };

        // Cek clipboardData.items (untuk screenshot, copy image dari browser, dll)
        const items = Array.from(clipboardData.items || []);
        const imageItem = items.find(item => item.type.startsWith('image/'));
        if (imageItem) {
          event.preventDefault();
          const file = imageItem.getAsFile();
          if (file) insertImage(file);
          return true;
        }

        // Cek clipboardData.files (fallback)
        const files = Array.from(clipboardData.files || []);
        const imageFile = files.find(f => f.type.startsWith('image/'));
        if (imageFile) {
          event.preventDefault();
          insertImage(imageFile);
          return true;
        }

        return false;
      },
      handleDrop: (view, event, slice, moved) => {
        if (moved) return false;
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;

        const imageFile = Array.from(files).find(f => f.type.startsWith('image/'));
        if (!imageFile) return false;

        event.preventDefault();
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          const src = readerEvent.target.result;
          const nodeType = view.state.schema.nodes.imageResize || view.state.schema.nodes.image;
          if (!nodeType) return;
          const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
          if (coordinates) {
            const node = nodeType.create({ src });
            view.dispatch(view.state.tr.insert(coordinates.pos, node));
          }
        };
        reader.readAsDataURL(imageFile);
        return true;
      },
    },
    content: note ? note.content : '',
    autofocus: false,
    editable: note ? note.status === 'active' : true,
    onUpdate: ({ editor }) => {
      pendingHtmlRef.current = editor.getHTML();
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = setTimeout(() => {
        if (onContentChangeRef.current && pendingHtmlRef.current !== null) {
          onContentChangeRef.current(pendingHtmlRef.current);
          pendingHtmlRef.current = null;
        }
      }, 500);

      // Fix: after Ctrl+A + Delete, ProseMirror keeps an AllSelection on the
      // empty doc (blue highlight, can't type/enter). Simulate typing a char
      // then deleting it to force ProseMirror to fully reset its state.
      if (editor.isEmpty) {
        const { from, to } = editor.state.selection;
        if (from !== to || from === 0) {
          requestAnimationFrame(() => {
            editor.chain().focus().insertContent(' ').run();
            editor.chain().deleteRange({ from: 1, to: 2 }).setTextSelection(1).run();
          });
        }
      }
    },
    onSelectionUpdate: ({ editor }) => {
      if (note) {
        savedCursorPositions.set(note.id, {
          from: editor.state.selection.from,
          to: editor.state.selection.to
        });
      }
    },
  });

  // Toggle editable when note status changes (e.g. trash/archive)
  useEffect(() => {
    if (editor && note) {
      const shouldBeEditable = note.status === 'active';
      if (editor.isEditable !== shouldBeEditable) {
        editor.setEditable(shouldBeEditable);
      }
    }
  }, [editor, note?.status]);

  // Update placeholder translation dynamically
  useEffect(() => {
    tRef.current = t;
    if (editor) {
      // Force ProseMirror to redraw decorations (like the placeholder)
      editor.view.dispatch(editor.state.tr.setMeta('languageChange', true));
    }
  }, [t, editor]);

  // Spoiler click handler
  useEffect(() => {
    const handleSpoilerClick = (e) => {
      if (e.target.classList.contains('spoiler-text')) {
        e.target.classList.toggle('revealed');
      }
    };

    document.addEventListener('click', handleSpoilerClick);
    return () => document.removeEventListener('click', handleSpoilerClick);
  }, []);

  // Mengirim instance editor ke komponen parent (App.jsx) agar bisa digunakan oleh Toolbar
  useEffect(() => {
    if (editor) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Restore posisi cursor dan scroll ketika komponen mount / tab dibuka
  useEffect(() => {
    if (editor && note) {
      const timer = setTimeout(() => {
        // 1. Restore Cursor
        const savedPos = savedCursorPositions.get(note.id);
        if (savedPos) {
          try {
            editor.chain().focus().setTextSelection(savedPos).run();
          } catch (e) {
            editor.chain().focus('end').run();
          }
        } else {
          editor.chain().focus('end').run();
        }

        // 2. Restore Scroll
        const savedScroll = savedScrollPositions.get(note.id);
        if (savedScroll !== undefined && scrollRef.current) {
          scrollRef.current.scrollTop = savedScroll;
        }
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [editor, note?.id]);

  // Update konten editor ketika berubah dari luar (misal: file update)
  useEffect(() => {
    if (editor && note) {
      if (editor.getHTML() !== note.content) {
        editor.commands.setContent(note.content || '');
      }
    }
  }, [note?.content, editor]);

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-muted)] select-none">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <p>{t('selectOrCreateNote')}</p>
      </div>
    );
  }

  if (note.isLocked && !isSessionUnlocked) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-muted)] select-none">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--lock-color)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0110 0v4"></path>
        </svg>
        <p className="text-lg font-medium text-[var(--text-primary)]">{t('noteLocked')}</p>
        <p className="text-sm mt-2">{t('unlockViaToolbar')}</p>
      </div>
    );
  }

  const isReadOnly = note.status !== 'active';

  return (
    <>
      {isReadOnly && (
        <div className="px-4 py-2 bg-[var(--accent)]/10 border-b border-[var(--accent)]/20 text-[var(--accent)] text-xs font-medium flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {note.status === 'trash' ? t('trashNotice') : t('archiveNotice')}
        </div>
      )}

      {editor && (
        <BubbleMenu 
          editor={editor} 
          tippyOptions={{ duration: 100, placement: 'top', animation: 'scale' }} 
          shouldShow={({ editor, state }) => {
            const { selection } = state;
            const isImage = editor.isActive('image') || editor.isActive('imageResize');
            const isSlashCommand = editor.isActive('slashCommand');
            // Hanya tampil jika ada teks yang di-select, bukan gambar, dan bukan saat ngetik slash command
            return !selection.empty && !isImage && !isSlashCommand;
          }}
        >
          <div className="flex items-center gap-0.5 p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded-md shadow-xl backdrop-blur-md">
            <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title={`${t('bold')} (Ctrl+B)`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"></path><path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"></path></svg>
            </MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title={`${t('italic')} (Ctrl+I)`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>
            </MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title={`${t('underline')} (Ctrl+U)`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3"></path><line x1="4" y1="21" x2="20" y2="21"></line></svg>
            </MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title={`${t('strikethrough')} (Ctrl+Shift+X)`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><path d="M16 6C16 6 14.5 4 12 4C9.5 4 8 6 8 8C8 10 9.5 12 12 12C14.5 12 16 14 16 16C16 18 14.5 20 12 20C9.5 20 8 18 8 18"></path></svg>
            </MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')} title={`${t('highlight')} (Ctrl+Shift+H)`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3 7h7l-5 5 2 8-7-4-7 4 2-8-5-5h7z"></path></svg>
            </MenuButton>
            <MenuButton onClick={() => editor.chain().focus().toggleSpoiler().run()} isActive={editor.isActive('spoiler')} title={t('spoiler')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
            </MenuButton>
          </div>
        </BubbleMenu>
      )}

      {editor && (
        <BubbleMenu 
          editor={editor} 
          tippyOptions={{ duration: 100, placement: 'bottom', animation: 'scale' }} 
          shouldShow={({ editor, state }) => {
            const { selection } = state;
            return editor.isActive('table') && selection.empty;
          }}
        >
          <div className="flex items-center gap-1 p-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded-md shadow-xl">
            <select
              className="bg-transparent text-[var(--accent)] text-xs border-none outline-none cursor-pointer p-1.5 rounded hover:bg-[var(--bg-tertiary)] font-medium appearance-none"
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'add-row-before') editor.chain().focus().addRowBefore().run();
                if (val === 'add-row-after') editor.chain().focus().addRowAfter().run();
                if (val === 'delete-row') editor.chain().focus().deleteRow().run();
                if (val === 'add-col-before') editor.chain().focus().addColumnBefore().run();
                if (val === 'add-col-after') editor.chain().focus().addColumnAfter().run();
                if (val === 'delete-col') editor.chain().focus().deleteColumn().run();
                if (val === 'toggle-header-row') editor.chain().focus().toggleHeaderRow().run();
                if (val === 'toggle-header-col') editor.chain().focus().toggleHeaderColumn().run();
                if (val === 'delete-table') editor.chain().focus().deleteTable().run();
                e.target.value = '';
              }}
              value=""
              title={t('tableSettings')}
            >
              <option value="" disabled>{t('tableOptions')}</option>
              <option value="add-row-before">{t('addRowBefore')}</option>
              <option value="add-row-after">{t('addRowAfter')}</option>
              <option value="delete-row">{t('deleteRow')}</option>
              <option value="add-col-before">{t('addColBefore')}</option>
              <option value="add-col-after">{t('addColAfter')}</option>
              <option value="delete-col">{t('deleteCol')}</option>
              <option value="toggle-header-row">{t('toggleHeaderRow')}</option>
              <option value="toggle-header-col">{t('toggleHeaderCol')}</option>
              <option value="delete-table">{t('deleteTable')}</option>
            </select>
          </div>
        </BubbleMenu>
      )}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-y-auto custom-scrollbar px-12 py-10"
      >
        <div className="max-w-3xl mx-auto h-full">
          <EditorContent editor={editor} className="h-full" />
        </div>
      </div>

      {/* Floating Scroll Buttons */}
      <div className="absolute bottom-8 right-8 flex flex-col gap-2 opacity-30 hover:opacity-100 transition-opacity z-10">
        <button
          onClick={scrollToTop}
          className="p-1.5 bg-[var(--bg-tertiary)] hover:bg-[var(--accent)] text-[var(--text-primary)] hover:text-white rounded-full shadow-lg transition-colors focus:outline-none border border-[var(--border)]"
          title={t('scrollToTop')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </button>
        <button
          onClick={scrollToCursor}
          className="p-1.5 bg-[var(--bg-tertiary)] hover:bg-[var(--accent)] text-[var(--text-primary)] hover:text-white rounded-full shadow-lg transition-colors focus:outline-none border border-[var(--border)]"
          title={t('scrollToCursor')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19 12h3M2 12h3M12 2v3M12 19v3"></path>
          </svg>
        </button>
        <button
          onClick={scrollToBottom}
          className="p-1.5 bg-[var(--bg-tertiary)] hover:bg-[var(--accent)] text-[var(--text-primary)] hover:text-white rounded-full shadow-lg transition-colors focus:outline-none border border-[var(--border)]"
          title={t('scrollToBottom')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>
    </>
  );
};

export default Editor;
