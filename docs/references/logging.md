[← References](./)

# Logging

Logs are, by default, sent to the console and will be visible as output to the docker logs. If you want to access the full set of logs, you can run `docker logs {container name or id}`.

Set the log level with the [`LOG_LEVEL`](./configuration.md#log_level) environment variable. The options, from highest to lowest, are `fatal`, `error`, `warn`, `info`, `debug`, `trace`, and `silent`. Each level also logs everything above it, so `fatal` logs the least and `trace` the most. `silent` disables logging.

The default is `info`, which logs startup messages, messages the browser sends, warnings, and errors. For more detail, set it to `debug` to also log each successful request, cancelled queries, and retries. With Docker, pass `--env LOG_LEVEL=debug` to `docker run`. When running from source, add `LOG_LEVEL=debug` to `.env.local` in your configuration folder, which is `packages/graph-explorer` unless you set [`CONFIGURATION_FOLDER_PATH`](./configuration.md#configuration_folder_path).

At `debug` and `trace`, when **Enable database query logging on proxy server** is turned on in **Settings** > **General**, the query text sent to the database is written to the logs. The setting is off by default. Queries can contain sensitive data, so use those levels for troubleshooting and restrict access to wherever the logs are stored. On SageMaker, the logs go to a CloudWatch log group shared with the notebook. See [Logging and privacy](../guides/deploy-to-sagemaker.md#logging-and-privacy).

The proxy server logging is split across a few key modules:

1. `logging.ts` - Contains the `logger` instance (using pino) that is responsible for actually recording the logs.
2. `error-handler.ts` - Contains `errorHandlingMiddleware` which catches errors thrown within Express routes, logs allowlisted request headers, and sends appropriate error responses. It also contains a `handleError` function used for global error handling.
3. The `/logger` endpoint in `app.ts` - This is how the browser logs to the server. It takes a `POST` with a JSON body of `level` and `message`, where `level` is one of `error`, `warn`, `info`, `debug`, or `trace` and `message` is up to 10,000 characters. The request must send `Content-Type: application/json`, and any other content type gets a 415. The server logs the entry at that level with the fixed message `client log`, and puts the browser's text in a `clientLog` field next to `source: "client"`. That keeps a multi-line message in one log entry. The route no longer reads the `level` and `message` headers, so a header-only request gets a 400. The rate limit is in [Client logs](./security.md#reference-for-access-control-layers).
