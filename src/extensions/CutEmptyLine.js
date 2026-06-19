import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const CutEmptyLine = Extension.create({
  name: 'cutEmptyLine',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('cutEmptyLine'),
        props: {
          handleDOMEvents: {
            cut: (view, event) => {
              const { state, dispatch } = view;
              const { selection } = state;

              // Hanya berjalan jika tidak ada teks yang di-block
              if (!selection.empty) {
                return false;
              }

              const { $from } = selection;
              let targetDepth = $from.depth;
              
              if (targetDepth === 0) return false;

              // Jika berada di dalam list item, kita ingin meng-cut list item tersebut (beserta bullet-nya)
              if (targetDepth > 1) {
                const parentNode = $from.node(targetDepth - 1);
                if (parentNode.type.name === 'listItem' || parentNode.type.name === 'taskItem') {
                  targetDepth = targetDepth - 1;
                }
              }

              const node = $from.node(targetDepth);
              const pos = $from.before(targetDepth);
              
              const textToCopy = node.textContent || '';
              
              // Masukkan ke clipboard
              if (event.clipboardData) {
                event.clipboardData.setData('text/plain', textToCopy + '\n');
              }
              
              const tr = state.tr;
              
              // Jika ini satu-satunya block di dokumen, jangan hapus block-nya, tapi kosongkan isinya
              if (state.doc.childCount === 1 && state.doc.firstChild === node) {
                  tr.delete(pos + 1, pos + node.nodeSize - 1);
              } else {
                  // Jika ada list yang kosong akibat cut, kita bisa mendeletenya, tapi delete pos to pos+nodeSize sudah cukup
                  tr.delete(pos, pos + node.nodeSize);
              }
              
              dispatch(tr);
              event.preventDefault();
              return true;
            }
          }
        }
      })
    ];
  }
});
