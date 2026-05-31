// Lazy access — avoids issues if module loads before preload script finishes
const getApi = () => window.electronAPI;

export const storage = {
  get: async (key) => { try { return await getApi().storeGet(key); } catch { return null; } },
  set: async (key, value) => { try { await getApi().storeSet(key, value); } catch(e) { console.error(e); } },
  delete: async (key) => { try { await getApi().storeDelete(key); } catch(e) { console.error(e); } },
};
