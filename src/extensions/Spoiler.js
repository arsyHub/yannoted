import { Mark, mergeAttributes } from '@tiptap/core';

export const Spoiler = Mark.create({
  name: 'spoiler',
  inclusive: false,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'spoiler-text',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span.spoiler-text',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setSpoiler: () => ({ commands }) => {
        return commands.setMark(this.name);
      },
      toggleSpoiler: () => ({ commands }) => {
        return commands.toggleMark(this.name);
      },
      unsetSpoiler: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },
});
