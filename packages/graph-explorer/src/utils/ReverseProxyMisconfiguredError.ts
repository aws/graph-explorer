import { STATIC_MOUNT_PATH } from "@shared/constants";

/**
 * Thrown when the document's own path has segments but none of them is the
 * `STATIC_MOUNT_PATH` static mount, so there is no way to know where the API
 * root is. A reverse proxy that renames the mount away — for example mapping
 * an external `/gx/` onto the server's `/explorer/` — produces exactly this
 * shape. Falling back to the document root instead would send every
 * database request, connection URL and query text included, to the wrong
 * place on the origin.
 */
export class ReverseProxyMisconfiguredError extends Error {
  constructor(pathname: string) {
    super(
      `Graph Explorer is served at "${pathname}", which has no "${STATIC_MOUNT_PATH}" path segment. The reverse proxy in front of Graph Explorer must preserve the final "${STATIC_MOUNT_PATH}" segment of the path it forwards, for example rewriting an external "/gx/" prefix to "/gx${STATIC_MOUNT_PATH}/" before proxying to the server, rather than mapping "/gx/" directly onto the server's "${STATIC_MOUNT_PATH}/".`,
    );
    this.name = "ReverseProxyMisconfiguredError";
    Object.setPrototypeOf(this, ReverseProxyMisconfiguredError.prototype);
  }
}
