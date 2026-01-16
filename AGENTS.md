# Agent Rules

## Core Rules

- Keep conversations concise. Sacrifice grammar for brevity.
- Use TypeScript for type safety
- Prefer descriptive variable and function names over code comments
- Prefer simple to follow logic over clever concise code
- Prefer named function syntax over anonymous arrow functions for top-level
  declarations (e.g., `function handleClick() {}` over
  `const handleClick = () => {}`)

### React Rules

- Prefer functional components with hooks over class components
- Keep components small, focused on single responsibility
- Avoid prop drilling - use context or state management
- Follow principle of least privilege for component props

## Project Commands

- All commands should be run from the root of the project repository

### Development

- `pnpm dev` - Start dev servers
- `pnpm build` - Build production artifacts
- `pnpm start` - Start production server

### Quality Checks

- `pnpm lint` - Fix linting issues
- `pnpm check:lint` - Check linting only
- `pnpm format` - Format code
- `pnpm check:format` - Check formatting only
- `pnpm check:types` - Type checking
- `pnpm checks` - Run all checks

### Testing

- `pnpm test` - Run tests
- `pnpm test:watch` - Watch mode
- `pnpm coverage` - Test coverage
- `pnpm vitest --run <path-to-file>` - Run tests for specific file

### Maintenance

- `pnpm clean` - Clean build artifacts
- `pnpm clean:dep` - Remove node_modules

### Git

- `git --no-pager` - Disable pager for git commands

### Dependency Management

Add dependency to specific package

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
├── utils/                        # Utility functions
├── workspaces/                   # Main application views/pages
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
- Vite build tool
- TailwindCSS + Radix UI components
- React Router for routing
- Cytoscape.js for graph visualization
- React Query for data fetching
- Jotai for state management
- React Hook Form + Zod validation
- LocalForage for persistent app state
- React Compiler (no manual useMemo/useCallback needed)

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

### Import Sorting

Imports are sorted using eslint-plugin-perfectionist with natural sorting order.
Run `pnpm lint` to auto-fix import order issues, or lint individual files with:

```bash
pnpm eslint --fix <path-to-file>
```

### Deployment

- Docker Compose for local development
- Support for several deployment strategies
  - AWS ECS/Fargate/EC2
  - AWS Neptune Notebook
  - Node.js

### Testing

See `.kiro/steering/testing.md` for testing patterns and examples.

### Branded Types

The project uses branded types from `@/utils` for type safety. These prevent
accidental mixing of similar types at compile time.

| Type               | Creator Function             | Location                                |
| ------------------ | ---------------------------- | --------------------------------------- |
| `VertexId`         | `createVertexId()`           | `@/core/entities/vertex`                |
| `VertexType`       | `createVertexType()`         | `@/core/entities/vertex`                |
| `EdgeId`           | `createEdgeId()`             | `@/core/entities/edge`                  |
| `EdgeType`         | `createEdgeType()`           | `@/core/entities/edge`                  |
| `ConfigurationId`  | `createNewConfigurationId()` | `@/core/ConfigurationProvider/types`    |
| `RenderedVertexId` | `toRenderedVertexId()`       | `@/core/StateProvider/renderedEntities` |
| `RenderedEdgeId`   | `toRenderedEdgeId()`         | `@/core/StateProvider/renderedEntities` |

Always use the appropriate branded type instead of `string` when working with
these identifiers.

### Database Queries

- Use the `query` template tag from `@/utils` for all query strings (Gremlin,
  openCypher, SPARQL) to ensure consistent formatting
- For Gremlin queries, use `escapeString()` from `@/utils` to escape special
  characters in string literals
