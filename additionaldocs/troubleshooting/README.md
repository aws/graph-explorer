# Troubleshooting

This section contains workarounds for common issues and information on how to
diagnose problems with Graph Explorer.

## Files in this section

1. [Docker Issues](docker-issues.md) - Container startup, ports, and HTTPS
   certificate issues
2. [Schema Sync](schema-sync.md) - Schema synchronization failures and
   connection problems
3. [Backup and Restore](backup-restore.md) - Backing up and restoring Graph
   Explorer configuration
4. [SageMaker Logs](sagemaker-logs.md) - Gathering logs when running on Amazon
   SageMaker

## General Troubleshooting Tips

- Use your browser's Developer Tools to monitor console errors and network
  requests
- Check container logs with `docker logs graph-explorer` for Docker deployments
- Verify network connectivity between Graph Explorer and your graph database
- Ensure proper IAM permissions when using AWS services

## Getting Help

If you encounter issues not covered in these guides, please:

1. Check the [GitHub Issues](https://github.com/aws/graph-explorer/issues) for
   similar problems
2. [File a new issue](https://github.com/aws/graph-explorer/issues/new/choose)
   with detailed information about your setup and the problem
