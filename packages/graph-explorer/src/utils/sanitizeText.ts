const capitalizeFirstLetter = (text: string) => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const sanitizeText = (text?: string): string => {
  if (!text) {
    return "";
  }

  return String(text)
    .replace(/([A-Z]+)([A-Z][a-z])/gu, " $1 $2")
    .replace(/([a-z\d])([A-Z])/gu, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/^./, function (str) {
      return str.toUpperCase();
    })
    .trim()
    .toLowerCase()
    .split(" ")
    .map(capitalizeFirstLetter)
    .join(" ");
};

export default sanitizeText;
