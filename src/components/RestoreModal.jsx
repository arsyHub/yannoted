import React, { useState } from 'react';

const RestoreModal = ({ backupData, currentHash, onConfirm, onCancel }) => {
  const [folderName, setFolderName] = useState('Restored Backup');
  const [backupPassword, setBackupPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isPasswordRequired = backupData.masterPasswordHash && backupData.masterPasswordHash !== currentHash;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!folderName.trim()) {
      setErrorMsg('Nama folder tidak boleh kosong');
      return;
    }
    onConfirm({
      folderName: folderName.trim(),
      backupPassword: isPasswordRequired ? backupPassword : null
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-[var(--bg-secondary)] p-6 rounded-lg shadow-xl w-96 border border-[var(--border)]">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          Restore Data
        </h2>
        <p className="text-xs text-[var(--text-muted)] mb-4">
          Anda akan merestore {backupData.notes?.length || 0} catatan dari backup.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Nama Folder Restore
            </label>
            <p className="text-xs text-[var(--text-muted)] mb-2">
              Data akan direstore ke dalam folder baru agar tidak tercampur dengan catatan Anda saat ini.
            </p>
            <input 
              autoFocus
              type="text"
              value={folderName}
              onChange={(e) => { setFolderName(e.target.value); setErrorMsg(''); }}
              className="w-full bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border)] rounded px-3 py-2 outline-none focus:border-[var(--accent)] text-sm"
              required
            />
          </div>

          {isPasswordRequired && (
            <div className="p-3 bg-[var(--bg-tertiary)] border border-orange-500/30 rounded-md">
              <label className="block text-sm font-medium text-orange-500 mb-1">
                Password Backup Berbeda
              </label>
              <p className="text-xs text-[var(--text-muted)] mb-2">
                File backup ini dilindungi oleh Master Password lama. Masukkan password tersebut untuk membuka enkripsinya.
              </p>
              <input 
                type="password"
                value={backupPassword}
                onChange={(e) => { setBackupPassword(e.target.value); setErrorMsg(''); }}
                placeholder="Password file backup"
                className="w-full bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border)] rounded px-3 py-2 outline-none focus:border-[var(--accent)] text-sm"
                required
              />
            </div>
          )}

          {errorMsg && (
            <div className="text-[#ff5f56] text-xs font-medium text-center">
              {errorMsg}
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-[var(--border)]">
            <button 
              type="button" 
              onClick={onCancel}
              className="flex-1 py-2 text-[var(--text-primary)] bg-[var(--bg-tertiary)] hover:brightness-110 rounded transition-colors text-sm font-medium"
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="flex-1 py-2 bg-[var(--accent)] text-white hover:opacity-90 rounded transition-opacity text-sm font-medium"
            >
              Mulai Restore
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RestoreModal;
