// Runs inside a Graph Explorer image with the image's own node. It is
// bind-mounted rather than built into the image, so the audit can check images
// published before this list changed.
import path from "path";
import tls from "tls";

import { distrustedRoots } from "./distrusted-roots.ts";
import {
  checkTrustStore,
  parseCertificates,
  readPemDirectory,
  readPemFile,
} from "./trust-store.ts";

const pemDirectory =
  process.env.TRUST_STORE_PEM_DIR || "/etc/pki/ca-trust/extracted/pem";

const { lines, passed } = checkTrustStore(
  [
    readPemFile(path.join(pemDirectory, "tls-ca-bundle.pem")),
    readPemDirectory(path.join(pemDirectory, "directory-hash")),
    parseCertificates("tls.rootCertificates", tls.rootCertificates),
  ],
  distrustedRoots,
);

process.stdout.write(lines.map(line => `${line}\n`).join(""));
if (!passed) {
  process.exitCode = 1;
}
