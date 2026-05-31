import React, { useState } from 'react';

const PasswordModal = ({ onSubmit, hint, onCancel, title = "Masukkan Password", description, isAppLevel = false, isUsingDefault = false }) => {
  const [password, setPassword] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // onSubmit harus mengembalikan true/false (atau Promise yang resolve ke boolean)
    const success = await onSubmit(password);
    
    if (!success) {
      setIsShaking(true);
      setErrorMsg('Password salah!');
      setPassword('');
      setTimeout(() => setIsShaking(false), 500);
    }
    
    setIsProcessing(false);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      style={{ WebkitAppRegion: isAppLevel ? 'drag' : 'no-drag' }}
    >
      <div 
        className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-xl w-96 border border-[var(--border)] transition-all"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <h2 className="text-xl font-semibold mb-3 text-[var(--text-primary)] text-center">{title}</h2>
        
        {description && (
          <div className="bg-[#ff5f56]/10 text-[#ff5f56] p-3 rounded text-sm mb-4 text-center border border-[#ff5f56]/20 leading-relaxed">
            {description}
          </div>
        )}
        
        {isUsingDefault && (
          <div className="flex items-center justify-center text-xs text-[var(--accent)] mb-4 font-medium bg-[var(--accent)]/10 py-1.5 px-3 rounded-full w-fit mx-auto border border-[var(--accent)]/20">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            Menggunakan Password Default
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className={`transition-transform ${isShaking ? 'translate-x-[-10px] animate-shake' : ''}`}>
            <input 
              type="password"
              autoFocus
              disabled={isProcessing}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMsg('');
              }}
              placeholder="Password..."
              className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border)] rounded px-3 py-2 mb-2 outline-none focus:border-[var(--accent)]"
            />
          </div>
          
          {errorMsg && (
            <div className="text-[#ff5f56] text-sm mb-3 text-center font-medium">
              {errorMsg}
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            {hint && (
              <button 
                type="button" 
                onClick={() => setShowHint(!showHint)}
                className="text-sm text-[var(--accent)] hover:underline outline-none"
              >
                Lupa password?
              </button>
            )}
            {!isAppLevel && onCancel && (
              <button 
                type="button" 
                onClick={onCancel}
                className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] outline-none ml-auto"
              >
                Batal
              </button>
            )}
          </div>

          {showHint && hint && (
            <div className="bg-[var(--bg-tertiary)] p-3 rounded text-sm text-[var(--text-muted)] mb-4 italic text-center border border-[var(--border)]">
              Hint: {hint}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isProcessing || !password}
            className="w-full bg-[var(--accent)] text-white font-medium py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isProcessing ? 'Memproses...' : 'Buka Kunci'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;
