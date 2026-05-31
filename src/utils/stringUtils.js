export const stripHtml = (html) => {
  if (!html) return '';
  // Replace HTML tags with spaces and normalize whitespace
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
};
