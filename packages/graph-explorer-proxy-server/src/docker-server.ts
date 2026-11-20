import { runServer } from "./run-server.ts";

/** Starts the server with the Docker image's defaults: HTTPS on, and a self-signed certificate managed in cert-info. */
runServer({ image: true });
