# Monitoring

This guide covers monitoring capabilities, health checks, and logging
configuration for Graph Explorer.

## Health Check Status

The `graph-explorer-proxy-server` provides a `/status` endpoint for monitoring
its health and readiness. This endpoint is crucial for ensuring reliable service
operation and can be utilized in various deployment scenarios.

**Key Features:**

- **Health Check:** The `/status` endpoint serves as a basic health check,
  confirming that the Express server is running and responding. This is
  essential for load balancers (like AWS ALB) to determine if the server is
  operational and should receive traffic.
- **Readiness Probe:** It also functions as a readiness probe in container
  orchestration systems (like Kubernetes). This allows the orchestrator to know
  when the server is ready to accept requests, preventing traffic from being
  routed to instances that are still starting up or experiencing issues.
- **Expected Response:** A successful health check or readiness probe will
  result in an HTTP `200 OK` response with the body containing `OK`.

## Logging

Logs are, by default, sent to the console and will be visible as output to the
docker logs. If you want to access the full set of logs, you can run
`docker logs {container name or id}`.

The log level will be set via the `LOG_LEVEL` env variable at
`/packages/graph-explorer/.env` where the possible options, from highest to
lowest, are `error`, `warn`, `info`, `debug`, and `trace` such that `error` is
the highest level and will only include logs labeled as errors and `trace` the
lowest and will include any type of log.

By default, the log level is set to `info` and the only type of logs generated
are those of `error`, `info`, or `debug`. If you need more detailed logs, you
can change the log level from `info` in the default .env file to `debug` and the
logs will begin printing the error's stack trace.

Within node-server.js, you'll notice three things.

1. A `proxyLogger` object - This is responsible for actually recording the logs.
2. An `errorHandler` - This automatically sends errors to the `proxyLogger` and
   can log extra information by adding wanted text to the error object at a key
   called `extraInfo`.
3. An endpoint called `/logger` - This is how you would log things from the
   browser. It needs a log level and message header passed and you can then
   expect to see the message logged at the provided log level.
