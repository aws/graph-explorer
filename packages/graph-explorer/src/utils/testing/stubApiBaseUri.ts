const defaultBaseUri = "http://localhost/explorer/";

/**
 * Sets the document base URI that `apiUrl` resolves relative API paths against.
 */
export function stubApiBaseUri(href: string = defaultBaseUri) {
  document.head.innerHTML = `<base href="${href}" />`;
}
