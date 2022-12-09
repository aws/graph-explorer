#!/bin/bash
pnpm pm2 start "node node-server.js"
pnpm pm2 start "serve dist"

exec sh