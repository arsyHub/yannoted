export const generateNoteName = (existingNotes) => {
  const noteNumbers = existingNotes
    .map(n => {
      const match = n.name.match(/^Note (\d+)$/i);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => n > 0);
  
  const nextNum = noteNumbers.length > 0 ? Math.max(...noteNumbers) + 1 : 1;
  return `Note ${nextNum}`;
};
