import { Extension } from '@tiptap/core';

export const CtrlEnter = Extension.create({
  name: 'ctrlEnter',

  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => {
        const { state } = this.editor;
        const { $from } = state.selection;
        const endPos = $from.end();
        
        return this.editor.chain().setTextSelection(endPos).splitBlock().run();
      },
    };
  },
});
