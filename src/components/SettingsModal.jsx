import React, { useState } from 'react';
import PasswordModal from './PasswordModal';
import { useLanguage } from '../contexts/LanguageContext';

const SettingsModal = ({ 
  onClose, 
  hasMasterPassword, 
  masterPasswordHint,
  onSetMasterPassword, 
  onRemoveMasterPassword,
  onChangeMasterPassword 
}) => {
  const { language, changeLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('status'); // 'status', 'change', 'remove'
  
  // Set Password State (if not set)
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hint, setHint] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changeHint, setChangeHint] = useState('');

  // Remove confirmation via PasswordModal
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const handleSetPassword = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok!');
      return;
    }
    if (password.length < 4) {
      setErrorMsg('Password minimal 4 karakter!');
      return;
    }
    onSetMasterPassword(password, hint);
    setPassword('');
    setConfirmPassword('');
    setHint('');
    setErrorMsg('');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Konfirmasi password baru tidak cocok!');
      return;
    }
    if (newPassword.length < 4) {
      setErrorMsg('Password baru minimal 4 karakter!');
      return;
    }
    
    const success = await onChangeMasterPassword(currentPassword, newPassword, changeHint);
    if (!success) {
      setErrorMsg('Password saat ini salah!');
      return;
    }
    
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setChangeHint('');
    setErrorMsg('');
    setActiveTab('status');
  };

  const handleRemoveConfirm = async (pw) => {
    const success = await onRemoveMasterPassword(pw);
    if (success) {
      setShowRemoveConfirm(false);
      setActiveTab('status');
      return true;
    }
    return false;
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
            {t('settings')}
          </h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div className="mb-6 border-b border-[var(--border)] pb-4">
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">{t('language')}</h3>
          <select 
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="w-full bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border)] rounded px-3 py-1.5 outline-none focus:border-[var(--accent)] text-sm cursor-pointer"
          >
            <option value="id">Bahasa Indonesia</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2 border-b border-[var(--border)] pb-1">Master Password</h3>
          
          {hasMasterPassword ? (
            activeTab === 'status' ? (
              <div className="bg-[var(--bg-tertiary)] p-3 rounded border border-[var(--border)]">
                <div className="flex items-center text-green-500 mb-4 text-sm font-medium">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  Master Password Aktif
                </div>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => { setActiveTab('change'); setErrorMsg(''); }}
                    className="w-full py-2 bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 rounded transition-colors text-sm font-medium"
                  >
                    Ubah Master Password
                  </button>
                  <button 
                    onClick={() => setShowRemoveConfirm(true)}
                    className="w-full py-2 bg-[#ff5f56]/10 text-[#ff5f56] hover:bg-[#ff5f56]/20 rounded transition-colors text-sm font-medium"
                  >
                    Hapus Master Password
                  </button>
                </div>
              </div>
            ) : activeTab === 'change' ? (
              <form onSubmit={handleChangePassword} className="bg-[var(--bg-tertiary)] p-3 rounded border border-[var(--border)]">
                <p className="text-xs text-[var(--text-muted)] mb-3 leading-relaxed">
                  Mengubah Master Password akan memperbarui semua catatan yang terkunci.
                </p>
                <input 
                  type="password"
                  value={currentPassword}
                  onChange={(e) => { setCurrentPassword(e.target.value); setErrorMsg(''); }}
                  placeholder="Password saat ini"
                  className="w-full mb-2 bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border)] rounded px-3 py-1.5 outline-none focus:border-[var(--accent)] text-sm"
                  required
                />
                <div className="h-[1px] bg-[var(--border)] my-3"></div>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setErrorMsg(''); }}
                  placeholder="Password baru"
                  className="w-full mb-2 bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border)] rounded px-3 py-1.5 outline-none focus:border-[var(--accent)] text-sm"
                  required
                />
                <input 
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => { setConfirmNewPassword(e.target.value); setErrorMsg(''); }}
                  placeholder="Konfirmasi password baru"
                  className="w-full mb-2 bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border)] rounded px-3 py-1.5 outline-none focus:border-[var(--accent)] text-sm"
                  required
                />
                <input 
                  type="text"
                  value={changeHint}
                  onChange={(e) => setChangeHint(e.target.value)}
                  placeholder="Hint baru (opsional)"
                  className="w-full mb-3 bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border)] rounded px-3 py-1.5 outline-none focus:border-[var(--accent)] text-sm"
                />
                {errorMsg && (
                  <div className="text-[#ff5f56] text-xs mb-3 font-medium text-center">
                    {errorMsg}
                  </div>
                )}
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setActiveTab('status')}
                    className="flex-1 py-2 text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded transition-colors text-sm font-medium"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-2 bg-[var(--accent)] text-white hover:opacity-90 rounded transition-opacity text-sm font-medium"
                  >
                    Ubah
                  </button>
                </div>
              </form>
            ) : null
          ) : (
            <form onSubmit={handleSetPassword} className="bg-[var(--bg-tertiary)] p-3 rounded border border-[var(--border)]">
              <p className="text-xs text-[var(--text-muted)] mb-3 leading-relaxed">
                Buat satu Master Password untuk mengunci catatan Anda. 
              </p>
              
              <input 
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                placeholder="Master Password baru"
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
                <div className="text-[#ff5f56] text-xs mb-3 font-medium text-center">
                  {errorMsg}
                </div>
              )}
              
              <button 
                type="submit" 
                className="w-full py-2 bg-[var(--accent)] text-white hover:opacity-90 rounded transition-opacity text-sm font-medium"
              >
                Buat Master Password
              </button>
            </form>
          )}
        </div>
      </div>

      {showRemoveConfirm && (
        <PasswordModal
          onSubmit={handleRemoveConfirm}
          onCancel={() => setShowRemoveConfirm(false)}
          title="Masukkan Password"
          description="Menghapus Master Password akan otomatis membuka semua kunci pada catatan yang terkunci."
          hint={masterPasswordHint}
        />
      )}
    </div>
  );
};

export default SettingsModal;
