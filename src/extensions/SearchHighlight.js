import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const searchHighlightKey = new PluginKey('searchHighlight');

export const SearchHighlight = Extension.create({
  name: 'searchHighlight',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: searchHighlightKey,
        state: {
          init() {
            return { searchTerm: '', currentIdx: -1, matches: [] };
          },
          apply(tr, prev) {
            const meta = tr.getMeta(searchHighlightKey);
            return meta !== undefined ? meta : prev;
          },
        },
        props: {
          decorations(state) {
            const { matches, currentIdx } = searchHighlightKey.getState(state);
            if (!matches || !matches.length) return DecorationSet.empty;

            const decorations = matches.map((match, idx) =>
              Decoration.inline(match.from, match.to, {
                class: idx === currentIdx
                  ? 'search-highlight-current'
                  : 'search-highlight',
              })
            );

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});
