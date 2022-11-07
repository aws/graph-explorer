const capitalizeFirstLetter = (text: string) => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const sanitizeText = (text?: string): string => {
  if (!text) {
    return "";
  }

  return (
    String(text)
      .match(
        /[A-Z\u00C0-\u017F]{2,}(?=[A-Z\u00C0-\u017F][a-z\u00C0-\u017F]+[0-9]*|\b)|[A-Z\u00C0-\u017F]?[a-z\u00C0-\u017F]+[0-9]*|[A-Z\u00C0-\u017F]|[0-9]+/g
      )
      ?.map(capitalizeFirstLetter)
      .join(" ") || text
  );
};
