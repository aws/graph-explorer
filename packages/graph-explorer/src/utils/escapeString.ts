export const escapeString = (text?: string): string => {
  if (!text) {
    return "";
  }

  return text.includes('"') ? JSON.stringify(text).slice(1, -1) : text;
};

export default escapeString;
