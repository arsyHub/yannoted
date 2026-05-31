import React from 'react';

const ShortcutsModal = ({ onClose }) => {
  const shortcuts = [
    {
      category: "Editor Dasar",
      items: [
        { keys: ["Ctrl", "B"], desc: "Tebal (Bold)" },
        { keys: ["Ctrl", "I"], desc: "Miring (Italic)" },
        { keys: ["Ctrl", "U"], desc: "Garis Bawah (Underline)" },
        { keys: ["Ctrl", "Shift", "X"], desc: "Coret (Strikethrough)" },
      ]
    },
    {
      category: "Aplikasi",
      items: [
        { keys: ["Ctrl", "F"], desc: "Cari & Ganti (Find & Replace)" },
      ]
    },
    {
      category: "Markdown (Ketik otomatis)",
      items: [
        { keys: ["#", "Spasi"], desc: "Heading 1" },
        { keys: ["##", "Spasi"], desc: "Heading 2" },
        { keys: ["###", "Spasi"], desc: "Heading 3" },
        { keys: ["*", "Spasi"], desc: "Daftar Tak Berurutan (Bullet)" },
        { keys: ["1.", "Spasi"], desc: "Daftar Berurutan (Numbered)" },
        { keys: [">", "Spasi"], desc: "Kutipan (Blockquote)" },
        { keys: ["```", "Enter"], desc: "Blok Kode (Code Block)" },
        { keys: ["`", "teks", "`"], desc: "Kode Baris (Inline Code)" },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in px-4">
      <div 
        className="bg-[var(--bg-primary)] p-6 rounded-lg shadow-xl max-w-2xl w-full border border-[var(--border)] max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            Panduan Shortcut Keyboard
          </h2>
          <button 
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] p-1.5 rounded transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
          {shortcuts.map((group, idx) => (
            <div key={idx}>
              <h3 className="text-sm font-semibold text-[var(--accent)] uppercase tracking-wider mb-3 pb-1 border-b border-[var(--border)]">
                {group.category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {group.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex justify-between items-center bg-[var(--bg-secondary)] p-2.5 rounded border border-[var(--border)]">
                    <span className="text-sm text-[var(--text-primary)]">{item.desc}</span>
                    <div className="flex gap-1">
                      {item.keys.map((key, kIdx) => (
                        <React.Fragment key={kIdx}>
                          <kbd className="px-2 py-1 text-xs font-mono bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded border border-[var(--border)] shadow-sm">
                            {key}
                          </kbd>
                          {kIdx < item.keys.length - 1 && (
                            <span className="text-[var(--text-muted)] text-xs self-center">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-[var(--border)] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded hover:bg-opacity-90 transition-colors font-medium text-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsModal;
