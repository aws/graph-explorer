# Logging

Logs are, by default, sent to the console and will be visible as output to the docker logs. If you want to access the full set of logs, you can run `docker logs {container name or id}`.

The log level will be set via the `LOG_LEVEL` env variable at `/packages/graph-explorer/.env` where the possible options, from highest to lowest, are `fatal`, `error`, `warn`, `info`, `debug`, `trace`, and `silent` such that `fatal` is the highest level and will only include logs labeled as fatal and `trace` the lowest and will include any type of log. The `silent` level disables all logging.

By default, the log level is set to `info` and the only type of logs generated are those of `error`, `info`, or `debug`. If you need more detailed logs, you can change the log level from `info` in the default .env file to `debug` and the logs will begin printing the error's stack trace.

The proxy server logging is split across a few key modules:

1. `logging.ts` - Contains the `logger` instance (using pino) that is responsible for actually recording the logs.
2. `error-handler.ts` - Contains `errorHandlingMiddleware` which catches errors thrown within Express routes, logs whitelisted request headers, and sends appropriate error responses. It also contains a `handleError` function used for global error handling.
3. An endpoint called `/logger` in `node-server.ts` - This is how you would log things from the browser. It needs a log level and message header passed and you can then expect to see the message logged at the provided log level.
