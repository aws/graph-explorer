export const escapeString = (text?: string): string => {
  if (!text) {
    return "";
  }

  console.log(text, text.includes('"') ? JSON.stringify(text).slice(1, -1) : text);

  return text.includes('"') ? JSON.stringify(text).slice(1, -1) : text;
};

export default escapeString;
