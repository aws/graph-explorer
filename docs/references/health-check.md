# Health Check Status

The `graph-explorer-proxy-server` provides a `/status` endpoint for monitoring its health and readiness. This endpoint is crucial for ensuring reliable service operation and can be utilized in various deployment scenarios.

**Key Features:**

- **Health Check:** The `/status` endpoint serves as a basic health check, confirming that the Express server is running and responding. This is essential for load balancers (like AWS ALB) to determine if the server is operational and should receive traffic.
- **Readiness Probe:** It also functions as a readiness probe in container orchestration systems (like Kubernetes). This allows the orchestrator to know when the server is ready to accept requests, preventing traffic from being routed to instances that are still starting up or experiencing issues.
- **Expected Response:** A successful health check or readiness probe will result in an HTTP `200 OK` response with the body containing `OK`.
