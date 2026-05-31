import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { Type, Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare, Code, Highlighter } from 'lucide-react';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import CommandList from '../components/slashCommand/CommandList';

export default Extension.create({
  name: 'slashcommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
        items: ({ query }) => {
          return getSuggestionItems({ query });
        },
        render: () => {
          let component;
          let popup;

          return {
            onStart: props => {
              component = new ReactRenderer(CommandList, {
                props,
                editor: props.editor,
              });

              if (!props.clientRect) {
                return;
              }

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              });
            },

            onUpdate(props) {
              component.updateProps(props);

              if (!props.clientRect) {
                return;
              }

              popup[0].setProps({
                getReferenceClientRect: props.clientRect,
              });
            },

            onKeyDown(props) {
              if (props.event.key === 'Escape') {
                popup[0].hide();
                return true;
              }

              return component.ref?.onKeyDown(props);
            },

            onExit() {
              popup[0].destroy();
              component.destroy();
            },
          };
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export const getSuggestionItems = ({ query }) => {
  return [
    {
      title: 'Teks Biasa',
      description: 'Mulai mengetik dengan teks biasa.',
      icon: Type,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('paragraph').run();
      },
    },
    {
      title: 'Heading 1',
      description: 'Judul bagian besar.',
      icon: Heading1,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
      },
    },
    {
      title: 'Heading 2',
      description: 'Judul bagian sedang.',
      icon: Heading2,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
      },
    },
    {
      title: 'Heading 3',
      description: 'Judul bagian kecil.',
      icon: Heading3,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
      },
    },
    {
      title: 'Bullet List',
      description: 'Buat daftar berpoin.',
      icon: List,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: 'Numbered List',
      description: 'Buat daftar bernomor.',
      icon: ListOrdered,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: 'Checklist',
      description: 'Lacak tugas dengan kotak centang.',
      icon: CheckSquare,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run();
      },
    },
    {
      title: 'Code Block',
      description: 'Tulis potongan kode pemrograman.',
      icon: Code,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      },
    },
    {
      title: 'Sorotan (Highlight)',
      description: 'Beri warna sorotan pada teks.',
      icon: Highlighter,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleHighlight().run();
      },
    }
  ].filter(item => item.title.toLowerCase().startsWith(query.toLowerCase()));
};
