import fs from "fs";
import os from "os";
import path from "path";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";

import { setUpImageCertificates } from "./run-server.ts";
import { loadStartup } from "./startup-config.ts";

describe("setUpImageCertificates", () => {
  let workDir: string;
  let markerPath: string;
  const logger = { info: vi.fn(), warn: vi.fn() };
  const generate = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), "ge-image-certificates-"));
    markerPath = path.join(workDir, ".container-started");
  });

  afterEach(() => {
    fs.chmodSync(workDir, 0o755);
    fs.rmSync(workDir, { recursive: true, force: true });
  });

  /**
   * Makes the marker's folder read-only, as in a read-only container or for a
   * user who doesn't own the image's files.
   */
  function makeMarkerFolderReadOnly() {
    fs.chmodSync(workDir, 0o555);
  }

  it("records the start of a container without a certificate, warning about nothing", () => {
    const outcome = setUpImageCertificates(
      { setUpCertificates: false, certificateHost: "localhost" },
      { markerPath, certDir: workDir, generate, logger },
    );

    expect(outcome).toBe("skipped");
    expect(fs.existsSync(markerPath)).toBe(true);
    expect(logger.warn).not.toHaveBeenCalled();
    expect(generate).not.toHaveBeenCalled();
  });

  it("warns about nothing when it can't record the start of a container without a certificate", ({
    skip,
  }) => {
    // Root ignores file permissions, so chmod can't make anything read-only.
    skip(process.getuid?.() === 0);
    makeMarkerFolderReadOnly();

    setUpImageCertificates(
      { setUpCertificates: false, certificateHost: "localhost" },
      { markerPath, certDir: workDir, generate, logger },
    );

    expect(fs.existsSync(markerPath)).toBe(false);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("warns that a restart generates a new certificate when it can't record the start", ({
    skip,
  }) => {
    // Root ignores file permissions, so chmod can't make anything read-only.
    skip(process.getuid?.() === 0);
    makeMarkerFolderReadOnly();

    const outcome = setUpImageCertificates(
      { setUpCertificates: true, certificateHost: "localhost" },
      { markerPath, certDir: workDir, generate, logger },
    );

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        `Couldn't record this container's start at ${markerPath}, so a restart generates a new certificate`,
      ),
    );
    expect(outcome).toBe("generated");
    expect(generate).toHaveBeenCalledWith(workDir, "localhost");
  });

  it("sets up no certificate when a container that started on HTTP restarts with HTTPS on, as earlier versions did", () => {
    const configPath = path.join(workDir, "config");
    fs.mkdirSync(configPath);
    const configJsonPath = path.join(workDir, "config.json");
    /** Starts the image as `runServer` does, with config.json setting HTTPS. */
    function start(https: boolean) {
      fs.writeFileSync(
        configJsonPath,
        JSON.stringify({ PROXY_SERVER_HTTPS_CONNECTION: https }),
      );
      const { startup } = loadStartup({
        processEnv: { HOST: "localhost" },
        configPath,
        configJsonPath,
        image: true,
        startedBefore: fs.existsSync(markerPath),
      });
      return setUpImageCertificates(startup, {
        markerPath,
        certDir: workDir,
        generate,
        logger,
      });
    }

    start(false);
    const restart = start(true);

    // The server then stops on the missing certificate files.
    expect(restart).toBe("skipped");
    expect(generate).not.toHaveBeenCalled();
  });
});
