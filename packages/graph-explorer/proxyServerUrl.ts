/**
 * The URL of the proxy server the Vite dev server forwards API requests to.
 * PROXY_SERVER_PORT wins over the deprecated PROXY_SERVER_HTTP_PORT.
 */
export function proxyServerUrl(env: Record<string, string>) {
  const proxyPort =
    Number(env.PROXY_SERVER_PORT || env.PROXY_SERVER_HTTP_PORT) || 80;
  const portSuffix = proxyPort !== 80 ? `:${proxyPort}` : "";
  return `http://localhost${portSuffix}`;
}
