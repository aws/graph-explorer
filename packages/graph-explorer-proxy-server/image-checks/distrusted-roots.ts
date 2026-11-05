/** A root certificate Graph Explorer images must not trust, matched by its SHA-256 fingerprint. */
export type DistrustedRoot = {
  name: string;
  /** Colon-separated uppercase hex, as `X509Certificate.fingerprint256` formats it. */
  sha256: string;
};

/**
 * Root certificates that Graph Explorer images must not trust. To add one, take
 * `sha256` from `new X509Certificate(pem).fingerprint256`.
 */
export const distrustedRoots: readonly DistrustedRoot[] = [
  {
    name: "emSign ECC Root CA - G3",
    sha256:
      "86:A1:EC:BA:08:9C:4A:8D:3B:BE:27:34:C6:12:BA:34:1D:81:3E:04:3C:F9:E8:A8:62:CD:5C:57:A3:6B:BE:6B",
  },
];
