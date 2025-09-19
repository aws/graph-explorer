---
inclusion: always
---

# Project Structure & Organization

## Monorepo Architecture

The project follows a monorepo structure with three main packages:

```
graph-explorer/
├── packages/
│   ├── graph-explorer/           # React frontend application
│   ├── graph-explorer-proxy-server/  # Express.js backend server
│   └── shared/                   # Shared types and utilities
├── docs/                        # Documentation
├── samples/                      # Example configurations
└── [root config files]           # Workspace-level configuration
```

## Package Structure

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

## Code Organization Patterns

### Component Structure

- Components are organized in PascalCase folders with index exports
- Each component should be focused on a single responsibility
- Complex components should be broken down into smaller subcomponents
- Components should use Tailwind for styling via the `cn()` utility
- New components should use Radix UI primitives instead of Mantine components

### Feature Modules

- Feature modules in `src/modules/` contain all related components, hooks, and
  utilities
- Each module exports its public API through an index file
- Modules should be self-contained with minimal dependencies on other modules

### Connector Pattern

- Database connectors are separated by query language (gremlin, openCypher,
  sparql)
- Common interfaces are defined in `src/connector/index.ts`
- Each connector implements the same interface for consistent API

### Explorer Pattern

- "Explorers" abstract querying databases with different query languages
- Each explorer provides a unified interface for a specific query language
- Located in `src/connector/[query-language]/explorer/`
- Explorers handle query construction, execution, and result transformation
- They shield the application from query language specifics while providing
  consistent data structures

## Naming & File Conventions

- **React Components**: PascalCase (e.g., `GraphViewer.tsx`)
- **Component Folders**: PascalCase with index exports
- **Hooks**: camelCase with `use` prefix (e.g., `useGraphData.ts`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Test Files**: Same name as source with `.test.ts` suffix
- **Type Definitions**: Use TypeScript interfaces or types with descriptive
  names

## Styling Guidelines

- Use Tailwind utility classes as primary styling method
- Use `cn()` helper for conditional class application
- Global styles are in `src/index.css`
- Avoid direct CSS/SCSS files except for global styles
- Emotion CSS-in-JS is being phased out (deprecated)

## Component Library Evolution

- The project is transitioning away from Mantine components
- New components should be built as custom components using:
  - Radix UI primitives as the unstyled foundation
  - Tailwind for styling instead of Mantine's built-in styles
  - Located in `src/components/` with consistent naming and structure
- When replacing Mantine components:
  - Maintain the same API where possible for easier migration
  - Document any API differences in component comments
  - Ensure accessibility features are preserved or enhanced

## Testing Approach

- Tests are co-located with source files (`*.test.ts` or `*.test.tsx`)
- Test utilities are in `src/utils/testing/` or `src/connector/testUtils/`
- Use Vitest for unit and integration tests
- Mock external dependencies and focus on component behavior

## Key Architectural Patterns

- **State Management**: Use Jotai atoms for global state
- **Data Fetching**: Use TanStack Query for remote data
- **Graph Rendering**: Cytoscape.js with custom layout plugins
- **Query Abstraction**: Explorers that provide unified interfaces for different
  query languages
- **Configuration**: Environment variables and configuration providers
- **Error Handling**: Error boundaries and consistent error display components
- **State Persistence**: localforage for client-side persistence using IndexedDB

## Data Storage & Persistence

- **Client-Side Only**: Graph Explorer stores all user data and preferences
  client-side
- **No Server Storage**: The backend proxy server does not store any user data
- **IndexedDB**: Used as the primary storage mechanism via localforage
- **Persistence Scope**:
  - User preferences and settings
  - Connection configurations
  - Query history
  - Visualization settings
  - Layout preferences
- **External Data**: Graph data is queried directly from the connected graph
  databases and is not owned or persisted by Graph Explorer

## Best Practices

- Prefer functional components with hooks over class components
- Use TypeScript for type safety throughout the codebase
- Keep components small and focused on a single responsibility
- Avoid prop drilling by using context or state management
- Follow the principle of least privilege for component props
- Use localforage for any persistent state that should survive page refreshes
