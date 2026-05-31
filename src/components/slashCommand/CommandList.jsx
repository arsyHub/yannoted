import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

const CommandList = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }
      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }
      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  if (!props.items.length) {
    return null;
  }

  return (
    <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden flex flex-col py-1 w-64 max-h-80 overflow-y-auto custom-scrollbar z-50">
      <div className="px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
        Format Dasar
      </div>
      {props.items.map((item, index) => {
        const Icon = item.icon;
        return (
          <button
            className={`flex items-center gap-3 px-3 py-2 text-left w-full transition-colors ${
              index === selectedIndex ? 'bg-[var(--bg-tertiary)] text-[var(--accent)]' : 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
            }`}
            key={index}
            onClick={() => selectItem(index)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className={`p-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] shadow-sm ${index === selectedIndex ? 'text-[var(--accent)] border-[var(--accent)]/30' : 'text-[var(--text-primary)]'}`}>
              <Icon size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{item.title}</span>
              <span className="text-xs text-[var(--text-muted)]">{item.description}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
});

CommandList.displayName = 'CommandList';

export default CommandList;
