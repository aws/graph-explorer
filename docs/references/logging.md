[← References](./)

# Logging

Logs are, by default, sent to the console and will be visible as output to the docker logs. If you want to access the full set of logs, you can run `docker logs {container name or id}`.

Set the log level with the [`LOG_LEVEL`](./configuration.md#log_level) environment variable. The options, from highest to lowest, are `fatal`, `error`, `warn`, `info`, `debug`, `trace`, and `silent`. Each level also logs everything above it, so `fatal` logs the least and `trace` the most. `silent` disables logging.

The default is `info`, which logs startup messages, messages the browser sends, warnings, and errors. For more detail, set it to `debug` to also log each successful request, cancelled queries, and retries. With Docker, pass `--env LOG_LEVEL=debug` to `docker run`. When running from source, add `LOG_LEVEL=debug` to `packages/graph-explorer/.env.local`.

At `debug` and `trace`, the query text sent to the database is written to the logs. Queries can contain sensitive data, so use those levels for troubleshooting and restrict access to wherever the logs are stored. On SageMaker, the logs go to a CloudWatch log group shared with the notebook. See [Logging and privacy](../guides/deploy-to-sagemaker.md#logging-and-privacy).

The proxy server logging is split across a few key modules:

1. `logging.ts` - Contains the `logger` instance (using pino) that is responsible for actually recording the logs.
2. `error-handler.ts` - Contains `errorHandlingMiddleware` which catches errors thrown within Express routes, logs whitelisted request headers, and sends appropriate error responses. It also contains a `handleError` function used for global error handling.
3. An endpoint called `/logger` in `node-server.ts` - This is how you would log things from the browser. It needs a log level and message header passed and you can then expect to see the message logged at the provided log level.
