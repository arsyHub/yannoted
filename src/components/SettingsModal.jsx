import React, { useState } from 'react';
import PasswordModal from './PasswordModal';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Settings, X, Globe, Key, ShieldCheck, Pencil, Trash2, 
  Cloud, Database, Upload, Download, Lock, ChevronDown, ChevronRight
} from 'lucide-react';

const SettingsModal = ({ 
  onClose, 
  hasMasterPassword, 
  masterPasswordHint,
  onSetMasterPassword, 
  onRemoveMasterPassword,
  onChangeMasterPassword,
  onExportBackup,
  onInitRestore
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

  // Common UI classes
  const cardClass = "bg-[#16181D] border border-white/5 rounded-xl p-4 mb-3";
  const iconBoxClass = "w-8 h-8 rounded-xl flex items-center justify-center shrink-0";
  const titleClass = "text-sm font-semibold text-white/90";
  const descClass = "text-[11px] text-gray-400 mt-0.5";
  const inputClass = "w-full bg-[#0F1115] text-white/90 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-[var(--accent)] text-xs mb-2 transition-colors placeholder:text-gray-600";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#0F1115] rounded-2xl shadow-2xl w-full max-w-lg border border-white/5 flex flex-col my-auto max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-start p-5 pb-2 shrink-0">
          <div className="flex gap-3 items-center">
            <div className={`w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]`}>
              <Settings size={20} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Pengaturan</h2>
              <p className="text-xs text-gray-400 mt-0.5">Kelola preferensi akun dan data Anda</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 pt-4 overflow-y-auto custom-scrollbar flex-1">
          
          {/* Language Card */}
          <div className={cardClass}>
            <div className="flex gap-3 mb-3">
              <div className={`${iconBoxClass} bg-[var(--accent)]/10 text-[var(--accent)]`}>
                <Globe size={16} />
              </div>
              <div>
                <h3 className={titleClass}>Bahasa (Language)</h3>
                <p className={descClass}>Pilih bahasa yang digunakan di aplikasi.</p>
              </div>
            </div>
            <div className="relative">
              <select 
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="w-full bg-[#1A1C23] text-white border border-white/5 rounded-xl px-3 py-2.5 outline-none focus:border-[var(--accent)] text-xs cursor-pointer appearance-none transition-colors hover:bg-[#1E2128]"
              >
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

          {/* Master Password Card */}
          <div className={cardClass}>
            <div className="flex gap-3 mb-3">
              <div className={`${iconBoxClass} bg-[var(--accent)]/10 text-[var(--accent)]`}>
                <Key size={16} />
              </div>
              <div>
                <h3 className={titleClass}>Master Password</h3>
                <p className={descClass}>Kelola master password akun Anda.</p>
              </div>
            </div>

            {hasMasterPassword ? (
              activeTab === 'status' ? (
                <div className="flex flex-col gap-1">
                  <div className="bg-[#10b981]/5 border border-[#10b981]/20 rounded-xl p-3 flex justify-between items-center mb-1">
                    <div className="flex gap-3 items-center">
                      <div className={`${iconBoxClass} bg-[#10b981]/10 text-[#10b981]`}>
                        <ShieldCheck size={16} />
                      </div>
                      <div>
                        <div className="text-[#10b981] font-medium text-[13px]">Master Password Aktif</div>
                        <div className="text-gray-400 text-[11px] mt-0.5">Akun Anda terlindungi dengan baik.</div>
                      </div>
                    </div>
                    <div className="px-2.5 py-0.5 rounded-full bg-[#10b981]/10 text-[#10b981] text-[10px] font-semibold border border-[#10b981]/20">
                      Aktif
                    </div>
                  </div>

                  <button 
                    onClick={() => { setActiveTab('change'); setErrorMsg(''); }}
                    className="p-3 flex justify-between items-center cursor-pointer hover:bg-white/5 rounded-xl transition-colors w-full text-left group"
                  >
                    <div className="flex gap-3 items-center">
                      <div className={`${iconBoxClass} bg-[var(--accent)]/10 text-[var(--accent)]`}>
                        <Pencil size={16} />
                      </div>
                      <div>
                        <div className="text-[var(--accent)] font-medium text-[13px]">Ubah Master Password</div>
                        <div className="text-gray-400 text-[11px] mt-0.5">Perbarui master password secara berkala.</div>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-gray-500 group-hover:text-gray-300 transition-colors" />
                  </button>

                  <div className="h-[1px] bg-white/5 w-full my-1"></div>

                  <button 
                    onClick={() => setShowRemoveConfirm(true)}
                    className="p-3 flex justify-between items-center cursor-pointer hover:bg-white/5 rounded-xl transition-colors w-full text-left group"
                  >
                    <div className="flex gap-3 items-center">
                      <div className={`${iconBoxClass} bg-[#ef4444]/10 text-[#ef4444]`}>
                        <Trash2 size={16} />
                      </div>
                      <div>
                        <div className="text-[#ef4444] font-medium text-[13px]">Hapus Master Password</div>
                        <div className="text-gray-400 text-[11px] mt-0.5">Tindakan ini tidak dapat dibatalkan.</div>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-gray-500 group-hover:text-gray-300 transition-colors" />
                  </button>
                </div>
              ) : activeTab === 'change' ? (
                <form onSubmit={handleChangePassword} className="bg-[#1A1C23] p-3 rounded-xl border border-white/5">
                  <p className="text-[11px] text-gray-400 mb-3">
                    Mengubah Master Password akan memperbarui semua catatan yang terkunci.
                  </p>
                  <input 
                    type="password"
                    value={currentPassword}
                    onChange={(e) => { setCurrentPassword(e.target.value); setErrorMsg(''); }}
                    placeholder="Password saat ini"
                    className={inputClass}
                    required
                  />
                  <input 
                    type="password"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setErrorMsg(''); }}
                    placeholder="Password baru"
                    className={inputClass}
                    required
                  />
                  <input 
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => { setConfirmNewPassword(e.target.value); setErrorMsg(''); }}
                    placeholder="Konfirmasi password baru"
                    className={inputClass}
                    required
                  />
                  <input 
                    type="text"
                    value={changeHint}
                    onChange={(e) => setChangeHint(e.target.value)}
                    placeholder="Hint baru (opsional)"
                    className={inputClass}
                  />
                  {errorMsg && (
                    <div className="text-[#ef4444] text-[11px] mb-2 font-medium text-center">
                      {errorMsg}
                    </div>
                  )}
                  <div className="flex gap-2 mt-1">
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('status')}
                      className="flex-1 py-2 text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-xs font-semibold"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 py-2 bg-[var(--accent)] text-white hover:opacity-90 rounded-lg transition-opacity text-xs font-semibold shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                    >
                      Simpan
                    </button>
                  </div>
                </form>
              ) : null
            ) : (
              <form onSubmit={handleSetPassword} className="bg-[#1A1C23] p-3 rounded-xl border border-white/5">
                <p className="text-[11px] text-gray-400 mb-3">
                  Buat satu Master Password untuk mengunci catatan Anda. 
                </p>
                
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                  placeholder="Master Password baru"
                  className={inputClass}
                  required
                />
                
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrorMsg(''); }}
                  placeholder="Konfirmasi password"
                  className={inputClass}
                  required
                />

                <input 
                  type="text"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  placeholder="Hint (opsional)"
                  className={inputClass}
                />
                
                {errorMsg && (
                  <div className="text-[#ef4444] text-[11px] mb-2 font-medium text-center">
                    {errorMsg}
                  </div>
                )}
                
                <button 
                  type="submit" 
                  className="w-full py-2 bg-[var(--accent)] text-white hover:opacity-90 rounded-lg transition-opacity text-xs font-semibold shadow-[0_0_15px_rgba(139,92,246,0.3)] mt-1"
                >
                  Buat Master Password
                </button>
              </form>
            )}
          </div>

          {/* Data & Backup Card */}
          <div className={cardClass}>
            <div className="flex gap-3 mb-3">
              <div className={`${iconBoxClass} bg-[var(--accent)]/10 text-[var(--accent)]`}>
                <Cloud size={16} />
              </div>
              <div>
                <h3 className={titleClass}>Data & Backup</h3>
                <p className={descClass}>Kelola data Anda dengan aman.</p>
              </div>
            </div>
            
            <div className="bg-[#1A1C23] p-3 rounded-xl border border-white/5">
              <div className="flex gap-3 mb-4">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[var(--accent)]/5 text-[var(--accent)]`}>
                  <Database size={14} />
                </div>
                <div>
                  <h4 className="text-[13px] font-semibold text-white/90">Backup & Pulihkan Data</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">Export cadangan atau import dari file backup.</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={onExportBackup}
                  className="flex-1 py-2 bg-[var(--accent)] text-white hover:opacity-90 rounded-xl transition-all text-xs font-semibold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                >
                  <Upload size={14} />
                  Export
                </button>
                <button 
                  onClick={async () => {
                    if (!window.electronAPI) return;
                    const filters = [{ name: 'Yannoted Backup', extensions: ['json'] }, { name: 'All Files', extensions: ['*'] }];
                    const filePath = await window.electronAPI.openFileDialog(filters);
                    if (filePath) {
                      try {
                        const content = await window.electronAPI.readFile(filePath);
                        const backupData = JSON.parse(content);
                        if (backupData.version) {
                          onInitRestore(backupData);
                          onClose();
                        } else {
                          window.electronAPI.showMessage({ type: 'error', title: 'Error', message: 'Format backup tidak valid.' });
                        }
                      } catch (err) {
                        window.electronAPI.showMessage({ type: 'error', title: 'Error', message: 'Gagal membaca file backup.' });
                      }
                    }
                  }}
                  className="flex-1 py-2 text-white bg-transparent border border-white/10 hover:bg-white/5 hover:border-white/20 rounded-xl transition-all text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <Download size={14} />
                  Restore
                </button>
              </div>
            </div>
          </div>

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
