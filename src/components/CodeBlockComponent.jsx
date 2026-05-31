import React, { useState } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { Copy, Check } from 'lucide-react';

const CodeBlockComponent = ({ node, updateAttributes, extension }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    navigator.clipboard.writeText(node.textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = node.textContent.split('\n').length || 1;
  const lines = Array.from({ length: lineCount });

  const highlightedLines = node.attrs.highlightedLines || [];

  const toggleHighlight = (lineIndex) => {
    const isHighlighted = highlightedLines.includes(lineIndex);
    const newHighlights = isHighlighted
      ? highlightedLines.filter((i) => i !== lineIndex)
      : [...highlightedLines, lineIndex];

    updateAttributes({ highlightedLines: newHighlights });
  };

  return (
    <NodeViewWrapper className="code-block-wrapper relative group flex overflow-hidden">
      {/* Tombol Copy & Language Selector (Tersembunyi secara default, muncul saat dihover) */}
      <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-30">
        <button
          type="button"
          onClick={handleCopy}
          contentEditable={false}
          className="bg-[#1e1e2e] text-[#cdd6f4] hover:text-white px-2 py-1 rounded text-xs border border-[rgba(255,255,255,0.2)] hover:bg-[#313244] flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
          title="Salin Kode"
        >
          {copied ? (
            <>
              <Check size={14} className="text-[#a6e3a1]" strokeWidth={3} />
              <span className="text-[#a6e3a1] font-medium">Disalin</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span className="font-medium">Salin</span>
            </>
          )}
        </button>
      </div>

      {/* Kolom Nomor Baris */}
      <div
        contentEditable={false}
        className="line-numbers-col flex flex-col text-right select-none py-[1rem] px-[0.75rem] min-w-[2.5rem] border-r opacity-50 text-[0.875em] leading-[1.6] z-10"
        style={{ borderColor: 'inherit' }}
      >
        {lines.map((_, i) => (
          <span
            key={i}
            className={`inline-block cursor-pointer hover:text-white transition-colors ${highlightedLines.includes(i) ? 'text-[#cba6f7] font-bold opacity-100' : ''}`}
            onClick={() => toggleHighlight(i)}
            title="Sorot baris ini"
          >
            {i + 1}
          </span>
        ))}
      </div>

      {/* Konten Kode Asli TipTap */}
      <div className="flex-1 relative">
        {/* Latar Belakang Highlight */}
        <div className="absolute inset-0 pointer-events-none flex flex-col py-[1rem] text-[0.875em]" style={{ zIndex: 0 }}>
          {lines.map((_, i) => (
            <div
              key={i}
              className={`w-full h-[1.6em] transition-colors ${highlightedLines.includes(i) ? 'bg-[#cba6f7]/20 border-l-[3px] border-l-[#cba6f7]' : 'border-l-[3px] border-l-transparent'}`}
            />
          ))}
        </div>

        <pre className="!m-0 !border-none !rounded-none relative z-10 !bg-transparent h-full">
          <NodeViewContent as="code" />
        </pre>
      </div>
    </NodeViewWrapper>
  );
};

export default CodeBlockComponent;
