# Development Troubleshooting

This guide covers common issues and solutions when developing with Graph
Explorer.

## Common Development Issues

- If you need more detailed logs, you can change the log level from `info` in
  the default .env file to `debug`. The logs will begin printing the error's
  stack trace.
- If Graph Explorer crashes, you can recreate the container or run `pnpm start`
- If Graph Explorer fails to start, check that the provided endpoint is properly
  spelled and that you have access to from the environment you are trying to run
  in. If you are in a different VPC, consider VPC Peering.
