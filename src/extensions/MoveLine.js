import { Extension } from '@tiptap/core';

export const MoveLine = Extension.create({
  name: 'moveLine',

  addKeyboardShortcuts() {
    return {
      'Alt-ArrowUp': () => this.editor.commands.moveBlockUp(),
      'Alt-ArrowDown': () => this.editor.commands.moveBlockDown(),
    };
  },

  addCommands() {
    return {
      moveBlockUp: () => ({ state, dispatch }) => {
        const { selection } = state;
        const { $from, $to } = selection;
        const range = $from.blockRange($to);

        if (!range || range.startIndex === 0) {
          return false;
        }

        const parent = range.parent;
        const nodeBefore = parent.child(range.startIndex - 1);

        if (dispatch) {
          const tr = state.tr;
          const start = range.start;
          const end = range.end;
          const slice = tr.doc.slice(start, end);
          const insertPos = start - nodeBefore.nodeSize;
          
          tr.delete(start, end);
          tr.insert(insertPos, slice.content);
          
          const shift = -nodeBefore.nodeSize;
          try {
              const newSelection = selection.constructor.create(
                  tr.doc,
                  selection.from + shift,
                  selection.to + shift
              );
              tr.setSelection(newSelection);
          } catch(e) {
              // fallback
          }
          tr.scrollIntoView();
          dispatch(tr);
        }
        return true;
      },
      
      moveBlockDown: () => ({ state, dispatch }) => {
        const { selection } = state;
        const { $from, $to } = selection;
        const range = $from.blockRange($to);

        if (!range) {
          return false;
        }

        const parent = range.parent;
        if (range.endIndex >= parent.childCount) {
          return false;
        }

        const nodeAfter = parent.child(range.endIndex);

        if (dispatch) {
          const tr = state.tr;
          const start = range.start;
          const end = range.end;
          const slice = tr.doc.slice(start, end);
          const insertPos = end + nodeAfter.nodeSize;
          
          tr.insert(insertPos, slice.content);
          tr.delete(start, end);
          
          const shift = nodeAfter.nodeSize;
          try {
              const newSelection = selection.constructor.create(
                  tr.doc,
                  selection.from + shift,
                  selection.to + shift
              );
              tr.setSelection(newSelection);
          } catch(e) {
              // fallback
          }
          tr.scrollIntoView();
          dispatch(tr);
        }
        return true;
      },
    };
  },
});
