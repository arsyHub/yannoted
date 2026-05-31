import React from 'react';

const TitleBar = () => {
  const api = window.electronAPI;

  const handleClose = () => {
    if (api) api.close();
  };

  const handleMinimize = () => {
    if (api) api.minimize();
  };

  const handleMaximize = () => {
    if (api) api.maximize();
  };

  return (
    <div
      className="flex items-center justify-between px-4 h-10 select-none text-sm font-medium transition-colors duration-200"
      style={{
        WebkitAppRegion: 'drag',
        backgroundColor: 'var(--bg-tertiary)',
        color: 'var(--text-primary)',
        borderBottom: '1px solid var(--border)'
      }}
    >
      {/* Left Spacer (to keep title centered) */}
      <div className="w-16"></div>

      {/* App Title */}
      <div className="flex-1 text-center truncate">
        v1.0.0
      </div>

      {/* Window Controls - kanan */}
      <div className="flex gap-2 w-16 justify-end" style={{ WebkitAppRegion: 'no-drag' }}>
        <button
          onClick={handleMinimize}
          className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ffbd2e]/80 transition-colors border border-[#dea123]"
          title="Minimize"
          aria-label="Minimize"
        />
        <button
          onClick={handleMaximize}
          className="w-3 h-3 rounded-full bg-[#27c93f] hover:bg-[#27c93f]/80 transition-colors border border-[#1aab29]"
          title="Maximize"
          aria-label="Maximize"
        />
        <button
          onClick={handleClose}
          className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/80 transition-colors border border-[#e0443e]"
          title="Close"
          aria-label="Close"
        />
      </div>
    </div>
  );
};

export default TitleBar;
