#!/usr/bin/env bash
# Pulls an image into the local docker daemon. ECR Public rejects anonymous
# pulls once its data limit is hit, which docker reports as toomanyrequests
# or HTTP 429. Only that error is retried, with backoff. Any other error
# fails at once.
set -uo pipefail

image=$1
attempts=5
delay=10

for ((attempt = 1; ; attempt++)); do
  output=$(docker pull "$image" 2>&1)
  status=$?
  echo "$output"
  if ((status == 0)); then
    exit 0
  fi
  if ! grep -qiE 'toomanyrequests|429 Too Many Requests' <<<"$output"; then
    exit "$status"
  fi
  if ((attempt == attempts)); then
    echo "Still rate limited after $attempts attempts." >&2
    exit "$status"
  fi
  echo "Rate limited, retrying in ${delay}s." >&2
  sleep "$delay"
  delay=$((delay * 2))
done
