import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

const brackets = {
  '{': '}',
  '[': ']',
  '(': ')',
  '}': '{',
  ']': '[',
  ')': '(',
};

const openBrackets = ['{', '[', '('];
const closeBrackets = ['}', ']', ')'];

function findMatchingBracket(text, startPos, char) {
  const isForward = openBrackets.includes(char);
  const target = brackets[char];
  let depth = 0;

  if (isForward) {
    for (let i = startPos + 1; i < text.length; i++) {
      if (text[i] === char) depth++;
      if (text[i] === target) {
        if (depth === 0) return i;
        depth--;
      }
    }
  } else {
    for (let i = startPos - 1; i >= 0; i--) {
      if (text[i] === char) depth++;
      if (text[i] === target) {
        if (depth === 0) return i;
        depth--;
      }
    }
  }
  return -1;
}

export const BracketMatch = Extension.create({
  name: 'bracketMatch',

  addProseMirrorPlugins() {
    const pluginKey = new PluginKey('bracketMatch');

    return [
      new Plugin({
        key: pluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, oldState) {
            // Kita ingin memproses meskipun doc tidak berubah (hanya selection yang berubah)
            const { selection } = tr;
            
            if (!selection.empty) return DecorationSet.empty;

            const { $from } = selection;
            const node = $from.parent;

            // Hanya aktifkan bracket match di dalam code block
            if (node.type.name !== 'codeBlock') return DecorationSet.empty;

            const text = node.textContent;
            const relPos = $from.parentOffset;

            // Cek karakter sebelum dan sesudah kursor
            const charBefore = relPos > 0 ? text[relPos - 1] : null;
            const charAfter = relPos < text.length ? text[relPos] : null;

            let matchIndex = -1;
            let bracketIndex = -1;

            if (charBefore && brackets[charBefore]) {
              matchIndex = findMatchingBracket(text, relPos - 1, charBefore);
              if (matchIndex !== -1) bracketIndex = relPos - 1;
            }

            if (matchIndex === -1 && charAfter && brackets[charAfter]) {
              matchIndex = findMatchingBracket(text, relPos, charAfter);
              if (matchIndex !== -1) bracketIndex = relPos;
            }

            if (matchIndex !== -1) {
              const startAbs = $from.start();
              const decos = [
                Decoration.inline(startAbs + bracketIndex, startAbs + bracketIndex + 1, { class: 'bracket-highlight' }),
                Decoration.inline(startAbs + matchIndex, startAbs + matchIndex + 1, { class: 'bracket-highlight' }),
              ];
              return DecorationSet.create(tr.doc, decos);
            }

            return DecorationSet.empty;
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
