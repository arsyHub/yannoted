import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const selectionMatchHighlightKey = new PluginKey('selectionMatchHighlight');

export const SelectionMatchHighlight = Extension.create({
  name: 'selectionMatchHighlight',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: selectionMatchHighlightKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, oldState) {
            const { selection, doc } = tr;
            
            if (!tr.docChanged && !tr.selectionSet) {
              return oldState.map(tr.mapping, doc);
            }

            const { empty, from, to } = selection;
            
            if (empty || to - from > 100) {
              return DecorationSet.empty;
            }

            const selectedText = doc.textBetween(from, to, ' ');
            
            // Only trigger if selection is alphanumeric-ish or at least 2 chars of non-whitespace
            const trimmed = selectedText.trim();
            if (trimmed.length < 2 || selectedText.includes('\n')) {
              return DecorationSet.empty;
            }

            const decorations = [];
            
            doc.descendants((node, pos) => {
              if (node.isText) {
                const text = node.text;
                let startIndex = 0;
                let index;
                
                // Case-sensitive exact match for simplicity (matches typical code editor behavior for simple selection)
                while ((index = text.indexOf(selectedText, startIndex)) !== -1) {
                  const matchFrom = pos + index;
                  const matchTo = matchFrom + selectedText.length;
                  
                  // Don't highlight the actively selected instance itself
                  if (matchFrom !== from || matchTo !== to) {
                    decorations.push(
                      Decoration.inline(matchFrom, matchTo, {
                        class: 'selection-match-highlight',
                      })
                    );
                  }
                  
                  startIndex = index + selectedText.length;
                }
              }
            });

            return DecorationSet.create(doc, decorations);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
