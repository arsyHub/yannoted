import React, { useState } from 'react';

const SettingsModal = ({ onClose, hasDefaultPassword, onSetDefault, onRemoveDefault }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hint, setHint] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok!');
      return;
    }
    if (password.length < 4) {
      setErrorMsg('Password minimal 4 karakter!');
      return;
    }
    onSetDefault(password, hint);
    setPassword('');
    setConfirmPassword('');
    setHint('');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-xl w-96 border border-[var(--border)]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] flex items-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"></path>
            </svg>
            Pengaturan
          </h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div className="mb-4">
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2 border-b border-[var(--border)] pb-1">Password Default Catatan</h3>
          
          {hasDefaultPassword ? (
            <div className="bg-[var(--bg-tertiary)] p-3 rounded border border-[var(--border)]">
              <div className="flex items-center text-green-500 mb-3 text-sm font-medium">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                Password default aktif
              </div>
              <button 
                onClick={onRemoveDefault}
                className="w-full py-2 bg-[#ff5f56]/10 text-[#ff5f56] hover:bg-[#ff5f56]/20 rounded transition-colors text-sm font-medium"
              >
                Hapus Password Default
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="bg-[var(--bg-tertiary)] p-3 rounded border border-[var(--border)]">
              <p className="text-xs text-[var(--text-muted)] mb-3 leading-relaxed">
                Atur password default agar Anda tidak perlu mengetik ulang saat mengunci catatan baru.
              </p>
              
              <input 
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                placeholder="Password default"
                className="w-full mb-2 bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border)] rounded px-3 py-1.5 outline-none focus:border-[var(--accent)] text-sm"
                required
              />
              
              <input 
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setErrorMsg(''); }}
                placeholder="Konfirmasi password"
                className="w-full mb-2 bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border)] rounded px-3 py-1.5 outline-none focus:border-[var(--accent)] text-sm"
                required
              />

              <input 
                type="text"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="Hint (opsional)"
                className="w-full mb-3 bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border)] rounded px-3 py-1.5 outline-none focus:border-[var(--accent)] text-sm"
              />
              
              {errorMsg && (
                <div className="text-[#ff5f56] text-xs mb-3 font-medium">
                  {errorMsg}
                </div>
              )}
              
              <button 
                type="submit" 
                className="w-full py-2 bg-[var(--accent)] text-white hover:opacity-90 rounded transition-opacity text-sm font-medium"
              >
                Simpan Password Default
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
