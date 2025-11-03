# Technology Stack & Build System

## Package Management

- **Package Manager**: pnpm (v10.18.0) - enforced via corepack
- **Workspace**: Monorepo structure with 3 packages
- **Node Version**: >=24.4.0 (use `nvm use` if available)

## Frontend Stack

- **Framework**: React 19.1.0 with TypeScript
- **Compiler**: React Compiler (eliminates need for useMemo and useCallback)
- **Build Tool**: Vite 6.3.5 with React plugin
- **Styling**: TailwindCSS (preferred) - Emotion is being phased out
- **UI Components**:
  - Radix UI primitives (radix-ui package) (preferred)
  - Custom component library
  - Mantine core components (being phased out, avoid using in new code)
- **State Management**: Jotai for atomic state
- **Data Fetching**: TanStack Query (React Query)
- **Graph Visualization**: Cytoscape.js with various layout plugins
- **Routing**: React Router v7
- **Forms**: React Hook Form with Zod validation

## Backend Stack

- **Runtime**: Node.js with Express.js 5.1.0
- **Authentication**: AWS SDK for credential providers, aws4 for signing
- **Logging**: Pino with pretty printing
- **Environment**: dotenv for configuration

## Development Tools

- **TypeScript**: v5.8.3 with project references
- **Linting**: ESLint 9 with TypeScript, React, and TanStack Query rules
- **Formatting**: Prettier with Tailwind plugin
- **Testing**: Vitest with happy-dom environment, coverage via v8
- **Git Hooks**: Husky with lint-staged for pre-commit checks

## Common Commands

### Development

```bash
# Install dependencies
pnpm install

# Start development servers (both frontend and backend)
pnpm dev

# Frontend only (http://localhost:5173)
pnpm --filter graph-explorer run dev

# Backend only
pnpm --filter graph-explorer-proxy-server run dev
```

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter graph-explorer run build
pnpm --filter graph-explorer-proxy-server run build
```

### Testing & Quality

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm coverage

# Type checking
pnpm check:types

# Linting
pnpm check:lint
pnpm lint  # with --fix

# Formatting
pnpm check:format
pnpm format  # with --write

# Run all checks
pnpm checks
```

### Production

```bash
# Start production server (proxy server)
pnpm start

# Clean build artifacts
pnpm clean

# Clean dependencies
pnpm clean:dep
```

### Dependency Management

```bash
# Add dependency to specific package
pnpm add <package> --filter <workspace-name>
pnpm add -D <package> --filter <workspace-name>

# Examples:
pnpm add react --filter graph-explorer
pnpm add -D vitest --filter graph-explorer-proxy-server
```

## Environment Variables

Key environment variables for development:

- `GRAPH_EXP_ENV_ROOT_FOLDER`: Base path for frontend (default: `/`)
- `HOST`: Public hostname for SSL certificate generation
- `GRAPH_EXP_HTTPS_CONNECTION`: Enable HTTPS (default: `true`)
- `PROXY_SERVER_HTTPS_PORT`: HTTPS port (default: `443`)
- `PROXY_SERVER_HTTP_PORT`: HTTP port (default: `80`)

## Component Development Guidelines

- Use React Compiler optimizations instead of manual `useMemo` and `useCallback`
- Prefer Tailwind CSS for styling over Emotion (which will be removed)
- Use Radix UI primitives for new components instead of Mantine
- Follow the component structure in `packages/graph-explorer/src/components/`
- Use the `cn()` utility for conditional class application
