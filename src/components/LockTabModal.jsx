import React, { useState } from 'react';

const LockTabModal = ({ onSave, onSaveDefault, onCancel, hasDefaultPassword }) => {
  const [useDefault, setUseDefault] = useState(hasDefaultPassword);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hint, setHint] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (useDefault && hasDefaultPassword) {
      onSaveDefault();
      return;
    }
    
    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok!');
      return;
    }
    
    if (password.length < 4) {
      setErrorMsg('Password minimal 4 karakter!');
      return;
    }

    onSave(password, hint, saveAsDefault);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-xl w-96 border border-[var(--border)]">
        <div className="flex items-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--lock-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0110 0v4"></path>
          </svg>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Kunci Catatan</h2>
        </div>
        
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Catatan ini akan dikunci. Anda memerlukan password untuk membukanya kembali di sesi yang sama.
        </p>

        <form onSubmit={handleSubmit}>
          {hasDefaultPassword && (
            <div className="mb-4 flex items-center">
              <input 
                type="checkbox" 
                id="useDefault"
                checked={useDefault} 
                onChange={(e) => setUseDefault(e.target.checked)} 
                className="mr-2 cursor-pointer"
              />
              <label htmlFor="useDefault" className="text-sm text-[var(--text-primary)] cursor-pointer">
                Gunakan password default
              </label>
            </div>
          )}

          {(!useDefault || !hasDefaultPassword) && (
            <>
              <div className="mb-3">
                <input 
                  type="password"
                  autoFocus
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                  placeholder="Password baru"
                  className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border)] rounded px-3 py-2 outline-none focus:border-[var(--accent)]"
                  required
                />
              </div>
              
              <div className="mb-3">
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrorMsg(''); }}
                  placeholder="Konfirmasi password"
                  className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border)] rounded px-3 py-2 outline-none focus:border-[var(--accent)]"
                  required
                />
              </div>

              <div className="mb-4">
                <input 
                  type="text"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  placeholder="Hint (opsional, jika lupa password)"
                  className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border)] rounded px-3 py-2 outline-none focus:border-[var(--accent)]"
                />
              </div>

              {!hasDefaultPassword && (
                <div className="mb-4 flex items-center">
                  <input 
                    type="checkbox" 
                    id="saveAsDefault"
                    checked={saveAsDefault} 
                    onChange={(e) => setSaveAsDefault(e.target.checked)} 
                    className="mr-2 cursor-pointer"
                  />
                  <label htmlFor="saveAsDefault" className="text-sm text-[var(--text-primary)] cursor-pointer">
                    Jadikan sebagai password default
                  </label>
                </div>
              )}
              
              {errorMsg && (
                <div className="text-[#ff5f56] text-sm mb-4 text-center font-medium">
                  {errorMsg}
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-2 mt-2">
            <button 
              type="button" 
              onClick={onCancel}
              className="px-4 py-2 rounded text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 rounded bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
            >
              Simpan & Kunci
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LockTabModal;
