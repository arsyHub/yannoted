import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';
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
import { SearchHighlight } from '../extensions/SearchHighlight';
import { SelectionMatchHighlight } from '../extensions/SelectionMatchHighlight';
import { BracketMatch } from '../extensions/BracketMatch';
import SlashCommand from '../extensions/SlashCommand';

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

const Editor = ({ note, onContentChange, onEditorReady, isSessionUnlocked }) => {
  const scrollRef = useRef(null);

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
      Placeholder.configure({ placeholder: 'Mulai mengetik catatan Anda di sini...' }),
      ImageResize.configure({
        inline: true,
        allowBase64: true,
      }),
      Spoiler,
      SearchHighlight,
      SelectionMatchHighlight,
      BracketMatch,
      SlashCommand,
    ],
    editorProps: {
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        for (const item of items) {
          if (item.type.indexOf('image') === 0) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = (e) => {
                const schema = view.state.schema;
                const node = schema.nodes.image.create({ src: e.target.result });
                const transaction = view.state.tr.replaceSelectionWith(node);
                view.dispatch(transaction);
              };
              reader.readAsDataURL(file);
            }
            return true;
          }
        }
        return false;
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.indexOf('image') === 0) {
            event.preventDefault();
            const reader = new FileReader();
            reader.onload = (e) => {
              const schema = view.state.schema;
              const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
              if (coordinates) {
                const node = schema.nodes.image.create({ src: e.target.result });
                const transaction = view.state.tr.insert(coordinates.pos, node);
                view.dispatch(transaction);
              }
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
    },
    content: note ? note.content : '',
    autofocus: false,
    editable: note ? note.status === 'active' : true,
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML());
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
        <p>Pilih atau buat catatan baru</p>
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
        <p className="text-lg font-medium text-[var(--text-primary)]">Catatan ini terkunci</p>
        <p className="text-sm mt-2">Buka kunci melalui ikon gembok di toolbar</p>
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
          {note.status === 'trash' ? 'Catatan ini ada di Sampah — kembalikan untuk mengedit.' : 'Catatan ini diarsipkan — kembalikan untuk mengedit.'}
        </div>
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
          title="Scroll ke Atas"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </button>
        <button
          onClick={scrollToBottom}
          className="p-1.5 bg-[var(--bg-tertiary)] hover:bg-[var(--accent)] text-[var(--text-primary)] hover:text-white rounded-full shadow-lg transition-colors focus:outline-none border border-[var(--border)]"
          title="Scroll ke Bawah"
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
