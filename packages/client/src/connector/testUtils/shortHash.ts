/**
 * This is a non-secure hash function.
 * Its purpose is to compute derterministic
 * id from the given content
 */
export const shortHash = (s: string) => {
  let result = 0;
  for (let i = 0; i < s.length; i++) {
    result =
      ((Math.imul(31, result) + s.charCodeAt(i)) | 0) % Number.MAX_SAFE_INTEGER;
  }

  return Math.abs(result).toString(16);
};
