import CryptoJS from 'crypto-js';

// PBKDF2 with random salt — much stronger than plain SHA256
export const hashPassword = (password) => {
  const salt = CryptoJS.lib.WordArray.random(128 / 8).toString();
  const hash = CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 10000,
  }).toString();
  return `${salt}:${hash}`;
};

export const verifyPassword = (input, storedHash) => {
  if (!storedHash) return false;

  // Backward compat: old SHA256 hashes don't contain ':'
  if (!storedHash.includes(':')) {
    return CryptoJS.SHA256(input).toString() === storedHash;
  }

  const [salt, hash] = storedHash.split(':');
  const inputHash = CryptoJS.PBKDF2(input, salt, {
    keySize: 256 / 32,
    iterations: 10000,
  }).toString();
  return inputHash === hash;
};

// AES encryption for note content
export const encryptContent = (plaintext, password) => {
  if (!plaintext) return '';
  return CryptoJS.AES.encrypt(plaintext, password).toString();
};

export const decryptContent = (ciphertext, password) => {
  if (!ciphertext) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, password);
    const result = bytes.toString(CryptoJS.enc.Utf8);
    return result || '';
  } catch {
    return '';
  }
};
