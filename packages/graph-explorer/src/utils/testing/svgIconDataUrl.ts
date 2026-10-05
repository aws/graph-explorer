/** An svg icon as the uploader stores it: UTF-8 markup in a base64 data url. */
export function createSvgIconDataUrl(svg: string): string {
  const bytes = new TextEncoder().encode(svg);
  return `data:image/svg+xml;base64,${btoa(String.fromCharCode(...bytes))}`;
}
