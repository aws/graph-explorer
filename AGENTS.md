# Agent Rules

## Core Rules

- Keep conversations concise. Sacrifice grammar for brevity.
- Use TypeScript for type safety
- Prefer descriptive variable and function names over code comments
- Prefer simple to follow logic over clever concise code
- Prefer named function syntax over anonymous arrow functions for module-level
  declarations (e.g., `function handleClick() {}` over
  `const handleClick = () => {}`). Arrow functions within function scope are
  fine.
- Every commit should have no type errors, lint errors, or failing tests
- When possible, create failing tests first then implement the logic to make the
  tests pass
- Add or update tests for the code you change, even if nobody asked

### React Rules

- Prefer functional components with hooks over class components
- Keep components small, focused on single responsibility
- Avoid prop drilling - use context or state management
- Follow principle of least privilege for component props

### Tailwind Rules

- Use Tailwind v4 CSS syntax
- The `tailwind.config.ts` file remains for legacy reasons

## Project Commands

- This project uses `pnpm` only, never use `npm`
- All commands should be run from the root of the project repository
- Assume dev server is always running

### Development

- `pnpm dev` - Start dev servers
- `pnpm build` - Build production artifacts
- `pnpm start` - Start production server

### Quality Checks

- `pnpm checks` - Run checks for linting, types, and formatting in parallel
- `pnpm check:types` - Check for TypeScript type errors
- `pnpm check:lint` - Check for lint errors
- `pnpm check:format` - Check for formatting errors
- `pnpm lint` - Fix any fixable linting errors
- `pnpm lint <path-to-file>` - Fix any fixable linting errors for a specific
  file
- `pnpm format` - Format all files

### Testing

- `pnpm test` - Run all tests
- `pnpm test <path-to-file>` - Run tests for specific file
- `pnpm coverage` - Check test coverage

### Git

- `git --no-pager` - Disable pager for git commands

### Dependency Management

Add dependency to specific workspace

```bash
pnpm add <package> --filter <workspace-name>
pnpm add -D <package> --filter <workspace-name>
```

## Project Structure

### Monorepo Architecture

```
graph-explorer/
├── packages/
│   ├── graph-explorer/           # React frontend application
│   ├── graph-explorer-proxy-server/  # Express.js backend server
│   └── shared/                   # Shared types and utilities
├── additionaldocs/               # Documentation
├── samples/                      # Deployment examples
└── [root config files]           # Workspace-level configuration
```

### Frontend (`packages/graph-explorer/`)

```
src/
├── @types/                       # TypeScript type definitions
├── components/                   # Reusable UI components
├── connector/                    # Database connection logic by query language
├── core/                         # Core application logic and providers
├── hooks/                        # Custom React hooks
├── modules/                      # Feature-specific modules
├── routes/                       # Route definitions
├── utils/                        # Utility functions
└── App.tsx                       # Root component
```

### Backend (`packages/graph-explorer-proxy-server/`)

```
src/
├── node-server.ts                # Main Express server
├── env.ts                        # Environment configuration
├── logging.ts                    # Pino logger setup
├── error-handler.ts              # Error handling middleware
└── paths.ts                      # Route path utilities
```

## Environment Variables

- `GRAPH_EXP_ENV_ROOT_FOLDER`: Base path for frontend (default: `/`)
- `HOST`: Public hostname for SSL certificate generation
- `GRAPH_EXP_HTTPS_CONNECTION`: Enable HTTPS (default: `true`)
- `PROXY_SERVER_HTTPS_PORT`: HTTPS port (default: `443`)
- `PROXY_SERVER_HTTP_PORT`: HTTP port (default: `80`)

## Technology Stack

### Frontend (graph-explorer)

- React 19 + TypeScript
- React Compiler (no manual useMemo/useCallback needed)
- Vite build tool
- TailwindCSS + Radix UI components
- React Router for routing
- Cytoscape.js for graph visualization
- TanStack Query (formerly called React Query) for data fetching
- Jotai for state management
- LocalForage for persistent app state
- React Hook Form + Zod validation

### Backend (proxy-server)

- Node.js + Express + TypeScript
- AWS SDK for Neptune integration
- Pino for logging
- CORS, compression middleware
- AWS4 for request signing
- dotenv for environment variables
- No database or state

### Shared Tools

- pnpm workspace
- Vitest for testing
- ESLint + Prettier
- TypeScript strict mode

### Deployment

- Docker Compose for local development
- Support for several deployment strategies
  - AWS ECS/Fargate/EC2
  - AWS Neptune Notebook
  - Node.js

### Testing

See `.kiro/steering/testing.md` for testing patterns and examples.
